#!/usr/bin/env python3
# patch-tests171 - locks for patch171 (SHIP #25: SHOW walkthrough). Edits tests/value-checks.mjs only.
# EXPECTED-UPDATE (superseded behaviour, rewritten in place): two patch99 locks pinned 'const ok = SN_HELP.startDemo();'
# (SHOW = a one-step demo); SHOW now starts the level walkthrough through snWalkStart().
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
OLD = "html.includes('const ok = SN_HELP.startDemo();')"
assert text.count(OLD) == 2
text = text.replace(OLD, "html.includes('return snWalkStart();   // patch171 (ship #25)')   /* ship #25: SHOW starts the walkthrough (was SN_HELP.startDemo()) */")
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch171 (SHIP #25): the SHOW walkthrough ----
chk('s25 walk: SHOW starts the Chief demo of the rest of the CURRENT level via the takeover driver (from the current state, no restart)', html.includes('function snWalkStart() {') && html.includes('startTakeover();   // from the player\'s current state'), '');
chk('s25 walk: any keyboard / mouse / wheel / touch input stops it (capture listeners, 0.5 s start grace, key repeat and bare modifiers ignored)', html.includes("for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, snWalkInput, { capture: true, passive: true });") && html.includes('T_NOW - SN_WALK.t0 < 0.5') && html.includes('e.repeat'), '');
chk('s25 walk: gamepad input stops it too', html.includes("gp.buttons.some(b => b && b.pressed)"), '');
chk('s25 walk: a second SHOW press stops it (green/red follow toggle stands)', html.includes('if (SN_WALK.active) { snWalkStop(true); return true; }') && html.includes('!SN_WALK.active && !(typeof SHOWME'), '');
chk('s25 walk: a completed non-final level advances on its own to the next one (waits for the level-complete cinematic)', html.includes("outcome === 'complete' && gameState.level < 3") && html.includes('const n = gameState.level + 1;') && html.includes('SN_WALK.gapT > 2.5 && !cineBusy'), '');
chk('s25 walk: a finished final level or a trip ends the walkthrough and scores normally', html.includes('SN_WALK.active = false; SN_WALK.gap = false; SN_HELP.showFollow = false;\n  }\n  gameState.phase = \'scored\';'), '');
chk('s25 walk: steps it completes are DEMO-ASSISTED (+50) through ASSIST.assisted; the marks are now per-run', html.includes('if (SN_WALK.active && ASSIST.assisted.indexOf(i) < 0) ASSIST.assisted.push(i);') && html.includes('ASSIST.assisted.length = 0;'), '');
chk('s25 walk: the demo mechanics are unchanged - the 30 s cap / pacing layer / takeover driver are still the only drivers (no new physics, no new clock)', html.includes('function takeoverOperate(dt) {') && html.includes('function paceTick() {') && !/SN_WALK[^\n]*updatePhysics/.test(html), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
