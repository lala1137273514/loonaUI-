/* 西安 4 天一个人 · 完整叙事短片（一口气讲完 · 图按亮点自动切）
   独行长安：澄清完直接输出，听完看完即走；TTS 一段连贯到底，不停等指令；
   图按"亮点"切（5 亮点=5 张），王牌(兵马俑)那段 TTS 最长最震撼 → 那张图自然停最久。片头 1 张定调，不计入 ●○○○○。
   双通道：屏=卡内满屏大图 + ≤8字 + tag ‖ 语音=连贯叙事主体。TTS 逐字照稿。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_xian_solo'] = {
    task_id: 'travel_xian_solo', title: '西安4天 · 一个人（独行长安）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '一个人玩西安4天', granularity: 'narrative', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '一个人去西安，4天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 一口气讲完',
        decision: '不平铺选项、不停等指令：澄清(一个人→节奏自己说了算、重历史人文)直接落到口播里，一条叙事从骑城墙讲到兵马俑压轴；图按 5 个亮点自动切，王牌(兵马俑)停最久。', fields: ['连贯叙事', '5亮点5图', '记忆:独行·自由节奏'] },

      /* 片头：定调（西安城墙氛围大图 + 主张，不计入亮点进度点） */
      { t: 600, gap_ms: 900, comp: 'MomentCard', card_id: 'cover',
        content: { photo: 'assets/travel/xa_citywall.jpg', title: '独行长安 · 4天', meta: ['4天3晚', '人均 ¥1500 出头'], tags: ['自由节奏', '一个人'] },
        tts: { text: '好，一个人去西安四天，我替你排好了——一个人最大的好是节奏全你说了算，想多待会儿就多待会儿，没人催你。我专挑了几个有厚度的地方，我陪你走一遍，你听完就知道，一个人也能走得特别尽兴。', pace: 'mid' } },

      /* ●○○○○ 亮点1 · 城墙骑行（破题·自由） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h1',
        content: { photo: 'assets/travel/xa_citywall.jpg', title: '城墙上骑车', meta: ['第1天下午', '门票¥54 · 租车¥45'], tags: ['自由风灌满', '十三朝起点'], dots: { i: 1, n: 5 } },
        tts: { text: '头一天别赶，直接上古城墙。这是全中国保存最完整的一圈城墙，你租一辆自行车，一个人骑上去绕一整圈，十三公里，左边是六百年的青砖垛口，右边是车水马龙的新西安。风灌满全身，没有同伴要等、要迁就，你想停哪儿拍就停哪儿——这种自由，一个人来才尝得到。', pace: 'mid' } },

      /* ●●○○○ 亮点2 · 大雁塔 / 大唐不夜城夜（夜景） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h2',
        content: { photo: 'assets/travel/xa_datang.jpg', title: '不夜城的夜', meta: ['第1晚', '免费'], tags: ['盛唐灯火', '一人看尽'], dots: { i: 2, n: 5 } },
        tts: { text: '天一黑，慢慢溜达到大雁塔脚下，大唐不夜城整条街的灯一齐亮起来，宫灯、飞檐、唐装姑娘走过，恍惚像一脚踩回了盛唐。大雁塔北广场的喷泉随着音乐冲起来，你一个人靠着栏杆看，不用顾着谁、不用说话，就静静地把这盛世灯火看个够，心里那叫一个敞亮。', pace: 'mid' } },

      /* ●●●○○ 亮点3 · 兵马俑（王牌·TTS 最长最震撼→图停最久） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h3',
        content: { photo: 'assets/travel/xa_terracotta.jpg', title: '兵马俑', meta: ['留一整天', '门票¥120'], tags: ['世界第八奇迹', '王牌'], dots: { i: 3, n: 5 } },
        tts: { text: '这趟最该震你一下的，是我给你空出整整一天的兵马俑，千万别来去匆匆。你走进一号坑那一刻，整个人会被钉在原地——几千个真人大小的陶俑，排成军阵从地底一路延伸到看不见的尽头，将军、弓弩手、战马，每一张脸都不一样，眉眼、胡须、铠甲的纹路全是两千两百年前一刀一刀刻出来的。你一个人安安静静站在那儿，没人在耳边讲话，那种从脚底升上来的肃穆和苍凉，会让你起一身鸡皮疙瘩。请个讲解或者租个耳机慢慢听，秦始皇怎么扫平六国、这支地下大军怎么沉睡千年又重见天日——你会觉得这一天，值回整趟西安。', pace: 'mid' } },

      /* ●●●●○ 亮点4 · 回民街吃（烟火·一个人也热闹） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h4',
        content: { photo: 'assets/travel/xa_huimin.jpg', title: '回民街扫街', meta: ['第3晚', '人均 ¥80'], tags: ['一个人放开吃', '烟火长安'], dots: { i: 4, n: 5 } },
        tts: { text: '逛累了就钻进回民街,这条街专治一个人吃饭——小份、随走随买,你不用迁就谁的口味,看见啥馋就来一份。泡馍自己掰、肉夹馍油汁直往下淌、烤肉滋滋冒烟、镜糕甜得软糯,一路走一路嗦,撑了就找家老店坐下歇脚。一个人扫街最爽,边吃边逛、想吃几样吃几样,这份自在,有伴儿还真给不了。', pace: 'mid' } },

      /* ●●●●● 亮点5 · 钟楼夜（收束·长安定格）+ 收尾导出口播 */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h5',
        content: { photo: 'assets/travel/xa_belltower.jpg', title: '钟楼的夜', meta: ['第4晚', '免费看'], tags: ['古城心脏', '收束定格'], dots: { i: 5, n: 5 } },
        tts: { text: '最后一晚,把自己交还给古城正中心的钟楼。夜里它金顶亮灯,四条老街车流绕着它转,你一个人站在天桥上,慢慢把这座城从黄昏看到夜深。四天下来,城墙骑过、灯火看过、地下大军见过、街边的香也尝够了——一个人走完整座长安,你会发现你比想的更能享受这份独处。想要每天具体怎么走、哪家店叫啥、车怎么坐,我整理好发你手机。', pace: 'mid' } }
    ], annotations: []
  };
})(window);
