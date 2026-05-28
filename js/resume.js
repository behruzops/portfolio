/* ===== Resume page: render from shared I18N + CONTENT ===== */
(function () {
  const SUPPORTED = ["uz", "ru", "en"];
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang");
  if (!SUPPORTED.includes(lang)) lang = localStorage.getItem("bx_lang");
  if (!SUPPORTED.includes(lang)) lang = "uz";

  const $ = (s) => document.querySelector(s);

  /* resume-only labels & data */
  const RES = {
    uz: {
      back: "Saytga qaytish", print: "PDF yuklab olish",
      title: "Monitoring muhandisi · Oracle DBA",
      contact: "Aloqa", skills: "Ko'nikmalar", langs: "Tillar",
      edu: "Ta'lim", cert: "Sertifikatlar", profile: "Profil",
      exp: "Ish tajribasi", proj: "Asosiy loyihalar", goals: "Maqsadlar",
      location: "Toshkent, O'zbekiston",
      languages: [["O'zbek", "Ona tili"], ["Rus", "O'rta daraja"], ["Ingliz", "Texnik daraja"]],
      projects: [
        { name: 'OrionDB <span>Pro</span>', desc: () => I18N.uz.odp_desc, tags: "Node.js · React · PostgreSQL · WebSocket · Telegram" },
        { name: "Monitoring va alert tizimlari", desc: () => "Grafana dashboard'lari, Uptime Kuma va kritik holatlar uchun Telegram alert botlari — infratuzilma va bazalar holatini real vaqtda kuzatish hamda avtomatlashtirish.", tags: "Grafana · Uptime Kuma · Telegram Bot · Docker · Bash" }
      ]
    },
    ru: {
      back: "Назад на сайт", print: "Скачать PDF",
      title: "Инженер по мониторингу · Oracle DBA",
      contact: "Контакты", skills: "Навыки", langs: "Языки",
      edu: "Образование", cert: "Сертификаты", profile: "О себе",
      exp: "Опыт работы", proj: "Ключевые проекты", goals: "Цели",
      location: "Ташкент, Узбекистан",
      languages: [["Узбекский", "Родной"], ["Русский", "Средний"], ["Английский", "Технический"]],
      projects: [
        { name: 'OrionDB <span>Pro</span>', desc: () => I18N.ru.odp_desc, tags: "Node.js · React · PostgreSQL · WebSocket · Telegram" },
        { name: "Системы мониторинга и оповещений", desc: () => "Дашборды Grafana, Uptime Kuma и Telegram-боты оповещений для критических ситуаций — мониторинг инфраструктуры и баз данных в реальном времени и автоматизация.", tags: "Grafana · Uptime Kuma · Telegram Bot · Docker · Bash" }
      ]
    },
    en: {
      back: "Back to site", print: "Download PDF",
      title: "Monitoring Engineer · Oracle DBA",
      contact: "Contact", skills: "Skills", langs: "Languages",
      edu: "Education", cert: "Certificates", profile: "Profile",
      exp: "Experience", proj: "Key projects", goals: "Goals",
      location: "Tashkent, Uzbekistan",
      languages: [["Uzbek", "Native"], ["Russian", "Intermediate"], ["English", "Technical"]],
      projects: [
        { name: 'OrionDB <span>Pro</span>', desc: () => I18N.en.odp_desc, tags: "Node.js · React · PostgreSQL · WebSocket · Telegram" },
        { name: "Monitoring & alerting systems", desc: () => "Grafana dashboards, Uptime Kuma and Telegram alert bots for critical situations — real-time monitoring of infrastructure and databases, plus automation.", tags: "Grafana · Uptime Kuma · Telegram Bot · Docker · Bash" }
      ]
    }
  };

  const ICONS = {
    location: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 7L4 6.5V8l8 4.5L20 8V6.5L12 11z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-1 .2-1.5L20.6 2.8c.8-.3 1.5.2 1.3 1.5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.3 8.5h3.3V21H3.3V8.5zM9.4 8.5h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.9 2.17 3.9 5V21h-3.3v-5.8c0-1.4 0-3.2-1.95-3.2-1.96 0-2.26 1.5-2.26 3.1V21H9.4V8.5z"/></svg>'
  };

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderContact() {
    const box = $("#contact-list");
    box.innerHTML = "";
    const items = [
      { ic: "location", text: RES[lang].location },
      { ic: "phone", text: "+998 95 662 82 26", href: "tel:+998956628226" },
      { ic: "email", text: "behruzshuxratov58@gmail.com", href: "mailto:behruzshuxratov58@gmail.com" },
      { ic: "telegram", text: "@Shuxratov_Behruz", href: "https://t.me/Shuxratov_Behruz" },
      { ic: "linkedin", text: "linkedin.com/in/shuxratov-behruz", href: "https://www.linkedin.com/in/shuxratov-behruz-2323233a6/" }
    ];
    items.forEach((it) => {
      const row = el("div", "contact-item", ICONS[it.ic]);
      if (it.href) {
        const a = el("a"); a.href = it.href; a.textContent = it.text; row.appendChild(a);
      } else {
        row.appendChild(el("span", null, it.text));
      }
      box.appendChild(row);
    });
  }

  function renderSkills() {
    const box = $("#skills-list");
    box.innerHTML = "";
    CONTENT.skillGroups.forEach((g) => {
      box.appendChild(el("div", "skill-cat", g.title[lang]));
      const pills = el("div", "pills");
      g.items.forEach((it) => pills.appendChild(el("span", "pill", it.name)));
      box.appendChild(pills);
    });
  }

  function renderLangs() {
    const box = $("#langs-list");
    box.innerHTML = "";
    RES[lang].languages.forEach(([name, level]) => {
      const row = el("div", "lang-line");
      row.appendChild(el("b", null, name));
      row.appendChild(el("span", null, level));
      box.appendChild(row);
    });
  }

  function renderEdu() {
    const box = $("#edu-list");
    box.innerHTML = "";
    const item = el("div", "edu-item");
    item.appendChild(el("div", "edu-name", I18N[lang].edu_uni));
    item.appendChild(el("div", "edu-sub", I18N[lang].edu_period + " · " + I18N[lang].edu_status));
    box.appendChild(item);
  }

  function renderCerts() {
    const box = $("#cert-list");
    box.innerHTML = "";
    const all = CONTENT.certificates.concat(Store.data.certificates);
    all.forEach((c) => {
      const item = el("div", "cert-item");
      item.appendChild(el("div", "cert-name", c.title || ""));
      const sub = [c.issuer, c.date].filter(Boolean).join(" · ");
      if (sub) item.appendChild(el("div", "cert-sub", sub));
      box.appendChild(item);
    });
  }

  function renderSummary() {
    $("#summary").textContent = I18N[lang].about_body;
  }

  function renderExperience() {
    const box = $("#exp-list");
    box.innerHTML = "";
    CONTENT.experience.forEach((job) => {
      const j = el("div", "job");
      const top = el("div", "job-top");
      top.appendChild(el("div", "job-role", job.role[lang]));
      const period = job.present ? job.period + " " + I18N[lang].exp_present : job.period;
      top.appendChild(el("div", "job-period", period));
      j.appendChild(top);
      j.appendChild(el("div", "job-org", job.org[lang]));
      const ul = el("ul", "job-bullets");
      job.bullets[lang].forEach((b) => {
        const li = el("li"); li.textContent = b; ul.appendChild(li);
      });
      j.appendChild(ul);
      box.appendChild(j);
    });
  }

  function renderProjects() {
    const box = $("#proj-list");
    box.innerHTML = "";
    RES[lang].projects.forEach((p) => {
      const d = el("div", "proj");
      d.appendChild(el("div", "proj-name", p.name));
      d.appendChild(el("div", "proj-desc", p.desc()));
      d.appendChild(el("div", "proj-tags", p.tags));
      box.appendChild(d);
    });
  }

  function renderGoals() {
    const box = $("#goals-main");
    box.innerHTML = "";
    CONTENT.goals[lang].forEach((g) => {
      const li = el("li"); li.textContent = g; box.appendChild(li);
    });
  }

  function applyLabels() {
    const r = RES[lang];
    $("#tb-back").textContent = r.back;
    $("#tb-print-label").textContent = r.print;
    $("#r-title").textContent = r.title;
    $("#h-contact").textContent = r.contact;
    $("#h-skills").textContent = r.skills;
    $("#h-langs").textContent = r.langs;
    $("#h-edu").textContent = r.edu;
    $("#h-cert").textContent = r.cert;
    $("#h-profile").textContent = r.profile;
    $("#h-exp").textContent = r.exp;
    $("#h-proj").textContent = r.proj;
    $("#h-goals").textContent = r.goals;
    document.documentElement.lang = lang;
    document.title = "Shuxratov Behruz — Resume (" + lang.toUpperCase() + ")";
  }

  function renderAll() {
    applyLabels();
    renderContact();
    renderSkills();
    renderLangs();
    renderEdu();
    renderCerts();
    renderSummary();
    renderExperience();
    renderProjects();
    renderGoals();
    document.querySelectorAll("#tb-lang button").forEach((b) =>
      b.classList.toggle("active", b.dataset.lang === lang)
    );
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem("bx_lang", lang);
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    history.replaceState(null, "", u);
    renderAll();
  }

  document.querySelectorAll("#tb-lang button").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );
  $("#tb-print").addEventListener("click", () => window.print());

  renderAll();
})();
