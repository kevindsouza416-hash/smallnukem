#!/usr/bin/env python3
# patch-tests180 - locks for patch180 (the action prompt can never cross the canvas top into the step bar). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch 180 (SHIP #25, Kevin: "Fix the climb up"): snActionLift clamps clear on EVERY prompt path ----
// Geometry per CL1 (WA-CL1 confirmed): prompt height bh = 52; climb clear nominal 220, open/walk 122.
// Desktop chrome: canvas top (step-bar bottom) = 175, container below canvas = 66, H = VH - 241.
// Portrait phone chrome: canvas top = 133, below = 46, H = VH - 179. Deck expanded at 1280x800: below = 426, H = 199.
const p180geom = (VH, chrome, below, stepBottom, nominal) => { const H = VH - chrome; const eff = Math.min(nominal, Math.max(0, H - 52 - 4)); const top = VH - (below + eff) - 52; return { H: H, eff: eff, top: top, gap: top - stepBottom }; };
chk('p180: the clamp line sits in snActionLift immediately before the style.bottom assignment', html.includes("clear = Math.min(clear, Math.max(0, H - bh - 4)); // patch180") && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') > html.indexOf('function snActionLift') && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') < html.indexOf("ab.style.bottom = (below + clear) + 'px';"), '');
chk('p180: nominal clears unchanged (ladder 220 / other 122) and the step bar is not moved', html.includes('let clear = ladderShown ? 220 : 122;'), '');
chk('p180: desktop 1280x800 CLIMB - clamp is a no-op (eff 220), prompt top 462, gap to step-bar bottom 287, no overlap', (() => { const g = p180geom(800, 241, 66, 175, 220); return g.H === 559 && g.eff === 220 && g.top === 462 && g.gap === 287; })(), '');
chk('p180: desktop 1440x900 CLIMB - no-op (eff 220), prompt top 562, gap 387, no overlap', (() => { const g = p180geom(900, 241, 66, 175, 220); return g.H === 659 && g.eff === 220 && g.top === 562 && g.gap === 387; })(), '');
chk('p180: desktop 1920x1080 CLIMB - no-op (eff 220), prompt top 742, gap 567, no overlap', (() => { const g = p180geom(1080, 241, 66, 175, 220); return g.H === 839 && g.eff === 220 && g.top === 742 && g.gap === 567; })(), '');
chk('p180: portrait 390x844 CLIMB - no-op (eff 220), prompt top 526, gap 393, no overlap', (() => { const g = p180geom(844, 179, 46, 133, 220); return g.H === 665 && g.eff === 220 && g.top === 526 && g.gap === 393; })(), '');
chk('p180: portrait 375x667 CLIMB - no-op (eff 220), prompt top 349, gap 216, no overlap', (() => { const g = p180geom(667, 179, 46, 133, 220); return g.H === 488 && g.eff === 220 && g.top === 349 && g.gap === 216; })(), '');
chk('p180: OPEN/WALK (clear 122) no-op and clear of the step bar at the smallest in-scope canvas (375x667 portrait)', (() => { const g = p180geom(667, 179, 46, 133, 122); return g.eff === 122 && g.top === 447 && g.gap === 314; })(), '');
chk('p180: THE BUG - 1280x800 with gauge deck EXPANDED (H 199): unclamped climb prompt top would be 102 (52 px inside step bar 61-175); clamped eff 143, top 179, gap exactly 4, overlap 52 -> 0', (() => { const g = p180geom(800, 601, 426, 175, 220); const unclampedTop = 800 - (426 + 220) - 52; return g.H === 199 && unclampedTop === 102 && (175 - unclampedTop) > 0 && g.eff === 143 && g.top === 179 && g.gap === 4; })(), '');
chk('p180: clamp guarantees prompt top >= 4 px below canvas top for every canvas height 60..900 and both nominal clears', (() => { for (let H = 60; H <= 900; H++) { for (const n of [220, 122]) { const eff = Math.min(n, Math.max(0, H - 52 - 4)); if (H - eff - 52 < Math.min(4, H - 52)) return false; if (H >= n + 56 && eff !== n) return false; } } return true; })(), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests180 applied')
