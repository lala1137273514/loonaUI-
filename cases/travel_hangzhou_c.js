/* 方案 C · 总览 + 每日亮点条 + 按需详情（推荐折中）—— 杭州 3 天
   首屏=1 张城市总览卡（大图 + 元信息 tag + 每天一行：缩略图/天序/一个最大亮点 tag）；
   点某天行 / 说"第二天" → 出该天详情卡（同 A 详情层）。TTS 两层：总览强安利整趟，每天一句亮点。
   照片暂复用 assets/travel/*（占位）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_hangzhou_c'] = {
    task_id: 'travel_hangzhou_c', title: '总览+亮点条 · 杭州3天（方案C）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排杭州三天', granularity: 'by_day', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '杭州玩三天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽', decision: 'travel；杭州/3 天。', fields: ['scene:travel', '必填✓2'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '杭州三天交给我——我不跟你整选择题，直接拍一条顺的路子，你哪天想细看，戳哪天就行。', pace: 'mid' },
        content: { title: '确认几个槽位', question: '必填已给；选填补不补都行。', slots: { required: [{ label: '目的地', value: '杭州' }, { label: '周期', value: '3 天' }], optional: ['日期', '出发地', '同行人', '预算', '节奏'] }, options: [{ label: '确认' }, { label: '取消' }] } },
      { t: 0, gap_ms: 240, comp: 'user_query', text: '确认，按默认' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 合槽', decision: '出 总览(城市图+元信息 tag) + 每天一行亮点；详情按需取。', fields: ['总览+每日亮点行'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在排杭州三天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 2100, gap_ms: 1500, comp: 'TravelOverview', card_id: 'plan', visual_state: 'active',
        content: {
          city: '杭州', duration: '3 日', photo: 'assets/travel/bund.jpg', tags: ['3天', '慢节奏', '亲子'],
          days: [
            { id: 'd1', day: '第1天', place: '西湖骑行', tag: '日落', thumb: 'assets/travel/bund.jpg', label: '第1天 · 西湖骑行', pace: 'light', photo: 'assets/travel/bund.jpg',
              nodes: [{ time: '上午', place: '断桥·白堤', note: '环湖骑行起步，人少风大' }, { time: '中午', place: '楼外楼', note: '尝口东坡肉醋鱼' }, { time: '下午', place: '苏堤', note: '压点骑到苏堤等日落' }, { time: '晚上', place: '河坊街', note: '夜市逛吃收尾' }], footer: '到达日不赶，骑行加日落开场' },
            { id: 'd2', day: '第2天', place: '灵隐祈福', tag: '静心', thumb: 'assets/travel/westbund.jpg', label: '第2天 · 灵隐祈福', pace: 'normal', photo: 'assets/travel/westbund.jpg',
              nodes: [{ time: '上午', place: '灵隐寺', note: '早去人少，先拜后逛' }, { time: '中午', place: '法喜寺', note: '出名的素斋值得排' }, { time: '下午', place: '飞来峰', note: '石窟造像，林子里清凉' }, { time: '晚上', place: '龙井村', note: '山脚喝口当季龙井' }], footer: '人文加静心，走得不累' },
            { id: 'd3', day: '第3天', place: '宋城千古情', tag: '必看', thumb: 'assets/travel/tianzifang.jpg', label: '第3天 · 宋城收尾', pace: 'normal', photo: 'assets/travel/tianzifang.jpg',
              nodes: [{ time: '上午', place: '宋城', note: '换身古装先逛园子' }, { time: '中午', place: '宋城小吃', note: '边逛边吃不耽误' }, { time: '下午', place: '千古情演出', note: '招牌演出，提前占位' }], footer: '看完演出顺路返程' }
          ]
        } },
      { t: 3600, gap_ms: 500, comp: 'tts', text: '三天我给你排成由松到紧：头天西湖压着点骑到苏堤等日落，隔天钻进灵隐山里，压轴宋城看场大演出，越玩越上头。', pace: 'mid' },
      { t: 4100, gap_ms: 420, comp: 'tts', text: '要我说，最戳我的是第二天灵隐——赶早进去，香火味混着山里的凉气，那种安静城里给不了，戳进去我细讲。', pace: 'mid' },
      { t: 4600, gap_ms: 800, comp: 'user_query', text: '看第二天', drill_day: 'd2' },
      { t: 4900, gap_ms: 420, comp: 'tts', highlight: 'd2', text: '灵隐这天我特意压到一早——开门头一拨进去，香炉刚点上，林子里几乎没人，那股清净是排队大军来了就再也找不回来的，所以我让你先拜后逛。', pace: 'mid' },
      { t: 5250, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '出来挪到法喜寺，那口素斋本地人都肯排队，一大碗素面热乎下肚，比啥大餐都落胃。', pace: 'mid' },
      { t: 5600, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '下午进飞来峰看石窟，林子里阴凉好走；傍晚拐去龙井村山脚，这时节正赶上头春，喝口现炒的，茶香收个尾，这天就齐了。', pace: 'mid' },
      { t: 6000, gap_ms: 800, comp: 'user_query', text: '回到总览', travel_back: true },
      { t: 6300, gap_ms: 500, comp: 'tts', text: '收，跳回全局，三天都摆这儿了，你再翻哪天我都接得住。', pace: 'mid' }
    ], annotations: []
  };
})(window);
