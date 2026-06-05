/* UI-SPEC §12 full-matrix verification sweep.
   Unlike the earlier spot-check version, this drives the FULL 9-case × form matrix (same as
   measure.js) and asserts token + width + overflow + subtitle on every relevant card, so the
   §12 audit has no blind spots. Returns a PASS/FAIL report (JSON string). */
(function () {
  var W = window, CASES = W.LOONA_CASES, UI = W.LoonaUI, ENG = W.LoonaEngine;
  var stage = document.querySelector('.loona-stage'), scaledDevice = document.querySelector('.device'), device = scaledDevice;
  if (!device) device = document.querySelector('.sb-screen') || stage;
  var ca = document.getElementById('contentArea'), sub = document.getElementById('subtitle');
  var checks = [], matrix = [];
  if (ENG && typeof ENG._clearStage === 'function') ENG._clearStage();
  function add(id, name, pass, detail) { checks.push({ id: id, name: name, pass: !!pass, detail: detail }); }
  function scaleOf() { return scaledDevice ? (parseFloat(getComputedStyle(scaledDevice).getPropertyValue('--device-scale')) || 1) : 1; }
  function isCard(comp) { return !!(UI.CARD_BUILDERS && UI.CARD_BUILDERS[comp]) || comp === 'card'; }
  function isConfirm(comp) { return comp === 'confirm' || comp === 'ConfirmationCard'; }
  function isClarify(ev) { return ev.comp === 'ClarifyCard' || (ev.comp === 'pop_small' && ev.role === 'clarify'); }
  function focusedCard() {
    var activeCarousel = document.querySelector('#carouselRail .result-card.active') || document.querySelector('#carouselRail .result-card');
    if (activeCarousel) return activeCarousel;
    var k = ca.children;
    for (var i = 0; i < k.length; i++) { var c = k[i];
      if (c.classList.contains('pop-large') || c.classList.contains('news-form') || c.classList.contains('scenario-form') ||
          c.classList.contains('news-card-list') || c.classList.contains('news-card-focus')) return c; }
    return k[0] || null;
  }
  function isStandardCard(card) { return card && card.classList.contains('pop-large') && !/news-|scenario-/.test(card.className); }
  function setSkin(s) { stage.setAttribute('data-skin', s); ENG.theme = s; }
  function loadSeek(id, skin, idx) { setSkin(skin); ENG.load(JSON.parse(JSON.stringify(CASES[id]))); ENG.seekTo(idx); stage.classList.remove('is-playing'); }

  /* ---- global (turn-independent) ---- */
  add(8, '设备框固定 812×375', !!device && device.offsetWidth === 812 && device.offsetHeight === 375, device ? (device.offsetWidth + '×' + device.offsetHeight) : 'missing');
  var eyes = document.querySelector('.loona-eyes-bg') || document.querySelector('.web-stage');
  var bg = eyes ? getComputedStyle(eyes).backgroundImage : 'none';
  var eyesAnim = eyes ? getComputedStyle(eyes).animationName : 'none';
  add(9, '双眼在位且静态', !!eyes && bg !== 'none' && (eyesAnim === 'none' || eyesAnim === ''), 'bg=' + (bg !== 'none' ? 'set' : 'none') + ' anim=' + eyesAnim);
  var stageH = Math.round(scaledDevice ? (ca.getBoundingClientRect().height / scaleOf()) : ca.offsetHeight);
  add(0, 'CardStage 高 ≈287', stageH >= 282 && stageH <= 292, stageH + 'px');

  var MATRIX = [
    ['companion_chat', ['glass']],
    ['weather_5d', ['aura', 'glass']],
    ['news_briefing', ['glass', 'bubble', 'aura']],
    ['email_briefing', ['glass']],
    ['calendar_today', ['glass']],
    ['cortex_mail_priority_v4', ['glass']],
    ['cortex_news_hot_v4', ['glass']],
    ['cortex_calendar_week_v4', ['glass']],
    ['email_calendar_workflow', ['glass']],
    ['restaurant_quiet', ['aura', 'glass']],
    ['travel_shanghai_3d', ['aura', 'glass']],
    ['meeting_action', ['glass']]
  ];

  /* ---- aggregate trackers (fail if ANY combo violates) ---- */
  var maxOverflow = 0, maxSubOverlap = 0;
  var stdWidthBad = [], stdTokenBad = [], btnBad = [], focusWidthBad = [], gateSubBad = [], scrollBad = [];
  var sawStd = 0, sawBtn = 0, sawFocus = 0, sawGate = 0;

  MATRIX.forEach(function (pair) {
    var id = pair[0], skins = pair[1], src = CASES[id];
    if (!src) { matrix.push({ combo: id, error: 'missing' }); return; }
    var ev = src.events;
    // indices of interest
    var resultIdx = -1, focusIdx = -1, confirmIdx = -1, clarifyIdx = -1, i;
    for (i = 0; i < ev.length; i++) {
      var c = ev[i].comp;
      if (isCard(c) && !/Focus/.test(c) && !isConfirm(c)) resultIdx = i;
      if (/Focus/.test(c)) focusIdx = focusIdx < 0 ? i : focusIdx;
      if (isConfirm(c)) confirmIdx = confirmIdx < 0 ? i : confirmIdx;
      if (isClarify(ev[i])) clarifyIdx = clarifyIdx < 0 ? i : clarifyIdx;
    }
    skins.forEach(function (skin) {
      var rec = { combo: id + '/' + skin };
      var sc;
      // full overflow/subOverlap/scroll sweep over every step (no blind spots)
      setSkin(skin); ENG.load(JSON.parse(JSON.stringify(src)));
      for (i = 0; i < ev.length; i++) {
        ENG.seekTo(i); stage.classList.remove('is-playing');
        var card = focusedCard(); if (!card) continue;
        sc = scaleOf();
        var cr = card.getBoundingClientRect(), sr = ca.getBoundingClientRect();
        var ov = (cr.height - sr.height) / sc; if (ov > maxOverflow) maxOverflow = ov;
        if (sub && sub.classList.contains('show')) { var ur = sub.getBoundingClientRect(); if (cr.bottom > ur.top) { var so = (cr.bottom - ur.top) / sc; if (so > maxSubOverlap) maxSubOverlap = so; } }
        var body = card.querySelector('.pl-body') || card.querySelector('.nfi-track') || card.querySelector('.nf-bubble-thread') || card;
        if (body.scrollHeight > body.clientHeight + 1) { var oy = getComputedStyle(body).overflowY, ox = getComputedStyle(body).overflowX; if (!(oy === 'auto' || oy === 'scroll' || ox === 'auto' || ox === 'scroll')) scrollBad.push(rec.combo + '@' + i); }
      }
      // result card: width + token (standard pop-large only)
      if (resultIdx >= 0) {
        ENG.seekTo(resultIdx); stage.classList.remove('is-playing'); sc = scaleOf();
        var rc = focusedCard();
        if (rc) {
          rec.resultCls = rc.className.split(' ').filter(function (x) { return /wrap|form|list|focus|pop-large/.test(x); }).join('.');
          rec.resultW = Math.round(rc.offsetWidth);
          if (isStandardCard(rc)) {
            sawStd++;
            if (Math.abs(rc.offsetWidth - 430) > 3) stdWidthBad.push(rec.combo + '=' + rc.offsetWidth);
            var rad = parseInt(getComputedStyle(rc).borderRadius);
            var tt = rc.querySelector('.pl-title'), bd = rc.querySelector('.pl-body');
            var tf = tt ? Math.round(parseFloat(getComputedStyle(tt).fontSize)) : 0;
            var bf = bd ? Math.round(parseFloat(getComputedStyle(bd).fontSize)) : 0;
            rec.token = 'r' + rad + ' 标题' + tf + ' 正文' + bf;
            if (!(rad === 22 && tf === 15 && bf === 14)) stdTokenBad.push(rec.combo + '(' + rec.token + ')');
          }
        }
      }
      // focus card: news focus must be ≈548
      if (focusIdx >= 0) {
        ENG.seekTo(focusIdx); stage.classList.remove('is-playing');
        var fc = ca.querySelector('.news-card-focus') || focusedCard();
        if (fc) { rec.focusW = Math.round(fc.offsetWidth);
          if (fc.classList.contains('news-card-focus')) { sawFocus++; if (Math.abs(fc.offsetWidth - 548) > 4) focusWidthBad.push(rec.combo + '=' + fc.offsetWidth); } }
      }
      // confirm gate: btn token + subtitle may be 2 lines
      if (confirmIdx >= 0) {
        ENG.seekTo(confirmIdx); stage.classList.remove('is-playing'); sc = scaleOf();
        var btn = ca.querySelector('.btn-fill');
        if (btn) { sawBtn++; var bh = Math.round(btn.offsetHeight), brd = parseInt(getComputedStyle(btn).borderRadius);
          rec.btn = 'h' + bh + ' r' + brd; if (!(bh === 32 && brd >= 999)) btnBad.push(rec.combo + '(' + rec.btn + ')'); }
        if (sub && sub.classList.contains('show')) { sawGate++; var gh = Math.round(sub.getBoundingClientRect().height / sc); rec.confirmSubH = gh; if (gh > 66 || stage.classList.contains('sub-1line')) gateSubBad.push(rec.combo + ' confirmSubH=' + gh + ' 1line=' + stage.classList.contains('sub-1line')); }
      }
      // clarify gate: subtitle may be 2 lines (not forced to sub-1line)
      if (clarifyIdx >= 0) {
        ENG.seekTo(clarifyIdx); stage.classList.remove('is-playing'); sc = scaleOf();
        if (sub && sub.classList.contains('show')) { sawGate++; var ch = Math.round(sub.getBoundingClientRect().height / sc); rec.clarifySubH = ch; if (ch > 66 || stage.classList.contains('sub-1line')) gateSubBad.push(rec.combo + ' clarifySubH=' + ch + ' 1line=' + stage.classList.contains('sub-1line')); }
      }
      matrix.push(rec);
    });
  });

  /* ---- aggregate checks across the whole matrix ---- */
  add(1, '全矩阵 · 卡不超 CardStage', maxOverflow <= 1, 'maxOverflow ' + Math.round(maxOverflow) + 'px');
  add(4, '全矩阵 · 卡↔字幕不压盖', maxSubOverlap <= 1, 'maxSubOverlap ' + Math.round(maxSubOverlap) + 'px');
  add(4.5, '超高处有内部滚动', scrollBad.length === 0, scrollBad.length ? scrollBad.join(', ') : 'ok');
  add(7, '标准卡恒宽 ≈430（' + sawStd + ' 张）', stdWidthBad.length === 0, stdWidthBad.length ? stdWidthBad.join(', ') : 'all 430');
  add(11, '标准卡 token r22/标题15/正文14', stdTokenBad.length === 0, stdTokenBad.length ? stdTokenBad.join(', ') : (sawStd + ' 张全合规'));
  add(7.1, '新闻聚焦固定宽 ≈548（' + sawFocus + ' 张）', focusWidthBad.length === 0, focusWidthBad.length ? focusWidthBad.join(', ') : 'ok');
  add(11.2, '确认门按钮 h32 / r≥999（' + sawBtn + ' 个）', btnBad.length === 0, btnBad.length ? btnBad.join(', ') : 'ok');
  add(6, '澄清/确认门 字幕可 2 行(≤66, 不锁 1 行)（' + sawGate + ' 处）', gateSubBad.length === 0, gateSubBad.length ? gateSubBad.join(', ') : 'ok');

  var allPass = checks.every(function (c) { return c.pass; });
  return JSON.stringify({ allPass: allPass, passed: checks.filter(function (c) { return c.pass; }).length, total: checks.length, checks: checks, matrix: matrix }, null, 1);
})();
