#!/usr/bin/env python3
"""patch169 - the auto-expanding gauge deck crushed the control sheet the player was using.

Found by the controls e2e (the second press on the rod sheet landed on a gauge label) and confirmed
by screenshot: the first time period / reactivity leave 'normal' during the Level-1 lever raise - exactly
when the Chief says "insert the rods" - autoExpandDeck() opens the in-flow gauge deck, the world canvas
shrinks to ~190 px and the open rod sheet is squeezed into an unreadable strip (buttons overlap the
text).  Worse, closing the deck by hand was futile: autoExpandDeck() runs on every HUD update while any
gauge is off-normal and re-opened it within a frame.

 - While a control sheet is open the deck no longer auto-expands (the always-visible mini-dial strip
   still shows every reading and pulses red on danger; the Chief still announces it).
 - A deck the player closes by hand stays closed for the current alarm picture; it may auto-open
   again only when the set / severity of alarms changes (a new or worse alarm) or after the plant
   has been all-normal.
Physics untouched.
"""
from _patchlib import apply
BASE = '39c82c2b9bb9290d59b18a412573d180'   # patch168 output
E = []
E.append(("""function toggleGaugeDeck() {
  deckExpanded = !deckExpanded;""",
"""// patch169: alarm picture as one base-3 number (0 normal / 1 caution / 2 danger per gauge) - no allocation.
const SN_ALARM_KEYS = ['temp', 'press', 'power', 'react', 'period', 'steam', 'level'];
function snAlarmCode() { let c = 0; for (let i = 0; i < SN_ALARM_KEYS.length; i++) { const z = alarms[SN_ALARM_KEYS[i]]; c = c * 3 + (z === 'danger' ? 2 : z === 'caution' ? 1 : 0); } return c; }
let deckDismissedCode = -1;   // patch169: alarm picture the player closed the deck on (-1 = none)
function toggleGaugeDeck() {
  deckExpanded = !deckExpanded;
  deckDismissedCode = (!deckExpanded && typeof alarms !== 'undefined') ? snAlarmCode() : -1;   // patch169: a manual close sticks for this alarm picture"""))
E.append(("""function autoExpandDeck() {
  if (snDemoActive121()) return;""",
"""function autoExpandDeck() {
  if (typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop) return;   // patch169: never open the deck over the control sheet the player is working
  if (deckDismissedCode >= 0 && snAlarmCode() === deckDismissedCode) return;   // patch169: the player closed it on exactly this alarm picture
  if (snDemoActive121()) return;"""))
E.append(("""  if (hasAlarm) autoExpandDeck();""",
"""  if (hasAlarm) autoExpandDeck(); else deckDismissedCode = -1;   // patch169: all-normal re-arms the auto-expand"""))
apply(169, BASE, E)
