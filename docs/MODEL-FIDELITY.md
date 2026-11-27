# Small Nukem — Model Fidelity Record (Decision 9)

**Ruling (Kevin, 2026-11-25 ~00:50 EST): "There shouldn't be any deliberate differences."**

Samira's original model — `reference/js/model.js`, the BWRX-300 Training
Simulator Model v2 — is the source of truth for all physics constants,
trips, alarms, start state, and behaviour in the game. As of the
fidelity patch (2026-11-25), the game's simulation **is** her model,
embedded verbatim in `small-nukem.html` (the `BWR` block). The spec's
R63 table has been corrected to her values in all three copies.

Verification: `tests/value-checks.mjs` — 86 checks asserting her
constants and behaviours against the model extracted from the shipped
file. **86/86 PASS** (log: `gates/milestone-2/value-checks.log`).

## Reconciliation table

Action key: **MATCH** = game already had her value · **CHANGED** = game
value replaced by hers · **ADDED** = her model had it, game lacked it,
now implemented · **REMOVED** = game invention with no counterpart in
her model, deleted · **MAPPED** = her behaviour carried into the
game's level/fault/control design.

### Constants (all 33 of hers, now in force verbatim)

| Hers | Her value | Game before | Action |
|---|---|---|---|
| MWT | 870 MWt | implicit arcade heat factor | CHANGED — rated thermal power, heat balance denominator |
| MWE | 300 MWe | 300 (nominal_power_MWe) | MATCH |
| ETA | 0.348 | — | ADDED — turbine efficiency in MWe conversion |
| CTH | 45 | arcade heat_transfer_rate | CHANGED — core thermal capacity in her heat balance |
| LOSS | 0.06 | — | ADDED — vessel heat loss term |
| PSET | 7.2 MPa | 7.2 (nominal_press) | MATCH — operating setpoint |
| P_BYP | 7.45 MPa | — | ADDED — bypass auto-open; pressure gauge caution edge |
| P_SCRAM | 8.3 MPa | 8.5 | **CHANGED** — pressure trip, her reason 'High steam pressure' |
| P_IC | 8.0 MPa | — | ADDED — isolation condenser auto-open |
| P_SYNC | 6.3 MPa | manual sync at 1750 RPM | CHANGED — generator syncs automatically at 6.3 MPa |
| P_OK | 6.8 MPa | procedure used ~6.5–7.2 loosely | CHANGED — operating-pressure phase gate |
| TURB_MAX | 900 MWt | — | ADDED — turbine steam cap |
| QB_MAX | 200 MWt | — | ADDED — bypass capacity |
| IC_MAX | 70 MWt | — | ADDED — IC heat removal at full ΔT |
| KP | 0.12 | — | ADDED — power feedback coefficient |
| KT | 0.10 | temp_coeff −0.003 mK/°C (linear, invented) | CHANGED — her temperature feedback (normalised Tn) |
| WORTH | 0.6 Δk/k | rod_worth_total 10 mK + core_excess 5 mK (invented) | CHANGED — her rod worth curve |
| RC | 0.30 | rods started at 0% out | CHANGED — critical rod position; start state |
| ROD_RATE | 0.05 /s | rod rate 8 %/s direct | CHANGED — her auto rod drive rate (manual 0.02 /s) |
| NSRC | 0.002 | power started at 0 | CHANGED — source-range power, critical at 0.2% |
| HEAT_LIM | 150 °C/min | no heat-up rate limit | ADDED — scored during heatup phase |
| TOL | 12 MWe | — | ADDED — grid dispatch tolerance |
| LVL_ALARM | 85 % | no level variable | ADDED — level alarm |
| LVL_SCRAM | 62 % | no level variable | ADDED — level trip 'Low reactor water level' |
| N_SCRAM | 1.12 (112%) | danger 105%, trip at 110% | **CHANGED** — power trip 'High reactor power' |
| LVL_FUEL | 35 % | — | ADDED — plant failure 'Core uncovered: fuel damage' |
| P_SRV | 8.6 MPa | — | ADDED — SRV lift |
| P_SRV_RESEAT | 8.0 MPa | — | ADDED — SRV reseat (hysteresis) |
| CPOOL | 3000 | — | ADDED — suppression pool thermal capacity |
| PC_ALARM | 300 kPa | — | ADDED — containment pressure alarm |
| PC_VENT | 400 kPa | — | ADDED — containment vent threshold |
| PC_FAIL | 600 kPa | — | ADDED — plant failure 'Containment overpressure' |
| POOL_ALARM | 65 °C | — | ADDED — suppression pool temperature alarm |

### Model structure & behaviour

| Hers | Game before | Action |
|---|---|---|
| psat table (12 points, 20–330 °C); p = psat(Tc) | linear pressure-from-temp approximation | CHANGED — pressure is saturation-coupled, exactly hers |
| Start state: Tc 30 °C, p 0.10 MPa, n = NSRC, rod = RC, level 100 | 25 °C, −5 mK, 0 power, rods 0% | CHANGED — her create()/start() state and log lines |
| Kinetics: lever demand, auto rod control (rc clamp), delayed-neutron lag (nLag, 8 s), decay heat h | period-formula arcade kinetics | CHANGED — her phys() kinetics verbatim |
| Reactor period: smoothed d(ln n)/dt (dln); period = 1/dln | R63 piecewise period calibration (invented) | REMOVED/CHANGED — display now derives from her dln |
| Feedbacks: KP·nLag + KT·Tn + 0.9·boron + 0.003·(95−level) void | xenon poisoning (invented) | CHANGED — xenon REMOVED (no xenon in her model); her four feedbacks in force |
| Water level: boil-off vs feedwater auto control (lvlSet 100) + injection | absent | ADDED — first-class variable, **7th gauge** (R65 count yields to Decision 9) |
| Feedwater: fwMode auto/man, standby pump rfpStby (0.8 availability) | absent | ADDED — world panel FEED PUMP B works ctl.rfpStby |
| RCIC auto (on <80, off >98), HPCF auto (on <72, off >95), RHR (pool/SDC/LPCI), alternate injection | absent | ADDED — RCIC panel wired; HPCF/RHR run in the model (panels in M4) |
| Turbine: rolls/syncs at P_SYNC if condenser OK; 1500 RPM synchronous; trip logic (grid/MSIV/vacuum) | manual valve + 1800 RPM + manual breaker | CHANGED — measured, not commanded (also R46) |
| Bypass: auto at P_BYP (1200·(p−P_BYP) gain) or manual byMan, cap QB_MAX·condCap | steam valve as flow source (invented) | MAPPED — the game's steam valve now works her bypass (ctl.bypass/byMan) |
| MSIV: closes 3 s after condenser loss above 1.5 MPa | absent | ADDED — in model |
| SRV + ADS: SRV hysteresis to suppression pool; ADS manual depressurisation <0.4 MPa reseat | absent | ADDED — in model (ADS control lands with M4 panels) |
| Suppression pool & containment: pT, pc = 101 + 6·(pT−45), filtered vent (−100 score, release accounting) | absent | ADDED — in model |
| Power sources: EDG auto-start 8 s, GTG 15 s, battery (charge 0.3/s, drain 0.4/s), station blackout | absent | ADDED — in model |
| SLC boron: +0.012/s while tank drains 1/s; RWCU cleanup −0.003/s·rwcu% | absent | ADDED — world panel SLC BORON works ctl.slc |
| Trips: p > 8.3, n > 1.12, level < 62 (her reason strings) | period <3 s, p > 8.5, temp > 320 °C, power > 110% (all invented) | CHANGED — her three trips only; period/temp trips REMOVED |
| Failures: pc > 600, level < 35 (her reason strings) | none (SCRAM only) | ADDED — her fail() endpoints, framed as plant failure / safe shutdown |
| Manual scram (scramNow) | triggerScram on invented thresholds | CHANGED — her scramNow/trip path |
| ATWS: rods do not insert on trip; ARI diverse path; SLC + level lowering as mitigation | absent | ADDED — ARI world button works BWR.pressARI |
| Phases: idle → heatup → power → grid → complete (+ tripped/failed) | single procedure list | MAPPED — heatup+power = Level 1 (wired now); grid dispatch = Level 3 (M9) |
| Grid dispatch: SEG 300/200/300/150/300 MWe, 210 s, grace, TOL 12 accuracy scoring | absent | MAPPED — Level 3 (M9); runs in the model today |
| Events: feedwater pump trip (grid t≈18–24 s, 18 s out, +250), grid emergency (t≈130–134 s, 12 s warning, dispatch 60, turbine trip, +250) | random steam leak + stuck rod (invented physics) | MAPPED — her events drive Levels 2–3 (M9); random steam leak REMOVED |
| Fault injection: inject('fw'/'turb'/'loop'/'sea'/'atws') — LOOP also trips the plant | absent | MAPPED — Level 2/3 fault set (M9) |
| Scoring: her score (heatup discipline ±, event +250s, vent −100, dispatch accuracy 2·dt, completion +300) and summary() (accuracy, heat fraction, 1–3 stars) | adherence/transient score | CHANGED — end screen reports her summary metrics + model score |
| Steam flow display | rated_steam_flow 800 kg/s (invented) | REMOVED — her model carries steam as MWt flows (qt/qb); display = (qt+qb)/870 MWt as % |

### Game-side presentation derivations (not physics — recorded per Decision 9)

- Reactivity gauge: her ρ (Δk/k) × 1000 → mK. Unit conversion only.
- Period gauge: 1 / her dln, seconds. Her quantity, inverted for display.
- Reactivity zone edges ±16.7 / ±50 mK: from her kinetics identity
  T = 1/ρ at the 60 s / 20 s period edges.
- Temperature zone edges 288 / 297 °C: saturation temperatures of her
  PSET / P_SCRAM on her own psat table.
- Pressure zones: normal ≤ P_BYP, caution to P_SCRAM, danger above.
- Power zones: caution >100%, danger at her N_SCRAM 112% (gauge to 120%).
- Steam zones: % of her MWT; caution >100%, danger >110%.
- Level zones: danger < LVL_SCRAM 62, caution < LVL_ALARM 85, setpoint 100.
- The lever: the rod-drive and load-control interactables work her
  `lever` (operator demand); her auto rod control moves the rods.
- Deck dial size for the 7-gauge deck stays 116 px (grid scrolls);
  mini dials 52 px (R14 range) × 7 across the 390 px strip.

## Divergence from the REAL BWRX-300 (recorded, NOT corrected)

Per Kevin's ruling, her model governs even where it departs from the
real plant. Divergences found against the BWRX-300 deep research
(2026-11-25, `~/workspace/research_notes/bwrx-300-smr-research-20261125-0551/report.md`):

- **ESBWR lineage systems.** Her model carries a suppression pool,
  SRVs and ADS (plus RCIC/HPCF/RHR) — the real BWRX-300 *eliminated*
  the GDCS, suppression pool, SRVs and ADS of its ESBWR parent. The
  real plant's passive safety is a 3-train Isolation Condenser System
  (pools above the RPV, gravity condensate return, pools boil to
  atmosphere) plus PCCS, with 7-day coping. Her IC is a single
  abstraction (IC_MAX 70 MWt), not three trains. **Kept as hers.**
- **Setpoints not cross-checkable.** Real-plant trip/scram/ICS
  setpoints are not publicly available (redacted in public licensing
  documents). Her setpoints (P_SCRAM 8.3 MPa, N_SCRAM 1.12, LVL_SCRAM
  62…) therefore cannot be verified against the real plant — absence
  of a public value is not a mismatch, and none is claimed.
- **Steam flow.** The real plant's rated steam flow is ~470 kg/s
  (academic compilation; not in GE Vernova public docs). Her model
  specifies no kg/s steam flow (flows are MWt), so nothing of hers is
  overridden; the game's former 800 kg/s constant was the game's own
  invention and has been removed.
- **Consistent points.** Real RCS pressure 7.171–7.2 MPa abs vs her
  PSET 7.2 ✓. Real core outlet/steam ~288 °C vs her saturation
  temperature at setpoint ≈288 °C ✓. 870 MWt / 300 MWe ✓. Real core:
  240 GNF2 assemblies (matches her design reference), 57 cruciform
  control blades with FMCRDs + hydraulic scram — her model abstracts
  the blades to a single worth curve (WORTH/RC/ROD_RATE); no per-blade
  behaviour exists in her model to reproduce.
- **Single-node core.** Her Tc is one lumped temperature with pressure
  saturation-coupled; the real plant distinguishes core inlet (270 °C)
  and outlet (288 °C). Her simplification, kept.
