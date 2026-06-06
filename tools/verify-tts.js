/* TTS 抽取静态自证：stub 最小 window，加载 manifest + tts.js，断言 API/映射/分支。
   无浏览器，尽量在 node 里覆盖能覆盖的：存在性、可调用、pace/speed→rate 映射、音频 vs 合成分支选择。
   跑法：node tools/verify-tts.js  →  EXIT 0 全过，非 0 失败。 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.resolve(__dirname, '..');
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }

var fails = [];
function assert(cond, msg) { if (!cond) fails.push(msg); else console.log('  ok  ' + msg); }

/* ---- 最小 window stub ---- */
// 记录构造出的 Audio / Utterance，便于断言分支
var audioCreated = [], synthSpoke = [], synthCancels = 0;

function FakeAudio(url) {
  this.url = url; this.playbackRate = 1;
  this.onended = null; this.onerror = null;
  audioCreated.push(this);
  var self = this;
  // play 返回带 catch 的 thenable（模拟浏览器 Promise）
  this.play = function () { return { catch: function () {} }; };
  this.pause = function () {};
  // 不自动触发 onended：speak 返回的 Promise 在 node 里保持 pending 即可（断言不依赖它 resolve）
  void self;
}

function FakeUtterance(text) { this.text = text; this.lang = ''; this.rate = 1; this.pitch = 1; this.voice = null; this.onend = null; this.onerror = null; synthSpoke.push(this); }

var fakeSynth = {
  getVoices: function () { return [{ lang: 'zh-CN', name: 'Tingting' }, { lang: 'en-US', name: 'Alex' }]; },
  onvoiceschanged: null,
  speak: function () {},
  cancel: function () { synthCancels++; },
  pause: function () {}
};

var win = {
  speechSynthesis: fakeSynth,
  Audio: FakeAudio,
  SpeechSynthesisUtterance: FakeUtterance,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
win.window = win;

var sandbox = {
  window: win,
  speechSynthesis: fakeSynth,
  Audio: FakeAudio,
  SpeechSynthesisUtterance: FakeUtterance,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  console: console
};
vm.createContext(sandbox);

// 1) 加载 manifest（定义 window.LOONA_TTS）
vm.runInContext(read('assets/tts/manifest.js'), sandbox, { filename: 'manifest.js' });
assert(win.LOONA_TTS && typeof win.LOONA_TTS === 'object', 'manifest 定义了 window.LOONA_TTS');

// 2) 加载 tts.js（定义 window.LoonaTTS）
vm.runInContext(read('js/tts.js'), sandbox, { filename: 'tts.js' });
assert(win.LoonaTTS && typeof win.LoonaTTS.create === 'function', 'tts.js 定义了 window.LoonaTTS.create');

/* ---- 最小 host（模拟 engine 的钩子） ---- */
function makeHost(speed) {
  return {
    speed: speed || 1,
    _paused: false,
    _bus: {},
    _on: function (k, f) { (this._bus[k] = this._bus[k] || []).push(f); },
    _off: function (k, f) { var a = this._bus[k]; if (a) { var i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } },
    _emit: function (k) { (this._bus[k] || []).slice().forEach(function (f) { try { f(); } catch (e) {} }); },
    _sleep: function () { return Promise.resolve('ok'); },
    _setSubtitle: function (t, s) { this._lastSub = { t: t, s: s }; },
    _subtitleSpeaking: function (b) { this._caret = b; }
  };
}

// 3) create / 基本 API 存在且可调用
var host = makeHost(1);
var tts = win.LoonaTTS.create(host);
assert(tts && typeof tts.speak === 'function', 'create() 返回带 speak 的实例');
assert(typeof tts.cancel === 'function', '实例有 cancel()');
assert(typeof tts.setEnabled === 'function', '实例有 setEnabled()');
assert(typeof tts.pause === 'function', '实例有 pause()');
assert(tts.enabled === true, '默认 enabled=true');
assert(tts._voice && /zh/i.test(tts._voice.lang), '_initSynth 挑了中文 voice');

// setEnabled / cancel 不报错
(function () {
  var c0 = synthCancels;
  tts.setEnabled(false); assert(tts.enabled === false, 'setEnabled(false) 生效');
  assert(synthCancels === c0 + 1, 'setEnabled(false) 触发一次 synth.cancel');
  tts.setEnabled(true); assert(synthCancels === c0 + 1, 'setEnabled(true) 不再 cancel');
  tts.cancel(); assert(synthCancels === c0 + 2, 'cancel() 触发 synth.cancel');
  tts.pause();  // 不报错即可
  assert(true, 'pause() 可调用不报错');
})();

// 4) _ttsId djb2 与映射：从 manifest 反查一条已知文案不可得（manifest 只有 id→file）。
//    改为：构造一个 hash 命中的假 manifest 验证 _ttsFile 命中逻辑，再验证真 manifest 未命中回落。
(function () {
  // 用真实算法对任意文本算 id，塞进 manifest，验证 _ttsFile 能查到
  var probe = 'XYZ_PROBE_文本_验证';
  var id = tts._ttsId(probe);
  assert(typeof id === 'string' && id.length > 0, '_ttsId 返回非空字符串 id');
  var saved = win.LOONA_TTS[id];
  win.LOONA_TTS[id] = 'assets/tts/_probe.wav';
  assert(tts._ttsFile(probe) === 'assets/tts/_probe.wav', '_ttsFile 命中 manifest 返回 url');
  assert(tts._ttsFile('一定不在清单里的随机文本_' + Math.random()) === null, '_ttsFile 未命中返回 null');
  if (saved === undefined) delete win.LOONA_TTS[id]; else win.LOONA_TTS[id] = saved;
})();

// 5) 分支：命中 manifest → 走音频（new Audio）；未命中 → 走合成（new Utterance）
(function () {
  tts.setEnabled(true);
  var probe = 'AUDIO_BRANCH_文本';
  var id = tts._ttsId(probe);
  win.LOONA_TTS[id] = 'assets/tts/_branch.wav';
  var a0 = audioCreated.length, u0 = synthSpoke.length;
  tts.speak(probe, {});   // 命中 → 应创建 Audio，不创建 Utterance
  assert(audioCreated.length === a0 + 1, '命中 manifest → 创建 Audio（走预渲染音频）');
  assert(synthSpoke.length === u0, '命中 manifest → 不创建 Utterance');
  assert(host._lastSub && host._lastSub.t === probe, 'speak 入口显字幕');
  delete win.LOONA_TTS[id];

  var miss = 'SYNTH_BRANCH_随机_' + Math.random();
  var a1 = audioCreated.length, u1 = synthSpoke.length;
  tts.speak(miss, {});    // 未命中 → 回落合成，应创建 Utterance，不创建 Audio
  assert(audioCreated.length === a1, '未命中 manifest → 不创建 Audio');
  assert(synthSpoke.length === u1 + 1, '未命中 manifest → 创建 Utterance（回落合成）');
})();

// 6) pace/speed → rate 映射（音频 playbackRate 与合成 utterance.rate）
(function () {
  // 音频 playbackRate = clamp(speed, 0.6, 2.5)
  var cases = [
    { speed: 1,   audio: 1,    synth: Math.min(1.9, Math.max(0.6, 0.98 * 1)) },
    { speed: 0.3, audio: 0.6,  synth: Math.max(0.6, 0.98 * 0.3) },        // 下钳
    { speed: 3,   audio: 2.5,  synth: Math.min(1.9, 0.98 * 3) }           // 上钳
  ];
  cases.forEach(function (c) {
    var h = makeHost(c.speed);
    var t2 = win.LoonaTTS.create(h);
    // 音频分支
    var probe = 'RATE_AUDIO_' + c.speed;
    var id = t2._ttsId(probe); win.LOONA_TTS[id] = 'assets/tts/_r.wav';
    var before = audioCreated.length;
    t2.speak(probe, {});
    var au = audioCreated[before];
    assert(Math.abs(au.playbackRate - c.audio) < 1e-9, 'speed=' + c.speed + ' → audio.playbackRate=' + c.audio);
    delete win.LOONA_TTS[id];
    // 合成分支
    var miss = 'RATE_SYNTH_' + c.speed + '_' + Math.random();
    var ub = synthSpoke.length;
    t2.speak(miss, {});
    var ut = synthSpoke[ub];
    assert(Math.abs(ut.rate - c.synth) < 1e-9, 'speed=' + c.speed + ' → utterance.rate=' + c.synth.toFixed(4));
    assert(ut.lang === 'zh-CN', 'utterance.lang=zh-CN');
    assert(Math.abs(ut.pitch - 1.02) < 1e-9, 'utterance.pitch=1.02');
  });
})();

// 7) enabled=false 时：即便命中 manifest 也不走音频（走估时兜底 _sleep，不创建 Audio）
(function () {
  var h = makeHost(1);
  var t3 = win.LoonaTTS.create(h);
  t3.setEnabled(false);
  var probe = 'DISABLED_文本';
  var id = t3._ttsId(probe); win.LOONA_TTS[id] = 'assets/tts/_d.wav';
  var a0 = audioCreated.length, u0 = synthSpoke.length;
  var p = t3.speak(probe, {});
  assert(audioCreated.length === a0, 'enabled=false → 不创建 Audio（不走预渲染）');
  assert(synthSpoke.length === u0, 'enabled=false → 不创建 Utterance（走估时兜底）');
  assert(p && typeof p.then === 'function', 'enabled=false → speak 返回 Promise');
  delete win.LOONA_TTS[id];
})();

/* ---- 汇总 ---- */
if (fails.length) {
  console.error('\n失败 ' + fails.length + ' 项：');
  fails.forEach(function (m) { console.error('  FAIL ' + m); });
  process.exit(1);
}
console.log('\n全部通过');
process.exit(0);
