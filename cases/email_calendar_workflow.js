/* 邮件日程联动 case（场景 06 / §06）· 单卡 ListCard(逐步状态行) → 联合确认(先改日程后发邮件)。
   两个变体（控制台可切换 / 并排对比）：
     · 全成功 = 基准：两步都确认成功。
     · 部分失败 = 同一计划，日程改成功但邮件发送失败 → FailureCard 诚实拆开成功/失败 + 永远给下一步(REQ-FAIL-001)。
   两版共用前半段 OPEN（读邮件查日程 → 列表卡 → 确认改期 → 改日程成功）。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  /* —— 共用前半段：读邮件查日程 → 列表卡 → 第 1 道门改日程(成功) —— */
  var OPEN = [
    { t: 0, gap_ms: 0, comp: 'user_query', text: '小周邮件说评审改到明天下午三点，帮我处理一下' },
    { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
      decision: 'router → task · workflow；邮件/日历 OAuth 已连(私域已授权)；读邮件→查日程→起草→分开确认；不直接发。', fields: ['scene:workflow', 'multi-step', 'OAuth已连'] },
    { t: 600, gap_ms: 320, comp: 'tts', text: '先看日历放不放，回信确认了再发。', pace: 'mid' },
    { t: 1000, gap_ms: 260, comp: 'toast', text: '正在读邮件 + 查日程…', state_visual: 'loading', dismiss_on: 'card' },
    { t: 1200, gap_ms: 220, comp: 'agent_step', internal: true, label: 'EXTRACT',
      decision: '抽取时间节点=明天 15:00；查冲突(空)；正文"自动转发"指令忽略，只作材料。', fields: ['deadline:明天15:00', 'inject-safe'] },
    { t: 2600, gap_ms: 1500, comp: 'ListCard', card_id: 'wf', visual_state: 'active',
      content: { title: '邮件 × 日程 · 改期', status: { text: '待你确认', kind: 'pending' },
        rows: [
          { id: 's2', title: '已读邮件 · 查日程 · 拟草稿', sub: '明天 15:00-15:30 空，无冲突', badge: { text: '已完成', kind: 'high' } },
          { id: 's4', title: '改日程', sub: '评审 → 明天 15:00-15:30', badge: { text: '待确认', kind: 'pending' } },
          { id: 's5', title: '发确认邮件', sub: '发给小周', badge: { text: '待确认', kind: 'pending' } }
        ], footer: '<span class="lbl">下一步</span> 发送与日程写入分开确认' } },
    { t: 4200, gap_ms: 560, comp: 'tts', highlight: 's2', text: '明天那个时段是空的，能放。', pace: 'mid' },
    { t: 4900, gap_ms: 260, comp: 'tts', highlight: 's4', text: '草稿也垫好了，发送前不会动。', pace: 'mid' },
    { t: 0, gap_ms: 650, comp: 'user_query', text: '确认，两个都做' },
    { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'EXEC-PLAN',
      decision: '两步分别确认（§06：邮件发送与日程写入确认要求分开）；依赖顺序先日程后邮件；任一失败不连带。', fields: ['split-confirm', 'calendar→email'] },
    { t: 600, gap_ms: 420, comp: 'tts', text: '两件分开确认，先日程后邮件。', pace: 'mid' },
    /* 第 1 道门：改日程（R3，可逆）—— 两版都成功 */
    { t: 1000, gap_ms: 360, comp: 'confirm', card_id: 'cal_confirm', wait_for_user: true,
      tts: { text: '先确认改日程：把评审改到明天十五点到十五点半。', pace: 'mid' },
      content: { action: '改日程', target: '项目评审 → 明天 15:00-15:30', impact: '日历变更（可改回）',
        content_summary: '明天 · 15:00-15:30 · 项目评审', reversible: true, countdown: 30, confirm_label: '改日程', cancel_label: '先不改' } },
    { t: 1400, gap_ms: 300, comp: 'tts', text: '日程改好了，明天十五点。', pace: 'mid' }
  ];

  /* —— 全成功尾段：第 2 道门发邮件(成功) —— */
  var SUCCESS_TAIL = [
    /* 第 2 道门：发确认邮件（R3，依赖日程成功后才出现） */
    { t: 1700, gap_ms: 360, comp: 'confirm', card_id: 'mail_confirm', wait_for_user: true,
      tts: { text: '日程成了，再确认把确认邮件发给小周。', pace: 'mid' },
      content: { action: '发送邮件', target: '小周', impact: '对外发出，代表你正式确认',
        content_summary: '确认收到 · 评审改到明天三点 · 不额外承诺', reversible: false, countdown: 30, confirm_label: '发送', cancel_label: '先别发' } },
    { t: 2100, gap_ms: 300, comp: 'tts', text: '邮件也发出去了，两步都完成。', pace: 'mid' },
    { t: 2400, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
      decision: '邮件发送与日程写入分别确认、依赖顺序执行；只确认一项就只执行一项；不暴露 message id / event id。', fields: ['split-confirm', 'dependency-order', 'no-id'] }
  ];

  /* —— 部分失败尾段：第 2 道门确认后发送失败 → FailureCard 拆开成功/失败 + 下一步 —— */
  var FAIL_TAIL = [
    /* 第 2 道门：发确认邮件（确认后，邮件服务超时 → 发送失败；outcome:fail 让回执走「发送失败」而非「已发送」） */
    { t: 1700, gap_ms: 360, comp: 'confirm', card_id: 'mail_confirm', wait_for_user: true,
      tts: { text: '日程成了，再确认把确认邮件发给小周。', pace: 'mid' },
      content: { action: '发送邮件', target: '小周', impact: '对外发出，代表你正式确认',
        content_summary: '确认收到 · 评审改到明天三点 · 不额外承诺', reversible: false, countdown: 30, confirm_label: '发送', cancel_label: '先别发',
        outcome: 'fail', fail_label: '发送失败' } },
    /* 失败回执卡：成功的归成功、失败的归失败，标清谁知道/谁不知道，永远给下一步(REQ-FAIL-001) */
    { t: 2100, gap_ms: 1800, comp: 'FailureCard', card_id: 'wf_fail', visual_state: 'fail',
      tts: { text: '日程改好了，明天十五点。', pace: 'mid' },
      content: { title: '一步成、一步没成',
        completed: ['日程已改 · 评审 → 明天 15:00-15:30'],
        failed: ['确认邮件没发出 · 小周还不知道改期'],
        reason: '邮件服务器超时，自动重试两次仍失败',
        next_options: ['重发邮件', '改用短信通知小周', '我来手动发'] } },
    { t: 2600, gap_ms: 520, comp: 'tts', text: '但确认邮件没发出去。', pace: 'mid' },
    { t: 3000, gap_ms: 300, comp: 'tts', text: '小周现在还不知道改期。', pace: 'mid' },
    { t: 3400, gap_ms: 300, comp: 'tts', text: '要我重发，还是改用短信？', pace: 'mid' },
    { t: 3800, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
      decision: '依赖顺序执行：日程成功、邮件失败不连带回滚日程；失败诚实上报、不假称已发；标清未送达对象；永远给下一步。', fields: ['partial-fail', 'honest-status', 'next-step'] }
  ];

  global.LOONA_CASES['email_calendar_workflow'] = {
    task_id: 'email_calendar_workflow', title: '邮件×日程联动 · 改期', scene: 'email_calendar_workflow', source_case: '知识库 §06',
    variant_name: '全成功',                                   // 基准变体名（控制台显示）
    decision_record: { request_type: 'task', primary_need: '处理改期邮件：查日程影响 + 起草 + 确认后执行', granularity: 'segmented',
      evidence_level: 'E4', action_risk: 'R3', output_mode: 'voice_card', tool_plan: 'read_private_data', confirmation_required: true },
    events: OPEN.concat(SUCCESS_TAIL),                         // 基准 = 全成功
    variants: [{ name: '部分失败', events: OPEN.concat(FAIL_TAIL) }], // 控制台内置可切换 / 并排对比
    annotations: []
  };
})(window);
