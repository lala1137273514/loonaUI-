/* ============================================================
   Loona 工作台 · 评论同步层（CommentSync）
   可插拔：默认 localStorage（单机持久化 + file:// 离线兜底）；
   配置了 window.LOONA_SUPABASE 则升级为 Supabase Realtime 多人实时同步。
   评论 = caseObj.annotations 里的对象（type:'comment' 或 '卡点'），按 task_id 同步。
   editor.js 增删评论后调 notifyAdd/notifyRemove；console.js 载入 case 后调 bind。
   ============================================================ */
(function (global) {
  'use strict';
  var CFG = global.LOONA_SUPABASE || null;
  var TABLE = (CFG && CFG.table) || 'comments';
  var client = null;

  // 当前绑定：哪个 task 的哪个 annotations 数组（引擎持有的同一引用），变更后回调重绘
  var cur = { taskId: null, anns: null, onChange: function () {}, sub: null };

  function lsKey(t) { return 'loona_comments_' + t; }
  function genId(type) { return (type === '卡点' ? 'k' : 'c') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function ensureId(a) { if (!a.id) a.id = genId(a.type); return a.id; }
  function loadLocal(t) { try { return JSON.parse((global.localStorage && localStorage.getItem(lsKey(t))) || '[]') || []; } catch (e) { return []; } }
  function saveLocal(t, anns) {
    try { if (!global.localStorage) return; localStorage.setItem(lsKey(t), JSON.stringify(anns.filter(function (a) { return a.id; }))); } catch (e) {}
  }
  // 把 incoming 合并进 anns（按 id 去重）；返回是否有新增
  function mergeInto(anns, incoming) {
    var have = {}, changed = false;
    anns.forEach(function (a) { if (a.id) have[a.id] = true; });
    incoming.forEach(function (r) { if (r && r.id && !have[r.id]) { anns.push(r); have[r.id] = true; changed = true; } });
    return changed;
  }
  function annToRow(taskId, a) { return { id: a.id, task_id: taskId, event_idx: a.event_idx, type: a.type, text: a.text || '', author: a.author || null, at: a.at || new Date().toISOString() }; }
  function rowToAnn(r) { var a = { id: r.id, event_idx: r.event_idx, type: r.type, text: r.text || '' }; if (r.author) a.author = r.author; if (r.at) a.at = r.at; return a; }

  function initClient() {
    if (client || !CFG || !CFG.url || !CFG.anonKey) return;
    if (!(global.supabase && global.supabase.createClient)) return;   // CDN 还没到/没联网 → 留 local
    try { client = global.supabase.createClient(CFG.url, CFG.anonKey); } catch (e) { client = null; }
  }

  var CommentSync = {
    mode: function () { return client ? 'supabase' : 'local'; },

    /* 载入某 case 时绑定：anns = 引擎里的 caseObj.annotations（同一引用，原地增删） */
    bind: function (taskId, anns, onChange) {
      this._unsub();
      cur.taskId = taskId; cur.anns = anns; cur.onChange = onChange || function () {};
      // 1) 本地已存评论合并回来（跨刷新持久化）
      if (mergeInto(anns, loadLocal(taskId))) cur.onChange();
      // 2) 远程：拉历史 + 订阅实时
      initClient();
      if (!client) return;
      client.from(TABLE).select('*').eq('task_id', taskId).then(function (res) {
        if (!res || res.error || cur.taskId !== taskId) return;
        var rows = (res.data || []).map(rowToAnn);
        if (mergeInto(anns, rows)) { saveLocal(taskId, anns); cur.onChange(); }
      });
      cur.sub = client.channel('loona-' + taskId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE, filter: 'task_id=eq.' + taskId }, function (p) {
          if (cur.taskId !== taskId || !p.new) return;
          if (mergeInto(anns, [rowToAnn(p.new)])) { saveLocal(taskId, anns); cur.onChange(); }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: TABLE }, function (p) {
          var id = p.old && p.old.id; if (!id) return;
          var i = anns.findIndex(function (a) { return a.id === id; });
          if (i >= 0) { anns.splice(i, 1); saveLocal(taskId, anns); cur.onChange(); }
        })
        .subscribe();
    },
    _unsub: function () { if (cur.sub && client) { try { client.removeChannel(cur.sub); } catch (e) {} } cur.sub = null; },

    /* editor 加了一条评论/卡点（已 push 进 cur.anns）→ 持久化 + 远程插入 */
    notifyAdd: function (ann) {
      if (!cur.taskId || !ann) return;
      ensureId(ann);
      saveLocal(cur.taskId, cur.anns);
      if (client) client.from(TABLE).insert(annToRow(cur.taskId, ann)).then(function () {}, function () {});
    },
    /* editor 删了一条（已从 cur.anns splice）→ 持久化 + 远程删除 */
    notifyRemove: function (ann) {
      if (!cur.taskId) return;
      saveLocal(cur.taskId, cur.anns);
      if (client && ann && ann.id) client.from(TABLE).delete().eq('id', ann.id).then(function () {}, function () {});
    },

    /* config.js 注入的 supabase-js CDN 加载完成后回调：升级当前绑定为实时 */
    onClientReady: function () {
      initClient();
      if (client && cur.taskId) this.bind(cur.taskId, cur.anns, cur.onChange);
    }
  };

  global.LoonaCommentSync = CommentSync;
})(window);
