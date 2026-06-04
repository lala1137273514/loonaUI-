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
      this.onStep = null;              // (idx) 钩子，故事板 feed 滚动到 active tile 用
      this.storyboardMode = false;     // 开启后播放/seek 不再渲染 live 舞台（tile 已预建），只滚动+念
      this._building = false;          // buildStoryboard 进行中（绕过 storyboardMode 门，真渲染以便克隆）
      this._initSynth();
      // web_ui 同款轮播控制器（原样搬来的 CortexCarousel）：结果卡走它，澄清/确认仍走玻璃浮层
      if (global.CortexCarousel && refs.carouselPanel && refs.carouselRail && refs.carouselTitle) {
        this._carousel = global.CortexCarousel.createCarouselController({ panelEl: refs.carouselPanel, titleEl: refs.carouselTitle, railEl: refs.carouselRail });
        var self = this;
        if (this._carousel.setOnCardClick) this._carousel.setOnCardClick(function (idx) {
          if (self._travelStages && global.LoonaCarouselAdapter && LoonaCarouselAdapter.mode === 'overview') self._drill({ coverIdx: +idx });
        });
        if (refs.carouselBack) refs.carouselBack.addEventListener('click', function () { self._backToOverview(); });
      }
      return this;
    },
    carouselNav: function (dir) { if (this._carousel) this._carousel.scrollCarousel(dir); },
    travelBack: function () { this._backToOverview(); },
    /* 两阶段下钻：opts = {day:'d2'} | {coverIdx:1}；flip 默认开（seek 时关）
       封面↔详情切换走 View Transition 共享元素形变（hero 图 morph），不支持则 opacity 兜底 */
    _drill: function (opts) {
      if (!this._travelStages || !this._carousel || !global.LoonaCarouselAdapter) return;
      var A = LoonaCarouselAdapter, st = A.stages, self = this;
      // 同阶段内左右切天：只滑动聚焦，不重渲（更顺）
      if (opts.day && st && A.mode === 'detail' && st.dayToStage[opts.day] === st.curStage) {
        var di = st.detailByStage[st.curStage].dayIdx[opts.day];
        if (di) { this._carousel.focusCarouselItem(di); return; }
      }
      var d = opts.day ? A.drillByDay(opts.day) : A.drillByCoverIdx(opts.coverIdx);
      if (!d) return;
      this._vtSwitch(function (useFlip) {
        self._carousel.renderCarousel(d.carousel, { flip: useFlip });
        if (d.focusIdx) self._carousel.focusCarouselItem(d.focusIdx);
        self._setBackBtn(true, d.stageTitle);
      }, opts.flip !== false);
    },
    _backToOverview: function (animate) {
      if (!this._travelStages || !this._carousel || !global.LoonaCarouselAdapter) return;
      var d = LoonaCarouselAdapter.backToOverview(); if (!d) return;
      var self = this;
      this._vtSwitch(function (useFlip) {
        self._carousel.renderCarousel(d.carousel, { flip: useFlip });
        if (d.focusIdx) self._carousel.focusCarouselItem(d.focusIdx);
        self._setBackBtn(false);
      }, animate !== false);   // seek 即时回放传 false → 同步渲染（与 _drill 一致）
    },
    /* 编辑器即改即见：用编辑后的 stages content 重渲轮播（不走 TTS/flip），按 target 定位预览。
       target = {stage:'s1'}(看封面) | {day:'d2'}(看该天详情) | 空(看封面总览) */
    previewStages: function (ev, target) {
      if (!this._carousel || !global.LoonaCarouselAdapter || !ev || ev.comp !== 'TravelStages') return;
      var cov = LoonaCarouselAdapter.feedStages(ev);
      if (!cov || !cov.items.length) { this._hideCarousel(); return; }
      this._travelStages = true;
      this._dismissToastsOn('card', true);
      this._focusClear(true);
      this.refs.contentArea.classList.remove('single');
      this._carousel.renderCarousel(cov);
      this._setBackBtn(false);
      this._showCarousel(true);
      if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');   // 轮播在场字幕放 2 行（长口播多显）
      if (target && target.day) this._drill({ day: target.day, flip: false });
      else if (target && target.stage && LoonaCarouselAdapter.stages) {
        var ci = LoonaCarouselAdapter.stages.coverIdxByStage[target.stage]; if (ci) this._carousel.focusCarouselItem(ci);
      }
      this._markContent();
    },
    /* 有 View Transition 用形变；否则用 carousel 的 opacity flip 兜底。
       吞掉 transition 的 ready/finished rejection（连切时会相互中断 abort，DOM 更新照常执行） */
    _vtSwitch: function (run, animate) {
      if (animate && document.startViewTransition) {
        try {
          var vt = document.startViewTransition(function () { run(false); });
          if (vt) { if (vt.ready && vt.ready.catch) vt.ready.catch(function () {}); if (vt.finished && vt.finished.catch) vt.finished.catch(function () {}); }
          return;
        } catch (e) {}
      }
      run(animate);
    },
    /* C 方案：给总览卡的每日亮点行挂点击 → 下钻该天详情 */
    _wireOverviewRows: function () {
      var self = this, rail = this.refs.carouselRail; if (!rail) return;
      var rows = rail.querySelectorAll('.tov-row');
      for (var i = 0; i < rows.length; i++) {
        rows[i].addEventListener('click', function (e) { e.stopPropagation(); self._drill({ day: this.dataset.id }); });
      }
    },
    _setBackBtn: function (on, label) {
      if (this.refs.carouselBack) this.refs.carouselBack.classList.toggle('hidden', !on);
      if (this.refs.carouselTitle) this.refs.carouselTitle.textContent = on ? ('旅行规划 · ' + (label || '')) : '旅行规划';
    },
    _carouselShowing: function () { return !!(this.refs.carouselPanel && !this.refs.carouselPanel.classList.contains('hidden')); },
    _showCarousel: function (on) {
      if (on) this._hideStory();
      if (this.refs.carouselPanel) this.refs.carouselPanel.classList.toggle('hidden', !on);
      if (this.refs.stage) this.refs.stage.classList.toggle('has-carousel', !!on);
    },
    _hideStory: function () { var l = this.refs.storyLayer; if (l) { l.classList.remove('show'); l.innerHTML = ''; } },
    /* 叙事流：满屏「一图一刻」moment 卡（独立 story 层，不走轮播）。
       moment 模式 = 大图 + ≤8字标题 + tag + 进度点 ●○○；详情模式(content.nodes) = ← 标题 + 时段行 + 💡提醒；content.end = 屏回暗 */
    _renderMoment: function (ev, instant) {
      var c = ev.content || {}, layer = this.refs.storyLayer;
      this._hideCarousel();
      this._focusClear(instant);
      this.refs.contentArea.classList.remove('single');
      if (!layer) return;
      if (c.end) { this._hideStory(); this._markContent(); return; }   // 屏回暗（情绪收尾）
      layer.innerHTML = '';
      var card = UI.el('div', 'moment-card' + (c.nodes ? ' moment-detail' : ''));
      if (c.photo) { var img = UI.el('img', 'moment-photo'); img.src = c.photo; img.alt = ''; card.appendChild(img); }
      else card.appendChild(UI.el('div', 'moment-photo cover-photo-ph'));
      card.appendChild(UI.el('div', 'moment-shade'));
      var body = UI.el('div', 'moment-body');
      if (c.nodes) {
        if (c.title) body.appendChild(UI.el('div', 'moment-back', '← ' + UI.esc(c.title)));
        var rows = UI.el('div', 'moment-rows');
        c.nodes.forEach(function (n) { var r = UI.el('div', 'mrow'); r.appendChild(UI.el('span', 'mr-time', UI.esc(n.time || ''))); r.appendChild(UI.el('span', 'mr-place', UI.esc(n.place || ''))); rows.appendChild(r); });
        body.appendChild(rows);
        if (c.tip) body.appendChild(UI.el('div', 'moment-tip', '💡 ' + UI.esc(c.tip)));
      } else {
        if (c.dots && c.dots.n) { var d = UI.el('div', 'moment-dots'); for (var k = 1; k <= c.dots.n; k++) d.appendChild(UI.el('span', 'dot' + (k === c.dots.i ? ' on' : ''))); body.appendChild(d); }
        if (c.title) body.appendChild(UI.el('h2', 'moment-title', UI.esc(c.title)));
        var metas = c.meta || [], tags = c.tags || (c.tag ? [c.tag] : []);
        if (metas.length || tags.length) {
          var tr = UI.el('div', 'moment-tags');
          metas.forEach(function (m) { tr.appendChild(UI.el('span', 'moment-meta', UI.esc(m))); });   // 时间/预算等元信息（淡玻璃）
          tags.forEach(function (t) { tr.appendChild(UI.el('span', 'moment-tag', UI.esc(t))); });      // 特色亮点（琥珀强调）
          body.appendChild(tr);
        }
      }
      card.appendChild(body);
      layer.appendChild(card);
      layer.classList.add('show');
      if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');   // 叙事字幕放 2 行
      this._lastCardEv = ev;
      this._markContent();
    },
    _hideCarousel: function () {
      if (this._carousel) this._carousel.hideCarousel();
      if (this.refs.carouselPanel) this.refs.carouselPanel.classList.add('hidden');
      if (this.refs.stage) this.refs.stage.classList.remove('has-carousel');
    },
    /* 结果卡 → 轮播（适配器映射）。list 类整张渲染，focus 类只重定位聚焦。 */
    _renderCarousel: function (ev, instant) {
      if (!this._carousel || !global.LoonaCarouselAdapter) return false;
      var A = LoonaCarouselAdapter;
      // 旅行首屏（三方案）→ 首屏轮播 + 下钻详情，复用同一套 _drill/_backToOverview
      //   A TravelStages=阶段封面 · C TravelOverview=城市总览+每日行 · B InspoFlow=种草灵感卡
      if (ev.comp === 'TravelStages' || ev.comp === 'TravelOverview' || ev.comp === 'InspoFlow' || ev.comp === 'DestCompare' || ev.comp === 'ThemeFlow') {
        var cov = ev.comp === 'TravelOverview' ? A.feedOverview(ev)
          : ev.comp === 'InspoFlow' ? A.feedInspo(ev)
          : ev.comp === 'DestCompare' ? A.feedDestCompare(ev)
          : ev.comp === 'ThemeFlow' ? A.feedThemeFlow(ev) : A.feedStages(ev);
        if (!cov || !cov.items.length) return false;
        this._dismissToastsOn('card', instant);
        this._focusClear(instant);
        this.refs.contentArea.classList.remove('single');
        this._travelStages = true;
        this._carousel.renderCarousel(cov);
        this._setBackBtn(false);
        this._showCarousel(true);
        if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');   // 轮播在场字幕放 2 行（长口播多显）
        if (ev.comp === 'TravelOverview') this._wireOverviewRows();   // 总览卡每日亮点行 → 点击下钻
        this._lastCardEv = ev; this._markContent();
        return true;
      }
      var res = A.feed(ev);
      if (res.action === 'none') return false;
      this._travelStages = false;
      this._dismissToastsOn('card', instant);
      this._focusClear(instant);                       // 清掉浮层里残留的玻璃单卡（澄清/确认）
      this.refs.contentArea.classList.remove('single');
      if (res.action === 'render') {
        this._carousel.renderCarousel(res.carousel);
        if (res.focus) this._carousel.focusCarouselItem(res.focus);
      } else if (res.action === 'focus') {
        this._carousel.focusCarouselItem(res.item_idx);
      }
      this._setBackBtn(false);
      this._showCarousel(true);
      if (this.refs.stage) this.refs.stage.classList.remove('sub-1line');   // 轮播在场字幕放 2 行（长口播多显）   // 结果在场 → 字幕 1 行
      this._lastCardEv = ev;
      this._markContent();
      return true;
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
      if (comp === 'MomentCard') { this._renderMoment(ev, instant); return; }   // 叙事流：满屏一图一刻

      // 结果卡 → web_ui 同款轮播（trip/news/mail/event/weather/...）；其余卡(澄清/失败/generic)走玻璃浮层
      if (global.LoonaCarouselAdapter && LoonaCarouselAdapter.isResult(ev)) {
        if (this._renderCarousel(ev, instant)) return;
      }

      // 卡片(聚焦一张)：任何已注册的 builder 都走这里 —— 新增「展现形式」无需改引擎
      if (comp === 'card' || (UI.CARD_BUILDERS && UI.CARD_BUILDERS[comp])) {
        this._hideCarousel();                   // 澄清/失败等决策浮层出现 → 收起轮播
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
          // 旅行两阶段：用户"说某一天"→下钻；"返回总览"→回封面（点封面卡走 onCardClick）
          if (this._travelStages && ev.drill_day) this._drill({ day: ev.drill_day, flip: !instant });
          else if (this._travelStages && ev.travel_back) this._backToOverview(!instant);
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
          this._hideCarousel();                       // 确认门聚焦 → 收起轮播
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
    /* 文案 → 稳定 id（djb2，与离线生成脚本 tools/gen_tts.mjs 同算法）→ 命中预渲染百炼 mp3 */
    _ttsId: function (s) { var h = 5381, i = (s || '').length; while (i) h = (h * 33) ^ s.charCodeAt(--i); return (h >>> 0).toString(16); },
    _ttsFile: function (text) { var m = global.LOONA_TTS; return (m && text) ? (m[this._ttsId(text)] || null) : null; },
    _speak: function (text, opts) {
      this._setSubtitle(text, true);
      // 预渲染百炼 mp3（assets/tts/manifest.js → window.LOONA_TTS）优先；缺则回落浏览器合成/估时
      if (this.ttsEnabled && text) { var url = this._ttsFile(text); if (url) return this._speakAudio(text, opts, url); }
      return this._speakSynth(text, opts);
    },
    /* 播放预渲染百炼音频：可暂停/续/取消/调速；加载或解码失败 → 回落 _speakSynth */
    _speakAudio: function (text, opts, url) {
      var self = this;
      return new Promise(function (resolve) {
        var done = false, audio;
        function clean() { self._off('cancel', onCancel); self._off('pause', onPause); self._off('resume', onResume); }
        function fin(r) { if (done) return; done = true; clean(); self._subtitleSpeaking(false); try { audio && audio.pause(); } catch (e) {} resolve(r || 'ok'); }
        function fallback() { if (done) return; done = true; clean(); try { audio && audio.pause(); } catch (e) {} self._speakSynth(text, opts).then(function (r) { resolve(r); }); }
        function onCancel() { fin('cancel'); }
        function onPause() { try { audio && audio.pause(); } catch (e) {} }
        function onResume() { if (!done && audio) try { audio.play(); } catch (e) {} }
        try { audio = new Audio(url); } catch (e) { fallback(); return; }
        audio.playbackRate = Math.min(2.5, Math.max(0.6, self.speed));
        audio.onended = function () { fin('ok'); };
        audio.onerror = function () { fallback(); };
        self._on('cancel', onCancel); self._on('pause', onPause); self._on('resume', onResume);
        if (self._paused) return;                 // 暂停态：等 resume 再播
        var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {});   // 自动播放被拦截：等手势/resume
      });
    },
    _speakSynth: function (text, opts) {
      var self = this;
      // 无 TTS / 无 synth / 空文本：估时兜底，节奏完全交给 pause-aware 的 _sleep（暂停即冻结、继续即续，原生支持）
      if (!this.ttsEnabled || !this._synth || !text) {
        return this._sleep(Math.max(650, text ? text.length * 145 : 0)).then(function (r) { self._subtitleSpeaking(false); return r; });
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
          self._off('cancel', onCancel); self._off('pause', onPause); self._off('resume', onResume);
          self._subtitleSpeaking(false); resolve(r || 'ok');
        }
        function onCancel() { try { self._synth.cancel(); } catch (e) {} fin('cancel'); }
        function onPause() { if (done) return; paused = true; clearGuard(); curU = null; try { self._synth.cancel(); } catch (e) {} }
        function onResume() { if (done || !paused) return; paused = false; speak(); }
        function armGuard() { clearGuard(); guard = setTimeout(function () { if (!paused && !done) fin('ok'); }, (Math.max(1600, text.length * 230)) / self.speed + 1800); }
        function speak() {
          var u = new SpeechSynthesisUtterance(text); curU = u;
          if (self._voice) u.voice = self._voice;
          u.lang = 'zh-CN'; u.rate = Math.min(1.9, Math.max(0.6, 0.98 * self.speed)); u.pitch = 1.02;
          u.onend = function () { if (!paused && u === curU) fin('ok'); };       // 暂停态/旧 utterance 的 onend 不结束
          u.onerror = function () { if (!paused && u === curU) fin('ok'); };
          try { self._synth.cancel(); self._synth.speak(u); armGuard(); }
          catch (e) { self._sleep(Math.max(650, text.length * 145)).then(function (r) { if (!paused) fin(r); }); }
        }
        self._on('cancel', onCancel); self._on('pause', onPause); self._on('resume', onResume);
        if (self._paused) { paused = true; return; }   // 已是暂停态：等 resume 再念
        speak();
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
          // 确认门无倒计时（UI-SPEC §14.4：显式二选一，不施压、不自动过期）
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
      // 轮播在场：TTS 念到哪条 → 居中聚焦对应卡（web_ui focusCarouselItem）
      if (this._carouselShowing() && global.LoonaCarouselAdapter) {
        var hidx = LoonaCarouselAdapter.highlightToIdx(id);
        if (hidx) { this._carousel.focusCarouselItem(hidx); return; }
      }
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
      if (this.refs.annLive) { this.refs.annLive.hidden = true; this.refs.annLive.onclick = null; }
      if (global.LoonaCarouselAdapter) LoonaCarouselAdapter.reset();
      this._travelStages = false;
      this._setBackBtn(false);
      this._hideCarousel();
      this._hideStory();
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

    /* ---------- 故事板快照 ---------- */
    /* 累积渲染 0..N（不在事件间清屏），每步把 #loonaStage 深克隆成一块静态 tile。
       agent_step/internal → 返回决策条数据(不克隆)。供中间瀑布 feed 平铺。
       注意：必须累积（像 seekTo），否则带 highlight 的 tts 步会丢掉它依附的轮播。 */
    buildStoryboard: function () {
      var prevBuilding = this._building;
      this._cancel();
      this._building = true;
      this._clearStage();
      var tiles = [], pendingUser = '';
      for (var i = 0; i < this.events.length; i++) {
        var ev = this.events[i];
        this._renderEvent(ev, i, true);                  // 始终渲染（维持累积态），只是不一定出 tile
        var tp = this._ttsOf(ev);
        if (tp && tp.text) this._setSubtitle(tp.text, true, ev.comp === 'user_query' ? 'user' : 'loona');
        if (tp && tp.highlight) this._highlightCard(tp.highlight);
        // 任何轮播帧（含钻取详情帧、非首张高亮帧）：克隆前同步把 active 卡滚到居中
        // （focusCarouselItem 的 smooth scroll 是异步的，赶不上同步克隆，不在此处补就会"图对不上"）
        var _rail = this.refs.carouselRail, _act = _rail && _rail.querySelector('.result-card.active');
        if (_rail && _act && this.refs.carouselPanel && !this.refs.carouselPanel.classList.contains('hidden'))
          _rail.scrollLeft = Math.max(0, _act.offsetLeft + _act.offsetWidth / 2 - _rail.clientWidth / 2);
        // 只「有界面的帧」成为可评论 tile：跳过 internal agent决策 / 取数 toast / 纯用户提问(无下钻)
        var pureQuery = (ev.comp === 'user_query' && !ev.drill_day && !ev.travel_back);
        if (pureQuery) { pendingUser = ev.text || pendingUser; continue; }     // 提问并入下一帧作上下文
        if (ev.comp === 'agent_step' || ev.internal || ev.comp === 'toast') continue;
        var label = ev.drill_day ? '钻取 · 详情' : ev.travel_back ? '返回 · 总览' : this._stageLabel(ev);
        var clone = this.refs.stage.cloneNode(true);
        var origRail = this.refs.carouselRail;
        var sl = origRail ? origRail.scrollLeft : 0;   // 居中位置（克隆不带 scrollLeft，存下来插入后再施加）
        var idd = clone.querySelectorAll('[id]'); for (var k = 0; k < idd.length; k++) idd[k].removeAttribute('id');
        clone.removeAttribute('id');
        tiles.push({ idx: i, comp: ev.comp, label: label, text: (tp && tp.text) || ev.text || '', userContext: pendingUser, scrollLeft: sl, dom: clone });
        pendingUser = '';
      }
      this._clearStage();
      this._building = prevBuilding;
      this.idx = 0; this._prevT = 0;
      return tiles;
    },

    /* ---------- 时间线（左栏） ---------- */
    rebuildTimeline: function () {
      var tl = this.refs.timeline; if (!tl) return;
      tl.innerHTML = '';
      var self = this;
      this.events.forEach(function (ev, i) { tl.appendChild(self._timelineRow(ev, i)); });
      if (this.onTimelineBuilt) this.onTimelineBuilt();   // 视图层（搜索/筛选）重应用
    },
    _rowGroup: function (ev) {
      if (ev.comp === 'user_query') return 'user';
      if (ev.comp === 'agent_step' || ev.internal) return 'agent';
      if (ev.comp === 'confirm' || ev.comp === 'ConfirmationCard') return 'confirm';
      if (ev.comp === 'card' || (UI.CARD_BUILDERS && UI.CARD_BUILDERS[ev.comp])) return 'card';
      return 'other';
    },
    _timelineRow: function (ev, i) {
      var self = this;
      var row = UI.el('div', 'tl-event grp-' + this._rowGroup(ev) + (ev.internal ? ' tl-internal' : ''));
      row.dataset.idx = i;
      row.dataset.comp = ev.comp;
      row.dataset.group = this._rowGroup(ev);
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
      // 搜索索引（类型标签 + 正文 + 决策字段）
      row.dataset.search = (this._compLabel(ev) + ' ' + comp + ' ' + snippet + ' ' + ((ev.fields || []).join(' '))).toLowerCase();
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
      var hasBlock = hit.some(function (a) { return a.type === '卡点'; });
      var nComments = hit.filter(function (a) { return a.type === 'comment' || a.type === 'note'; }).length;
      row.classList.toggle('has-ann', hit.length > 0);
      row.dataset.flagged = hit.length ? '1' : '';
      if (hit.length) {
        var flag = UI.el('div', 'tl-flag');
        if (hasBlock) flag.appendChild(UI.el('span', 'tl-flag-block', '🚩'));
        if (nComments) flag.appendChild(UI.el('span', 'tl-flag-cmt', '💬' + nComments));
        row.appendChild(flag);
      }
    },
    refreshRowFlags: function () {
      var rows = this.refs.timeline.querySelectorAll('.tl-event');
      for (var i = 0; i < rows.length; i++) this._applyRowFlag(rows[i], +rows[i].dataset.idx);
      if (global.LoonaStoryboard && this.storyboardMode && LoonaStoryboard.onCommentsChanged) LoonaStoryboard.onCommentsChanged();
    },
    _setCurrent: function (idx) {
      var rows = this.refs.timeline.querySelectorAll('.tl-event');
      for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('current', +rows[i].dataset.idx === idx);
      var cur = this.refs.timeline.querySelector('.tl-event.current');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
      this._reflectAnnLive(idx);
      if (this.onStep) this.onStep(idx);   // 故事板：滚动 feed 到当前 tile + 高亮
    },
    /* 播放/跳转时在设备外提示「本步有标注」——强可见性，不碰产品 UI。
       故事板态：节点评论提示改由下方关键帧 tile 的 💬 角标承担，播放器上不再显示此横幅。 */
    _reflectAnnLive: function (idx) {
      var live = this.refs.annLive; if (!live) return;
      if (this.storyboardMode) { live.hidden = true; live.onclick = null; return; }
      var ann = (this.caseObj && this.caseObj.annotations) || [];
      var hit = ann.filter(function (a) { return a.event_idx === idx; });
      if (!hit.length) { live.hidden = true; live.onclick = null; return; }
      var hasBlock = hit.some(function (a) { return a.type === '卡点'; });
      var nC = hit.filter(function (a) { return a.type === 'comment' || a.type === 'note'; }).length;
      var parts = [];
      if (hasBlock) parts.push('🚩 卡点');
      if (nC) parts.push('💬 ' + nC + ' 条评论');
      live.innerHTML = '<span class="al-dot"></span>本步有标注 · ' + parts.join(' · ');
      live.hidden = false;
      var self = this;
      live.onclick = function () { self.pause(); self.seekTo(idx); };
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
