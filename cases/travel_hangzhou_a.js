/* 方案 A · 封面卡 + 钻取（最小改动，保内核）—— 杭州 3 天，每天一张大图封面，点/说才出详情
   首屏=每天一张 cover(大图+tag+hook，nodes 默认藏)；下钻该天才出 4 时段。复用 TravelStages(每阶段=1 天)。
   照片暂复用 assets/travel/*（占位）。口播：拉满种草，每段甩具体亮点。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_hangzhou_a'] = {
    task_id: 'travel_hangzhou_a', title: '封面卡钻取 · 杭州3天（方案A）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排杭州三天', granularity: 'by_day', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '杭州玩三天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽', decision: 'travel；destination=杭州、duration=3；选填全空。', fields: ['scene:travel', '必填✓2'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '杭州三天我接住了。你要是懒得填那些框，就别填——我按最舒服、最出片的路子给你拍一条。', pace: 'mid' },
        content: { title: '确认几个槽位', question: '必填已给；选填补不补都行。', slots: { required: [{ label: '目的地', value: '杭州' }, { label: '周期', value: '3 天' }], optional: ['日期', '出发地', '同行人', '预算', '节奏'] }, options: [{ label: '确认' }, { label: '取消' }] } },
      { t: 0, gap_ms: 240, comp: 'user_query', text: '确认，按默认' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 合槽', decision: '默认 轻松/中等/出片向；每天一张大图封面，nodes 默认藏、下钻才出。', fields: ['每天1封面卡', '默认:轻松/出片'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在排杭州三天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 900, gap_ms: 300, comp: 'agent_step', internal: true, label: 'TOOL · 取数(并行)', decision: 'get_weather(杭州) ∥ web_search(西湖/灵隐/宋城 近期/避坑)。', fields: ['get_weather', 'web_search'] },
      { t: 2400, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: {
          destination: '杭州', duration_days: 3, title: '杭州 · 3 天',
          stages: [
            { id: 's1', title: '第1天 · 西湖骑行', hook: '先去西湖边骑行追日落', photo: 'assets/travel/bund.jpg', tags: ['轻松', '日落', '出片'],
              days: [{ id: 'd1', label: '第1天 · 西湖骑行', pace: 'light', photo: 'assets/travel/bund.jpg', nodes: [
                { time: '上午', place: '断桥·白堤', note: '环湖骑行起步，人少风大' }, { time: '中午', place: '楼外楼', note: '尝口东坡肉醋鱼' },
                { time: '下午', place: '苏堤', note: '压点骑到苏堤等日落' }, { time: '晚上', place: '河坊街', note: '夜市逛吃收尾' }], footer: '到达日不赶，骑行加日落先把状态打开' }] },
            { id: 's2', title: '第2天 · 灵隐祈福', hook: '灵隐山里求个静', photo: 'assets/travel/westbund.jpg', tags: ['人文', '静心', '祈福'],
              days: [{ id: 'd2', label: '第2天 · 灵隐祈福', pace: 'normal', photo: 'assets/travel/westbund.jpg', nodes: [
                { time: '上午', place: '灵隐寺', note: '早去人少，先拜后逛' }, { time: '中午', place: '法喜寺', note: '出名的素斋值得排' },
                { time: '下午', place: '飞来峰', note: '石窟造像，林子里清凉' }, { time: '晚上', place: '龙井村', note: '山脚喝口当季龙井' }], footer: '人文加静心一整天，走得不累' }] },
            { id: 's3', title: '第3天 · 宋城收尾', hook: '压轴看场宋城千古情', photo: 'assets/travel/tianzifang.jpg', tags: ['必看', '演出', '穿越'],
              days: [{ id: 'd3', label: '第3天 · 宋城收尾', pace: 'normal', photo: 'assets/travel/tianzifang.jpg', nodes: [
                { time: '上午', place: '宋城', note: '换身古装先逛园子' }, { time: '中午', place: '宋城小吃', note: '边逛边吃不耽误' },
                { time: '下午', place: '千古情演出', note: '这场是招牌，提前占位' }], footer: '看完演出顺路返程，收个高潮尾' }] }
          ]
        } },
      { t: 3900, gap_ms: 500, comp: 'tts', text: '不跟你整选择题了，路子我直接拍好了。三天我藏了三个钩子——西湖的日落、灵隐的安静、宋城的那场戏，一天一个高潮，越往后越上头。', pace: 'mid' },
      { t: 4400, gap_ms: 380, comp: 'tts', highlight: 's1', text: '落地这天别急着玩命，租辆车从断桥溜进苏堤。我给你算准了点——傍晚的光斜着压在湖面上，苏堤那排树一棵棵亮成金的，你慢慢蹬过去，整条堤就你一个人追着太阳走。这个时辰、这条堤，错过就得再等一天。', pace: 'mid' },
      { t: 4800, gap_ms: 380, comp: 'tts', highlight: 's2', text: '隔天我把你塞进灵隐的山里，城里那点吵一进去全没了。压轴是龙井村——这季正好新茶刚下来，山脚找个院子坐下喝一口，那个鲜，离了这片山你真喝不到。', pace: 'mid' },
      { t: 5200, gap_ms: 380, comp: 'tts', highlight: 's3', text: '压轴这天甩给宋城。换身古装先在园子里晃，下午那场千古情是真王炸——灯一暗水一塌，全场都跟着起鸡皮疙瘩。我特意把它压在最后，让你带着这股劲儿回家。', pace: 'mid' },
      { t: 5700, gap_ms: 800, comp: 'user_query', text: '第二天细说', drill_day: 'd2' },
      { t: 6000, gap_ms: 420, comp: 'tts', highlight: 'd2', text: '灵隐你得趁早，赶在大巴团进来之前——一早的香火气混着雾，先拜再慢慢逛，整座寺像是只开给你一个人。', pace: 'mid' },
      { t: 6350, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '中午去法喜寺那口素斋，连本地人都甘心排队的。一碗素面，看着素得很，吃一口你就懂为什么排了。', pace: 'mid' },
      { t: 6700, gap_ms: 340, comp: 'tts', highlight: 'd2', text: '下午钻飞来峰，崖壁上那些石窟造像几百年了还盯着你看，林子里又荫又凉。逛到腿软，傍晚拐进龙井村，新茶配夕阳，这天就稳稳落地了。', pace: 'mid' }
    ], annotations: []
  };
})(window);
