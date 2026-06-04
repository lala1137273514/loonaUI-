/* 大理3天 · 朋友撒野 v2（对齐 travel_chengdu_5d_v2 的成熟骨架重做，修三处 bug）
   场景变量：同行人=一帮朋友 / 核心约束=出片·热闹·AA·不爱早起 / 王牌=洱海龙龛日落 / 不满点=第2天白天排太满(要泡吧晚睡)。

   对齐成都 v2 的四个正确做法（修掉旧版 bug）：
     #3  理解卡 = ClarifyCard 双卡 confirmed(已知低调)+ask(我猜的高亮)，无 options/无灰字/不填表。
     #19+#21 主动连讲 = tts 自带 drill_day 逐天自推（引擎已支持 tts 驱动 drill），不靠 user_query 报站。
     不满意当场改 = 用户吐槽后【重发整个 TravelStages(plan2)】，d2 换成清爽版 → 引擎重渲轮播，卡片真的变(旧版没重发=卡没体现)。
     三天可轮播切换 = 大理 3 天放【单个 stage 的 days:[d1,d2,d3]】，drill 进去三天同一轮播，tts drill_day 逐天聚焦切换(旧版 3 段each1天滑不动)。
   屏幕给全貌、口播挑重点不复述；火力压在 D1 洱海日落，D2/D3 带过。图片复用 assets/travel/dl_*.jpg，地名/美食为大理真实点位。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_dali_friends_v2'] = {
    task_id: 'travel_dali_friends_v2', title: '大理3天 v2 · 朋友撒野（主动连讲/会改/发群）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '大理三天怎么撒', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== 阶段① 接需求 + 轻澄清（少 UI，理解卡 confirmed/ask） ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '几个朋友去大理，3天，主打玩' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 抽槽 + 推断',
        decision: '目的地+天数已给(大理/3天)+朋友拼局→不开放提问、不弹选项；把推断偏好(出片/热闹夜/AA/不早起)摆出来一句话确认。', fields: ['大理/3天/一帮朋友', 'infer:出片/热闹/AA/不早起'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'understand', wait_for_user: true,
        tts: { text: '一帮人去大理撒三天，我先按出片、热闹、还有 AA 省钱来排，白天不给你们整太早——想加啥直接喊我。', pace: 'mid' },
        content: { title: '大理 · 3 天 · 一帮朋友',
          confirmed: [{ label: '目的地', value: '大理' }, { label: '周期', value: '3 天' }],
          ask: { label: '我先按这些给你们排', question: '出片优先 · 多机位　｜　热闹夜生活 · 泡吧　｜　AA 省钱 · 不爱早起' } } },
      { t: 0, gap_ms: 260, comp: 'user_query', text: '对，主要拍照玩，别太早起' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 收偏好',
        decision: '补充 不早起+重出片 → 白天不排太早、机位优先、夜生活拉满、AA 控价；给 3 套路线、首张主推洱海撒野。', fields: ['不早起/重夜生活', '机位优先/AA'] },

      /* ===== 阶段② 选路线（大图轮播 · 首张主推） ===== */
      { t: 700, gap_ms: 1400, comp: 'InspoFlow', card_id: 'plans', visual_state: 'active',
        content: { echo: '大理 3 天 · 挑套路线开整', cards: [
          { id: 'p1', rec: true, title: '洱海撒野 3 日', photo: 'assets/travel/dl_erhai.jpg', tags: ['出片', 'AA 人均', '晚睡友好'], punchline: '骑电驴绕洱海，傍晚日落拍够本' },
          { id: 'p2', title: '苍山洱海全景 3 日', photo: 'assets/travel/dl_cangshan.jpg', tags: ['大片', '登顶'], punchline: '想拍狠的，苍山俯瞰整片洱海封神' },
          { id: 'p3', title: '古城慢泡 3 日', photo: 'assets/travel/dl_gucheng.jpg', tags: ['慢', '泡吧', '人少'], punchline: '不爱赶就泡古城，咖啡泡吧晒太阳' }
        ] } },
      { t: 2100, gap_ms: 500, comp: 'tts', highlight: 'p1', text: '一帮人来大理我主推第一套，洱海撒野。租上电驴绕着海骑，海蓝天蓝随手出片，压轴傍晚那波日落，金光哗一下铺满整片湖，谁拍谁封神。', pace: 'mid' },
      { t: 2600, gap_ms: 420, comp: 'tts', highlight: 'p2', text: '想拍狠点的看第二套，苍山索道升到云上，整片洱海铺在脚底下——就是得早起趁云少。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 'p3', text: '要是就想躺平，第三套泡古城，咖啡泡吧晒太阳，不赶不累。', pace: 'mid' },
      { t: 3400, gap_ms: 400, comp: 'tts', highlight: 'p1', text: '你们主打玩又要出片，我还是押第一套。要不就它，我给你们排明白？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '就洱海撒野那套' },

      /* ===== 阶段③ 出整趟总览（单段含3天 → drill 后三天同一轮播可切换） ===== */
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 排期',
        decision: '洱海撒野 3 日按天排，三天串一个轮播看：D1 洱海骑行(王牌龙龛日落)/D2 古城夜嗨/D3 苍山封神。', fields: ['3 天一轮播', '王牌=D1日落'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在给你们扒大理三天咋撒最爽…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: { destination: '大理', duration_days: 3, title: '大理 · 3 天 · 洱海撒野',
          stages: [
            { id: 's1', title: '大理撒野 3 天', hook: '傍晚龙龛那波日落，别处偷不来', photo: 'assets/travel/dl_erhai.jpg', tags: ['洱海骑行', '古城夜嗨', '苍山封神'], days: [
              { id: 'd1', label: '洱海撒野 · 第1天', pace: 'mid', photo: 'assets/travel/dl_erhai.jpg', nodes: [
                { time: '上午', place: '才村码头', note: '集合租电驴，一人一辆开整' }, { time: '中午', place: '海西生态廊道', note: '边骑边停挑机位，水天一色跳拍' },
                { time: '下午', place: '海舌公园', note: '海边咖啡摊歇脚续电' }, { time: '傍晚', place: '龙龛码头', note: '压着日落到，金光铺满洱海' }], footer: '电驴一人一辆 AA，傍晚龙龛的光留着压轴' },
              { id: 'd2', label: '古城夜嗨 · 第2天', pace: 'normal', photo: 'assets/travel/dl_gucheng.jpg', nodes: [
                { time: '上午', place: '崇圣寺三塔', note: '聚影池抢三塔倒影机位' }, { time: '中午', place: '喜洲古镇', note: '啃喜洲粑粑，稻田边拍照' },
                { time: '下午', place: '大理古城', note: '人民路接着逛接着拍' }, { time: '晚上', place: '洋人街', note: '泡吧驻唱，民谣一响整晚不困' }], footer: '白天三个出片点排满，晚上接着嗨' },
              { id: 'd3', label: '苍山封神 · 第3天', pace: 'mid', photo: 'assets/travel/dl_cangshan.jpg', nodes: [
                { time: '上午', place: '感通索道', note: '包整厢升空，云少看得清' }, { time: '山上', place: '玉带云游路', note: '俯拍整片洱海，团体合影就这儿' },
                { time: '下午', place: '大理古城', note: '下山找口吃的、买点伴手' }, { time: '傍晚', place: '返程', note: '收队，群里对一下账' }], footer: '上午云少能看清洱海，山上风大带件外套' }
            ] }
          ] } },
      { t: 2500, gap_ms: 600, comp: 'tts', highlight: 's1', text: '先把三天的魂给你们说透——头一天洱海撒野最值，傍晚龙龛那波日落金光哗地铺满整片湖，一帮人逆光一站谁拍谁封神；第二天泡古城，白天出片晚上洋人街喝到不困；最后一天上苍山，索道升到云上俯拍整片洱海，收个漂亮尾。三天拍够、嗨够，AA 下来也不肉疼。', pace: 'mid' },
      { t: 3100, gap_ms: 800, comp: 'tts', text: '整趟就这么个框。要不要我一天天给你们讲讲，具体咋玩？不指哪天我就从头一天开始带。', pace: 'mid' },

      /* ===== 阶段④ 主动连讲逐天（tts 自带 drill_day，三天同一轮播逐天聚焦） ===== */
      { t: 0, gap_ms: 900, comp: 'tts', drill_day: 'd1', text: '洱海这天我给你们排满了撒野——上午才村码头一人一辆电驴开起来，中午海西廊道边骑边停挑机位，水天一色跳拍拍到爽。压轴是龙龛那波日落，掐着点傍晚到，金光铺满湖面那一下，一帮人逆光一站，整趟最值的大片就这张。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'tts', drill_day: 'd2', text: '来，第二天接着说——白天我给你们排得满满当当全是出片点：上午崇圣寺三塔抢倒影机位，中午喜洲古镇啃粑粑、顺道拍稻田，下午接着逛大理古城，晚上才是洋人街泡吧。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'tts', drill_day: 'd3', text: '最后一天上苍山封神，索道升到云上俯拍整片洱海，团体合影就这儿，拍完下山逛逛古城、买点伴手就返程。', pace: 'mid' },

      /* ===== 阶段⑤ 用户不满意 → 重发 TravelStages 当场改第2天（卡真的变） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第二天白天排太满了吧？我们晚上要泡吧晚睡，白天能不能轻松点' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 接负反馈',
        decision: '认「白天过满」、不维护原案；D2 白天砍到只留三塔出片机位、改睡到自然醒；夜生活(洋人街)保留。', fields: ['认负反馈', 'D2白天压松'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '第二天给你们重排…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 900, comp: 'TravelStages', card_id: 'plan2', visual_state: 'active',
        content: { destination: '大理', duration_days: 3, title: '大理 · 3 天 · 洱海撒野（已调整）',
          stages: [
            { id: 's1', title: '大理撒野 3 天', hook: '第2天白天留白，养精神晚上接着嗨', photo: 'assets/travel/dl_erhai.jpg', tags: ['洱海骑行', '睡到自然醒', '苍山封神'], days: [
              { id: 'd1', label: '洱海撒野 · 第1天', pace: 'mid', photo: 'assets/travel/dl_erhai.jpg', nodes: [
                { time: '上午', place: '才村码头', note: '集合租电驴，一人一辆开整' }, { time: '中午', place: '海西生态廊道', note: '边骑边停挑机位，水天一色跳拍' },
                { time: '下午', place: '海舌公园', note: '海边咖啡摊歇脚续电' }, { time: '傍晚', place: '龙龛码头', note: '压着日落到，金光铺满洱海' }], footer: '电驴一人一辆 AA，傍晚龙龛的光留着压轴' },
              { id: 'd2', label: '古城夜嗨 · 第2天（已调整）', pace: 'light', photo: 'assets/travel/dl_gucheng.jpg', nodes: [
                { time: '上午', place: '睡到自然醒', note: '不排，养精神留给晚上' }, { time: '午后', place: '崇圣寺三塔', note: '聚影池出片机位就这一个' },
                { time: '傍晚', place: '大理古城', note: '人民路边逛边吃，喜洲粑粑烤乳扇' }, { time: '晚上', place: '洋人街', note: '挑家有驻唱的扎进去，整晚不困' }], footer: '白天就一个机位，养足精神晚上接着嗨' },
              { id: 'd3', label: '苍山封神 · 第3天', pace: 'mid', photo: 'assets/travel/dl_cangshan.jpg', nodes: [
                { time: '上午', place: '感通索道', note: '包整厢升空，云少看得清' }, { time: '山上', place: '玉带云游路', note: '俯拍整片洱海，团体合影就这儿' },
                { time: '下午', place: '大理古城', note: '下山找口吃的、买点伴手' }, { time: '傍晚', place: '返程', note: '收队，群里对一下账' }], footer: '上午云少能看清洱海，山上风大带件外套' }
            ] }
          ] } },
      { t: 0, gap_ms: 700, comp: 'tts', drill_day: 'd2', text: '对哦，泡吧的人哪起得来——第二天白天我给你们砍到只留三塔那一个出片机位，睡到自然醒再出门。晚上洋人街照样嗨，整晚不困。', pace: 'mid' },

      /* ===== 阶段⑥ 收尾出结果（回完整总览 + 整理发群 + AA 分工，不订房） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '可以，齐活', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'toast', text: '完整三天 + AA 分工已发群里', state: 'done', dismiss_on: 'card' },
      { t: 600, gap_ms: 0, comp: 'tts', text: '整套我排明白了，发你们群里了——谁订电驴、谁订客栈、谁管订位，群里一目了然。重活我包了，你们整起来拍够本就行。', pace: 'mid' }
    ], annotations: []
  };
})(window);
