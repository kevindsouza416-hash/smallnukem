#!/usr/bin/env python3
"""patch175 - the demo / takeover / walkthrough driver can answer an emergency again.

Found by running the Ship #25 walkthrough through Level 2 (it SCRAMmed on 'High steam pressure' at 1x and 5x):
the level injects a turbine trip right after operating pressure; the driver's answer (open the bypass) needs
Fluke at the steam-valve panel, but since the Chief-follow walk replaced the original instant pin
(patch99+: 'if (typeof SHOWME === undefined) demoPin()' is now never true) he has to WALK across the plant
first, and pressure reaches the 8.3 MPa trip before he arrives.  When something is urgent - turbine
tripped or tripping, feedwater lost, pressure above 7.5 MPa or level below 85 % - the driver now skips the
walk and places Fluke and the Chief at the panel; the D20 fix-start recovery cinematic is held back during such an emergency in a walkthrough (it blocks the driver's input for 5-10 s while the sim keeps running) (the same placement the existing 30 s walk-failsafe uses).
Calm 1x stretches still walk exactly as before; while the pacing layer has the clock boosted (>1.5x) the walk is skipped too, since a 10 s walk would be ~100 s of unattended plant.  The driver also reaches Level 2's scheduled turbine trip at low power (lever 15 % once the feedwater trip has fired) - the trip is scheduled 'just after sync, at low power' for her 200 MWt bypass, but the driver's heat-up lever (~350-500 MWt) made it unsurvivable.  Physics untouched.
"""
from _patchlib import apply
BASE = 'a53c76f0c436a7a6ab89ac5280489e22'   # patch174 output
E = []
E.append(("""function guideTick(dt) {""",
"""// patch175: something the driver must answer NOW (it cannot spend ten seconds walking to the panel)
function snDriverUrgent() {
  return !!(S && (S.turbTrip > 0 || (S.ev && S.ev.tu === 1) || !S.fwOK || S.p > 7.5 || S.level < 85));
}
function guideTick(dt) {"""))
E.append(("""    if ((cArr && fArr) || SHOWME.walkT > 30) {
      if (SHOWME.walkT > 30) {""",
"""    const urgent175 = (snDriverUrgent() || SN_PACE.effective > 1.5) && SHOWME.walkT > 0.25;   // patch175: emergencies - and boosted-clock stretches, where a 10 s walk is 100 s of unattended plant - skip the walk
    if ((cArr && fArr) || SHOWME.walkT > 30 || urgent175) {
      if (SHOWME.walkT > 30 || urgent175) {"""))
# the D20 recovery cinematic fires at the moment a fix begins - while the sim keeps running and the cinematic
# swallows every driver input for 5-10 s: in an emergency the walkthrough would watch the plant trip
E.append(('''      SN_CINE.offer(key);
    }
  }
  if (TAKEOVER.state === 'shutdown') {''', '''      if (!(SN_WALK.active && snDriverUrgent())) SN_CINE.offer(key);   // patch175: no 5-10 s cinematic over a live emergency during the walkthrough (it blocks the driver's input while the plant keeps running)
    }
  }
  if (TAKEOVER.state === 'shutdown') {'''))
# Level 2 schedules the turbine trip 'just after sync, at LOW power: the bypass can carry the plant' (BWR QB_MAX is 200 MWt);
# the driver's heat-up lever (~40-58 %) is ~350-500 MWt, which no bypass can carry.  After the feedwater trip, with the
# 'be ready on the bypass' warning up, the driver now heats gently so the scheduled trip is a drill, not a death sentence.
E.append(('''  else if (S.turbTrip > 0) leverT = 15; // turbine out: cut power, bypass carries the rest (her QB_MAX)''',
'''  else if (gameState.level === 2 && gameState.l2Stage === 1 && S.phase === 'heatup') leverT = 15; // patch175: L2's turbine trip is scheduled right after sync - arrive there at low power, where her QB_MAX 200 MWt bypass can carry it
  else if (S.turbTrip > 0) leverT = 15; // turbine out: cut power, bypass carries the rest (her QB_MAX)'''))
apply(175, BASE, E)
