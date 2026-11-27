#!/usr/bin/env python3
"""patch165 - PHYSICS: restore the dispatch target and grant recovery grace after the Level-3 grid emergency.

DELIBERATE DEVIATION from Samira's model (Decision 9) - authorised by the task owner
for this audit branch; see docs/AUDIT-2026-11-27.md and docs/MODEL-FIDELITY.md.

Defect in her game(): the grid emergency sets S.disp = 60 and nothing ever sets it
back until the NEXT dispatch segment starts.  The turbine returns at g ~ 154-158 s,
the next segment begins at 160 s, so for 3-6 s the HUD / scoring still ask for 60 MWe
(wrong target shown), and - unlike every ordinary segment change, which grants
grace = min(30, 4 + |step|/5) - no recovery time is granted after the forced trip,
although the plant is at ~2 MWe and must be re-ramped to the 150 MWe segment.

Fix: when the turbine is back (ev.tu 2 -> 3) set S.disp to the current segment's
target and grant the same grace formula her own segment change uses, measured from
the emergency's 60 MWe.

Gameplay gain (competent operator, 9 runs, 3 seeds x 3 lever speeds, tests in
docs/AUDIT-2026-11-27.md): dispatch-accuracy 0.850-0.857 -> 0.909-0.956 (+0.06..+0.10),
score +2..+3, the displayed dispatch target is correct from the instant the turbine returns,
and a forced trip no longer costs the player accuracy while the plant physically recovers.
"""
from _patchlib import apply, PHYS_SAMIRA
BASE = 'bbf6e1d6b1301e5313c3f3cba9bdabd9'   # patch164 output
NEW_PHYS = 'be5a0982bf00617bda59847174d69474'   # was a3385f4f29207be552c4a1c48b620d9b (Samira's verbatim block)
E = [("""      S.ev.tu = 3; S.score += 250; S.evPass++;
      log(S, 'Turbine back on the grid.', 'ok');""",
"""      S.ev.tu = 3; S.score += 250; S.evPass++;
      log(S, 'Turbine back on the grid.', 'ok');
      S.disp = SEG[S.segI].to;   // patch165: the emergency's 60 MWe target is over - back to the scheduled dispatch
      S.grace = Math.max(S.grace, Math.min(30, 4 + Math.abs(S.disp - 60) / 5));   // patch165: same recovery grace her segment change grants
      log(S, 'Grid asks for ' + S.disp + ' MWe again.', 'info');""")]
apply(165, BASE, E, phys_before=PHYS_SAMIRA, phys_after=NEW_PHYS)
