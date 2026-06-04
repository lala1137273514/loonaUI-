/* 成都 5 天带爸妈 · 叙事流（Loona 讲你听）
   ①拿主意(不给3选项·直接拍1主方案+1备选) → ②叙事流主线(一图一刻满屏大图·跟着语音换·挑高光时刻串讲·末尾埋钩子) → ③钻取一刻(完整一天) → ④收尾导出。
   双通道：屏=一张满屏大图+≤8字 ‖ 语音=叙事主体。贯穿：记忆彩蛋·情绪·悬念钩子。TTS 逐字照稿。照片暂复用 assets/travel/*。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_chengdu_story'] = {
    task_id: 'travel_chengdu_story', title: '叙事流钻取 · 成都5天（讲你听）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '带爸妈玩成都5天', granularity: 'narrative', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '成都5天，带爸妈' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 拿主意',
        decision: '不平铺 3 选项：直接拍 1 主方案「巴适慢成都」+ 留 1 备选(青城山)；记忆彩蛋=妈腿脚不好→全程不爬山。', fields: ['拍1+备选', '记忆:不爬山'] },

      /* ① 拿主意：成都氛围大图 + ≤8字主张 + 克制 tag（不给选择题） */
      { t: 600, gap_ms: 1200, comp: 'MomentCard', card_id: 'propose',
        content: { photo: 'assets/travel/tianzifang.jpg', title: '巴适慢成都 · 5天', meta: ['5天4晚', '人均 ¥2k 出头'], tags: ['不爬山', '带爸妈'] },
        tts: { text: '带叔叔阿姨啊，那我不跟你整选择题了——直接给你拍一条“巴适慢成都”。我记得你说过你妈腿脚不太好，所以全程没有一段爬山，茶馆、美食、看熊猫，走走停停。你要是想往山水里钻，我也留了条青城山的备胎。要不要我带你把这五天先走一遍？', pace: 'mid' } },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '走一遍' },

      /* ② 叙事流主线：一图一刻，跟着语音换，末尾埋钩子（●○○ 进度） */
      { t: 0, gap_ms: 600, comp: 'MomentCard', card_id: 'm1',
        content: { photo: 'assets/travel/bund.jpg', title: '落地第一晚', meta: ['第1晚', '人均 ¥60'], tags: ['市井烟火', '苍蝇馆串串'], dots: { i: 1, n: 3 } },
        tts: { text: '那从落地第一晚说起。放下行李别急着歇，我带二老直奔玉林路——天一黑，那几家苍蝇馆子招牌灯一亮、油锅滋啦响，你陪老爸开两瓶冰啤、烫一桌串串，那股市井热闹劲儿，比啥接风宴都安逸。不过这还不是重头……想看我给你藏的最安逸那天吗？说“往下”。', pace: 'mid' } },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '往下' },
      { t: 0, gap_ms: 600, comp: 'MomentCard', card_id: 'm2',
        content: { photo: 'assets/travel/westbund.jpg', title: '最安逸的一下午', meta: ['留整下午', '盖碗茶¥15 · 采耳¥50'], tags: ['采耳·别处偷不来'], dots: { i: 2, n: 3 } },
        tts: { text: '重头在这——某个睡到自然醒的下午，我专门给你空出来，啥也不安排。你陪爸妈泡进人民公园的鹤鸣茶社，竹椅往树荫下一靠，几块钱盖碗茶续一下午。最绝的是采耳：师傅那根长铜钎在耳朵里轻轻一颤，酥麻得人直眯眼、忍不住笑出声——这手艺别的城市真偷不走，你妈准念叨一路。想看这天我怎么给你排的，说“这天细说”。', pace: 'mid' } },

      /* ③ 钻取一刻：完整一天卡（时段 + 提醒 + 返回） */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '这天细说' },
      { t: 0, gap_ms: 600, comp: 'MomentCard', card_id: 'detail',
        content: { photo: 'assets/travel/tianzifang.jpg', title: '茶馆那天',
          nodes: [{ time: '午后', place: '鹤鸣茶社 · 采耳' }, { time: '傍晚', place: '锦里 · 红灯笼' }], tip: '竹椅挑靠树荫的老位子' },
        tts: { text: '行，这天给你妈排得最舒服。压轴就是下午的采耳，搁午后让你们睡饱了再去，不赶。上午别折腾，就近喝个早茶、吃碗担担面垫底；茶喝舒坦、耳朵掏酥了，傍晚溜达去锦里看红灯笼一盏盏亮，吃口张飞牛肉收尾。一整天就图一个“慢”字。', pace: 'mid' } },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '回故事' },

      /* 续主线：压轴熊猫（●○● 第3刻） */
      { t: 0, gap_ms: 600, comp: 'MomentCard', card_id: 'm3',
        content: { photo: 'assets/travel/bund.jpg', title: '压轴看熊猫', meta: ['趁早·半天', '门票 ¥55'], tags: ['滚滚·赶早最闹'], dots: { i: 3, n: 3 } },
        tts: { text: '最后压轴，我带二老去熊猫基地——赶大早去，正撞上滚滚抱着竹子啃、从树坡上骨碌下来，胖墩墩的样子，你妈准看一上午舍不得走。中间那天去都江堰看两千年的水，平路不爬高。五天走下来，慢、好吃、不累，差不多就是这个味儿。', pace: 'mid' } },

      /* ④ 收尾/导出：发我手机 → 已发 + 屏回暗 + 情绪收尾 */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '挺好，发我手机' },
      { t: 0, gap_ms: 300, comp: 'toast', state_visual: 'done', text: '已整理好，发到你手机了' },
      { t: 0, gap_ms: 200, comp: 'MomentCard', card_id: 'end', content: { end: true },
        tts: { text: '发啦，每天怎么走、哪家店我都标好了。你就负责陪叔叔阿姨吃好喝好，剩下的交给我。', pace: 'mid' } }
    ], annotations: []
  };
})(window);
