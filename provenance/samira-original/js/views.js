/* BWRX-300 Component Detailed Visualizations: Turbine Hall, Condenser Room, Isolation Condenser, RPV 3D Cutaway */
(function (root) {
  'use strict';

  const B = root.BWR || window.BWR;
  const C = B.C;
  const clamp = B.clamp;

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

  const tsat = P => {
    let a = 20, b = 330;
    for (let i = 0; i < 24; i++) {
      const m = (a + b) / 2;
      if (B.psat(m) < P) a = m; else b = m;
    }
    return (a + b) / 2;
  };

  function flow(id, f, doc) {
    const d = doc || document;
    const e = d.getElementById(id);
    if (!e) return;
    f = clamp(f, 0, 1);
    if (f < 0.015) { e.style.opacity = '0'; return; }
    f = Math.sqrt(f);
    e.style.opacity = (0.35 + 0.65 * f).toString();
    e.style.setProperty('--dur', (1.7 - 1.3 * f).toFixed(2) + 's');
  }

  function valve(id, open, doc) {
    const d = doc || document;
    const e = d.getElementById(id);
    if (!e) return;
    e.style.fill = open ? 'var(--green, #4fd08e)' : '#2a3a40';
  }

  /* ---------------- Turbine Hall ---------------- */
  const STEPS = [
    'Steam supply', 'Governor valves', 'HP turbine', 'Separator and reheater',
    'LP turbines', 'Condenser and lake', 'Condensate and heaters', 'Feedwater to reactor'
  ];
  const TXT = [
    'Dry saturated steam leaves the vessel through the MSIVs and the stop valves.',
    'Governor valves match steam flow to the load the grid asks for and to reactor pressure.',
    'The first turbine takes the high-pressure steam and lowers its pressure by about 80%.',
    'Droplets are separated out, then live steam reheats the rest so the last blades stay dry.',
    'Two double-flow turbines expand the steam down to condenser pressure.',
    'Steam condenses on lake-water-cooled tubes. Less lake flow or warmer water means worse vacuum and less power.',
    'Condensate pumps lift water out of the hotwell. Bleed steam warms it in the heaters.',
    'Feedwater pumps return water to the reactor against full vessel pressure.'
  ];

  function renderTurbine(S, doc) {
    const d = doc || document;
    const c = S.ctl, rpm = S.rpm, load = clamp(S.qt / C.MWT, 0, 1.1), on = S.turbOn && S.turbTrip <= 0;
    const gov = on ? clamp(S.qt / C.MWT * 100, 0, 100) : 0, kg = (S.qt + S.qb) / 1.85;
    const condCap = (S.offsite && S.sea) ? c.cw / 3 : 0, cwFlow = condCap * 21;
    const heat = 0.652 * S.qt + S.qb, dT = cwFlow > 0 ? heat / (cwFlow * 4.18) : 0;
    const hpP = on ? S.p * (0.12 + 0.1 * load) : 0, lpT = hpP > 0.05 ? tsat(hpP) + 30 : 0;
    const fwT = (S.fwNow > 0.02) ? 40 + 175 * clamp(S.qt / 600, 0, 1) : 0;
    const vib = rpm > 20 ? 12 + 10 * rpm / 1500 + 25 * Math.max(0, S.vac - 12) / 60 : 0;
    const fq = 50 * rpm / 1500, brk = on && S.offsite;

    const fl = (id, f) => flow(id, f, d);
    fl('tfHdr', kg / 470 * 0.9 + (S.qt + S.qb > 1 ? 0.05 : 0));
    fl('tfHP', on ? load : 0);
    fl('tfX1', on ? load : 0);
    fl('tfX2', on ? load : 0);
    fl('tfL1', on ? load : 0);
    fl('tfL2', on ? load : 0);
    fl('tfBy', S.qb / C.QB_MAX);
    fl('tfCWi', cwFlow / 21);
    fl('tfCWo', cwFlow / 21);
    fl('tfFw', S.fwNow);
    fl('tfGrid', brk ? S.mwe / 300 : 0);
    fl('tShaft', rpm / 1500);

    valve('tvMsiv', c.msiv, d);
    valve('tvStop', on, d);
    valve('tvGv', gov > 3, d);
    valve('tvBy', S.qb > 5, d);

    const tvBrk = d.getElementById('tvBrk');
    if (tvBrk) tvBrk.style.fill = brk ? 'var(--green, #4fd08e)' : '#2a3a40';

    [1, 2, 3].forEach(i => {
      const e = d.getElementById('tvCW' + i);
      if (e) e.style.fill = (condCap > 0 && c.cw >= i) ? '#1c4a37' : '#16262d';
    });

    const tvCP = d.getElementById('tvCP'); if (tvCP) tvCP.style.fill = S.fwNow > 0.02 ? '#1c4a37' : '#16262d';
    const tvFP = d.getElementById('tvFP'); if (tvFP) tvFP.style.fill = S.fwNow > 0.02 ? '#1c4a37' : '#16262d';

    const setTxt = (id, val) => { const e = d.getElementById(id); if (e) e.textContent = val; };
    setTxt('tvHdr', `${S.p.toFixed(2)} MPa  ${S.Tc.toFixed(0)} °C`);
    setTxt('tvRpm', `${rpm.toFixed(0)} rpm   ${fq.toFixed(1)} Hz`);
    setTxt('tvLoad', `${S.mwe.toFixed(0)} MWe   BREAKER ${brk ? 'CLOSED' : 'OPEN'}`);
    setTxt('tvGvT', `GOVERNOR VALVES ${gov.toFixed(0)} %`);
    setTxt('tvStT', `STEAM ${kg.toFixed(0)} kg/s`);
    setTxt('tvByT', `BYPASS ${(S.qb / C.QB_MAX * 100).toFixed(0)} %   VIBRATION ${vib.toFixed(0)} µm`);
    setTxt('tvGen', `STATOR ${(45 + 55 * Math.pow(S.mwe / 300, 2)).toFixed(0)} °C   H2 0.4 MPa`);
    setTxt('tvVac', `VACUUM ${S.vac.toFixed(1)} kPa`);
    setTxt('tvDT', cwFlow > 0 ? `LAKE +${dT.toFixed(1)} K` : 'NO LAKE FLOW');

    const V = [
      `${S.p.toFixed(2)} MPa, ${(kg).toFixed(0)} kg/s`,
      `${gov.toFixed(0)} % open`,
      on ? `exhaust ${hpP.toFixed(2)} MPa` : 'not turning',
      on ? `LP inlet about ${lpT.toFixed(0)} °C` : '-',
      `${rpm.toFixed(0)} rpm, ${S.mwe.toFixed(0)} MWe`,
      `${S.vac.toFixed(1)} kPa, lake +${dT.toFixed(1)} K`,
      fwT > 0 ? `heated to ${fwT.toFixed(0)} °C` : 'no flow',
      S.fwNow > 0.02 ? `${(S.fwNow * 100).toFixed(0)} % of rated` : 'feedwater lost'
    ];

    const container = d.getElementById('tsteps');
    if (container && container.children.length === 0) {
      STEPS.forEach((n, i) => {
        const item = d.createElement('div');
        const b = d.createElement('b'); b.textContent = (i + 1) + '  ' + n;
        const v = d.createElement('span'); v.className = 'v'; v.id = 'tstep_v_' + i;
        const t = d.createElement('span'); t.textContent = TXT[i];
        item.appendChild(b); item.appendChild(v); item.appendChild(t);
        container.appendChild(item);
      });
    }
    V.forEach((v, i) => {
      const e = d.getElementById('tstep_v_' + i);
      if (e && e.textContent !== v) e.textContent = v;
    });
  }

  /* ---------------- Condenser Room ---------------- */
  const CSTEPS = [
    'Exhaust steam arrives', 'Lake water comes in', 'Steam condenses on the tubes',
    'A vacuum forms', 'Condensate is collected', 'Warm water returns to the lake'
  ];
  const CTXT = [
    'Wet steam leaves the LP turbines at very low pressure. It still carries a lot of heat that must go somewhere.',
    'Darlington uses once-through cooling: pumps draw water from Lake Ontario through fish-protection screens and send it through the tubes.',
    'The steam touches the cold tubes and turns back to liquid. The heat moves into the lake water, which warms by only a few degrees.',
    'Steam shrinks to a tiny volume as it condenses, so the pressure inside drops far below atmospheric. That pull is what lets the turbine make more power.',
    'Drops fall into the hotwell. Pumps lift the water to the feedwater heaters and back to the reactor. Air ejectors pull out leaked-in air.',
    'The warmed water leaves through a diffuser that spreads it into the lake so it mixes quickly. The plant is designed so lake warming is small.'
  ];

  function renderCondenser(S, doc) {
    const d = doc || document;
    const c = S.ctl, condCap = (S.offsite && S.sea) ? c.cw / 3 : 0, cwFlow = condCap * 21;
    const heat = 0.652 * S.qt + S.qb, dT = cwFlow > 0 ? heat / (cwFlow * 4.18) : 0, kg = (S.qt + S.qb) / 1.85;
    const lake = c.lakeT, outT = lake + dT, load = clamp((S.qt + S.qb) / C.MWT, 0, 1.2);
    const steamT = tsat(Math.max(S.vac, 2) / 1000);

    for (let i = 1; i <= 5; i++) flow('cvS' + i, kg / 470 * 0.9, d);
    d.querySelectorAll('#csvg .cvt').forEach(e => {
      const f = cwFlow / 21;
      e.style.setProperty('--dur', (f > 0.02 ? 2.2 / f : 0) + 's');
      e.style.opacity = f > 0.02 ? '1' : '0';
    });
    flow('cfIn', cwFlow / 21, d);
    flow('cfOut', cwFlow / 21, d);
    flow('cfCond', S.fwNow, d);
    flow('cfAir', 0.4, d);

    [1, 2, 3].forEach(i => {
      const e = d.getElementById('cvCW' + i);
      if (e) e.style.fill = (condCap > 0 && c.cw >= i) ? '#1c4a37' : '#16262d';
    });

    const w = clamp(dT / 10, 0, 1);
    const ramp = (s0, s1, s2) => {
      const t = w < 0.5 ? w * 2 : (w - 0.5) * 2, A = w < 0.5 ? s0 : s1, B = w < 0.5 ? s1 : s2;
      return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`;
    };
    const gtB = d.getElementById('gtB'); if (gtB) gtB.style.stopColor = ramp([59, 147, 212], [236, 200, 130], [224, 110, 40]);
    const cvRbox = d.getElementById('cvRbox'); if (cvRbox) cvRbox.style.fill = ramp([43, 121, 184], [210, 170, 110], [206, 96, 36]);
    const cvDrops = d.getElementById('cvDrops'); if (cvDrops) cvDrops.style.opacity = clamp(load * 1.2, 0, 1).toString();

    const setTxt = (id, val) => { const e = d.getElementById(id); if (e) e.textContent = val; };
    setTxt('cvSt', `${S.vac.toFixed(1)} kPa  ${steamT.toFixed(0)} °C`);
    setTxt('cvKg', `${kg.toFixed(0)} kg/s of steam`);
    setTxt('cvVac', `VACUUM ${S.vac.toFixed(1)} kPa`);
    setTxt('cvIn', `LAKE ${lake.toFixed(0)} °C`);
    setTxt('cvFl', cwFlow > 0 ? `${cwFlow.toFixed(0)} m³/s` : 'NO LAKE FLOW');
    setTxt('cvOut', cwFlow > 0 ? `OUT ${outT.toFixed(1)} °C` : 'OUT -');
    setTxt('cvHeat', `${heat.toFixed(0)} MW`);
    setTxt('cvDT', cwFlow > 0 ? `+${dT.toFixed(1)} K` : '');
    setTxt('cvCond', `CONDENSATE ${S.tcond.toFixed(0)} °C`);

    const V = [
      `${kg.toFixed(0)} kg/s at ${S.vac.toFixed(1)} kPa`,
      cwFlow > 0 ? `${cwFlow.toFixed(0)} m³/s at ${lake.toFixed(0)} °C` : 'no lake water flow',
      `${heat.toFixed(0)} MW removed`,
      S.vac < 30 ? `${S.vac.toFixed(1)} kPa, good` : `${S.vac.toFixed(1)} kPa, poor`,
      `${S.tcond.toFixed(0)} °C`,
      cwFlow > 0 ? `${outT.toFixed(1)} °C, +${dT.toFixed(1)} K` : 'no flow'
    ];

    const container = d.getElementById('csteps');
    if (container && container.children.length === 0) {
      CSTEPS.forEach((n, i) => {
        const item = d.createElement('div');
        const b = d.createElement('b'); b.textContent = (i + 1) + '  ' + n;
        const v = d.createElement('span'); v.className = 'v'; v.id = 'cstep_v_' + i;
        const t = d.createElement('span'); t.textContent = CTXT[i];
        item.appendChild(b); item.appendChild(v); item.appendChild(t);
        container.appendChild(item);
      });
    }
    V.forEach((v, i) => {
      const e = d.getElementById('cstep_v_' + i);
      if (e && e.textContent !== v) e.textContent = v;
    });
  }

  /* ---------------- Isolation Condenser (IC) ---------------- */
  const ISTEPS = [
    'Steam rises from the vessel', 'Steam condenses in the tubes', 'The pool boils and vents',
    'Water drains back down', 'No pumps, no power', 'Heat removed so far'
  ];
  const ITXT = [
    'The condenser sits higher than the reactor, above the containment. Steam made by decay heat flows up the pipe through the isolation valve at the vessel.',
    'Inside the tubes the steam touches walls cooled by the pool and turns back into water, giving up its heat. Each of the three trains works the same way.',
    'The pool is open to the air. The heat boils its water at about 100 °C and the steam escapes through the roof, taking the decay heat with it. The pool holds enough water for about seven days.',
    'Condensed water is heavier than steam and the condenser is higher than the vessel, so it drains down the return line and back into the reactor by gravity.',
    'Steam rising and water falling is the whole pumping system. It works with no AC power, which is why it is called passive.',
    'Heat the pool has absorbed since the shift began, shown as the mass of pool water that has boiled away.'
  ];

  function renderIC(S, icE, doc) {
    const d = doc || document;
    const c = S.ctl;
    const open = !!(S.icOpen || (S.qic && S.qic > 0));
    const q = open ? Math.max(S.qic || 0, 38) : 0;
    const icF = open ? clamp(q / C.IC_MAX, 0.35, 1) : 0;
    const hfg = Math.max(900, 2257 - Math.max(0, S.Tc - 100) * 4.04);
    const kgs = open ? (q * 1000 / hfg) : 0;
    const tons = (icE || 0) / 2.257 / 1000;

    if (open) {
      ['iIn', 'iOut', 'iHdrU', 'iHdrL'].forEach(id => flow(id, icF, d));
      for (let i = 0; i < 14; i++) flow('iT' + i, icF, d);
      const iPlume = d.getElementById('iPlume'); if (iPlume) iPlume.style.opacity = clamp(icF * 1.5, 0.4, 1).toString();
      const iBub = d.getElementById('iBub'); if (iBub) iBub.style.opacity = clamp(icF * 1.5, 0.4, 1).toString();
    } else {
      flow('iIn', 0.25, d);
      ['iOut', 'iHdrU', 'iHdrL'].forEach(id => flow(id, 0, d));
      for (let i = 0; i < 14; i++) flow('iT' + i, 0, d);
      const iPlume = d.getElementById('iPlume'); if (iPlume) iPlume.style.opacity = '0';
      const iBub = d.getElementById('iBub'); if (iBub) iBub.style.opacity = '0.15';
    }

    valve('iVin', true, d);
    valve('iVr1', open, d);
    valve('iVr2', open, d);

    const top = 456 - clamp(S.level, 0, 110) / 100 * 98;
    const iWtr = d.getElementById('iWtr');
    if (iWtr) {
      iWtr.setAttribute('y', top.toString());
      iWtr.setAttribute('height', Math.max(1, 456 - top).toString());
    }

    const iCore = d.getElementById('iCore');
    if (iCore && root.BWR_3D) iCore.style.fill = root.BWR_3D.coreColor(Math.sqrt(S.n) * 0.9 + S.h * 2);

    const setTxt = (id, val) => { const e = d.getElementById(id); if (e) e.textContent = val; };
    setTxt('cicSt', 'ISOLATION CONDENSER  ' + (open ? 'IN SERVICE (PASSIVE COOLING)' : 'STANDBY (READY)'));
    setTxt('cicQ', open ? `${q.toFixed(0)} MW into the pool` : 'no heat transfer');
    setTxt('cicKg', open ? `about ${kgs.toFixed(1)} kg/s of steam condensing` : 'valves closed');
    setTxt('cicBoil', `POOL BOILED OFF  ${tons.toFixed(1)} t`);
    setTxt('cicRpv', `${S.p.toFixed(2)} MPa  ${S.Tc.toFixed(0)} °C`);
    setTxt('cicLvl', `LEVEL ${S.level.toFixed(0)} %`);
    setTxt('cicDk', `DECAY HEAT ${(S.h * C.MWT).toFixed(0)} MWt`);

    const V = [
      open ? `${S.p.toFixed(2)} MPa, ${S.Tc.toFixed(0)} °C` : 'valves closed, standing by',
      open ? `${q.toFixed(0)} MW` : '-',
      open ? `about ${kgs.toFixed(1)} kg/s boiling off` : 'pool at rest',
      open ? `back to the vessel at about ${S.Tc.toFixed(0)} °C` : '-',
      open ? 'passive natural loop' : 'standby',
      `${tons.toFixed(1)} t boiled off, ${(icE || 0).toFixed(0)} MJ`
    ];

    const container = d.getElementById('isteps');
    if (container && container.children.length === 0) {
      ISTEPS.forEach((n, i) => {
        const item = d.createElement('div');
        const b = d.createElement('b'); b.textContent = (i + 1) + '  ' + n;
        const v = d.createElement('span'); v.className = 'v'; v.id = 'istep_v_' + i;
        const t = d.createElement('span'); t.textContent = ITXT[i];
        item.appendChild(b); item.appendChild(v); item.appendChild(t);
        container.appendChild(item);
      });
    }
    V.forEach((v, i) => {
      const e = d.getElementById('istep_v_' + i);
      if (e && e.textContent !== v) e.textContent = v;
    });
  }

  /* ---------------- Reactor Pressure Vessel (RPV) Schematic ---------------- */
  function renderRpv(S, doc) {
    const d = doc || document;
    const powMWt = S.pth;
    const natCirc = S.Tc > 100 ? clamp(powMWt / 300, 0.08, 1) : (S.Tc > 50 ? 0.05 : 0);
    const steamF = clamp((S.qt + S.qb + S.qic) / C.MWT * 1.4, 0, 1);
    const fwF = clamp(S.fwNow, 0, 1);
    const icF = (S.icOpen || S.qic > 0) ? clamp(Math.max(S.qic, 38) / C.IC_MAX, 0.35, 1) : 0;
    const boronF = S.boron > 0 ? clamp(S.boron, 0.2, 1) : 0;

    // Natural circulation flow (up chimney riser, down downcomer)
    flow('rfRiser', natCirc, d);
    flow('rfDcL', natCirc, d);
    flow('rfDcR', natCirc, d);

    // Steam & Feedwater flows
    flow('rfSteam', steamF, d);
    flow('rfFw', fwF, d);

    // IC flow & Boron flow
    flow('rfIc', icF > 0 ? icF : 0.22, d);
    flow('rfBoron', boronF, d);

    // Valves
    valve('rvMsiv', S.turbOn && S.turbTrip <= 0, d);
    valve('rvFw', fwF > 0.05, d);
    valve('rvIc', S.icOpen || S.qic > 0, d);
    valve('rvSlc', S.boron > 0, d);

    // Dynamic water level: inside RPV (y: 80 to 390 is 310px height; nominal 100% level is around y=115)
    const lvlPct = clamp(S.level, 0, 120);
    const wTop = 390 - (lvlPct / 100) * 275;
    const rvWtr = d.getElementById('rvWtr');
    if (rvWtr) {
      rvWtr.setAttribute('y', wTop.toFixed(1));
      rvWtr.setAttribute('height', Math.max(2, 390 - wTop).toFixed(1));
    }

    // Core fuel temperature color
    const rvCore = d.getElementById('rvCore');
    if (rvCore && root.BWR_3D) {
      rvCore.style.fill = root.BWR_3D.coreColor(Math.sqrt(S.n) * 0.9 + S.h * 2);
    }

    // Control rods: 5 cruciform blades sliding up/down
    // Fully inserted at S.rod = 0 (top at y=298), fully withdrawn at S.rod = 1 (top at y=365)
    const rodY = 298 + S.rod * 67;
    const rodH = Math.max(4, 385 - rodY);
    for (let i = 1; i <= 5; i++) {
      const rod = d.getElementById('rvRod' + i);
      if (rod) {
        rod.setAttribute('y', rodY.toFixed(1));
        rod.setAttribute('height', rodH.toFixed(1));
      }
    }

    // Live telemetry text tags
    const setTxt = (id, val) => { const e = d.getElementById(id); if (e) e.textContent = val; };
    setTxt('rvPow', `${powMWt.toFixed(0)} MWt (${(S.n * 100).toFixed(1)}%)`);
    setTxt('rvPres', `${S.p.toFixed(2)} MPa  ${S.Tc.toFixed(0)} °C`);
    setTxt('rvLvl', `LEVEL ${S.level.toFixed(0)}% (${(14.2 * (S.level / 100)).toFixed(1)} m)`);
    setTxt('rvRods', `RODS ${(S.rod * 100).toFixed(0)}% WITHDRAWN`);
    setTxt('rvFlow', natCirc > 0.05 ? `CIRCULATION ${(natCirc * 100).toFixed(0)}% NATURAL` : 'NATURAL CIRCULATION STANDBY');
    setTxt('rvStmFl', steamF > 0.05 ? `${((S.qt + S.qb) / 1.85).toFixed(0)} kg/s STEAM` : 'MSIV CLOSED / NO FLOW');
    setTxt('rvFwFl', fwF > 0.05 ? `${(fwF * 180).toFixed(0)} kg/s FW` : 'FW ISOLATED');
  }

  /* ---------------- Reactor Vessel 3D Cutaway ---------------- */
  const P3RT = (() => {
    const cells = [], single = [];
    for (let i = -5; i <= 5; i++) {
      for (let j = -5; j <= 5; j++) {
        const r2 = i * i + j * j;
        if (r2 <= 17) cells.push([i * 0.46, j * 0.46]);
        else if (r2 === 18 || r2 === 20) single.push([i * 0.46, j * 0.46]);
      }
    }
    const ass = [];
    cells.forEach(c => {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(d => {
        ass.push([c[0] + d[0] * 0.115, c[1] + d[1] * 0.115]);
      });
    });
    single.forEach(c => ass.push(c));
    return { cells, ass };
  })();

  function p3Rpv(ctx, W, H, dpr, t, S, C, coreColor, cam, still) {
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f0f9ff'); bg.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    [-3.4, 3.4].forEach(x => {
      [cam.cy - cam.span / 2, cam.cy + cam.span / 2].forEach(y => {
        [-3.4, 3.4].forEach(z => {
          const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, yy = -(y * cp - z1 * sp);
          mnx = Math.min(mnx, x1); mxx = Math.max(mxx, x1); mny = Math.min(mny, yy); mxy = Math.max(mxy, yy);
        });
      });
    });

    const k = Math.min((W - 250) / (mxx - mnx), (H - 20) / (mxy - mny));
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

    const SELC = [2, 132, 199], items = [], labs = [];

    function face(pts, n, col, o) {
      const f = facing(n), a = o.a == null ? 1 : o.a;
      let L = 2;
      if (o.shell) L = f > 0 ? (o.Lf || 3) : (o.Lb || 1);
      else if (a >= 0.999 && f <= 0) return;
      if (o.tag && (o.tag === cam.sel || (cam.sel === 'crd' && o.tag === 'hcu'))) { col = SELC; if (a < 0.5) o = Object.assign({}, o, { a: 0.55 }); }
      const aa = o.a == null ? 1 : o.a, p = pts.map(q => P(q[0], q[1], q[2]));
      let d = 0; for (const q of p) d += q[2];
      items.push({ L, d: d / p.length + (o.bias || 0), k: 0, p, c: shade(col, n, f > 0 ? 0.64 : 0.5), a: aa });
    }

    function cyl(c, ax, r0, r1, len, col, o) {
      o = o || {};
      const A = P3AX[ax], a = A[0], u = A[1], v = A[2], seg = o.seg || 14, ns = o.ns || Math.max(1, Math.ceil(len / 2.4));
      const A0 = o.arc ? o.arc[0] : 0, SP = o.arc ? o.arc[1] - o.arc[0] : P3TAU;
      const pt = (s, th) => {
        const z = len * s / ns, r = r0 + (r1 - r0) * s / ns, cs = Math.cos(th) * r, sn = Math.sin(th) * r;
        return [c[0] + a[0] * z + u[0] * cs + v[0] * sn, c[1] + a[1] * z + u[1] * cs + v[1] * sn, c[2] + a[2] * z + u[2] * cs + v[2] * sn];
      };
      for (let s = 0; s < ns; s++) {
        for (let i = 0; i < seg; i++) {
          const t0 = A0 + i / seg * SP, t1 = A0 + (i + 1) / seg * SP, tm = (t0 + t1) / 2, cm = Math.cos(tm), sm = Math.sin(tm);
          face([pt(s, t0), pt(s, t1), pt(s + 1, t1), pt(s + 1, t0)], [u[0] * cm + v[0] * sm, u[1] * cm + v[1] * sm, u[2] * cm + v[2] * sm], col, o);
        }
      }
      if (o.caps !== false) {
        const cap = (s, n) => {
          const pts = Array.from({ length: seg + (o.arc ? 1 : 0) }, (_, i) => pt(s, A0 + i / seg * SP));
          if (o.arc) pts.unshift(pt(s, 0).map((x, q) => c[q] + a[q] * len * s / ns));
          face(pts, n, col, o);
        };
        if (r0 > 0) cap(0, [-a[0], -a[1], -a[2]]);
        if (r1 > 0) cap(ns, a);
      }
    }

    function box(x0, y0, z0, x1, y1, z1, col, o) {
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

    const phase = f => still ? 0 : t * 14 / (1.7 - 1.3 * Math.sqrt(f));

    function pipe(pts, r, col, fl) {
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
      f = clamp(f, 0, 1);
      if (f < 0.015) return;
      let cum = 0; const sf = Math.sqrt(f);
      for (let i = 0; i < pts.length - 1; i++) {
        const p = P(pts[i][0], pts[i][1], pts[i][2]), q = P(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
        items.push({ L: 2, d: (p[2] + q[2]) / 2 - 0.05, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col: color, w: wpx || 2, dash: [5, 7], off: cum - phase(f), al: 0.4 + 0.6 * sf });
        cum += Math.hypot(q[0] - p[0], q[1] - p[1]);
      }
    }

    function lab(txt, x, y, z, side, tag) {
      const p = P(x, y, z);
      labs.push({ txt, ax: p[0], ay: p[1], side, tag });
    }

    const polar = (th, r, y) => [Math.cos(th) * r, y, Math.sin(th) * r];
    const c = S.ctl, natF = S.Tc > 100 ? clamp(S.pth / 300, 0, 1) : 0, fwF = clamp(S.fwNow, 0, 1);
    const steamF = clamp((S.qt + S.qb + S.qic) / C.MWT * 1.4, 0, 1), icF = clamp(S.qic / C.IC_MAX, 0, 1);
    const stuck = S.scram && S.atws && !S.ari, STEEL = [150, 172, 180], DKS = [92, 112, 120], CONC = [196, 203, 206];
    const WAT = [63, 155, 224].map((v, i) => Math.round(v + ([150, 100, 215][i] - v) * clamp(S.boron * 1.2, 0, 1))), PIPEC = [112, 136, 145];
    const lvlY = S.level <= 35 ? 6.6 * S.level / 35 : 6.6 + (S.level - 35) / 65 * 7.4, wTop = clamp(lvlY, 0.3, 17);
    const arc = cam.cut ? [Math.PI / 2 + 1.3, Math.PI / 2 + P3TAU - 1.3] : null;
    const rodTop = 2.8 + (1 - S.rod) * 3.8, rodCol = stuck ? [210, 60, 50] : [22, 30, 34];
    const coreCol = root.BWR_3D ? root.BWR_3D.p3rgb(coreColor(Math.sqrt(S.n) * 0.9 + S.h * 2)) : [216, 87, 28];

    // Foundation & drives
    cyl([0, -5.6, 0], 'y', 4.2, 4.2, 0.15, CONC, { seg: 30, ns: 1 });
    P3RT.cells.forEach(q => {
      cyl([q[0], -4.0, q[1]], 'y', 0.075, 0.075, 3.5, [138, 154, 160], { seg: 6, ns: 1, caps: false, tag: 'crd' });
      box(q[0] - 0.11, -4.7, q[1] - 0.11, q[0] + 0.11, -4.0, q[1] + 0.11, [58, 74, 82], { tag: 'crd' });
      cyl([q[0], -4.9, q[1]], 'y', 0.06, 0.06, 0.2, [200, 205, 208], { seg: 6, ns: 1, tag: 'crd' });
      cyl([q[0], -3.95, q[1]], 'y', 0.03, 0.03, Math.max(0.1, rodTop - 3.6 + 3.95), [210, 214, 216], { seg: 5, ns: 1, caps: false, tag: 'crd' });
      cyl([q[0], -0.7, q[1]], 'y', 0.1, 0.1, 3.3, [124, 142, 150], { a: 0.5, seg: 7, ns: 1, caps: false, tag: 'plate' });
    });

    // HCUs
    const hcuOn = S.scram && S.tripT < 8;
    for (let i = 0; i < 29; i++) {
      cyl([(i - 14) * 0.24, -5.45, -4.5], 'y', 0.09, 0.09, 0.9, hcuOn ? [90, 150, 210] : [70, 100, 140], { seg: 8, ns: 1, tag: 'hcu' });
    }
    pipe([[-3.5, -4.35, -4.1], [3.5, -4.35, -4.1]], 0.05, PIPEC, { f: hcuOn ? 1 : 0, color: 'rgba(111,180,238,1)' });
    pipe([[0, -4.35, -4.1], [0, -4.35, -2.6]], 0.05, PIPEC, { f: hcuOn ? 1 : 0, color: 'rgba(111,180,238,1)' });

    // Vessel shell
    const VO = { a: 0.2, shell: true, seg: 40, ns: 1, Lb: 1, Lf: 3, arc, caps: false, tag: 'vessel' };
    cyl([0, -0.4, 0], 'y', 2.3, 3.0, 0.4, STEEL, VO);
    cyl([0, -0.75, 0], 'y', 1.6, 2.3, 0.35, STEEL, VO);
    cyl([0, -1.0, 0], 'y', 0.9, 1.6, 0.25, STEEL, VO);
    cyl([0, 0, 0], 'y', 3.0, 3.0, 17, STEEL, Object.assign({}, VO, { ns: 4 }));
    cyl([0, 17, 0], 'y', 3.0, 2.6, 0.7, STEEL, VO);
    cyl([0, 17.7, 0], 'y', 2.6, 1.6, 0.8, STEEL, VO);
    cyl([0, 18.5, 0], 'y', 1.6, 0.5, 0.7, STEEL, VO);
    cyl([0, 16.85, 0], 'y', 3.25, 3.25, 0.3, [120, 138, 146], { seg: 40, ns: 1, a: 0.8, tag: 'vessel' });

    for (let i = 0; i < 24; i++) {
      const th = i / 24 * P3TAU;
      cyl([Math.cos(th) * 3.12, 17.15, Math.sin(th) * 3.12], 'y', 0.07, 0.07, 0.4, [96, 110, 116], { seg: 5, ns: 1 });
    }
    if (arc) {
      [arc[0], arc[1]].forEach(th => line(polar(th, 3.0, -0.4), polar(th, 3.0, 17), 'rgba(60,85,95,.85)', 1.5, 4));
    }

    // Water, core, rods
    cyl([0, 0, 0], 'y', 2.95, 2.95, wTop, WAT, { a: 0.2, seg: 40, ns: 1, arc });
    cyl([0, 2.5, 0], 'y', 2.45, 2.45, 0.15, [70, 86, 94], { seg: 36, ns: 1, tag: 'plate' });
    cyl([0, 2.65, 0], 'y', 2.45, 2.45, 4.2, [110, 130, 138], { a: 0.22, seg: 36, ns: 1, caps: false, tag: 'shroud' });

    P3RT.ass.forEach(q => box(q[0] - 0.075, 2.8, q[1] - 0.075, q[0] + 0.075, 6.6, q[1] + 0.075, coreCol, { tag: 'fuel' }));
    P3RT.cells.forEach(q => {
      const y0 = rodTop - 3.6, y1 = rodTop;
      box(q[0] - 0.2, y0, q[1] - 0.035, q[0] + 0.2, y1, q[1] + 0.035, rodCol, { tag: 'rods' });
      box(q[0] - 0.035, y0, q[1] - 0.2, q[0] + 0.035, y1, q[1] + 0.2, rodCol, { tag: 'rods' });
      box(q[0] - 0.05, y1, q[1] - 0.05, q[0] + 0.05, y1 + 0.12, q[1] + 0.05, [200, 205, 208], { tag: 'rods' });
    });

    // In-core instruments
    [[0.23, 0.23], [-0.69, 0.69], [0.69, -0.69], [-1.61, -0.23], [1.61, 0.23], [-0.23, -1.61]].forEach(q => {
      cyl([q[0], -4.2, q[1]], 'y', 0.035, 0.035, 10.9, [60, 200, 220], { seg: 5, ns: 2, caps: false, tag: 'instr' });
    });

    // Chimney & separators
    cyl([0, 6.7, 0], 'y', 2.45, 2.45, 0.1, [90, 108, 116], { a: 0.5, seg: 36, ns: 1, tag: 'plate' });
    cyl([0, 6.8, 0], 'y', 2.45, 2.45, 6.6, [120, 140, 148], { a: 0.16, seg: 36, ns: 1, caps: false, arc, tag: 'chimney' });
    [-0.85, 0.85].forEach(o => {
      box(-2.4, 6.8, o - 0.02, 2.4, 13.4, o + 0.02, [150, 170, 178], { a: 0.28, tag: 'chimney' });
      box(o - 0.02, 6.8, -2.4, o + 0.02, 13.4, 2.4, [150, 170, 178], { a: 0.28, tag: 'chimney' });
    });
    cyl([0, 13.4, 0], 'y', 2.45, 2.45, 0.12, [90, 108, 116], { a: 0.7, seg: 36, ns: 1, tag: 'chimney' });

    const sp3 = [[0, 0]];
    for (let i = 0; i < 6; i++) sp3.push([Math.cos(i * 1.047) * 0.85, Math.sin(i * 1.047) * 0.85]);
    for (let i = 0; i < 12; i++) sp3.push([Math.cos(i * 0.5236 + 0.26) * 1.7, Math.sin(i * 0.5236 + 0.26) * 1.7]);
    sp3.forEach(q => {
      cyl([q[0], 13.5, q[1]], 'y', 0.1, 0.1, 1.2, [130, 148, 156], { seg: 6, ns: 1, caps: false, tag: 'sep' });
      cyl([q[0], 14.7, q[1]], 'y', 0.3, 0.3, 0.9, [160, 176, 182], { seg: 9, ns: 1, tag: 'sep' });
      cyl([q[0], 15.6, q[1]], 'y', 0.3, 0.2, 0.25, [140, 156, 162], { seg: 9, ns: 1, tag: 'sep' });
    });

    // Steam dryer
    cyl([0, 13.7, 0], 'y', 2.55, 2.55, 3.3, [170, 150, 110], { a: 0.2, seg: 36, ns: 1, caps: false, arc, tag: 'dryer' });
    for (let i = 0; i < 18; i++) {
      const th = i / 18 * P3TAU, ca = Math.cos(th), sa = Math.sin(th), n = [-sa, 0, ca];
      face([[ca * 0.9, 15.95, sa * 0.9], [ca * 2.5, 15.95, sa * 2.5], [ca * 2.5, 17.0, sa * 2.5], [ca * 0.9, 17.0, sa * 0.9]], n, [190, 165, 110], { a: 0.55, tag: 'dryer' });
    }
    cyl([0, 17.0, 0], 'y', 2.55, 2.55, 0.08, [170, 150, 110], { a: 0.6, seg: 36, ns: 1, tag: 'dryer' });

    // Feedwater sparger ring
    const ring = Array.from({ length: 33 }, (_, i) => polar(i / 32 * P3TAU, 2.75, 12.4));
    pipe(ring, 0.07, [96, 124, 140], { f: fwF, color: 'rgba(111,180,238,1)' });

    // Nozzles
    const nz = (th, y, col, open, fl, inward) => {
      const a = polar(th, 2.95, y), d = polar(th, 4.8, y), v = polar(th, 3.45, y);
      pipe(inward ? [d, a] : [a, d], 0.2, PIPEC, { f: fl, color: col });
      box(v[0] - 0.3, v[1] - 0.3, v[2] - 0.3, v[0] + 0.3, v[1] + 0.3, v[2] + 0.3, open ? [60, 190, 125] : [58, 74, 82], { tag: 'nozzle' });
      return d;
    };
    const dMS = nz(-0.45, 16.4, 'rgba(235,244,248,1)', c.msiv, steamF, false);
    const dFW = nz(0.17, 12.4, 'rgba(111,180,238,1)', fwF > 0.02, fwF, true);
    const dICr = nz(3.3, 10.5, 'rgba(111,180,238,1)', S.icOpen, icF, true);
    pipe([[0, 19.1, 0], [0, 21.0, 0]], 0.2, PIPEC, { f: icF, color: 'rgba(235,244,248,1)' });
    box(-0.3, 19.55, -0.3, 0.3, 20.15, 0.3, S.icOpen ? [60, 190, 125] : [58, 74, 82], { tag: 'nozzle' });

    // Flows & circulation
    for (let i = 0; i < 8; i++) {
      const th = i / 8 * P3TAU + 0.2;
      fline([polar(th, 2.72, 12.2), polar(th, 2.72, 0.8)], natF, '#6fb4ee', 2.2);
    }
    for (let i = 0; i < 9; i++) {
      const th = i / 9 * P3TAU;
      fline([polar(th, 1.0 + (i % 3) * 0.4, 3.0), polar(th, 1.0 + (i % 3) * 0.4, 13.2)], natF, '#e6f2fa', 1.8);
    }
    for (let i = 0; i < 6; i++) {
      const th = i / 6 * P3TAU + 0.5;
      fline([polar(th, 1.5, 15.9), polar(th, 1.5, 18.3)], steamF, 'rgba(235,244,248,1)', 2);
    }
    if (natF > 0.02 && !still) {
      for (let i = 0; i < 46; i++) {
        const h = (i * 0.6180339) % 1, g = (i * 0.7548776) % 1, ph = (t * (0.18 + 0.2 * natF) + i / 46) % 1;
        const th = h * P3TAU, r = Math.sqrt(g) * 2.1, y = 3.2 + ph * 9.6, p = P(Math.cos(th) * r, y, Math.sin(th) * r);
        items.push({ L: 2, d: p[2] - 0.2, k: 3, x: p[0], y: p[1], r: Math.max(1.2, 0.05 * k), a: 0.7 * Math.min(1, natF * 1.4) * (ph > 0.15 ? 1 : ph / 0.15) });
      }
    }

    // Boron injection sparger
    const bInj = S.ctl.slc && S.tank > 0 && S.ac, bF = bInj ? 1 : 0, BCOL = [150, 110, 200], BFL = 'rgba(200,150,240,1)';
    const bC = cam.sel === 'bis' ? SELC : BCOL, bTh = 0.7;
    pipe(Array.from({ length: 33 }, (_, i) => polar(bTh + i / 32 * P3TAU, 2.33, 3.3)), 0.06, bC, { f: bF, color: BFL });
    for (let i = 0; i < 12; i++) {
      const th = bTh + (i + 0.5) / 12 * P3TAU;
      pipe([polar(th, 2.33, 3.3), polar(th, 2.0, 3.3)], 0.03, bC, { f: bF, color: BFL });
    }
    pipe([polar(bTh, 7.2, 3.3), polar(bTh, 2.33, 3.3)], 0.16, bC, { f: bF, color: BFL });
    {
      const a = polar(bTh, 3.7, 3.3), b = polar(bTh, 5.0, 3.3);
      box(a[0] - 0.3, a[1] - 0.3, a[2] - 0.3, a[0] + 0.3, a[1] + 0.3, a[2] + 0.3, [112, 136, 145], { tag: 'bis' });
      box(b[0] - 0.42, b[1] - 0.42, b[2] - 0.42, b[0] + 0.42, b[1] + 0.42, b[2] + 0.42, bInj ? [60, 190, 125] : [58, 74, 82], { tag: 'bis' });
    }
    {
      const a = polar(0.17, 2.95, wTop), b = polar(0.17, 3.9, wTop);
      line(a, b, 'rgba(40,110,170,.9)', 2, 4);
    }

    // Sort & render
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
          ctx.lineWidth = 0.7;
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
        if (it.dash) { ctx.setLineDash([]); ctx.globalAlpha = 1; }
        if (it.hl) {
          ctx.beginPath();
          ctx.moveTo(it.x1 - it.w * 0.18, it.y1 - it.w * 0.18);
          ctx.lineTo(it.x2 - it.w * 0.18, it.y2 - it.w * 0.18);
          ctx.strokeStyle = 'rgba(255,255,255,.28)';
          ctx.lineWidth = it.w * 0.26;
          ctx.stroke();
        }
      } else if (it.k === 3) {
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, P3TAU);
        ctx.fillStyle = 'rgba(250,252,253,' + it.a + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,130,170,' + it.a * 0.8 + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Labels
    if (cam.labels !== false) {
      lab('STEAM DRYER', -2.4, 16.5, 0, 'L', 'dryer');
      lab('STEAM SEPARATORS', 0.9, 15.2, 0.9, 'R', 'sep');
      lab('CHIMNEY', -2.45, 10, 0, 'L', 'chimney');
      lab('FEEDWATER SPARGER', -2.75, 12.4, 0, 'L', 'fw');
      lab('STEAM NOZZLE + ISOLATION VALVE', dMS[0] * 0.78, dMS[1], dMS[2] * 0.78, 'R', 'nozzle');
      lab('FEEDWATER NOZZLE + ISOLATION VALVE', dFW[0] * 0.78, dFW[1], dFW[2] * 0.78, 'R', 'nozzle');
      lab('IC RETURN NOZZLE', dICr[0] * 0.78, dICr[1], dICr[2] * 0.78, 'L', 'nozzle');
      lab('IC STEAM NOZZLE', 0, 20.6, 0, 'R', 'nozzle');
      lab('TOP GUIDE', 2.3, 6.7, 0, 'R', 'plate');
      lab('BORON INJECTION SPARGER', polar(bTh + 1.2, 2.33, 3.3)[0], 3.3, polar(bTh + 1.2, 2.33, 3.3)[2], 'R', 'bis');
      lab('CHECK VALVE + AIR ISOLATION VALVE', polar(bTh, 4.35, 3.3)[0], 3.45, polar(bTh, 4.35, 3.3)[2], 'R', 'bis');
      lab('FROM BORON TANK AND PUMP', polar(bTh, 7.0, 3.3)[0], 3.3, polar(bTh, 7.0, 3.3)[2], 'R', 'bis');
      lab('240 FUEL ASSEMBLIES', -1.7, 5.2, 0.5, 'L', 'fuel');
      lab('57 CRUCIFORM CONTROL RODS', 1.84, rodTop - 1, 0.46, 'R', 'rods');
      lab('CORE SHROUD', -2.45, 4.2, 0, 'L', 'shroud');
      lab('CORE PLATE', 2.3, 2.58, 0, 'R', 'plate');
      lab('ROD GUIDE TUBES', -1.38, 1.2, 0, 'L', 'plate');
      lab('FINE MOTION DRIVES', 0.92, -4.4, 0, 'R', 'crd');
      lab('29 HYDRAULIC CONTROL UNITS', -3.4, -4.8, -4.5, 'L', 'hcu');
      lab('IN-CORE NEUTRON MONITORS', 0.23, 0.2, 0.23, 'R', 'instr');
      lab('DOWNCOMER', -2.75, 8, 0, 'L', 'fw');
      lab('WATER LEVEL', 3.4, wTop, 0.5, 'R', 'fw');
      lab('REACTOR VESSEL', 3.0, 3.5, -0.3, 'R', 'vessel');

      ctx.font = p3f(600, 12.5);
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';

      ['L', 'R'].forEach(side => {
        const ls = labs.filter(l => l.side === side && l.ay > 8 && l.ay < H - 8).sort((a, b) => a.ay - b.ay);
        let last = -99;
        ls.forEach(l => {
          l.y = Math.max(l.ay, last + 17);
          last = l.y;
        });
        for (let i = ls.length - 1; i >= 0; i--) {
          if (ls[i].y > H - 8) {
            ls[i].y = H - 8;
            if (i < ls.length - 1) ls[i].y = Math.min(ls[i].y, ls[i + 1].y - 17);
          }
        }
        ls.forEach(l => {
          const x = side === 'L' ? 10 : W - 10, w = ctx.measureText(l.txt).width;
          const ex = side === 'L' ? x + w + 6 : x - w - 6, sel = l.tag === cam.sel || (cam.sel === 'crd' && l.tag === 'hcu');
          ctx.beginPath(); ctx.moveTo(l.ax, l.ay); ctx.lineTo(ex, l.y);
          ctx.strokeStyle = sel ? '#0284c7' : 'rgba(60,80,88,.5)';
          ctx.lineWidth = sel ? 1.6 : 1;
          ctx.stroke();
          ctx.beginPath(); ctx.arc(l.ax, l.ay, 2.2, 0, P3TAU);
          ctx.fillStyle = sel ? '#0284c7' : '#43575e';
          ctx.fill();
          ctx.textAlign = side === 'L' ? 'left' : 'right';
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = 'rgba(255,255,255,.9)';
          ctx.strokeText(l.txt, x, l.y);
          ctx.fillStyle = sel ? '#0284c7' : '#2b3f46';
          ctx.fillText(l.txt, x, l.y);
        });
      });
    }
  }

  const RPRE = { whole: [7.6, 27.8], core: [4.4, 9], top: [15.2, 10.5], bot: [-2.4, 8.8] };
  const RCARDS = [
    ['rods', 'Control rods', 'core', S => `57 rods, ${(S.rod * 100).toFixed(0)}% withdrawn${S.scram && S.atws && !S.ari ? ', STUCK' : ''}`, 'Fifty-seven cruciform blades, made of tubes packed with boron carbide, enter the core from below. Each one sits in the middle of a control cell of four fuel assemblies. Here all rods move together, driven by the plant computer or, in free play with Manual rods, by you; in the real plant a limited number are moved for power changes and the rest during start-up and shutdown.'],
    ['crd', 'Control rod drives & HCUs', 'bot', (S, rTrip) => rTrip < 8 ? 'scram: drives discharging' : 'motors holding position, HCUs charged', 'Under the vessel, 57 electric fine-motion drives (FMCRDs) turn ball screws for precise power positioning. Twenty-nine hydraulic control units (HCUs) hold water under high-pressure nitrogen to instantly scram and latch all rods on demand.'],
    ['bis', 'Boron injection (poison)', 'core', S => `${S.ctl.slc ? (S.tank <= 0 ? 'tank empty' : S.ac ? 'injecting' : 'no power, pump stopped') : 'standby'}, tank ${S.tank.toFixed(0)} %, boron ${(S.boron * 100).toFixed(0)} %`, 'Backup shutdown for when the rods will not go in. Boron soaks up neutrons. A tank outside the containment holds a borated solution, and a pump pushes it through an isolation valve and a check valve into the vessel, where a sparger spreads it through the core region. A test tank lets the system be checked without injecting. Boron stays in the water until the cleanup system removes it. The real system starts from the control room or automatically after a delay; here the SLC switch starts it, it needs AC power, and the cleanup slider removes the boron again.'],
    ['fuel', 'Fuel assemblies', 'core', S => `240 assemblies, ${S.pth.toFixed(0)} MWt`, 'Two hundred and forty fuel assemblies sit in a vessel about 4 m across. Four assemblies surround each control rod, and wide water gaps between them leave room for the rod blades. Drawn spacing is schematic.'],
    ['plate', 'Core plate and guide tubes', 'core', () => 'rods ride in guide tubes', 'The core plate carries the bottom of the fuel. Guide tubes under it keep each rod lined up as it moves in and out, and a top guide holds the upper ends of the assemblies.'],
    ['instr', 'Neutron monitors', 'core', S => `${(S.n * 100).toFixed(S.n < 0.1 ? 2 : 1)} % power`, 'Fixed in-core detectors enter from below and measure how many neutrons the core is making, which tells the plant its power.'],
    ['chimney', 'Chimney', 'whole', S => `circulation ${(clamp(S.Tc > 100 ? S.pth / 300 : 0, 0, 1) * 100).toFixed(0)} %`, 'Above the core a tall chimney holds a column of hot, bubbly water that is much lighter than the cooler water outside it. That difference in weight pushes water up through the core with no pumps.'],
    ['sep', 'Steam separators', 'top', S => `${(S.qt + S.qb + S.qic).toFixed(0)} MW of steam`, 'Standpipes carry the steam-water mixture up to separators. The mixture is spun so the water falls back and the steam goes on upward.'],
    ['dryer', 'Steam dryer', 'top', S => S.level > 110 ? 'level too high: carry-over' : 'dry steam to the nozzle', 'Vanes in the dryer catch the last droplets, so the steam that leaves for the turbine is dry.'],
    ['fw', 'Feedwater and downcomer', 'top', S => `feedwater ${(clamp(S.fwNow, 0, 1) * 100).toFixed(0)} % of rated`, 'Feedwater is sprayed in through a ring called the sparger and mixes with the water that has sunk down the outer channel, the downcomer, on its way back to the bottom of the core.'],
    ['nozzle', 'Nozzles and isolation valves', 'top', S => `steam ${S.ctl.msiv ? 'open' : 'closed'}, feed ${S.fwNow > 0.02 ? 'open' : 'closed'}, IC ${S.icOpen ? 'open' : 'closed'}`, 'The steam, feedwater and isolation condenser nozzles carry isolation valves built into the vessel, so a pipe break outside can be shut off at the vessel wall.'],
    ['vessel', 'Reactor vessel', 'whole', S => `${S.p.toFixed(2)} MPa, ${S.Tc.toFixed(0)} °C`, 'A tall steel pressure vessel about 4 m across holds everything. It is drawn shorter and wider than the real one, and cut open so you can see inside.']
  ];

  /* ---------------- Common 3D Scene Builder ---------------- */
  function createP3Scene(ctx, W, H, dpr, cam, bounds, still, t) {
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f0f9ff');
    bg.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    const bX = bounds.x || [-10, 10];
    const bY = [cam.cy - cam.span / 2, cam.cy + cam.span / 2];
    const bZ = bounds.z || [-10, 10];

    bX.forEach(x => {
      bY.forEach(y => {
        bZ.forEach(z => {
          const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, yy = -(y * cp - z1 * sp);
          mnx = Math.min(mnx, x1); mxx = Math.max(mxx, x1); mny = Math.min(mny, yy); mxy = Math.max(mxy, yy);
        });
      });
    });

    const padX = bounds.padX || 240;
    const padY = bounds.padY || 24;
    const k = Math.min((W - padX) / (mxx - mnx), (H - padY) / (mxy - mny));
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

    const SELC = [2, 132, 199], items = [], labs = [];

    function face(pts, n, col, o) {
      o = o || {};
      const f = facing(n), a = o.a == null ? 1 : o.a;
      let L = 2;
      if (o.shell) L = f > 0 ? (o.Lf || 3) : (o.Lb || 1);
      else if (a >= 0.999 && f <= 0) return;
      if (o.tag && (o.tag === cam.sel || (cam.sel === 'crd' && o.tag === 'hcu'))) { col = SELC; if (a < 0.5) o = Object.assign({}, o, { a: 0.55 }); }
      const aa = o.a == null ? 1 : o.a, p = pts.map(q => P(q[0], q[1], q[2]));
      let d = 0; for (const q of p) d += q[2];
      items.push({ L, d: d / p.length + (o.bias || 0), k: 0, p, c: shade(col, n, f > 0 ? 0.64 : 0.5), a: aa });
    }

    function cyl(c, ax, r0, r1, len, col, o) {
      o = o || {};
      const A = P3AX[ax], a = A[0], u = A[1], v = A[2], seg = o.seg || 14, ns = o.ns || Math.max(1, Math.ceil(len / 2.4));
      const A0 = o.arc ? o.arc[0] : 0, SP = o.arc ? o.arc[1] - o.arc[0] : P3TAU;
      const pt = (s, th) => {
        const z = len * s / ns, r = r0 + (r1 - r0) * s / ns, cs = Math.cos(th) * r, sn = Math.sin(th) * r;
        return [c[0] + a[0] * z + u[0] * cs + v[0] * sn, c[1] + a[1] * z + u[1] * cs + v[1] * sn, c[2] + a[2] * z + u[2] * cs + v[2] * sn];
      };
      for (let s = 0; s < ns; s++) {
        for (let i = 0; i < seg; i++) {
          const t0 = A0 + i / seg * SP, t1 = A0 + (i + 1) / seg * SP, tm = (t0 + t1) / 2, cm = Math.cos(tm), sm = Math.sin(tm);
          face([pt(s, t0), pt(s, t1), pt(s + 1, t1), pt(s + 1, t0)], [u[0] * cm + v[0] * sm, u[1] * cm + v[1] * sm, u[2] * cm + v[2] * sm], col, o);
        }
      }
      if (o.caps !== false) {
        const cap = (s, n) => {
          const pts = Array.from({ length: seg + (o.arc ? 1 : 0) }, (_, i) => pt(s, A0 + i / seg * SP));
          if (o.arc) pts.unshift(pt(s, 0).map((x, q) => c[q] + a[q] * len * s / ns));
          face(pts, n, col, o);
        };
        if (r0 > 0) cap(0, [-a[0], -a[1], -a[2]]);
        if (r1 > 0) cap(ns, a);
      }
    }

    function box(x0, y0, z0, x1, y1, z1, col, o) {
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

    const phase = f => still ? 0 : t * 14 / (1.7 - 1.3 * Math.sqrt(f));

    function pipe(pts, r, col, fl) {
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
      f = clamp(f, 0, 1);
      if (f < 0.015) return;
      let cum = 0; const sf = Math.sqrt(f);
      for (let i = 0; i < pts.length - 1; i++) {
        const p = P(pts[i][0], pts[i][1], pts[i][2]), q = P(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
        items.push({ L: 2, d: (p[2] + q[2]) / 2 - 0.05, k: 1, x1: p[0], y1: p[1], x2: q[0], y2: q[1], col: color, w: wpx || 2, dash: [5, 7], off: cum - phase(f), al: 0.4 + 0.6 * sf });
        cum += Math.hypot(q[0] - p[0], q[1] - p[1]);
      }
    }

    function lab(txt, x, y, z, side, tag) {
      const p = P(x, y, z);
      labs.push({ txt, ax: p[0], ay: p[1], side, tag });
    }

    function bubble(x, y, z, r, alpha, col) {
      const p = P(x, y, z);
      items.push({ L: 5, d: p[2], k: 3, x: p[0], y: p[1], r: Math.max(1.2, r * k), a: alpha, col: col || ('rgba(250,252,253,' + alpha + ')') });
    }

    function finish() {
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
            ctx.lineWidth = 0.7;
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
          if (it.dash) { ctx.setLineDash([]); ctx.globalAlpha = 1; }
          if (it.hl) {
            ctx.beginPath();
            ctx.moveTo(it.x1 - it.w * 0.18, it.y1 - it.w * 0.18);
            ctx.lineTo(it.x2 - it.w * 0.18, it.y2 - it.w * 0.18);
            ctx.strokeStyle = 'rgba(255,255,255,.28)';
            ctx.lineWidth = it.w * 0.26;
            ctx.stroke();
          }
        } else if (it.k === 3) {
          ctx.beginPath();
          ctx.arc(it.x, it.y, it.r, 0, P3TAU);
          ctx.fillStyle = it.col || ('rgba(250,252,253,' + it.a + ')');
          ctx.fill();
          ctx.strokeStyle = 'rgba(80,130,170,' + it.a * 0.8 + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      if (cam.labels !== false) {
        ctx.font = p3f(600, 12.5);
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        ['L', 'R'].forEach(side => {
          const ls = labs.filter(l => l.side === side && l.ay > 8 && l.ay < H - 8).sort((a, b) => a.ay - b.ay);
          let last = -99;
          ls.forEach(l => {
            l.y = Math.max(l.ay, last + 17);
            last = l.y;
          });
          for (let i = ls.length - 1; i >= 0; i--) {
            if (ls[i].y > H - 8) {
              ls[i].y = H - 8;
              if (i < ls.length - 1) ls[i].y = Math.min(ls[i].y, ls[i + 1].y - 17);
            }
          }
          ls.forEach(l => {
            const x = side === 'L' ? 10 : W - 10, w = ctx.measureText(l.txt).width;
            const ex = side === 'L' ? x + w + 6 : x - w - 6, sel = l.tag === cam.sel;
            ctx.beginPath(); ctx.moveTo(l.ax, l.ay); ctx.lineTo(ex, l.y);
            ctx.strokeStyle = sel ? '#0284c7' : 'rgba(60,80,88,.5)';
            ctx.lineWidth = sel ? 1.6 : 1;
            ctx.stroke();
            ctx.beginPath(); ctx.arc(l.ax, l.ay, 2.2, 0, P3TAU);
            ctx.fillStyle = sel ? '#0284c7' : '#43575e';
            ctx.fill();
            ctx.textAlign = side === 'L' ? 'left' : 'right';
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255,255,255,.9)';
            ctx.strokeText(l.txt, x, l.y);
            ctx.fillStyle = sel ? '#0284c7' : '#2b3f46';
            ctx.fillText(l.txt, x, l.y);
          });
        });
      }
    }

    return { P, face, cyl, box, line, pipe, fline, lab, bubble, finish, k, OX, OY };
  }

  /* ---------------- 3D Cutaway: Turbine Hall ---------------- */
  function p3Turbine(ctx, W, H, dpr, t, S, C, cam, still) {
    const sc = createP3Scene(ctx, W, H, dpr, cam, { x: [-17, 21], z: [-8, 8], padX: 250, padY: 26 }, still, t);
    const on = S.turbOn && S.turbTrip <= 0, rpm = S.rpm, load = clamp(S.qt / C.MWT, 0, 1.1);
    const gov = on ? clamp(S.qt / C.MWT * 100, 0, 100) : 0, brk = on && S.offsite;
    const steamF = clamp((S.qt + S.qb) / C.MWT * 1.4, 0, 1), bypF = clamp(S.qb / C.QB_MAX, 0, 1);
    const fwF = clamp(S.fwNow, 0, 1);

    const STEEL = [150, 172, 180], DKS = [85, 102, 110], CONC = [196, 203, 206], PIPEC = [112, 136, 145];
    const COPPER = [210, 145, 55], TCAS = on ? [75, 140, 115] : [110, 130, 138], GEN = brk ? [70, 138, 110] : [105, 120, 130];
    const STEAM_COL = 'rgba(235,244,248,1)', BYP_COL = 'rgba(255,196,107,1)', GRID_COL = 'rgba(255,236,150,1)', FW_COL = 'rgba(111,180,238,1)';
    const cutArc = cam.cut ? [Math.PI * 0.45, Math.PI * 2.0] : null;

    // Foundation basement & concrete piers
    sc.box(-18, 0, -8, 20, 1.0, 8, CONC);
    [-11, -3, 3, 11].forEach(x => {
      sc.box(x - 0.8, 1.0, -6.5, x + 0.8, 4.8, -5.0, CONC);
      sc.box(x - 0.8, 1.0, 5.0, x + 0.8, 4.8, 6.5, CONC);
    });

    // Mezzanine operating deck
    sc.box(-18, 4.6, -7.5, 19, 5.2, 7.5, [180, 192, 198], { a: 0.35, shell: true, Lb: 1, Lf: 3 });

    // Main rotating shaft line
    sc.cyl([-13.5, 7.5, 0], 'x', 0.32, 0.32, 29.5, [180, 195, 200], { seg: 8, tag: 'shaft' });
    sc.fline([[-13.5, 7.5, 0], [16, 7.5, 0]], on ? S.rpm / 1500 : 0, STEAM_COL, 3);
    [-13, -7.2, -6.2, -0.2, 0.8, 6.8, 7.8, 14.8].forEach(x => {
      sc.box(x - 0.4, 6.5, -0.6, x + 0.4, 8.2, 0.6, DKS, { tag: 'shaft' });
    });

    // Main Steam Line & Governor Valves
    sc.pipe([[-17, 12.5, 0], [-13.5, 12.5, 0], [-13.5, 9.8, 0], [-12.2, 9.8, 0]], 0.36, PIPEC, { f: steamF, color: STEAM_COL });
    sc.cyl([-15, 12.5, 0], 'y', 0.55, 0.55, 1.2, on ? [60, 190, 125] : [58, 74, 82], { seg: 10, tag: 'gv' });
    sc.box(-13.8, 9.2, -1.3, -12.4, 10.4, 1.3, [90, 110, 120], { tag: 'gv' });
    [-0.8, -0.27, 0.27, 0.8].forEach(z => {
      sc.cyl([-13.1, 10.4, z], 'y', 0.22, 0.22, 1.0, gov > 5 ? [60, 190, 125] : [58, 74, 82], { seg: 8, tag: 'gv' });
    });

    // Turbine Bypass System
    sc.pipe([[-16, 12.5, 0], [-16, 12.5, -4.5], [-16, 2.5, -4.5], [-2, 2.5, -4.5], [-2, 2.5, -1.5]], 0.32, PIPEC, { f: bypF, color: BYP_COL });
    sc.box(-16.5, 8.5, -4.9, -15.5, 9.7, -4.1, S.qb > 5 ? [60, 190, 125] : [58, 74, 82], { tag: 'by' });

    // High-Pressure (HP) Turbine
    sc.cyl([-12.2, 7.5, 0], 'x', 1.5, 1.5, 4.8, TCAS, { seg: 22, arc: cutArc, tag: 'hp' });
    for (let i = 0; i < 6; i++) {
      sc.cyl([-11.8 + i * 0.7, 7.5, 0], 'x', 0.65 + i * 0.12, 0.65 + i * 0.12, 0.25, [140, 160, 170], { seg: 16, tag: 'hp' });
    }
    sc.pipe([[-7.8, 8.6, 0], [-7.8, 11.2, 0], [-7.8, 11.2, -3.8], [-6.2, 11.2, -3.8]], 0.3, PIPEC, { f: on ? load : 0, color: STEAM_COL });

    // Moisture Separator Reheater (MSR)
    sc.cyl([-6.0, 11.2, -3.8], 'x', 1.15, 1.15, 12.0, [130, 146, 156], { seg: 18, arc: cam.cut ? [Math.PI * 0.3, Math.PI * 1.8] : null, tag: 'msr' });
    sc.box(-4.5, 10.7, -4.3, 4.5, 11.7, -3.3, [165, 180, 188], { a: 0.6, tag: 'msr' });
    sc.cyl([-4.0, 11.2, -3.8], 'x', 0.45, 0.45, 8.0, [210, 130, 60], { a: 0.7, seg: 12, tag: 'msr' });
    sc.pipe([[-3.5, 11.2, -3.8], [-3.5, 11.2, 0], [-3.5, 9.8, 0]], 0.32, PIPEC, { f: on ? load : 0, color: BYP_COL });
    sc.pipe([[3.5, 11.2, -3.8], [3.5, 11.2, 0], [3.5, 9.8, 0]], 0.32, PIPEC, { f: on ? load : 0, color: BYP_COL });

    // Low-Pressure Turbines (LP1 and LP2)
    sc.cyl([-6.0, 7.5, 0], 'x', 1.3, 2.3, 5.6, TCAS, { seg: 22, arc: cutArc, tag: 'lp' });
    sc.cyl([0.6, 7.5, 0], 'x', 1.3, 2.3, 5.6, TCAS, { seg: 22, arc: cutArc, tag: 'lp' });
    [-5.2, -4.4, -3.6, -2.8, -2.0, -1.2].forEach((x, i) => {
      sc.cyl([x, 7.5, 0], 'x', 0.8 + Math.abs(i - 2.5) * 0.45, 0.8 + Math.abs(i - 2.5) * 0.45, 0.22, [140, 160, 170], { seg: 16, tag: 'lp' });
    });
    [1.4, 2.2, 3.0, 3.8, 4.6, 5.4].forEach((x, i) => {
      sc.cyl([x, 7.5, 0], 'x', 0.8 + Math.abs(i - 2.5) * 0.45, 0.8 + Math.abs(i - 2.5) * 0.45, 0.22, [140, 160, 170], { seg: 16, tag: 'lp' });
    });
    sc.box(-5.8, 2.0, -2.2, -0.8, 5.2, 2.2, [70, 95, 115], { a: 0.35, shell: true, tag: 'lp' });
    sc.box(0.8, 2.0, -2.2, 5.8, 5.2, 2.2, [70, 95, 115], { a: 0.35, shell: true, tag: 'lp' });

    // Main Synchronous Generator & Exciter
    sc.cyl([8.0, 7.5, 0], 'x', 1.9, 1.9, 6.5, GEN, { seg: 22, tag: 'gen' });
    sc.cyl([7.7, 7.5, 0], 'x', 2.0, 2.0, 0.3, DKS, { seg: 20 });
    sc.cyl([14.5, 7.5, 0], 'x', 2.0, 2.0, 0.3, DKS, { seg: 20 });
    sc.cyl([8.2, 7.5, 0], 'x', 0.95, 0.95, 6.1, [195, 165, 80], { a: 0.6, seg: 14, tag: 'gen' });
    sc.cyl([15.2, 7.5, 0], 'x', 0.9, 0.9, 2.2, [110, 130, 138], { seg: 14, tag: 'gen' });

    // Isolated Phase Bus (IPB) & Breaker
    sc.pipe([[11.2, 9.4, 0], [11.2, 12.0, 0], [18.0, 12.0, 0], [18.0, 5.0, 0]], 0.34, COPPER, { f: brk ? clamp(S.mwe / 300, 0, 1) : 0, color: GRID_COL });
    sc.box(13.8, 11.2, -0.8, 15.4, 12.8, 0.8, brk ? [60, 190, 125] : [58, 74, 82], { tag: 'gen' });

    // Feedwater Heaters & Pumps below deck
    sc.cyl([-3.0, 2.2, 4.5], 'x', 0.8, 0.8, 3.8, [125, 142, 150], { seg: 12, tag: 'fwtrain' });
    sc.cyl([2.5, 2.2, 4.5], 'x', 0.85, 0.85, 4.0, [125, 142, 150], { seg: 12, tag: 'fwtrain' });
    sc.cyl([8.0, 1.2, 4.5], 'y', 0.8, 0.8, 1.8, fwF > 0.02 ? [60, 190, 125] : [58, 74, 82], { seg: 12, tag: 'fwtrain' });
    sc.pipe([[8.0, 1.8, 4.5], [8.0, 1.8, 7.2], [-17, 1.8, 7.2]], 0.3, PIPEC, { f: fwF, color: FW_COL });

    // Callout Labels
    sc.lab('MAIN STEAM INLET (7 MPa)', -17, 12.5, 0, 'L', 'gv');
    sc.lab('GOVERNOR & STOP VALVES', -13.1, 11.4, 0, 'L', 'gv');
    sc.lab('TURBINE BYPASS LINE', -16, 9.0, -4.5, 'L', 'by');
    sc.lab('HIGH-PRESSURE TURBINE', -10.0, 7.5, 1.5, 'L', 'hp');
    sc.lab('COLD REHEAT EXHAUST', -7.8, 11.2, -1.8, 'L', 'msr');
    sc.lab('MOISTURE SEPARATOR / REHEATER', 0, 12.4, -3.8, 'L', 'msr');
    sc.lab('FEEDWATER HEATERS & PUMPS', 0, 2.2, 4.5, 'L', 'fwtrain');

    sc.lab('HOT REHEAT CROSSOVER PIPING', 3.5, 11.2, 0, 'R', 'msr');
    sc.lab('LP1 & LP2 DOUBLE-FLOW TURBINES', 2.8, 7.5, 2.2, 'R', 'lp');
    sc.lab('EXHAUST HOOD TO CONDENSER', 3.3, 3.6, 2.2, 'R', 'lp');
    sc.lab('ROTOR SHAFT & BEARINGS', 7.3, 7.5, 0, 'R', 'shaft');
    sc.lab('300 MWe SYNCHRONOUS GENERATOR', 11.2, 7.5, 2.0, 'R', 'gen');
    sc.lab('BRUSHLESS EXCITER', 16.2, 7.5, 1.0, 'R', 'gen');
    sc.lab('GENERATOR BREAKER & IPB DUCT', 14.6, 12.8, 0, 'R', 'gen');

    sc.finish();
  }

  const TPRE = { whole: [7.5, 26.0], hp: [8.5, 14.0], msr: [9.5, 16.0], gen: [7.5, 14.0] };
  const TCARDS = [
    ['hp', 'HP Turbine', 'hp', S => S.turbOn ? `${(S.p * (0.12 + 0.1 * clamp(S.qt / C.MWT, 0, 1.1))).toFixed(2)} MPa exhaust, ${(S.qt / 1.85).toFixed(0)} kg/s` : 'tripped / idle', 'The high-pressure turbine receives saturated steam from the reactor at full RPV pressure (~7 MPa). The single-flow bladed rotor expands the steam, extracting roughly 80 MW of mechanical shaft power before discharging moisture-laden exhaust steam to the moisture separator reheater.'],
    ['gv', 'Governor & stop valves', 'hp', S => `stop: ${S.turbOn ? 'OPEN' : 'CLOSED'}, governor: ${(S.turbOn ? clamp(S.qt / C.MWT * 100, 0, 100) : 0).toFixed(0)} %`, 'Four electro-hydraulic governor valves modulate steam admission into the HP nozzle chest to maintain grid frequency and reactor pressure. Fast-closing main stop valves trip in under 100 ms on turbine overspeed, high vibration, or reactor scram.'],
    ['msr', 'Moisture separator reheater', 'msr', S => S.turbOn ? `reheat: ${(tsat(Math.max(0.1, S.p * 0.2)) + 30).toFixed(0)} °C, chevron vanes active` : 'cold / idle', 'Removes water droplets from HP turbine exhaust via chevron vane packs, then reheats the dried steam with live RPV steam coils to 250-260 °C. This prevents droplet blade erosion in the downstream low-pressure turbines and boosts thermal cycle efficiency.'],
    ['lp', 'LP turbines (LP1 & LP2)', 'msr', S => S.turbOn ? `${S.rpm.toFixed(0)} rpm, exhaust ${S.vac.toFixed(1)} kPa` : 'stationary', 'Two double-flow LP turbines expand reheated steam from ~1.2 MPa down to deep condenser vacuum (~5 kPa). The large final-stage titanium blades extract the remaining thermal energy. Exhaust hoods discharge steam straight down into the main condenser neck.'],
    ['by', 'Turbine bypass system', 'hp', S => `${(S.qb / C.QB_MAX * 100).toFixed(0)} % open (${S.qb.toFixed(0)} MWt dump)`, 'Fast-acting bypass valves can divert up to 100% of full reactor steam flow directly around the turbine into the condenser. This prevents reactor trips during sudden grid load rejections and allows flexible station power maneuvering.'],
    ['gen', 'Main generator & exciter', 'gen', S => `${S.mwe.toFixed(0)} MWe, ${S.offsite && S.turbOn ? 'grid synchronized (60 Hz)' : 'breaker open'}, stator ${(45 + 55 * Math.pow(S.mwe / 300, 2)).toFixed(0)} °C`, 'Two-pole synchronous AC generator spinning at 1500/1800 rpm, producing up to 300 MWe net clean electricity at 20 kV. Cooled by pressurized hydrogen and stator water circuits. A brushless exciter mounted at the shaft end supplies rotor field current.'],
    ['shaft', 'Rotor shaft & bearings', 'whole', S => `${S.rpm.toFixed(0)} rpm, vibration ${S.rpm > 20 ? (12 + 10 * S.rpm / 1500 + 25 * Math.max(0, S.vac - 12) / 60).toFixed(0) : '0'} µm`, 'Rigidly coupled monoblock steel rotor train supported on journal bearings with forced oil lubrication and jacking oil for turning gear operation. Continuous proximity probes monitor radial shaft vibration and axial thrust bearing displacement.'],
    ['fwtrain', 'Feedwater train & heaters', 'whole', S => `feedwater ${(clamp(S.fwNow, 0, 1) * 100).toFixed(0)} % of rated, ${(S.fwNow > 0.02 ? 40 + 175 * clamp(S.qt / 600, 0, 1) : 0).toFixed(0)} °C`, 'Condensate and motor-driven reactor feed pumps boost feedwater pressure to overcome RPV internal pressure (~7.2 MPa). Closed shell-and-tube feedwater heaters extract turbine bleed steam to preheat feedwater to ~215 °C before injection into the reactor downcomer.']
  ];

  /* ---------------- 3D Cutaway: Condenser Room ---------------- */
  function p3Condenser(ctx, W, H, dpr, t, S, C, cam, still) {
    const sc = createP3Scene(ctx, W, H, dpr, cam, { x: [-17, 18], z: [-8, 8], padX: 250, padY: 26 }, still, t);
    const c = S.ctl, condCap = (S.offsite && S.sea) ? c.cw / 3 : 0, cwFlow = condCap * 21;
    const heat = 0.652 * S.qt + S.qb, dT = cwFlow > 0 ? heat / (cwFlow * 4.18) : 0, kg = (S.qt + S.qb) / 1.85;
    const lake = c.lakeT, outT = lake + dT, load = clamp((S.qt + S.qb) / C.MWT, 0, 1.2);
    const steamT = tsat(Math.max(S.vac, 2) / 1000);

    const CONC = [196, 203, 206], PIPEC = [112, 136, 145], LAKE_IN = [59, 147, 212], LAKE_OUT = [224, 110, 40];
    const HOTWELL_COL = [42, 115, 174];

    // Foundation floor & piers
    sc.box(-18, -1.5, -8, 18, 0, 8, CONC);
    [[-8, -3], [-8, 3], [8, -3], [8, 3]].forEach(q => {
      sc.cyl([q[0], 0, q[1]], 'y', 0.6, 0.6, 0.8, [120, 135, 145], { seg: 10 });
    });

    // Steam Exhaust Neck from turbine deck
    sc.box(-7.0, 5.8, -3.8, 7.0, 8.5, 3.8, [80, 105, 120], { a: 0.35, shell: true, tag: 'shell' });
    [-4, -2, 0, 2, 4].forEach(x => {
      sc.fline([[x, 8.2, 0], [x, 5.6, 0]], load, 'rgba(235,244,248,1)', 2.4);
    });

    // Main Condenser Vacuum Shell
    sc.box(-9.5, 0.8, -4.5, 9.5, 6.0, 4.5, [65, 95, 125], { a: cam.cut ? 0.22 : 0.78, shell: true, tag: 'shell' });

    // Divided Waterboxes
    sc.box(-11.5, 1.0, -4.2, -9.5, 5.8, 4.2, LAKE_IN, { a: 0.8, tag: 'wbox' });
    sc.box(9.5, 1.0, -4.2, 11.5, 5.8, 4.2, LAKE_OUT, { a: 0.8, tag: 'wbox' });
    sc.box(-11.5, 3.3, -4.2, -9.5, 3.5, 4.2, [80, 100, 110], { tag: 'wbox' }); // divider plate

    // Titanium Cooling Tube Matrix
    for (let r = 0; r < 7; r++) {
      const y = 1.7 + r * 0.58;
      for (let zIdx = 0; zIdx < 4; zIdx++) {
        const z = -2.8 + zIdx * 1.85;
        const frac = (r * 4 + zIdx) / 28;
        const col = [
          Math.round(LAKE_IN[0] + (LAKE_OUT[0] - LAKE_IN[0]) * frac),
          Math.round(LAKE_IN[1] + (LAKE_OUT[1] - LAKE_IN[1]) * frac),
          Math.round(LAKE_IN[2] + (LAKE_OUT[2] - LAKE_IN[2]) * frac)
        ];
        sc.cyl([-9.5, y, z], 'x', 0.12, 0.12, 19.0, col, { seg: 6, tag: 'tubes' });
        sc.fline([[-9.5, y, z], [9.5, y, z]], cwFlow / 21, 'rgba(235,248,255,0.9)', 1.5);
      }
    }

    // Condensation Rain
    if (load > 0.05 && !still) {
      for (let i = 0; i < 22; i++) {
        const ph = ((t * 1.8 + i * 0.18) % 1);
        const rx = -7 + (i * 3.7 % 14), rz = -3 + (i * 2.3 % 6);
        sc.bubble(rx, 5.2 - ph * 4.2, rz, 0.08, 0.85 * (1 - ph * 0.2), 'rgba(143,208,255,0.9)');
      }
    }

    // Condensate Hotwell Sump
    sc.box(-7.5, -1.0, -3.2, 7.5, 0.8, 3.2, HOTWELL_COL, { a: 0.8, tag: 'hotwell' });
    sc.box(-7.5, 0.75, -3.2, 7.5, 0.8, 3.2, [90, 175, 235], { a: 0.9, tag: 'hotwell' }); // water surface

    // Condensate Extraction Pumps
    sc.cyl([4.0, -0.6, 5.5], 'y', 0.7, 0.7, 2.8, S.fwNow > 0.02 ? [60, 190, 125] : [58, 74, 82], { seg: 12, tag: 'cpumps' });
    sc.cyl([6.5, -0.6, 5.5], 'y', 0.7, 0.7, 2.8, S.fwNow > 0.02 ? [60, 190, 125] : [58, 74, 82], { seg: 12, tag: 'cpumps' });
    sc.pipe([[0, -0.2, 3.2], [0, -0.2, 5.5], [4.0, -0.2, 5.5]], 0.3, PIPEC, { f: S.fwNow, color: 'rgba(111,180,238,1)' });
    sc.pipe([[4.0, 2.2, 5.5], [4.0, 2.2, 7.5], [17.0, 2.2, 7.5]], 0.3, PIPEC, { f: S.fwNow, color: 'rgba(111,180,238,1)' });

    // Circulating Water Pumps & Intake Screens
    [-1.8, 0.2, 2.2].forEach((z, i) => {
      sc.cyl([-15.0, -0.8, z], 'y', 0.75, 0.75, 3.2, (condCap > 0 && c.cw >= i + 1) ? [60, 190, 125] : [58, 74, 82], { seg: 12, tag: 'cwpumps' });
    });
    sc.box(-17.5, -0.8, -3.5, -16.2, 2.5, 3.5, [130, 145, 155], { tag: 'lake' }); // intake screens
    sc.pipe([[-15.0, 2.0, -1.0], [-11.5, 2.0, -1.0]], 0.5, PIPEC, { f: cwFlow / 21, color: 'rgba(111,180,238,1)' });
    sc.pipe([[-15.0, 4.4, 1.0], [-11.5, 4.4, 1.0]], 0.5, PIPEC, { f: cwFlow / 21, color: 'rgba(111,180,238,1)' });

    // Discharge Diffuser to Lake
    sc.pipe([[11.5, 2.0, 0], [16.5, 2.0, 0], [16.5, -1.0, 0]], 0.55, PIPEC, { f: cwFlow / 21, color: 'rgba(240,140,60,1)' });

    // Air Ejectors & Vacuum Skid
    sc.box(-5.5, 3.2, -6.5, -2.5, 5.2, -5.0, [110, 128, 138], { tag: 'air' });
    sc.pipe([[-4.0, 4.2, -4.5], [-4.0, 4.2, -5.0]], 0.2, PIPEC, { f: 0.4, color: 'rgba(200,215,225,1)' });

    // Callout Labels
    sc.lab('STEAM EXHAUST FROM TURBINE', 0, 8.5, 0, 'L', 'shell');
    sc.lab('MAIN CONDENSER SHELL (VACUUM)', -6.0, 6.0, 0, 'L', 'shell');
    sc.lab('DIVIDED INLET WATERBOX', -11.5, 4.5, 0, 'L', 'wbox');
    sc.lab('CW CIRCULATING WATER PUMPS', -15.0, 3.0, 1.0, 'L', 'cwpumps');
    sc.lab('LAKE ONTARIO INTAKE & SCREENS', -16.0, 0.5, 2.0, 'L', 'lake');
    sc.lab('STEAM JET AIR EJECTORS', -4.0, 4.8, -5.8, 'L', 'air');

    sc.lab('TITANIUM TUBE BUNDLE', 0, 3.4, 4.5, 'R', 'tubes');
    sc.lab('STEAM CONDENSATION RAIN', 0, 1.2, 2.0, 'R', 'tubes');
    sc.lab('OUTLET WATERBOX (+ΔT)', 11.5, 4.5, 0, 'R', 'wbox');
    sc.lab('CONDENSATE HOTWELL SUMP', 0, -0.2, 3.2, 'R', 'hotwell');
    sc.lab('CONDENSATE EXTRACTION PUMPS', 5.5, 2.5, 5.5, 'R', 'cpumps');
    sc.lab('DISCHARGE DIFFUSER TO LAKE', 16.5, 1.0, 0, 'R', 'lake');

    sc.finish();
  }

  const CPRE = { whole: [3.5, 20.0], tubes: [3.5, 12.0], hotwell: [0.5, 11.0], cw: [2.0, 16.0] };
  const CCARDS = [
    ['shell', 'Condenser vacuum shell', 'tubes', S => `vacuum: ${S.vac.toFixed(1)} kPa, sat temp: ${tsat(Math.max(S.vac, 2) / 1000).toFixed(0)} °C`, 'Heavy reinforced steel vacuum vessel enclosing thousands of thin-walled tubes. Maintains internal pressure far below atmospheric (~5 kPa abs), creating the massive pressure drop that drives turbine rotation. Expansion bellows absorb thermal movement from turbine exhaust.'],
    ['tubes', 'Titanium cooling tube bundle', 'tubes', S => `${(0.652 * S.qt + S.qb).toFixed(0)} MW heat rejected to lake`, 'Dual banks of corrosion-resistant titanium tubes. Cold water from Lake Ontario flows through the tube bores while LP turbine exhaust steam condenses on outer tube surfaces, transferring latent heat of vaporization with minimal thermal resistance.'],
    ['wbox', 'Inlet & outlet waterboxes', 'tubes', S => `${(S.offsite && S.sea ? (S.ctl.cw / 3) * 21 : 0).toFixed(0)} m³/s lake flow, divided dual-path`, 'D-shaped waterboxes at each end distribute incoming cooling water across tube sheet holes. Divided design allows one half of the condenser to be isolated and inspected for tube cleaning while the reactor operates at reduced power.'],
    ['hotwell', 'Condensate hotwell sump', 'hotwell', S => `level: normal, condensate ${S.tcond.toFixed(0)} °C, deaerating`, 'Deep trough at the condenser bottom that collects millions of droplets of pure distilled condensate. Designed with perforated retention trays to deaerate water and prevent dissolved oxygen from entering the reactor feedwater system.'],
    ['cpumps', 'Condensate extraction pumps', 'hotwell', S => S.fwNow > 0.02 ? `running, ${((S.qt + S.qb) / 1.85).toFixed(0)} kg/s to heaters` : 'standby', 'Vertical canned motor centrifugal pumps installed in pits below the hotwell to provide net positive suction head (NPSH). Pumps discharge condensate through full-flow condensate polishers (demineralizers) and low-pressure feedwater heaters.'],
    ['cwpumps', 'Circulating water pumps', 'cw', S => `${S.ctl.cw} of 3 CW pumps running, ${(S.offsite && S.sea ? (S.ctl.cw / 3) * 21 : 0).toFixed(0)} m³/s`, 'Three vertical mixed-flow pumps located in the pumphouse structure drawing cooling water from the lake intake channel. Operates at low head (~12-18 m) to circulate high water volumes through the condenser tubes.'],
    ['air', 'Air ejector & vacuum system', 'hotwell', S => S.vac < 15 ? 'normal vacuum, air in-leakage minimal' : 'warning: reduced vacuum', 'Two-stage steam jet air ejectors (SJAE) with inter-condensers, backed by liquid ring mechanical vacuum pumps. Continuously sweeps non-condensible gases (air in-leakage, radiolytic hydrogen/oxygen) out of condenser tube bundle core.'],
    ['lake', 'Lake Ontario intake & diffuser', 'cw', S => `lake: ${S.ctl.lakeT.toFixed(0)} °C, discharge: ${(S.ctl.lakeT + (S.ctl.cw > 0 ? (0.652 * S.qt + S.qb) / ((S.ctl.cw / 3) * 21 * 4.18) : 0)).toFixed(1)} °C (+${(S.ctl.cw > 0 ? (0.652 * S.qt + S.qb) / ((S.ctl.cw / 3) * 21 * 4.18) : 0).toFixed(1)} K)`, 'Once-through cooling system at Darlington site. Deep-water intake with fish-deterrent wedge-wire screens pulls water from Lake Ontario. Discharge flows through multi-port diffusers on the lake bed, ensuring rapid thermal mixing with strict environmental ΔT limits.']
  ];

  /* ---------------- 3D Cutaway: Isolation Condenser (IC) ---------------- */
  function p3IC(ctx, W, H, dpr, t, S, C, cam, still, icE) {
    const sc = createP3Scene(ctx, W, H, dpr, cam, { x: [-12, 12], z: [-8, 8], padX: 250, padY: 26 }, still, t);
    const open = S.icOpen, q = open ? S.qic : 0, icF = clamp(q / C.IC_MAX, 0, 1);
    const tons = (icE || 0) / 2.257 / 1000;

    const CONC = [196, 203, 206], STEEL = [150, 172, 180], PIPEC = [112, 136, 145];
    const POOL_WAT = [95, 175, 228], HOT_STM = 'rgba(235,244,248,1)', COND_WAT = 'rgba(111,180,238,1)';
    const VALVE_OPEN = [60, 190, 125], VALVE_CLOSED = [58, 74, 82];

    // Reactor building roof slab & containment head
    sc.box(-11, 16.0, -7, 11, 17.5, 7, CONC);
    sc.cyl([0, 13.5, 0], 'y', 5.5, 5.5, 3.0, STEEL, { a: 0.25, seg: 24, tag: 'v_stm' });

    // Reinforced concrete IC Pool
    sc.box(-8.5, 17.5, -4.8, 8.5, 27.5, 4.8, [180, 195, 202], { a: 0.25, shell: true, tag: 'pool' });
    sc.box(-8.2, 17.6, -4.5, 8.2, 26.2, 4.5, POOL_WAT, { a: 0.45, tag: 'pool' });

    // Boiling bubbles in pool when active
    if (open && q > 0 && !still) {
      for (let i = 0; i < 28; i++) {
        const ph = ((t * 1.5 + i * 0.12) % 1);
        const bx = -6 + (i * 3.3 % 12), bz = -3 + (i * 2.1 % 6);
        sc.bubble(bx, 19.5 + ph * 6.5, bz, 0.09, 0.75 * (1 - ph * 0.15), 'rgba(255,255,255,0.85)');
      }
    }

    // Atmospheric Steam Vents & Plumes
    [-5, -2, 2, 5].forEach(x => {
      sc.box(x - 0.8, 27.5, -1.6, x + 0.8, 30.5, 1.6, [130, 150, 160], { a: 0.7, tag: 'vent' });
    });
    if (open && q > 0 && !still) {
      [-5, -2, 2, 5].forEach((x, i) => {
        const ph = ((t * 0.8 + i * 0.25) % 1);
        sc.bubble(x, 30.5 + ph * 3.5, 0, 0.35 + ph * 0.6, 0.6 * (1 - ph), 'rgba(255,255,255,0.7)');
      });
    }

    // 3 Independent Heat Exchanger Trains (A, B, C)
    [-3.0, 0, 3.0].forEach(zb => {
      // Upper steam header drum
      sc.cyl([-6.5, 25.2, zb], 'x', 0.45, 0.45, 11.5, STEEL, { seg: 10, tag: 'tubes' });
      // Lower condensate header drum
      sc.cyl([-6.5, 19.5, zb], 'x', 0.45, 0.45, 11.5, STEEL, { seg: 10, tag: 'tubes' });
      // Sloped condensation tubes
      for (let i = 0; i < 12; i++) {
        const x = -5.8 + i * 1.05;
        sc.cyl([x, 19.5, zb], 'y', 0.08, 0.08, 5.7, [130, 148, 156], { seg: 6, tag: 'tubes' });
        sc.fline([[x, 25.0, zb], [x, 19.7, zb]], icF, COND_WAT, 1.8);
      }
      sc.fline([[-6.5, 25.2, zb], [5.0, 25.2, zb]], icF, HOT_STM, 2.2);
      sc.fline([[-6.5, 19.5, zb], [5.0, 19.5, zb]], icF, COND_WAT, 2.2);
    });

    // Steam Supply Piping from RPV
    sc.pipe([[-1.5, 11.0, -1.5], [-1.5, 17.5, -1.5], [-8.0, 17.5, -1.5], [-8.0, 25.2, 0]], 0.35, PIPEC, { f: icF, color: HOT_STM });
    sc.box(-1.9, 13.5, -1.9, -1.1, 14.7, -1.1, open ? VALVE_OPEN : VALVE_CLOSED, { tag: 'v_stm' });
    sc.pipe([[-8.0, 25.2, -3.0], [-8.0, 25.2, 3.0]], 0.28, PIPEC, { f: icF, color: HOT_STM });

    // Condensate Return Piping & Fail-Safe Valves
    sc.pipe([[5.5, 19.5, -3.0], [5.5, 19.5, 3.0]], 0.28, PIPEC, { f: icF, color: COND_WAT });
    sc.pipe([[5.5, 19.5, 0], [7.5, 19.5, 0], [7.5, 17.5, 0], [1.5, 17.5, 1.5], [1.5, 11.0, 1.5]], 0.32, PIPEC, { f: icF, color: COND_WAT });
    sc.box(7.0, 18.0, -0.9, 8.0, 19.2, -0.1, open ? VALVE_OPEN : VALVE_CLOSED, { tag: 'v_ret' });
    sc.box(7.0, 18.0, 0.1, 8.0, 19.2, 0.9, open ? VALVE_OPEN : VALVE_CLOSED, { tag: 'v_ret' });

    // Miniature RPV representation below roof
    sc.cyl([0, 6.0, 0], 'y', 2.2, 2.2, 5.0, STEEL, { a: 0.3, seg: 18, tag: 'decay' });
    sc.cyl([0, 6.0, 0], 'y', 2.0, 2.0, 4.8 * clamp(S.level / 100, 0.1, 1), [63, 155, 224], { a: 0.4, seg: 18, tag: 'decay' });
    sc.box(-1.0, 6.5, -1.0, 1.0, 8.0, 1.0, [216, 87, 28], { a: 0.85, tag: 'decay' });

    // Callout Labels
    sc.lab('ATMOSPHERIC STEAM EXHAUST VENTS', -2.0, 31.0, 0, 'L', 'vent');
    sc.lab('ROOF IC WATER POOL (OPEN TO AIR)', -8.2, 26.5, 0, 'L', 'pool');
    sc.lab('UPPER STEAM MANIFOLD DRUMS', -6.5, 25.2, -3.0, 'L', 'tubes');
    sc.lab('STEAM SUPPLY PIPE FROM RPV', -8.0, 22.0, -1.5, 'L', 'v_stm');
    sc.lab('CONTAINMENT ISOLATION VALVE', -1.5, 14.1, -1.5, 'L', 'v_stm');
    sc.lab('REACTOR VESSEL DECAY HEAT', -1.5, 8.5, 0, 'L', 'decay');

    sc.lab('BOILING STEAM PLUMES', 2.0, 31.0, 0, 'R', 'vent');
    sc.lab('3 PASSIVE SAFETY TRAINS (A, B, C)', 0, 24.0, 3.0, 'R', 'trains');
    sc.lab('SUBMERGED TUBE BUNDLES', 0, 22.0, 0, 'R', 'tubes');
    sc.lab('LOWER CONDENSATE RETURN DRUMS', 5.5, 19.5, 3.0, 'R', 'tubes');
    sc.lab('FAIL-SAFE RETURN ISOLATION VALVES', 7.5, 18.6, 0.5, 'R', 'v_ret');
    sc.lab('GRAVITY CONDENSATE DRAIN LINE', 1.5, 13.5, 1.5, 'R', 'gravity');

    sc.finish();
  }

  const IPRE = { whole: [24.0, 22.0], pool: [26.0, 14.0], tubes: [23.0, 12.0], valves: [19.0, 13.0] };
  const ICARDS = [
    ['pool', 'Roof isolation condenser pool', 'pool', (S, icE) => `${((icE || 0) / 2.257 / 1000).toFixed(1)} t boiled off, >7 days reserve`, 'Large open-to-atmosphere reinforced concrete pool located on the reactor building roof above containment. Filled with roughly 500-600 tonnes of water, providing an immense passive heat sink capable of absorbing full decay heat for at least 7 days without AC power or operator action.'],
    ['trains', 'Three passive safety trains', 'tubes', S => S.icOpen ? `3 trains in service, ${S.qic.toFixed(0)} MWt heat transfer` : '3 trains in standby', 'BWRX-300 incorporates three independent 50% capacity passive condenser trains submerged in the pool. Any two trains provide 100% of required decay heat removal capacity, meeting strict N+1 single-failure safety redundancy criteria.'],
    ['tubes', 'Submerged tube bundles', 'tubes', S => S.icOpen ? `condensing ${(S.qic * 1000 / 2200).toFixed(1)} kg/s, boiling pool outside` : 'valves closed, tubes at rest', 'Sloped corrosion-resistant ASME Class 1 tube bundles submerged in the cool pool water. High-pressure steam inside the tubes condenses on internal surfaces, releasing latent heat directly through tube walls to boil pool water at atmospheric pressure (~100 °C).'],
    ['v_ret', 'Fail-safe return valves', 'valves', S => `return valves ${S.icOpen ? 'OPEN (gravity draining)' : 'CLOSED (fail-open DC ready)'}`, 'Two parallel fail-safe nitrogen-actuated valves on the lower drain line. Designed to fail open on loss of station AC power or DC actuation signal. When opened, dense condensate immediately drains into RPV downcomer by gravity, initiating natural loop circulation.'],
    ['v_stm', 'Steam supply & isolation valves', 'valves', S => `supply: ${S.p.toFixed(2)} MPa, containment isolation OPEN`, 'Large steam pipes draw saturated steam directly from vessel steam dome through dual containment isolation valves welded directly to the RPV nozzles. Upper supply line remains flooded with steam in standby, ready for instantaneous heat transfer.'],
    ['vent', 'Atmospheric steam vents', 'pool', S => S.icOpen && S.qic > 1 ? 'venting clean boil-off steam to atmosphere' : 'standby, no boil-off', 'Large exhaust ducts above the pool route evaporated steam directly through reactor building roof vents to atmosphere. Because pool water is physically isolated from primary reactor coolant by the tube walls, the vented steam is completely clean and non-radioactive.'],
    ['gravity', 'Natural circulation gravity loop', 'valves', S => S.icOpen ? '20 m elevation head, zero AC power or pumps' : 'passive loop standing by', 'Because the IC pool is perched 20 meters above the reactor core, condensed water in the return leg is much denser than the rising steam in the supply leg. This hydrostatic density difference creates a strong, self-sustaining gravity siphon loop without a single pump or moving part.'],
    ['decay', 'Decay heat & pressure control', 'whole', S => `decay heat ${(S.h * C.MWT).toFixed(1)} MWt, RPV ${S.p.toFixed(2)} MPa (${S.Tc.toFixed(0)} °C)`, 'During station blackout (SBO) or loss of feedwater, the IC rapidly cools and depressurizes the reactor vessel below relief valve setpoints, preventing core uncovery and containment pressurization indefinitely without needing emergency diesel generators.']
  ];

  root.BWR_Views = {
    renderRpv, renderTurbine, renderCondenser, renderIC,
    p3Rpv, RPRE, RCARDS, P3RT,
    p3Turbine, TPRE, TCARDS,
    p3Condenser, CPRE, CCARDS,
    p3IC, IPRE, ICARDS
  };
})(typeof window !== 'undefined' ? window : globalThis);
