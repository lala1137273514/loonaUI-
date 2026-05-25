/* 陪聊情绪承接 case（场景 01 / 知识库 §01）：先接住，不给方法论；求助后才给一个很小下一步。无结果卡，纯口播。 */
(function (global) {
  global.LOONA_CASES = global.LOONA_CASES || {};
  global.LOONA_CASES['companion_chat'] = {
    task_id: 'companion_chat', title: '陪聊 · 情绪承接', scene: 'companion', source_case: '知识库 §01',
    decision_record: { request_type: 'emotion', primary_need: '先被接住，而不是被给方案', granularity: 'single_point',
      evidence_level: 'E2', action_risk: 'R0', output_mode: 'voice', emotion_priority: true, tool_plan: 'none', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', who: '我', text: '唉…今天评审被怼得好惨' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · EMOTION',
        decision: 'router → emotion；emotion_priority=true；先承接，不给方法论、不执行破坏性动作（A0-A1）。',
        fields: ['request_type:emotion', 'emotion_priority:true', 'A≤A1'] },
      { t: 600, gap_ms: 350, comp: 'tts', text: '哎，这种当场卡住真的很刺。先别审判自己，缓一下。', pace: 'slow' },
      { t: 0, gap_ms: 700, comp: 'user_query', who: '我', text: '那我下一步到底该咋办' },
      { t: 300, gap_ms: 280, comp: 'agent_step', internal: true, label: 'NEEDS_HELP',
        decision: '用户明确求助 → 才给一个很小的下一步（A1），不灌一串清单。',
        fields: ['needsHelp:true', 'smallNextStep', 'A1'] },
      { t: 600, gap_ms: 320, comp: 'tts', text: '先做一件小的：把最烦的那一块写成一句话。别一次处理全部。', pace: 'mid' },
      { t: 0, gap_ms: 650, comp: 'user_query', who: '我', text: '嗯，谢了' },
      { t: 300, gap_ms: 300, comp: 'tts', text: '在的，需要随时叫我。', pace: 'mid' },
      { t: 600, gap_ms: 220, comp: 'agent_step', internal: true, label: 'DECISION_RECORD',
        decision: '本轮：emotion ｜ R0 ｜ A1 ｜ 不调敏感记忆制造贴心感，不把"算了"当取消/删除。',
        fields: ['emotion', 'R0', 'no-sensitive-memory'] }
    ],
    annotations: []
  };
})(window);
