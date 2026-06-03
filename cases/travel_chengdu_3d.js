/* 旅行规划 · 成都三日游（对齐「旅行规划_交付版_v1_修订稿」§4.1 链路 / §7.2 TravelPayload）
   链路：澄清(必填2✓+选填待补,停等) → 确认 → 合槽(默认+记忆inferred) →
        fan-out(get_weather ∥ web_search，不调 template) → 切卡填点挂证据 →
        TravelView(3段·带时段行+一句评价footer) → 逐段高亮口播。无钻取/无保存(钻取+TTS联动=v2；保存=cortex通用)。
   注：本 case 用 mock 组件真实 props(sections/badge/text、nodes{time,place,note})播放链路；
       TravelPayload(cards/span/evidence_refs)是交付契约，前端渲染由治理/cortex 映射，二者不强绑。
   footer 证据标记：当前天气=无标 / 搜索=~ / 推断=≈。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['travel_chengdu_3d'] = {
    task_id: 'travel_chengdu_3d',
    title: '成都三日游（修订稿链路）',
    scene: 'travel',
    source_case: '旅行规划_交付版_v1_修订稿 §4.1 / §7.2',
    default_skin: 'glass',          // glass=分段卡(3段清楚)；可切 aura 看沉浸轮播
    decision_record: {
      request_type: 'task', primary_need: '排成都三天行程', granularity: 'by_day',
      evidence_level: 'E1', action_risk: 'R0', output_mode: 'document',
      tool_plan: 'query', confirmation_required: false
    },
    events: [
      /* 0. 听取 */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '成都三日游' },

      /* 1. 路由抽槽 */
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽',
        decision: 'Router 判 travel；抽槽 destination=成都、duration_days=3；选填全空。',
        fields: ['scene:travel', '必填✓2', '选填:待补'] },

      /* 2. 澄清（必填齐 → 列必填✓+选填待补，给"确认/取消"，停等） */
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '成都三天记下了。日期、出发地、同行、预算、节奏补不补都行，不补我按轻松城市漫步排。', pace: 'mid' },
        content: {
          title: '确认几个槽位',
          question: '必填已给；选填补不补都行，不补我按默认/你平时的来。',
          slots: {
            required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '3 天' }],
            optional: ['确切日期', '出发地', '同行人', '预算', '节奏', '兴趣/必去']
          },
          options: [{ label: '确认' }, { label: '取消' }]
        } },
      { t: 0, gap_ms: 240, comp: 'user_query', text: '确认（按默认排）' },

      /* 3. 合槽（默认 + 记忆推断，标 inferred 写 assumptions） */
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 合槽',
        decision: '默认：预算=中等、节奏=轻松城市漫步、同行=成人；记忆有则推断偏好并标 inferred 写进 assumptions[]。',
        fields: ['默认:中等/轻松', 'inferred→assumptions'] },
      { t: 600, gap_ms: 260, comp: 'toast', text: '正在排成都三天…', state_visual: 'loading', dismiss_on: 'card' },

      /* 4. fan-out 取数（只 weather + search，不调 template） */
      { t: 900, gap_ms: 360, comp: 'agent_step', internal: true, label: 'TOOL · 取数(并行)',
        decision: 'fan-out：get_weather(成都)·仅当前天气 ∥ web_search(成都 {{TODAY}} 近期活动/预约/避坑/天气预报)。不调 get_travel_plan_template。',
        fields: ['get_weather', 'web_search'] },

      /* 5. 切卡填点挂证据 */
      { t: 1300, gap_ms: 320, comp: 'agent_step', internal: true, label: 'DECISION · 切卡+证据',
        decision: '3天逐日切3卡(span=1)；填真实点位；挂 evidence_refs：当前天气=E2(无标)、搜索结论=E1(~)、推断=E0(≈)。',
        fields: ['3卡/span1', 'E2/E1/E0'] },

      /* 6. 一阶段·阶段总览（TravelStages：阶段封面轮播，大图 + tag；阶段可含多天） */
      { t: 2900, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: {
          destination: '成都', duration_days: 3, title: '成都 · 3 天',
          stages: [
            { id: 's1', title: '市区 × 人文', hook: '老城慢逛，把成都的闲味先尝够', photo: 'assets/travel/bund.jpg', tags: ['轻松→适中', '城市漫步', '中等预算', '人文'],
              days: [
                { id: 'd1', label: 'Day 1 · 市区慢启', pace: 'light', photo: 'assets/travel/bund.jpg',
                  nodes: [ { time: '上午', place: '宽窄巷子', note: '到达日不赶，逛吃为主' }, { time: '下午', place: '人民公园·鹤鸣茶社', note: '喝茶休整，卸掉路上的累' } ],
                  footer: '到达日不赶，先把节奏放慢' },
                { id: 'd2', label: 'Day 2 · 人文慢看', pace: 'normal', photo: 'assets/travel/westbund.jpg',
                  nodes: [ { time: '上午', place: '武侯祠', note: '三国人文，上午先看' }, { time: '中午', place: '锦里', note: '紧挨武侯祠，边吃边逛' }, { time: '下午', place: '杜甫草堂', note: '园林安静，节奏放慢' } ],
                  footer: '人文线为主，走得不多' }
              ] },
            { id: 's2', title: '熊猫 · 收尾', hook: '压轴留给滚滚，错过得等下次', photo: 'assets/travel/tianzifang.jpg', tags: ['适中', '中等预算', '熊猫基地'],
              days: [
                { id: 'd3', label: 'Day 3 · 熊猫 + 收尾', pace: 'normal', photo: 'assets/travel/tianzifang.jpg',
                  nodes: [ { time: '上午', place: '大熊猫基地', note: '越早越活跃，需提前确认预约' }, { time: '下午', place: '春熙路·太古里', note: '逛吃收尾，方便返程' } ],
                  footer: '看熊猫要早，下午轻松收尾' }
              ] }
          ] }
      },

      /* 7. 总览口播：贴人(你定的轻松/城市漫步/中等预算)+ 挑过的 + 天序自然；逐阶段封面聚焦
         文案规则对齐 cortex config/llm_tasks/compose_trip.yaml(summary §87-103) + persona.yaml */
      { t: 4400, gap_ms: 500, comp: 'tts', text: '成都这三天我替你挑过，闲归闲，每天都埋了个非去不可的点。', pace: 'mid' },
      { t: 5000, gap_ms: 380, comp: 'tts', highlight: 's1', text: '头两天扎进老城区，把成都的闲味儿一次尝透。', pace: 'mid' },
      { t: 5400, gap_ms: 380, comp: 'tts', highlight: 's2', text: '压轴那天留给滚滚，这才是来成都的招牌。', pace: 'mid' },

      /* 8. 二阶段·下钻：说「看第二天」(也可点封面卡) → View Transition 形变进该阶段逐天详情，定位 Day 2 */
      { t: 5900, gap_ms: 800, comp: 'user_query', text: '看看第二天具体怎么走', drill_day: 'd2' },
      { t: 6200, gap_ms: 420, comp: 'tts', highlight: 'd2', text: '这天走人文，武侯祠先去，三国迷来成都这是头一站。', pace: 'mid' },
      { t: 6500, gap_ms: 320, comp: 'tts', highlight: 'd2', text: '出来就是锦里，红灯笼一条街，小吃边走边扫。', pace: 'mid' },
      { t: 6800, gap_ms: 360, comp: 'tts', highlight: 'd2', text: '下午杜甫草堂，诗圣住过的院子，安静还出片。', pace: 'mid' },

      /* 9. 同阶段左右切天：切到 Day 1（仍在二阶段，只滑动聚焦不形变） */
      { t: 7200, gap_ms: 700, comp: 'user_query', text: '那第一天呢', drill_day: 'd1' },
      { t: 7500, gap_ms: 380, comp: 'tts', highlight: 'd1', text: '头一天宽窄巷子热身，老成都的院子加地道小吃管够。', pace: 'mid' },
      { t: 7800, gap_ms: 340, comp: 'tts', highlight: 'd1', text: '下午鹤鸣茶社一碗盖碗茶配采耳，巴适得板。', pace: 'mid' },

      /* 10. 返回总览 → 再跨阶段下钻熊猫那天 */
      { t: 8200, gap_ms: 800, comp: 'user_query', text: '回到整体看看', travel_back: true },
      { t: 8600, gap_ms: 500, comp: 'tts', text: '行，退回来看整体。', pace: 'mid' },
      { t: 9000, gap_ms: 800, comp: 'user_query', text: '熊猫那天看什么', drill_day: 'd3' },
      { t: 9300, gap_ms: 420, comp: 'tts', highlight: 'd3', text: '熊猫得赶早去，早上滚滚最闹，抱树啃笋全在这会儿。', pace: 'mid' },
      { t: 9600, gap_ms: 320, comp: 'tts', highlight: 'd3', text: '看完太古里收尾，那块熊猫爬墙的裸眼3D大屏顺手出片。', pace: 'mid' }
      /* 两阶段：阶段封面总览 → 说某天/点封面 翻转进逐天详情 → 同阶段左右切天 / 返回总览 / 跨阶段再下钻 */
    ],
    annotations: []
  };
})(window);
