/* ============================================================
   链路编排台 · 装配器（建 1 个 store，串起各松耦合模块）
   各模块只认 store + 自己挂载点；联动全走 store。
   ============================================================ */
(function (g) {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };

    if (!g.FlowStore) { console.error('[FlowBuilder] FlowStore 未加载'); return; }
    var store = g.FlowStore.create();

    if (g.FlowPalette) g.FlowPalette.init(store, $('flowPalette'));
    if (g.FlowCanvas) g.FlowCanvas.init(store, $('flowCanvas'));
    if (g.FlowInspector) g.FlowInspector.init(store, $('flowInspector'));

    if (g.FlowPreview) g.FlowPreview.init(store, {
      modal: $('flowPreviewModal'), openBtn: $('flowPreviewBtn'), closeBtn: $('flowPreviewClose'), playBtn: $('flowPreviewPlay'),
      stage: $('loonaStage'), popSlot: $('popSlot'), toastSlot: $('toastSlot'), contentArea: $('contentArea'),
      subtitle: $('subtitle'), storyLayer: $('storyLayer'),
      carouselPanel: $('carouselPanel'), carouselRail: $('carouselRail'), carouselTitle: $('carouselTitle'), carouselBack: $('backOverview'),
      nowStage: $('nowStage'), annLive: $('annLive'), sideTrack: $('sideTrack'), timeline: $('timeline'), waitBanner: $('waitBanner')
    });

    if (g.FlowExport) g.FlowExport.init(store, {
      exportBtn: $('flowExportBtn'), downloadBtn: $('flowDownloadBtn'), titleInput: $('flowTitle'), msgEl: $('flowMsg')
    });

    var clr = $('flowClearBtn');
    if (clr) clr.addEventListener('click', function () { if (window.confirm('清空当前链路？')) store.clear(); });

    g.LoonaFlow = { store: store };   // 调试入口
  });
})(window);
