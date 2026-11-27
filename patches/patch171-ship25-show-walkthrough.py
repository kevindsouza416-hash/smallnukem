#!/usr/bin/env python3
"""patch171 - SHIP #25 change 1: the SHOW walkthrough (Kevin, Nov 26 ~22:14-22:19 EST).

Pressing SHOW now starts the Chief's demonstration of whatever remains of the CURRENT level,
driven by the existing takeover driver (from the player's current state, no restart, diagnoses
and fixes by procedure).  When that level completes the game advances on its own to the next
level and demonstrates it too, through all three levels.  ANY player interaction - keyboard,
mouse, trackpad wheel, touch, gamepad - stops it at once; so does a second SHOW press.  Steps
the walkthrough completes are marked DEMO-ASSISTED (+50) through the existing ASSIST.assisted
list; the 30 s step cap, the pacing layer and the demo mechanics are untouched.  The green /
red follow-toggle colouring stands.  Intermediate levels skip the score card (it would fade to
the menu mid-walkthrough); the final level scores normally.
Also fixes ASSIST.assisted never being reset between runs (stale DEMO-ASSISTED marks).
Physics untouched.
"""
from _patchlib import apply
BASE = '8be106263d5586f9c09a8336ae36176f'   # patch170 output
E = []

E.append(("""function snHelpPress() {
  // patch99 (Kevin, Nov 26 ~00:51-00:54): SHOW is the follow toggle.""",
"""// patch171 (ship #25): the SHOW walkthrough.  active = the Chief is demonstrating; gap = the level just
// finished and the next one starts once the level-complete cinematic (if enabled) has played.
const SN_WALK = { active: false, t0: -9, gap: false, gapT: 0 };
function snWalkStart() {
  SN_WALK.active = true; SN_WALK.gap = false; SN_WALK.t0 = T_NOW;
  SN_HELP.usedHelpOnStep = true; SN_HELP.showFollow = true; SN_HELP.showStopped = false;
  startTakeover();   // from the player's current state: diagnoses, fixes by procedure, runs to completion
  snShowBtnSync();
  snHelpTrace('walk-start', { level: gameState.level });
  return true;
}
function snWalkStop(announce) {
  if (!SN_WALK.active) return;
  const wasGap = SN_WALK.gap;
  SN_WALK.active = false; SN_WALK.gap = false;
  SN_HELP.showFollow = false; SN_HELP.showStopped = true;
  if (TAKEOVER.active) { TAKEOVER.active = false; TAKEOVER.state = 'idle'; }
  if (typeof ASSIST !== 'undefined' && ASSIST.phase === 'takeover') { ASSIST.phase = 'watch'; ASSIST.expl = 0; ASSIST.lastProgT = T_NOW; }
  if (wasGap) { gameState.phase = 'playing'; try { endGame('complete'); } catch (e) {} }   // interrupted between levels: the finished level scores normally
  else if (announce) { showCalloutText('Walkthrough off. Your plant, operator.'); chiefSpeak('Walkthrough off. Your plant, operator.', false); }
  snShowBtnSync();
  snHelpTrace('walk-stop', { wasGap: wasGap });
}
// Any player interaction stops it: keyboard, mouse / trackpad (pointer + wheel), touch, gamepad.  A 0.5 s grace covers
// the press that started it (a held key repeating, the button's own click).
function snWalkInput(e) {
  if (!SN_WALK.active || T_NOW - SN_WALK.t0 < 0.5) return;
  if (e && e.type === 'keydown' && (e.repeat || /^(Shift|Control|Alt|Meta)/.test(e.code))) return;
  snWalkStop(true);
}
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, snWalkInput, { capture: true, passive: true });
function snWalkNextLevel() {
  const n = gameState.level + 1;
  SN_WALK.gap = false;
  startGame(n);   // fresh plant for the next level (restartGame), intro callout
  SN_WALK.t0 = T_NOW;
  SN_HELP.showFollow = true; SN_HELP.showStopped = false;
  startTakeover();
  snShowBtnSync();
  snHelpTrace('walk-next', { level: n });
}
function snWalkTick(dt) {
  if (!SN_WALK.active) return;
  const gp = getGamepad();
  if (gp && T_NOW - SN_WALK.t0 > 0.5 && (gp.buttons.some(b => b && b.pressed) || Math.abs(gp.axes[0] || 0) > 0.5 || Math.abs(gp.axes[1] || 0) > 0.5)) { snWalkStop(true); return; }
  if (!SN_WALK.gap) return;
  SN_WALK.gapT += dt;
  const cineBusy = CINE_ACTIVE || (SN_CINE.state.active != null) || SN_CINE.state.queue.length > 0;
  if (SN_WALK.gapT > 2.5 && !cineBusy) snWalkNextLevel();
}
function snHelpPress() {
  // patch99 (Kevin, Nov 26 ~00:51-00:54): SHOW is the follow toggle."""))

E.append(("""  if (SN_HELP.showFollow) {
    SN_HELP.showFollow = false; SN_HELP.showStopped = true;
    if (ASSIST.phase === 'clip') ASSIST.phase = 'watch';""",
"""  if (SN_WALK.active) { snWalkStop(true); return true; }   // patch171: the second press stops the walkthrough
  if (SN_HELP.showFollow) {
    SN_HELP.showFollow = false; SN_HELP.showStopped = true;
    if (ASSIST.phase === 'clip') ASSIST.phase = 'watch';"""))
E.append(("""  if (TAKEOVER.active || ASSIST.phase !== 'watch') return false;
  SN_HELP.usedHelpOnStep = true;
  SN_HELP.showFollow = true; SN_HELP.showStopped = false;
  const ok = SN_HELP.startDemo();
  if (!ok) SN_HELP.showFollow = false;
  snShowBtnSync();
  snHelpTrace('show-start', { ok: !!ok });
  return ok;""",
"""  if (TAKEOVER.active || ASSIST.phase !== 'watch') return false;
  return snWalkStart();   // patch171 (ship #25): SHOW = the Chief demonstrates the rest of the level, then the next levels (was: a one-step demo)"""))
E.append(("""  if (SN_HELP.showFollow && ASSIST.phase === 'watch' && !TAKEOVER.active && !(typeof SHOWME !== 'undefined' && SHOWME.active)) SN_HELP.showFollow = false;""",
"""  if (SN_HELP.showFollow && ASSIST.phase === 'watch' && !TAKEOVER.active && !SN_WALK.active && !(typeof SHOWME !== 'undefined' && SHOWME.active)) SN_HELP.showFollow = false;"""))

# scoring: steps the walkthrough completes are demo-assisted
E.append(("""      if (!gameState.stepsCompleted.includes(i)) gameState.stepsCompleted.push(i);
    }
    gameState.procedureStep = to;""",
"""      if (!gameState.stepsCompleted.includes(i)) gameState.stepsCompleted.push(i);
      if (SN_WALK.active && ASSIST.assisted.indexOf(i) < 0) ASSIST.assisted.push(i);   // patch171: a step the walkthrough completes is DEMO-ASSISTED (+50)
    }
    gameState.procedureStep = to;"""))
E.append(("""  SN_FREEZE.active = false; SN_FREEZE.used = false; SN_FREEZE.heldSec = 0;   // patch155 (R155 amendment): the freeze record is per-run""",
"""  SN_FREEZE.active = false; SN_FREEZE.used = false; SN_FREEZE.heldSec = 0;   // patch155 (R155 amendment): the freeze record is per-run
  ASSIST.assisted.length = 0;   // patch171: DEMO-ASSISTED marks are per-run (they were never cleared, so a new run inherited the last run's marks)"""))

# level end: intermediate levels advance on their own
E.append(("""  if (outcome === 'scram' || outcome === 'failed') triggerStartle();
  gameState.phase = 'scored';""",
"""  if (outcome === 'scram' || outcome === 'failed') triggerStartle();
  if (SN_WALK.active) {   // patch171: the walkthrough carries on to the next level; only a finished final level (or a trip) ends it
    if (outcome === 'complete' && gameState.level < 3) { gameState.phase = 'scored'; SN_WALK.gap = true; SN_WALK.gapT = 0; TAKEOVER.active = false; TAKEOVER.state = 'idle'; showCalloutText('Level complete. On to the next one \\u2014 stay on the controls if you want it.'); return; }
    SN_WALK.active = false; SN_WALK.gap = false; SN_HELP.showFollow = false;
  }
  gameState.phase = 'scored';"""))
E.append(("""  snScramHoldTick(dt);   // patch162""",
"""  snScramHoldTick(dt);   // patch162
  snWalkTick(dt);   // patch171"""))
E.append(("""function quitToMenu() {
  SN_STOP_ALL_MEDIA();""",
"""function quitToMenu() {
  SN_WALK.active = false; SN_WALK.gap = false;   // patch171
  SN_STOP_ALL_MEDIA();"""))
apply(171, BASE, E)
