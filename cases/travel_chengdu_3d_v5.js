/* 成都 3 天 · 两人 —— loona-travel-flow 正式 case（v5 全量稿 · 39 步）
   内容真值源：loona-workbench/mock/mock-live-data.js（window.MOCK.steps，文案一字未改）。
   结构照 travel_dali_3d_solo.js：IIFE 注册 g.LOONA_CASES，DAYS 数组 + days()/daysRevised()。
   v5 与 dali 的差异：3 轮澄清里只有【轮3】一张 ClarifyCard（轮1/轮2 纯语音不出卡）；
   三方案合成一个 InspoFlow（A 熊猫慢线主推 / B 三国文化 / C 美食特种兵）；
   不满意改只改 Day2（砍晚上串串收成 3 档·pace light）。
   图片用 workbench 真实存在的 assets/travel/cd_*.jpg；拿不准给 null。
   长度守上限：label≤18、place≤14、note≤42、reminder≤22。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};

  /* 三天日程（各天一张时间轴日程卡）。node 字段照 dali：time/place/note + reminder/highlight/star。 */
  var CD_DAYS = [
    {
      id: 'cd_d1', day: 'Day1', place: '宽窄巷子热身', tag: '到达·松', thumb: 'assets/travel/cd_kuanzhai.jpg',
      label: 'Day 1 · 宽窄巷子热身', pace: 'light', photo: 'assets/travel/cd_kuanzhai.jpg',
      theme: '宽窄巷子热身', transport: '步行', total: '午后到先松松，啥也不赶',
      reminder: '午后到先松松，啥也别赶',
      nodes: [
        { time: '下午', place: '到成都·进宽窄巷子', note: '午后到，先松松，啥也不赶' },
        { time: '下午', place: '逛宽窄巷子', note: '青砖院子一进一出，街边小吃随手买' },
        { time: '晚上', place: '第一顿火锅', note: '红汤翻滚，毛肚鸭肠下锅七上八下' }
      ],
      footer: '午后到先松松，老街慢逛吃火锅'
    },
    {
      id: 'cd_d2', day: 'Day2', place: '熊猫 + 市井', tag: '★ 重头', thumb: 'assets/travel/cd_panda.jpg',
      label: 'Day 2 · 熊猫+市井', pace: 'normal', photo: 'assets/travel/cd_panda.jpg',
      theme: '熊猫+市井', transport: '打车 / 步行', total: '一天看熊猫吃喝逛',
      reminder: '熊猫要赶早，去晚只剩睡觉',
      nodes: [
        { time: '上午', place: '大熊猫基地', note: '一早去看滚滚抱树啃笋最来劲，去晚就只剩睡死的白团子', highlight: true, star: true },
        { time: '中午', place: '川菜馆子', note: '麻婆豆腐回锅肉点几个硬菜补一顿' },
        { time: '下午', place: '人民公园喝茶', note: '竹椅一躺盖碗茶续着，喊师傅采耳' },
        { time: '晚上', place: '锦里夜逛+串串', note: '红灯笼底下边走边逛，竹签串串撸几把' }
      ],
      footer: '熊猫赶早，下午盖碗茶，晚上串串'
    },
    {
      id: 'cd_d3', day: 'Day3', place: '武侯祠 · 返程', tag: '收尾', thumb: 'assets/travel/cd_wuhou.jpg',
      label: 'Day 3 · 武侯祠·返程', pace: 'normal', photo: 'assets/travel/cd_wuhou.jpg',
      theme: '武侯祠 · 返程', transport: '打车', total: '午后赶飞机正好',
      reminder: '小吃边走边吃，留够赶机',
      nodes: [
        { time: '上午', place: '武侯祠+锦里', note: '红墙夹道走一条，三国那些人一下活过来' },
        { time: '中午', place: '成都小吃', note: '钟水饺龙抄手一样来一份' },
        { time: '下午', place: '赶飞机', note: '留够时间打车去机场，路上眯一会儿' }
      ],
      footer: '三国转转吃点小吃，午后赶飞机'
    }
  ];

  /* 不满意改用：用户嫌 Day2 晚上锦里串串想早点回去歇 → 砍晚上串串收成 3 档，pace light。
     同 card_id 'cd_plan' 覆盖重发，靠 pace/标题体现改过，不贴「✓已调整」表功标签。 */
  var CD_D2_ALT = {
    id: 'cd_d2', day: 'Day2', place: '熊猫 + 喝茶', tag: '★ 重头', thumb: 'assets/travel/cd_panda.jpg',
    label: 'Day 2 · 熊猫+喝茶', pace: 'light', photo: 'assets/travel/cd_panda.jpg',
    theme: '熊猫+喝茶', transport: '打车 / 步行', total: '看完熊猫下午喝茶歇腿',
    reminder: '熊猫要赶早，去晚只剩睡觉',
    nodes: [
      { time: '上午', place: '大熊猫基地', note: '一早去看滚滚抱树啃笋最来劲', highlight: true, star: true },
      { time: '中午', place: '川菜馆子', note: '点几个硬菜补一顿' },
      { time: '下午', place: '人民公园喝茶', note: '竹椅一躺喝茶采耳，看完熊猫正好歇腿' }
    ],
    footer: '砍了晚上串串，看完熊猫喝茶歇着'
  };

  function days() { return [CD_DAYS[0], CD_DAYS[1], CD_DAYS[2]]; }
  function daysRevised() { return [CD_DAYS[0], CD_D2_ALT, CD_DAYS[2]]; }

  g.LOONA_CASES['travel_chengdu_3d_v5'] = {
    task_id: 'travel_chengdu_3d_v5', title: '成都3天·两人·V5(3轮澄清+三选一)', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '排成都三天', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== ① 起手 + 路由 ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: '帮我规划一下成都三日游。' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 接需求',
        decision: 'travel=NEW → planner；已知 成都/3天，进 3 轮澄清（轮1/2 纯语音，不出卡）',
        fields: ['scene:travel', '已知:成都/3天', 'clarify=3轮'] },

      /* ===== ② 澄清轮1：纯语音·贴记忆（无卡） ===== */
      { t: 600, gap_ms: 500, comp: 'tts', text: '好呀，这次还是你俩一块儿？大概啥时候走，我提前看看那几天天气。', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '嗯，俩人，6 月 12 号走。' },

      /* ===== ③ 澄清轮2：纯语音（无卡） ===== */
      { t: 300, gap_ms: 500, comp: 'tts', text: '预算大概多少？对了，你俩能吃辣吧？', pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '中档就行，能吃辣，越辣越好。' },

      /* ===== ④ 澄清轮3：语音 + 唯一一张 ClarifyCard（已确认→known，我猜→memory） ===== */
      { t: 300, gap_ms: 400, comp: 'agent_step', internal: true, label: 'CLARIFY·轮3 · 汇总确认(收口)',
        decision: '前两轮答的全沉淀进 known；只剩必去/节奏。答完即收口去搜索，不凑轮数。轮1/2 纯语音不出卡。',
        fields: ['ClarifyCard·R3', 'card_id:clarify_cd_r3', '问:必去/节奏'] },
      { t: 600, gap_ms: 800, comp: 'ClarifyCard', card_id: 'clarify_cd_r3', wait_for_user: true,
        tts: { text: '好嘞，都记住啦。有没有已经看上的地方？我记得你不爱扎堆，那节奏想松点、避开人挤吧？', pace: 'mid' },
        content: {
          title: '必去和节奏',
          understand: {
            known: ['两个人', '成都', '3 天', '6-12 走', '中档', '能吃辣'],
            memory: ['想看熊猫', '市井美食主线', '不爱扎堆']
          }
        } },
      { t: 0, gap_ms: 800, comp: 'user_query', text: '熊猫基地必须去，松一点别太赶。' },

      /* ===== ⑤ 进度 NOTICE → 搜索 → 方案开场 ===== */
      { t: 300, gap_ms: 500, comp: 'tts', notice: true, text: '好的，稍等一下哦，这就给你看看成都有啥好玩的方案。', pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SEARCH · 取数',
        decision: '搜索：web_search 馆子/景点 + get_weather（6/12-6/14）',
        fields: ['web_search', 'get_weather'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: '搜索中', state: 'searching', dismiss_on: 'card' },

      /* ===== ⑥ 方案三选一：一个 InspoFlow 三张大图，A 熊猫慢线主推 rec★ =====
         echo 用 mock 第12步开场那句；punchline 用各方案卡的「口播」字段。 */
      { t: 700, gap_ms: 1200, comp: 'InspoFlow', card_id: 'cd_plans', visual_state: 'active',
        content: {
          echo: '来啦，给你扒拉出三种不一样的成都玩法，我挨个说说。',
          cards: [
            { id: 'A', rec: true, title: '熊猫+市井慢线', photo: 'assets/travel/cd_panda.jpg',
              tags: ['熊猫', '火锅', '慢'],
              punchline: '这条我最推，三天不赶，看熊猫、泡茶馆、吃火锅串串挨着来，主打一个巴适' },
            { id: 'B', title: '三国文化线', photo: 'assets/travel/cd_wuhou.jpg',
              tags: ['人文', '古迹', '逛'],
              punchline: '三天串起武侯祠、杜甫草堂、宽窄巷子，想多看人文走这条' },
            { id: 'C', title: '美食特种兵', photo: 'assets/travel/cd_jinli.jpg',
              tags: ['苍蝇馆子', '串串', '密集'],
              punchline: '三天挨着苍蝇馆子串串小吃打卡，冲着吃来的走这条，就是排得满' }
          ]
        } },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'A', text: '我比较推第一个。三天不赶，上午看熊猫，剩下泡茶馆、吃火锅，慢慢来。你俩想松着玩，这条正合适。', pace: 'mid' },
      { t: 2400, gap_ms: 420, comp: 'tts', highlight: 'B', text: '想多看人文就第二条。三天慢慢逛武侯祠、杜甫草堂、宽窄巷子，红墙竹影那种安静。', pace: 'mid' },
      { t: 2800, gap_ms: 420, comp: 'tts', highlight: 'C', text: '就冲吃来的走第三条，都是你爱吃的那口。三天挨着苍蝇馆子、串串、小吃，就是排得满。你挑哪个？', pace: 'mid' },

      /* ===== ⑦ 三选一：选 A → 直出日程，不问「要不要过一遍」 ===== */
      { t: 0, gap_ms: 800, comp: 'user_query', text: '第一个吧。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PICK · 选 A → 直出日程',
        decision: 'PICK：选 A → 直出日程，不问「要不要过一遍」',
        fields: ['picked:A', 'no确认追问', '→compose_trip'] },
      { t: 0, gap_ms: 500, comp: 'tts', text: '行，这个方案确实适合你，那我就按这个排。', pace: 'mid' },

      /* ===== ⑧ 出日程：TravelView 三天横滑 + 逐天讲 ===== */
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 出三天横滑',
        decision: '按 A 排：熊猫+市井慢线。三天每天一张日程卡横滑，逐天讲靠 highlight 聚焦。Day2 熊猫重头(node ★)。',
        fields: ['TravelView·横滑', '每天一张', 'card_id:cd_plan'] },
      { t: 300, gap_ms: 1200, comp: 'TravelView', card_id: 'cd_plan', visual_state: 'active',
        content: { title: '熊猫+市井慢线 · 成都 · 3 天', cards: days() } },
      { t: 1500, gap_ms: 500, comp: 'tts', highlight: 'cd_d1', text: '你到成都都下午了，就在宽窄巷子里松松，青砖院子逛逛，晚上第一顿火锅，啥也不赶。', pace: 'mid' },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'cd_d2', text: '这天得早点起，早上滚滚最活泛，去晚就全睡了。看完咱们就回市区，下午去人民公园喝茶采耳，特别舒坦。晚上再去吃顿火锅，特意给你找了家最地道的。知道你能吃辣，专挑了够味的那种。', pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'cd_d3', text: '最后一天去武侯祠转转，三国那些老地方看看，中午吃点小吃就去赶飞机，不慌。', pace: 'mid' },
      { t: 400, gap_ms: 500, comp: 'tts', text: '整体规划就这样啦。你看看这规划咋样，要改随时跟我说。', pace: 'mid' },

      /* ===== ⑨ 不满意改：砍 Day2 晚上串串收成 3 档 → 局部改 Day2，覆盖重发 ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '第二天晚上锦里串串去掉吧，看完熊猫我想早点回去歇。' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'REVISE · 只改 Day2',
        decision: 'REVISE：只改 Day2（砍晚上串串收成 3 档），Day1/Day3 不动，同卡覆盖重发',
        fields: ['改:Day2', 'Day1/3不动', 'card_id:cd_plan 覆盖'] },
      { t: 600, gap_ms: 1000, comp: 'TravelView', card_id: 'cd_plan', visual_state: 'active',
        content: { title: '熊猫+市井慢线 · 成都 · 3 天', cards: daysRevised() } },
      { t: 1600, gap_ms: 500, comp: 'tts', highlight: 'cd_d2', text: '成，那第二天晚上串串给你去掉，看完熊猫下午喝完茶就回去歇着。还有要改的吗？或者我帮你加到日程里？', pace: 'mid' },

      /* ===== ⑩ 收尾：查日程冲突 → 排日历(ListCard) + 天气提醒；不算账/不订房 ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: '可以，帮我添加到日程里吧。', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'tts', notice: true, text: '好的，我查一下日程。', pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SETTLE · 查日程+天气',
        decision: 'SETTLE：查日程冲突 + 查天气；不算账/不订房',
        fields: ['查日程冲突', '查天气', 'no算账/no订房'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: '查询中', state: 'reading', dismiss_on: 'card' },
      { t: 700, gap_ms: 500, comp: 'tts', text: '等下，你 6 月 12 号上午有个会议，出发我给你挪到中午，行不？', pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: '行。' },
      { t: 300, gap_ms: 400, comp: 'toast', text: '已加进日程', state: 'done', dismiss_on: 'card' },
      { t: 700, gap_ms: 900, comp: 'ListCard', card_id: 'cd_schedule', visual_state: 'done',
        content: {
          source_tool_name: 'list_events',
          title: '已加进日程',
          rows: [
            { id: 'meet_moved', title: '部门同步会（挪中午）', sub: '原在上午 · 给出发让路', lead: '给出发让路',
              raw_start: '2026-06-12T12:00:00+08:00', raw_end: '2026-06-12T12:30:00+08:00', event_date: '6/12', event_start_sort: 720 },
            { id: 'd1', title: '成都 Day1 · 宽窄巷子', sub: '午后到 · 老街慢逛吃火锅', lead: '午后到，老街慢逛吃火锅',
              raw_start: '2026-06-12T14:00:00+08:00', raw_end: '2026-06-12T21:00:00+08:00', event_date: '6/12', event_start_sort: 840 },
            { id: 'd2', title: '成都 Day2 · 熊猫+喝茶', sub: '早看熊猫 · 下午盖碗茶', lead: '早看熊猫，下午盖碗茶',
              raw_start: '2026-06-13T08:30:00+08:00', raw_end: '2026-06-13T17:00:00+08:00', event_date: '6/13', event_start_sort: 510 },
            { id: 'd3', title: '成都 Day3 · 武侯祠收尾', sub: '三国转转 · 午后赶飞机', lead: '午后赶飞机',
              raw_start: '2026-06-14T09:00:00+08:00', raw_end: '2026-06-14T15:00:00+08:00', event_date: '6/14', event_start_sort: 540 }
          ],
          footer: '<span class="lbl">日程</span> 三天已排进日历，按天左右滑'
        } },
      { t: 1600, gap_ms: 500, comp: 'tts', text: '都给你排进日程了。对了，成都 6 月闷得很，下午常来阵雨，包里塞把伞，别淋着。玩的开心呀！', pace: 'mid' }
    ],
    annotations: []
  };
})(window);
