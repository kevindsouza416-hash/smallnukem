#!/usr/bin/env python3
"""patch181 - the freeze world-hold works while the touch sheet is dwell-open (ship #24 W57 defect).

snFreezeAdjusting(): standing at the steam valve dwell-opens the sheet (SN_TOUCH.pop non-null,
action 'steam_valve'), so the function enters the if(pop) branch.  Inside it, a keyboard world
hold sets none of pop.grab (pointer-only), pop.tgt (sheet commits only - the world KeyE hold
writes bypassPct directly) or the kbPanel KeyA/KeyD hold, so the branch returned false and the
world-hold KeyE check below it was unreachable: time never held during the Level 3 emergency
(measured live on ship #24: snFreezeAdjusting()=false 6/6 while bypassPct climbed 21.49 -> 100).
Fix per FZ1's spec: inside the pop branch, after the kbPanel line and before its return false,
accept the same world-hold key set as the fall-through line.  The pop branch has already
established pop.action is 'steam_valve' or 'raise_power'.  Physics untouched.
"""
from _patchlib import apply
BASE = 'dabc0f8e7291026dd2bf02fd8ad1f3a3'   # branch game file at 0dd4c3b / 58dce15 (docs-only commits since)
E = [("""    if (typeof SN_WASD !== 'undefined' && SN_WASD.kbPanel && (SN_WASD.held['KeyA'] || SN_WASD.held['KeyD'])) return true;   // keyboard panel operate hold
    return false;""",
"""    if (typeof SN_WASD !== 'undefined' && SN_WASD.kbPanel && (SN_WASD.held['KeyA'] || SN_WASD.held['KeyD'])) return true;   // keyboard panel operate hold
    if (keys['KeyE'] || keys['KeyQ'] || keys['Enter'] || keys['ShiftLeft']) return true;   // world hold while the sheet is dwell-open: the open sheet must not shadow the world hold (ship #24 W57 defect)
    return false;""")]
apply(181, BASE, E)
