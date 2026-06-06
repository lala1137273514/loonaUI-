/* ============================================================
   链路编排台 · 卡片库 FlowPalette（拖源）
   把 window.FlowTemplates 按 group 分组铺成可拖拽卡片。
   拖到画布 / 点击 → store.add(tpl.make())。
   见 FLOW-CONTRACT.md。palette 是静态的，不订阅 store。
   ============================================================ */
(function (g) {
  'use strict';

  function init(store, mountEl) {
    var tpls = g.FlowTemplates || [];
    mountEl.innerHTML = '';

    var groups = [];           // 保持出现顺序
    var byGroup = {};
    for (var i = 0; i < tpls.length; i++) {
      var group = tpls[i].group || '其它';
      if (!byGroup[group]) { byGroup[group] = []; groups.push(group); }
      byGroup[group].push(i);  // 存下标，dataTransfer 用
    }

    groups.forEach(function (group) {
      var head = document.createElement('div');
      head.className = 'fp-group';
      head.textContent = group;
      mountEl.appendChild(head);

      byGroup[group].forEach(function (idx) {
        var tpl = tpls[idx];

        var item = document.createElement('div');
        item.className = 'fp-item';
        item.setAttribute('draggable', 'true');

        var label = document.createElement('span');
        label.className = 'fp-label';
        label.textContent = tpl.label;
        item.appendChild(label);

        var comp = document.createElement('span');
        comp.className = 'fp-comp';
        comp.textContent = tpl.comp;
        item.appendChild(comp);

        item.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/flow-tpl', String(idx));
          e.dataTransfer.effectAllowed = 'copy';
        });

        item.addEventListener('click', function () {
          store.add(g.FlowTemplates[idx].make());
        });

        mountEl.appendChild(item);
      });
    });
  }

  g.FlowPalette = { init: init };
})(window);
