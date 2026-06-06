/* Japan 7 Days · Couple (food + photo) —— V5 upgrade of travel_japan_7d.js.
   V5 changes applied off references/v5-upgrade-digest.md (11 points), Chengdu v5 case as the template:
     #1/2  Clarify = 3 rounds. R1/R2 voice-only (no card); R3 = one ClarifyCard summary (known + guess).
           R1 who/days/fly-out date; R2 budget-free → the make-or-break binary for a 7-day Japan trip
           = "全跑关西关东 vs 专一个区" (this is what actually swings A vs C). R3 must-sees / pace.
     #3    Confirmed facts shown on the card, not read aloud; freed words spend on a memory line.
     #4/5  notice:true TTS before search and before the calendar check (text-only frames, no card).
     #6/7  Options = whole-trip tone (not single-day flow). Pick A plain ~2-3 sentences, B/C two each, can lean on memory.
     #8/9  Pick → straight to itinerary (no "want a walkthrough?" gate); day-by-day THEN summary + soft ask at the end.
     #10   Hero days keep a concrete beat, no literary mini-essay.
     #11   Not-satisfied re-render: same card_id, no self-report badge; transitions short; no customer-service tail.
   Real content KEPT from V3: the 7 real days / cities / real assets/travel/jp_*.jpg photos / the polished TTS where it held up.
   Capability floor unchanged: no prices / room rates / ¥$; no rental-shop names; ryokan/spot/distance/weather/calendar fair game.
   Length caps (same as Chengdu): label≤18, place≤14, note≤42, reminder≤22.
   Dates: today 2026-06-05, fly out next Friday 2026-06-12; 7 days = 06-12 .. 06-18. */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};

  /* 7-day plan (initial). Day rows + node fields mirror V3 (real content carried over verbatim). */
  var JP_DAYS = [
    {
      id: 'jp_d1', day: 'D1', place: 'Tokyo · land & ease in', tag: 'on foot', thumb: 'assets/travel/jp_tokyo_shibuya.jpg',
      label: 'Day 1 · Tokyo · land & ease in', pace: 'light', photo: 'assets/travel/jp_tokyo_shibuya.jpg',
      theme: 'Tokyo · ease in', transport: 'mostly on foot', total: 'jet-lag day, keep it loose',
      nodes: [
        { time: '14:00', place: 'Land · drop bags · Asakusa', note: 'get in, dump the bags, wander the old streets',
          transport_to_next: 'train', distance_to_next: '20 min' },
        { time: '17:00', place: 'Shibuya', note: 'the scramble crossing, just take it in' },
        { time: '19:00', place: 'Izakaya', note: 'first proper meal, ease into it' }
      ],
      footer: 'Land and settle, no agenda day one'
    },
    {
      id: 'jp_d2', day: 'D2', place: 'Tokyo · teamLab + eats', tag: 'photo', thumb: 'assets/travel/jp_teamlab.jpg',
      label: 'Day 2 · Tokyo · teamLab + eats', pace: 'normal', photo: 'assets/travel/jp_teamlab.jpg',
      theme: 'Tokyo · teamLab', transport: 'subway', total: 'morning art, afternoon eating',
      nodes: [
        { time: '10:00', place: 'teamLab Borderless', note: 'the digital-art one, endless photos in there',
          transport_to_next: 'train', distance_to_next: '25 min' },
        { time: '15:00', place: 'Shibuya · eat your way through', note: 'graze the afternoon, no rush' }
      ],
      footer: 'teamLab in the morning, eat through the afternoon'
    },
    {
      id: 'jp_d3', day: 'D3', place: 'Tokyo · market + Harajuku', tag: 'food', thumb: 'assets/travel/jp_tsukiji.jpg',
      label: 'Day 3 · Tokyo · market + Harajuku', pace: 'normal', photo: 'assets/travel/jp_tsukiji.jpg',
      theme: 'Tokyo · market', transport: 'subway', total: 'last Tokyo day before the good stuff',
      nodes: [
        { time: '07:30', place: 'Tsukiji outer market', note: 'freshest sushi breakfast you will ever have',
          transport_to_next: 'train', distance_to_next: '20 min' },
        { time: '11:00', place: 'Harajuku · Akihabara', note: 'the weird, fun side of Tokyo' }
      ],
      footer: 'Early market sushi, then Harajuku — Tokyo done'
    },
    {
      id: 'jp_d4', day: 'D4', place: 'Hakone · onsen under Fuji', tag: '★ hero', thumb: 'assets/travel/jp_fuji_lake.jpg',
      label: 'Day 4 · Hakone · onsen under Fuji', pace: 'normal', photo: 'assets/travel/jp_fuji_lake.jpg',
      theme: 'Hakone · Fuji', transport: 'train', total: 'train day, lake + ryokan',
      nodes: [
        { time: '10:00', place: 'Train out to Hakone', note: 'leave the city behind',
          transport_to_next: 'train', distance_to_next: '90 min' },
        { time: '12:00', place: 'Lakeside lunch', note: 'Fuji shows up right across the water, huge',
          transport_to_next: 'walk', distance_to_next: 'short walk' },
        { time: '15:00', place: 'Check into the ryokan', note: 'soak, do nothing',
          transport_to_next: 'walk', distance_to_next: 'in the ryokan' },
        { time: '18:30', place: 'Onsen + kaiseki dinner', note: 'steam off the water, the whole mountain in the window', highlight: true, star: true }
      ],
      footer: 'Lake, ryokan, and the onsen with Fuji in the window'
    },
    {
      id: 'jp_d5', day: 'D5', place: 'Kyoto · kimono + Gion night', tag: '★ hero', thumb: 'assets/travel/jp_gion.jpg',
      label: 'Day 5 · Kyoto · kimono + Gion night', pace: 'normal', photo: 'assets/travel/jp_gion.jpg',
      theme: 'Kyoto · Gion', transport: 'subway + walk', total: 'all-day Kyoto, save the dusk',
      nodes: [
        { time: '09:30', place: 'Rent kimonos', note: 'get properly done up first thing',
          transport_to_next: 'train', distance_to_next: '15 min' },
        { time: '11:00', place: 'Fushimi Inari', note: 'the thousand red gates climbing the hill',
          transport_to_next: 'train', distance_to_next: '20 min' },
        { time: '15:00', place: 'Tea house', note: 'slow afternoon, get off your feet',
          transport_to_next: 'walk', distance_to_next: 'short walk' },
        { time: '18:00', place: 'Gion at dusk', note: 'lanterns flick on, old stone streets, every shot a movie poster', highlight: true, star: true }
      ],
      footer: 'Kimono, the red gates, and Gion when the lanterns come on'
    },
    {
      id: 'jp_d6', day: 'D6', place: 'Kyoto · Arashiyama', tag: 'slow', thumb: 'assets/travel/jp_arashiyama.jpg',
      label: 'Day 6 · Kyoto · Arashiyama', pace: 'light', photo: 'assets/travel/jp_arashiyama.jpg',
      theme: 'Kyoto · Arashiyama', transport: 'train', total: 'easy on purpose',
      nodes: [
        { time: '08:30', place: 'Bamboo grove', note: 'get there early, before the crowds',
          transport_to_next: 'walk', distance_to_next: 'around the district' },
        { time: '11:00', place: 'Temples · drift around', note: 'low-key, you earned it' }
      ],
      footer: 'Bamboo early, then drift the temples'
    },
    {
      id: 'jp_d7', day: 'D7', place: 'Osaka · Dotonbori + fly out', tag: 'wrap', thumb: 'assets/travel/jp_osaka_dotonbori.jpg',
      label: 'Day 7 · Osaka · Dotonbori + fly out', pace: 'normal', photo: 'assets/travel/jp_osaka_dotonbori.jpg',
      theme: 'Osaka · fly out', transport: 'train', total: 'eat, then the airport',
      nodes: [
        { time: '10:00', place: 'Dotonbori', note: 'eat till you cannot, grab what you missed',
          transport_to_next: 'train', distance_to_next: 'to the airport' },
        { time: '15:00', place: 'Head to the airport', note: 'afternoon flight, easy out' }
      ],
      footer: 'Osaka eats, then fly home'
    }
  ];

  /* Not-satisfied re-render: Tokyo cut to 2 days, Fuji gets the extra night.
     pace + titles carry the change (D2 = teamLab+market combined; D3 = Fuji arrival; D4 stays the onsen hero, extra lake night).
     No "✓ adjusted" badge, no self-report — shorter Tokyo + extra Fuji night shows it. */
  var JP_DAYS_FUJI = [
    JP_DAYS[0],
    {
      id: 'jp_d2', day: 'D2', place: 'Tokyo · teamLab + market', tag: 'photo+food', thumb: 'assets/travel/jp_teamlab.jpg',
      label: 'Day 2 · Tokyo · teamLab + market', pace: 'normal', photo: 'assets/travel/jp_teamlab.jpg',
      theme: 'Tokyo · last day', transport: 'subway', total: 'Tokyo in two, packed but fair',
      nodes: [
        { time: '08:00', place: 'Tsukiji outer market', note: 'sushi breakfast, get it in early',
          transport_to_next: 'train', distance_to_next: '25 min' },
        { time: '11:00', place: 'teamLab Borderless', note: 'the photo one, plenty of shots',
          transport_to_next: 'train', distance_to_next: '20 min' },
        { time: '16:00', place: 'Shibuya · eat + wander', note: 'last Tokyo evening, take it slow' }
      ],
      footer: 'Tokyo folded into two, market + teamLab same day'
    },
    {
      id: 'jp_d3', day: 'D3', place: 'Hakone · arrive at the lake', tag: 'slow', thumb: 'assets/travel/jp_fuji_lake.jpg',
      label: 'Day 3 · Hakone · arrive at the lake', pace: 'light', photo: 'assets/travel/jp_fuji_lake.jpg',
      theme: 'Hakone · extra night', transport: 'train', total: 'the extra Fuji night',
      nodes: [
        { time: '11:00', place: 'Train out to Hakone', note: 'leave Tokyo a day early',
          transport_to_next: 'train', distance_to_next: '90 min' },
        { time: '14:00', place: 'Lakeside · settle in', note: 'Fuji across the water, no agenda',
          transport_to_next: 'walk', distance_to_next: 'short walk' },
        { time: '18:30', place: 'First night soak', note: 'ease in, the big evening is tomorrow' }
      ],
      footer: 'Extra lake night — arrive slow, settle in'
    },
    {
      id: 'jp_d4', day: 'D4', place: 'Hakone · onsen under Fuji', tag: '★ hero', thumb: 'assets/travel/jp_fuji_lake.jpg',
      label: 'Day 4 · Hakone · onsen under Fuji', pace: 'normal', photo: 'assets/travel/jp_fuji_lake.jpg',
      theme: 'Hakone · Fuji', transport: 'walk', total: 'the full Fuji day',
      nodes: [
        { time: '10:00', place: 'Slow morning by the lake', note: 'coffee, the mountain right there',
          transport_to_next: 'walk', distance_to_next: 'lakeside' },
        { time: '12:00', place: 'Lakeside lunch', note: 'Fuji across the water, photos do not do it' },
        { time: '18:30', place: 'Onsen + kaiseki dinner', note: 'steam off the water, the whole mountain in the window', highlight: true, star: true }
      ],
      footer: 'The full Fuji day — lake, then the onsen evening'
    },
    JP_DAYS[4],
    JP_DAYS[5],
    JP_DAYS[6]
  ];

  function days(set) { return set || JP_DAYS; }

  g.LOONA_CASES['travel_japan_7d_v5'] = {
    task_id: 'travel_japan_7d_v5', title: '日本7天·V5(3轮澄清+三选一)', scene: 'travel', default_skin: 'glass', lang: 'en',
    decision_record: { request_type: 'task', primary_need: 'plan a 7-day Japan trip', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== ① Open request + router ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: "We're thinking Japan, about a week. First time. Got any ideas?" },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · take request',
        decision: 'travel=NEW → planner; known Japan/~1 week. 3-round clarify (R1/R2 voice-only, no card). No budget (web search only, cannot price).',
        fields: ['scene:travel', 'known:Japan/~7d', 'clarify=3rounds'] },

      /* ===== ② Clarify R1: voice-only, who / days / fly-out date (no card) ===== */
      { t: 600, gap_ms: 600, comp: 'tts', text: "Japan, nice — first time's the fun one. How many of you, is a week locked in, and when are you flying out? I'll check the forecast for those dates.", pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: 'Just the two of us, seven days, flying out next Friday.' },

      /* ===== ③ Clarify R2: voice-only, the make-or-break binary (no card) =====
         For a 7-day Japan trip the one binary that swings the main plan is region spread:
         do both Kansai+Kanto, or go deep on one region. That's what splits A (classic loop) from C (slow). */
      { t: 300, gap_ms: 500, comp: 'tts', text: "Seven days, two of you — got it. One big call first: do you wanna hit both Kanto and Kansai, Tokyo and Kyoto and all that, or just go deep on one area and not rush it?", pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'Both, I think. We want to see the famous stuff.' },

      /* ===== ④ Clarify R3: voice + the one summary card (known + guess) ===== */
      { t: 300, gap_ms: 400, comp: 'agent_step', internal: true, label: 'CLARIFY · R3 summary (display-only)',
        decision: 'R1/R2 answers sink into known; only must-sees / pace left. Answer closes clarify → search, no padding rounds. R1/R2 ran voice-only.',
        fields: ['ClarifyCard·R3', 'card_id:clarify_jp_r3', 'ask:must-see/pace'] },
      { t: 600, gap_ms: 800, comp: 'ClarifyCard', card_id: 'clarify_jp_r3', wait_for_user: true,
        tts: { text: "Last thing — anything you've gotta see, or should I just pick? I've got you two down as foodies who'd rather skip the tourist traps, so I'll steer around those either way.", pace: 'mid' },
        content: {
          title: 'Must-sees & pace',
          understand: {
            known: ['the two of you', 'Japan', '7 days', 'fly out Fri', 'Kanto + Kansai'],
            memory: ['travel to eat', 'into photography', 'skip tourist traps']
          }
        } },
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'Fuji for sure. You pick the rest.' },

      /* ===== ⑤ NOTICE → search → options open ===== */
      { t: 300, gap_ms: 500, comp: 'tts', notice: true, text: "Got it — sec, lemme pull up a few ways to do this.", pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SEARCH · fetch',
        decision: 'Search: web_search spots/eats + get_weather (06-12 .. 06-18).',
        fields: ['web_search', 'get_weather'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: 'Searching…', state: 'searching', dismiss_on: 'card' },

      /* ===== ⑥ Options: InspoFlow 3 big photos, A rec★ — whole-trip TONE, not single-day flow =====
         echo only empathises; each card has tags + a whole-trip punchline; no dusk spoiler. */
      { t: 700, gap_ms: 1200, comp: 'InspoFlow', card_id: 'jp_plans', visual_state: 'active',
        content: {
          echo: "First time, into food and photos — here's three ways to play the week",
          cards: [
            { id: 'A', rec: true, title: 'The Classic, done right', photo: 'assets/travel/jp_fuji_lake.jpg',
              tags: ['iconic', 'food', 'photo'],
              punchline: 'Tokyo, a night under Fuji, then Kyoto and Osaka — the whole loop, routed past the tourist traps' },
            { id: 'B', title: 'Food Crawl', photo: 'assets/travel/jp_osaka_dotonbori.jpg',
              tags: ['street eats', 'Osaka', 'late nights'],
              punchline: 'Whole week pointed at the food, Tokyo down to Osaka, eating the country end to end' },
            { id: 'C', title: 'Slow & Onsen', photo: 'assets/travel/jp_teamlab.jpg',
              tags: ['hot springs', 'Kyoto', 'unwind'],
              punchline: 'Less ground all week, more soaking — Hakone and Kyoto, taken slow' }
          ]
        } },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'A', text: "I'd go the classic loop. You wanted both regions, and this is the clean way to do it — Tokyo, Fuji, Kyoto, Osaka, no checklist feel. First trip, this is the one.", pace: 'mid' },
      { t: 2400, gap_ms: 420, comp: 'tts', highlight: 'B', text: "If it's really all about eating, the food crawl's your week. Osaka alone's worth the trip for the street food.", pace: 'mid' },
      { t: 2800, gap_ms: 420, comp: 'tts', highlight: 'C', text: "Or if you'd rather not rush, the slow one leans hard into the onsen all week. Which way are you leaning?", pace: 'mid' },

      /* ===== ⑦ Pick A → straight to itinerary, NO "want a walkthrough?" gate ===== */
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'First one.' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PICK · A → straight to itinerary',
        decision: 'PICK A → lay out the 7 days directly, no confirmation gate. → compose_trip.',
        fields: ['picked:A', 'no-gate', '→compose_trip'] },
      { t: 0, gap_ms: 500, comp: 'tts', text: "Good call — that's the one for a first trip. Laying out the week now.", pace: 'mid' },

      /* ===== ⑧ Itinerary: TravelView 7-day swipe + day-by-day (heroes get the beat) ===== */
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 7 days, swipe',
        decision: 'No overview cover — 7 day cards, swipe. Per-day talk = highlight that card. D4 Hakone/Fuji & D5 Kyoto/Gion are heroes (ace node ★); D1/2/3/6/7 short.',
        fields: ['TravelView·swipe', '7 day cards', 'card_id:jp_plan'] },
      { t: 300, gap_ms: 1200, comp: 'TravelView', card_id: 'jp_plan', visual_state: 'active',
        content: { title: 'The Classic · Japan · 7 days', cards: days() } },
      { t: 1500, gap_ms: 500, comp: 'tts', highlight: 'jp_d1', text: "You land in the afternoon, so day one's loose — drop the bags, wander Asakusa, hit the Shibuya crossing, first proper meal. No agenda.", pace: 'mid' },
      { t: 1900, gap_ms: 500, comp: 'tts', highlight: 'jp_d2', text: "Day two's teamLab in the morning — that's the one you'll be shooting all day — then you graze your way through Shibuya.", pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'jp_d3', text: "Last Tokyo day, early — sushi breakfast at Tsukiji, freshest you'll ever have, then Harajuku for the weird, fun side.", pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'jp_d4', text: "Then the Fuji day. You train out, and partway round the lake there it is, across the water, huge. But it's the evening I'd wait for — you're in the onsen, steam off the water, the mountain right in the window.", pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'jp_d5', text: "Kyoto next. Kimono and the red gates by day, but save yourselves for dusk in Gion — lanterns come on, old stone streets, the two of you dressed up.", pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'jp_d6', text: "Day six eases off on purpose — bamboo grove early before the crowds, then just drift the temples.", pace: 'mid' },
      { t: 0, gap_ms: 500, comp: 'tts', highlight: 'jp_d7', text: "Last day's Osaka — Dotonbori, eat everything you missed, then an easy afternoon flight out.", pace: 'mid' },

      /* ===== ⑨ Summary after the last day + soft ask (not a confirmation gate) ===== */
      { t: 400, gap_ms: 500, comp: 'tts', text: "So that's the week — ease into Tokyo, wind down through Kyoto, finish eating in Osaka. The two to look forward to are the Fuji night and the Gion evening. Have a look — change anything any time.", pace: 'mid' },

      /* ===== ⑩ Not-satisfied branch: cut Tokyo → Fuji extra night, same card_id re-render ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: 'Three days in Tokyo feels like a lot for us.', travel_back: true },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'REVISE · cut Tokyo, add Fuji night',
        decision: 'REVISE: Tokyo → 2 days (market + teamLab same day), Fuji gets the extra lake night (D3 arrive, D4 full onsen day). Same card_id re-render, no badge.',
        fields: ['Tokyo→2 / Fuji+1', 'same card_id', 'no-self-report'] },
      { t: 600, gap_ms: 400, comp: 'toast', text: 'Updating…', state: 'processing', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1100, comp: 'TravelView', card_id: 'jp_plan', visual_state: 'active',
        content: { title: 'The Classic · Japan · 7 days', cards: days(JP_DAYS_FUJI) } },
      { t: 0, gap_ms: 700, comp: 'tts', highlight: 'jp_d3', text: "There — Tokyo's two days, and Fuji gets the extra night. You arrive slow by the lake, with the whole next day for it. Anything else to tweak, or want it on your calendar?", pace: 'mid' },

      /* ===== ⑪ Wrap-up: NOTICE → calendar conflict → add (ListCard · list_events), no ResultCard ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: "That's it, lock it in — put it on my calendar.", travel_back: true },
      { t: 300, gap_ms: 400, comp: 'tts', notice: true, text: "On it — let me check your calendar.", pace: 'mid' },
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SETTLE · check calendar + add days',
        decision: 'Read calendar: Fri morning call → flight bumped to PM (real conflict). Drop 7 days in as a day card. No prices, no hotel button.',
        fields: ['calendar conflict', 'flight→PM', 'list_events', 'no-price no-book'] },
      { t: 300, gap_ms: 400, comp: 'toast', text: 'Checking…', state: 'reading', dismiss_on: 'card' },
      { t: 700, gap_ms: 500, comp: 'tts', text: "Hold up — you've got that morning call Friday, so I'd push the flight to the afternoon. Cool?", pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: 'Good.' },
      { t: 300, gap_ms: 400, comp: 'toast', text: 'Added', state: 'done', dismiss_on: 'card' },
      { t: 700, gap_ms: 900, comp: 'ListCard', card_id: 'jp_schedule', visual_state: 'done',
        content: {
          source_tool_name: 'list_events',
          title: 'Added to calendar',
          rows: [
            { id: 'call_clear', title: 'Morning call (kept) · flight moved to PM', sub: 'Was clashing with the flight · cleared it', lead: '09:30',
              raw_start: '2026-06-12T09:30:00+09:00', raw_end: '2026-06-12T10:00:00+09:00', event_date: '2026-06-12', event_start_sort: 570 },
            { id: 'jp_e1', title: 'Japan D1 · Tokyo · land & ease in', sub: 'PM flight in · Asakusa + Shibuya, first meal', lead: '14:00',
              raw_start: '2026-06-12T14:00:00+09:00', raw_end: '2026-06-12T21:00:00+09:00', event_date: '2026-06-12', event_start_sort: 840 },
            { id: 'jp_e2', title: 'Japan D2 · Tokyo · teamLab + market', sub: 'Sushi breakfast · teamLab · Shibuya eats', lead: '08:00',
              raw_start: '2026-06-13T08:00:00+09:00', raw_end: '2026-06-13T20:00:00+09:00', event_date: '2026-06-13', event_start_sort: 480 },
            { id: 'jp_e3', title: 'Japan D3 · Hakone · arrive at the lake', sub: 'Train out · lakeside, first night soak', lead: '11:00',
              raw_start: '2026-06-14T11:00:00+09:00', raw_end: '2026-06-14T20:00:00+09:00', event_date: '2026-06-14', event_start_sort: 660 },
            { id: 'jp_e4', title: 'Japan D4 · Hakone · onsen under Fuji', sub: 'Lake day · onsen + kaiseki evening', lead: '10:00',
              raw_start: '2026-06-15T10:00:00+09:00', raw_end: '2026-06-15T21:00:00+09:00', event_date: '2026-06-15', event_start_sort: 600 },
            { id: 'jp_e5', title: 'Japan D5 · Kyoto · kimono + Gion night', sub: 'Kimono · Fushimi Inari · Gion at dusk', lead: '09:30',
              raw_start: '2026-06-16T09:30:00+09:00', raw_end: '2026-06-16T21:00:00+09:00', event_date: '2026-06-16', event_start_sort: 570 },
            { id: 'jp_e6', title: 'Japan D6 · Kyoto · Arashiyama', sub: 'Bamboo grove early · temples, slow', lead: '08:30',
              raw_start: '2026-06-17T08:30:00+09:00', raw_end: '2026-06-17T17:00:00+09:00', event_date: '2026-06-17', event_start_sort: 510 },
            { id: 'jp_e7', title: 'Japan D7 · Osaka · Dotonbori + fly out', sub: 'Dotonbori eats · then the airport', lead: '10:00',
              raw_start: '2026-06-18T10:00:00+09:00', raw_end: '2026-06-18T18:00:00+09:00', event_date: '2026-06-18', event_start_sort: 600 }
          ],
          footer: '<span class="lbl">Calendar</span> Seven days dropped in, swipe by day'
        } },
      { t: 1600, gap_ms: 500, comp: 'tts', text: "Right, it's all in. Flight's in the afternoon now, so your morning call's safe. One thing for the Fuji day — pack a layer each, the lake gets windy at dusk.", pace: 'mid' }
    ],
    annotations: []
  };
})(window);
