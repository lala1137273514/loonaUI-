/* ============================================================
   链路编排台 · 卡片库目录 FlowTemplates
   每项 { comp, label, group, make() }；make() 返回一个带默认 content 的新 step。
   content 形状对齐现有 case / 组件，保证 FlowRender 能直接渲。
   ============================================================ */
(function (g) {
  'use strict';
  var PHOTO = {
    erhai: 'assets/travel/dl_erhai.jpg', gucheng: 'assets/travel/dl_gucheng.jpg',
    cangshan: 'assets/travel/dl_cangshan.jpg', xizhou: 'assets/travel/dl_xizhou.jpg',
    news: 'assets/news/news_model.jpg'
  };

  var TEMPLATES = [
    /* —— 对话 / 内部 —— */
    { comp: 'user_query', label: '用户说话', group: '对话',
      make: function () { return { comp: 'user_query', text: '（用户说的话）', gap_ms: 600 }; } },
    { comp: 'tts', label: 'Loona 口播', group: '对话',
      make: function () { return { comp: 'tts', text: '（Loona 念的话）', pace: 'mid', gap_ms: 500 }; } },
    { comp: 'agent_step', label: 'agent 决策', group: '对话',
      make: function () { return { comp: 'agent_step', internal: true, label: 'STEP · 决策', decision: '（这一步怎么判的）', fields: [], gap_ms: 300 }; } },
    { comp: 'toast', label: '状态提示', group: '对话',
      make: function () { return { comp: 'toast', state: 'searching', text: '搜索中', dismiss_on: 'card', gap_ms: 400 }; } },

    /* —— 澄清 / 确认 —— */
    { comp: 'ClarifyCard', label: '澄清卡', group: '卡片',
      make: function () {
        return { comp: 'ClarifyCard', gap_ms: 800, wait_for_user: true,
          tts: { text: '（顺嘴问一句澄清）', pace: 'mid' },
          content: { title: '理解确认', understand: { known: ['已知A', '已知B'], memory: ['偏好1', '偏好2'] } } };
      } },
    { comp: 'ConfirmationCard', label: '确认门', group: '卡片',
      make: function () {
        return { comp: 'ConfirmationCard', gap_ms: 600,
          content: { action: '保存到知识库', target: '某攻略', impact: '以后默认参考', content_summary: '内容摘要一句', reversible: true, confirm_label: '保存', cancel_label: '先不用' } };
      } },

    /* —— 方案 / 行程（轮播多卡）—— */
    { comp: 'InspoFlow', label: '方案三选（灵感流）', group: '轮播',
      make: function () {
        return { comp: 'InspoFlow', gap_ms: 1200,
          content: { echo: '按你的口味配了三条',
            cards: [
              { id: 'A', rec: true, title: '方案A', photo: PHOTO.erhai, tags: ['慢', '出片'], punchline: '主推这条，一句话点睛' },
              { id: 'B', title: '方案B', photo: PHOTO.gucheng, tags: ['文艺', '逛吃'], punchline: '另一种玩法' },
              { id: 'C', title: '方案C', photo: PHOTO.cangshan, tags: ['登高', '视野'], punchline: '想出片选这条' }
            ] } };
      } },
    { comp: 'TravelView', label: '行程多天（日程轮播）', group: '轮播',
      make: function () {
        return { comp: 'TravelView', gap_ms: 1200,
          content: { title: '行程 · N 天',
            cards: [
              { id: 'd1', label: 'Day 1 · 热身', pace: 'light', photo: PHOTO.gucheng, theme: '热身', transport: '步行', total: '当天都在城里',
                nodes: [{ time: '14:30', place: '到达', note: '先松松，啥也不赶' }, { time: '19:00', place: '吃晚饭', note: '热乎的本地味' }], footer: '慢半拍' },
              { id: 'd2', label: 'Day 2 · 重头', pace: 'normal', photo: PHOTO.erhai, theme: '重头戏', transport: '骑行', total: '全程约 25km',
                nodes: [{ time: '09:30', place: '出发', note: '沿湖骑' }, { time: '18:30', place: '看日落', note: '傍晚收在湖边', star: true }], footer: '傍晚看日落' }
            ] } };
      } },

    /* —— 结果 —— */
    { comp: 'ListCard', label: '列表卡（日程/邮件）', group: '卡片',
      make: function () {
        return { comp: 'ListCard', gap_ms: 900,
          content: { source_tool_name: 'list_events', title: '已加进日程',
            rows: [
              { id: 'r1', title: 'Day1 · 古城热身', sub: '午后到 · 慢逛', lead: '14:30', raw_start: '2026-06-07T14:30:00+08:00', event_date: '2026-06-07', event_start_sort: 870 },
              { id: 'r2', title: 'Day2 · 环湖看日落', sub: '骑行环湖', lead: '09:30', raw_start: '2026-06-08T09:30:00+08:00', event_date: '2026-06-08', event_start_sort: 570 }
            ], footer: '<span class="lbl">日程</span> 已排进日历' } };
      } },
    { comp: 'ResultCard', label: '收尾结果卡', group: '卡片',
      make: function () {
        return { comp: 'ResultCard', gap_ms: 900,
          content: { seal: { title: '都给你办好了', subtitle: '照着走就成' },
            days: [{ badge: 'D1', text: '古城热身' }, { badge: 'D2', text: '环湖看日落', star: true }, { badge: 'D3', text: '懒散收尾' }],
            facts: [{ icon: 'calendar', text: '三天已排进日历' }, { icon: 'weather', text: '看日落那天傍晚风大，带外套' }],
            primary: { label: '挑客栈 · 去订', count: 1, href: 'https://www.google.com/search?q=大理+客栈' } } };
      } },

    /* —— 浮层 —— */
    { comp: 'pop_small', label: '小浮层（状态/澄清）', group: '浮层',
      make: function () { return { comp: 'pop_small', role: 'clarify', text: '（一句澄清浮层）', gap_ms: 400 }; } }
  ];

  g.FlowTemplates = TEMPLATES;
})(window);
