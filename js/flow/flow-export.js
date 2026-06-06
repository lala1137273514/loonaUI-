/* ============================================================
   链路编排台 · 导出模块 FlowExport
   见 FLOW-CONTRACT.md。复制 JSON / 下载可直接丢进 cases/ 的 .js。
   不订阅 store，只在按钮点击时读 store。
   ============================================================ */
(function (g) {
  'use strict';

  function caseId(title) {
    var base = String(title || '').replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    return 'flow_' + (base || 'custom');
  }

  g.FlowExport = {
    init: function (store, refs) {
      refs = refs || {};
      var exportBtn = refs.exportBtn;
      var downloadBtn = refs.downloadBtn;
      var titleInput = refs.titleInput;
      var msgEl = refs.msgEl;

      var msgTimer = null;
      function msg(text) {
        if (!msgEl) return;
        msgEl.textContent = text;
      }
      function msgTemp(text) {
        msg(text);
        if (msgTimer) clearTimeout(msgTimer);
        msgTimer = setTimeout(function () { msg(''); }, 2000);
      }

      function buildCase() {
        return store.toCase({ title: (titleInput && titleInput.value) || '自定义链路' });
      }

      function saveDraft(json) {
        try { localStorage.setItem('loona_flow_draft', json); } catch (e) { /* localStorage 可能不可用 */ }
      }

      if (exportBtn) {
        exportBtn.addEventListener('click', function () {
          var c = buildCase();
          var json = JSON.stringify(c, null, 2);
          saveDraft(json);
          var n = c.events.length;
          if (g.navigator && g.navigator.clipboard && g.navigator.clipboard.writeText) {
            g.navigator.clipboard.writeText(json).then(function () {
              msgTemp('已复制 JSON（' + n + ' 步）');
            }, function () {
              g.prompt('复制下面的 JSON', json);
            });
          } else {
            g.prompt('复制下面的 JSON', json);
          }
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
          var c = buildCase();
          var id = caseId(c.title);
          c.task_id = id;
          var json = JSON.stringify(c, null, 2);
          saveDraft(json);
          var fileContent = "(function(g){g.LOONA_CASES=g.LOONA_CASES||{};g.LOONA_CASES['" + id + "']=" + json + ";})(window);\n";
          var blob = new Blob([fileContent], { type: 'application/javascript' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = id + '.js';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 0);
          msg('已下载 ' + id + '.js，丢进 cases/ 并在 index.html 加一行 <script> 即可播');
        });
      }
    }
  };
})(window);
