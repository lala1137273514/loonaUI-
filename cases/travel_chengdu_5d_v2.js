/* 成都五日游 v2 · 按老板 5 条评论重做（澄清→选方案→主动连讲→不满意当场改→出结果）
   对齐评论：
     #3  理解卡 = ClarifyCard 双卡(confirmed 已知 + ask 我猜的高亮)，无 options 按钮、无灰字、不填表
     #18 口播全程「像人」(语气词/态度/长短句)，详略分明：王牌(茶馆采耳)讲透、过渡天一句带过
     #19+#21 主动连讲：tts 自带 drill_day 逐天推进，不靠用户挨个问（引擎已支持 tts 驱动 drill）
     #29 收尾出结果：travel_back 回完整总览 + 「已保存」回执，不弹订房确认门
     总评 不需要UI一句话问：澄清/收尾都靠语音，不出多余按钮卡 ‖ 新增「用户不满意→当场改第2天」情景
   屏幕给全貌、口播挑重点，口播不复述卡上能看到的内容。照片复用 assets/travel/*（占位）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_chengdu_5d_v2'] = {
    task_id: 'travel_chengdu_5d_v2', title: '成都5天 v2 · 主动连讲（少UI/像人/会改）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排成都五天', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== 阶段① 接需求 + 轻澄清（少 UI） ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '去成都玩五天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 抽槽 + 推断',
        decision: '目的地+天数已给(成都/5天)→不开放提问、不弹选项；只把推断的偏好(爱吃/慢/不赶)摆出来让用户一句话确认。', fields: ['成都/5天', 'infer:美食/慢/不赶'] },
      /* #3 理解卡：confirmed=已知(低调)，ask=我猜的(高亮、无按钮)。删灰字、不填表、双卡分离 */
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'understand', wait_for_user: true,
        tts: { text: '成都五天，我先按你爱吃、节奏慢、不赶路来排——市区先吃透，留一天带你去周边。想多看山水风景，跟我说一声就改。', pace: 'mid' },
        content: { title: '成都 · 5 天',
          confirmed: [{ label: '目的地', value: '成都' }, { label: '周期', value: '5 天' }],
          ask: { label: '我先按这些给你排', question: '重吃 · 苍蝇馆子　｜　慢节奏 · 不赶路　｜　市区为主 + 一天周边' } } },
      { t: 0, gap_ms: 260, comp: 'user_query', text: '对，带我爸妈' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 收偏好',
        decision: '补充 带爸妈 → 不爬高、留歇脚、不排太满；给 3 套方案、首张主推巴适美食。', fields: ['带爸妈', '不爬高/留歇脚'] },

      /* ===== 阶段② 选方案（大图轮播 · 首张主推） ===== */
      { t: 700, gap_ms: 1400, comp: 'InspoFlow', card_id: 'plans', visual_state: 'active',
        content: { echo: '成都 5 天 · 选个路线', cards: [
          { id: 'p1', rec: true, title: '巴适美食 5 日', photo: 'assets/travel/cd_jinli.jpg', tags: ['带爸妈优选', '苍蝇馆子', '茶馆', '慢'], punchline: '节奏慢、不爬高、吃得开心' },
          { id: 'p2', title: '经典打卡 5 日', photo: 'assets/travel/cd_kuanzhai.jpg', tags: ['初游友好', '宽窄巷子', '武侯祠', '熊猫'], punchline: '第一次来成都必看的都在这条' },
          { id: 'p3', title: '古镇自然 5 日', photo: 'assets/travel/cd_dujiangyan.jpg', tags: ['人少清净', '都江堰', '青城山'], punchline: '想清净往山水走，人少不挤' }
        ] } },
      /* 口播逐张安利（像人 · 有态度 · 主推第一个），图跟着 p1→p2→p3→回 p1 聚焦 */
      { t: 2100, gap_ms: 500, comp: 'tts', highlight: 'p1', text: '带爸妈的话——我最想推第一个。你别看成都满大街都是景点，真正巴适的不是那些，是泡茶馆、钻小馆子那个味儿。慢悠悠的，不用爬高爬低，叔叔阿姨待着舒坦，吃也吃得开心，我觉得这个最合你们。', pace: 'mid' },
      { t: 2600, gap_ms: 420, comp: 'tts', highlight: 'p2', text: '第二个是经典打卡那套，宽窄巷子、武侯祠、看熊猫，热门的都串上了。头回来成都挺合适——不过带着爸妈，我觉得稍微有点赶。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 'p3', text: '第三个图个清静，青城山、都江堰那边，人少不挤，就是得往远跑跑。', pace: 'mid' },
      { t: 3400, gap_ms: 400, comp: 'tts', highlight: 'p1', text: '绕一圈，我还是觉得第一个最对路。要不就它，我直接给你排明白？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '就第一个' },

      /* ===== 阶段③ 出整趟总览（体验段落大图轮播 · 按体验切 3 段，不按 Day） ===== */
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 切段',
        decision: '巴适美食 5 日切 3 段体验：市井烟火(头两天)/茶馆慢生活(第3天)/周边透气(后两天)。', fields: ['3 段', '按体验切'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在给爸妈排成都五天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: { destination: '成都', duration_days: 5, title: '成都 · 5 天 · 巴适美食',
          stages: [
            { id: 's1', title: '市井烟火', hook: '玉林路那几家是本地人排队的，不是网红店', photo: 'assets/travel/cd_jinli.jpg', tags: ['苍蝇馆子', '串串', '太古里'], days: [
              { id: 'd1', label: '市井烟火 · 第1天', pace: 'light', photo: 'assets/travel/cd_jinli.jpg', nodes: [
                { time: '上午', place: '宽窄巷子', note: '逛老院子，看糖画变脸' }, { time: '中午', place: '钟水饺', note: '本地老字号垫一口' },
                { time: '下午', place: '锦里', note: '慢慢逛' }, { time: '晚上', place: '玉林路', note: '苍蝇馆子串串，陪二老喝点小酒' }], footer: '玉林路越晚越热闹，留肚子' },
              { id: 'd2', label: '市井烟火 · 第2天', pace: 'light', photo: 'assets/travel/cd_taikoo.jpg', nodes: [
                { time: '上午', place: '东郊记忆', note: '老厂区改的文创，慢逛' }, { time: '中午', place: '马旺子', note: '川菜小馆，爸妈合口' },
                { time: '下午', place: '太古里·大慈寺', note: '潮区里藏个千年古寺' }, { time: '晚上', place: '香香巷', note: '巷子美食一条街' }], footer: '今天不赶，逛吃为主' }
            ] },
            { id: 's2', title: '茶馆慢生活', hook: '这是最成都的一天，专门留来歇', photo: 'assets/travel/cd_teahouse.jpg', tags: ['人民公园', '盖碗茶', '掏耳朵'], days: [
              { id: 'd3', label: '茶馆慢生活 · 第3天', pace: 'light', photo: 'assets/travel/cd_teahouse.jpg', nodes: [
                { time: '上午', place: '鹤鸣茶社', note: '竹椅坐下，盖碗茶慢喝' }, { time: '中午', place: '公园边小吃', note: '就近随便吃' },
                { time: '下午', place: '掏耳朵晒太阳', note: '师傅掏个耳，酥麻到笑' }, { time: '晚上', place: '锦里', note: '夜里灯笼一条街' }], footer: '专门留一整天慢下来，别排满' }
            ] },
            { id: 's3', title: '周边透气', hook: '带爸妈往周边走，不累还出片', photo: 'assets/travel/cd_dujiangyan.jpg', tags: ['都江堰', '大熊猫', '不累'], days: [
              { id: 'd4', label: '周边透气 · 第4天', pace: 'normal', photo: 'assets/travel/cd_dujiangyan.jpg', nodes: [
                { time: '上午', place: '都江堰', note: '看千年的水，平路好走' }, { time: '中午', place: '灌县古城', note: '古城里吃顿便饭' },
                { time: '下午', place: '南桥', note: '桥上吹风看水' }, { time: '晚上', place: '返市区', note: '回城歇脚' }], footer: '都江堰平路为主，不爬高' },
              { id: 'd5', label: '周边透气 · 第5天', pace: 'light', photo: 'assets/travel/cd_panda.jpg', nodes: [
                { time: '上午', place: '大熊猫基地', note: '趁早看滚滚合个影' }, { time: '中午', place: '基地周边', note: '简餐' },
                { time: '下午', place: '春熙路太古里', note: '逛吃收尾，离车站近' }], footer: '熊猫趁早，下午轻松收尾返程' }
            ] }
          ] } },
      /* 串三段安利（像人·只点轮廓，不展开）：总览这里就一句句串过去定基调，惊喜留给逐天 #21 引爆，避免两头种草 */
      { t: 2500, gap_ms: 500, comp: 'tts', highlight: 's2', text: '我把三段给你串一下：中间这天最成都，专门留来泡茶馆、晒太阳，啥正经景点都不排。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 's1', text: '头两天就在市区吃吃逛逛，玉林路、太古里这些。', pace: 'mid' },
      { t: 3400, gap_ms: 420, comp: 'tts', highlight: 's3', text: '后两天带爸妈去周边透气，都江堰、熊猫基地，不累。', pace: 'mid' },
      /* #18 过渡 = 主动带（不再「说声第一天」），一句话含主动逐天 + 打断口子，给后面不满意分支埋伏笔 */
      { t: 3800, gap_ms: 600, comp: 'tts', text: '框架就这样，我直接一天天带你走，哪天不对随时喊停。', pace: 'mid' },

      /* ===== 阶段④ 主动连讲逐天（tts 自带 drill_day · Loona 自己往下推） ===== */
      { t: 0, gap_ms: 900, comp: 'tts', drill_day: 'd1', text: '头一天我不让你们赶，白天宽窄巷子、锦里随便逛逛。重头在晚上玉林路——苍蝇馆子坐满本地人，陪二老烫几样串串、开两瓶冰啤，越坐越闹热，比大餐还安逸。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'tts', drill_day: 'd2', text: '来，第二天接着说。白天逛东郊记忆，王牌是太古里藏的那座大慈寺，千年红墙挨着潮牌店，全成都最出片；晚上香香巷扫个宵夜。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'tts', drill_day: 'd3', text: '第三天，就是我跟你吹了半天那个茶馆天——我故意一个景点都没排。下午整个人泡死在鹤鸣茶社的竹椅上，盖碗茶几块钱续一下午，师傅拎着铜壶满场转，谁水浅了远远一扬手就给冲满。最绝是采耳，那根长铜钎在耳朵里轻轻一转，酥麻得人直眯眼、能笑出声，旁边全是摆龙门阵的大爷，那松弛劲儿别处真学不来。等茶喝透天也黑了，溜达去锦里看红灯笼——这天要的就是不赶不慌。', pace: 'mid' },

      /* ===== 阶段⑤ 用户不满意 → 当场改第2天（新增情景：先认 → 重排 → 换更对的方向） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '等下——第二天东郊记忆、太古里那些，是不是太年轻了？我爸妈估计无感。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 接负反馈',
        decision: '不辩解、不维护原案；锁定「第2天偏年轻态」→ 往长辈共鸣换(武侯祠/三国/川剧变脸)，只动白天两档、晚上保留。', fields: ['认负反馈', '第2天→长辈向'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '第二天给你重排…', state_visual: 'loading', dismiss_on: 'card' },
      /* 重发 TravelStages：d2 改成武侯祠+川剧变脸版（其余天不变），引擎重渲轮播即为「改好的整趟」 */
      { t: 1000, gap_ms: 900, comp: 'TravelStages', card_id: 'plan2', visual_state: 'active',
        content: { destination: '成都', duration_days: 5, title: '成都 · 5 天 · 巴适美食（已调整）',
          stages: [
            { id: 's1', title: '市井烟火', hook: '玉林路那几家是本地人排队的，不是网红店', photo: 'assets/travel/cd_jinli.jpg', tags: ['苍蝇馆子', '串串', '川剧变脸'], days: [
              { id: 'd1', label: '市井烟火 · 第1天', pace: 'light', photo: 'assets/travel/cd_jinli.jpg', nodes: [
                { time: '上午', place: '宽窄巷子', note: '逛老院子，看糖画变脸' }, { time: '中午', place: '钟水饺', note: '本地老字号垫一口' },
                { time: '下午', place: '锦里', note: '慢慢逛' }, { time: '晚上', place: '玉林路', note: '苍蝇馆子串串，陪二老喝点小酒' }], footer: '玉林路越晚越热闹，留肚子' },
              { id: 'd2', label: '市井烟火 · 第2天（已调整）', pace: 'light', photo: 'assets/travel/cd_kuanzhai.jpg', nodes: [
                { time: '上午', place: '武侯祠', note: '看三国，老故事爸妈有共鸣' }, { time: '中午', place: '川菜小馆', note: '合口家常' },
                { time: '下午', place: '锦里·川剧变脸', note: '茶座看变脸，锣鼓一响准来劲' }, { time: '晚上', place: '香香巷', note: '宵夜一条街，不变' }], footer: '换成长辈向：三国 + 川剧变脸' }
            ] },
            { id: 's2', title: '茶馆慢生活', hook: '这是最成都的一天，专门留来歇', photo: 'assets/travel/cd_teahouse.jpg', tags: ['人民公园', '盖碗茶', '掏耳朵'], days: [
              { id: 'd3', label: '茶馆慢生活 · 第3天', pace: 'light', photo: 'assets/travel/cd_teahouse.jpg', nodes: [
                { time: '上午', place: '鹤鸣茶社', note: '竹椅坐下，盖碗茶慢喝' }, { time: '中午', place: '公园边小吃', note: '就近随便吃' },
                { time: '下午', place: '掏耳朵晒太阳', note: '师傅掏个耳，酥麻到笑' }, { time: '晚上', place: '锦里', note: '夜里灯笼一条街' }], footer: '专门留一整天慢下来，别排满' }
            ] },
            { id: 's3', title: '周边透气', hook: '带爸妈往周边走，不累还出片', photo: 'assets/travel/cd_dujiangyan.jpg', tags: ['都江堰', '大熊猫', '不累'], days: [
              { id: 'd4', label: '周边透气 · 第4天', pace: 'normal', photo: 'assets/travel/cd_dujiangyan.jpg', nodes: [
                { time: '上午', place: '都江堰', note: '看千年的水，平路好走' }, { time: '中午', place: '灌县古城', note: '古城里吃顿便饭' },
                { time: '下午', place: '南桥', note: '桥上吹风看水' }, { time: '晚上', place: '返市区', note: '回城歇脚' }], footer: '都江堰平路为主，不爬高' },
              { id: 'd5', label: '周边透气 · 第5天', pace: 'light', photo: 'assets/travel/cd_panda.jpg', nodes: [
                { time: '上午', place: '大熊猫基地', note: '趁早看滚滚合个影' }, { time: '中午', place: '基地周边', note: '简餐' },
                { time: '下午', place: '春熙路太古里', note: '逛吃收尾，离车站近' }], footer: '熊猫趁早，下午轻松收尾返程' }
            ] }
          ] } },
      /* 钻进改后的第2天 + 认错口播（屏幕已显武侯祠版，口播只说「认 + 换成啥 + 一个钩子」，不复述每档） */
      { t: 0, gap_ms: 700, comp: 'tts', drill_day: 'd2', text: '嗯，你说得对，那片儿是偏年轻了。第二天给你换成武侯祠加川剧变脸——锣鼓一响、脸说变就变，爸妈准来劲。', pace: 'mid' },
      /* 改完不卡住，主动接周边收尾（略讲，前面已 sell 过） */
      { t: 0, gap_ms: 900, comp: 'tts', drill_day: 'd4', text: '行，改好了。最后两天带他们往周边透气——第四天都江堰看两千年的水，全程平路不爬高；第五天压轴熊猫基地，赶早去正撞上滚滚啃竹子，爸妈能看一上午。下午春熙路收尾，离车站近，直接返程。', pace: 'mid' },

      /* ===== 阶段⑥ 收尾出结果（回完整总览 + 已保存，不弹订房确认门） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '行，就这么定', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'toast', text: '已保存', state: 'done', dismiss_on: 'card' },
      { t: 600, gap_ms: 500, comp: 'tts', text: '好，五天就这么定了，整套给你存下来了，随时翻出来照着走。带爸妈这趟，慢点、好吃、不累——玩得开心，回来跟我讲讲哈。', pace: 'mid' }
    ], annotations: []
  };
})(window);
