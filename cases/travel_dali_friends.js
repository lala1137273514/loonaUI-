/* 大理3天 · 朋友拼局（洱海撒野）—— 种草灵感流（InspoFlow）
   一帮朋友去大理主打玩：不出死板行程表，先甩 4 张亮点种草卡（图+tag+一句强安利）。
   对某张感兴趣 → 钻进该玩法详情；要完整行程 → "我整理好发群里"。
   TTS 朋友向：热闹、出片、AA、"一帮人""整起""拍够本"。照片用 assets/travel/dl_*.jpg。 */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};
  g.LOONA_CASES['travel_dali_friends'] = {
    task_id: 'travel_dali_friends', title: '大理3天 · 朋友拼局（洱海撒野）', scene: 'travel', default_skin: 'glass',
    decision_record: { request_type: 'task', primary_need: '大理玩什么', granularity: 'highlights', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      { t: 0, gap_ms: 0, comp: 'user_query', text: '几个朋友去大理，3天，主打玩' },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · 重定位', decision: '判 travel；朋友拼局主打玩，先不出死板行程，甩亮点种草卡流；要完整行程再整理发群。', fields: ['scene:travel', 'mode:灵感流', 'persona:朋友拼局'] },
      { t: 600, gap_ms: 300, comp: 'toast', text: '正在扒大理最值得一帮人去的几个点…', state_visual: 'searching', dismiss_on: 'card' },
      { t: 900, gap_ms: 300, comp: 'agent_step', internal: true, label: 'TOOL · 取数', decision: 'web_search(大理 出片/热闹/AA/玩法) 选 4 个一帮人玩得开的高稀缺亮点。', fields: ['web_search', '挑4亮点'] },
      { t: 1800, gap_ms: 1200, comp: 'InspoFlow', card_id: 'flow', visual_state: 'active',
        content: {
          echo: '大理这几个点最值得一帮人去',
          cards: [
            { id: 'd1', title: '洱海环湖骑行', photo: 'assets/travel/dl_erhai.jpg', tags: ['出片', 'AA人均60'], punchline: '一帮人骑小电驴绕洱海，海蓝天蓝随手一拍就出片', rec: true,
              detail: { label: '洱海环湖骑行', pace: 'mid', photo: 'assets/travel/dl_erhai.jpg', nodes: [{ time: '上午', place: '才村码头', note: '集合租电驴，一人一辆开整' }, { time: '中午', place: '海西生态廊道', note: '挑机位拍跳拍，水天一色拍够本' }, { time: '傍晚', place: '龙龛码头', note: '压着日落收尾，金光铺满洱海' }], footer: '电驴一人一辆 AA，傍晚的光最毒' } },
            { id: 'd2', title: '古城泡吧夜嗨', photo: 'assets/travel/dl_gucheng.jpg', tags: ['闹热', 'AA人均80'], punchline: '一帮人钻进洋人街扎堆喝酒，民谣一响整晚不困',
              detail: { label: '古城泡吧夜嗨', pace: 'mid', photo: 'assets/travel/dl_gucheng.jpg', nodes: [{ time: '晚饭后', place: '洋人街', note: '一条街全是酒吧，挑家有驻唱的扎进去' }, { time: '夜里', place: '人民路', note: '边走边淘小摊，喝高了就压马路' }], footer: '夜里越晚越闹热，几个人摊着算最省' } },
            { id: 'd3', title: '苍山索道登顶', photo: 'assets/travel/dl_cangshan.jpg', tags: ['出片', 'AA人均120'], punchline: '索道一路升到云上，俯瞰整片洱海绝了',
              detail: { label: '苍山索道登顶', pace: 'mid', photo: 'assets/travel/dl_cangshan.jpg', nodes: [{ time: '上午', place: '感通索道', note: '一帮人包整个缆车厢，升空那段尖叫' }, { time: '山上', place: '玉带云游路', note: '俯拍洱海全景，团体合影就在这' }], footer: '上午云少能看清洱海，山上风大带件外套' } },
            { id: 'd4', title: '崇圣寺三塔', photo: 'assets/travel/dl_santa.jpg', tags: ['出片', 'AA人均75'], punchline: '三塔倒影池前一站，大理最标志的大片就这张',
              detail: { label: '崇圣寺三塔', pace: 'mid', photo: 'assets/travel/dl_santa.jpg', nodes: [{ time: '上午', place: '聚影池', note: '三塔倒影机位，一帮人排开拍最壮' }, { time: '上午', place: '塔后步道', note: '往里走人少，慢慢逛慢慢拍' }], footer: '上午水面静倒影才清，越早人越少' } }
          ]
        } },
      { t: 3000, gap_ms: 500, comp: 'tts', text: '好，一帮朋友去大理仨天主打玩，我记下了。先别忙着排表，我扒了四个一帮人去最闹最出片的点，挨个种给你们看。', pace: 'mid' },
      { t: 3500, gap_ms: 360, comp: 'tts', highlight: 'd1', text: '头一个，主推这个：洱海环湖骑小电驴，一人一辆开整，海蓝天蓝随手一拍就出片，傍晚那波光别处偷不来。', pace: 'mid' },
      { t: 3900, gap_ms: 360, comp: 'tts', highlight: 'd2', text: '晚上别闲着，钻古城洋人街扎堆喝酒，民谣一响、几个人一摊AA，整晚都不困。', pace: 'mid' },
      { t: 4300, gap_ms: 360, comp: 'tts', highlight: 'd3', text: '想拍狠点的就上苍山，索道一路升到云上，整片洱海铺在脚底下，那张俯拍谁发朋友圈谁封神。', pace: 'mid' },
      { t: 4700, gap_ms: 360, comp: 'tts', highlight: 'd4', text: '还有崇圣寺三塔，倒影池前一帮人排开一站，大理最标志的那张大片就拍够本了。', pace: 'mid' },
      { t: 5100, gap_ms: 800, comp: 'user_query', text: '洱海那个细讲', drill_day: 'd1' },
      { t: 5400, gap_ms: 420, comp: 'tts', highlight: 'd1', text: '洱海这趟我替你们排过：上午才村码头集合，一人一辆电驴开起来；中午到海西廊道挑机位，跳拍水天一色拍到爽。', pace: 'mid' },
      { t: 5750, gap_ms: 340, comp: 'tts', highlight: 'd1', text: '压轴是龙龛码头那段日落，金光哗一下铺满整片湖，一帮人逆光剪影随手出大片，这波是真别处偷不来。', pace: 'mid' },
      { t: 6100, gap_ms: 800, comp: 'user_query', text: '那帮我排个完整三天', travel_back: true },
      { t: 6400, gap_ms: 500, comp: 'toast', text: '完整三天行程已整理，发到你们群里了', state_visual: 'done' },
      { t: 6700, gap_ms: 400, comp: 'tts', text: '完整三天我整理好发群里了，谁负责订啥群里一目了然，这种重活交给我，你们整起来拍够本就行。', pace: 'mid' }
    ], annotations: []
  };
})(window);
