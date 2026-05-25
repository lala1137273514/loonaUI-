/* 餐厅 case（场景 07 / §07）· 单卡 SubjectCard 主推一家(+备选压成脚注)；"换一个"只替主推(聚焦换卡)。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['restaurant_quiet'] = {
    task_id: 'restaurant_quiet', title: '餐厅 · 主推 + 换一个', scene: 'restaurant', source_case: '知识库 §07', default_skin: 'aura',
    decision_record: { request_type: 'task', primary_need: '直接给一个最稳选择，不要列表', granularity: 'single_point',
      evidence_level: 'E3', action_risk: 'R0', output_mode: 'voice_card', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '附近找个安静能聊天的地方吃晚饭' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER',
        decision: 'router → task · restaurant；约束 安静>评分；缺必填【位置】（“附近”太泛）→ 问一次，不猜(REQ-RST-002)。', fields: ['scene:restaurant', 'slot:loc-missing'] },
      { t: 600, gap_ms: 300, comp: 'tts', text: '行，先弄清你在哪一带。', pace: 'mid' },
      /* 槽位式澄清：缺必填【位置】；场景已从原话填好(✓) + 选填可补 */
      { t: 900, gap_ms: 320, comp: 'ClarifyCard', card_id: 'rst_loc', wait_for_user: true,
        tts: { text: '你在哪一带？说个地标，或者用定位。', pace: 'mid' },
        content: { title: '缺个必填槽位', question: '位置定了就给你挑；场景我记下了。',
          slots: { required: [{ label: '位置' }, { label: '场景', value: '安静聊天' }], optional: ['预算', '忌口/口味'] },
          options: [{ label: '用定位' }, { label: '我说位置' }] } },
      { t: 0, gap_ms: 220, comp: 'user_query', text: '静安寺附近，人均一百多' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'SLOT-FILL',
        decision: '位置=静安寺、预算≈¥120(用户提供)；硬约束 安静>评分；主推一家不列表。', fields: ['loc:静安寺', 'budget:120'] },
      { t: 600, gap_ms: 300, comp: 'tts', text: '好，静安寺附近，我来挑。', pace: 'mid' },
      { t: 900, gap_ms: 260, comp: 'toast', state: 'searching', dismiss_on: 'card' },
      { t: 2300, gap_ms: 1400, comp: 'RestaurantView', card_id: 'r1', visual_state: 'active',
        content: { title: '梧桐边小馆', badge: { text: '安静聊天', kind: 'amber' },
          headline: '620 米能走到，标签里有安静、适合聊天，比那家评分高但偏吵的火锅稳。',
          meta: '620m · 人均 ¥120', tags: ['安静', '适合聊天'],
          footer: '<span class="lbl">不确定</span> 没拿到实时排队，不保证一定有位' } },
      /* 靠谱店长：给一个定论 → 距离 → 为什么压过高分那家 → 诚实说不保证有位。一句一拍。 */
      { t: 4000, gap_ms: 600, comp: 'tts', text: '今晚我给你定梧桐边小馆。', pace: 'mid' },
      { t: 4500, gap_ms: 300, comp: 'tts', text: '六百多米能走到，主打安静。', pace: 'mid' },
      { t: 4900, gap_ms: 300, comp: 'tts', text: '比那家高分但偏吵的火锅更合适。', pace: 'mid' },
      { t: 5300, gap_ms: 300, comp: 'tts', text: '没拿到实时排队，不保证有位。', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '不想吃这家，换一个' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'REPLACE',
        decision: '记录拒绝原因；只替换主推，不重启成列表（last_rejected + constraint_delta）。', fields: ['correction', 'replace-primary'] },
      { t: 600, gap_ms: 1200, comp: 'RestaurantView', card_id: 'r2', visual_state: 'active',
        content: { title: '街角咖餐厅', badge: { text: '安静聊天', kind: 'amber' },
          headline: '距离更近，聊天压力小，轻食为主。', meta: '300m · 人均 ¥90', tags: ['安静', '轻食'] } },
      { t: 1500, gap_ms: 560, comp: 'tts', text: '那换街角咖餐厅，更近一点。', pace: 'mid' },
      { t: 1900, gap_ms: 300, comp: 'tts', text: '轻食为主，聊天压力更小。', pace: 'mid' },
      { t: 2100, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '推荐 R0-R1；主推一家；无菜单证据不说必点，无实时来源不说一定有位；订位才升 R3。', fields: ['pick-1', 'no-claim'] }
    ],
    annotations: []
  };
})(window);
