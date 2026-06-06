/* ============================================================
   Loona 工作台 · 组件注册表（单一真值）
   一个 comp 的"身份"原本散在 6 处硬编码、靠 comp→kind→class 三套名人工对齐。
   这张表把每个 comp 的路由身份集中声明一次，由 adapter/engine/carousel/components 查表派生。
   忠实编码现有行为，不改任何 buildXxx / buildXxxCard / clarifyCard DOM builder 本体。

   字段说明：
     route   : 'carousel' | 'overlay'    —— 走轮播还是玻璃浮层
     feed    : null | 'feedStages'|...    —— engine._renderCarousel 走两阶段封面/下钻时调的 Adapter 方法名；
                                            null = 走通用 Adapter.feed()→build()
     build   : null | 'buildNewsList'|... —— Adapter.build() switch 派生：comp → 哪个 buildXxx 数据转换函数名；
                                            null = 不经 build()（feed 类自带数据转换）
     isFocus : true|false                 —— 是否"只重定位聚焦"（FOCUS_COMPS）
     builder : 'clarifyCard'|...          —— route==='overlay' 时 CARD_BUILDERS 的浮层卡 builder 名

   注：RESULT_COMPS = route==='carousel' 的 comp 集合（与原始硬编码集合完全一致）。
       carousel.js 的 kind→builder 不在此表（kind 由 build()/feedXxx 产出的 item.kind 决定，
       是数据层的二级分发），保留在 carousel.js 内 KIND_BUILDERS map。
   ============================================================ */
(function (global) {
  'use strict';

  var R = {
    /* ---- 结果卡（走轮播，通用 build()）---- */
    ListCard:        { route: 'carousel', feed: null, build: 'buildListCard',        isFocus: false },
    SubjectCard:     { route: 'carousel', feed: null, build: 'buildSubject',         isFocus: false },
    SectionCard:     { route: 'carousel', feed: null, build: 'buildMeeting',         isFocus: false },
    WeatherView:     { route: 'carousel', feed: null, build: 'buildWeather',         isFocus: false },
    TravelView:      { route: 'carousel', feed: null, build: 'buildTravel',          isFocus: false },
    TravelViewA:     { route: 'carousel', feed: null, build: 'buildTravel',          isFocus: false },
    TravelViewB:     { route: 'carousel', feed: null, build: 'buildTravel',          isFocus: false },
    TravelDayCard:   { route: 'carousel', feed: null, build: 'buildTravel',          isFocus: false },
    TravelDayFocus:  { route: 'carousel', feed: null, build: 'buildTravelDaySingle', isFocus: true  },
    NewsList:        { route: 'carousel', feed: null, build: 'buildNewsList',        isFocus: false },
    NewsFocus:       { route: 'carousel', feed: null, build: 'buildNewsSingle',      isFocus: true  },
    RestaurantView:  { route: 'carousel', feed: null, build: 'buildRestaurant',      isFocus: false },
    card:            { route: 'carousel', feed: null, build: null /*default→buildSubject*/, isFocus: false },
    RouteView:       { route: 'carousel', feed: null, build: 'buildRoute',           isFocus: false },
    HotelView:       { route: 'carousel', feed: null, build: 'buildHotels',          isFocus: false },
    BudgetView:      { route: 'carousel', feed: null, build: 'buildBudget',          isFocus: false },

    /* ---- 旅行两阶段/封面→下钻（走轮播，专用 feedXxx，不经 build()）---- */
    TravelStages:    { route: 'carousel', feed: 'feedStages',      build: null, isFocus: false },
    TravelOverview:  { route: 'carousel', feed: 'feedOverview',    build: null, isFocus: false },
    InspoFlow:       { route: 'carousel', feed: 'feedInspo',       build: null, isFocus: false },
    DestCompare:     { route: 'carousel', feed: 'feedDestCompare', build: null, isFocus: false },
    ThemeFlow:       { route: 'carousel', feed: 'feedThemeFlow',   build: null, isFocus: false },

    /* ---- 浮层卡（玻璃浮层，CARD_BUILDERS）---- */
    ClarifyCard:        { route: 'overlay', builder: 'clarifyCard' },
    ResultCard:         { route: 'overlay', builder: 'resultCard' },
    FailureCard:        { route: 'overlay', builder: 'failureCard' },
    EmailCard:          { route: 'overlay', builder: 'emailCard' },
    MeetingActionCard:  { route: 'overlay', builder: 'meetingActionCard' },
    WeatherCard:        { route: 'overlay', builder: 'weatherCard' },
    NewsCard:           { route: 'overlay', builder: 'newsCard' },
    CalendarCard:       { route: 'overlay', builder: 'calendarCard' },
    RestaurantCard:     { route: 'overlay', builder: 'restaurantCard' },
    WorkflowCard:       { route: 'overlay', builder: 'workflowCard' }
  };

  /* 由注册表派生 comp 名集合（{comp:1} 形态，保持与原始硬编码一致的查表语义） */
  function compsWhere(pred) {
    var out = {};
    for (var comp in R) { if (R.hasOwnProperty(comp) && pred(R[comp], comp)) out[comp] = 1; }
    return out;
  }

  global.LoonaComponents = {
    registry: R,
    get: function (comp) { return R[comp] || null; },
    /* RESULT_COMPS：route==='carousel' 的 comp（结果卡进轮播） */
    resultComps: function () { return compsWhere(function (d) { return d.route === 'carousel'; }); },
    /* FOCUS_COMPS：isFocus 的 comp（只重定位聚焦） */
    focusComps: function () { return compsWhere(function (d) { return d.isFocus === true; }); },
    /* CARD_BUILDERS overlay 映射：comp → builder 名（route==='overlay' 且声明了 builder） */
    overlayBuilders: function () {
      var out = {};
      for (var comp in R) { if (R.hasOwnProperty(comp) && R[comp].route === 'overlay' && R[comp].builder) out[comp] = R[comp].builder; }
      return out;
    }
  };
})(window);
