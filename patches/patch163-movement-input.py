#!/usr/bin/env python3
"""patch163 - movement input fixes found by the controls audit.

 G1  Gamepad D-pad up/down never climbed: updatePlayer set gpUp/gpDown from the
     D-pad buttons (12/13) and then immediately OVERWROTE them with the left
     stick axis test.  The stick axis is now OR-ed in.
 J1  Space (and gamepad A) always jumped, even while a panel sheet was open
     ("the character is frozen") or while Fluke stood at a panel's operate
     prompt - Space is also the operate key, so operating a valve with Space
     made Fluke bounce 70 px.  Space / A now jump only when there is no open
     sheet and no interact target.  ArrowUp jump is unchanged.
Physics untouched.
"""
from _patchlib import apply, PHYS_SAMIRA
BASE = '140e2743957dd0c701b0a5847e45dcb2'   # patch162 output
E = []
E.append(("""    gpUp = gp.axes[1] < -0.5;
    gpDown = gp.axes[1] > 0.5;""",
"""    if (gp.axes[1] < -0.5) gpUp = true;   // patch163 (G1): OR-ed in - the plain assignment erased the D-pad up/down set above
    if (gp.axes[1] > 0.5) gpDown = true;"""))
E.append(("""    if ((keys['Space'] || (keys['ArrowUp'] && !p.ladderLatch) || (gp && gp.buttons[0] && gp.buttons[0].pressed)) && p.onGround) {""",
"""    const operating163 = !!(SN_TOUCH.pop || p.interactTarget);   // patch163 (J1): Space / A are the operate keys too - no jump while a sheet is open or Fluke stands at a panel
    if (((keys['Space'] && !operating163) || (keys['ArrowUp'] && !p.ladderLatch) || (gp && gp.buttons[0] && gp.buttons[0].pressed && !operating163)) && p.onGround) {"""))
apply(163, BASE, E, phys_before=PHYS_SAMIRA)
