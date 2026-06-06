/* ============================================================
   链路编排台 · 检查器 FlowInspector（右侧表单）
   订阅 store，对 store.selected() 出编辑表单；改动即 store.update(id, patch)。
   见 FLOW-CONTRACT.md。
   关键：render 由 store 变更触发；用户正输入时若重建表单会丢光标。
   故仅在「选中项变化」或「变更 type 不是 update」时重建；
   同一选中项的 update 不重建（值本就是用户刚输入的，无需回灌）。
   ============================================================ */
(function (g) {
  'use strict';

  function init(store, mountEl) {
    var lastId = undefined;   // 上次渲染的选中 id（undefined=从未渲染）

    function el(tag, cls) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      return e;
    }

    /* 一个 .fi-field：label + 控件。controlType: 'input'|'textarea'|'select' */
    function field(label, controlType, value, attrs, onInput) {
      var wrap = el('div', 'fi-field');
      var lab = el('label');
      lab.textContent = label;
      wrap.appendChild(lab);

      var ctrl;
      if (controlType === 'textarea') {
        ctrl = el('textarea');
        ctrl.value = (value == null) ? '' : String(value);
      } else if (controlType === 'select') {
        ctrl = el('select');
        (attrs.options || []).forEach(function (opt) {
          var o = el('option');
          o.value = opt.value;
          o.textContent = opt.text;
          if (opt.value === value) o.selected = true;
          ctrl.appendChild(o);
        });
      } else {
        ctrl = el('input');
        ctrl.type = (attrs && attrs.type) || 'text';
        ctrl.value = (value == null) ? '' : String(value);
      }
      if (attrs && attrs.placeholder) ctrl.placeholder = attrs.placeholder;
      if (onInput) ctrl.addEventListener('input', function () { onInput(ctrl.value, ctrl); });
      wrap.appendChild(ctrl);
      return { wrap: wrap, ctrl: ctrl };
    }

    function section(title) {
      var sec = el('div', 'fi-section');
      var t = el('div', 'fi-section-t');
      t.textContent = title;
      sec.appendChild(t);
      return sec;
    }

    /* 数字字符串 → number 或 null（空串=null=不限） */
    function numOrNull(str) {
      if (str == null) return null;
      var s = String(str).trim();
      if (s === '') return null;
      var n = Number(s);
      return isNaN(n) ? null : n;
    }

    function render(snap) {
      var sel = store.selected();
      var id = sel ? sel.id : null;

      // 防丢光标：同一选中项的 update 不重建
      if (snap && snap.type === 'update' && id === lastId && lastId !== undefined) {
        return;
      }
      lastId = id;

      mountEl.innerHTML = '';

      if (!sel) {
        var empty = el('div', 'fi-empty');
        empty.textContent = '点中间任一步骤，在这里编辑';
        mountEl.appendChild(empty);
        return;
      }

      var comp = sel.comp;

      /* —— 节奏 —— */
      var secRhythm = section('节奏');
      secRhythm.appendChild(field('gap_ms（距上一步，毫秒）', 'input',
        sel.gap_ms, { type: 'number', placeholder: '默认 600' },
        function (v) { store.update(id, { gap_ms: numOrNull(v) }); }
      ).wrap);
      mountEl.appendChild(secRhythm);

      /* —— 文案 —— */
      var secText = section('文案');
      if (comp === 'user_query' || comp === 'tts') {
        secText.appendChild(field('text（' + (comp === 'tts' ? 'Loona 念的话' : '用户说的话') + '）', 'textarea',
          sel.text, {},
          function (v) { store.update(id, { text: v }); }
        ).wrap);
        if (comp === 'tts') {
          secText.appendChild(field('pace（语速）', 'select', sel.pace, {
            options: [
              { value: 'slow', text: 'slow' },
              { value: 'mid', text: 'mid' },
              { value: 'fast', text: 'fast' }
            ]
          }, function (v) { store.update(id, { pace: v }); }).wrap);
        }
      } else {
        // 其它卡型：编辑 step.tts.text（口播）
        var ttsText = (sel.tts && sel.tts.text) || '';
        secText.appendChild(field('口播 tts', 'textarea', ttsText, {},
          function (v) {
            var tts = sel.tts ? { text: sel.tts.text, pace: sel.tts.pace } : { text: '' };
            tts.text = v;
            store.update(id, { tts: tts });
          }
        ).wrap);
      }
      mountEl.appendChild(secText);

      /* —— 高亮 —— */
      var secHi = section('高亮');
      secHi.appendChild(field('highlight（要高亮的卡 id，可空）', 'input',
        sel.highlight, { placeholder: '如 A / d2，留空=不高亮' },
        function (v) {
          var t = String(v).trim();
          store.update(id, { highlight: t === '' ? null : t });
        }
      ).wrap);
      mountEl.appendChild(secHi);

      /* —— 尺寸 —— */
      var secSize = section('尺寸');
      var row = el('div', 'fi-row');
      var curW = sel.size ? sel.size.w : null;
      var curH = sel.size ? sel.size.h : null;
      function pushSize(w, h) {
        if (w == null && h == null) { store.update(id, { size: null }); return; }
        var sz = {};
        if (w != null) sz.w = w;
        if (h != null) sz.h = h;
        store.update(id, { size: sz });
      }
      var fW = field('size.w（px，空=不限）', 'input', curW, { type: 'number', placeholder: '不限' },
        function (v) { curW = numOrNull(v); pushSize(curW, curH); });
      var fH = field('size.h（px，空=不限）', 'input', curH, { type: 'number', placeholder: '不限' },
        function (v) { curH = numOrNull(v); pushSize(curW, curH); });
      row.appendChild(fW.wrap);
      row.appendChild(fH.wrap);
      secSize.appendChild(row);
      mountEl.appendChild(secSize);

      /* —— agent（仅 agent_step）—— */
      if (comp === 'agent_step') {
        var secAgent = section('agent');
        secAgent.appendChild(field('label', 'input', sel.label, {},
          function (v) { store.update(id, { label: v }); }
        ).wrap);
        secAgent.appendChild(field('decision（这一步怎么判的）', 'textarea', sel.decision, {},
          function (v) { store.update(id, { decision: v }); }
        ).wrap);
        var fieldsStr = (sel.fields && sel.fields.length) ? sel.fields.join(', ') : '';
        secAgent.appendChild(field('fields（逗号分隔）', 'input', fieldsStr, { placeholder: 'a, b, c' },
          function (v) {
            var arr = String(v).split(',').map(function (x) { return x.trim(); })
              .filter(function (x) { return x !== ''; });
            store.update(id, { fields: arr });
          }
        ).wrap);
        mountEl.appendChild(secAgent);
      }

      /* —— 状态（仅 toast）—— */
      if (comp === 'toast') {
        var secState = section('状态');
        secState.appendChild(field('state', 'select', sel.state, {
          options: [
            { value: 'searching', text: 'searching' },
            { value: 'reading', text: 'reading' },
            { value: 'sending', text: 'sending' },
            { value: 'processing', text: 'processing' },
            { value: 'saving', text: 'saving' },
            { value: 'done', text: 'done' },
            { value: 'fail', text: 'fail' }
          ]
        }, function (v) { store.update(id, { state: v }); }).wrap);
        secState.appendChild(field('dismiss_on', 'select', (sel.dismiss_on == null ? '' : sel.dismiss_on), {
          options: [
            { value: '', text: '（空）' },
            { value: 'card', text: 'card' }
          ]
        }, function (v) { store.update(id, { dismiss_on: v === '' ? null : v }); }).wrap);
        mountEl.appendChild(secState);
      }

      /* —— 卡内容（content 原始 JSON 兜底）—— */
      if (sel.content) {
        var secContent = section('卡内容');
        var cf = field('content（JSON，失焦校验）', 'textarea',
          JSON.stringify(sel.content, null, 2), {}, null);
        // 错误提示元素
        var errEl = el('div');
        errEl.style.color = '#ff5a5a';
        errEl.style.fontSize = '11px';
        errEl.style.marginTop = '4px';
        errEl.style.display = 'none';
        cf.ctrl.addEventListener('blur', function () {
          var raw = cf.ctrl.value;
          var ok = true, obj = null, msg = '';
          // 不静默吞错：解析失败把错误显示出来
          try {
            obj = JSON.parse(raw);
          } catch (e) {
            ok = false;
            msg = 'JSON 解析失败：' + e.message;
          }
          if (ok) {
            errEl.style.display = 'none';
            errEl.textContent = '';
            store.update(id, { content: obj });
          } else {
            errEl.style.display = 'block';
            errEl.textContent = msg;
          }
        });
        cf.wrap.appendChild(errEl);
        secContent.appendChild(cf.wrap);
        mountEl.appendChild(secContent);
      }
    }

    store.subscribe(render);
    render({ type: 'init' });
  }

  g.FlowInspector = { init: init };
})(window);
