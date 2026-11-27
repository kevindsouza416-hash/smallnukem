#!/usr/bin/env python3
"""patch167 - double-click / double-tap on the world threw ReferenceError and never opened the map.

The canvas double-tap shortcut (patch138-era 'lpTimer' block) calls openMap(); the function is
openSchematic().  Same class as Decision 31's startTakeover defect: a call to a function that never
existed.  A static scan of every call in the three script blocks found this one undefined name.
Physics untouched.
"""
from _patchlib import apply
BASE = 'ef30007720fc5681aa407d21bf3fab62'   # patch166 output
E = [("""if (gameState.phase === 'playing' && !SN_TOUCH.pop) { openMap(); SN_SFX.uiOpen(); }""",
      """if (gameState.phase === 'playing' && !SN_TOUCH.pop) { openSchematic(); SN_SFX.uiOpen(); }   // patch167: was openMap() - undefined""")]
apply(167, BASE, E)
