/* BWRX-300 Component Detail Window Controller
   Handles live data synchronization with main control room via BroadcastChannel and window.opener */
(function () {
  'use strict';

  const B = window.BWR;
  const V = window.BWR_Views;
  const C = B.C;
  const clamp = B.clamp;

  let currentPart = 'rpv';
  let S = null;
  let icE = 0;
  let isConnected = false;

  // Read URL param
  const urlParams = new URLSearchParams(window.location.search);
  const partParam = urlParams.get('part');
  if (['rpv', 'turb', 'cond', 'ic'].includes(partParam)) {
    currentPart = partParam;
  }

  // Setup BroadcastChannel for cross-window real-time communication
  let channel = null;
  try {
    channel = new BroadcastChannel('bwrx300_sim_channel');
    channel.onmessage = e => {
      if (e.data) {
        if (e.data.type === 'STATE_UPDATE') {
          S = e.data.state;
          icE = e.data.icE || 0;
          setConnected(true);
        } else if (e.data.type === 'NAVIGATE_PART' && e.data.part) {
          switchPart(e.data.part);
        }
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel unavailable:', err);
  }

  // Also listen for direct postMessage from window.opener
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'NAVIGATE_PART' && e.data.part) {
        switchPart(e.data.part);
      }
    });
  }

  function setConnected(connected) {
    isConnected = connected;
    const dot = document.getElementById('syncDot');
    const txt = document.getElementById('syncText');
    if (dot && txt) {
      if (connected) {
        dot.className = 'status-dot';
        txt.textContent = 'LIVE SYNCED TO CONTROL ROOM';
      } else {
        dot.className = 'status-dot disconnected';
        txt.textContent = 'STANDALONE PREVIEW';
      }
    }
  }

  // Fallback to local state if opened standalone
  function checkState() {
    if (window.opener && window.opener.__bwr && window.opener.__bwr.S) {
      S = window.opener.__bwr.S;
      if (typeof window.opener.__bwr.icE === 'number') {
        icE = window.opener.__bwr.icE;
      }
      setConnected(true);
      return;
    }
    if (!S) {
      // Create a running demo state for standalone viewing
      S = B.create(null, { free: true });
      S.phase = 'power';
      S.n = 1.0;
      S.pth = C.MWT;
      S.mwe = 300;
      S.p = 7.0;
      S.Tc = 286;
      S.turbOn = true;
      S.turbTrip = 0;
      S.qt = C.MWT;
      S.rpm = 1500;
      S.vac = 5.2;
      S.icOpen = true;
      S.qic = 38.0;
      icE = 125000;
      S.sea = true;
      if (!S.ctl) S.ctl = {};
      S.ctl.cw = 3;
      S.ctl.lakeT = 14;
      S.ctl.msiv = true;
      setConnected(false);
    }
  }

  // UI elements & view switching
  const views = {
    rpv: document.getElementById('rview'),
    turb: document.getElementById('tview'),
    cond: document.getElementById('cview'),
    ic: document.getElementById('iview')
  };

  const navBtns = {
    rpv: document.getElementById('btnNavRpv'),
    turb: document.getElementById('btnNavTurb'),
    cond: document.getElementById('btnNavCond'),
    ic: document.getElementById('btnNavIC')
  };

  function switchPart(part) {
    currentPart = part;
    Object.keys(views).forEach(k => {
      if (views[k]) {
        if (k === part) views[k].removeAttribute('hidden');
        else views[k].setAttribute('hidden', '');
      }
      if (navBtns[k]) {
        if (k === part) navBtns[k].classList.add('active');
        else navBtns[k].classList.remove('active');
      }
    });
    // Update window title
    const titles = {
      rpv: 'Reactor Pressure Vessel (RPV) - BWRX-300',
      turb: 'Turbine Hall & Generator - BWRX-300',
      cond: 'Main Condenser & Lake Ontario - BWRX-300',
      ic: 'Isolation Condenser System - BWRX-300'
    };
    document.title = titles[part] || 'BWRX-300 Detail View';
  }

  // Bind nav buttons
  Object.keys(navBtns).forEach(k => {
    if (navBtns[k]) {
      navBtns[k].addEventListener('click', () => switchPart(k));
    }
  });

  // Second Screen & Display actions
  const btnFs = document.getElementById('btnFullscreen');
  if (btnFs) {
    btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        btnFs.textContent = '⛶ Exit Fullscreen';
      } else {
        document.exitFullscreen().catch(() => {});
        btnFs.textContent = '⛶ Fullscreen';
      }
    });
  }

  const btnMove = document.getElementById('btnMoveScreen');
  if (btnMove) {
    btnMove.addEventListener('click', async () => {
      // 1. If getScreenDetails is supported, use exact other display coordinates
      if ('getScreenDetails' in window) {
        try {
          const details = await window.getScreenDetails();
          if (details && details.screens && details.screens.length > 1) {
            const other = details.screens.find(s => s !== details.currentScreen) || details.screens[1];
            if (other) {
              window.moveTo(other.availLeft, other.availTop);
              window.resizeTo(other.availWidth, other.availHeight);
              return;
            }
          }
        } catch (e) {}
      }

      // 2. Coordinate fallback
      const curX = window.screenLeft !== undefined ? window.screenLeft : (window.screenX || 0);
      const sWidth = window.screen.width;
      if (curX >= 0 && curX < (sWidth - 100)) {
        window.moveTo(sWidth + 40, 40);
        window.resizeTo(window.screen.availWidth || 1200, window.screen.availHeight || 800);
      } else {
        window.moveTo(40, 40);
        window.resizeTo(window.screen.availWidth || 1200, window.screen.availHeight || 800);
      }
    });
  }

  // 3D View Configurations for all plant rooms
  const p3still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const viewConfigs = {
    rpv: {
      cvId: 'rc',
      svgId: 'rsvg',
      cardsId: 'rcards',
      cardsData: V.RCARDS,
      presets: V.RPRE,
      presetBtns: [['rWhole', 'whole'], ['rCore', 'core'], ['rTop', 'top'], ['rBot', 'bot']],
      btnL: 'rL', btnR: 'rR', btnCut: 'rCut', btnLab: 'rLab', btnSchem: 'rSchem', btnAct: 'rAct',
      cam: { yaw: -0.5, pitch: 0.35, cy: 7.6, span: 27.8, tcy: 7.6, tspan: 27.8, sel: null, labels: true, cut: true, isSchem: false },
      draw3D: (ctx, W, H, dpr, t, cam) => V.p3Rpv(ctx, W, H, dpr, t, S, C, (window.BWR_3D && window.BWR_3D.coreColor), cam, p3still),
      draw2D: () => V.renderRpv(S, document)
    },
    turb: {
      cvId: 'tc',
      svgId: 'tsvg',
      cardsId: 'tcards',
      cardsData: V.TCARDS,
      presets: V.TPRE,
      presetBtns: [['tWhole', 'whole'], ['tHp', 'hp'], ['tMsr', 'msr'], ['tGen', 'gen']],
      btnL: 'tL', btnR: 'tR', btnCut: 'tCut', btnLab: 'tLab', btnSchem: 'tSchem', btnAct: 'tAct',
      cam: { yaw: -0.6, pitch: 0.35, cy: 7.5, span: 26.0, tcy: 7.5, tspan: 26.0, sel: null, labels: true, cut: true, isSchem: false },
      draw3D: (ctx, W, H, dpr, t, cam) => V.p3Turbine(ctx, W, H, dpr, t, S, C, cam, p3still),
      draw2D: () => V.renderTurbine(S, document)
    },
    cond: {
      cvId: 'cc',
      svgId: 'csvg',
      cardsId: 'ccards',
      cardsData: V.CCARDS,
      presets: V.CPRE,
      presetBtns: [['cWhole', 'whole'], ['cTubes', 'tubes'], ['cHot', 'hotwell'], ['cCw', 'cw']],
      btnL: 'cL', btnR: 'cR', btnCut: 'cCut', btnLab: 'cLab', btnSchem: 'cSchem', btnAct: 'cAct',
      cam: { yaw: -0.55, pitch: 0.35, cy: 3.5, span: 20.0, tcy: 3.5, tspan: 20.0, sel: null, labels: true, cut: true, isSchem: false },
      draw3D: (ctx, W, H, dpr, t, cam) => V.p3Condenser(ctx, W, H, dpr, t, S, C, cam, p3still),
      draw2D: () => V.renderCondenser(S, document)
    },
    ic: {
      cvId: 'ic_c',
      svgId: 'isvg',
      cardsId: 'iccards',
      cardsData: V.ICARDS,
      presets: V.IPRE,
      presetBtns: [['iWhole', 'whole'], ['iPool', 'pool'], ['iTubes', 'tubes'], ['iValves', 'valves']],
      btnL: 'iL', btnR: 'iR', btnCut: 'iCut', btnLab: 'iLab', btnSchem: 'iSchem', btnAct: 'iAct',
      cam: { yaw: -0.55, pitch: 0.35, cy: 24.0, span: 22.0, tcy: 24.0, tspan: 22.0, sel: null, labels: true, cut: true, isSchem: false },
      draw3D: (ctx, W, H, dpr, t, cam) => V.p3IC(ctx, W, H, dpr, t, S, C, cam, p3still, icE),
      draw2D: () => V.renderIC(S, icE, document)
    }
  };

  function initCards(cfg) {
    if (!cfg.cardsData) return;
    const colL = document.getElementById(`${cfg.cardsId}_l`);
    const colR = document.getElementById(`${cfg.cardsId}_r`);
    const single = document.getElementById(cfg.cardsId);
    if (!colL && !colR && !single) return;
    if ((colL && colL.children.length > 0) || (single && single.children.length > 0)) return;

    const total = cfg.cardsData.length;
    let splitIdx = Math.ceil(total / 2);
    if (colL && colR && total > 2) {
      // Balance physical height of columns based on text length so neither side forces scrolling
      const weights = cfg.cardsData.map(c => 65 + (c[4] ? c[4].length : 100));
      const totalW = weights.reduce((a, b) => a + b, 0);
      let running = 0, bestDiff = Infinity;
      for (let i = 0; i < total - 1; i++) {
        running += weights[i];
        const diff = Math.abs(running - (totalW - running));
        if (diff < bestDiff) {
          bestDiff = diff;
          splitIdx = i + 1;
        }
      }
    }

    cfg.cardsData.forEach((c, idx) => {
      const b = document.createElement('button');
      b.className = 'rcard';
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      const t = document.createElement('b'); t.textContent = c[1];
      const v = document.createElement('span'); v.className = 'v'; v.id = `${cfg.cardsId}_v_${c[0]}`;
      const x = document.createElement('span'); x.textContent = c[4];
      b.appendChild(t); b.appendChild(v); b.appendChild(x);

      let target = single;
      if (colL && colR) {
        target = (idx < splitIdx) ? colL : colR;
      } else if (colL) {
        target = colL;
      }
      if (target) target.appendChild(b);

      b.addEventListener('click', () => {
        cfg.cam.sel = cfg.cam.sel === c[0] ? null : c[0];
        document.querySelectorAll(`#${cfg.cardsId}_l .rcard, #${cfg.cardsId}_r .rcard, #${cfg.cardsId} .rcard`).forEach(el => {
          const valEl = el.querySelector('.v');
          const isPressed = valEl && valEl.id === `${cfg.cardsId}_v_${cfg.cam.sel}`;
          el.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
        });
        if (cfg.cam.sel && cfg.presets && cfg.presets[c[2]]) {
          cfg.cam.tcy = cfg.presets[c[2]][0];
          cfg.cam.tspan = cfg.presets[c[2]][1];
        }
      });
    });
  }

  function initCanvas(cfg) {
    const cv = document.getElementById(cfg.cvId);
    if (!cv) return;
    let drag = null;

    cv.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, yaw: cfg.cam.yaw, pitch: cfg.cam.pitch };
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      cfg.cam.yaw = drag.yaw + dx * 0.008;
      if (e.pointerType === 'mouse') cfg.cam.pitch = clamp(drag.pitch + dy * 0.006, 0.05, 1.2);
    });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = null; }));

    const btnL = document.getElementById(cfg.btnL);
    if (btnL) btnL.addEventListener('click', () => { cfg.cam.yaw -= 0.3; });

    const btnR = document.getElementById(cfg.btnR);
    if (btnR) btnR.addEventListener('click', () => { cfg.cam.yaw += 0.3; });

    if (cfg.presetBtns) {
      cfg.presetBtns.forEach(a => {
        const btn = document.getElementById(a[0]);
        if (btn) btn.addEventListener('click', () => {
          if (cfg.presets && cfg.presets[a[1]]) {
            cfg.cam.tcy = cfg.presets[a[1]][0];
            cfg.cam.tspan = cfg.presets[a[1]][1];
          }
        });
      });
    }

    const btnCut = document.getElementById(cfg.btnCut);
    if (btnCut) btnCut.addEventListener('click', () => {
      cfg.cam.cut = !cfg.cam.cut;
      btnCut.setAttribute('aria-pressed', cfg.cam.cut ? 'true' : 'false');
    });

    const btnLab = document.getElementById(cfg.btnLab);
    if (btnLab) btnLab.addEventListener('click', () => {
      cfg.cam.labels = !cfg.cam.labels;
      btnLab.setAttribute('aria-pressed', cfg.cam.labels ? 'true' : 'false');
    });

    if (cfg.btnSchem && cfg.svgId) {
      const btnSchem = document.getElementById(cfg.btnSchem);
      const svgEl = document.getElementById(cfg.svgId);
      if (btnSchem && svgEl) {
        btnSchem.addEventListener('click', () => {
          cfg.cam.isSchem = !cfg.cam.isSchem;
          btnSchem.setAttribute('aria-pressed', cfg.cam.isSchem ? 'true' : 'false');
          btnSchem.textContent = cfg.cam.isSchem ? '3D Cutaway' : 'Schematic';
          if (cfg.cam.isSchem) {
            cv.style.display = 'none';
            svgEl.style.display = 'block';
          } else {
            cv.style.display = 'block';
            svgEl.style.display = 'none';
          }
        });
      }
    }

    if (cfg.btnAct) {
      const btnAct = document.getElementById(cfg.btnAct);
      if (btnAct) {
        btnAct.addEventListener('click', () => {
          if (!S) return;
          if (cfg.btnAct === 'rAct') {
            S.scram = !S.scram;
            if (S.scram) {
              S.rod = 0;
              S.n = 0.001;
              S.pth = Math.max((S.h || 0.06) * C.MWT, 52);
            } else {
              S.rod = 0.38;
              S.n = 1.0;
              S.pth = C.MWT;
            }
          } else if (cfg.btnAct === 'tAct') {
            const on = S.turbOn && S.turbTrip <= 0;
            if (on) {
              S.turbOn = false;
              S.turbTrip = 1;
              S.rpm = 0;
              S.mwe = 0;
            } else {
              S.turbOn = true;
              S.turbTrip = 0;
              S.rpm = 1500;
              S.mwe = 300;
            }
          } else if (cfg.btnAct === 'cAct') {
            if (!S.ctl) S.ctl = {};
            const running = S.sea && ((S.ctl.cw || 0) > 0);
            if (running) {
              S.sea = false;
              S.ctl.cw = 0;
              S.vac = 42.0;
            } else {
              S.sea = true;
              S.ctl.cw = 3;
              S.vac = 5.2;
            }
          } else if (cfg.btnAct === 'iAct') {
            S.icOpen = !S.icOpen;
            if (S.icOpen) {
              if (!S.qic || S.qic < 5) S.qic = 38.0;
            } else {
              S.qic = 0;
            }
          }
          updateTelemetryBanner();
        });
      }
    }
  }

  function drawView(key) {
    const cfg = viewConfigs[key];
    if (!cfg) return;

    if (cfg.cam.isSchem) {
      if (cfg.draw2D) cfg.draw2D();
    } else {
      const cv = document.getElementById(cfg.cvId);
      if (!cv) return;
      const parent = cv.parentElement || cv.parentNode || cv;
      const W = Math.max(320, Math.round((parent && parent.clientWidth) || cv.clientWidth || 800));
      const H = Math.max(260, Math.round((parent && parent.clientHeight) || cv.clientHeight || 500));
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
      }

      cfg.cam.cy += (cfg.cam.tcy - cfg.cam.cy) * 0.18;
      cfg.cam.span += (cfg.cam.tspan - cfg.cam.span) * 0.18;

      const ctx = cv.getContext ? cv.getContext('2d') : null;
      if (ctx) {
        cfg.draw3D(ctx, W, H, dpr, performance.now() / 1000, cfg.cam);
      }
    }

    // Update live values on cards
    if (cfg.cardsData) {
      cfg.cardsData.forEach(c => {
        const el = document.getElementById(`${cfg.cardsId}_v_${c[0]}`);
        if (el) el.textContent = c[3](S, (key === 'rpv' ? (S.tripT || 0) : (key === 'ic' ? icE : 0)));
      });
    }
  }

  // Live Telemetry Banner (Aligned with Notes for Software Design Specs)
  function updateTelemetryBanner() {
    if (!S) return;
    const mPow = document.getElementById('mPow');
    const mPres = document.getElementById('mPres');
    const mTemp = document.getElementById('mTemp');
    const mLvl = document.getElementById('mLvl');
    const mCrit = document.getElementById('mCrit');
    const mDynLab = document.getElementById('mDynamicLabel');
    const mDynVal = document.getElementById('mDynamicVal');

    if (mPow) mPow.textContent = `${S.pth.toFixed(0)} MWt (${(S.n * 100).toFixed(1)}%)`;
    if (mPres) mPres.textContent = `${S.p.toFixed(2)} MPa`;
    if (mTemp) mTemp.textContent = `${S.Tc.toFixed(0)} °C (${(S.Tc + 273.15).toFixed(0)} K)`;
    if (mLvl) mLvl.textContent = `${(14.2 * (S.level / 100)).toFixed(1)} m (${S.level.toFixed(0)}%)`;

    // Reactivity calculation: in mK (milli-k)
    const rho_mK = Math.abs(S.dln || 0) < 0.0005 ? '0.0' : ((S.dln || 0) * 12).toFixed(1);
    let critStatus = 'Steady';
    if (S.scram || S.phase === 'idle' || S.n < 0.001) critStatus = 'Subcritical';
    else if ((S.dln || 0) > 0.005) critStatus = `Supercrit (+${rho_mK} mK)`;
    else if ((S.dln || 0) < -0.005) critStatus = `Subcrit (${rho_mK} mK)`;
    if (mCrit) mCrit.textContent = `${rho_mK} mK (${critStatus})`;

    if (mDynLab && mDynVal) {
      if (currentPart === 'turb') {
        mDynLab.textContent = 'TURBINE SPEED & MWE';
        mDynVal.textContent = `${S.rpm.toFixed(0)} RPM · ${S.mwe.toFixed(0)} MWe`;
      } else if (currentPart === 'cond') {
        const heat = Math.round(0.652 * S.qt + S.qb);
        mDynLab.textContent = 'HEAT REJECTION & CW';
        mDynVal.textContent = `${heat} MW to Lake · Vac ${S.vac.toFixed(1)} kPa`;
      } else if (currentPart === 'ic') {
        mDynLab.textContent = 'PASSIVE IC REMOVAL';
        mDynVal.textContent = `${S.qic.toFixed(0)} MW (Valves ${S.icOpen ? 'OPEN' : 'READY'})`;
      } else {
        mDynLab.textContent = 'RODS & BORON';
        mDynVal.textContent = `Rods ${(S.rod * 100).toFixed(0)}% · Boron ${(S.boron * 100).toFixed(0)}%`;
      }
    }

    const rActBtn = document.getElementById('rAct');
    if (rActBtn) {
      const isScram = !!S.scram;
      rActBtn.setAttribute('aria-pressed', isScram ? 'true' : 'false');
      rActBtn.textContent = isScram ? 'SCRAMMED (Reset)' : 'Trip Core (SCRAM)';
    }

    const tActBtn = document.getElementById('tAct');
    if (tActBtn) {
      const isOnline = S.turbOn && S.turbTrip <= 0;
      tActBtn.setAttribute('aria-pressed', isOnline ? 'true' : 'false');
      tActBtn.textContent = isOnline ? 'Turbine Online' : 'Turbine Tripped';
    }

    const cActBtn = document.getElementById('cAct');
    if (cActBtn) {
      const isCw = S.sea && ((S.ctl && S.ctl.cw > 0) || false);
      cActBtn.setAttribute('aria-pressed', isCw ? 'true' : 'false');
      cActBtn.textContent = isCw ? 'CW Pumps: Running' : 'CW Pumps: Stopped';
    }

    const iActBtn = document.getElementById('iAct');
    if (iActBtn) {
      const isOpen = !!(S.icOpen || (S.qic && S.qic > 0));
      iActBtn.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
      iActBtn.textContent = isOpen ? 'IC Active (Flow On)' : 'IC Standby (Flow Off)';
    }
  }

  // Animation & update loop
  function loop() {
    checkState();
    if (S) {
      updateTelemetryBanner();
      drawView(currentPart);
    }
    requestAnimationFrame(loop);
  }

  // Startup
  Object.keys(viewConfigs).forEach(k => {
    initCards(viewConfigs[k]);
    initCanvas(viewConfigs[k]);
  });
  switchPart(currentPart);
  requestAnimationFrame(loop);
})();
