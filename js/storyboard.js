/* ============================================================
   Loona 工作台 · 瀑布故事板 + 评审中心
   中间：把事件链每一步渲成一块「宽舞台截图」tile，竖向平铺（engine.buildStoryboard 出快照）。
   播放/seek：engine.onStep → 滚动到 active tile（TTS 照常念）。点 tile → 右侧联动该节点评论串。
   右侧评审中心：选中节点评论串 + 总评(event_idx=-1) + 全链评论活动流；agent决策/编辑器折叠保留。
   评论复用 LoonaEditor._commentThread(idx) + LoonaCommentSync（localStorage / Supabase 实时）。
   ============================================================ */
(function (global) {
  'use strict';
  var UI = global.LoonaUI, el = UI.el, esc = UI.esc;

  var Storyboard = {
    init: function (engine, refs) {
      this.engine = engine;
      this.refs = refs;     // {feed, nodeThread, summaryBody, activityBody, actCount}
      this.tiles = []; this.tileEls = []; this.curNode = -1;
      var self = this;
      engine.onStep = function (idx) { self._onStep(idx); };
      window.addEventListener('resize', function () { self._applyScale(); });
      return this;
    },

    /* 载入/切换 case 后调：建快照 → 渲 feed + 评审中心 */
    rebuild: function () {
      if (!this.refs || !this.refs.feed) return;
      this.engine.storyboardMode = true;
      this.tiles = this.engine.buildStoryboard();
      this._renderFeed();
      this._applyScale();
      this._renderSummary();
      this._renderActivity();
      this.curNode = -1;
      this._renderNodeThread(-1);
      if (this.tiles.length) this.engine.seekTo(this.tiles[0].idx);   // 实时播放器显示首帧
    },

    _renderFeed: function () {
      var feed = this.refs.feed, self = this;
      feed.innerHTML = ''; this.tileEls = [];
      this.tiles.forEach(function (t) {
        var tile = el('div', 'sb-tile');
        tile.dataset.idx = t.idx;
        var head = el('div', 'sb-thead');
        head.appendChild(el('span', 'sb-tn', '#' + (t.idx + 1)));
        head.appendChild(el('span', 'sb-tlabel', esc(t.label || t.comp)));
        var badge = el('span', 'sb-cmt'); head.appendChild(badge); tile._badge = badge;
        tile.appendChild(head);
        if (t.userContext) tile.appendChild(el('div', 'sb-userctx', '🗣 ' + esc(t.userContext)));   // 触发这帧的用户提问
        var frame = el('div', 'sb-frame' + (t.notice ? ' sb-notice' : (t.empty ? ' sb-empty' : '')));
        var screen = el('div', 'sb-screen');
        if (t.dom) screen.appendChild(t.dom);
        frame.appendChild(screen);
        tile.appendChild(frame);
        if (t.text) tile.appendChild(el('div', 'sb-cap', esc(t.text)));   // 这帧的 TTS 口播（评 tts 内容）
        tile.addEventListener('click', function () { self.engine.seekTo(t.idx); });
        feed.appendChild(tile);
        if (t.scrollLeft) { var crr = tile.querySelector('.carousel-rail'); if (crr) crr.scrollLeft = t.scrollLeft; }   // 插入后施加居中位置
        self.tileEls[t.idx] = tile;
      });
      this._refreshBadges();
    },

    /* 算两档 scale：--sb-scale 播放器(填满栏宽)，--kf-scale 关键帧(小一号 filmstrip)。812×375 内部坐标整体缩放，不改内部 px */
    _applyScale: function () {
      var feed = this.refs.feed; if (!feed) return;
      var avail = feed.clientWidth - 36;
      var w = Math.max(0, Math.min(740, avail));
      var ps = Math.max(0.4, Math.min(1, w / 812));
      var ks = ps;   // 关键帧与播放器同尺寸（用户要求一致大小）
      var root = document.documentElement;
      root.style.setProperty('--sb-scale', ps.toFixed(4));
      root.style.setProperty('--kf-scale', ks.toFixed(4));
    },

    /* engine 每步（播放/seek/点击）回调：高亮+滚动 active tile + 联动右侧节点评论串 */
    _onStep: function (idx) {
      if (!this.tileEls[idx]) return;   // 非帧步（被过滤掉的 internal/toast/纯提问）：保持当前 active 不动
      for (var i = 0; i < this.tileEls.length; i++) if (this.tileEls[i]) this.tileEls[i].classList.toggle('active', i === idx);
      var te = this.tileEls[idx];
      if (te && te.scrollIntoView) te.scrollIntoView({ block: 'nearest', behavior: 'smooth' });   // 关键帧瀑布滚到当前帧，与左侧时间线对齐
      this.curNode = idx;
      if (!this._typingInThread()) this._renderNodeThread(idx);
    },

    _typingInThread: function () {
      var ae = document.activeElement;
      return !!(ae && /TEXTAREA|INPUT/.test(ae.tagName || '') && this.refs.nodeThread && this.refs.nodeThread.contains(ae));
    },

    /* 选中节点的评论串（复用 editor._commentThread(idx)） */
    _renderNodeThread: function (idx) {
      var box = this.refs.nodeThread; if (!box) return;
      box.innerHTML = '';
      if (idx == null || idx < 0) { box.appendChild(el('div', 'rh-hint', '👈 点中间任一关键帧，在这里给那一步写评论')); return; }
      var ev = this.engine.events[idx] || {};
      box.appendChild(el('div', 'rh-node-head', '已选中关键帧 #' + (idx + 1) + ' · ' + esc(this.engine._stageLabel(ev))));
      box.appendChild(el('div', 'rh-node-sub', '点中间其它关键帧可切换；下面的评论只属于这一步'));
      if (global.LoonaEditor && LoonaEditor._commentThread) box.appendChild(LoonaEditor._commentThread(idx));
    },

    /* 总评：整条链路一级评论，用 event_idx = -1 复用同一套评论串 */
    _renderSummary: function () {
      var b = this.refs.summaryBody; if (!b) return;
      b.innerHTML = '';
      if (global.LoonaEditor && LoonaEditor._commentThread) b.appendChild(LoonaEditor._commentThread(-1));
    },

    /* 全链评论活动流：所有评论按时间倒序，点击跳到对应节点 */
    _renderActivity: function () {
      var b = this.refs.activityBody, self = this; if (!b) return;
      b.innerHTML = '';
      var anns = ((this.engine.caseObj && this.engine.caseObj.annotations) || [])
        .filter(function (a) { return a.type === 'comment' || a.type === 'note'; })
        .slice().sort(function (x, y) { return (Date.parse(y.at) || 0) - (Date.parse(x.at) || 0); });
      if (this.refs.actCount) this.refs.actCount.textContent = anns.length ? ('(' + anns.length + ')') : '';
      if (!anns.length) { b.appendChild(el('div', 'rh-hint', '还没有评论。点节点写第一条。')); return; }
      anns.forEach(function (a) {
        var where = a.event_idx < 0 ? '总评' : ('#' + (a.event_idx + 1) + ' ' + self.engine._stageLabel(self.engine.events[a.event_idx] || {}));
        var rt = (global.LoonaEditor && LoonaEditor._relTime) ? LoonaEditor._relTime(a.at) : '';
        var row = el('div', 'rh-act');
        row.appendChild(el('div', 'rh-act-head',
          '<span class="rh-act-who">' + esc(a.author || '匿名') + '</span>' +
          '<span class="rh-act-where">' + esc(where) + '</span>' +
          '<span class="rh-act-time">' + esc(rt) + '</span>'));
        row.appendChild(el('div', 'rh-act-text', esc(a.text)));
        if (a.event_idx >= 0) row.addEventListener('click', function () { self.engine.seekTo(a.event_idx); });
        b.appendChild(row);
      });
    },

    _refreshBadges: function () {
      var anns = (this.engine.caseObj && this.engine.caseObj.annotations) || [];
      for (var i = 0; i < this.tileEls.length; i++) {
        var te = this.tileEls[i]; if (!te || !te._badge) continue;
        var hit = anns.filter(function (a) { return a.event_idx === i; });
        var nC = hit.filter(function (a) { return a.type === 'comment' || a.type === 'note'; }).length;
        var blk = hit.some(function (a) { return a.type === '卡点'; });
        te._badge.innerHTML = (blk ? '🚩' : '') + (nC ? ('💬' + nC) : '');
        te.classList.toggle('has-ann', hit.length > 0);
        te.classList.toggle('has-cmt', nC > 0);          // 有评论：tile 加左侧琥珀条
        te._badge.classList.toggle('on', hit.length > 0); // 角标做成琥珀胶囊+红点
      }
    },

    /* 评论变更（本地增删 / 远程实时）后由 engine.refreshRowFlags 触发：刷新角标+活动流+总评+当前节点串 */
    onCommentsChanged: function () {
      if (!this.refs || !this.refs.feed) return;
      this._refreshBadges();
      this._renderActivity();
      this._renderSummary();
      if (this.curNode >= 0 && !this._typingInThread()) this._renderNodeThread(this.curNode);
    }
  };

  global.LoonaStoryboard = Storyboard;
})(window);
