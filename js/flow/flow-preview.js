/* ============================================================
   链路编排台 · 预览播放 FlowPreview
   点"预览" → engine.load(store.toCase()) + engine.replay() 在预览舞台播。
   懒加载引擎：首次打开才 LoonaEngine.init，之后复用同一 engine 实例。
   见 FLOW-CONTRACT.md。不订阅 store（按需触发，不实时重渲）。
   ============================================================ */
(function (g) {
  'use strict';

  /* 从 refs 里挑出引擎 init 需要的字段，不把 modal/openBtn 等控制 DOM 传进引擎 */
  function pickEngineRefs(refs) {
    return {
      stage: refs.stage,
      popSlot: refs.popSlot,
      toastSlot: refs.toastSlot,
      contentArea: refs.contentArea,
      subtitle: refs.subtitle,
      storyLayer: refs.storyLayer,
      carouselPanel: refs.carouselPanel,
      carouselRail: refs.carouselRail,
      carouselTitle: refs.carouselTitle,
      carouselBack: refs.carouselBack,
      nowStage: refs.nowStage,
      annLive: refs.annLive,
      sideTrack: refs.sideTrack,
      timeline: refs.timeline,
      waitBanner: refs.waitBanner
    };
  }

  function init(store, refs) {
    refs = refs || {};
    var engine = null;

    function ensureEngine() {
      if (!engine) engine = g.LoonaEngine.init(pickEngineRefs(refs));
      return engine;
    }

    function currentTitle() {
      var el = document.getElementById('flowTitle');
      return (el && el.value) || undefined;
    }

    function open() {
      var e = ensureEngine();
      if (refs.modal) refs.modal.classList.add('show');
      e.load(store.toCase({ title: currentTitle() }));   // 每次打开都重新 load（store 可能已变）
      e.replay();
    }

    function play() {
      ensureEngine().replay();   // 重新播
    }

    function close() {
      if (refs.modal) refs.modal.classList.remove('show');
      if (engine && engine.pause) engine.pause();   // 停住播放
    }

    if (refs.openBtn) refs.openBtn.addEventListener('click', open);
    if (refs.playBtn) refs.playBtn.addEventListener('click', play);
    if (refs.closeBtn) refs.closeBtn.addEventListener('click', close);
    if (refs.modal) refs.modal.addEventListener('click', function (e) {
      if (e.target === refs.modal) close();   // 点背景遮罩关闭
    });
  }

  g.FlowPreview = { init: init };
})(window);
