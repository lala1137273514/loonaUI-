/* Cortex web_ui 日程 case · 来源于 list_events 实际流程：按日期聚合为 calendar day card。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  global.LOONA_CASES['cortex_calendar_week'] = {
    task_id: 'cortex_calendar_week',
    title: '日程 · Cortex一周日程播报',
    scene: 'calendar',
    source_case: 'Cortex web_ui · list_events / calendar_today',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '查询今天到接下来一周的日程并播报重点',
      granularity: 'segmented',
      evidence_level: 'E4',
      action_risk: 'R0',
      output_mode: 'voice_card',
      tool_plan: 'read_private_data',
      confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '我今天到接下来一周的日程都有哪些，总结一下' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 list_events；日历 OAuth 已连，读取今天起一周。', fields: ['scene:calendar', 'tool:list_events', 'evidence:E4', 'OAuth已连'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我查今天到下周的日程。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'list_events → 返回 4 条；Cortex web_ui 按日期聚合为日程卡，一天一张。', fields: ['source_tool_name:list_events', 'present_mode:carousel'] },
      { t: 2500, gap_ms: 1300, comp: 'ListCard', card_id: 'cortex_events', visual_state: 'active',
        content: {
          source_tool_name: 'list_events',
          title: '日程',
          rows: [
            { id: 'cal_meet', title: '会议室集合', sub: '会议室 · 组织者: 默认日历', lead: '15:30',
              raw_start: '2026-05-28T15:30:00+08:00', raw_end: '2026-05-28T16:00:00+08:00', event_date: '2026-05-28', event_start_sort: 930, badge: { text: 'P1', kind: 'p1' } },
            { id: 'cal_trip_today', title: '出差', sub: '机场 · 组织者: 默认日历', lead: '18:30',
              raw_start: '2026-05-28T18:30:00+08:00', raw_end: '2026-05-28T20:00:00+08:00', event_date: '2026-05-28', event_start_sort: 1110, badge: { text: 'P1', kind: 'p1' } },
            { id: 'cal_wrap', title: '项目收尾', sub: '线上 · 组织者: 默认日历', lead: '14:30',
              raw_start: '2026-05-29T14:30:00+08:00', raw_end: '2026-05-29T15:30:00+08:00', event_date: '2026-05-29', event_start_sort: 870, badge: { text: 'P1', kind: 'p1' } },
            { id: 'cal_trip_next', title: '出差', sub: '火车站 · 组织者: 默认日历', lead: '20:30',
              raw_start: '2026-05-29T20:30:00+08:00', raw_end: '2026-05-29T22:00:00+08:00', event_date: '2026-05-29', event_start_sort: 1230, badge: { text: 'P2', kind: 'p2' } }
          ],
          footer: '<span class="lbl">Cortex</span> list_events → 按日期聚合为 calendar day card'
        } },
      { t: 4000, gap_ms: 560, comp: 'tts', highlight: 'cal_meet', text: '今天下午先去会议室集合。', pace: 'mid' },
      { t: 4500, gap_ms: 320, comp: 'tts', highlight: 'cal_trip_today', text: '傍晚还有一项出差。', pace: 'mid' },
      { t: 5000, gap_ms: 360, comp: 'tts', highlight: 'cal_wrap', text: '明天下午是项目收尾。', pace: 'mid' },
      { t: 5500, gap_ms: 360, comp: 'tts', highlight: 'cal_trip_next', text: '晚上还有出差，别排太满。', pace: 'mid' },
      { t: 6000, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '只读日程 R0；不暴露 event id；卡片按 Cortex calendar day card 展示，同日多事件聚合。', fields: ['query:R0', 'calendar-day-card', 'no-write'] }
    ],
    annotations: []
  };

  global.LOONA_CASES['cortex_calendar_week_v2'] = {
    task_id: 'cortex_calendar_week_v2',
    title: '日程 · Cortex一周日程播报 V2',
    scene: 'calendar',
    source_case: 'Cortex web_ui · list_events / calendar_today · V2',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '查询今天到接下来一周的日程，先整体 brief，再逐事件对齐播报',
      granularity: 'segmented',
      evidence_level: 'E4',
      action_risk: 'R0',
      output_mode: 'voice_card',
      tool_plan: 'read_private_data',
      confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '我今天到接下来一周的日程都有哪些，总结一下' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 list_events；先做一周 brief，再保证每个 TTS 细节只绑定一个日程 ref。', fields: ['scene:calendar', 'tool:list_events', 'one-detail-one-ref', 'OAuth已连'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '我查一下今天到下周，先说整体安排。', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'list_events → 返回 4 条；卡片仍按日期聚合，但口播逐事件高亮，不把两个事件合成同一播报帧。', fields: ['source_tool_name:list_events', 'calendar-day-card', 'tts_focus:per-event'] },
      { t: 2500, gap_ms: 1260, comp: 'ListCard', card_id: 'calendar_focus_v2', visual_state: 'active',
        content: {
          source_tool_name: 'list_events',
          title: '一周日程',
          status: { text: '2 天 · 4 项', kind: 'ok' },
          rows: [
            { id: 'cal_meet_v2', title: '会议室集合', sub: '今天 · 会议室 · 组织者: 默认日历', lead: '15:30', raw_start: '2026-05-28T15:30:00+08:00', raw_end: '2026-05-28T16:00:00+08:00', event_date: '2026-05-28', event_start_sort: 930, badge: { text: '重点', kind: 'p1' } },
            { id: 'cal_trip_today_v2', title: '出差', sub: '今天 · 机场 · 和上一项间隔 2.5 小时', lead: '18:30', raw_start: '2026-05-28T18:30:00+08:00', raw_end: '2026-05-28T20:00:00+08:00', event_date: '2026-05-28', event_start_sort: 1110, badge: { text: '出行', kind: 'p1' } },
            { id: 'cal_wrap_v2', title: '项目收尾', sub: '明天 · 线上 · 下午处理', lead: '14:30', raw_start: '2026-05-29T14:30:00+08:00', raw_end: '2026-05-29T15:30:00+08:00', event_date: '2026-05-29', event_start_sort: 870, badge: { text: '工作', kind: 'p1' } },
            { id: 'cal_trip_next_v2', title: '出差', sub: '明天 · 火车站 · 晚间出发', lead: '20:30', raw_start: '2026-05-29T20:30:00+08:00', raw_end: '2026-05-29T22:00:00+08:00', event_date: '2026-05-29', event_start_sort: 1230, badge: { text: '提醒', kind: 'p2' } }
          ],
          footer: '<span class="lbl">V2</span> 卡片可按日期聚合；TTS 与高亮必须逐事件一一对齐'
        } },
      { t: 3900, gap_ms: 520, comp: 'tts', text: '整体看，这两天有四项安排：今天下午先开会，傍晚出差；明天下午收尾，晚上还有一段出行。', pace: 'mid' },
      { t: 4450, gap_ms: 340, comp: 'tts', highlight: 'cal_meet_v2', text: '今天十五点半先去会议室集合，这项时间不长，但后面接出差，建议会前把要带的材料先收好。', pace: 'mid' },
      { t: 5000, gap_ms: 340, comp: 'tts', highlight: 'cal_trip_today_v2', text: '十八点半要去机场出差，和会议中间有两个半小时，建议预留交通和安检时间，别把中间塞满。', pace: 'mid' },
      { t: 5550, gap_ms: 340, comp: 'tts', highlight: 'cal_wrap_v2', text: '明天下午十四点半是项目收尾，适合上午先把遗留事项过一遍，避免临近会前再补材料。', pace: 'mid' },
      { t: 6100, gap_ms: 340, comp: 'tts', highlight: 'cal_trip_next_v2', text: '明天晚上二十点半还要去火车站出差，晚饭和出发时间最好提前排好，晚上就别再加重会议了。', pace: 'mid' },
      { t: 6600, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V2 只读日程 R0；overview 可概括多项，单条 detail 必须一条 TTS 对一个 event ref。', fields: ['query:R0', 'brief-ok', 'detail:single-ref', 'no-write'] }
    ],
    annotations: []
  };

  global.LOONA_CASES['cortex_calendar_week_v3'] = {
    task_id: 'cortex_calendar_week_v3',
    title: '日程 · Cortex一周日程播报 V3',
    scene: 'calendar',
    source_case: 'Cortex web_ui · list_events / calendar_today · V3',
    default_skin: 'glass',
    decision_record: {
      request_type: 'query',
      primary_need: '查询今天到接下来一周的日程，英文 brief 和英文逐事件提醒',
      granularity: 'segmented',
      evidence_level: 'E4',
      action_risk: 'R0',
      output_mode: 'voice_card',
      tool_plan: 'read_private_data',
      confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '我今天到接下来一周的日程都有哪些，总结一下' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → NEW；命中 list_events；V3 使用英文 TTS 与英文日程卡片，逐事件对齐提醒。', fields: ['scene:calendar', 'tool:list_events', 'english-copy', 'per-event'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: 'I will check your schedule from today through next week and start with the overall shape.', pace: 'mid' },
      { t: 950, gap_ms: 260, comp: 'toast', state: 'reading', dismiss_on: 'card' },
      { t: 1250, gap_ms: 220, comp: 'agent_step', internal: true, label: 'TOOL_CALL',
        decision: 'list_events → 返回 4 条；英文卡片按日期聚合，TTS 逐事件高亮并补充提醒。', fields: ['source_tool_name:list_events', 'calendar-day-card', 'tts_focus:per-event'] },
      { t: 2500, gap_ms: 1260, comp: 'ListCard', card_id: 'calendar_focus_v3', visual_state: 'active',
        content: {
          source_tool_name: 'list_events',
          title: 'Weekly Schedule',
          status: { text: '2 days · 4 events', kind: 'ok' },
          rows: [
            { id: 'cal_meet_v3', title: 'Meet at conference room', sub: 'Today · Conference room · Organizer: default calendar', lead: '15:30', raw_start: '2026-05-28T15:30:00+08:00', raw_end: '2026-05-28T16:00:00+08:00', event_date: '2026-05-28', event_start_sort: 930, badge: { text: 'Focus', kind: 'p1' }, copy_locale: 'en' },
            { id: 'cal_trip_today_v3', title: 'Business trip', sub: 'Today · Airport · 2.5 hours after the previous event', lead: '18:30', raw_start: '2026-05-28T18:30:00+08:00', raw_end: '2026-05-28T20:00:00+08:00', event_date: '2026-05-28', event_start_sort: 1110, badge: { text: 'Travel', kind: 'p1' }, copy_locale: 'en' },
            { id: 'cal_wrap_v3', title: 'Project wrap-up', sub: 'Tomorrow · Online · Afternoon follow-up', lead: '14:30', raw_start: '2026-05-29T14:30:00+08:00', raw_end: '2026-05-29T15:30:00+08:00', event_date: '2026-05-29', event_start_sort: 870, badge: { text: 'Work', kind: 'p1' }, copy_locale: 'en' },
            { id: 'cal_trip_next_v3', title: 'Business trip', sub: 'Tomorrow · Train station · Evening departure', lead: '20:30', raw_start: '2026-05-29T20:30:00+08:00', raw_end: '2026-05-29T22:00:00+08:00', event_date: '2026-05-29', event_start_sort: 1230, badge: { text: 'Reminder', kind: 'p2' }, copy_locale: 'en' }
          ],
          footer: '<span class="lbl">V3</span> English schedule cards; each spoken detail maps to one event'
        } },
      { t: 3900, gap_ms: 520, comp: 'tts', text: 'Overall, you have four events across two days: a meeting this afternoon, travel in the evening, then project wrap-up tomorrow afternoon and another trip tomorrow night.', pace: 'mid' },
      { t: 4450, gap_ms: 340, comp: 'tts', highlight: 'cal_meet_v3', text: 'At three thirty this afternoon, you need to meet in the conference room. It is a short item, but because travel follows later, I would pack the materials before the meeting starts.', pace: 'mid' },
      { t: 5000, gap_ms: 340, comp: 'tts', highlight: 'cal_trip_today_v3', text: 'At six thirty this evening, you have a business trip to the airport. There are two and a half hours after the meeting, so leave room for traffic and security checks.', pace: 'mid' },
      { t: 5550, gap_ms: 340, comp: 'tts', highlight: 'cal_wrap_v3', text: 'Tomorrow at two thirty in the afternoon is the project wrap-up. It would be better to review open items in the morning, so you are not rushing right before the session.', pace: 'mid' },
      { t: 6100, gap_ms: 340, comp: 'tts', highlight: 'cal_trip_next_v3', text: 'Tomorrow at eight thirty in the evening, you have another trip from the train station. Plan dinner and departure time early, and try not to add another heavy meeting that night.', pace: 'mid' },
      { t: 6600, gap_ms: 240, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'V3 只读日程 R0；英文 TTS/卡片；overview 可概括多项，单条 detail 必须一条 TTS 对一个 event ref。', fields: ['query:R0', 'english-copy', 'brief-ok', 'detail:single-ref'] }
    ],
    annotations: []
  };

  var calendarV4 = JSON.parse(JSON.stringify(global.LOONA_CASES['cortex_calendar_week_v3']));
  calendarV4.task_id = 'cortex_calendar_week_v4';
  calendarV4.title = '日程 · Cortex一周日程播报 V4';
  calendarV4.source_case = 'Cortex web_ui · list_events / calendar_today · V4';
  calendarV4.decision_record.primary_need = '查询今天到接下来一周的日程，先英文 brief，再按天和事件提醒';
  calendarV4.events[1].decision = 'router → NEW；命中 list_events；V4 使用英文 brief 卡先概括一周形状，再按日期聚合并逐事件对齐提醒。';
  calendarV4.events[1].fields = ['scene:calendar', 'tool:list_events', 'calendar-brief', 'per-event'];
  calendarV4.events[2].text = 'I’ll check the week and flag what matters.';
  calendarV4.events[4].decision = 'list_events → 返回 4 条；先插入 calendar brief card，再保留英文日期聚合卡，TTS 逐事件高亮。';
  calendarV4.events[4].fields = ['source_tool_name:list_events', 'calendar-brief-card', 'calendar-day-card', 'tts_focus:per-event'];
  calendarV4.events[5].card_id = 'calendar_focus_v4';
  calendarV4.events[5].content.title = 'Weekly Schedule Brief';
  calendarV4.events[5].content.status = { text: '2 days · 4 events', kind: 'ok' };
  calendarV4.events[5].content.footer = '<span class="lbl">V4</span> Brief card first; day cards remain for event focus';
  calendarV4.events[5].content.rows = [
    { id: 'cal_brief_v4', title: 'Schedule brief: 4 events', card_type: 'calendar_brief',
      sub: '',
      summary: '',
      brief_label: 'brief',
      count_text: '2 days · 4 events',
      metrics: [
        { label: 'Total', value: '4', kind: 'hot' },
        { label: 'Today', value: '2', kind: 'muted' },
        { label: 'Tomorrow', value: '2', kind: 'muted' }
      ],
      attention_title: 'Worth attention',
      attention_count_text: '2 days',
      attention_items: [
        { title: 'Today', summary: '2 events · 18:30 airport' },
        { title: 'Tomorrow', summary: '2 events · 20:30 train' }
      ],
      badge: { text: 'brief', kind: 'ok' }, right: 'This week', copy_locale: 'en' },
    { id: 'cal_meet_v4', title: 'Meet at conference room', sub: 'Today · Conference room', lead: '15:30', raw_start: '2026-05-28T15:30:00+08:00', raw_end: '2026-05-28T16:00:00+08:00', event_date: '2026-05-28', event_start_sort: 930, badge: { text: 'Focus', kind: 'p1' }, copy_locale: 'en' },
    { id: 'cal_trip_today_v4', title: 'Business trip', sub: 'Today · Airport · 2.5 hours after the meeting', lead: '18:30', raw_start: '2026-05-28T18:30:00+08:00', raw_end: '2026-05-28T20:00:00+08:00', event_date: '2026-05-28', event_start_sort: 1110, badge: { text: 'Travel', kind: 'p1' }, copy_locale: 'en' },
    { id: 'cal_wrap_v4', title: 'Project wrap-up', sub: 'Tomorrow · Online · Afternoon follow-up', lead: '14:30', raw_start: '2026-05-29T14:30:00+08:00', raw_end: '2026-05-29T15:30:00+08:00', event_date: '2026-05-29', event_start_sort: 870, badge: { text: 'Work', kind: 'p1' }, copy_locale: 'en' },
    { id: 'cal_trip_next_v4', title: 'Business trip', sub: 'Tomorrow · Train station · Evening departure', lead: '20:30', raw_start: '2026-05-29T20:30:00+08:00', raw_end: '2026-05-29T22:00:00+08:00', event_date: '2026-05-29', event_start_sort: 1230, badge: { text: 'Reminder', kind: 'p2' }, copy_locale: 'en' }
  ];
  calendarV4.events[6].highlight = 'cal_brief_v4';
  calendarV4.events[6].text = 'Four events across two days. Today watch the airport trip; tomorrow watch the train trip.';
  calendarV4.events[7].highlight = 'cal_meet_v4';
  calendarV4.events[7].text = 'At three thirty, meet in the conference room. Pack materials first.';
  calendarV4.events[8].highlight = 'cal_trip_today_v4';
  calendarV4.events[8].text = 'At six thirty, leave room for airport traffic and security.';
  calendarV4.events[9].highlight = 'cal_wrap_v4';
  calendarV4.events[9].text = 'Tomorrow afternoon is project wrap-up. Use the morning for open items.';
  calendarV4.events[10].highlight = 'cal_trip_next_v4';
  calendarV4.events[10].text = 'Tomorrow night is the train trip. Keep dinner and departure clean.';
  calendarV4.events[11].decision = 'V4 只读日程 R0；英文 brief 卡先给整体形状，后续 day card 保持按日期聚合，单条 detail 仍一条 TTS 对一个 event ref。';
  calendarV4.events[11].fields = ['query:R0', 'calendar-brief', 'day-card', 'detail:single-ref'];
  global.LOONA_CASES['cortex_calendar_week_v4'] = calendarV4;
})(window);
