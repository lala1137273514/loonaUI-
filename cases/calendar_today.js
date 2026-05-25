/* 日程 case（场景 05 / §05）· 单卡 ListCard（事件/冲突/空档 N 行）+ 创建 R3 确认。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['calendar_today'] = {
    task_id: 'calendar_today', title: '日程 · 冲突/空档 + 创建', scene: 'calendar', source_case: '知识库 §05',
    decision_record: { request_type: 'query', primary_need: '判断接下来哪里紧/冲突/有空档', granularity: 'segmented',
      evidence_level: 'E4', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'read_private_data', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '今天后面还有什么安排？' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → query · calendar(E4)；日历 OAuth 已连(私域已授权)；按紧迫度/冲突/空档分析，不报时刻表。', fields: ['scene:calendar', 'evidence:E4', 'OAuth已连'] },
      { t: 600, gap_ms: 300, comp: 'tts', text: '我看下你今天后面。', pace: 'mid' },
      { t: 900, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 2300, gap_ms: 1400, comp: 'ListCard', card_id: 'sched', visual_state: 'active',
        content: { title: '今天日程',
          rows: [
            { id: 'ev1', lead: '14:00', title: '项目评审', sub: '会议室 A · 3 人', badge: { text: '已确认', kind: 'high' } },
            { id: 'ev2', lead: '14:30', title: '团队同步', sub: '线上 · 和评审只隔 10 分', badge: { text: '冲突', kind: 'conflict' } },
            { id: 'slot1', lead: '15:00+', title: '空档', sub: '约 90 分钟，能塞事', badge: { text: '可用', kind: 'free' } },
            { id: 'ev3', lead: '17:00', title: '与 Sam 1:1', sub: '对方还没接受', badge: { text: '待定', kind: 'medium' } }
          ], footer: '<span class="lbl">提醒</span> 评审与同步只隔 10 分钟，别再塞新事' } },
      { t: 4000, gap_ms: 560, comp: 'tts', highlight: 'ev2', text: '评审和同步只隔十分钟，太挤了。', pace: 'mid' },
      { t: 4700, gap_ms: 260, comp: 'tts', highlight: 'slot1', text: '真正能用的是十五点以后那段。', pace: 'mid' },
      { t: 0, gap_ms: 650, comp: 'user_query', text: '那帮我在那段建个 eval review' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'SLOT-CHECK',
        decision: '创建缺必填【时间】→ 不默认、问一次(REQ-DEF-002)；标题已有=eval review。', fields: ['scene:calendar', 'slot:time-missing'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '好，建之前先把时间定了。', pace: 'mid' },
      /* 槽位式澄清：缺必填【时间】；标题已从原话填好(✓) + 选填可补；快速选项接上面查到的空档 */
      { t: 900, gap_ms: 320, comp: 'ClarifyCard', card_id: 'cal_slot', wait_for_user: true,
        tts: { text: '几点开始？大概多久？', pace: 'mid' },
        content: { title: '缺个必填槽位', question: '标题有了，差个时间就能建。',
          slots: { required: [{ label: '时间' }, { label: '标题', value: 'eval review' }], optional: ['时长', '参与人', '日历'] },
          options: [{ label: '放进 15 点空档' }, { label: '我说时间' }] } },
      { t: 0, gap_ms: 220, comp: 'user_query', text: '放十五点那个空档，半小时' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'WRITE',
        decision: '时间=今天 15:00、时长 30min(用户提供)；创建=写 R3，确认标题/时间/目标日历。', fields: ['R3', 'time:15:00'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '好，十五点到十五点半，建之前确认下。', pace: 'mid' },
      { t: 1000, gap_ms: 420, comp: 'confirm', card_id: 'create', wait_for_user: true,
        tts: { text: '创建 eval review，今天十五点到十五点半，放默认日历，确认吗？', pace: 'mid' },
        content: { action: '创建日程', target: 'eval review · 15:00-15:30', impact: '写入默认日历',
          content_summary: '今天 · 15:00-15:30 · eval review', reversible: true, countdown: 30, confirm_label: '创建', cancel_label: '取消' } },
      { t: 1400, gap_ms: 300, comp: 'tts', text: '创建好了，今天十五点到十五点半。', pace: 'mid' },
      { t: 1700, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '查询 R0；创建 R3 确认后写入，不暴露 event id；碎片 10 分钟标不可用。', fields: ['query:R0', 'create:R3'] }
    ],
    annotations: []
  };
})(window);
