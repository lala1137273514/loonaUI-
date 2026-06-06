/* ============================================================
   Loona 工作台 · 结果卡 → web_ui 轮播适配器
   把工作台 case 事件链里的「结果卡」事件转换成 web_ui carousel 的 item 形态，
   喂给原样搬来的 js/carousel.js（CortexCarousel）。只负责数据形态对齐，不改样式。
   契约见 web_ui/app/carousel_normalizer.py：
     carousel = { source_tool_name, title, items:[item], active_item_idx }
     item     = { item_idx, kind, title, subtitle, meta, summary, link, priority, photo?, reminder?, nodes?, location?, raw }
     kind ∈ trip | search(新闻) | mail | event | weather | ''(generic)
   ============================================================ */
(function (global) {
  'use strict';

  function strip(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
  function isTime(s) { return /^\d{1,2}:\d{2}$/.test(String(s || '').trim()); }

  function mkItem(idx, kind, o) {
    o = o || {};
    return {
      item_idx: idx, kind: kind,
      title: o.title || ('条目 ' + idx),
      subtitle: o.subtitle || null, meta: o.meta || null, summary: o.summary || null,
      link: o.link || null, priority: o.priority || null,
      photo: o.photo || null, reminder: o.reminder || null,
      nodes: o.nodes || null, location: o.location || null,
      tags: o.tags || null, hook: o.hook || null, rows: o.rows || null, rec: o.rec || null,
      event_date: o.event_date || null, event_start_sort: o.event_start_sort == null ? null : o.event_start_sort,
      raw: o.raw || {}, _id: o.id || null
    };
  }
  function wrap(source_tool_name, title, items) {
    var idMap = {};
    items.forEach(function (it) { if (it._id) idMap[it._id] = it.item_idx; });
    return { carousel: { source_tool_name: source_tool_name, title: title, items: items, active_item_idx: null }, idMap: idMap };
  }

  /* 哪些 comp 算「结果卡」（进轮播）。澄清/确认/失败/状态/字幕不在此列。
     单一真值：由组件注册表派生（route==='carousel'），不再硬列。 */
  var RESULT_COMPS = global.LoonaComponents.resultComps();

  /* ---- 旅行两阶段：stages（阶段，可含多天）→ ①封面 items ②按阶段分组的逐天详情 items ---- */
  function dayToItem(idx, day) {
    /* reminder = 当天主线串(交通/总里程/总时长)，渲染在卡头标题下方。仅当 case 提供 theme/transport/total 时才出，老 case 不受影响 */
    var rem = [day.transport, day.total].filter(Boolean).join(' · ') || null;
    return mkItem(idx, 'trip', {
      id: day.id, title: day.label, subtitle: day.pace, photo: day.photo, reminder: rem,
      nodes: Array.isArray(day.nodes) ? day.nodes : null, summary: strip(day.footer || day.card_footer), raw: day
    });
  }
  /* 单一真值：由组件注册表派生（isFocus===true） */
  var FOCUS_COMPS = global.LoonaComponents.focusComps();

  /* ---- 各 comp → items ---- */
  function buildNewsList(ev) {
    var c = ev.content || {}, items = (c.items || []).map(function (it, i) {
      return mkItem(i + 1, 'search', {
        id: it.id, title: it.title, photo: it.image,
        summary: it.summary || it.lead, subtitle: it.source, meta: it.time,
        link: it.link || it.url, priority: it.priority, raw: it
      });
    });
    return wrap('web_search', c.title || '搜索结果', items);
  }
  function buildNewsSingle(ev) {
    var c = ev.content || {}, it = c.item || c;
    return wrap('web_search', '搜索结果', [mkItem(1, 'search', {
      id: it.id, title: it.title, photo: it.image, summary: it.lead || it.summary,
      subtitle: it.source, meta: it.time, link: it.link || it.url, priority: it.priority, raw: it
    })]);
  }

  function buildEmail(ev) {
    var c = ev.content || {}, items = (c.rows || []).map(function (r, i) {
      var sub = String(r.sub || ''), parts = sub.split(' · ');
      var from = r.from || (parts.length > 1 ? parts[0] : null);
      var summary = r.summary || (parts.length > 1 ? parts.slice(1).join(' · ') : r.sub || null);
      return mkItem(i + 1, 'mail', {
        id: r.id, title: r.title, subtitle: from, summary: summary,
        priority: r.badge && /^P\d/.test(r.badge.text || '') ? r.badge.text : null,
        meta: r.received_at || r.time || r.right, raw: r
      });
    });
    return wrap('get_mail_list', c.title || '邮件', items);
  }

  function buildCalendar(ev) {
    var c = ev.content || {}, items = (c.rows || []).map(function (r, i) {
      var meta = r.meta || r.time || r.lead;
      if (c.source_tool_name === 'list_events' && (r.raw_start || r.raw_end)) meta = [r.raw_start, r.raw_end].filter(Boolean).join(' - ');
      return mkItem(i + 1, 'event', {
        id: r.id, title: r.title, meta: meta, summary: r.summary || null, location: r.location || r.sub,
        subtitle: r.organizer || r.subtitle || null,
        priority: r.priority || (r.badge && r.badge.text),
        event_date: r.event_date,
        event_start_sort: r.event_start_sort,
        raw: { start: r.raw_start ? { dateTime: r.raw_start } : null, end: r.raw_end ? { dateTime: r.raw_end } : null, location: r.location || r.sub, row: r }
      });
    });
    // 旧日程 case 无日期，继续逐条出 event 卡；Cortex 范式 case 显式声明 list_events 后按天聚合。
    return wrap(c.source_tool_name === 'list_events' ? 'list_events' : 'calendar', c.title || '日程', items);
  }

  function buildListCard(ev) {
    var c = ev.content || {}, rows = c.rows || [];
    if (c.source_tool_name === 'get_mail_list') return buildEmail(ev);
    if (c.source_tool_name === 'list_events') return buildCalendar(ev);
    if (rows.length && isTime(rows[0].lead)) return buildCalendar(ev);
    var looksMail = /邮件/.test(c.title || '') || rows.some(function (r) { return r.right || (r.badge && /^P\d/.test(r.badge.text || '')); });
    if (looksMail) return buildEmail(ev);
    // 工作流/其它列表 → generic
    var items = rows.map(function (r, i) {
      return mkItem(i + 1, '', { id: r.id, title: r.title, summary: r.sub, subtitle: r.badge && r.badge.text, raw: r });
    });
    return wrap('list', c.title || '结果', items);
  }

  function buildMeeting(ev) {
    var c = ev.content || {}, items = (c.sections || []).map(function (s, i) {
      var summary = s.text || (s.rows || []).map(function (r) { return r.title; }).filter(Boolean).join('；');
      return mkItem(i + 1, '', { id: s.id, title: s.label, summary: summary, subtitle: s.badge && s.badge.text, raw: s });
    });
    return wrap('meeting', c.title || '会议结论', items);
  }

  function tripItemsFromContent(c) {
    // 契约形态 cards[] 优先；否则 legacy sections[]
    if (Array.isArray(c.cards) && c.cards.length) {
      return c.cards.map(function (card, i) {
        /* reminder = 当天主线串(交通·总里程/时长)，渲染在卡头标题下方。仅当 card 给了 transport/total 才出，老 case(无字段)不受影响 */
        var rem = [card.transport, card.total].filter(Boolean).join(' · ') || null;
        return mkItem(i + 1, 'trip', {
          id: card.id, title: card.label, subtitle: card.pace, photo: card.photo, reminder: rem,
          nodes: Array.isArray(card.nodes) ? card.nodes : null,
          summary: strip(card.card_footer || card.footer), raw: card
        });
      });
    }
    if (Array.isArray(c.sections) && c.sections.length) {
      return c.sections.map(function (s, i) {
        return mkItem(i + 1, 'trip', {
          id: s.id, title: s.label, subtitle: s.badge && s.badge.text,
          summary: strip(s.text), raw: s
        });
      });
    }
    return [];
  }
  function buildTravel(ev) {
    var c = ev.content || {};
    return wrap('trip', c.title || '旅行规划', tripItemsFromContent(c));
  }
  function buildTravelDaySingle(ev) {
    var c = ev.content || {};
    return wrap('trip', '旅行规划', [mkItem(1, 'trip', {
      id: c.id, title: c.title, subtitle: c.badge && c.badge.text, photo: c.photo,
      nodes: Array.isArray(c.nodes) ? c.nodes : null, summary: strip(c.footer), raw: c
    })]);
  }

  function buildWeather(ev) {
    var c = ev.content || {};
    var title = String(c.title || '天气').split(' · ')[0];
    var days = (c.rows || []).map(function (r) {
      var m = String(r.title || '').match(/(-?\d+)\D+(-?\d+)/);   // "19~25°"
      var day = {};
      if (m) { day.mintempC = m[1]; day.maxtempC = m[2]; }
      return { date: r.lead || '', day: day };
    });
    return wrap('get_weather', c.title || '天气', [mkItem(1, 'weather', {
      title: title, summary: c.headline || null,
      raw: { location: { name: title }, current: {}, forecast: { forecastday: days } }
    })]);
  }

  function buildRestaurant(ev) {
    var c = ev.content || {};
    var detail = [c.headline, c.meta, (c.tags || []).join(' · ')].filter(Boolean).join(' · ');
    return wrap('restaurant', c.title || '餐厅', [mkItem(1, '', {
      id: c.id || c.title, title: c.title, summary: detail, subtitle: c.badge && c.badge.text, raw: c
    })]);
  }

  function buildSubject(ev) {
    var c = ev.content || {};
    var detail = [c.headline, c.meta].filter(Boolean).join(' · ') || (c.rows || []).map(function (r) { return (r.lead ? r.lead + ' ' : '') + r.title; }).join('；');
    return wrap('subject', c.title || '结果', [mkItem(1, '', { id: c.id, title: c.title, summary: detail, subtitle: c.badge && c.badge.text, raw: c })]);
  }

  /* 交通路线：content.routes[] → 每条一张 route 卡（自定义字段塞 raw，卡构建器读 raw） */
  function buildRoute(ev) {
    var c = ev.content || {}, items = (c.routes || []).map(function (r, i) {
      return mkItem(i + 1, 'route', { id: r.id, title: (r.from || '') + '→' + (r.to || ''), raw: r });
    });
    return wrap('route', c.title || '交通路线', items);
  }
  /* 酒店住宿：content.hotels[] → 每家一张 hotel 卡 */
  function buildHotels(ev) {
    var c = ev.content || {}, items = (c.hotels || []).map(function (h, i) {
      return mkItem(i + 1, 'hotel', { id: h.id, title: h.name, photo: h.photo, raw: h });
    });
    return wrap('hotel', c.title || '住宿', items);
  }
  /* 预算花费：单张 budget 卡（分项 CSS 条形 + 合计） */
  function buildBudget(ev) {
    var c = ev.content || {};
    return wrap('budget', c.title || '预算', [mkItem(1, 'budget', { id: c.id || 'budget', title: c.title, raw: c })]);
  }

  /* comp → buildXxx 数据转换函数：由注册表 build 字段派生（单一真值），不再硬写 switch。
     注册表里 build:null（feed 类）或未登记的 comp 走兜底 buildSubject(generic 单卡)。 */
  var BUILDERS = {
    buildNewsList: buildNewsList, buildNewsSingle: buildNewsSingle,
    buildListCard: buildListCard, buildMeeting: buildMeeting,
    buildWeather: buildWeather, buildRestaurant: buildRestaurant,
    buildSubject: buildSubject, buildTravel: buildTravel,
    buildTravelDaySingle: buildTravelDaySingle,
    buildRoute: buildRoute, buildHotels: buildHotels, buildBudget: buildBudget
  };
  function build(ev) {
    var def = global.LoonaComponents.get(ev.comp);
    var fn = def && def.build ? BUILDERS[def.build] : null;
    return (fn || buildSubject)(ev);   // 兜底：generic 单卡
  }

  /* 无状态助手：与实例态无关的纯判定，既挂工厂(静态)又进实例原型（调用点二者皆可拿到）。 */
  function isResult(ev) { return !!(ev && RESULT_COMPS[ev.comp]); }

  /* 实例方法集：current/stages/mode/curStage 是「每个实例自己的」可变导航态，
     不再是模块级共享单例——engine/flow-render 各持一个实例，跨调用/切 case 天然无残留。 */
  var proto = {
    isResult: isResult,

    /* TravelStages 事件 → 建封面轮播 + 各阶段详情轮播；返回封面轮播（一阶段总览） */
    feedStages: function (ev) {
      var c = ev.content || {}, stages = c.stages || [];
      var coverItems = [], detailByStage = {}, dayToStage = {}, coverIdxByStage = {};
      stages.forEach(function (s, si) {
        var idx = si + 1;
        coverItems.push(mkItem(idx, 'trip-cover', { id: s.id, title: s.title, photo: s.photo, tags: s.tags || [], hook: s.hook, raw: s }));
        coverIdxByStage[s.id] = idx;
        var dayItems = (s.days || []).map(function (d, di) { return dayToItem(di + 1, d); });
        var dayIdx = {}; dayItems.forEach(function (it) { if (it._id) dayIdx[it._id] = it.item_idx; });
        (s.days || []).forEach(function (d) { dayToStage[d.id] = s.id; });
        detailByStage[s.id] = { carousel: { source_tool_name: 'trip', title: '旅行规划 · ' + (s.title || ''), items: dayItems, active_item_idx: null }, dayIdx: dayIdx, title: s.title };
      });
      this.stages = {
        coverCarousel: { source_tool_name: 'trip', title: c.title || '旅行规划', items: coverItems, active_item_idx: null },
        detailByStage: detailByStage, dayToStage: dayToStage, coverIdxByStage: coverIdxByStage, curStage: null
      };
      this.mode = 'overview';
      return this.stages.coverCarousel;
    },
    /* C 方案：城市总览（单张总览卡 + 每日亮点行）；行下钻=按 day id，复用 stages 结构 */
    feedOverview: function (ev) {
      var c = ev.content || {}, days = c.days || [];
      var overview = mkItem(1, 'travel-overview', {
        title: (c.city || '行程') + (c.duration ? ' · ' + c.duration : ''), photo: c.photo, tags: c.tags || [],
        rows: days.map(function (d) { return { id: d.id, day: d.day, place: d.place, tag: d.tag, thumb: d.thumb || d.photo }; })
      });
      var detailByStage = {}, dayToStage = {}, coverIdxByStage = {};
      days.forEach(function (d) {
        var m = {}; m[d.id] = 1;
        detailByStage[d.id] = { carousel: { source_tool_name: 'trip', title: '行程 · ' + (d.day || ''), items: [dayToItem(1, d)], active_item_idx: null }, dayIdx: m, title: d.day };
        dayToStage[d.id] = d.id; coverIdxByStage[d.id] = 1;
      });
      this.stages = { coverCarousel: { source_tool_name: 'trip', title: c.city || '行程总览', items: [overview], active_item_idx: null }, detailByStage: detailByStage, dayToStage: dayToStage, coverIdxByStage: coverIdxByStage, curStage: null };
      this.mode = 'overview';
      return this.stages.coverCarousel;
    },
    /* B 方案：种草灵感流（N 张亮点卡）；下钻=按 inspo id 进玩法详情，复用 stages 结构 */
    feedInspo: function (ev) {
      var c = ev.content || {}, cards = c.cards || [];
      var items = cards.map(function (cd, i) { return mkItem(i + 1, 'inspo-card', { id: cd.id, title: cd.title, photo: cd.photo, tags: cd.tags || [], hook: cd.punchline, rec: cd.rec, raw: cd }); });
      var detailByStage = {}, dayToStage = {}, coverIdxByStage = {};
      cards.forEach(function (cd, i) {
        var dt = cd.detail || {}, m = {}; m[cd.id] = 1;
        detailByStage[cd.id] = { carousel: { source_tool_name: 'trip', title: cd.title || '亮点', items: [dayToItem(1, { id: cd.id, label: dt.label || cd.title, pace: dt.pace, photo: dt.photo || cd.photo, nodes: dt.nodes, footer: dt.footer })], active_item_idx: null }, dayIdx: m, title: cd.title };
        dayToStage[cd.id] = cd.id; coverIdxByStage[cd.id] = i + 1;
      });
      this.stages = { coverCarousel: { source_tool_name: 'trip', title: c.echo || '灵感', items: items, active_item_idx: null }, detailByStage: detailByStage, dayToStage: dayToStage, coverIdxByStage: coverIdxByStage, curStage: null };
      this.mode = 'overview';
      return this.stages.coverCarousel;
    },
    /* 多目的地对比：封面=候选城市(对比数据)，钻取=该城市样板日。复用 stages 结构 */
    feedDestCompare: function (ev) {
      var c = ev.content || {}, cands = c.cands || [];
      var items = cands.map(function (cd, i) { return mkItem(i + 1, 'dest-card', { id: cd.id, title: cd.city, photo: cd.photo, hook: cd.why, rec: cd.rec, raw: { stats: cd.stats || [] } }); });
      var detailByStage = {}, dayToStage = {}, coverIdxByStage = {};
      cands.forEach(function (cd, i) {
        var dt = cd.detail || {}, m = {}; m[cd.id] = 1;
        detailByStage[cd.id] = { carousel: { source_tool_name: 'trip', title: cd.city || '行程', items: [dayToItem(1, { id: cd.id, label: dt.label || (cd.city + ' · 样板一天'), pace: dt.pace, photo: dt.photo || cd.photo, nodes: dt.nodes, footer: dt.footer })], active_item_idx: null }, dayIdx: m, title: cd.city };
        dayToStage[cd.id] = cd.id; coverIdxByStage[cd.id] = i + 1;
      });
      this.stages = { coverCarousel: { source_tool_name: 'trip', title: c.echo || '去哪好', items: items, active_item_idx: null }, detailByStage: detailByStage, dayToStage: dayToStage, coverIdxByStage: coverIdxByStage, curStage: null };
      this.mode = 'overview';
      return this.stages.coverCarousel;
    },
    /* 主题玩法：封面=主题(玩法计数)，钻取=该主题过滤后的行程。复用 stages 结构 */
    feedThemeFlow: function (ev) {
      var c = ev.content || {}, themes = c.themes || [];
      var items = themes.map(function (t, i) { return mkItem(i + 1, 'theme-card', { id: t.id, title: t.title, photo: t.photo, tags: t.tags || [], hook: t.punchline, rec: t.rec, raw: { icon: t.icon, count: t.count } }); });
      var detailByStage = {}, dayToStage = {}, coverIdxByStage = {};
      themes.forEach(function (t, i) {
        var dt = t.detail || {}, m = {}; m[t.id] = 1;
        detailByStage[t.id] = { carousel: { source_tool_name: 'trip', title: t.title || '玩法', items: [dayToItem(1, { id: t.id, label: dt.label || t.title, pace: dt.pace, photo: dt.photo || t.photo, nodes: dt.nodes, footer: dt.footer })], active_item_idx: null }, dayIdx: m, title: t.title };
        dayToStage[t.id] = t.id; coverIdxByStage[t.id] = i + 1;
      });
      this.stages = { coverCarousel: { source_tool_name: 'trip', title: c.echo || '怎么玩', items: items, active_item_idx: null }, detailByStage: detailByStage, dayToStage: dayToStage, coverIdxByStage: coverIdxByStage, curStage: null };
      this.mode = 'overview';
      return this.stages.coverCarousel;
    },
    drillByCoverIdx: function (coverIdx) {
      if (!this.stages) return null;
      var it = this.stages.coverCarousel.items[coverIdx - 1]; if (!it) return null;
      return this._drillStage(it._id, 1);
    },
    drillByDay: function (dayId) {
      if (!this.stages) return null;
      var sid = this.stages.dayToStage[dayId]; if (!sid) return null;
      return this._drillStage(sid, this.stages.detailByStage[sid].dayIdx[dayId] || 1);
    },
    _drillStage: function (stageId, focusIdx) {
      var d = this.stages.detailByStage[stageId]; if (!d) return null;
      this.stages.curStage = stageId; this.mode = 'detail';
      return { carousel: d.carousel, focusIdx: focusIdx, stageId: stageId, stageTitle: d.title };
    },
    backToOverview: function () {
      if (!this.stages) return null;
      this.mode = 'overview';
      return { carousel: this.stages.coverCarousel, focusIdx: this.stages.coverIdxByStage[this.stages.curStage] || null };
    },

    /* 返回 {action:'render'|'focus'|'none', carousel?, item_idx?, focus?} */
    feed: function (ev) {
      var comp = ev.comp, c = ev.content || {};
      // 扁平结果卡（非两阶段）登场：清掉上一张两阶段态(stages)，否则 highlightToIdx 会误走残留 stages 分支。
      this.stages = null; this.mode = null;
      if (FOCUS_COMPS[comp]) {
        var fid = (c.item && c.item.id) || c.id || null;
        var ft = (c.item && c.item.title) || c.title || null;
        if (this.current) { var i = this._match(fid, ft); if (i) return { action: 'focus', item_idx: i }; }
        this.current = build(ev);
        return { action: 'render', carousel: this.current.carousel };
      }
      var built = build(ev);
      if (!built || !built.carousel.items.length) return { action: 'none' };
      // 餐厅「换一个」：追加到当前餐厅轮播并聚焦新卡
      if (comp === 'RestaurantView' && this.current && this.current.carousel.source_tool_name === 'restaurant') {
        var it = built.carousel.items[0];
        it.item_idx = this.current.carousel.items.length + 1;
        this.current.carousel.items.push(it);
        if (it._id) this.current.idMap[it._id] = it.item_idx;
        return { action: 'render', carousel: this.current.carousel, focus: it.item_idx };
      }
      this.current = built;
      return { action: 'render', carousel: built.carousel };
    },
    _match: function (id, title) {
      if (!this.current) return null;
      var m = this.current.idMap, items = this.current.carousel.items;
      if (id && m[id]) return m[id];
      if (title) for (var k = 0; k < items.length; k++) { var t = items[k].title || ''; if (t === title || t.indexOf(title) >= 0 || title.indexOf(t) >= 0) return items[k].item_idx; }
      return items.length === 1 ? 1 : null;
    },
    /* TTS 高亮的 id → item_idx（念到哪张亮哪张）。两阶段态按 mode 路由：总览=阶段 id，详情=天 id */
    highlightToIdx: function (id) {
      if (!id) return null;
      if (this.stages) {
        if (this.mode === 'overview') return this.stages.coverIdxByStage[id] || null;
        var d = this.stages.detailByStage[this.stages.curStage];
        return (d && d.dayIdx[id]) || null;
      }
      if (!this.current) return null;
      return this.current.idMap[id] || (this.current.carousel.items.length === 1 ? 1 : null);
    }
  };

  /* 工厂：每次 create() 产出一个带独立可变态(current/stages/mode/curStage)的新实例。
     proto 的方法走原型链共享（无副本开销），状态字段在实例上初始化。 */
  function Adapter() {
    this.current = null;
    this.stages = null;   // 两阶段态：{coverCarousel, detailByStage, dayToStage, coverIdxByStage, curStage}
    this.mode = null;     // 'overview' | 'detail'（仅 stages 模式有效）
  }
  Adapter.prototype = proto;
  proto.reset = function () { this.current = null; this.stages = null; this.mode = null; };

  global.LoonaCarouselAdapter = {
    create: function () { return new Adapter(); },
    isResult: isResult   // 无状态助手挂静态：tools 自证 / 任意调用点无需先 create
  };
})(window);
