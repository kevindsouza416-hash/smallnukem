/* BWRX-300 Main Control Room UI Controller
   Orchestrates simulation loop, dials, power lever, annunciators, systems panel, and pop-out detail windows */
(function () {
  'use strict';

  const B = window.BWR;
  const C = B.C;
  const clamp = B.clamp;
  const $ = id => document.getElementById(id);

  let optFree = false;
  let S = B.create(null, { free: optFree });
  S.lever = 0;
  let icE = 0, icLastT = 0;

  // Setup BroadcastChannel for real-time synchronization with detail window
  let channel = null;
  try {
    channel = new BroadcastChannel('bwrx300_sim_channel');
  } catch (err) {
    console.warn('BroadcastChannel not supported:', err);
  }

  function broadcastState() {
    if (channel) {
      try {
        channel.postMessage({
          type: 'STATE_UPDATE',
          state: S,
          icE: icE,
          timestamp: performance.now()
        });
      } catch (e) {}
    }
  }

  /* ---- Feature: Open Detailed View on Second Screen / New Tab ---- */
  let launchMode = '2ndScreen'; // '2ndScreen' or 'newTab'
  let cachedScreens = null;

  async function requestScreenPermission() {
    if ('getScreenDetails' in window) {
      try {
        cachedScreens = await window.getScreenDetails();
        return cachedScreens && cachedScreens.screens && cachedScreens.screens.length > 1;
      } catch (err) {
        console.log('Screen details permission:', err);
      }
    }
    return false;
  }

  // Presentation Display Window Reference for right-hand screen
  let detailWindowRef = null;

  function showPopupBlockedNotice(url, part) {
    const banner = $('popupBlockedBanner');
    const link = $('popupBlockedLink');
    if (banner && link) {
      link.href = url;
      link.textContent = 'Open ' + (part || 'Component').toUpperCase() + ' Detail ↗';
      banner.hidden = false;
    }
  }

  function openDetailWindow(part) {
    if (!part) part = 'rpv';
    const url = 'detail.html?part=' + encodeURIComponent(part);
    const winName = 'BWRX300_Presentation_Display';

    // Broadcast navigation message immediately to the open display (if already open)
    if (channel) {
      try {
        channel.postMessage({ type: 'NAVIGATE_PART', part: part });
      } catch (err) {}
    }

    // If detail window is already open on the second display, update it smoothly without opening new windows
    if (detailWindowRef && !detailWindowRef.closed) {
      try {
        detailWindowRef.postMessage({ type: 'NAVIGATE_PART', part: part }, '*');
        detailWindowRef.focus();
        return detailWindowRef;
      } catch (e) {}
    }

    // Synchronous execution (NO await! Must execute within active user interaction gesture)
    let win = null;

    const scr = (typeof window !== 'undefined' && window.screen) || {};
    const curX = window.screenLeft !== undefined ? window.screenLeft : (window.screenX || 0);
    const sWidth = scr.width || 1920;
    const isMulti = scr.isExtended || (curX < 0 || curX >= sWidth - 100);

    // Try multi-screen placement if on 2nd screen mode
    if (launchMode === '2ndScreen' && isMulti) {
      const targetLeft = (curX >= 0 && curX < sWidth - 100) ? sWidth : 0;
      const targetW = scr.availWidth || 1280;
      const targetH = scr.availHeight || 860;
      try {
        win = window.open(
          url,
          winName,
          `left=${targetLeft},top=0,width=${targetW},height=${targetH},resizable=yes,scrollbars=yes`
        );
      } catch (e) {}
    }

    // Standard window open with presentation target name
    if (!win) {
      try {
        win = window.open(url, winName);
      } catch (e) {}
    }

    // Fallback to new tab
    if (!win) {
      try {
        win = window.open(url, '_blank');
      } catch (e) {}
    }

    if (win) {
      try { win.focus(); } catch (x) {}
      detailWindowRef = win;
      const banner = $('popupBlockedBanner');
      if (banner) banner.hidden = true;
    } else {
      showPopupBlockedNotice(url, part);
    }

    return win;
  }

  /* ---- Circular Dials (Crystal Clear Layout: Zero Overlap Guarantee) ---- */
  function mkDial(id, o) {
    const el = $(id);
    if (!el) return { set: () => {} };
    const cx = 85, cy = 60, r = 45;
    const ang = v => -120 + 240 * clamp((v - o.min) / (o.max - o.min), 0, 1);
    const pt = (a, rad) => [cx + rad * Math.sin(a * Math.PI / 180), cy - rad * Math.cos(a * Math.PI / 180)];
    const arc = (a1, a2, rad) => {
      const p = pt(a1, rad), q = pt(a2, rad);
      return `M${p[0].toFixed(1)},${p[1].toFixed(1)} A${rad},${rad} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    };
    let s = `<svg viewBox="0 0 170 144" aria-hidden="true">`;
    // Background arc track
    s += `<path d="${arc(-120, 120, r)}" fill="none" stroke="#cbd5e1" stroke-width="7" stroke-linecap="round"/>`;
    // Colored operating zones
    o.zones.forEach(z => {
      s += `<path d="${arc(ang(z[0]), ang(z[1]), r)}" fill="none" style="stroke:var(--${z[2]})" stroke-width="7" opacity=".9"/>`;
    });
    // Outer tick marks and distinct tick numbers (Zero collision with needle or center values)
    o.ticks.forEach(t => {
      const a = ang(t), p = pt(a, r + 1), q = pt(a, r + 7), w = pt(a, r + 15);
      s += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#64748b" stroke-width="1.6"/><text x="${w[0].toFixed(1)}" y="${(w[1] + 3.5).toFixed(1)}" text-anchor="middle" style="font:600 11px var(--f-mono);fill:#475569">${t}</text>`;
    });
    // Target demand marker
    s += `<g class="mk" style="display:none"><polygon points="85,15 80,7 90,7" style="fill:#0284c7"/></g>`;
    // Indicator needle
    s += `<g class="nd"><line x1="85" y1="60" x2="85" y2="25" stroke-width="3" stroke-linecap="round" stroke="#0f172a"/><circle cx="85" cy="25" r="1.5" fill="#38bdf8"/></g><circle cx="85" cy="60" r="5" fill="#1e293b" stroke="#64748b" stroke-width="2"/>`;
    // Dedicated Digital Readout Card Pill (Completely isolated at bottom)
    s += `<rect x="38" y="86" width="94" height="42" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>`;
    s += `<text class="v" x="85" y="108" text-anchor="middle" style="font:700 18px var(--f-mono);fill:#0f172a">0</text><text class="u" x="85" y="122" text-anchor="middle" style="font:600 11px var(--f-disp);letter-spacing:.05em;fill:#64748b"></text></svg><div class="lab">${o.label}</div>`;
    el.innerHTML = s;
    const nd = el.querySelector('.nd'), mk = el.querySelector('.mk'), v = el.querySelector('.v'), u = el.querySelector('.u');
    return {
      set(val, txt, sub, marker) {
        if (nd) nd.setAttribute('transform', `rotate(${ang(val).toFixed(1)} 85 60)`);
        if (v) v.textContent = txt;
        if (u) u.textContent = sub || '';
        if (mk) {
          if (marker == null) mk.style.display = 'none';
          else {
            mk.style.display = '';
            mk.setAttribute('transform', `rotate(${ang(marker).toFixed(1)} 85 60)`);
          }
        }
      }
    };
  }

  const dP = mkDial('dP', { label: 'Reactor power %', min: 0, max: 120, ticks: [0, 50, 100, 120], zones: [[0, 100, 'green'], [100, 112, 'warn'], [112, 120, 'red']] });
  const dE = mkDial('dE', { label: 'Electric output MWe', min: 0, max: 360, ticks: [0, 100, 200, 300], zones: [[0, 300, 'green']] });
  const dPr = mkDial('dPr', { label: 'Steam pressure MPa', min: 0, max: 10, ticks: [0, 4, 7, 10], zones: [[6.8, 7.45, 'green'], [7.45, 8.3, 'warn'], [8.3, 10, 'red']] });
  const dL = mkDial('dL', { label: 'Water level %', min: 40, max: 110, ticks: [40, 70, 100], zones: [[40, C.LVL_SCRAM, 'red'], [C.LVL_SCRAM, C.LVL_ALARM, 'warn'], [C.LVL_ALARM, 105, 'green']] });

  /* ---- Vertical Power Lever / Rods Slider ---- */
  const lever = $('lever'), knob = $('knob');
  [[0, '0'], [12, '12 HEAT', 1], [30, '30'], [60, '60'], [100, '100 FULL']].forEach(a => {
    const i = document.createElement('i');
    i.textContent = a[1];
    if (a[2]) i.className = 'k';
    i.style.bottom = `calc(6px + (100% - 12px) * ${a[0] / 100})`;
    $('scale').appendChild(i);
  });

  const manRods = () => S.ctl.rodMode === 'man';
  function showLever(v) {
    knob.style.bottom = `calc(6px + (100% - 12px) * ${v / 100})`;
    knob.textContent = v;
    lever.setAttribute('aria-valuenow', v);
    $('leverVal').textContent = v + ' %';
  }
  function setLever(v) {
    v = Math.round(clamp(v, 0, 100));
    if (manRods()) S.ctl.rodCmd = v; else S.lever = v;
    showLever(v);
  }
  function fromPointer(e) {
    const r = lever.getBoundingClientRect();
    setLever(100 * (1 - (e.clientY - r.top - 6) / (r.height - 12)));
  }

  let drag = false;
  lever.addEventListener('pointerdown', e => {
    drag = true;
    lever.setPointerCapture(e.pointerId);
    fromPointer(e);
    lever.style.cursor = 'grabbing';
    e.preventDefault();
  });
  lever.addEventListener('pointermove', e => { if (drag) fromPointer(e); });
  ['pointerup', 'pointercancel'].forEach(t => lever.addEventListener(t, () => {
    drag = false; lever.style.cursor = '';
  }));
  lever.addEventListener('keydown', e => {
    const k = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (k) {
      setLever((manRods() ? S.ctl.rodCmd : S.lever) + k);
      e.preventDefault();
    } else if (e.key === 'Home') {
      setLever(0); e.preventDefault();
    } else if (e.key === 'End') {
      setLever(100); e.preventDefault();
    }
  });
  setLever(0);

  /* ---- Action Cues, Simulation Speed & Fast-Forward Handlers ---- */
  let simSpeed = 1;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simSpeed = parseFloat(btn.getAttribute('data-speed')) || 1;
    });
  });

  const fastTo100C = () => {
    if (S.phase === 'heatup') {
      if (S.lever < 4) setLever(12);
      S.Tc = 100.0;
      S.p = 0.12;
      S.rate = 125;
      if (B.log) B.log(S, 'Core heating fast-forwarded to 100 °C: Boiling initiated, steam forming.', 'ok');
    }
  };

  const fastWarmUp = () => {
    if (S.phase === 'heatup') {
      if (S.lever < 4) setLever(12);
      S.vac = 4.5;
      S.vacT = 0;
      S.ctl.msiv = true;
      S.Tc = 285.2;
      S.p = 6.82;
      S.pth = 104;
      S.n = 0.12;
      S.rod = 0.55;
      S.rate = 110;
      if (B.log) B.log(S, 'Warm-up complete: Operating pressure reached (6.8 MPa). Turbine rolling and syncing to grid!', 'ok');
    }
  };

  const fastToFullPower = () => {
    if (S.phase === 'power') {
      setLever(100);
      simSpeed = 4;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-speed') === '5'));
      if (B.log) B.log(S, 'Power ramp accelerated: 4x speed engaged until 300 MWe full power.', 'ok');
    }
  };

  const btnFast100C = $('btnFast100C');
  if (btnFast100C) btnFast100C.addEventListener('click', fastTo100C);

  const btnFastHeat = $('btnFastHeat');
  if (btnFastHeat) btnFastHeat.addEventListener('click', fastWarmUp);

  const btnFastFullPower = $('btnFastFullPower');
  if (btnFastFullPower) btnFastFullPower.addEventListener('click', fastToFullPower);

  const cueStartEl = $('cueStart');
  if (cueStartEl) {
    cueStartEl.addEventListener('click', () => {
      const btn = $('start');
      if (btn) btn.click();
    });
  }

  const cueLeverEl = $('cueLever');
  if (cueLeverEl) {
    cueLeverEl.addEventListener('click', () => {
      const P = S.phase;
      if (P === 'heatup') {
        if (S.lever < 4) {
          setLever(12);
        } else if (S.Tc < 100) {
          fastTo100C();
        } else {
          fastWarmUp();
        }
      } else if (P === 'power') {
        fastToFullPower();
      } else if (P === 'grid') {
        setLever(Math.round((S.disp || 300) / 300 * 100));
      }
    });
  }

  /* ---- Plant Systems Panel Controls ---- */
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const press = (b, on) => {
    const v = on ? 'true' : 'false';
    if (b._p !== v) { b._p = v; b.setAttribute('aria-pressed', v); }
  };
  const ctl = () => S.ctl, ups = [];
  const SEG3 = [['off', 'Off'], ['auto', 'Auto'], ['on', 'On']];
  const GROUPS = [
    { name: 'Reactor', rows: [
      { t: 'btns', name: 'Protection', b: [{ l: 'SCRAM', cls: 'danger', fn: () => B.scramNow(S) }, { l: 'ARI', fn: () => B.pressARI(S) }] },
      { t: 'seg', k: 'rodMode', name: 'Rod control', sub: 'free play only', opts: [['auto', 'Auto: lever sets power'], ['man', 'Manual rods']], show: () => S.free,
        on: v => { if (v === 'man') ctl().rodCmd = Math.round(S.rod * 100); else S.lever = Math.round(clamp(S.n * 100, 0, 100)); } },
      { t: 'tog', k: 'slc', name: 'Standby liquid control', sub: 'boron', txt: ['Off', 'Injecting'], lamp: () => ctl().slc && S.tank > 0 && S.ac },
      { id: 'rwcu', t: 'rng', k: 'rwcu', name: 'Reactor water cleanup', min: 0, max: 100, step: 10, sc: 1, unit: '%' } ] },
    { name: 'Steam and condenser', rows: [
      { t: 'tog', k: 'msiv', name: 'Main steam isolation valves', txt: ['Closed', 'Open'], lamp: () => ctl().msiv },
      { t: 'seg', k: 'bypass', name: 'Turbine bypass valves', opts: [['auto', 'Auto'], ['man', 'Manual']], lamp: () => S.qb > 5 },
      { id: 'byMan', t: 'rng', k: 'byMan', name: 'Bypass opening', min: 0, max: 100, step: 5, sc: 1, unit: '%', show: () => ctl().bypass === 'man' },
      { t: 'seg', k: 'cw', name: 'Circulating water pumps', sub: 'lake water', opts: [[0, '0'], [1, '1'], [2, '2'], [3, '3']], lamp: () => S.offsite && S.sea && ctl().cw > 0 },
      { id: 'lakeT', t: 'rng', k: 'lakeT', name: 'Lake Ontario temperature (season)', min: 2, max: 24, step: 1, sc: 1, unit: '°C' },
      { t: 'seg', k: 'ic', name: 'Isolation condenser', opts: [['auto', 'Auto'], ['off', 'Off']], lamp: () => S.icOpen } ] },
    { name: 'Feedwater and level', rows: [
      { t: 'seg', k: 'fwMode', name: 'Feedwater control', opts: [['auto', 'Auto'], ['man', 'Manual']], lamp: () => S.fwNow > 0.02,
        on: v => { if (v === 'man') ctl().fwMan = Math.round(S.fwNow / 1.3 * 100); } },
      { id: 'fwMan', t: 'rng', k: 'fwMan', name: 'Feedwater flow', min: 0, max: 130, step: 5, sc: 1, unit: '%', show: () => ctl().fwMode === 'man' },
      { id: 'lvlSet', t: 'rng', k: 'lvlSet', name: 'Level setpoint', min: 70, max: 110, step: 5, sc: 1, unit: '%', show: () => ctl().fwMode === 'auto' },
      { t: 'tog', k: 'rfpStby', name: 'Standby feedwater pump', txt: ['Off', 'Running'], lamp: () => ctl().rfpStby && S.ac } ] },
    { name: 'Emergency cooling', rows: [
      { t: 'seg', k: 'rcic', name: 'RCIC', sub: 'steam-driven, DC power', opts: SEG3, lamp: () => S.rcicOn && S.batt > 0 && S.p > 0.8 },
      { t: 'seg', k: 'hpcf', name: 'High-pressure injection', sub: 'pump, needs AC', opts: SEG3, lamp: () => S.hpcfOn && S.ac },
      { t: 'seg', k: 'rhr', name: 'RHR mode', sub: 'lake-cooled', opts: [['off', 'Off'], ['pool', 'Pool'], ['sdc', 'Shutdown'], ['lpci', 'LPCI']], lamp: () => S.qrhr > 0 || S.qsdc > 0 || (ctl().rhr === 'lpci' && S.ac && S.p < 1.5) },
      { t: 'tog', k: 'ads', name: 'Open relief valves (ADS)', txt: ['Closed', 'Open'], lamp: () => S.adsOn, alert: 1 },
      { t: 'tog', k: 'alt', name: 'Alternate injection', sub: 'fire engine, below 0.9 MPa', txt: ['Off', 'Pumping'], lamp: () => ctl().alt && S.p < 0.9 } ] },
    { name: 'Containment', rows: [
      { t: 'tog', k: 'vent', name: 'Filtered containment vent', txt: ['Closed', 'Open'], lamp: () => ctl().vent, alert: 1 } ] },
    { name: 'Electric power', rows: [
      { t: 'seg', k: 'edg', name: 'Emergency diesel generators', opts: SEG3, lamp: () => S.edgRun },
      { t: 'tog', k: 'gtg', name: 'Gas turbine / mobile generator', sub: '15 s to start', txt: ['Off', 'Start'], lamp: () => S.gtgRun } ] },
    { name: 'Inject a fault', free: 1, rows: [
      { t: 'flt', k: 'fw', name: 'Feedwater pump trip', get: () => !S.fwOK },
      { t: 'flt', k: 'turb', name: 'Turbine trip', get: () => S.turbTrip > 0 },
      { t: 'flt', k: 'loop', name: 'Loss of offsite power', get: () => !S.offsite },
      { t: 'flt', k: 'sea', name: 'Loss of lake water', get: () => !S.sea },
      { t: 'flt', k: 'atws', name: 'Rods stick on next scram', get: () => S.atws } ] }
  ];

  const groupBoxes = [];
  GROUPS.forEach((g, gIdx) => {
    const box = el('div', 'grp-collapsible');
    const safeId = 'grp_' + g.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    box.id = safeId;

    // Collapsible Header
    const hdr = el('div', 'grp-header');
    hdr.tabIndex = 0;
    hdr.setAttribute('role', 'button');

    const titleWrap = el('div', 'grp-title-wrap');
    const chevron = el('span', 'grp-chevron', '▾');
    const title = el('h3', 'grp-title', g.name);
    titleWrap.appendChild(chevron);
    titleWrap.appendChild(title);

    const badge = el('span', 'grp-badge', 'READY');
    badge.id = 'badge_' + safeId;

    hdr.appendChild(titleWrap);
    hdr.appendChild(badge);
    box.appendChild(hdr);

    const body = el('div', 'grp-body');
    box.appendChild(body);

    // Initial collapse: start all collapsed so user has maximum space and zero scrolling
    const isInitiallyCollapsed = true;
    if (isInitiallyCollapsed) {
      box.classList.add('collapsed');
      hdr.setAttribute('aria-expanded', 'false');
    } else {
      hdr.setAttribute('aria-expanded', 'true');
    }

    const toggleGrp = () => {
      const isCol = box.classList.toggle('collapsed');
      hdr.setAttribute('aria-expanded', isCol ? 'false' : 'true');
    };
    hdr.addEventListener('click', toggleGrp);
    hdr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        toggleGrp();
        e.preventDefault();
      }
    });

    groupBoxes.push(box);
    $('groups').appendChild(box);

    ups.push(() => {
      const h = !!g.free && !S.free;
      if (box.hidden !== h) box.hidden = h;
    });
    g.rows.forEach(r => {
      const row = el('div', 'row'), nm = el('div', 'nm');
      let lamp = null;
      if (r.lamp) {
        lamp = el('span', 'lamp');
        nm.appendChild(lamp);
      }
      nm.appendChild(el('span', '', r.name));
      if (r.sub) nm.appendChild(el('small', '', r.sub));
      row.appendChild(nm);
      body.appendChild(row);
      let u = () => {};
      if (r.t === 'seg') {
        const seg = el('div', 'seg');
        const bs = r.opts.map(o => {
          const b = el('button', 'act', o[1]);
          b.type = 'button';
          b.addEventListener('click', () => { ctl()[r.k] = o[0]; if (r.on) r.on(o[0]); });
          seg.appendChild(b);
          return [o[0], b];
        });
        row.appendChild(seg);
        u = () => bs.forEach(x => press(x[1], ctl()[r.k] === x[0]));
      } else if (r.t === 'tog') {
        const b = el('button', 'sw' + (r.alert ? ' alert' : ''), r.txt[0]);
        b.type = 'button';
        b.addEventListener('click', () => { ctl()[r.k] = !ctl()[r.k]; });
        row.appendChild(b);
        u = () => {
          const on = !!ctl()[r.k];
          press(b, on);
          const t = r.txt[on ? 1 : 0];
          if (b._t !== t) { b._t = t; b.textContent = t; }
        };
      } else if (r.t === 'rng') {
        const w = el('div', 'rng'), inp = el('input'), val = el('span', 'val');
        inp.type = 'range'; inp.id = 'rng_' + r.id; inp.min = r.min; inp.max = r.max; inp.step = r.step;
        inp.setAttribute('aria-label', r.name);
        inp.addEventListener('input', () => { ctl()[r.k] = Number(inp.value) / r.sc; });
        w.appendChild(inp); w.appendChild(val);
        row.appendChild(w);
        u = () => {
          const v = Math.round(ctl()[r.k] * r.sc);
          if (document.activeElement !== inp && inp.value != v) inp.value = v;
          val.textContent = v + ' ' + r.unit;
        };
      } else if (r.t === 'btns') {
        const seg = el('div', 'seg');
        r.b.forEach(x => {
          const b = el('button', 'act ' + (x.cls || ''), x.l);
          b.type = 'button';
          b.addEventListener('click', x.fn);
          seg.appendChild(b);
        });
        row.appendChild(seg);
      } else if (r.t === 'flt') {
        nm.textContent = '';
        const b = el('button', 'sw alert', r.name);
        b.type = 'button';
        b.addEventListener('click', () => B.inject(S, r.k));
        row.appendChild(b);
        u = () => press(b, r.get());
      }
      ups.push(() => {
        if (r.show) {
          const h = !r.show();
          if (row.hidden !== h) row.hidden = h;
        }
        if (lamp) {
          const on = !!r.lamp();
          if (lamp._o !== on) {
            lamp._o = on;
            lamp.className = 'lamp' + (on ? ' on' : '');
          }
        }
        u();
      });
    });
  });

  let rsM = null;
  ups.push(() => {
    const m = manRods();
    if (rsM !== m) {
      rsM = m;
      const lb = document.querySelector('.leverbox-outer > .lab');
      if (lb) lb.textContent = m ? 'Control rods' : 'Power lever';
      lever.setAttribute('aria-label', m ? 'Control rod position, percent withdrawn' : 'Reactor power demand');
      const sm = $('leverVal').parentNode.querySelector('small');
      if (sm) sm.textContent = m ? 'rods withdrawn' : 'power demand';
      const sc = $('scale');
      sc.textContent = '';
      (m ? [[0, '0 ALL IN'], [30, '30'], [60, '60'], [100, '100 ALL OUT']]
         : [[0, '0'], [12, '12 HEAT', 1], [30, '30'], [60, '60'], [100, '100 FULL']]).forEach(a => {
        const i = document.createElement('i');
        i.textContent = a[1];
        if (a[2]) i.className = 'k';
        i.style.bottom = `calc(6px + (100% - 12px) * ${a[0] / 100})`;
        sc.appendChild(i);
      });
      showLever(m ? S.ctl.rodCmd : S.lever);
    } else if (m && !drag) showLever(S.ctl.rodCmd);
  });

  const MINI = [
    { l: 'Suppression pool', v: () => (S.pT - 30) / 100, t: () => S.pT.toFixed(0) + ' °C', mk: (C.POOL_ALARM - 30) / 100, c: () => S.pT > 100 ? 'red' : S.pT > C.POOL_ALARM ? 'amber' : 'green' },
    { l: 'Containment', v: () => (S.pc - 100) / 500, t: () => S.pc.toFixed(0) + ' kPa', mk: (C.PC_VENT - 100) / 500, c: () => S.pc > C.PC_VENT ? 'red' : S.pc > C.PC_ALARM ? 'amber' : 'green' },
    { l: 'DC battery', v: () => S.batt / 100, t: () => S.batt.toFixed(0) + ' %', c: () => S.batt < 20 ? 'red' : 'green' },
    { l: 'Boron in core', v: () => S.boron, t: () => (S.boron * 100).toFixed(0) + ' %', c: () => 'water' },
    { l: 'SLC tank', v: () => S.tank / 100, t: () => S.tank.toFixed(0) + ' %', c: () => 'amber' }
  ];

  const miniUp = MINI.map(m => {
    const d = el('div', 'bar');
    d.appendChild(el('span', 'lab', m.l));
    const tr = el('span', 'tr'), fl = el('i', 'fl');
    tr.appendChild(fl);
    if (m.mk != null) {
      const k = el('i', 'mk');
      k.style.left = m.mk * 100 + '%';
      tr.appendChild(k);
    }
    const b = el('b');
    d.appendChild(tr);
    d.appendChild(b);
    $('mini').appendChild(d);
    return () => {
      fl.style.width = clamp(m.v(), 0, 1) * 100 + '%';
      fl.style.background = 'var(--' + m.c() + ')';
      b.textContent = m.t();
    };
  });

  /* ---- Annunciator Tiles (FLASHING LIGHTS REMOVED) ---- */
  const TILES = [
    ['REACTOR TRIP', 'red', S => S.scram],
    ['ATWS: RODS STUCK', 'red', S => S.scram && S.atws && !S.ari && S.n > 0.05],
    ['HIGH POWER', 'red', S => S.n > 1.05],
    ['HIGH PRESSURE', 'red', S => S.p > 7.8],
    ['LOW LEVEL', 'red', S => S.phase !== 'idle' && S.level < C.LVL_ALARM],
    ['STATION BLACKOUT', 'red', S => !S.ac],
    ['CONTAINMENT PRESSURE', 'red', S => S.pc > C.PC_ALARM],
    ['HEAT-UP RATE', 'amber', S => S.phase === 'heatup' && S.Tc > 35 && S.Tc < 275 && S.rate > C.HEAT_LIM],
    ['FEEDWATER LOST', 'amber', S => !S.fwOK],
    ['TURBINE TRIP', 'amber', S => S.turbTrip > 0],
    ['LOSS OF OFFSITE POWER', 'amber', S => !S.offsite],
    ['LOSS OF LAKE WATER', 'amber', S => !S.sea],
    ['POOL TEMP HIGH', 'amber', S => S.pT > C.POOL_ALARM],
    ['MSIV CLOSED', 'amber', S => !S.ctl.msiv],
    ['RELIEF VALVES OPEN', 'amber', S => S.qsrv > 5],
    ['BYPASS OPEN', 'amber', S => S.qb > 5],
    ['FILTERED VENT OPEN', 'amber', S => S.ctl.vent],
    ['TURBINE ON GRID', 'green', S => S.turbOn && S.turbTrip <= 0],
    ['GRID MATCH', 'green', S => S.phase === 'grid' && S.grace <= 0 && Math.abs(S.mwe - S.disp) <= C.TOL],
    ['DIESELS RUNNING', 'green', S => S.edgRun || S.gtgRun],
    ['SLC INJECTING', 'blue', S => S.ctl.slc && S.tank > 0 && S.ac],
    ['RCIC RUNNING', 'blue', S => S.rcicOn && S.batt > 0 && S.p > 0.8],
    ['HPCF RUNNING', 'blue', S => S.hpcfOn && S.ac],
    ['RHR RUNNING', 'blue', S => S.qrhr > 0 || S.qsdc > 0],
    ['ISOLATION CONDENSER', 'blue', S => S.icOpen],
    ['PASSIVE POOL COOLING', 'blue', S => S.plant === 'nat' && S.scram]
  ];

  const annGrid = $('annGrid');
  const tileEls = TILES.map(t => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.textContent = t[0];
    annGrid.appendChild(d);
    return d;
  });

  /* ---- Header Stages & Text ---- */
  const STAGES = ['Heat up', 'Raise power', 'Follow grid', 'Shift done'];
  const chips = STAGES.map(t => {
    const d = document.createElement('span');
    d.className = 'chip';
    d.textContent = t;
    $('stages').appendChild(d);
    return d;
  });

  const FACTS = [
    '<b>Natural circulation.</b> The BWRX-300 has no recirculation pumps. Hot water and steam rise up a chimney above the core and cooler water sinks down the outer channel.',
    '<b>Control rods enter from below.</b> Pulling them out raises power, pushing them in lowers it. The plant computer moves them for you when you move the lever.',
    '<b>Self-limiting.</b> Hotter fuel and more steam bubbles both slow the chain reaction, so reactor power tends to settle by itself.',
    '<b>Suppression pool.</b> Steam from relief valves is condensed in a large pool of water, which keeps containment pressure low.',
    '<b>RCIC.</b> A small steam turbine pumps water into the vessel using only decay-heat steam and DC batteries.',
    '<b>Filtered vent.</b> A last-resort vent lets steam out through a water scrubber and metal filter that keep back almost all particulates.',
    '<b>Backup power.</b> Batteries, diesel generators and a gas turbine or mobile generator keep pumps and controls alive when the grid is lost.',
    '<b>Lake water.</b> Darlington sits on Lake Ontario. The condenser and RHR heat exchangers reject their heat to the lake. Losing that supply removes the normal heat sink.',
    '<b>Isolation condenser.</b> It sits in a pool above the containment, higher than the reactor, so steam rises to it by itself and the water drains back down by gravity. No pumps are needed.',
    '<b>Decay heat.</b> After a shutdown the core still gives off about 6% of full power, fading slowly. It must always be removed.'
  ];

  const trims = { alarm: 'alarm', warn: 'warn', ok: 'ok', info: '' };
  const mmss = t => {
    t = Math.floor(t);
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };
  let lastLogN = -1, maxStage = -1, resultKey = '', confirmT = 0;

  function coach() {
    const P = S.phase;
    let t = '', s = '', step = 'MISSION', stepCls = 'step-normal';
    let showStartCue = false, showLeverCue = false;

    if (P === 'idle') {
      step = 'STEP 1';
      stepCls = 'step-action';
      t = 'PRESS "START PLANT" TO INITIATE CLEAN POWER SEQUENCE';
      s = 'The reactor is cold and in safe standby. Starting it brings the core to a self-sustaining clean reaction.';
      showStartCue = true;
    } else if (P === 'failed') {
      step = 'ALERT';
      stepCls = 'step-alert';
      t = 'PLANT SAFETY TRIP: ' + S.why.toUpperCase();
      s = 'The automatic safety envelope protected the plant. Press RESTART to try again.';
    } else if (P === 'complete') {
      step = 'DONE';
      stepCls = 'step-success';
      t = 'OPERATIONAL SHIFT COMPLETE: 100% CLEAN POWER DELIVERED!';
      s = 'Outstanding work. You navigated grid transients and maintained continuous zero-carbon electricity.';
    } else if (S.scram) {
      step = 'SAFETY';
      stepCls = 'step-alert';
      if (S.atws && !S.ari && S.n > 0.05) {
        t = 'RODS STUCK (ATWS): PRESS "ARI" OR INJECT BORON (SLC)';
        s = 'Primary rods encountered resistance. Engage backup pneumatic ARI or inject liquid boron poison.';
      } else if (!S.ac) {
        t = 'OFFSITE POWER LOST: PASSIVE COOLING ACTIVE';
        s = 'The isolation condenser operates automatically by gravity with zero electrical power required.';
      } else if (S.pc > 350) {
        t = 'CONTAINMENT PRESSURE ELEVATED';
        s = 'Passive heat sinks are condensing steam. Engage RHR pool cooling if available.';
      } else {
        t = 'REACTOR SAFELY SHUT DOWN: ' + S.why.toUpperCase();
        s = 'Passive isolation condenser pools are absorbing decay heat by gravity. The plant is inherently safe.';
      }
    } else if (P === 'free') {
      step = 'MANUAL';
      stepCls = 'step-normal';
      t = 'FREE PLAY SIMULATION: OPERATE ANY SYSTEM';
      s = 'Maintain target baseload power with the lever, introduce faults in the systems deck, and observe responses.';
    } else if (P === 'heatup') {
      showLeverCue = true;
      const warmPct = Math.min(100, Math.round(clamp((S.Tc - 30) / (285 - 30) * 100, 0, 100)));
      if (S.rate > C.HEAT_LIM && S.Tc < 275) {
        step = 'ALERT';
        stepCls = 'step-alert';
        t = 'HEATING TOO FAST: PULL LEVER DOWN TO ~10-12%';
        s = 'Keep the Heat-up bar under the orange safety limit mark to protect the steel vessel from thermal stress.';
      } else if (S.lever < 4) {
        step = 'STEP 2';
        stepCls = 'step-action';
        t = 'WITHDRAW CONTROL RODS: SLIDE POWER LEVER TO ~12%';
        s = 'Slide the power lever to 12% (or click the blue prompt). Buoyancy in the tall chimney initiates natural water circulation with zero pumps.';
      } else {
        step = 'WARMING UP';
        stepCls = 'step-normal';
        t = `CORE WARMING UP: ${S.Tc.toFixed(0)} °C / 285 °C (${warmPct}%) · ${(S.pth || 0).toFixed(0)} MWt`;
        s = S.Tc < 100
          ? `Core is actively heating (~${(S.rate || 0).toFixed(0)} °C/h). Water boils at 100 °C to pressurize vessel. Click "⏩ Fast-Forward" to skip the wait!`
          : `Water is boiling! Steam pressure: ${S.p.toFixed(1)} / 6.8 MPa. Turbine rolls automatically once pressure hits 6.8 MPa. (Click "⏩ Fast-Forward" to skip).`;
      }
    } else if (P === 'power') {
      step = 'STEP 3';
      stepCls = 'step-action';
      showLeverCue = true;
      t = 'TURBINE ON GRID: NOW SLIDE LEVER UP TO 100% FULL POWER';
      s = 'The generator is synchronized to the Ontario grid. Increase steam flow to reach full 300 MWe output!';
    } else if (P === 'grid') {
      if (S.ev.fw === 1) {
        step = 'ALERT';
        stepCls = 'step-alert';
        t = 'FEEDWATER PUMP TRIPPED: REDUCE POWER OR START STANDBY PUMP';
        s = 'Water level is falling. Lower the lever to ~35%, or start the standby feedwater pump in the systems deck.';
      } else if (S.ev.tu === 1) {
        step = 'ALERT';
        stepCls = 'step-alert';
        t = 'GRID FREQUENCY EMERGENCY: REDUCE POWER BELOW 25%';
        s = `Turbine trips in ${Math.max(0, Math.ceil(S.tuWarn + 12 - S.g))} s. Pull the power lever down below 25%.`;
      } else if (S.ev.tu === 2) {
        step = 'BYPASS';
        stepCls = 'step-alert';
        t = 'TURBINE OFFLINE: STEAM DIRECTED TO MAIN CONDENSER';
        s = 'Steam bypass valves are open and dumping steam directly into the condenser. Maintain low power.';
      } else {
        step = 'ONLINE';
        stepCls = 'step-success';
        t = `ONTARIO GRID DISPATCH TARGET: ${S.disp} MWe`;
        s = 'Align power output with the target marker on the electrical dial to satisfy grid demand.';
      }
    }
    if (S.ctl.rodMode === 'man' && !S.scram && ['heatup', 'power', 'free', 'grid'].includes(P)) {
      t = 'MANUAL ROD CONTROL: DIRECT BLADE POSITIONING';
      s = `Blades are ${Math.round(S.rod * 100)}% withdrawn. Power is ${(S.n * 100).toFixed(S.n < 0.1 ? 2 : 1)}%. Move in small steps and allow natural circulation thermal delays.`;
    }

    const pill = $('missionStepPill');
    if (pill) {
      pill.textContent = step;
      pill.className = 'mission-step-pill ' + stepCls;
    }
    const cueStart = $('cueStart'), cueLever = $('cueLever');
    if (cueStart) cueStart.style.display = showStartCue ? 'block' : 'none';
    if (cueLever) {
      cueLever.style.display = showLeverCue ? 'block' : 'none';
      if (P === 'heatup') {
        const warmPct = Math.min(100, Math.round(clamp((S.Tc - 30) / (285 - 30) * 100, 0, 100)));
        if (S.lever < 4) {
          cueLever.textContent = '👉 SET LEVER TO ~12%';
          cueLever.style.background = '#0284c7';
        } else if (S.rate > C.HEAT_LIM && S.Tc < 275) {
          cueLever.textContent = '⚠️ TOO FAST: LOWER TO ~10%';
          cueLever.style.background = '#ea580c';
        } else {
          cueLever.textContent = `⏳ WARMING UP: ${S.Tc.toFixed(0)} °C (${warmPct}%) · CLICK FOR FAST ⏩`;
          cueLever.style.background = '#0284c7';
        }
      } else if (P === 'power') {
        cueLever.textContent = '⚡ NOW SLIDE UP TO 100%';
        cueLever.style.background = '#0284c7';
      } else if (P === 'grid') {
        cueLever.textContent = `🎯 MATCH GRID: ${S.disp} MWe`;
        cueLever.style.background = '#0284c7';
      }
    }

    const barWrap = $('warmupBarWrap');
    const bar = $('warmupProgressBar');
    const btnFast100 = $('btnFast100C');
    const btnFast = $('btnFastHeat');
    const btnFastFull = $('btnFastFullPower');

    if (P === 'heatup' && S.lever >= 4) {
      if (barWrap) barWrap.style.display = 'block';
      if (btnFast100) btnFast100.style.display = S.Tc < 100 ? 'inline-block' : 'none';
      if (btnFast) btnFast.style.display = 'inline-block';
      if (btnFastFull) btnFastFull.style.display = 'none';
      const warmPct = Math.min(100, Math.round(clamp((S.Tc - 30) / (285 - 30) * 100, 0, 100)));
      if (bar) bar.style.width = warmPct + '%';
    } else if (P === 'power') {
      if (barWrap) barWrap.style.display = 'none';
      if (btnFast100) btnFast100.style.display = 'none';
      if (btnFast) btnFast.style.display = 'none';
      if (btnFastFull) btnFastFull.style.display = 'inline-block';
    } else {
      if (barWrap) barWrap.style.display = 'none';
      if (btnFast100) btnFast100.style.display = 'none';
      if (btnFast) btnFast.style.display = 'none';
      if (btnFastFull) btnFastFull.style.display = 'none';
    }

    $('coachT').textContent = t;
    $('coachS').textContent = s;

    // Friendly Explorer Overview Cards Live Telemetry
    const expOverall = $('expOverallStatus');
    const expCore = $('expCore');
    const expSafety = $('expSafety');
    const expGrid = $('expGrid');
    const expLake = $('expLake');

    if (expOverall) {
      if (P === 'idle') expOverall.textContent = '● SAFE STANDBY';
      else if (S.scram) expOverall.textContent = '● SAFE PASSIVE SHUTDOWN';
      else if (P === 'heatup') expOverall.textContent = '● WARMING UP (NATURAL CIRCULATION)';
      else if (P === 'power') expOverall.textContent = '● RAMPING CLEAN POWER';
      else if (P === 'grid') expOverall.textContent = '● 100% ONLINE BASELOAD';
      else expOverall.textContent = '● OPERATIONAL';
    }
    if (expCore) {
      expCore.textContent = `${(S.pth || 0).toFixed(0)} MWt · ${(S.Tc || 0).toFixed(0)} °C (${(S.p || 0).toFixed(1)} MPa)`;
    }
    if (expSafety) {
      expSafety.textContent = S.icOpen
        ? `IC Cooling Active (${(S.qic || 0).toFixed(0)} MWt passive)`
        : '3 Passive Trains Ready (7-Day Gravity Sink)';
    }
    if (expGrid) {
      const curMwe = S.mwe || 0;
      expGrid.textContent = `${curMwe.toFixed(0)} MWe · ~${Math.round(Math.max(0, curMwe) * 1000).toLocaleString()} Homes`;
    }
    if (expLake) {
      const cw = (S.ctl && S.ctl.cw) || 0;
      const rej = (0.652 * (S.qt || 0) + (S.qb || 0)).toFixed(0);
      expLake.textContent = cw > 0
        ? `${cw} CW Pumps (${rej} MW rejected)`
        : 'Closed Loop / Eco Standby';
    }
  }

  function result() {
    const P = S.phase, box = $('result');
    if (P !== 'tripped' && P !== 'complete' && P !== 'failed') { box.hidden = true; resultKey = ''; return; }
    if (P === 'tripped' && S.tripT < 2) { box.hidden = true; return; }
    const key = P + S.logN;
    if (key === resultKey) {
      const l = $('live');
      if (l) l.textContent = `Decay heat ${(S.h * C.MWT).toFixed(0)} MWt. Reactor ${S.Tc.toFixed(0)} °C, level ${S.level.toFixed(0)}%, pool ${S.pT.toFixed(0)} °C.`;
      return;
    }
    resultKey = key;
    box.hidden = false;
    const again = '<p><button class="act" type="button" id="toIdle">Change mode</button></p>';
    if (P === 'tripped') {
      const why = {
        'High steam pressure': 'Steam was made faster than the turbine and bypass could take it, so pressure hit the trip setting.',
        'Low reactor water level': 'Feedwater was lost and the water fell too low. Cutting power quickly, or starting the standby pump, would have saved this run.',
        'High reactor power': 'Power went above the protection limit.',
        'Loss of offsite power': 'The grid connection was lost. Diesels or a gas turbine must keep pumps and controls alive.',
        'Manual scram by operator': 'You tripped the reactor by hand.'
      }[S.why] || '';
      box.innerHTML = `<h2>Safety system shut the reactor down</h2><p>${why}</p><p><b>Now:</b> the isolation condenser and pool cool the core by gravity, with no pumps or power. You can keep operating the systems. Press <b>RESTART</b> for a new run.</p><p id="live" class="note"></p>${again}`;
    } else if (P === 'failed') {
      const why = {
        'Containment overpressure': 'Heat built up faster than the pool and RHR could remove it. Cool the pool with RHR, or open the filtered vent before pressure gets this high.',
        'Core uncovered: fuel damage': 'Water fell below the fuel with no injection. Keep RCIC or HPCF available, restore AC power, or depressurise with ADS and inject with the fire engine.'
      }[S.why] || '';
      box.innerHTML = `<h2>${S.why}</h2><p>${why}</p><p>Press <b>RESTART</b> to try again.</p>${again}`;
    } else {
      const m = B.summary(S), st = '★'.repeat(m.stars) + `<span class="off">${'★'.repeat(3 - m.stars)}</span>`;
      box.innerHTML = `<h2>Shift complete</h2><div class="stars">${st}</div><ul><li>Finished without a trip</li><li>Grid match ${Math.round(m.acc * 100)}% (70% for a star)</li><li>Heat-up inside the limit ${Math.round(m.heat * 100)}% of the time (90% for a star)</li></ul><p>Score ${Math.round(Math.max(0, S.score))}. Press <b>RESTART</b> for another shift.</p>${again}`;
    }
  }

  /* ---- 2D Mimic Elements ---- */
  function flow(id, f) {
    const e = $(id);
    if (!e) return;
    f = clamp(f, 0, 1);
    if (f < 0.015) { e.style.opacity = '0'; return; }
    f = Math.sqrt(f);
    e.style.opacity = (0.35 + 0.65 * f).toString();
    e.style.setProperty('--dur', (1.7 - 1.3 * f).toFixed(2) + 's');
  }

  const rods = [...document.querySelectorAll('#rods line')];
  function valve(id, open) {
    const e = $(id);
    if (!e) return;
    e.style.fill = open ? 'var(--green)' : '#2a3a40';
  }

  /* ---- 3D Plant Renderer Initialization ---- */
  const p3cam = { yaw: -0.45, pitch: 0.5, zoom: 1, hover: null, hit: null, labels: true, focus: false };
  const p3still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let plantMode = '3d';

  function p3draw() {
    const cv = $('p3c');
    if (!cv) return;
    const parent = cv.parentElement || cv.parentNode;
    const W = Math.max(320, Math.round(parent ? parent.clientWidth : cv.clientWidth));
    const H = Math.max(240, Math.round(parent && parent.clientHeight > 100 ? parent.clientHeight : clamp(W * 0.54, 320, 650)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const targetW = Math.round(W * dpr);
    const targetH = Math.round(H * dpr);
    if (cv.width !== targetW || cv.height !== targetH) {
      cv.width = targetW;
      cv.height = targetH;
    }

    const hud = {
      core: $('tCore').textContent,
      steam: $('tSteam').textContent,
      lvl: $('tLvl').textContent,
      pool: $('tPool').textContent,
      ic: $('tIC').textContent,
      mwe: S.mwe.toFixed(0) + ' MWe',
      grid: $('tDisp').textContent
    };

    if (window.BWR_3D) {
      window.BWR_3D.p3Scene(cv.getContext('2d'), W, H, dpr, performance.now() / 1000, S, C, hud, p3cam, p3still);
    }
  }

  // Bind 3D Canvas Interactivity & Click-to-Open in New Window
  (function () {
    const cv = $('p3c');
    if (!cv) return;
    let dragObj = null;

    const at = e => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, h = p3cam.hit || {};
      for (const n of ['ic', 'cond', 'turb', 'rpv']) {
        const b = h[n];
        if (b && x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return n;
      }
      return null;
    };

    let hasDragged = false;
    let downX = 0, downY = 0;

    cv.addEventListener('pointerdown', e => {
      hasDragged = false;
      downX = e.clientX;
      downY = e.clientY;
      dragObj = { x: e.clientX, y: e.clientY, yaw: p3cam.yaw, pitch: p3cam.pitch };
    });

    cv.addEventListener('pointermove', e => {
      if (dragObj) {
        const dx = e.clientX - downX, dy = e.clientY - downY;
        if (Math.abs(dx) + Math.abs(dy) > 5) hasDragged = true;
        if (hasDragged) {
          p3cam.yaw = dragObj.yaw + dx * 0.008;
          if (e.pointerType === 'mouse') p3cam.pitch = clamp(dragObj.pitch + dy * 0.006, 0.15, 1.2);
          cv.style.cursor = 'grabbing';
        }
      } else {
        p3cam.hover = at(e);
        cv.style.cursor = p3cam.hover ? 'pointer' : 'grab';
      }
    });

    cv.addEventListener('pointerup', () => {
      dragObj = null;
      cv.style.cursor = p3cam.hover ? 'pointer' : 'grab';
    });

    // Native CLICK handler - Guaranteed trusted browser user activation
    cv.addEventListener('click', e => {
      if (hasDragged) return;
      const clickedPart = at(e);
      if (clickedPart) {
        openDetailWindow(clickedPart);
      }
    });

    cv.addEventListener('pointercancel', () => { dragObj = null; });
    cv.addEventListener('pointerleave', () => { if (!dragObj) p3cam.hover = null; });

    cv.addEventListener('keydown', e => {
      const m = {
        ArrowLeft: () => { p3cam.yaw -= 0.15; },
        ArrowRight: () => { p3cam.yaw += 0.15; },
        ArrowUp: () => { p3cam.pitch = clamp(p3cam.pitch + 0.08, 0.15, 1.2); },
        ArrowDown: () => { p3cam.pitch = clamp(p3cam.pitch - 0.08, 0.15, 1.2); }
      }[e.key];
      if (m) { m(); e.preventDefault(); }
    });

    $('p3L').addEventListener('click', () => { p3cam.yaw -= 0.3; });
    $('p3R').addEventListener('click', () => { p3cam.yaw += 0.3; });
    // Wheel zoom on 3D canvas
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      p3cam.zoom = clamp((p3cam.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.92), 0.5, 3.0);
    }, { passive: false });

    $('p3Reset').addEventListener('click', () => {
      p3cam.yaw = -0.45;
      p3cam.pitch = 0.5;
      p3cam.zoom = 1;
    });

    const zIn = $('p3ZoomIn');
    if (zIn) zIn.addEventListener('click', () => { p3cam.zoom = clamp((p3cam.zoom || 1) * 1.18, 0.5, 3.0); });
    const zOut = $('p3ZoomOut');
    if (zOut) zOut.addEventListener('click', () => { p3cam.zoom = clamp((p3cam.zoom || 1) / 1.18, 0.5, 3.0); });

    $('p3Lab').addEventListener('click', () => {
      p3cam.labels = !p3cam.labels;
      press($('p3Lab'), p3cam.labels);
    });

    $('p3Focus').addEventListener('click', () => {
      p3cam.focus = !p3cam.focus;
      press($('p3Focus'), p3cam.focus);
      // Show the destination state (what you'll switch TO)
      $('p3Focus').textContent = p3cam.focus ? '🏭 Whole plant' : '⚛ Reactor focus';
    });

    // Pop-out detail window buttons in animation toolbar
    $('p3Rpv').addEventListener('click', () => openDetailWindow('rpv'));
    $('p3IC').addEventListener('click', () => openDetailWindow('ic'));
    $('p3Turb').addEventListener('click', () => openDetailWindow('turb'));
    $('p3Cond').addEventListener('click', () => openDetailWindow('cond'));

    // Toggle 2D / 3D mode
    $('pMode').addEventListener('click', () => {
      plantMode = plantMode === '3d' ? '2d' : '3d';
      if (plantMode === '2d') {
        $('p3c').setAttribute('hidden', '');
        $('mimic').removeAttribute('hidden');
        $('p3only').setAttribute('hidden', '');
        $('pMode').textContent = '3D view';
      } else {
        $('mimic').setAttribute('hidden', '');
        $('p3c').removeAttribute('hidden');
        $('p3only').removeAttribute('hidden');
        $('pMode').textContent = '2D diagram';
      }
    });

    // Launch Mode Buttons (2nd Screen vs Full New Tab)
    const btn2nd = $('btn2ndScreen');
    const btnTab = $('btnNewTab');

    if (btn2nd && btnTab) {
      btn2nd.addEventListener('click', async () => {
        launchMode = '2ndScreen';
        press(btn2nd, true);
        press(btnTab, false);
        const hasMulti = await requestScreenPermission();
        if (!hasMulti && !('getScreenDetails' in window)) {
          console.log('Window management API not available or single screen');
        }
      });

      btnTab.addEventListener('click', () => {
        launchMode = 'newTab';
        press(btn2nd, false);
        press(btnTab, true);
      });
    }

    // 2D SVG clickable components -> Open in New Window
    function hook2D(id, part) {
      const e = $(id);
      if (e) {
        e.addEventListener('click', () => openDetailWindow(part));
        e.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            openDetailWindow(part);
            ev.preventDefault();
          }
        });
      }
    }
    hook2D('rpvG', 'rpv');
    hook2D('turbG', 'turb');
    hook2D('condG', 'cond');
    hook2D('icG', 'ic');
  })();

  /* ---- Master Render Function ---- */
  function render() {
    const hot = S.phase !== 'idle', c = S.ctl;
    const per = Math.abs(S.dln) > 0.004 ? 1 / S.dln : Infinity;

    // Water level in 2D SVG
    $('wtr').setAttribute('y', clamp(170 + (100 - S.level) * 1.6, 150, 366));
    $('wtr').setAttribute('height', Math.max(2, 368 - clamp(170 + (100 - S.level) * 1.6, 150, 366)));
    if (window.BWR_3D) {
      $('core').style.fill = window.BWR_3D.coreColor(Math.sqrt(S.n) * 0.9 + S.h * 2);
    }
    rods.forEach(l => l.setAttribute('y2', 356 - (1 - S.rod) * 54));

    const nat = S.Tc > 100 ? S.pth / 300 : 0;
    flow('riser', nat); flow('dcL', nat); flow('dcR', nat);
    flow('fSteam', (S.qt + S.qb + S.qic) / C.MWT * 1.4);
    flow('fExh', S.qt / C.MWT * 1.4);
    flow('fByp', S.qb / C.QB_MAX);
    flow('fIcIn', S.qic / C.IC_MAX);
    flow('fIcOut', S.qic / C.IC_MAX);
    flow('fFw', S.fwNow);

    valve('vIC', S.icOpen);
    valve('vBy', S.qb > 5);
    if ($('vGov')) valve('vGov', S.turbOn && S.turbTrip <= 0 && S.qt > 5);
    if ($('vPrim')) valve('vPrim', S.ctl.msiv);
    $('pump').style.fill = S.fwNow > 0.02 ? '#1c4a37' : '#6a1b14';
    $('pump').style.stroke = S.fwNow > 0.02 ? '#5b7983' : 'var(--red)';
    $('turb').style.fill = S.turbOn && S.turbTrip <= 0 ? '#1c4a37' : S.turbTrip > 0 ? '#5a3d0d' : '#16262d';

    const f = clamp((S.pT - 30) / 90, 0, 1);
    $('spool').style.fill = `rgb(${Math.round(43 + 212 * f)},${Math.round(121 + 17 * f)},${Math.round(184 - 123 * f)})`;
    $('tMWe').textContent = S.mwe.toFixed(0) + ' MWe';
    $('tDisp').textContent = S.phase === 'grid' || S.phase === 'power' ? 'ASKS ' + S.disp : '';
    $('tSteam').textContent = `${S.p.toFixed(2)} MPa  ${S.Tc.toFixed(0)} °C (${(S.Tc + 273.15).toFixed(0)} K)`;
    $('tCore').textContent = `REACTOR ${(S.n * 100).toFixed(S.n < 0.1 ? 2 : 1)} %  ${S.pth.toFixed(0)} MWt`;
    $('tLvl').textContent = `LEVEL ${(14.2 * (S.level / 100)).toFixed(1)} m (${S.level.toFixed(0)}%)${S.fwNow > 0.02 ? '' : '  NO FEEDWATER'}`;
    $('tIC').textContent = [
      S.icOpen ? `ISOLATION CONDENSER OPEN  ${S.qic.toFixed(0)} MW to pool` : '',
      S.qsrv > 5 ? `RELIEF VALVES OPEN  ${S.qsrv.toFixed(0)} MW to pool` : '',
      c.vent ? 'FILTERED VENT OPEN' : ''
    ].filter(Boolean).join('   ');
    $('tPool').textContent = `POOL ${S.pT.toFixed(0)} °C   CONT ${S.pc.toFixed(0)} kPa   AC ${S.ac ? 'OK' : 'LOST'}   DC ${S.batt.toFixed(0)}%`;

    // Dials
    dP.set(S.n * 100, (S.n * 100).toFixed(S.n < 0.1 ? 2 : 1), S.pth.toFixed(0) + ' MWt');
    dE.set(S.mwe, S.mwe.toFixed(0), S.phase === 'grid' || S.phase === 'power' ? 'asks ' + S.disp : '', S.phase === 'grid' || S.phase === 'power' ? S.disp : null);
    dPr.set(S.p, S.p.toFixed(2), `${S.Tc.toFixed(0)} °C (${(S.Tc + 273.15).toFixed(0)} K)`);
    dL.set(S.level, S.level.toFixed(0), `${(14.2 * (S.level / 100)).toFixed(1)} m · ${S.fwNow > 0.02 ? 'feed ok' : 'no feed'}`);

    // Bars
    const hr = clamp(S.rate, 0, 250);
    $('bHeat').style.width = hr / 2.5 + '%';
    $('bHeat').style.background = hr > C.HEAT_LIM ? 'var(--red)' : 'var(--green)';
    $('vHeat').textContent = Math.round(hr) + '/min';
    $('bRod').style.width = S.rod * 100 + '%';
    $('rodact').style.height = `calc((100% - 12px) * ${S.rod})`;
    $('vRod').textContent = Math.round(S.rod * 100) + '%';
    $('bPer').style.width = isFinite(per) ? clamp(100 - Math.abs(per) * 2, 4, 100) + '%' : '0';
    $('vPer').textContent = isFinite(per) ? (per > 0 ? '+' : '-') + Math.min(999, Math.abs(per)).toFixed(0) + 's' : '∞';

    // Reactivity / Criticality (per Design Notes Page 5)
    const vCrit = $('vCrit'), bCrit = $('bCrit');
    if (vCrit) {
      const rho_mK = Math.abs(S.dln) < 0.0005 ? 0 : S.dln * 12;
      let critStatus = 'steady';
      let critCol = 'var(--green)';
      if (S.scram || S.phase === 'idle' || S.n < 0.001) {
        critStatus = 'subcritical';
        critCol = '#3f9be0';
      } else if (S.dln > 0.005) {
        critStatus = `+${rho_mK.toFixed(1)} mK (supercrit)`;
        critCol = 'var(--warn)';
      } else if (S.dln < -0.005) {
        critStatus = `${rho_mK.toFixed(1)} mK (subcrit)`;
        critCol = '#3f9be0';
      } else {
        critStatus = `${rho_mK.toFixed(1)} mK (steady)`;
        critCol = 'var(--green)';
      }
      vCrit.textContent = critStatus;
      if (bCrit) {
        bCrit.style.background = critCol;
        bCrit.style.width = clamp(50 + rho_mK * 5, 5, 100) + '%';
      }
    }

    // Annunciator Tiles - STEADY COLOR, NO FLASHING (USER REQUEST)
    TILES.forEach((t, i) => {
      const on = hot && t[2](S);
      tileEls[i].className = 'tile' + (on ? ' ' + t[1] : '');
    });

    // Stage chips
    const idx = { heatup: 0, power: 1, free: 1, grid: 2, complete: 3 }[S.phase];
    if (idx != null) maxStage = Math.max(maxStage, idx);
    chips.forEach((ch, i) => {
      ch.className = 'chip' + (i === maxStage && S.phase !== 'tripped' && S.phase !== 'complete' && S.phase !== 'failed'
        ? ' on' : i < maxStage || (S.phase === 'complete') ? ' done' : '');
    });
    if (S.phase === 'tripped' || S.phase === 'failed') {
      chips.forEach(ch => { if (ch.className === 'chip on') ch.className = 'chip'; });
    }

    $('score').textContent = S.free ? 'free' : Math.round(Math.max(0, S.score));

    // Event log
    if (S.logN !== lastLogN) {
      lastLogN = S.logN;
      $('log').innerHTML = S.log.slice(-16).reverse().map(l =>
        `<div class="log-entry ${trims[l.kind]}"><time>${mmss(l.t)}</time><span>${l.msg}</span></div>`
      ).join('') || '<div class="log-entry"><time>--:--</time><span>Waiting for plant start.</span></div>';
    }

    // Update collapsible group status badges
    updateGroupBadges();

    // Intro modal visibility
    updateIntroModal();
    coach();
    result();
    ups.forEach(u => u());
    miniUp.forEach(u => u());

    // Draw 3D view if visible
    if (plantMode === '3d') {
      p3draw();
    }

    // Start / Restart button state (NO PULSING ANIMATION)
    const b = $('start'), P = S.phase;
    if (P === 'idle') {
      b.className = '';
      b.innerHTML = 'START<br>PLANT';
    } else if (P === 'tripped' || P === 'complete' || P === 'failed') {
      b.className = 'again';
      b.innerHTML = 'RE<wbr>START';
    } else if (performance.now() < confirmT) {
      b.className = 'confirm';
      b.innerHTML = 'SURE?<br>CLICK';
    } else {
      b.className = 'run';
      b.innerHTML = 'RE<wbr>START';
    }

    // Broadcast updated state to any open detail windows
    broadcastState();
  }

  function newIdle() {
    S = B.create(null, { free: optFree });
    setLever(0);
    maxStage = -1;
    resultKey = '';
    lastLogN = -1;
  }

  // Expand / Collapse All systems groups
  const btnExp = $('btnExpandAll');
  if (btnExp) {
    btnExp.addEventListener('click', () => {
      groupBoxes.forEach(b => {
        b.classList.remove('collapsed');
        const h = b.querySelector('.grp-header');
        if (h) h.setAttribute('aria-expanded', 'true');
      });
    });
  }
  const btnCol = $('btnCollapseAll');
  if (btnCol) {
    btnCol.addEventListener('click', () => {
      groupBoxes.forEach(b => {
        b.classList.add('collapsed');
        const h = b.querySelector('.grp-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Update dynamic badges on collapsible headers
  function updateGroupBadges() {
    const bReactor = $('badge_grp_reactor');
    if (bReactor) {
      if (S.scram) {
        bReactor.textContent = 'TRIPPED';
        bReactor.className = 'grp-badge danger';
      } else if (S.ctl.slc && S.tank > 0 && S.ac) {
        bReactor.textContent = 'BORON INJ';
        bReactor.className = 'grp-badge warn';
      } else {
        bReactor.textContent = manRods() ? `${Math.round(S.rod * 100)}% RODS` : `${Math.round(S.n * 100)}% PWR`;
        bReactor.className = 'grp-badge active';
      }
    }

    const bSteam = $('badge_grp_steam_and_condenser');
    if (bSteam) {
      if (!S.ctl.msiv) {
        bSteam.textContent = 'MSIV CLOSED';
        bSteam.className = 'grp-badge danger';
      } else if (S.qb > 5) {
        bSteam.textContent = 'BYPASS OPEN';
        bSteam.className = 'grp-badge warn';
      } else if (S.icOpen) {
        bSteam.textContent = 'IC ACTIVE';
        bSteam.className = 'grp-badge active';
      } else {
        bSteam.textContent = `MSIV OPEN · CW ${S.ctl.cw}`;
        bSteam.className = 'grp-badge active';
      }
    }

    const bFeed = $('badge_grp_feedwater_and_level');
    if (bFeed) {
      if (!S.fwOK) {
        bFeed.textContent = 'PUMP TRIP';
        bFeed.className = 'grp-badge danger';
      } else if (S.level < C.LVL_ALARM) {
        bFeed.textContent = `LOW ${S.level.toFixed(0)}%`;
        bFeed.className = 'grp-badge warn';
      } else {
        bFeed.textContent = `LVL ${S.level.toFixed(0)}%`;
        bFeed.className = 'grp-badge active';
      }
    }

    const bEmerg = $('badge_grp_emergency_cooling');
    if (bEmerg) {
      if (S.adsOn) {
        bEmerg.textContent = 'ADS ACTIVE';
        bEmerg.className = 'grp-badge danger';
      } else if (S.rcicOn) {
        bEmerg.textContent = 'RCIC RUNNING';
        bEmerg.className = 'grp-badge active';
      } else if (S.hpcfOn) {
        bEmerg.textContent = 'HPCF RUNNING';
        bEmerg.className = 'grp-badge active';
      } else if (S.qrhr > 0 || S.qsdc > 0) {
        bEmerg.textContent = `RHR ${S.ctl.rhr.toUpperCase()}`;
        bEmerg.className = 'grp-badge active';
      } else {
        bEmerg.textContent = 'STANDBY';
        bEmerg.className = 'grp-badge';
      }
    }

    const bCont = $('badge_grp_containment');
    if (bCont) {
      if (S.ctl.vent) {
        bCont.textContent = 'VENT OPEN';
        bCont.className = 'grp-badge warn';
      } else if (S.pc > C.PC_ALARM) {
        bCont.textContent = `${S.pc.toFixed(0)} kPa HIGH`;
        bCont.className = 'grp-badge danger';
      } else {
        bCont.textContent = `${S.pc.toFixed(0)} kPa`;
        bCont.className = 'grp-badge';
      }
    }

    const bPwr = $('badge_grp_electric_power');
    if (bPwr) {
      if (!S.ac) {
        bPwr.textContent = 'BLACKOUT';
        bPwr.className = 'grp-badge danger';
      } else if (S.edgRun || S.gtgRun) {
        bPwr.textContent = S.edgRun ? 'EDG RUNNING' : 'GTG RUNNING';
        bPwr.className = 'grp-badge warn';
      } else {
        bPwr.textContent = `GRID OK · DC ${S.batt.toFixed(0)}%`;
        bPwr.className = 'grp-badge active';
      }
    }

    const bFlt = $('badge_grp_inject_a_fault');
    if (bFlt) {
      const activeFaults = (!S.fwOK ? 1 : 0) + (S.turbTrip > 0 ? 1 : 0) + (!S.offsite ? 1 : 0) + (!S.sea ? 1 : 0) + (S.atws ? 1 : 0);
      if (activeFaults > 0) {
        bFlt.textContent = `${activeFaults} ACTIVE`;
        bFlt.className = 'grp-badge danger';
      } else {
        bFlt.textContent = 'READY';
        bFlt.className = 'grp-badge';
      }
    }
  }

  // Intro Modal Management: clean, dismissible, non-obstructive (hidden by default)
  let introDismissed = true;
  function updateIntroModal() {
    const wrap = $('introModalWrap');
    if (wrap) {
      wrap.hidden = introDismissed;
    }
  }

  const introClose = $('introClose');
  if (introClose) {
    introClose.addEventListener('click', () => {
      introDismissed = true;
      updateIntroModal();
    });
  }

  const introModalWrap = $('introModalWrap');
  if (introModalWrap) {
    introModalWrap.addEventListener('click', e => {
      if (e.target === introModalWrap) {
        introDismissed = true;
        updateIntroModal();
      }
    });
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !introDismissed) {
        introDismissed = true;
        updateIntroModal();
      }
    });
  }

  const btnStartModal = $('btnStartModal');
  if (btnStartModal) {
    btnStartModal.addEventListener('click', () => {
      introDismissed = true;
      updateIntroModal();
      $('start').click();
    });
  }

  const btnOpenIntro = $('btnOpenIntro');
  if (btnOpenIntro) {
    btnOpenIntro.addEventListener('click', () => {
      introDismissed = false;
      updateIntroModal();
    });
  }

  // Modal mode buttons synced with top mode buttons
  const oGModal = $('oGuidedModal'), oFModal = $('oFreeModal');
  if (oGModal && oFModal) {
    oGModal.addEventListener('click', () => {
      $('oGuided').click();
      press(oGModal, true);
      press(oFModal, false);
    });
    oFModal.addEventListener('click', () => {
      $('oFree').click();
      press(oGModal, false);
      press(oFModal, true);
    });
  }
  function opts() {
    press($('oGuided'), !optFree);
    press($('oFree'), optFree);
    const ogm = $('oGuidedModal'), ofm = $('oFreeModal');
    if (ogm) press(ogm, !optFree);
    if (ofm) press(ofm, optFree);
  }

  [['oGuided', () => optFree = false], ['oFree', () => optFree = true]].forEach(a => {
    $(a[0]).addEventListener('click', () => { a[1](); opts(); newIdle(); });
  });
  opts();

  /* ---- Friendly Explorer Guide vs Pro Engineering Deck Switcher ---- */
  const btnExplorer = $('btnExplorerMode'), btnPro = $('btnProMode');
  const explorerPanel = $('explorerPanel'), proPanel = $('proAnnPanel');
  if (btnExplorer && btnPro && explorerPanel && proPanel) {
    btnExplorer.addEventListener('click', () => {
      btnExplorer.classList.add('active');
      btnPro.classList.remove('active');
      explorerPanel.style.display = '';
      proPanel.style.display = 'none';
    });
    btnPro.addEventListener('click', () => {
      btnPro.classList.add('active');
      btnExplorer.classList.remove('active');
      explorerPanel.style.display = 'none';
      proPanel.style.display = '';
    });
  }

  $('result').addEventListener('click', e => {
    if (e.target && e.target.id === 'toIdle') newIdle();
  });

  $('start').addEventListener('click', () => {
    introDismissed = true;
    updateIntroModal();
    const P = S.phase, now = performance.now();
    if (P === 'heatup' || P === 'power' || P === 'grid' || P === 'free') {
      if (now > confirmT) {
        confirmT = now + 3000;
        return;
      }
    }
    confirmT = 0;
    S = B.create(null, { free: optFree });
    B.start(S);
    setLever(0);
    maxStage = 0;
    resultKey = '';
    lastLogN = -1;
    lever.focus({ preventScroll: true });
  });

  /* ---- Right Column: Tab Switching (Systems / Guide / Log / Split View) ---- */
  const tabBtns = {
    systems: $('tabBtnSystems'),
    guide: $('tabBtnGuide'),
    log: $('tabBtnLog'),
    split: $('tabBtnSplit')
  };
  const tabPanes = {
    systems: $('tabPaneSystems'),
    guide: $('tabPaneGuide'),
    log: $('tabPaneLog'),
    split: $('tabPaneSplit')
  };

  function activateTab(tab) {
    Object.keys(tabBtns).forEach(k => {
      if (tabBtns[k]) {
        if (k === tab) tabBtns[k].classList.add('active');
        else tabBtns[k].classList.remove('active');
      }
      if (tabPanes[k]) {
        if (k === tab) tabPanes[k].removeAttribute('hidden');
        else tabPanes[k].setAttribute('hidden', '');
      }
    });
  }

  Object.keys(tabBtns).forEach(k => {
    if (tabBtns[k]) {
      tabBtns[k].addEventListener('click', () => activateTab(k));
    }
  });

  // Tally for isolation condenser
  function icTally() {
    if (S.t < icLastT) icE = 0;
    icLastT = S.t;
    if (S.icOpen) icE += S.qic * 0.05;
  }

  /* ---- Simulation Main Loop ---- */
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.5, ((now - last) / 1000) * simSpeed);
    last = now;
    while (acc >= 0.05) {
      B.step(S, 0.05);
      acc -= 0.05;
      icTally();
    }
    render();
    requestAnimationFrame(frame);
  }

  let factI = 0;
  $('fact').innerHTML = FACTS[0];
  setInterval(() => {
    factI = (factI + 1) % FACTS.length;
    $('fact').innerHTML = FACTS[factI];
  }, 14000);

  requestAnimationFrame(frame);

  // Expose global for window.opener in detail windows
  window.__bwr = {
    get S() { return S; },
    get icE() { return icE; },
    setLever,
    openDetailWindow
  };
})();
