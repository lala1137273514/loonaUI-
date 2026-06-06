/* 大理 3 天 · 一个人（独行）—— V5 升级稿
   内容真值源：travel_dali_3d_solo.js（三天景点/真图 dl_*.jpg/已破透口播/洱海骑行主线/龙龛日落王牌段/Day3 懒散收尾分支，全部保留）。
   结构照 travel_chengdu_3d_v5.js（V5 范例）：IIFE 注册 g.LOONA_CASES，DAYS 数组 + days()/daysRevised()。
   V5 改造（照 v5-upgrade-digest 11 条）：
     · 澄清砍成 3 轮——轮1/轮2 纯语音不出卡（轮1 几人/几天/出发日期；轮2 预算+命脉二元问=会不会骑车，记忆里有就陈述确认），轮3 才出唯一一张 ClarifyCard（已确认→known，我猜→memory）。
     · 搜索前、收尾查日程前各补一个 NOTICE 口播，标 notice:true（"这就给你看看方案"/"我查一下日程"）。
     · 方案三选一改整程口径：A 洱海慢线主推(平实2-3句) / B 古城文艺(两句) / C 苍山出片(两句)；punchline+安利讲整个三天调性。
     · 选完直出日程→逐天讲完(含最后一天)→末尾才总结+软征询；王牌段(龙龛日落)留具体亮点不写小作文。
     · 不满意改 Day3 同 card_id 覆盖重发，去 self-report，过渡句短，收尾不客服腔。
   长度守上限：label≤18、place≤14、note≤42、reminder≤22。 */
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
      reminder: '都在古城，慢半拍',
      nodes: [
        { time: '14:30', place: '到大理·进古城', note: '午后到，先松松，啥也不赶',
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
      id: 'dali_d2', day: 'Day2', place: '环洱海·看日落', tag: '★ 重头', thumb: 'assets/travel/dl_erhai.jpg',
      label: 'Day 2 · 环洱海骑行', pace: 'normal', photo: 'assets/travel/dl_erhai.jpg',
      theme: '环洱海骑行', transport: '骑行', total: '全程约 25km',
      reminder: '傍晚收在龙龛看日落',
      nodes: [
        { time: '09:30', place: '才村码头', note: '取车出发，沿环海西路骑',
          transport_to_next: 'bike', distance_to_next: '骑行 8km', duration_to_next: '约 40 分' },
        { time: '10:30', place: '海西生态廊道', note: '贴着湖骑，顺眼就停下拍，湖边吃口歇腿',
          transport_to_next: 'bike', distance_to_next: '骑行 12km', duration_to_next: '约 1 小时' },
        { time: '15:00', place: '理想邦', note: '白房子一片，慢慢拍',
          transport_to_next: 'bike', distance_to_next: '骑行 5km', duration_to_next: '约 25 分' },
        { time: '18:30', place: '龙龛码头', note: '太阳落那会儿湖面金晃晃的，坐下看它沉到水里', highlight: true, star: true }
      ],
      footer: '环洱海一圈，傍晚收在龙龛看日落'
    },
    {
      id: 'dali_d3', day: 'Day3', place: '喜洲·返程', tag: '收尾', thumb: 'assets/travel/dl_xizhou.jpg',
      label: 'Day 3 · 喜洲·返程', pace: 'normal', photo: 'assets/travel/dl_xizhou.jpg',
      theme: '喜洲 · 返程', transport: '公交 / 大巴', total: '午后赶飞机正好',
      reminder: '午后从容赶飞机',
      nodes: [
        { time: '09:30', place: '古城→喜洲', note: '公交过去，路上看田',
          transport_to_next: 'bus', distance_to_next: '约 40 分' },
        { time: '10:00', place: '喜洲古镇', note: '白墙黛瓦的老镇子，稻田边走走拍拍',
          transport_to_next: 'walk', distance_to_next: '镇子里' },
        { time: '12:00', place: '喜洲粑粑+午饭', note: '热乎的粑粑买一个边走边吃',
          transport_to_next: 'bus', distance_to_next: '约 1 小时' },
        { time: '14:30', place: '喜洲→机场', note: '大巴过去，午后的飞机正好' }
      ],
      footer: '喜洲收个尾，午后从容赶飞机'
    }
  ];

  /* Day3 「懒散收尾」覆盖版（不满意分支重发）。pace=light + 标题「懒散收尾」体现改过，不贴 self-report。 */
  var DALI_D3_LAZY = {
    id: 'dali_d3', day: 'Day3', place: '懒散收尾', tag: '慢节奏', thumb: 'assets/travel/dl_gucheng.jpg',
    label: 'Day 3 · 懒散收尾', pace: 'light', photo: 'assets/travel/dl_gucheng.jpg',
    theme: '懒散收尾', transport: '打车', total: '院子到机场约 18km',
    reminder: '这天躺平，不赶了',
    nodes: [
      { time: '10:30', place: '睡到自然醒', note: '不订闹钟，醒了再说' },
      { time: '13:00', place: '咖啡馆泡着', note: '晒太阳翻翻书，发会呆',
        transport_to_next: 'car', distance_to_next: '院子到机场约 18km', duration_to_next: '打车约 40 分' },
      { time: '14:30', place: '慢慢挪去机场', note: '路上买点乳扇带走' }
    ],
    footer: '这天就躺平，不赶了'
  };

  function days(d3) { return [DALI_DAYS[0], DALI_DAYS[1], d3 || DALI_DAYS[2]]; }
  function daysRevised() { return [DALI_DAYS[0], DALI_DAYS[1], DALI_D3_LAZY]; }

  g.LOONA_CASES['travel_dali_3d_solo_v5'] = {
    task_id: 'travel_dali_3d_solo_v5', title: '大理3天·独行·V5(3轮澄清+三选一)', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排大理三天', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== ① 起手 + 路由 ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '最近想去大理玩几天，你有什么建议吗？' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 接需求',
        decision: 'travel=NEW → planner；已知目的地=大理，进 3 轮澄清（轮1/2 纯语音不出卡，轮3 出汇总卡）。预算不算账(工具只 web search)。',
        fields: ['scene:travel', '已知:大理', 'clarify=3轮'] },

      /* ===== ② 澄清轮1：纯语音·贴记忆（无卡）—— 几人/几天/出发日期 ===== */
      { t: 600, gap_ms: 600, comp: 'tts', text: '好呀，这次就你一个人？待几天、大概啥时候走，我顺手看下天气。', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '就我一个人，还没想好待几天，你觉得呢？' },
      { t: 300, gap_ms: 500, comp: 'tts', text: '一个人 3 天刚好，不赶。那你打算啥时候走？', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '后天就走。' },

      /* ===== ③ 澄清轮2：纯语音（无卡）—— 预算 + 大理命脉二元问=会不会骑车 ===== */
      { t: 300, gap_ms: 500, comp: 'tts', text: '预算大概啥档？对了，大理离不开洱海，你会骑车吧？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '中档就行，会骑车。' },

      /* ===== ④ 澄清轮3：语音 + 唯一一张 ClarifyCard（已确认→known，我猜→memory） ===== */
      { t: 300, gap_ms: 400, comp: 'agent_step', internal: true, label: 'CLARIFY·轮3 · 汇总确认(收口)',
        decision: '前两轮答的全沉淀进 known；只剩必去/节奏。答完即收口去搜索，不凑轮数。轮1/2 纯语音不出卡。',
        fields: ['ClarifyCard·R3', 'card_id:clarify_dali_r3', '问:必去/节奏'] },
      { t: 600, gap_ms: 800, comp: 'ClarifyCard', card_id: 'clarify_dali_r3', wait_for_user: true,
        tts: { text: '好嘞，都记住啦。有没有特别想去的地方？我记得你爱清静、出门爱拍，那节奏想松点、避开人多吧？', pace: 'mid' },
        content: {
          title: '必去和节奏',
          understand: {
            known: ['一个人', '大理', '3 天', '后天走', '中档', '会骑车'],
            memory: ['爱清静', '出门爱拍', '不爱扎堆', '住爱带院子的']
          }
        } },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '没特别想去的，你挑。松一点吧，别太赶。' },

      /* ===== ⑤ 进度 NOTICE → 搜索 → 方案开场 ===== */
      { t: 300, gap_ms: 500, comp: 'tts', notice: true, text: '好的，稍等一下哦，这就给你看看大理有啥好玩的方案。', pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SEARCH · 取数',
        decision: '搜索：web_search 客栈/景点/骑行 + get_weather（后天起三天）',
        fields: ['web_search', 'get_weather'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: '搜索中', state: 'searching', dismiss_on: 'card' },

      /* ===== ⑥ 方案三选一：一个 InspoFlow 三张大图，A 洱海慢线主推 rec★ =====
         echo 只共情回声；punchline 讲整个三天调性(不是单天流水)；不剧透日落。 */
      { t: 700, gap_ms: 1200, comp: 'InspoFlow', card_id: 'dali_plans', visual_state: 'active',
        content: {
          echo: '大理这趟，给你扒拉出三种不一样的玩法，我挨个说说。',
          cards: [
            { id: 'A', rec: true, title: '洱海慢线', photo: 'assets/travel/dl_erhai.jpg',
              tags: ['慢', '出片', '院子'],
              punchline: '这条我最推，三天不赶，环洱海骑一圈，住带院子的客栈，主打一个松' },
            { id: 'B', title: '古城文艺', photo: 'assets/travel/dl_gucheng.jpg',
              tags: ['巷子', '文艺', '逛吃'],
              punchline: '三天泡在古城巷子里，咖啡馆晒太阳、小酒馆听歌，想文艺走这条' },
            { id: 'C', title: '苍山出片', photo: 'assets/travel/dl_cangshan.jpg',
              tags: ['登高', '出片', '视野'],
              punchline: '三天主打上苍山看云海，机位在高处，冲着拍来的走这条，就是得爬' }
          ]
        } },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'A', text: '我比较推第一个。三天不赶，沿着洱海慢慢骑，累了找湖边小摊坐会儿。你爱清静又爱拍，这条正合适。', pace: 'mid' },
      { t: 2400, gap_ms: 420, comp: 'tts', highlight: 'B', text: '想往巷子里钻就第二条。三天泡古城，白天咖啡馆晒太阳，晚上人民路热闹，能逛挺晚。', pace: 'mid' },
      { t: 2800, gap_ms: 420, comp: 'tts', highlight: 'C', text: '想多拍点走第三条。三天主打上苍山，运气好碰上云海视野很开，就是得爬一段。你挑哪个？', pace: 'mid' },

      /* ===== ⑦ 三选一：选 A → 直出日程，不问「要不要过一遍」 ===== */
      { t: 0, gap_ms: 800, comp: 'user_query', text: '第一个吧。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PICK · 选 A → 直出日程',
        decision: 'PICK：选 A → 直出日程，不问「要不要过一遍」',
        fields: ['picked:A', 'no确认追问', '→compose_trip'] },
      { t: 0, gap_ms: 500, comp: 'tts', text: '行，洱海这条确实适合你，那我就按这个排。', pace: 'mid' },

      /* ===== ⑧ 出日程：TravelView 三天横滑 + 逐天讲（含最后一天）===== */
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 出三天横滑',
        decision: '按 A 排：洱海慢线。三天每天一张日程卡横滑，逐天讲靠 highlight 聚焦。Day2 环洱海重头(node ★)。',
        fields: ['TravelView·横滑', '每天一张', 'card_id:dali_plan'] },
      { t: 300, gap_ms: 1200, comp: 'TravelView', card_id: 'dali_plan', visual_state: 'active',
        content: { title: '洱海慢线 · 大理 · 3 天', cards: days() } },
      { t: 1500, gap_ms: 500, comp: 'tts', highlight: 'dali_d1', text: '头一天到得晚，就在古城里松松。人民路顺着逛，找个院子晒晒太阳，晚上来碗热饵丝，啥也不赶。', pace: 'mid' },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'dali_d2', text: '这天你一个人骑车绕洱海，想停哪停哪。最值的是傍晚骑到龙龛，太阳往湖里落，整片湖面金晃晃的。坐下看它一点点沉下去，知道你爱拍，这一段够你拍。', pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'dali_d3', text: '最后一天去喜洲转转，稻田边走走拍拍，吃个热乎粑粑，午后从容赶飞机，不慌。', pace: 'mid' },
      { t: 400, gap_ms: 500, comp: 'tts', text: '整体规划就这样啦。你看看咋样，要改随时跟我说。', pace: 'mid' },

      /* ===== ⑨ 不满意改：Day3 换「懒散收尾」→ 局部改 Day3，覆盖重发 ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第三天太赶了，最后一天不想跑来跑去。', travel_back: true },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'REVISE · 只改 Day3',
        decision: 'REVISE：只改 Day3（换懒散收尾，睡到自然醒/咖啡馆翻书/慢慢去机场），Day1/Day2 不动，同卡覆盖重发',
        fields: ['改:Day3', 'Day1/2不动', 'card_id:dali_plan 覆盖'] },
      { t: 600, gap_ms: 1000, comp: 'TravelView', card_id: 'dali_plan', visual_state: 'active',
        content: { title: '洱海慢线 · 大理 · 3 天', cards: daysRevised() } },
      { t: 1600, gap_ms: 500, comp: 'tts', highlight: 'dali_d3', text: '成，那最后一天就不安排景点了。睡到自然醒、赖在院子里，啥时候想动了再慢慢挪去机场。还有要改的吗？或者我帮你加到日程里？', pace: 'mid' },

      /* ===== ⑩ 收尾：查日程冲突 → 排日历(ListCard) + 天气提醒；不算账/不订房 ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '可以，帮我添加到日程里吧。', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'tts', notice: true, text: '好的，我查一下日程。', pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SETTLE · 查日程+天气',
        decision: 'SETTLE：查日程冲突 + 查天气；不算账/不订房',
        fields: ['查日程冲突', '查天气', 'no算账/no订房'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: '查询中', state: 'reading', dismiss_on: 'card' },
      { t: 700, gap_ms: 500, comp: 'tts', text: '等下，你后天上午有个约，出发我给你挪到中午，行不？', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '行。' },
      { t: 300, gap_ms: 400, comp: 'toast', text: '已加进日程', state: 'done', dismiss_on: 'card' },
      { t: 700, gap_ms: 900, comp: 'ListCard', card_id: 'dali_schedule', visual_state: 'done',
        content: {
          source_tool_name: 'list_events',
          title: '已加进日程',
          rows: [
            { id: 'meet_moved', title: '部门同步会（挪中午）', sub: '原在上午 · 给出发让路', lead: '给出发让路',
              raw_start: '2026-06-08T12:00:00+08:00', raw_end: '2026-06-08T12:30:00+08:00', event_date: '6/8', event_start_sort: 720 },
            { id: 'd1', title: '大理 Day1 · 古城热身', sub: '午后到 · 古城慢逛吃饵丝', lead: '午后到，古城慢逛',
              raw_start: '2026-06-08T14:30:00+08:00', raw_end: '2026-06-08T21:00:00+08:00', event_date: '6/8', event_start_sort: 870 },
            { id: 'd2', title: '大理 Day2 · 环洱海看日落', sub: '骑行环湖 · 傍晚龙龛日落', lead: '傍晚龙龛日落',
              raw_start: '2026-06-09T09:30:00+08:00', raw_end: '2026-06-09T19:30:00+08:00', event_date: '6/9', event_start_sort: 570 },
            { id: 'd3', title: '大理 Day3 · 懒散收尾', sub: '院子泡到午后 · 从容赶飞机', lead: '从容赶飞机',
              raw_start: '2026-06-10T10:30:00+08:00', raw_end: '2026-06-10T15:00:00+08:00', event_date: '6/10', event_start_sort: 630 }
          ],
          footer: '<span class="lbl">日程</span> 三天已排进日历，按天左右滑'
        } },
      { t: 1600, gap_ms: 500, comp: 'tts', text: '都给你排进日程了。对了，看日落那天傍晚洱海边风大，带件外套，别光顾着拍把自己冻着。玩的开心呀！', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
