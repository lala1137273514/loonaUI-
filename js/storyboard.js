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
      return this;
    },

    /* 载入/切换 case 后调：建快照 → 渲 feed + 评审中心 */
    rebuild: function () {
      if (!this.refs || !this.refs.feed) return;
      this.engine.storyboardMode = true;
      this.tiles = this.engine.buildStoryboard();
      this._renderFeed();
      this._renderSummary();
      this._renderActivity();
      this.curNode = -1;
      this._renderNodeThread(-1);
    },

    _renderFeed: function () {
      var feed = this.refs.feed, self = this;
      feed.innerHTML = ''; this.tileEls = [];
      this.tiles.forEach(function (t) {
        var tile = el('div', 'sb-tile' + (t.agent ? ' sb-agent' : ''));
        tile.dataset.idx = t.idx;
        var head = el('div', 'sb-thead');
        head.appendChild(el('span', 'sb-tn', '#' + (t.idx + 1)));
        head.appendChild(el('span', 'sb-tlabel', esc(t.label || t.comp)));
        var badge = el('span', 'sb-cmt'); head.appendChild(badge); tile._badge = badge;
        tile.appendChild(head);
        if (t.agent) {
          var ab = el('div', 'sb-agentbox');
          ab.appendChild(el('div', 'sb-agentlb', '⚙ ' + esc(t.agentLabel || 'AGENT')));
          if (t.agentDecision) ab.appendChild(el('div', 'sb-agentdec', esc(t.agentDecision)));
          if (t.agentFields && t.agentFields.length) {
            var f = el('div', 'sb-agentfields');
            t.agentFields.forEach(function (x) { f.appendChild(el('span', 'chip', esc(x))); });
            ab.appendChild(f);
          }
          tile.appendChild(ab);
        } else {
          var screen = el('div', 'sb-screen' + (t.empty ? ' sb-empty' : ''));
          if (t.dom) screen.appendChild(t.dom);
          tile.appendChild(screen);
          if (t.text) tile.appendChild(el('div', 'sb-cap', esc(t.text)));
        }
        tile.addEventListener('click', function () { self.engine.seekTo(t.idx); });
        feed.appendChild(tile);
        self.tileEls[t.idx] = tile;
      });
      this._refreshBadges();
    },

    /* engine 每步（播放/seek/点击）回调：高亮+滚动 active tile + 联动右侧节点评论串 */
    _onStep: function (idx) {
      for (var i = 0; i < this.tileEls.length; i++) if (this.tileEls[i]) this.tileEls[i].classList.toggle('active', i === idx);
      var te = this.tileEls[idx];
      if (te && te.scrollIntoView) te.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
      if (idx == null || idx < 0) { box.appendChild(el('div', 'rh-hint', '点中间任一节点，在这看 / 写评论')); return; }
      var ev = this.engine.events[idx] || {};
      box.appendChild(el('div', 'rh-node-head', '节点 #' + (idx + 1) + ' · ' + esc(this.engine._stageLabel(ev))));
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
