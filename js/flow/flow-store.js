/* ============================================================
   链路编排台 · 数据真值 FlowStore（无 DOM，纯状态）
   见 FLOW-CONTRACT.md。所有模块只通过本 store 联动。
   ============================================================ */
(function (g) {
  'use strict';
  var _seq = 0;
  function uid() { return 's' + (++_seq); }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  function createStore() {
    var steps = [];
    var selectedId = null;
    var subs = [];

    function emit(type) {
      var snap = { steps: steps, selectedId: selectedId, type: type };
      subs.slice().forEach(function (f) { try { f(snap); } catch (e) { console.error('[FlowStore] subscriber error:', e); } });
    }
    function idxOf(id) { for (var i = 0; i < steps.length; i++) if (steps[i].id === id) return i; return -1; }

    var store = {
      list: function () { return steps; },
      get: function (id) { var i = idxOf(id); return i < 0 ? null : steps[i]; },
      selected: function () { return store.get(selectedId); },
      selectedId: function () { return selectedId; },

      add: function (step, at) {
        step = clone(step) || {};
        if (!step.id) step.id = uid();
        if (typeof at === 'number' && at >= 0 && at <= steps.length) steps.splice(at, 0, step);
        else steps.push(step);
        selectedId = step.id;
        emit('add');
        return step.id;
      },
      update: function (id, patch) {
        var s = store.get(id); if (!s) return;
        for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) s[k] = patch[k];
        emit('update');
      },
      remove: function (id) {
        var i = idxOf(id); if (i < 0) return;
        steps.splice(i, 1);
        if (selectedId === id) selectedId = steps.length ? steps[Math.min(i, steps.length - 1)].id : null;
        emit('remove');
      },
      duplicate: function (id) {
        var i = idxOf(id); if (i < 0) return null;
        var c = clone(steps[i]); c.id = uid();
        steps.splice(i + 1, 0, c); selectedId = c.id; emit('duplicate'); return c.id;
      },
      move: function (id, to) {
        var i = idxOf(id); if (i < 0) return;
        var t = (to === 'up') ? i - 1 : (to === 'down') ? i + 1 : to;
        if (t < 0 || t >= steps.length || t === i) return;
        var s = steps.splice(i, 1)[0]; steps.splice(t, 0, s); emit('move');
      },
      select: function (id) { selectedId = id; emit('select'); },
      clear: function () { steps = []; selectedId = null; emit('clear'); },

      subscribe: function (fn) {
        subs.push(fn);
        return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
      },

      /* steps → engine events（剥 id，按 gap_ms 累加 t 作时间线标签） */
      toEvents: function () {
        var t = 0;
        return steps.map(function (s) {
          var ev = clone(s); delete ev.id;
          var gap = (ev.gap_ms == null) ? 600 : ev.gap_ms;
          ev.t = t; t += gap;
          return ev;
        });
      },
      toCase: function (meta) {
        meta = meta || {};
        return {
          task_id: meta.task_id || 'flow_custom',
          title: meta.title || '自定义链路',
          scene: meta.scene || 'travel',
          default_skin: meta.default_skin || 'glass',
          decision_record: meta.decision_record || { request_type: 'task', primary_need: '自定义', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
          events: store.toEvents(),
          annotations: []
        };
      },
      loadCase: function (caseObj) {
        steps = [];
        ((caseObj && caseObj.events) || []).forEach(function (ev) {
          var s = clone(ev); s.id = uid(); delete s.t; steps.push(s);
        });
        selectedId = steps.length ? steps[0].id : null;
        emit('load');
      }
    };
    return store;
  }

  g.FlowStore = { create: createStore };
})(window);
