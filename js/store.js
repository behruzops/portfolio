/* ===== Shared client-side store (localStorage) for admin-added content ===== */
window.Store = (function () {
  const KEY = "bx_site_data";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }

  function write(d) {
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  return {
    get data() {
      const d = read();
      return {
        message: typeof d.message === "string" ? d.message : "",
        projects: Array.isArray(d.projects) ? d.projects : [],
        certificates: Array.isArray(d.certificates) ? d.certificates : []
      };
    },
    set(partial) {
      write(Object.assign(read(), partial));
    },
    replace(full) {
      write(full || {});
    },
    clear() {
      localStorage.removeItem(KEY);
    }
  };
})();
