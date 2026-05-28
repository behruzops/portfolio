/* ===== Visitor counter: online (counterapi.dev) with localStorage fallback ===== */
(function () {
  const el = document.getElementById("view-count");
  if (!el) return;

  const NS = "shuxratov-behruz";
  const KEY = "portfolio-visits";
  const LOCAL_SEED = 1240; // realistic baseline used only if offline
  const today = new Date().toISOString().slice(0, 10);
  const lastVisit = localStorage.getItem("bx_last_visit");
  const isNewVisit = lastVisit !== today; // count once per browser per day

  function animateTo(target) {
    target = Math.max(0, Math.round(target));
    const dur = 1100;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("en-US");
    }
    requestAnimationFrame(step);
  }

  function parseCount(data) {
    if (data == null) return null;
    const v = data.count ?? data.value ?? data.Count ?? (data.data && data.data.count);
    return typeof v === "number" ? v : null;
  }

  function localFallback() {
    let n = parseInt(localStorage.getItem("bx_views") || "", 10);
    if (isNaN(n)) n = LOCAL_SEED;
    if (isNewVisit) {
      n += 1;
      localStorage.setItem("bx_views", String(n));
    }
    localStorage.setItem("bx_last_visit", today);
    animateTo(n);
  }

  async function remote() {
    const action = isNewVisit ? "up" : ""; // increment only on a new daily visit
    const url = `https://api.counterapi.dev/v1/${NS}/${KEY}/${action}`.replace(/\/$/, "");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const count = parseCount(data);
      if (count == null) throw new Error("no count");
      localStorage.setItem("bx_last_visit", today);
      localStorage.setItem("bx_views", String(count)); // keep local mirror in sync
      animateTo(count);
    } catch (e) {
      clearTimeout(timer);
      localFallback();
    }
  }

  remote();
})();
