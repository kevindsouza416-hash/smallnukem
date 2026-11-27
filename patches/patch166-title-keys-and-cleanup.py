#!/usr/bin/env python3
"""patch166 - title-screen keyboard bug + dead-code cleanup (controls audit).

 B1  Keyboard: Enter/Space on a focused title-screen button (MODE / FX / HAPTICS /
     GUIDANCE / CAMERA toggles, level and drill buttons) STARTED THE GAME through
     handleKeyPress's generic 'Enter or Space starts' rule, so a keyboard user could
     not change a setting without launching level 1 (and Space, preventDefault-ed by
     patch153's armour, never activated the button at all).  When the key's target is a
     button, Enter now uses the button's native click and Space clicks it explicitly;
     the generic start key only fires with nothing focused.
 C1  Dead code removed: the KEYBOARD TRACK listeners (keys.KeyE_keyboard / KeyQ_keyboard
     were written and never read), handleKeyPress's empty 'interact once on press' branch
     (read keys.KeyE_held, never written), and the unused gpJump local in updatePlayer.
Physics untouched.
"""
from _patchlib import apply
BASE = '4cf05a14376e00f8519b158268731cf0'   # patch165 output
E = []
E.append(("""  if (gameState.phase === 'title') {
    if (code === 'Enter' || code === 'Space') {
      startGame();
    }
    return;
  }""",
"""  if (gameState.phase === 'title') {
    if (code === 'Enter' || code === 'Space') {
      const btn166 = e && e.target && e.target.closest ? e.target.closest('button') : null;   // patch166 (B1): a focused button owns Enter/Space
      if (btn166) { if (code === 'Space') btn166.click(); }   // Enter: the browser's native click; Space: patch153 preventDefault-ed it, so click here
      else startGame();
    }
    return;
  }"""))
E.append(("""  if ((code === 'KeyE' || code === 'Enter') && !keys['KeyE_held']) {
    // interact once on press
  }
""", ""))
E.append(("""// =====================================================================
//  KEYBOARD TRACK (for analog differentiation)
// =====================================================================
window.addEventListener('keydown', e => {
  if (e.code === 'KeyE') keys['KeyE_keyboard'] = true;
  if (e.code === 'KeyQ') keys['KeyQ_keyboard'] = true;
});
window.addEventListener('keyup', e => {
  if (e.code === 'KeyE') keys['KeyE_keyboard'] = false;
  if (e.code === 'KeyQ') keys['KeyQ_keyboard'] = false;
});

""", ""))
E.append(("""  let gpLeft = 0, gpJump = false, gpUp = false, gpDown = false;""",
"""  let gpLeft = 0, gpUp = false, gpDown = false;"""))
E.append(("""    gpJump = gp.buttons[0] && gp.buttons[0].pressed;
""", ""))
apply(166, BASE, E, phys_before='be5a0982bf00617bda59847174d69474')
