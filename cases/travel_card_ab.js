/* 旅行轮播卡 · 富日卡两方案对比（A 照片banner+时段行 / B 信息优先）
   契约驱动：content = 修订稿 §7.2 的 TravelPayload（cards[]/pace/card_footer；无 trip_footer）。
   builder 读契约字段、pace 派生徽章、总览卡打头。A/B 同一份 payload，步进切换看效果。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};

  // === 修订稿 §7.2 TravelPayload（节选可视字段；evidence_refs 等内部字段此处省略不影响渲染）===
  var PAYLOAD = {
    destination: '成都', duration_days: 3,
    cards: [
      { id: 'd1', label: 'Day 1 · 市区慢启', pace: 'light', span: 1, photo: 'assets/travel/bund.jpg',
        nodes: [
          { time: '上午', place: '宽窄巷子', note: '到达日不赶，逛吃为主' },
          { time: '下午', place: '人民公园·鹤鸣茶社', note: '喝茶休整，卸掉路上的累' }
        ],
        card_footer: '到达日不赶，先把节奏放慢' },
      { id: 'd2', label: 'Day 2 · 人文慢看', pace: 'normal', span: 1, photo: 'assets/travel/westbund.jpg',
        nodes: [
          { time: '上午', place: '武侯祠', note: '三国人文，上午先看' },
          { time: '中午', place: '锦里', note: '紧挨武侯祠，边吃边逛' },
          { time: '下午', place: '杜甫草堂', note: '园林安静，节奏放慢' }
        ],
        card_footer: '人文线为主，走得不多' },
      { id: 'd3', label: 'Day 3 · 熊猫 + 收尾', pace: 'normal', span: 1, photo: 'assets/travel/tianzifang.jpg',
        nodes: [
          { time: '上午', place: '大熊猫基地', note: '越早越活跃，需提前确认预约~' },
          { time: '下午', place: '春熙路·太古里', note: '逛吃收尾，方便返程' }
        ],
        card_footer: '看熊猫要早，下午轻松收尾' }
    ],
    hotels: [], budget: null, route: null
  };

  global.LOONA_CASES['travel_card_ab'] = {
    task_id: 'travel_card_ab',
    title: '旅行卡片改版 · A/B 对比（契约驱动）',
    scene: 'travel',
    source_case: '富日卡改版评审 · 数据=修订稿 §7.2 TravelPayload',
    default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '对比富日卡两方案', granularity: 'by_day',
      evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '成都三日游（看卡片方案）' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: '方案 A · 照片 banner + 时段行',
        decision: '读 TravelPayload.cards[]；无总览卡、无 trip_footer，纯逐日富卡(photo banner + 时段行 nodes + card_footer 一句评价)；pace 派生徽章。',
        fields: ['contract:TravelPayload', 'rich-days'] },
      { t: 600, gap_ms: 1200, comp: 'TravelViewA', card_id: 'planA', visual_state: 'active', content: PAYLOAD },

      { t: 0, gap_ms: 900, comp: 'user_query', text: '看方案 B' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: '方案 B · 信息优先',
        decision: '同一份 TravelPayload；日卡弱化大图(缩小角标)、时段行铺满，密度更高。',
        fields: ['contract:TravelPayload', 'info-first'] },
      { t: 600, gap_ms: 1200, comp: 'TravelViewB', card_id: 'planB', visual_state: 'active', content: PAYLOAD }
    ],
    annotations: []
  };
})(window);
