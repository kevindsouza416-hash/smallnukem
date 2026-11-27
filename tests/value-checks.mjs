// Small Nukem — Milestone 2 FIDELITY value checks (Decision 9).
// Extracts Samira's BWR model verbatim from small-nukem.html and asserts
// HER constants, start state, trips, alarms and behaviours — the model
// is the source of truth; these checks fail if the game drifts from it.
// Run: node tests/value-checks.mjs   (exit 0 = all pass)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../game/small-nukem.html', import.meta.url), 'utf8');
const i = html.indexOf('const BWR = (() => {');
const j = html.indexOf('})();', i);
if (i < 0 || j < 0) { console.error('FAIL: BWR model block not found in small-nukem.html'); process.exit(1); }
const BWR = new Function(html.slice(i, j + 5) + '\nreturn BWR;')();
const C = BWR.C;

let pass = 0, fail = 0;
function chk(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
function run(S, seconds, dt = 0.1) { for (let t = 0; t < seconds; t += dt) BWR.step(S, dt); }
// An attentive operator: in grid phase, work the lever to the dispatch
// target (and cut power on her grid-emergency warning, as her log
// instructs). Her events punish an operator who ignores them — that is
// her design, so the checks must operate the plant, not just run it.
function operate(S, seconds, stopAtGrid = false) {
  for (let t = 0; t < seconds; t += 1) {
    if (stopAtGrid && S.phase === 'grid') break;
    if (S.phase === 'grid') S.lever = Math.max(0, Math.min(100, S.disp / 3));
    else if (S.phase === 'power') S.lever = Math.min(100, S.lever + 5);
    run(S, 1);
    if (S.scram || S.phase === 'failed' || S.phase === 'complete') break;
  }
}

function fresh(lever = 0) { const S = BWR.create(1234); BWR.start(S); S.lever = lever; return S; }

// ---- 1. Her constants, exact ----
const CONSTS = {
  MWT: 870, MWE: 300, ETA: 0.348, CTH: 45, LOSS: 0.06,
  PSET: 7.2, P_BYP: 7.45, P_SCRAM: 8.3, P_IC: 8.0, P_SYNC: 6.3, P_OK: 6.8,
  TURB_MAX: 900, QB_MAX: 200, IC_MAX: 70, KP: 0.12, KT: 0.10, WORTH: 0.6,
  RC: 0.30, ROD_RATE: 0.05, NSRC: 0.002, HEAT_LIM: 150, TOL: 12,
  LVL_ALARM: 85, LVL_SCRAM: 62, N_SCRAM: 1.12, LVL_FUEL: 35,
  P_SRV: 8.6, P_SRV_RESEAT: 8.0, CPOOL: 3000, PC_ALARM: 300, PC_VENT: 400,
  PC_FAIL: 600, POOL_ALARM: 65,
};
for (const [k, v] of Object.entries(CONSTS)) chk('const ' + k + ' = ' + v, C[k] === v, 'got ' + C[k]);

// ---- 2. Her saturation table ----
chk('psat(30C) ~ 0.0057 MPa', near(BWR.psat(30), 0.00567, 0.0005), BWR.psat(30).toFixed(5));
chk('psat(288C) ~ PSET 7.2 MPa', near(BWR.psat(288), 7.2, 0.15), BWR.psat(288).toFixed(2));
chk('psat(297C) ~ P_SCRAM 8.3 MPa', near(BWR.psat(297), 8.3, 0.15), BWR.psat(297).toFixed(2));

// ---- 3. Her start state ----
{
  const S = BWR.create(1234);
  chk('create: Tc = 30 C', S.Tc === 30, '' + S.Tc);
  chk('create: p = 0.10 MPa', S.p === 0.10, '' + S.p);
  chk('create: n = NSRC 0.002 (0.2%)', S.n === 0.002, '' + S.n);
  chk('create: level = 100', S.level === 100, '' + S.level);
  chk('create: rod = RC 0.30', S.rod === 0.30, '' + S.rod);
  BWR.start(S);
  chk('start: phase heatup', S.phase === 'heatup', S.phase);
  chk('start: log says critical at 0.2% power', S.log.some(l => l.msg.includes('critical at 0.2% power')), '');
  chk('start: log states heat-up limit 150 C/min', S.log.some(l => l.msg.includes('150')), '');
}

// ---- 4. Heat-up -> operating pressure -> turbine sync (her sequence) ----
{
  const S = fresh(45);
  run(S, 240);
  chk('heatup: operating pressure reached (phase power or grid)', S.phase === 'power' || S.phase === 'grid', S.phase);
  chk('heatup: turbine synchronised (turbOn)', S.turbOn === true, 'p=' + S.p.toFixed(2));
  chk('heatup: rpm at synchronous 1500', near(S.rpm, 1500, 60), S.rpm.toFixed(0));
  chk('heatup: pressure near setpoint band', S.p > 6.3 && S.p < 8.3, S.p.toFixed(2));
}

// ---- 5. Full power hold -> grid phase (her game()) ----
{
  const S = fresh(45);
  operate(S, 500);
  chk('power: reached grid dispatch phase', S.phase === 'grid' || S.phase === 'complete', S.phase + ' mwe=' + S.mwe.toFixed(0));
  chk('power: no trip with an attentive operator', !S.scram, S.why);
  chk('power: MWe followed dispatch near 300', S.mwe > 200 || S.phase === 'complete', S.mwe.toFixed(0));
}

// ---- 6. Her three trips, exact thresholds and reason strings ----
{
  const S = fresh(0);
  S.n = 1.13; BWR.step(S, 0.1);
  chk('trip: power > 1.12 -> High reactor power', S.scram && S.why === 'High reactor power', S.why);
}
{
  const S = fresh(0);
  S.level = 61; BWR.step(S, 0.1);
  chk('trip: level < 62 -> Low reactor water level', S.scram && S.why === 'Low reactor water level', S.why);
}
{
  const S = fresh(100);
  S.sea = false; // condenser lost: steam isolates, pressure climbs psat
  let t = 0;
  while (!S.scram && S.phase !== 'failed' && t < 1200) { BWR.step(S, 0.1); t += 0.1; }
  chk('trip: pressure > 8.3 -> High steam pressure', S.scram && S.why === 'High steam pressure', S.why + ' p=' + S.p.toFixed(2));
  chk('trip: IC opened on the way (p > P_IC 8.0)', S.icOpen === true, 'icOpen=' + S.icOpen);
}

// ---- 7. Her failure endpoints ----
{
  const S = fresh(0);
  S.level = 34; BWR.step(S, 0.1);
  chk('fail: level < 35 -> Core uncovered: fuel damage', S.phase === 'failed' && S.why === 'Core uncovered: fuel damage', S.why);
}
{
  const S = fresh(0);
  S.pT = 160; BWR.step(S, 0.1); // pc = 101 + 6*(160-45) = 791 > PC_FAIL 600
  chk('fail: containment pc > 600 -> Containment overpressure', S.phase === 'failed' && S.why === 'Containment overpressure', S.why + ' pc=' + S.pc.toFixed(0));
}

// ---- 8. Isolation condenser behaviour ----
{
  const S = fresh(0);
  S.Tc = 296; BWR.step(S, 0.1); BWR.step(S, 0.1); // p = psat(296) ~ 8.14 > P_IC
  chk('IC: opens above 8.0 MPa', S.icOpen === true, 'p=' + S.p.toFixed(2));
  chk('IC: heat removal qic > 0 when hot', S.qic > 0, 'qic=' + S.qic.toFixed(1));
  S.ctl.ic = 'off'; BWR.step(S, 0.1);
  chk('IC: ctl off closes it', S.icOpen === false, '');
}

// ---- 9. SRV hysteresis (8.6 lift / 8.0 reseat) ----
{
  const S = fresh(0);
  S.Tc = 300; BWR.step(S, 0.1); // p = 8.588 < 8.6: shut
  chk('SRV: shut at 8.588 MPa', S.srv === false, 'p=' + S.p.toFixed(3));
  S.Tc = 301; BWR.step(S, 0.1); BWR.step(S, 0.1); // p ~ 8.71 > 8.6: lifts (trip at 8.3 fires too; srv flag is the check)
  chk('SRV: lifts above 8.6 MPa', S.srv === true, 'p=' + S.p.toFixed(3));
}

// ---- 10. Water level: boil-off, RCIC/HPCF auto bands, standby pump ----
{
  const S = fresh(0);
  S.Tc = 250; S.n = 0.5; S.fwOK = false; S.offsite = false; // no feedwater available
  const lvl0 = S.level;
  run(S, 5);
  chk('level: boils off with no feedwater', S.level < lvl0 - 3, lvl0.toFixed(1) + ' -> ' + S.level.toFixed(1));
  S.ctl.rfpStby = true; S.offsite = true; // standby pump on AC restores feed
  run(S, 10);
  chk('level: standby feedwater pump recovers level', S.level > lvl0 - 3, 'lvl=' + S.level.toFixed(1));
}
{
  const S = fresh(0);
  S.level = 79; BWR.step(S, 0.1);
  chk('RCIC: auto-starts below level 80', S.rcicOn === true, '');
  S.level = 99; BWR.step(S, 0.1);
  chk('RCIC: auto-stops above level 98', S.rcicOn === false, '');
  S.level = 71; BWR.step(S, 0.1);
  chk('HPCF: auto-starts below level 72', S.hpcfOn === true, '');
}

// ---- 11. ATWS + ARI + SLC (her fault logic) ----
{
  const S = fresh(0);
  S.atws = true;
  S.n = 1.13; BWR.step(S, 0.1);
  chk('ATWS: trip fires but rods do NOT insert', S.scram && S.rod > 0.25, 'rod=' + S.rod.toFixed(2));
  BWR.pressARI(S);
  run(S, 10);
  chk('ATWS: ARI drives rods in', S.ari && S.rod < 0.1, 'rod=' + S.rod.toFixed(2));
}
{
  const S = fresh(0);
  S.ctl.slc = true;
  run(S, 10);
  chk('SLC: boron builds while tank drains', S.boron > 0.05 && S.tank < 100, 'boron=' + S.boron.toFixed(3) + ' tank=' + S.tank.toFixed(0));
}

// ---- 12. Power sources: EDG timing, blackout, battery ----
{
  const S = fresh(0);
  S.offsite = false;
  run(S, 7);
  chk('EDG: not yet running at 7 s', S.edgRun === false, '');
  run(S, 2);
  chk('EDG: auto-starts at 8 s on loss of offsite', S.edgRun === true && S.ac === true, '');
}

// ---- 13. Her grid dispatch structure + events ----
chk('dispatch: TOTAL = 210 s', BWR.TOTAL === 210, '' + BWR.TOTAL);
chk('dispatch: SEG targets 300/200/300/150/300', JSON.stringify(BWR.SEG.map(s => s.to)) === '[300,200,300,150,300]', '');
{
  const S = fresh(45);
  operate(S, 500, true); // reach grid phase, shift still ahead
  chk('event setup: in grid phase', S.phase === 'grid', S.phase);
  S.fwAt = S.g + 1; S.ev.fw = 0;
  run(S, 2);
  chk('event: feedwater pump trip fires in grid phase', S.ev.fw === 1 && S.fwOK === false, '');
  run(S, 20);
  chk('event: feedwater restored after 18 s, +250 score', S.ev.fw === 2 && S.fwOK === true && S.evPass >= 1, 'score=' + S.score.toFixed(0));
}
{
  const S = fresh(45);
  operate(S, 500, true);
  S.tuWarn = S.g + 1; S.ev.tu = 0;
  run(S, 2);
  chk('event: grid emergency sets dispatch 60 MWe', S.ev.tu === 1 && S.disp === 60, 'disp=' + S.disp);
  operate(S, 13); // operator cuts power as instructed; trip still lands
  chk('event: turbine trip 12 s after warning', S.ev.tu === 2 && S.turbTrip > 0, 'turbTrip=' + S.turbTrip.toFixed(1));
}

// ---- 14. Manual scram + summary ----
{
  const S = fresh(20);
  run(S, 5);
  BWR.scramNow(S);
  chk('manual scram: trips with operator reason', S.scram && S.why === 'Manual scram by operator', S.why);
  const sum = BWR.summary(S);
  chk('summary: heat fraction in [0,1], stars 0 mid-run', sum.heat >= 0 && sum.heat <= 1 && sum.stars === 0, JSON.stringify(sum));
}

// ---- 15. Game-side wiring: model embedded, no orphan physics ----
chk('game: BWR block present in html', html.includes('const BWR = (() => {'), '');
chk('game: no xenon (not in her model)', !html.includes('xenon_worth'), '');
chk('game: no invented 8.5 MPa scram', !html.includes('press_scram_MPa'), '');
chk('game: level gauge defined', html.includes("key: 'level'"), '');
chk('game: 7 gauge defs', (html.match(/key: '(temp|press|power|react|period|steam|level)'/g) || []).length >= 7, '');

// ---- 16. Controls pass (Nov 25): simplification + assist redesign ----
chk('controls: permanent Helper button present', html.includes('id="helpBtn"'), '');
chk('controls: contextual Action button present', html.includes('id="actionBtn"'), '');
chk('controls: demo offer bar present, KEEP TRYING first (default focus)', html.includes('id="demoOffer"') && html.indexOf('demoKeepBtn') < html.indexOf('demoShowBtn'), '');
chk('controls: Guidance setting on title screen', html.includes('id="guidanceBtn"'), '');
chk('controls: SN_HELP module present', html.includes('const SN_HELP'), '');
chk('controls: stall-timer explain ladder deleted', !html.includes('idleFor >= ASSIST.rungSec'), '');
chk('controls: idle hint deleted (pure idle fires nothing)', !html.includes("chiefReact('idle_30s_hint')"), '');
chk('controls: conjoint evidence — identical failure x3', html.includes('H.failSame >= Math.ceil(3 * fade)'), '');
chk('controls: conjoint evidence — active-input window', html.includes('H.activeNoProg >= 100'), '');
chk('controls: demo resets the step for the player', html.includes('SN_HELP.finishDemoReset'), '');
chk('controls: long-press is a ladder alias, not a takeover', html.includes('long-press is now an ALIAS'), '');
chk('controls: handwheel tap-to-toggle', html.includes("kind === 'wheel' && !pop.grab.moved"), '');
chk('controls: feed pump restarts on tap', html.includes('TAP: RESTART MAIN'), '');
chk('controls: target band from Samira full-power rule', html.includes('285+ MWe') && html.includes('IN RANGE ✔'), '');
chk('controls: steppers drawn 80 px', html.includes('r.y + soY(196), 40,'), '');
chk('controls: Back/Esc closes layers', html.includes("code === 'Backspace'"), '');
chk('controls: panel auto-closes on step completion (patch129: fades away)', html.includes('SN_TOUCH.fadeClosePop();   // patch129'), '');
chk('controls: demo assistance IS marked — (DEMO-ASSISTED) suffix stays (Kevin Nov 25 ~19:36, R67)', html.includes('(DEMO-ASSISTED)'), '');
chk('controls: demo assistance IS marked — end screen carries the DEMO-ASSISTED line (Shift Log card since patch137)', html.includes('slAssisted') && html.includes('DEMO-ASSISTED'), '');
chk('controls: takeover sets the demo-assisted flag (D19)', html.includes('gameState.demoAssisted = true'), '');
chk('controls: demo-reset records the step as assisted', html.includes('ASSIST.assisted.indexOf(snap.step)'), '');

// 17. Wiring pass (Nov 25): Chief clips, cinematics, panel systems
chk('wiring: CHIEF_CLIP map present', html.includes('const CHIEF_CLIP = {'));
chk('wiring: 142 clip entries wired', (html.match(/"voice\/[a-z0-9_-]+\.mp3"/g) || []).length === 142);
chk('wiring: clip branch in chiefSpeak', html.includes('CHIEF_CLIP[text]') && html.includes('CHIEF.audio'));
chk('wiring: clip branch gated on mute/unlock only', html.includes('if (!CHIEF.muted && CHIEF.unlocked && CHIEF_CLIP[text])'));
chk('wiring: mute stops a playing clip', html.includes('CHIEF.audio.pause()'));
chk('wiring: stale Decision 28 comment replaced', !html.includes('pre-rendered audio rejected on size'));
chk('wiring: briefing variants rotate', html.includes('const CALLOUT_VARIANTS = {') && html.includes('nextCalloutText(key)'));
chk('wiring: showme third variant present (rod_drive_2)', html.includes('B drive now. I keep the pulls small and even'));
chk('wiring: handback rotation', html.includes("rotPick('handback', HANDBACK_LINES)"));
chk('wiring: takeover announce rotation', html.includes("rotPick('takeover', TAKEOVER_ANNOUNCE)"));
chk('wiring: hints speak', html.includes('chiefSpeak(h, false)'));
chk('wiring: takeover say speaks at log call', html.includes("if (kind === 'say') chiefSpeak(text, false);"));
chk('wiring: demo literals speak', html.includes("chiefSpeak('Demo off. The plant is yours, operator.', false);"));
chk('wiring: VIDEO map has all 23 scenes', (html.match(/'cine\/[a-z0-9_]+\.mp4'/g) || []).length === 23);
chk('wiring: assist_coach scene wired', html.includes("assist_coach: 'cine/assist_coach.mp4'"));
chk('wiring: panel systems present', html.includes('const PANEL_SYS = {') && html.includes('panelSysFor'));
chk('wiring: panel bands (5 systems)', html.includes("'#7b3fd4'") && html.includes("'#128a7d'") && html.includes("'#c9932b'") && html.includes("'#b3502a'") && html.includes("'#d9b81f'"));
chk('wiring: Fluke quips NOT wired as Chief', !html.includes('voice/cine-') && !html.includes('-quip.mp3'));
chk('wiring: orphan clips NOT wired', !html.includes('tourscript-') && !html.includes('demo-narration-'));
chk('wiring: ladder announce NOT wired (no site in current build)', !html.includes('ladder-announce'));
chk('wiring: guide thirds NOT wired (no speak site)', !html.includes('guide-step1-3') && !html.includes('guide-step5-3'));


// ---- 18. Pacing gate (spec §7A): no step over 30 s ----
chk('pacing: SN_PACE policy block present', html.includes('// SN_PACE_BEGIN') && html.includes('// SN_PACE_END'));
chk('pacing: SPEED control in step bar', html.includes('id="paceBtn"') && html.includes('paceCycle(event)'));
chk('pacing: Samira speeds restored (1/2/5)', html.includes('SPEEDS: [1, 2, 5]'));
chk('pacing: sim has its own frame clamp', html.includes('const simDt = Math.min(0.25, rawFrameDt)') && html.includes('updatePhysics(simDt, true)'));
chk('pacing: dropped-time budget (2.6 s backlog, 60 ticks)', html.includes('SIM_MAX_FRAME_TIME = 2.6') && html.includes('SIM_MAX_TICKS_FRAME = 60'));
chk('pacing: band taught in step guidance', html.includes('20–58% heat-up band') && html.includes('BAND 20–58%'));
chk('pacing: raise-power hand at 6 %/s', html.includes('let rate = 6;'));
chk('pacing: driver hand sim-paced', html.includes('dt * (SN_PACE.effective || 1)'));
chk('pacing: cycle recomputes from a fresh snap', html.includes('SN_PACE.effective = paceEffective(paceSnap())'));
chk('pacing: fw trip answered first in driver law', html.includes("(!S.fwOK && !S.ctl.rfpStby) { action = 'feed_pump'; mode = 'tap'; }"));

const _pi = html.indexOf('// SN_PACE_BEGIN'), _pj = html.indexOf('// SN_PACE_END', _pi);
const PACE = new Function('BWR', html.slice(_pi, _pj + '// SN_PACE_END'.length) + '\nreturn { SN_PACE, paceWaitKind, paceAttention, paceEffective };')(BWR);
chk('pacing: policy extracts and evaluates', !!PACE && PACE.SN_PACE.AUTO === 10 && PACE.SN_PACE.GRID_FLOOR === 2);

function paceRun(level, profile, playerSpeed) {
  const S = BWR.create(1234); BWR.start(S);
  let lever = 0, bypass = 0, step = 0, l2Stage = 0;
  let wall = 0, stepWall = 0, segWall = 0, curSeg = 0, gridSeen = false;
  const steps = [], segs = [];
  let tcPrev, rateSm = 0, leverT = 20, natTapT = 0, natFwAnswered = false;
  const chase = (cur, tgt, r, dt) => { const d = tgt - cur, m = r * dt; return Math.abs(d) <= m ? tgt : cur + Math.sign(d) * m; };
  const done = () => (level === 3 && S.phase === 'complete') || (level !== 3 && step === 4 && S.phase === 'grid');
  let guard = 0;
  while (guard++ < 400000) {
    const snap = { step, level, phase: S.phase, lever, bypass, p: S.p, fwOK: S.fwOK, turbTrip: S.turbTrip, evTu: S.ev ? S.ev.tu : 0, scram: S.scram, player: playerSpeed, hold: false };
    const speed = PACE.paceEffective(snap);
    const dtWall = 0.1 / speed; wall += dtWall; stepWall += dtWall; segWall += dtWall;
    if (profile === 'demo') {
      if (tcPrev === undefined) { tcPrev = S.Tc; rateSm = 0; leverT = 20; }
      rateSm += ((S.Tc - tcPrev) / 0.1 * 60 - rateSm) * Math.min(1, 0.1 / 3); tcPrev = S.Tc;
      let bypassT = null;
      if (step === 0) {}
      else if (!S.fwOK && !S.ctl.rfpStby) S.ctl.rfpStby = true;
      else if (!S.fwOK && S.ctl.rfpStby) BWR.inject(S, 'fw');
      else if (S.level < 88 && !S.ctl.rfpStby) S.ctl.rfpStby = true;
      else if (S.ev && S.ev.tu === 1 && bypass < 90) bypassT = 100;
      else if (S.ev && S.ev.tu === 1) leverT = 12;
      else if (S.turbTrip > 0 && bypass < 99) bypassT = 100;
      else if (S.p > 7.35 && bypass < 100) bypassT = 100;
      else if (S.phase === 'power' && S.mwe < 285 && bypass > 0 && S.turbTrip <= 0) bypassT = 0;
      else if (S.p < 7.05 && bypass > 0) bypassT = 0;
      else if (S.turbTrip > 0) leverT = 15;
      else if (S.phase === 'grid') leverT = S.level < 80 ? S.disp / 6 : Math.max(0, Math.min(100, S.disp / 3));
      else if (S.phase === 'power') leverT = 100;
      else { leverT += Math.max(-4, Math.min(2, (120 - rateSm) * 0.02)) * 0.1; if (S.p > 7.3) leverT -= 5 * 0.1; leverT = Math.max(0, Math.min(58, leverT)); }
      if (bypassT !== null) bypass = chase(bypass, bypassT, 15, 0.1);
      if (step > 0) { if (lever < leverT - 1) lever = chase(lever, leverT - 1, 8, 0.1); else if (lever > leverT + 1) lever = chase(lever, leverT + 1, 8, 0.1); }
    } else {
      if (l2Stage >= 1 && !S.fwOK && !natFwAnswered) { BWR.inject(S, 'fw'); natFwAnswered = true; }
      if (S.phase === 'grid') {
        if (tcPrev === undefined) { tcPrev = S.Tc; rateSm = 0; leverT = 20; }
        rateSm += ((S.Tc - tcPrev) / 0.1 * 60 - rateSm) * Math.min(1, 0.1 / 3); tcPrev = S.Tc;
        let bypassT = null;
        if (!S.fwOK && !S.ctl.rfpStby) S.ctl.rfpStby = true;
        else if (!S.fwOK && S.ctl.rfpStby) BWR.inject(S, 'fw');
        else if (S.ev && S.ev.tu === 1 && bypass < 90) bypassT = 100;
        else if (S.ev && S.ev.tu === 1) leverT = 12;
        else if (S.turbTrip > 0 && bypass < 99) bypassT = 100;
        else if (S.p > 7.35 && bypass < 100) bypassT = 100;
        else if (S.p < 7.05 && bypass > 0) bypassT = 0;
        else if (S.turbTrip > 0) leverT = 15;
        else leverT = S.level < 80 ? S.disp / 6 : Math.max(0, Math.min(100, S.disp / 3));
        if (bypassT !== null) bypass = chase(bypass, bypassT, 15, dtWall);
        if (lever < leverT - 1) lever = chase(lever, leverT - 1, 8, dtWall); else if (lever > leverT + 1) lever = chase(lever, leverT + 1, 8, dtWall);
      } else if (S.turbTrip > 0) {
        bypass = chase(bypass, 100, 15, dtWall); lever = chase(lever, 15, 6, dtWall);
      } else {
        if (S.p > 7.35 && bypass < 100) bypass = chase(bypass, 100, 15, dtWall);
        else if (S.phase === 'power' && S.mwe < 285 && bypass > 0 && S.turbTrip <= 0) bypass = chase(bypass, 0, 15, dtWall);
        else if (S.p < 7.05 && bypass > 0) bypass = chase(bypass, 0, 15, dtWall);
        if (step === 1 || step === 2) {
          natTapT += dtWall;
          if (natTapT >= 1.0) { natTapT = 0; if (S.rate > 140 && lever > 4) lever -= 4; else if (S.rate < 120 && lever < 58) lever += 4; }
        } else if (step === 4) lever = chase(lever, 100, 6, dtWall);
      }
    }
    S.lever = lever; S.ctl.bypass = bypass > 0 ? 'man' : 'auto'; S.ctl.byMan = bypass;
    BWR.step(S, 0.1);
    let advanced = false;
    if (step === 0) { steps.push(stepWall); step = 1; advanced = true; }
    else if (step === 1 && lever > 5) { steps.push(stepWall); step = 2; advanced = true; }
    else if (step === 2 && S.p >= C.P_OK) { steps.push(stepWall); step = 3; advanced = true; }
    else if (step === 3 && S.turbOn) { steps.push(stepWall); step = 4; advanced = true; }
    if (advanced) stepWall = 0;
    if (level === 3 && S.phase === 'grid') {
      if (!gridSeen) { gridSeen = true; curSeg = S.segI; segWall = 0; }
      else if (S.segI !== curSeg) { segs.push(segWall); segWall = 0; curSeg = S.segI; }
    }
    if (level === 2) {
      if (l2Stage === 0 && step >= 2) { BWR.inject(S, 'fw'); l2Stage = 1; }
      else if (l2Stage === 1 && step >= 3) { BWR.inject(S, 'turb'); l2Stage = 2; }
    }
    if (done()) { steps.push(stepWall); if (level === 3) segs.push(segWall); break; }
    if (S.scram || S.phase === 'failed') return { ok: false, why: 'scram/failed: ' + (S.why || S.phase), steps, segs };
  }
  // Her segI flickers once at grid entry (a 0.1 s artefact entry);
  // merge any sub-0.2 s head entry into the segment that follows it.
  const normSegs = [];
  let pending = 0;
  for (const s of segs) { if (s < 0.2 && normSegs.length === 0) { pending += s; continue; } normSegs.push(s + pending); pending = 0; }
  if (pending && normSegs.length) normSegs[normSegs.length - 1] += pending;
  return { ok: step === 4 && steps.length === 5, why: 'guard/steps=' + steps.length, steps, segs: normSegs, wall };
}

for (const lvl of [1, 2, 3]) {
  for (const prof of ['demo', 'natural']) {
    const r = paceRun(lvl, prof, 1);
    const table = r.steps.map((s, i) => 'step' + i + '=' + s.toFixed(1) + 's').join(' ');
    chk('pacing: L' + lvl + ' ' + prof + ' completes clean', r.ok, r.ok ? 'total ' + r.wall.toFixed(1) + 's' : r.why);
    // L3's step 4 is the whole grid shift by design — it is judged
    // per dispatch segment by the next check, not as one step.
    const judged = lvl === 3 ? r.steps.slice(0, 4) : r.steps;
    chk('pacing: L' + lvl + ' ' + prof + ' every step <= 30 s', r.ok && judged.every(s => s <= 30), table);
    if (lvl === 3) chk('pacing: L3 ' + prof + ' every dispatch segment <= 30 s', r.ok && r.segs.length === 5 && r.segs.every(s => s <= 30), r.segs.map((s, i) => 'seg' + i + '=' + s.toFixed(1) + 's').join(' '));
  }
}
for (const lvl of [1, 2, 3]) {
  const r = paceRun(lvl, 'demo', 5);
  const judged = lvl === 3 ? r.segs : r.steps;
  chk('pacing: L' + lvl + ' demo at player 5x completes clean, steps <= 30 s', r.ok && judged.length > 0 && judged.every(s => s <= 30), r.ok ? judged.map(s => s.toFixed(1)).join('/') : r.why);
}

// ---- 19. Play-test fixes (patch77, Nov 25): touch completion + nav clearance ----
chk('patch77: sheet draws a CHECK READINGS plate for check_readings', html.includes("a === 'check_readings'") && html.includes("fillText('CHECK READINGS', cx, r.y + soY(224))"), '');
chk('patch77: sheet tap on the plate fires the operate tap (same event as E)', html.includes('player.interactTarget.id === pop.item.id) INPUT.tapPulse = true; else pop.checkTap = true;'), '');
chk('patch77: check tap latched before arrival fires when Fluke reaches the panel', html.includes('if (pop.atPanel && pop.checkTap) { pop.checkTap = false; INPUT.tapPulse = true; }'), '');
chk('patch77: action button lift present (nav clearance computed from live rects)', html.includes('function snActionLift(') && html.includes('gr.bottom - cr.bottom'), '');
chk('patch77: ladder-row clearance 220 / move-row clearance 122', html.includes('ladderShown ? 220 : 122'), '');

// ---- 20. Ladder-top trap + resize dump (patch79, Nov 25 play-test) ----
chk('patch79: exit-band re-grab suppression present in the ladder grab test', html.includes('if (upKey && !downKey && p.ladderLatch && (p.y + p.h) <= lad.y + 2)'), '');
chk('patch79: suppression is latch-gated (fresh grabs at the top still engage)', html.includes('p.ladderLatch && (p.y + p.h) <= lad.y + 2') && html.includes('if (p.onLadder) p.ladderLatch = true;'), '');
chk('patch79: BUG-001 latch semantics unchanged (clears when Up released, held Up cannot jump)', html.includes("if (!keys['ArrowUp'] && !keys['KeyW'] && !keys['ArrowDown'] && !keys['KeyS'] && !p.climbAuto) p.ladderLatch = false;") && html.includes("keys['ArrowUp'] && !p.ladderLatch"), '');
chk('patch79: ladder grab test top tolerance unchanged (4 px, BUG-001)', html.includes('p.y + p.h > lad.y - 4 && p.y < lad.y + lad.h'), '');
chk('patch79+144: resize preserves the player across buildWorld — patch144 anchors him to his standing deck measured against WORLD_H (was: bare feet fraction of the live H)', html.includes('anchor = snDeckAnchor()') && html.includes('snDeckReseat(anchor)') && html.includes('(player.y + player.h) / WORLD_H'), '');

// ---- 21. Debug bar off + sprite loader + cinematic ducking (patches 80-82, Nov 25 late) ----
chk('patch80: SNX strip hidden in the shipped build (display:none)', html.includes('<div id="snxBar" style="display:none"'), '');
chk('patch80: SNX strip element kept in the DOM for the guarded layout readers', html.includes('id="snxMargin"') && html.includes('function snxBarUpdate()'), '');
chk('patch81: queued retrying image loader present (max 8 in flight, 6 retries)', html.includes('function snLoadImg(') && html.includes('MAX: 8') && html.includes('if (tries < 6)'), '');
chk('patch81: FLUKE3D and CHIEF3D frames load through snLoadImg', html.includes("snLoadImg('sprites/frames/chief_'") && html.includes("snLoadImg('sprites/frames/fluke_'"), '');
chk('patch81: plates load through snLoadImg', html.includes('const im = snLoadImg(src,'), '');
chk('patch81: Chief draw gate is per-frame (no all-or-never ready() demand)', !html.includes('CHIEF3D.ready() && drawChiefSprite') && html.includes('if (drawChiefSprite(c))'), '');
chk('patch81: Fluke draw gate is per-frame with canvas fallback', html.includes('if (drawFlukeSprite(p, dtF)) return;') && html.includes('if (!img || !img.complete || !img.naturalWidth) return false;'), '');
chk('patch82: SN_DUCK present and exposed', html.includes('const SN_DUCK = {') && html.includes('window.SN_DUCK = SN_DUCK;'), '');
chk('patch82: SFX duck stage wired (master -> duck -> destination) with setDucked API', html.includes('master.connect(duckGain); duckGain.connect(ac.destination);') && html.includes('setDucked(on)'), '');
chk('patch82: cinematic start engages ducking, close() releases it', html.includes('SN_DUCK.on();') && html.includes('SN_DUCK.off();'), '');
chk('patch82: chiefSpeak never starts a line over a cinematic', html.includes("if (typeof CINE_ACTIVE !== 'undefined' && CINE_ACTIVE) return;"), '');
chk('patch82: ducking preserves a settings-muted source (duck stage is separate from the mute master)', html.includes('duckGain.gain.value = duckWanted ? 0 : 1') && html.includes('master.gain.value = CHIEF.muted ? 0 : vol'), '');

// ---- 22. Ladder descent entry (patch83, found by the patch79 V6 probe) ----
chk('patch83: landing snap exempted at the ladder mouth while descending', html.includes('if (!ladMouth && p.y + p.h >= plat.y && py_prev <= plat.y + 5 && p.vy >= 0)'), '');
chk('patch83: exemption requires on-ladder + downward motion + the ladder top being this platform', html.includes('if (p.onLadder && p.vy > 0)') && html.includes('Math.abs(lad.y - plat.y) < 1 && p.x + p.w > lad.x && p.x < lad.x + lad.w'), '');
chk('patch83: head-collision ladder exemption (BUG-001) unchanged', html.includes('if (!p.onLadder && p.y <= plat.y + plat.h && p.y + p.h > plat.y + plat.h + 2 && p.vy < 0)'), '');

// ---- 23. Score-screen exit (patch84, Nov 25 play-test) ----
chk('patch84: score screen tap-anywhere returns to the main menu', html.includes("ss.addEventListener('pointerdown'") && html.includes('quitToMenu();'), '');
chk('patch84: taps on the score buttons keep the buttons own actions', html.includes("e.target.closest('button')"), '');
chk('patch84: score screen carries the tap-for-menu hint', html.includes('TAP ANYWHERE FOR MAIN MENU'), '');

// ---- 24. Guide button row (patch85, Kevin layout instruction Nov 25 ~23:55) ----
chk('patch85: the four guide controls live in one left-anchored row', html.includes('class="guide-btnrow"') && html.includes('.guide-btnrow { position: absolute; left: 10px;'), '');
chk('patch85: no guide button is right-anchored any more', !html.includes('right: 292px') && !html.includes('right: 196px') && !html.includes('right: 96px') && !html.includes('right: 22px'), '');
chk('patch85/86+134: guide row is TOUCH, DEMO (SOUND removed by patch134; AUDIO/SFX sit left of MENU)', (() => { const i = html.indexOf('class="guide-btnrow"'); const seg = html.slice(i, html.indexOf('</div>', i)); return seg.indexOf('touchModeBtn') > -1 && seg.indexOf('touchModeBtn') < seg.indexOf('demoBtn') && seg.indexOf('chiefMute') === -1 && seg.indexOf('takeoverBtn') === -1; })(), '');
chk('patch85+134: row buttons carry the tappable standard (cluster scaled by patch134)', html.includes('#touchModeBtn { position: static;') && html.includes('#takeoverBtn { position: static;') && html.includes('#audioBtn, #cineBtn { background: #2a1c08;')   /* ship #25: CINE shares the AUDIO rule */, '');

// ---- 25. Control cluster (patch86, Kevin Nov 25 ~23:57) ----
chk('patch93: SPEED/TAKEOVER/MAP/ASK share ONE row (orders 1-4, equal flex)', html.includes('#paceBtn { order: 1; flex: 1 1 0;') && html.includes('#takeoverBtn { order: 2; flex: 1.3 1 0;') && html.includes('#mapBtn { order: 3; flex: 0.85 1 0; }') && html.includes('#helpBtn { order: 4; flex: 0.85 1 0; }'), '');
chk('patch93: STEP spans the full width beneath the row (order 5)', html.includes('#stepChip { order: 5; flex: 1 1 100%; }'), '');
chk('patch86: TAKEOVER lives in the stepBar, after SPEED', (() => { const sb = html.indexOf('id="stepBar"'); const seg = html.slice(sb, sb + 1400); return seg.indexOf('paceBtn') > -1 && seg.indexOf('paceBtn') < seg.indexOf('takeoverBtn'); })(), '');
chk('patch99: the ASK control is SHOW (Kevin, Nov 26 ~00:52)', html.includes('>SHOW</button>') && !html.includes('>ASK</button>'), '');

// ---- 26. Assist-offer timing + equal pair (patch87, Kevin Nov 25 ~23:58) ----
chk('patch87: offer visibility gate is 20 s on the step', html.includes('function snHelpOfferReady() { return T_NOW - (SN_HELP.stepT0 || 0) >= 20; }'), '');
chk('patch99 supersedes patch87: the offer function never shows anything', html.includes('the assist offer pop-up is REMOVED'), '');
chk('patch87: step clock restarts with the step counters', html.includes('SN_HELP.stepT0 = T_NOW;'), '');
chk('patch99 supersedes patch87: SHOW starts the demo directly (no gated offer path)', html.includes('return snWalkStart();   // patch171 (ship #25)')   /* ship #25: SHOW starts the walkthrough (was SN_HELP.startDemo()) */, '');
chk('patch93: the top-row buttons are border-box on an equal flex basis', html.includes('#paceBtn { order: 1; flex: 1 1 0; box-sizing: border-box; }') && html.includes('#takeoverBtn { order: 2; flex: 1.3 1 0; box-sizing: border-box; }'), '');

// ---- 27. Deck rule, free movement, marking rules (patch88, Kevin Nov 26) ----
chk('patch88: digital versions hidden while the analog pop-up is open', html.includes('#gaugeDeckExpanded .gs-val { display: none; }'), '');
chk('patch88: gauge titles on the pop-up render white', html.includes('.gs-label { font-size: 9px; color: #ffffff;'), '');
chk('patch88: floor-1 decks continuous (reactor meets steam at 940)', html.includes("platforms.push({ x: 50, y: bh*0.42, w: 890,"), '');
chk('patch88: floor-1 decks continuous (steam meets turbine at 1750)', html.includes("platforms.push({ x: 940, y: bh*0.42, w: 810,"), '');
chk('patch88: panel target ring fades out by ~2 s from panel open', html.includes('const ringAge = (performance.now() - pop.openMs) / 1000;') && html.includes('const ringFade = ringAge < 1.5 ? 1 : Math.max(0, 1 - (ringAge - 1.5) / 0.5);'), '');
chk('patch88: world target marking is a green chevron, no circle', html.includes("ctx.fillStyle = 'rgba(55,214,122,'") && !html.includes("ctx.strokeStyle = 'rgba(255,190,80,'"), '');
chk('patch88: the sheet draws no circle around the world object', !html.includes("ctx.strokeStyle = 'rgba(255,215,94,0.8)'; ctx.stroke();"), '');

// ---- 28. Photorealistic device renders (patch89, Kevin Nov 26 ~00:07) ----
chk('patch89: device renders load warm-at-load with the plates', html.includes("['dev_roddrive', 'plates/dev_roddrive.webp']") && html.includes("['dev_ari', 'plates/dev_ari.webp']"), '');
chk('patch89: every pop-up action maps to a render', html.includes('const SN_DEV_PLATE = {') && html.includes("check_readings: 'panel'"), '');
chk('patch89: the sheet paints the device render under the live controls', html.includes('snCoverDraw(dim, r.x + 10, r.y + 92, r.w - 20, r.h - 102, 0.92)'), '');
chk('patch89: the rod drive composites in the world; glyph is fallback only', html.includes('if (!snDevImg(\'rod_withdraw\')) drawRodDrive(item, isStuck);'), '');

// ---- 29. Instruction prompts (patch90, Kevin Nov 26 ~00:09) ----
chk('patch90: the prompt box is transparent and subtle', html.includes('background: rgba(13,26,18,0.25);') && html.includes('border: 1px solid rgba(55,214,122,0.35);'), '');
chk('patch158: a prompt fades away at ~2 s and stays gone for that prompt — EXCEPT the at-panel OPEN prompt, which stays pressable (supersedes the patch90 lock)', html.includes("if (actAge >= 2 && !(mode === 'open' && player.interactTarget)) { ab.style.display = 'none'; return; }"), '');
chk('patch90: the fade is per-prompt (key on mode + label)', html.includes("const actKey = mode + '|' + label, nowMs = performance.now();"), '');

// ---- 30. Realistic steam (patch91, Kevin Nov 26 ~00:10) ----
chk('patch91: the bubble system is retired', html.includes('function updateSteamParticles(dt) { /* retired — see STEAM_FX */ }') && !html.includes('Steam tunnel atmospheric particles'), '');
chk('patch91: the puff sprite is a multi-lobe volumetric cloud (patch126: seeded variants)', html.includes('const _steamSprites') && html.includes('rnd() * 6.283'), '');
chk('patch91: buoyancy + drag in the particle step', html.includes('p.vx *= (1 - 1.4 * dt); p.vy *= (1 - 0.55 * dt); p.vy -= 30 * dt;'), '');
chk('patch91: the plume expands by entrainment and thins as it grows', html.includes('0.26 * Math.hypot(p.vx, p.vy)') && html.includes('Math.pow((p.r0 || p.r) / p.r, p.thin || 0.65)'), '');

// ---- 31. Atlas priority (patch92, Nov 26 ~00:24) ----
chk('patch92: dev renders do not warm in their load callback', html.includes("if (key.indexOf('dev_') !== 0) { try { ctx.drawImage(im, -9999, -9999, 1, 1); }"), '');
chk('patch92: dev renders warm only after both sprite sets are in', html.includes('const spritesIn = (typeof FLUKE3D === \'undefined\' || FLUKE3D.ready())'), '');
chk('patch92: snDevImg gates dev renders on the deferred warm', html.includes("if (k.indexOf('dev_') === 0 && !SN_PLATES.devWarm[k]) return null;"), '');


// ---- 32. Condensed boxes, one height, doubled text (patch93/93b, Kevin Nov 26 ~00:26-00:34) ----
chk('patch93+134: one shared box height for boxed text (top cluster +20% by patch134)', html.includes(':root { --sn-box-h: 48px; }') && html.includes('#stepBar button, #touchModeBtn, #demoBtn, #demoOffer button, .mini-gauge, .level-btn { height: var(--sn-box-h); box-sizing: border-box; }') && html.includes('#stepBar button, #touchModeBtn, #demoBtn { height: 58px; font-size: 19px; }'), '');
chk('patch93+140: top bar condensed (gap 3, padding 2px 3px since patch140)', html.includes('align-items: center; gap: 3px; padding: 2px 3px;'), '');
chk('patch93: gauge deck bottom clearance (bottom gauges fully on screen)', html.includes('#gaugeDeck { padding-bottom: max(16px, env(safe-area-inset-bottom)); box-sizing: border-box; }'), '');
chk('patch93: gauge boxes ride the shared height', html.includes('height: var(--sn-box-h); padding: 0 4px;'), '');
chk('patch97: one font across all boxed controls (Courier New 16px)', html.includes("font: bold 16px 'Courier New', monospace; padding: 2px 6px;") && !html.includes('font: 700 24px system-ui'), '');
chk('patch103: gauge text smaller + labels lighter (values 12px, labels 9px light)', html.includes('.mini-gauge .mg-val { font-size: 12px; text-align: center;') && html.includes('.mini-gauge .mg-label { font-size: 9px; color: #d7dee6; text-align: center;'), '');


// ---- 33. Pass-by pop-ups removed; info on the panel (patch94, Kevin Nov 26 ~00:32) ----
chk('patch94: a machine tap no longer opens the sheet', !html.includes('closeWhmisCard(); openPop(it);'), '');
chk('patch94: a machine tap sets the focus and walks Fluke to the unit', html.includes('tapFocus = it; pop.walkToX = it.x + it.w / 2;'), '');
chk('patch94: SN_TOUCH exposes the detail rows + tap focus for the on-panel plate', html.includes('detailRows: sheetDetailRows, focusItem: () => tapFocus,'), '');
chk('patch94: the zoom focuses the approached unit when the step target is out of reach (patch132: pcx form)', html.includes('if (nearU && nearU !== tgt && (!tgt || Math.abs((tgt.x + tgt.w / 2) - pcx) > 520)) tgt = nearU;'), '');
chk('patch94: panel TYPE map exists for every unit action', html.includes("rod_withdraw: 'CONTROL ROD DRIVE'") && html.includes("check_readings: 'LOCAL PANEL - PLANT STATUS'") && html.includes("rcic_panel: 'RCIC PANEL'"), '');
chk('patch94+136: the on-panel info plate draws name + type + live readings (measured fit since patch136)', html.includes('type94 = SN_PANEL_TYPE[item.action]') && html.includes('const rows94 = SN_TOUCH.detailRows(item);'), '');

// ---- 34. Vessel gauges removed (patch95, Kevin Nov 26 ~00:35-00:36) ----
chk('patch95: the two vessel gauge calls are gone', !html.includes("drawVesselGauge(vx + 44") && !html.includes("drawVesselGauge(vx + vw - 44"), '');
chk('patch95: the vessel itself still draws (nameplate stays)', html.includes("kitNameplate(vx + vw / 2, vy + vh + 18, 190, 'REACTOR PRESSURE VESSEL')"), '');

// ---- 35. Condensed-box fit fixes (patch93c, from the ship-#4 phone proof) ----
chk('patch93c: step-row buttons can shrink (ASK never clipped)', html.includes('#stepBar button { min-width: 0; }'), '');
chk('patch93c: gauge boxes flex to equal shares, overflow hidden', html.includes('flex: 1 1 0; min-width: 0; height: var(--sn-box-h); padding: 0 2px; overflow: hidden;'), '');

// ---- 36. Chief window pop/fade, uniform fonts, SHOW toggle, no click-gate, speaking state (Kevin, Nov 26 ~00:48-00:56) ----
chk('patch96: Chief collapsed at rest (supersedes open-by-default)', html.includes('let guideExpanded = false;'), '');
chk('patch96: new line pops the window (single caption choke point)', html.includes('currentCalloutText = text;\n  snGuidePop();') && html.includes('function snGuidePop()'), '');
chk('patch96: fade tick wired into the loop, 2 s after the line', html.includes('snGuideTick();') && html.includes('guidePopTextUntil + 2000'), '');
chk('patch96: collapsed at level start', html.includes("document.getElementById('guideBarExpanded').style.display = 'none';"), '');
chk('patch97: TAKEOVER = MAP = SHOW font (bold 16px Courier)', html.includes("#takeoverBtn { position: static; background: #0e2438;") && !html.includes("font: bold 22px 'Courier New'") && !html.includes("font: bold 24px 'Courier New'") && !html.includes('font: 700 24px system-ui'), '');
chk('patch99: offer pop-up removed (never shows)', html.includes('#demoOffer { display: none !important; }') && html.includes('the assist offer pop-up is REMOVED'), '');
chk('patch99: SHOW starts the demo directly, toggle stops it', html.includes('SN_HELP.showFollow = true; SN_HELP.showStopped = false;') && html.includes('return snWalkStart();   // patch171 (ship #25)')   /* ship #25: SHOW starts the walkthrough (was SN_HELP.startDemo()) */, '');
chk('patch99: button green while following, red when stopped', html.includes('#helpBtn.follow-on { background: #14532d;') && html.includes('#helpBtn.follow-off { background: #5a1616;'), '');
chk('patch99: Chief-continue click-gate removed (demo runs through)', html.includes("SHOWME.phase = 'operate'; SHOWME.opT = 0; guideNarrate(pin); guideShowGate(false);") && !html.includes("SHOWME.phase = 'gate'; guideNarrate(pin); guideShowGate(true);"), '');
chk('patch99: follow floor flip is position-derived (no mid-climb band)', html.includes('if (player.onGround && !player.onLadder && guideFloorOf(feet) === tf) { SHOWME._pf = tf;'), '');
chk('patch99: stray input does not kill a SHOW follow (toggle is the stop)', html.includes('!(window.SN_HELP && SN_HELP.showFollow)) {'), '');
chk('patch100: cluster hides while the Chief speaks', html.includes('body.chief-speaking #paceBtn') && html.includes("classList.toggle('chief-speaking', !!CHIEF.speaking)"), '');
chk('patch100: portrait larger + speech 30% larger in white while speaking', html.includes('body.chief-speaking .guide-portrait { width: 149px; height: 126px; }') && html.includes('body.chief-speaking .guide-speech { font-size: 14px; color: #ffffff; }'), '');

// ---- 37. Ledge rails, brightness + TV fps, ladder singles, no black circles (Kevin, Nov 26 ~00:50-01:07) ----
chk('patch98: rails computed per platform end (continuation/ladder/world exemptions)', html.includes('plat.railL = plat.x > 2 && !cont(plat.x, -1) && !ladNear(plat.x);'), '');
chk('patch98->146: railed ends are marked — by the fence asset now (the yellow railBar this lock was written for was removed by patch146 at Kevin\'s pick)', html.includes('function snDrawFenceEnds(plat)') && html.includes('SN_PLATES.imgs.fence') && !html.includes('railBar'), '');
chk('patch98: grounded walking clamped at a railed end', html.includes('if (railMinX > -Infinity) p.x = Math.max(p.x, railMinX);'), '');
chk('patch101: world brightness lift on the game canvas (modest)', html.includes('#gameCanvas { filter: brightness(1.15) saturate(1.06); }'), '');
chk('patch101: TV backdrop brightened, Chief unfiltered', html.includes('linear-gradient(180deg, #2a4258, #1a2c3e)') && html.includes("bg.addColorStop(0, '#163434')"), '');
chk('patch101: TV-window Chief plays at 10 fps', html.includes('const SN_TV_FPS = 10;') && html.includes('Math.floor(tNow * SN_TV_FPS) / SN_TV_FPS'), '');
chk('patch102: one ladder per climb point (x=1680 duplicate removed)', !html.includes('ladders.push({ x: 1680,'), '');
chk('patch102: reactor ladder registered on the plate art, code draw suppressed', html.includes('plateArt: true') && html.includes('if (lad.plateArt) return;'), '');
chk('patch102: mounting bands (the breaks) removed from the ladder draw', !html.includes('my += 72) ctx.fillRect(lad.x - 2, my'), '');
chk('patch102: no black ellipse under Fluke or the Chief', !html.includes('ctx.ellipse(player.x + player.w / 2, player.y + player.h + 3') && !html.includes('g.ellipse(c.x, feet + 3'), '');
chk('patch102: guide ladder choice is nearest the player', html.includes('const d = Math.abs((l.x + l.w / 2) - (player.x + player.w / 2)); if (d < bd)'), '');

// ---- 38. Gauge health frames (Kevin, Nov 26 ~01:14) ----
chk('patch103: frame colour engine reads the def zones (Samira limits)', html.includes('function snGaugeHealthColor(def, v)') && html.includes('const zs = def.zones;'), '');
chk('patch103: gradual blend window around zone boundaries', html.includes('if (z <= b + 0.45) return mix(zs[b - 1][2], zs[b][2]') && html.includes('if (z <= 0.8) return zs[0][2];'), '');
chk('patch103: frame applied in the strip refresh', html.includes("mgF.style.borderColor = fc"), '');

// ---- 39. TV Chief smooth set wired (SET I/K, Kevin Nov 26 ~01:19-01:25) ----
chk('patch104: smooth TV set is the portrait source (procedural fallback kept)', html.includes('const SN_TV = {') && html.includes('if (!SN_TV.draw(document.getElementById(\'portraitCanvas\'), tNow, false)) drawChiefFace'), '');
chk('patch104: clips selected by situation (talk/alarmed/excited/pointing/sip/idle)', html.includes("if (CHIEF.speaking) return 'talk';") && html.includes("if (CHIEF._idleAct === 'sip') return 'coffee-sip';"), '');
chk('patch104: frames step at exactly 10 fps from frame_001.webp sequences', html.includes('Math.floor(tNow * SN_TV_FPS) % arr.length') && html.includes("padStart(3, '0') + '.webp'"), '');
chk('patch104: portrait box takes the frame aspect (107x90, speaking 149x126)', html.includes('.guide-portrait { width: 107px; height: 90px;') && html.includes('body.chief-speaking .guide-portrait { width: 149px; height: 126px; }'), '');

chk('patch105: TV registration sits after SN_IMGQ (no TDZ abort)', html.indexOf('SN_TV.imgs[clip] = []') > html.indexOf('const SN_IMGQ'), '');

chk('patch106: gauge text centred', html.includes('.mini-gauge .mg-label { font-size: 9px; color: #d7dee6; text-align: center;'), '');
chk('patch106: deck lifted 16px min', html.includes('padding-bottom: max(16px, env(safe-area-inset-bottom))'), '');
chk('patch107: no on-screen jump button', !html.includes("id: 'jump', cx: W - 56"), '');
chk('patch107: jump mechanic still wired', html.includes('const JUMP_SPEED = -380;') && html.includes('p.vy = JUMP_SPEED'), '');

chk('patch108: mini gauges are exactly two rows (no dial canvas)', !html.includes('id="dial-temp"') && !html.includes('class="mini-dial"'), '');

chk('patch109: watch-line spoken once', html.includes('SN_HELP._watchLineSeen'), '');
chk('patch109: cine played set tracked', html.includes('played: new Set()') && html.includes('state.played.add(item.key)'), '');
chk('patch109: re-offer dropped once_per_run', html.includes("dropped: 'once_per_run'"), '');
chk('patch109: fresh run clears the set', html.includes('SN_CINE.state.played.clear()'), '');

chk('patch110: sheet overlay canvas exists at z-900', html.includes('id="sheetCanvas"') && html.includes('z-index:900'), '');
chk('patch110: sheet enlarged (SHEET_H 440)', html.includes('const SHEET_H = 440;'), '');
chk('patch110: sheet header text white 16px', html.includes("ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'left';"), '');
chk('patch110: ctx swaps to overlay and back', html.includes('ctx = WORLD_CTX;'), '');

// ---- patch112/113/114 locks (Nov 26) ----
chk('patch112: SN_WASD module present with route()', html.includes('const SN_WASD = {') && html.includes('SN_WASD.route()'), '');
chk('patch112: WASD modes - panel freeze via freezeKeys in panel and hud modes', (html.match(/this\.freezeKeys\(\);/g) || []).length >= 4, '');
chk('patch112: bump-open uses SN_TOUCH.openPop from a WASD edge', html.includes('SN_TOUCH.openPop(hit)'), '');
chk('patch112: hold-repeat timing 380ms delay / 90ms interval / snap 250ms', html.includes('now - this._holdAt >= 380') && html.includes('now - this._holdFired >= 90') && html.includes('this._snapUntil = performance.now() + 250'), '');
chk('patch112+134: HUD strip is the cluster buttons (AUDIO/SFX replace SOUND)', html.includes("HUD_BTNS: ['helpBtn', 'mapBtn', 'audioBtn', 'cineBtn', 'sfxBtn', 'paceBtn', 'takeoverBtn']")   /* ship #25 */, '');
chk('patch112: splash element wired to splash-control-room.mp4, z-index above the title screen', html.includes('id="splashVideo" src="splash-control-room.mp4"') && html.includes('z-index:600'), '');
chk('patch112: splash is not a cinematic (no SN_CINE routing, no once-flag)', html.includes('no once-per-run flag, no SN_CINE'), '');
chk('patch113: auto-climb state on the player', html.includes('p.climbAuto === -1') && html.includes('p.climbAuto === 1') && html.includes('p.climbAutoWasOn'), '');
chk('patch113: auto-climb feeds the grab test and ladder velocity', html.includes("gpUp || p.climbAuto === -1") && html.includes("gpDown || p.climbAuto === 1"), '');
chk('patch113: demo/takeover driving never arms the auto-climb', html.includes('const drv113 ='), '');
chk('patch114: SN_UNITINFO per-unit first-pass / 3 s dwell rule', html.includes('const SN_UNITINFO = {') && html.includes('this.dwell[key] > 3') && html.includes('SN_UNITINFO.allow(item)'), '');
chk('patch114+136: info plate text is white at the larger sizes (label size is fit-driven since patch136)', html.includes("ctx.fillStyle = '#ffffff'; ctx.font = 'bold ' + labPx + 'px") && html.includes("ctx.font = valsPx94 + 'px"), '');

// ---- patch115/116/117 locks (Nov 26) ----
chk('patch115: map HUD element on the right side with a 4 s auto-dismiss', html.includes('id="mapHud"') && html.includes('right: 8px') && html.includes('setTimeout(closeMapHud, 4000)'), '');
chk('patch115: any pointerdown dismisses the map HUD', html.includes("window.addEventListener('pointerdown', mapHudTap, true)") && html.includes('function mapHudTap() { closeMapHud(); }'), '');
chk('patch115: the HUD hosts the live areas map node', html.includes("document.getElementById('mapHudBody').appendChild(areas)"), '');
chk('patch116: ladder bottom exit band (descent deadlock fix)', html.includes("downKey && !upKey && p.ladderLatch && ((p.y + p.h) >= lad.y + lad.h - 2"), '');
chk('patch116: the demo opens the pin panel at the operate transition', html.includes("SN_TOUCH.openPop(pin)") && html.includes('the demonstration OPENS the panel'), '');
chk('patch116: the demo panel closes in guideOff', html.includes("SN_TOUCH.closePop(); } catch (e) {}   // patch116: the demo's panel closes with the demo"), '');
chk('patch117: simplified scoring - step 100 clean / 50 assisted, level 250', html.includes('stepPoints += asst ? 50 : 100') && html.includes("const levelPoints = outcome === 'complete' ? 250 : 0"), '');
chk('patch117: old score machinery removed from endGame', !html.includes('transientPenalty') && !html.includes('smoothBonus') && !html.includes('adherencePct'), '');
chk('patch117: score screen auto-fades to the menu at 5 s', html.includes('window.__scoreFadeT = setTimeout') && html.includes('}, 5000); }') && html.includes('clearTimeout(window.__scoreFadeT);   // patch117'), '');

chk('patch119: SN_WASD reads its own held map (freezeKeys cannot erase a hold)', html.includes('held: { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }') && html.includes('this.held['), '');   // patch153 expected-update (B12/R153): the held map now carries the arrow family too — dual keyboard defaults
chk('patch120: WHMIS card rebuilt to the approved sample (amber header, diamond pictogram, severity strip)', html.includes('WHMIS_SEV') && html.includes('whmisPicWrap') && html.includes('SEVERITY:'), '');
chk('patch120: radiation header names the hazard in full as in the sample', html.includes("'IONIZING RADIATION'"), '');
chk('patch121: gauge pop-up suppressed while a demo runs (bottom gauges stay)', html.includes('snDemoActive121') && html.includes('if (snDemoActive121()) return;'), '');
chk('patch121b: demo detector uses the real state fields (showFollow / ASSIST.phase / DEMO.active)', html.includes('SN_HELP.showFollow') && html.includes("ASSIST.phase !== 'watch'"), '');
chk('patch122: demo operate hold ~5 s gates the step advance', html.includes('snDemoHold122') && html.includes('SHOWME.pendingAdvance') && html.includes('(SHOWME.opT || 0) < 5'), '');
chk('patch122c: handleInteraction rod advance respects the demo hold', html.includes('leverPct > 5 && !snDemoHold122()'), '');
// patch123 (QA finding): WebView text autosizing inflated fonts inside
// fixed-height boxes and clipped the STEP chip's second line on-device.
// Autosizing is off globally, and the step chip grows instead of clipping.
chk('patch123: text autosizing disabled', html.includes('text-size-adjust: 100%'), '');
chk('patch123: step chip grows, never clips', html.includes('#stepChip { height: auto; min-height: var(--sn-box-h);'), '');
// patch124: the steam tunnel + turbine hall Padma plates are composited
// (the Nov 26 completion report's last asset gap). Registered non-dev so
// they warm at load; drawn by drawAreaBg over the flat dressing; the
// wall-detail clip covers every ready plate. The control-room plate is a
// finished render in padma-renders/ but is not registered — the shipped
// world has no control-room area to composite it into.
chk('patch124: steam + turbine plates registered in the loader', html.includes("['steam', 'plates/steam_wide.webp'], ['turbine', 'plates/turbine_wide.webp']"), '');
chk('patch124: geomFor carries the measured floor fractions', html.includes("area === 'steam' ? 0.857 : 0.859") && html.includes('SN_PLATES.geomFor = function'), '');
chk('patch124: drawAreaBg draws the area plates', html.includes("if (areaType === 'reactor') drawReactorPlate(); else drawAreaPlate(areaType);"), '');
chk('patch124: wall detail clipped off every ready plate', html.includes('snClipX') && html.includes('if (snClipOn) ctx.restore();'), '');
chk('patch124b: pit strip starts at the floor fraction (no phantom floor line)', html.includes('im.naturalHeight * (1 - g.F)') && html.includes('F };'), '');
// patch125: recorded-sound SFX — every physical effect is a cut of a
// real CC0 / public-domain recording (SN_SAMP bank, data-URI mp3s like
// the plates); the modelled recipes remain as decode fallbacks.
chk('patch125: SN_SAMP bank embedded (25 recorded data-URI mp3s)', (html.match(/data:audio\/mpeg;base64/g) || []).length >= 25 && html.includes('const SN_SAMP'), '');
chk('patch125: SN_SFX plays recordings via playBuf with synth fallback', html.includes('function playBuf(') && html.includes("playBuf('switch'") && html.includes("playBuf('breaker'") && html.includes("playBuf('bell'"), '');
chk('patch125: loops + ambience run on recorded beds', html.includes('SN_BUF.pump_loop') && html.includes('SN_BUF.steam_loop') && html.includes('SN_BUF.rod_loop') && html.includes('SN_BUF.amb_turbine'), '');
chk('patch125: snTick + horn use the recorded bank; horn under the SOUND toggle', html.includes('SN_BUF.tick') && html.includes('SN_BUF.horn') && html.includes('CHIEF.muted) return;   // patch125: the SOUND toggle governs the horn'), '');
// patch126: soft volumetric steam — no single fixed silhouette:
// four seeded variants, rim envelope, per-particle rotation/spin.
chk('patch126: four seeded steam sprite variants', html.includes('const _steamSprites') && html.includes('mk(126001)') && html.includes('mk(126389)'), '');
chk('patch126: radial envelope zeroes alpha at the sprite rim', html.includes("globalCompositeOperation = 'destination-in'") && html.includes('createRadialGradient(64, 64, 10, 64, 64, 63)'), '');
chk('patch126: particles carry variant, rotation, spin, mirror', html.includes('spr: (Math.random() * 4) | 0') && html.includes('vr: (_sx >= 0 ? 1 : -1) * (0.2 + Math.random() * 0.4)') && html.includes('ctx.rotate(p.rot)'), '');
chk('patch126: variants warmed into the atlas before visible draw', html.includes('_steamWarmed') && html.includes('ctx.drawImage(sp, -9999, -9999, 1, 1)'), '');
// patch128: trackpad parity — the wheel channel (two-finger
// scroll) mapped onto the pointer composition; pinch suppressed.
chk('patch128: wheel channel registered non-passive on the game surface', html.includes("addEventListener('wheel'") && html.includes('passive: false'), '');
chk('patch128: pinch (ctrl+wheel) suppressed, not a game input', html.includes('if (e.ctrlKey) return;'), '');
chk('patch128: wheel rides the pointer composition (pad entry)', html.includes("pointers.set('pad'") && html.includes('window.SN_PAD'), '');
chk('patch128: panel scroll steps the open control; ladder scroll pulses auto-climb (patch128b: SN_WASD.fireStep + SN_TOUCH.pop)', html.includes('SN_WASD.fireStep') && html.includes("'ovl:up'") && html.includes('ladders.some'), '');
chk('patch128: context menu + Safari gesture events suppressed', html.includes("addEventListener('contextmenu'") && html.includes("addEventListener('gesturestart'"), '');

// ---- patch129: cinematic panel fade + lesson-end fade ----
chk('patch129: SN_TOUCH exports fadeClosePop', html.includes('openPop, closePop, fadeClosePop, reset'), '');
chk('patch129: the fade is 450 ms on the sheet canvas opacity', html.includes("sc.style.transition = 'opacity ' + dur + 'ms ease'") && html.includes('const dur = ms || 450;'), '');
chk('patch129: the fade releases any grab at fade start', html.includes('pop.grab = null; pop.holdFx = null;   // input is released at fade start'), '');
chk('patch129: a cinematic start fades an open panel out', html.includes('SN_TOUCH.fadeClosePop(); } catch (e) {}   // patch129'), '');
chk('patch129: step completion fades the panel away', html.includes('SN_TOUCH.fadeClosePop();   // patch129 (Kevin, Nov 26 ~10:11): step complete'), '');
chk('patch129: openPop cancels an in-flight fade', html.includes('clearTimeout(pop.fadeT); pop.fadeT = 0;   // patch129'), '');


// ---- patch130: game-end media stop ----
chk('patch130: one audited stop path exists', html.includes('function SN_STOP_ALL_MEDIA()'), '');
chk('patch130: endGame runs the stop first', html.includes('SN_STOP_ALL_MEDIA();   // patch130 (Kevin, Nov 26 ~10:12): game end stops'), '');
chk('patch130: quitToMenu runs the stop', html.includes('SN_STOP_ALL_MEDIA();   // patch130: quit-to-menu silences everything'), '');
chk('patch130+134: SFX stopAll zeroes every loop and latches update() (mute no longer an update gate)', html.includes('stopAll() {') && html.includes('if (!ac || halted) return;'), '');
chk('patch130: the stop covers cine + splash videos and the Chief voice', html.includes("getElementById('splashVideo')") && html.includes('CHIEF.audio.pause()') && html.includes('speechSynthesis.cancel()'), '');
chk('patch130: startGame lifts the latch', html.includes('SN_SFX.resume) SN_SFX.resume();   // patch130'), '');


// ---- patch131: Concept 1 "The Console" menu + Practice section ----
chk('patch131: brass nameplate wraps the title block', html.includes('class="nameplate"'), '');
chk('patch131: mimic board with annunciator lamp row', html.includes('class="mimic-board"') && html.includes('class="lamp-row"'), '');
chk('patch131: levels are backlit annunciator tiles (amber/gold/green)', html.includes('level-btn lvl1') && html.includes('level-btn lvl2') && html.includes('level-btn lvl3'), '');
chk('patch131: Practice section groups all three drills', html.includes('class="practice-panel"') && html.includes('<span>PRACTICE</span>') && html.indexOf('<span>PRACTICE</span>') < html.indexOf("startDrill('rod')") && html.indexOf("startDrill('level')") < html.indexOf('class="settings-strip"'), '');
chk('patch131: settings live in one strip, ids intact', html.includes('class="settings-strip"') && html.includes('id="modeBtn"') && html.includes('id="fxBtn"') && html.includes('id="hapBtn"') && html.includes('id="guidanceBtn"'), '');
chk('patch131: every drill handler survives exactly once', (html.match(/startDrill\('rod'\)/g) || []).length >= 1 && html.includes("startDrill('pressure')") && html.includes("startDrill('level')"), '');


// ---- patch132: camera research R1-R11 ----
chk('patch132 R2: a real dead zone gates focus movement', html.includes('function dzGoal132') && html.includes('dzGoal132(Z.fx, desX, dzHW)'), '');
chk('patch132 R3: one rate eases position and zoom', html.includes('camera.z += (zT - camera.z) * kf;'), '');
chk('patch132 R4: time-based lead, capped at 15% of view width', html.includes('(p.vx || 0) * 0.3') && html.includes('0.15 * vw0'), '');
chk('patch132 R5: free vertical follow only while climbing', html.includes('p.onLadder ? 0 : vh *'), '');
chk('patch132 R6: zoom is a state machine with entry/exit hysteresis', html.includes("Z.state = popOpen ? 'operate' : 'approach'") && html.includes('dist > 680'), '');
chk('patch132 R6: operating freezes the focus dead steady', html.includes("if (Z.state === 'operate') { gx = Z.fx; gy = Z.fy; }"), '');
chk('patch132 R7: follow frames the weighted two-subject average', html.includes('ccx * 0.62 + pcx * 0.38'), '');
chk('patch132 R9: Reduce Camera Motion toggle + persistence', html.includes('function cycleCamMotion()') && html.includes("localStorage.setItem('sn.camMotion'") && html.includes('id="camBtn"'), '');
chk('patch132 R11: debug overlay draws state/dead zone/lead', html.includes('function snCamDebugDraw') && html.includes("'CAM ' + Z.state"), '');


// ---- patch133: unit labels plain white, bare, centred above ----
chk('patch133: world labels are white bare letters above the unit', html.includes("ctx.fillStyle = '#ffffff';\n  ctx.font = '7px Courier New';") && html.includes('item.y - 15 - (ANNUN_DEFS[item.action] ? 17 : 0) - (lines.length - 1 - i) * 9'), '');
chk('patch133: no gold near-state label colour remains', !html.includes("isNear ? '#ffd700' : '#8aa8c0'"), '');
chk('patch133: the plate fill/border paint is gone', !html.includes("ctx.fillRect(item.x + 3, item.y + item.h - labelH - 3"), '');
chk('patch133: schematic tag is white', html.includes("ctx.fillStyle = '#ffffff'; ctx.font = 'bold 6px"), '');
chk('patch133: map unit labels have no backing rect and use white text', !html.includes('fill="#1d2c3e" stroke="#5a7a9a"') && html.includes('fill="#ffffff" font-size="5.2"'), '');

// ---- patch134: AUDIO + SFX toggles ----
chk('patch134: AUDIO and SFX buttons sit immediately left of MENU', (() => { const a = html.indexOf('id="audioBtn"'), s = html.indexOf('id="sfxBtn"'), m = html.indexOf('id="menuBtn"'); return a > 0 && s > a && m > s; })());
chk('patch134: the old SOUND button is gone from the guide row', !html.includes('id="chiefMute"'));
chk('patch134: SN_AUDIO persists two independent toggles', html.includes("const SN_AUDIO = { audio: true, sfx: true, cine: true };")   /* ship #25 */ && html.includes("localStorage.getItem('sn.audio')") && html.includes("localStorage.getItem('sn.sfx')"));
chk('patch134: beds and music route through the AUDIO bedBus', html.includes('g.connect(bedBus || master)') && html.includes('musicGain.connect(bedBus || master)'));
chk('patch134: setAudioOn gates the bedBus', html.includes('setAudioOn(on) { if (bedBus && ac)'));
chk('patch134: SFX mute no longer freezes the beds in update()', html.includes('if (!ac || halted) return;'));
chk('patch134: cinematic audio follows the AUDIO toggle', html.includes('vel.muted = !(window.SN_AUDIO && SN_AUDIO.audio);'));
chk('patch134: control cluster scaled ~20% up', html.includes('#stepBar button, #touchModeBtn, #demoBtn { height: 58px; font-size: 19px; }'));
chk('patch134: toggleSfx keeps CHIEF.muted as the SFX gate', html.includes('CHIEF.muted = !SN_AUDIO.sfx;'));

// ---- patch135: ghost ladder registration ----
chk('patch135: snSyncPlateLadder registers the zone from the plate geometry', html.includes('function snSyncPlateLadder()') && html.includes('(192 / 2048) * g.pw'));
chk('patch135: buildWorld syncs the plate ladder zone', html.includes('snSyncPlateLadder();   // patch135: register the zone onto the painted ladder at THIS H'));
chk('patch135: the reactor plate draw re-syncs every frame', html.includes('snSyncPlateLadder();   // patch135: keep the climb zone on the painted ladder at any aspect'));

// ---- patch136: unit pop-up fit / placement / dwell-only ----
chk('patch136: dwell is the only pop-up trigger (no first-pass show)', !html.includes('if (!this.seen[key]) { this.seen[key] = 1; return true; }') && html.includes('return this.dwell[key] > 3;'));
chk('patch136: pop-up width is measured from the text, not fixed', html.includes('need94 = ctx.measureText(label94).width') && html.includes('Math.ceil(need94) + 12'));
chk('patch136: an over-wide label shrinks its font to fit', html.includes('while (need94 > capW94 - 12 && labPx > 7)'));
chk('patch136: placement follows the player floor (above at main, below on top levels)', html.includes('pFloor94 === 0 ? item.y - ph94 - 4 : item.y + item.h + 4'));

// ---- patch137: Shift Log scorecard ----
chk('patch137: score screen is the Shift Log paper card', html.includes('class="score-content shiftlog"') && html.includes('<div class="sl-title">SHIFT LOG</div>'));
chk('patch137: huge ink total + two summary lines only', html.includes('id="slTotal"') && html.includes('id="slSteps"') && html.includes('id="slAssisted"') && !html.includes('id="scoreTable"'));
chk('patch137: stamps — PASSED / SAFE SHUTDOWN / SHIFT ENDED', html.includes("stamp137.textContent = 'PASSED'") && html.includes("stamp137.textContent = 'SAFE SHUTDOWN'") && html.includes("stamp137.textContent = 'SHIFT ENDED'"));
chk('patch137: the itemised score table build is gone', !html.includes("['OVERALL SCORE', score + '']"));

// ---- patch138: buttons are navigation/action only ----
chk('patch138: the 850 ms hold-to-summon timer is gone', !html.includes('if (ASSIST.summon()) { SN_SFX.uiOpen();'));
chk('patch138: snHelpPress is reached only from the SHOW button', (html.match(/snHelpPress\(\)/g) || []).length <= 3 && html.includes('id="helpBtn" onclick="snHelpPress()"'));

// ---- patch141: RPV local panel v2 (approved) — cold / at-power faces ----
chk('patch141: at-power panel face is registered in SN_PLATES', html.includes("['panel_hot', 'plates/panel_rpv_hot.webp']"));
chk('patch141: snPanelImg picks the face from live power', html.includes('function snPanelImg()') && html.includes('physics.power_pct >= 1'));
chk('patch141: world cabinet face draws through snPanelImg', html.includes("item.id === 'local_panel' && snPanelImg()") && html.includes('const pim = snPanelImg()'));
chk('patch141: check_readings sheet backing uses the state face', html.includes("if (k === 'panel') return snPanelImg();") && html.includes("check_readings: 'panel'"));
chk('patch141: drawn-instrument fallback only when no v2 face is ready', html.includes("(item.id === 'local_panel' && !snPanelImg())"));


// ---- patch142: menu + scorecard on Kevin's exact sample artwork ----
chk('patch142: menu stage wraps the title screen and carries the Concept 1 plate', html.includes('class="menu-stage"') && html.includes("url('menu-console.webp')"));
chk('patch142: code-drawn menu visuals retire but stay in the DOM', html.includes('#titleScreen .nameplate, #titleScreen .mimic-board') && html.includes('class="nameplate"') && html.includes('class="mimic-board"'));
chk('patch142: level + demo controls stay live over the painted tiles', html.includes('onclick="startGame(1)"') && html.includes('onclick="startDemo()"') && html.includes('#titleScreen .level-row .level-btn'));
chk('patch142: drills stay live over the painted practice buttons', html.includes("startDrill('rod')") && html.includes('#titleScreen .drill-row .level-btn'));
chk('patch142: all five settings toggles stay live in the strip', html.includes('id="modeBtn"') && html.includes('id="camBtn"') && html.includes('#titleScreen .settings-strip .level-btn'));
chk('patch142: scorecard stage is the text-free Shift Log painted base', html.includes("url('scorecard-shiftlog.webp')") && html.includes('class="score-content shiftlog"'));
chk('patch142: score text stays live at the compositor coordinates', html.includes('id="slTotal"') && html.includes('font-size: 21.30cqw') && html.includes('id="slStamp"'));
chk('patch142: SAFE SHUTDOWN stamp takes the long-text size class', html.includes("stamp137.className = 'sl-stamp long'"));
chk('patch142: restart + checkpoint actions survive under the clipboard', html.includes('class="sl-actions"') && html.includes('id="restartBtn"') && html.includes('id="ckptBtn"'));


// ---- patch144 (fix ship #20): D1 / D2 / step-count / attract 1x / D5 ----
chk('patch144 D1: panel-mode A/D hold synthesizes the operate edge for tap-class actions', html.includes("if (heldNow && !this._opEdge) { this._opEdge = true;") && html.includes("keysJustPressed['KeyE'] = true; }"), '');
chk('patch144 D1: operate latch resets on release and in the close/stepper branches', html.includes("if (!heldNow) this._opEdge = false;") && html.includes("INPUT.operate = false; this._opEdge = false;"), '');
chk('patch144 D2: WORLD_H declared and recorded by buildWorld', html.includes('let WORLD_H = 0;') && html.includes('WORLD_H = bh;'), '');
chk('patch144 D2: deck anchor is measured against WORLD_H, never the live H', html.includes('function snDeckAnchor()') && html.includes('return p.y / WORLD_H;') && html.includes('const oldH = WORLD_H, feetFrac = WORLD_H > 0'), '');
chk('patch144 D2: deckRelayout re-seats through the shared helper', html.includes('if (frac !== null) { snDeckReseat(frac); }'), '');
chk('patch144 step-count: the final step is counted at BOTH completion branches', (html.split('advanceProcedure(PROCEDURE_STEPS.length)').length - 1) === 2, 'count=' + (html.split('advanceProcedure(PROCEDURE_STEPS.length)').length - 1));
chk('patch144 attract: paceTick pins the hands-off demo to 1x (no AUTO boost)', html.includes("if (typeof DEMO !== 'undefined' && DEMO.active) { SN_PACE.kind = 0; SN_PACE.effective = 1;"), '');
chk('patch144 attract: the SN_PACE pure block is untouched (boost policy for the player intact)', html.includes('return Math.max(s.player, kind === 2 ? SN_PACE.GRID_FLOOR : SN_PACE.AUTO);'), '');
chk('patch144 D5: the procedure pop-up sits in the pop-up layer (z-900)', html.includes('display: none; z-index: 900;'), '');
chk('patch144 D5: the step-bar lift over an open pop-up is gone', !html.includes("bar.style.zIndex = procedureOpen ? '60' : '';"), '');


// ---- patch145 (fix ship #20, fix #6): SFX + Chief voice muted on every load ----
chk('patch145: the boot force-mute line is present', html.includes('SN_AUDIO.sfx = false;   // patch145'), '');
chk('patch145: the force runs AFTER the persisted SFX read (it overrides the stored toggle)', html.indexOf('SN_AUDIO.sfx = false;') > html.indexOf("SN_AUDIO.sfx = localStorage.getItem('sn.sfx')"), '');
chk('patch145: AUDIO keeps its persisted behaviour — read intact, no force-off anywhere', html.includes("SN_AUDIO.audio = localStorage.getItem('sn.audio') !== 'off';") && !html.includes('SN_AUDIO.audio = false;'), '');
chk('patch145: the Chief voice gate still derives from the SFX state', html.includes('muted: !SN_AUDIO.sfx,'), '');
chk('patch145: the SFX toggle still unmutes in-session and the button label reads SN_AUDIO.sfx', html.includes('SN_AUDIO.sfx = !SN_AUDIO.sfx;') && html.includes("'SFX: ' + (SN_AUDIO.sfx ? 'ON' : 'OFF')"), '');
const _ai = html.indexOf('const SN_AUDIO = { audio: true, sfx: true, cine: true };');
const _aj = html.indexOf('window.SN_AUDIO = SN_AUDIO;', _ai);
function snAudioBoot(store) {
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: () => {} };
  return new Function('localStorage', 'window', html.slice(_ai, _aj + 'window.SN_AUDIO = SN_AUDIO;'.length) + '\nreturn SN_AUDIO;')(ls, {});
}
chk('patch145 boot (functional): stored SFX ON still boots muted, stored AUDIO ON stays on', (() => { const a = snAudioBoot({ 'sn.sfx': 'on', 'sn.audio': 'on' }); return a.sfx === false && a.audio === true; })(), '');
chk('patch145 boot (functional): stored AUDIO OFF stays off, SFX boots muted', (() => { const a = snAudioBoot({ 'sn.audio': 'off', 'sn.sfx': 'on' }); return a.audio === false && a.sfx === false; })(), '');
chk('patch145 boot (functional): first-ever load (nothing stored) boots SFX muted, AUDIO on', (() => { const a = snAudioBoot({}); return a.sfx === false && a.audio === true; })(), '');


// ---- patch143: realistic steam — SN_GL mode-5 noise erosion + domain warp ----
chk('patch143: fragment shader carries the mode-5 steam branch', html.includes('vMode > 4.5') && html.includes('SN_FragColor = vec4(col * a, a); return; }'));
chk('patch143: erosion rises over life against the noise-shaped density', html.includes('pow(vGrad.x, 1.3)') && html.includes('smoothstep(erosion, erosion + 0.22, shape)') && html.includes('float shape = base * (0.16 + 1.20 * sn);'));
chk('patch143: two-scale scrolling noise with domain warp', html.includes('-vGrad.y * 0.055') && html.includes('-vGrad.y * 0.13') && html.includes('warp * 0.55'));
chk('patch143: late life dissolves by erosion alone (no ridge term — it read as scratch lines in the prototype)', html.includes('mix(-0.05, 0.88, pow(vGrad.x, 1.3))') && !html.includes('float ridge'));
chk('patch143: tileable FBM noise generated at load, opaque canvas', html.includes('const _steamNoise') && html.includes('mkLattice') && html.includes('d[k + 3] = 255;'));
chk('patch143: noise shelf warmed into the atlas before visible draw', html.includes('ctx.drawImage(_steamNoise, -9999, -9999, 1, 1)'));
chk('patch143: shim drawImage emits mode 5 from ctx.snSteam', html.includes('var st5 = this.snSteam;') && html.includes('col.mode = 5;') && html.includes('reg, col.mode, p1.ux'));
chk('patch143: aGReg.w carries the noise rect v1', html.includes('b[o + 22] = greg.v1 || 0;'));
chk('patch143: atlas region getter exposed for the noise shelf', html.includes('regionOf: function (src)'));
chk('patch143: game sets and clears snSteam per particle with density tint', html.includes('ctx.snSteam = { u: u, age: p.age') && html.includes('ctx.snSteam = null;') && html.includes('tint: [1 - 0.22 * u, 1 - 0.16 * u, 1 - 0.08 * u]'));
chk('patch143: jets carry the density bias flag', html.includes('jet: 1,') && html.includes('density: p.jet ? 1.3 : 1.0'));
chk('patch143: roll-up spin by emitter side, both spawns', html.includes('vr: (_sx >= 0 ? 1 : -1) * (0.2 + Math.random() * 0.4)') && html.includes('vr: (_jsx >= 0 ? 1 : -1) * (0.2 + Math.random() * 0.4)'));
chk('patch143: curl-flavoured drift replaces the private sine sway', html.includes('Math.sin(p.y * 0.013 + _steamT * 0.4)') && !html.includes('Math.sin(p.age * 1.7 + (p.seed || 0)) * 7'));
chk('patch143: STEAM_FX exposes mode-5 state for the locks', html.includes('mode5: () => ({ on: !!_steamNoiseReg') && html.includes('noise: _steamNoise,'));
chk('patch143: noise tile has a wrapped gutter and the shader samples the inner rect', html.includes('const PAD = 16, CS = S2 + PAD * 2;') && html.includes('(16 / 288)'));
chk('patch143: emission pulses irregularly, never a constant rate (Kevin shape rule)', html.includes('const _pulse = (ph) =>') && html.includes('90 * j.k * _jp * dt') && html.includes('(0.75 + 0.25 * Math.sin(_steamT * 0.9)'));
chk('patch143: jets leave a point — tiny spawns, fast narrow cone (Kevin shape rule)', html.includes('const jr0 = 2 + Math.random() * 2.5;') && html.includes('const _jvy = -(300 + Math.random() * 160)') && html.includes('(Math.random() - 0.5) * 0.24 * (-_jvy)'));
chk('patch143: jet radius grows with distance travelled — entrainment cone (Kevin shape rule)', html.includes('6 + 0.26 * Math.hypot(p.vx, p.vy) + 0.45 * p.r'));
chk('patch143: per-particle aspect breaks the clean disc (Kevin shape rule)', html.includes('if (p.sqx) ctx.scale(p.sqx, p.sqy);') && html.includes('thin: 0.45'));
chk('patch143: noise atlas cell claimed at load; WHITE fallback rejected as a noise source', html.includes('const _snRegInset = (r) =>') && html.includes('(r[2] - r[0]) > 0.01'));


// ---- patch146 (ship #22): Kevin's edge treatment — fence asset + sample-2 hatch + Chief stop ----
chk('patch146: fence + hatch plates registered', html.includes("['fence', 'plates/fence_end.webp']") && html.includes("['hatch', 'plates/hatch_strip.webp']"), '');
chk('patch146: fence height is the waist rule — SN_FENCE_H = 32 (half of Fluke h=64)', html.includes('const SN_FENCE_H = 32;'), '');
chk('patch146: the fence draws from the asset at railed ends, over the deck (end of drawPlatform)', html.includes('function snDrawFenceEnds(plat)') && html.includes('SN_PLATES.imgs.fence') && html.includes('snDrawFenceEnds(plat);'), '');
chk('patch146: the old yellow rail is gone from drawPlatform (no railBar, no mustard fill)', !html.includes('railBar') && !html.includes("fillStyle = '#c9a227'"), '');
chk('patch146: drawWarningStripe is asset-driven; the old yellow stripe colours are gone', html.includes('SN_PLATES.imgs.hatch') && !html.includes('rgba(180,160,0,0.25)') && !html.includes("'#1a1a00'"), '');
chk('patch146: the stripe fallback paints the measured swatch colours (#f27f32 / #1d1d1d)', html.includes("'#f27f32'") && html.includes("'#1d1d1d'"), '');
chk('patch146: the Chief gets the same rail stop (snChiefRailClamp, centre terms, wired into chiefWalkTo)', html.includes('function snChiefRailClamp()') && html.includes('snChiefRailClamp();') && html.includes('plat.x + plat.w - 13'), '');
chk('patch146: the player rail clamp (patch98) is untouched', html.includes('if (plat.railR) railMaxX = Math.min(railMaxX, plat.x + plat.w - p.w);') && html.includes('if (plat.railL) railMinX = Math.max(railMinX, plat.x);'), '');
const _ws = html.indexOf('function drawWarningStripe');
const _we = html.indexOf('\nfunction ', _ws + 10);
function stripeCalls(ready, w, h) {
  const calls = [];
  const fakeCtx = { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fill() {}, fillRect() { calls.push(['rect']); }, moveTo() {}, lineTo() {}, translate() {}, rotate() {}, drawImage() { calls.push(['img']); },
    set fillStyle(v) { calls.push(['fill', v]); }, get fillStyle() { return ''; } };
  const fn = new Function('ctx', 'SN_PLATES', html.slice(_ws, _we) + '\nreturn drawWarningStripe;')(fakeCtx, { ready: { hatch: ready }, imgs: { hatch: { width: 828, height: 128 } } });
  fn(0, 0, w, h);
  return calls;
}
chk('patch146 stripe (functional): fallback paints the swatch orange and never the old yellow', (() => { const c = JSON.stringify(stripeCalls(false, 250, 6)); return c.includes('#f27f32') && c.includes('#1d1d1d') && !c.includes('180,160,0'); })(), '');
chk('patch146 stripe (functional): asset path tiles the hatch image when ready (horizontal + vertical runs)', (() => { const a = stripeCalls(true, 250, 6), b = stripeCalls(true, 10, 30); return a.filter(c => c[0] === 'img').length >= 6 && b.some(c => c[0] === 'img'); })(), '');


// ---- patch148 (ship #24): dwell > 3 s opens the readings sheet ----
// Functional dwell locks: extract SN_UNITINFO and drive allow(item, t)
// with synthetic timestamps (100 ms frames, the suite's own dt idiom).
const _ui = html.indexOf('const SN_UNITINFO = {');
const _uj = html.indexOf('window.SN_UNITINFO = SN_UNITINFO;', _ui);
function snUnitInfo() {
  return new Function('window', html.slice(_ui, _uj + 'window.SN_UNITINFO = SN_UNITINFO;'.length) + '\nreturn SN_UNITINFO;')({});
}
const _itA = { area: 'a', action: 'x', x: 100 };
const _itB = { area: 'a', action: 'x', x: 200 };
chk('ship24 dwell (functional): closed at <=3 s of continuous presence, open at >3 s', (() => {
  const U = snUnitInfo(); let r = true;
  for (let k = 0; k < 30; k++) r = U.allow(_itA, 10000 + k * 100);   // 3.0 s accumulated
  return r === false && U.allow(_itA, 13000) === true;               // 3.1 s crosses
})(), '');
chk('ship24 dwell (functional): dwell is per-unit — alternating units never sum', (() => {
  const U = snUnitInfo(); let ra = true, rb = true;
  for (let k = 0; k < 40; k++) { const it = k % 2 ? _itB : _itA; const r = U.allow(it, 10000 + k * 100); if (k % 2) rb = r; else ra = r; }
  return ra === false && rb === false;   // 4 s elapsed, each unit only 2.0 s
})(), '');
chk('ship24 dwell (functional): absence >600 ms resets the unit dwell to zero', (() => {
  const U = snUnitInfo();
  for (let k = 0; k < 20; k++) U.allow(_itA, 10000 + k * 100);       // 2.0 s banked
  const r = U.allow(_itA, 12900 + 1000);                             // return after 1 s away
  return r === false && Math.abs(U.dwell['a:x:100'] - 0.1) < 1e-9;
})(), '');
chk('ship24 dwell (functional): a single 5 s timestamp jump cannot open (frame-dt clamp + reset)', (() => {
  const U = snUnitInfo();
  U.allow(_itA, 10000);
  return U.allow(_itA, 15000) === false && U.dwell['a:x:100'] <= 0.1 + 1e-9;
})(), '');
// Sheet-open wiring (drawEquipment — string locks; the draw path is not
// extractable in the suite's idiom): exactly one dwell-driven openPop,
// latched per unit, re-armed on reset and on target change, and gated
// against pop-open / non-playing / cinematic / demo / takeover.
chk('ship24 dwell: the sheet opens exactly once from the dwell branch (single openPop(item) site)', (html.match(/SN_TOUCH\.openPop\(item\)/g) || []).length === 1 && html.includes('SN_TOUCH.openPop(item); }'), '');
chk('ship24 dwell: the dwell-open is latched per unit (_openedKey guard on key148)', html.includes('SN_UNITINFO._openedKey !== key148') && html.includes('SN_UNITINFO._openedKey = key148; SN_TOUCH.openPop(item);'), '');
chk('ship24 dwell (patch154): a dwell reset does NOT clear the latch — the presence tracker owns it; the Edit-1 backstop clear is gone (supersedes the patch148 lock)', html.includes('if (now - (this.at[key] || 0) > 600) this.dwell[key] = 0;') && !html.includes('if (this._openedKey === key) this._openedKey = null;'), '');
chk('ship24 dwell: the PRESENCE tracker exists exactly once (key148 / _nearKey / _nearSince / _nearLast)', (html.match(/const key148 = item\.area/g) || []).length === 1 && html.includes('SN_UNITINFO._nearKey = key148; SN_UNITINFO._nearSince = now148;') && html.includes('SN_UNITINFO._nearLast = now148;'), '');
chk('ship24 dwell (patch154): presence fully clears ONLY on >5000 ms absence expiry — tracking, bank, segment, absence and latch zeroed together (supersedes the patch148 >600 ms absence-clear lock)', html.includes('SN_UNITINFO._nearKey = null; SN_UNITINFO._nearSince = 0; SN_UNITINFO._acc154 = 0; SN_UNITINFO._seg154 = null; SN_UNITINFO._away154 = null; if (SN_UNITINFO._openedKey === key148) SN_UNITINFO._openedKey = null;'), '');
chk('ship24 dwell: switching units restarts presence and clears the previous unit latch', html.includes('if (SN_UNITINFO._nearKey !== key148) { if (SN_UNITINFO._openedKey === SN_UNITINFO._nearKey) SN_UNITINFO._openedKey = null;'), '');
chk('ship24 dwell (patch154): the sheet fires at pres154 >= 1200 accumulated presence, latch set before openPop (supersedes the patch148 >3000 ms fire lock)', html.includes('if (pres154 >= 1200 &&') && html.includes('SN_UNITINFO._openedKey = key148; SN_TOUCH.openPop(item); }'), '');
chk('ship24 dwell: sheet never opens during demo/cinematic/takeover, over an open pop, or when not standing at the panel', html.includes("gameState.phase === 'playing'") && html.includes('CINE_ACTIVE') && html.includes('DEMO.active') && html.includes('TAKEOVER.active') && html.includes('SN_UNITINFO._openedKey !== key148'), '');


// ---- patch149 (ship #24): in-canvas text supersample ----
chk('ship24 text: GLYPH_SS supersample factor is 2, with the px-scaling font helper', html.includes('var GLYPH_SS = 2;') && html.includes('function glyphSSFont(font)'), '');
chk('ship24 text: getGlyph rasterizes with the SS font and stores ss on the glyph record', html.includes('var ssFont = glyphSSFont(font);') && html.includes('adv: adv, ss: ss, w: w, h: h, pad: pad, baselineOff: baselineOff,'), '');
chk('ship24 text: fillText total width divides each advance back by ss', html.includes('total += g.adv / (g.ss || 1);'), '');
chk('ship24 text: fillText quad origin and size divide pad / baselineOff / w / h by gss', html.includes('var x0 = penX - gl2.pad / gss, y0 = baseline - gl2.baselineOff / gss;') && html.includes('this._pt(x0 + gl2.w / gss, y0 + gl2.h / gss)'), '');
chk('ship24 text: fillText pen advance divides back by gss', html.includes('penX += gl2.adv / gss;'), '');


// ---- patch151 (ship #24): press-time input sync in both tRole branches ----
chk('ship24 hold: live pointerdown tRole branch syncs input at press time', html.includes('if (tRole) { pointers.set(e.pointerId, { role: tRole, startY: e.clientY, startX: e.clientX, dir: 0, t: performance.now() }); syncPointerInput();'), '');
chk('ship24 hold: snxReplayDown tRole branch syncs input at press time (replay twin)', html.includes('if (tRole) { pointers.set(q.id, { role: tRole, startY: 0, startX: 0, dir: 0, t: performance.now() }); syncPointerInput();'), '');


// ---- patch152 (ship #24): camera fit guarantee in approach ----
chk('ship24 camera: approach span is recomputed from the CURRENT Fluke-panel span each frame', html.includes('const spanX152 = dist + tgt.w / 2 + p.w / 2 + 56;') && html.includes('const spanY152 = Math.abs(tcy - pcy) + tgt.h / 2 + p.h / 2 + 56;'), '');
chk('ship24 camera: the approach REFIT glides the captured hold DOWN to the current-span fit, monotonic (removing the refit breaks this lock)', html.includes('const fit152 = snFitZ(maxZ, spanX152, spanY152); if (fit152 < Z.zHold) Z.zHold = fit152;'), '');
chk('ship24 camera: a span that cannot fit even at the MIN_FIT floor exits approach to wide', html.includes('if (spanX152 > W / SN_ZOOM.MIN_FIT || spanY152 > H / SN_ZOOM.MIN_FIT) exit152 = true;') && html.includes("if (exit152) { Z.state = 'wide'; Z.holdTgt = null; }"), '');
chk('ship24 camera: the refit/floor-exit never runs while a pop is open (operate keeps its captured zoom dead steady)', html.includes('let exit152 = false;') && html.includes('if (!popOpen) {'), '');
chk('ship24 camera: the focus-goal safety clamp exists, approach ONLY, bounds tightened by half sprite + lag allowance', html.includes("if (Z.state === 'approach') {") && html.includes('const limX152 = Math.max(0, vw * 0.48 - p.w / 2 - Math.abs(p.vx || 0) / rate);') && html.includes('gx = Math.max(pcx - limX152, Math.min(pcx + limX152, gx));'), '');


// ---- patch153 (ship #24): dual keyboard families + 170 ms press latch ----
chk('ship24 keyboard: the KB latch map exists and every keydown stamps it +170 ms (the padHold idiom)', html.includes('const KB_LATCH = {};') && html.includes('KB_LATCH[e.code] = performance.now() + 170;'), '');
chk('ship24 keyboard: SN_WASD held map carries its own latch and kbHeld() reads held OR unexpired latch', html.includes('heldLatch: {},') && html.includes('kbHeld(c) { return !!(this.held[c] || (this.heldLatch[c] || 0) > performance.now()); }'), '');
chk('ship24 keyboard: mergeInput composes keys from KB + latch (kbEff153), WASD levels included', html.includes('const kbEff153 = c => !!(KB[c] || (KB_LATCH[c] || 0) > kbNow153);') && html.includes("keys['KeyW'] = kbEff153('KeyW');"), '');
chk('ship24 keyboard: the panel engagement rule is pop.grab OR panelFocus primary (153/B12, pre-existing flags)', html.includes("const engaged153 = !!pop.grab || this.panelFocus === 'primary';"), '');
chk('ship24 keyboard: HUD branch — ArrowUp/Down navigate and exit exactly as KeyW/KeyS', html.includes("if (jp['KeyW'] || jp['ArrowUp']) this.setHudFocus((this.hudIdx + n - 1) % n);") && html.includes("if (jp['KeyS'] || jp['ArrowDown']) { if (this.hudIdx === n - 1) { this.setHudFocus(-1); this.freezeKeys(); return; }"), '');
chk('ship24 keyboard: world bump-open fires on ArrowLeft/Right exactly as KeyA/KeyD', html.includes("jp['KeyA'] || jp['KeyD'] || jp['ArrowLeft'] || jp['ArrowRight']) && typeof SN_TOUCH !== 'undefined'"), '');
chk('ship24 keyboard: preventDefault armour covers Arrow*/Space only, and never a modified shortcut', html.includes("if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.code === 'Space' || e.code.startsWith('Arrow'))) e.preventDefault();"), '');


// ---- patch154 (ship #24): dwell rebuild — accumulated presence, 1200 ms fire, radial progress ----
chk('ship24 dwell154: presence is banked on the first away frame (pause-not-reset accumulator)', html.includes('SN_UNITINFO._acc154 = (SN_UNITINFO._acc154 || 0) + (now148 - SN_UNITINFO._seg154);'), '');
chk('ship24 dwell154: pres154 is the authoritative presence — bank + live segment for the tracked unit, else 0', html.includes('const pres154 = SN_UNITINFO._nearKey === key148 ? (SN_UNITINFO._acc154 || 0) + (SN_UNITINFO._seg154 != null ? now148 - SN_UNITINFO._seg154 : 0) : 0;'), '');
chk('ship24 dwell154: visible progress starts at the 200 ms onset with fill = clamp((pres154 - 200) / 1000, 0, 1)', html.includes('if (pres154 >= 200) {') && html.includes('const frac154 = Math.min(1, Math.max(0, (pres154 - 200) / 1000))'), '');
chk('ship24 dwell154: the progress ring is panel-blue while filling and hold-green at full', html.includes("frac154 >= 1 ? '#37d67a' : '#5af'"), '');


// ---- patch155 (ship #24): freeze-while-adjusting, L3 grid emergency (amended #2) ----
chk('ship24 freeze: the SN_FREEZE record exists (active / used / heldSec)', html.includes('const SN_FREEZE = { active: false, used: false, heldSec: 0 };'), '');
chk('ship24 freeze: the emergency window is L3 grid phase, no scram, turbine event warning or trip in progress', html.includes("gameState.level === 3 && gameState.phase === 'playing' && S.phase === 'grid' && !S.scram") && html.includes('(S.ev.tu === 1 || S.ev.tu === 2)'), '');
chk('ship24 freeze: DEMO and TAKEOVER hands never freeze the sim', html.includes("if (typeof DEMO !== 'undefined' && DEMO.active) return false;") && html.includes("if (typeof TAKEOVER !== 'undefined' && TAKEOVER.active) return false;"), '');
chk('ship24 freeze: the sheet pop getter exposes tgt — a committed target still travelling holds the freeze', html.includes('tgt: (pop.target.lever != null || pop.target.bypass != null)'), '');
chk('ship24 freeze: gameLoop skips the sim feed while frozen', html.includes('if (!SN_FREEZE.active) updatePhysics(simDt, true);'), '');
chk('ship24 freeze: the run clock is held too — elapsedSec does not advance while frozen', html.includes('if (!SN_FREEZE.active) gameState.elapsedSec += dt;'), '');
chk('ship24 freeze: the player is told time is held (TIME HELD pill)', html.includes('id="fzPill"') && html.includes("fp.textContent = 'TIME HELD"), '');
chk('ship24 freeze (F3 amendment #2): the flat per-run SN_FREEZE reset occurs EXACTLY ONCE (snxResetRun only — snxRestore is value-aware, not a flat reset)', (html.match(/SN_FREEZE\.active = false; SN_FREEZE\.used = false; SN_FREEZE\.heldSec = 0;/g) || []).length === 1, '');
chk('ship24 freeze (F3 amendment #2): snxRestore applies the snapshot freeze record (value-aware restore, not a flat reset)', html.includes('SN_FREEZE.active = false; SN_FREEZE.used = !!(c.fz && c.fz.used); SN_FREEZE.heldSec = (c.fz && c.fz.heldSec) || 0;'), '');
chk('ship24 freeze (F3 amendment #2): snxSnapshot captures the freeze record (fz carries used / heldSec)', html.includes('fz: { used: SN_FREEZE.used, heldSec: SN_FREEZE.heldSec }'), '');


// ---- patch156 (ship #24): input plumbing armour + INPUT action-layer fields ----
chk('ship24 plumbing: iOS touch-callout is disabled in BOTH CSS armour rules (html,body and #gameCanvas)', (html.match(/-webkit-touch-callout: none/g) || []).length === 2, '');
chk('ship24 plumbing: the #gameCanvas rule carries user-select armour beside touch-action', html.includes('#gameCanvas { touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;'), '');
chk('ship24 plumbing: INPUT carries the named-action interact fields (patch158 wires the writers)', html.includes('tapAltPulse: false, interact: false, interactPulse: false };'), '');
chk('ship24 plumbing: AudioContext resumes at the head of the canvas pointerdown handler (never creates a context)', html.includes("try { if (AUDIO_CTX && AUDIO_CTX.state === 'suspended') AUDIO_CTX.resume(); } catch (err) {}"), '');
chk('ship24 plumbing: the gesture guard covers #gameContainer (a pinch starting on a DOM button is guarded)', html.includes("document.getElementById('gameContainer')]) {"), '');
chk('ship24 plumbing: #sheetCanvas carries touch-action:none (defence in depth)', html.includes('display:none;touch-action:none'), '');


// ---- patch157 (ship #24): segmented touch movement zone ----
chk('ship24 touchzone: SN_TOUCH.down routes through zoneSectorAt (same ovl:<id> role strings as the old circles)', html.includes('const btn = zoneSectorAt(x, y);'), '');
chk('ship24 touchzone: the zone functions are exported on SN_TOUCH', html.includes('drawSheet, drawOverlay, zoneSectorAt, zoneRects, zoneInDeadStrip, openPop,'), '');
chk('ship24 touchzone: pointermove re-routes ovl:* pointers by LIVE sector, with the 12 px dead strip at the split', html.includes("if (p.role.startsWith('ovl:')) {") && html.includes('SN_TOUCH.zoneInDeadStrip(fx * W, fy * H)'), '');
chk('ship24 touchzone: the old per-circle overlayBtns() is gone (one zone surface, not separate circles)', !html.includes('function overlayBtns()'), '');
chk('ship24 touchzone: zone geometry constants — small move 188x96 bottom-left, small climb 188x96 bottom-right (climb sector height exactly 48, the floor)', html.includes("{ kind: 'move', x: 8, y: H - 104, w: 188, h: 96 }") && html.includes("{ kind: 'climb', x: W - 196, y: H - 104, w: 188, h: 96 }"), '');


// ---- patch158 (ship #24): Interact-press is the primary panel-open path ----
chk('ship24 interact: the patch90 2 s hide exempts ONLY the at-panel OPEN prompt (CLIMB/WALK keep their 2 s life)', html.includes("if (actAge >= 2 && !(mode === 'open' && player.interactTarget)) { ab.style.display = 'none'; return; }"), '');
chk('ship24 interact: the exempt OPEN prompt settles at opacity 0.9 instead of fading through 0', html.includes("(mode === 'open' && player.interactTarget)) ? '0.9'"), '');
chk('ship24 interact: the press names the verb in the action layer (INPUT.interactPulse, 156 field)', html.includes('INPUT.interactPulse = true;'), '');
chk('ship24 interact: the press sets the 148/154 dwell latch for the pressed unit (B11 guard — a deliberate close cannot dwell-re-open)', html.includes("SN_UNITINFO._openedKey = player.interactTarget.area + ':' + player.interactTarget.action + ':' + Math.round(player.interactTarget.x);"), '');


// ---- patch159 (ship #24): lever snap tables (release/step only) ----
chk('ship24 levers: SNAP159 table — rod [0,20,39,58,100], load [0,95,100], bypass/leak end-stops [0,100]', html.includes('const SNAP159 = { rod_withdraw: [0, 20, 39, 58, 100], raise_power: [0, 95, 100], steam_valve: [0, 100], isolate_leak: [0, 100] };'), '');
chk('ship24 levers: snap window is strictly inside +/-2 (a value exactly 2 away does NOT snap)', html.includes('const SNAP_WIN159 = 2;') && html.includes('for (const p of pts) if (Math.abs(v - p) < SNAP_WIN159) return p;'), '');
chk('ship24 levers: padStep routes all four results through snapTarget (snap-in-stepper, coarse sizes unchanged)', html.includes("pop.target.lever = snapTarget(a, Math.max(0, Math.min(100, (pop.target.lever ?? leverPct) + dir * 5)));") && html.includes("pop.target.lever = snapTarget(a, Math.max(0, Math.min(100, (pop.target.lever ?? leverPct) + dir * 3)));") && html.includes("pop.target.bypass = snapTarget(a, Math.max(0, Math.min(100, (pop.target.bypass ?? bypassPct) + dir * 4)));") && html.includes("pop.target.leak = snapTarget(a, Math.max(0, Math.min(100, (pop.target.leak ?? pop.leakPct ?? 0) + dir * 5)));"), '');
chk('ship24 levers: padStepFine (the fine channel) clamps then snaps through snapTarget', html.includes('const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)), abs != null ? null : cur);')   /* patch168: origin passed so a fine step can leave a detent */ && html.includes("if (a === 'rod_withdraw' || a === 'raise_power') pop.target.lever = v;") && html.includes("else if (a === 'steam_valve') pop.target.bypass = v;") && html.includes('else pop.target.leak = v;'), '');
chk('ship24 levers: snap is confined to step + release — exactly 9 snapTarget( sites (def + 4 padStep + 1 fine + 3 up()) and NO snap call inside sheetMove (mid-drag stays free)', (html.match(/snapTarget\(/g) || []).length === 9 && (() => { const _sm = html.indexOf('function sheetMove(x, y) {'); if (_sm < 0) return false; const _se = html.indexOf('function ', _sm + 20); return _se > _sm && !html.slice(_sm, _se).includes('snapTarget'); })(), '');
chk('ship24 levers: snap-on-release in up() runs only for the grab owned by the releasing pointer (grab.id match)', html.includes('if (pop.grab && pop.grab.id === id) {   // patch159: snap-on-release'), '');
chk('ship24 levers: up() snaps the lever for leverV/leverH grabs on release', html.includes("if ((g159.kind === 'leverV' || g159.kind === 'leverH') && pop.target.lever != null) { const s159 = snapTarget(g159.a, pop.target.lever);"), '');
chk('ship24 levers: up() snaps bypass and leak for wheel grabs on release', html.includes("else if (g159.kind === 'wheel' && g159.a === 'steam_valve' && pop.target.bypass != null) { const s159 = snapTarget(g159.a, pop.target.bypass);") && html.includes("else if (g159.kind === 'wheel' && pop.target.leak != null) { const s159 = snapTarget(g159.a, pop.target.leak);"), '');

// ---- patch159 (ship #24): one preset chip per analog panel ----
chk('ship24 presets: rod chip label SET 39% and load chip label SET 100%', html.includes("if (a === 'rod_withdraw') return 'SET 39%';") && html.includes("if (a === 'raise_power') return 'SET 100%';"), '');
chk('ship24 presets: bypass chip toggles OPEN 100% / CLOSE 0% by current value (<50 opens)', html.includes("if (a === 'steam_valve') return ((pop.target.bypass ?? bypassPct) < 50) ? 'OPEN 100%' : 'CLOSE 0%';"), '');
chk('ship24 presets: leak chip label CLOSE 100%', html.includes("if (a === 'isolate_leak') return 'CLOSE 100%';"), '');
chk('ship24 presets: preset targets — rod writes lever 39, load writes lever 100', html.includes("if (a === 'rod_withdraw') pop.target.lever = 39;") && html.includes("else if (a === 'raise_power') pop.target.lever = 100;"), '');
chk('ship24 presets: preset targets — bypass toggles 100/0 by current value, leak writes 100', html.includes("else if (a === 'steam_valve') pop.target.bypass = ((pop.target.bypass ?? bypassPct) < 50) ? 100 : 0;") && html.includes("else if (a === 'isolate_leak') pop.target.leak = 100;"), '');
chk('ship24 presets: presets write pop.target ONLY (no teleport — presetApply159 body has the 4 target writes and no direct leverPct/bypassPct/leakPct assignment)', (() => { const _pa = html.indexOf('function presetApply159'); if (_pa < 0) return false; const _pe = html.indexOf('function presetChip159', _pa); if (_pe < 0) return false; const _b = html.slice(_pa, _pe); return _b.includes('pop.target.lever = 39') && _b.includes('pop.target.lever = 100') && _b.includes('pop.target.bypass =') && _b.includes('pop.target.leak = 100') && !_b.includes('leverPct =') && !_b.includes('bypassPct =') && !_b.includes('leakPct ='); })(), '');
chk('ship24 presets: chip hit branch in sheetDown (120x44 at (cz.x, soY(248))) fires before the control branches — a chip tap never starts a drag', html.includes('if (presetLabel159(a) && Math.abs(lx - cz.x) <= 60 && Math.abs(ly - soY(248)) <= 22) { presetApply159(a); return; }'), '');
chk('ship24 presets: the chip is drawn on all three panel kinds (rod, load, wheel)', (html.match(/presetChip159\(r, a\);   \/\/ patch159/g) || []).length === 3, '');

// ---- patch159 (ship #24): rod rail mark + fine entry export ----
chk('ship24 levers: rod rail carries the gold tick + 39 label at the step target', html.includes("{ const y39 = bot - (bot - top) * 0.39; ctx.fillStyle = '#ffd75e'; ctx.fillRect(cx + 12, y39 - 1, 18, 2.5); ctx.font = 'bold 10px Courier New'; ctx.fillText('39', cx + 34, y39 + 3); }"), '');
chk('ship24 levers: window.SN_PADSTEP_FINE is exported (patch160 wheel entry)', html.includes('window.SN_PADSTEP_FINE = padStepFine;'), '');

// ---- patch159 (ship #24): keyboard APG on patch153 engagement ----
chk('ship24 APG: gate is patch153 engagement exactly — no modifiers, STEPPERS panel, (!!pop.grab || panelFocus === primary)', html.includes("if (!e.ctrlKey && !e.metaKey && !e.altKey && typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop && typeof SN_WASD !== 'undefined' && SN_WASD.STEPPERS[SN_TOUCH.pop.action] && typeof SN_PADSTEP_FINE !== 'undefined' && (!!SN_TOUCH.pop.grab || SN_WASD.panelFocus === 'primary')) {"), '');
chk('ship24 APG: arrows step +/-1 and PageUp/PageDown step +/-10', html.includes("if (e.code === 'ArrowRight' || e.code === 'ArrowUp') d159 = 1;") && html.includes("else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') d159 = -1;") && html.includes("else if (e.code === 'PageUp') d159 = 10;") && html.includes("else if (e.code === 'PageDown') d159 = -10;"), '');
chk('ship24 APG: Home goes to 0 and End goes to 100 (absolute stops)', html.includes("else if (e.code === 'Home') abs159 = 0;") && html.includes("else if (e.code === 'End') abs159 = 100;"), '');
chk('ship24 APG: a consumed key goes through SN_PADSTEP_FINE and is preventDefaulted, edge-cleared and stopImmediatePropagationed (153 coarse stepper cannot double-step)', html.includes('SN_PADSTEP_FINE(a159, d159 || 0, abs159);\n      e.preventDefault();\n      keysJustPressed[e.code] = false;\n      e.stopImmediatePropagation();'), '');

// ---- patch159 (ship #24): deliberate omissions (Kevin S3.7) ----
chk('ship24 omissions: NO CUT TO 13% chip — no quoted chip label and the string survives only in the deliberate-omission comment (<=1 occurrence)', !html.includes("'CUT TO 13%'") && !html.includes('"CUT TO 13%"') && (html.match(/CUT TO 13/g) || []).length <= 1, '');
chk('ship24 omissions: NO commit button — no COMMIT label, no commitPop, no commit function (two-stage commit stays deferred)', !html.includes('COMMIT') && !html.includes('commitPop') && !html.includes('function commit'), '');


// ---- patch160 (ship #24): wheel fine-adjust + patch128 locks unchanged ----
// The five patch128 lock strings (suite L633-635), asserted with the
// counts measured on ship #23 and re-verified on the composed build:
// patch160 must not have moved any of them.
chk('ship24 wheel128: wheel listener count unchanged (1)', (html.match(/addEventListener\('wheel'/g) || []).length === 1, '');
chk('ship24 wheel128: passive: false count unchanged (1)', (html.match(/passive: false/g) || []).length === 1, '');
chk('ship24 wheel128: ctrlKey pinch exclusion count unchanged (1)', (html.match(/if \(e\.ctrlKey\) return;/g) || []).length === 1, '');
chk("ship24 wheel128: pointers.set('pad' count unchanged (2)", (html.match(/pointers\.set\('pad'/g) || []).length === 2, '');
chk('ship24 wheel128: window.SN_PAD still present (prefix of SN_PADSTEP_FINE — count may rise, never fall)', html.includes('window.SN_PAD'), '');
chk('ship24 wheel: one notch is 40 px — const NOTCH = 40 drives the panel accumulation loop', html.includes('const NOTCH = 40;') && html.includes('acc -= Math.sign(acc) * NOTCH;'), '');
chk('ship24 wheel: momentum clamp — at most 2 steps per wheel event', html.includes('while (Math.abs(acc) >= NOTCH && steps160 < 2) {'), '');
chk('ship24 wheel: the carried remainder is clamped to one notch after each event', html.includes('acc = Math.max(-NOTCH, Math.min(NOTCH, acc));'), '');
chk('ship24 wheel: analog sheets step FINE — call order padStepFine, then SN_PADSTEP_FINE, coarse pair only as fallback', html.includes('SN_WASD.padStepFine(padPop.action, dir);') && html.includes('else if (window.SN_PADSTEP_FINE) window.SN_PADSTEP_FINE(padPop.action, dir);'), '');
chk('ship24 wheel: the standalone fine entry is GUARDED — it defers to a 159-provided SN_PADSTEP_FINE', html.includes('if (!window.SN_PADSTEP_FINE) window.SN_PADSTEP_FINE = function (a, dir) {'), '');
chk('ship24 wheel: non-analog sheets get no wheel step at all (STEPPERS gate)', html.includes('SN_WASD.STEPPERS[padPop.action])) return;'), '');


// ---- patch161 (controls audit): input hygiene ----
chk('p161 D1: snReleaseAllInput clears keys, KB, latches, WASD held map, pointers, gamepad holds', html.includes('function snReleaseAllInput() {') && html.includes('for (const k in KB) KB[k] = false;') && html.includes('for (const k in SN_WASD.held) SN_WASD.held[k] = false;') && html.includes('pointers.clear();') && html.includes('GP.holdE = GP.holdQ = false;'), '');
chk('p161 D1: wired to window blur, pagehide and a hidden visibilitychange', html.includes("window.addEventListener('blur', snReleaseAllInput);") && html.includes("window.addEventListener('pagehide', snReleaseAllInput);") && html.includes("document.addEventListener('visibilitychange', () => { if (document.hidden) snReleaseAllInput(); });"), '');
chk('p161 D1: a panel grab is released through SN_TOUCH.up (snap-on-release still runs)', html.includes("if (p.role === 'pop') { try { SN_TOUCH.up(id); } catch (e) {} }"), '');
chk('p161 D2: a key skips the startup splash, shortcuts / bare modifiers excepted', html.includes("window.addEventListener('keydown', endKey, true);") && html.includes('e.ctrlKey || e.metaKey || e.altKey'), '');
chk('p161 D3: both canvas pointerdown listeners ignore non-primary mouse buttons (2 guards)', (html.match(/if \(e\.pointerType === 'mouse' && e\.button !== 0\) return;/g) || []).length === 2, '');
chk('p161 D4: mergeInput scans KB / KB_LATCH without Object.values allocations', !html.includes('Object.values(KB)') && html.includes('let phys161 = false;'), '');

// ---- patch162 (controls audit): the operator's manual SCRAM ----
{
  const S = fresh(); run(S, 5); BWR.scramNow(S);
  chk('p162 model: her scramNow() trips with her reason string "Manual scram by operator" (the game now calls it)', S.scram === true && S.why === 'Manual scram by operator' && S.phase === 'tripped', S.why);
}
chk('p162: manual SCRAM is wired to the model through snManualScram -> BWR.scramNow(S)', html.includes('function snManualScram() {') && html.includes('BWR.scramNow(S);'), '');
chk('p162: keyboard X and gamepad Back/View hold (1.0 s) with a progress pill; release cancels', html.includes("KB['KeyX'] || (gp && gp.buttons[8] && gp.buttons[8].pressed)") && html.includes('HOLD_S: 1.0') && html.includes('snScramHoldTick(dt);'), '');
chk('p162: ARI-01 panel carries a SCRAM hold button (left) beside the ARI tap button (right)', html.includes("fx: 'scramFire'") && html.includes("if (pop.grab.fx === 'scramFire')"), '');
chk('p162: overlay heading distinguishes a manual SCRAM from an automatic one', html.includes('id="scramHead"') && html.includes("'!! MANUAL SCRAM !!'") && html.includes("'!! AUTOMATIC SCRAM !!'"), '');
chk('p162: the Chief stock automatic-trip line is NOT used for a manual SCRAM', html.includes('} else showCallout(\'scram\');'), '');

// ---- patch163 (controls audit): movement input ----
chk('p163 G1: the gamepad stick axis is OR-ed into gpUp/gpDown (it used to overwrite the D-pad)', html.includes('if (gp.axes[1] < -0.5) gpUp = true;') && html.includes('if (gp.axes[1] > 0.5) gpDown = true;') && !html.includes('gpUp = gp.axes[1] < -0.5;'), '');
chk('p163 J1: Space / gamepad A jump only when no sheet is open and no interact target', html.includes('const operating163 = !!(SN_TOUCH.pop || p.interactTarget);') && html.includes("(keys['Space'] && !operating163)"), '');

// ---- patch164 (controls audit): landscape phones ----
chk('p164: short-landscape CSS floats the popped Chief panel over the world (absolute, not in-flow)', html.includes('#guideBarExpanded { position: absolute; left: 0; right: 0; top: 100%; z-index: 40; max-height: 46vh;'), '');
chk('p164: layoutTopBars parks the overlay below the step bar and clears the inline top outside landscape', html.includes("(orientation: landscape) and (max-height: 500px)').matches;") && html.includes("sb.getBoundingClientRect().bottom - gb.getBoundingClientRect().top") && html.includes(": '';"), '');

// ---- patch165 (PHYSICS, deliberate deviation from her block - see docs/AUDIT-2026-11-27.md) ----
{
  const { createHash } = await import('node:crypto');
  const md5 = createHash('md5').update(html.slice(i, j + 5)).digest('hex');
  chk('p165: the BWR block is pinned at the audited MD5 (be5a0982...) - any further drift from her verbatim block must be a new, recorded patch', md5 === 'be5a0982bf00617bda59847174d69474', md5);
  // An attentive operator through the whole Level-3 grid emergency.
  const S = fresh(); let atTu3 = null, tuWasHold = false;
  for (let t = 0; t < 900 && !S.scram && S.phase !== 'complete' && S.phase !== 'failed'; t += 0.1) {
    if (S.phase === 'heatup') S.lever = 48;
    else if (S.phase === 'power') S.lever = Math.min(100, S.lever + 0.5);
    else if (S.phase === 'grid') {
      let want = S.disp / 3;
      if (S.ev.fw === 1) S.ctl.rfpStby = true;
      if (S.ev.tu === 1) want = 20;
      S.lever += Math.max(-0.8, Math.min(0.8, want - S.lever));
    }
    BWR.step(S, 0.1);
    if (S.ev.tu === 3 && !atTu3) atTu3 = { disp: S.disp, grace: S.grace, seg: BWR.SEG[S.segI].to, g: S.g, next: BWR.STARTS[S.segI + 1] };
  }
  chk('p165: when the turbine is back the dispatch target is the scheduled segment, not the emergency 60 MWe', !!atTu3 && atTu3.disp === atTu3.seg && atTu3.disp !== 60, JSON.stringify(atTu3));
  chk('p165: the scheduled segment has NOT yet changed at that instant (the stale 60 used to persist to the next boundary)', !!atTu3 && atTu3.g < atTu3.next, JSON.stringify(atTu3));
  chk('p165: recovery grace is granted - her own segment-change formula, min(30, 4 + |step|/5)', !!atTu3 && atTu3.grace >= Math.min(30, 4 + Math.abs(atTu3.seg - 60) / 5) - 0.2, JSON.stringify(atTu3));
  chk('p165: the shift still completes for the attentive operator', S.phase === 'complete', S.phase);
  const sm = BWR.summary(S);
  chk('p165: dispatch accuracy for the attentive operator is >= 0.90 (was 0.85 with the stale target and no grace)', sm.acc >= 0.90, sm.acc.toFixed(3));
}

// ---- patch166 (controls audit): title-screen keys + dead code ----
chk('p166 B1: on the title screen a focused button owns Enter/Space (the generic start key only fires with nothing focused)', html.includes("const btn166 = e && e.target && e.target.closest ? e.target.closest('button') : null;") && html.includes("if (btn166) { if (code === 'Space') btn166.click(); }") && html.includes('else startGame();'), '');
chk('p166 C1: dead KEYBOARD TRACK listeners, the empty interact-once branch and the unused gpJump are gone', !html.includes('KeyE_keyboard') && !html.includes('KeyQ_keyboard') && !html.includes('KeyE_held') && !html.includes('gpJump'), '');

// ---- patch168 (controls audit): fine step vs detent ----
{
  // Re-evaluate the game's own snapTarget / padStepFine logic in isolation (extracted from the source text).
  const m = html.match(/const SNAP159 = [^\n]+\n[\s\S]*?const SNAP_WIN159 = 2;[^\n]*\n\s*function snapTarget\(a, v, from\) \{[\s\S]*?\n  \}/);
  chk('p168: snapTarget(a, v, from) is present with the SNAP159 table and window', !!m, '');
  if (m) {
    const snap = new Function(m[0].replace(/\/\/[^\n]*/g, '') + '\nreturn snapTarget;')();
    const fine = (a, cur, d) => snap(a, Math.max(0, Math.min(100, cur + d)), cur);
    chk('p168: from the 0 detent a +1 fine step leaves 0 (it used to snap back to 0 forever)', fine('rod_withdraw', 0, 1) === 1);
    chk('p168: from the 100 detent a -1 fine step leaves 100', fine('rod_withdraw', 100, -1) === 99 && fine('steam_valve', 100, -1) === 99);
    chk('p168: from the 39 band-edge detent both fine directions leave it', fine('rod_withdraw', 39, 1) === 40 && fine('rod_withdraw', 39, -1) === 38);
    chk('p168: the magnet still works - arriving within the window from outside snaps onto the detent', fine('rod_withdraw', 37, 1) === 39 && fine('rod_withdraw', 22, -1) === 20 && fine('raise_power', 94, 1) === 95);
    chk('p168: coarse / release snaps (no origin) are unchanged', snap('rod_withdraw', 20.7) === 20 && snap('rod_withdraw', 22) === 22 && snap('rod_withdraw', 1.9) === 0);
    let v = 0; for (let k = 0; k < 40; k++) v = fine('rod_withdraw', v, 1);
    chk('p168: forty +1 fine steps from 0 travel the whole way to 40 (magnet jumps at most 2 once per detent)', v >= 40, 'reached ' + v);
  }
}

// ---- patch169 (controls audit): the auto-expanding gauge deck vs an open control sheet ----
chk('p169: autoExpandDeck never opens the deck while a control sheet is open', html.includes("if (typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop) return;   // patch169"), '');
chk('p169: a deck closed by hand stays closed for the same alarm picture (base-3 alarm code, no allocation)', html.includes('function snAlarmCode()') && html.includes('deckDismissedCode = (!deckExpanded && typeof alarms') && html.includes('if (deckDismissedCode >= 0 && snAlarmCode() === deckDismissedCode) return;'), '');
chk('p169: an all-normal plant re-arms the auto-expand', html.includes('if (hasAlarm) autoExpandDeck(); else deckDismissedCode = -1;'), '');

// ---- patch170 (controls audit): an auto-opened deck yields to the control sheet ----
chk('p170: autoExpandDeck marks the deck as game-opened; any manual toggle clears the mark', html.includes('deckExpanded = true; deckAutoOpened = true;') && html.includes("deckAutoOpened = false;   // patch170: any manual toggle makes the deck the player's"), '');
chk('p170: updateDeckAutoClose closes a game-opened deck as soon as a control sheet is open (player-opened decks are left alone)', html.includes('if (deckExpanded && deckAutoOpened && typeof SN_TOUCH !== \'undefined\' && SN_TOUCH.pop) {'), '');

// ---- patch171 (SHIP #25): the SHOW walkthrough ----
chk('s25 walk: SHOW starts the Chief demo of the rest of the CURRENT level via the takeover driver (from the current state, no restart)', html.includes('function snWalkStart() {') && html.includes('startTakeover();   // from the player\'s current state'), '');
chk('s25 walk: any keyboard / mouse / wheel / touch input stops it (capture listeners, 0.5 s start grace, key repeat and bare modifiers ignored)', html.includes("for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, snWalkInput, { capture: true, passive: true });") && html.includes('T_NOW - SN_WALK.t0 < 0.5') && html.includes('e.repeat'), '');
chk('s25 walk: gamepad input stops it too', html.includes("gp.buttons.some(b => b && b.pressed)"), '');
chk('s25 walk: a second SHOW press stops it (green/red follow toggle stands)', html.includes('if (SN_WALK.active) { snWalkStop(true); return true; }') && html.includes('!SN_WALK.active && !(typeof SHOWME'), '');
chk('s25 walk: a completed non-final level advances on its own to the next one (waits for the level-complete cinematic)', html.includes("outcome === 'complete' && gameState.level < 3") && html.includes('const n = gameState.level + 1;') && html.includes('SN_WALK.gapT > 2.5 && !cineBusy'), '');
chk('s25 walk: a finished final level or a trip ends the walkthrough and scores normally', html.includes('SN_WALK.active = false; SN_WALK.gap = false; SN_HELP.showFollow = false;\n  }\n  gameState.phase = \'scored\';'), '');
chk('s25 walk: steps it completes are DEMO-ASSISTED (+50) through ASSIST.assisted; the marks are now per-run', html.includes('if (SN_WALK.active && ASSIST.assisted.indexOf(i) < 0) ASSIST.assisted.push(i);') && html.includes('ASSIST.assisted.length = 0;'), '');
chk('s25 walk: the demo mechanics are unchanged - the 30 s cap / pacing layer / takeover driver are still the only drivers (no new physics, no new clock)', html.includes('function takeoverOperate(dt) {') && html.includes('function paceTick() {') && !/SN_WALK[^\n]*updatePhysics/.test(html), '');

// ---- patch172 (SHIP #25): cinematics toggle ----
chk('s25 cine: a CINE button sits immediately after the AUDIO button and shares its CSS rule, mobile sizes and the keyboard HUD ring', html.includes('onclick="toggleAudio(event)">AUDIO: ON</button>\n      <button id="cineBtn"') && html.includes('#audioBtn, #cineBtn { background: #2a1c08;') && html.includes('#audioBtn, #cineBtn, #sfxBtn { min-height: 26px;') && html.includes('#audioBtn, #cineBtn, #sfxBtn, #menuBtn { height: 44px;') && html.includes("'audioBtn', 'cineBtn', 'sfxBtn'"), '');
chk('s25 cine (functional): default ON; persisted OFF boots OFF; the audio / SFX boot rules are untouched', (() => { const d = snAudioBoot({}); const o = snAudioBoot({ 'sn.cine': 'off' }); const a = snAudioBoot({ 'sn.sfx': 'on', 'sn.audio': 'on', 'sn.cine': 'on' }); return d.cine === true && o.cine === false && a.cine === true && a.sfx === false && a.audio === true; })(), '');
chk('s25 cine: toggleCine persists under sn.cine like the audio choice, and switching off closes the running cinematic and empties the queue', html.includes("localStorage.setItem('sn.cine', SN_AUDIO.cine ? 'on' : 'off');") && html.includes('if (SN_CINE.state.active) SN_CINE.close(false); SN_CINE.state.queue.length = 0;'), '');
chk('s25 cine: with cinematics off every offer is dropped at the door - no video, no audio graph, no queue', html.includes("!SN_AUDIO.cine) { state.log.push({ key, dur_s: 0, dismissed: false, dropped: 'cinematics_off' }); return; }"), '');

// ---- patch173 (SHIP #25): the Chief icon ----
chk('s25 icon: the Chief icon is ~30% larger (24 -> 31 px, phone 20 -> 26 px) on a 40 px bitmap', html.includes('#guideBarCollapsed canvas { width: 31px; height: 31px;') && html.includes('#guideBarCollapsed canvas { width: 26px; height: 26px; }') && html.includes('<canvas id="portraitMini" width="40" height="40"></canvas>'), '');
chk('s25 icon: image only - the icon element carries no text, label or title', /<canvas id="portraitMini"[^>]*><\/canvas>/.test(html) && !/<canvas id="portraitMini"[^>]*(title|aria-label|alt)=/.test(html), '');
chk('s25 icon: the frame mirrors the SHOW follow state (green following / red stopped); it adds no press-and-hold or long-press handler', html.includes("ic173.classList.toggle('follow-on'") && !/portraitMini[^\n]*(long|hold|contextmenu)/i.test(html.slice(html.indexOf('#guideBarCollapsed canvas { width: 31px'), html.indexOf('#guideBarCollapsed canvas { width: 31px') + 600)), '');

// ---- patch174 (SHIP #25 follow-up): the driver stands where the pinned panel is the nearest interactable ----
chk('p174: snStandX picks a stand position at which the pinned panel wins the game\'s nearest-interactable rule (hypot of centres, < 80)', html.includes('function snStandX(pin, side) {') && html.includes('Math.hypot(it.x + it.w / 2 - sx, it.y + it.h / 2 - py) <= d0') && html.includes('if (d0 >= 80) return false;'), '');
chk('p174: guideTick uses it instead of the fixed +/-56 px offset', html.includes('SHOWME.flukeStandX = snStandX(pin,') && !html.includes('? 56 : -56);'), '');

// ---- patches 175-179 (SHIP #25 support): the demo / takeover / walkthrough driver can finish Level 2 ----
chk('p175: snDriverUrgent (turbine trip / feedwater lost / p>7.5 / level<85) and boosted-clock stretches skip the driver walk', html.includes('function snDriverUrgent() {') && html.includes('S.turbTrip > 0 || (S.ev && S.ev.tu === 1) || !S.fwOK || S.p > 7.5 || S.level < 85') && html.includes('(snDriverUrgent() || SN_PACE.effective > 1.5) && SHOWME.walkT > 0.25'), '');
chk('p175: the driver arrives at Level 2\'s scheduled turbine trip at low power (lever 15) and the D20 fix-start cinematic is held back in a live emergency', html.includes("gameState.level === 2 && gameState.l2Stage === 1 && S.phase === 'heatup') leverT = 15;") && html.includes('if (!(SN_WALK.active && snDriverUrgent())) SN_CINE.offer(key);'), '');
chk('p176: the auto-boost clock never runs while a cinematic holds the player (paceTick) - game-layer pacing only', html.includes("if (typeof CINE_ACTIVE !== 'undefined' && CINE_ACTIVE) { SN_PACE.effective = SN_PACE.player;"), '');
chk('p176: a walkthrough skips mid-level cinematics (level_complete still plays) and closes a running one when the driver is needed', html.includes("dropped: 'walkthrough_driving'") && html.includes("key !== 'level_complete'") && html.includes('if (!SN_WALK.gap && CINE_ACTIVE && snDriverUrgent())'), '');
chk('p174/177: snStandX chooses a stand where the pinned panel is the nearest interactable AND Fluke stands on the panel\'s own deck', html.includes('const onDeck = sx => platforms.some(') && html.includes('if (!onDeck(sx)) return false;'), '');
chk('p178: the operate phase heals a mis-targeted panel by placing Fluke at it (demoPin)', html.includes('if (pin && player.interactTarget !== pin && (TAKEOVER.active || DEMO.active)) demoPin();'), '');
chk('p179: the driver closes an isolation condenser latched open by an excursion (it capped the plant at 274 MWe < 285)', html.includes("S.phase === 'power' && S.icOpen && S.ctl.ic !== 'off' && S.p < 7.35 && S.turbTrip <= 0) { action = 'iso_condenser'; mode = 'tap'; }"), '');

// ---- patch181 (freeze world-hold): the dwell-open sheet must not shadow the world hold (ship #24 W57) ----
{
  const mE = html.match(/function snFreezeEmergency\(\) \{[\s\S]*?\n\}/);
  const mA = html.match(/function snFreezeAdjusting\(\) \{[\s\S]*?\n\}/);
  const F = (mE && mA) ? new Function(mE[0] + '\n' + mA[0] + '\nreturn { e: snFreezeEmergency, a: snFreezeAdjusting };')() : null;
  const base = () => {   // the W57 live state: L3 grid emergency, sheet dwell-open at the steam valve
    globalThis.S = { phase: 'grid', scram: false, ev: { tu: 1 } };
    globalThis.gameState = { level: 3, phase: 'playing' };
    globalThis.DEMO = { active: false }; globalThis.TAKEOVER = { active: false }; globalThis.CINE_ACTIVE = false;
    globalThis.SN_TOUCH = { pop: { action: 'steam_valve', grab: false, tgt: false } };
    globalThis.SN_WASD = { kbPanel: false, held: {} };
    globalThis.player = { interactTarget: { action: 'steam_valve' } };
    globalThis.keys = {};
  };
  const now = () => !!(F && F.e() && F.a());   // snFreezeNow(): the exact gate the game loop (FZ155) freezes on
  base(); globalThis.keys = { KeyE: true };
  chk('p181a: sheet dwell-open + KeyE world hold at the steam valve in the L3 grid emergency -> freeze holds (W57 defect)', now());
  base();
  chk('p181b: sheet dwell-open, no keys held -> no freeze', F && !now());
  base(); const grabHeld = (() => { globalThis.SN_TOUCH.pop.grab = true; return now(); })();
  base(); const tgtHeld = (() => { globalThis.SN_TOUCH.pop.tgt = true; return now(); })();
  base(); const kbHeld = (() => { globalThis.SN_WASD = { kbPanel: true, held: { KeyA: true } }; return now(); })();
  chk('p181c: sheet grab / committed target travelling / kbPanel KeyA-KeyD hold -> still freeze', !!(grabHeld && tgtHeld && kbHeld));
  base(); globalThis.SN_TOUCH.pop = null; globalThis.keys = { KeyE: true };
  chk('p181d: sheet closed + KeyE world hold -> still freeze (fall-through path unchanged)', now());
  base(); globalThis.keys = { KeyE: true }; const demoBlocks = (() => { globalThis.DEMO.active = true; return !now(); })();
  base(); globalThis.keys = { KeyE: true }; const takeBlocks = (() => { globalThis.TAKEOVER.active = true; return !now(); })();
  base(); globalThis.keys = { KeyE: true }; const cineBlocks = (() => { globalThis.CINE_ACTIVE = true; return !now(); })();
  chk('p181e: DEMO / TAKEOVER / cinematic active -> still no freeze, even with sheet open + KeyE held', !!(demoBlocks && takeBlocks && cineBlocks));
}
// ---- patch 180 (SHIP #25, Kevin: "Fix the climb up"): snActionLift clamps clear on EVERY prompt path ----
// Geometry per CL1 (WA-CL1 confirmed): prompt height bh = 52; climb clear nominal 220, open/walk 122.
// Desktop chrome: canvas top (step-bar bottom) = 175, container below canvas = 66, H = VH - 241.
// Portrait phone chrome: canvas top = 133, below = 46, H = VH - 179. Deck expanded at 1280x800: below = 426, H = 199.
const p180geom = (VH, chrome, below, stepBottom, nominal) => { const H = VH - chrome; const eff = Math.min(nominal, Math.max(0, H - 52 - 4)); const top = VH - (below + eff) - 52; return { H: H, eff: eff, top: top, gap: top - stepBottom }; };
chk('p180: the clamp line sits in snActionLift immediately before the style.bottom assignment', html.includes("clear = Math.min(clear, Math.max(0, H - bh - 4)); // patch180") && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') > html.indexOf('function snActionLift') && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') < html.indexOf("ab.style.bottom = (below + clear) + 'px';"), '');
chk('p180: nominal clears unchanged (ladder 220 / other 122) and the step bar is not moved', html.includes('let clear = ladderShown ? 220 : 122;'), '');
chk('p180: desktop 1280x800 CLIMB - clamp is a no-op (eff 220), prompt top 462, gap to step-bar bottom 287, no overlap', (() => { const g = p180geom(800, 241, 66, 175, 220); return g.H === 559 && g.eff === 220 && g.top === 462 && g.gap === 287; })(), '');
chk('p180: desktop 1440x900 CLIMB - no-op (eff 220), prompt top 562, gap 387, no overlap', (() => { const g = p180geom(900, 241, 66, 175, 220); return g.H === 659 && g.eff === 220 && g.top === 562 && g.gap === 387; })(), '');
chk('p180: desktop 1920x1080 CLIMB - no-op (eff 220), prompt top 742, gap 567, no overlap', (() => { const g = p180geom(1080, 241, 66, 175, 220); return g.H === 839 && g.eff === 220 && g.top === 742 && g.gap === 567; })(), '');
chk('p180: portrait 390x844 CLIMB - no-op (eff 220), prompt top 526, gap 393, no overlap', (() => { const g = p180geom(844, 179, 46, 133, 220); return g.H === 665 && g.eff === 220 && g.top === 526 && g.gap === 393; })(), '');
chk('p180: portrait 375x667 CLIMB - no-op (eff 220), prompt top 349, gap 216, no overlap', (() => { const g = p180geom(667, 179, 46, 133, 220); return g.H === 488 && g.eff === 220 && g.top === 349 && g.gap === 216; })(), '');
chk('p180: OPEN/WALK (clear 122) no-op and clear of the step bar at the smallest in-scope canvas (375x667 portrait)', (() => { const g = p180geom(667, 179, 46, 133, 122); return g.eff === 122 && g.top === 447 && g.gap === 314; })(), '');
chk('p180: THE BUG - 1280x800 with gauge deck EXPANDED (H 199): unclamped climb prompt top would be 102 (52 px inside step bar 61-175); clamped eff 143, top 179, gap exactly 4, overlap 52 -> 0', (() => { const g = p180geom(800, 601, 426, 175, 220); const unclampedTop = 800 - (426 + 220) - 52; return g.H === 199 && unclampedTop === 102 && (175 - unclampedTop) > 0 && g.eff === 143 && g.top === 179 && g.gap === 4; })(), '');
chk('p180: clamp guarantees prompt top >= 4 px below canvas top for every canvas height 60..900 and both nominal clears', (() => { for (let H = 60; H <= 900; H++) { for (const n of [220, 122]) { const eff = Math.min(n, Math.max(0, H - 52 - 4)); if (H - eff - 52 < Math.min(4, H - 52)) return false; if (H >= n + 56 && eff !== n) return false; } } return true; })(), '');

// ---- patch182: a REAL second SHOW press stops the walkthrough (no stop-then-restart) ----
chk('p182: snWalkInput leaves a press ON the SHOW button to snHelpPress (pointerdown/touchstart targeted at #helpBtn are not an interaction stop)', html.includes("e.target.closest('#helpBtn')") && html.includes("e.type === 'pointerdown' || e.type === 'touchstart'"), '');
chk('p182: a keyboard-activated SHOW press is left to snHelpPress too (Enter/Space keydown targeted at the button, whose click follows)', html.includes("e.type === 'keydown' && (e.code === 'Enter' || e.code === 'Space')"), '');
chk('p182: the button exemption sits BEFORE the stop call inside snWalkInput, and the stop call itself stands', (() => { const i = html.indexOf('function snWalkInput(e)'); const g = html.indexOf("closest('#helpBtn')", i); const s = html.indexOf('snWalkStop(true);', i); return i >= 0 && g > i && s > g; })(), '');
chk('p182: the exemption is scoped to the button press only - the capture listener set (pointer/key/wheel/touch) and the second-press stop branch in snHelpPress are unchanged', html.includes("for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, snWalkInput, { capture: true, passive: true });") && html.includes('if (SN_WALK.active) { snWalkStop(true); return true; }'), '');

// ---- patch 183 (climb-prompt overlap fix, sn-climb-fix evidence T1/T3): the snActionLift layout cache key includes H ----
// Defect: patch180's clamp (clear = min(clear, max(0, H - bh - 4))) is a pure function of H, but the recompute gate
// cached on a key built from ladderShown, below, the player's 16 px screen cell and the button size only - no H.
// A frame computed below + 220 under H >= 276 (clamp a no-op), the gauge deck then expanded, H settled at 209 with
// every key field unchanged, and every later call returned at the gate: the clamp never ran, the stale bottom stood.
// Failing state (recorded live): below = 255, bh = 52, ladder clear nominal 220, key 'L|255|6|22|168x52', bottom 475.
// p183keyAt evaluates the game's OWN key expression, extracted verbatim from snActionLift in the file under test,
// with w2sX/w2sY as identity (camera at origin, zoom 1), the player at screen (352, 96) - the failing cells
// (round(352/16) = 22, round(96/16) = 6) - and the button at 168x52. On the unpatched file the extracted expression
// ignores H, so every H-sensitive lock below fails; on the patched file it ends in the H segment and they pass.
const p183count = (s) => html.split(s).length - 1;
const p183keyAt = (() => { const f = html.indexOf('function snActionLift'); const k = html.indexOf('const key =', f); const e = html.indexOf(';', k); const expr = html.slice(k + 'const key ='.length, e); const fn = new Function('ladderShown', 'below', 'w2sY', 'w2sX', 'player', 'ab', 'H', 'return (' + expr + ');'); return (H, below = 255) => fn(true, below, (wy) => wy, (wx) => wx, { x: 352, y: 96 }, { offsetWidth: 168, offsetHeight: 52 }, H); })();
const p183geom = (below, nominal, H, bh) => { const eff = Math.min(nominal, Math.max(0, H - bh - 4)); return { H: H, eff: eff, bottom: below + eff, top: H - eff - bh }; };
const p183sim = (Hs) => { let stored = ''; let out = { bottom: null, eff: null, top: null, computes: 0 }; for (const H of Hs) { const k = p183keyAt(H); if (k === stored) continue; stored = k; const g = p183geom(255, 220, H, 52); out = { bottom: g.bottom, eff: g.eff, top: g.top, computes: out.computes + 1 }; } return out; };
chk('p183: the snActionLift cache key line carries H as its final segment, exactly once, inside snActionLift before the cache gate', p183count("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") === 1 && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") > html.indexOf('function snActionLift') && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") < html.indexOf('if (key === _snLiftKey) return;'), '');
chk('p183: the cache itself is untouched - _snLiftKey declaration, gate and store each occur exactly once (3 occurrences in the whole file), and the patch180 clamp line still stands exactly once, after the key line', p183count("let _snLiftKey = '';") === 1 && p183count('if (key === _snLiftKey) return;') === 1 && p183count('_snLiftKey = key;') === 1 && p183count('_snLiftKey') === 3 && p183count('clear = Math.min(clear, Math.max(0, H - bh - 4));') === 1 && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") > html.indexOf('function snActionLift') && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') > html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;"), '');
chk('p183: the game key for the failing fields (ladder, below 255, cells 6/22, button 168x52) ends in the H in force - |209 at the settled height, |366 at the pre-drop height', p183keyAt(209) === 'L|255|6|22|168x52|209' && p183keyAt(366) === 'L|255|6|22|168x52|366', '');
chk('p183: REGRESSION - the key at H 366 differs from the key at H 209 with every other field equal, and no two adjacent canvas heights 60..900 share a key', p183keyAt(366) !== p183keyAt(209) && (() => { for (let H = 60; H < 900; H++) { if (p183keyAt(H) === p183keyAt(H + 1)) return false; } return true; })(), '');
chk('p183: THE BUG, end to end through the cache - primed at H 366 the lift computes clear 220 / bottom 475; when H then settles at 209 with all key fields unchanged the lift MUST recompute: clamped clear 153, bottom 408, button top exactly 4 (the stale value would leave it at -63)', (() => { const a = p183sim([366]); const b = p183sim([366, 209]); return a.eff === 220 && a.bottom === 475 && (209 - 220 - 52) === -63 && b.computes === 2 && b.eff === 153 && b.bottom === 408 && b.top === 4; })(), '');
chk('p183: after any H change from a primed cache, the recompute runs the patch180 clamp for every canvas height 60..900 (bottom = 255 + clamped clear, prompt top never above the 4 px margin)', (() => { for (let H = 60; H <= 900; H++) { const r = p183sim([1000, H]); const eff = Math.min(220, Math.max(0, H - 52 - 4)); if (r.computes !== 2 || r.eff !== eff || r.bottom !== 255 + eff || r.top !== H - eff - 52 || r.top < Math.min(4, H - 52)) return false; } return true; })(), '');
chk('p183: NO-OP at fixed H - the key is stable across repeated computation at H 209 and a repeated call still hits the cache (exactly one compute, bottom unchanged at 408): the fix does not disable the cache', p183keyAt(209) === p183keyAt(209) && p183keyAt(209) === 'L|255|6|22|168x52|209' && (() => { const r = p183sim([209, 209, 209]); return r.computes === 1 && r.bottom === 408 && r.eff === 153; })(), '');

// ---- patch 184 (Kevin, 2026-11-27 - white border around Fluke removed completely) ----
// Defect mechanism (lane sn-border-spec, code + pixel evidence): no code draws a border around the player and the
// sprite PNGs have clean transparent edges; the WebGL atlas packed drawImage sources edge-to-edge via
// patternRegion() and the shader samples LINEAR with no inset, so a quad-edge tap straddled the region boundary
// and pulled in the neighbouring cell (white glyph strokes / the white fallback cell) - a light border around
// the sprite, worst while walking. On atlas-full the region became the WHITE cell outright (solid white quad).
// Fix: drawImage uses imageRegion() - a (w + 2) x (h + 2) cell, image drawn at +1, region UVs over exactly the
// image texels, so edge taps reach only the image's own transparent moat; atlas-full falls back to the CLEAR
// cell (transparent, reserved beside WHITE on the first shelf), never WHITE. Patterns keep patternRegion().
const p184count = (s) => html.split(s).length - 1;
chk('p184: imageRegion exists exactly once, allocates the moat (w + 2, h + 2), draws the image inset at cell + 1, and its region UVs span exactly the image texels (cell + 1 .. cell + 1 + w)', p184count('function imageRegion(src)') === 1 && p184count('atlasAlloc(w + 2, h + 2)') === 1 && p184count('atlasCtx.drawImage(src, cell.x + 1, cell.y + 1)') === 1 && p184count('u0: (cell.x + 1) / ATLAS_SIZE') === 1 && p184count('u1: (cell.x + 1 + w) / ATLAS_SIZE') === 1, '');
chk('p184: moat geometry - for a 140x270 sprite in a cell at (10, 20) the sampled region starts exactly 1 texel inside the cell and ends exactly 1 texel before the cell edge on every side, so a LINEAR edge tap can never cross into a neighbouring cell', (() => { const A = 4096, cx = 10, cy = 20, w = 140, h = 270; const u0 = (cx + 1) / A, v0 = (cy + 1) / A, u1 = (cx + 1 + w) / A, v1 = (cy + 1 + h) / A; return Math.round(u0 * A - cx) === 1 && Math.round(v0 * A - cy) === 1 && Math.round((cx + w + 2) - u1 * A) === 1 && Math.round((cy + h + 2) - v1 * A) === 1; })(), '');
chk('p184: drawImage routes through imageRegion exactly once, and patternRegion survives for patterns: its definition stands, regionOf still calls it, and imageRegion itself only falls back to it for dimensionless sources', p184count('var reg = imageRegion(src);') === 1 && p184count('function patternRegion(pat)') === 1 && p184count('patternRegion({ src: src })') === 2 && html.indexOf('var reg = imageRegion(src);') > html.indexOf('GLShim.prototype.drawImage'), '');
chk('p184: the CLEAR fallback cell is defined exactly once with its insets beside WHITE (x 2.25..3.75 texels), the first shelf now starts allocations at x = 4 so nothing can paint over CLEAR or WHITE, and imageRegion falls back to CLEAR - never to WHITE', p184count('var CLEAR = { u0: 2.25 / ATLAS_SIZE') === 1 && p184count('var shelves = [{ y: 0, h: 4, x: 4 }];') === 1 && p184count('reg = { u0: CLEAR.u0, v0: CLEAR.v0, u1: CLEAR.u1, v1: CLEAR.v1 }') === 1 && html.indexOf('function imageRegion') > html.indexOf('var CLEAR'), '');
chk('p184: WHITE itself is untouched (solid fills unchanged): the white cell paint and the WHITE region definition each still occur exactly once with their original values', p184count("atlasCtx.fillRect(0, 0, 2, 2); // white pixel cell at origin") === 1 && p184count('var WHITE = { u0: 0.25 / ATLAS_SIZE, v0: 0.25 / ATLAS_SIZE, u1: 1.75 / ATLAS_SIZE, v1: 1.75 / ATLAS_SIZE };') === 1, '');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

