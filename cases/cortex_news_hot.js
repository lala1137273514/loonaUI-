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

  global.LOONA_CASES['cortex_news_hot_v3'] = {
    task_id: 'cortex_news_hot_v3',
    title: '新闻 · Cortex热点播报 V3',
    scene: 'news',
    source_case: 'Cortex web_ui · web_search / news_hot_natural · V3',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '最近热点新闻，先给英文入口主线，详情按分段讲解',
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
        decision: 'router → NEW；命中 web_search；V3 使用英文 TTS 与英文新闻卡片，先入口总结，再由用户追问触发详情。', fields: ['scene:news', 'tool:web_search', 'entry-mode', 'english-copy'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: 'I will scan the latest headlines first, then group them by what actually matters instead of reading search results one by one.', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'web_search(query=recent hot news, time_range=w) → 返回 10 条；前台标签显示新闻内容分类，内部按图文、数据、无图要点、引用表态和详情分段选择展示模板。', fields: ['source_tool_name:web_search', 'topic-category', 'typed-news', 'present_mode:entry_then_section'] },
      { t: 2500, gap_ms: 1250, comp: 'NewsList', card_id: 'news_entry_v3',
        content: { title: 'Hot News Brief', intro: 'Topics: Politics · Technology · Agriculture · Economy · Policy', items: [
          Object.assign({}, ITEMS.n1, {
            title: 'Iran Deal Breaks Down Hours Before Announcement',
            source: 'NTDTV',
            summary: 'A near-final agreement fell apart, pushing geopolitical risk back into focus.',
            priority: 'Politics', card_type: 'image_story', type_label: 'Politics', source_label: 'Source'
          }),
          Object.assign({}, ITEMS.n3, {
            title: 'Used Phone Recycling Prices Swing as Memory Chips Tighten',
            source: 'CCTV Finance',
            summary: 'Shortage pressure is reaching device resale and recycling channels.',
            priority: 'Technology', card_type: 'data_metric', type_label: 'Technology', source_label: 'Source',
            metric: { value: '+18%', label: 'High-end resale price volatility', trend: 'Chip shortage pressure is moving downstream' },
            bullets: ['Recyclers are adjusting quotes more frequently', 'Consumer electronics now reflect upstream supply stress']
          }),
          {
            id: 'n6',
            title: 'Heat and Logistics Pressure Crop Supply Outlook',
            source: 'AgriWatch',
            time: '2 hours ago',
            priority: 'Agriculture',
            link: 'https://www.reuters.com/',
            summary: 'Weather volatility and shipping delays are pushing food-supply risk back into the market discussion.',
            card_type: 'no_image_points',
            type_label: 'Agriculture',
            source_label: 'Source',
            bullets: ['Heat risk is affecting crop-yield expectations', 'Logistics delays could keep food-price pressure elevated']
          },
          {
            id: 'n5',
            title: 'IMF Chief Says Global Trade Remains Highly Uncertain',
            source: 'Reuters',
            time: '3 hours ago',
            priority: 'Economy',
            link: 'https://www.reuters.com/',
            summary: 'International institutions remain cautious on trade friction and growth.',
            card_type: 'quote_statement',
            type_label: 'Economy',
            source_label: 'Source',
            quote: 'Global trade is still in a highly uncertain period.',
            speaker: 'IMF Managing Director · trade and growth outlook'
          },
          Object.assign({}, ITEMS.n4, {
            title: 'U.S. Pause on Taiwan Arms Sale Raises Credibility Questions',
            source: 'YouTube',
            summary: 'The story matters less as a single policy move and more as a signal to allies.',
            priority: 'Policy', card_type: 'no_image_points', type_label: 'Policy', source_label: 'Source',
            bullets: ['Watch whether the White House or Congress reopens the issue', 'The broader risk is confidence in long-term security commitments']
          })
        ] } },
      { t: 3800, gap_ms: 520, comp: 'tts', text: 'My overall read is that today’s headlines cover politics, technology, agriculture, economy, and policy. The strongest thread is still risk moving from headlines into markets and supply chains.', pace: 'mid' },
      { t: 4450, gap_ms: 440, comp: 'tts', text: 'The first story is the one I would watch most closely. A deal failing right before announcement usually creates a sharper market reaction than a negotiation that was never close.', highlight: 'n1', pace: 'mid' },
      { t: 5050, gap_ms: 420, comp: 'tts', text: 'The recycling-price story is useful because it turns an abstract chip shortage into a concrete downstream signal: resale channels are already repricing risk.', highlight: 'n3', pace: 'mid' },
      { t: 5650, gap_ms: 420, comp: 'tts', text: 'The agriculture story is worth separating out because weather and logistics pressure can feed directly into food prices, even when it is not the loudest headline.', highlight: 'n6', pace: 'mid' },
      { t: 6250, gap_ms: 420, comp: 'tts', text: 'The economy item is not a dramatic event, but it matters because it frames how institutions are judging trade and growth risk.', highlight: 'n5', pace: 'mid' },
      { t: 6850, gap_ms: 500, comp: 'tts', text: 'The policy story is less about one announcement and more about credibility. I would watch whether officials follow up with a clear signal.', highlight: 'n4', pace: 'mid' },
      { t: 7350, gap_ms: 500, comp: 'tts', text: 'So my recommendation is: start with the political lead story, then compare technology, agriculture, and economy signals to see where pressure is becoming visible.', pace: 'mid' },
      { t: 7900, gap_ms: 650, comp: 'user_query', text: '展开讲讲第一条，美伊协议破局那条' },
      { t: 8200, gap_ms: 280, comp: 'agent_step', internal: true, label: 'FOLLOWUP',
        decision: '用户指定第一条新闻；不自动切换其他卡片，复用 n1 进入英文分段详情。', fields: ['selected:n1', 'followup:detail', 'same-news-card-component'] },
      { t: 8700, gap_ms: 620, comp: 'NewsList', card_id: 'news_detail_v3',
        content: { title: 'Detail: Iran Deal Breakdown', intro: 'Same news card component · Background, facts, numbers, impact', items: [
          { id: 'n1_bg_v3', title: 'Background: A near-final deal suddenly moved back into dispute', source: 'NTDTV', time: '6 days ago', priority: 'Background', source_label: 'Source', summary: 'The important part is not only that talks failed. It is that markets had briefly started to price in a cooler scenario, which makes the reversal more sensitive.', detail_points: ['Expectation: the deal appeared close enough to announce', 'Market gap: a late reversal can trigger a stronger risk reaction'] },
          { id: 'n1_fact_v3', title: 'Facts: The core dispute returned to uranium handling and verification', source: 'NTDTV', time: '6 days ago', priority: 'Facts', source_label: 'Source', summary: 'The sticking points are practical: what happens to enriched uranium, how inspections are enforced, and whether both sides can publicly accept the political cost.', detail_points: ['Uranium handling: determines whether the agreement can be executed', 'Verification: shapes whether the deal is credible after signing'] },
          { id: 'n1_number_v3', title: 'Numbers to watch: nuclear material, sanctions timing, and energy prices', source: 'NTDTV', time: '6 days ago', priority: 'Numbers', source_label: 'Source', summary: 'The follow-up signals should be concrete rather than rhetorical: material quantities, sanction-relief timelines, and immediate reactions in oil, gold, and the dollar.', detail_points: ['Nuclear material: look for verifiable quantities and deadlines', 'Assets: oil, gold, and the dollar will show risk pricing first'] },
          { id: 'n1_impact_v3', title: 'Impact: Short-term risk pricing first, medium-term negotiation risk later', source: 'NTDTV', time: '6 days ago', priority: 'Impact', source_label: 'Source', summary: 'If the announcement is merely delayed, the effect may stay short-lived. If pressure escalates, energy, shipping, defense, and regional security expectations all need repricing.', detail_points: ['Short term: energy and safe-haven assets move first', 'Medium term: watch whether talks restart or proxy conflict rises'] }
        ] } },
      { t: 9100, gap_ms: 420, comp: 'tts', highlight: 'n1_bg_v3', text: 'For background, this was not a negotiation that had no chance. It appeared close, then moved back to the most sensitive unresolved conditions.', pace: 'mid' },
      { t: 9750, gap_ms: 420, comp: 'tts', highlight: 'n1_fact_v3', text: 'The core facts are about implementation: uranium handling, inspection terms, and whether either side can accept the political cost of making the deal public.', pace: 'mid' },
      { t: 10400, gap_ms: 420, comp: 'tts', highlight: 'n1_number_v3', text: 'The numbers I would watch are nuclear-material commitments, the sanctions timeline, and the first reaction in oil, gold, and the dollar.', pace: 'mid' },
      { t: 11050, gap_ms: 420, comp: 'tts', highlight: 'n1_impact_v3', text: 'My view is that the short-term impact shows up first in risk sentiment. The medium-term question is whether talks restart or regional proxy conflict heats up again.', pace: 'mid' },
      { t: 11600, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V3 只读搜索 R0；英文 TTS/卡片；入口使用多模板新闻卡，详情由用户追问触发并复用新闻卡片组件。', fields: ['query:R0', 'typed-card', 'english-copy', 'user-triggered-detail'] }
    ],
    annotations: []
  };
})(window);
