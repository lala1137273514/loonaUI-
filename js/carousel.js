(function () {
  function createCarouselController({ panelEl, titleEl, railEl }) {
    let currentCarousel = null;
    let settleTimer = null;
    let onCardClick = null;   // 工作台新增：卡片点击回调（两阶段下钻）；待并回 web_ui

    // 手动左右滑动落定后，自动把最靠中心的卡设为聚焦
    railEl.addEventListener("scroll", function () {
      if (settleTimer) {
        clearTimeout(settleTimer);
      }
      settleTimer = setTimeout(activateCenteredCard, 110);
    });

    function renderCarousel(carousel, opts) {
      currentCarousel = carousel;
      titleEl.textContent = carousel.title || carousel.source_tool_name || "结果";
      railEl.innerHTML = "";
      panelEl.classList.remove("hidden");
      panelEl.classList.toggle("trip-carousel-panel", carousel.source_tool_name === "trip");

      if (carousel.source_tool_name === "list_events" && (carousel.items || []).length) {
        // 日程：按天分组，每天一张「日程卡」(对齐 Figma：多张可左右滑)
        for (const dayCard of buildCalendarDayCards(carousel)) {
          railEl.appendChild(dayCard);
        }
      } else {
        for (const item of carousel.items || []) {
          railEl.appendChild(buildCarouselCard(item));
        }
      }

      // 工作台新增：卡片可点（两阶段下钻）+ 原地翻转过渡；待并回 web_ui
      for (const card of railEl.querySelectorAll(".result-card")) {
        card.style.cursor = "pointer";
        card.addEventListener("click", function () { if (onCardClick) onCardClick(card.dataset.itemIdx, card); });
      }
      if (opts && opts.flip) {
        railEl.classList.remove("flipping");
        void railEl.offsetWidth;                       // 强制 reflow 重启动画
        railEl.classList.add("flipping");
        setTimeout(function () { railEl.classList.remove("flipping"); }, 460);
      }

      // 默认聚焦：后端指定的 active_item_idx，否则第一张（否则全部处于压暗态）
      if (carousel.active_item_idx) {
        focusCarouselItem(carousel.active_item_idx);
      } else {
        const first = railEl.querySelector(".result-card");
        if (first) {
          setActiveCard(first);
          centerCarouselCard(first);   // 工作台新增：变宽的封面卡在初始也居中（窄卡时为 no-op）
        }
      }
    }

    function hideCarousel() {
      currentCarousel = null;
      railEl.innerHTML = "";
      panelEl.classList.add("hidden");
      panelEl.classList.remove("trip-carousel-panel");
    }

    function setActiveCard(card) {
      if (!card) {
        return;
      }
      for (const c of railEl.querySelectorAll(".result-card")) {
        c.classList.toggle("active", c === card);
      }
      tagHero();
    }

    // 工作台新增：把当前聚焦卡的 hero 图打上 view-transition-name，封面↔详情切换时共享元素形变；待并回 web_ui
    function tagHero() {
      const SEL = ".cover-photo,.trip-photo,.inspo-photo,.tov-photo,.dest-photo,.theme-photo";
      for (const h of railEl.querySelectorAll(SEL)) h.style.viewTransitionName = "";
      const act = railEl.querySelector(".result-card.active");
      if (!act) return;
      const hero = act.querySelector(SEL);
      if (hero) hero.style.viewTransitionName = "trip-hero";
    }

    // 播报驱动：后端逐段吐 item_idx → 聚焦并居中对应卡（后端逻辑不变）
    function focusCarouselItem(itemIdx) {
      if (!currentCarousel) {
        return;
      }
      let target = railEl.querySelector(`[data-item-idx="${itemIdx}"]`);
      if (!target) {
        // 日程卡：一张卡含多个事件，找包含该 item_idx 的那张
        const dayCards = railEl.querySelectorAll("[data-item-idxs]");
        for (const c of dayCards) {
          if ((c.getAttribute("data-item-idxs") || "").split(",").indexOf(String(itemIdx)) >= 0) {
            target = c;
            break;
          }
        }
      }
      if (!target) {
        return;
      }
      setActiveCard(target);
      centerCarouselCard(target);
    }

    function centerCarouselCard(target) {
      const railWidth = railEl.clientWidth;
      const targetCenter = target.offsetLeft + target.offsetWidth / 2;
      const nextLeft = Math.max(0, targetCenter - railWidth / 2);
      railEl.scrollTo({ left: nextLeft, behavior: "smooth" });
    }

    function activateCenteredCard() {
      const cards = Array.prototype.slice.call(railEl.querySelectorAll(".result-card"));
      if (!cards.length) {
        return;
      }
      const center = railEl.scrollLeft + railEl.clientWidth / 2;
      let best = cards[0];
      let bestDist = Infinity;
      for (const c of cards) {
        const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      setActiveCard(best);
    }

    // 上一项/下一项：把聚焦移到相邻卡并居中（左右切卡）
    function scrollCarousel(direction) {
      const cards = Array.prototype.slice.call(railEl.querySelectorAll(".result-card"));
      if (!cards.length) {
        return;
      }
      let idx = cards.findIndex(function (c) {
        return c.classList.contains("active");
      });
      if (idx < 0) {
        idx = 0;
      }
      idx = Math.min(cards.length - 1, Math.max(0, idx + direction));
      setActiveCard(cards[idx]);
      centerCarouselCard(cards[idx]);
    }

    return {
      focusCarouselItem,
      hideCarousel,
      renderCarousel,
      scrollCarousel,
      setOnCardClick: function (fn) { onCardClick = fn; },   // 工作台新增
    };
  }

  function buildCarouselCard(item) {
    if (item.kind === "travel-overview") return buildTravelOverviewCard(item);   // C 方案：城市总览 + 每日亮点行
    if (item.kind === "inspo-card") return buildInspoCard(item);                  // B 方案：种草灵感卡
    if (item.kind === "dest-card") return buildDestCard(item);                    // 多目的地对比：候选城市封面（含对比数据）
    if (item.kind === "theme-card") return buildThemeCard(item);                  // 主题玩法：主题封面（含玩法计数）
    if (item.kind === "route") return buildRouteCard(item);                       // 交通路线卡
    if (item.kind === "hotel") return buildHotelCard(item);                       // 酒店住宿卡
    if (item.kind === "budget") return buildBudgetCard(item);                     // 预算花费卡
    if (item.kind === "trip-cover") {       // 工作台新增：旅行阶段封面卡（大图 + tag）
      return buildTripCoverCard(item);
    }
    if (item.kind === "trip") {
      return buildTripCarouselCard(item);
    }
    if (item.kind === "search") {
      return buildSearchCarouselCard(item);
    }
    if (item.kind === "mail") {
      return buildMailCarouselCard(item);
    }
    if (item.kind === "event") {
      return buildEventCarouselCard(item);
    }
    if (item.kind === "weather") {
      return buildWeatherCarouselCard(item);
    }

    const card = document.createElement("article");
    card.className = "result-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `条目 ${item.item_idx}`;

    appendCardPhoto(card, item);
    appendCardKicker(card, item);
    appendCardTitle(card, item);
    appendCardDetail(card, item);
    appendCardNodes(card, item);
    appendCardLink(card, item);
    return card;
  }

  /* ===== 新闻卡（精确对齐 Figma 1104:6679 "card_news"） =====
     hero 照片(琥珀「P·news」标 + 标题) + 摘要正文 + 底部(来源/时间 药丸)
     喂 cortex web_search：title/photo/summary(snippet)/subtitle(source)/meta(time)/link/priority */
  function buildSearchCarouselCard(item) {
    const card = document.createElement("article");
    card.className = "result-card search-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `条目 ${item.item_idx}`;

    appendNewsHeader(card, item);
    appendNewsBody(card, item);
    appendNewsFooter(card, item);
    return card;
  }

  function appendNewsHeader(card, item) {
    const header = document.createElement("div");
    header.className = "news-header";

    if (item.photo) {
      const img = document.createElement("img");
      img.className = "news-photo";
      img.src = item.photo;
      img.alt = item.title || "news";
      header.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "news-photo news-photo-ph";
      header.appendChild(ph);
    }

    const shade = document.createElement("div");
    shade.className = "news-shade";
    header.appendChild(shade);

    const prio = String(item.priority || "").toUpperCase();
    const badge = createTextElement("span", /^P[0-9]$/.test(prio) ? prio + " · news" : "news");
    badge.className = "news-badge";
    header.appendChild(badge);

    const headline = createTextElement("p", item.title || `条目 ${item.item_idx}`);
    headline.className = "news-headline";
    header.appendChild(headline);
    card.appendChild(header);
  }

  function appendNewsBody(card, item) {
    if (!item.summary) return;
    const body = createTextElement("p", item.summary);
    body.className = "news-body";
    card.appendChild(body);
  }

  function appendNewsFooter(card, item) {
    const source = item.subtitle || sourceFromLink(item.link);
    const time = item.meta;
    if (!source && !time) return;

    const footer = document.createElement("div");
    footer.className = "news-footer";
    if (source) {
      const s = createTextElement(item.link ? "a" : "span", "来源:" + source);
      s.className = "news-pill";
      if (item.link) {
        s.href = item.link;
        s.target = "_blank";
        s.rel = "noreferrer";
      }
      footer.appendChild(s);
    }
    if (time) {
      const t = createTextElement("span", time);
      t.className = "news-pill";
      footer.appendChild(t);
    }
    card.appendChild(footer);
  }

  function sourceFromLink(link) {
    if (!link) return "";
    try {
      return new URL(link).hostname.replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  /* ===== 邮件卡（精确对齐 Figma 1202:6951 "mail-card"） =====
     徽章「P · mail」 + 标题(主题) + 「摘要」黄标 + 摘要正文
     喂 cortex mail：title(subject)/summary(preview)/priority */
  function buildMailCarouselCard(item) {
    const card = document.createElement("article");
    card.className = "result-card mail-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `条目 ${item.item_idx}`;

    const prio = String(item.priority || "").toUpperCase();
    const hasPrio = /^P[0-9]$/.test(prio);
    const badge = createTextElement("span", hasPrio ? prio + " · mail" : "mail");
    badge.className = "mail-badge" + (hasPrio ? " mail-prio-" + prio : "");
    card.appendChild(badge);

    const subject = createTextElement("h3", item.title || `条目 ${item.item_idx}`);
    subject.className = "mail-subject";
    card.appendChild(subject);

    // 发件人（item.subtitle = from）
    if (item.subtitle) {
      const from = createTextElement("div", item.subtitle);
      from.className = "mail-from";
      card.appendChild(from);
    }
    // 时间（meta 多为空 → 从 raw.internal_date 取并格式化）
    const time = mailTime(item);
    if (time) {
      const t = createTextElement("div", time);
      t.className = "mail-time";
      card.appendChild(t);
    }

    if (item.summary) {
      const divider = document.createElement("div");
      divider.className = "mail-div";
      card.appendChild(divider);
      const label = createTextElement("div", "摘要");
      label.className = "mail-sum-label";
      card.appendChild(label);
      const text = createTextElement("p", item.summary);
      text.className = "mail-sum-text";
      card.appendChild(text);
    }
    return card;
  }

  /* 邮件时间：meta 优先，否则 raw.internal_date 等；格式化为 YYYY-MM-DD HH:MM */
  function mailTime(item) {
    const raw = item.raw && typeof item.raw === "object" ? item.raw : {};
    const s = item.meta || raw.internal_date || raw.date || raw.sent_at || raw.received_at || "";
    const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    return m ? m[1] + "-" + m[2] + "-" + m[3] + " " + m[4] + ":" + m[5] : String(s || "");
  }

  function appendMailHead(card, item) {
    const head = document.createElement("div");
    head.className = "mail-head";
    head.appendChild(buildResultLabel("邮件", item.priority));
    if (item.meta) {
      const time = createTextElement("span", item.meta);
      time.className = "structured-meta";
      head.appendChild(time);
    }
    card.appendChild(head);

    const title = createTextElement("h3", item.title || `条目 ${item.item_idx}`);
    title.className = "structured-title mail-title";
    card.appendChild(title);

    if (item.subtitle) {
      const sender = createTextElement("p", item.subtitle);
      sender.className = "mail-sender";
      card.appendChild(sender);
    }
  }

  function appendMailBody(card, item) {
    if (!item.summary) {
      return;
    }
    const preview = createTextElement("p", item.summary);
    preview.className = "structured-summary mail-preview";
    card.appendChild(preview);
  }

  function buildEventCarouselCard(item) {
    const card = document.createElement("article");
    card.className = "result-card event-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `条目 ${item.item_idx}`;

    appendEventHead(card, item);
    appendEventBody(card, item);
    appendStructuredCardFooter(card, item, "打开日程");
    return card;
  }

  function appendEventHead(card, item) {
    const head = document.createElement("div");
    head.className = "event-head";
    head.appendChild(buildResultLabel("日程", item.priority));
    if (item.meta) {
      const time = createTextElement("span", item.meta);
      time.className = "event-time";
      head.appendChild(time);
    }
    card.appendChild(head);

    const title = createTextElement("h3", item.title || `条目 ${item.item_idx}`);
    title.className = "structured-title event-title";
    card.appendChild(title);
  }

  function appendEventBody(card, item) {
    const details = document.createElement("div");
    details.className = "event-details";

    if (item.location) {
      const location = createTextElement("span", item.location);
      location.className = "event-location";
      details.appendChild(location);
    }
    if (item.subtitle) {
      const organizer = createTextElement("span", item.subtitle);
      organizer.className = "event-organizer";
      details.appendChild(organizer);
    }
    if (details.childNodes.length) {
      card.appendChild(details);
    }

    if (item.summary) {
      const summary = createTextElement("p", item.summary);
      summary.className = "structured-summary event-summary";
      card.appendChild(summary);
    }
  }

  function buildResultLabel(label, priority) {
    const wrapper = document.createElement("div");
    wrapper.className = "result-label";
    wrapper.appendChild(createTextElement("span", label));
    if (priority) {
      wrapper.appendChild(createTextElement("strong", priority));
    }
    return wrapper;
  }

  function appendStructuredCardFooter(card, item, linkText) {
    if (!item.link) {
      return;
    }
    const footer = document.createElement("div");
    footer.className = "structured-footer";
    const link = createTextElement("a", linkText);
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noreferrer";
    footer.appendChild(link);
    card.appendChild(footer);
  }

  /* ===== 日程卡（精确对齐 Figma 1215:7240）：一天 N 条事件聚合成一张卡 =====
     头(calendar 琥珀标 + 标题 + 日期·N个日程) + 事件行(黄条 + 起止时间 + 标题+优先级 + 地点·组织者)
     喂 cortex list_events：每事件一个 item(title/meta=起-止/location/subtitle=组织者/priority) */
  /* 按日期把事件分组 → 每天一张日程卡（Figma：今日/明日/M.D 日程，横滑切天） */
  function buildCalendarDayCards(carousel) {
    const items = carousel.items || [];
    const groups = {};
    const order = [];
    for (const item of items) {
      const date = calEventDate(item) || "未排期";
      if (!groups[date]) {
        groups[date] = [];
        order.push(date);
      }
      groups[date].push(item);
    }
    order.sort();
    return order.map(function (date, i) {
      return buildCalendarDayCard(date, groups[date], i + 1);
    });
  }

  function buildCalendarDayCard(date, items, dayIdx) {
    const card = document.createElement("article");
    card.className = "result-card cal-card";
    card.dataset.itemIdx = items[0] && items[0].item_idx != null ? items[0].item_idx : dayIdx;
    card.dataset.itemIdxs = items
      .map(function (it) { return it.item_idx; })
      .filter(function (n) { return n != null; })
      .join(",");

    const head = document.createElement("div");
    head.className = "cal-head";
    const badge = createTextElement("span", "calendar");
    badge.className = "cal-badge";
    head.appendChild(badge);
    head.appendChild(createTextElement("h3", calDayLabel(date)));
    const sub = createTextElement("div", (date && date !== "未排期" ? date + " · " : "") + items.length + " 个日程");
    sub.className = "cal-sub";
    head.appendChild(sub);
    card.appendChild(head);

    const list = document.createElement("div");
    list.className = "cal-list";
    for (const item of items) {
      list.appendChild(buildCalendarRow(item));
    }
    card.appendChild(list);
    return card;
  }

  /* 相对今天：今日/明日/昨日日程；否则 M.D 日程 */
  function calDayLabel(date) {
    const parts = String(date || "").split("-");
    if (parts.length !== 3) {
      return "日程安排";
    }
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "今日日程";
    if (diff === 1) return "明日日程";
    if (diff === -1) return "昨日日程";
    return Number(parts[1]) + "." + Number(parts[2]) + "日程";
  }

  function buildCalendarRow(item) {
    const row = document.createElement("div");
    const prio = String(item.priority || "").toUpperCase();
    row.className = "cal-row" + (/^P[0-9]$/.test(prio) ? " cal-prio-" + prio : "");

    const bar = document.createElement("span");
    bar.className = "cal-bar";
    row.appendChild(bar);

    const times = document.createElement("div");
    times.className = "cal-times";
    const se = calStartEnd(item);
    if (se[0]) times.appendChild(createTextElement("span", se[0]));
    if (se[1]) {
      const end = createTextElement("span", se[1]);
      end.className = "cal-time-end";
      times.appendChild(end);
    }
    row.appendChild(times);

    const body = document.createElement("div");
    body.className = "cal-body";
    const titleRow = document.createElement("div");
    titleRow.className = "cal-title-row";
    const title = createTextElement("span", item.title || "未命名日程");
    title.className = "cal-title";
    titleRow.appendChild(title);
    if (/^P[0-9]$/.test(prio)) {
      const pb = createTextElement("span", prio);
      pb.className = "cal-pbadge";
      titleRow.appendChild(pb);
    }
    body.appendChild(titleRow);

    const metaParts = [item.location, item.subtitle].filter(Boolean);
    if (metaParts.length) {
      const meta = createTextElement("div", metaParts.join(" · "));
      meta.className = "cal-meta";
      body.appendChild(meta);
    }
    row.appendChild(body);
    return row;
  }

  /* item.meta = "起 - 止"，抽取 HH:MM；抽不到则取日期片段 */
  function calStartEnd(item) {
    const parts = String(item.meta || "").split(" - ");
    const hm = function (s) {
      const m = String(s || "").match(/(\d{1,2}):(\d{2})/);
      if (m) return (m[1].length < 2 ? "0" + m[1] : m[1]) + ":" + m[2];
      const d = String(s || "").match(/\d{1,2}-\d{1,2}/);
      return d ? d[0] : "";
    };
    return [hm(parts[0]), parts[1] ? hm(parts[1]) : ""];
  }

  function calEventDate(item) {
    if (!item) return "";
    let raw = "";
    try {
      raw = JSON.stringify(item.raw || {});
    } catch (e) {
      raw = "";
    }
    const m = (String(item.meta || "") + " " + raw).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return "";
    return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  }

  /* ===== 天气卡（精确对齐 Figma node 1227:79 "city_forecast · 7day"） =====
     头(国·城内联) → divider → 当前实况面板(图标+大温+状况 / 日出日落) → 逐日行(日期·状况·图标·温区)
     喂 cortex 归一化天气 item.raw{location,current,forecast.forecastday[].{day,astro}} */
  function buildWeatherCarouselCard(item) {
    const card = document.createElement("article");
    card.className = "result-card wx-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `天气 ${item.item_idx}`;

    const raw = item.raw && typeof item.raw === "object" ? item.raw : {};
    const loc = raw.location && typeof raw.location === "object" ? raw.location : {};
    const current = raw.current && typeof raw.current === "object" ? raw.current : {};
    const days = raw.forecast && Array.isArray(raw.forecast.forecastday) ? raw.forecast.forecastday : [];

    appendWeatherHeader(card, item, loc);
    const divider = document.createElement("div");
    divider.className = "wx-div";
    card.appendChild(divider);
    appendWeatherCurrent(card, current, days[0] && days[0].astro);
    if (days.length) {
      appendWeatherDays(card, days);
    } else if (item.summary) {
      const fallback = createTextElement("p", item.summary);
      fallback.className = "wx-fallback";
      card.appendChild(fallback);
    }
    return card;
  }

  /* 头部：「中国 ·」(灰小) + 「上海」(粗白) 同行内联 */
  function appendWeatherHeader(card, item, loc) {
    const head = document.createElement("div");
    head.className = "wx-head";
    const line = document.createElement("div");
    line.className = "wx-headline";
    const country = loc.country;
    if (country) {
      const c = createTextElement("span", country + " ·");
      c.className = "wx-country";
      line.appendChild(c);
    }
    const city = createTextElement("span", item.title || loc.name || "天气");
    city.className = "wx-city";
    line.appendChild(city);
    head.appendChild(line);
    card.appendChild(head);
  }

  /* 当前实况面板：● 当前实况 / [图标 16° 多云]  [日出 日落] */
  function appendWeatherCurrent(card, current, astro) {
    const panel = document.createElement("div");
    panel.className = "wx-cur";

    const label = document.createElement("div");
    label.className = "wx-cur-label";
    const dot = document.createElement("span");
    dot.className = "wx-dot";
    label.appendChild(dot);
    label.appendChild(createTextElement("span", "当前实况"));
    panel.appendChild(label);

    const row = document.createElement("div");
    row.className = "wx-cur-row";

    const left = document.createElement("div");
    left.className = "wx-cur-now";
    const cond = weatherCondition(current.condition);
    const icon = document.createElement("span");
    icon.className = "wx-ic wx-ic-lg";
    icon.innerHTML = WX_ICON[cond.cat] || WX_ICON.cloud;
    left.appendChild(icon);
    const temp = createTextElement("span", isNum(current.tempC) ? Math.round(Number(current.tempC)) + "°" : "—");
    temp.className = "wx-cur-temp";
    left.appendChild(temp);
    const text = createTextElement("span", cond.zh);
    text.className = "wx-cur-cond";
    left.appendChild(text);
    row.appendChild(left);

    const astroObj = astro && typeof astro === "object" ? astro : {};
    if (astroObj.sunrise || astroObj.sunset) {
      const sun = document.createElement("div");
      sun.className = "wx-sun";
      if (astroObj.sunrise) sun.appendChild(createTextElement("span", "日出 " + to24h(astroObj.sunrise)));
      if (astroObj.sunset) sun.appendChild(createTextElement("span", "日落 " + to24h(astroObj.sunset)));
      row.appendChild(sun);
    }
    panel.appendChild(row);
    card.appendChild(panel);
  }

  /* 逐日行：每行浅底药丸 [日期 w76][状况文字 flex][图标][温区 w88] */
  function appendWeatherDays(card, days) {
    const list = document.createElement("div");
    list.className = "wx-days";
    days.slice(0, 7).forEach(function (d, idx) { list.appendChild(buildWeatherDay(d, idx)); });
    card.appendChild(list);
  }

  function buildWeatherDay(d, idx) {
    const row = document.createElement("div");
    row.className = "wx-day";
    const day = d.day && typeof d.day === "object" ? d.day : {};
    const cond = weatherCondition(day.condition);

    const date = createTextElement("span", formatWeatherDate(d.date, idx));
    date.className = "wx-day-date";
    row.appendChild(date);

    const text = createTextElement("span", cond.zh);
    text.className = "wx-day-cond";
    row.appendChild(text);

    const icon = document.createElement("span");
    icon.className = "wx-ic wx-ic-sm";
    icon.innerHTML = WX_ICON[cond.cat] || WX_ICON.cloud;
    row.appendChild(icon);

    const hi = isNum(day.maxtempC) ? Math.round(Number(day.maxtempC)) + "℃" : "—";
    const lo = isNum(day.mintempC) ? Math.round(Number(day.mintempC)) + "℃" : "—";
    const range = createTextElement("span", hi + " / " + lo);
    range.className = "wx-day-range";
    row.appendChild(range);
    return row;
  }

  function isNum(v) { return v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v)); }

  /* "04:47 AM" / "07:36 PM" → "04:47" / "19:36" */
  function to24h(s) {
    const m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return String(s || "").trim();
    let h = Number(m[1]);
    const min = m[2];
    const ap = (m[3] || "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return (h < 10 ? "0" + h : String(h)) + ":" + min;
  }

  /* 彩色天气图标（对齐 Figma WeatherIcons 枚举：金日 / 灰蓝云 / 蓝雨丝） */
  var WX_ICON = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="#f5c24d"/></svg>',
    partly: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.6" r="4.4" fill="#f5c24d"/><path d="M8 19h8.2a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.8-1.1A3.5 3.5 0 0 0 8 19z" fill="#9aa2af"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7 18h9.5a3.6 3.6 0 0 0 .2-7.2 5 5 0 0 0-9.6-1.2A3.8 3.8 0 0 0 7 18z" fill="#9aa2af"/></svg>',
    overcast: '<svg viewBox="0 0 24 24"><path d="M6.5 15.5h8a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.8-1A3.5 3.5 0 0 0 6.5 15.5z" fill="#6f7785"/><path d="M9.5 19.5h8a3.2 3.2 0 0 0 .2-6.4 4.5 4.5 0 0 0-8.6-1A3.4 3.4 0 0 0 9.5 19.5z" fill="#9aa2af"/></svg>',
    rain: '<svg viewBox="0 0 24 24"><path d="M7 14h9a3.5 3.5 0 0 0 .2-7 4.9 4.9 0 0 0-9.4-1.1A3.7 3.7 0 0 0 7 14z" fill="#9aa2af"/><path d="M9 16.5l-1.1 3M12.5 16.5l-1.1 3M16 16.5l-1.1 3" stroke="#5b9bd5" stroke-width="1.7" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 24 24"><path d="M7 14h9a3.5 3.5 0 0 0 .2-7 4.9 4.9 0 0 0-9.4-1.1A3.7 3.7 0 0 0 7 14z" fill="#9aa2af"/><circle cx="9" cy="18" r="1" fill="#dfe7f2"/><circle cx="12.5" cy="19.2" r="1" fill="#dfe7f2"/><circle cx="16" cy="18" r="1" fill="#dfe7f2"/></svg>',
    thunder: '<svg viewBox="0 0 24 24"><path d="M7 14h9a3.5 3.5 0 0 0 .2-7 4.9 4.9 0 0 0-9.4-1.1A3.7 3.7 0 0 0 7 14z" fill="#9aa2af"/><path d="M12.5 14l-2.5 4.2h2.4l-1.6 3.3 4-4.8h-2.3l1.2-2.7z" fill="#f5c24d"/></svg>',
    fog: '<svg viewBox="0 0 24 24" stroke="#9aa2af" stroke-width="1.8" stroke-linecap="round"><path d="M5 9h14M6 13h12M5.5 17h11"/></svg>'
  };

  function weatherCondition(condition) {
    const c = condition && typeof condition === "object" ? condition : {};
    const code = Number(c.code);
    const text = String(c.text || "").toLowerCase();
    const byCode = {
      1000: { cat: "sun", zh: "晴" }, 1003: { cat: "partly", zh: "多云" },
      1006: { cat: "cloud", zh: "阴间多云" }, 1009: { cat: "overcast", zh: "阴" },
      1030: { cat: "fog", zh: "雾" }, 1135: { cat: "fog", zh: "雾" }, 1147: { cat: "fog", zh: "浓雾" },
      1063: { cat: "rain", zh: "小雨" }, 1150: { cat: "rain", zh: "毛毛雨" }, 1153: { cat: "rain", zh: "毛毛雨" },
      1180: { cat: "rain", zh: "小雨" }, 1183: { cat: "rain", zh: "小雨" }, 1186: { cat: "rain", zh: "中雨" },
      1189: { cat: "rain", zh: "中雨" }, 1192: { cat: "rain", zh: "大雨" }, 1195: { cat: "rain", zh: "大雨" },
      1240: { cat: "rain", zh: "阵雨" }, 1243: { cat: "rain", zh: "强阵雨" }, 1246: { cat: "rain", zh: "暴雨" },
      1066: { cat: "snow", zh: "小雪" }, 1210: { cat: "snow", zh: "小雪" }, 1213: { cat: "snow", zh: "小雪" },
      1216: { cat: "snow", zh: "中雪" }, 1219: { cat: "snow", zh: "中雪" }, 1222: { cat: "snow", zh: "大雪" },
      1225: { cat: "snow", zh: "暴雪" }, 1255: { cat: "snow", zh: "小雪" }, 1258: { cat: "snow", zh: "中雪" },
      1087: { cat: "thunder", zh: "雷阵雨" }, 1273: { cat: "thunder", zh: "雷阵雨" }, 1276: { cat: "thunder", zh: "雷雨" },
      1279: { cat: "thunder", zh: "雷雪" }, 1282: { cat: "thunder", zh: "雷雪" }
    };
    if (byCode[code]) return byCode[code];
    if (text.indexOf("thunder") >= 0) return { cat: "thunder", zh: "雷雨" };
    if (text.indexOf("snow") >= 0 || text.indexOf("sleet") >= 0 || text.indexOf("blizzard") >= 0) return { cat: "snow", zh: "雪" };
    if (text.indexOf("rain") >= 0 || text.indexOf("drizzle") >= 0) return { cat: "rain", zh: "有雨" };
    if (text.indexOf("fog") >= 0 || text.indexOf("mist") >= 0) return { cat: "fog", zh: "雾" };
    if (text.indexOf("overcast") >= 0) return { cat: "overcast", zh: "阴" };
    if (text.indexOf("cloud") >= 0) return { cat: "partly", zh: "多云" };
    if (text.indexOf("sun") >= 0 || text.indexOf("clear") >= 0) return { cat: "sun", zh: "晴" };
    return { cat: "cloud", zh: c.text || "—" };
  }

  /* 日期：统一「星期 · M/D」（不再特例 Today） */
  function formatWeatherDate(dateStr) {
    const parts = String(dateStr || "").split("-");
    if (parts.length !== 3) return String(dateStr || "");
    const md = Number(parts[1]) + "/" + Number(parts[2]);
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const wd = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][dt.getDay()] || "";
    return wd ? wd + " · " + md : md;
  }

  /* ===== 旅游卡（精确对齐 Figma 1104:6939 "card_itinerary"） =====
     hero 照片头(Day N·标题 / reminder / 琥珀 pace 药丸) + 节点(地名 —黄线— 时段 / note)
     喂 cortex trip stage：title(label)/subtitle(pace)/photo/reminder/nodes[{time,place,note}] */
  /* ===== 旅行阶段封面卡（工作台新增 · 一阶段总览）=====
     大图铺满 + 底部叠阶段标题 + tag 药丸（pace 区间 / 天数）。点击或语音下钻进二阶段详情。
     喂 item：title(阶段名)/photo/tags[]（或 subtitle 单 tag）。待并回 web_ui。 */
  function buildTripCoverCard(item) {
    const card = document.createElement("article");
    card.className = "result-card trip-cover";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `阶段 ${item.item_idx}`;

    if (item.photo) {
      const img = document.createElement("img");
      img.className = "cover-photo";
      img.src = item.photo;
      img.alt = item.title || "cover";
      card.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "cover-photo cover-photo-ph";
      card.appendChild(ph);
    }
    const shade = document.createElement("div");
    shade.className = "cover-shade";
    card.appendChild(shade);

    // 第一枚 tag（一般是节奏）作左上海报徽标；其余 tag 进底部
    const tags = Array.isArray(item.tags) ? item.tags.slice() : (item.subtitle ? [item.subtitle] : []);
    if (tags.length) {
      const badge = createTextElement("span", tags.shift());
      badge.className = "cover-badge";
      card.appendChild(badge);
    }
    const body = document.createElement("div");
    body.className = "cover-body";
    body.appendChild(createTextElement("h3", item.title || `阶段 ${item.item_idx}`));
    if (item.hook) { const hk = createTextElement("p", item.hook); hk.className = "cover-hook"; body.appendChild(hk); }
    if (tags.length) {
      const row = document.createElement("div");
      row.className = "cover-tags";
      tags.forEach(function (t) { const s = createTextElement("span", t); s.className = "cover-tag"; row.appendChild(s); });
      body.appendChild(row);
    }
    card.appendChild(body);
    return card;
  }

  /* ===== C 方案：城市总览卡（hero + 元信息 tag + 每日亮点行；行可点下钻）。工作台新增 ===== */
  function buildTravelOverviewCard(item) {
    const card = document.createElement("article");
    card.className = "result-card travel-overview";
    card.dataset.itemIdx = item.item_idx;

    const hero = document.createElement("div");
    hero.className = "tov-hero";
    if (item.photo) { const img = document.createElement("img"); img.className = "tov-photo"; img.src = item.photo; img.alt = item.title || "city"; hero.appendChild(img); }
    else { const ph = document.createElement("div"); ph.className = "tov-photo cover-photo-ph"; hero.appendChild(ph); }
    const sh = document.createElement("div"); sh.className = "tov-shade"; hero.appendChild(sh);
    const ht = createTextElement("h3", item.title || "行程总览"); ht.className = "tov-title"; hero.appendChild(ht);
    card.appendChild(hero);

    const tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.length) { const tr = document.createElement("div"); tr.className = "tov-metatags"; tags.forEach(function (t) { const s = createTextElement("span", t); s.className = "tov-metatag"; tr.appendChild(s); }); card.appendChild(tr); }

    const rows = Array.isArray(item.rows) ? item.rows : [];
    const rl = document.createElement("div"); rl.className = "tov-rows";
    rows.forEach(function (r) {
      const row = document.createElement("button"); row.type = "button"; row.className = "tov-row"; row.dataset.id = r.id;
      if (r.thumb) { const ti = document.createElement("img"); ti.className = "tov-thumb"; ti.src = r.thumb; ti.alt = ""; row.appendChild(ti); }
      else { const tp = document.createElement("span"); tp.className = "tov-thumb cover-photo-ph"; row.appendChild(tp); }
      const dy = createTextElement("span", r.day || ""); dy.className = "tov-row-day"; row.appendChild(dy);
      const pl = createTextElement("span", r.place || ""); pl.className = "tov-row-place"; row.appendChild(pl);
      if (r.tag) { const tg = createTextElement("span", r.tag); tg.className = "tov-row-tag"; row.appendChild(tg); }
      const ar = createTextElement("span", "›"); ar.className = "tov-row-arr"; row.appendChild(ar);
      rl.appendChild(row);
    });
    card.appendChild(rl);
    return card;
  }

  /* ===== B 方案：种草灵感卡（大图 + 主题 + tags + 一句强 punchline）。工作台新增 ===== */
  function buildInspoCard(item) {
    const card = document.createElement("article");
    card.className = "result-card inspo-card";
    card.dataset.itemIdx = item.item_idx;
    if (item.photo) { const img = document.createElement("img"); img.className = "inspo-photo"; img.src = item.photo; img.alt = item.title || ""; card.appendChild(img); }
    else { const ph = document.createElement("div"); ph.className = "inspo-photo cover-photo-ph"; card.appendChild(ph); }
    const sh = document.createElement("div"); sh.className = "inspo-shade"; card.appendChild(sh);
    if (item.rec) { const rb = createTextElement("span", "⭐ 我推这个"); rb.className = "inspo-rec"; card.appendChild(rb); }   // 方案主推徽标
    const body = document.createElement("div"); body.className = "inspo-body";
    const ht = createTextElement("h3", item.title || "亮点"); ht.className = "inspo-title"; body.appendChild(ht);
    const tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.length) { const tr = document.createElement("div"); tr.className = "inspo-tags"; tags.forEach(function (t) { const s = createTextElement("span", t); s.className = "inspo-tag"; tr.appendChild(s); }); body.appendChild(tr); }
    if (item.hook) { const p = createTextElement("p", item.hook); p.className = "inspo-punch"; body.appendChild(p); }
    card.appendChild(body);
    return card;
  }

  /* ===== 多目的地对比：候选城市封面卡（大图 + 城市名 + 对比数据条 + 一句为什么）。工作台新增 ===== */
  function buildDestCard(item) {
    const raw = item.raw || {};
    const card = document.createElement("article");
    card.className = "result-card dest-card";
    card.dataset.itemIdx = item.item_idx;
    if (item.photo) { const img = document.createElement("img"); img.className = "dest-photo"; img.src = item.photo; img.alt = item.title || ""; card.appendChild(img); }
    else { const ph = document.createElement("div"); ph.className = "dest-photo cover-photo-ph"; card.appendChild(ph); }
    const sh = document.createElement("div"); sh.className = "dest-shade"; card.appendChild(sh);
    if (item.rec) { const rb = createTextElement("span", "⭐ 我偏这个"); rb.className = "dest-rec"; card.appendChild(rb); }
    const body = document.createElement("div"); body.className = "dest-body";
    body.appendChild(Object.assign(createTextElement("h3", item.title || "候选地"), { className: "dest-title" }));
    const stats = Array.isArray(raw.stats) ? raw.stats : [];
    if (stats.length) {
      const sr = document.createElement("div"); sr.className = "dest-stats";
      stats.forEach(function (s) {
        const cell = document.createElement("div"); cell.className = "dest-stat";
        cell.appendChild(Object.assign(createTextElement("span", s.v || ""), { className: "dest-stat-v" }));
        cell.appendChild(Object.assign(createTextElement("span", s.k || ""), { className: "dest-stat-k" }));
        sr.appendChild(cell);
      });
      body.appendChild(sr);
    }
    if (item.hook) { const p = createTextElement("p", item.hook); p.className = "dest-why"; body.appendChild(p); }
    card.appendChild(body);
    return card;
  }

  /* ===== 主题玩法：主题封面卡（大图 + 主题名 + 玩法计数 + tags + punchline）。工作台新增 ===== */
  function buildThemeCard(item) {
    const raw = item.raw || {};
    const card = document.createElement("article");
    card.className = "result-card theme-card";
    card.dataset.itemIdx = item.item_idx;
    if (item.photo) { const img = document.createElement("img"); img.className = "theme-photo"; img.src = item.photo; img.alt = item.title || ""; card.appendChild(img); }
    else { const ph = document.createElement("div"); ph.className = "theme-photo cover-photo-ph"; card.appendChild(ph); }
    const sh = document.createElement("div"); sh.className = "theme-shade"; card.appendChild(sh);
    if (raw.count) { const cb = createTextElement("span", raw.count); cb.className = "theme-count"; card.appendChild(cb); }
    if (item.rec) { const rb = createTextElement("span", "⭐ 我推这个"); rb.className = "theme-rec"; card.appendChild(rb); }
    const body = document.createElement("div"); body.className = "theme-body";
    const ht = createTextElement("h3", (raw.icon ? raw.icon + " " : "") + (item.title || "主题")); ht.className = "theme-title"; body.appendChild(ht);
    const tags = Array.isArray(item.tags) ? item.tags : [];
    if (tags.length) { const tr = document.createElement("div"); tr.className = "theme-tags"; tags.forEach(function (t) { const s = createTextElement("span", t); s.className = "theme-tag"; tr.appendChild(s); }); body.appendChild(tr); }
    if (item.hook) { const p = createTextElement("p", item.hook); p.className = "theme-punch"; body.appendChild(p); }
    card.appendChild(body);
    return card;
  }

  /* ===== 交通路线卡：from→to + 交通方式/时长/换乘（复用黄线节点 motif）。工作台新增 ===== */
  function buildRouteCard(item) {
    const r = item.raw || {};
    const card = document.createElement("article");
    card.className = "result-card route-card";
    card.dataset.itemIdx = item.item_idx;
    if (r.scope) { const sc = createTextElement("span", r.scope); sc.className = "route-scope"; card.appendChild(sc); }   // 城际/市内
    const row = document.createElement("div"); row.className = "route-row";
    row.appendChild(Object.assign(createTextElement("span", r.from || ""), { className: "route-place" }));
    const line = document.createElement("span"); line.className = "route-line";
    const ic = createTextElement("span", r.modeIcon || "→"); ic.className = "route-ic"; line.appendChild(ic);
    row.appendChild(line);
    row.appendChild(Object.assign(createTextElement("span", r.to || ""), { className: "route-place route-place-end" }));
    card.appendChild(row);
    const band = [r.mode, r.dur, r.transfers].filter(Boolean).join(" · ");
    if (band) card.appendChild(Object.assign(createTextElement("div", band), { className: "route-band" }));
    const foot = [r.fare, r.note].filter(Boolean).join(" · ");
    if (foot) card.appendChild(Object.assign(createTextElement("p", foot), { className: "route-note" }));
    return card;
  }

  /* ===== 酒店住宿卡：照片 + 名称 + 价位 + 评分 + 区域 + 设施 tag。工作台新增 ===== */
  function buildHotelCard(item) {
    const h = item.raw || {};
    const card = document.createElement("article");
    card.className = "result-card hotel-card";
    card.dataset.itemIdx = item.item_idx;
    const head = document.createElement("div"); head.className = "hotel-head";
    if (item.photo) { const img = document.createElement("img"); img.className = "hotel-photo"; img.src = item.photo; img.alt = item.title || ""; head.appendChild(img); }
    else { const ph = document.createElement("div"); ph.className = "hotel-photo cover-photo-ph"; head.appendChild(ph); }
    const sh = document.createElement("div"); sh.className = "hotel-shade"; head.appendChild(sh);
    if (h.rec) { const rb = createTextElement("span", "⭐ 我订这家"); rb.className = "hotel-rec"; head.appendChild(rb); }
    const ht = createTextElement("h3", item.title || "住宿"); ht.className = "hotel-name"; head.appendChild(ht);
    card.appendChild(head);
    const meta = document.createElement("div"); meta.className = "hotel-meta";
    if (h.price) { const pr = document.createElement("span"); pr.className = "hotel-price"; pr.appendChild(Object.assign(createTextElement("strong", h.price), {})); if (h.priceUnit) pr.appendChild(createTextElement("span", h.priceUnit)); meta.appendChild(pr); }
    if (h.rating) { const rt = createTextElement("span", "★ " + h.rating); rt.className = "hotel-rating"; meta.appendChild(rt); }
    if (h.area) { const ar = createTextElement("span", h.area); ar.className = "hotel-area"; meta.appendChild(ar); }
    card.appendChild(meta);
    const tags = Array.isArray(h.tags) ? h.tags : [];
    if (tags.length) { const tr = document.createElement("div"); tr.className = "hotel-tags"; tags.forEach(function (t) { const s = createTextElement("span", t); s.className = "hotel-tag"; tr.appendChild(s); }); card.appendChild(tr); }
    if (h.note) card.appendChild(Object.assign(createTextElement("p", h.note), { className: "hotel-note" }));
    return card;
  }

  /* ===== 预算花费卡：分项 CSS 条形 + 合计（无图表库）。工作台新增 ===== */
  function buildBudgetCard(item) {
    const b = item.raw || {};
    const card = document.createElement("article");
    card.className = "result-card budget-card";
    card.dataset.itemIdx = item.item_idx;
    const head = document.createElement("div"); head.className = "budget-head";
    head.appendChild(Object.assign(createTextElement("span", b.title || "预算估算"), { className: "budget-title" }));
    if (b.total) { const tot = document.createElement("span"); tot.className = "budget-total"; if (b.currency) tot.appendChild(createTextElement("span", b.currency)); tot.appendChild(createTextElement("strong", b.total)); head.appendChild(tot); }
    card.appendChild(head);
    const items = Array.isArray(b.items) ? b.items : [];
    const max = items.reduce(function (m, x) { return Math.max(m, +x.pct || 0); }, 0) || 100;
    const list = document.createElement("div"); list.className = "budget-rows";
    items.forEach(function (x) {
      const row = document.createElement("div"); row.className = "budget-brow";
      row.appendChild(Object.assign(createTextElement("span", x.label || ""), { className: "budget-label" }));
      const track = document.createElement("div"); track.className = "budget-track";
      const bar = document.createElement("div"); bar.className = "budget-bar"; bar.style.width = Math.round((+x.pct || 0) / max * 100) + "%";
      track.appendChild(bar); row.appendChild(track);
      row.appendChild(Object.assign(createTextElement("span", x.amount || ""), { className: "budget-amount" }));
      list.appendChild(row);
    });
    card.appendChild(list);
    if (b.note) card.appendChild(Object.assign(createTextElement("p", b.note), { className: "budget-note" }));
    return card;
  }

  function buildTripCarouselCard(item) {
    const card = document.createElement("article");
    card.className = "result-card trip-card";
    card.dataset.itemIdx = item.item_idx;
    card.title = item.title || `条目 ${item.item_idx}`;

    appendTripHeader(card, item);
    appendTripBody(card, item);
    return card;
  }

  function appendTripHeader(card, item) {
    const header = document.createElement("div");
    header.className = "trip-header";

    if (item.photo) {
      const img = document.createElement("img");
      img.className = "trip-photo";
      img.src = item.photo;
      img.alt = item.title || "trip photo";
      header.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "trip-photo trip-photo-ph";
      header.appendChild(ph);
    }

    const shade = document.createElement("div");
    shade.className = "trip-shade";
    header.appendChild(shade);

    const titles = document.createElement("div");
    titles.className = "trip-titles";

    const text = document.createElement("div");
    text.className = "trip-titletext";
    text.appendChild(createTextElement("h3", tripHeaderTitle(item)));
    if (item.reminder) text.appendChild(createTextElement("p", item.reminder));
    titles.appendChild(text);

    const pace = paceZh(item.subtitle || item.pace);
    if (pace) {
      const badge = createTextElement("span", pace);
      badge.className = "trip-pace";
      titles.appendChild(badge);
    }
    header.appendChild(titles);
    card.appendChild(header);
  }

  function tripHeaderTitle(item) {
    const t = item.title || `条目 ${item.item_idx}`;
    if (/^(day\s*\d+|d\d+|第.{1,3}天)/i.test(t)) return t;
    return "Day " + item.item_idx + " · " + t;
  }

  function paceZh(p) {
    if (!p) return "";
    const map = { light: "轻松", normal: "适中", intense: "紧凑", intence: "紧凑", relaxed: "轻松", moderate: "适中", packed: "紧凑" };
    return map[String(p).toLowerCase()] || p;
  }

  function appendTripBody(card, item) {
    const body = document.createElement("div");
    body.className = "trip-body";
    if (Array.isArray(item.nodes) && item.nodes.length) {
      for (const node of item.nodes.slice(0, 4)) {
        body.appendChild(buildTripNode(node));
      }
    } else {
      appendTripFallbackSummary(body, item);
    }
    card.appendChild(body);
  }

  function buildTripNode(node) {
    const row = document.createElement("div");
    row.className = "trip-node";

    const head = document.createElement("div");
    head.className = "trip-node-head";
    head.appendChild(createTextElement("strong", node.place || ""));
    const line = document.createElement("i");
    line.className = "trip-node-line";
    head.appendChild(line);
    head.appendChild(createTextElement("span", node.time || ""));
    row.appendChild(head);

    if (node.note) {
      const note = createTextElement("p", node.note);
      note.className = "trip-node-note";
      row.appendChild(note);
    }
    return row;
  }

  function appendTripFallbackSummary(body, item) {
    const summary = item.summary || item.reminder;
    if (!summary) {
      return;
    }
    const fallback = createTextElement("p", summary);
    fallback.className = "trip-summary";
    body.appendChild(fallback);
  }

  function appendCardPhoto(card, item) {
    if (!item.photo) {
      return;
    }
    const img = document.createElement("img");
    img.src = item.photo;
    img.alt = item.title || "photo";
    card.appendChild(img);
  }

  function appendCardKicker(card, item) {
    const kicker = document.createElement("div");
    kicker.className = "card-kicker";
    kicker.appendChild(createTextElement("span", `#${item.item_idx} ${item.kind || ""}`));
    kicker.appendChild(createTextElement("span", item.priority || ""));
    card.appendChild(kicker);
  }

  function appendCardTitle(card, item) {
    card.appendChild(createTextElement("h3", item.title || `条目 ${item.item_idx}`));
  }

  function appendCardDetail(card, item) {
    const detailText = [item.subtitle, item.meta, item.location, item.summary, item.reminder].filter(Boolean).join(" · ");
    if (!detailText) {
      return;
    }
    card.appendChild(createTextElement("p", detailText));
  }

  function appendCardNodes(card, item) {
    if (!Array.isArray(item.nodes) || !item.nodes.length) {
      return;
    }
    const text = item.nodes.map(formatCarouselNode).filter(Boolean).join(" / ");
    if (!text) {
      return;
    }
    const nodes = createTextElement("p", text);
    nodes.className = "node-summary";
    card.appendChild(nodes);
  }

  function appendCardLink(card, item) {
    if (!item.link) {
      return;
    }
    const link = createTextElement("a", "打开");
    link.className = "card-link";
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noreferrer";
    card.appendChild(link);
  }

  function createTextElement(tagName, text) {
    const element = document.createElement(tagName);
    element.textContent = text;
    return element;
  }

  function formatCarouselNode(node) {
    const time = node.time || "";
    const place = node.place || "";
    return `${time}${time && place ? " " : ""}${place}`;
  }

  window.CortexCarousel = {
    createCarouselController,
    buildCarouselCard,   // 工作台新增：供 gallery 直接渲染真实卡
  };
})();
