#!/usr/bin/env python3
"""patch182 - a REAL second press on SHOW stops the walkthrough instead of restarting it (CR5 major, patch171).

helpBtn is onclick="snHelpPress()", but a real press fires pointerdown/touchstart FIRST (and, for Enter/Space
on the focused button, a keydown whose click follows).  The capture-phase snWalkInput stopped the walk on that
leading event and reset exactly the state snHelpPress checks (TAKEOVER off, ASSIST='watch', showFollow=false),
so the following click fell through to snWalkStart() and the walkthrough restarted with a new t0.  The intended
stop branch only ever fired for programmatic clicks - which is how the e2e pressed it, masking the bug.

Fix (option (a), scoped by event type): snWalkInput now leaves a press that lands ON the SHOW button to
snHelpPress - pointerdown/touchstart targeted at #helpBtn (or a child) are ignored, and so is a keydown only
when it is the button's own activation key (Enter/Space) targeted at the button.  Everything else still stops
the walk: wheel never precedes a click so it is not exempted; ordinary keys still stop it even while the
button holds focus after a mouse start; and a key stop followed by a fresh SHOW press is a deliberate new
press whose click restarts the walkthrough, as before.  Physics untouched.
"""
from _patchlib import apply
BASE = '80a4f59e95f1f140c4396c31ea388d4a'   # patch180 output (head 34a14fe at apply time)
E = [("""function snWalkInput(e) {
  if (!SN_WALK.active || T_NOW - SN_WALK.t0 < 0.5) return;
  if (e && e.type === 'keydown' && (e.repeat || /^(Shift|Control|Alt|Meta)/.test(e.code))) return;
  snWalkStop(true);
}""",
"""function snWalkInput(e) {
  if (!SN_WALK.active || T_NOW - SN_WALK.t0 < 0.5) return;
  if (e && e.type === 'keydown' && (e.repeat || /^(Shift|Control|Alt|Meta)/.test(e.code))) return;
  // patch182: a press ON the SHOW button is the toggle itself, not an interaction stop - its leading
  // pointerdown/touchstart (or the Enter/Space keydown of a keyboard-activated press) reaches this handler
  // BEFORE the click reaches snHelpPress, and stopping here reset the state snHelpPress checks, so the
  // click fell through and restarted the walkthrough.  Leave button-targeted press events to snHelpPress.
  if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('#helpBtn') &&
      (e.type === 'pointerdown' || e.type === 'touchstart' || (e.type === 'keydown' && (e.code === 'Enter' || e.code === 'Space')))) return;
  snWalkStop(true);
}""")]
apply(182, BASE, E)
