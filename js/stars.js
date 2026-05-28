/* ===== Animated Orion starfield ===== */
(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let shooters = [];
  let orion = { stars: [], lines: [] };
  let lastShoot = 0;
  let nextShootIn = 1500;

  /* Orion constellation in normalized 0..1 coordinates (hourglass shape) */
  const ORION_DEF = {
    nodes: {
      meissa:    { x: 0.50, y: 0.02, r: 1.6, color: "#cfe3ff" },
      betelgeuse:{ x: 0.32, y: 0.20, r: 2.8, color: "#ff8a63" },
      bellatrix: { x: 0.70, y: 0.18, r: 2.2, color: "#dfeaff" },
      alnitak:   { x: 0.42, y: 0.52, r: 1.9, color: "#eaf2ff" },
      alnilam:   { x: 0.50, y: 0.50, r: 2.0, color: "#eaf2ff" },
      mintaka:   { x: 0.58, y: 0.48, r: 1.9, color: "#eaf2ff" },
      saiph:     { x: 0.40, y: 0.85, r: 2.0, color: "#dfeaff" },
      rigel:     { x: 0.66, y: 0.88, r: 2.8, color: "#9ec5ff" }
    },
    edges: [
      ["meissa", "betelgeuse"], ["meissa", "bellatrix"],
      ["betelgeuse", "bellatrix"],
      ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"],
      ["alnitak", "alnilam"], ["alnilam", "mintaka"],
      ["alnitak", "saiph"], ["mintaka", "rigel"]
    ]
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    buildOrion();
  }

  function buildStars() {
    const count = Math.round((W * H) / 7000); // density
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.3, 1.4),
        base: rand(0.15, 0.7),
        amp: rand(0.1, 0.45),
        sp: rand(0.6, 2.2),
        ph: rand(0, Math.PI * 2),
        hue: Math.random() > 0.85 ? "#bcd4ff" : "#ffffff"
      });
    }
  }

  function buildOrion() {
    // place constellation in the upper-right region, scaled to viewport
    const size = Math.min(W, H) * (W < 700 ? 0.5 : 0.42);
    const boxW = size * 0.62;
    const boxH = size;
    const ox = W < 700 ? (W - boxW) / 2 : W - boxW - W * 0.08;
    const oy = H * 0.12;

    const pos = {};
    orion.stars = [];
    Object.entries(ORION_DEF.nodes).forEach(([key, n]) => {
      const x = ox + n.x * boxW;
      const y = oy + n.y * boxH;
      pos[key] = { x, y };
      orion.stars.push({
        x, y, r: n.r, color: n.color,
        base: 0.85, amp: 0.2, sp: rand(0.8, 1.6), ph: rand(0, Math.PI * 2)
      });
    });
    orion.lines = ORION_DEF.edges.map(([a, b]) => ({ a: pos[a], b: pos[b] }));
  }

  function spawnShooter() {
    const fromTop = Math.random() > 0.4;
    const startX = fromTop ? rand(W * 0.1, W * 0.9) : W + 40;
    const startY = fromTop ? -40 : rand(0, H * 0.5);
    const ang = rand(Math.PI * 0.62, Math.PI * 0.78); // down-left
    const speed = rand(7, 12);
    shooters.push({
      x: startX, y: startY,
      vx: -Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      len: rand(120, 260),
      life: 0,
      maxLife: rand(60, 110)
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // background twinkling stars
    for (const s of stars) {
      const a = reduceMotion ? s.base : s.base + s.amp * Math.sin(t * 0.001 * s.sp + s.ph);
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.fillStyle = s.hue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Orion connecting lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(120,170,255,0.18)";
    ctx.beginPath();
    for (const l of orion.lines) {
      ctx.moveTo(l.a.x, l.a.y);
      ctx.lineTo(l.b.x, l.b.y);
    }
    ctx.stroke();

    // Orion stars with glow
    for (const s of orion.stars) {
      const a = reduceMotion ? s.base : s.base + s.amp * Math.sin(t * 0.001 * s.sp + s.ph);
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
      glow.addColorStop(0, s.color);
      glow.addColorStop(0.4, hexA(s.color, 0.35));
      glow.addColorStop(1, hexA(s.color, 0));
      ctx.globalAlpha = Math.max(0.3, Math.min(1, a));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // shooting stars
    if (!reduceMotion) {
      if (t - lastShoot > nextShootIn) {
        spawnShooter();
        lastShoot = t;
        nextShootIn = rand(2600, 7000);
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life++;
        const tailX = sh.x - sh.vx * (sh.len / 10);
        const tailY = sh.y - sh.vy * (sh.len / 10);
        const fade = 1 - sh.life / sh.maxLife;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        // head
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 1.6, 0, Math.PI * 2);
        ctx.fill();

        if (sh.life > sh.maxLife || sh.x < -300 || sh.y > H + 300) {
          shooters.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(draw);
  }

  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  requestAnimationFrame(draw);
})();
