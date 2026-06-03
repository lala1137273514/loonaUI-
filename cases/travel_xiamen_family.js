/* 厦门 4 天 · 带 5 岁娃亲子（遛娃不累）—— 总览 + 每日亮点条 + 按需下钻（镜像 travel_hangzhou_c）
   首屏=1 张城市总览卡（大图 + 元信息 tag + 每天一行：缩略图/天序/一个最大亮点 tag）；
   点某天行 / 说"沙滩那天" → 出该天详情。TTS 两层：总览强安利整趟，每天一句亮点。
   亲子向：低密度、亲子设施（沙滩/缆车/喂鸽）、早睡午休、"带娃也能松弛"。
   照片用 assets/travel/xm_*（厦门实拍）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_xiamen_family'] = {
    task_id: 'travel_xiamen_family', title: '厦门4天 · 带娃亲子（遛娃不累）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排厦门四天亲子行程', granularity: 'by_day', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '带5岁娃去厦门，4天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽', decision: 'travel；厦门/4天；同行=带 5 岁娃，判亲子节奏。', fields: ['scene:travel', '必填✓2', '同行:亲子'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '好，厦门四天、带个 5 岁娃，我记下了。就问你一句：娃中午得午睡吗？要的话我每天留出回酒店歇脚的时间，别给你俩排太满。', pace: 'mid' },
        content: { question: '娃中午要留午睡时间吗？要的话我把节奏压低、每天留歇脚。', slots: [{ label: '目的地', value: '厦门' }, { label: '周期', value: '4 天' }, { label: '同行', value: '带 5 岁娃' }, { label: '午休', required: true }], options: [{ label: '直接来' }, { label: '我补一下' }] } },
      { t: 0, gap_ms: 240, comp: 'user_query', text: '要午休，别太赶' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 合槽', decision: '默认：节奏=亲子低密度、每天留午休、傍晚早收早睡；出 总览(城市图+元信息 tag) + 每天一行亮点，详情按需取。', fields: ['亲子低密度', '每天午休/早睡', '总览+每日亮点行'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在排厦门四天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 2100, gap_ms: 1500, comp: 'TravelOverview', card_id: 'plan', visual_state: 'active',
        content: {
          city: '厦门', duration: '4天', photo: 'assets/travel/xm_gulangyu.jpg', tags: ['亲子低密度', '每天午休', '早睡'],
          days: [
            { id: 'd1', day: 'Day 1', place: '鼓浪屿', tag: '慢逛', thumb: 'assets/travel/xm_gulangyu.jpg', label: 'Day 1 · 鼓浪屿慢逛', pace: 'light', photo: 'assets/travel/xm_gulangyu.jpg',
              nodes: [{ time: '上午', place: '鼓浪屿轮渡', note: '坐船过岛本身就是娃的兴奋点' }, { time: '中午', place: '岛上小馆', note: '吃完回民宿歇脚午睡' }, { time: '下午', place: '老别墅小巷', note: '没车的岛，娃放开跑你也不慌' }, { time: '傍晚', place: '内厝澳码头', note: '看个日落就回，早点睡' }], footer: '到达日不赶，全岛没车娃能撒欢' },
            { id: 'd2', day: 'Day 2', place: '环岛路沙滩', tag: '挖沙', thumb: 'assets/travel/xm_huandao.jpg', label: 'Day 2 · 环岛路沙滩', pace: 'light', photo: 'assets/travel/xm_huandao.jpg',
              nodes: [{ time: '上午', place: '观音山沙滩', note: '带上小桶铲子，挖沙踩浪一上午' }, { time: '中午', place: '海边餐厅', note: '吃饱回去午睡，避开正午大太阳' }, { time: '下午', place: '环岛路骑行道', note: '租亲子车带娃慢骑，风大凉快' }, { time: '傍晚', place: '椰风寨', note: '捡贝壳玩到天黑收工' }], footer: '一整天泡沙滩，娃玩到不想走' },
            { id: 'd3', day: 'Day 3', place: '厦大+南普陀', tag: '喂鸽', thumb: 'assets/travel/xm_university.jpg', label: 'Day 3 · 厦大 + 南普陀', pace: 'normal', photo: 'assets/travel/xm_university.jpg',
              nodes: [{ time: '上午', place: '厦门大学', note: '芙蓉隧道涂鸦娃看得新鲜，需提前预约' }, { time: '中午', place: '南普陀素饼', note: '寺旁吃点心，回酒店午睡' }, { time: '下午', place: '南普陀寺', note: '广场喂鸽子，娃能玩好久' }, { time: '傍晚', place: '演武大桥', note: '看海回酒店早歇' }], footer: '人文加喂鸽，走得不多娃也不累' },
            { id: 'd4', day: 'Day 4', place: '中山路+曾厝垵', tag: '收尾', thumb: 'assets/travel/xm_zhongshan.jpg', label: 'Day 4 · 中山路 + 曾厝垵', pace: 'normal', photo: 'assets/travel/xm_zhongshan.jpg',
              nodes: [{ time: '上午', place: '中山路骑楼', note: '老街逛吃，给娃买点小玩意' }, { time: '中午', place: '沙茶面', note: '尝口地道沙茶面，吃完歇脚' }, { time: '下午', place: '曾厝垵', note: '文艺村小吃一条街，边逛边扫' }], footer: '逛吃收尾，顺路返程不折腾' }
          ]
        } },
      { t: 3600, gap_ms: 500, comp: 'tts', text: '厦门这四天我按娃的节奏给你压过：天天留午睡、傍晚早早收，娃能撒欢你也不累。', pace: 'mid' },
      { t: 4100, gap_ms: 420, comp: 'tts', highlight: 'd1', text: '头一天上鼓浪屿，全岛没车，娃放开跑你都不用揪着。', pace: 'mid' },
      { t: 4520, gap_ms: 380, comp: 'tts', highlight: 'd2', text: '第二天直接泡沙滩，小桶铲子一带，挖沙踩浪能玩一整天。', pace: 'mid' },
      { t: 4920, gap_ms: 380, comp: 'tts', highlight: 'd3', text: '第三天厦大配南普陀，广场上一把鸽食撒出去，娃能乐呵半天。', pace: 'mid' },
      { t: 5400, gap_ms: 800, comp: 'user_query', text: '沙滩那天细说', drill_day: 'd2' },
      { t: 5700, gap_ms: 420, comp: 'tts', highlight: 'd2', text: '观音山这片沙细水浅，给娃挖沙踩浪最稳，你也能松快坐着看。', pace: 'mid' },
      { t: 6050, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '中午我特意留了回去午睡，避开正午那毒太阳，娃不蔫你也不累。', pace: 'mid' },
      { t: 6390, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '下午租台亲子车沿环岛路慢骑，海风一吹凉快，傍晚捡贝壳收工正好早睡。', pace: 'mid' },
      { t: 6800, gap_ms: 800, comp: 'user_query', text: '回到总览', travel_back: true },
      { t: 7100, gap_ms: 500, comp: 'tts', text: '行，退回总览，剩下哪天想细看你说一声，带娃这趟交给我。', pace: 'mid' }
    ], annotations: []
  };
})(window);
