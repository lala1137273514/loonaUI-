/* ============================================================
   行为等价证明：组件注册表重构前后路由完全一致。
   做法：用 stub window 加载 component-registry.js + carousel-adapter.js，
   对比派生出的 RESULT_COMPS / FOCUS_COMPS / build()→buildXxx 路由 与重构前的 golden。
   跑：node tools/verify-registry.js   （全绿 exit 0，任一失败 exit 1）
   ============================================================ */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');

/* ---- 重构前的 golden（从原始硬编码逐字抄录）---- */
var GOLDEN_RESULT = ['ListCard','SubjectCard','SectionCard','WeatherView','TravelView',
  'TravelViewA','TravelViewB','TravelDayFocus','TravelDayCard','NewsList','NewsFocus',
  'RestaurantView','card','TravelStages','TravelOverview','InspoFlow',
  'RouteView','HotelView','BudgetView','DestCompare','ThemeFlow'].sort();

var GOLDEN_FOCUS = ['NewsFocus','TravelDayFocus'].sort();

/* 重构前 build() switch 的 comp → buildXxx 函数名（default=buildSubject）。
   注：feed 类 comp（TravelStages/Overview/Inspo/DestCompare/ThemeFlow）在 engine 里
   被 _renderCarousel 顶部特判截走，不进 build()；这里只列会真正进 build() 的 comp。 */
var GOLDEN_BUILD = {
  NewsList:'buildNewsList', NewsFocus:'buildNewsSingle', ListCard:'buildListCard',
  SectionCard:'buildMeeting', WeatherView:'buildWeather', RestaurantView:'buildRestaurant',
  SubjectCard:'buildSubject', TravelView:'buildTravel', TravelViewA:'buildTravel',
  TravelViewB:'buildTravel', TravelDayCard:'buildTravel', TravelDayFocus:'buildTravelDaySingle',
  RouteView:'buildRoute', HotelView:'buildHotels', BudgetView:'buildBudget',
  card:'buildSubject' /* default 兜底 */
};

/* 重构前 engine._renderCarousel 顶部特判的 comp → feedXxx */
var GOLDEN_FEED = {
  TravelStages:'feedStages', TravelOverview:'feedOverview', InspoFlow:'feedInspo',
  DestCompare:'feedDestCompare', ThemeFlow:'feedThemeFlow'
};

/* ---- stub window，按页面顺序加载两份脚本 ---- */
var win = {};
var sandbox = { window: win };
sandbox.global = sandbox;
vm.createContext(sandbox);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel }); }
load('js/component-registry.js');
load('js/carousel-adapter.js');

var LC = win.LoonaComponents, A = win.LoonaCarouselAdapter, R = LC.registry;

/* ---- 断言工具 ---- */
var fails = [];
function eqSet(name, gotObj, goldenArr) {
  var got = Object.keys(gotObj).sort();
  var ok = got.length === goldenArr.length && got.every(function (k, i) { return k === goldenArr[i]; });
  if (!ok) fails.push(name + ' 不一致\n  golden: ' + JSON.stringify(goldenArr) + '\n  got   : ' + JSON.stringify(got));
  return ok;
}

/* 1) RESULT_COMPS == golden */
eqSet('RESULT_COMPS', LC.resultComps(), GOLDEN_RESULT);
/* 2) FOCUS_COMPS == golden */
eqSet('FOCUS_COMPS', LC.focusComps(), GOLDEN_FOCUS);

/* 3) 每个进 build() 的 comp 派生到的 buildXxx 名 == golden。
   build() 是闭包内私有，无法直接拿函数名，故让它跑一遍空 ev，用 BUILDERS 名反查不便；
   改为校验「注册表 build 字段（含 default 兜底语义）」与 GOLDEN_BUILD 一致。 */
function resolvedBuild(comp) {
  var d = R[comp];
  if (d && d.build) return d.build;
  return 'buildSubject';   // build() 兜底 default
}
Object.keys(GOLDEN_BUILD).forEach(function (comp) {
  var got = resolvedBuild(comp), want = GOLDEN_BUILD[comp];
  if (got !== want) fails.push('build[' + comp + '] golden=' + want + ' got=' + got);
});

/* 4) feed 路由 == golden（注册表 feed 字段） */
Object.keys(GOLDEN_FEED).forEach(function (comp) {
  var got = R[comp] && R[comp].feed, want = GOLDEN_FEED[comp];
  if (got !== want) fails.push('feed[' + comp + '] golden=' + want + ' got=' + got);
});
/* 反向：注册表里有 feed 的 comp 不能多/少于 golden */
var feedComps = Object.keys(R).filter(function (c) { return R[c].feed; }).sort();
var goldenFeedComps = Object.keys(GOLDEN_FEED).sort();
if (JSON.stringify(feedComps) !== JSON.stringify(goldenFeedComps))
  fails.push('feed comp 集合不一致 golden=' + JSON.stringify(goldenFeedComps) + ' got=' + JSON.stringify(feedComps));

/* 5) Adapter.isResult 仍用派生集合（抽样核对 carousel/overlay 判定） */
[['ListCard',true],['card',true],['TravelStages',true],['ClarifyCard',false],
 ['FailureCard',false],['confirm',false],['NewsList',true]].forEach(function (p) {
  var got = A.isResult({ comp: p[0] });
  if (got !== p[1]) fails.push('isResult[' + p[0] + '] golden=' + p[1] + ' got=' + got);
});

/* ---- 派生结果总表（人工可核）---- */
console.log('\n=== 注册表派生路由表（route / feed / build / isFocus / builder）===');
var order = Object.keys(R);
order.forEach(function (comp) {
  var d = R[comp];
  console.log(
    pad(comp, 18) + ' route=' + pad(d.route, 9) +
    ' feed=' + pad(d.feed || '-', 14) +
    ' build=' + pad(d.build || (d.route === 'carousel' ? '(default)buildSubject' : '-'), 22) +
    ' isFocus=' + pad(String(!!d.isFocus), 6) +
    ' builder=' + (d.builder || '-')
  );
});
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

console.log('\n=== GOLDEN 对照 ===');
console.log('RESULT_COMPS golden(' + GOLDEN_RESULT.length + '): ' + GOLDEN_RESULT.join(', '));
console.log('FOCUS_COMPS  golden(' + GOLDEN_FOCUS.length + '): ' + GOLDEN_FOCUS.join(', '));

if (fails.length) {
  console.log('\n❌ 失败 ' + fails.length + ' 项:');
  fails.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
} else {
  console.log('\n✅ 全绿：RESULT_COMPS / FOCUS_COMPS / build / feed / isResult 路由与重构前完全一致。');
  process.exit(0);
}
