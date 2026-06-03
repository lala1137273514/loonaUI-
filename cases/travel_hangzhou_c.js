/* 方案 C · 总览 + 每日亮点条 + 按需详情（推荐折中）—— 杭州 3 天
   首屏=1 张城市总览卡（大图 + 元信息 tag + 每天一行：缩略图/天序/一个最大亮点 tag）；
   点某天行 / 说"第二天" → 出该天详情卡（同 A 详情层）。TTS 两层：总览强安利整趟，每天一句亮点。
   照片暂复用 assets/travel/*（占位）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_hangzhou_c'] = {
    task_id: 'travel_hangzhou_c', title: '方案C · 杭州·总览+亮点条', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排杭州三天', granularity: 'by_day', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '杭州玩三天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽', decision: 'travel；杭州/3 天。', fields: ['scene:travel', '必填✓2'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '杭州三天，先给你一张总览，细节想看哪天点哪天。', pace: 'mid' },
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
      { t: 3600, gap_ms: 500, comp: 'tts', text: '杭州这三天我串成一条线：西湖、灵隐、宋城，慢慢玩不赶。', pace: 'mid' },
      { t: 4100, gap_ms: 420, comp: 'tts', text: '每天就盯一个最值的点——日落、静心、千古情，想看哪天细节点哪天。', pace: 'mid' },
      { t: 4600, gap_ms: 800, comp: 'user_query', text: '看第二天', drill_day: 'd2' },
      { t: 4900, gap_ms: 420, comp: 'tts', highlight: 'd2', text: '灵隐早去人最少，先拜后逛最舒服。', pace: 'mid' },
      { t: 5250, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '中午法喜寺那素斋本地人都排，值得试。', pace: 'mid' },
      { t: 5600, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '下午飞来峰，傍晚龙井村喝口头春收口。', pace: 'mid' },
      { t: 6000, gap_ms: 800, comp: 'user_query', text: '回到总览', travel_back: true },
      { t: 6300, gap_ms: 500, comp: 'tts', text: '行，退回总览，再看哪天都行。', pace: 'mid' }
    ], annotations: []
  };
})(window);
