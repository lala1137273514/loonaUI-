/* ============================================================
   Loona 协作控制台（S4+）— 变体管理 / 事件↔契约映射 / 并排对比 / 导出分享
   零依赖；与 engine + editor 协作。engine.caseObj = 当前“工作链”(live, 可编辑)；
   variants[task_id] = 命名快照列表（[0]=原始链路）。链路增删改在 editor.js。
   ============================================================ */
(function (global) {
  'use strict';
  var UI = global.LoonaUI;
  var el = UI.el, esc = UI.esc;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- 事件 ↔ 真实 agent 调用契约 映射（03_AGENT_CARD_CONTRACT） ---------- */
  function parseFields(fields) {
    var out = {};
    (fields || []).forEach(function (raw) {
      var t = String(raw).trim();
      var m = t.split(/[:：]/);
      if (m.length >= 2) { out[m[0].trim()] = m.slice(1).join(':').trim(); return; }
      if (/^E\d/i.test(t)) out.evidence = t.toUpperCase();
      else if (/^R[0-4]\b/.test(t)) out.risk = t.slice(0, 2);
      else if (/^A[0-4]/.test(t) || /A[≤<]?A?1/.test(t)) out.proactivity = t;
      else out[t] = true;
    });
    return out;
  }
  function isCardComp(comp) { return !!(UI.CARD_BUILDERS && UI.CARD_BUILDERS[comp]) || comp === 'card'; }
  function contractOf(ev, caseObj) {
    var dr = (caseObj && caseObj.decision_record) || {};
    var f = parseFields(ev.fields);
    var frame = ev.comp, fkind = 'frame';
    switch (ev.comp) {
      case 'user_query': frame = 'USER · ASR'; fkind = 'user'; break;
      case 'agent_step': frame = (/ROUTER/i.test(ev.label || '') ? 'ROUTER' : (/DECISION/i.test(ev.label || '') ? 'DECISION_RECORD' : 'agent_step')); fkind = 'frame'; break;
      case 'tts': frame = 'delta · 口播'; fkind = 'delta'; break;
      case 'toast': frame = 'TOOL_CALL'; fkind = 'tool'; break;
      case 'pop_small': frame = (ev.role === 'clarify' ? 'AGENT_CARD · clarify' : 'delta'); fkind = (ev.role === 'clarify' ? 'card' : 'delta'); break;
      case 'confirm': case 'ConfirmationCard': frame = 'AGENT_CARD · confirm'; fkind = 'card'; break;
      case 'ClarifyCard': frame = 'AGENT_CARD · clarify'; fkind = 'card'; break;
      default: if (isCardComp(ev.comp)) { frame = 'AGENT_CARD'; fkind = 'card'; }
    }
    var isGate = (ev.comp === 'confirm' || ev.comp === 'ConfirmationCard');       // 这一步本身就是确认门
    var evidence = f.evidence || (ev.content && ev.content.evidence_level) || (ev.comp === 'agent_step' ? dr.evidence_level : null) || null;
    // 风险按“本步”取：显式 fields/content > 确认门=R3 > agent_step 继承 turn 级 dr > 其余(结果/口播/读取)=R0。
    // 关键修复：不让 turn 级 dr.action_risk / dr.confirmation_required 污染只读结果卡（否则误标“需确认”）。
    var risk = f.risk || (ev.content && ev.content.action_risk) || (isGate ? 'R3' : null) || (ev.comp === 'agent_step' ? dr.action_risk : null) || 'R0';
    var confirmRequired = isGate || /R[34]/.test(risk); // 仅“本步是确认门”或“本步是 R3+ 动作”才需确认
    var tool = f.tool || (ev.comp === 'toast' ? (ev.state_visual === 'sending' ? 'send' : 'query') : null);
    var mode = (ev.comp === 'confirm' || ev.comp === 'ConfirmationCard') ? 'confirm'
      : (ev.comp === 'ClarifyCard' || (ev.comp === 'pop_small' && ev.role === 'clarify')) ? 'clarify' : null;
    return { frame: frame, fkind: fkind, evidence: evidence, risk: risk, confirm: isGate, confirmRequired: confirmRequired, tool: tool, mode: mode,
      output_mode: dr.output_mode, request_type: dr.request_type };
  }
  function riskClass(r) { return r ? ('ct-' + r.toLowerCase().slice(0, 2)) : 'ct-r0'; }
  /* 实时契约校验（spec 不变量）：
     · R3+ 动作必须有确认门
     · E0/E1 低证据不应直接出结果/动作
     · E4 私域数据(read_private_data)全链须有授权声明(OAuth/已连)
     · 外发动作(发送/外发)收件人必须明确，不空、不纯占位 */
  function chainHasGate(caseObj) { return !!(caseObj && (caseObj.events || []).some(function (e) { return e.comp === 'confirm' || e.comp === 'ConfirmationCard'; })); }
  function chainDeclaresAuth(caseObj) {
    return !!(caseObj && (caseObj.events || []).some(function (e) {
      var s = (e.decision || '') + ' ' + ((e.fields || []).join(' ')) + ' ' + (e.text || '');
      return /OAuth|授权|已连|已登录|consent|凭证/i.test(s);
    }));
  }
  function validateStep(ev, caseObj) {
    var c = contractOf(ev, caseObj), w = [];
    var dr = (caseObj && caseObj.decision_record) || {};
    if (c.confirmRequired && !chainHasGate(caseObj)) w.push('R3+ 全链缺确认门');
    if ((c.evidence === 'E0' || c.evidence === 'E1') && (c.tool || isCardComp(ev.comp))) w.push(c.evidence + ' 低证据仍出结果');
    if (dr.tool_plan === 'read_private_data' && ev.comp === 'toast' && !chainDeclaresAuth(caseObj)) w.push('私域数据·未见授权声明');
    if (c.confirm) {
      var act = (ev.content && ev.content.action) || '';
      if (/发送|外发|发出/.test(act)) {
        var tgt = ((ev.content && ev.content.target) || '').trim();
        if (!tgt || /^(待[填定指].*|未指定|待定|空)$/.test(tgt)) w.push('外发·收件人未明确');
      }
    }
    return w;
  }
  /* 把批注解析成自描述结构（导出可读：带事件号/类型/原文） */
  function resolveAnnotations(caseObj) {
    var evs = (caseObj && caseObj.events) || [];
    return ((caseObj && caseObj.annotations) || []).map(function (a) {
      var ev = evs[a.event_idx] || {};
      return { event_idx: a.event_idx, type: a.type, text: a.text || '', event_comp: ev.comp || null, event_text: textOf(ev) };
    });
  }
  /* 链路契约“体检表”：最高风险 / 确认门数 / 低证据步 / 工具调用 / 步数（对比择优用） */
  function scorecard(caseObj) {
    var s = { maxRisk: 'R0', confirms: 0, lowEv: 0, tools: 0, steps: (caseObj.events || []).length, warns: 0 };
    (caseObj.events || []).forEach(function (ev) {
      var c = contractOf(ev, caseObj);
      if (c.risk && c.risk > s.maxRisk) s.maxRisk = c.risk;
      if (c.confirm) s.confirms++;
      if (c.evidence === 'E0' || c.evidence === 'E1') s.lowEv++;
      if (c.tool) s.tools++;
      if (validateStep(ev, caseObj).length) s.warns++;
    });
    return s;
  }
  /* compact chip row (用于对比里的每步) */
  function chipsFor(ev, caseObj) {
    var c = contractOf(ev, caseObj);
    var wrap = el('div', 'cs-chips');
    wrap.appendChild(el('span', 'ct-chip ct-frame ' + c.fkind, esc(c.frame)));
    if (c.tool) wrap.appendChild(el('span', 'ct-chip ct-tool', esc(c.tool)));
    if (c.evidence) wrap.appendChild(el('span', 'ct-chip ct-ev', esc(c.evidence)));
    if (c.risk) wrap.appendChild(el('span', 'ct-chip ' + riskClass(c.risk), esc(c.risk)));
    if (c.confirm) wrap.appendChild(el('span', 'ct-chip ct-confirm', '确认门'));
    else if (c.confirmRequired) wrap.appendChild(el('span', 'ct-chip ct-needconfirm', '需确认'));
    if (c.mode) wrap.appendChild(el('span', 'ct-chip ct-mode', esc(c.mode)));
    var w = validateStep(ev, caseObj);
    if (w.length) wrap.appendChild(el('span', 'ct-chip ct-warn', '⚠ ' + w[0]));
    return wrap;
  }
  /* 编辑器用：完整契约流面板 */
  function contractPanel(ev, caseObj) {
    var c = contractOf(ev, caseObj);
    var box = el('div', 'contract-panel');
    var flow = el('div', 'ct-flow');
    flow.appendChild(el('span', 'ct-chip ct-frame ' + c.fkind, esc(c.frame)));
    function arrow() { flow.appendChild(el('span', 'ct-arrow', '›')); }
    if (c.tool) { arrow(); flow.appendChild(el('span', 'ct-chip ct-tool', 'tool · ' + esc(c.tool))); }
    if (c.evidence) { arrow(); flow.appendChild(el('span', 'ct-chip ct-ev', 'evidence ' + esc(c.evidence))); }
    if (c.risk) { arrow(); flow.appendChild(el('span', 'ct-chip ' + riskClass(c.risk), 'risk ' + esc(c.risk))); }
    if (c.confirm) { arrow(); flow.appendChild(el('span', 'ct-chip ct-confirm', '确认门')); }
    else if (c.confirmRequired) { arrow(); flow.appendChild(el('span', 'ct-chip ct-needconfirm', '需确认')); }
    if (c.mode) { arrow(); flow.appendChild(el('span', 'ct-chip ct-mode', 'mode · ' + esc(c.mode))); }
    box.appendChild(flow);
    var bits = [];
    if (c.request_type) bits.push('request_type=' + c.request_type);
    if (c.output_mode) bits.push('output_mode=' + c.output_mode);
    var note = el('div', 'ct-note');
    note.innerHTML = '<span class="lbl">真实帧</span> ' + esc(frameHint(ev)) + (bits.length ? ('　·　' + esc(bits.join(' · '))) : '');
    box.appendChild(note);
    var w = validateStep(ev, caseObj);
    if (w.length) { var warn = el('div', 'ct-note'); warn.innerHTML = '<span class="ct-chip ct-warn">⚠ 契约</span> ' + esc(w.join('；')) + '（spec：action_risk≥R3 ⇒ 必须确认门）'; box.appendChild(warn); }
    return box;
  }
  function frameHint(ev) {
    var m = { user_query: '用户语音/输入（非帧）', agent_step: 'DECISION_RECORD（决策侧轨，不上屏）', tts: 'delta 流式口播片段',
      toast: 'TOOL_CALL / TOOL_EVENT（“正在…”存在感）', confirm: 'AGENT_CARD mode=confirm, ok=null（确认门）',
      ConfirmationCard: 'AGENT_CARD mode=confirm, ok=null', ClarifyCard: 'AGENT_CARD mode=clarify（缺槽澄清）',
      pop_small: '状态/澄清 气泡' };
    return m[ev.comp] || 'AGENT_CARD（§7 卡，bridge _augment_agent_card 盖 evidence/risk/source）';
  }
  function textOf(ev) {
    if (ev.text) return ev.text;
    if (ev.tts && ev.tts.text) return ev.tts.text;
    if (ev.decision) return ev.decision;
    var c = ev.content;
    if (c) return c.theme || c.title || c.question || c.action || c.headline || (c.item && c.item.title) || '';
    return '';
  }
  function compLabel(ev) {
    var m = { user_query: '用户', agent_step: 'agent', pop_small: ev.role === 'clarify' ? '澄清' : '气泡',
      toast: 'toast', tts: 'TTS', confirm: '确认门', ConfirmationCard: '确认门', ClarifyCard: '澄清卡' };
    return m[ev.comp] || ev.comp;
  }

  /* ---------- 序列对齐（LCS over comp）→ 差异标注 ---------- */
  function lcsPairs(A, B) {
    var n = A.length, m = B.length, dp = [], i, j;
    for (i = 0; i <= n; i++) { dp[i] = []; for (j = 0; j <= m; j++) dp[i][j] = 0; }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
      dp[i][j] = (A[i] === B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var pairs = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { pairs.push([i, j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    return pairs;
  }
  function diff(evA, evB) {
    var A = evA.map(function (e) { return e.comp; }), B = evB.map(function (e) { return e.comp; });
    var pairs = lcsPairs(A, B);
    var aMatch = {}, bMatch = {}, aToB = {}, bToA = {};
    pairs.forEach(function (p) { aMatch[p[0]] = 1; bMatch[p[1]] = 1; aToB[p[0]] = p[1]; bToA[p[1]] = p[0]; });
    var stat = { aOnly: 0, bOnly: 0, changed: 0, same: 0 };
    var aStat = evA.map(function (e, i) {
      if (!aMatch[i]) { stat.aOnly++; return 'aonly'; }
      var same = textOf(e) === textOf(evB[aToB[i]]);
      if (same) { stat.same++; return 'same'; } stat.changed++; return 'chg';
    });
    var bStat = evB.map(function (e, j) {
      if (!bMatch[j]) { stat.bOnly++; return 'bonly'; }
      return textOf(e) === textOf(evA[bToA[j]]) ? 'same' : 'chg';   // 两列都标“改动”
    });
    return { aStat: aStat, bStat: bStat, stat: stat };
  }

  /* ============================================================ */
  var Console = {
    init: function (engine, refs) {
      this.engine = engine; this.refs = refs;          // {variantBar, btnCompare, cmpOverlay, tlCount}
      this.variants = {};                               // task_id -> [{name, caseObj}]
      this.curCaseId = null; this.curVariant = 0;       // which stored variant the live chain came from
      var self = this;
      if (refs.btnCompare) refs.btnCompare.addEventListener('click', function () { self.openCompare(); });
      document.addEventListener('keydown', function (e) {
        if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
        if (e.key === 'Escape') self.closeCompare();
        else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) self.openCompare();
      });
      return this;
    },
    contractOf: contractOf, contractPanel: contractPanel, chipsFor: chipsFor, resolveAnnotations: resolveAnnotations,  // 给 editor 复用

    /* 中央 case 加载：克隆为 live 工作链（全局 CASES 保持原始），注册原始变体 */
    loadCase: function (id) {
      this.curCaseId = id;
      var base = global.LOONA_CASES[id];
      if (!this.variants[id]) {
        var mk = function (name, events, baked) { var co = clone(base); if (events) co.events = clone(events); delete co.variants; return { name: name, caseObj: co, _baked: !!baked }; };
        var list = [mk(base.variant_name || '原始链路', null, false)];
        (base.variants || []).forEach(function (v) { list.push(mk(v.name, v.events, true)); });   // case 内置的设计变体（如天气 直接版/问城市版）
        this.variants[id] = list.concat(this._restore(id));
      }
      var live = clone(base); delete live.variants;
      this.engine.load(live);
      this.engine.setTheme((base && base.default_skin) || 'glass');
      this.curVariant = 0;
      if (this.refs.tlCount) this.refs.tlCount.textContent = this.engine.events.length + ' 步';
      this.renderBar();
    },
    _list: function () { return this.variants[this.curCaseId] || []; },
    _key: function (id) { return 'loona_variants_' + id; },
    _restore: function (id) { try { return JSON.parse((global.localStorage && localStorage.getItem(this._key(id))) || '[]') || []; } catch (e) { return []; } },
    _persist: function () { try { if (!global.localStorage) return; var list = this._list(), user = []; for (var i = 1; i < list.length; i++) if (!list[i]._baked) user.push({ name: list[i].name, caseObj: list[i].caseObj }); localStorage.setItem(this._key(this.curCaseId), JSON.stringify(user)); } catch (e) {} },   // 内置变体不入 localStorage，避免重复

    fork: function () {
      var name = prompt('把当前工作链存为新变体，命名：', '变体 ' + (this._list().length));
      if (name == null) return;
      this._list().push({ name: name || ('变体 ' + this._list().length), caseObj: clone(this.engine.caseObj) });
      this.curVariant = this._list().length - 1;
      this._persist(); this.renderBar(); this.toast('已存为变体「' + (name || '变体') + '」');
    },
    switchTo: function (i) {
      var v = this._list()[i]; if (!v) return;
      this.engine.load(clone(v.caseObj));
      this.engine.setTheme((v.caseObj && v.caseObj.default_skin) || this.engine.theme || 'glass');
      this.curVariant = i;
      if (this.refs.tlCount) this.refs.tlCount.textContent = this.engine.events.length + ' 步';
      this.renderBar();
      if (global.LoonaEditor && LoonaEditor._renderEmpty) LoonaEditor._renderEmpty();
    },
    rename: function (i) {
      var v = this._list()[i]; if (!v) return;
      var name = prompt('重命名变体：', v.name); if (name == null) return;
      v.name = name || v.name; this._persist(); this.renderBar();
    },
    del: function (i) {
      var list = this._list(); if (list.length <= 1) { this.toast('至少保留一个变体'); return; }
      list.splice(i, 1);
      if (this.curVariant >= list.length) this.curVariant = list.length - 1;
      this._persist(); this.switchTo(this.curVariant);
    },

    renderBar: function () {
      var bar = this.refs.variantBar; if (!bar) return;
      var self = this, list = this._list(), cur = list[this.curVariant] || list[0] || { name: '—' };
      bar.innerHTML = '';
      bar.appendChild(el('span', 'vb-label', '链路'));
      var curBtn = el('button', 'vb-btn');
      curBtn.appendChild(el('span', 'vb-cur', esc(cur.name)));
      curBtn.appendChild(el('span', 'vb-count', list.length));
      curBtn.appendChild(el('span', null, '▾'));
      curBtn.addEventListener('click', function (e) { e.stopPropagation(); self._openMenu(curBtn); });
      bar.appendChild(curBtn);
      var fork = el('button', 'vb-btn accent', '＋ 存为变体');
      fork.addEventListener('click', function () { self.fork(); });
      bar.appendChild(fork);
    },
    _openMenu: function (anchor) {
      var self = this; this._closeMenu();
      var menu = el('div', 'vb-menu'); this._menu = menu;
      this._list().forEach(function (v, i) {
        var item = el('div', 'vb-item' + (i === self.curVariant ? ' cur' : ''));
        var nm = el('span', 'vi-name', esc(v.name)); item.appendChild(nm);
        item.appendChild(el('span', 'vi-steps', (v.caseObj.events || []).length + ' 步'));
        var rn = el('button', 'vi-x', '✎'); rn.title = '重命名';
        rn.addEventListener('click', function (e) { e.stopPropagation(); self._closeMenu(); self.rename(i); });
        item.appendChild(rn);
        if (self._list().length > 1) {
          var x = el('button', 'vi-x', '✕'); x.title = '删除';
          x.addEventListener('click', function (e) { e.stopPropagation(); self.del(i); self._closeMenu(); });
          item.appendChild(x);
        }
        item.addEventListener('click', function () { self.switchTo(i); self._closeMenu(); });
        menu.appendChild(item);
      });
      menu.appendChild(el('div', 'vb-sep'));
      var cmp = el('div', 'vb-item'); cmp.appendChild(el('span', 'vi-name', '⇄ 并排对比变体…'));
      cmp.addEventListener('click', function () { self._closeMenu(); self.openCompare(); });
      menu.appendChild(cmp);
      var exp = el('div', 'vb-item'); exp.appendChild(el('span', 'vi-name', '⬇ 导出全部变体 JSON'));
      exp.addEventListener('click', function () { self._closeMenu(); self.exportAll(); });
      menu.appendChild(exp);
      document.body.appendChild(menu);
      var r = anchor.getBoundingClientRect();
      menu.style.left = Math.min(r.left, innerWidth - menu.offsetWidth - 10) + 'px';
      menu.style.top = (r.bottom + 6) + 'px';
      setTimeout(function () { document.addEventListener('click', self._closeMenuBound = function () { self._closeMenu(); }); }, 0);
    },
    _closeMenu: function () { if (this._menu) { this._menu.remove(); this._menu = null; } if (this._closeMenuBound) { document.removeEventListener('click', this._closeMenuBound); this._closeMenuBound = null; } },

    /* ---------- 并排对比 ---------- */
    openCompare: function () {
      var ov = this.refs.cmpOverlay; if (!ov) return;
      var list = this._list();
      // 候选 = [当前工作链] + 所有变体
      this._cmpOptions = [{ name: '◆ 当前工作链', caseObj: this.engine.caseObj }].concat(list.map(function (v) { return { name: v.name, caseObj: v.caseObj }; }));
      this._cmpA = 0;
      this._cmpB = Math.min(1, this._cmpOptions.length - 1);
      this._renderCompare();
      ov.classList.add('show');
    },
    closeCompare: function () { if (this.refs.cmpOverlay) this.refs.cmpOverlay.classList.remove('show'); },
    _renderCompare: function () {
      var ov = this.refs.cmpOverlay, self = this, opts = this._cmpOptions;
      var A = opts[this._cmpA].caseObj, B = opts[this._cmpB].caseObj;
      var d = diff(A.events, B.events);
      ov.innerHTML = '';
      var head = el('div', 'cmp-head');
      var title = el('div', 'cmp-title'); title.appendChild(el('span', 'dot')); title.appendChild(document.createTextNode('链路变体 · 并排对比'));
      head.appendChild(title);
      var legend = el('div', 'cmp-legend');
      [['sw-same', '相同'], ['sw-chg', '改动'], ['sw-add', '独有']].forEach(function (x) {
        var lg = el('span', 'lg'); lg.appendChild(el('span', 'sw ' + x[0])); lg.appendChild(document.createTextNode(x[1])); legend.appendChild(lg);
      });
      head.appendChild(legend);
      head.appendChild(el('span', 'spacer'));
      var x = el('button', 'cmp-x', '✕ 关闭 (Esc)'); x.addEventListener('click', function () { self.closeCompare(); });
      head.appendChild(x);
      ov.appendChild(head);

      var body = el('div', 'cmp-body');
      body.appendChild(this._cmpColumn('A', this._cmpA, A, d.aStat, d.stat));
      body.appendChild(this._cmpColumn('B', this._cmpB, B, d.bStat, d.stat));
      ov.appendChild(body);

      ov.appendChild(this._verdictBar());   // 评审结论：更倾向 A/B/势均力敌 + 备注（持久化 + 随导出带走）
    },
    /* ---------- 评审结论（投票 + 备注，键到 task_id，持久化 + 导出） ---------- */
    _verdictKey: function (id) { return 'loona_verdict_' + (id || this.curCaseId); },
    _loadVerdict: function (id) { try { return JSON.parse((global.localStorage && localStorage.getItem(this._verdictKey(id))) || 'null'); } catch (e) { return null; } },
    _saveVerdict: function (v) { try { if (global.localStorage) localStorage.setItem(this._verdictKey(), JSON.stringify(v)); } catch (e) {} },
    _verdictBar: function () {
      var self = this, opts = this._cmpOptions;
      var aName = opts[this._cmpA].name, bName = opts[this._cmpB].name;
      var v = this._loadVerdict() || { prefer: null, note: '' };
      var bar = el('div', 'cmp-verdict');
      bar.appendChild(el('span', 'cv-label', '评审结论'));
      var votes = el('div', 'cv-votes'), keys = ['A', 'tie', 'B'];
      [['A', '更倾向 A · ' + aName], ['tie', '势均力敌'], ['B', '更倾向 B · ' + bName]].forEach(function (o) {
        var b = el('button', 'cv-vote' + (v.prefer === o[0] ? ' on' : ''), esc(o[1]));
        b.addEventListener('click', function () {
          v.prefer = (v.prefer === o[0] ? null : o[0]);
          v.a_name = aName; v.b_name = bName; v.at = new Date().toISOString();
          self._saveVerdict(v);
          var bs = votes.querySelectorAll('.cv-vote');
          for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', v.prefer === keys[i]);
          self._verdictStatus(bar._status, v);
        });
        votes.appendChild(b);
      });
      bar.appendChild(votes);
      var note = el('textarea', 'cv-note'); note.placeholder = '备注：为什么选它 / 还要改什么（随导出带走）…'; note.value = v.note || '';
      note.addEventListener('input', function () { v.note = note.value; v.a_name = aName; v.b_name = bName; self._saveVerdict(v); });
      bar.appendChild(note);
      var st = el('span', 'cv-status'); bar._status = st; this._verdictStatus(st, v);
      bar.appendChild(st);
      return bar;
    },
    _verdictStatus: function (st, v) {
      if (!st) return;
      var map = { A: '已记 · 更倾向 A', B: '已记 · 更倾向 B', tie: '已记 · 势均力敌' };
      st.textContent = v.prefer ? (map[v.prefer] + '，随导出带走') : '未表态';
      st.classList.toggle('on', !!v.prefer);
    },
    _cmpColumn: function (side, selIdx, caseObj, stat, summary) {
      var self = this, opts = this._cmpOptions;
      var col = el('div', 'cmp-col');
      var ch = el('div', 'cmp-col-head');
      var sel = el('select');
      opts.forEach(function (o, i) { var op = el('option', null, esc(o.name)); op.value = i; if (i === selIdx) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', function () { if (side === 'A') self._cmpA = +sel.value; else self._cmpB = +sel.value; self._renderCompare(); });
      ch.appendChild(sel);
      ch.appendChild(el('span', 'cc-steps', (caseObj.events || []).length + ' 步'));
      col.appendChild(ch);

      // 契约体检表（择优依据：风险更低、确认更全、证据更硬者更优）
      var sc = scorecard(caseObj);
      var scEl = el('div', 'cmp-score');
      scEl.innerHTML = '最高风险 <b class="' + riskClass(sc.maxRisk) + '">' + sc.maxRisk + '</b>　确认门 <b>' + sc.confirms +
        '</b>　低证据 <b>' + sc.lowEv + '</b>　工具 <b>' + sc.tools + '</b>' + (sc.warns ? ('　<b class="ct-warn-txt">⚠ ' + sc.warns + '</b>') : '');
      col.appendChild(scEl);

      // mini device 预览（该变体的结果卡）
      var prev = el('div', 'cmp-preview');
      var dev = el('div', 'mini-device');
      prev.appendChild(dev);
      col.appendChild(prev);
      this._renderHero(dev, caseObj);

      // 事件链（带契约 chips + diff 标注）
      var steps = el('div', 'cmp-steps');
      (caseObj.events || []).forEach(function (ev, i) {
        var st = stat[i];
        var cls = st === 'aonly' || st === 'bonly' ? 'd-add' : st === 'chg' ? 'd-chg' : '';
        var row = el('div', 'cmp-step ' + cls);
        row.appendChild(el('span', 'cs-idx', i + 1));
        var main = el('div', 'cs-main');
        var comp = el('span', 'cs-comp c-' + ev.comp, compLabel(ev));
        if (cls === 'd-add') comp.appendChild(el('span', 'd-tag', '独有'));
        else if (cls === 'd-chg') comp.appendChild(el('span', 'd-tag', '改动'));
        main.appendChild(comp);
        main.appendChild(el('div', 'cs-text', esc(textOf(ev) || '—')));
        main.appendChild(chipsFor(ev, caseObj));
        row.appendChild(main);
        steps.appendChild(row);
      });
      col.appendChild(steps);

      var sm = el('div', 'cmp-summary');
      sm.innerHTML = '相同 <b>' + summary.same + '</b>　改动 <b>' + summary.changed + '</b>　A独有 <b>' + summary.aOnly + '</b>　B独有 <b>' + summary.bOnly + '</b>';
      col.appendChild(sm);
      return col;
    },
    _renderHero: function (deviceEl, caseObj) {
      // 找“结果卡”事件
      var ev = caseObj.events || [], idx = -1, i;
      for (i = 0; i < ev.length; i++) { var c = ev[i].comp; if (isCardComp(c) && !/Focus/.test(c) && c !== 'confirm' && c !== 'ConfirmationCard') idx = i; }
      if (idx < 0) for (i = 0; i < ev.length; i++) if (ev[i].comp === 'confirm' || /Card$/.test(ev[i].comp) || isCardComp(ev[i].comp)) idx = i;
      var skin = (caseObj && caseObj.default_skin) || 'glass';
      // mini stage 结构
      var stage = el('div', 'loona-stage'); stage.setAttribute('data-skin', skin); stage.classList.add('has-content', 'is-playing');
      stage.appendChild(el('div', 'loona-eyes-bg'));
      stage.appendChild(el('div', 'content-scrim'));
      var ca = el('div', 'content-area');
      stage.appendChild(ca);
      var sub = el('div', 'subtitle'); stage.appendChild(sub);
      deviceEl.appendChild(stage);
      if (idx < 0) { stage.classList.remove('is-playing'); return; }
      var target = ev[idx];
      // 皮肤感知 builder 读主舞台 data-skin → 临时切换主舞台再还原
      var mainStage = document.querySelector('.wb .device .loona-stage');
      var saved = mainStage ? mainStage.getAttribute('data-skin') : null;
      if (mainStage) mainStage.setAttribute('data-skin', skin);
      var node;
      try { node = (target.comp === 'card') ? UI.build('pop_large', target) : UI.build(target.comp, target, {}); }
      catch (e) { node = el('div', 'pop-large'); }
      if (target.content && target.visual_state && target.content.state == null) {}
      ca.appendChild(node);
      if (mainStage && saved != null) mainStage.setAttribute('data-skin', saved);
      // 字幕：取该卡前后最近一句 tts
      var sline = '';
      for (i = idx; i < ev.length; i++) { var tp = ev[i].tts && ev[i].tts.text || (ev[i].comp === 'tts' && ev[i].text); if (tp) { sline = tp; break; } }
      if (!sline) for (i = idx; i >= 0; i--) { var tp2 = ev[i].tts && ev[i].tts.text || (ev[i].comp === 'tts' && ev[i].text); if (tp2) { sline = tp2; break; } }
      if (sline) { sub.innerHTML = esc(sline); sub.classList.add('show', 'role-loona'); }
      stage.classList.remove('is-playing'); // 静帧
    },

    /* ---------- 导出 / 分享 ---------- */
    exportAll: function () {
      var bundle = { task_id: this.curCaseId, exported_at: new Date().toISOString(),
        variants: this._list().map(function (v) { return { name: v.name, chain: v.caseObj, annotations: resolveAnnotations(v.caseObj) }; }),
        working_chain: this.engine.caseObj,
        review: { verdict: this._loadVerdict(), annotations: resolveAnnotations(this.engine.caseObj) } };   // 评审结论 + 用户标注一并带走
      this._download(this.curCaseId + '.variants.json', bundle);
      this.toast('已导出全部变体 + 标注 + 评审结论');
    },
    share: function () {
      var data = clone(this.engine.caseObj);
      data.annotations_resolved = resolveAnnotations(data);   // 标注随链路一并导出（自描述：带事件号/原文）
      var txt = JSON.stringify(data, null, 2);
      var self = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { self.toast('已复制理想链路 JSON 到剪贴板'); },
          function () { self._download((data.task_id || 'loona_case') + '.ideal_chain.json', data); self.toast('已导出 JSON'); });
      } else { this._download((data.task_id || 'loona_case') + '.ideal_chain.json', data); this.toast('已导出 JSON'); }
    },
    _download: function (name, obj) {
      var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    },
    toast: function (msg) {
      var t = document.querySelector('.console-toast');
      if (!t) { t = el('div', 'console-toast'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(this._tt); var self = this;
      this._tt = setTimeout(function () { t.classList.remove('show'); }, 2000);
    }
  };

  global.LoonaConsole = Console;
})(window);
