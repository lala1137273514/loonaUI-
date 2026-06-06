/* ============================================================
   链路编排台 · 链路序列画布 FlowCanvas
   订阅 store，把 steps 渲成竖向序列；每步用 FlowRender.renderStepPreview 出预览
   + 操作条(上移/下移/复制/删/选中)；接 palette 拖放(text/flow-tpl)插入；步骤间拖拽排序(store.move)。
   见 FLOW-CONTRACT.md。只认 store + mountEl，不引用别的模块。
   ============================================================ */
(function (g) {
  'use strict';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function init(store, mountEl) {
    function opBtn(label, fn) {
      var b = el('button', 'fc-op', label);
      b.type = 'button';
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
      return b;
    }

    function clearDragOver() {
      var nodes = mountEl.querySelectorAll('.fc-step.drag-over');
      for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove('drag-over');
    }

    function render() {
      mountEl.innerHTML = '';
      var steps = store.list();

      if (!steps.length) {
        mountEl.appendChild(el('div', 'fc-empty', '← 从左侧卡片库拖卡片进来，或点击添加'));
        return;
      }

      steps.forEach(function (step, idx) {
        var row = el('div', 'fc-step');
        if (step.id === store.selectedId()) row.classList.add('sel');
        row.setAttribute('draggable', 'true');

        /* —— 头部：序号 + comp + 操作条 —— */
        var head = el('div', 'fc-step-head');
        head.appendChild(el('div', 'fc-step-idx', String(idx + 1)));
        head.appendChild(el('div', 'fc-step-comp', step.comp));
        var ops = el('div', 'fc-step-ops');
        ops.appendChild(opBtn('↑', function () { store.move(step.id, 'up'); }));
        ops.appendChild(opBtn('↓', function () { store.move(step.id, 'down'); }));
        ops.appendChild(opBtn('⎘', function () { store.duplicate(step.id); }));
        ops.appendChild(opBtn('✕', function () { store.remove(step.id); }));
        head.appendChild(ops);
        row.appendChild(head);

        /* —— 预览主体（唯一 comp→builder 落点）—— */
        var body = el('div', 'fc-step-body');
        body.appendChild(g.FlowRender.renderStepPreview(step));
        row.appendChild(body);

        /* —— 点本体选中 —— */
        row.addEventListener('click', function () { store.select(step.id); });

        /* —— 拖拽排序 / 接收 palette 拖放 —— */
        row.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/flow-step', step.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragover', function (e) {
          e.preventDefault();
          clearDragOver();
          row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', function () { row.classList.remove('drag-over'); });
        row.addEventListener('drop', function (e) {
          e.preventDefault();
          e.stopPropagation();
          row.classList.remove('drag-over');
          var stepId = e.dataTransfer.getData('text/flow-step');
          if (stepId) { store.move(stepId, idx); return; }
          var tpl = e.dataTransfer.getData('text/flow-tpl');
          if (tpl !== '' && g.FlowTemplates[tpl]) store.add(g.FlowTemplates[tpl].make(), idx);
        });

        mountEl.appendChild(row);
      });
    }

    /* —— 拖到空白处 = 追加到末尾 —— */
    mountEl.addEventListener('dragover', function (e) { e.preventDefault(); });
    mountEl.addEventListener('drop', function (e) {
      e.preventDefault();
      clearDragOver();
      var stepId = e.dataTransfer.getData('text/flow-step');
      if (stepId) { store.move(stepId, store.list().length - 1); return; }
      var tpl = e.dataTransfer.getData('text/flow-tpl');
      if (tpl !== '' && g.FlowTemplates[tpl]) store.add(g.FlowTemplates[tpl].make());
    });

    store.subscribe(render);
    render();
  }

  g.FlowCanvas = { init: init };
})(window);
