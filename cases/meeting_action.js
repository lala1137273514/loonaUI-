/* 会议总结 case（场景 09 / §09）· 单卡 SectionCard（决策/行动项/未定 三段）+ 外发 R3 确认。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['meeting_action'] = {
    task_id: 'meeting_action', title: '会议总结 · 决策/行动/风险', scene: 'meeting', source_case: '知识库 §09',
    decision_record: { request_type: 'task', primary_need: '把产品会压成可推进的决策/行动/风险', granularity: 'segmented',
      evidence_level: 'E5', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'none', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '刚才那个产品会主要定了什么？' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → task · meeting；E5 转录；抽决策/分歧/行动项/风险，再讲人话。', fields: ['scene:meeting', 'evidence:E5'] },
      { t: 600, gap_ms: 300, comp: 'tts', text: '好，我把刚才会压一下。', pace: 'mid' },
      { t: 900, gap_ms: 260, comp: 'toast', text: '正在总结会议…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1100, gap_ms: 220, comp: 'agent_step', internal: true, label: 'EXTRACT',
        decision: '区分已定/未定/待确认；每条绑 evidence_span；负责人没写 → pending，不乱填。', fields: ['decisions', 'owner:pending'] },
      { t: 2400, gap_ms: 1400, comp: 'SectionCard', card_id: 'summary', visual_state: 'active',
        content: { title: '会议结论',
          sections: [
            { id: 'dec', label: '决策', badge: { text: '高可信', kind: 'high' }, text: 'Companion 做主体验，Workbench 保留成调试入口。' },
            { id: 'act', label: '行动项', badge: { text: '负责人待确认', kind: 'pending' },
              rows: [{ lead: 'dot', title: '入口切换 / 评估可见性 / 回退方案，拆成三件事' }] },
            { id: 'risk', label: '未定', badge: { text: '待确认', kind: 'pending' }, text: '迁移节奏、谁负责收尾，还没定。' }
          ], footer: '<span class="lbl">依据</span> 会议转录 12:30 / 18:40 / 25:10 段' } },
      /* 参谋长口吻：开场收口成三块，逐段点到对应段；负责人/未定项诚实标 pending，不补全。 */
      { t: 4000, gap_ms: 560, comp: 'tts', text: '这个产品会，我给你压成三块。', pace: 'mid' },
      { t: 4500, gap_ms: 300, comp: 'tts', highlight: 'dec', text: '定了的：Companion 做主体验。', pace: 'mid' },
      { t: 4900, gap_ms: 300, comp: 'tts', highlight: 'dec', text: 'Workbench 退成调试入口。', pace: 'mid' },
      { t: 5300, gap_ms: 300, comp: 'tts', highlight: 'act', text: '要做的三件，负责人还没落实。', pace: 'mid' },
      { t: 5700, gap_ms: 300, comp: 'tts', highlight: 'risk', text: '没定的是迁移节奏、谁收尾。', pace: 'mid' },
      { t: 0, gap_ms: 650, comp: 'user_query', text: '把这些发个同步邮件给团队' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'DRAFT',
        decision: '生成邮件草稿（决策/风险/下一步三段）；外发 R3 确认；收件人必须你指定。', fields: ['R3', 'recipient:explicit'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我先写草稿，不直接发。', pace: 'mid' },
      { t: 900, gap_ms: 280, comp: 'tts', text: '按决策、风险、下一步三段。', pace: 'mid' },
      { t: 1000, gap_ms: 420, comp: 'confirm', card_id: 'sync', wait_for_user: true,
        tts: { text: '要发给团队吗？收件人你来指定，我不从材料里自动推断。', pace: 'mid' },
        content: { action: '外发同步邮件', target: '团队（待你指定收件人）', impact: '对外发出会议结论',
          content_summary: '决策 + 风险 + 下一步 三段', reversible: false, countdown: 30, confirm_label: '发送', cancel_label: '先别发' } },
      { t: 1400, gap_ms: 300, comp: 'tts', text: '好，按你说的来，收件人确认了我再发。', pace: 'mid' },
      { t: 1700, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'task→action ｜ R3 ｜ 缺负责人标 pending ｜ 收件人需明确，不自动外发。', fields: ['R3', 'owner:pending'] }
    ],
    annotations: []
  };
})(window);
