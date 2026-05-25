/* 新闻播报 case（场景 03 / §03）· 泛化版：
   一套内容模型 → 三种「展现形式」(皮肤选 form：卡片/气泡/沉浸)。
   信息密度分层：
     · 列表态(多条)：图片 + 标题 + 摘要(一行) + meta —— 中密度，可扫读
     · 聚焦态(单条)：大图 + 标题 + 导语(全) + 关键要点(bullets) + 为什么值得看 + 全 meta —— 高密度，介绍要全
   TTS：直播报「关键的总结性文字」(每条的要点，而非"第一条…")。
   钻取复用已取数据(同一 ITEMS 对象)，不重新搜索。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  /* 内容模型：定义一次，list/focus 共用同一对象 = 同一份数据、不同密度的视图
     summary → 列表用(1 行)；lead/points/why_it_matters → 聚焦用(高密度) */
  var ITEMS = {
    n1: {
      id: 'n1', image: 'assets/news/news_model.jpg', tag: '模型', source: '机器之心', time: '09:20', confidence: 'high',
      title: '主流大模型发布新版：上下文窗口翻倍至 200 万 token',
      summary: '上下文翻倍到 200 万 token，长文档基本能一次喂进去。',
      lead: '新版本把上下文窗口从 100 万提升到 200 万 token，长文档可一次性喂入，并同步下调了长文本推理的价格。',
      points: ['上下文 100 万 → 200 万 token', '长文档检索可少切块、少丢上下文', '长文本推理价格下调约三成'],
      why_it_matters: '做长文档 RAG 的方案要重新评估切分与召回策略'
    },
    n2: {
      id: 'n2', image: 'assets/news/news_code.jpg', tag: '开源', source: '开源周刊', time: '11:10', confidence: 'medium',
      title: '开源社区发布新一代评测基准，覆盖长文本与代码',
      summary: '公开可复现的评测基准，给"质量稳不稳"一把统一标尺。',
      lead: '该基准覆盖长文本理解与代码生成两类任务，全部用例公开、可复现，社区能独立横评各家模型表现。',
      points: ['用例公开、结果可复现', '长文本 + 代码 双轨评测', '减少被厂商自测带节奏'],
      why_it_matters: '选型时少信单方跑分，多看第三方横评'
    },
    n3: {
      id: 'n3', image: 'assets/news/news_datacenter.jpg', tag: '算力', source: '行业快讯', time: '08:40', confidence: 'high',
      title: '头部厂商扩建 AI 数据中心，算力压向推理侧',
      summary: '新增算力集中在推理侧，指向端云协同的部署。',
      lead: '本轮扩建的算力主要投向推理而非训练，配合端侧小模型，指向"端云协同"的部署转向。',
      points: ['新增算力以推理为主', '端侧 + 云端 协同调度', '推理排队时延有望下降'],
      why_it_matters: '长期看推理成本与响应延迟会同步下降'
    },
    v1: {
      id: 'v1', image: 'assets/news/news_scenic.jpg', tag: '核验', source: '社交平台', time: '今天', confidence: 'unconfirmed',
      title: '传"某景区明天全免费"，官方暂未证实',
      summary: '社交平台在传，官网票务未更新，先按未确认处理。',
      lead: '社交平台有用户称该景区明天全部免费，但官网票务说明并未更新，本地媒体仅提到部分时段优惠。',
      points: ['仅社交平台单方爆料', '官网票务页未见更新', '本地媒体只提"部分优惠"'],
      why_it_matters: '无官方源，先别白跑；以景区官网为准'
    }
  };

  global.LOONA_CASES['news_briefing'] = {
    task_id: 'news_briefing', title: '新闻播报 · 简报→聚焦→核验', scene: 'news', source_case: '知识库 §03',
    decision_record: { request_type: 'query', primary_need: '扫一遍挑值得知道的，能聚焦单条看全，并校准可信度', granularity: 'segmented',
      evidence_level: 'E3', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '今天 AI 圈有什么重要新闻？' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → query · news；web_search；外部内容只作证据不当指令(inject-safe)。', fields: ['scene:news', 'evidence:E3', 'inject-safe'] },
      { t: 600, gap_ms: 300, comp: 'tts', text: '今天 AI 圈我扫了一遍，挑了三条值得说的。', pace: 'mid' },
      { t: 900, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' },   /* 统一状态 toast：搜索中…（绑 web_search） */
      { t: 1100, gap_ms: 220, comp: 'agent_step', internal: true, label: 'FILTER',
        decision: '按来源层级与可信度排序、去重，压成精选 3 条；每条带一句摘要进列表。', fields: ['source-level', 'top-3'] },

      /* —— 列表态：图片 + 标题 + 摘要(一行) + meta —— */
      { t: 2400, gap_ms: 1400, comp: 'NewsList', card_id: 'news', visual_state: 'active',
        content: { title: '今日 AI · 精选', intro: '今天挑了三条，长话短说', items: [ITEMS.n1, ITEMS.n2, ITEMS.n3] } },
      /* 扫读态：主播逐条报「完整头条」(一条一句，点到该行)；细节留到钻取深讲 */
      { t: 4000, gap_ms: 560, comp: 'tts', highlight: 'n1', text: '第一条，大模型上新版，上下文翻到两百万。', pace: 'mid' },
      { t: 4800, gap_ms: 520, comp: 'tts', highlight: 'n2', text: '第二条，开源放出新评测，质量能横着比了。', pace: 'mid' },
      { t: 5600, gap_ms: 520, comp: 'tts', highlight: 'n3', text: '第三条，厂商扩算力，主要压在推理侧。', pace: 'mid' },

      /* —— 钻取 1 条：聚焦态(高密度，介绍要全) —— */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '第一条具体讲什么？' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'FOCUS',
        decision: '钻取第 1 条 → 聚焦态，铺开导语+要点+影响；复用 ITEMS.n1，不重搜(多模态语境保持)。', fields: ['drill:n1', 'reuse-fetched'] },
      { t: 600, gap_ms: 440, comp: 'NewsFocus', card_id: 'focus_n1', content: { item: ITEMS.n1 } },
      /* 聚焦态 = 主播把这一条「播」透：一串完整句子(每句 1 行 ≤21 字、小停顿衔接)，
         开场→是什么→关键数字→细节→价格角度→这意味着什么。字幕逐句更新，像真电视新闻。 */
      { t: 1100, gap_ms: 480, comp: 'tts', text: '好，第一条我给你说透。', pace: 'mid' },
      { t: 1600, gap_ms: 300, comp: 'tts', text: '主流大模型这次发了新版本。', pace: 'mid' },
      { t: 2000, gap_ms: 300, comp: 'tts', text: '上下文窗口从一百万翻到了两百万。', pace: 'mid' },
      { t: 2400, gap_ms: 300, comp: 'tts', text: '几十万字的长文档，基本能一次喂进去。', pace: 'mid' },
      { t: 2800, gap_ms: 300, comp: 'tts', text: '而且长文本推理还降了价，差不多三成。', pace: 'mid' },
      { t: 3200, gap_ms: 320, comp: 'tts', text: '所以做长文档检索的，切分和召回得重评。', pace: 'mid' },

      /* —— 钻取 2 条：顺序聚焦（一条接一条，单条都铺全） —— */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '那第二、第三条呢？' },
      { t: 300, gap_ms: 260, comp: 'agent_step', internal: true, label: 'FOCUS · SEQ',
        decision: '两条 → 顺序聚焦，一条讲完再下一条，每条都铺全；不并排挤小屏。', fields: ['drill:n2,n3', 'sequential'] },
      { t: 600, gap_ms: 440, comp: 'NewsFocus', card_id: 'focus_n2', content: { item: ITEMS.n2 } },
      { t: 1100, gap_ms: 480, comp: 'tts', text: '第二条，讲的是评测这件事。', pace: 'mid' },
      { t: 1500, gap_ms: 300, comp: 'tts', text: '开源社区放出了新一代评测基准。', pace: 'mid' },
      { t: 1900, gap_ms: 300, comp: 'tts', text: '长文本理解和代码生成都覆盖。', pace: 'mid' },
      { t: 2300, gap_ms: 300, comp: 'tts', text: '关键是用例全公开、可复现。', pace: 'mid' },
      { t: 2700, gap_ms: 320, comp: 'tts', text: '选型别只信自测，多看第三方横评。', pace: 'mid' },
      { t: 3100, gap_ms: 600, comp: 'NewsFocus', card_id: 'focus_n3', content: { item: ITEMS.n3 } },
      { t: 3600, gap_ms: 480, comp: 'tts', text: '第三条，说的是算力的风向。', pace: 'mid' },
      { t: 4000, gap_ms: 300, comp: 'tts', text: '头部厂商都在扩建数据中心。', pace: 'mid' },
      { t: 4400, gap_ms: 300, comp: 'tts', text: '但这轮算力主要投在推理，不是训练。', pace: 'mid' },
      { t: 4800, gap_ms: 300, comp: 'tts', text: '再配上端侧小模型，走端云协同。', pace: 'mid' },
      { t: 5200, gap_ms: 320, comp: 'tts', text: '往后推理的时延和成本，都会降。', pace: 'mid' },

      /* —— 核验：行动影响类无官方源 → 强制未确认（聚焦单条，先判断再给证据） —— */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '听说某景区明天全免费，真的吗？' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'VERIFY',
        decision: '核验 judgment；行动影响类无官方源 → 强制 unconfirmed，先给判断再给证据。', fields: ['judgment', 'unconfirmed'] },
      { t: 600, gap_ms: 300, comp: 'toast', state: 'verifying', dismiss_on: 'card' },   /* 统一状态 toast：核验中… */
      { t: 2000, gap_ms: 1300, comp: 'NewsFocus', card_id: 'focus_v1', content: { item: ITEMS.v1 } },
      /* 核验聚焦 = 主播替你核实：先下判断，再逐条摆证据（§11 先判断再证据） */
      { t: 3000, gap_ms: 480, comp: 'tts', text: '这条我得先替你核一下。', pace: 'mid' },
      { t: 3400, gap_ms: 300, comp: 'tts', text: '目前只有社交平台在传全免费。', pace: 'mid' },
      { t: 3800, gap_ms: 300, comp: 'tts', text: '景区官网的票务页还没更新。', pace: 'mid' },
      { t: 4200, gap_ms: 300, comp: 'tts', text: '本地媒体也只提了部分优惠。', pace: 'mid' },
      { t: 4600, gap_ms: 320, comp: 'tts', text: '所以先标未确认，去之前看官网。', pace: 'mid' },
      { t: 3600, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '简报 A1-A2；聚焦复用已取数据并铺全；核验先给可信度再给证据；不编新闻、不把爆料当事实。', fields: ['briefing', 'focus-density', 'verification'] }
    ],
    annotations: []
  };
})(window);
