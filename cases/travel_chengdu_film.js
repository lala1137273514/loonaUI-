/* 成都 5 天带爸妈 · 完整叙事短片（一口气讲完 · 图按亮点自动切）
   与 travel_chengdu_story 的区别：无交互——澄清完直接输出，听完看完即走；TTS 一段连贯到底，不停等指令；
   图按"亮点"切（5 亮点=5 张），王牌(采耳)那段 TTS 最长 → 那张图自然停最久。片头 1 张定调，不计入 ●○○○○。
   双通道：屏=卡内满屏大图 + ≤8字 + tag ‖ 语音=连贯叙事主体。照片暂复用 assets/travel/*（上海实景占位）。TTS 逐字照稿。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_chengdu_film'] = {
    task_id: 'travel_chengdu_film', title: '成都5天 · 完整叙事短片（一口气看完）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '带爸妈玩成都5天', granularity: 'narrative', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '成都5天，带爸妈' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 一口气讲完',
        decision: '不平铺选项、不停等指令：澄清(妈腿脚不好→全程不爬山)直接落到口播里，一条叙事从落地讲到压轴；图按 5 个亮点自动切，王牌(采耳)停最久。', fields: ['连贯叙事', '5亮点5图', '记忆:不爬山'] },

      /* 片头：定调（成都氛围大图 + 主张，不计入亮点进度点） */
      { t: 600, gap_ms: 900, comp: 'MomentCard', card_id: 'cover',
        content: { photo: 'assets/travel/tianzifang.jpg', title: '巴适慢成都 · 5天', meta: ['5天4晚', '人均 ¥2k 出头'], tags: ['不爬山', '带爸妈'] },
        tts: { text: '成都这五天，带叔叔阿姨我给你排得稳稳的——你说过你妈腿脚不好，我全程没安排一段爬山。你听我讲一遍就知道有多巴适。', pace: 'mid' } },

      /* ●○○○○ 亮点1 · 玉林路夜（市井） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h1',
        content: { photo: 'assets/travel/bund.jpg', title: '玉林路的夜', meta: ['第1晚', '人均 ¥60'], tags: ['市井烟火', '苍蝇馆串串'], dots: { i: 1, n: 5 } },
        tts: { text: '落地头一晚别急着歇，我带你们直奔玉林路，天一黑，那几家苍蝇馆子招牌灯一亮、油锅滋啦响，陪老爸开两瓶冰啤、烫一桌串串，那股市井热闹劲儿，比啥接风宴都安逸。', pace: 'mid' } },

      /* ●●○○○ 亮点2 · 大慈寺（反差·最出片） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h2',
        content: { photo: 'assets/travel/westbund.jpg', title: '转角大慈寺', meta: ['第2天上午', '门票免费'], tags: ['红墙挨潮牌', '最出片'], dots: { i: 2, n: 5 } },
        tts: { text: '吃饱睡足，隔天慢慢逛到太古里，转角你会撞见一座千年的大慈寺——红墙金瓦就挨着一线潮牌店，香火味混着咖啡香，这反差全成都最出片，给二老在这儿拍张照绝了。', pace: 'mid' } },

      /* ●●●○○ 亮点3 · 鹤鸣茶社采耳（王牌·TTS 最长→图停最久） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h3',
        content: { photo: 'assets/travel/tianzifang.jpg', title: '鹤鸣茶社', meta: ['留整下午', '盖碗茶¥15 · 采耳¥50'], tags: ['采耳·偷不走', '王牌'], dots: { i: 3, n: 5 } },
        tts: { text: '不过这趟最安逸的，是我专门给你空出来的某个下午，啥也不安排。你陪爸妈泡进人民公园的鹤鸣茶社，竹椅往树荫下一靠，几块钱盖碗茶续一下午，嗑着瓜子看一园子老茶客摆龙门阵。最绝的是采耳：师傅那根长铜钎在耳朵里轻轻一颤，酥麻得人直眯眼、忍不住笑出声——这手艺别的城市真偷不走，你妈准念叨一路。', pace: 'mid' } },

      /* ●●●●○ 亮点4 · 都江堰（平路不爬山） */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h4',
        content: { photo: 'assets/travel/westbund.jpg', title: '都江堰的水', meta: ['第4天', '门票 ¥80'], tags: ['平路不爬山', '两千年活水'], dots: { i: 4, n: 5 } },
        tts: { text: '歇够了再带他们出城透口气，都江堰那两千年还在哗哗淌的水，看着就解乏，全程平路、一级台阶都不用爬，逛累了钻进灌县古城吃顿家常、南桥上吹吹风就回。', pace: 'mid' } },

      /* ●●●●● 亮点5 · 熊猫滚滚（压轴）+ 收尾导出口播 */
      { t: 0, gap_ms: 180, comp: 'MomentCard', card_id: 'h5',
        content: { photo: 'assets/travel/bund.jpg', title: '压轴看熊猫', meta: ['趁早·半天', '门票 ¥55'], tags: ['滚滚·赶早最闹', '压轴'], dots: { i: 5, n: 5 } },
        tts: { text: '压轴当然留给熊猫，赶大早去最闹热，正撞上滚滚们抱着竹子啃、从树坡上骨碌下来，胖墩墩的样子，你妈能站那儿看一上午。五天吃好、喝好、看够，回去准还念叨。想要每天具体怎么走、哪家店叫啥，我整理好发你手机。', pace: 'mid' } }
    ], annotations: []
  };
})(window);
