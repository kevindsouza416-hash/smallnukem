#!/usr/bin/env python3
"""patch183 - the patch180 climb-prompt clamp can be bypassed by the snActionLift layout cache: add H to the cache key so any canvas-height change forces a recompute through the clamp.

Three independent traces of the live build (sn-climb-fix evidence T1/T2/T3) established the defect.
snActionLift (line 6505) caches its result: it builds a layout key at line 6519 from ladderShown,
below, the player's screen position quantised to 16 px cells, and the action button's size, and on
a cache hit (line 6520, `if (key === _snLiftKey) return;`) it returns before any computation runs.
The patch180 clamp (line 6533: clear = Math.min(clear, Math.max(0, H - bh - 4))) sits below that
return, and the computed result depends on the global canvas height H at three places (lines 6528,
6530 and 6533) - yet H is not a component of the key, and nothing anywhere invalidates _snLiftKey
(it occurs only at lines 6504, 6520 and 6521).  Mechanism: a frame computes the lift under a larger
or stale H, where the clamp's cap H - bh - 4 >= 220 makes the clamp a no-op, so line 6534 writes
below + 220 (in the failing live state below 255 + clear 220 = bottom 475px) and the key is stored.
The gauge deck then expands, deckRelayout's deferred resize() drops H to 209, and the rebuilt world
reseats the player in the same 16 px cell with below, the ladder flag and the button size unchanged -
so every later per-frame call rebuilds the identical key, hits line 6520 and returns.  The clamp
that would cap clear at max(0, 209 - 52 - 4) = 153 (correct bottom 255 + 153 = 408px, button top
exactly 4 px below the canvas top) never runs, and the stale 475px bottom leaves the prompt top
63 px above the canvas top, overlapping the step bar.
Fix: append H to the cache key - the key gains a final `+ '|' + H` segment, the rest of the line
byte-identical.  Any change in H now produces a different key, the cache misses, and the function
recomputes through the existing clamped path (lines 6522-6534), so the patch180 cap is always
evaluated against the H actually in force.  Strict no-op whenever H is unchanged: the key string
is then exactly what the old code would have produced plus the constant H segment, the same key
still hits the cache on the same frames, and no recompute, clamp value or style.bottom changes.
Only the cache key changes - the clamp, the nominal 220/122 clears, the head-lift branch and the
style.bottom assignment are untouched.  Physics untouched.
"""
from _patchlib import apply
BASE = 'b80eea82bdb4fb4e5aba86770ca559a3'   # current live/main game file (patch182-era build, 1,100,939 B); the integrator re-pins if composition order differs
E = [("""  const key = (ladderShown ? 'L' : '-') + '|' + below + '|' + Math.round(w2sY(player.y) / 16) + '|' + Math.round(w2sX(player.x) / 16) + '|' + ab.offsetWidth + 'x' + ab.offsetHeight;""",
"""  const key = (ladderShown ? 'L' : '-') + '|' + below + '|' + Math.round(w2sY(player.y) / 16) + '|' + Math.round(w2sX(player.x) / 16) + '|' + ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;""")]
apply(183, BASE, E)
