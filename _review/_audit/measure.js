/* UI-SPEC §12 auto-verification harness.
   Drives live LoonaEngine: for each (case, skin), seekTo every event, measure the focused
   center card vs CardStage / subtitle / toast. Reports the TALLEST card per combo plus any
   overflow / overlap / scroll-not-available violations. Set window.__STRESS=true before eval
   to densify each terminal card (extra rows/sections/long text) and prove the envelope holds.
   Returns JSON string (browse `eval` surfaces the completion value). */
(function () {
  var W = window;
  var CASES = W.LOONA_CASES || {};
  var UI = W.LoonaUI, ENG = W.LoonaEngine;
  var STRESS = !!W.__STRESS;
  var stage = document.querySelector('.loona-stage');
  var device = document.querySelector('.device');
  var contentArea = document.getElementById('contentArea');
  var subtitle = document.getElementById('subtitle');
  var toastSlot = document.getElementById('toastSlot');

  var MATRIX = [
    ['companion_chat', ['glass']],
    ['weather_5d', ['aura', 'glass']],
    ['news_briefing', ['glass', 'bubble', 'aura']],
    ['email_briefing', ['glass']],
    ['calendar_today', ['glass']],
    ['email_calendar_workflow', ['glass']],
    ['restaurant_quiet', ['aura', 'glass']],
    ['travel_shanghai_3d', ['aura', 'glass']],
    ['meeting_action', ['glass']]
  ];

  function scaleOf() { return parseFloat(getComputedStyle(device).getPropertyValue('--device-scale')) || 1; }
  function rect(el) { return el.getBoundingClientRect(); }
  function focusedCard() {
    var kids = contentArea.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.classList.contains('pop-large') || k.classList.contains('news-form') ||
          k.classList.contains('scenario-form') || k.classList.contains('news-card-list') ||
          k.classList.contains('news-card-focus')) return k;
    }
    return kids[0] || null;
  }
  function scrollContainer(card) {
    return card.querySelector('.pl-body') || card.querySelector('.nfi-track') ||
           card.querySelector('.nf-bubble-thread') || card;
  }
  var LONG = '这是一段用于压力测试的较长文字内容，用来验证固定尺寸包络在内容变多变长时是否会被硬撑或溢出舞台';
  function densify(ev) {
    if (!ev || !ev.content) return;
    var c = ev.content;
    if (c.rows) { var r0 = c.rows[c.rows.length - 1] || { title: LONG }; for (var i = 0; i < 6; i++) c.rows.push(JSON.parse(JSON.stringify(Object.assign({}, r0, { id: 'stress' + i, title: LONG })))); }
    if (c.sections) { var s0 = c.sections[c.sections.length - 1] || { label: '压力', text: LONG }; for (var j = 0; j < 4; j++) c.sections.push(JSON.parse(JSON.stringify(Object.assign({}, s0, { id: 'st' + j, label: '压力段' + j, text: LONG })))); }
    if (c.items) { var it = c.items[c.items.length - 1]; for (var k = 0; k < 5; k++) c.items.push(Object.assign({}, it, { id: 'si' + k, title: LONG, summary: LONG })); }
    if (c.item) { c.item = Object.assign({}, c.item, { title: LONG, lead: LONG + LONG, summary: LONG }); }
    if (c.headline != null) c.headline = LONG;
    if (c.content_summary != null) c.content_summary = LONG;
  }

  var report = [];
  function sweep(label, src, skin) {
    var caseObj = JSON.parse(JSON.stringify(src)); // clone so stress doesn't mutate originals
    if (STRESS) caseObj.events.forEach(densify);
    stage.setAttribute('data-skin', skin);
    ENG.theme = skin;
    ENG.load(caseObj);
    stage.classList.remove('is-playing');
    var sc = scaleOf();
    var tallest = null, maxOverflow = 0, maxSubOverlap = 0, anyToastWithCard = false, anyScrollBroken = false;
    for (var i = 0; i < caseObj.events.length; i++) {
      ENG.seekTo(i);
      stage.classList.remove('is-playing');
      var card = focusedCard();
      if (!card) continue;
      var cr = rect(card), sr = rect(contentArea);
      var overflow = (cr.height - sr.height) / sc;
      var subOverlap = 0;
      if (subtitle && subtitle.classList.contains('show')) { var ur = rect(subtitle); if (cr.bottom > ur.top) subOverlap = (cr.bottom - ur.top) / sc; }
      var toastN = toastSlot ? toastSlot.children.length : 0;
      var sCont = scrollContainer(card);
      var needsScroll = sCont.scrollHeight > sCont.clientHeight + 1;
      var oy = getComputedStyle(sCont).overflowY, ox = getComputedStyle(sCont).overflowX;
      var scrollOK = needsScroll ? (oy === 'auto' || oy === 'scroll' || ox === 'auto' || ox === 'scroll') : true;
      if (overflow > maxOverflow) maxOverflow = overflow;
      if (subOverlap > maxSubOverlap) maxSubOverlap = subOverlap;
      if (toastN > 0) anyToastWithCard = true;
      if (needsScroll && !scrollOK) anyScrollBroken = true;
      var rec = { step: i, comp: caseObj.events[i].comp + (caseObj.events[i].card_id ? ('#' + caseObj.events[i].card_id) : ''), cardH: Math.round(cr.height / sc), overflow: Math.round(overflow) };
      if (!tallest || cr.height / sc > tallest.cardH) tallest = rec;
    }
    report.push({
      caseId: label, skin: skin, stress: STRESS,
      tallestCard: tallest ? tallest.comp : '(none)',
      tallestH: tallest ? tallest.cardH : 0,
      stageH: Math.round(rect(contentArea).height / sc),
      maxOverflowPx: Math.round(maxOverflow),
      maxSubOverlapPx: Math.round(maxSubOverlap),
      toastCoexistsWithCard: anyToastWithCard,
      scrollMissingWhenNeeded: anyScrollBroken,
      scale: +sc.toFixed(3)
    });
  }
  MATRIX.forEach(function (pair) {
    var caseId = pair[0], skins = pair[1];
    var src = CASES[caseId];
    if (!src) { report.push({ caseId: caseId, error: 'missing' }); return; }
    skins.forEach(function (skin) { sweep(caseId, src, skin); });
    // case 内置变体（如天气问城市版 / 邮件×日程 部分失败）也跑一遍，确保新增卡(FailureCard 等)无溢出
    (src.variants || []).forEach(function (variant) {
      var vskin = src.default_skin || skins[0] || 'glass';
      sweep(caseId + '#' + variant.name, { events: variant.events, default_skin: src.default_skin, decision_record: src.decision_record }, vskin);
    });
  });
  return JSON.stringify(report, null, 1);
})();
