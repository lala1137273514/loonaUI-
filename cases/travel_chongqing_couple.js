/* 重庆三天 · 情侣（山城夜色）— TravelStages 完整链
   = 镜像 travel_chengdu_5d_2stage 骨架（无选方案）：①澄清确认(停等) → ②方案生成(阶段封面轮播)+逐阶段口播 → 钻取阶段1某天 → 返回总览 → 保存确认门。
   分 2 阶段：山城夜色·二人世界(洪崖洞夜景+长江索道) / 市井慢逛·烟火气(李子坝轻轨穿楼+磁器口)。情侣向：浪漫、机位、夜景、二人独处。
   图片仅用 cq_hongyadong/cq_cableway/cq_liziba/cq_ciqikou。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_chongqing_couple'] = {
    task_id: 'travel_chongqing_couple', title: '重庆3天 · 情侣（山城夜色）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排重庆三天情侣', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== 阶段① 澄清确认（停等，问住宿偏好，确认即开排） ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '重庆，3天，和对象' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 抽槽 + 推断',
        decision: '目的地+天数+同行已给(重庆/3天/情侣)→不开放提问，只确认住宿(江景 vs 商圈)，偏好按浪漫/夜景/二人独处推断。', fields: ['重庆/3天/情侣', 'infer:夜景/浪漫/二人'] },
      { t: 600, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clarify', wait_for_user: true,
        tts: { text: '好，重庆三天、俩人的浪漫局，我记下了。就一件事得你拍板——住江景还是住商圈？住江景，俩人推开窗就是两江夜色，我这边好把夜里的机位都给你串进去。', pace: 'mid' },
        content: { title: '重庆 · 3 天 · 情侣', question: '已知重庆、3 天、和对象；我按浪漫夜色来排，只想确认一件事：',
          slots: { required: [{ label: '目的地', value: '重庆' }, { label: '周期', value: '3 天' }, { label: '同行', value: '情侣' }], optional: ['夜景优先', '二人独处', '出片机位', '不爬太多坡'] },
          options: [{ label: '江景就好' }, { label: '住商圈' }, { label: '你看着定' }] } },
      { t: 0, gap_ms: 260, comp: 'user_query', text: '江景就好' },

      /* ===== 阶段② 方案生成 → 阶段封面轮播 + 逐阶段口播（无选方案，直接开排） ===== */
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 合槽 + 切段',
        decision: '江景情侣→夜景机位+二人独处优先；切 2 段体验：山城夜色·二人世界(洪崖洞/长江索道) / 市井慢逛·烟火气(李子坝/磁器口)。', fields: ['江景/情侣', '2段·按体验切'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在给俩人排个浪漫的山城三天…', state_visual: 'loading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1500, comp: 'TravelStages', card_id: 'plan', visual_state: 'active',
        content: { destination: '重庆', duration_days: 3, title: '重庆 · 3 天 · 山城夜色',
          stages: [
            { id: 's1', title: '山城夜色·二人世界', hook: '夜里的两江灯火，我替你俩挑了最出片的几个机位', photo: 'assets/travel/cq_hongyadong.jpg', tags: ['浪漫', '夜景', '索道'], days: [
              { id: 'd1', label: 'Day1 · 抵达即入夜色', pace: 'light', photo: 'assets/travel/cq_hongyadong.jpg', footer: '今晚不赶路，专门留给俩人看夜景', nodes: [
                { time: '下午', place: '入住江景房', note: '推开窗就是江，俩人先歇口气' },
                { time: '傍晚', place: '洪崖洞', note: '趁天还没全黑占好对岸机位，看千与千寻同款灯一盏盏亮起' },
                { time: '夜里', place: '千厮门大桥', note: '桥上吹江风，给对象拍张洪崖洞当背景的片子' },
                { time: '宵夜', place: '江边小馆', note: '一锅小火锅收尾，俩人慢慢涮' } ] } ] },
            { id: 's2', title: '市井慢逛·烟火气', hook: '白天钻进山城的巷子，轻轨穿楼、古镇喝茶，慢就对了', photo: 'assets/travel/cq_liziba.jpg', tags: ['轻松', '市井', '出片'], days: [
              { id: 'd2', label: 'Day2 · 长江索道+轻轨穿楼', pace: 'normal', photo: 'assets/travel/cq_cableway.jpg', footer: '今天靠交通工具看城，俩人不用爬太多坡', nodes: [
                { time: '上午', place: '长江索道', note: '坐缆车横跨长江，俩人挤一个窗看两江汇流' },
                { time: '中午', place: '南山火锅', note: '半山上吃顿地道牛油锅，麻得嘎嘣脆' },
                { time: '下午', place: '李子坝', note: '蹲点拍轻轨从楼里钻出来，等车那一下最出片' },
                { time: '傍晚', place: '南山一棵树', note: '观景台看全城华灯初上，留给俩人静一静' } ] },
              { id: 'd3', label: 'Day3 · 磁器口慢逛收尾', pace: 'light', photo: 'assets/travel/cq_ciqikou.jpg', footer: '最后一天不折腾，逛吃为主，离站近好返程', nodes: [
                { time: '上午', place: '磁器口古镇', note: '青石板慢慢走，陈麻花、酸辣粉一路尝' },
                { time: '中午', place: '古镇老茶馆', note: '俩人寻张靠江的桌，喝盖碗茶歇脚' },
                { time: '下午', place: '解放碑·八一路', note: '逛吃收尾，离车站近，拎着伴手礼上车' } ] } ] }
          ] } },
      /* TTS-2 三段式（情侣种草拉满）：beat 跟阶段封面轮播聚焦——夜色二人世界(s1) / 市井慢逛(s2) / 收尾引导钻取(不挪卡) */
      { t: 2500, gap_ms: 500, comp: 'tts', highlight: 's1', text: '这趟我最想给你俩留住的，是重庆入夜那股劲儿。头一晚啥也不安排，就守着洪崖洞——天没全黑我就让你先占好对岸的机位，灯一盏盏爬上来，整片崖壁亮成千与千寻里那座汤屋，俩人靠着栏杆吹江风，我替你挑的这个角度，给对象拍一张当背景，朋友圈能压一整年。', pace: 'mid' },
      { t: 3000, gap_ms: 420, comp: 'tts', highlight: 's2', text: '白天就慢下来钻巷子：坐长江索道横跨大江，俩人挤一个小窗看两江汇成一条，脚底下全是滚滚江水；再蹲一回李子坝，看轻轨“哐”一下从居民楼里钻出来，等车那一秒最出片。最后一天磁器口青石板上慢慢逛，陈麻花嘎嘣脆、酸辣粉辣到飙汗，不爬坡、不赶路，专门给你俩留着松。', pace: 'mid' },
      { t: 3400, gap_ms: 0, comp: 'tts', text: '光头一晚我就给你俩埋了三个夜景机位，还掐着天黑的点排好先去哪、几点占位——想看我咋给你俩安排这第一晚，说声“第一晚”，我一处一处讲给你听。', pace: 'mid' },

      /* ===== 钻取阶段1 第1天 → 返回总览 → 保存确认门 ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第一晚细说', drill_day: 'd1' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'd1', text: '头一晚的重头，全压在两江夜色上。下午先入住江景房，俩人推开窗就是江，洗个脸歇口气；傍晚趁天没全黑赶去洪崖洞，我让你提前占好对岸的机位——灯一亮，那叠了十几层的吊脚楼整片金黄，活脱脱汤屋，给对象拍片子这个角度别处偷不来。拍够了溜达上千厮门大桥，江风一吹，洪崖洞当背景再来一张。最后江边寻个小馆，俩人一锅小火锅慢慢涮，热乎乎收个尾——这一晚我就图你俩看够、拍够、贴够。', pace: 'mid' },
      { t: 0, gap_ms: 900, comp: 'user_query', text: '行，回到整体', travel_back: true },
      { t: 300, gap_ms: 500, comp: 'tts', text: '行，退回整趟看——三天就这么个节奏：头晚泡在夜色里，白天慢慢逛巷子，浪漫归浪漫，一点不累着你俩。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'confirm', card_id: 'save', wait_for_user: true,
        tts: { text: '都满意的话，我把这套山城浪漫三天给你俩存下来，到了照着走就行，重活交给我。', pace: 'mid' },
        content: { action: '保存到行程', target: '重庆 3 天 · 山城夜色', impact: '以后随时翻出来照着走', content_summary: '重庆·3天·情侣·江景夜景慢节奏', reversible: true, countdown: 20, confirm_label: '存下来', cancel_label: '先不用' } }
    ], annotations: []
  };
})(window);
