#!/usr/bin/env python3
"""patch161 - input hygiene (found by the controls audit, docs/AUDIT-2026-11-27.md).

 D1  Held keys / pointers survive a focus loss: nothing in the build listened
     for blur / visibilitychange / pagehide, so alt-tab, a notification shade
     or an app switch with a key or finger down left Fluke walking (or a lever
     being dragged) forever.  snReleaseAllInput() clears every input source.
 D2  The startup splash (z 600, opaque) was dismissed only by a pointer: a
     keyboard player pressing Enter started the game underneath a video that
     kept covering it for up to 7 s.  Keys now skip it too (shortcuts excepted).
 D3  Any mouse button was a press: right / middle click walked Fluke or
     operated a panel.  Only the primary button counts (touch / pen unchanged).
 D4  mergeInput() allocated two arrays per frame (Object.values x2) in the hot
     loop, against the zero-hot-loop-allocation budget.

Base: ship #24 (6dc80315b5ef9fb69d537227c3411ab0).  Physics block untouched.
"""
from _patchlib import apply, PHYS_SAMIRA

BASE = '6dc80315b5ef9fb69d537227c3411ab0'

E = []

# D4 + D1: function inserted ahead of mergeInput(); the hot-loop scan is rewritten allocation-free
E.append(("""function mergeInput() {
  const kbNow153 = performance.now();""",
"""// patch161 (D1): one place that lets go of EVERY input source.  Runs on
// blur / tab-hidden / pagehide: the OS delivers no keyup / pointerup once
// focus is gone, so without this a held key or finger sticks until the next
// real press.  Panel grabs are released through SN_TOUCH.up (snap-on-release
// still applies), the rest is cleared in place - no allocation.
function snReleaseAllInput() {
  for (const k in keys) keys[k] = false;
  for (const k in KB) KB[k] = false;
  for (const k in KB_LATCH) KB_LATCH[k] = 0;
  for (const k in keysJustPressed) delete keysJustPressed[k];
  for (const k in SN_WASD.held) SN_WASD.held[k] = false;
  for (const k in SN_WASD.heldLatch) SN_WASD.heldLatch[k] = 0;
  SN_WASD._holdCode = null; SN_WASD._opEdge = false;
  for (const [id, p] of pointers) { if (p.role === 'pop') { try { SN_TOUCH.up(id); } catch (e) {} } }
  pointers.clear();
  GP.holdE = GP.holdQ = false;
  syncPointerInput();
}
function snAnyKeyHeld() { for (const k in KB) { if (KB[k]) return true; } return false; }   // allocation-free scan of the keyboard state
window.addEventListener('blur', snReleaseAllInput);
window.addEventListener('pagehide', snReleaseAllInput);
document.addEventListener('visibilitychange', () => { if (document.hidden) snReleaseAllInput(); });

function mergeInput() {
  const kbNow153 = performance.now();"""))

E.append(("""  if (Object.values(KB).some(v => v) || Object.values(KB_LATCH).some(t => t > kbNow153)) SN_TOUCH.notePhys();""",
"""  let phys161 = false;   // patch161 (D4): allocation-free scan (was two Object.values arrays per frame)
  for (const k in KB) { if (KB[k]) { phys161 = true; break; } }
  if (!phys161) for (const k in KB_LATCH) { if (KB_LATCH[k] > kbNow153) { phys161 = true; break; } }
  if (phys161) SN_TOUCH.notePhys();"""))

# D3: primary button only (both canvas pointerdown listeners)
E.append(("""  cv.addEventListener('pointerdown', e => {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}""",
"""  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;   // patch161 (D3): right / middle click is not a press
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}"""))

E.append(("""    cvEl.addEventListener('pointerdown', e => {
      lpX = e.clientX; lpY = e.clientY;""",
"""    cvEl.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;   // patch161 (D3): a right-button double-click must not open the map
      lpX = e.clientX; lpY = e.clientY;"""))

# D2: splash skip by key
E.append(("""  window.addEventListener('pointerdown', end, true);
  v.addEventListener('ended', () => end());""",
"""  window.addEventListener('pointerdown', end, true);
  // patch161 (D2): a key skips the splash too (browser / OS shortcuts and bare modifiers excepted)
  const endKey = e => { if (e.ctrlKey || e.metaKey || e.altKey || /^(Shift|Control|Alt|Meta|F\\d+)/.test(e.code)) return; end(e); };
  window.addEventListener('keydown', endKey, true);
  v.addEventListener('ended', () => end());"""))
E.append(("""    window.removeEventListener('pointerdown', end, true);
  }""",
"""    window.removeEventListener('pointerdown', end, true);
    window.removeEventListener('keydown', endKey, true);
  }"""))


# D4 (cont.): the two help-tick call sites scan KB the same way
E.append(("""  const manual = Object.values(KB).some(v => v) || pointers.size > 0;""",
"""  const manual = snAnyKeyHeld() || pointers.size > 0;   // patch161 (D4)"""))
E.append(("""  const active = Object.values(KB).some(v => v) || pointers.size > 0 || Math.abs(player.vx || 0) > 5 || player.onLadder;""",
"""  const active = snAnyKeyHeld() || pointers.size > 0 || Math.abs(player.vx || 0) > 5 || player.onLadder;   // patch161 (D4)"""))

apply(161, BASE, E, phys_before=PHYS_SAMIRA)
