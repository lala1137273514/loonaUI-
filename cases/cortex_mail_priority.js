/* Cortex web_ui 邮件 case · 来源于 get_mail_list 实际流程：重要邮件优先播报，卡片走 mail-card 轮播形态。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  global.LOONA_CASES['cortex_mail_priority'] = {
    task_id: 'cortex_mail_priority',
    title: '邮件 · Cortex重要邮件播报',
    scene: 'email',
    source_case: 'Cortex web_ui · get_mail_list / mail_auth_check',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '汇报最近收到的邮件，重要的先说',
      granularity: 'segmented',
      evidence_level: 'E4',
      action_risk: 'R0',
      output_mode: 'voice_card',
      tool_plan: 'read_private_data',
      confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '汇报一下我最近收到的邮件，重要的先说' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 get_mail_list；使用 Google 已授权 uid 2054410908867756032。', fields: ['scene:email', 'tool:get_mail_list', 'evidence:E4', 'OAuth已连'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我先拉最近收件箱，只挑重要的说。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1200, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'get_mail_list(label:INBOX, max_results=20) → 返回 20 封；compose_carousel 过滤 P0/P1 与可行动邮件。', fields: ['source_tool_name:get_mail_list', 'present_mode:carousel'] },
      { t: 2600, gap_ms: 1400, comp: 'ListCard', card_id: 'cortex_mails', visual_state: 'active',
        content: {
          source_tool_name: 'get_mail_list',
          title: '邮件',
          status: { text: 'P0/P1 优先', kind: 'p1' },
          rows: [
            { id: 'mail_security', title: 'Security alert', sub: 'Google · loonadm.com 访问了部分账号数据', badge: { text: 'P0', kind: 'p1' }, right: '2026-05-27 19:05' },
            { id: 'mail_zep', title: 'Your API key is ready', sub: 'Jack from Zep · API key 已准备好', badge: { text: 'P1', kind: 'p1' }, right: '2026-05-27 20:59' },
            { id: 'mail_mimo', title: 'Price Updates for MiMo-V2.5', sub: 'Xiaomi MiMo · 价格与 Token 套餐更新', badge: { text: 'P1', kind: 'p1' }, right: '2026-05-27 02:00' },
            { id: 'mail_chatgpt', title: 'New personal finance tools in ChatGPT Pro', sub: 'ChatGPT · Pro 用户个人财务工具', badge: { text: 'P1', kind: 'p1' }, right: '2026-05-25 06:16' },
            { id: 'mail_bloomberg', title: 'Paxton crushes Cornyn in Texas', sub: 'Bloomberg · 晨间简报，重要性较低', badge: { text: 'P2', kind: 'p2' }, right: '2026-05-27 18:35', dim: true }
          ],
          footer: '<span class="lbl">Cortex</span> get_mail_list → mail-card，低优先级订阅只保留摘要'
        } },
      { t: 4100, gap_ms: 560, comp: 'tts', highlight: 'mail_security', text: '最要紧是 Google 安全警报。', pace: 'mid' },
      { t: 4600, gap_ms: 320, comp: 'tts', highlight: 'mail_security', text: '如果不是你授权，要马上核实。', pace: 'mid' },
      { t: 5100, gap_ms: 360, comp: 'tts', highlight: 'mail_zep', text: 'Zep 的 API key 已经就绪。', pace: 'mid' },
      { t: 5600, gap_ms: 360, comp: 'tts', highlight: 'mail_mimo', text: 'MiMo 那封会影响开发成本。', pace: 'mid' },
      { t: 6100, gap_ms: 360, comp: 'tts', highlight: 'mail_bloomberg', text: '其余多是订阅资讯，先放后面。', pace: 'mid' },
      { t: 6600, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '只读邮件 R0；不暴露完整邮箱；卡片按 Cortex mail-card 字段 title/subtitle/meta/summary/priority 呈现。', fields: ['query:R0', 'no-send', 'mail-card'] }
    ],
    annotations: []
  };
})(window);
