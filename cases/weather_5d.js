/* 查天气 case（场景 02 / §02）· 单卡 WeatherView(沉浸天色 + 日行) + 分段口播逐日高亮 + 提醒 R3 确认。
   两个变体（控制台可切换 / 并排对比）：
     · 直接版 = 基准：用户已给城市，直接出结果。
     · 问城市版 = 缺必填【城市】→ 槽位式澄清问一次（不猜，REQ-WX-001），补城市再出结果。
   两版共用结果尾段 TAIL。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  /* —— 共用尾段：结果卡 + 逐日高亮 + 提醒 R3 确认 + 决策 —— */
  var TAIL = [
    { t: 2300, gap_ms: 1400, comp: 'WeatherView', card_id: 'wx', visual_state: 'active',
      content: { title: '上海 · 未来 5 天', badge: { text: '高可信', kind: 'high' },
        headline: '周三最适合出门，周五最不稳要带伞。',
        rows: [
          { id: 'd1', lead: '周一', title: '18~24°' },
          { id: 'd2', lead: '周二', title: '17~23°' },
          { id: 'd3', lead: '周三', title: '19~25°', badge: { text: '最适合', kind: 'free' } },
          { id: 'd4', lead: '周四', title: '16~22°' },
          { id: 'd5', lead: '周五', title: '15~20°', badge: { text: '带伞日', kind: 'warn' } }
        ], footer: '<span class="lbl">更新</span> 今天 08:00' } },
    /* 天气主播：开场 → 整体基调 → 最适合日(+穿衣) → 转折日 → 生活动作(带伞/加衣)。一句一拍，逐日点到对应行。 */
    { t: 4000, gap_ms: 560, comp: 'tts', text: '上海这五天，我挑重点说。', pace: 'mid' },
    { t: 4500, gap_ms: 320, comp: 'tts', highlight: 'd3', text: '周中最舒服，周三十九到二十五度。', pace: 'mid' },
    { t: 4900, gap_ms: 300, comp: 'tts', highlight: 'd3', text: '薄外套就够，雨也少，最适合出门。', pace: 'mid' },
    { t: 5300, gap_ms: 300, comp: 'tts', highlight: 'd5', text: '周末转差，周五降到十五度、有雨。', pace: 'mid' },
    { t: 5700, gap_ms: 300, comp: 'tts', highlight: 'd5', text: '那天出门记得带伞，加件外套。', pace: 'mid' },
    { t: 0, gap_ms: 650, comp: 'user_query', text: '周五早上提醒我带伞' },
    { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'WRITE',
      decision: '创建提醒=写操作 R3，确认时间/触发/渠道；查到天气 ≠ 已建提醒。', fields: ['R3', 'confirmation'] },
    { t: 600, gap_ms: 320, comp: 'tts', text: '这个要建提醒，我先确认一下。', pace: 'mid' },
    { t: 1000, gap_ms: 420, comp: 'confirm', card_id: 'rem', wait_for_user: true,
      tts: { text: '周五早上八点提醒你带伞，确认建吗？', pace: 'mid' },
      content: { action: '创建提醒', target: '周五 08:00 带伞', impact: '到点推送提醒到手机',
        content_summary: '周五 · 08:00 · 提醒带伞', reversible: true, confirm_label: '建提醒', cancel_label: '先不用' } },
    { t: 1400, gap_ms: 300, comp: 'tts', text: '好，周五早上会提醒你带伞。', pace: 'mid' },
    { t: 1700, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
      decision: '查询 R0 直接给判断；提醒 R3 确认后写入；多天压一张卡，TTS 逐日高亮。', fields: ['query:R0', 'reminder:R3'] }
  ];

  /* —— 直接版开场：用户已给城市 —— */
  var DIRECT = [
    { t: 0, gap_ms: 0, comp: 'user_query', text: '上海未来几天哪天适合出去玩？' },
    { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
      decision: 'router → query · weather；城市=上海(E3 已给)，多天趋势，先给行动判断再放事实。', fields: ['scene:weather', 'city:上海'] },
    { t: 600, gap_ms: 300, comp: 'tts', text: '好，我看下上海这几天。', pace: 'mid' },
    { t: 900, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' }
  ];

  /* —— 问城市版开场：缺必填【城市】→ 槽位式澄清(待填) → 补城市 —— */
  var ASK = [
    { t: 0, gap_ms: 0, comp: 'user_query', text: '未来几天哪天适合出去玩？' },
    { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
      decision: 'router → query · weather；缺必填【城市】→ 先问一次，不猜“附近”(REQ-WX-001)。', fields: ['scene:weather', 'slot:city-missing'] },
    { t: 600, gap_ms: 300, comp: 'tts', text: '好，先确认下看哪儿。', pace: 'mid' },
    { t: 900, gap_ms: 320, comp: 'ClarifyCard', card_id: 'wx_loc', wait_for_user: true,
      tts: { text: '看哪个城市的天气？说一声，或者用定位。', pace: 'mid' },
      content: { title: '缺个必填槽位', question: '城市还没定，给我个地方就开查。',
        slots: { required: [{ label: '城市' }], optional: ['具体日期', '关注:出行/穿衣'] },
        options: [{ label: '用定位' }, { label: '我说城市' }] } },
    { t: 0, gap_ms: 220, comp: 'user_query', text: '上海' },
    { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'SLOT-FILL',
      decision: '城市=上海(E2 用户提供)；多天趋势，先行动判断再放事实。', fields: ['city:上海', 'evidence:E3'] },
    { t: 600, gap_ms: 300, comp: 'tts', text: '好，看上海这几天。', pace: 'mid' },
    { t: 900, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' }
  ];

  global.LOONA_CASES['weather_5d'] = {
    task_id: 'weather_5d', title: '查天气 · 哪天适合出门', scene: 'weather', source_case: '知识库 §02', default_skin: 'aura',
    variant_name: '直接版',                                  // 基准变体名（控制台显示）
    decision_record: { request_type: 'query', primary_need: '挑出适合出门的那天并给生活动作', granularity: 'segmented',
      evidence_level: 'E3', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'query', confirmation_required: false },
    events: DIRECT.concat(TAIL),                              // 基准 = 直接版
    variants: [{ name: '问城市版', events: ASK.concat(TAIL) }], // 控制台内置可切换 / 并排对比
    annotations: []
  };
})(window);
