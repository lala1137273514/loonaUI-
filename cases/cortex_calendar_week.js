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
})(window);
