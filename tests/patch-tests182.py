#!/usr/bin/env python3
# patch-tests182 - locks for patch182 (a REAL second SHOW press stops the walkthrough; CR5 major on patch171).
# Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch182: a REAL second SHOW press stops the walkthrough (no stop-then-restart) ----
chk('p182: snWalkInput leaves a press ON the SHOW button to snHelpPress (pointerdown/touchstart targeted at #helpBtn are not an interaction stop)', html.includes("e.target.closest('#helpBtn')") && html.includes("e.type === 'pointerdown' || e.type === 'touchstart'"), '');
chk('p182: a keyboard-activated SHOW press is left to snHelpPress too (Enter/Space keydown targeted at the button, whose click follows)', html.includes("e.type === 'keydown' && (e.code === 'Enter' || e.code === 'Space')"), '');
chk('p182: the button exemption sits BEFORE the stop call inside snWalkInput, and the stop call itself stands', (() => { const i = html.indexOf('function snWalkInput(e)'); const g = html.indexOf("closest('#helpBtn')", i); const s = html.indexOf('snWalkStop(true);', i); return i >= 0 && g > i && s > g; })(), '');
chk('p182: the exemption is scoped to the button press only - the capture listener set (pointer/key/wheel/touch) and the second-press stop branch in snHelpPress are unchanged', html.includes("for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, snWalkInput, { capture: true, passive: true });") && html.includes('if (SN_WALK.active) { snWalkStop(true); return true; }'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests182: value-checks.mjs updated')
