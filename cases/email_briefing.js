/* 邮件简报 case（场景 04 / §04）· 单卡 ListCard（3 封压成 3 行，= Figma 查消息形态）。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['email_briefing'] = {
    task_id: 'email_briefing', title: '邮件简报 · 今日扫读', scene: 'email', source_case: '知识库 §04',
    decision_record: { request_type: 'query', primary_need: '看今天邮件的优先级与下一步', granularity: 'segmented',
      evidence_level: 'E4', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'read_private_data', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '帮我看下今天的邮件' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → query · email；gmail_search 限定今天/未读，OAuth 已连。', fields: ['scene:email', 'evidence:E4'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '好，我扫一下今天的邮件。', pace: 'mid' },
      { t: 900, gap_ms: 260, comp: 'toast', text: '正在读邮件…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1100, gap_ms: 220, comp: 'agent_step', internal: true, label: 'PLANNER',
        decision: '分层 P1/P2/P3，压成一张卡多行；口播只讲 P1 和下一步，不逐封念、不念邮箱。', fields: ['P1/P2/P3', 'one-card'] },
      { t: 2400, gap_ms: 1400, comp: 'ListCard', card_id: 'mails', visual_state: 'active',
        content: { title: '今日邮件 · 3 封', status: { text: '1 封要紧', kind: 'p1' },
          rows: [
            { id: 'mail1', title: '项目评审确认', sub: '程楠 · 等你点头，4 点前要回', badge: { text: 'P1', kind: 'p1' }, right: '10:20' },
            { id: 'mail2', title: '本月账单已生成', sub: '财务系统 · ¥3,240 已自动扣', badge: { text: 'P2', kind: 'p2' }, right: '09:00' },
            { id: 'mail3', title: '限时优惠 6 折', sub: '营销推送 · 可忽略', badge: { text: 'P3', kind: 'p3' }, right: '昨天', dim: true }
          ], footer: '<span class="lbl">建议</span> 先回程楠那封，4 点前给结果' } },
      /* 邮件助理：先收口「今天就一件事」，把那一封讲透(谁/为什么/截止)，其余明确告诉你可以不管。 */
      { t: 4000, gap_ms: 560, comp: 'tts', highlight: 'mail1', text: '今天三封，真要你管的就一封。', pace: 'mid' },
      { t: 4500, gap_ms: 300, comp: 'tts', highlight: 'mail1', text: '程楠那封，评审确认，等你点头。', pace: 'mid' },
      { t: 4900, gap_ms: 300, comp: 'tts', highlight: 'mail1', text: '四点前得回，不然排期要往后。', pace: 'mid' },
      { t: 5300, gap_ms: 300, comp: 'tts', highlight: 'mail2', text: '账单是系统自动扣的，不用管。', pace: 'mid' },
      { t: 5700, gap_ms: 300, comp: 'tts', highlight: 'mail3', text: '营销那条，直接忽略就行。', pace: 'mid' },
      { t: 0, gap_ms: 650, comp: 'user_query', text: '帮我回他' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'DRAFT',
        decision: '生成回复草稿（R1，标未发送）；发送是对外动作 R3，必须先确认。', fields: ['R1→R3', 'confirmation'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '先垫个草稿：确认收到、四点前回，不多承诺。', pace: 'mid' },
      { t: 1000, gap_ms: 420, comp: 'confirm', card_id: 'send', wait_for_user: true,
        tts: { text: '确认发给程楠吗？主题评审确认，正文说已收到、四点前给结果。', pace: 'mid' },
        content: { action: '发送邮件', target: '程楠', impact: '对外发出，代表你正式确认',
          content_summary: '已收到 · 4点前给结果 · 不承诺今天做完', reversible: false, countdown: 30, confirm_label: '发送', cancel_label: '先别发' } },
      { t: 1400, gap_ms: 300, comp: 'tts', text: '发出去了，已经确认收到。', pace: 'mid' },
      { t: 1700, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '本轮：action ｜ R3 ｜ 发送成功，不暴露 message id。', fields: ['action', 'R3', 'sent'] }
    ],
    annotations: []
  };
})(window);
