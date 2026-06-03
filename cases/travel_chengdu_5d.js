/* 成都五日游 · 三阶段完整跑一遍（澄清 → 方案生成 → 展示/钻取）
   demo 的眼 = 三层 TTS 力度：TTS-1(选方案·推主选给理由) / TTS-2(整趟轮播·串三段安利) / TTS-3(钻某天·4拍喷王牌亮点)。
   屏幕卡片复用：澄清确认=ClarifyCard · 方案选择=InspoFlow(首张 rec 主推) · 体验段落轮播=TravelStages(按体验切3段含多天) · 单天详情=trip 详情卡。
   「带爸妈」澄清补充一路串到 不爬高/留歇脚/不排太满。照片暂复用 assets/travel/*（占位）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_chengdu_5d'] = {
    task_id: 'travel_chengdu_5d', title: '成都五日游 · 三阶段', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排成都五天', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== 阶段① 澄清 ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '去成都玩五天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 抽槽 + 推断',
        decision: '目的地+天数已给(成都/5天)→不开放提问，只确认推断偏好(爱吃/慢节奏/不爱赶路)。', fields: ['成都/5天', 'infer:美食/慢/不赶'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '成都五天，我先按你爱吃、不爱赶路来安排——市区先吃透，再带你逛一天周边。要是想多看点山水风景，跟我说一声就改。', pace: 'mid' },
        content: { title: '成都 · 5 天', question: '已知成都、5 天；我猜你想要这些，对就直接开排：',
          slots: { required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '5 天' }], optional: ['美食优先', '慢节奏', '市区+周边', '不爱赶路'] },
          options: [{ label: '对' }, { label: '想多看自然' }, { label: '带爸妈' }] } },
      { t: 0, gap_ms: 260, comp: 'user_query', text: '对，带我爸妈' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 收偏好',
        decision: '补充 带爸妈 → 不爬高、留歇脚、不排太满；给 2-3 套方案、首张主推巴适美食。', fields: ['带爸妈', '不爬高/留歇脚'] },

      /* ===== 阶段① 方案选择卡（横滑·首张主推） ===== */
      { t: 700, gap_ms: 1400, comp: 'InspoFlow', card_id: 'plans', visual_state: 'active',
        content: { echo: '成都 5 天 · 选个路线', cards: [
          { id: 'p1', rec: true, title: '巴适美食 5 日', photo: 'assets/travel/bund.jpg', tags: ['带爸妈优选', '苍蝇馆子', '茶馆', '慢'], punchline: '带爸妈最巴适：节奏慢、不爬高、吃得开心' },
          { id: 'p2', title: '经典打卡 5 日', photo: 'assets/travel/westbund.jpg', tags: ['初游友好', '宽窄巷子', '武侯祠', '熊猫'], punchline: '第一次来成都必看的都在这条' },
          { id: 'p3', title: '古镇自然 5 日', photo: 'assets/travel/tianzifang.jpg', tags: ['人少清净', '都江堰', '青城山'], punchline: '想清净往山水走，人少不挤' }
        ] } },
      /* TTS-1b 拆成按卡高亮的几句 → 方案选择卡跟着轮播逐张聚焦（p1→p2→p3→回 p1） */
      { t: 2100, gap_ms: 500, comp: 'tts', highlight: 'p1', text: '带爸妈我最推第一个，巴适美食路线。成都的魂不在景点，在茶馆和苍蝇馆子里——节奏慢、不爬高，爸妈坐得住还吃得开心。', pace: 'mid' },
      { t: 2600, gap_ms: 420, comp: 'tts', highlight: 'p2', text: '第二个偏经典打卡，宽窄、武侯祠、锦里、熊猫一条串下来，头回来成都的人适合。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 'p3', text: '第三个想清净，就往青城山、都江堰走，人少不挤。', pace: 'mid' },
      { t: 3400, gap_ms: 400, comp: 'tts', highlight: 'p1', text: '要不就第一个，我直接给你排明白？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '就第一个' },

      /* ===== 阶段② 方案生成 → 体验段落轮播（按体验切 3 段，不是 Day1/2/3） ===== */
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 切段',
        decision: '巴适美食 5 日切 3 段体验：市井烟火(头两天)/茶馆慢生活(第3天)/周边透气(后两天)。', fields: ['3 段', '按体验切'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在给爸妈排成都五天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: { destination: '成都', duration_days: 5, title: '成都 · 5 天 · 巴适美食',
          stages: [
            { id: 's1', title: '市井烟火', hook: '玉林路那几家是本地人排队的，不是网红店', photo: 'assets/travel/bund.jpg', tags: ['苍蝇馆子', '串串', '太古里'], days: [
              { id: 'd1', label: '市井烟火 · 第1天', pace: 'light', photo: 'assets/travel/bund.jpg', nodes: [
                { time: '上午', place: '宽窄巷子', note: '逛老院子，看糖画变脸' }, { time: '中午', place: '钟水饺', note: '本地老字号垫一口' },
                { time: '下午', place: '锦里', note: '慢慢逛' }, { time: '晚上', place: '玉林路', note: '苍蝇馆子串串，陪二老喝点小酒' }], footer: '玉林路越晚越热闹，留肚子' },
              { id: 'd2', label: '市井烟火 · 第2天', pace: 'light', photo: 'assets/travel/westbund.jpg', nodes: [
                { time: '上午', place: '东郊记忆', note: '老厂区改的文创，慢逛' }, { time: '中午', place: '马旺子', note: '川菜小馆，爸妈合口' },
                { time: '下午', place: '太古里·大慈寺', note: '潮区里藏个千年古寺' }, { time: '晚上', place: '香香巷', note: '巷子美食一条街' }], footer: '今天不赶，逛吃为主' }
            ] },
            { id: 's2', title: '茶馆慢生活', hook: '这是最成都的一天，专门留来歇', photo: 'assets/travel/tianzifang.jpg', tags: ['人民公园', '盖碗茶', '掏耳朵'], days: [
              { id: 'd3', label: '茶馆慢生活 · 第3天', pace: 'light', photo: 'assets/travel/tianzifang.jpg', nodes: [
                { time: '上午', place: '鹤鸣茶社', note: '竹椅坐下，盖碗茶慢喝' }, { time: '中午', place: '公园边小吃', note: '就近随便吃' },
                { time: '下午', place: '掏耳朵晒太阳', note: '师傅掏个耳，酥麻到笑' }, { time: '晚上', place: '锦里', note: '夜里灯笼一条街' }], footer: '专门留一整天慢下来，别排满' }
            ] },
            { id: 's3', title: '周边透气', hook: '带爸妈往周边走，不累还出片', photo: 'assets/travel/bund.jpg', tags: ['都江堰', '大熊猫', '不累'], days: [
              { id: 'd4', label: '周边透气 · 第4天', pace: 'normal', photo: 'assets/travel/bund.jpg', nodes: [
                { time: '上午', place: '都江堰', note: '看千年的水，平路好走' }, { time: '中午', place: '灌县古城', note: '古城里吃顿便饭' },
                { time: '下午', place: '南桥', note: '桥上吹风看水' }, { time: '晚上', place: '返市区', note: '回城歇脚' }], footer: '都江堰平路为主，不爬高' },
              { id: 'd5', label: '周边透气 · 第5天', pace: 'light', photo: 'assets/travel/westbund.jpg', nodes: [
                { time: '上午', place: '大熊猫基地', note: '趁早看滚滚合个影' }, { time: '中午', place: '基地周边', note: '简餐' },
                { time: '下午', place: '春熙路太古里', note: '逛吃收尾，离车站近' }], footer: '熊猫趁早，下午轻松收尾返程' }
            ] }
          ] } },
      /* TTS-2 四段式（种草拉满）：beat 跟着段落轮播聚焦——采耳=茶馆(s2) / 吃=市井(s1) / 周边(s3) / 收尾引导钻取(不挪卡) */
      { t: 2500, gap_ms: 500, comp: 'tts', highlight: 's2', text: '这趟我最想让你爸妈尝的，是成都那股巴适劲儿——挑个有太阳的下午，泡进人民公园的竹椅里，喝盖碗茶、嗑瓜子，让师傅拿那根长铜钎给你采个耳，酥麻得人直眯眼、能笑出声。周围全是摆龙门阵的本地大爷，那股松弛别的城市真学不来，我特意搁在中间一天，让你们走累了彻底松一下。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 's1', text: '吃就更不用操心，玉林路那几家苍蝇馆子是我翻出来本地人排队的、不是网红店，傍晚越坐越热闹，陪二老点几个家常菜、喝口小酒，巴适得很。', pace: 'mid' },
      { t: 3400, gap_ms: 420, comp: 'tts', highlight: 's3', text: '逛够了市区，后头带他们往周边透气——都江堰看看两千年还在淌的水，熊猫基地撞上滚滚啃竹子，不爬高、不赶路，随手一拍都好看。', pace: 'mid' },
      { t: 3800, gap_ms: 0, comp: 'tts', text: '光第一天我就给你塞了三个地道去处，还掐着点排好了先去哪、晌午在哪歇脚——想看我咋给爸妈安排的，说声“第一天”，我一处一处讲给你听。', pace: 'mid' },

      /* ===== 阶段③ 展示 / 钻取（钻进段1 第1天） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第一天怎么安排', drill_day: 'd1' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'd1', text: '头一天先带爸妈把成都的烟火气吃进肚——重头在晚上的玉林路。天一黑，那几家苍蝇馆子就坐满本地人，陪二老点一桌家常、烫几样串串、开两瓶冰啤，越坐越闹热，那股市井劲儿比啥大餐都安逸。白天不赶：上午宽窄巷子转老院子、看糖画变脸，中午钟水饺垫一口，下午锦里慢慢逛。', pace: 'mid' },

      /* 链路加长：接着钻其余天（同段切=滑动、跨段=翻转）+ 返回总览 + 末尾保存确认门 */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第二天呢', drill_day: 'd2' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'd2', text: '这天接着逛吃，王牌是太古里里头藏的大慈寺——千年古寺的红墙挨着一线潮牌店，香火味混着咖啡香，这反差全成都最出片，给爸妈拍照绝了。上午先去东郊记忆，老厂房改的文艺街区慢逛不累；晚上钻香香巷，钵钵鸡、蛋烘糕一条街扫过去，当宵夜正好。', pace: 'mid' },
      { t: 0, gap_ms: 900, comp: 'user_query', text: '茶馆那天看看', drill_day: 'd3' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'd3', text: '这一天是我整趟最想让你爸妈过的——啥也不安排，专门留来歇。下午钻进人民公园的鹤鸣茶社，挑张竹椅往树荫下一坐，几块钱续一下午盖碗茶，嗑着瓜子看一园子老茶客摆龙门阵。重头是采耳：师傅那套长铜钎、小刷子、音叉，在耳朵里轻轻一颤，酥麻得人直眯眼、忍不住笑出声，这手艺别的城市真偷不走，爸妈准念叨一路。晌午就近吃顿家常，傍晚茶喝舒坦了，溜达去锦里看红灯笼一盏盏亮起来——这天就图一个不赶不慌。', pace: 'mid' },
      { t: 0, gap_ms: 900, comp: 'user_query', text: '周边那两天怎么走', drill_day: 'd4' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'd4', text: '周边这两天带爸妈彻底放松。头一天去都江堰，看两千年还在哗哗淌的岷江水，全程平路、一级台阶都不用爬，逛累了钻灌县古城吃顿便饭、南桥上吹吹风就回。隔天压轴交给熊猫基地，赶早去最闹热，正撞上滚滚抱着竹子啃、从树坡上骨碌下来，胖墩墩的样子爸妈能看一上午，这趟下来准说没白来。', pace: 'mid' },
      { t: 0, gap_ms: 900, comp: 'user_query', text: '行，回到整体', travel_back: true },
      { t: 300, gap_ms: 500, comp: 'tts', text: '行，退回整趟看——五天就这么个节奏，慢、好吃、不累。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'confirm', card_id: 'save', wait_for_user: true,
        tts: { text: '都满意的话，我把这套巴适五日给你存下来，以后随时翻出来照着走。', pace: 'mid' },
        content: { action: '保存到行程', target: '成都 5 天 · 巴适美食', impact: '以后随时翻出来照着走', content_summary: '成都·5天·带爸妈·美食慢节奏', reversible: true, confirm_label: '存下来', cancel_label: '先不用' } }
    ], annotations: []
  };
})(window);
