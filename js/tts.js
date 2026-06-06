/* ============================================================
   Loona TTS 子系统（从 engine.js 抽出，window.LoonaTTS）
   职责：一句口播怎么决定走「预渲染百炼音频」还是「浏览器合成/估时兜底」、
         怎么播、怎么在暂停/续/取消时打断、pace/语速怎么映射 rate、manifest 查找。
   不管：字幕显隐、播放推进时序、事件解析（仍在 engine）。
   host 钩子（engine 提供，保证时序一处不变）：
     host.speed                  当前调速倍率
     host._paused                是否暂停态（构造朗读时若已暂停则挂起等 resume）
     host._sleep(ms)             可暂停/可取消的 sleep（估时兜底用）
     host._on/_off(k,f)          事件总线：'cancel' | 'pause' | 'resume'
     host._setSubtitle(text,show) 显字幕（speak 入口调）
     host._subtitleSpeaking(bool) caret 显隐（念完/取消时关）
   ============================================================ */
(function (global) {
  'use strict';

  function TTS(host) {
    this._host = host;
    this.enabled = true;
    this._synth = null;
    this._voice = null;
    this._initSynth();
  }

  TTS.prototype._initSynth = function () {
    var self = this;
    this._synth = global.speechSynthesis || null;
    this._voice = null;
    if (!this._synth) return;
    function pick() {
      var vs = self._synth.getVoices() || [];
      var zh = vs.filter(function (v) { return /zh|cmn|Chinese/i.test(v.lang + ' ' + v.name); });
      self._voice = zh[0] || vs[0] || null;
    }
    pick();
    if (this._synth.onvoiceschanged !== undefined) this._synth.onvoiceschanged = pick;
  };

  /* 开关：对应原 setTTS。关时取消当前合成。 */
  TTS.prototype.setEnabled = function (on) {
    this.enabled = !!on;
    if (!on && this._synth) try { this._synth.cancel(); } catch (e) {}
  };

  /* 暂停浏览器合成（对应原 pause 里的 synth.pause）。 */
  TTS.prototype.pause = function () {
    if (this._synth) try { this._synth.pause(); } catch (e) {}
  };

  /* 取消当前播放/合成（对应原 _cancel/_softReset 里的 synth.cancel）。 */
  TTS.prototype.cancel = function () {
    if (this._synth) try { this._synth.cancel(); } catch (e) {}
  };

  /* 文案 → 稳定 id（djb2，与离线生成脚本 tools/gen_tts.mjs 同算法）→ 命中预渲染百炼 mp3 */
  TTS.prototype._ttsId = function (s) { var h = 5381, i = (s || '').length; while (i) h = (h * 33) ^ s.charCodeAt(--i); return (h >>> 0).toString(16); };
  TTS.prototype._ttsFile = function (text) { var m = global.LOONA_TTS; return (m && text) ? (m[this._ttsId(text)] || null) : null; };

  /* 念一句：显字幕 → 命中预渲染音频走音频，否则回落合成/估时兜底。返回 Promise<'ok'|'cancel'>。 */
  TTS.prototype.speak = function (text, opts) {
    this._host._setSubtitle(text, true);
    // 预渲染百炼 mp3（assets/tts/manifest.js → window.LOONA_TTS）优先；缺则回落浏览器合成/估时
    if (this.enabled && text) { var url = this._ttsFile(text); if (url) return this._speakAudio(text, opts, url); }
    return this._speakSynth(text, opts);
  };

  /* 播放预渲染百炼音频：可暂停/续/取消/调速；加载或解码失败 → 回落 _speakSynth */
  TTS.prototype._speakAudio = function (text, opts, url) {
    var self = this, host = this._host;
    return new Promise(function (resolve) {
      var done = false, audio;
      function clean() { host._off('cancel', onCancel); host._off('pause', onPause); host._off('resume', onResume); }
      function fin(r) { if (done) return; done = true; clean(); host._subtitleSpeaking(false); try { audio && audio.pause(); } catch (e) {} resolve(r || 'ok'); }
      function fallback() { if (done) return; done = true; clean(); try { audio && audio.pause(); } catch (e) {} self._speakSynth(text, opts).then(function (r) { resolve(r); }); }
      function onCancel() { fin('cancel'); }
      function onPause() { try { audio && audio.pause(); } catch (e) {} }
      function onResume() { if (!done && audio) try { audio.play(); } catch (e) {} }
      try { audio = new Audio(url); } catch (e) { fallback(); return; }
      audio.playbackRate = Math.min(2.5, Math.max(0.6, host.speed));
      audio.onended = function () { fin('ok'); };
      audio.onerror = function () { fallback(); };
      host._on('cancel', onCancel); host._on('pause', onPause); host._on('resume', onResume);
      if (host._paused) return;                 // 暂停态：等 resume 再播
      var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {});   // 自动播放被拦截：等手势/resume
    });
  };

  TTS.prototype._speakSynth = function (text, opts) {
    var self = this, host = this._host;
    // 无 TTS / 无 synth / 空文本：估时兜底，节奏完全交给 pause-aware 的 _sleep（暂停即冻结、继续即续，原生支持）
    if (!this.enabled || !this._synth || !text) {
      return host._sleep(Math.max(650, text ? text.length * 145 : 0)).then(function (r) { host._subtitleSpeaking(false); return r; });
    }

    // 有 TTS：朗读做成可暂停/可续。
    //  · 暂停 = 取消当前朗读（synth.cancel 比 synth.pause 可靠得多）+ 冻结(promise 不 resolve)，兜底 guard 一并停。
    //  · 继续 = 从这句重念。
    //  · stale-utterance 守卫：暂停时取消触发的 onend 不会误结束（curU 失配 / paused）。
    return new Promise(function (resolve) {
      var done = false, paused = false, guard = null, curU = null;
      function clearGuard() { if (guard) { clearTimeout(guard); guard = null; } }
      function fin(r) {
        if (done) return; done = true; clearGuard(); curU = null;
        host._off('cancel', onCancel); host._off('pause', onPause); host._off('resume', onResume);
        host._subtitleSpeaking(false); resolve(r || 'ok');
      }
      function onCancel() { try { self._synth.cancel(); } catch (e) {} fin('cancel'); }
      function onPause() { if (done) return; paused = true; clearGuard(); curU = null; try { self._synth.cancel(); } catch (e) {} }
      function onResume() { if (done || !paused) return; paused = false; speak(); }
      function armGuard() { clearGuard(); guard = setTimeout(function () { if (!paused && !done) fin('ok'); }, (Math.max(1600, text.length * 230)) / host.speed + 1800); }
      function speak() {
        var u = new SpeechSynthesisUtterance(text); curU = u;
        if (self._voice) u.voice = self._voice;
        u.lang = 'zh-CN'; u.rate = Math.min(1.9, Math.max(0.6, 0.98 * host.speed)); u.pitch = 1.02;
        u.onend = function () { if (!paused && u === curU) fin('ok'); };       // 暂停态/旧 utterance 的 onend 不结束
        u.onerror = function () { if (!paused && u === curU) fin('ok'); };
        try { self._synth.cancel(); self._synth.speak(u); armGuard(); }
        catch (e) { host._sleep(Math.max(650, text.length * 145)).then(function (r) { if (!paused) fin(r); }); }
      }
      host._on('cancel', onCancel); host._on('pause', onPause); host._on('resume', onResume);
      if (host._paused) { paused = true; return; }   // 已是暂停态：等 resume 再念
      speak();
    });
  };

  global.LoonaTTS = {
    create: function (host) { return new TTS(host); }
  };
})(window);
