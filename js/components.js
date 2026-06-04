/* ============================================================
   Loona UI 组件库 —— 对齐 Figma「Slack 4.30 专项」真实组件规格
   (file 1GXkRFjHMpcxDyPbIh2ZYf：pop_small / pop_large / list_slack_* / btn-fill / 状态 .riv)
   设计 token 与各组件锚点见同目录 ../DESIGN_SYSTEM.md（统一规则，新组件必须遵守）。
   每个组件 = 一个返回 DOM 的纯函数。gallery 与播放引擎共用。
   ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- 状态图标：直接用从 Figma 拉的真实 .riv 渲染图（assets/icons/*.png） ----
     globe_looking / loading_spin_ccw / paperplane_fly_once / circle_checkmark / ciecle_xmark */
  /* 6 态对齐 02_FIGMA §4 .riv（assets/icons/*.png）。mail 暂无独立资产，回落到中性 loading（读信=处理态），不借用 globe(=搜索) 误导语义 */
  var ICON_FILE = { searching: 'globe', loading: 'loading', sending: 'paperplane', done: 'check', fail: 'xmark', mail: 'loading' };
  function statusVis(kind, size) {
    var k = ICON_FILE[kind] || 'loading';
    var wrap = el('span', 'status-vis');
    if (size) wrap.style.width = wrap.style.height = size + 'px';
    var img = el('img', 'sv-img' + ((kind === 'loading' || kind === 'searching') ? ' sv-spin' : ''));
    img.src = 'assets/icons/' + k + '.png'; img.alt = kind; img.draggable = false;
    wrap.appendChild(img);
    return wrap;
  }
  /* 关闭 X（vg_xmark，Figma 24px） */
  function closeX() {
    var b = el('button', 'close-x'); b.type = 'button'; b.title = '关闭';
    var img = el('img'); img.src = 'assets/icons/close.svg'; img.alt = '关闭'; img.draggable = false;
    b.appendChild(img); return b;
  }

  /* ---- 双眼脸（真实 Figma 资产，静态；Frame 26/27 face 1:161, 812×375） ---- */
  function loonaFace(maxW) {
    var img = el('img', 'loona-face-img');
    img.src = 'assets/loona_face.png'; img.alt = 'Loona 双眼（静态）';
    if (maxW) img.style.maxWidth = maxW + 'px';
    return img;
  }

  /* ---- btn-fill（Figma: h32 px16 圆角141 #ffb200 黑字 + 玻璃内阴影；disabled 灰；ghost 描边） ---- */
  function btnFill(label, variant, onClick) {
    var b = el('button', 'btn-fill ' + (variant || 'primary'), esc(label));
    b.type = 'button';
    if (variant === 'disabled') b.disabled = true;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  /* ---- pop_small（Figma 58:5098：黑.5 玻璃胶囊；icon32 + 文本14白；可带尾部 btn-fill）
     用于：状态(searching/loading/sending/done/fail) · 用户 ASR 输入(role=query) · 澄清(role=clarify) ---- */
  function popSmall(o) {
    o = o || {};
    var role = o.role || 'status';                 // query | clarify | status
    var n = el('div', 'pop-small role-' + role);
    if (o.state_visual) n.appendChild(statusVis(o.state_visual));
    else if (o.icon) { var ic = el('span', 'ps-icon'); ic.appendChild(o.icon); n.appendChild(ic); }
    var t = el('div', 'ps-text');
    if (role === 'query' && o.who) t.appendChild(el('span', 'ps-who', esc(o.who)));
    if (o.html) t.insertAdjacentHTML('beforeend', o.html);     // 支持关键词高亮 <span class=kw>
    else t.appendChild(document.createTextNode(o.text || ''));
    n.appendChild(t);
    if (o.btn) n.appendChild(btnFill(o.btn.label, 'primary', o.btn.onClick));
    return n;
  }

  /* ---- toast：一套【固定的、绑定工具调用语义的】集中状态，icon + 默认文案都收在这里 ----
     用法：{ comp:'toast', state:'searching' } → 自动用统一图标+「搜索中…」；想覆盖文案传 text。
     state_visual 作旧字段兼容。状态尽量收敛到这几种，不为每条内容造新 toast（见 §03 标注）。 */
  var TOAST_STATE = {
    searching:  { icon: 'searching', label: '搜索中' },   // web_search / 新闻 / POI
    verifying:  { icon: 'searching', label: '核验中' },   // web_search（核验）
    reading:    { icon: 'loading',   label: '读取中' },   // read_private_data（邮件/日程/材料）
    processing: { icon: 'loading',   label: '整理中' },   // 总结 / 规划 / 计算
    sending:    { icon: 'sending',   label: '发送中' },   // 外发邮件 / 消息
    saving:     { icon: 'loading',   label: '保存中' },   // 存草稿 / 知识库
    done:       { icon: 'done',      label: '完成' },
    fail:       { icon: 'fail',      label: '没成功' }
  };
  function toast(o) {
    o = o || {};
    var key = o.state || o.state_visual || 'processing';
    var cs = TOAST_STATE[key] || { icon: o.state_visual || 'loading', label: '处理中' };
    var n = el('div', 'pop-small toast role-status');
    n.appendChild(statusVis(cs.icon));
    var t = el('div', 'ps-text'); t.appendChild(document.createTextNode(o.text || (cs.label + '…')));
    n.appendChild(t);
    if (o.btn) n.appendChild(btnFill(o.btn.label, o.btn.variant || 'ghost', o.btn.onClick));  // 回执 toast 的「查看详情」
    return n;
  }
  function toastLabel(key) { var s = TOAST_STATE[key]; return s ? (s.label + '…') : ''; }

  /* ---- pop_large（Figma 172:49237：黑.7 玻璃，圆角24，p20，gap8；
     头部[icon32 + 标题14 Semibold 白 + 关闭X] → divider → 正文(#ccc) → 脚注(#999)） ---- */
  function popLargeCard(opts) {
    opts = opts || {};
    var card = el('div', 'pop-large');
    var head = el('div', 'pl-head');
    if (opts.icon) head.appendChild(typeof opts.icon === 'string' ? statusVis(opts.icon) : opts.icon);
    var titles = el('div', 'pl-titles');
    if (opts.title != null) titles.appendChild(el('div', 'pl-title', esc(opts.title)));
    if (opts.titleExtra) titles.appendChild(opts.titleExtra);
    head.appendChild(titles);
    if (opts.closeable !== false) head.appendChild(closeX());
    card.appendChild(head);
    card.appendChild(el('div', 'pl-divider'));
    var body = el('div', 'pl-body');
    if (typeof opts.body === 'string') body.innerHTML = esc(opts.body);
    else if (opts.body) body.appendChild(opts.body);
    card.appendChild(body);
    if (opts.footer != null) {
      var f = el('div', 'pl-footer');
      if (typeof opts.footer === 'string') f.innerHTML = esc(opts.footer);
      else f.appendChild(opts.footer);
      card.appendChild(f);
    }
    applyCardState(card, opts.state);
    return card;
  }
  /* 通用简单容器（gallery 用） */
  function popLarge(innerNode, extraCls) {
    var n = el('div', 'pop-large ' + (extraCls || ''));
    var b = el('div', 'pl-body'); if (innerNode) b.appendChild(innerNode);
    n.appendChild(b); return n;
  }

  /* ---- list_item（Figma list_slack_*）
     message: 标题(白14) + [#频道 · 用户](#999 12) + 右时间戳(#999 12)
     user:    头像 + 姓名(白14) + 邮箱(#999 12) + 右侧 amber 单选圈 ---- */
  function listItem(o) {
    o = o || {};
    var variant = o.variant || (o.email || o.avatar ? 'user' : 'message');
    var n = el('div', 'list-item li-' + variant);
    if (variant === 'user') {
      var av = el('div', 'li-avatar');
      if (o.avatar_img) { var im = el('img'); im.src = o.avatar_img; av.appendChild(im); }
      else av.textContent = (o.name || o.title || '·').slice(0, 1);
      n.appendChild(av);
      var info = el('div', 'li-info');
      info.appendChild(el('div', 'li-title', esc(o.name || o.title || '')));
      if (o.email || o.sub) info.appendChild(el('div', 'li-sub', esc(o.email || o.sub)));
      n.appendChild(info);
      var radio = el('span', 'li-radio' + (o.selected ? ' on' : ''));
      n.appendChild(radio);
    } else {
      var info2 = el('div', 'li-info');
      info2.appendChild(el('div', 'li-title', esc(o.title || '')));
      var subRow = el('div', 'li-subrow');
      var subInfo = el('div', 'li-subinfo');
      if (o.sub) subInfo.appendChild(el('span', 'li-sub', esc(o.sub)));
      if (o.sub && o.sub2) subInfo.appendChild(el('span', 'li-dot'));
      if (o.sub2) subInfo.appendChild(el('span', 'li-sub', esc(o.sub2)));
      subRow.appendChild(subInfo);
      if (o.time) subRow.appendChild(el('span', 'li-time', esc(o.time)));
      info2.appendChild(subRow);
      n.appendChild(info2);
    }
    return n;
  }

  /* ---- 倒计时环（confirm 用） ---- */
  function countdownRing(seconds) {
    var wrap = el('div', 'countdown-ring');
    var R = 15, C = 2 * Math.PI * R;
    wrap.innerHTML =
      '<svg width="34" height="34" viewBox="0 0 34 34">' +
      '<circle cx="17" cy="17" r="' + R + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3"/>' +
      '<circle class="ring-fg" cx="17" cy="17" r="' + R + '" fill="none" stroke="#ffb200" stroke-width="3" ' +
      'stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="0"/></svg>' +
      '<span class="ring-num">' + seconds + '</span>';
    wrap._C = C;
    return wrap;
  }

  /* ---- TravelDayCard（无 Figma 原件 → 按 pop_large 系统派生，保持统一）
     头部[日号徽章 + 主题 + pace 徽章 + X] → divider → 节点行(list 风) → 脚注(交通/天气 #999) ---- */
  function travelDayCard(c) {
    c = c || {};
    var pace = c.pace || 'normal';
    var paceLabel = { light: '轻松', normal: '适中', intense: '紧凑' }[pace] || pace;
    var badge = el('span', 'tc-daybadge', 'D' + (c.day != null ? c.day : '?'));
    var paceB = el('span', 'pace-badge pace-' + pace, paceLabel);

    var body = el('div', 'tc-nodes');
    var mod = c.modifiable_nodes || [];
    (c.nodes || []).forEach(function (name) {
      var row = el('div', 'tc-node');
      row.appendChild(el('span', 'tc-dot'));
      row.appendChild(el('span', 'tc-nm', esc(name)));
      if (mod.indexOf(name) >= 0) row.appendChild(el('span', 'tc-modtag', '可改'));
      body.appendChild(row);
    });

    var bits = [];
    if (c.transport_notes) bits.push('<span class="lbl">交通</span> ' + esc(c.transport_notes));
    if (c.weather_notes) bits.push('<span class="lbl">天气</span> ' + esc(c.weather_notes));
    var footer = bits.length ? el('div', null, bits.join('　·　')) : null;

    var card = popLargeCard({ icon: badge, title: c.theme || '', titleExtra: paceB, body: body, footer: footer, state: c.state || c.visual_state });
    card.classList.add('travel-card-wrap');
    return card;
  }

  /* ============ 通用零件：badge / kindBadge ============ */
  function badge(text, kind) { return el('span', 'badge badge-' + (kind || 'amber'), esc(text)); }
  function confLabel(c) { return { high: '高可信', medium: '中可信', low: '低可信', unconfirmed: '未确认' }[c] || c; }
  function conf2kind(c) { return { high: 'high', medium: 'medium', low: 'low', unconfirmed: 'unconfirmed' }[c] || 'amber'; }
  function riskLabel(r) { return { rain: '有雨', heat: '高温', cold: '偏冷', wind: '大风', air_quality: '空气差' }[r] || r; }
  var KIND_SVG = {
    weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" stroke-linecap="round"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h6" stroke-linecap="round"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="M4 7l8 5.5L20 7" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke-linecap="round"/></svg>',
    restaurant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 3v8M5 3v4.5a2 2 0 0 0 4 0V3M7 11v10M16.5 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5zM16.5 12v9"/></svg>',
    meeting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14.5 8.2h3M14.5 14.2h3"/></svg>',
    travel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
    workflow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 7h9M5 7l3-3M5 7l3 3M19 17h-9M19 17l-3-3M19 17l-3 3"/></svg>',
    "default": '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>'
  };
  function kindBadge(kind) { var w = el('span', 'kind-badge kind-' + kind); w.innerHTML = KIND_SVG[kind] || KIND_SVG['default']; return w; }
  function bodyCol() { return el('div', 'card-body-col'); }

  /* ---- EmailCard（§7.3：sender/subject/priority/why/suggested_action/draft） ---- */
  function emailCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.subject) body.appendChild(el('div', 'em-subject', esc(c.subject)));
    if (c.why_important) body.appendChild(el('div', 'em-why', esc(c.why_important)));
    if (c.suggested_action) body.appendChild(el('div', 'em-action', '下一步 · ' + esc(c.suggested_action)));
    var foot = []; if (c.time) foot.push(esc(c.time)); if (c.draft_available) foot.push('草稿已备');
    var pr = c.priority ? badge(c.priority, c.priority.toLowerCase()) : null;
    var card = popLargeCard({ icon: kindBadge('email'), title: c.sender || '', titleExtra: pr, body: body, footer: foot.length ? foot.join('　·　') : null, state: c.state || c.visual_state });
    card.classList.add('email-card-wrap'); return card;
  }

  /* ---- MeetingActionCard（§7.7：decision/action_item/owner|pending/deadline/evidence/confidence/status） ---- */
  function meetingActionCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.decision) body.appendChild(el('div', 'mt-decision', esc(c.decision)));
    if (c.action_item) body.appendChild(el('div', 'mt-action', esc(c.action_item)));
    if (c.action_item) {
      var meta = el('div', 'mt-meta');
      meta.appendChild((c.owner && c.owner !== 'pending_confirmation') ? el('span', 'mt-owner', '@' + esc(c.owner)) : badge('负责人待确认', 'pending'));
      meta.appendChild((c.deadline && c.deadline !== 'pending_confirmation') ? el('span', 'mt-dl', esc(c.deadline)) : badge('截止待定', 'pending'));
      body.appendChild(meta);
    }
    var st = c.status === 'pending_confirmation' ? badge('待确认', 'pending') : (c.confidence ? badge(confLabel(c.confidence), conf2kind(c.confidence)) : null);
    var ftr = c.evidence_span ? el('div', null, '<span class="lbl">依据</span> ' + esc(c.evidence_span)) : null;
    var card = popLargeCard({ icon: kindBadge('meeting'), title: c.title || (c.decision ? '决策' : '行动项'), titleExtra: st, body: body, footer: ftr, state: c.state || c.visual_state });
    card.classList.add('meeting-card-wrap'); return card;
  }

  /* ---- FailureCard（§7.11：completed/failed/reason/impact/next_options，永远给下一步） ---- */
  function failureCard(c) {
    c = c || {};
    var body = bodyCol();
    (c.completed || []).forEach(function (x) { var r = el('div', 'fc-line ok'); r.appendChild(el('span', 'fc-ic', '✓')); r.appendChild(el('span', null, esc(x))); body.appendChild(r); });
    (c.failed || []).forEach(function (x) { var r = el('div', 'fc-line bad'); r.appendChild(el('span', 'fc-ic', '✕')); r.appendChild(el('span', null, esc(x))); body.appendChild(r); });
    if (c.reason) body.appendChild(el('div', 'fc-reason', esc(c.reason)));
    if (c.impact) body.appendChild(el('div', 'fc-reason', esc(c.impact)));
    var footer = (c.next_options && c.next_options.length) ? el('div', null, '<span class="lbl">下一步</span> ' + c.next_options.map(esc).join(' / ')) : null;
    var card = popLargeCard({ icon: 'fail', title: c.title || '部分没成功', body: body, footer: footer, state: 'fail' });
    card.classList.add('failure-card-wrap'); return card;
  }

  /* ---- WeatherCard（§7.1） ---- */
  function weatherCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.life_action) body.appendChild(el('div', 'wx-action', esc(c.life_action)));
    else if (c.summary) body.appendChild(el('div', 'wx-action', esc(c.summary)));
    (c.daily_data || []).forEach(function (d) {
      var r = el('div', 'wx-row');
      r.appendChild(el('span', 'wx-date', esc(d.date || '')));
      r.appendChild(el('span', 'wx-temp', esc(d.temp || '')));
      var tags = el('span', 'wx-tags');
      if (d.risk && d.risk !== 'none') tags.appendChild(badge(riskLabel(d.risk), 'warn'));
      if (d.badge) tags.appendChild(badge(d.badge, 'amber'));
      r.appendChild(tags); body.appendChild(r);
    });
    var pr = c.confidence ? badge(confLabel(c.confidence), conf2kind(c.confidence)) : null;
    var ftr = c.source_time ? el('div', null, '<span class="lbl">更新</span> ' + esc(c.source_time) + (c.uncertainty ? ('　·　' + esc(c.uncertainty)) : '')) : (c.uncertainty ? el('div', null, esc(c.uncertainty)) : null);
    var card = popLargeCard({ icon: kindBadge('weather'), title: (c.city || '') + (c.date_range ? (' · ' + c.date_range) : ''), titleExtra: pr, body: body, footer: ftr, state: c.state || c.visual_state });
    card.classList.add('weather-card-wrap'); return card;
  }

  /* ---- NewsCard（§7.2） ---- */
  function newsCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.why_it_matters) body.appendChild(el('div', 'nw-why', esc(c.why_it_matters)));
    if (c.bias_or_uncertainty) body.appendChild(el('div', 'nw-bias', esc(c.bias_or_uncertainty)));
    var cred = c.credibility || c.confidence;
    var b = cred ? badge(confLabel(cred), conf2kind(cred)) : null;
    var ftr = el('div', null, '<span class="lbl">' + esc(c.source || '来源') + '</span>' + (c.publish_time ? ('　·　' + esc(c.publish_time)) : ''));
    var card = popLargeCard({ icon: kindBadge('news'), title: c.headline || '', titleExtra: b, body: body, footer: ftr, state: c.state || c.visual_state });
    card.classList.add('news-card-wrap'); return card;
  }

  /* ---- CalendarCard（§7.4） ---- */
  function calendarCard(c) {
    c = c || {};
    var body = bodyCol();
    var line = []; if (c.time) line.push(esc(c.time)); if (c.location) line.push(esc(c.location));
    if (line.length) body.appendChild(el('div', 'cal-time', line.join('　·　')));
    if (c.participants && c.participants.length) body.appendChild(el('div', 'cal-part', '参与 ' + c.participants.map(esc).join('、')));
    if (c.recommended_action) body.appendChild(el('div', 'cal-rec', '建议 · ' + esc(c.recommended_action)));
    var stMap = { confirmed: ['已确认', 'high'], tentative: ['待定', 'medium'], conflict: ['冲突', 'conflict'], free_slot: ['空档', 'free'] };
    var sm = stMap[c.status]; var b = sm ? badge(sm[0], sm[1]) : null;
    var ftr = c.risk ? el('div', null, '<span class="lbl">风险</span> ' + esc(c.risk)) : null;
    var card = popLargeCard({ icon: kindBadge('calendar'), title: c.title || '', titleExtra: b, body: body, footer: ftr, state: c.state || c.visual_state });
    card.classList.add('calendar-card-wrap'); return card;
  }

  /* ---- RestaurantCard（§7.5） ---- */
  function restaurantCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.reason) body.appendChild(el('div', 'rst-reason', esc(c.reason)));
    var meta = el('div', 'rst-meta');
    if (c.distance) meta.appendChild(el('span', 'rst-d', esc(c.distance)));
    if (c.price_band) meta.appendChild(el('span', 'rst-p', esc(c.price_band)));
    (c.tags || []).forEach(function (t) { meta.appendChild(badge(t, 'amber')); });
    if (meta.children.length) body.appendChild(meta);
    var fitMap = { quiet_chat: '安静聊天', business: '商务宴请', quick_meal: '快餐', date: '约会', group: '聚餐' };
    var b = c.scenario_fit ? badge(fitMap[c.scenario_fit] || c.scenario_fit, 'amber') : null;
    var bk = c.backup_option ? (typeof c.backup_option === 'string' ? c.backup_option : (c.backup_option.name || '')) : '';
    var ftr = c.uncertainty ? el('div', null, esc(c.uncertainty)) : (bk ? el('div', null, '<span class="lbl">备选</span> ' + esc(bk)) : null);
    var card = popLargeCard({ icon: kindBadge('restaurant'), title: c.name || '', titleExtra: b, body: body, footer: ftr, state: c.state || c.visual_state });
    card.classList.add('restaurant-card-wrap'); return card;
  }

  /* ---- WorkflowCard（§7.8：邮件×日程 联动，逐步状态） ---- */
  function workflowCard(c) {
    c = c || {};
    var body = bodyCol();
    if (c.email) body.appendChild(el('div', 'wf-line', '<span class="lbl">邮件</span> ' + esc(c.email)));
    if (c.calendarImpact) body.appendChild(el('div', 'wf-line', '<span class="lbl">日程</span> ' + esc(c.calendarImpact)));
    if (c.draftReply) body.appendChild(el('div', 'wf-draft', '草稿 · ' + esc(c.draftReply)));
    if (c.workflowSteps && c.workflowSteps.length) {
      var steps = el('div', 'wf-steps');
      var stMap = { done: ['high', '已完成'], pending: ['pending', '待确认'], failed: ['conflict', '失败'], running: ['pending', '进行中'], wait: ['p3', '待执行'] };
      c.workflowSteps.forEach(function (s) {
        var row = el('div', 'wf-step');
        var sm = stMap[s.status] || ['p3', s.status || ''];
        row.appendChild(el('span', 'wf-step-name', esc(s.name || s.label || '')));
        row.appendChild(badge(sm[1], sm[0]));
        steps.appendChild(row);
      });
      body.appendChild(steps);
    }
    var card = popLargeCard({ icon: kindBadge('workflow'), title: c.title || '邮件 × 日程 联动', body: body, footer: c.partialFailureReason ? el('div', null, esc(c.partialFailureReason)) : null, state: c.state || c.visual_state });
    card.classList.add('workflow-card-wrap'); return card;
  }

  /* ============================================================
     展示类型（按类型分，取代按 case 分）：row 系统 + ListCard / SubjectCard / SectionCard / ClarifyCard
     字段/位置规范见 ../CARD_TAXONOMY.md
     ============================================================ */

  /* 通用 typed row：可作 mail/event/news/step/node 行（带 data-row-id 供卡内高亮） */
  function lcRow(o) {
    o = o || {};
    var r = el('div', 'lc-row' + (o.dim ? ' dim' : ''));
    if (o.id) r.dataset.rowId = o.id;
    if (o.lead === 'dot') r.appendChild(el('span', 'lc-dot'));
    else if (o.lead != null) r.appendChild(el('span', 'lc-lead', esc(o.lead)));   // 时间/序号
    var info = el('div', 'lc-info');
    info.appendChild(el('div', 'lc-title', esc(o.title || '')));
    if (o.sub) info.appendChild(el('div', 'lc-sub', esc(o.sub)));
    r.appendChild(info);
    var right = el('div', 'lc-right');
    if (o.badge) right.appendChild(badge(o.badge.text, o.badge.kind));
    if (o.right) right.appendChild(el('span', 'lc-rt', esc(o.right)));            // 右侧时间
    if (o.tag) right.appendChild(el('span', 'lc-tag', esc(o.tag)));               // 可改 等
    if (right.children.length) r.appendChild(right);
    return r;
  }

  /* ListCard：头部 + N 行 + 脚注（邮件 / 日程 / 新闻 / 工作流步骤） */
  function listCard(c) {
    c = c || {};
    var body = el('div', 'lc-rows');
    (c.rows || []).forEach(function (r) { body.appendChild(lcRow(r)); });
    var card = popLargeCard({ icon: c.icon || 'done', title: c.title || '',
      titleExtra: c.status ? badge(c.status.text, c.status.kind) : null,
      body: body, footer: c.footer != null ? footerNode(c.footer) : null, state: c.state || c.visual_state });
    card.classList.add('list-card-wrap'); return card;
  }

  /* SubjectCard：头部 + 主张 + meta/tags + 行 + 脚注（天气 / 餐厅） */
  function subjectCard(c) {
    c = c || {};
    var body = el('div', 'sc-body');
    if (c.headline) body.appendChild(el('div', 'sc-headline', esc(c.headline)));
    if (c.meta) {
      var m = el('div', 'sc-meta'); m.appendChild(el('span', null, esc(c.meta)));
      (c.tags || []).forEach(function (t) { m.appendChild(badge(t, 'amber')); });
      body.appendChild(m);
    } else if (c.tags && c.tags.length) {
      var mt = el('div', 'sc-meta'); c.tags.forEach(function (t) { mt.appendChild(badge(t, 'amber')); }); body.appendChild(mt);
    }
    (c.rows || []).forEach(function (r) { body.appendChild(lcRow(r)); });
    var card = popLargeCard({ icon: c.icon || 'done', title: c.title || '',
      titleExtra: c.badge ? badge(c.badge.text, c.badge.kind) : null,
      body: body, footer: c.footer != null ? footerNode(c.footer) : null, state: c.state || c.visual_state });
    card.classList.add('subject-card-wrap'); return card;
  }

  /* SectionCard：头部 + 分组段（旅行 3 天 / 会议 决策·行动·风险），段带 data-row-id 供高亮 */
  function sectionCard(c) {
    c = c || {};
    var body = el('div', 'sec-body');
    (c.sections || []).forEach(function (s) {
      var sec = el('div', 'sec-block'); if (s.id) sec.dataset.rowId = s.id;
      var head = el('div', 'sec-head');
      head.appendChild(el('span', 'sec-label', esc(s.label || '')));
      if (s.badge) head.appendChild(badge(s.badge.text, s.badge.kind));
      sec.appendChild(head);
      if (s.text) sec.appendChild(el('div', 'sec-text', esc(s.text)));
      (s.rows || []).forEach(function (r) { sec.appendChild(lcRow(r)); });
      body.appendChild(sec);
    });
    var card = popLargeCard({ icon: c.icon || 'done', title: c.title || '', body: body,
      footer: c.footer != null ? footerNode(c.footer) : null, state: c.state || c.visual_state });
    card.classList.add('section-card-wrap'); return card;
  }

  /* ClarifyCard：问一个 + ≤2 选项（同时 TTS 念出问题） */
  function clarifyCard(c, handlers) {
    c = c || {}; handlers = handlers || {};
    var body = el('div', 'clr-body');
    if (c.question) body.appendChild(el('div', 'clr-q', esc(c.question)));
    /* 槽位卡：必填(已自动填充，带值+✓) + 选填(可补的 chip)。卡显示结构化槽位，TTS 另说人话 */
    if (c.slots) {
      var sb = el('div', 'clr-slots');
      function slotRow(label, items, kind) {
        if (!items || !items.length) return;
        var row = el('div', 'clr-slot-row');
        row.appendChild(el('span', 'clr-slot-lbl', label));
        items.forEach(function (s) {
          if (kind === 'filled') {
            var has = s && typeof s === 'object' && s.value;     // 必填：有值=已填(✓)，无值=待填(醒目)
            var chip = el('span', 'clr-slot ' + (has ? 'filled' : 'need'));
            chip.appendChild(el('span', 'cs-k', esc(s.label || s)));
            if (has) { chip.appendChild(el('span', 'cs-v', esc(s.value))); chip.appendChild(el('span', 'cs-ok', '✓')); }
            else { chip.appendChild(el('span', 'cs-need', '待填')); }
            row.appendChild(chip);
          } else {
            var oc = el('span', 'clr-slot opt');
            oc.appendChild(el('span', 'cs-add', '+'));
            oc.appendChild(document.createTextNode(esc(typeof s === 'string' ? s : (s.label || ''))));
            row.appendChild(oc);
          }
        });
        sb.appendChild(row);
      }
      slotRow('必填', c.slots.required, 'filled');
      slotRow('选填', c.slots.optional, 'opt');
      body.appendChild(sb);
    }
    if (c.options && c.options.length) {
      var opts = el('div', 'clr-opts');
      c.options.forEach(function (o, i) { opts.appendChild(btnFill(o.label || o, i === 0 ? 'primary' : 'ghost', handlers.onOption)); });
      body.appendChild(opts);
    }
    var card = popLargeCard({ icon: el('span', 'cc-badge clr-badge', '?'), title: c.title || '想先确认一下', body: body, closeable: false });  // 澄清是门：选项决策，无 X
    card.classList.add('clarify-card-wrap'); return card;
  }

  /* 脚注：字符串(可含 <span class=lbl>) 或节点 */
  function footerNode(f) { return (typeof f === 'string') ? el('div', null, f) : f; }

  /* ---- confirm-card（Figma 候选确认卡风：pop_large + 摘要行 + 居中 btn-fill + 倒计时） ---- */
  function confirmCard(c, handlers) {
    c = c || {}; handlers = handlers || {};
    var ccBadge = el('span', 'cc-badge', '!');

    var rows = el('div', 'cc-rows');
    function row(k, v) { if (v == null || v === '') return; var r = el('div', 'cc-row'); r.appendChild(el('span', 'k', k)); r.appendChild(el('span', 'v', esc(v))); rows.appendChild(r); }
    row('动作', c.action); row('对象', c.target); row('影响', c.impact); row('内容', c.content_summary);
    /* 可撤销做成标题旁小标，省一行高度 */
    var revBadge = c.reversible == null ? null : badge(c.reversible ? '可撤销' : '不可撤销', c.reversible ? 'free' : 'warn');

    /* 确认门 = 必须显式二选一：无 X、无倒计时(不自动执行)，只有 [确认]/[取消]（§ 确认须显式，不 countdown 自动执行） */
    var actions = el('div', 'cc-actions');
    actions.appendChild(btnFill(c.confirm_label || '发送', 'primary', handlers.onConfirm));
    actions.appendChild(btnFill(c.cancel_label || '取消', 'ghost', handlers.onCancel));

    var card = popLargeCard({ icon: ccBadge, title: '需要你确认', titleExtra: revBadge, body: rows, footer: actions, closeable: false });
    card.classList.add('confirm-card-wrap');
    return card;
  }

  function applyCardState(node, state) {
    node.classList.remove('card-state-dim', 'card-state-active', 'card-state-done', 'card-state-fail');
    if (state) node.classList.add('card-state-' + state);
    return node;
  }

  /* ============================================================
     新闻：一套内容模型 → 三种「展现形式」(由当前皮肤选择，而非换颜色)
       form: card(编辑卡) | bubble(对话气泡) | immersive(沉浸聚焦)
       每种 form 有 list(多条) 与 focus(单条/聚焦) 两态。
       内容模型 item = { id,image,title,summary,source,time,confidence,why_it_matters,tag }
     ============================================================ */
  function currentSkin() { var s = document.querySelector('.loona-stage'); return (s && s.getAttribute('data-skin')) || 'glass'; }
  var SKIN_FORM = { glass: 'card', bubble: 'bubble', aura: 'immersive' };
  function confBadge(c) { return c ? badge(confLabel(c), conf2kind(c)) : null; }
  function metaText(it) { return (it.source || '') + (it.time ? (' · ' + it.time) : ''); }
  function newsThumb(src, cls) {
    if (!src) return null;
    var w = el('span', 'nf-thumb ' + (cls || ''));
    var im = el('img'); im.src = src; im.alt = ''; im.draggable = false; w.appendChild(im);
    return w;
  }

  /* 关键要点列表(bullets)：聚焦态高密度用 */
  function pointsBlock(points, cls, max) {
    var pts = el('div', cls || 'nff-points');
    (points || []).slice(0, max || 3).forEach(function (p) {
      var li = el('div', 'nff-pt'); li.appendChild(el('span', 'nff-dot'));
      li.appendChild(el('span', 'nff-pt-tx', esc(p))); pts.appendChild(li);
    });
    return pts;
  }

  /* —— Form A：编辑卡 (Editorial Card) —— */
  /* 列表：图片 + 标题 + 摘要(一行) + meta(来源·时间·可信度) —— 中密度，可扫读 */
  function newsCardList(c) {
    var body = el('div', 'nfc-rows');
    (c.items || []).forEach(function (it) {
      var r = el('div', 'nfc-row'); if (it.id) r.dataset.rowId = it.id;
      var thumb = newsThumb(it.image);
      if (thumb) r.appendChild(thumb);
      else r.classList.add('nfc-row-no-image');
      var info = el('div', 'nfc-info');
      info.appendChild(el('div', 'nfc-title', esc(it.title || '')));
      if (it.summary) info.appendChild(el('div', 'nfc-sum', esc(it.summary)));
      var meta = el('div', 'nfc-meta', esc(metaText(it)));
      var b = confBadge(it.confidence); if (b) meta.appendChild(b);
      info.appendChild(meta);
      r.appendChild(info);
      body.appendChild(r);
    });
    var card = popLargeCard({ icon: kindBadge('news'), title: c.title || '今日新闻',
      titleExtra: c.status ? badge(c.status.text, c.status.kind) : null,
      body: body, footer: c.footer != null ? footerNode(c.footer) : null });
    card.classList.add('news-card-list'); return card;
  }
  /* 聚焦：横排高密度 —— 左图 + 右(kicker/标题/导语/要点/为什么值得看)。介绍要全、密度远高于列表行 */
  function newsCardFocus(c) {
    var it = c.item || {};
    var card = el('div', 'pop-large news-card-focus'); if (it.id) card.dataset.rowId = it.id;
    var dense = el('div', 'nff-dense');
    var media = el('div', 'nff-media');
    if (it.image) { var im = el('img'); im.src = it.image; im.alt = ''; im.draggable = false; media.appendChild(im); }
    var hb = confBadge(it.confidence); if (hb) { hb.classList.add('nff-badge'); media.appendChild(hb); }
    dense.appendChild(media);
    var tx = el('div', 'nff-text');
    tx.appendChild(el('div', 'nff-kicker', esc((it.tag ? it.tag + ' · ' : '') + metaText(it))));
    tx.appendChild(el('div', 'nff-title', esc(it.title || '')));
    if (it.lead) tx.appendChild(el('div', 'nff-lead', esc(it.lead)));
    if (it.points && it.points.length) tx.appendChild(pointsBlock(it.points, 'nff-points', 3));
    if (it.why_it_matters) tx.appendChild(el('div', 'nff-why', '<span class="lbl">为什么值得看</span> ' + esc(it.why_it_matters)));
    dense.appendChild(tx);
    card.appendChild(dense);
    return card;
  }

  /* —— Form B：对话气泡 (Conversational Bubble) — 不是卡片，是 Loona 在「说」新闻 —— */
  function loonaTag(lead) { var t = el('div', 'nfb-tag'); t.innerHTML = '<span class="nfb-dot"></span><span class="nfb-name">Loona</span>'; if (lead) t.appendChild(el('span', 'nfb-lead', esc(lead))); return t; }
  /* 列表：每条一颗气泡 = 缩略图 + 标题 + 摘要(一行) + meta */
  function newsBubbleList(c) {
    var wrap = el('div', 'news-form nf-bubble-thread');
    wrap.appendChild(loonaTag(c.intro || c.title));   // 开场白并入 Loona 标签行，省一颗气泡的高度
    (c.items || []).forEach(function (it) {
      var b = el('div', 'nfb-bubble'); if (it.id) b.dataset.rowId = it.id;
      if (it.image) b.appendChild(newsThumb(it.image, 'nfb-thumb'));
      var tx = el('div', 'nfb-tx');
      tx.appendChild(el('div', 'nfb-line', esc(it.title || '')));
      if (it.summary) tx.appendChild(el('div', 'nfb-sum', esc(it.summary)));
      var meta = el('div', 'nfb-meta', esc(metaText(it)));
      var bd = confBadge(it.confidence); if (bd) meta.appendChild(bd);
      tx.appendChild(meta);
      b.appendChild(tx);
      wrap.appendChild(b);
    });
    return wrap;
  }
  /* 聚焦：富气泡横排高密度 —— 左图 + 右(标题/导语/要点/引语/meta) */
  function newsBubbleFocus(c) {
    var it = c.item || {};
    var wrap = el('div', 'news-form nf-bubble-thread nfb-thread-focus');
    wrap.appendChild(loonaTag());
    var b = el('div', 'nfb-bubble nfb-rich'); if (it.id) b.dataset.rowId = it.id;
    var dense = el('div', 'nfb-dense');
    if (it.image) { var media = el('div', 'nfb-media'); var im = el('img'); im.src = it.image; im.alt = ''; im.draggable = false; media.appendChild(im); var mbd = confBadge(it.confidence); if (mbd) { mbd.classList.add('nfb-mbadge'); media.appendChild(mbd); } dense.appendChild(media); }
    var tx = el('div', 'nfb-dtext');
    tx.appendChild(el('div', 'nfb-line nfb-title', esc(it.title || '')));
    if (it.lead) tx.appendChild(el('div', 'nfb-summary', esc(it.lead)));
    if (it.points && it.points.length) tx.appendChild(pointsBlock(it.points, 'nff-points', 3));
    if (it.why_it_matters) tx.appendChild(el('div', 'nfb-why', '＂' + esc(it.why_it_matters) + '＂'));
    tx.appendChild(el('div', 'nfb-meta', esc(metaText(it))));
    dense.appendChild(tx);
    b.appendChild(dense);
    wrap.appendChild(b);
    return wrap;
  }

  /* —— Form C：沉浸聚焦 (Immersive Spotlight) — 图片为主，文字压在 scrim 上 —— */
  function immCover(it, focus) {
    var c = el('div', 'nfi-cover' + (focus ? ' nfi-focus' : '')); if (it.id) c.dataset.rowId = it.id;
    if (it.image) { var im = el('img'); im.src = it.image; im.alt = ''; im.draggable = false; c.appendChild(im); }
    c.appendChild(el('div', 'nfi-scrim'));
    var ov = el('div', 'nfi-overlay');
    var bd = confBadge(it.confidence); if (bd) { bd.classList.add('nfi-badge'); ov.appendChild(bd); }
    ov.appendChild(el('div', 'nfi-title', esc(it.title || '')));
    if (focus) {
      /* 聚焦：导语 + 关键要点(2) + meta(含 tag) —— 高密度铺全 */
      if (it.lead) ov.appendChild(el('div', 'nfi-summary', esc(it.lead)));
      if (it.points && it.points.length) ov.appendChild(pointsBlock(it.points, 'nfi-points', 2));
      ov.appendChild(el('div', 'nfi-meta', esc((it.tag ? it.tag + ' · ' : '') + metaText(it))));
    } else {
      /* 列表封面：标题 + 摘要(一行) + meta */
      if (it.summary) ov.appendChild(el('div', 'nfi-csum', esc(it.summary)));
      ov.appendChild(el('div', 'nfi-meta', esc(metaText(it))));
    }
    c.appendChild(ov);
    return c;
  }
  function newsImmList(c) {
    var wrap = el('div', 'news-form nf-imm-list');
    var track = el('div', 'nfi-track');
    (c.items || []).forEach(function (it) { track.appendChild(immCover(it, false)); });
    wrap.appendChild(track);
    return wrap;
  }
  function newsImmFocus(c) {
    var wrap = el('div', 'news-form nf-imm-focus-wrap');
    wrap.appendChild(immCover(c.item || {}, true));
    return wrap;
  }

  /* 分发：按当前皮肤选 form（皮肤 = 展现形式，而非颜色） */
  function newsList(c) { var f = SKIN_FORM[currentSkin()] || 'card'; return f === 'bubble' ? newsBubbleList(c) : f === 'immersive' ? newsImmList(c) : newsCardList(c); }
  function newsFocus(c) { var f = SKIN_FORM[currentSkin()] || 'card'; return f === 'bubble' ? newsBubbleFocus(c) : f === 'immersive' ? newsImmFocus(c) : newsCardFocus(c); }

  /* 卡片分发表：comp 名 → builder（content 取 data.content 或 data 本身） */
  var CARD_BUILDERS = {
    /* 新闻：内容模型 → 三形式(皮肤选 form)；list 多条 / focus 单条 */
    NewsList: newsList, NewsFocus: newsFocus,
    /* 按展示类型（新，case 用这些） */
    ListCard: listCard, SubjectCard: subjectCard, SectionCard: sectionCard, ClarifyCard: clarifyCard,
    FailureCard: failureCard,
    /* 按业务卡（旧，gallery 示例/向后兼容保留） */
    TravelDayCard: travelDayCard, EmailCard: emailCard, MeetingActionCard: meetingActionCard,
    WeatherCard: weatherCard, NewsCard: newsCard, CalendarCard: calendarCard,
    RestaurantCard: restaurantCard, WorkflowCard: workflowCard
  };
  function isCard(comp) { return !!CARD_BUILDERS[comp] || comp === 'confirm' || comp === 'ConfirmationCard'; }

  function build(comp, data, handlers) {
    if (CARD_BUILDERS[comp]) return CARD_BUILDERS[comp]((data && data.content) || data);
    switch (comp) {
      case 'pop_small': return popSmall(data);
      case 'toast': return toast(data);
      case 'pop_large': return popLarge(data && data.node, data && data.cls);
      case 'list_item': return listItem(data);
      case 'btn_fill': return btnFill(data.label, data.variant, data.onClick);
      case 'confirm': case 'ConfirmationCard': return confirmCard((data && data.content) || data, handlers);
      case 'status': return statusVis(data && data.state_visual || data);
      default: return popLarge(el('div', null, esc(JSON.stringify(data))));
    }
  }

  global.LoonaUI = {
    el: el, esc: esc, ICON_FILE: ICON_FILE, CARD_BUILDERS: CARD_BUILDERS, isCard: isCard,
    statusVis: statusVis, closeX: closeX, loonaFace: loonaFace,
    popSmall: popSmall, toast: toast, toastLabel: toastLabel, TOAST_STATE: TOAST_STATE, popLarge: popLarge, popLargeCard: popLargeCard,
    travelDayCard: travelDayCard, emailCard: emailCard, meetingActionCard: meetingActionCard,
    failureCard: failureCard, weatherCard: weatherCard, newsCard: newsCard, calendarCard: calendarCard,
    restaurantCard: restaurantCard, workflowCard: workflowCard,
    lcRow: lcRow, listCard: listCard, subjectCard: subjectCard, sectionCard: sectionCard, clarifyCard: clarifyCard,
    newsList: newsList, newsFocus: newsFocus, SKIN_FORM: SKIN_FORM,
    badge: badge, kindBadge: kindBadge, listItem: listItem, btnFill: btnFill,
    countdownRing: countdownRing, confirmCard: confirmCard, applyCardState: applyCardState, build: build
  };
})(window);
