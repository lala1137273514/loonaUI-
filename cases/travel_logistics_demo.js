/* 重庆周末 · 交通住宿预算（三种新结果卡 demo）
   一条链依次演示：RouteView（怎么去/怎么走，平铺多卡轮播）→ HotelView（住哪，平铺多卡轮播）→ BudgetView（大概花多少，单卡）。
   轮播要逐张推进：RouteView/HotelView 每卡一句 tts 带 highlight=该卡 id；BudgetView 单卡只配一句总览口播。
   图片仅用现有 stay_view / stay_lobby / stay_room；其余卡无图。TTS=贴身导游口吻，把钱和路算明白。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_logistics_demo'] = {
    task_id: 'travel_logistics_demo',
    title: '重庆周末 · 交通住宿预算',
    scene: 'travel',
    default_skin: 'glass',
    decision_record: {
      request_type: 'task', primary_need: '重庆周末交通住宿预算', granularity: 'by_topic',
      evidence_level: 'E1', action_risk: 'R0', output_mode: 'document',
      tool_plan: 'query', confirmation_required: false
    },
    events: [
      /* 0. 听取 */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '重庆周末，顺便看下交通住宿和预算' },

      /* 1. 路由抽槽（内部，只进侧轨） */
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 路由抽槽',
        decision: 'Router 判 travel；抽槽 destination=重庆、duration=周末；意图=交通+住宿+预算三块，依次出结果卡。',
        fields: ['scene:travel', '意图:交通/住宿/预算', 'output:三块依次'] },

      /* 2. 取数状态条（查车次和酒店） */
      { t: 600, gap_ms: 320, comp: 'toast', state_visual: 'searching', text: '查车次和酒店…', dismiss_on: 'card' },

      /* 3. RouteView · 怎么去 / 怎么走（平铺多卡轮播：城际 + 市内 + 机场进城） */
      { t: 1200, gap_ms: 600, comp: 'RouteView', card_id: 'route', visual_state: 'active',
        content: {
          title: '怎么去 / 怎么走',
          routes: [
            { id: 'r_hsr', scope: '城际', from: '成都', to: '重庆', mode: '高铁', modeIcon: '🚄',
              dur: '约 1h10m', transfers: '直达', fare: '¥154 起', note: '一天几十趟，说走就走，比飞机省心' },
            { id: 'r_air', scope: '城际', from: '江北机场', to: '市区', mode: '地铁10号线', modeIcon: '🚇',
              dur: '约 40min', transfers: '换乘1次', fare: '¥7', note: '坐飞机来就走这条，不用打车被堵' },
            { id: 'r_walk', scope: '市内', from: '解放碑', to: '洪崖洞', mode: '步行', modeIcon: '🚶',
              dur: '约 10min', transfers: '一路下坡', fare: '免费', note: '边走边看夜景，到了正好亮灯' }
          ]
        },
        tts: { text: '好，重庆周末，俩人轻装去，我把怎么去、怎么走、住哪、花多少一次给你算明白。', pace: 'mid' } },
      { t: 2000, gap_ms: 700, comp: 'tts', highlight: 'r_hsr',
        text: '从成都过来直接坐高铁，一个钟头出头就到，一天几十趟，到点检票就走——比飞机折腾少多了，省心。', pace: 'mid' },
      { t: 2500, gap_ms: 480, comp: 'tts', highlight: 'r_air',
        text: '要是你俩坐飞机来，落地江北别急着打车，地铁10号线四十分钟直插市区，七块钱，还不怕高峰堵在路上。', pace: 'mid' },
      { t: 3000, gap_ms: 480, comp: 'tts', highlight: 'r_walk',
        text: '市里其实用不着挤地铁，解放碑溜达到洪崖洞就十分钟，一路下坡，走到刚好赶上灯亮，那一片金灿灿的夜景，巴适。', pace: 'mid' },

      /* 4. HotelView · 住哪（平铺多卡轮播：江景主推 + 解放碑商圈 + 文艺民宿） */
      { t: 3600, gap_ms: 700, comp: 'HotelView', card_id: 'stay', visual_state: 'active',
        content: {
          title: '住哪',
          hotels: [
            { id: 'h_view', name: '江畔观景酒店', photo: 'assets/travel/stay_view.jpg', price: '¥680', priceUnit: '/晚',
              rating: 4.8, area: '南滨路', tags: ['江景', '看跨江大桥'], rec: true,
              note: '我替你挑的就这家，窗户一拉开两江夜景全在眼前，俩人住值回票价' },
            { id: 'h_core', name: '解放碑中心酒店', photo: 'assets/travel/stay_lobby.jpg', price: '¥520', priceUnit: '/晚',
              rating: 4.6, area: '解放碑', tags: ['近地铁', '步行逛吃'],
              note: '图方便就住这，下楼就是商圈，半夜想吃宵夜出门就有' },
            { id: 'h_room', name: '山城文艺民宿', photo: 'assets/travel/stay_room.jpg', price: '¥360', priceUnit: '/晚',
              rating: 4.7, area: '十八梯',
              tags: ['老巷', '出片'], note: '想省点又要味道，这间藏在老巷里，房间出片，性价比顶' }
          ]
        },
        tts: { text: '住的我也给你翻出来三家，从主推到省钱都有，你按心情挑。', pace: 'mid' } },
      { t: 4400, gap_ms: 700, comp: 'tts', highlight: 'h_view',
        text: '最想推你这家江景的——窗一开两江夜景直接糊脸，俩人窝房里看灯火滚滚，比啥都浪漫，六百多两晚摊下来，住江景这家真值。', pace: 'mid' },
      { t: 4900, gap_ms: 480, comp: 'tts', highlight: 'h_core',
        text: '要图省事就住解放碑这家，下楼就是商圈，逛吃宵夜不用挪窝，地铁也在脚边，懒得动的时候最香。', pace: 'mid' },
      { t: 5400, gap_ms: 480, comp: 'tts', highlight: 'h_room',
        text: '预算想再压一压，十八梯这间文艺民宿藏在老巷里，三百多一晚，房间随手一拍就出片，性价比这块它最顶。', pace: 'mid' },

      /* 5. BudgetView · 大概花多少（单卡，一句总览口播） */
      { t: 6000, gap_ms: 700, comp: 'BudgetView', card_id: 'budget', visual_state: 'active',
        content: {
          title: '大概花多少',
          total: '¥2000',
          currency: '¥',
          items: [
            { label: '交通', amount: '¥600', pct: 30 },
            { label: '住', amount: '¥680', pct: 34 },
            { label: '吃', amount: '¥400', pct: 20 },
            { label: '门票', amount: '¥120', pct: 6 },
            { label: '其他', amount: '¥200', pct: 10 }
          ],
          note: '人均估算 ¥2000 左右（俩人一间房均摊 · 周末两天一晚 · 含往返高铁）'
        },
        tts: { text: '钱给你拢了个总账：人均两千上下，周末俩人玩下来不肉疼。大头在来回高铁和那间江景房，吃喝门票都不贵，重庆的火锅小面便宜管够。剩下的重活交给我，你俩到点出发就行。', pace: 'mid' } }
    ],
    annotations: []
  };
})(window);
