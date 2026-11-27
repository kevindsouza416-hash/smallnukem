/* BWRX-300 3D Plant Renderer: Canvas-based Isometric 3D Visualization */
(function (root) {
  'use strict';

  const P3TAU = Math.PI * 2;
  const p3f = (w, z) => `${w} ${z}px 'IBM Plex Mono', ui-monospace, monospace`;
  const P3LT = (() => {
    const v = [-0.45, 0.8, 0.4], m = Math.hypot(v[0], v[1], v[2]);
    return v.map(x => x / m);
  })();
  const P3AX = {
    y: [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
    x: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    z: [[0, 0, 1], [1, 0, 0], [0, 1, 0]]
  };

  function p3rgb(s) {
    const m = (s || '').match(/[0-9]+/g);
    return m && m.length > 2 ? [+m[0], +m[1], +m[2]] : [58, 31, 26];
  }

  const stops = [[0, [58, 31, 26]], [0.05, [122, 42, 22]], [0.3, [216, 87, 28]], [1, [255, 210, 122]]];
  function coreColor(x) {
    const clamp = (val, a, b) => Math.max(a, Math.min(b, val));
    x = clamp(x, 0, 1);
    for (let i = 1; i < stops.length; i++) {
      if (x <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i], f = (x - a[0]) / (b[0] - a[0]);
        return 'rgb(' + [0, 1, 2].map(k => Math.round(a[1][k] + (b[1][k] - a[1][k]) * f)).join(',') + ')';
      }
    }
    return 'rgb(255,210,122)';
  }

  function p3Scene(ctx, W, H, dpr, t, S, C, hud, cam, still) {
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#bae6fd');   // warm sunny sky blue
    bg.addColorStop(0.55, '#e0f2fe'); // soft horizon haze
    bg.addColorStop(1, '#ecfdf5');   // warm green ground reflection
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;

    // Framing bounds: when cam.focus is true, frame the Reactor Building (RPV, containment, core, IC pool, boron)
    // When false, frame the whole plant site (Reactor Building + Turbine Hall + Generator + Lake)
    const bX = cam.focus ? [-12, 16] : [-16, 54];
    const bY = [-1, 42]; // From foundation (y=0) to top of IC vents & steam plumes (y=39-42)
    const bZ = cam.focus ? [-12, 12] : [-14, 14];

    bX.forEach(x => {
      bY.forEach(y => {
        bZ.forEach(z => {
          const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, yy = -(y * cp - z1 * sp);
          mnx = Math.min(mnx, x1); mxx = Math.max(mxx, x1); mny = Math.min(mny, yy); mxy = Math.max(mxy, yy);
        });
      });
    });

    // Provide balanced padding so the reactor has clean margins and HUD text does not clip
    const padX = 40, padY = 32;
    const k = Math.min((W - padX * 2) / (mxx - mnx), (H - padY * 2) / (mxy - mny)) * (cam.zoom || 1);
    const OX = W / 2 - (mnx + mxx) / 2 * k;
    const OY = H / 2 - (mny + mxy) / 2 * k;

    const P = (x, y, z) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return [OX + x1 * k, OY - (y * cp - z1 * sp) * k, -y * sp - z1 * cp];
    };

    const facing = n => n[1] * sp + (-n[0] * sy + n[2] * cy) * cp;
    const shade = (c, n, amb) => {
      const l = Math.max(0, n[0] * P3LT[0] + n[1] * P3LT[1] + n[2] * P3LT[2]), f = amb + 0.5 * l;
      return [Math.min(255, c[0] * f | 0), Math.min(255, c[1] * f | 0), Math.min(255, c[2] * f | 0)];
    };
    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

    const items = [], labels = [];
    let RX = 1;

    const gq = (x0, z0, x1, z1, y, col) => {
      ctx.beginPath();
      [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach((q, i) => {
        const p = P(q[0], y, q[1]);
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    };

    // Ground plane & vibrant landscape
    // Base lush park lawn
    gq(-24, -34, 66, 20, 0, '#86efac');
    gq(-24, -34, -10, 20, 0.01, '#4ade80');
    // Plant facility apron & access roads
    gq(-12, -12, 12, 12, 0.02, '#e2e8f0');
    gq(13, -9, 47, 9, 0.02, '#e2e8f0');
    gq(10, -2, 15, 2, 0.025, '#cbd5e1');
    // Lake Ontario shoreline & vibrant blue water
    gq(7, -13.5, 65, -12.5, 0.025, '#94a3b8');
    gq(8, -34, 64, -13, 0.03, '#0284c7');

    // Sparkling lake wave reflections
    if (!still) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.2;
      for (let rz = -30; rz <= -16; rz += 4) {
        ctx.beginPath();
        for (let rx = 12; rx <= 60; rx += 6) {
          const wOff = Math.sin(t * 2 + rx * 0.4 + rz * 0.6) * 0.6;
          const ptW = P(rx + wOff, 0.04, rz);
          rx === 12 ? ctx.moveTo(ptW[0], ptW[1]) : ctx.lineTo(ptW[0], ptW[1]);
        }
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(74,222,128,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -16; x <= 60; x += 8) {
      const a = P(x, 0, -32), b = P(x, 0, 18);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    for (let z = -32; z <= 18; z += 10) {
      const a = P(-22, 0, z), b = P(62, 0, z);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();

    function face(pts, n, col, o) {
      const f = facing(n), a = o.a == null ? 1 : o.a;
      let L = 2;
      if (o.shell) L = f > 0 ? (o.Lf || 3) : (o.Lb || 1);
      else if (a >= 0.999 && f <= 0) return;
      const p = pts.map(q => P(q[0], q[1], q[2]));
      let d = 0;
      for (const q of p) d += q[2];
      items.push({ L, d: d / p.length + (o.bias || 0), k: 0, p, c: shade(col, n, f > 0 ? 0.64 : 0.5), a });
    }

    function cyl(c, ax, r0, r1, len, col, o) {
      if (RX !== 1 && ax === 'y') {
        c = [c[0] * RX, c[1], c[2] * RX];
        r0 *= RX; r1 *= RX;
      }
      o = o || {};
      const A = P3AX[ax], a = A[0], u = A[1], v = A[2], seg = o.seg || 14, ns = o.ns || Math.max(1, Math.ceil(len / 2.4));
      const pt = (s, th) => {
        const z = len * s / ns, r = r0 + (r1 - r0) * s / ns, cs = Math.cos(th) * r, sn = Math.sin(th) * r;
        return [c[0] + a[0] * z + u[0] * cs + v[0] * sn, c[1] + a[1] * z + u[1] * cs + v[1] * sn, c[2] + a[2] * z + u[2] * cs + v[2] * sn];
      };
      for (let s = 0; s < ns; s++) {
        for (let i = 0; i < seg; i++) {
          const t0 = i / seg * P3TAU, t1 = (i + 1) / seg * P3TAU, tm = (t0 + t1) / 2, cm = Math.cos(tm), sm = Math.sin(tm);
          face([pt(s, t0), pt(s, t1), pt(s + 1, t1), pt(s + 1, t0)], [u[0] * cm + v[0] * sm, u[1] * cm + v[1] * sm, u[2] * cm + v[2] * sm], col, o);
        }
      }
      if (o.caps !== false) {
        if (r0 > 0) face(Array.from({ length: seg }, (_, i) => pt(0, i / seg * P3TAU)), [-a[0], -a[1], -a[2]], col, o);
        if (r1 > 0) face(Array.from({ length: seg }, (_, i) => pt(ns, i / seg * P3TAU)), a, col, o);
      }
    }

    function box(x0, y0, z0, x1, y1, z1, col, o) {
      if (RX !== 1) { x0 *= RX; x1 *= RX; z0 *= RX; z1 *= RX; }
      o = o || {};
      face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], col, o);
      face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], col, o);
      face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], col, o);
      face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], col, o);
      face([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1], col, o);
      face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], col, o);
    }

    function line(a, b, col, w, L) {
      const p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]);
      items.push({ L: L == null ? 4 : L, d: (p[2] + q[2]) / 2, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col, w });
    }

    function wire(x0, y0, z0, x1, y1, z1, col, w, L) {
      const c = [
        [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
        [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]
      ];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => {
        line(c[e[0]], c[e[1]], col, w, L);
      });
    }

    function ring(c, r, col, w, L, ax) {
      if (RX !== 1) { c = [c[0] * RX, c[1], c[2] * RX]; r *= RX; }
      const A = P3AX[ax || 'y'], u = A[1], v = A[2], pts = [];
      let d = 0;
      for (let i = 0; i < 40; i++) {
        const th = i / 40 * P3TAU, cs = Math.cos(th) * r, sn = Math.sin(th) * r;
        const p = P(c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn);
        pts.push(p); d += p[2];
      }
      items.push({ L, d: d / 40, k: 2, pts, col, w });
    }

    const phase = f => still ? 0 : t * 14 / (1.7 - 1.3 * Math.sqrt(f));

    function pipe(pts, r, col, fl) {
      if (RX !== 1) pts = pts.map(q => [q[0] * RX, q[1], q[2] * RX]);
      let cum = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const p = P(pts[i][0], pts[i][1], pts[i][2]), q = P(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
        const d = (p[2] + q[2]) / 2, len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        items.push({ L: 2, d, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col: rgba(col, 1), w: Math.max(1.5, 2 * r * k), hl: 1 });
        if (fl && fl.f >= 0.015) {
          const f = clamp(fl.f, 0, 1), sf = Math.sqrt(f);
          items.push({ L: 2, d: d - 0.05, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col: fl.color, w: Math.max(1.6, r * k * 1.1), dash: [6, 8], off: cum - phase(f), al: 0.4 + 0.6 * sf });
        }
        cum += len;
      }
    }

    function fline(pts, f, color, wpx) {
      if (RX !== 1) pts = pts.map(q => [q[0] * RX, q[1], q[2] * RX]);
      f = clamp(f, 0, 1);
      if (f < 0.015) return;
      let cum = 0;
      const sf = Math.sqrt(f);
      for (let i = 0; i < pts.length - 1; i++) {
        const p = P(pts[i][0], pts[i][1], pts[i][2]), q = P(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
        items.push({ L: 2, d: (p[2] + q[2]) / 2 - 0.05, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col: color, w: wpx || 2, dash: [5, 7], off: cum - phase(f), al: 0.4 + 0.6 * sf });
        cum += Math.hypot(q[0] - p[0], q[1] - p[1]);
      }
    }

    function valve(x, y, z, open) {
      box(x - 0.55, y - 0.55, z - 0.55, x + 0.55, y + 0.55, z + 0.55, open ? [60, 190, 125] : [58, 74, 82], {});
    }

    function label(txt, x, y, z, dx, dy, align, col, size, lead) {
      const p = P(x, y, z);
      if (p[0] < 6 || p[0] > W - 6 || p[1] < 6 || p[1] > H - 6) return;
      labels.push({ txt, x: p[0], y: p[1], dx, dy, align: align || 'start', col: col || '#2b3f46', size: size || 11, lead: lead !== false });
    }

    const c = S.ctl, on = S.turbOn && S.turbTrip <= 0, brk = on && S.offsite;
    const STEEL = [150, 172, 180], DKS = [92, 112, 120], CONC = [196, 203, 206], WAT = [63, 155, 224], PIPEC = [112, 136, 145];
    const f0 = clamp((S.pT - 30) / 90, 0, 1);
    const poolCol = [Math.round(43 + 212 * f0), Math.round(121 + 17 * f0), Math.round(184 - 123 * f0)];
    const steamF = clamp((S.qt + S.qb) / C.MWT * 1.4, 0, 1), turbF = clamp(S.qt / C.MWT * 1.4, 0, 1), bypF = clamp(S.qb / C.QB_MAX, 0, 1);
    const icF = clamp(S.qic / C.IC_MAX, 0, 1), fwF = clamp(S.fwNow, 0, 1), natF = S.Tc > 100 ? S.pth / 300 : 0;
    const condCap = (S.offsite && S.sea) ? c.cw / 3 : 0, cwF = condCap, heat = 0.652 * S.qt + S.qb, dT = condCap > 0 ? heat / (condCap * 21 * 4.18) : 0;
    const w = clamp(dT / 10, 0, 1);
    const ramp = (A, B, Cc) => {
      const tt = w < 0.5 ? w * 2 : (w - 0.5) * 2, X = w < 0.5 ? A : B, Y = w < 0.5 ? B : Cc;
      return X.map((v, i) => Math.round(v + (Y[i] - v) * tt));
    };
    const lakeC = ramp([59, 147, 212], [236, 200, 130], [224, 110, 40]);

    // Reactor building shell
    box(-9, 0, -9, 9, 30, 9, CONC, { a: 0.045, shell: true, Lb: 1, Lf: 4 });
    wire(-9, 0, -9, 9, 30, 9, 'rgba(100,115,122,.55)', 1.2, 4);

    // Steel containment
    cyl([0, 0, 0], 'y', 6, 6, 26, STEEL, { a: 0.07, shell: true, seg: 30, ns: 1, Lb: 1, Lf: 4 });
    ring([0, 0, 0], 6, 'rgba(70,95,105,.8)', 2, 4);
    ring([0, 26, 0], 6, 'rgba(70,95,105,.8)', 2, 4);

    // Suppression pool
    cyl([0, 0.3, 0], 'y', 5.4, 5.4, 2.0, poolCol, { a: 0.86, seg: 30, ns: 1 });

    // Reactor pressure vessel (RPV)
    RX = 1.45;
    cyl([0, 2.3, 0], 'y', 1.7, 1.2, 0.3, DKS, { seg: 14, ns: 1 });
    const BWAT = WAT.map((v, i) => Math.round(v + ([150, 100, 215][i] - v) * clamp(S.boron * 1.2, 0, 1)));
    const Y0 = 3.2, HV = 14.3, wTop = Y0 + clamp(S.level / 100, 0, 1.12) * HV;
    const VO = { a: 0.12, shell: true, seg: 22, ns: 1, Lb: 1, Lf: 3 };
    cyl([0, 2.5, 0], 'y', 1.2, 1.9, 0.4, STEEL, VO);
    cyl([0, 2.9, 0], 'y', 1.9, 2.3, 0.3, STEEL, VO);
    cyl([0, Y0, 0], 'y', 2.3, 2.3, 16.3, STEEL, Object.assign({ ns: 3 }, VO));
    cyl([0, 19.5, 0], 'y', 2.3, 2.0, 0.6, STEEL, VO);
    cyl([0, 20.1, 0], 'y', 2.0, 1.2, 0.6, STEEL, VO);
    cyl([0, 20.7, 0], 'y', 1.2, 0.5, 0.3, STEEL, VO);
    ring([0, Y0, 0], 2.3, 'rgba(70,95,105,.7)', 1.4, 3);
    ring([0, 19.5, 0], 2.3, 'rgba(70,95,105,.7)', 1.4, 3);
    cyl([0, Y0, 0], 'y', 2.15, 2.15, Math.max(0.2, wTop - Y0), BWAT, { a: 0.3, seg: 22, ns: 1 });
    cyl([0, 4.2, 0], 'y', 1.45, 1.45, 4.6, [110, 130, 138], { a: 0.4, seg: 18, ns: 1, caps: false });
    cyl([0, 8.8, 0], 'y', 1.0, 1.0, 6.4, [120, 140, 148], { a: 0.55, seg: 16, ns: 1, caps: false });

    [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].forEach(q => {
      cyl([q[0], 15.2, q[1]], 'y', 0.07, 0.07, 0.8, [130, 148, 156], { seg: 6, ns: 1, caps: false });
      cyl([q[0], 16.0, q[1]], 'y', 0.2, 0.2, 0.8, [160, 176, 182], { seg: 8, ns: 1 });
    });
    cyl([0, 17.0, 0], 'y', 1.65, 1.65, 1.5, [190, 165, 110], { a: 0.35, seg: 18, ns: 1 });
    cyl([0, 8.2, 0], 'y', 1.3, 1.3, 0.12, [90, 108, 116], { a: 0.6, seg: 18, ns: 1 });
    cyl([0, 4.05, 0], 'y', 1.3, 1.3, 0.15, [70, 86, 94], { seg: 18, ns: 1 });
    cyl([0, 4.2, 0], 'y', 1.25, 1.25, 4.0, p3rgb(coreColor(Math.sqrt(S.n) * 0.9 + S.h * 2)), { a: 0.88, seg: 18, ns: 1 });

    const rl = clamp(0.9 + (1 - S.rod) * 4.2, 0.9, 5);
    [[0, 0], [0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]].forEach(q => {
      cyl([q[0], 3.4, q[1]], 'y', 0.13, 0.13, rl, [18, 28, 32], { seg: 6, ns: 1 });
    });
    fline([[0, 8.4, 0], [0, 15.0, 0]], natF, '#e6f2fa', 2.4);
    [[1.75, 0], [-1.75, 0], [0, 1.75], [0, -1.75]].forEach(q => {
      fline([[q[0], 16.4, q[1]], [q[0], 4.2, q[1]]], natF, '#6fb4ee', 2.2);
    });
    RX = 1;

    // Steam line & Bypass
    valve(3.8, 19.5, 0, c.msiv);
    pipe([[3.3, 19.5, 0], [14, 19.5, 0], [21, 19.5, 0], [21, 9.2, 0]], 0.42, PIPEC, { f: steamF, color: 'rgba(235,244,248,1)' });
    valve(21, 11.2, 0, on);
    pipe([[14, 19.5, 0], [14, 19.5, -5.5], [14, 2.6, -5.5], [28.5, 2.6, -5.5], [28.5, 2.6, -3]], 0.3, PIPEC, { f: bypF, color: 'rgba(255,196,107,1)' });
    valve(14, 11, -5.5, S.qb > 5);

    // Feedwater line
    pipe([[30, 0.3, 1.2], [30, 0.9, 5], [7.5, 0.9, 5], [7.5, 15, 5], [0, 15, 5], [0, 15, 3.3]], 0.3, PIPEC, { f: fwF, color: 'rgba(111,180,238,1)' });

    // Standby Liquid Control (Boron injection)
    const bInj = c.slc && S.tank > 0 && S.ac, bF = bInj ? 1 : 0, BCOL = [150, 110, 200], BFL = 'rgba(200,150,240,1)';
    cyl([-7, 0, 6.8], 'y', 1.1, 1.1, 5.6, STEEL, { a: 0.3, seg: 16, ns: 1, shell: true, Lb: 1, Lf: 3 });
    cyl([-7, 0.05, 6.8], 'y', 1.0, 1.0, Math.max(0.05, 5.4 * clamp(S.tank / 100, 0, 1)), BCOL, { a: 0.8, seg: 16, ns: 1 });
    cyl([-7.6, 0, 4.1], 'y', 0.5, 0.5, 2.0, STEEL, { a: 0.3, seg: 10, ns: 1, shell: true, Lb: 1, Lf: 3 });
    cyl([-4.5, 0.9, 6.8], 'x', 0.45, 0.45, 1.0, bInj ? [60, 150, 110] : [118, 140, 148], { seg: 10, ns: 1 });
    pipe([[-5.9, 0.9, 6.8], [-4.5, 0.9, 6.8]], 0.16, BCOL, { f: bF, color: BFL });
    pipe([[-3.5, 0.9, 6.8], [-1.9, 0.9, 6.8], [-1.9, 5.2, 6.8], [-0.81, 5.2, 1.77]], 0.16, BCOL, { f: bF, color: BFL });
    box(-1.81 - 0.4, 5.2 - 0.4, 6.4 - 0.4, -1.81 + 0.4, 5.2 + 0.4, 6.4 + 0.4, bInj ? [60, 190, 125] : [58, 74, 82], {});
    box(-1.3 - 0.3, 5.2 - 0.3, 4.03 - 0.3, -1.3 + 0.3, 5.2 + 0.3, 4.03 + 0.3, [112, 136, 145], {});
    pipe(Array.from({ length: 25 }, (_, i) => [Math.cos(2 + i / 24 * P3TAU) * 1.95, 5.2, Math.sin(2 + i / 24 * P3TAU) * 1.95]), 0.07, [150, 110, 200], { f: bF, color: BFL });

    [20, 23.5, 27].forEach(x => cyl([x, 0.9, 5], 'x', 0.62, 0.62, 2.0, [118, 140, 148], { seg: 10, ns: 1 }));
    cyl([11, 0.1, 5], 'y', 0.85, 0.85, 1.6, fwF > 0.02 ? [60, 150, 110] : [170, 70, 60], { seg: 12, ns: 1 });

    // Isolation Condenser (IC) on roof
    valve(0, 21.5, 0, S.icOpen);
    pipe([[0, 21.2, 0], [0, 28.5, 0], [-6.5, 28.5, 0], [-6.5, 35, 0]], 0.3, PIPEC, { f: icF, color: 'rgba(235,244,248,1)' });
    pipe([[-6.5, 35, -2.4], [-6.5, 35, 2.4]], 0.28, PIPEC, { f: icF, color: 'rgba(235,244,248,1)' });
    pipe([[6.5, 32, -2.4], [6.5, 32, 0]], 0.28, PIPEC, { f: icF, color: 'rgba(111,180,238,1)' });
    pipe([[6.5, 32, 2.4], [6.5, 32, 0]], 0.28, PIPEC, { f: icF, color: 'rgba(111,180,238,1)' });
    pipe([[6.5, 32, 0], [6.5, 28, 0], [3.5, 28, 1.8], [3.5, 11, 1.8], [2.3, 11, 2.4]], 0.3, PIPEC, { f: icF, color: 'rgba(111,180,238,1)' });

    [-2.4, 0, 2.4].forEach(zb => {
      pipe([[-6.5, 35, zb], [-5, 35, zb]], 0.24, PIPEC, null);
      pipe([[5, 32, zb], [6.5, 32, zb]], 0.24, PIPEC, null);
      cyl([-5.2, 35, zb], 'x', 0.42, 0.42, 10.4, STEEL, { seg: 10 });
      cyl([-5.2, 32, zb], 'x', 0.42, 0.42, 10.4, STEEL, { seg: 10 });
      for (let i = 0; i < 10; i++) {
        const x = -4.5 + i;
        cyl([x, 32, zb], 'y', 0.09, 0.09, 3, [120, 140, 148], { seg: 5, ns: 1, caps: false });
        if (i % 2 === 0) fline([[x, 34.8, zb], [x, 32.2, zb]], icF, 'rgba(210,235,250,1)', 1.8);
      }
      fline([[-5, 35, zb], [5, 35, zb]], icF, 'rgba(235,244,248,1)', 2.2);
      fline([[-5, 32, zb], [5, 32, zb]], icF, 'rgba(111,180,238,1)', 2.2);
    });

    box(-8, 30, -3.6, 8, 37.5, 3.6, WAT, { a: 0.22, shell: true, Lb: 1, Lf: 3 });
    wire(-8, 30, -3.6, 8, 37.5, 3.6, 'rgba(50,110,160,.8)', 1.4, 4);

    if (S.icOpen && S.qic > 1 && !still) {
      for (let i = 0; i < 9; i++) {
        const ph = ((t * 0.5 + i / 9) % 1), px = -6 + (i * 5.3 % 12), pz = -2 + (i * 2.7 % 4);
        const p = P(px + ph * 1.5, 37.5 + ph * 5, pz);
        items.push({ L: 5, d: p[2], k: 3, x: p[0], y: p[1], r: (3 + ph * 9) * k / 9, a: 0.5 * (1 - ph) * clamp(icF * 1.6, 0.2, 1) });
      }
    }

    // Turbine Hall
    box(15, 0, -6.5, 45, 12, 6.5, CONC, { a: 0.09, shell: true, Lb: 1, Lf: 4 });
    wire(15, 0, -6.5, 45, 12, 6.5, 'rgba(100,115,122,.55)', 1.2, 4);
    box(15, 4.8, -6.5, 45, 5.5, 6.5, CONC, { a: 0.3, shell: true, Lb: 1, Lf: 3 });

    const TC = on ? [92, 160, 126] : [128, 150, 158];
    cyl([18.5, 7.5, 0], 'x', 0.32, 0.32, 25.5, [96, 114, 122], { seg: 8 });
    cyl([19, 7.5, 0], 'x', 1.2, 1.2, 4, TC, { seg: 16 });
    cyl([24, 7.5, 0], 'x', 2.0, 2.0, 5, TC, { seg: 18 });
    cyl([30, 7.5, 0], 'x', 2.0, 2.0, 5, TC, { seg: 18 });
    cyl([37, 7.5, 0], 'x', 1.7, 1.7, 5.5, brk ? [92, 160, 126] : [128, 150, 158], { seg: 18 });
    cyl([42.6, 7.5, 0], 'x', 0.9, 0.9, 1.8, [128, 150, 158], { seg: 12 });
    fline([[18.5, 7.5, 0], [44, 7.5, 0]], S.rpm / 1500, 'rgba(235,244,248,1)', 3);

    cyl([24, 10.2, -3.3], 'x', 0.9, 0.9, 10, [120, 140, 148], { seg: 12 });
    pipe([[22.5, 8.7, 0], [22.5, 10.2, 0], [22.5, 10.2, -3.3], [24, 10.2, -3.3]], 0.28, PIPEC, { f: on ? clamp(S.qt / C.MWT, 0, 1) : 0, color: 'rgba(235,244,248,1)' });
    [26.5, 32.5].forEach(x => {
      pipe([[x, 10.2, -3.3], [x, 10.2, 0], [x, 9.5, 0]], 0.28, PIPEC, { f: on ? clamp(S.qt / C.MWT, 0, 1) : 0, color: 'rgba(255,196,107,1)' });
      cyl([x, 4.6, 0], 'y', 1.3, 1.3, 0.95, [190, 205, 210], { a: 0.9, seg: 12, ns: 1 });
    });

    // Main Condenser
    box(22.4, 0.4, -3, 37.6, 4.6, 3, [70, 110, 140], { a: 0.42, shell: true, Lb: 1, Lf: 3 });
    box(28, 0.02, -1.2, 32, 0.4, 1.2, [40, 90, 140], {});
    box(22.4, 0.4, -3, 23.4, 4.6, 3, lakeC, { a: 0.7 });
    box(36.6, 0.4, -3, 37.6, 4.6, 3, lakeC, { a: 0.7 });
    [1.6, 3.4].forEach(y => [-1.8, -0.6, 0.6, 1.8].forEach(z => {
      pipe([[23.4, y, z], [36.6, y, z]], 0.13, lakeC, { f: cwF, color: 'rgba(210,235,250,1)' });
    }));
    pipe([[21, 1.2, -12], [21, 1.2, 0], [22.4, 1.2, 0]], 0.5, PIPEC, { f: cwF, color: 'rgba(111,180,238,1)' });
    pipe([[37.6, 1.2, 0], [39, 1.2, 0], [39, 1.2, -12]], 0.5, PIPEC, { f: cwF, color: 'rgba(240,160,70,1)' });
    [-10, -8.2, -6.4].forEach((z, i) => {
      cyl([21, 0.2, z], 'y', 0.85, 0.85, 1.7, (condCap > 0 && c.cw >= i + 1) ? [60, 150, 110] : [58, 74, 82], { seg: 12, ns: 1 });
    });

    // Generator breaker & grid lines
    pipe([[39, 9.2, 0], [39, 10.8, 0], [48, 10.8, 0], [48, 3.4, 0]], 0.3, [200, 165, 70], { f: brk ? clamp(S.mwe / 300, 0, 1) : 0, color: 'rgba(255,236,150,1)' });
    box(43.4, 10.2, -0.6, 44.6, 11.4, 0.6, brk ? [60, 190, 125] : [58, 74, 82], {});
    box(46.4, 0, -1.8, 49.6, 3.4, 1.8, [70, 84, 92], {});
    [-1.2, 0, 1.2].forEach(z => {
      cyl([48, 3.4, z], 'y', 0.18, 0.18, 0.9, [200, 205, 208], { seg: 6, ns: 1 });
    });
    line([53, 0, 0], [53, 13, 0], 'rgba(70,84,92,1)', 2.4, 2);
    line([53, 11.6, -2.8], [53, 11.6, 2.8], 'rgba(70,84,92,1)', 2.2, 2);
    line([53, 9.4, -2.2], [53, 9.4, 2.2], 'rgba(70,84,92,1)', 2, 2);
    line([48, 4.3, -1.2], [53, 11.6, -2.8], 'rgba(70,84,92,.9)', 1.2, 2);
    line([48, 4.3, 1.2], [53, 11.6, 2.8], 'rgba(70,84,92,.9)', 1.2, 2);
    line([48, 4.3, 0], [53, 9.4, 0], 'rgba(70,84,92,.9)', 1.2, 2);
    line([53, 11.6, -2.8], [60, 11.6, -2.8], 'rgba(70,84,92,.5)', 1, 2);
    line([53, 11.6, 2.8], [60, 11.6, 2.8], 'rgba(70,84,92,.5)', 1, 2);

    // Natural landscape: scenic 3D trees (conifers & deciduous park shade trees)
    function tree(x, z, h, r, isPine) {
      cyl([x, 0, z], 'y', r * 0.22, r * 0.18, h * 0.35, [115, 75, 45], { seg: 6 });
      if (isPine) {
        cyl([x, h * 0.28, z], 'y', r, r * 0.45, h * 0.38, [21, 128, 61], { seg: 8 });
        cyl([x, h * 0.55, z], 'y', r * 0.65, 0.1, h * 0.45, [34, 197, 94], { seg: 8 });
      } else {
        cyl([x, h * 0.32, z], 'y', r * 0.9, r, h * 0.4, [34, 197, 94], { seg: 8 });
        cyl([x, h * 0.65, z], 'y', r * 0.85, 0.2, h * 0.38, [74, 222, 128], { seg: 8 });
      }
    }

    const TREES = [
      // Shoreline of Lake Ontario
      [10, -15, 6, 2.2, true],
      [18, -15, 7, 2.4, false],
      [26, -15.5, 6.5, 2.3, true],
      [34, -15, 7.5, 2.5, false],
      [42, -15.5, 6, 2.2, true],
      [50, -15, 7, 2.4, false],
      // Background / far lake park
      [12, -29, 8, 2.8, true],
      [22, -30, 8.5, 3.0, false],
      [35, -29, 9, 3.0, true],
      [48, -30, 8, 2.8, false],
      // West perimeter (behind and beside reactor building)
      [-18, -10, 7, 2.5, false],
      [-20, -2, 7.5, 2.6, true],
      [-19, 6, 6.5, 2.3, false],
      [-18, 14, 7, 2.4, true],
      // East perimeter (beside turbine and switchyard)
      [54, -6, 6.5, 2.3, true],
      [56, 2, 7, 2.4, false],
      [54, 10, 6.5, 2.3, true],
      // Distant perimeter park
      [-14, 18, 6.5, 2.3, false],
      [50, 18, 7, 2.4, true]
    ];
    TREES.forEach(t => tree(t[0], t[1], t[2], t[3], t[4]));

    // Hover outlines
    if (cam.hover === 'cond') wire(22.4, 0.4, -3, 37.6, 4.6, 3, '#0284c7', 2.4, 5);
    if (cam.hover === 'turb') wire(15, 0, -6.5, 45, 12, 6.5, '#0284c7', 2.4, 5);
    if (cam.hover === 'ic') wire(-8, 30, -3.6, 8, 37.5, 3.6, '#0284c7', 2.4, 5);
    if (cam.hover === 'rpv') wire(-3.4, 2.5, -3.4, 3.4, 21, 3.4, '#0284c7', 2.4, 5);

    // Sort and render 3D items
    items.sort((a, b) => a.L - b.L || b.d - a.d);
    for (const it of items) {
      if (it.k === 0) {
        ctx.beginPath();
        it.p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
        ctx.closePath();
        ctx.fillStyle = rgba(it.c, it.a);
        ctx.fill();
        if (it.a >= 0.999) {
          ctx.strokeStyle = rgba(it.c, 1);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      } else if (it.k === 1) {
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(it.x1, it.y1); ctx.lineTo(it.x2, it.y2);
        if (it.dash) {
          ctx.setLineDash(it.dash);
          ctx.lineDashOffset = it.off;
          ctx.globalAlpha = it.al;
          ctx.lineCap = 'butt';
        }
        ctx.strokeStyle = it.col;
        ctx.lineWidth = it.w;
        ctx.stroke();
        if (it.dash) {
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        if (it.hl) {
          ctx.beginPath();
          ctx.moveTo(it.x1 - it.w * 0.18, it.y1 - it.w * 0.18);
          ctx.lineTo(it.x2 - it.w * 0.18, it.y2 - it.w * 0.18);
          ctx.strokeStyle = 'rgba(255,255,255,.28)';
          ctx.lineWidth = it.w * 0.26;
          ctx.stroke();
        }
      } else if (it.k === 2) {
        ctx.beginPath();
        it.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
        ctx.closePath();
        ctx.strokeStyle = it.col;
        ctx.lineWidth = it.w;
        ctx.stroke();
      } else if (it.k === 3) {
        ctx.beginPath();
        ctx.arc(it.x, it.y, Math.max(1, it.r), 0, P3TAU);
        ctx.fillStyle = 'rgba(250,252,253,' + it.a + ')';
        ctx.fill();
      }
    }

    // Hit testing bounding boxes
    const bb = (x0, y0, z0, x1, y1, z1) => {
      let a = 1e9, b = 1e9, cc = -1e9, d = -1e9;
      [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]].forEach(q => {
        const p = P(q[0], q[1], q[2]);
        a = Math.min(a, p[0]); b = Math.min(b, p[1]); cc = Math.max(cc, p[0]); d = Math.max(d, p[1]);
      });
      return [a, b, cc, d];
    };
    cam.hit = {
      ic: bb(-10, 28, -7, 10, 42, 7),
      cond: bb(18, 0, -5.5, 42, 5, 5.5),
      turb: bb(14, 5, -7.5, 48, 14, 7.5),
      rpv: bb(-7.5, 1.5, -7.5, 7.5, 26, 7.5)
    };

    // Labels with clickable cues
    if (cam.labels !== false) {
      label('CONTAINMENT', -6, 21, 0, -16, -4, 'end');
      label('BORON TANK (poison)', -7, 5.6, 6.8, -18, -6, 'end', '#6b3fa0', 11);
      label('BORON LINE', -1.3, 5.2, 4.03, -26, -16, 'end', '#6b3fa0', 10);
      label('REACTOR VESSEL ↗ (CLICK)', -3.4, 12, 0, -22, 0, 'end', '#0284c7', 11.5);
      label('SUPPRESSION POOL', -5.4, 1.3, 0, -16, 6, 'end');
      label('ISOLATION CONDENSER ↗ (CLICK)', -8, 36, 0, -14, -8, 'end', '#0284c7', 11.5);
      label('IC pool · 3 trains · vented', -8, 36, 0, -14, 6, 'end', '#4a6068', 10, false);
      label('IC isolation valve', 0, 21.5, 0, 24, -20, 'start', '#4a6068', 10);
      label('MSIV', 3.8, 19.5, 0, 14, -12, 'start', '#4a6068', 10);
      label('TURBINE HALL ↗ (CLICK)', 26, 12, -6.5, 0, -10, 'middle', '#0284c7', 11.5, false);
      label('GENERATOR', 40, 9.2, 0, 14, -22, 'start', '#2b3f46', 10.5);
      label('MAIN CONDENSER ↗ (CLICK)', 30, 0.4, 3, 0, 22, 'middle', '#0284c7', 11, false);
      label('FEEDWATER PUMP', 11, 1.8, 5, -4, 22, 'end');
      label('BYPASS', 14, 11, -5.5, -12, 0, 'end', '#4a6068', 10);
      label('CW PUMPS', 21, 1.6, -8, -16, 0, 'end', '#4a6068', 10);
      label('LAKE ONTARIO', 48, 0, -17, 0, 0, 'middle', '#2a6a9a', 12, false);
      label('GRID', 53, 13.4, 0, 0, -8, 'middle', '#2b3f46', 11, false);
    }

    ctx.textBaseline = 'alphabetic';
    labels.forEach(l => {
      ctx.font = p3f(500, l.size);
      ctx.textAlign = l.align;
      if (l.lead) {
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.dx * 0.9, l.y + l.dy - 3);
        ctx.strokeStyle = 'rgba(60,80,88,.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.strokeText(l.txt, l.x + l.dx, l.y + l.dy);
      ctx.fillStyle = l.col;
      ctx.fillText(l.txt, l.x + l.dx, l.y + l.dy);
    });

    // In-canvas HUD
    ctx.lineJoin = 'round';
    ctx.textAlign = 'left';
    ctx.font = p3f(500, 12);
    const lines = [hud.core, hud.steam + '   ' + hud.lvl, hud.pool, hud.ic].filter(Boolean);
    lines.forEach((s, i) => {
      const y = 18 + i * 16;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeText(s, 10, y);
      ctx.fillStyle = i === 3 ? '#0284c7' : '#10212a';
      ctx.fillText(s, 10, y);
    });

    if (hud.mwe) {
      ctx.textAlign = 'right';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.font = p3f(600, 15);
      ctx.strokeText(hud.mwe, W - 10, 20);
      ctx.fillStyle = '#10212a';
      ctx.fillText(hud.mwe, W - 10, 20);
      if (hud.grid) {
        ctx.font = p3f(500, 12);
        ctx.strokeText(hud.grid, W - 10, 38);
        ctx.fillStyle = '#0284c7';
        ctx.fillText(hud.grid, W - 10, 38);
      }
    }
  }

  root.BWR_3D = {
    p3Scene, coreColor, p3rgb, P3TAU
  };
})(typeof window !== 'undefined' ? window : globalThis);
