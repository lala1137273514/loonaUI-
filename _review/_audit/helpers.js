/* Defines window.__seek(caseId, skin, which) for screenshot sweeps.
   which ∈ 'result' | 'focus' | 'confirm' | 'clarify' | 'last' | <number-as-string>.
   Loads the case in the given skin, seeks to the chosen step, renders static. Returns idx. */
(function () {
  var W = window, CASES = W.LOONA_CASES || {}, UI = W.LoonaUI, ENG = W.LoonaEngine;
  var stage = document.querySelector('.loona-stage');
  function isCard(comp) { return !!(UI.CARD_BUILDERS && UI.CARD_BUILDERS[comp]) || comp === 'card'; }
  function isConfirm(comp) { return comp === 'confirm' || comp === 'ConfirmationCard'; }
  var LONG = '这是一段用于压力测试的较长文字内容，用来验证固定尺寸包络在内容变多变长时是否会被硬撑或溢出舞台';
  function densify(ev) {
    if (!ev || !ev.content) return; var c = ev.content;
    if (c.rows) { var r0 = c.rows[c.rows.length - 1] || { title: LONG }; for (var i = 0; i < 6; i++) c.rows.push(Object.assign({}, r0, { id: 'stress' + i, title: LONG })); }
    if (c.sections) { var s0 = c.sections[c.sections.length - 1] || { label: '压力', text: LONG }; for (var j = 0; j < 4; j++) c.sections.push(Object.assign({}, s0, { id: 'st' + j, label: '压力段' + j, text: LONG })); }
    if (c.items) { var it = c.items[c.items.length - 1]; for (var k = 0; k < 5; k++) c.items.push(Object.assign({}, it, { id: 'si' + k, title: LONG, summary: LONG })); }
    if (c.headline != null) c.headline = LONG;
  }
  W.__seek = function (caseId, skin, which) {
    var src = CASES[caseId];
    if (!src) return '-1:missing';
    var caseObj = JSON.parse(JSON.stringify(src));
    if (W.__SEEK_STRESS) caseObj.events.forEach(densify);
    stage.setAttribute('data-skin', skin || 'glass');
    ENG.theme = skin || 'glass';
    ENG.load(caseObj);
    var ev = caseObj.events, idx = -1, i;
    if (/^\d+$/.test(String(which))) idx = parseInt(which, 10);
    else if (which === 'last') idx = ev.length - 1;
    else if (which === 'confirm') { for (i = 0; i < ev.length; i++) if (isConfirm(ev[i].comp)) idx = i; }
    else if (which === 'clarify') { for (i = 0; i < ev.length; i++) if (ev[i].comp === 'ClarifyCard' || (ev[i].comp === 'pop_small' && ev[i].role === 'clarify')) idx = i; }
    else if (which === 'focus') { for (i = 0; i < ev.length; i++) if (/Focus/.test(ev[i].comp)) idx = i; }
    else { /* result */ for (i = 0; i < ev.length; i++) { var c = ev[i].comp; if (isCard(c) && !/Focus/.test(c) && !isConfirm(c)) idx = i; } }
    if (idx < 0) { for (i = 0; i < ev.length; i++) if (ev[i].comp === 'tts' || ev[i].tts) idx = i; } // fallback: a spoken step
    if (idx < 0) idx = ev.length - 1;
    ENG.seekTo(idx);
    stage.classList.remove('is-playing'); // static final frame, no entrance anim
    return String(idx) + ':' + (ev[idx] && ev[idx].comp);
  };
  return 'ok';
})();
