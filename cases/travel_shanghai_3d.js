/* 旅行 case（场景 08 / §08）· 澄清(停等) → 单卡 SectionCard(3 天分段) → 分段口播逐天高亮 → 保存确认。
   照 03 §5 真实帧序列重排成单卡形态(小屏更省空间)。节奏契约见 README。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['travel_shanghai_3d'] = {
    task_id: 'travel_shanghai_3d', title: '上海旅行三天', scene: 'travel', source_case: '知识库 §08 / 03 §5', default_skin: 'aura',
    decision_record: { request_type: 'task', primary_need: '排上海三天行程', granularity: 'segmented',
      evidence_level: 'E2', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '我想去上海旅行三天' },
      { t: 250, gap_ms: 280, comp: 'agent_step', internal: true, label: 'ROUTER · PLANNER',
        decision: 'router → task · travel；选填槽不连环问，先澄清一次。', fields: ['scene:travel', 'segmented'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '好，上海三天，地点和天数我都记下了。', pace: 'mid' },
      /* 澄清 = 槽位卡：必填(地点/时间 已从「上海三天」自动填充)+ 选填可补；卡显示槽位，TTS 另说人话(先接住再问) */
      { t: 900, gap_ms: 260, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '要不要再补日期、人数、预算，或者偏好？不补我按中等、城市漫步排。', pace: 'mid' },
        content: {
          title: '确认几个槽位', question: '必填两项已自动填好；选填补不补都行。',
          slots: {
            required: [{ label: '地点', value: '上海' }, { label: '时间', value: '3 天' }],
            optional: ['日期', '人数', '预算', '偏好']
          },
          options: [{ label: '直接排' }, { label: '我补一下' }]
        } },
      { t: 0, gap_ms: 220, comp: 'user_query', text: '不用补，你来排' },
      { t: 300, gap_ms: 300, comp: 'toast', text: '正在排行程…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 500, gap_ms: 220, comp: 'agent_step', internal: true, label: 'PLANNER · TOOL',
        decision: 'planner → get_travel_plan_template ｜ E2 ｜ R0 ｜ 三天压成一张卡分段。', fields: ['tool:get_travel_plan_template', 'evidence:E2'] },
      { t: 2300, gap_ms: 1800, comp: 'TravelView', card_id: 'plan', visual_state: 'active',
        content: { title: '上海 3 天 · 城市漫步',
          sections: [
            { id: 'day1', label: 'Day 1 · 城市漫步', badge: { text: '轻松', kind: 'free' }, text: '外滩 · 南京路步行街 · 豫园（可改）' },
            { id: 'day2', label: 'Day 2 · 艺术与江畔', badge: { text: '适中', kind: 'amber' }, text: '西岸美术馆 · 龙美术馆（可改）· 滨江绿道' },
            { id: 'day3', label: 'Day 3 · 市井与离开', badge: { text: '轻松', kind: 'free' }, text: '田子坊 · 新天地（可改）' }
          ], footer: '<span class="lbl">交通</span> 地铁为主　·　<span class="lbl">天气</span> 周五留意小雨' } },
      /* 扫读态：导游先给整体基调，再逐日点到对应封面（高亮聚光，一眼看出在讲哪天） */
      { t: 3900, gap_ms: 520, comp: 'tts', text: '三天按城市漫步排，前松、中间看展、后松。', pace: 'mid' },
      { t: 4500, gap_ms: 300, comp: 'tts', highlight: 'day1', text: '第一天最松，外滩开场逛到豫园，都靠走。', pace: 'mid' },
      { t: 5000, gap_ms: 300, comp: 'tts', highlight: 'day2', text: '第二天看艺术，西岸美术馆到滨江绿道。', pace: 'mid' },
      { t: 5500, gap_ms: 300, comp: 'tts', highlight: 'day3', text: '第三天市井收尾，逛田子坊新天地后赶车。', pace: 'mid' },

      /* 钻取单日：用户问具体怎么走 → 单日聚焦卡(照片 + 上午/下午/傍晚) + 导游逐段解说（像新闻 list→focus 召回，标注 2c） */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '第一天具体怎么走？' },
      { t: 300, gap_ms: 260, comp: 'agent_step', internal: true, label: 'FOCUS · DAY',
        decision: '钻取 Day1 → 单日聚焦，铺开上午/下午/傍晚 + 体力；复用已排数据，不重排。', fields: ['drill:day1', 'reuse'] },
      { t: 600, gap_ms: 1200, comp: 'TravelDayFocus', card_id: 'focus_day1', visual_state: 'active',
        content: { title: 'Day 1 · 城市漫步', badge: { text: '轻松', kind: 'free' }, photo: 'assets/travel/bund.jpg',
          nodes: [
            { time: '上午', place: '外滩', note: '沿江看万国建筑，随手拍' },
            { time: '下午', place: '南京路步行街', note: '边吃边逛，地铁直达' },
            { time: '傍晚', place: '豫园 · 城隍庙', note: '老城厢小吃，人多早点去' }
          ], footer: '<span class="lbl">体力</span> 轻松　·　全程步行 + 地铁' } },
      { t: 1800, gap_ms: 480, comp: 'tts', text: '行，第一天我带你走一遍。', pace: 'mid' },
      { t: 2300, gap_ms: 300, comp: 'tts', text: '上午先去外滩，沿江看万国建筑、随手拍。', pace: 'mid' },
      { t: 2700, gap_ms: 300, comp: 'tts', text: '中午沿南京路边吃边逛，地铁直接到。', pace: 'mid' },
      { t: 3100, gap_ms: 300, comp: 'tts', text: '傍晚去豫园城隍庙吃小吃，人多早点去。', pace: 'mid' },
      { t: 3500, gap_ms: 320, comp: 'tts', text: '整天靠走加地铁，体力很松，不赶。', pace: 'mid' },
      { t: 6000, gap_ms: 260, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: 'task ｜ segmented ｜ E2 ｜ R0 ｜ output_mode=document（R0 直接交付，不强制确认）。', fields: ['segmented', 'R0'] },
      { t: 6400, gap_ms: 420, comp: 'confirm', card_id: 'save', wait_for_user: true,
        tts: { text: '要把这份上海攻略放进长期知识库吗？以后旅行我默认参考。', pace: 'mid' },
        content: { action: '保存到长期知识库', target: '上海 3 天攻略', impact: '以后旅行默认参考这份偏好',
          content_summary: '上海 · 3天 · 中等预算 · 城市漫步', reversible: true, countdown: 30, confirm_label: '保存', cancel_label: '先不用' } },
      { t: 6800, gap_ms: 300, comp: 'tts', text: '好，记下了。需要改哪天随时跟我说。', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
