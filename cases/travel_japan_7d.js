/* Japan 7 Days · Couple (food + photo) —— mirrors the Dali v4 solo case 1:1 (13-node chain), Japan content.
   TTS lifted from travel_japan_7d_EN.md (lightly tightened), pulled up to Dali's finished bar where the MD draft conflicted.
   Capability boundary (hard floor, same as Dali):
     - NO prices / room rates / budgets / ¥ / $ anywhere.
     - Don't name rental shops (say "grab a bike / rent kimonos", not a store name).
     - Ryokan / spot names are real web-search hits; distance / duration / weather / calendar conflict are fair game.
     - No self-report on the card (no "I saved / ✓ adjusted" badges) — show it in the result.
   Design decisions carried from Dali (override the MD draft where they differ):
     · Clarify = ClarifyCard·understand, display-only (NO tappable chips — voice product). known + guess, no lead. Asking is all TTS.
     · Plans   = InspoFlow 3 equal big photos (A rec★ / B / C). All three carry tags + punchline. echo only empathises.
     · Plan    = TravelView 7-day horizontal carousel — NO separate overview cover. Day cards swipe; per-day talk via highlight.
                 D4 (Hakone/Fuji) & D5 (Kyoto/Gion) are heroes: rich nodes, ace node gets highlight+star. D1/2/3/6/7 are filler: short.
     · Not-satisfied → same card_id 'jp_plan' re-render: Tokyo 2 days, Fuji gets the extra night. pace+title shows the change, no badge.
     · Wrap-up = calendar day card (ListCard · list_events), NOT a ResultCard. Morning-call conflict → flight bumped to afternoon.
                 Dates: today 2026-06-05, fly out next Friday 2026-06-12; 7 days = 06-12 .. 06-18. No hotel-book button (no such capability).
   Photos are real Wikimedia Commons hits saved to assets/travel/jp_*.jpg. Hakone/Fuji day reuses jp_fuji_lake (lakeside Fuji is its hero). */
(function (g) {
  g.LOONA_CASES = g.LOONA_CASES || {};

  /* 7-day plan (initial). day row fields mirror Dali:
     id/day/place/tag/thumb (carousel meta) + label/pace/photo/theme/transport/total/nodes/footer (detail card).
     node fields: time/place/note + transport_to_next/distance_to_next/duration_to_next (folded into note tail) + highlight/star. */
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
     pace + titles show the change (D2 now teamLab+market combined; D3 becomes Fuji arrival, D4 stays the onsen hero with an extra lake night).
     No "✓ adjusted" badge — shorter Tokyo + extra Fuji night carries it. */
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

  g.LOONA_CASES['travel_japan_7d'] = {
    task_id: 'travel_japan_7d', title: 'Japan 7 Days · Couple (food+photo) · V3', scene: 'travel', default_skin: 'glass', lang: 'en',
    decision_record: { request_type: 'task', primary_need: 'plan a 7-day Japan trip', granularity: 'by_segment', evidence_level: 'E1', action_risk: 'R0', output_mode: 'document', tool_plan: 'query', confirmation_required: false },
    events: [
      /* ===== (1) Open request ===== */
      { t: 0, gap_ms: 0, comp: 'user_query', text: "We're thinking Japan, about a week. First time. Got any ideas?" },
      { t: 250, gap_ms: 300, comp: 'agent_step', internal: true, label: 'ROUTER · take request',
        decision: 'Known: Japan, ~7 days. Missing: who / firm length / vibe / must-sees. Open ask → give directions + ask who & how long; vibe/must-sees asked next by voice. No budget (web search only, cannot price).',
        fields: ['scene:travel', 'missing: who/length/vibe', 'no-budget'] },

      /* ===== (2) Clarify 1: give directions + ask who/how long ===== */
      { t: 600, gap_ms: 600, comp: 'tts', text: "Japan, nice. First time's the fun one. You can do the classic Tokyo-Kyoto run, or lean foodie, or slow it down with some hot springs. How many of you going, and is a week firm?", pace: 'mid' },

      /* ===== (3) User answers → Loona locks the shape ===== */
      { t: 0, gap_ms: 700, comp: 'user_query', text: 'Just the two of us, seven days works.' },
      { t: 300, gap_ms: 500, comp: 'tts', text: "Cool, seven days. When are you flying out, roughly? I'll glance at the weather for those dates. Couple things to nail down first.", pace: 'mid' },

      /* ===== (4) Clarify card (ClarifyCard · understand, display-only) — no tappable chips =====
         Voice product: the card just shows what I've got. known = couple / Japan / 7 days (facts);
         guess = food / photography / first-timer (from the picture). Asking happens in TTS, the user answers by voice. */
      { t: 0, gap_ms: 400, comp: 'agent_step', internal: true, label: 'CLARIFY · show understanding (display-only)',
        decision: 'No tappable chips — voice product asks, it does not make you tap. One understanding card shows known + guess (guess highlighted); vibe/preference asked by voice.',
        fields: ['ClarifyCard·understand', 'no-chip no-skip', 'card_id:clarify_jp'] },
      { t: 400, gap_ms: 800, comp: 'ClarifyCard', card_id: 'clarify_jp', wait_for_user: true,
        tts: { text: "So — you want the big-city buzz, or slow it down somewhere too? And anything you've gotta see, or do I pick? The food and photo stops I'll work in either way.", pace: 'mid' },
        content: {
          title: 'Japan 7-Day Trip',
          understand: {
            known: ['the two of you', 'Japan', '7 days', 'first time'],
            memory: ['travel to eat', 'into photography', 'skip tourist traps']
          }
        } },
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'Bit of both. Fuji for sure. You pick the rest.' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · complete',
        decision: 'Core inputs in: couple / 7 days / mix buzz+slow / must-see Fuji / pick rest + food&photo. → plans: three equal cards, A is the pick, no spoilers.', fields: ['complete', '3 plans', 'rec:A'] },

      /* ===== (6) Plan cards: InspoFlow 3 equal big photos, A rec★ =====
         echo only empathises (no selling); each card has tags + a punchline in a different cadence; no dusk spoiler. */
      { t: 600, gap_ms: 400, comp: 'toast', text: 'Searching…', state: 'searching', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1200, comp: 'InspoFlow', card_id: 'jp_plans', visual_state: 'active',
        content: {
          echo: "First time, into food and photos — here's three",
          cards: [
            { id: 'A', rec: true, title: 'The Classic, done right', photo: 'assets/travel/jp_fuji_lake.jpg',
              tags: ['iconic', 'food', 'photo'],
              punchline: 'Tokyo, a night under Fuji, then Kyoto — routed around the tourist traps' },
            { id: 'B', title: 'Food Crawl', photo: 'assets/travel/jp_osaka_dotonbori.jpg',
              tags: ['street eats', 'Osaka', 'late nights'],
              punchline: 'Tokyo to Osaka, eat your way down the country' },
            { id: 'C', title: 'Slow & Onsen', photo: 'assets/travel/jp_teamlab.jpg',
              tags: ['hot springs', 'Kyoto', 'unwind'],
              punchline: 'Less ground, more soaking — Hakone and Kyoto, taken slow' }
          ]
        } },
      { t: 2200, gap_ms: 500, comp: 'tts', highlight: 'A', text: "My honest pick? The classic loop. It skips the tourist-trap stuff, so a first trip doesn't feel like a checklist.", pace: 'mid' },
      { t: 2700, gap_ms: 420, comp: 'tts', highlight: 'B', text: "Mostly here to eat? Then the food crawl's your one. Osaka alone's worth the trip for the street food.", pace: 'mid' },
      { t: 3100, gap_ms: 420, comp: 'tts', highlight: 'C', text: "Or if you'd rather not rush, the slow one leans hard into the onsen — soak, eat, nap, repeat. Which way are you leaning?", pace: 'mid' },

      /* ===== (7) User picks → offer the walkthrough ===== */
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'First one.' },
      { t: 300, gap_ms: 400, comp: 'tts', highlight: 'A', text: 'Good call. Want me to run you through the whole week, day by day?', pace: 'mid' },

      /* ===== (8) Plan card: TravelView 7-day horizontal carousel (no overview cover) =====
         Comes out as day cards you swipe; per-day talk = highlight that card. D4/D5 are the heroes. Same card_id 'jp_plan' for the re-render. */
      { t: 0, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · 7 days, swipe',
        decision: 'No overview cover — seven day cards, swipe across. Per-day talk = highlight that card; D4 Hakone/Fuji & D5 Kyoto/Gion are the heroes (ace node ★).',
        fields: ['TravelView·swipe', '7 day cards', 'highlight focus', 'card_id:jp_plan'] },
      { t: 300, gap_ms: 1200, comp: 'TravelView', card_id: 'jp_plan', visual_state: 'active',
        content: { title: 'The Classic · Japan · 7 days', cards: days() } },
      { t: 1500, gap_ms: 500, comp: 'tts', text: "It's all here, swipe through whenever. Stop me on anything.", pace: 'mid' },

      /* ===== (9) SUMMARY — whole week in one breath, filler folded, two hero days flagged (no spoiler, no Day-N enumeration) ===== */
      { t: 0, gap_ms: 900, comp: 'tts', text: "Honestly, three easy beats. First few days you ease into Tokyo — food, photos, no rush. Then it winds down through Kyoto. You finish in Osaka, eating everything. The two to look forward to: the Fuji night and the Kyoto evening. Let me walk you through those.", pace: 'mid' },

      /* ===== (10) SPOTLIGHT · Fuji hero day (highlight jp_d4) — concrete, human, the onsen-under-Fuji evening ===== */
      { t: 0, gap_ms: 900, comp: 'tts', highlight: 'jp_d4', text: "So the Fuji day. You train out, and partway round the lake — there it is, across the water. Huge. But it's the evening I'd wait for. You're in the onsen, steam off the water, Fuji right in the window. Just you two and the mountain.", pace: 'mid' },

      /* ===== (11) SPOTLIGHT · Kyoto/Gion hero day (highlight jp_d5) — concrete, human, kimono + lanterns at dusk ===== */
      { t: 0, gap_ms: 900, comp: 'tts', highlight: 'jp_d5', text: "Then Kyoto. Do the gates and the kimono by day — but save yourselves for dusk in Gion. The lanterns come on. Old stone streets, the two of you dressed up. It's the kind of evening you slow right down for. That's the week — how's it sound?", pace: 'mid' },

      /* ===== (16) Not-satisfied branch: acknowledge → re-render same card_id ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: 'Three days in Tokyo feels like a lot for us.', travel_back: true },
      { t: 300, gap_ms: 400, comp: 'tts', text: "Fair — sounds like two days is plenty. Want me to cut Tokyo and give that day back to Fuji, stay an extra night by the lake?", pace: 'mid' },
      { t: 0, gap_ms: 800, comp: 'user_query', text: 'Yeah, do that.' },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'PLANNER · cut Tokyo, add Fuji night',
        decision: 'Took the feedback: Tokyo → 2 days (market + teamLab same day), Fuji gets an extra lake night (D3 arrive, D4 the full onsen day). Shorter Tokyo + extra Fuji night carries it — no ✓ badge. Same card_id re-render.',
        fields: ['took feedback', 'Tokyo→2 / Fuji+1', 'same card_id'] },
      { t: 600, gap_ms: 400, comp: 'toast', text: 'Updating…', state: 'processing', dismiss_on: 'card' },
      { t: 1000, gap_ms: 1100, comp: 'TravelView', card_id: 'jp_plan', visual_state: 'active',
        content: { title: 'The Classic · Japan · 7 days', cards: days(JP_DAYS_FUJI) } },
      { t: 0, gap_ms: 700, comp: 'tts', highlight: 'jp_d3', text: "There. Tokyo's two days now, and Fuji gets the extra night. You arrive slow by the lake, with the whole next day for it. Better?", pace: 'mid' },

      /* ===== (17) Wrap-up: calendar conflict → add to calendar (ListCard · list_events), NO ResultCard ===== */
      { t: 0, gap_ms: 900, comp: 'user_query', text: 'Yeah, lock it in. We fly out next Friday — put it on my calendar.', travel_back: true },
      { t: 300, gap_ms: 300, comp: 'agent_step', internal: true, label: 'SETTLE · check calendar + add days',
        decision: 'Read calendar: next Friday morning has a call → flight bumped to the afternoon (real conflict). Drop the 7 days into the calendar as a day card. No prices, no hotel button (no booking capability).',
        fields: ['calendar conflict', 'flight→PM', 'list_events', 'no-price no-book'] },
      { t: 600, gap_ms: 400, comp: 'toast', text: 'Checking…', state: 'reading', dismiss_on: 'card' },
      { t: 1000, gap_ms: 500, comp: 'tts', text: "Hold up — you've got that morning call next Friday, so I'd bump the flight to the afternoon. Good?", pace: 'mid' },
      { t: 0, gap_ms: 700, comp: 'user_query', text: 'Good.' },
      { t: 300, gap_ms: 400, comp: 'toast', text: 'Added', state: 'done', dismiss_on: 'card' },
      { t: 700, gap_ms: 900, comp: 'ListCard', card_id: 'jp_schedule', visual_state: 'done',
        content: {
          source_tool_name: 'list_events',
          title: 'Added to calendar',
          rows: [
            { id: 'call_clear', title: 'Morning call (kept) · flight moved to PM', sub: 'Was clashing with the flight · cleared it', lead: '09:30',
              raw_start: '2026-06-12T09:30:00+09:00', raw_end: '2026-06-12T10:00:00+09:00', event_date: '2026-06-12', event_start_sort: 570, badge: { text: 'P2', kind: 'p2' } },
            { id: 'jp_e1', title: 'Japan D1 · Tokyo · land & ease in', sub: 'PM flight in · Asakusa + Shibuya, first meal', lead: '14:00',
              raw_start: '2026-06-12T14:00:00+09:00', raw_end: '2026-06-12T21:00:00+09:00', event_date: '2026-06-12', event_start_sort: 840, badge: { text: 'P1', kind: 'p1' } },
            { id: 'jp_e2', title: 'Japan D2 · Tokyo · teamLab + market', sub: 'Sushi breakfast · teamLab · Shibuya eats', lead: '08:00',
              raw_start: '2026-06-13T08:00:00+09:00', raw_end: '2026-06-13T20:00:00+09:00', event_date: '2026-06-13', event_start_sort: 480, badge: { text: 'P1', kind: 'p1' } },
            { id: 'jp_e3', title: 'Japan D3 · Hakone · arrive at the lake', sub: 'Train out · lakeside, first night soak', lead: '11:00',
              raw_start: '2026-06-14T11:00:00+09:00', raw_end: '2026-06-14T20:00:00+09:00', event_date: '2026-06-14', event_start_sort: 660, badge: { text: 'P1', kind: 'p1' } },
            { id: 'jp_e4', title: 'Japan D4 · Hakone · onsen under Fuji', sub: 'Lake day · onsen + kaiseki evening', lead: '10:00',
              raw_start: '2026-06-15T10:00:00+09:00', raw_end: '2026-06-15T21:00:00+09:00', event_date: '2026-06-15', event_start_sort: 600, badge: { text: 'P1', kind: 'p1' } },
            { id: 'jp_e5', title: 'Japan D5 · Kyoto · kimono + Gion night', sub: 'Kimono · Fushimi Inari · Gion at dusk', lead: '09:30',
              raw_start: '2026-06-16T09:30:00+09:00', raw_end: '2026-06-16T21:00:00+09:00', event_date: '2026-06-16', event_start_sort: 570, badge: { text: 'P1', kind: 'p1' } },
            { id: 'jp_e6', title: 'Japan D6 · Kyoto · Arashiyama', sub: 'Bamboo grove early · temples, slow', lead: '08:30',
              raw_start: '2026-06-17T08:30:00+09:00', raw_end: '2026-06-17T17:00:00+09:00', event_date: '2026-06-17', event_start_sort: 510, badge: { text: 'P2', kind: 'p2' } },
            { id: 'jp_e7', title: 'Japan D7 · Osaka · Dotonbori + fly out', sub: 'Dotonbori eats · then the airport', lead: '10:00',
              raw_start: '2026-06-18T10:00:00+09:00', raw_end: '2026-06-18T18:00:00+09:00', event_date: '2026-06-18', event_start_sort: 600, badge: { text: 'P1', kind: 'p1' } }
          ],
          footer: '<span class="lbl">Calendar</span> Seven days dropped in, swipe by day'
        } },
      { t: 1600, gap_ms: 500, comp: 'tts', text: "Right, it's all in your calendar. The flight's in the afternoon now, so your morning call's safe. One thing for the Fuji day — pack a layer each. The lake gets windy at dusk, and it's nicer if you can sit out a while.", pace: 'mid' }
    ],
    annotations: []
  };
})(window);
