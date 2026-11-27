#!/usr/bin/env python3
"""patch180 - Kevin's order "Fix the climb up": the action prompt can no longer cross the canvas top into the step bar.

AUDIT-2026-11-27 flagged the landscape "CLIMB UP" label drawn over the step bar.  CL1's geometry map
(workers/CL1-report.md, WA-CL1 confirmed): every prompt (CLIMB UP, CLIMB DOWN, OPEN, WALK TO) shares the
one #actionBtn element positioned by snActionLift with clear = 220 (ladder shown) or 122 canvas px above
the canvas bottom edge, and NOTHING capped the base path - only the lift-above-head branch clamped clear
to H - bh - 4.  So whenever the canvas height H drops below clear + bh (272 for climb), the button top
crosses the canvas top into the step bar above it.  At standard viewports (desktop landscape, portrait
phones, Chief collapsed, gauge deck mini) H is 488-839 and there is no collision; the live residual is
1280x800 with the gauge deck EXPANDED (H = 199): the whole 52 px climb prompt sat inside the step bar.
Fix: one clamp line in snActionLift, immediately before the style.bottom assignment, applying the same
H - bh - 4 cap to every path.  Strict no-op whenever H permits the nominal clear (cap = H - 56 = 432-783
at every standard in-scope viewport, all > 220), so nominal positions and the patch77 nav clearance are
unchanged in normal play; at H = 199 the climb clear becomes 143 and the prompt top lands exactly 4 px
below the canvas top (overlap 52 -> 0).  Step bar untouched, 220/122 untouched, no orientation condition.
Physics untouched.
"""
from _patchlib import apply
BASE = 'dabc0f8e7291026dd2bf02fd8ad1f3a3'   # patch179 output (docs-only commits on top do not touch the game file)
E = [("""  ab.style.bottom = (below + clear) + 'px';""",
"""  clear = Math.min(clear, Math.max(0, H - bh - 4)); // patch180: cap EVERY prompt path (CLIMB UP/DOWN, OPEN, WALK TO share snActionLift) so the button top never crosses the canvas top into the step bar - previously only the lift-above-head branch was capped; strict no-op whenever H permits the nominal 220/122 clear
  ab.style.bottom = (below + clear) + 'px';""")]
apply(180, BASE, E)
