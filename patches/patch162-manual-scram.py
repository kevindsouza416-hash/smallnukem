#!/usr/bin/env python3
"""patch162 - restore the operator's manual SCRAM (controls audit, docs/AUDIT-2026-11-27.md).

Samira's original UI has a Protection group with SCRAM and ARI buttons
(provenance/samira-original/js/ui.js, 'Protection') and a debrief line for
'Manual scram by operator'.  The game port wired ARI and every automatic trip
but never wired BWR.scramNow(): a player could not trip the reactor on purpose,
and a SCRAM overlay always read '!! AUTOMATIC SCRAM !!'.

 - Hold X (keyboard) or Back/View (gamepad) for 1.0 s: SCRAM.  Releasing early
   cancels; a red progress pill shows the hold.  Safety control = deliberate.
 - World ARI-01 panel gains a guarded SCRAM hold button beside ARI (0.8 s,
   the same hold language as the SLC and feed-pump buttons) for mouse / touch.
 - The overlay and the Chief's caption tell a manual SCRAM from an automatic
   one (the Chief's stock 'protection system did its job' clip is not used for
   it - it would be wrong).
Physics block untouched: this only calls her scramNow().
"""
from _patchlib import apply, PHYS_SAMIRA

BASE = '55eeced51c29d0ef3a29abd155a34888'   # patch161 output

E = []

E.append(("""<div id="scramAlert">!! AUTOMATIC SCRAM !!<br>""",
          """<div id="scramAlert"><span id="scramHead">!! AUTOMATIC SCRAM !!</span><br>"""))

E.append(("""  document.getElementById('scramAlert').style.display = 'block';
  document.getElementById('scramReason').textContent = reason;
  showCallout('scram');""",
"""  document.getElementById('scramAlert').style.display = 'block';
  document.getElementById('scramReason').textContent = reason;
  const manual162 = /^Manual/.test(reason);   // patch162: the operator's own SCRAM is not an automatic one
  const head162 = document.getElementById('scramHead');
  if (head162) head162.textContent = manual162 ? '!! MANUAL SCRAM !!' : '!! AUTOMATIC SCRAM !!';
  if (manual162) {
    const t162 = 'Manual SCRAM. You tripped the reactor by hand. Rods are in and passive cooling holds the plant: a safe shutdown.';
    showCalloutText(t162); chiefSpeak(t162, true); CHIEF.expr = 'alarmed'; CHIEF.exprT = 4;
  } else showCallout('scram');"""))

E.append(("""function triggerScram(reason) {""",
"""// patch162: the operator's SCRAM.  Hold X (1.0 s) or gamepad Back/View, or hold the
// SCRAM button on the ARI-01 panel (0.8 s).  Release early = cancelled.  The trip
// itself is HER BWR.scramNow(); checkScramConditions() then raises the overlay.
const SN_SCRAM = { t: 0, HOLD_S: 1.0 };
function snManualScram() {
  if (!S || gameState.phase !== 'playing' || S.scram || S.phase === 'failed' || S.phase === 'complete') return false;
  BWR.scramNow(S);
  return true;
}
function snScramPillSet(frac) {
  let el = document.getElementById('scramPill');
  if (!el) {
    if (frac <= 0) return;
    el = document.createElement('div'); el.id = 'scramPill'; el.textContent = 'HOLD TO SCRAM';
    el.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:950;padding:7px 16px;border:2px solid #e5484d;border-radius:6px;color:#ffe3e3;font:bold 15px "Courier New",monospace;letter-spacing:1px;pointer-events:none;white-space:nowrap';
    document.body.appendChild(el);
  }
  el.style.display = frac > 0 ? 'block' : 'none';
  if (frac > 0) { const pct = Math.round(Math.min(1, frac) * 100); el.style.background = 'linear-gradient(90deg,#b01515 ' + pct + '%,#2a0a0a ' + pct + '%)'; }
}
function snScramHoldTick(dt) {
  const gp = getGamepad();
  const down = !!(KB['KeyX'] || (gp && gp.buttons[8] && gp.buttons[8].pressed));
  if (!down || gameState.phase !== 'playing' || CINE_ACTIVE || !S || S.scram) { if (SN_SCRAM.t > 0) snScramPillSet(0); SN_SCRAM.t = 0; return; }
  SN_SCRAM.t += dt;
  snScramPillSet(SN_SCRAM.t / SN_SCRAM.HOLD_S);
  if (SN_SCRAM.t >= SN_SCRAM.HOLD_S) { SN_SCRAM.t = 0; snScramPillSet(0); snManualScram(); }
}

function triggerScram(reason) {"""))

E.append(("""  handleGamepad();
  // 280 ms hold-gate flip""",
"""  handleGamepad();
  snScramHoldTick(dt);   // patch162
  // 280 ms hold-gate flip"""))

# panel: sheet press
E.append(("""    if (a === 'ari_button' && ly > soY(130)) { actuateARI(); return; }""",
"""    if (a === 'ari_button' && ly > soY(130)) {
      if (lx < r.w / 2) { pop.grab = { id, kind: 'hold', fx: 'scramFire', t: performance.now() }; snTick(880, 0.04, 0.06); return; }   // patch162: left half = SCRAM (hold), right half = ARI (tap)
      actuateARI(); return;
    }"""))
# panel: hold completes
E.append(("""        if (pop.grab.fx === 'slcFire') {""",
"""        if (pop.grab.fx === 'scramFire') { SN_SFX.switchThrow(); SN_SFX.holdDone(); snManualScram(); }   // patch162
        if (pop.grab.fx === 'slcFire') {"""))
# panel: art
E.append(("""      mushroom(cx, r.y + soY(182), srY(44), '#b01515', '#e84a4a');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center'; ctx.fillText('ARI', cx, r.y + soY(188));""",
"""      mushroom(cx + 62, r.y + soY(182), srY(44), '#b01515', '#e84a4a');   // patch162: ARI right (tap) ...
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center'; ctx.fillText('ARI', cx + 62, r.y + soY(188));
      mushroom(cx - 62, r.y + soY(182), srY(44), '#5c0d0d', '#c0392b');   // ... SCRAM left (hold)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Courier New'; ctx.fillText('SCRAM', cx - 62, r.y + soY(187));
      ctx.fillStyle = '#9fd8ff'; ctx.font = '11px Courier New'; ctx.fillText('HOLD: SCRAM  \\u00b7  TAP: ARI', cx, r.y + soY(240));
      if (pop.grab && pop.grab.kind === 'hold' && pop.grab.fx === 'scramFire') { ctx.fillStyle = '#e5484d'; ctx.fillRect(cx - 62 - 40, r.y + soY(222), 80 * Math.min(1, (performance.now() - pop.grab.t) / 800), 5); }"""))

apply(162, BASE, E, phys_before=PHYS_SAMIRA)
