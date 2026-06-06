/* ============================================================
   行为等价证明：carousel-adapter 从「共享可变单例」改为「工厂 + 每实例独立态」后，
   去共享态成立 + 态流转与原行为一致。
   做法：stub window 加载 component-registry.js + carousel-adapter.js（同页面顺序）。
   跑：node tools/verify-adapter.js   （全绿 exit 0，任一失败 exit 1）
   ============================================================ */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');

var win = {};
var sandbox = { window: win };
sandbox.global = sandbox;
vm.createContext(sandbox);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel }); }
load('js/component-registry.js');
load('js/carousel-adapter.js');

var F = win.LoonaCarouselAdapter;
var fails = [];
function assert(cond, msg) { if (!cond) fails.push(msg); }

/* ---- 0) 工厂形态 ---- */
assert(typeof F.create === 'function', 'LoonaCarouselAdapter.create 应为函数（工厂）');
assert(typeof F.isResult === 'function', 'LoonaCarouselAdapter.isResult 应作为静态助手可用');

/* ---- 1) isResult 静态/实例都对（与重构前集合一致）---- */
assert(F.isResult({ comp: 'TravelView' }) === true, '静态 isResult(TravelView) 应为 true');
assert(!F.isResult({ comp: 'ClarifyCard' }), '静态 isResult(ClarifyCard) 应为假值');
var probe = F.create();
assert(probe.isResult({ comp: 'TravelView' }) === true, '实例 isResult(TravelView) 应为 true');
assert(!probe.isResult({ comp: 'ClarifyCard' }), '实例 isResult(ClarifyCard) 应为假值');

/* ---- 2) 去共享态：对 a 喂数据，b 不受影响 ---- */
var a = F.create(), b = F.create();
// b 初态为空
assert(a.stages === null && a.mode === null && a.current === null, 'a 初态应全空');
assert(b.stages === null && b.mode === null && b.current === null, 'b 初态应全空');

var inspoEv = {
  comp: 'InspoFlow',
  content: {
    echo: '种草灵感',
    cards: [
      { id: 'c1', title: '洱海骑行', photo: 'p1', tags: ['骑行'], punchline: '环湖', rec: '推荐',
        detail: { label: '洱海一天', pace: '悠闲', nodes: [{ time: '09:00', place: '才村码头' }], footer: '日落很美' } },
      { id: 'c2', title: '喜洲古镇', photo: 'p2', tags: ['古镇'], punchline: '白族',  rec: '可选',
        detail: { label: '喜洲一天', pace: '文艺', nodes: [{ time: '14:00', place: '严家大院' }], footer: '扎染体验' } }
    ]
  }
};

var coverA = a.feedInspo(inspoEv);
assert(coverA && coverA.items.length === 2, 'a.feedInspo 应产出 2 张封面卡');
assert(a.mode === 'overview', 'a.feedInspo 后 mode 应为 overview');
assert(a.stages && Object.keys(a.stages.detailByStage).length === 2, 'a 应有 2 个阶段详情');

// 关键断言：b 的可变态完全不受 a 影响（证明共享态已消除）
assert(b.stages === null, '去共享态失败：a.feedInspo 污染了 b.stages');
assert(b.mode === null,   '去共享态失败：a.feedInspo 污染了 b.mode');
assert(b.current === null,'去共享态失败：a.feedInspo 污染了 b.current');

/* ---- 3) 同一实例 feed→drill→backToOverview 态流转与重构前一致 ---- */
var trace = [];
trace.push('after feedInspo: mode=' + a.mode + ' curStage=' + (a.stages.curStage));
// drill 进 c1 详情
var d = a.drillByCoverIdx(1);
assert(d && d.carousel && d.carousel.items.length === 1, 'drillByCoverIdx(1) 应进 c1 详情(1 张日卡)');
assert(a.mode === 'detail', 'drill 后 mode 应为 detail');
assert(a.stages.curStage === 'c1', 'drill 后 curStage 应为 c1');
trace.push('after drill(1): mode=' + a.mode + ' curStage=' + a.stages.curStage + ' stageTitle=' + d.stageTitle);

// 详情态下 highlight 走天 id
var hi = a.highlightToIdx('c1');
assert(hi === 1, 'detail 态 highlightToIdx(c1) 应回 1');

// back 回总览
var back = a.backToOverview();
assert(back && back.carousel && back.carousel.items.length === 2, 'backToOverview 应回 2 张封面');
assert(a.mode === 'overview', 'back 后 mode 应回 overview');
trace.push('after back: mode=' + a.mode);

// 总览态 highlight 走阶段 id
var hi2 = a.highlightToIdx('c2');
assert(hi2 === 2, 'overview 态 highlightToIdx(c2) 应回封面 idx 2');

/* ---- 4) 扁平结果卡 feed 清掉残留 stages（原 this.stages=null 补丁的等价行为）---- */
var newsEv = { comp: 'NewsList', content: { title: '搜索', items: [{ id: 'n1', title: '头条', summary: 's' }] } };
var res = a.feed(newsEv);
assert(res.action === 'render', 'feed(NewsList) 应 render');
assert(a.stages === null, 'feed 扁平结果卡后应清掉残留 stages');
assert(a.mode === null, 'feed 扁平结果卡后 mode 应清空');
assert(a.current && a.current.carousel.items.length === 1, 'feed(NewsList) current 应有 1 张');
trace.push('after feed(NewsList): mode=' + a.mode + ' stages=' + a.stages + ' curItems=' + a.current.carousel.items.length);

/* ---- 5) reset 清态（保留兼容）---- */
a.reset();
assert(a.current === null && a.stages === null && a.mode === null, 'reset 应清空 current/stages/mode');

/* ---- 输出 ---- */
console.log('=== adapter 态流转 trace ===');
trace.forEach(function (t) { console.log('  ' + t); });

if (fails.length) {
  console.log('\n❌ 失败 ' + fails.length + ' 项:');
  fails.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
} else {
  console.log('\n✅ 全绿：工厂去共享态成立(a 喂数据 b 不受影响) + feed/drill/back/highlight/reset 态流转一致。');
  process.exit(0);
}
