#!/usr/bin/env python3
"""patch179 - the driver switches the isolation condenser off when it has latched open after an excursion.

Level-2 walkthrough run: after the scheduled turbine-trip drill pressure passes 8.0 MPa, her model opens the
isolation condenser (icOpen) and - with ctl.ic still 'auto' - never closes it again; it keeps rejecting up to
70 MWt, so at 100% lever the plant plateaus at 274 MWe (< the 285 hold) and the step never finishes.  The
operator's remedy is the isolation-condenser panel (ctl.ic -> 'off').  The driver now does that, once, in the
power phase when the pressure has recovered.  Physics untouched.
"""
from _patchlib import apply
BASE = '5980245059ee70bd46e7c868979d873f'   # patch178 output
E = [("""  else if (S.p > 7.35 && bypassPct < 100) { action = 'steam_valve'; mode = 'E'; }""",
"""  else if (S.phase === 'power' && S.icOpen && S.ctl.ic !== 'off' && S.p < 7.35 && S.turbTrip <= 0) { action = 'iso_condenser'; mode = 'tap'; } // patch179: an IC latched open by an earlier excursion caps the plant below 285 MWe - the operator closes it (ctl.ic 'off')
  else if (S.p > 7.35 && bypassPct < 100) { action = 'steam_valve'; mode = 'E'; }""")]
apply(179, BASE, E)
