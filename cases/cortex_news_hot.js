/* Cortex web_ui 新闻 case · 来源于 web_search 实际流程：热点新闻按重要性播报，卡片走 search-card 轮播形态。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  var ITEMS = {
    n1: {
      id: 'n1',
      title: '【新闻第一线】躲了！巴国突取消访伊德黑兰今晚出事？',
      image: 'https://i.ntdtv.com/assets/uploads/2026/05/id104098814-521-2-1920-3-868x488.jpg',
      source: '新唐人',
      time: '6 days ago',
      priority: 'P1',
      link: 'https://www.ntdtv.com/gb/2026/05/21/a104098801.html',
      summary: '美伊协议宣布前几小时破局，特朗普要求伊朗交出浓缩铀，地缘风险重新升温。'
    },
    n2: {
      id: 'n2',
      title: '【新闻第一线】川普急电以军精准斩首！',
      image: 'https://i.ntdtv.com/assets/uploads/2026/05/id104100354-526-4-1920-3-868x488.jpg',
      source: '新唐人',
      time: '1 day ago',
      priority: 'P1',
      link: 'https://www.ntdtv.com/b5/2026/05/27/a104100353.html',
      summary: '以色列连续轰炸真主党并清除哈马斯新领袖，中东局势继续升级。'
    },
    n3: {
      id: 'n3',
      title: '《经济半小时》产业调查：二手手机回收热的背后',
      image: 'https://i.ytimg.com/vi/Pkw_4YttsKA/maxresdefault.jpg',
      source: '央视财经',
      time: '21 hours ago',
      priority: 'P1',
      link: 'https://www.youtube.com/watch?v=Pkw_4YttsKA',
      summary: '全球存储芯片短缺带动二手手机回收价格剧烈波动，产业链出现新变化。'
    },
    n4: {
      id: 'n4',
      title: '美对台军售“喊停” 特朗普恐赌上华盛顿信誉',
      source: 'YouTube',
      time: '4 days ago',
      priority: 'P2',
      link: 'https://www.youtube.com/watch?v=iII47WCuaPU',
      summary: '美国对台军售案暂停的表态，引发亚太战略与政策可信度讨论。'
    }
  };

  global.LOONA_CASES['cortex_news_hot'] = {
    task_id: 'cortex_news_hot',
    title: '新闻 · Cortex热点播报',
    scene: 'news',
    source_case: 'Cortex web_ui · web_search / news_hot_natural',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '最近热点新闻，按重要性播报',
      granularity: 'segmented',
      evidence_level: 'E3',
      action_risk: 'R0',
      output_mode: 'voice_card',
      tool_plan: 'query',
      confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '最近有什么热点新闻吗' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 web_search；新闻播报进入 carousel present_mode。', fields: ['scene:news', 'tool:web_search', 'evidence:E3'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我搜一下近期热点，按重要性排。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'web_search(query=最近热点新闻, time_range=w) → 返回 10 条；compose_carousel 选出 P1/P2。', fields: ['source_tool_name:web_search', 'present_mode:carousel'] },
      { t: 2600, gap_ms: 1350, comp: 'NewsList', card_id: 'cortex_news',
        content: { title: '搜索结果', intro: 'Cortex web_search · 按重要性播报', items: [ITEMS.n1, ITEMS.n2, ITEMS.n3, ITEMS.n4] } },
      { t: 4100, gap_ms: 560, comp: 'tts', highlight: 'n1', text: '第一条是美伊协议破局。', pace: 'mid' },
      { t: 4550, gap_ms: 320, comp: 'tts', highlight: 'n1', text: '国际市场会先看这条风险。', pace: 'mid' },
      { t: 5050, gap_ms: 360, comp: 'tts', highlight: 'n2', text: '第二条，中东冲突继续升级。', pace: 'mid' },
      { t: 5550, gap_ms: 360, comp: 'tts', highlight: 'n3', text: '第三条，存储芯片影响二手回收。', pace: 'mid' },
      { t: 6050, gap_ms: 360, comp: 'tts', highlight: 'n4', text: '军售暂停那条放到后面看。', pace: 'mid' },
      { t: 6500, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '只读搜索 R0；卡片按 Cortex search-card 字段 title/photo/summary/source/time/link/priority 呈现。', fields: ['query:R0', 'search-card', 'priority-sort'] }
    ],
    annotations: []
  };
})(window);
