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

  global.LOONA_CASES['cortex_news_hot_v2'] = {
    task_id: 'cortex_news_hot_v2',
    title: '新闻 · Cortex热点播报 V2',
    scene: 'news',
    source_case: 'Cortex web_ui · web_search / news_hot_natural · V2',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '最近热点新闻，先给入口主线，详情按分段讲解',
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
        decision: 'router → NEW；命中 web_search；先按“入口模式”输出热点主线，而不是逐条读搜索结果。', fields: ['scene:news', 'tool:web_search', 'entry-mode', 'evidence:E3'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我先看近期热点，不逐条念搜索结果，先给你一个整体判断。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'web_search(query=最近热点新闻, time_range=w) → 返回 10 条；按图文/数据/无图要点选择展示重心。', fields: ['source_tool_name:web_search', 'typed-news', 'present_mode:entry_then_section'] },
      { t: 2500, gap_ms: 1250, comp: 'NewsList', card_id: 'news_entry_v2',
        content: { title: '热点新闻入口', intro: '按类型挑主线：地缘风险 · 冲突升级 · 产业数据', items: [
          Object.assign({}, ITEMS.n1, { priority: '主线', summary: '美伊协议破局，地缘风险重新升温。' }),
          Object.assign({}, ITEMS.n2, { priority: '跟进', summary: '中东冲突继续升级，后续影响待观察。' }),
          Object.assign({}, ITEMS.n3, { priority: '数据', summary: '二手手机回收与存储芯片价格相关。' })
        ] } },
      { t: 3800, gap_ms: 520, comp: 'tts', text: '整体看，这批热点可以分成两类：一类是中东地缘风险继续抬头，另一类是产业链价格波动开始影响消费电子。', pace: 'mid' },
      { t: 4450, gap_ms: 440, comp: 'tts', text: '最值得先看的还是美伊协议破局，因为它会同时牵动能源、避险资产和地区安全预期。', highlight: 'n1', pace: 'mid' },
      { t: 5050, gap_ms: 420, comp: 'tts', text: '冲突升级那条更像是同一风险的延伸，重要但需要跟着第一条一起判断外溢程度。', highlight: 'n2', pace: 'mid' },
      { t: 5650, gap_ms: 420, comp: 'tts', text: '二手手机回收这条不是突发大新闻，但它反映存储芯片紧缺已经传导到回收价格，适合放在产业趋势里看。', highlight: 'n3', pace: 'mid' },
      { t: 6250, gap_ms: 500, comp: 'tts', text: '所以我的建议是：先关注地缘风险，再看产业数据。你想听哪一条，我再按背景、事实和影响展开。', pace: 'mid' },
      { t: 6900, gap_ms: 650, comp: 'user_query', text: '展开讲讲第一条，美伊协议破局那条' },
      { t: 7200, gap_ms: 280, comp: 'agent_step', internal: true, label: 'FOLLOWUP',
        decision: '用户指定第一条新闻；不切换未选卡片，复用 n1 作为选中新闻并进入分段详情。', fields: ['selected:n1', 'followup:detail', 'same-news-card-component'] },
      { t: 7700, gap_ms: 620, comp: 'NewsList', card_id: 'news_detail_v2',
        content: { title: '展开：美伊协议破局', intro: '沿用新闻卡片组件 · 按背景、事实、数字、影响分段', items: [
          { id: 'n1_bg', title: '背景：协议原本接近公布，市场短暂按降温预期交易', source: ITEMS.n1.source, time: ITEMS.n1.time, priority: '背景', summary: '这条新闻的核心不是单纯谈判失败，而是协议一度接近对外宣布，市场已经开始把紧张局势缓和计入预期。', detail_points: ['协议接近公布，说明双方至少曾在部分条件上接近共识', '临门破局会放大市场落差，比普通谈判停滞更容易触发避险反应'] },
          { id: 'n1_fact', title: '关键事实：分歧重新回到浓缩铀处置、核查条件和宣布时点', source: ITEMS.n1.source, time: ITEMS.n1.time, priority: '事实', summary: '破局点集中在伊朗浓缩铀如何移交或封存、国际核查如何落地，以及双方是否愿意在当前政治压力下公开承诺。', detail_points: ['浓缩铀处置决定协议能否被执行，而不只是口头降温', '核查条件影响后续可信度，也是双方最难让步的部分'] },
          { id: 'n1_number', title: '关键数字：浓缩铀、制裁解除节奏和能源价格会成为后续观察指标', source: ITEMS.n1.source, time: ITEMS.n1.time, priority: '数字', summary: '后续可以重点看三类数据：核材料处置口径、制裁豁免或解除的时间表，以及油价、黄金和美元等避险资产的即时反应。', detail_points: ['核材料处置口径：看是否出现可验证的数量和时间表', '资产反应：油价、黄金和美元会先体现市场风险定价'] },
          { id: 'n1_impact', title: '影响：短期看避险情绪，中期看谈判是否恢复和地区代理冲突是否升温', source: ITEMS.n1.source, time: ITEMS.n1.time, priority: '影响', summary: '如果双方只是推迟宣布，影响会偏短期；如果重新互相施压，能源、军工、航运和中东地区安全议题都会被市场重新定价。', detail_points: ['短期：避险资产和能源价格更容易先动', '中期：看谈判是否恢复，以及地区代理冲突是否继续升温'] }
        ] } },
      { t: 8500, gap_ms: 420, comp: 'tts', highlight: 'n1_bg', text: '这条先看背景：协议并不是从一开始就没戏，而是接近公布前突然回到分歧点。', pace: 'mid' },
      { t: 9150, gap_ms: 420, comp: 'tts', highlight: 'n1_fact', text: '关键事实集中在浓缩铀怎么处理、核查条件怎么执行，以及双方能不能公开承担政治成本。', pace: 'mid' },
      { t: 9800, gap_ms: 420, comp: 'tts', highlight: 'n1_number', text: '后续观察重点是核材料处置口径、制裁解除节奏，还有油价和避险资产的反应。', pace: 'mid' },
      { t: 10450, gap_ms: 420, comp: 'tts', highlight: 'n1_impact', text: '我的判断是，短期会先反映在避险情绪，中期才看谈判能不能恢复，以及地区代理冲突会不会继续升温。', pace: 'mid' },
      { t: 11000, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V2 只读搜索 R0；入口卡先停留；详情必须由用户追问触发，且使用既有新闻卡片组件组合背景/事实/数字/影响。', fields: ['query:R0', 'typed-card', 'user-triggered-detail', 'news-detail-card'] }
    ],
    annotations: []
  };
})(window);
