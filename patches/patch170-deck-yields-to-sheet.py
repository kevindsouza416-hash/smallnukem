#!/usr/bin/env python3
"""patch170 - follow-up to patch169: an AUTO-opened deck yields when a control sheet opens.

patch169 stopped the deck auto-opening over an open sheet, but a deck that had already auto-opened
(sheet closed, alarm showing) stayed open when the player then opened a sheet, and still crushed it
(a press on the sheet's SCRAM / minus button landed on a gauge label).  autoExpandDeck() now records
that the deck was opened automatically; updateDeckAutoClose() (every frame) closes an auto-opened
deck the moment a control sheet is open.  A deck the player opened by hand (toggleGaugeDeck) is
left alone.  Physics untouched.
"""
from _patchlib import apply
BASE = '71cf907d2b86584f50ad4f82468b66bb'   # patch169 output
E = []
E.append(("""let deckDismissedCode = -1;   // patch169: alarm picture the player closed the deck on (-1 = none)""",
"""let deckDismissedCode = -1;   // patch169: alarm picture the player closed the deck on (-1 = none)
let deckAutoOpened = false;   // patch170: the deck is open because the game opened it (not the player)"""))
E.append(("""  deckDismissedCode = (!deckExpanded && typeof alarms !== 'undefined') ? snAlarmCode() : -1;   // patch169: a manual close sticks for this alarm picture""",
"""  deckDismissedCode = (!deckExpanded && typeof alarms !== 'undefined') ? snAlarmCode() : -1;   // patch169: a manual close sticks for this alarm picture
  deckAutoOpened = false;   // patch170: any manual toggle makes the deck the player's"""))
E.append(("""  if (!deckExpanded) {
    deckExpanded = true;
    document.getElementById('gaugeDeckExpanded').style.display = 'block';""",
"""  if (!deckExpanded) {
    deckExpanded = true; deckAutoOpened = true;   // patch170
    document.getElementById('gaugeDeckExpanded').style.display = 'block';"""))
E.append(("""function updateDeckAutoClose(dt) {
  if (deckAutoCloseTimer > 0) {""",
"""function updateDeckAutoClose(dt) {
  if (deckExpanded && deckAutoOpened && typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop) {   // patch170: an auto-opened deck yields to the control sheet being worked
    deckExpanded = false; deckAutoOpened = false; deckAutoCloseTimer = 0;
    document.getElementById('gaugeDeckExpanded').style.display = 'none';
    document.getElementById('deckExpandArrow').innerHTML = '&#9650; GAUGES';
    requestAnimationFrame(deckRelayout);
  }
  if (deckAutoCloseTimer > 0) {"""))
apply(170, BASE, E)
