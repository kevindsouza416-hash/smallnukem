/* BWRX-300 Training Simulator Model v2: Physics, Kinetics, Thermodynamics, and Fault Logic
   Teaching model for BWRX-300 SMR (870 MWt / 300 MWe), natural circulation, isolation condenser, passive safety */
(function (root) {
  'use strict';

  const C = {
    MWT: 870, MWE: 300, ETA: 0.348, CTH: 45, LOSS: 0.06,
    PSET: 7.2, P_BYP: 7.45, P_SCRAM: 8.3, P_IC: 8.0, P_SYNC: 6.3, P_OK: 6.8,
    TURB_MAX: 900, QB_MAX: 200, IC_MAX: 70, KP: 0.12, KT: 0.10, WORTH: 0.6, RC: 0.30, ROD_RATE: 0.05,
    NSRC: 0.002, HEAT_LIM: 150, TOL: 12,
    LVL_ALARM: 85, LVL_SCRAM: 62, N_SCRAM: 1.12, LVL_FUEL: 35,
    P_SRV: 8.6, P_SRV_RESEAT: 8.0, CPOOL: 3000, PC_ALARM: 300, PC_VENT: 400, PC_FAIL: 600, POOL_ALARM: 65
  };

  const TAB = [
    [20, 0.0023], [50, 0.0124], [100, 0.1013], [150, 0.4758],
    [200, 1.554], [250, 3.973], [270, 5.499], [280, 6.417],
    [290, 7.441], [300, 8.588], [310, 9.865], [330, 12.86]
  ];

  function psat(T) {
    if (T <= TAB[0][0]) return TAB[0][1];
    for (let i = 1; i < TAB.length; i++) {
      if (T <= TAB[i][0]) {
        const a = TAB[i - 1], b = TAB[i];
        return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]);
      }
    }
    return TAB[TAB.length - 1][1];
  }

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const SEG = [
    { to: 300, len: 45 },
    { to: 200, len: 40 },
    { to: 300, len: 35 },
    { to: 150, len: 40 },
    { to: 300, len: 50 }
  ];
  const STARTS = [];
  let TOTAL = 0;
  SEG.forEach(s => { STARTS.push(TOTAL); TOTAL += s.len; });

  function log(S, msg, kind) {
    S.logN++;
    S.log.push({ t: S.t, msg, kind: kind || 'info', i: S.logN });
    if (S.log.length > 80) S.log.shift();
  }

  function defaults() {
    return {
      flow: 1, fwMode: 'auto', fwMan: 100, lvlSet: 100, rfpStby: false,
      bypass: 'auto', byMan: 0, cw: 3, msiv: true,
      rcic: 'auto', hpcf: 'auto', rhr: 'off', alt: false, ads: false,
      ic: 'auto', vent: false,
      edg: 'auto', gtg: false, slc: false, rwcu: 40, lakeT: 12,
      rodMode: 'auto', rodCmd: 30
    };
  }

  function create(seed, opts) {
    opts = opts || {};
    return {
      t: 0, phase: 'idle', plant: 'nat', free: !!opts.free, ctl: defaults(),
      g: 0, hold: 0, logN: 0, log: [], rng: mulberry(seed || ((Math.random() * 4294967296) >>> 0)),
      lever: 0, n: C.NSRC, nLag: C.NSRC, h: 0, rod: C.RC, Tc: 30, p: 0.10, level: 100,
      fwOK: true, offsite: true, sea: true, atws: false, ari: false,
      turbOn: false, turbTrip: 0, qt: 0, qb: 0, qic: 0, qsrv: 0, qrcic: 0, qsdc: 0, qrhr: 0, qvent: 0,
      mwe: 0, pth: 0, icOpen: false,
      rpm: 0, vac: 101, dTl: 0, tcond: 30, srv: false, adsOn: false, rcicOn: false, hpcfOn: false,
      fl: 1, fwNow: 0, injNow: 0, vacT: 0,
      edgT: 0, edgRun: false, gtgT: 0, gtgRun: false, ac: true, batt: 100, boron: 0, tank: 100, tankWarn: false,
      pT: 30, pc: 101, release: 0, ventedOnce: false,
      scram: false, why: '', tripT: 0, rate: 0, tcPrev: 30, lnPrev: Math.log(C.NSRC), dln: 0,
      disp: 300, grace: 0, segI: -1, ev: { fw: 0, tu: 0 }, fwAt: 0, fwEnd: 0, tuWarn: 0,
      accNum: 0, accDen: 0, heatT: 0, heatBad: 0, evPass: 0, score: 0
    };
  }

  function start(S) {
    S.phase = 'heatup';
    S.fwAt = 18 + S.rng() * 6;
    S.tuWarn = 130 + S.rng() * 4;
    log(S, 'BWRX-300 started. Reactor critical at 0.2% power, cold and depressurised.', 'ok');
    log(S, 'Raise the lever slowly. Keep heat-up under ' + C.HEAT_LIM + ' °C/min.', 'info');
  }

  function trip(S, why) {
    if (S.scram) return;
    const nat = S.plant === 'nat';
    if (S.ctl.rodMode === 'man') S.ctl.rodCmd = 0;
    S.scram = true; S.why = why; S.icOpen = nat && S.ctl.ic !== 'off'; S.turbOn = false; S.turbTrip = 0; S.tripT = 0;
    S.phase = 'tripped';
    log(S, 'REACTOR TRIP: ' + why + '.', 'alarm');
    if (S.atws && !S.ari) {
      log(S, 'ATWS: control rods are NOT inserting. Press ARI, inject boron (SLC) and lower the water level.', 'alarm');
    } else {
      log(S, 'Control rods fully inserted.', 'ok');
    }
    log(S, nat ? 'Isolation condenser opened by gravity. No pumps or power needed.'
               : 'Recirculation pumps run back. Bypass valves, RCIC and the suppression pool now hold the plant.', 'ok');
  }

  function fail(S, why) {
    if (S.phase === 'failed') return;
    S.phase = 'failed'; S.why = why;
    log(S, 'PLANT FAILURE: ' + why + '.', 'alarm');
  }

  function powerSources(S, dt) {
    const c = S.ctl;
    const wantEdg = c.edg === 'on' || (c.edg === 'auto' && !S.offsite);
    if (wantEdg) {
      S.edgT += dt;
      if (!S.edgRun && S.edgT >= 8) { S.edgRun = true; log(S, 'Emergency diesel generators running.', 'ok'); }
    } else {
      if (S.edgRun) log(S, 'Emergency diesel generators stopped.', 'info');
      S.edgT = 0; S.edgRun = false;
    }
    if (c.gtg) {
      S.gtgT += dt;
      if (!S.gtgRun && S.gtgT >= 15) { S.gtgRun = true; log(S, 'Gas turbine / mobile generator supplying power.', 'ok'); }
    } else {
      if (S.gtgRun) log(S, 'Gas turbine / mobile generator stopped.', 'info');
      S.gtgT = 0; S.gtgRun = false;
    }
    const had = S.ac;
    S.ac = S.offsite || S.edgRun || S.gtgRun;
    if (had && !S.ac) log(S, 'STATION BLACKOUT: no AC power. Batteries are supplying DC only.', 'alarm');
    if (!had && S.ac) log(S, 'AC power restored.', 'ok');
    S.batt = clamp(S.batt + (S.ac ? 0.3 : -0.4) * dt, 0, 100);
  }

  function phys(S, dt) {
    const c = S.ctl, nat = S.plant === 'nat', scr = S.scram;
    powerSources(S, dt);
    const dc = S.batt > 0;

    // Core flow: natural circulation or pump driven
    let ftgt = nat ? 1 : (S.offsite ? c.flow : 0.22);
    if (!nat && scr) ftgt = Math.min(ftgt, 0.35);
    S.fl += (ftgt - S.fl) * Math.min(1, dt / 6);
    const cap = nat ? 1 : 0.30 + 0.70 * S.fl;

    // Standby liquid control (SLC boron) and water cleanup (RWCU)
    if (c.slc && S.tank > 0 && S.ac) {
      S.boron = Math.min(1, S.boron + 0.012 * dt);
      S.tank = Math.max(0, S.tank - dt);
    }
    if (c.slc && S.tank <= 0 && !S.tankWarn) {
      S.tankWarn = true;
      log(S, 'SLC tank empty.', 'warn');
    }
    if (S.ac && c.rwcu > 0) S.boron = Math.max(0, S.boron - 0.003 * dt * c.rwcu / 100);

    // Reactor kinetics & delayed neutrons
    const nDem = Math.max(C.NSRC, Math.min(S.lever / 100, cap));
    let rc = 0.35 * Math.log(nDem / Math.max(S.n, 1e-7));
    rc = clamp(rc, Math.max(-0.12, -0.06 / Math.max(S.n, 0.01)), Math.min(0.14, 0.022 / Math.max(S.n, 0.01)));
    const Tn = clamp((S.Tc - 30) / 258, 0, 1.15);
    const fb = C.KP * S.nLag + C.KT * Tn + 0.9 * S.boron + 0.003 * Math.max(0, 95 - S.level);
    const rodsIn = scr && (!S.atws || S.ari), frozen = scr && S.atws && !S.ari;
    const man = c.rodMode === 'man', rRate = man ? 0.02 : C.ROD_RATE;
    const tgt = rodsIn ? 0 : man ? clamp(c.rodCmd / 100, 0, 1) : clamp(C.RC + (rc + fb) / C.WORTH, 0, 1);
    const ins = rodsIn ? 0.6 : rRate;
    if (!frozen) S.rod += clamp(tgt - S.rod, -ins * dt, rRate * dt);
    const rho = C.WORTH * (S.rod - C.RC) - fb;
    S.n = clamp(S.n * Math.exp((rodsIn ? -0.5 : rho) * dt), 1e-7, 1.5);
    S.nLag += (S.n - S.nLag) * dt / 8;
    S.h = Math.max(S.h * Math.exp(-dt / 2000), 0.06 * S.n);
    S.pth = (S.n * 0.94 + S.h) * C.MWT;
    const ln = Math.log(S.n);
    S.dln += ((ln - S.lnPrev) / dt - S.dln) * Math.min(1, dt / 2);
    S.lnPrev = ln;

    // Condenser, turbine, bypass, MSIV
    const condCap = (S.offsite && S.sea) ? c.cw / 3 : 0, condOK = condCap >= 0.3 && S.vac < 30;
    if (c.msiv && !condOK && S.p > 1.5) {
      S.vacT += dt;
      if (S.vacT > 3) {
        c.msiv = false;
        log(S, 'MSIVs closed: condenser lost. Steam is isolated in the vessel.', 'alarm');
      }
    } else S.vacT = 0;

    const block = !S.offsite || !condOK || !c.msiv;
    if (S.turbOn && block) {
      S.turbOn = false;
      log(S, 'Turbine tripped: ' + (!S.offsite ? 'grid lost' : !c.msiv ? 'steam isolated' : 'condenser vacuum lost') + '.', 'alarm');
    }
    if (!S.turbOn && !scr && !block && S.p >= C.P_SYNC) {
      S.turbOn = true;
      log(S, 'Turbine rolled, generator synchronised to the grid.', 'ok');
    }
    if (S.turbTrip > 0) S.turbTrip -= dt;
    const sf = clamp((S.p - 0.5) / 1.5, 0, 1);
    if (!S.turbOn || S.turbTrip > 0 || scr) S.qt = 0;
    else S.qt += (clamp(S.pth + 450 * (S.p - C.PSET), 0, C.TURB_MAX) - S.qt) * Math.min(1, dt / 0.6);

    const qbMax = C.QB_MAX * condCap * (c.msiv ? 1 : 0);
    const qbCmd = c.bypass === 'man' ? c.byMan / 100 * qbMax * sf : clamp(1200 * (S.p - C.P_BYP), 0, qbMax);
    S.qb += (qbCmd - S.qb) * Math.min(1, dt / 0.25);
    S.mwe += (C.ETA * clamp(1 - 0.0045 * (S.vac - 4), 0.75, 1.02) * S.qt - S.mwe) * Math.min(1, dt / 1.5);
    const spin = S.turbOn && S.turbTrip <= 0 && !scr;
    S.rpm += ((spin ? 1500 : 0) - S.rpm) * Math.min(1, dt / (spin ? 3 : 40));
    const cwFlow = condCap * 21;
    S.dTl = cwFlow > 0 ? (0.652 * S.qt + S.qb) / (cwFlow * 4.18) : 0;
    S.tcond = c.lakeT + S.dTl + 6;
    const vacT = cwFlow > 0 ? Math.max(2.5, psat(Math.min(S.tcond, 99)) * 1000) : 75;
    S.vac += (vacT - S.vac) * Math.min(1, dt / 6);

    // Isolation Condenser (passive roof-pool cooling)
    if (nat && c.ic === 'auto' && !S.icOpen && S.p > C.P_IC) {
      S.icOpen = true;
      log(S, 'High pressure: isolation condenser opened.', 'warn');
    }
    if (!nat || c.ic === 'off') S.icOpen = false;
    S.qic = S.icOpen ? C.IC_MAX * clamp((S.Tc - 120) / 60, 0, 1) : 0;

    // Safety relief valves and ADS
    if (S.p > C.P_SRV) S.srv = true;
    else if (S.p < C.P_SRV_RESEAT) S.srv = false;
    if (c.ads && dc && !S.adsOn) {
      S.adsOn = true;
      log(S, 'ADS: relief valves opened. Vessel is depressurising into the suppression pool.', 'warn');
    }
    if (S.adsOn && S.p < 0.4) {
      S.adsOn = false; c.ads = false;
      log(S, 'Vessel depressurised. Relief valves closed.', 'info');
    }
    S.qsrv = (S.srv || S.adsOn) ? Math.min(1200, 125 * S.p) * sf : 0;

    // RCIC, HPCF, RHR, alternate injection
    if (c.rcic === 'auto') {
      if (S.level < 80) S.rcicOn = true; else if (S.level > 98) S.rcicOn = false;
    } else S.rcicOn = c.rcic === 'on';
    const rcicRun = S.rcicOn && dc && S.p > 0.8;
    S.qrcic = rcicRun ? 6 * sf : 0;

    if (c.hpcf === 'auto') {
      if (S.level < 72) S.hpcfOn = true; else if (S.level > 95) S.hpcfOn = false;
    } else S.hpcfOn = c.hpcf === 'on';
    const hpcfRun = S.hpcfOn && S.ac && S.p < 9;
    const lpciRun = c.rhr === 'lpci' && S.ac && S.p < 1.5;
    const altRun = c.alt && S.p < 0.9;
    const inj = (rcicRun ? 0.07 : 0) + (hpcfRun ? 0.35 : 0) + (lpciRun ? 0.5 : 0) + (altRun ? 0.06 : 0);
    const sink = S.sea && S.ac;
    S.qrhr = (c.rhr === 'pool' && sink) ? 90 * clamp((S.pT - 30) / 30, 0, 1) : 0;
    S.qsdc = (c.rhr === 'sdc' && sink && S.p < 1.2) ? 70 * clamp((S.Tc - 30) / 60, 0, 1) : 0;

    // Vessel heat balance and pressure
    S.Tc = Math.max(20, S.Tc + (S.pth - S.qt - S.qb - S.qic - S.qsrv - S.qrcic - S.qsdc - C.LOSS * Math.max(S.Tc - 30, 0)) / C.CTH * dt);
    S.p = Math.max(0.10, psat(S.Tc));
    S.rate += ((S.Tc - S.tcPrev) / dt * 60 - S.rate) * Math.min(1, dt / 3);
    S.tcPrev = S.Tc;

    // Suppression pool, containment, filtered vent
    S.qvent = c.vent ? 150 * clamp((S.pc - 101) / 200, 0, 1) : 0;
    if (c.vent && !S.ventedOnce) {
      S.ventedOnce = true; S.score -= 100;
      log(S, 'Filtered containment vent opened. Steam passes scrubber and metal filter (99.9% particulates retained).', 'warn');
    }
    if (c.vent && S.pc > 150) S.release += 0.01 * dt;
    S.pT = clamp(S.pT + (S.qsrv + S.qrcic - S.qrhr - S.qvent - 0.5 * (S.pT - 30)) / C.CPOOL * dt, 25, 160);
    S.pc = 101 + 6 * Math.max(0, S.pT - 45);

    // Water level
    const boil = S.Tc > 200 ? Math.max(0, S.pth - S.qic - S.qsdc) / C.MWT : 0;
    const avail = Math.max((S.fwOK && S.offsite && condOK && c.msiv) ? 1 : 0, (c.rfpStby && S.ac) ? 0.8 : 0);
    const fwCmd = c.fwMode === 'man' ? c.fwMan / 100 * 1.3 : clamp(boil + 0.08 * (c.lvlSet - S.level), 0, 1.3);
    const fw = Math.min(fwCmd, 1.3 * avail);
    S.fwNow = fw; S.injNow = inj;
    S.level = clamp(S.level + 2.5 * (fw + inj - boil) * dt, 0, 110);

    // Safety trips
    if (!scr) {
      if (S.p > C.P_SCRAM) trip(S, 'High steam pressure');
      else if (S.n > C.N_SCRAM) trip(S, 'High reactor power');
      else if (S.level < C.LVL_SCRAM) trip(S, 'Low reactor water level');
    } else {
      S.tripT += dt;
    }

    if (S.pc > C.PC_FAIL) fail(S, 'Containment overpressure');
    else if (S.level < C.LVL_FUEL) fail(S, 'Core uncovered: fuel damage');
  }

  function game(S, dt) {
    if (S.phase === 'heatup') {
      if (S.Tc > 35 && S.Tc < 275) {
        S.heatT += dt;
        if (S.rate > C.HEAT_LIM) { S.heatBad += dt; S.score -= 3 * dt; }
        else S.score += dt;
      }
      if (S.p >= C.P_OK) {
        if (S.free) {
          S.phase = 'free';
          log(S, 'Operating pressure reached. Free play: operate any system.', 'ok');
        } else {
          S.phase = 'power'; S.disp = 300;
          log(S, 'Operating pressure reached. Raise power to 300 MWe.', 'ok');
        }
      }
    } else if (S.phase === 'power') {
      if (S.mwe >= 285) {
        S.hold += dt;
        if (S.hold >= 3) {
          S.phase = 'grid'; S.g = 0;
          log(S, 'Full power. Follow the grid dispatch for the rest of the shift.', 'ok');
        }
      } else S.hold = 0;
    } else if (S.phase === 'grid') {
      S.g += dt;
      let i = 0;
      while (i + 1 < SEG.length && S.g >= STARTS[i + 1]) i++;
      if (i !== S.segI) {
        const prev = S.disp; S.segI = i; S.disp = SEG[i].to;
        S.grace = Math.max(S.grace, Math.min(30, 4 + Math.abs(S.disp - prev) / 5));
        if (i > 0) log(S, 'Grid now asks for ' + S.disp + ' MWe.', 'info');
      }
      if (S.ev.fw === 0 && S.g >= S.fwAt) {
        S.ev.fw = 1; S.fwOK = false; S.fwEnd = S.g + 18;
        log(S, 'FEEDWATER PUMP TRIP. Water level is falling: cut power now, or start the standby feedwater pump.', 'alarm');
      }
      if (S.ev.fw === 1 && S.g >= S.fwEnd) {
        S.ev.fw = 2; S.fwOK = true; S.grace = Math.max(S.grace, 15); S.score += 250; S.evPass++;
        log(S, 'Feedwater pump restored. Level recovering.', 'ok');
      }
      if (S.ev.tu === 0 && S.g >= S.tuWarn) {
        S.ev.tu = 1; S.disp = 60;
        log(S, 'GRID EMERGENCY. Turbine trip in 12 s: get below 25% power (about 75 MWe).', 'alarm');
      }
      if (S.ev.tu === 1 && S.g >= S.tuWarn + 12) {
        S.ev.tu = 2; S.turbTrip = 12; S.qt = 0;
        log(S, 'TURBINE TRIP. Steam is dumped to the condenser through the bypass.', 'alarm');
      }
      if (S.ev.tu === 2 && S.turbTrip <= 0) {
        S.ev.tu = 3; S.score += 250; S.evPass++;
        log(S, 'Turbine back on the grid.', 'ok');
      }
      const hold = S.ev.fw === 1 || S.ev.tu === 1 || S.ev.tu === 2;
      if (S.grace > 0) S.grace -= dt;
      else if (!hold) {
        S.accDen += dt;
        if (Math.abs(S.mwe - S.disp) <= C.TOL) { S.accNum += dt; S.score += 2 * dt; }
      }
      if (S.g >= TOTAL) {
        S.phase = 'complete'; S.score += 300;
        log(S, 'Shift complete. Well done, operator.', 'ok');
      }
    }
  }

  function step(S, dt) {
    if (S.phase === 'idle' || S.phase === 'complete' || S.phase === 'failed') return;
    S.t += dt; phys(S, dt);
    if (!S.scram && S.phase !== 'failed') game(S, dt);
  }

  function summary(S) {
    const acc = S.accDen > 0 ? S.accNum / S.accDen : 0,
          heat = S.heatT > 0 ? 1 - S.heatBad / S.heatT : 1,
          done = S.phase === 'complete';
    return { acc, heat, stars: done ? 1 + (acc >= 0.7 ? 1 : 0) + (heat >= 0.9 ? 1 : 0) : 0 };
  }

  const live = S => S.phase !== 'idle' && S.phase !== 'complete' && S.phase !== 'failed';

  function scramNow(S) {
    if (live(S)) trip(S, 'Manual scram by operator');
  }

  function pressARI(S) {
    if (!live(S) || S.ari) return;
    S.ari = true;
    log(S, 'ARI: scram air header vented by a diverse path. Rods driven in.', 'ok');
  }

  function inject(S, k) {
    if (!live(S)) return;
    if (k === 'fw') {
      S.fwOK = !S.fwOK;
      log(S, S.fwOK ? 'Feedwater pump restored.' : 'FEEDWATER PUMP TRIP.', S.fwOK ? 'ok' : 'alarm');
    } else if (k === 'turb') {
      if (S.turbOn) {
        S.turbTrip = 12; S.qt = 0;
        log(S, 'TURBINE TRIP. Steam goes through the bypass.', 'alarm');
      }
    } else if (k === 'loop') {
      S.offsite = !S.offsite;
      if (!S.offsite) {
        log(S, 'LOSS OF OFFSITE POWER. Grid connection lost.', 'alarm');
        trip(S, 'Loss of offsite power');
      } else {
        log(S, 'Offsite power restored.', 'ok');
      }
    } else if (k === 'sea') {
      S.sea = !S.sea;
      log(S, S.sea ? 'Lake water supply restored.' : 'LOSS OF LAKE WATER: circulating water and RHR heat exchangers have no heat sink.', S.sea ? 'ok' : 'alarm');
    } else if (k === 'atws') {
      S.atws = !S.atws;
      log(S, S.atws ? 'Fault armed: rods will NOT insert on the next scram.' : 'Rod insertion fault cleared.', S.atws ? 'warn' : 'ok');
    }
  }

  root.BWR = {
    C, create, start, step, summary, psat, SEG, STARTS, TOTAL, clamp, scramNow, pressARI, inject, log
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.BWR;
  }
})(typeof window !== 'undefined' ? window : globalThis);
