#!/usr/bin/env python3
"""patch177 - snStandX (patch174) must stand Fluke ON the panel's own deck.

Found by the Level-2 walkthrough run: for rod drive 1 (upper deck) the neighbour-aware search chose x=414,
which is past the deck's left edge - Fluke dropped to the lower floor, where the SLC panel became the nearest
interactable and every operate press toggled the SLC instead of raising the lever.  Candidates are now also
required to lie on a platform whose top is the pin's floor line.  Physics untouched.
"""
from _patchlib import apply

BASE = '43da3d6528a7f89b50ee2950f62e089a'   # patch176 output
E = [("""  const wins = sx => {
    const d0 = Math.hypot(cx - sx, pin.y + pin.h / 2 - py);
    if (d0 >= 80) return false;""",
"""  const floorY = pin.y + pin.h;
  const onDeck = sx => platforms.some(pl => Math.abs(pl.y - floorY) < 8 && sx - player.w / 2 >= pl.x && sx + player.w / 2 <= pl.x + pl.w);   // patch177: he must stand ON the pin's deck, not drop off its edge
  const wins = sx => {
    if (!onDeck(sx)) return false;
    const d0 = Math.hypot(cx - sx, pin.y + pin.h / 2 - py);
    if (d0 >= 80) return false;""")]
apply(177, BASE, E)
