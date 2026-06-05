/* ============================================================
   Loona 工作台 · 批注/编辑器（S4）
   点任一事件 → 改 4 面（① 文案 ② 节奏 ③ 卡内容 ④ agent 处理）+ 标卡点 + 批注
   + 即改即重播 + 导出"认可的理想链路"JSON。直接改 engine 内存里的 caseObj。
   ============================================================ */
(function (global) {
  'use strict';
  var UI = global.LoonaUI;
  var el = UI.el, esc = UI.esc;

  var Editor = {
    init: function (engine, refs) {
      this.engine = engine;
      this.refs = refs;                  // {editor}
      this.curIdx = -1;
      this._undoStack = []; this._redoStack = [];
      var self = this;
      engine.onSelect = function (idx, ev) { self.select(idx, ev); };
      /* 链路增删改 快捷键：Alt+↑/↓ 移动 · Ctrl/⌘+D 复制 · Delete 删除 · Ctrl/⌘+Z 撤销/重做 */
      document.addEventListener('keydown', function (e) {
        if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
        var mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); e.shiftKey ? self._redo() : self._undo(); return; }
        if (self.curIdx < 0) return;
        if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); self._move(self.curIdx, -1); }
        else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); self._move(self.curIdx, 1); }
        else if (mod && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); self._duplicate(self.curIdx); }
        else if (e.key === 'Delete') { e.preventDefault(); self._delete(self.curIdx); }
      });
      this._renderEmpty();
      return this;
    },

    _renderEmpty: function () {
      this.refs.editor.innerHTML =
        '<div class="empty">← 点左侧时间线任一事件，在这里改它的<br>① 文案　② 节奏　③ 卡内容　④ agent 处理<br><br>并可标【卡点】、写批注、即改即重播、导出 JSON。</div>';
    },

    /* ---------- 选中一个事件 → 建表单 ---------- */
    select: function (idx, ev) {
      this.curIdx = idx;
      if (!ev) ev = this.engine.events[idx];
      if (!ev) { this._renderEmpty(); return; }
      var self = this, box = this.refs.editor;
      box.innerHTML = '';

      /* 头：comp + idx + 卡点 */
      var head = el('div', 'ed-section');
      head.appendChild(el('label', null, '事件 #' + (idx + 1) + ' / ' + this.engine.events.length + '　·　' + esc(ev.comp) + (ev.internal ? '（侧轨）' : '')));
      box.appendChild(head);

      /* 链路增删改按钮已下线（评审态聚焦看/评，不编辑链路）；保留事件↔契约映射 */
      if (global.LoonaConsole && LoonaConsole.contractPanel) {
        var sc = this._section('事件 ↔ 真实 agent 调用契约');
        sc.appendChild(LoonaConsole.contractPanel(ev, this.engine.caseObj));
        box.appendChild(sc);
      }

      /* ① 文案（按事件类型给对应字段） */
      if (ev.comp === 'user_query' || ev.comp === 'toast') {
        var s1 = this._section(ev.comp === 'toast' ? '① 文案（toast 文字）' : '① 文案（用户气泡）');
        s1.appendChild(this._field('文字', ev.text || '', function (v) { ev.text = v; }, true));
        box.appendChild(s1);
      } else if (ev.comp === 'pop_small') {
        var s1 = this._section('① 文案');
        s1.appendChild(this._field('屏幕气泡文字', ev.text || '', function (v) { ev.text = v; }, true));
        s1.appendChild(this._field('口播 TTS（留空则不念）', (ev.tts && ev.tts.text) || '', function (v) { ev.tts = ev.tts || {}; ev.tts.text = v; }, true));
        box.appendChild(s1);
      } else if (ev.comp === 'tts') {
        var s1 = this._section('① 口播 TTS');
        s1.appendChild(this._field('口播文字（会被念出 + 显示为字幕）', ev.text || '', function (v) { ev.text = v; }, true));
        this._ttsSaveRow(s1, idx, ev);
        box.appendChild(s1);
      }

      /* ② 节奏 */
      var s2 = this._section('② 节奏（时序）');
      var rhythmRow = el('div', 'ed-row');
      rhythmRow.appendChild(this._numCell('gap_ms（距上一步）', ev.gap_ms != null ? ev.gap_ms : '', function (v) { ev.gap_ms = v === '' ? null : +v; }));
      rhythmRow.appendChild(this._numCell('t（时间线标签）', ev.t != null ? ev.t : '', function (v) { ev.t = v === '' ? null : +v; }));
      s2.appendChild(rhythmRow);
      s2.appendChild(this._checkbox('wait_for_user（停等用户）', !!ev.wait_for_user, function (v) { ev.wait_for_user = v; }));
      if (ev.comp === 'tts') {
        var ids = this._cardIds();
        s2.appendChild(this._select('highlight 高亮哪张卡', ['（无）'].concat(ids), ev.highlight || '（无）', function (v) { ev.highlight = (v === '（无）') ? null : v; }));
      }
      if (ev.comp === 'toast') s2.appendChild(this._select('dismiss_on（何时消失）', ['（不自动）', 'card'], ev.dismiss_on || '（不自动）', function (v) { ev.dismiss_on = (v === '（不自动）') ? null : v; }));
      box.appendChild(s2);

      /* ③ 卡内容 */
      if (ev.comp === 'TravelDayCard' || ev.comp === 'card') this._cardEditor(box, ev);
      if (ev.comp === 'TravelStages') this._stagesEditor(box, ev);   // 两阶段：阶段/日卡 即改即在轮播预览
      if (ev.comp === 'confirm' || ev.comp === 'ConfirmationCard') this._confirmEditor(box, ev);
      if (ev.comp === 'pop_small') {
        var s3p = this._section('③ 气泡角色 / 状态');
        s3p.appendChild(this._select('role', ['query', 'clarify', 'status'], ev.role || 'status', function (v) { ev.role = v; }));
        s3p.appendChild(this._select('state_visual（状态图标）', ['（无）', 'searching', 'loading', 'sending', 'done', 'fail', 'mail'], ev.state_visual || '（无）', function (v) { ev.state_visual = v === '（无）' ? null : v; }));
        box.appendChild(s3p);
      }
      if (ev.comp === 'toast') {
        var s3t = this._section('③ 状态图标');
        s3t.appendChild(this._select('state_visual', ['（无）', 'searching', 'loading', 'sending', 'done', 'fail', 'mail'], ev.state_visual || '（无）', function (v) { ev.state_visual = v === '（无）' ? null : v; }));
        box.appendChild(s3t);
      }

      /* ④ agent 处理 */
      if (ev.comp === 'agent_step') {
        var s4 = this._section('④ agent 处理（决策记录 · 侧轨）');
        s4.appendChild(this._field('label', ev.label || '', function (v) { ev.label = v; }));
        s4.appendChild(this._field('decision（怎么判的）', ev.decision || '', function (v) { ev.decision = v; }, true));
        s4.appendChild(this._field('fields（逗号分隔的字段）', (ev.fields || []).join(', '), function (v) { ev.fields = v.split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean); }));
        s4.appendChild(this._checkbox('internal（只进侧轨）', ev.internal !== false, function (v) { ev.internal = v; }));
        box.appendChild(s4);
      }

      /* 标卡点 + 评论讨论（多条，作者 + 时间） */
      var nC = this._comments(idx).length;
      var sa = this._section('卡点 / 评论讨论' + (nC ? '（💬 ' + nC + '）' : ''));
      var flagBtn = el('button', 'ed-flag-btn' + (this._hasAnn(idx, '卡点') ? ' on' : ''), (this._hasAnn(idx, '卡点') ? '🚩 已标卡点（点击取消）' : '🚩 标记为卡点'));
      flagBtn.addEventListener('click', function () { self._toggleAnn(idx, '卡点'); flagBtn.classList.toggle('on'); flagBtn.textContent = self._hasAnn(idx, '卡点') ? '🚩 已标卡点（点击取消）' : '🚩 标记为卡点'; });
      var flagWrap = el('div', 'ed-actions'); flagWrap.appendChild(flagBtn); sa.appendChild(flagWrap);
      sa.appendChild(this._commentThread(idx));
      box.appendChild(sa);

      /* 操作 */
      var act = this._section('即改即播 / 导出');
      var actRow = el('div', 'ed-actions');
      var prevBtn = el('button', 'ed-flag-btn', '↻ 预览本步');
      prevBtn.addEventListener('click', function () { self.previewStep(idx); });
      var playBtn = el('button', 'ed-flag-btn', '▶ 从此处播');
      playBtn.addEventListener('click', function () { self.engine.seekTo(Math.max(0, idx) - 1 < 0 ? 0 : idx - 1); self.engine.idx = idx; self.engine.play(); });
      actRow.appendChild(prevBtn); actRow.appendChild(playBtn);
      act.appendChild(actRow);
      var expBtn = el('button', 'ctrl-btn primary', '⬇ 导出理想链路 JSON');
      expBtn.style.width = '100%'; expBtn.style.marginTop = '8px';
      expBtn.addEventListener('click', function () { self.exportJSON(); });
      act.appendChild(expBtn);
      var applied = el('div', 'ed-applied', '✓ 已写回内存（导出即得最新链路）');
      act.appendChild(applied); box._applied = applied;
      box.appendChild(act);
    },

    /* ---------- ① TTS 文案 · 本地保存 / 恢复原文（持久化到 localStorage，刷新 / 重选 case 仍在） ---------- */
    _ttsSaveRow: function (section, idx, ev) {
      var self = this, CON = global.LoonaConsole;
      var row = el('div', 'ed-actions');
      var saveBtn = el('button', 'ed-flag-btn', '💾 保存文案到本地');
      var resetBtn = el('button', 'ed-flag-btn', '↩ 恢复原文');
      var hint = el('div', 'ed-applied');
      function refresh() {
        var on = !!(CON && CON.hasTtsOverride && CON.hasTtsOverride(idx));
        if (on) { hint.textContent = '✓ 已保存到本地（刷新 / 重选 case 仍在）'; hint.classList.add('show'); resetBtn.style.display = ''; }
        else { hint.textContent = ''; hint.classList.remove('show'); resetBtn.style.display = 'none'; }
      }
      saveBtn.addEventListener('click', function () {
        if (CON && CON.saveTtsOverride) CON.saveTtsOverride(idx, ev.text || '');
        refresh();
        if (CON && CON.toast) CON.toast('TTS 文案已保存到本地');
      });
      resetBtn.addEventListener('click', function () {
        var id = (CON && CON.curCaseId) || (self.engine.caseObj && self.engine.caseObj.task_id);
        var base = global.LOONA_CASES && global.LOONA_CASES[id];
        var orig = (base && base.events && base.events[idx] && base.events[idx].text) || '';
        ev.text = orig;
        if (CON && CON.clearTtsOverride) CON.clearTtsOverride(idx);
        self.select(idx);        // 重渲面板：输入框回到原文
        self.previewStep(idx);   // 念一遍原文确认
        if (CON && CON.toast) CON.toast('已恢复原文');
      });
      row.appendChild(saveBtn); row.appendChild(resetBtn);
      section.appendChild(row); section.appendChild(hint);
      refresh();
    },

    /* ---------- ③ TravelDayCard 编辑 ---------- */
    _cardEditor: function (box, ev) {
      var self = this, c = ev.content = ev.content || {};
      var s = this._section('③ 卡内容 · TravelDayCard');
      var r1 = el('div', 'ed-row');
      r1.appendChild(this._numCell('day', c.day != null ? c.day : '', function (v) { c.day = +v; self._touchRow(); }));
      var paceCell = el('div'); paceCell.appendChild(el('span', 'mini-label', 'pace'));
      paceCell.appendChild(this._rawSelect(['light', 'normal', 'intense'], c.pace || 'normal', function (v) { c.pace = v; }));
      r1.appendChild(paceCell);
      s.appendChild(r1);
      s.appendChild(this._field('theme 主题', c.theme || '', function (v) { c.theme = v; self._touchRow(); }));
      s.appendChild(this._field('transport_notes 交通', c.transport_notes || '', function (v) { c.transport_notes = v; }));
      s.appendChild(this._field('weather_notes 天气', c.weather_notes || '', function (v) { c.weather_notes = v; }));

      // 节点列表（含「可改」开关）
      var nl = el('div'); nl.appendChild(el('span', 'mini-label', 'nodes 节点（勾=可改）'));
      var listWrap = el('div', 'ed-nodes');
      c.nodes = c.nodes || []; c.modifiable_nodes = c.modifiable_nodes || [];
      function redraw() {
        listWrap.innerHTML = '';
        c.nodes.forEach(function (name, ni) {
          var row = el('div', 'ed-node-row');
          var inp = el('input', 'ed-input'); inp.value = name;
          inp.addEventListener('input', function () {
            var old = c.nodes[ni]; c.nodes[ni] = inp.value;
            var mi = c.modifiable_nodes.indexOf(old); if (mi >= 0) c.modifiable_nodes[mi] = inp.value;
          });
          var modLbl = el('label'); modLbl.style.cssText = 'display:flex;align-items:center;gap:3px;font-size:11px;color:var(--wb-text-dim)';
          var cb = el('input'); cb.type = 'checkbox'; cb.checked = c.modifiable_nodes.indexOf(name) >= 0;
          cb.addEventListener('change', function () { var cur = c.nodes[ni]; var mi = c.modifiable_nodes.indexOf(cur); if (cb.checked && mi < 0) c.modifiable_nodes.push(cur); else if (!cb.checked && mi >= 0) c.modifiable_nodes.splice(mi, 1); });
          modLbl.appendChild(cb); modLbl.appendChild(document.createTextNode('可改'));
          var x = el('button', 'x', '✕'); x.addEventListener('click', function () { c.nodes.splice(ni, 1); redraw(); });
          row.appendChild(inp); row.appendChild(modLbl); row.appendChild(x);
          listWrap.appendChild(row);
        });
      }
      redraw();
      nl.appendChild(listWrap);
      var add = el('button', 'ed-add', '+ 加一个节点');
      add.addEventListener('click', function () { c.nodes.push('新节点'); redraw(); });
      nl.appendChild(add);
      s.appendChild(nl);
      box.appendChild(s);
    },

    /* ---------- ③ TravelStages 编辑（阶段含多天）：改任一字段即在轮播实时预览 ---------- */
    _stagesEditor: function (box, ev) {
      var self = this, c = ev.content = ev.content || {};
      var stages = c.stages = c.stages || [];
      var prev = function (target) { if (self.engine.previewStages) self.engine.previewStages(ev, target); };
      var sec = this._section('③ 卡内容 · 阶段 / 日卡（即改即在中间轮播预览）');
      stages.forEach(function (s, si) {
        var sb = el('div', 'ed-stage');
        var hd = el('div', 'ed-stage-hd');
        hd.appendChild(el('span', 'ed-stage-lb', '阶段 ' + (si + 1)));
        var look = el('button', 'ed-mini-btn', '👁 看封面');
        look.addEventListener('click', function () { prev({ stage: s.id }); });
        hd.appendChild(look); sb.appendChild(hd);
        sb.appendChild(self._field('阶段标题', s.title || '', function (v) { s.title = v; prev({ stage: s.id }); }));
        sb.appendChild(self._field('卖点钩子 hook（标题下一句安利）', s.hook || '', function (v) { s.hook = v; prev({ stage: s.id }); }));
        sb.appendChild(self._field('封面图 photo', s.photo || '', function (v) { s.photo = v; prev({ stage: s.id }); }));
        sb.appendChild(self._field('tag（逗号分隔，建议用澄清关键词）', (s.tags || []).join('，'), function (v) {
          s.tags = v.split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean); prev({ stage: s.id });
        }));
        (s.days = s.days || []).forEach(function (d, di) {
          var db = el('div', 'ed-day');
          var dh = el('div', 'ed-stage-hd');
          dh.appendChild(el('span', 'ed-day-lb', d.label || ('Day ' + (di + 1))));
          var dlook = el('button', 'ed-mini-btn', '👁 看这天');
          dlook.addEventListener('click', function () { prev({ day: d.id }); });
          dh.appendChild(dlook); db.appendChild(dh);
          db.appendChild(self._field('日卡标题 label', d.label || '', function (v) { d.label = v; prev({ day: d.id }); }));
          var pw = el('div'); pw.style.marginBottom = '8px'; pw.appendChild(el('span', 'mini-label', 'pace 节奏'));
          pw.appendChild(self._rawSelect(['light', 'normal', 'intense'], d.pace || 'normal', function (v) { d.pace = v; prev({ day: d.id }); }));
          db.appendChild(pw);
          db.appendChild(self._field('封面图 photo', d.photo || '', function (v) { d.photo = v; prev({ day: d.id }); }));
          db.appendChild(self._field('一句脚注 footer', d.footer || '', function (v) { d.footer = v; prev({ day: d.id }); }));
          var nl = el('div'); nl.appendChild(el('span', 'mini-label', '节点（时段 / 地点 / note）'));
          self._dayNodesEditor(nl, d, function () { prev({ day: d.id }); });
          db.appendChild(nl);
          sb.appendChild(db);
        });
        sec.appendChild(sb);
      });
      box.appendChild(sec);
    },
    _dayNodesEditor: function (container, day, onChange) {
      var nodes = day.nodes = day.nodes || [];
      var list = el('div', 'ed-nodes');
      function redraw() {
        list.innerHTML = '';
        nodes.forEach(function (nd, ni) {
          var row = el('div', 'ed-node-row3');
          function inp(cls, key, ph) { var i = el('input', 'ed-input ' + cls); i.value = nd[key] || ''; i.placeholder = ph; i.addEventListener('input', function () { nd[key] = i.value; onChange(); }); return i; }
          row.appendChild(inp('ed-node-t', 'time', '上午'));
          row.appendChild(inp('ed-node-p', 'place', '地点'));
          row.appendChild(inp('ed-node-n', 'note', 'note'));
          var x = el('button', 'x', '✕'); x.addEventListener('click', function () { nodes.splice(ni, 1); redraw(); onChange(); });
          row.appendChild(x); list.appendChild(row);
        });
      }
      redraw();
      container.appendChild(list);
      var add = el('button', 'ed-add', '+ 加一个节点');
      add.addEventListener('click', function () { nodes.push({ time: '上午', place: '新地点', note: '' }); redraw(); onChange(); });
      container.appendChild(add);
    },

    /* ---------- ③ ConfirmationCard 编辑 ---------- */
    _confirmEditor: function (box, ev) {
      var c = ev.content = ev.content || {};
      var s0 = this._section('① 口播 TTS（确认前提示）');
      s0.appendChild(this._field('口播文字', (ev.tts && ev.tts.text) || '', function (v) { ev.tts = ev.tts || {}; ev.tts.text = v; }, true));
      box.appendChild(s0);
      var s = this._section('③ 卡内容 · 确认门');
      s.appendChild(this._field('action 动作', c.action || '', function (v) { c.action = v; }));
      s.appendChild(this._field('target 对象', c.target || '', function (v) { c.target = v; }));
      s.appendChild(this._field('impact 影响', c.impact || '', function (v) { c.impact = v; }));
      s.appendChild(this._field('content_summary 内容摘要', c.content_summary || '', function (v) { c.content_summary = v; }));
      var r = el('div', 'ed-row');
      r.appendChild(this._numCell('countdown 秒', c.countdown != null ? c.countdown : 30, function (v) { c.countdown = +v; }));
      var revCell = el('div'); revCell.appendChild(el('span', 'mini-label', 'reversible'));
      revCell.appendChild(this._rawSelect(['true', 'false'], String(c.reversible !== false), function (v) { c.reversible = (v === 'true'); }));
      r.appendChild(revCell);
      s.appendChild(r);
      box.appendChild(s);
    },

    /* ---------- 预览 / 重播 ---------- */
    previewStep: function (idx) {
      this.engine.seekTo(idx);
      var ev = this.engine.events[idx];
      var tp = this.engine._ttsOf(ev);
      if (tp && tp.text) { if (tp.highlight) this.engine._highlightCard(tp.highlight); this.engine._speak(tp.text, tp); }
      this._flashApplied();
    },
    _touchRow: function () { this.engine.rebuildTimeline(); this.engine._setCurrent(this.curIdx); },
    _flashApplied: function () { var a = this.refs.editor._applied; if (a) { a.classList.add('show'); setTimeout(function () { a.classList.remove('show'); }, 1400); } },

    /* ---------- 导出 ---------- */
    exportJSON: function () {
      var data = this.engine.caseObj;
      var clean = JSON.parse(JSON.stringify(data));
      if (global.LoonaConsole && LoonaConsole.resolveAnnotations) clean.annotations_resolved = LoonaConsole.resolveAnnotations(clean);   // 标注自描述带走（事件号/类型/原文）
      var blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = (data.task_id || 'loona_case') + '.ideal_chain.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      this._flashApplied();
    },

    /* ---------- 批注模型（卡点 = 标记；评论 = 多条讨论，向后兼容旧 note） ---------- */
    _anns: function () { var c = this.engine.caseObj; return (c.annotations = c.annotations || []); },
    _hasAnn: function (idx, type) { return this._anns().some(function (a) { return a.event_idx === idx && a.type === type; }); },
    _toggleAnn: function (idx, type) {
      var arr = this._anns(), i = arr.findIndex(function (a) { return a.event_idx === idx && a.type === type; });
      if (i >= 0) { var removed = arr[i]; arr.splice(i, 1); if (global.LoonaCommentSync) LoonaCommentSync.notifyRemove(removed); }
      else { var ann = { event_idx: idx, type: type, text: '', id: 'k' + Date.now().toString(36) }; arr.push(ann); if (global.LoonaCommentSync) LoonaCommentSync.notifyAdd(ann); }
      this.engine.refreshRowFlags();
    },
    _comments: function (idx) {
      return this._anns().filter(function (a) { return a.event_idx === idx && (a.type === 'comment' || a.type === 'note'); });
    },
    _addComment: function (idx, text, author) {
      var ann = { event_idx: idx, type: 'comment', text: text, author: author || this._author(), at: new Date().toISOString(), id: 'c' + Date.now().toString(36) };
      this._anns().push(ann);
      if (global.LoonaCommentSync) LoonaCommentSync.notifyAdd(ann);
      this.engine.refreshRowFlags(); this._flashApplied();
    },
    _deleteComment: function (ann) {
      var arr = this._anns(), i = arr.indexOf(ann); if (i >= 0) arr.splice(i, 1);
      if (global.LoonaCommentSync) LoonaCommentSync.notifyRemove(ann);
      this.engine.refreshRowFlags(); this._flashApplied();
    },
    /* 远程评论变更后由 CommentSync 回调：当前若展开着某步且没在输入，则原地重渲评论串 */
    refreshOpenThread: function () {
      if (this.curIdx >= 0 && this.engine.events[this.curIdx]) this.select(this.curIdx);
    },
    _author: function () { try { return (global.localStorage && localStorage.getItem('loona_review_author')) || '我'; } catch (e) { return '我'; } },
    _setAuthor: function (v) { try { if (global.localStorage) localStorage.setItem('loona_review_author', v || '我'); } catch (e) {} },
    _relTime: function (iso) {
      if (!iso) return '';
      var t = Date.parse(iso); if (isNaN(t)) return '';
      var s = Math.floor((Date.now() - t) / 1000);
      if (s < 60) return '刚刚';
      if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
      if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
      var d = new Date(t);
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    },
    /* 评论讨论串：已有评论列表（作者/时间/删除）+ 署名 + 发表框（⌘/Ctrl+Enter） */
    _commentThread: function (idx) {
      var self = this;
      var wrap = el('div', 'ed-thread');
      var list = el('div', 'cmt-list'); wrap.appendChild(list);
      function redraw() {
        list.innerHTML = '';
        var cs = self._comments(idx);
        if (!cs.length) { list.appendChild(el('div', 'cmt-empty', '还没有评论。写下设计意见 / 待改 / 讨论…')); }
        cs.forEach(function (a) {
          var item = el('div', 'cmt-item');
          var head = el('div', 'cmt-head');
          head.appendChild(el('span', 'cmt-author', esc(a.author || '匿名')));
          head.appendChild(el('span', 'cmt-time', esc(self._relTime(a.at))));
          var del = el('button', 'cmt-del', '✕'); del.title = '删除这条评论';
          del.addEventListener('click', function () { self._deleteComment(a); self.select(idx); });
          head.appendChild(del);
          item.appendChild(head);
          item.appendChild(el('div', 'cmt-text', esc(a.text)));
          list.appendChild(item);
        });
      }
      redraw();
      var authorRow = el('div', 'cmt-author-row');
      authorRow.appendChild(el('span', 'mini-label', '署名'));
      var who = el('input', 'ed-input cmt-who'); who.value = self._author(); who.placeholder = '你的名字';
      who.addEventListener('change', function () { self._setAuthor(who.value.trim()); });
      authorRow.appendChild(who);
      wrap.appendChild(authorRow);
      var ta = el('textarea', 'ed-textarea cmt-input'); ta.placeholder = '写一条评论…（⌘/Ctrl+Enter 发表）';
      wrap.appendChild(ta);
      var send = el('button', 'ctrl-btn primary cmt-send', '发表评论');
      send.addEventListener('click', function () {
        var t = ta.value.trim(); if (!t) return;
        self._addComment(idx, t, who.value.trim() || '匿名');
        ta.value = ''; redraw();
        var sec = wrap.closest ? wrap.closest('.ed-section') : null;
        if (sec) { var lbl = sec.querySelector('label'); if (lbl) lbl.textContent = '卡点 / 评论讨论（💬 ' + self._comments(idx).length + '）'; }
      });
      ta.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send.click(); } });
      wrap.appendChild(send);
      return wrap;
    },

    /* ---------- 表单零件 ---------- */
    _section: function (title) { var s = el('div', 'ed-section'); if (title) s.appendChild(el('label', null, title)); return s; },
    _lastSection: function (box) { var ss = box.querySelectorAll('.ed-section'); return ss[ss.length - 1] || this._section(); },
    _field: function (label, val, onInput, multiline) {
      var wrap = el('div'); wrap.style.marginBottom = '8px';
      if (label) wrap.appendChild(el('span', 'mini-label', esc(label)));
      var inp = el(multiline ? 'textarea' : 'input', multiline ? 'ed-textarea' : 'ed-input');
      inp.value = val == null ? '' : val;
      var self = this;
      inp.addEventListener('input', function () { onInput(inp.value); self._liveTimeline(); });
      wrap.appendChild(inp); return wrap;
    },
    _numCell: function (label, val, onInput) {
      var cell = el('div'); cell.appendChild(el('span', 'mini-label', esc(label)));
      var inp = el('input', 'ed-num'); inp.type = 'number'; inp.value = val === '' ? '' : val;
      var self = this;
      inp.addEventListener('input', function () { onInput(inp.value); self._liveTimeline(); });
      cell.appendChild(inp); return cell;
    },
    _checkbox: function (label, checked, onChange) {
      var lab = el('label'); lab.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;color:var(--wb-text);margin:6px 0';
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!checked;
      var self = this;
      cb.addEventListener('change', function () { onChange(cb.checked); self._liveTimeline(); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(label)); return lab;
    },
    _select: function (label, opts, val, onChange) {
      var wrap = el('div'); wrap.style.marginBottom = '8px';
      wrap.appendChild(el('span', 'mini-label', esc(label)));
      wrap.appendChild(this._rawSelect(opts, val, onChange));
      return wrap;
    },
    _rawSelect: function (opts, val, onChange) {
      var sel = el('select', 'ed-pace-sel');
      opts.forEach(function (o) { var op = el('option', null, esc(o)); op.value = o; if (o === val) op.selected = true; sel.appendChild(op); });
      var self = this;
      sel.addEventListener('change', function () { onChange(sel.value); self._liveTimeline(); });
      return sel;
    },
    _cardIds: function () { var ids = []; this.engine.events.forEach(function (e) { if (e.card_id) ids.push(e.card_id); }); return ids; },
    _liveTimeline: function () {
      // 实时把改动反映到左侧时间线那一行 + 标记已写回
      var r = this.engine.refs.timeline.querySelector('.tl-event[data-idx="' + this.curIdx + '"]');
      if (r) { var fresh = this.engine._timelineRow(this.engine.events[this.curIdx], this.curIdx); r.replaceWith(fresh); fresh.classList.add('current'); }
      this._flashApplied();
    },

    /* ============ 链路增删改（控制台核心） ============ */
    _chainOps: function (box, idx) {
      var self = this, n = this.engine.events.length;
      var s = this._section('链路 · 增删改（Alt+↑↓ 移动 · ⌘D 复制 · Del 删除 · ⌘Z 撤销）');
      s.classList.add('chain-section');
      function btn(label, ico, fn, danger, dis) {
        var b = el('button', 'co-btn' + (danger ? ' danger' : ''));
        b.innerHTML = '<span class="ico">' + ico + '</span>' + label; if (dis) b.disabled = true;
        b.addEventListener('click', fn); return b;
      }
      var row1 = el('div', 'chain-ops');
      row1.appendChild(btn('上移', '↑', function () { self._move(idx, -1); }, false, idx <= 0));
      row1.appendChild(btn('下移', '↓', function () { self._move(idx, 1); }, false, idx >= n - 1));
      row1.appendChild(btn('复制', '⧉', function () { self._duplicate(idx); }));
      row1.appendChild(btn('删除', '✕', function () { self._delete(idx); }, true, n <= 1));
      s.appendChild(row1);
      var row2 = el('div', 'chain-ops');
      row2.appendChild(btn('上方插入', '⤒', function () { self._togglePicker(s, idx, 'above'); }));
      row2.appendChild(btn('下方插入', '⤓', function () { self._togglePicker(s, idx, 'below'); }));
      row2.appendChild(btn('撤销', '↺', function () { self._undo(); }, false, !self._undoStack.length));
      row2.appendChild(btn('重做', '↻', function () { self._redo(); }, false, !self._redoStack.length));
      s.appendChild(row2);
      box.appendChild(s);
    },
    _togglePicker: function (section, idx, where) {
      var self = this, old = section.querySelector('.ins-pop'); if (old) { old.remove(); return; }
      var pop = el('div', 'ins-pop');
      pop.appendChild(el('div', 'ip-title', where === 'above' ? '在上方插入一个事件' : '在下方插入一个事件'));
      var types = [['user_query', '用户'], ['agent_step', 'agent 决策'], ['tts', '口播 TTS'], ['toast', '状态 toast'],
        ['ClarifyCard', '澄清卡'], ['ListCard', '列表卡'], ['SubjectCard', '主体卡'], ['SectionCard', '分段卡'], ['confirm', '确认门']];
      types.forEach(function (t) {
        var c = el('span', 'ip-chip', t[1]);
        c.addEventListener('click', function () { self._insert(where === 'above' ? idx : idx + 1, t[0]); });
        pop.appendChild(c);
      });
      section.appendChild(pop);
    },
    _newEvent: function (comp) {
      var uid = comp.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) + '_' + (Date.now() % 10000);
      switch (comp) {
        case 'user_query': return { comp: 'user_query', text: '用户说的话…', gap_ms: 300 };
        case 'agent_step': return { comp: 'agent_step', internal: true, label: 'STEP', decision: 'agent 怎么判的…', fields: [], gap_ms: 200 };
        case 'tts': return { comp: 'tts', text: '口播一句…', pace: 'mid', gap_ms: 300 };
        case 'toast': return { comp: 'toast', text: '正在…', state_visual: 'loading', dismiss_on: 'card', gap_ms: 200 };
        case 'ClarifyCard': return { comp: 'ClarifyCard', card_id: uid, wait_for_user: true, tts: { text: '要补点什么吗？', pace: 'mid' }, content: { question: '想先确认一下：要补 X 吗？不补我按默认走。', options: [{ label: '直接来' }, { label: '我补一下' }] }, gap_ms: 300 };
        case 'ListCard': return { comp: 'ListCard', card_id: uid, visual_state: 'active', content: { title: '列表标题', rows: [{ lead: 'dot', title: '第一行' }, { lead: 'dot', title: '第二行' }] }, gap_ms: 600 };
        case 'SubjectCard': return { comp: 'SubjectCard', card_id: uid, visual_state: 'active', content: { title: '主体', headline: '一句主张/结论', meta: '附加信息', tags: [] }, gap_ms: 600 };
        case 'SectionCard': return { comp: 'SectionCard', card_id: uid, visual_state: 'active', content: { title: '分段标题', sections: [{ id: 's1', label: '第一段', text: '内容…' }] }, gap_ms: 600 };
        case 'confirm': return { comp: 'confirm', card_id: uid, wait_for_user: true, tts: { text: '要确认执行吗？', pace: 'mid' }, content: { action: '动作', target: '对象', impact: '影响', content_summary: '内容摘要', reversible: false, countdown: 30, confirm_label: '确认', cancel_label: '取消' }, gap_ms: 400 };
        default: return { comp: comp, gap_ms: 300 };
      }
    },
    _insert: function (at, comp) { this._pushUndo(); this.engine.events.splice(at, 0, this._newEvent(comp)); this._afterMutate(at, '已插入 ' + comp); },
    _delete: function (idx) {
      if (this.engine.events.length <= 1) return;
      this._pushUndo();
      this.engine.events.splice(idx, 1);
      this._afterMutate(Math.min(idx, this.engine.events.length - 1), '已删除事件 #' + (idx + 1) + '（⌘Z 撤销）');
    },
    _move: function (idx, dir) {
      var j = idx + dir, ev = this.engine.events; if (j < 0 || j >= ev.length) return;
      this._pushUndo(); var t = ev[idx]; ev[idx] = ev[j]; ev[j] = t; this._afterMutate(j, null);
    },
    _duplicate: function (idx) {
      this._pushUndo();
      var copy = JSON.parse(JSON.stringify(this.engine.events[idx]));
      if (copy.card_id) copy.card_id += '_c' + (Date.now() % 1000);
      this.engine.events.splice(idx + 1, 0, copy);
      this._afterMutate(idx + 1, '已复制事件');
    },
    _pushUndo: function () { this._undoStack.push(JSON.stringify(this.engine.events)); if (this._undoStack.length > 60) this._undoStack.shift(); this._redoStack.length = 0; },
    _undo: function () { if (!this._undoStack.length) return; this._redoStack.push(JSON.stringify(this.engine.events)); this._restoreEvents(JSON.parse(this._undoStack.pop()), '已撤销'); },
    _redo: function () { if (!this._redoStack.length) return; this._undoStack.push(JSON.stringify(this.engine.events)); this._restoreEvents(JSON.parse(this._redoStack.pop()), '已重做'); },
    _restoreEvents: function (arr, msg) {
      var ev = this.engine.events; ev.length = 0; for (var i = 0; i < arr.length; i++) ev.push(arr[i]);
      this._afterMutate(Math.min(this.curIdx, ev.length - 1), msg);
    },
    _afterMutate: function (selIdx, msg) {
      this.engine.rebuildTimeline();
      var tc = document.getElementById('tlCount'); if (tc) tc.textContent = this.engine.events.length + ' 步';
      selIdx = Math.max(0, Math.min(selIdx, this.engine.events.length - 1));
      this.engine.seekTo(selIdx);   // 重建画面 + onSelect → 重建本编辑面板（含新链路状态）
      if (msg && global.LoonaConsole && LoonaConsole.toast) LoonaConsole.toast(msg);
    }
  };

  global.LoonaEditor = Editor;
})(window);
