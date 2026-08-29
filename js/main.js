/* ===== App bootstrap: i18n apply, dynamic rendering, nav, reveal ===== */
window.App = (function () {
  const SUPPORTED = ["uz", "ru", "en"];
  let lang = localStorage.getItem("bx_lang");
  if (!SUPPORTED.includes(lang)) lang = "uz";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- static strings ---- */
  function applyStatic() {
    const dict = I18N[lang];
    $$("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.documentElement.lang = lang;
  }

  /* ---- personal note ---- */
  function renderNote() {
    const msg = Store.data.message || CONTENT.noteDefault[lang];
    $("#note-text").textContent = msg;
  }

  /* ---- skill icon tile ---- */
  function genericDbIcon() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("fill", "#0b6cb5");
    p.setAttribute("d", "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zm8 5.5C20 10.2 16.4 11.5 12 11.5S4 10.2 4 8.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V8.5zm0 5C20 15.2 16.4 16.5 12 16.5S4 15.2 4 13.5V17c0 1.7 3.6 3 8 3s8-1.3 8-3v-3.5z");
    svg.appendChild(p);
    return svg;
  }

  function makeSkillChip(item) {
    const chip = document.createElement("span");
    chip.className = "skill";
    const tile = document.createElement("span");
    tile.className = "skill-ic";
    if (item.slug) {
      const img = document.createElement("img");
      img.src = `https://cdn.simpleicons.org/${item.slug}`;
      img.alt = item.name;
      img.loading = "lazy";
      img.onerror = () => { tile.classList.add("skill-ic--mono"); tile.textContent = item.name.charAt(0); img.remove(); };
      tile.appendChild(img);
    } else {
      tile.appendChild(genericDbIcon());
    }
    const label = document.createElement("span");
    label.className = "skill-name";
    label.textContent = item.name;
    chip.append(tile, label);
    return chip;
  }

  function renderSkills() {
    const wrap = $("#skills-wrap");
    wrap.innerHTML = "";
    CONTENT.skillGroups.forEach((g) => {
      const grp = document.createElement("div");
      grp.className = "skill-group reveal";
      const h = document.createElement("h3");
      h.textContent = g.title[lang];
      grp.appendChild(h);
      const row = document.createElement("div");
      row.className = "skill-row";
      g.items.forEach((it) => row.appendChild(makeSkillChip(it)));
      grp.appendChild(row);
      wrap.appendChild(grp);
    });
  }

  /* ---- stats (animated count-up) ---- */
  function renderStats() {
    const wrap = $("#stats-strip");
    if (!wrap) return;
    wrap.innerHTML = "";
    (CONTENT.stats || []).forEach((s) => {
      const tile = document.createElement("div");
      tile.className = "stat-tile reveal";
      const num = document.createElement("div");
      num.className = "stat-num";
      num.dataset.target = s.n; num.dataset.suffix = s.suffix || "";
      const label = document.createElement("div");
      label.className = "stat-label";
      label.textContent = I18N[lang][s.key] || "";
      const counted = wrap.dataset.counted === "1";
      num.textContent = (counted ? s.n : 0) + (s.suffix || "");
      tile.append(num, label);
      wrap.appendChild(tile);
    });
    if (wrap.dataset.counted !== "1") {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { countUp(wrap); wrap.dataset.counted = "1"; io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(wrap);
    }
  }
  function countUp(wrap) {
    wrap.querySelectorAll(".stat-num").forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const suffix = el.dataset.suffix || "";
      const dur = 1300, start = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  /* ---- skills radar chart (pure SVG) ---- */
  function renderRadar() {
    const host = $("#skill-radar");
    if (!host) return;
    const data = CONTENT.radar || [];
    const n = data.length;
    if (!n) { host.innerHTML = ""; return; }
    const size = 300, cx = size / 2, cy = size / 2, R = 90;
    const ang = (i) => (-90 + i * 360 / n) * Math.PI / 180;
    const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
    let svg = `<svg viewBox="0 0 ${size} ${size}" class="radar-svg" role="img" aria-label="skills radar">`;
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const pts = data.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
      svg += `<polygon class="radar-ring" points="${pts}" />`;
    });
    data.forEach((d, i) => {
      const [x, y] = pt(i, R);
      svg += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
      const [lx, ly] = pt(i, R + 18);
      const anchor = Math.abs(lx - cx) < 8 ? "middle" : (lx > cx ? "start" : "end");
      svg += `<text class="radar-label" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}">${d.label[lang]}</text>`;
    });
    const dpts = data.map((d, i) => pt(i, R * d.value / 100).map((v) => v.toFixed(1)).join(",")).join(" ");
    svg += `<polygon class="radar-area" points="${dpts}" />`;
    data.forEach((d, i) => { const [x, y] = pt(i, R * d.value / 100); svg += `<circle class="radar-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" />`; });
    svg += `</svg>`;
    host.innerHTML = svg;
  }

  /* ---- moving capability rail ---- */
  function renderCapabilityRail() {
    const tracks = [$("#rail-track-a"), $("#rail-track-b")];
    if (!tracks[0] || !tracks[1]) return;
    const services = CONTENT.services || [];
    const groups = [services.filter((_, i) => i % 2 === 0), services.filter((_, i) => i % 2 === 1)];
    tracks.forEach((track, row) => {
      track.innerHTML = "";
      [...groups[row], ...groups[row]].forEach((service, index) => {
        const chip = document.createElement("span");
        chip.className = "rail-chip";
        chip.setAttribute("aria-hidden", index >= groups[row].length ? "true" : "false");
        const dot = document.createElement("span");
        dot.className = "rail-chip-dot";
        const label = document.createElement("span");
        label.textContent = service.title[lang];
        chip.append(dot, label);
        track.appendChild(chip);
      });
    });
  }

  /* ---- rotating solution spotlight ---- */
  let showcaseIndex = 0;
  let showcaseTimer;
  function renderShowcase() {
    const tabs = $("#showcase-tabs");
    const stage = $("#showcase-stage");
    const items = CONTENT.showcase || [];
    if (!tabs || !stage || !items.length) return;
    clearInterval(showcaseTimer);
    showcaseIndex = Math.min(showcaseIndex, items.length - 1);
    tabs.innerHTML = "";

    const activate = (next) => {
      showcaseIndex = (next + items.length) % items.length;
      const item = items[showcaseIndex];
      tabs.querySelectorAll(".showcase-tab").forEach((button, i) => {
        const active = i === showcaseIndex;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });

      stage.classList.remove("showcase-stage--ready");
      stage.innerHTML = "";
      const content = document.createElement("div");
      content.className = "showcase-copy";
      const eyebrow = document.createElement("span");
      eyebrow.className = "showcase-eyebrow";
      eyebrow.textContent = item.label[lang];
      const title = document.createElement("h3");
      title.textContent = item.title[lang];
      const desc = document.createElement("p");
      desc.textContent = item.desc[lang];
      const tags = document.createElement("div");
      tags.className = "showcase-tags";
      item.tags.forEach((tag) => { const el = document.createElement("span"); el.textContent = tag; tags.appendChild(el); });
      const link = document.createElement("a");
      link.className = "showcase-link";
      link.href = item.href;
      link.textContent = I18N[lang].showcase_open + "  →";
      content.append(eyebrow, title, desc, tags, link);

      const visual = document.createElement("div");
      visual.className = `showcase-visual showcase-visual--${item.kind}`;
      visual.setAttribute("aria-hidden", "true");
      visual.innerHTML = `<div class="visual-grid"></div><div class="visual-orbit visual-orbit--one"></div><div class="visual-orbit visual-orbit--two"></div><div class="visual-core"><span></span></div><div class="visual-signal visual-signal--a"></div><div class="visual-signal visual-signal--b"></div>`;
      const metric = document.createElement("div");
      metric.className = "showcase-metric";
      metric.innerHTML = `<strong>${item.metric}</strong><span>${item.metricLabel[lang]}</span>`;
      visual.appendChild(metric);
      stage.append(content, visual);
      requestAnimationFrame(() => stage.classList.add("showcase-stage--ready"));
    };

    items.forEach((item, i) => {
      const button = document.createElement("button");
      button.className = "showcase-tab";
      button.type = "button";
      button.role = "tab";
      button.innerHTML = `<span class="showcase-tab-num">${String(i + 1).padStart(2, "0")}</span><span>${item.label[lang]}</span><i></i>`;
      button.addEventListener("click", () => { activate(i); restartShowcase(); });
      tabs.appendChild(button);
    });

    function restartShowcase() {
      clearInterval(showcaseTimer);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        showcaseTimer = setInterval(() => activate(showcaseIndex + 1), 5200);
      }
    }
    activate(showcaseIndex);
    restartShowcase();
  }

  /* ---- timeline ---- */
  function renderTimeline() {
    const tl = $("#timeline");
    tl.innerHTML = "";
    CONTENT.experience.forEach((job) => {
      const item = document.createElement("div");
      item.className = "tl-item reveal";
      const dot = document.createElement("span");
      dot.className = "tl-dot" + (job.present ? " tl-dot--live" : "");
      item.appendChild(dot);
      const body = document.createElement("div");
      body.className = "tl-body";
      const period = document.createElement("div");
      period.className = "tl-period";
      period.textContent = job.present ? job.period + " " + I18N[lang].exp_present : job.period;
      const role = document.createElement("h3");
      role.className = "tl-role";
      role.textContent = job.role[lang];
      const org = document.createElement("div");
      org.className = "tl-org";
      org.textContent = job.org[lang];
      const ul = document.createElement("ul");
      ul.className = "tl-bullets";
      job.bullets[lang].forEach((b) => {
        const li = document.createElement("li");
        li.textContent = b;
        ul.appendChild(li);
      });
      body.append(period, role, org, ul);
      item.appendChild(body);
      tl.appendChild(item);
    });
  }

  /* ---- capabilities ---- */
  function renderCapabilities() {
    const wrap = $("#cap-cards");
    wrap.innerHTML = "";
    CONTENT.capabilities.forEach((c) => {
      const card = document.createElement("article");
      card.className = "card reveal";
      const media = document.createElement("div");
      media.className = "card-media";
      const img = document.createElement("img");
      img.src = c.img; img.alt = c.title[lang]; img.loading = "lazy";
      media.appendChild(img);
      const content = document.createElement("div");
      content.className = "card-body";
      const h = document.createElement("h3"); h.textContent = c.title[lang];
      const p = document.createElement("p"); p.textContent = c.desc[lang];
      const tags = document.createElement("div"); tags.className = "card-tags";
      c.tags.forEach((t) => { const s = document.createElement("span"); s.textContent = t; tags.appendChild(s); });
      content.append(h, p, tags);
      card.append(media, content);
      wrap.appendChild(card);
    });
  }

  /* ---- services & pricing ---- */
  function makeServiceIcon(service, card) {
    const tile = document.createElement("span");
    const motion = service.icon || "default";
    tile.className = `price-ic price-ic--${motion}`;

    if (motion === "hikvision") {
      tile.classList.add("price-ic--camera");
      tile.innerHTML = `<span class="camera-rig"><span class="camera-head"><span class="camera-lens"></span><span class="camera-glint"></span></span><span class="camera-arm"></span></span>`;
      card.addEventListener("pointermove", (event) => {
        const box = card.getBoundingClientRect();
        const ratio = (event.clientX - box.left) / box.width;
        const angle = Math.max(-28, Math.min(28, (ratio - 0.5) * 56));
        card.style.setProperty("--camera-aim", `${angle}deg`);
      });
      card.addEventListener("pointerleave", () => card.style.removeProperty("--camera-aim"));
      return tile;
    }

    const img = document.createElement("img");
    img.src = `https://cdn.simpleicons.org/${motion}`;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
      tile.classList.add("skill-ic--mono");
      tile.textContent = (service.title[lang] || "?").charAt(0);
      img.remove();
    };
    tile.appendChild(img);
    if (["qrcode", "grafana", "prometheus", "uptimekuma"].includes(motion)) {
      const fx = document.createElement("span");
      fx.className = "price-ic-fx";
      tile.appendChild(fx);
    }
    return tile;
  }

  function renderServices() {
    const wrap = $("#pricing-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    (CONTENT.services || []).forEach((s) => {
      const card = document.createElement("article");
      card.className = "price-card reveal";

      const head = document.createElement("div");
      head.className = "price-head";
      const tile = makeServiceIcon(s, card);
      const h = document.createElement("h3");
      h.className = "price-title";
      h.textContent = s.title[lang];
      head.append(tile, h);

      const p = document.createElement("p");
      p.className = "price-desc";
      p.textContent = s.desc[lang];

      const tags = document.createElement("div");
      tags.className = "card-tags";
      (s.tags || []).forEach((t) => { const el = document.createElement("span"); el.textContent = t; tags.appendChild(el); });

      const price = document.createElement("div");
      price.className = "price-value";
      const amount = document.createElement("span");
      amount.className = "price-amount";
      if (typeof s.price === "string") {
        const from = document.createElement("span");
        from.className = "price-from";
        from.textContent = I18N[lang].svc_from;
        amount.textContent = s.price;
        price.append(from, amount);
      } else {
        amount.classList.add("price-amount--custom");
        amount.textContent = s.price[lang];
        price.append(amount);
      }

      card.style.setProperty("--service-index", String(wrap.children.length));
      card.append(head, p, tags, price);
      wrap.appendChild(card);
    });
  }

  /* ---- built-in projects ---- */
  function renderProjects() {
    const wrap = $("#project-grid");
    if (!wrap) return;
    wrap.innerHTML = "";
    (CONTENT.projects || []).forEach((pr) => {
      const card = document.createElement("article");
      card.className = "card reveal";
      if (pr.img) {
        const media = document.createElement("div");
        media.className = "card-media";
        const img = document.createElement("img");
        img.src = pr.img; img.alt = pr.title[lang]; img.loading = "lazy";
        media.appendChild(img);
        card.appendChild(media);
      }
      const content = document.createElement("div");
      content.className = "card-body";
      const h = document.createElement("h3"); h.textContent = pr.title[lang];
      const desc = document.createElement("p"); desc.textContent = pr.desc[lang];
      content.append(h, desc);
      if (Array.isArray(pr.tags) && pr.tags.length) {
        const tags = document.createElement("div"); tags.className = "card-tags";
        pr.tags.forEach((t) => { const s = document.createElement("span"); s.textContent = t; tags.appendChild(s); });
        content.appendChild(tags);
      }
      if (Array.isArray(pr.links) && pr.links.length) {
        const links = document.createElement("div"); links.className = "card-links";
        pr.links.forEach((l) => {
          const a = document.createElement("a");
          a.className = "card-link"; a.href = l.url; a.target = "_blank"; a.rel = "noopener";
          a.textContent = l.label + " ↗";
          links.appendChild(a);
        });
        content.appendChild(links);
      }
      card.appendChild(content);
      wrap.appendChild(card);
    });
  }

  /* ---- extra (admin-added) projects ---- */
  function renderExtraProjects() {
    const wrap = $("#extra-projects");
    wrap.innerHTML = "";
    Store.data.projects.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card reveal";
      if (p.img) {
        const media = document.createElement("div");
        media.className = "card-media";
        const img = document.createElement("img");
        img.src = p.img; img.alt = p.title || "project"; img.loading = "lazy";
        media.appendChild(img);
        card.appendChild(media);
      }
      const content = document.createElement("div");
      content.className = "card-body";
      const h = document.createElement("h3"); h.textContent = p.title || "";
      const desc = document.createElement("p"); desc.textContent = p.desc || "";
      content.append(h, desc);
      if (Array.isArray(p.tags) && p.tags.length) {
        const tags = document.createElement("div"); tags.className = "card-tags";
        p.tags.forEach((t) => { const s = document.createElement("span"); s.textContent = t; tags.appendChild(s); });
        content.appendChild(tags);
      }
      card.appendChild(content);
      wrap.appendChild(card);
    });
  }

  /* ---- certificates carousel (built-in + admin) ---- */
  let certTimer = null;
  let certResize = null;
  function renderCertificates() {
    const track = $("#cert-track");
    const dotsWrap = $("#cert-dots");
    const viewport = $(".cert-viewport");
    const carousel = $("#cert-carousel");
    if (!track) return;
    track.innerHTML = ""; dotsWrap.innerHTML = "";
    const all = CONTENT.certificates.concat(Store.data.certificates);
    let index = 0;

    all.forEach((c, i) => {
      const card = document.createElement("article");
      card.className = "cert-card";
      const media = document.createElement("a");
      media.className = "cert-media";
      media.href = c.file || c.img; media.target = "_blank"; media.rel = "noopener";
      const img = document.createElement("img");
      img.src = c.img; img.alt = (c.title || "certificate"); img.loading = "lazy";
      media.appendChild(img);
      const body = document.createElement("div");
      body.className = "cert-body";
      const h = document.createElement("h3"); h.textContent = c.title || "";
      const meta = document.createElement("div"); meta.className = "cert-meta";
      meta.textContent = [c.issuer, c.date].filter(Boolean).join(" · ");
      const view = document.createElement("a");
      view.className = "cert-view"; view.href = c.file || c.img; view.target = "_blank"; view.rel = "noopener";
      view.textContent = I18N[lang].cert_view;
      body.append(h, meta, view);
      card.append(media, body);
      card.addEventListener("click", (e) => { if (!e.target.closest("a")) go(i); });
      track.appendChild(card);

      const dot = document.createElement("button");
      dot.className = "cert-dot"; dot.setAttribute("aria-label", "sertifikat " + (i + 1));
      dot.addEventListener("click", () => go(i));
      dotsWrap.appendChild(dot);
    });

    const cards = Array.from(track.children);
    const dots = Array.from(dotsWrap.children);
    const single = cards.length <= 1;
    carousel.classList.toggle("single", single);

    function layout() {
      if (single) { track.style.transform = "none"; return; }
      const card = cards[index];
      if (!card) return;
      const x = viewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
      track.style.transform = "translateX(" + x + "px)";
      cards.forEach((c, i) => c.classList.toggle("active", i === index));
      dots.forEach((d, i) => d.classList.toggle("on", i === index));
    }
    function go(i) { index = (i + cards.length) % cards.length; layout(); restart(); }
    function restart() {
      if (certTimer) clearInterval(certTimer);
      if (!single) certTimer = setInterval(() => go(index + 1), 4500);
    }

    $("#cert-prev").onclick = () => go(index - 1);
    $("#cert-next").onclick = () => go(index + 1);
    carousel.onmouseenter = () => { if (certTimer) clearInterval(certTimer); };
    carousel.onmouseleave = restart;

    if (certResize) window.removeEventListener("resize", certResize);
    certResize = layout;
    window.addEventListener("resize", certResize);

    layout();
    requestAnimationFrame(() => requestAnimationFrame(layout));
    setTimeout(layout, 80);
    restart();
  }

  /* ---- goals ---- */
  function renderGoals() {
    const grid = $("#goals-grid");
    grid.innerHTML = "";
    const all = (CONTENT.goals[lang] || []).concat(Store.data.goals || []);
    all.forEach((g, i) => {
      const item = document.createElement("div");
      item.className = "goal reveal";
      const num = document.createElement("span");
      num.className = "goal-num";
      num.textContent = String(i + 1).padStart(2, "0");
      const txt = document.createElement("span");
      txt.textContent = g;
      item.append(num, txt);
      grid.appendChild(item);
    });
  }

  function renderOdp() {
    const ul = $("#odp-feats");
    ul.innerHTML = "";
    CONTENT.odpFeats[lang].forEach((f) => {
      const li = document.createElement("li");
      li.textContent = f;
      ul.appendChild(li);
    });
  }

  /* ---- reveal on scroll ---- */
  let io;
  function observeReveals() {
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---- render everything ---- */
  function renderAll() {
    applyStatic();
    renderNote();
    renderCapabilityRail();
    renderShowcase();
    renderStats();
    renderTimeline();
    renderSkills();
    renderRadar();
    renderCapabilities();
    renderServices();
    renderOdp();
    renderProjects();
    renderExtraProjects();
    renderCertificates();
    observeReveals();
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem("bx_lang", lang);
    $$("#lang-switch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    renderAll();
  }

  function initNav() {
    $$("#lang-switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
    const burger = $("#nav-burger");
    const links = $("#nav-links");
    burger.addEventListener("click", () => { links.classList.toggle("open"); burger.classList.toggle("open"); });
    $$("#nav-links a").forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); burger.classList.remove("open"); }));
    const nav = $("#nav");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initAmbientPointer() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    document.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
        frame = 0;
      });
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#year").textContent = new Date().getFullYear();
    initNav();
    initAmbientPointer();
    setLang(lang);
  });

  return {
    refresh: renderAll,
    get lang() { return lang; }
  };
})();
