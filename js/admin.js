/* ===== Admin panel (client-side, localStorage) =====
   NOTE: This is a convenience gate, not real security. The password lives in the
   page source, so anyone technical can bypass it. Use it only to avoid casual edits.
   >>> Change the password below to your own. <<< */
(function () {
  const ADMIN_PASS = "behruz2026";

  const $ = (s) => document.querySelector(s);
  const overlay = $("#admin-overlay");
  const loginView = $("#admin-login");
  const panelView = $("#admin-panel");

  /* ---- open / close ---- */
  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    if (sessionStorage.getItem("bx_admin_ok") === "1") showPanel();
    else { loginView.hidden = false; panelView.hidden = true; $("#admin-pass").focus(); }
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }
  function showPanel() {
    loginView.hidden = true;
    panelView.hidden = false;
    fillMessage();
    renderProjList();
    renderCertList();
    renderGoalList();
  }

  $("#admin-open").addEventListener("click", open);
  $("#admin-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
  if (location.hash === "#admin") open();

  /* ---- login ---- */
  function tryLogin() {
    const val = $("#admin-pass").value;
    if (val === ADMIN_PASS) {
      sessionStorage.setItem("bx_admin_ok", "1");
      $("#admin-login-err").textContent = "";
      $("#admin-pass").value = "";
      showPanel();
    } else {
      $("#admin-login-err").textContent = "Parol noto'g'ri.";
    }
  }
  $("#admin-login-btn").addEventListener("click", tryLogin);
  $("#admin-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });

  /* ---- tabs ---- */
  document.querySelectorAll(".admin-tabs button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".admin-tabs button").forEach((x) => x.classList.toggle("active", x === b));
      document.querySelectorAll(".admin-tab").forEach((t) => { t.hidden = t.dataset.tab !== b.dataset.tab; });
    });
  });

  /* ---- image downscale -> dataURL ---- */
  function fileToDataURL(file, maxDim = 1200) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width: w, height: h } = img;
          if (w > maxDim || h > maxDim) {
            const r = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * r); h = Math.round(h * r);
          }
          const cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function safeSave(partial) {
    try { Store.set(partial); return true; }
    catch (e) {
      alert("Saqlab bo'lmadi — brauzer xotirasi to'lgan bo'lishi mumkin. Kichikroq rasm tanlang yoki eski yozuvlarni o'chiring.");
      return false;
    }
  }

  /* ---- message ---- */
  function fillMessage() { $("#adm-message").value = Store.data.message || ""; }
  $("#adm-message-save").addEventListener("click", () => {
    if (safeSave({ message: $("#adm-message").value.trim() })) {
      const tag = $("#adm-message-saved");
      tag.hidden = false; setTimeout(() => (tag.hidden = true), 1600);
      App.refresh();
    }
  });

  /* ---- projects ---- */
  function renderProjList() {
    const list = $("#adm-proj-list");
    list.innerHTML = "";
    const projects = Store.data.projects;
    if (!projects.length) { list.innerHTML = '<p class="admin-empty">Hozircha loyiha yo\'q.</p>'; return; }
    projects.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "admin-item";
      const span = document.createElement("span");
      span.textContent = p.title || "(nomsiz)";
      const del = document.createElement("button");
      del.className = "admin-del"; del.textContent = "O'chirish";
      del.addEventListener("click", () => {
        const arr = Store.data.projects; arr.splice(i, 1);
        safeSave({ projects: arr }); renderProjList(); App.refresh();
      });
      row.append(span, del);
      list.appendChild(row);
    });
  }
  $("#adm-proj-add").addEventListener("click", async () => {
    const title = $("#adm-proj-title").value.trim();
    if (!title) { alert("Loyiha nomini kiriting."); return; }
    const desc = $("#adm-proj-desc").value.trim();
    const tags = $("#adm-proj-tags").value.split(",").map((s) => s.trim()).filter(Boolean);
    let img = null;
    try { img = await fileToDataURL($("#adm-proj-img").files[0]); } catch (e) {}
    const arr = Store.data.projects;
    arr.push({ title, desc, tags, img });
    if (safeSave({ projects: arr })) {
      $("#adm-proj-title").value = ""; $("#adm-proj-desc").value = "";
      $("#adm-proj-tags").value = ""; $("#adm-proj-img").value = "";
      renderProjList(); App.refresh();
    }
  });

  /* ---- certificates ---- */
  function renderCertList() {
    const list = $("#adm-cert-list");
    list.innerHTML = "";
    const certs = Store.data.certificates;
    if (!certs.length) { list.innerHTML = '<p class="admin-empty">Qo\'shimcha sertifikat yo\'q.</p>'; return; }
    certs.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "admin-item";
      const span = document.createElement("span");
      span.textContent = [c.title, c.issuer].filter(Boolean).join(" · ") || "(nomsiz)";
      const del = document.createElement("button");
      del.className = "admin-del"; del.textContent = "O'chirish";
      del.addEventListener("click", () => {
        const arr = Store.data.certificates; arr.splice(i, 1);
        safeSave({ certificates: arr }); renderCertList(); App.refresh();
      });
      row.append(span, del);
      list.appendChild(row);
    });
  }
  $("#adm-cert-add").addEventListener("click", async () => {
    const title = $("#adm-cert-title").value.trim();
    if (!title) { alert("Sertifikat nomini kiriting."); return; }
    const issuer = $("#adm-cert-issuer").value.trim();
    const date = $("#adm-cert-date").value.trim();
    let img = null;
    try { img = await fileToDataURL($("#adm-cert-img").files[0]); } catch (e) {}
    if (!img) { alert("Sertifikat rasmini tanlang."); return; }
    const arr = Store.data.certificates;
    arr.push({ title, issuer, date, img });
    if (safeSave({ certificates: arr })) {
      $("#adm-cert-title").value = ""; $("#adm-cert-issuer").value = "";
      $("#adm-cert-date").value = ""; $("#adm-cert-img").value = "";
      renderCertList(); App.refresh();
    }
  });

  /* ---- goals / directions ---- */
  function renderGoalList() {
    const list = $("#adm-goal-list");
    if (!list) return;
    list.innerHTML = "";
    const goals = Store.data.goals;
    if (!goals.length) { list.innerHTML = '<p class="admin-empty">Qo\'shimcha yo\'nalish yo\'q.</p>'; return; }
    goals.forEach((g, i) => {
      const row = document.createElement("div");
      row.className = "admin-item";
      const span = document.createElement("span");
      span.textContent = g;
      const del = document.createElement("button");
      del.className = "admin-del"; del.textContent = "O'chirish";
      del.addEventListener("click", () => {
        const arr = Store.data.goals; arr.splice(i, 1);
        safeSave({ goals: arr }); renderGoalList(); App.refresh();
      });
      row.append(span, del);
      list.appendChild(row);
    });
  }
  const goalAddBtn = $("#adm-goal-add");
  if (goalAddBtn) goalAddBtn.addEventListener("click", () => {
    const text = $("#adm-goal-text").value.trim();
    if (!text) { alert("Yo'nalish matnini kiriting."); return; }
    const arr = Store.data.goals;
    arr.push(text);
    if (safeSave({ goals: arr })) {
      $("#adm-goal-text").value = "";
      renderGoalList(); App.refresh();
    }
  });

  /* ---- data: export / import / clear ---- */
  $("#adm-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shuxratov-portfolio-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#adm-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        Store.replace(data);
        fillMessage(); renderProjList(); renderCertList(); renderGoalList(); App.refresh();
        alert("Import qilindi ✓");
      } catch (err) { alert("Faylni o'qib bo'lmadi (noto'g'ri JSON)."); }
    };
    reader.readAsText(file);
  });
  $("#adm-clear").addEventListener("click", () => {
    if (confirm("Qo'shgan barcha ma'lumotlar o'chiriladi. Davom etilsinmi?")) {
      Store.clear();
      fillMessage(); renderProjList(); renderCertList(); App.refresh();
    }
  });
})();
