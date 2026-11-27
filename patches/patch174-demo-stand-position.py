#!/usr/bin/env python3
"""patch174 - the demo / takeover / walkthrough driver operated the WRONG panel next to the feed pump.

Found by running the Ship #25 walkthrough through Level 2: after the main feedwater pump trips, the driver
walks Fluke to the feed-pump panel and 'taps' it - but it parks him 56 px to one side, and the isolation
condenser panel stands next to the feed pump, so the game's nearest-interactable rule (hypot of centres,
< 80) hands every tap to the ISO CONDENSER.  The pump was never started, the IC flapped auto/off, the
level wandered 72-94 % and the walkthrough sat in the power phase forever.  Players hit the same trap
when a Chief-follow parks them beside the wrong machine.  snStandX() now picks, among a few offsets
either side (and centred), the first spot where the pinned panel IS the nearest interactable.
Physics untouched.
"""
from _patchlib import apply
BASE = 'fad27ff3ed0fa1391c14029817466be5'   # patch173 output
E = []
E.append(("""function guideTick(dt) {""",
"""// patch174: where Fluke stands for a panel so that the game's own nearest-interactable rule (hypot of
// centres, < 80) picks THAT panel - neighbours (the feed pump sits beside the isolation condenser)
// otherwise steal the tap.  Prefers the side he arrives from, then the other, then closer in, then centred.
function snStandX(pin, side) {
  const cx = pin.x + pin.w / 2, py = pin.y + pin.h - player.h / 2, d = [56, 36, 16];
  const wins = sx => {
    const d0 = Math.hypot(cx - sx, pin.y + pin.h / 2 - py);
    if (d0 >= 80) return false;
    for (const it of interactables) if (it !== pin && Math.hypot(it.x + it.w / 2 - sx, it.y + it.h / 2 - py) <= d0) return false;
    return true;
  };
  for (const o of d) { if (wins(cx + side * o)) return cx + side * o; if (wins(cx - side * o)) return cx - side * o; }
  return cx;
}
function guideTick(dt) {"""))
E.append(("""    SHOWME.flukeStandX = pin.x + pin.w / 2 + ((player.x + player.w / 2) >= pin.x + pin.w / 2 ? 56 : -56);""",
"""    SHOWME.flukeStandX = snStandX(pin, (player.x + player.w / 2) >= pin.x + pin.w / 2 ? 1 : -1);   // patch174: was a fixed +/-56 px, which handed the feed-pump taps to the neighbouring isolation condenser"""))
apply(174, BASE, E)
