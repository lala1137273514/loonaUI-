/* ============================================================
   Loona 播放引擎（S3）
   串行 async runner：按 gap_ms 推进 → 渲染组件 → 念 TTS（阻塞，节奏可听）→ 逐日卡高亮 → wait_for_user 停等。
   internal 事件只进右侧 agent 侧轨。控制：播/停/单步/重播/调速/点时间线 seek。
   零依赖；TTS 用浏览器 SpeechSynthesis（无则用估时兜底，保证视觉链路播完）。
   ============================================================ */
(function (global) {
  'use strict';
  var UI = global.LoonaUI;

  var Engine = {
    /* ---------- 初始化 ---------- */
    init: function (refs) {
      this.refs = refs;                 // {popSlot,toastSlot,contentArea,subtitle,sideTrack,timeline,waitBanner,nowStage,stage}
      this.speed = 1;
      this.ttsEnabled = true;
      this.autoWaits = true;            // 自动播时停等用可见的节拍自动续（仍演出"停等"）
      this.waitBeat = 2000;             // 停等节拍 ms
      this.theme = 'glass';             // 皮肤 skin: glass | bubble | aura
      if (refs.stage) refs.stage.setAttribute('data-skin', this.theme);
      this.caseObj = null;
      this.events = [];
      this.idx = 0;
      this._prevT = 0;
      this._runId = 0;
      this._paused = false;
      this.mode = 'idle';               // idle | play | step
      this._bus = {};
      this._cards = {};                 // card_id -> node
      this._toasts = [];                // {node, dismiss_on}
      this._lastConfirm = null;
      this.onSelect = null;             // (idx, ev) 钩子，editor 用
      this.onState = null;              // (stateObj) 钩子，控制条用
      this._initSynth();
      return this;
    },
    _initSynth: function () {
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
    },

    /* ---------- 载入 case ---------- */
    load: function (caseObj) {
      this._cancel();
      this.caseObj = caseObj;
      this.events = (caseObj && caseObj.events) || [];
      this.idx = 0; this._prevT = 0; this.mode = 'idle'; this._paused = false;
      this._clearStage();
      this.rebuildTimeline();
      this._setNow('IDLE · 待命');
      this._emitState();
      return this;
    },

    /* ---------- 控制 ---------- */
    play: function () {
      if (this.mode === 'play') return;
      if (this.idx >= this.events.length) this._softReset();
      if (this._paused) { this._paused = false; this._emit('resume'); this.mode = 'play'; this._emitState(); return; }
      this._run(false);
    },
    pause: function () {
      if (this.mode !== 'play') { this._setPlaying(false); return; }
      this._paused = true; this._emit('pause');
      if (this._synth) try { this._synth.pause(); } catch (e) {}
      this.mode = 'idle'; this._emitState();
    },
    toggle: function () { (this.mode === 'play' && !this._paused) ? this.pause() : this.play(); },
    step: function () {
      if (this.mode === 'play') { this.pause(); return; }
      this._paused = false;
      if (this.idx >= this.events.length) this._softReset();
      this._run(true);                            // _run 会清 bus + 递增 runId，杀掉挂起循环
    },
    replay: function () { this._softReset(); var self = this; setTimeout(function () { self._run(false); }, 60); },
    setSpeed: function (s) { this.speed = +s || 1; this._emitState(); },
    setTTS: function (on) { this.ttsEnabled = !!on; if (!on && this._synth) try { this._synth.cancel(); } catch (e) {} this._emitState(); },
    setAutoWaits: function (on) { this.autoWaits = !!on; this._emitState(); },
    setTheme: function (t) {
      var self = this; this.theme = t;
      var apply = function () { if (self.refs.stage) self.refs.stage.setAttribute('data-skin', t); self._rerenderForm(); };
      if (document.startViewTransition) { try { document.startViewTransition(apply); } catch (e) { apply(); } }
      else apply();
      this._emitState();
    },
    /* 「展现形式」节点随皮肤切换原地重渲：同一份数据换一种形态。
       仅对形式节点(新闻/场景形式)生效；材质卡 & 确认门不动(避免毁掉确认门的按钮/倒计时)。 */
    _rerenderForm: function () {
      var ca = this.refs.contentArea;
      if (!this._lastCardEv || !ca) return;
      if (!ca.querySelector('.news-form, .news-card-list, .news-card-focus, .scenario-form')) return;
      ca.innerHTML = '';
      var ev = this._lastCardEv, comp = ev.comp;
      var node = (comp === 'card') ? UI.build('pop_large', ev) : UI.build(comp, ev, {});
      if (ev.card_id) { this._cards[ev.card_id] = node; node.dataset.cardId = ev.card_id; }
      ca.appendChild(node); ca.scrollTop = 0;
      this._markScroll(node);
    },

    _softReset: function () { this._cancel(); this.idx = 0; this._prevT = 0; this._paused = false; this._clearStage(); this._refreshTimelineDoneState(); this._setNow('IDLE · 待命'); },
    _cancel: function () { this._runId++; this._paused = false; this._emit('cancel'); this._bus = {}; if (this._synth) try { this._synth.cancel(); } catch (e) {} this._setPlaying(false); },

    /* ---------- 跳转（点时间线） ---------- */
    seekTo: function (idx) {
      this._cancel();
      this._clearStage();
      // 瞬时回放 [0..idx]（无 gap、无 TTS）重建画面
      for (var i = 0; i <= idx && i < this.events.length; i++) {
        this._renderEvent(this.events[i], i, true);
        var ev = this.events[i];
        var tp = this._ttsOf(ev);
        if (tp && tp.text) this._setSubtitle(tp.text, true, 'loona');   // seek 也反映最后口播
        if (tp && tp.highlight) this._highlightCard(tp.highlight);
      }
      this.idx = Math.min(idx + 1, this.events.length);
      this._prevT = this.events[idx] && this.events[idx].t != null ? this.events[idx].t : 0;
      this._setCurrent(idx);
      this._refreshTimelineDoneState();
      this._setNow('SEEK · 第 ' + (idx + 1) + ' 步');
      if (this.onSelect) this.onSelect(idx, this.events[idx]);
      this._emitState();
    },

    /* ---------- 主运行循环 ---------- */
    _run: function (singleStep) {
      var self = this;
      this._emit('cancel'); this._bus = {};      // 杀掉任何遗留的挂起循环
      var myRun = ++this._runId;
      this._paused = false;
      this.mode = singleStep ? 'step' : 'play';
      this._setPlaying(true); this._emitState();

      (function loop() {
        if (myRun !== self._runId) return;
        if (self.idx >= self.events.length) { self._finish(); return; }
        var i = self.idx, ev = self.events[i];
        var gap = singleStep ? 0 : (ev.gap_ms != null ? ev.gap_ms : Math.max(0, (ev.t || 0) - self._prevT));

        self._sleep(gap).then(function (r) {
          if (r === 'cancel' || myRun !== self._runId) return;
          self._setCurrent(i);
          self._setNow(self._stageLabel(ev));
          self._renderEvent(ev, i, false);

          var tp = self._ttsOf(ev);
          var afterTTS = function (rr) {
            if (rr === 'cancel' || myRun !== self._runId) return;
            self._markDone(i);
            if (ev.t != null) self._prevT = ev.t;
            self.idx = i + 1;

            var proceed = function () {
              if (myRun !== self._runId) return;
              if (singleStep) { self._setPlaying(false); self.mode = 'idle'; self._emitState(); if (self.idx >= self.events.length) self._finish(); return; }
              loop();
            };

            if (ev.wait_for_user && !singleStep) {
              self._waitUser(ev, i).then(function (choice) {
                if (choice === 'cancel-run' || myRun !== self._runId) return;
                self._prevT = 0; proceed();
              });
            } else { proceed(); }
          };

          if (tp && tp.text) {
            if (tp.highlight) self._highlightCard(tp.highlight);
            self._speak(tp.text, tp).then(afterTTS);
          } else { afterTTS('ok'); }
        });
      })();
    },

    _finish: function () {
      this._setPlaying(false); this.mode = 'idle';
      this._setNow('SETTLE · 收尾');
      this._setSubtitle('', false);
      this._refreshTimelineDoneState();
      this._emitState();
    },

    /* ---------- 渲染单个事件 ---------- */
    _renderEvent: function (ev, i, instant) {
      var comp = ev.comp;
      if (comp === 'agent_step') { this._renderAgentStep(ev, i); return; }      // 仅侧轨
      if (ev.internal) { this._renderAgentStep(ev, i); return; }

      // 卡片(聚焦一张)：任何已注册的 builder 都走这里 —— 新增「展现形式」无需改引擎
      if (comp === 'card' || (UI.CARD_BUILDERS && UI.CARD_BUILDERS[comp])) {
        this._dismissToastsOn('card', instant);
        this._focusClear(instant);              // 聚焦一张：上一张淡出
        this.refs.contentArea.classList.remove('single');
        if (ev.content && ev.visual_state && !ev.content.state) ev.content.state = ev.visual_state;
        var card = (comp === 'card') ? UI.build('pop_large', ev) : UI.build(comp, ev, {});
        if (ev.card_id) { this._cards[ev.card_id] = card; card.dataset.cardId = ev.card_id; }
        this.refs.contentArea.appendChild(card);
        this.refs.contentArea.scrollTop = 0;     // 高卡先显头部，TTS 高亮再滚到对应行
        this._markScroll(card);                  // 正文超固定包络 → 标 .pl-scroll(渐隐边 + 内部滚，UI-SPEC §4.2)
        if (comp !== 'ClarifyCard') this._bindClose(card, ev);   // 结果卡 X = 收起到回执 toast（澄清/确认门是决策，不收起）
        if (this.refs.stage) this.refs.stage.classList.toggle('sub-1line', comp !== 'ClarifyCard'); // 结果卡恒 1 行；澄清放 2 行(§8)
        this._lastCardEv = ev;                   // 切皮肤(=切形式)时原地重渲依据
        this._markContent();
        return;
      }

      switch (comp) {
        case 'user_query':
          this._setSubtitle(ev.text, true, 'user');   // ASR = 对话，走底部，与 TTS 同位（先用户后 Loona）
          break;
        case 'pop_small':
          this._pushPop(UI.popSmall({ role: ev.role || 'status', text: ev.text, state_visual: ev.state_visual }));
          break;
        case 'toast': {
          var t = UI.toast({ text: ev.text, state: ev.state, state_visual: ev.state_visual });
          this.refs.toastSlot.appendChild(t);
          this._toasts.push({ node: t, dismiss_on: ev.dismiss_on });
          if (ev.until && !instant) { var self = this; this._sleep(ev.until).then(function () { self._removeToast(t); }); }
          break;
        }
        case 'confirm': case 'ConfirmationCard': {
          this._dismissToastsOn('card', instant);
          this._clearHighlights();
          this._focusClear(instant);                 // 确认门聚焦：清前面结果卡
          this.refs.contentArea.classList.add('single');
          var cc = UI.confirmCard(ev.content || {}, {});   // 处理器在 _waitUser 里挂
          if (ev.card_id) { this._cards[ev.card_id] = cc; }
          this._lastConfirm = cc;
          this.refs.contentArea.appendChild(cc);
          this.refs.contentArea.scrollTop = 0;
          this._markScroll(cc);
          if (this.refs.stage) this.refs.stage.classList.remove('sub-1line'); // 确认门：短卡居中，可放 2 行字幕(§8)
          break;
        }
        case 'tts':
          // 纯 TTS 事件：渲染交给 _speak 的字幕；此处无 DOM
          break;
        default:
          this._pushPop(UI.popSmall({ role: 'status', text: ev.text || comp }));
      }
      this._markContent();
    },

    _renderAgentStep: function (ev, i) {
      var box = UI.el('div', 'agent-step');
      box.appendChild(UI.el('div', 'as-label', '▸ ' + UI.esc(ev.label || 'AGENT STEP') + '<span style="margin-left:auto;opacity:.6">#' + (i + 1) + '</span>'));
      box.appendChild(UI.el('div', 'as-decision', UI.esc(ev.decision || ev.text || '')));
      if (ev.fields && ev.fields.length) {
        var f = UI.el('div', 'as-fields');
        ev.fields.forEach(function (x) { f.appendChild(UI.el('span', 'chip', UI.esc(x))); });
        box.appendChild(f);
      }
      var st = this.refs.sideTrack;
      var empty = st.querySelector('.empty'); if (empty) empty.remove();
      st.appendChild(box);
      st.scrollTop = st.scrollHeight;
    },

    /* ---------- TTS ---------- */
    _ttsOf: function (ev) {
      if (ev.comp === 'tts') return { text: ev.text, pace: ev.pace, highlight: ev.highlight };
      if (ev.tts && ev.tts.text) return { text: ev.tts.text, pace: ev.tts.pace, highlight: ev.highlight };
      return null;
    },
    _speak: function (text, opts) {
      var self = this, myRun = this._runId;
      this._setSubtitle(text, true);
      return new Promise(function (resolve) {
        var done = false;
        function fin(r) { if (done) return; done = true; self._off('cancel', onCancel); self._off('pause', onPause); self._off('resume', onResume); self._subtitleSpeaking(false); resolve(r || 'ok'); }
        function onCancel() { try { self._synth && self._synth.cancel(); } catch (e) {} fin('cancel'); }
        function onPause() { try { self._synth && self._synth.pause(); } catch (e) {} }
        function onResume() { try { self._synth && self._synth.resume(); } catch (e) {} }
        self._on('cancel', onCancel); self._on('pause', onPause); self._on('resume', onResume);

        if (!self.ttsEnabled || !self._synth || !text) {           // 估时兜底，节奏照走
          var est = Math.max(650, text ? text.length * 145 : 0) / self.speed;
          self._sleep(est).then(function (r) { fin(r); });
          return;
        }
        var u = new SpeechSynthesisUtterance(text);
        if (self._voice) u.voice = self._voice;
        u.lang = 'zh-CN';
        u.rate = Math.min(1.9, Math.max(0.6, 0.98 * self.speed));
        u.pitch = 1.02;
        var guard = setTimeout(function () { fin('ok'); }, (Math.max(1600, text.length * 230)) / self.speed + 1800);
        u.onend = function () { clearTimeout(guard); fin('ok'); };
        u.onerror = function () { clearTimeout(guard); fin('ok'); };
        try { self._synth.cancel(); self._synth.speak(u); }
        catch (e) { clearTimeout(guard); self._sleep(Math.max(650, text.length * 145) / self.speed).then(function (r) { fin(r); }); }
      });
    },

    /* ---------- 停等（澄清/确认门） ---------- */
    _waitUser: function (ev, i) {
      var self = this, myRun = this._runId;
      return new Promise(function (resolve) {
        var done = false, raf = null;
        function finish(choice) {
          if (done) return; done = true;
          if (raf) cancelAnimationFrame(raf);
          self._hideWait(); self._off('cancel', onCancel);
          if ((ev.comp === 'confirm' || ev.comp === 'ConfirmationCard') && (choice === 'confirm' || choice === 'cancel')) self._onConfirmAction(choice, ev);
          resolve(choice || 'continue');
        }
        function onCancel() { if (done) return; done = true; if (raf) cancelAnimationFrame(raf); self._hideWait(); self._off('cancel', onCancel); resolve('cancel-run'); }
        self._on('cancel', onCancel);

        var isConfirm = (ev.comp === 'confirm' || ev.comp === 'ConfirmationCard');
        // 确认门：把按钮 + 倒计时挂到已渲染的 confirm-card
        if (isConfirm && self._lastConfirm) {
          var card = self._lastConfirm;
          var btns = card.querySelectorAll('.btn-fill');
          if (btns[0]) btns[0].addEventListener('click', function () { finish('confirm'); });
          if (btns[1]) btns[1].addEventListener('click', function () { finish('cancel'); });
          // 倒计时环
          var ring = card._ring;
          if (ring) {
            var C = ring._C, total = (ev.content && ev.content.countdown) || 30, t0 = performance.now();
            var fg = ring.querySelector('.ring-fg'), num = ring.querySelector('.ring-num');
            (function tick() {
              if (done) return;
              var elapsed = (performance.now() - t0) / 1000 * self.speed;
              var frac = Math.min(1, elapsed / total);
              if (fg) fg.style.strokeDashoffset = (C * frac).toFixed(1);
              if (num) num.textContent = Math.max(0, Math.ceil(total - elapsed));
              if (frac >= 1) { finish('cancel'); return; }
              raf = requestAnimationFrame(tick);
            })();
          }
          self._showWait(isConfirm, { onConfirm: function () { finish('confirm'); }, onCancel: function () { finish('cancel'); } });
        } else {
          self._showWait(false, { onContinue: function () { finish('continue'); } });
        }

        // 自动播：可见节拍后自动续（仍演出"停等"）
        if (self.autoWaits) {
          self._sleep(self.waitBeat).then(function (r) {
            if (r === 'cancel') return;
            finish(isConfirm ? 'confirm' : 'continue');
          });
        }
      });
    },
    _showWait: function (isConfirm, h) {
      var wb = this.refs.waitBanner; if (!wb) return;
      wb.innerHTML = '';
      var label = isConfirm ? '⏸ 确认门 · 等你拍板' : '⏸ 澄清 · 等你回应';
      wb.appendChild(UI.el('span', 'wt-label', label));
      if (isConfirm) {
        wb.appendChild(UI.btnFill('确认', 'primary', h.onConfirm));
        wb.appendChild(UI.btnFill('取消', 'ghost', h.onCancel));
      } else {
        wb.appendChild(UI.btnFill('继续 ▶', 'primary', h.onContinue));
      }
      wb.classList.add('show');
    },
    _hideWait: function () { var wb = this.refs.waitBanner; if (wb) { wb.classList.remove('show'); wb.innerHTML = ''; } },

    /* ---------- 交互模型：toast = 任务回执/入口，卡 = 可展开详情（收起 ↔ 查看详情） ---------- */
    _bindClose: function (card, ev) {
      var self = this, x = card.querySelector('.close-x');
      if (x) x.addEventListener('click', function () { self._collapseCard(ev); });
    },
    _cardTitle: function (ev) {
      var c = ev && ev.content;
      return (c && (c.title || c.headline || (c.item && c.item.title))) || '内容卡';
    },
    _collapseCard: function (ev) {                 // 结果卡 X = 收起：卡淡出，留「…·查看详情」回执 toast
      var self = this;
      this._focusClear(false);
      this._showReceipt('done', this._cardTitle(ev), function () { self._reopenCard(ev); });
    },
    _reopenCard: function (ev) {                    // 查看详情 = 重开该卡
      if (!ev) return;
      this._dismissToastsOn('card', true);
      this._renderEvent(ev, -1, true);
    },
    _showReceipt: function (state, label, onView) { // 回执 toast（右上 StatusToast 区）
      this._dismissToastsOn('card', true);
      var t = UI.toast({ state: state, text: label, btn: onView ? { label: '查看详情', onClick: onView } : null });
      this.refs.toastSlot.appendChild(t);
      this._toasts.push({ node: t, dismiss_on: 'card' });
      return t;
    },
    _onConfirmAction: function (choice, ev) {       // 确认门决策 → 状态 toast 反馈
      var self = this, c = (ev && ev.content) || {};
      this._focusClear(false);                      // 确认门离场
      if (choice === 'cancel') {                    // 取消是即时的：只「已取消」，不做「取消中」
        var rt = this._showReceipt('fail', '已取消', null);
        setTimeout(function () { self._removeToast(rt); }, 2200);
        return;
      }
      var L = this._actionLabels(c.action);
      var w = this._showReceipt(L.ws, L.working, null);              // 发送中…（spinner）
      // 用 _sleep 而非裸 setTimeout：随调速缩放，保证回执转换与下一事件 gap(÷speed) 同步，高速下「发送失败」也总在 FailureCard 之前出现
      if (c.outcome === 'fail') {                                    // 动作失败：诚实报错(REQ-FAIL-001)，不留「已发送·查看详情」假回执；下一步交给随后的 FailureCard
        this._sleep(1000).then(function (r) {
          self._removeToast(w);
          if (r === 'cancel') return;                               // 停/跳：撤掉发送中，不再推进回执
          var ft = self._showReceipt('fail', c.fail_label || (L.working.replace(/中$/, '') + '失败'), null);
          self._sleep(3400).then(function () { self._removeToast(ft); }); // 兜底；通常后续 FailureCard 渲染时 dismiss_on:'card' 已先收掉
        });
        return;
      }
      this._sleep(1000).then(function (r) {
        self._removeToast(w);
        if (r === 'cancel') return;
        self._showReceipt('done', L.done, function () { self._showReceiptCard(ev, L.done); });  // 已发送 ✓ · 查看详情
      });
    },
    _actionLabels: function (action) {
      action = action || '';
      if (/发送|外发|发出/.test(action)) return { ws: 'sending', working: '发送中', done: '已发送' };
      if (/删/.test(action)) return { ws: 'processing', working: '处理中', done: '已删除' };
      if (/保存|存/.test(action)) return { ws: 'saving', working: '保存中', done: '已保存' };
      if (/改|修改|更新|创建|新建|添加/.test(action)) return { ws: 'processing', working: '处理中', done: '已更新' };
      return { ws: 'processing', working: '处理中', done: '已完成' };
    },
    _showReceiptCard: function (ev, doneLabel) {     // 查看详情(已执行) = 只读回执卡（X 收起回 toast）
      var self = this, c = (ev && ev.content) || {};
      this._dismissToastsOn('card', true);
      this._focusClear(true);
      this.refs.contentArea.classList.add('single');
      if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');
      var rows = UI.el('div', 'cc-rows');
      [['动作', c.action], ['对象', c.target], ['影响', c.impact], ['内容', c.content_summary]].forEach(function (kv) {
        if (!kv[1]) return; var r = UI.el('div', 'cc-row'); r.appendChild(UI.el('span', 'k', kv[0])); r.appendChild(UI.el('span', 'v', UI.esc(kv[1]))); rows.appendChild(r);
      });
      var card = UI.popLargeCard({ icon: 'done', title: doneLabel || '已完成', titleExtra: UI.badge('回执', 'free'), body: rows, closeable: true });
      card.classList.add('confirm-card-wrap');
      this.refs.contentArea.appendChild(card);
      var x = card.querySelector('.close-x');
      if (x) x.addEventListener('click', function () { self._focusClear(false); self._showReceipt('done', doneLabel || '已完成', function () { self._showReceiptCard(ev, doneLabel); }); });
      this._markContent();
    },

    /* ---------- 高亮 / toast / 字幕 ---------- */
    _highlightCard: function (id) {
      this._clearHighlights();
      var ca = this.refs.contentArea;
      var node = ca.querySelector('[data-row-id="' + id + '"]') || this._cards[id] || ca.querySelector('[data-card-id="' + id + '"]');
      if (node) {
        node.classList.add(node.classList.contains('pop-large') ? 'card-highlight' : 'row-hl');
        try { node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (e) {}   // 横向 track 也把高亮的那张滚到中间
      }
    },
    _clearHighlights: function () {
      var ns = this.refs.contentArea.querySelectorAll('.row-hl, .card-highlight');
      for (var i = 0; i < ns.length; i++) ns[i].classList.remove('row-hl', 'card-highlight');
    },
    _focusClear: function (instant) {
      var ca = this.refs.contentArea; if (!ca) return;
      if (instant) { ca.innerHTML = ''; }
      else {
        var olds = ca.querySelectorAll('.pop-large');
        Array.prototype.forEach.call(olds, function (n) { n.classList.add('leaving'); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 340); });
      }
      this._cards = {};
    },
    _dismissToastsOn: function (kind, now) {
      var self = this, keep = [];
      this._toasts.forEach(function (t) {
        if (t.dismiss_on === kind) { if (now && t.node && t.node.parentNode) t.node.parentNode.removeChild(t.node); else self._removeToast(t.node); }
        else keep.push(t);
      });
      this._toasts = keep;
    },
    _removeToast: function (node) { if (!node) return; node.classList.add('hide'); setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 320); },
    _setSubtitle: function (text, show, role) {
      var s = this.refs.subtitle; if (!s) return;
      s.classList.remove('role-user', 'role-loona');
      if (!text) { s.classList.remove('show'); s.innerHTML = ''; return; }
      role = role || 'loona';
      s.classList.add('role-' + role);
      s.innerHTML = (role === 'user' ? '<span class="role-tag">你</span>' : '') + UI.esc(text) + (role === 'loona' ? '<span class="caret"></span>' : '');
      s.classList.add('show');
    },
    _subtitleSpeaking: function (on) { var s = this.refs.subtitle; if (!s) return; var c = s.querySelector('.caret'); if (c) c.style.display = on ? '' : 'none'; },
    _pushPop: function (node) {
      var slot = this.refs.popSlot; slot.appendChild(node);
      while (slot.children.length > 1) slot.removeChild(slot.firstChild);   // 同 Figma：右上同一时刻一条
    },
    _scrollCardIntoView: function (node) { try { node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (e) {} },
    _markScroll: function (card) {
      if (!card || !card.querySelector) return;
      var b = card.querySelector('.pl-body');
      if (b && b.scrollHeight > b.clientHeight + 1) card.classList.add('pl-scroll');
      else card.classList.remove('pl-scroll');
    },
    _markContent: function () {
      if (!this.refs.stage) return;
      var has = this.refs.popSlot.children.length > 0 || this.refs.contentArea.children.length > 0 || this.refs.toastSlot.children.length > 0;
      this.refs.stage.classList.toggle('has-content', has);
    },

    /* ---------- 舞台清空 / 状态 ---------- */
    _clearStage: function () {
      ['popSlot', 'toastSlot', 'contentArea', 'sideTrack'].forEach(function (k) { if (this.refs[k]) this.refs[k].innerHTML = ''; }, this);
      if (this.refs.contentArea) this.refs.contentArea.classList.remove('single');
      if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');
      if (this.refs.sideTrack) this.refs.sideTrack.appendChild(UI.el('div', 'empty', 'agent 内部决策记录将在播放时出现…'));
      this._setSubtitle('', false);
      this._hideWait();
      this._cards = {}; this._toasts = []; this._lastConfirm = null; this._lastCardEv = null;
      this._markContent();
    },
    _setNow: function (txt) { if (this.refs.nowStage) this.refs.nowStage.textContent = txt; },
    _stageLabel: function (ev) {
      var map = { user_query: 'LISTEN · 听取', agent_step: 'THINK · 思考', tts: 'PRESENT · 口播',
        pop_small: ev.role === 'clarify' ? 'CLARIFY · 澄清' : 'LISTEN · 听取', toast: 'FETCH · 取数',
        TravelDayCard: 'PRESENT · 呈现', card: 'PRESENT · 呈现', confirm: 'CONFIRM · 确认门' };
      return map[ev.comp] || (ev.comp || '').toUpperCase();
    },
    _setPlaying: function (on) { this._playing = on; if (this.refs.stage) this.refs.stage.classList.toggle('is-playing', !!on); },

    /* ---------- 时间线（左栏） ---------- */
    rebuildTimeline: function () {
      var tl = this.refs.timeline; if (!tl) return;
      tl.innerHTML = '';
      var self = this;
      this.events.forEach(function (ev, i) { tl.appendChild(self._timelineRow(ev, i)); });
    },
    _timelineRow: function (ev, i) {
      var self = this;
      var row = UI.el('div', 'tl-event');
      row.dataset.idx = i;
      row.appendChild(UI.el('span', 'tl-idx', (i + 1)));
      var main = UI.el('div', 'tl-main');
      var comp = ev.comp;
      main.appendChild(UI.el('span', 'tl-comp c-' + comp, this._compLabel(ev)));
      var snippet = ev.text || (ev.tts && ev.tts.text) || ev.decision ||
        (ev.comp === 'toast' && UI.toastLabel ? UI.toastLabel(ev.state || ev.state_visual) : '') ||
        (ev.content && (ev.content.theme ? ('Day' + ev.content.day + ' · ' + ev.content.theme) : ev.content.action)) || '';
      main.appendChild(UI.el('div', 'tl-text', UI.esc(snippet)));
      var meta = [];
      if (ev.internal) meta.push('侧轨');
      if (ev.wait_for_user) meta.push('停等');
      if (ev.highlight) meta.push('↦' + ev.highlight);
      meta.push('gap ' + (ev.gap_ms != null ? ev.gap_ms : '—') + 'ms');
      main.appendChild(UI.el('div', 'tl-meta', meta.map(function (m) { return UI.esc(m); }).join('　')));
      row.appendChild(main);
      // 卡点/批注标记
      this._applyRowFlag(row, i);
      row.addEventListener('click', function () { self.seekTo(i); });
      return row;
    },
    _compLabel: function (ev) {
      var m = { user_query: '用户', agent_step: 'agent', pop_small: ev.role === 'clarify' ? '澄清' : '气泡',
        toast: 'toast', TravelDayCard: '日卡', card: '卡', tts: 'TTS', confirm: '确认门' };
      return m[ev.comp] || ev.comp;
    },
    _applyRowFlag: function (row, i) {
      var ann = (this.caseObj && this.caseObj.annotations) || [];
      var hit = ann.filter(function (a) { return a.event_idx === i; });
      var old = row.querySelector('.tl-flag'); if (old) old.remove();
      if (hit.length) {
        var hasBlock = hit.some(function (a) { return a.type === '卡点'; });
        row.appendChild(UI.el('span', 'tl-flag', hasBlock ? '🚩' : '📝'));
      }
    },
    refreshRowFlags: function () { var rows = this.refs.timeline.querySelectorAll('.tl-event'); for (var i = 0; i < rows.length; i++) this._applyRowFlag(rows[i], +rows[i].dataset.idx); },
    _setCurrent: function (idx) {
      var rows = this.refs.timeline.querySelectorAll('.tl-event');
      for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('current', +rows[i].dataset.idx === idx);
      var cur = this.refs.timeline.querySelector('.tl-event.current');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    },
    _refreshTimelineDoneState: function () {
      var rows = this.refs.timeline.querySelectorAll('.tl-event'), self = this;
      for (var i = 0; i < rows.length; i++) { var k = +rows[i].dataset.idx; rows[i].classList.toggle('done', k < self.idx); }
    },
    _markDone: function (i) { var r = this.refs.timeline.querySelector('.tl-event[data-idx="' + i + '"]'); if (r) r.classList.add('done'); },

    /* ---------- 事件总线 ---------- */
    _on: function (k, f) { (this._bus[k] = this._bus[k] || []).push(f); },
    _off: function (k, f) { var a = this._bus[k]; if (a) { var i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } },
    _emit: function (k) { var a = (this._bus[k] || []).slice(); a.forEach(function (f) { try { f(); } catch (e) {} }); },

    /* ---------- 可暂停 / 可取消的 sleep ---------- */
    _sleep: function (ms) {
      var self = this, myRun = this._runId;
      return new Promise(function (resolve) {
        var remaining = ms / self.speed, last = performance.now(), timer = null, finished = false;
        function clearT() { if (timer) { clearTimeout(timer); timer = null; } }
        function fin(r) { if (finished) return; finished = true; clearT(); self._off('pause', onPause); self._off('resume', onResume); self._off('cancel', onCancel); resolve(r); }
        function arm() { last = performance.now(); timer = setTimeout(function () { fin('ok'); }, Math.max(0, remaining)); }
        function onPause() { if (timer) { remaining -= (performance.now() - last); clearT(); } }
        function onResume() { if (myRun === self._runId && !self._paused) arm(); }
        function onCancel() { fin('cancel'); }
        self._on('pause', onPause); self._on('resume', onResume); self._on('cancel', onCancel);
        if (remaining <= 0) { fin('ok'); return; }
        if (!self._paused) arm();
      });
    },

    /* ---------- 状态广播（控制条用） ---------- */
    _emitState: function () {
      if (!this.onState) return;
      this.onState({ mode: this.mode, paused: this._paused, playing: this.mode === 'play',
        idx: this.idx, total: this.events.length, speed: this.speed, theme: this.theme,
        title: this.caseObj && this.caseObj.title, task_id: this.caseObj && this.caseObj.task_id,
        ttsEnabled: this.ttsEnabled, autoWaits: this.autoWaits, atEnd: this.idx >= this.events.length });
    }
  };

  global.LoonaEngine = Engine;
})(window);
