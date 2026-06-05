/* 大理 3 天 · 一个人（独行）—— 按 v4 定稿 13 节点链路落地
   口播全部用 旅行case_大理3日_独行_v4.md 的定稿文案（破透版，未重写）。
   能力边界（命门）：全程无预算/房价/金额；电驴等具体租赁改「取车出发」不点名；
     客栈/景点/距离/时长/天气走 web search 撑得起才放；日历可读(查冲突)；卡面不 self-report（不贴「已记着/✓已调整/我空开了」这类表功标签，靠结果体现）。
   ——卡片体系砍到三种 + 结果，全部横向轮播 + 统一尺寸（460×300）——
   组件落点：
     · 澄清=ClarifyCard·understand 纯展示一张(无 chip 无 skip)：亮「已知=一个人/大理/3天 + 我猜=清静/爱拍照(高亮)」，问答全交语音。
     · 方案=InspoFlow 三张等宽大图(A 洱海慢线 rec★ / B 古城文艺 / C 苍山出片)，echo 只共情、punchline 三句不同句式、不剧透日落。
     · 规划=TravelView 三天横向轮播(每天一张日程时间轴卡)——砍掉总览封面，一出来就横滑；逐天讲靠 highlight 聚焦那张。
        node 扩展 time/place/note/distance_to_next/duration_to_next/transport_to_next/highlight/star；日程卡缩窄大图、时间轴为主完整不切。
     · 不满意改 Day3=同 card_id 'dali_plan' 重发覆盖(TravelView)，Day3 换「懒散收尾」慢节奏，靠 pace+标题体现改过(不贴✓已调整)。
     · 收尾=ResultCard(顶部大✓ + D1/D2/D3 章节徽章 + 结果三件套 + 整宽琥珀「挑客栈·去订」真实搜索页)。
   照片直链用 web search 真源(出稿时已取到的实景图直链)；取不到的卡按边界不放、宁可两张。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};

  /* 三天日程（overview 行 + 各天时间轴 nodes）。
     day 行字段：id/day/place/tag/thumb(给 feedOverview)；同时 id/label/pace/photo/nodes/footer/theme/transport/total(给 dayToItem 详情卡)。
     node 扩展：time, place, note, highlight, star, 以及到下一段的衔接 distance_to_next/duration_to_next/transport_to_next。 */
  var DALI_DAYS = [
    {
      id: 'dali_d1', day: 'Day1', place: '古城热身', tag: '步行', thumb: 'assets/travel/dl_gucheng.jpg',
      label: 'Day 1 · 古城热身', pace: 'light', photo: 'assets/travel/dl_gucheng.jpg',
      theme: '古城热身', transport: '步行', total: '当天都在古城里',
      nodes: [
        { time: '14:30', place: '到大理 · 进古城', note: '午后到，先松松，啥也不赶',
          transport_to_next: 'walk', distance_to_next: '步行 5 分钟' },
        { time: '15:00', place: '人民路', note: '顺着老街瞎晃，看哪家顺眼进哪家',
          transport_to_next: 'walk', distance_to_next: '同条街' },
        { time: '17:00', place: '院子咖啡馆', note: '找个院子坐下晒太阳，把紧绷劲儿卸了',
          transport_to_next: 'walk', distance_to_next: '步行几分钟' },
        { time: '19:00', place: '古城吃饵丝', note: '热乎的饵丝配烤乳扇，第一天就这么收' }
      ],
      footer: '都在古城里，全程步行，慢半拍'
    },
    {
      id: 'dali_d2', day: 'Day2', place: '环洱海 · 看日落', tag: '★ 重头', thumb: 'assets/travel/dl_erhai.jpg',
      label: 'Day 2 · 环洱海骑行', pace: 'normal', photo: 'assets/travel/dl_erhai.jpg',
      theme: '环洱海骑行', transport: '骑行', total: '全程约 25km',
      nodes: [
        { time: '09:30', place: '才村码头', note: '取车出发，沿环海西路骑',
          transport_to_next: 'bike', distance_to_next: '骑行 8km', duration_to_next: '约 40 分' },
        { time: '10:30', place: '海西生态廊道', note: '贴着湖骑，顺眼就停下拍，湖边随便吃口歇腿',
          transport_to_next: 'bike', distance_to_next: '骑行 12km', duration_to_next: '约 1 小时' },
        { time: '15:00', place: '理想邦', note: '白房子一片，慢慢拍',
          transport_to_next: 'bike', distance_to_next: '骑行 5km', duration_to_next: '约 25 分' },
        { time: '18:30', place: '龙龛码头', note: '太阳落那会儿湖面金晃晃的，坐下看它沉到水里', highlight: true, star: true }
      ],
      footer: '环洱海一圈，傍晚收在龙龛看日落'
    },
    {
      id: 'dali_d3', day: 'Day3', place: '喜洲 · 返程', tag: '收尾', thumb: 'assets/travel/dl_xizhou.jpg',
      label: 'Day 3 · 喜洲 · 返程', pace: 'normal', photo: 'assets/travel/dl_xizhou.jpg',
      theme: '喜洲 · 返程', transport: '公交 / 大巴', total: '午后赶飞机正好',
      nodes: [
        { time: '09:30', place: '古城 → 喜洲', note: '公交过去，路上看田',
          transport_to_next: 'bus', distance_to_next: '约 40 分' },
        { time: '10:00', place: '喜洲古镇', note: '白墙黛瓦的老镇子，稻田边走走拍拍',
          transport_to_next: 'walk', distance_to_next: '镇子里' },
        { time: '12:00', place: '喜洲粑粑 + 午饭', note: '热乎的粑粑买一个边走边吃',
          transport_to_next: 'bus', distance_to_next: '约 1 小时' },
        { time: '14:30', place: '喜洲 → 机场', note: '大巴过去，午后的飞机正好' }
      ],
      footer: '喜洲收个尾，午后从容赶飞机'
    }
  ];

  /* Day3 「懒散收尾」覆盖版（不满意分支重发）。pace=light + 标题「懒散收尾」体现改过，不贴✓已调整。
     每行给细节(不订闹钟/晒太阳翻书/买乳扇带走)，衔接只在真动线段(去机场)写一句。 */
  var DALI_D3_LAZY = {
    id: 'dali_d3', day: 'Day3', place: '懒散收尾', tag: '慢节奏', thumb: 'assets/travel/dl_gucheng.jpg',
    label: 'Day 3 · 懒散收尾', pace: 'light', photo: 'assets/travel/dl_gucheng.jpg',
    theme: '懒散收尾', transport: '打车', total: '院子到机场约 18km',
    nodes: [
      { time: '上午', place: '院子睡到自然醒', note: '不订闹钟，醒了再说' },
      { time: '午后', place: '咖啡馆泡着', note: '晒太阳翻翻书，发会呆',
        transport_to_next: 'car', distance_to_next: '院子到机场约 18km', duration_to_next: '打车约 40 分' },
      { time: '傍晚', place: '慢慢挪去机场', note: '路上买点乳扇带走' }
    ],
    footer: '这天就躺平，不赶了'
  };

  function days(d3) { return [DALI_DAYS[0], DALI_DAYS[1], d3 || DALI_DAYS[2]]; }

  g.LOONA_CASES['travel_dali_3d_solo'] = {
    task_id: 'travel_dali_3d_solo', title: '大理3天 · 独行（清静·爱拍）· V3', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排大理三天', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== ① 起手：开放求建议 ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '最近想去大理玩几天，你有什么建议吗？' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 接需求',
        decision: '已知目的地=大理；缺天数/同行/调性/必去/日期。开放求建议→先给方向+问几人几天；调性/必去后面真问。预算不问(工具只有 web search 撑不起算账)。',
        fields: ['scene:travel', '缺:天数/同行/调性', 'no预算'] },

      /* ===== ② 澄清第1轮：给方向 + 问几人几天 ===== */
      { t: 600, gap_ms: 600, comp: 'tts', text: '行，大理我熟。几个人去、待几天？大概啥时候出发，我顺手帮你看下那几天天气。', pace: 'mid' },

      /* ===== ③ 用户答 → Loona 拍天数 ===== */
      { t: 0, gap_ms: 700, comp: 'user_query', text: '就我一个人，还没想好待几天，你觉得呢？' },
      { t: 300, gap_ms: 500, comp: 'tts', text: '一个人 3 天正合适，洱海、古城、苍山各一天，不赶。你不爱扎堆，又爱拍，大理这点正对路。', pace: 'mid' },

      /* ===== ④ 理解卡(ClarifyCard · understand 纯展示)：一张卡，不让点 =====
         语音产品不该让用户点按钮。这张卡只「亮出理解」：已知=一个人/大理/3天(实框)，我猜=清静/爱拍照(琥珀高亮在猜的)。
         问和答全交给口播 + 用户语音；卡不带任何可点 chip/skip。TTS 像人随口说，不念选项。 */
      { t: 0, gap_ms: 400, comp: 'agent_step', internal: true, label: 'CLARIFY · 亮理解（纯展示）',
        decision: '不出可点 chip——语音产品靠说不靠点。一张理解卡亮出「已知+我猜」，猜的部分高亮；调性/偏好用口播顺嘴问，用户语音答。',
        fields: ['ClarifyCard·understand', '无chip无skip', 'card_id:clarify_dali'] },
      { t: 400, gap_ms: 800, comp: 'ClarifyCard', card_id: 'clarify_dali', wait_for_user: true,
        tts: { text: '有没有特别想去的地方？没有我就照着排。还有，三天你是想松一点、多发呆，还是多走几个地方？', pace: 'mid' },
        content: {
          title: '大理三日游',
          understand: {
            known: ['一个人', '大理', '3 天'],
            memory: ['爱清静', '出门爱拍', '不爱扎堆', '住爱带院子的']
          }
        } },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '没特别想去的，你挑。松一点吧，别太赶。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 完备',
        decision: '核心输入齐：一个人/3天/清静/必去=授权挑+爱拍照(记忆)。进方案：三张平等轮播，首张主推，不剧透日落。', fields: ['完备', '3方案', '主推A'] },

      /* ===== ⑥ 方案卡：InspoFlow 三张等宽大图，A 主推 rec★ =====
         echo 只共情回声(不评方案不导购)；punchline 三句不同句式、不剧透日落；tags 仅主推卡 A。 */
      { t: 600, gap_ms: 400, comp: 'toast', text: '搜索中', state: 'searching', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1200, comp: 'InspoFlow', card_id: 'dali_plans', visual_state: 'active',
        content: {
          echo: '按你想清静又爱拍，配了三条',
          cards: [
            { id: 'A', rec: true, title: '洱海慢线', photo: 'assets/travel/dl_erhai.jpg',
              tags: ['慢', '出片', '院子'],
              punchline: '沿着湖骑一圈，找家带院子的住下' },
            { id: 'B', title: '古城文艺', photo: 'assets/travel/dl_gucheng.jpg',
              tags: ['巷子', '文艺', '逛吃'],
              punchline: '古城里巷子多，逛饿了随手找口吃的' },
            { id: 'C', title: '苍山出片', photo: 'assets/travel/dl_cangshan.jpg',
              tags: ['登高', '出片', '视野'],
              punchline: '上苍山得爬一段，机位在上头' }
          ]
        } },
      { t: 2200, gap_ms: 500, comp: 'tts', highlight: 'A', text: '配了三条，我最推这条——一路贴着洱海慢慢骑，累了就找个湖边摊子坐会儿，不用赶。', pace: 'mid' },
      { t: 2700, gap_ms: 420, comp: 'tts', highlight: 'B', text: '想往巷子里钻是另一种玩法——白天泡咖啡馆晒太阳，晚上人民路的小酒馆热闹，能逛挺晚。', pace: 'mid' },
      { t: 3100, gap_ms: 420, comp: 'tts', highlight: 'C', text: '想多拍点就上苍山——运气好能碰上云海，视野很开。你挑哪个？', pace: 'mid' },

      /* ===== ⑦ 用户选定 → 主动问要不要细讲 ===== */
      { t: 0, gap_ms: 800, comp: 'user_query', text: '第一个吧。' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'A', text: '行，洱海这条。要不要我把三天大概咋走，先过一遍？', pace: 'mid' },

      /* ===== ⑧ 规划卡：TravelView 三天横向轮播（Day1/Day2/Day3 每天一张日程时间轴卡）=====
         砍掉单独总览封面——一出来就是 days 横向轮播态：看全=横滑，看每天=停在那张。
         逐天讲靠 highlight 聚焦居中（不再先封面再 drill）。同 card_id 'dali_plan'，⑫不满意重发覆盖。 */
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 出三天横滑',
        decision: '不出总览封面——三天直接横向轮播，每天一张日程时间轴卡。逐天讲=highlight 聚焦那张；Day2 环洱海重头(node ★)。',
        fields: ['TravelView·横滑', '每天一张', 'highlight聚焦', 'card_id:dali_plan'] },
      { t: 300, gap_ms: 1200, comp: 'TravelView', card_id: 'dali_plan', visual_state: 'active',
        content: { title: '洱海慢线 · 大理 · 3 天', cards: days() } },
      /* ===== ⑧→⑪ 逐天讲改成「概括 + 重点」两句（去机械化，破排比）=====
         ⑧概括：一口气带过三天调子，过渡天(古城/喜洲)折进这句，点出中间环洱海是重头我细说——不剧透日落。
         ⑨重点：highlight 到 Day2，浓墨只讲王牌(傍晚龙龛日落)，给具体心动画面。Day1/Day3 不再单独成句。 */
      { t: 1500, gap_ms: 500, comp: 'tts', text: '三天就一个调子——头天古城松松落地，最后喜洲逛逛就赶飞机，都不累。最值的是中间环洱海那天，傍晚那段我单说。左右划能看每天，哪天想多待你说一声。', pace: 'mid' },

      /* ===== ⑨ 重点（highlight Day2）：只讲王牌，傍晚龙龛日落给具体心动画面 ===== */
      { t: 0, gap_ms: 900, comp: 'tts', highlight: 'dali_d2', text: '这天你一个人骑着车绕洱海，想停哪停哪。傍晚那段最值——赶到龙龛刚好太阳往湖里落，整片水金得发亮，刺眼，但你舍不得眨眼。找个地方坐下，看它一点点沉进湖里——那一下，特别静。', pace: 'mid' },

      /* ===== ⑫ 不满意分支：先认 + 带判断问 → 改 Day3 + 刷新卡(同 card_id 覆盖) ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '我觉得第三天的安排我不满意。', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'tts', text: '行，第三天咋了——太赶，还是没意思？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '太赶了，最后一天不想跑来跑去。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 改 Day3',
        decision: '认负反馈，Day3 换「懒散收尾」：睡到自然醒/咖啡馆晒太阳翻书/傍晚买乳扇打车走。靠 pace=慢节奏+标题体现改过，不贴✓已调整。同 card_id 重发覆盖。',
        fields: ['认负反馈', 'Day3→懒散', '同card_id覆盖'] },
      { t: 600, gap_ms: 400, comp: 'toast', text: '调整中', state: 'processing', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1100, comp: 'TravelView', card_id: 'dali_plan', visual_state: 'active',
        content: { title: '洱海慢线 · 大理 · 3 天', cards: days(DALI_D3_LAZY) } },
      { t: 0, gap_ms: 700, comp: 'tts', highlight: 'dali_d3', text: '那最后一天就不安排景点了，睡到自然醒、赖在院子里，啥时候想动了再慢慢挪去机场。这样松多了，行吧？', pace: 'mid' },

      /* ===== ⑬ 收尾：查日程冲突 → 加日程 + 天气 + 文档 + 客栈去订（ResultCard） ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '可以，我准备后天出发，帮我添加到日程里吧。', travel_back: true },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SETTLE · 查日程+天气+客栈',
        decision: '查天气+查日程；后天上午有冲突→主动提示挪到中午(基于真日历)。客栈走 web search 搜口碑给「挑+去订」入口，不报房价。',
        fields: ['查日程冲突', '查天气', '客栈web_search', 'no房价'] },
      { t: 600, gap_ms: 400, comp: 'toast', text: '查询中', state: 'reading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 500, comp: 'tts', text: '等下——你后天上午有个约，出发我给你挪到中午，行不？', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '行。' },
      { t: 300, gap_ms: 400, comp: 'toast', text: '已加进日程', state: 'done', dismiss_on: 'card' },
      { t: 700, gap_ms: 900, comp: 'ListCard', card_id: 'dali_schedule', visual_state: 'done',
        content: {
          source_tool_name: 'list_events',
          title: '已加进日程',
          rows: [
            { id: 'meet_moved', title: '部门同步会（挪到中午）', sub: '原在上午 · 给出发让路', lead: '12:00',
              raw_start: '2026-06-07T12:00:00+08:00', raw_end: '2026-06-07T12:30:00+08:00', event_date: '2026-06-07', event_start_sort: 720 },
            { id: 'd1', title: '大理 Day1 · 古城热身', sub: '午后到 · 古城慢逛吃饵丝', lead: '14:30',
              raw_start: '2026-06-07T14:30:00+08:00', raw_end: '2026-06-07T21:00:00+08:00', event_date: '2026-06-07', event_start_sort: 870 },
            { id: 'd2', title: '大理 Day2 · 环洱海看日落', sub: '骑行环湖 · 傍晚龙龛日落', lead: '09:30',
              raw_start: '2026-06-08T09:30:00+08:00', raw_end: '2026-06-08T19:30:00+08:00', event_date: '2026-06-08', event_start_sort: 570 },
            { id: 'd3', title: '大理 Day3 · 喜洲返程', sub: '喜洲收尾 · 午后赶飞机', lead: '09:30',
              raw_start: '2026-06-09T09:30:00+08:00', raw_end: '2026-06-09T15:00:00+08:00', event_date: '2026-06-09', event_start_sort: 570 }
          ],
          footer: '<span class="lbl">日程</span> 三天已排进日历，按天左右滑'
        } },
      { t: 1600, gap_ms: 500, comp: 'tts', text: '都给你排进日程了，照着走就成。对了——看日落那天傍晚洱海边风大，带件外套，别光顾着拍把自己冻着。', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
