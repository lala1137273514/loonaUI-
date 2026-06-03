/* 旅行规划 T1 · 验收 UAT 画廊（对齐 修订稿 §8 A1–A12）
   每条 = 一个验收场景的高保真可播放链路，用真实组件：
   ClarifyCard / TravelView(富日卡:banner+行+一句评价footer) / agent_step / tts / toast。
   切分规则：span=ceil(总天数/5)，遇城市边界强制断卡，封顶5张；超5则span自增。
   行布局：span=1→时段行(上午/下午/晚上)；span>1→逐日行(Day N · 地点)。
   播报口径：TTS 只讲行程体验与节奏，绝不提"卡/段/压成几张"等内部机制(机制只进 agent_step 内部侧轨)。
   仅 demo 用；数据为示意，真实内容以工具返回为准。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  function reg(id, title, events) {
    global.LOONA_CASES[id] = {
      task_id: id, title: title, scene: 'travel', default_skin: 'glass',
      source_case: '修订稿 §8 UAT', annotations: [],
      decision_record: { request_type: 'task', primary_need: title, granularity: 'by_day',
        evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
      events: events
    };
  }
  var IMG = ['assets/travel/bund.jpg', 'assets/travel/westbund.jpg', 'assets/travel/tianzifang.jpg'];
  function img(i) { return IMG[i % IMG.length]; }
  // 成都 3 天标准 cards（span=1 时段行；A1/A9/A10/A12 复用）
  function cd3() {
    return [
      { id: 'd1', label: 'Day 1 · 市区慢启', pace: 'light', span: 1, photo: IMG[0],
        nodes: [{ time: '上午', place: '宽窄巷子', note: '到达日不赶，逛吃为主' }, { time: '下午', place: '人民公园·鹤鸣茶社', note: '喝茶休整' }],
        card_footer: '到达日不赶，先把节奏放慢' },
      { id: 'd2', label: 'Day 2 · 人文慢看', pace: 'normal', span: 1, photo: IMG[1],
        nodes: [{ time: '上午', place: '武侯祠', note: '三国人文' }, { time: '中午', place: '锦里', note: '边吃边逛' }, { time: '下午', place: '杜甫草堂', note: '园林安静' }],
        card_footer: '人文线为主，走得不多' },
      { id: 'd3', label: 'Day 3 · 熊猫 + 收尾', pace: 'normal', span: 1, photo: IMG[2],
        nodes: [{ time: '上午', place: '大熊猫基地', note: '越早越活跃，需提前确认预约' }, { time: '下午', place: '春熙路·太古里', note: '逛吃收尾，方便返程' }],
        card_footer: '看熊猫要早，下午轻松收尾' }
    ];
  }
  function uq(text) { return { t: 0, gap_ms: 240, comp: 'user_query', text: text }; }
  function step(label, decision, fields) { return { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: label, decision: decision, fields: fields || [] }; }
  function say(text, hl) { var e = { t: 0, gap_ms: 320, comp: 'tts', text: text, pace: 'mid' }; if (hl) e.highlight = hl; return e; }
  function toast(text) { return { t: 0, gap_ms: 260, comp: 'toast', text: text, state_visual: 'loading', dismiss_on: 'card' }; }
  function clarify(content) { return { t: 0, gap_ms: 320, comp: 'ClarifyCard', card_id: 'clr', wait_for_user: true, content: content }; }
  function plan(dest, days, cards) { return { t: 0, gap_ms: 1200, comp: 'TravelView', card_id: 'plan', visual_state: 'active', content: { destination: dest, duration_days: days, cards: cards } }; }

  /* ---------- A1 happy path ---------- */
  reg('uat_a1', 'A1 · 成都三日游（happy）', [
    uq('成都三日游'),
    step('ROUTER', 'router→travel；抽槽 目的地=成都✓ 周期=3天✓；选填全空', ['必填✓2', '选填待补']),
    clarify({ title: '确认几个槽位', question: '成都三天记下了；日期/预算/节奏补不补都行，不补我按轻松城市漫步排。',
      slots: { required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '3 天' }], optional: ['确切日期', '预算', '节奏', '兴趣'] },
      options: [{ label: '确认' }, { label: '取消' }] }),
    uq('确认'),
    step('PLANNER · 合槽', '默认 预算=中等/节奏=轻松城市漫步；记忆推断写 assumptions', ['默认', 'inferred→assumptions']),
    step('PLANNER · 切分', 'span=ceil(3/5)=1 → 3张单天卡，走时段行', ['span=1', '3卡']),
    toast('正在排成都三天…'),
    step('TOOL · 取数(并行)', 'get_weather(成都) ∥ web_search(近期活动/预约/避坑/天气预报)', ['get_weather', 'web_search']),
    plan('成都', 3, cd3()),
    say('成都这三天排得偏轻松，主打不赶。'),
    say('市区慢启、人文线，再留一天给熊猫。'),
    say('第一天到了别急着冲景点。', 'd1'),
    say('上午宽窄巷子逛吃，看看老成都的院子。', 'd1'),
    say('下午人民公园，鹤鸣茶社点碗盖碗茶坐下来。', 'd1'),
    say('这天就当热身，把路上的累先卸掉。', 'd1'),
    say('第二天走人文线，上午先看武侯祠的三国。', 'd2'),
    say('中午锦里紧挨着，边吃边逛不折返。', 'd2'),
    say('下午去杜甫草堂，园林安静，节奏放慢。', 'd2'),
    say('第三天看熊猫要趁早，越早越活跃。', 'd3'),
    say('门票和预约出发前记得再确认。', 'd3'),
    say('下午春熙路太古里逛吃收尾，离车站也近。', 'd3')
  ]);

  /* ---------- A2 缺必填：强制问目的地+周期，无"确认" ---------- */
  reg('uat_a2', 'A2 · 缺必填（帮我规划旅行）', [
    uq('帮我规划旅行'),
    step('ROUTER', 'router→travel；目的地、周期都缺 → 严禁进规划，必须澄清', ['必填缺2']),
    clarify({ title: '先补两个必填', question: '想去哪、玩几天？这两个定了我就能排。',
      slots: { required: [{ label: '目的地', value: '— 待填' }, { label: '周期', value: '— 待填' }], optional: [] },
      options: [{ label: '我补一下' }] }),
    say('想去哪、玩几天？告诉我这两个就开排。')
  ]);

  /* ---------- A3 区域级目的地：澄清城市落点；不选→灵感草案 ---------- */
  reg('uat_a3', 'A3 · 区域级（云南玩5天）', [
    uq('云南玩 5 天'),
    step('ROUTER', '目的地=云南(区域级，非具体城市) 周期=5天 → 先澄清落点', ['区域级', '需细化']),
    clarify({ title: '云南挺大，先定落点', question: '5 天先去哪一两个城市？大理 / 丽江 / 昆明 / 香格里拉？',
      slots: { required: [{ label: '目的地', value: '云南（区域，需选城市）' }, { label: '周期', value: '5 天' }], optional: ['大理', '丽江', '昆明', '香格里拉'] },
      options: [{ label: '我补一下' }] }),
    uq('你看着办'),
    step('FALLBACK · 灵感草案', '用户不选具体城市 → 不产 cards[]，只给自然语言灵感', ['no cards', '灵感草案']),
    say('云南挺大，没定城市我先给你个方向。'),
    say('经典 5 天可以大理加丽江两座。'),
    say('大理那边洱海骑行、逛古城、晒太阳。'),
    say('丽江上玉龙雪山，再泡泡丽江古城。'),
    say('定了具体城市，我再排成逐日卡片。')
  ]);

  /* ---------- A4 拒绝补周期：只给 1 天灵感草案 ---------- */
  reg('uat_a4', 'A4 · 拒答周期（成都玩几天随便）', [
    uq('成都玩几天随便'),
    step('ROUTER', '目的地=成都✓ 周期缺 → 澄清一次', ['缺周期']),
    clarify({ title: '玩几天？', question: '打算几天？定了我排完整行程；不定我先给一天的灵感。',
      slots: { required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '— 待填' }], optional: [] },
      options: [{ label: '我补一下' }] }),
    uq('随便，你定'),
    step('FALLBACK · 1天灵感', '拒答周期 → 只给 1 天自然语言灵感草案，不产 cards[]', ['no cards', '1天灵感']),
    say('那先给你一天的成都垫一垫。'),
    say('上午宽窄巷子逛吃，看看老院子。'),
    say('下午人民公园喝碗盖碗茶歇脚。'),
    say('晚上去锦里夜逛，灯笼和小吃都热闹。'),
    say('想玩几天告诉我，我排成完整行程。')
  ]);

  /* ---------- A5 带老人：每日≤2点+午休，pace 不 intense ---------- */
  reg('uat_a5', 'A5 · 带老人（低密度）', [
    uq('成都三天，带爸妈'),
    step('ROUTER', '成都/3天/同行=父母(含老人) → 触发低密度约束', ['companions:elder']),
    clarify({ title: '确认几个槽位', question: '带着叔叔阿姨，我把节奏放慢、每天不排太满，行不？',
      slots: { required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '3 天' }, { label: '同行', value: '父母（含老人）' }], optional: ['确切日期', '预算'] },
      options: [{ label: '确认' }, { label: '取消' }] }),
    uq('确认'),
    step('PLANNER · 老人约束', '每日≤2主点位 + 13–15 午休 + 减步行；pace 不取 intense；span=1', ['≤2点/天', '午休', 'pace≠intense']),
    toast('正在排成都三天（慢节奏）…'),
    plan('成都', 3, [
      { id: 'd1', label: 'Day 1 · 到达慢启', pace: 'light', span: 1, photo: IMG[0],
        nodes: [{ time: '上午', place: '宽窄巷子', note: '近、好走，到达日不赶' }, { time: '午后', place: '酒店午休', note: '13–15 点歇一歇' }],
        card_footer: '照顾老人，到达日只排一个点' },
      { id: 'd2', label: 'Day 2 · 人文（少走）', pace: 'light', span: 1, photo: IMG[1],
        nodes: [{ time: '上午', place: '武侯祠·锦里', note: '相邻一起逛，少折返' }, { time: '午后', place: '酒店午休', note: '避开下午暴晒' }],
        card_footer: '每天两个点，走得少' },
      { id: 'd3', label: 'Day 3 · 熊猫（早去）', pace: 'normal', span: 1, photo: IMG[2],
        nodes: [{ time: '上午', place: '大熊猫基地', note: '早去人少、好走；备轮椅通道' }, { time: '下午', place: '返程', note: '午后从容走' }],
        card_footer: '老人也能跟得上的节奏' }
    ]),
    say('带着叔叔阿姨，整趟我把节奏压得很慢。'),
    say('每天只排两个点，中午留出午休。'),
    say('第一天就近逛宽窄巷子。', 'd1'),
    say('到达日不折腾，下午回酒店歇着。', 'd1'),
    say('第二天武侯祠和锦里挨着一起逛。', 'd2'),
    say('少走回头路，下午照样午休避晒。', 'd2'),
    say('第三天看熊猫早点去，人少好走。', 'd3'),
    say('留意一下轮椅通道，下午从容返程。', 'd3')
  ]);

  /* ---------- A6 多目的地：上海3+北京3，城市边界断 → 4卡 ---------- */
  reg('uat_a6', 'A6 · 多目的地（上海3+北京3）', [
    uq('上海3天+北京3天'),
    step('ROUTER', '多城：destination=上海+北京；按城市顺序切段，各3天', ['legs:上海3/北京3']),
    clarify({ title: '确认几个槽位', question: '上海三天、北京三天记下了，补不补日期/预算都行。',
      slots: { required: [{ label: '目的地', value: '上海+北京' }, { label: '周期', value: '6 天（3+3）' }], optional: ['确切日期', '预算'] },
      options: [{ label: '确认' }, { label: '取消' }] }),
    uq('确认'),
    step('PLANNER · 切分', 'span=ceil(6/5)=2；城市边界强制断：上海[1-2][3]、北京[4-5][6] → 4卡。城际进 warnings 不单独成卡', ['span=2', '城界断', '4卡']),
    toast('正在排上海+北京六天…'),
    plan('上海+北京', 6, [
      { id: 'd1', label: '上海 · Day 1-2', pace: 'normal', span: 2, photo: IMG[0],
        nodes: [{ time: 'Day 1', place: '外滩·南京路', note: '沿江看万国建筑' }, { time: 'Day 2', place: '西岸美术馆·武康路', note: '看展 + 梧桐街区' }],
        card_footer: '上海前两天，经典 + 艺术' },
      { id: 'd2', label: '上海 · Day 3', pace: 'light', span: 1, photo: IMG[1],
        nodes: [{ time: '上午', place: '田子坊', note: '弄堂小店' }, { time: '下午', place: '虹桥站', note: '城际转场去北京' }],
        card_footer: '上海收尾，午后转场' },
      { id: 'd3', label: '北京 · Day 4-5', pace: 'normal', span: 2, photo: IMG[2],
        nodes: [{ time: 'Day 4', place: '故宫·景山', note: '故宫需官网预约' }, { time: 'Day 5', place: '慕田峪长城', note: '早出发，缆车省力' }],
        card_footer: '到北京，故宫加长城' },
      { id: 'd4', label: '北京 · Day 6', pace: 'light', span: 1, photo: IMG[0],
        nodes: [{ time: '上午', place: '南锣鼓巷·什刹海', note: '胡同逛吃' }, { time: '下午', place: '返程', note: '从容赶车' }],
        card_footer: '北京收尾，轻松返程' }
    ]),
    say('这趟上海三天、北京三天，两座城分开走。'),
    say('上海前两天给经典和艺术。', 'd1'),
    say('外滩看万国建筑，西岸美术馆看展。', 'd1'),
    say('再去武康路走走梧桐街区。', 'd1'),
    say('上海第三天上午田子坊逛弄堂。', 'd2'),
    say('午后从虹桥坐高铁转场去北京。', 'd2'),
    say('北京头两天给故宫和长城。', 'd3'),
    say('故宫记得官网预约。', 'd3'),
    say('长城早点出发，坐缆车省力。', 'd3'),
    say('最后一天逛南锣鼓巷和什刹海。', 'd4'),
    say('下午从容赶车返程。', 'd4'),
    say('对了，上海到北京的高铁票记得提前订。')
  ]);

  /* ---------- A7 多城未分配：澄清→按主次分；span自增到4卡 ---------- */
  reg('uat_a7', 'A7 · 多城未分配（三城共10天）', [
    uq('上海+北京+成都 共10天'),
    step('ROUTER', '三城、总10天、每城天数未给 → 拿不准先澄清一次', ['3城', '分配未给']),
    clarify({ title: '10 天怎么分？', question: '上海/北京/成都共10天，想每城各几天？不定我按热度给你分（4/3/3）。',
      slots: { required: [{ label: '目的地', value: '上海+北京+成都' }, { label: '周期', value: '10 天' }], optional: ['上海天数', '北京天数', '成都天数'] },
      options: [{ label: '确认' }, { label: '取消' }] }),
    uq('你定吧'),
    step('PLANNER · 分配+切分', '按主次假设 上海4/北京3/成都3 写 assumptions；span=ceil(10/5)=2 时城界断得6卡>5 → span自增到3 → 4卡', ['4/3/3', 'span=3', '城界断', '4卡']),
    toast('正在排三城十天…'),
    plan('上海+北京+成都', 10, [
      { id: 'd1', label: '上海 · Day 1-3', pace: 'normal', span: 3, photo: IMG[0],
        nodes: [{ time: 'Day 1', place: '外滩·豫园', note: '经典开场' }, { time: 'Day 2', place: '西岸美术馆·武康路', note: '艺术 + 街区' }, { time: 'Day 3', place: '迪士尼', note: '一整天' }],
        card_footer: '上海三天，含主题乐园' },
      { id: 'd2', label: '上海 · Day 4', pace: 'light', span: 1, photo: IMG[1],
        nodes: [{ time: '上午', place: '田子坊', note: '弄堂收尾' }, { time: '下午', place: '虹桥站', note: '城际转场去北京' }],
        card_footer: '上海第四天，午后转场' },
      { id: 'd3', label: '北京 · Day 5-7', pace: 'normal', span: 3, photo: IMG[2],
        nodes: [{ time: 'Day 5', place: '故宫·景山', note: '含城际抵达' }, { time: 'Day 6', place: '慕田峪长城', note: '一日' }, { time: 'Day 7', place: '南锣鼓巷', note: '胡同 + 转场' }],
        card_footer: '北京三天，城际进出' },
      { id: 'd4', label: '成都 · Day 8-10', pace: 'light', span: 3, photo: IMG[0],
        nodes: [{ time: 'Day 8', place: '宽窄巷子·人民公园', note: '到达放慢' }, { time: 'Day 9', place: '大熊猫基地', note: '早去' }, { time: 'Day 10', place: '春熙路·返程', note: '收尾' }],
        card_footer: '成都三天收尾，节奏最松' }
    ]),
    say('十天三座城，上海待得最久。'),
    say('上海头三天，外滩、美术馆。', 'd1'),
    say('还专门空出一天去迪士尼。', 'd1'),
    say('时间给得足，玩得满一点。', 'd1'),
    say('上海第四天上午田子坊收尾。', 'd2'),
    say('午后坐高铁转场去北京。', 'd2'),
    say('北京三天，故宫、长城各一天。', 'd3'),
    say('最后一天逛胡同，再往成都走。', 'd3'),
    say('成都收尾三天，节奏放到最松。', 'd4'),
    say('看熊猫、逛春熙路，舒舒服服结束。', 'd4')
  ]);

  /* ---------- A8 长行程单城：成都10天，span=2 → 5卡 ---------- */
  reg('uat_a8', 'A8 · 长行程（成都10天，多日卡）', [
    uq('成都玩10天'),
    step('ROUTER', '成都/10天 单城', ['单城/10天']),
    clarify({ title: '确认几个槽位', question: '成都十天，时间很宽裕，节奏给你放很松，补不补预算都行。',
      slots: { required: [{ label: '目的地', value: '成都' }, { label: '周期', value: '10 天' }], optional: ['预算', '兴趣'] },
      options: [{ label: '确认' }, { label: '取消' }] }),
    uq('确认'),
    step('PLANNER · 切分', '单城 span=ceil(10/5)=2 → 每2天1卡，共5卡，走逐日行', ['span=2', '5卡']),
    toast('正在排成都十天…'),
    plan('成都', 10, [
      { id: 'd1', label: 'Day 1-2 · 市区', pace: 'light', span: 2, photo: IMG[0],
        nodes: [{ time: 'Day 1', place: '宽窄巷子·人民公园', note: '到达慢启' }, { time: 'Day 2', place: '武侯祠·锦里', note: '人文线' }],
        card_footer: '头两天市区不赶' },
      { id: 'd2', label: 'Day 3-4 · 人文+熊猫', pace: 'normal', span: 2, photo: IMG[1],
        nodes: [{ time: 'Day 3', place: '杜甫草堂·浣花溪', note: '园林' }, { time: 'Day 4', place: '大熊猫基地', note: '早去' }],
        card_footer: '人文到熊猫，强度中等' },
      { id: 'd3', label: 'Day 5-6 · 近郊', pace: 'normal', span: 2, photo: IMG[2],
        nodes: [{ time: 'Day 5', place: '都江堰', note: '近郊一日' }, { time: 'Day 6', place: '青城山', note: '爬山' }],
        card_footer: '中段走近郊' },
      { id: 'd4', label: 'Day 7-8 · 远一点', pace: 'normal', span: 2, photo: IMG[0],
        nodes: [{ time: 'Day 7', place: '乐山大佛', note: '高铁往返' }, { time: 'Day 8', place: '峨眉山', note: '住山上' }],
        card_footer: '走远一点，留缓冲' },
      { id: 'd5', label: 'Day 9-10 · 收尾', pace: 'light', span: 2, photo: IMG[1],
        nodes: [{ time: 'Day 9', place: '下山返蓉', note: '缓冲' }, { time: 'Day 10', place: '春熙路·太古里', note: '逛吃买手信' }],
        card_footer: '最后两天从容收尾' }
    ]),
    say('成都十天时间很宽裕，可以慢慢铺开。'),
    say('前两天先在市区热身。', 'd1'),
    say('宽窄巷子、人民公园，再走武侯祠人文线。', 'd1'),
    say('第三四天从人文转到熊猫。', 'd2'),
    say('杜甫草堂安静，熊猫基地记得早去。', 'd2'),
    say('中段往近郊走走。', 'd3'),
    say('都江堰看水利，青城山爬一爬。', 'd3'),
    say('第七八天走得更远一点。', 'd4'),
    say('乐山看大佛，峨眉山住一晚不赶。', 'd4'),
    say('最后两天下山回市区。', 'd5'),
    say('春熙路逛吃、买点手信，从容收尾。', 'd5')
  ]);

  /* ---------- A9 天气工具失败：降级不阻塞 ---------- */
  reg('uat_a9', 'A9 · get_weather 失败（降级）', [
    uq('成都三日游'),
    step('PLANNER · 合槽', '必填齐，默认排；span=1 → 3卡', ['默认']),
    toast('正在排成都三天…'),
    step('TOOL · 取数', 'get_weather 超时/失败 → 不阻塞；web_search 正常', ['get_weather:FAIL', 'web_search:ok']),
    plan('成都', 3, cd3()),
    say('成都三天给你排好了，节奏偏松。'),
    say('第一天市区，第二天人文，第三天熊猫收尾。'),
    say('有件事说一下：天气这次没拉到。'),
    say('行程照常排着，出门前你再确认下当天天气。')
  ]);

  /* ---------- A10 搜索失败：不编造，常识排 + warning ---------- */
  reg('uat_a10', 'A10 · web_search 无结果（不编造）', [
    uq('成都三日游'),
    toast('正在排成都三天…'),
    step('TOOL · 取数', 'web_search 无结果/失败 → 不编造活动/预约，用常识排基础行程', ['web_search:EMPTY', '常识兜底']),
    plan('成都', 3, cd3()),
    say('成都三天的基础行程排好了。'),
    say('宽窄巷子、武侯祠、熊猫基地这条经典线。'),
    say('不过这次没搜到近期活动信息。'),
    say('开放时间和预约出行前你再确认，我没替你瞎编。')
  ]);

  /* ---------- A11 字段长度压测：超长不破版 ---------- */
  reg('uat_a11', 'A11 · 字段长度压测（防破版）', [
    uq('（压测）超长字段渲染'),
    step('CHECK · 字段预算', 'label≤14 / card_footer≤16 / node.place、note 全角；单行不折，超长省略号不破版', ['单行不折', '省略号']),
    plan('超长目的地名称压力测试城市', 2, [
      { id: 'd1', label: 'Day 1 · 这个主题名字故意写得超级长用来测试截断', pace: 'normal', span: 1, photo: IMG[0],
        nodes: [{ time: '上午', place: '一个名字非常非常长的地点用于测试单行裁剪效果', note: '这条说明也故意写得很长很长很长很长很长，看会不会撑破卡片或折成多行影响排版' }],
        card_footer: '这条卡底评价也故意超长超长超长看会不会破版' },
      { id: 'd2', label: 'Day 2 · 正常', pace: 'light', span: 1, photo: IMG[1],
        nodes: [{ time: '下午', place: '正常地点', note: '正常说明' }], card_footer: '正常一句' }
    ]),
    say('压测：超长 label / 地点 / 一句 / footer 应单行省略号截断，不撑破卡、不折行。')
  ]);

  /* ---------- A12 输出校验：契约自检 ---------- */
  reg('uat_a12', 'A12 · 输出校验（契约自检）', [
    uq('成都三日游'),
    step('TOOL · 取数', 'get_weather ∥ web_search', ['get_weather', 'web_search']),
    plan('成都', 3, cd3()),
    step('OUTPUT CHECK', 'cards≤5 ✓；span=1走时段行/span>1走逐日行 ✓；narration ref ∈ {null,d1,d2,d3} ✓；无 trip_footer 字段 ✓；hotels=[] budget=null route=null ✓；card_footer 一句评价、无 HTML、单行 ✓', ['cards≤5', '行布局正确', '无trip_footer', 'T2字段恒空', 'footer纯文本']),
    say('输出自检通过，契约项都对得上。'),
    say('卡数没超 5，行布局、字段恒空都符合。')
  ]);

})(window);
