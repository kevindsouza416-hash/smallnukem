#!/usr/bin/env python3
"""patch176 - the auto-boosted clock no longer runs while a cinematic has the player's hands tied.

Found by tracing the Ship #25 walkthrough through Level 2: a cinematic (5-10 s of wall time) plays during
the 10x passive-wait boost, input is locked for its whole length (any input only dismisses it) and the sim
never pauses - so the plant advanced ~100-180 simulated seconds with nobody able to touch it, heating up
unattended until pressure was past the point where an answer could arrive.  A human player has the same
exposure.  Game-layer pacing only (the wall-clock-to-sim scale in paceTick); Samira's physics block and
the fixed 10 Hz step are untouched.  While CINE_ACTIVE the clock runs at the player's chosen speed.  Also: a walkthrough closes a running cinematic when snDriverUrgent() (patch175) says the plant needs the driver now.
"""
from _patchlib import apply
BASE = '3a82cc6a5f332df63b2d8562cc9fb812'   # patch175 output
E = [("""function paceTick() {
  if (!S || gameState.phase !== 'playing') { SN_PACE.effective = SN_PACE.player; SN_PACE.kind = 0; return SN_PACE.player; }""",
"""function paceTick() {
  if (!S || gameState.phase !== 'playing') { SN_PACE.effective = SN_PACE.player; SN_PACE.kind = 0; return SN_PACE.player; }
  if (typeof CINE_ACTIVE !== 'undefined' && CINE_ACTIVE) { SN_PACE.effective = SN_PACE.player; SN_PACE.kind = 0; paceUiTick(); return SN_PACE.player; }   // patch176: no auto-boost while a cinematic has the player's hands tied (input is locked, the sim keeps running)""")]
# the walkthrough's own driver cancels a cinematic the moment the plant needs it (this is the Chief stepping away from
# the screen - programmatic, not a player input, so it does not stop the walkthrough)
E.append(("""  if (!SN_WALK.gap) return;
  SN_WALK.gapT += dt;""", """  if (!SN_WALK.gap && CINE_ACTIVE && snDriverUrgent()) { try { SN_CINE.close(false); SN_CINE.state.queue.length = 0; } catch (e) {} return; }   // patch176: the Chief does not watch a movie over a live emergency
  if (!SN_WALK.gap) return;
  SN_WALK.gapT += dt;"""))
# during a walkthrough the driver is the one at the controls: a 5-14 s mid-level cinematic locks every input while the sim runs
# (it held Level 2's lever up through a heat-up).  Mid-level cinematics are skipped for the walkthrough; level_complete still plays.
E.append(('''    if (typeof SN_AUDIO !== 'undefined' && !SN_AUDIO.cine) {''', '''    if (typeof SN_WALK !== 'undefined' && SN_WALK.active && !SN_WALK.gap && key !== 'level_complete') { state.log.push({ key, dur_s: 0, dismissed: false, dropped: 'walkthrough_driving' }); return; }   // patch176: the walkthrough's driver must keep the controls
    if (typeof SN_AUDIO !== 'undefined' && !SN_AUDIO.cine) {'''))
apply(176, BASE, E)
