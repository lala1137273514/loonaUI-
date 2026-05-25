/* ============================================================
   scenario-forms.js — skin-aware builders for Weather / Travel / Restaurant
   Branches on current skin:
     aura  → IMMERSIVE (reuses .nfi-* classes from news-forms.css)
     else  → delegates to existing card builders
   Every builder's return value (both branches) carries class "scenario-form"
   so the engine re-renders on skin switch (matches .scenario-form selector).
   ============================================================ */
(function (global) {
  'use strict';

  /* ---- helpers ---- */
  function currentSkin() {
    var s = document.querySelector('.loona-stage');
    return (s && s.getAttribute('data-skin')) || 'glass';
  }
  /* Use LoonaUI utilities (loaded before this file) */
  function U() { return global.LoonaUI; }

  /* ============================================================
     WeatherView
     AURA  → .nf-imm-focus-wrap style, CSS-gradient sky (no photo),
             headline big, horizontal day-chip strip.
     else  → subjectCard fallback
     ============================================================ */
  function weatherView(c) {
    c = c || {};
    var skin = currentSkin();
    var ui = U();
    if (skin === 'aura') {
      return weatherImmersive(c, ui);
    } else {
      var n = ui.subjectCard(c);
      n.classList.add('scenario-form');
      return n;
    }
  }

  function weatherImmersive(c, ui) {
    var el = ui.el, esc = ui.esc, badge = ui.badge;

    /* Root: reuse focus-wrap layout so nf-imm-focus-wrap rules apply */
    var wrap = el('div', 'scenario-form nf-imm-focus-wrap wx-imm-wrap');

    /* Cover card: gradient sky background */
    var cover = el('div', 'nfi-cover nfi-focus wx-sky');

    /* Scrim for text legibility */
    cover.appendChild(el('div', 'nfi-scrim'));

    /* Overlay */
    var ov = el('div', 'nfi-overlay wx-overlay');

    /* Badge (high-confidence etc.) */
    if (c.badge) {
      var bd = badge(c.badge.text, c.badge.kind);
      bd.classList.add('nfi-badge');
      ov.appendChild(bd);
    }

    /* Headline — big */
    if (c.headline) {
      ov.appendChild(el('div', 'nfi-title wx-headline', esc(c.headline)));
    }

    /* Day chips strip */
    if (c.rows && c.rows.length) {
      var strip = el('div', 'wx-day-strip');
      c.rows.forEach(function (row) {
        var chip = el('div', 'wx-chip');
        if (row.id) chip.dataset.rowId = row.id;
        chip.appendChild(el('span', 'wx-chip-lead', esc(row.lead || '')));
        chip.appendChild(el('span', 'wx-chip-temp', esc(row.title || '')));
        if (row.badge) {
          chip.appendChild(badge(row.badge.text, row.badge.kind));
        }
        strip.appendChild(chip);
      });
      ov.appendChild(strip);
    }

    /* Footer / meta */
    if (c.footer) {
      var meta = el('div', 'nfi-meta wx-meta');
      meta.innerHTML = typeof c.footer === 'string' ? c.footer : esc(String(c.footer));
      ov.appendChild(meta);
    }

    cover.appendChild(ov);
    wrap.appendChild(cover);
    return wrap;
  }

  /* ============================================================
     TravelView
     AURA  → .nf-imm-list carousel, 3 covers (one per day).
     else  → sectionCard fallback
     ============================================================ */
  var TRAVEL_IMAGES = [
    'assets/travel/bund.jpg',
    'assets/travel/westbund.jpg',
    'assets/travel/tianzifang.jpg'
  ];

  function travelView(c) {
    c = c || {};
    var skin = currentSkin();
    var ui = U();
    if (skin === 'aura') {
      return travelImmersive(c, ui);
    } else {
      var n = ui.sectionCard(c);
      n.classList.add('scenario-form');
      return n;
    }
  }

  function travelImmersive(c, ui) {
    var el = ui.el, esc = ui.esc, badge = ui.badge;

    var wrap = el('div', 'scenario-form nf-imm-list tv-imm-wrap');
    var track = el('div', 'nfi-track');

    (c.sections || []).forEach(function (sec, i) {
      var cover = el('div', 'nfi-cover');
      if (sec.id) cover.dataset.rowId = sec.id;

      /* Photo */
      var imgSrc = TRAVEL_IMAGES[i] || TRAVEL_IMAGES[0];
      var img = el('img');
      img.src = imgSrc;
      img.alt = esc(sec.label || '');
      img.draggable = false;
      cover.appendChild(img);

      /* Scrim */
      cover.appendChild(el('div', 'nfi-scrim'));

      /* Overlay */
      var ov = el('div', 'nfi-overlay');

      /* Badge (pace: 轻松/适中) */
      if (sec.badge) {
        var bd = badge(sec.badge.text, sec.badge.kind);
        bd.classList.add('nfi-badge');
        ov.appendChild(bd);
      }

      /* Label as title */
      ov.appendChild(el('div', 'nfi-title', esc(sec.label || '')));

      /* Text as summary */
      if (sec.text) {
        ov.appendChild(el('div', 'nfi-summary', esc(sec.text)));
      }

      cover.appendChild(ov);
      track.appendChild(cover);
    });

    wrap.appendChild(track);
    return wrap;
  }

  /* ============================================================
     TravelDayFocus —— 单日钻取聚焦（像新闻 list→focus 召回单卡）
     照片 banner + 上午/下午/傍晚 时段行 + 体力脚注。基于 pop_large，皮肤自适配。
     ============================================================ */
  function travelDayFocus(c) {
    c = c || {};
    var ui = U(), el = ui.el, esc = ui.esc;
    var body = el('div', 'tv-focus-dense');   // 横排：左图 + 右(上午/下午/傍晚)，像新闻聚焦，3 段全见不滚
    if (c.photo) {
      var media = el('div', 'tv-focus-media');
      var im = el('img'); im.src = c.photo; im.alt = esc(c.title || ''); im.draggable = false;
      media.appendChild(im); body.appendChild(media);
    }
    var nodes = el('div', 'tv-focus-nodes');
    (c.nodes || []).forEach(function (n) {
      nodes.appendChild(ui.lcRow({ lead: n.time, title: n.place, sub: n.note }));
    });
    body.appendChild(nodes);
    var card = ui.popLargeCard({
      icon: ui.kindBadge('travel'),
      title: c.title || '当天计划',
      titleExtra: c.badge ? ui.badge(c.badge.text, c.badge.kind) : null,
      body: body,
      footer: c.footer != null ? el('div', null, c.footer) : null,   // 节点形式，保留 <span class=lbl> 渲染（字符串会被转义）
      state: c.state || c.visual_state
    });
    card.classList.add('scenario-form', 'travel-focus-wrap');
    return card;
  }

  /* ============================================================
     RestaurantView
     AURA  → .nf-imm-focus-wrap single full cover with restaurant photo.
     else  → subjectCard fallback
     ============================================================ */
  function restaurantView(c) {
    c = c || {};
    var skin = currentSkin();
    var ui = U();
    if (skin === 'aura') {
      return restaurantImmersive(c, ui);
    } else {
      var n = ui.subjectCard(c);
      n.classList.add('scenario-form');
      return n;
    }
  }

  function restaurantImmersive(c, ui) {
    var el = ui.el, esc = ui.esc, badge = ui.badge;

    var wrap = el('div', 'scenario-form nf-imm-focus-wrap rst-imm-wrap');

    var cover = el('div', 'nfi-cover nfi-focus');

    /* Photo */
    var img = el('img');
    img.src = 'assets/restaurant/place.jpg';
    img.alt = esc(c.title || '');
    img.draggable = false;
    cover.appendChild(img);

    /* Scrim */
    cover.appendChild(el('div', 'nfi-scrim'));

    /* Overlay */
    var ov = el('div', 'nfi-overlay');

    /* Scenario fit badge */
    if (c.badge) {
      var bd = badge(c.badge.text, c.badge.kind);
      bd.classList.add('nfi-badge');
      ov.appendChild(bd);
    }

    /* Name as title */
    ov.appendChild(el('div', 'nfi-title', esc(c.title || '')));

    /* Reason/headline as summary */
    if (c.headline) {
      ov.appendChild(el('div', 'nfi-summary', esc(c.headline)));
    }

    /* distance · price as meta */
    var metaParts = [];
    if (c.meta) {
      metaParts.push(esc(c.meta));
    } else {
      if (c.distance) metaParts.push(esc(c.distance));
      if (c.price_band) metaParts.push(esc(c.price_band));
    }
    /* Tags as inline badges */
    var metaEl = el('div', 'nfi-meta rst-meta-row');
    if (metaParts.length) {
      metaEl.appendChild(el('span', 'rst-dist-price', metaParts.join(' · ')));
    }
    if (c.tags && c.tags.length) {
      c.tags.forEach(function (t) {
        metaEl.appendChild(badge(t, 'amber'));
      });
    }
    ov.appendChild(metaEl);

    cover.appendChild(ov);
    wrap.appendChild(cover);
    return wrap;
  }

  /* ============================================================
     Register builders into the global dispatch
     ============================================================ */
  if (global.LoonaUI) {
    var _U = global.LoonaUI;
    _U.CARD_BUILDERS.WeatherView = weatherView;
    _U.CARD_BUILDERS.TravelView = travelView;
    _U.CARD_BUILDERS.TravelDayFocus = travelDayFocus;
    _U.CARD_BUILDERS.RestaurantView = restaurantView;
  }

})(window);
