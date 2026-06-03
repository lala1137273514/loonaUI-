/* 方案 B · 种草灵感流（激进重定位）—— "杭州玩3天" 不出行程表，先出 4 张亮点种草卡（图+tag+一句强 punchline）
   用户对某张感兴趣 → 钻进该亮点玩法；要完整行程 → 引导"我整理好发你手机/PC"（重活外包）。
   TTS 亮点密度最高，每张一句强 punchline。照片暂复用 assets/travel/*（占位）。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_hangzhou_b'] = {
    task_id: 'travel_hangzhou_b', title: '方案B · 杭州·种草灵感流', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '杭州玩什么', granularity: 'highlights', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '杭州玩三天' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 重定位', decision: '判 travel；不默认出完整 N 天行程，先出亮点种草卡流；要完整行程再外包整理。', fields: ['scene:travel', 'mode:灵感流'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在挑杭州最值的几个点…', state_visual: 'searching', dismiss_on: 'card' },
      { t: 900, gap_ms: 300, comp: 'agent_step', internal: true, label: 'TOOL · 取数', decision: 'web_search(杭州 出片/本地/小众/当季) 选 4 个高稀缺亮点。', fields: ['web_search', '挑4亮点'] },
      { t: 1800, gap_ms: 1200, comp: 'InspoFlow', card_id: 'flow', visual_state: 'active',
        content: {
          echo: '杭州玩三天 · 先种草',
          cards: [
            { id: 'i1', title: '西湖骑行追日落', photo: 'assets/travel/bund.jpg', tags: ['日落', '出片'], punchline: '特意给你挑的，苏堤那段日落机位最出片',
              detail: { label: '西湖骑行 · 日落', photo: 'assets/travel/bund.jpg', nodes: [{ time: '傍晚', place: '苏堤', note: '压点骑行追落日，光最好' }, { time: '入夜', place: '湖滨', note: '灯亮了再逛一圈' }], footer: '算好下午到傍晚的光' } },
            { id: 'i2', title: '本地宝藏片儿川', photo: 'assets/travel/westbund.jpg', tags: ['人均30', '本地'], punchline: '本地人才钻的那家面馆，一碗片儿川封神',
              detail: { label: '宝藏面馆', photo: 'assets/travel/westbund.jpg', nodes: [{ time: '饭点', place: '奎元馆', note: '片儿川加虾爆鳝，便宜大碗' }], footer: '饭点去要排队' } },
            { id: 'i3', title: '灵隐小众秘境', photo: 'assets/travel/tianzifang.jpg', tags: ['避人潮', '静心'], punchline: '翻了半天挑的清净角落，飞来峰石窟最灵',
              detail: { label: '灵隐 · 飞来峰', photo: 'assets/travel/tianzifang.jpg', nodes: [{ time: '上午', place: '飞来峰', note: '石窟造像，越早越静' }], footer: '早去避开旅行团' } },
            { id: 'i4', title: '当季龙井茶园', photo: 'assets/travel/bund.jpg', tags: ['当季限定', '出片'], punchline: '这季最美的茶山绿，错过得等明年',
              detail: { label: '龙井村茶园', photo: 'assets/travel/bund.jpg', nodes: [{ time: '上午', place: '龙井村', note: '茶园采茶，喝口头春' }], footer: '春茶季限定' } }
          ]
        } },
      { t: 3000, gap_ms: 500, comp: 'tts', text: '杭州先别急着排表，我挑了四个最值得的点，种给你看。', pace: 'mid' },
      { t: 3500, gap_ms: 360, comp: 'tts', highlight: 'i1', text: '第一张：西湖骑行追日落，苏堤那段机位最出片。', pace: 'mid' },
      { t: 3900, gap_ms: 360, comp: 'tts', highlight: 'i2', text: '想吃地道的，本地人钻的那家片儿川，人均三十封神。', pace: 'mid' },
      { t: 4300, gap_ms: 360, comp: 'tts', highlight: 'i3', text: '怕人挤就去灵隐飞来峰，我翻半天挑的清净角落。', pace: 'mid' },
      { t: 4700, gap_ms: 360, comp: 'tts', highlight: 'i4', text: '还有龙井茶园，这季的茶山绿错过得等明年。', pace: 'mid' },
      { t: 5100, gap_ms: 800, comp: 'user_query', text: '第一个细讲', drill_day: 'i1' },
      { t: 5400, gap_ms: 420, comp: 'tts', highlight: 'i1', text: '日落这张，下午骑到苏堤，压着光追落日最稳。', pace: 'mid' },
      { t: 5750, gap_ms: 340, comp: 'tts', highlight: 'i1', text: '天黑了别走，湖滨灯一亮再逛一圈才完整。', pace: 'mid' },
      { t: 6100, gap_ms: 800, comp: 'user_query', text: '那帮我排个完整三天', travel_back: true },
      { t: 6400, gap_ms: 500, comp: 'toast', text: '完整三天行程已整理，发到你手机了', state_visual: 'done' },
      { t: 6700, gap_ms: 400, comp: 'tts', text: '完整三天我整理好发你手机了，这种重活交给它，我陪你挑好玩的就行。', pace: 'mid' }
    ], annotations: []
  };
})(window);
