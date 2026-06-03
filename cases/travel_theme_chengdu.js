/* 成都怎么玩 · 主题选玩法（ThemeFlow 范式）
   封面=主题卡：icon + 玩法计数(count)，按口味分类；钻取=该主题过滤后的一天行程。
   链路：user_query(不知道玩啥) → ROUTER(internal) → toast → ThemeFlow + tts(总述)
        → tts(逐主题 highlight) → user_query(drill 吃货线) → tts → user_query(返回总览)。
   TTS：像懂行朋友按口味推荐，每个主题点出"谁会爱"。照片用 assets/travel/cd_*.jpg。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_theme_chengdu'] = {
    task_id: 'travel_theme_chengdu',
    title: '成都怎么玩 · 主题选玩法',
    scene: 'travel',
    default_skin: 'glass',
    decision_record: {
      request_type: 'task', primary_need: '成都按主题选玩法', granularity: 'by_theme',
      evidence_level: 'E1', action_risk: 'R0', output_mode: 'document',
      tool_plan: 'query', confirmation_required: false
    },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '成都不知道玩啥，给点方向' },

      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 主题分流',
        decision: '判 travel；用户没目标、要方向 → 不出 N 天行程，先按玩法主题拆 4 张主题卡(icon+玩法计数)，钻取再展开该主题一天。',
        fields: ['scene:travel', 'mode:ThemeFlow', '4主题'] },

      { t: 600, gap_ms: 300, comp: 'toast', text: '正在按口味把成都拆成几条主题…', state_visual: 'searching', dismiss_on: 'card' },

      { t: 1800, gap_ms: 1200, comp: 'ThemeFlow', card_id: 'themes', visual_state: 'active',
        content: {
          echo: '成都按主题给你拆好，挑你的菜',
          themes: [
            { id: 'food', title: '吃货暴走', icon: '🌶️', count: '5个玩法', photo: 'assets/travel/cd_taikoo.jpg',
              tags: ['火锅', '串串', '盖碗茶'], punchline: '无辣不欢的，这条嘴根本停不下来', rec: true,
              detail: { label: '吃货线 · 一天', pace: 'normal', photo: 'assets/travel/cd_jinli.jpg',
                nodes: [
                  { time: '上午', place: '锦里小吃街', note: '三大炮、蛋烘糕当早饭，边逛边扫' },
                  { time: '中午', place: '本地苍蝇馆火锅', note: '九宫格毛肚黄喉，本地人钻的那家' },
                  { time: '下午', place: '鹤鸣茶社', note: '盖碗茶续一下午，给胃歇个脚' },
                  { time: '晚上', place: '玉林路串串', note: '签签往锅里一甩，配冰啤，闹热到深夜' }
                ],
                footer: '一天从早吃到晚，专治选择困难的吃货' } },

            { id: 'panda', title: '熊猫亲密', icon: '🐼', count: '3个玩法', photo: 'assets/travel/cd_panda.jpg',
              tags: ['滚滚', '赶早', '亲子友好'], punchline: '为滚滚专程来一趟都值，赶早看最闹',
              detail: { label: '熊猫线 · 一天', pace: 'light', photo: 'assets/travel/cd_panda.jpg',
                nodes: [
                  { time: '一早', place: '大熊猫基地', note: '开园就进，滚滚抱树啃笋全在这会儿，需提前预约' },
                  { time: '上午', place: '月亮产房 · 幼崽区', note: '奶娃滚滚最萌，挪不动腿' },
                  { time: '下午', place: '太古里熊猫爬墙3D屏', note: '裸眼大屏顺手出片，收尾轻松' }
                ],
                footer: '滚滚得赶早，越晚越懒，午后基本睡成一团' } },

            { id: 'tea', title: '休闲茶馆', icon: '🍵', count: '4个玩法', photo: 'assets/travel/cd_teahouse.jpg',
              tags: ['盖碗茶', '采耳', '慢节奏'], punchline: '想躺平发呆的，这条把成都的松弛喂到嘴边',
              detail: { label: '茶馆线 · 一天', pace: 'light', photo: 'assets/travel/cd_teahouse.jpg',
                nodes: [
                  { time: '上午', place: '人民公园 · 鹤鸣茶社', note: '竹椅往树荫一靠，几块钱盖碗茶续一上午' },
                  { time: '中午', place: '公园边家常馆子', note: '不赶时间，慢慢吃' },
                  { time: '下午', place: '采耳 · 摆龙门阵', note: '长铜钎耳朵里一颤，酥麻得直眯眼' }
                ],
                footer: '啥都不安排就是安排，这股松弛别的城市真学不来' } },

            { id: 'history', title: '古迹人文', icon: '🏯', count: '4个玩法', photo: 'assets/travel/cd_wuhou.jpg',
              tags: ['三国', '老巷子', '出片'], punchline: '爱历史人文的，三国迷来这是头一站',
              detail: { label: '人文线 · 一天', pace: 'normal', photo: 'assets/travel/cd_wuhou.jpg',
                nodes: [
                  { time: '上午', place: '武侯祠', note: '三国人文打底，诸葛亮的院子先看' },
                  { time: '中午', place: '锦里', note: '紧挨武侯祠，红灯笼老街边吃边逛' },
                  { time: '下午', place: '宽窄巷子', note: '老成都的院子，青砖灰瓦最出片' }
                ],
                footer: '一条线把三国和老成都串起来，走得不多看得够' } }
          ]
        } },

      { t: 3200, gap_ms: 500, comp: 'tts', text: '成都太能玩，我先别一股脑塞你，按口味给你拆成四条，挑你的菜。', pace: 'mid' },
      { t: 3700, gap_ms: 380, comp: 'tts', highlight: 'food', text: '头一条吃货暴走，无辣不欢的准乐疯，火锅串串盖碗茶，嘴根本停不下来。', pace: 'mid' },
      { t: 4100, gap_ms: 380, comp: 'tts', highlight: 'panda', text: '冲着滚滚来的看这条，赶大早最闹，抱树啃笋胖墩墩的，谁看谁化。', pace: 'mid' },
      { t: 4500, gap_ms: 380, comp: 'tts', highlight: 'tea', text: '只想躺平发呆的，茶馆线把成都的松弛喂到你嘴边，竹椅一靠续一下午。', pace: 'mid' },
      { t: 4900, gap_ms: 380, comp: 'tts', highlight: 'history', text: '爱历史人文的别错过古迹线，武侯祠加宽窄巷子，三国迷来这是头一站。', pace: 'mid' },

      { t: 5400, gap_ms: 800, comp: 'user_query', text: '吃货线细说', drill_day: 'food' },
      { t: 5700, gap_ms: 420, comp: 'tts', highlight: 'food', text: '行，馋虫上头那条我给你细讲。早上锦里三大炮蛋烘糕垫个底，边逛边扫。', pace: 'mid' },
      { t: 6100, gap_ms: 360, comp: 'tts', highlight: 'food', text: '中午直奔本地人钻的那家火锅，九宫格毛肚黄喉一涮，巴适得板。', pace: 'mid' },
      { t: 6500, gap_ms: 360, comp: 'tts', highlight: 'food', text: '下午鹤鸣茶社盖碗茶给胃歇脚，晚上玉林路串串配冰啤，从早闹到深夜。', pace: 'mid' },

      { t: 7000, gap_ms: 800, comp: 'user_query', text: '回到主题再看看', travel_back: true },
      { t: 7300, gap_ms: 500, comp: 'tts', text: '退回来再挑，四条随你点，想看哪条说一声，重活我来。', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
