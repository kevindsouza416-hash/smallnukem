#!/usr/bin/env python3
"""patch178 - the driver heals a mis-targeted operate phase.

Level-2 walkthrough run: Fluke was parked beside rod drive 1 but the nearest interactable was the SLC panel, so
the driver's operate presses toggled the SLC and the lever never moved (the step sat there for minutes).  Whatever
the cause (deck geometry, a fall, a neighbour closer than the pin), the operate phase now checks every frame that the
pinned panel IS Fluke's interact target and, if not, places him exactly at the panel (demoPin(), the original
driver's own placement) - centre on centre, so the pin is the nearest by construction.  Physics untouched.
"""
from _patchlib import apply
BASE = '248b5b0eac2a16c571c41ef8bc8621cc'   # patch177 output
E = [("""  if (SHOWME.phase === 'operate') {
    INPUT.left = INPUT.right = INPUT.up = INPUT.down = false;""",
"""  if (SHOWME.phase === 'operate') {
    if (pin && player.interactTarget !== pin && (TAKEOVER.active || DEMO.active)) demoPin();   // patch178: operate presses must reach the pinned panel, not a neighbour
    INPUT.left = INPUT.right = INPUT.up = INPUT.down = false;""")]
apply(178, BASE, E)
