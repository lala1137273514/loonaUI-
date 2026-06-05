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

  global.LOONA_CASES['cortex_mail_priority_v2'] = {
    task_id: 'cortex_mail_priority_v2',
    title: '邮件 · Cortex重要邮件播报 V2',
    scene: 'email',
    source_case: 'Cortex web_ui · get_mail_list / mail_auth_check · V2',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '汇报最近收到的邮件，先 brief，再说值得关注和可行动的邮件',
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
        decision: 'router → NEW；命中 get_mail_list；目标从 P 级筛选改为“值得关注/需要行动”的邮件 brief。', fields: ['scene:email', 'tool:get_mail_list', 'attention-first', 'OAuth已连'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我先看最近邮件，先给你总量和需要处理的部分。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1200, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'get_mail_list(label:INBOX, max_results=20) → 返回 20 封；按业务往来、同事协作、商务合作、低价值信息归类。', fields: ['source_tool_name:get_mail_list', 'business-mail', 'present_mode:brief_card'] },
      { t: 2500, gap_ms: 1280, comp: 'ListCard', card_id: 'mail_attention_v2', visual_state: 'active',
        content: {
          source_tool_name: 'get_mail_list',
          title: '邮件简报：20 封',
          status: { text: '4 封要回 · 9 封低价值', kind: 'ok' },
          rows: [
            { id: 'mail_summary_v2', title: '总览：20 封新邮件', card_type: 'brief',
              sub: '重要需关注（3封）：合作请求、同事需求确认、合同回签。\n日常邮件（8封）：项目同步、例会纪要、普通抄送。\n营销、广告、垃圾邮件（9封）：行业简报、活动邀请、促销通知。',
              summary: '重要需关注（3封）：\n- 合作请求：星河零售发来联合发布会合作确认，需要今天回复排期、露出范围和预算口径。\n- 同事需求确认：周悦针对版本发布评审材料提出两页指标口径问题，需要你尽快回复。\n- 合同回签：北辰采购更新付款节点和验收附件，需要确认业务影响后再回签。\n日常邮件（8封）：项目同步、例会纪要和普通抄送，暂时不影响今天的关键动作。\n营销、广告、垃圾邮件（9封）：行业简报、活动邀请和促销通知，我先合并不逐封打扰。',
              sections: [
                { title: '重要需关注（3封）', items: [
                  '合作请求：星河零售发来联合发布会合作确认，需要今天回复排期和预算口径',
                  '同事需求确认：周悦针对版本发布评审材料提出问题，需要你尽快拍板',
                  '合同回签：北辰采购更新付款节点和验收附件，需要确认业务影响'
                ] },
                { title: '日常邮件（8封）', items: [
                  '项目同步、例会纪要和普通抄送，暂时不影响今天关键动作'
                ] },
                { title: '营销、广告、垃圾邮件（9封）', items: [
                  '行业简报、活动邀请和促销通知，我先合并不逐封打扰'
                ] }
              ],
              badge: { text: 'brief', kind: 'ok' }, right: '今天' },
            { id: 'mail_partner_v2', title: '星河零售 · 联合发布会合作确认',
              from: '李然 <liran@galaxy-retail.com>', to: 'you@loona.ai', received_at: '2026-06-04 09:42',
              sub: '合作请求：星河零售发来联合发布会合作邀请，需要今天确认排期、联合露出范围和预算口径。',
              summary: '需确认发布会排期和预算口径。',
              badge: { text: '要回', kind: 'p1' }, right: '09:42' },
            { id: 'mail_colleague_v2', title: '周悦 · 项目评审材料修改意见',
              from: '周悦 <zhouyue@loona.ai>', to: 'you@loona.ai', cc: 'pm-team@loona.ai', received_at: '2026-06-04 11:18',
              sub: '同事需求确认：周悦针对版本发布计划提出问题，需要你尽快回复指标口径和上线节奏。',
              summary: '需拍板指标口径和灰度节奏。',
              badge: { text: '要回', kind: 'p1' }, right: '11:18' },
            { id: 'mail_contract_v2', title: '北辰采购 · 合同条款与回签时间',
              from: '陈启明 <chen.qiming@beichen-procure.com>', to: 'you@loona.ai', cc: 'legal@loona.ai', received_at: '2026-06-04 14:06',
              sub: '商务合同：北辰采购更新付款节点和验收附件，需要确认是否影响交付承诺。',
              summary: '付款节点变更，需确认影响。',
              badge: { text: '确认', kind: 'ok' }, right: '14:06' },
            { id: 'mail_low_value_v2', title: '订阅、促销和普通抄送',
              sub: '日常和低价值邮件：8 封日常同步、9 封营销广告或垃圾信息，当前不需要逐封处理。',
              summary: '低价值邮件已合并，不需处理。',
              badge: { text: '合并', kind: 'p2' }, right: '多封', dim: true }
          ],
          footer: '<span class="lbl">V2</span> 先报总量和分类数字，再展开需要行动的业务邮件'
        } },
      { t: 3900, gap_ms: 520, comp: 'tts', highlight: 'mail_summary_v2', text: '这次共收到 20 封，我按处理价值分了三组：重要需关注 3 封，日常邮件 8 封，营销广告和垃圾信息 9 封。', pace: 'mid' },
      { t: 4650, gap_ms: 520, comp: 'tts', highlight: 'mail_partner_v2', text: '最靠前的是星河零售的合作请求。它不是普通邀约，对方在等你确认发布会排期、联合露出范围和预算口径，今晚还要锁供应商。', pace: 'mid' },
      { t: 5400, gap_ms: 520, comp: 'tts', highlight: 'mail_colleague_v2', text: '第二封是周悦的同事确认。她已经改完评审材料，但留存指标和灰度节奏需要你拍板，不然下午评审会有两个版本。', pace: 'mid' },
      { t: 6150, gap_ms: 520, comp: 'tts', highlight: 'mail_contract_v2', text: '第三封是北辰采购的合同更新。付款节点和验收附件都变了，我建议先确认业务影响，再让法务继续回签。', pace: 'mid' },
      { t: 6900, gap_ms: 480, comp: 'tts', highlight: 'mail_low_value_v2', text: '其余低价值邮件我先不展开，除非你要看订阅资讯或者活动邀请。', pace: 'mid' },
      { t: 7500, gap_ms: 420, comp: 'tts', highlight: 'mail_partner_v2', text: '你想先看哪一封的细节，还是让我先帮你起草星河零售那封回复？', pace: 'mid' },
      { t: 8000, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V2 只读邮件 R0；前台突出总量/需回复/低价值数字；重点卡改为真实业务交往、同事协作和商务合同邮件。', fields: ['query:R0', 'no-send', 'brief-first', 'business-mail', 'action-last'] }
    ],
    annotations: []
  };

  global.LOONA_CASES['cortex_mail_priority_v3'] = {
    task_id: 'cortex_mail_priority_v3',
    title: '邮件 · Cortex重要邮件播报 V3',
    scene: 'email',
    source_case: 'Cortex web_ui · get_mail_list / mail_auth_check · V3',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '汇报最近收到的邮件，英文 brief 后直接给业务回复草稿',
      granularity: 'segmented',
      evidence_level: 'E4',
      action_risk: 'R1',
      output_mode: 'voice_card',
      tool_plan: 'read_private_data',
      confirmation_required: true
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '汇报一下我最近收到的邮件，重要的先说' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 get_mail_list；V3 使用英文 TTS 与英文邮件卡片，最后产出待确认回复草稿。', fields: ['scene:email', 'tool:get_mail_list', 'business-mail', 'draft-confirm'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: 'I will review your latest inbox first, then separate the messages that need action from routine updates and low-value mail.', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1200, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'get_mail_list(label:INBOX, max_results=20) → 返回 20 封；按业务往来、同事协作、商务合同和低价值信息归类。', fields: ['source_tool_name:get_mail_list', 'business-mail', 'present_mode:brief_card'] },
      { t: 2500, gap_ms: 1280, comp: 'ListCard', card_id: 'mail_attention_v3', visual_state: 'active',
        content: {
          source_tool_name: 'get_mail_list',
          title: 'Email Brief',
          status: { text: '3 need action · 8 FYI · 9 low value', kind: 'ok' },
          rows: [
            { id: 'mail_summary_v3', title: 'Email brief: 20 new messages', card_type: 'brief',
              sub: 'Three messages need your attention: partner scheduling, review-deck decisions, and contract sign-off.',
              summary: '3 need action; 8 are FYI updates; 9 are marketing or low-value messages.',
              metrics: [
                { label: 'Need action', value: '3', kind: 'hot' },
                { label: 'FYI', value: '8', kind: 'muted' },
                { label: 'Low value', value: '9', kind: 'muted' }
              ],
              attention_title: 'Needs attention',
              attention_count_text: '3 emails',
              attention_items: [
                { title: 'Partner request · Galaxy Retail', summary: 'Confirm launch timing and budget wording.' },
                { title: 'Colleague decision · Zhou Yue', summary: 'Approve review metrics and rollout pace.' },
                { title: 'Contract sign-off · Beichen Procurement', summary: 'Check payment-term impact before signing.' }
              ],
              badge: { text: 'brief', kind: 'ok' }, right: 'Today' },
            { id: 'mail_partner_v3', title: 'Galaxy Retail · Joint launch event confirmation',
              from: 'Li Ran <liran@galaxy-retail.com>', received_at: '2026-06-04 09:42',
              sub: 'Partner request: Galaxy Retail is waiting for launch timing, joint exposure scope, and budget wording today.',
              summary: 'Confirm launch timing and budget wording.',
              from_label: 'From', summary_label: 'Summary', label_separator: ': ',
              badge: { text: 'Reply', kind: 'p1' }, right: '09:42' },
            { id: 'mail_colleague_v3', title: 'Zhou Yue · Review deck comments',
              from: 'Zhou Yue <zhouyue@loona.ai>', received_at: '2026-06-04 11:18',
              sub: 'Colleague request: Zhou Yue needs your decision on release metrics and the staged rollout plan before review.',
              summary: 'Approve metrics and rollout plan.',
              from_label: 'From', summary_label: 'Summary', label_separator: ': ',
              badge: { text: 'Reply', kind: 'p1' }, right: '11:18' },
            { id: 'mail_contract_v3', title: 'Beichen Procurement · Contract terms and signature timing',
              from: 'Chen Qiming <chen.qiming@beichen-procure.com>', received_at: '2026-06-04 14:06',
              sub: 'Business contract: Beichen updated payment milestones and acceptance attachments, so the delivery impact needs confirmation.',
              summary: 'Check impact before contract sign-off.',
              from_label: 'From', summary_label: 'Summary', label_separator: ': ',
              badge: { text: 'Check', kind: 'ok' }, right: '14:06' },
            { id: 'mail_low_value_v3', title: 'FYI updates and low-value mail',
              sub: 'FYI mail includes calendar changes, meeting notes, and project notifications; marketing and spam-like messages stay grouped.',
              summary: 'FYI kept for context; low value deprioritized.',
              from_label: 'From', summary_label: 'Summary', label_separator: ': ',
              badge: { text: 'Grouped', kind: 'p2' }, right: 'Multiple', dim: true }
          ],
          footer: '<span class="lbl">V3</span> Brief first, then action-ready business emails'
        } },
      { t: 3900, gap_ms: 520, comp: 'tts', highlight: 'mail_summary_v3', text: 'You have 20 new emails. Three need action, eight are for your information, and nine are marketing or low-value messages.', pace: 'mid' },
      { t: 4550, gap_ms: 520, comp: 'tts', highlight: 'mail_summary_v3', text: 'For your information, the eight routine emails are mostly calendar changes, meeting notes, and regular project notifications. They are useful context, but they do not need a reply right now.', pace: 'mid' },
      { t: 5250, gap_ms: 520, comp: 'tts', highlight: 'mail_low_value_v3', text: 'The low-value group has nine messages, mainly marketing, ads, or subscription-style updates. I grouped them so they do not compete with the business emails.', pace: 'mid' },
      { t: 6000, gap_ms: 520, comp: 'tts', highlight: 'mail_partner_v3', text: 'The top action item is from Galaxy Retail. They are waiting for your confirmation on the joint launch timing, exposure scope, and budget wording, so this one is the most actionable.', pace: 'mid' },
      { t: 6750, gap_ms: 520, comp: 'tts', highlight: 'mail_colleague_v3', text: 'The second action item is from Zhou Yue. She has updated the review deck, but still needs your decision on the release metrics and rollout pace.', pace: 'mid' },
      { t: 7500, gap_ms: 520, comp: 'tts', highlight: 'mail_contract_v3', text: 'The third action item is from Beichen Procurement. The payment milestones and acceptance attachments changed, so I would confirm delivery impact before legal proceeds.', pace: 'mid' },
      { t: 8250, gap_ms: 420, comp: 'tts', highlight: 'mail_partner_v3', text: 'I drafted a reply to the Galaxy Retail email. Please review it and confirm whether you want to send it.', pace: 'mid' },
      { t: 8750, gap_ms: 420, comp: 'ListCard', card_id: 'mail_draft_v3', visual_state: 'active',
        content: {
          source_tool_name: 'get_mail_list',
          title: 'Draft Reply',
          status: { text: 'Pending confirmation', kind: 'ok' },
          rows: [
            { id: 'mail_partner_draft_v3', card_type: 'draft', title: 'Draft: Galaxy Retail Reply',
              from: 'You <you@loona.ai>',
              to: 'Li Ran <liran@galaxy-retail.com>',
              draft_subject: 'Re: Joint launch event confirmation',
              draft_body: 'Hi Li Ran,\nWe can tentatively proceed with next Wednesday morning for the joint launch. I will confirm the exposure scope and budget wording today and send any updates promptly.\nBest,',
              draft_label: 'AI Draft', from_label: 'From', to_label: 'To', subject_label: 'Subject', label_separator: ': ',
              confirm_label: 'Send', cancel_label: 'Cancel', status: 'Pending',
              badge: { text: 'draft', kind: 'ok' }, right: 'Pending' }
          ],
          footer: '<span class="lbl">V3</span> Draft is not sent until you confirm'
        } },
      { t: 9250, gap_ms: 420, comp: 'tts', text: 'Here is the same draft in a review layout, with message details on the left and the editable draft area on the right.', pace: 'mid' },
      { t: 9730, gap_ms: 420, comp: 'ListCard', card_id: 'mail_draft_split_v3', visual_state: 'active',
        content: {
          source_tool_name: 'get_mail_list',
          title: 'Draft Reply · Review Layout',
          status: { text: 'Pending confirmation', kind: 'ok' },
          rows: [
            { id: 'mail_partner_draft_split_v3', card_type: 'draft', layout: 'split', title: 'Galaxy Retail Reply',
              from: 'You <you@loona.ai>',
              to: 'Li Ran <liran@galaxy-retail.com>',
              draft_subject: 'Re: Joint launch event confirmation',
              draft_body: 'Hi Li Ran,\nWe can tentatively proceed with next Wednesday morning for the joint launch. I will confirm the exposure scope and budget wording today and send any updates promptly.\nBest,',
              draft_label: 'AI Draft', from_label: 'From', to_label: 'To', subject_label: 'Subject', label_separator: ': ',
              confirm_label: 'Send', cancel_label: 'Cancel', status: '',
              badge: { text: 'draft', kind: 'ok' }, right: 'Pending' }
          ],
          footer: '<span class="lbl">V3</span> Split draft review; still requires confirmation before sending'
        } },
      { t: 10400, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V3 只读邮件并生成待确认英文草稿；先展示竖版草稿，再展示左右分栏 review 草稿，发送前必须用户确认。', fields: ['query:R0', 'draft:R1', 'confirm-before-send', 'split-draft', 'english-copy'] }
    ],
    annotations: []
  };

  var mailV4 = JSON.parse(JSON.stringify(global.LOONA_CASES['cortex_mail_priority_v3']));
  mailV4.task_id = 'cortex_mail_priority_v4';
  mailV4.title = '邮件 · Cortex重要邮件播报 V4';
  mailV4.source_case = 'Cortex web_ui · get_mail_list / mail_auth_check · V4';
  mailV4.decision_record.primary_need = '汇报最近收到的邮件，英文 brief 后给更紧凑的待发草稿';
  mailV4.events[1].decision = 'router → NEW；命中 get_mail_list；V4 保留英文 brief 和草稿确认，但窄版草稿只保留必要收件信息。';
  mailV4.events[1].fields = ['scene:email', 'tool:get_mail_list', 'business-mail', 'draft-confirm', 'compact-draft'];
  mailV4.events[2].text = 'I’ll pull out what needs action.';
  mailV4.events[5].card_id = 'mail_attention_v4';
  mailV4.events[5].content.footer = '<span class="lbl">V4</span> Brief first, then action-ready business emails';
  mailV4.events[12].text = 'Draft is ready. Please review before sending.';
  mailV4.events[13].card_id = 'mail_draft_v4';
  mailV4.events[13].content.title = 'Draft Reply';
  mailV4.events[13].content.status = null;
  mailV4.events[13].content.footer = '<span class="lbl">V4</span> Narrow draft keeps only subject, recipient, body, and actions';
  mailV4.events[13].content.rows[0] = Object.assign({}, mailV4.events[13].content.rows[0], {
    id: 'mail_partner_draft_v4',
    title: 'Galaxy Retail Reply',
    status: '',
    show_status: false,
    meta_mode: 'compact_draft',
    right: '',
    badge: { text: 'draft', kind: 'ok' }
  });
  mailV4.events[14].text = 'Here’s the wider review view too.';
  mailV4.events[15].card_id = 'mail_draft_split_v4';
  mailV4.events[15].content.title = 'Draft Reply · Review Layout';
  mailV4.events[15].content.footer = '<span class="lbl">V4</span> Wide review layout remains available before confirmation';
  mailV4.events[15].content.rows[0] = Object.assign({}, mailV4.events[15].content.rows[0], {
    id: 'mail_partner_draft_split_v4',
    title: 'Galaxy Retail Reply',
    status: '',
    show_status: false,
    right: ''
  });
  mailV4.events[16].decision = 'V4 只读邮件并生成待确认英文草稿；窄版草稿压缩为主题+收件人+正文+按钮，宽版 review 保留对比。';
  mailV4.events[16].fields = ['query:R0', 'draft:R1', 'confirm-before-send', 'compact-draft', 'split-draft'];
  global.LOONA_CASES['cortex_mail_priority_v4'] = mailV4;
})(window);
