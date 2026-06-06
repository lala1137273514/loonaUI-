/* ============================================================
   链路编排台 · 卡片预览渲染器（唯一 comp→builder 落点）
   只此一处知道每种 comp 怎么渲；其它模块一律调 renderStepPreview。
   复用：LoonaUI(浮层/结果卡) · LoonaCarouselAdapter(轮播多卡 feed) · CortexCarousel.buildCarouselCard。
   ============================================================ */
(function (g) {
  'use strict';
  var UI = g.LoonaUI;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function applySize(cardEl, size) {
    if (!cardEl || !size) return;
    if (size.w) { cardEl.style.width = size.w + 'px'; cardEl.style.flex = '0 0 ' + size.w + 'px'; cardEl.style.maxWidth = 'none'; }
    if (size.h) { cardEl.style.height = size.h + 'px'; }
  }

  /* 两阶段轮播 comp → adapter 对应 feed 方法 */
  var FEED = { InspoFlow: 'feedInspo', TravelStages: 'feedStages', TravelOverview: 'feedOverview', DestCompare: 'feedDestCompare', ThemeFlow: 'feedThemeFlow' };

  function carouselItems(step) {
    var A = g.LoonaCarouselAdapter; if (!A) return null;
    var items = null;
    try {
      if (FEED[step.comp]) { var car = A[FEED[step.comp]](step); items = car && car.items; }
      else if (A.isResult(step)) { var res = A.feed(step); items = res && res.carousel && res.carousel.items; }
    } finally {
      if (A.reset) A.reset();   // 不污染共享单例（预览引擎也用同一个 Adapter）
    }
    return (items && items.length) ? items : null;
  }

  function textChip(step) {
    var kind = step.comp === 'user_query' ? 'user' : step.comp === 'agent_step' ? 'agent' : 'tts';
    var who = step.comp === 'user_query' ? '用户' : step.comp === 'agent_step' ? 'agent 决策' : 'Loona 口播';
    var box = el('div', 'flow-chip flow-chip-' + kind);
    box.appendChild(el('div', 'flow-chip-who', who));
    var t;
    if (step.comp === 'agent_step') t = (step.label || '') + (step.decision ? ' · ' + step.decision : '');
    else t = step.text || (step.tts && step.tts.text) || '';
    box.appendChild(el('div', 'flow-chip-txt', t || '（空）'));
    return box;
  }

  function renderStepPreview(step) {
    if (!step) return el('div', 'flow-empty', '（空步骤）');
    var comp = step.comp;

    if (comp === 'user_query' || comp === 'tts' || comp === 'agent_step') return textChip(step);
    if (comp === 'toast') return UI.toast({ state: step.state || step.state_visual, text: step.text });
    if (comp === 'pop_small') { var p = UI.popSmall(step); applySize(p, step.size); return p; }

    /* 轮播多卡：静态面板内露真卡（去压暗缩放在 css 里处理） */
    var items = carouselItems(step);
    if (items) {
      var panel = el('div', 'carousel-panel flow-static-carousel');
      items.forEach(function (it) {
        var card = g.CortexCarousel.buildCarouselCard(it);
        card.classList.add('flow-static-card');
        applySize(card, step.size);
        panel.appendChild(card);
      });
      return panel;
    }

    /* 单张浮层 / 结果卡（ClarifyCard / ResultCard / ConfirmationCard / pop_large …） */
    if (UI.isCard(comp) || comp === 'confirm' || comp === 'ConfirmationCard') {
      var card = UI.build(comp, step, {});
      applySize(card, step.size);
      return card;
    }

    var un = el('div', 'flow-unsupported');
    un.textContent = '未支持的组件: ' + comp;
    return un;
  }

  g.FlowRender = { renderStepPreview: renderStepPreview, applySize: applySize };
})(window);
