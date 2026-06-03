/* 旅行 · 三城对比（DestCompare 范式）
   封面=候选城市卡（含对比数据条 stats），钻取=该城样板一天（detail.nodes）。
   链路：user_query → agent_step(router,internal) → toast → DestCompare + 总述一句 →
        逐城高亮口播(cq/xa/dl) → 下钻重庆样板一天 → 返回总览。
   口播=朋友帮你拍板：把三个城的"性格"讲清楚、点出各自适合谁，最后温和给个偏向。
   轮播逐张推进靠每张 tts 带 highlight:'<城id>'。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_compare_cities'] = {
    task_id: 'travel_compare_cities',
    title: '周末去哪 · 三城对比',
    scene: 'travel',
    default_skin: 'glass',
    decision_record: {
      request_type: 'task', primary_need: '周末三城拿不定主意，对比拍板', granularity: 'highlights',
      evidence_level: 'E1', action_risk: 'R0', output_mode: 'document',
      tool_plan: 'query', confirmation_required: false
    },
    events: [
      /* 0. 听取 */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '周末出去玩，重庆/西安/大理拿不定' },

      /* 1. 路由抽槽（内部，只进右侧侧轨） */
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 三城对比',
        decision: 'Router 判 travel；识别为"多候选拿不定"，走 DestCompare：封面=三城对比卡，钻取=样板一天。',
        fields: ['scene:travel', 'cands:3', 'mode:compare'] },

      /* 2. 取数状态条 */
      { t: 600, gap_ms: 320, comp: 'toast', text: '正在把三个城摆一起比…', state_visual: 'searching', dismiss_on: 'card' },

      /* 3. DestCompare 三城对比卡（封面带 stats 数据条；重庆 rec 偏向） */
      { t: 1500, gap_ms: 900, comp: 'DestCompare', card_id: 'compare', visual_state: 'active',
        content: {
          echo: '三个城都适合周末，给你摆一起比',
          cands: [
            { id: 'cq', city: '重庆', photo: 'assets/travel/cq_hongyadong.jpg', rec: true,
              stats: [{ k: '人均', v: '¥1.5k' }, { k: '时长', v: '2-3天' }, { k: '气质', v: '山城火辣' }],
              why: '夜景顶级、吃辣过瘾，想热闹、想出片选它',
              detail: { label: '重庆 · 样板一天', pace: 'normal', photo: 'assets/travel/cq_hongyadong.jpg',
                nodes: [
                  { time: '上午', place: '李子坝·轻轨穿楼', note: '魔幻地形头一站，抬头就是车钻楼' },
                  { time: '中午', place: '解放碑·老火锅', note: '九宫格毛肚鸭肠，辣得过瘾' },
                  { time: '傍晚', place: '洪崖洞', note: '天擦黑灯一亮，千与千寻那味儿' },
                  { time: '入夜', place: '南山一棵树', note: '俯瞰两江夜景，山城的招牌机位' }
                ],
                footer: '夜景压轴，傍晚卡点上洪崖洞' } },
            { id: 'xa', city: '西安', photo: 'assets/travel/xa_citywall.jpg',
              stats: [{ k: '人均', v: '¥1.2k' }, { k: '时长', v: '2-3天' }, { k: '气质', v: '千年古都' }],
              why: '城墙兵马俑摆在那，爱历史人文走这条',
              detail: { label: '西安 · 样板一天', pace: 'normal', photo: 'assets/travel/xa_citywall.jpg',
                nodes: [
                  { time: '上午', place: '兵马俑', note: '镇国之宝，越早人越少' },
                  { time: '下午', place: '古城墙·骑行', note: '租辆车绕墙骑一圈，风穿千年' },
                  { time: '傍晚', place: '回民街', note: '泡馍肉夹馍管够，边走边啃' },
                  { time: '入夜', place: '大唐不夜城', note: '盛唐灯火，出片不输夜景城' }
                ],
                footer: '人文为主，下午城墙骑行最舒服' } },
            { id: 'dl', city: '大理', photo: 'assets/travel/dl_erhai.jpg',
              stats: [{ k: '人均', v: '¥1.8k' }, { k: '时长', v: '3天起' }, { k: '气质', v: '苍洱松弛' }],
              why: '苍山洱海慢生活，只想躺平发呆来这',
              detail: { label: '大理 · 样板一天', pace: 'light', photo: 'assets/travel/dl_erhai.jpg',
                nodes: [
                  { time: '上午', place: '洱海生态廊道·骑行', note: '租电瓶车贴着湖骑，海蓝天大' },
                  { time: '中午', place: '喜洲古镇', note: '白族院子配一块破酥粑粑' },
                  { time: '下午', place: '海舌公园', note: '湖边发呆晒太阳，啥也不干' },
                  { time: '傍晚', place: '双廊·看日落', note: '苍山倒映洱海，松弛到骨头里' }
                ],
                footer: '节奏最慢，留够发呆的时间' } }
          ]
        }
      },

      /* 4. 总述一句（不带 highlight，先铺场，不动卡） */
      { t: 3000, gap_ms: 500, comp: 'tts',
        text: '好，重庆、西安、大理都是周末刚好的去处，我替你一个个摆一起比，你听完心里就有数了。', pace: 'mid' },

      /* 5. 逐城高亮：每张卡一句，带 highlight 才会逐张推进 */
      { t: 3700, gap_ms: 420, comp: 'tts', highlight: 'cq',
        text: '先说重庆——山城火辣，越夜越闹。洪崖洞一亮灯、火锅一翻滚，那股热乎劲儿别的城真给不了，想热闹想出片就是它。', pace: 'mid' },
      { t: 4200, gap_ms: 420, comp: 'tts', highlight: 'xa',
        text: '西安是另一路——千年古都摆在那，兵马俑、老城墙都是硬货。骑车绕墙转一圈，风里全是历史，爱人文的来这准上头。', pace: 'mid' },
      { t: 4700, gap_ms: 420, comp: 'tts', highlight: 'dl',
        text: '大理就反过来了，苍山洱海一摆开，节奏慢到只想躺平。要的就是发呆晒太阳、把脑子放空，纯放松奔它去没错。', pace: 'mid' },

      /* 6. 温和给偏向（不带 highlight，收口） */
      { t: 5200, gap_ms: 500, comp: 'tts',
        text: '俩字总结：图热闹去重庆，爱人文去西安，想躺平去大理。你这趟就周末两天、还想出片，我偏向给你拍重庆——又近又闹，回来还能晒一圈夜景。', pace: 'mid' },

      /* 7. 下钻：说"重庆那条细看" → 形变进重庆样板一天 */
      { t: 5900, gap_ms: 800, comp: 'user_query', text: '重庆那条细看', drill_day: 'cq' },
      { t: 6200, gap_ms: 420, comp: 'tts', highlight: 'cq',
        text: '行，重庆这一天我给你顺好了。早上先去李子坝看轻轨穿楼，魔幻地形头一眼就把你镇住。', pace: 'mid' },
      { t: 6700, gap_ms: 380, comp: 'tts', highlight: 'cq',
        text: '中午解放碑钻进老火锅，九宫格毛肚鸭肠涮起来，辣得过瘾才算到过重庆。', pace: 'mid' },
      { t: 7100, gap_ms: 380, comp: 'tts', highlight: 'cq',
        text: '压轴留给晚上——天一擦黑上洪崖洞，灯全亮那一刻才是重头戏，再上南山一棵树俯瞰两江，这趟值了。', pace: 'mid' },

      /* 8. 返回总览 */
      { t: 7600, gap_ms: 800, comp: 'user_query', text: '回到整体看看', travel_back: true },
      { t: 8000, gap_ms: 500, comp: 'tts',
        text: '行，退回来看整体。三个城都给你比清楚了，定了哪个跟我说一声，我把这天给你排满。', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
