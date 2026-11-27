#!/usr/bin/env python3
"""patch168 - the +/-1% fine channel could never leave a detent (found by the trackpad e2e).

patch159's snapTarget() snaps any value strictly inside +/-2 of a detent point onto it.  The fine
channel (trackpad wheel notch, ArrowRight/Up/Left/Down on an engaged sheet) steps +/-1, so from
a detent v = p +/- 1 is always inside the window and snaps straight back: the rod lever could
not be moved off 0 / 20 / 39 / 58 / 100 (nor the load lever off 0 / 95 / 100, nor a valve off
0 / 100) with the wheel or the fine arrows - at game start the lever sits on 0, so a trackpad
player's first scroll did nothing at all.  Stepping OFF the detent you are standing on is now free;
entering one from outside the window still snaps (the magnet), coarse steps and release snaps are
unchanged.  Physics untouched.
"""
from _patchlib import apply
BASE = '473c83983bdb2e0c02d0da3c20bb926d'   # patch167 output
E = []
E.append(("""  function snapTarget(a, v) {
    const pts = SNAP159[a]; if (!pts || v == null) return v;
    for (const p of pts) if (Math.abs(v - p) < SNAP_WIN159) return p;
    return v;
  }""",
"""  function snapTarget(a, v, from) {
    const pts = SNAP159[a]; if (!pts || v == null) return v;
    if (from != null && pts.indexOf(from) >= 0 && Math.abs(v - from) < SNAP_WIN159) return v;   // patch168: a fine step OFF the detent you stand on is free (it used to snap straight back, so the lever could never leave 0 / 100 / a band edge by +/-1)
    for (const p of pts) if (Math.abs(v - p) < SNAP_WIN159) return p;
    return v;
  }"""))
E.append(("""    const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)));""",
"""    const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)), abs != null ? null : cur);   // patch168: cur = the step's origin"""))
apply(168, BASE, E)
