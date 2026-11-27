---
type: Project
date: 2026-11-24
day: Tuesday
people: Samira D'Souza, Kevin D'Souza
topics: BWRX-300, game development, nuclear operations
tags: [game-spec, samira-project, bwr]
related: Samira's BWRX-300 plant model
summary: Game specification for Small Nukem — a single-player 2D browser game built on Samira's BWRX-300 plant model, designed by Kevin on 2026-11-24.
status: Specification written 2026-11-24; v2 update 2026-11-24 evening — Kevin's playtest feedback (13 items) + 66 applied research recommendations folded in as Part II; not yet built.
---

# Small Nukem — Game Specification

_A Duke Nukem spin-off in look and attitude, built on Samira's BWRX-300 plant model: a single-player browser game about operating a nuclear plant for real._

## Context

Kevin designed this game verbally on a live call on 2026-11-24, working from Samira's existing BWRX-300 plant model and gamification ideas (the interactive control-room sim at classicpc.github.io/BWRX_300). Every design element below is Kevin's decision, including the corrections that supersede the earlier brainstorm versions: single player only, two-dimensional, audience 15–30, sophisticated — and no dragon, no storybook framing, nothing childish anywhere in the game.

## The Specification

### 1. Concept

Small Nukem is a Duke Nukem spin-off in look and attitude, built on Samira's current BWRX-300 model and gamification ideas. The player operates a BWRX-300 small modular reactor plant — starting it up, maintaining it, and finally running it from the control room — against the plant's own physics.

### 2. Audience and tone

- **Audience: ages 15–30.** Sophisticated. This is not a children's game.
- **Tone: Duke-style attitude.** A cocky operator protagonist with one-liners and swagger, applied to plant operations. The humour and confidence of Duke Nukem; the subject matter treated seriously.
- **Art direction — Duke Nukem (Kevin's decision, 2026-11-24, after reviewing the first build).** The game's look is Duke Nukem's style, theme, and graphics: gritty, detailed, textured, shaded 2D game art with real depth and attitude — detailed environments, character art with presence, dramatic lighting. Kevin reviewed the first Phase 1 build and rejected its look in his words: "way too simplified," "way too boxy," "needs to look way better than this." Flat boxy vector shapes and plain unshaded SVG are rejected as the game's visual treatment. The art direction applies to the whole game: world art, the operator character, the splash/title presentation, the HUD, and Samira's plant diagram (still her model's structure, still live — rendered with this richer treatment). All art is still generated/drawn/embedded inside the single HTML file — canvas/SVG/CSS techniques, gradients, shading, procedural texture; nothing external.
- No childish framing of any kind — no mascot creatures, no storybook narration, no hand-holding.

### 3. Platform and format — hard requirements

- **BROWSER-BASED. The game runs in the browser. No install.** This is a hard requirement, not a preference. (It is also Samira's platform: her game work is mobile-browser first, and the spec stays browser-first, playable on desktop and mobile browsers.)
- **EVERYTHING IN ONE SINGLE HTML FILE — hard technical constraint.** The entire game — engine, graphics, Samira's plant model and live diagram, procedures, all levels — ships as one self-contained `.html` file with **no external dependencies**: no external scripts, stylesheets, images, fonts, or data files. This is the same form as Samira's existing BWRX-300 sim, which is a single HTML page. The constraint shapes the build from the start: single-file architecture from Phase 1, everything inlined, nothing fetched at runtime.
- **MOBILE PORTRAIT IS THE PRIMARY PLATFORM (Kevin, 2026-11-24 evening).** The game is designed, laid out, and performance-tested for a portrait phone first (reference 390×844); desktop and gamepad are secondary ports, tested only after the phone build passes its gates [R1, R21–R28].
- **Two-dimensional** — side-view 2D presentation.
- **Single player ONLY.** No multiplayer, no co-op, no player roles.
- **Rich textures and art (Kevin's decision, 2026-11-24).** The game uses rich textures and art throughout, so it looks exciting and fresh — a polished, high-energy visual presentation in keeping with the Duke-style attitude (§2), not flat placeholder graphics. This applies across all game screens; the enhanced plant diagram (§5) is part of it. All art is still generated inside the single HTML file (§3) — textures and art are drawn/embedded in-file, never fetched.

### 4. Foundation: Samira's BWRX-300 model

The game is built on Samira's existing BWRX-300 plant model/sim, which provides the plant simulation and its numbers:

- Start Plant sequence: cold and subcritical → rod withdrawal → criticality → heat-up → power raise.
- Live plant state: heat-up, rods out %, reactor period, criticality / reactivity in mK, power lever (% power demand).
- Plant systems as modelled: reactor core, passive safety (isolation condensers, gravity cooling pool), grid power output (300 MWe), Lake Ontario cooling.
- The sim's behaviour is the game's physics source. The game does not invent its own numbers where the model already has them.
- **Design reference delivered to the build seat (Kevin's direction, 2026-11-25 ~00:05 EST).** At Kevin's direction — "provide Claude the link… so it understands how Samira originally designed" — the source sim itself (https://classicpc.github.io/BWRX_300/, page plus all assets including its model.js) was saved into the seat repository (`~/small-nukem/reference/`) with a `DESIGN-REFERENCE.md` stating what the build takes from it, recorded as Decision 6 in the seat's DECISIONS.md. It is the design authority for the plant diagram's layout, components and arrangement and for the model's behaviour, within this spec.

### 5. Signature UI: the live plant diagram

- **Samira's existing plant diagram is pinned at the BOTTOM of the screen at all times.** It is never hidden and never optional.
- The diagram is **live**, not decoration:
  - The section of the plant the player is currently in or working on is highlighted.
  - Flows (steam, water, power) animate along the diagram as the plant state changes.
  - Faults appear on the diagram — a failure shows where it is in the system, so the player can diagnose from the diagram even when an instrument is lying (see §10).
- Purpose: the player always knows what is happening in the system while moving through it. The diagram is the ground truth of the plant.
- **Enhanced rendering (Kevin's decision, 2026-11-24).** Samira's plant model as rendered in the game gets a visual upgrade: MORE DETAILED, better looking, and MORE REALISTIC — components, piping, and vessels rendered with more fidelity and realism. It stays Samira's model in structure and stays fully live: every gauge and component still reflects the real-time physics state. Detail serves the simulation — no decorative detail that misrepresents the plant's actual layout or state.
- **Heads-up display — HUD (Kevin's decision, 2026-11-24).** The game has a heads-up display so the player can monitor the different gauges: the key plant instruments — reactivity, core temperature, pressure, power output, and the other values the physics tracks — readable at a glance on the HUD at all times, live from the physics, alongside the pinned diagram. Gauge warnings and thresholds read clearly on the HUD so the player can see trouble building — that is how they fight the steam, heat, and pressure (§6) with the procedures (§8).
- **Gauge highlighting (Kevin's decision, 2026-11-24).** On the HUD, the gauges HIGHLIGHT as the player moves through the game: whichever gauge is relevant to what is happening right now — the current procedure step, a fault developing, a value moving toward a threshold — lights up so the player knows which one to watch. Relevance highlighting is dynamic, driven by the game state and physics, not fixed per level.
- **Analog dials only (Kevin, 2026-11-24 evening).** Every HUD value is a real analog gauge — brass dial, needle, coloured zones — never a bar or a plain number [R9]. Three tiers: an always-visible mini-dial strip, a collapsible full-size deck, and a focused single dial with trend [R2]. The HUD never overlaps gameplay: gameplay keeps >70% of the screen, HUD <15% [R1]. Full gauge anatomy, sizes, and needle physics in Part II [R9–R20].

### 6. The enemy: steam, heat, and pressure

- **The enemies in this game are the physical forces themselves — steam, heat, and pressure.** There are no creature enemies and no person enemies. The plant's physics is the antagonist.
- The player fights steam, heat, and pressure with procedure, timing, and physics-driven actions.
- The forces escalate and cascade: rising pressure drives temperature, temperature drives steam, steam hunts for the weakest point in the system. Bringing the forces back under control — and keeping them there for a full shift — is the win condition of every level.

### 7. Core design rule: NO CLICKING THROUGH

- Actions are performed **through the game's physics**, never by clicking through a menu or a dialogue tree.
- The player turns the valve and watches pressure build. The player pulls a rod and sees reactivity move in real time.
- **The plant pushes back.** Pressure, reactor period, and xenon respond when a step is rushed, forced, or done out of order. A procedure step done carelessly makes the next one harder.
- Procedures guide; physics decides. Whether an action worked is determined by the simulated plant state, not by whether the player clicked the right prompt.

### 7A. Pacing rule: the 30-second cap (Kevin, Nov 25 2026 ~20:32 EST)

- **No single step, test, or action in the game may take longer than 30 seconds of player time to complete — passive waits included.** Kevin's words: "Each level each test or each action should take no longer than 30 seconds."
- Enforced by a check-suite GATE: time-to-complete is measured for every step in every level at natural/demo play, and the suite fails if any step exceeds 30 s.
- Met through the game-layer clock — Samira's original SPEED control restored and/or auto-acceleration during passive-wait phases. Her physics block stays byte-identical; time scaling is not a constants change.
- **STATUS — SHIPPED Nov 25, 2026 (pacing pass, patches 70–74):** SPEED control restored (1×/2×/5×, persists; during waits the button shows the effective speed + AUTO). Auto-acceleration: 10× during passive waits (heat-up, step-4 raise/trip-wait), 2× floor on the L3 grid shift; boost yields instantly to attention states (pressure at her bypass setpoint, turbine trip before its response is in place, feedwater trip during a boosted wait, grid-emergency warning until the taught response is in place); tapping SPEED below the boost holds it off for that wait — return to 1× always works at the tap. The demo/takeover driver runs on sim time. Dropped-sim-time defect fixed: sim has its own 0.25 s frame clamp, 2.6 sim-s backlog cap, 60-tick frame budget — **guaranteed floor: zero dropped sim time at every speed down to 4 fps**; below that the excess is bounded and accounted in PERF.droppedSimTimeSec. Guidance teaches the 20–58% heat-up band (step descriptions + band drawn on the rod panel rail, IN BAND ✔). Gate (§18) measures every step in every level at demo + natural profiles: worst unit 25.0 s (L3 dispatch segment 4); L1 heat-up fell from 449 s (one tap, pre-pass) to 12.3–13.3 s of player time. Suite 156/156; physics byte-identical. Evidence: ~/workspace/small-nukem-fix/evidence/pacing-table.md.

### 7B. Camera: look-ahead zoom on approach (Kevin, Nov 25 2026 ~20:34 EST)

- When Fluke moves toward a panel, the camera looks **ahead of him** in his direction of travel (lead offset toward the current target panel) and **zooms in smoothly** as he approaches, so the panel arrives on screen bigger with more visible detail. The zoom eases back out when he walks away or the step changes.
- Constraints: the fit guarantees hold at every zoom level (all elements visible, nothing cut off); pop-ups must not cover Fluke (the zoom frames Fluke + panel together); touch targets stay ≥2 cm at any zoom.
- Implemented with the renderer pass (camera work lives there).

### 8. Procedures

- Each level hands the player **the actual procedure for that role** — the startup checklist, the maintenance rounds sheet, the control-room operating procedure — as an in-game document.
- The procedure stays available in-game (see Controls, §9) and the player follows it while playing. It is a guide to work from, not a script that plays itself: the player still performs every action through the physics (§7).
- Scoring (§12) rewards following the procedure in order.
- **The control operator (Kevin's decision, 2026-11-24).** The game includes a CONTROL OPERATOR character who guides the player on what to do — an in-game guide who tells the player the next action and helps them through the levels. The operator works alongside the written procedure above: the operator is the voice/character delivering that guidance in play — prompts, callouts, and corrections when the player rushes or skips a step — in keeping with the game's Duke-style attitude (§2). The operator guides; per §7 the player still performs every action on the physics. The operator never does a step for the player.
- **How the operator appears (Kevin's decision, 2026-11-24).** The operator is a character who works with the player, presented in a TINY WINDOW styled like a small TV screen — picture-in-picture, as if he is appearing on a little television in the game UI. He delivers his instructions and guidance (next action, corrections, callouts) from that TV window. He is a visible character in the window — not a full-screen overlay, and not bare text.
- **Language rule for guidance (Kevin's decision, 2026-11-24).** Technical jargon IS used — the operator's guidance and the procedure text use the real terms — but every technical term is supplemented with a simple explanation in plain language alongside it. Real vocabulary, never dumbed down, always paired with its plain-English meaning, so a player aged 15–30 new to nuclear operations can follow and learn the real terms as they play (see also §14).

### 9. Controls — keyboard AND Xbox gamepad, designed in from the start

Both input schemes are first-class and designed together from the start — neither is an afterthought port of the other. Both work in the browser (keyboard natively; the Xbox controller through standard browser gamepad support), which the browser-based platform (§3) supports with no install.

**Mouse and touch are also first-class (Kevin, 2026-11-24 evening).** One unified Pointer Events layer drives mouse, touch, keyboard, and gamepad into a single input-state snapshot the game loop reads [R58–R59]. Touch is the primary scheme (mobile-first, §3); mouse must be able to do everything touch can, including hold-to-operate [R61]. Full input spec in Part II [R58–R62].

**Design principle — analog input is a physics input.** How far and how fast the player turns a control is itself an input to the simulation, not a binary click. A valve opened gradually bleeds pressure off gradually; a valve wrenched open slams the system. This is the control-side expression of the no-clicking-through rule (§7).

**Keyboard**

- Arrow keys / WASD: move through the plant (side-view movement, ladders, doors).
- Hold + direction, or hold key with repeated pressure: operate a control gradually — e.g. hold to turn a valve wheel, with the turn rate under the player's control.
- E (or Enter): interact with the highlighted component.
- Tab (or P): open/close the level procedure (§8) without leaving the action.
- Esc: pause.

**Xbox gamepad (Xbox layout)**

- Left stick: walk the plant; stick deflection sets movement speed (walk, not teleport).
- Right stick / triggers (LT/RT) as analog operators: a trigger squeeze or stick turn **turns a valve wheel gradually** — pressure bleeds off at the rate the player physically applies. Half a squeeze is half a turn-rate; the simulation takes the actual analog value.
- A: interact with the highlighted component.
- Y (or View): open/close the level procedure.
- B: release / back out of a control safely.
- Menu: pause.
- Analog rod control: withdrawing or inserting a control rod is an analog action on stick/trigger — rod speed is player-controlled, and reactor period answers to how fast the rod actually moved.

### 10. Failures — core gameplay

Failures are not interruptions; they are the game. In every level, failures arrive, **cascade**, and must be diagnosed and brought under control. Diagnosis is the skill.

Failure catalogue (drawn from the real plant):

- Stuck control rod.
- Steam leak.
- Turbine trip.
- Blocked lake intake (cooling compromised).
- Grid demand surge — the grid calls for power the plant must answer or refuse safely.
- **Instruments that lie** — a sensor reads fine while the live plant diagram (§5) shows the truth. The player who trusts the diagram catches it; the player who trusts the gauge does not.
- Xenon buildup after a trip — restart is delayed by physics, not by a timer the player can skip; the player manages the plant through the xenon transient.
- Loss-of-coolant scenario — reserved for the final level (§11).

Cascading is mandatory in design: a steam leak drops pressure, the pressure drop moves the period, the grid surge arrives while the player is already busy. Single, isolated failures are early-game teaching cases only.

### 11. Levels — the career arc

**Level 1 — Operator startup.**
The operator comes into the plant and starts up the plant. From cold and subcritical, following the startup procedure (§8): rod withdrawal, criticality, heat-up, synchronise, raise power. This level teaches movement, the live diagram, the procedure, and physics-driven control. Failures in scope: stuck rod, steam leak (the two Phase 1 failures, §14).

**Level 2 — Maintenance.**
The player works as a maintenance worker/engineer, doing what a BWRX-300 maintenance engineer typically checks: rounds and inspections across the plant — rod drives, steam lines, sensors, valves. Faults are found early and fixed before they cascade. This level teaches the plant's geography and the early signatures of the failure catalogue (§10), including the first lying instrument.

**Final level — Control room operator.**
The player runs the plant from the control room: the full job, under pressure, with the full failure catalogue in play and failures cascading — up to the loss-of-coolant scenario. Everything from Levels 1 and 2 is assumed knowledge. This is the exam the career arc has been building to.

### 12. Scoring

- **Follow the procedure. Catch the fault before it spreads. Keep the shift clean.** That is the score.
- Physics decides whether the player did it right — the simulated plant state is the referee, not a checklist of clicks.
- Measured per shift/level: procedure adherence (steps in order), fault detection time, megawatt-hours delivered vs transients caused, startup time (Level 1 speed is a scored run), and final plant state at shift end.
- Ratings per shift, Duke-style in presentation, operator-real in substance.

### 13. Safety truth — non-negotiable design fact

- **Failures end in safe shutdown, never an explosion.** There is no explosion outcome in this game, at any difficulty, ever.
- The plant's passive safety systems visibly do their job: isolation condensers and the 7-day gravity-driven cooling pool bring the plant safe with no power and no operator action, and the player watches it happen on the live diagram.
- The lesson the game teaches is the true one: the plant protects itself. Losing a level means a transient, a trip, a bad shift review — never a catastrophe.

### 14. Terminology

Real terminology throughout, per Samira's model — the game teaches the real words by using them: reactor period, reactivity (mK), rod worth, xenon, thermal limits, natural circulation, criticality, subcritical, isolation condenser. Per the language rule in §8 (Kevin's decision, 2026-11-24), every technical term is paired with a plain-English explanation alongside it wherever it is used in guidance or procedure text — the real term is never replaced or dumbed down, only explained.

### 15. Build phases (RAD — prototype first, iterate in place)

- **Phase 1:** Level 1 only (startup) + the live plant-diagram HUD (§5) + physics-driven controls (§7, §9, both input schemes) + 2 failures: stuck rod, steam leak.
- **Phase 2:** Level 2 (maintenance) — rounds, inspections, early-fault detection, the lying instrument.
- **Phase 3:** Final level (control room) — cascading failures, the loss-of-coolant scenario, full scoring (§12).

Build execution follows the 9-milestone gated plan in the Claude build prompt (Part II, R66); the three phases above are the content scope those milestones deliver.

No game code is part of this specification. Build starts on Kevin's word, Phase 1 first.

## Consequences

- This commits Samira's BWRX-300 model as the simulation foundation for a game project, and Kevin as mentor on it.
- It rules out: multiplayer, 3D, a children's version, and any catastrophe/explosion framing of nuclear failure.
- Superseded brainstorm elements (explicitly cut by Kevin, do not reintroduce): the dragon/keeper story framing, the grade-school simplification, multiplayer roles, first-person 3D.

## Connects to

- People: [[Samira D'Souza]] (builder; the model and gamification ideas are hers), Kevin D'Souza (design, mentor)
- Foundation: Samira's BWRX-300 plant model — https://classicpc.github.io/BWRX_300/
- Topics: BWRX-300, OPG Darlington SMR, nuclear operations training


---

# Part II — V2: Kevin's playtest feedback + applied research recommendations (2026-11-24 evening)

Kevin played the current builds and gave 13 feedback items (recorded in `~/workspace/goals/small-nukem-bwrx-300-startup-game/feedback-2026-11-24-evening.md`). He then directed: **apply at least 50 recommendations from the research sources as improvements.** The research is the deep-research report at `~/workspace/research_notes/small-nukem-aaa-game-research-20261125-0435/report.md` (§1–§10, plus §1A gauges and §2A mobile-first addenda). **66 recommendations are applied below**, each numbered R1–R66, each citing its report section, each stating how it changes this spec. Where Part II conflicts with Part I, Part II wins; the settled design in Part I (single player, 2D side view, one HTML file, three levels, real physics, Samira's live diagram pinned, safe-shutdown endings) is unchanged.

## Kevin's 13 feedback items — where each one lands

| # | Kevin's feedback | Applied in |
|---|---|---|
| 1 | Playability is good | Kept — physics and core loop unchanged |
| 2 | HUD overlaps gameplay on mobile; too much top space wasted | R1–R8 (screen budget, 3-tier dial deck, thumb zones) |
| 3 | Art too basic; walls bare; panels must look like real control panels | R29–R34 (shading kit), R44–R47 (real panel grammar), R40–R43 |
| 4 | Player sprite basic, no direction shown, too static | R35–R39 (8-frame walk, full animation set, articulated figure) |
| 5 | Chief must actually SPEAK; funny lines for right/wrong; dancing/celebrations | R53–R57 (Web Speech voice, jaw-flap, reaction table, celebration) |
| 6 | Research how others built these; spec near-AAA; how to prompt Claude | This Part II + the Claude build prompt (R63–R66) |
| 7 | Camera angles, shading, closer to photorealistic | R29–R33 (photorealism itself is infeasible in one file — the report's named alternative, baked/pre-rendered shading, is applied instead) |
| 8 | Live diagram too blocky; real shapes; tap a piece for more info | R48–R52 (true-shape SVG schematic, tap → detail card) |
| 9 | Playable through the mouse | R27, R58–R62 (unified Pointer Events) |
| 10 | Steampunk feel overall | R40–R43 (steampunk art bible) |
| 11 | Works on mobile in portrait | R1–R8, R21–R28 |
| 12 | Core temp / pressure / power / reactivity as nice analog gauges | R9–R20 (analog dials, never bars) |
| 13 | Optimized for mobile play especially | R21–R28 (hard budgets, phone-measured gates) |

## A. Portrait HUD layout (research §1)

- **R1 — Screen budget (§1).** Gameplay >70% of the portrait screen, total HUD <15%. Top ~20% is read-only status only; the middle is the world; primary controls live in the bottom ~40%. Acceptance: screenshot at 390×844 with overlay pixels measured.
  - **Decision note (Kevin, 2026-11-24 ~23:54 EST) — SUPERSEDED by Decision 4 below:** Samira's pinned live plant diagram counts OUTSIDE the <15% HUD budget in R1 — it is gameplay ground truth, not HUD. The budget applies to the HUD elements proper; the diagram strip is additional space, sized for legibility. Recorded for the build seat in ~/small-nukem/DECISIONS.md (decision 1).
  - **Decision 4 (Kevin, 2026-11-25 ~00:00 EST) — SUPERSEDES the note above:** the pinned plant diagram counts INCLUDED in the HUD — inside the <15% HUD budget. **Padma's resolution of Antigravity Finding 1 (decision delegated to Padma by Kevin):** the layout follows the collapsed-strip plan from the Claude seat's Milestone 1 reading — guide TV collapsed to a ~32 px face icon, mini-dial strip ~58 px, pinned diagram as a ~34 px live strip; total HUD ≈124 px ≈ 14.7% of 844, world viewport ≈85% (>70% gate ✓). Schematic legibility/detail lives in the tap-to-expand full schematic (Milestone 6, R48/R49) — the pinned strip carries live state at a glance. Recorded in ~/small-nukem/DECISIONS.md (decisions 4–5).
- **R2 — Three-tier gauge presentation (§1).** Tier 1: always-visible strip of six mini analog dials (3×2 grid in a slim deck, or 6-across if ≥56 px each fits), 40–60% opacity idle, 80% on touch. Tier 2: collapsible expanded deck (tap or swipe-up) with full-size dials as a bottom sheet ≤35% of screen height. Tier 3: tap one dial → focused view, enlarged dial + trend sparkline + setpoint.
- **R3 — Alarm-driven deck (§1).** The expanded deck auto-opens the moment any gauge enters amber/red, and auto-collapses ~4 s after all gauges are back in range.
- **R4 — Thumb zones (§1).** Primary and hold-to-operate controls sit in the natural thumb zone (bottom third, centre + holding side). The top third is status only — nothing there needs hitting under pressure, and no control's only dismiss target sits in the far top corner.
- **R5 — Safe areas in code (§1).** All fixed bars use CSS `env(safe-area-inset-*)` with `viewport-fit=cover`; art bleeds full-screen but no readable or tappable content sits in the notch, Dynamic Island, home-indicator (~34 pt), or rounded-corner zones.
- **R6 — Touch targets (§1).** Every tappable target ≥44×44 pt (Apple) / 48×48 dp (Google), ≥8 pt spacing, hit area larger than the visible art.
- **R7 — Occlusion rule (§1).** Anything the player must *see while touching* (e.g. valve % while holding) renders outside the bottom-right thumb-occlusion zone — the readout goes above the button.
- **R8 — Portrait world viewport (§1).** Stack: guide TV (top, collapsible to a face icon), world viewport (middle ~50–55%), gauge deck + controls (bottom). The wide world is never letterboxed; the camera follows the character inside the viewport, with drag/pinch pan.

## B. Analog gauges — never bars (research §1A)

- **R9 — Dials, never bars (§1A).** Core temperature, pressure, reactor power, reactivity — and the other two HUD gauges (reactor period, steam flow) — are proper analog dials everywhere: HUD, world panels, schematic detail cards, trend popovers. A small digital readout window *inside* a dial is allowed (real combination-instrument practice); a bar or plain number *instead of* a dial is forbidden anywhere.
- **R10 — Dial anatomy checklist (§1A).** Every dial has all of: brass riveted bezel (rivets at 4–8 points), cream/enamel face, glass highlight arc (low-opacity white ellipse, top-left), drop shadow, brass centre hub/screw cap, tapered needle with counterweight tail, engraved instrument name at top of face, unit at bottom.
- **R11 — Standard geometry (§1A).** Scale arc starts at ~135° with ~270° sweep (min lower-left, max lower-right, dead zone at bottom for the label/unit).
- **R12 — Ticks and labels (§1A).** 5–9 major ticks with numeric labels outside the tick ring, minor ticks unlabelled. Mini-dials drop numeric labels and keep 3–4 ticks + zone arcs + unit abbreviation — precision reading happens in the expanded deck. Out-of-range values clamp at the end stops.
- **R13 — Zones from the sim table (§1A).** Each gauge's normal/caution/danger arcs come from the simulation table in §G below, not a generic percentage. Pressure also carries a low-side caution band; reactivity is a centred-zero dial (0 at top, negative left, positive right, red at both extremes); every gauge gets a brass setpoint triangle on the rim; power gets an emphasised "rated 100%" tick.
- **R14 — Dial sizes (§1A).** Mini strip dials 52–58 px diameter (job: needle position + zone at a glance). Expanded deck dials ~110–120 px (3 across × 2 rows, full labels/ticks). Focused dial 180–220 px with trend + limits.
- **R15 — Needle physics (§1A).** Needles are spring-damper oscillators (configurable stiffness/damping/mass), frame-rate independent with sub-stepping — never linear tweens, never direct value mapping.
- **R16 — Per-gauge needle tuning (§1A).** Temperature: heavily damped, slow, no overshoot (thermal lag). Pressure: near-critically damped, slight overshoot. Power: slightly underdamped — one visible overshoot, then settles in a single swing. Reactivity: fast and nervous, with tiny jitter.
- **R17 — Needle jitter (§1A).** Subtle vibration/sensor-noise oscillation on every needle; amplitude grows near redline and during transients. Needle sticking/pausing is not simulated (readability first).
- **R18 — Redline behaviour (§1A).** On entering redline: the bezel lamp/face rim pulses red, the gauge deck auto-expands (R3), and the guide reacts (R56). The needle itself never flashes — its position must stay readable.
- **R19 — Gauge performance (§1A).** Each dial's static face (bezel, ticks, labels, zones) is pre-rendered once to an offscreen canvas; per frame only the face image + rotated needle + hub + changed readout text are drawn (~18 cheap draws for all six gauges). No excuse for simplifying gauges on performance grounds.
- **R20 — Gauge acceptance test (§1A).** At arm's length on a real phone, a tester can state "green / amber / red, rising / falling" for every gauge in under 1 second without reading numbers.


## C. Mobile-first performance budgets (research §2A)

- **R21 — Hard budgets (§2A).** Written into the build as acceptance-tested limits, measured on a mid-range Android phone, not the dev laptop: frame rate target 60 fps in the world view, floor ≥30 fps sustained with p95 frame time ≤33 ms; draw calls ≤100/frame target, ≤150 hard max; whole HTML file ≤1.5 MB target, ≤3 MB hard max, first playable <3 s on 4G; decoded texture/offscreen memory ≤64 MB; no single canvas/texture over 2048².
- **R22 — 30 fps is a first-class mode (§2A).** iOS Low Power Mode caps Safari at 30 fps — design for it, don't fail at it. Simulation uses elapsed-time/fixed-step (never per-frame speeds, so 120 Hz phones don't run double-speed). `devicePixelRatio` capped at 2.
- **R23 — Zero hot-loop allocations (§2A).** No allocations in the game loop; particles and transient objects are pooled (≤120 particles alive, auto-halved when fps <50). GC pauses are 10–50 ms hitches — this is the main smoothness rule.
- **R24 — Adaptive quality ladder (§2A).** When fps drops, quality sheds in this fixed order: foreground parallax → particle count → steam density → DPR 2→1.5 → parallax off. Never shed gauges, physics, or the diagram.
- **R25 — Update rates (§2A, §1A).** Sim ticks and gauge value reads at ~10 Hz; needle physics runs per frame; on-screen text updates only when the value changed; no DOM layout reads/writes inside the loop.
- **R26 — Lifecycle (§2A).** The game pauses on `visibilitychange`; wake-lock is optional, never required.
- **R27 — Touch-first (§2A).** Every action is completable one-handed by thumb. Mouse hover is never the only way to reveal anything. Keyboard/gamepad are additive mappings onto the same input state, not separate control schemes.
- **R28 — Phone-measured gates (§2A, §10).** "Fast on my laptop" is not evidence. Every build phase gate reports fps, p95 frame time, and file size measured in phone emulation, and at least once per milestone on a real mid-range phone.

## D. Detailed 2D art — the feasible road to "near-photorealistic" (research §2)

- **R29 — Art target redefined (§2).** True photorealism is not feasible in a single phone-browser file (the report flags it; Kevin's feedback item 7 is served by the report's named alternative instead): the spec target is **detailed stylised-realistic, high-bit, gradient-shaded art with a pre-rendered look**. "Photorealistic" never appears as an acceptance criterion.
- **R30 — Parallax (§2).** 3–5 depth layers: far silhouette, background wall, mid machinery, gameplay plane, foreground occluders. Static layers are merged; parallax auto-disables below ~50 fps (see R24).
- **R31 — Camera (§2).** Smoothed follow with dead zone and look-ahead, clamped to level bounds; subtle portrait moves only: 1.0–1.08× zoom when approaching a panel, small pan toward whoever is speaking.
- **R32 — Pre-rendered scenery (§2).** All static scenery is drawn once to offscreen canvases and blitted per frame. Per frame, only dynamic elements animate: needles, steam, lamps, liquid levels, the character.
- **R33 — Baked lighting (§2).** Normal-mapped dynamic lighting is WebGL-only and out of scope (report's alternative applied): a shared shading kit — cylinder gradients, highlight + core-shadow bands, brushed-metal patterns, baked ambient occlusion, radial lamp glows — with one fixed light direction across the whole game.
- **R34 — Pre-rendered discipline (§2).** From the *Dead Cells* 3D-to-2D pipeline lesson: render/pose at final small size with palette discipline, so procedural art reads as pre-rendered rather than vector-flat. One palette and one shading kit for every machine, panel, and room — no per-object styles.

## E. The operator character (research §3)

- **R35 — Walk cycle (§3).** 8 frames: the 4 key poses (contact, down, passing, up) × 2 steps, at 8–12 fps. The down pose (lowest hips) is mandatory — it sells weight.
- **R36 — Full animation set (§3).** Idle 4–6 frames @4–8 (breathing ±1–2 px, blink every 3–5 s); walk 8 @8–12; work/operate 6–8 @10–12 (anticipation + hold pose + recovery); crouch/inspect 4; climb 6 @8–10; celebrate 8–12 @12, plays once; alarm/startle 3–4. The character visibly faces and moves in his direction of travel — no static sliding sprite.
- **R37 — No foot-slide (§3).** Movement speed is matched to stride (`speed = distance-per-cycle / duration`); all frames share identical cells and one baseline; hip height visibly differs between down and up poses; arms swing opposite to legs.
- **R38 — Procedural articulated figure (§3).** PNG sprite sheets at this detail are impractical in one file (report's alternative applied): the character is a code-drawn articulated figure, parts posed by keyframe joint tables, shaded with the R33 kit.
- **R39 — Original character (§3).** Duke-inspired silhouette only — tall, muscular, flat-top, sunglasses, red vest, tool bandolier as *inspiration*. Original name, original art, original lines. No copyrighted character, voice lines, or ripped sprites.

## F. Steampunk art bible (research §4)

- **R40 — Palette and materials (§4).** Brass, copper, bronze aged with patina/verdigris, soot and tarnish (never clean chrome), iron, dark wood, oxblood leather, cream enamel, parchment, smoky glass, warm lamp light. This palette governs every screen, including the diagram's housing and the guide's TV.
- **R41 — Structural ornament (§4).** Gears are sized and positioned as if they mesh and turn; framing, riveted plates, pipes, and valve wheels are structural, not stickers. Panels and borders may be maximalist; gauge faces stay clean and readable (R10). Victorian serif for display type; a legible face for values.
- **R42 — Causal motion (§4).** Everything mechanical responds: buttons depress, levers resist then release, gears rotate, needles sweep (R15), steam vents, lamps sequence. Nothing decorative moves without a cause in the sim.
- **R43 — Reference set (§4).** *BioShock Infinite, Dishonored, Arcanum, Frostpunk*. The *Dishonored* lesson governs: one anachronistic technology (nuclear steam) expressed entirely in Victorian-industrial materials.

## G. Real control-room grammar (research §5)

- **R44 — Panel zoning (§5).** Every walk-to panel in the world follows real control-room grammar: annunciator tiles on top, indicators/recorders in the lower-vertical band, pump/valve switches on the lower-horizontal bench — grouped *by system* (reactor & coolant / secondary / support & emergency), each annunciator directly above its own system.
- **R45 — Annunciator lifecycle (§5).** Alarm tiles are back-lit and follow the real sequence: flashing + horn → player acknowledges → steady → clears dark. Acknowledgement is a tap verb (R61).
- **R46 — Measured, not commanded (§5).** Panels and the diagram display *measured* state, never merely commanded state (the TMI-2 lesson). Alarm floods are prioritised, and the gauge that corroborates an alarm is never hidden off-view. This is also what makes the lying-instrument failures (Part I §10) fair: the truth is always visible somewhere.
- **R47 — One mimic convention (§5, §6).** One colour convention for the mimic/diagram (e.g. the source convention: green = valve closed / breaker open), stated in an on-screen legend and used identically in the world panels, the HUD, and the schematic.


## H. The live schematic — real shapes, tap for detail (research §6)

- **R48 — True-shape SVG schematic (§6).** Samira's diagram keeps its structure and its pinned position (Part I §5) but is drawn as an inline SVG with components in their actual shapes — vessel, pumps, valves, condensers, turbine as recognisable unit pieces, not blocks. Inline SVG gives every component a free tap target. The full schematic also opens as a full-screen portrait overlay.
- **R49 — Tap → detail card (§6).** Tapping any component (in the pinned diagram or the overlay) selects it: it glows, and a bottom-sheet card shows its tag, name, a mini analog dial for its primary value (R9), its live state, and its Operate control where it has one.
- **R50 — One tag, every view (§6).** A component's tag is identical in the world, the panels, the schematic, the procedure text, and the guide's lines. Selecting it in one view highlights it in all of them.
- **R51 — Live flow (§6).** Pipes are coloured by state (R47); animated flow dots move at a rate proportional to actual flow; trace mode highlights the upstream→downstream path through a selected component. Schematic, world view, and panel lamps stay in bidirectional sync.
- **R52 — Guided vs Live (§6).** Two modes, adopted from real plant simulators: *Guided* (procedure notes + overlays, the next-step component pulses, wrong taps are logged and draw a guide reaction, no fail state) and *Live Operations* (faults active, actions logged, scored). Guided is the default for a level's first run.

## I. Chief — the guide, with a voice (research §7)

- **R53 — Voice = Web Speech API (§7).** Recorded voice for all lines is not feasible in one file (report flag); the applied alternative is the browser's Web Speech API (`speechSynthesis`) as Chief's voice. Chief actually speaks his lines aloud while playing — not text only.
- **R54 — Talking animation (§7).** True lip-sync is impossible with Web Speech (no viseme data — report flag); the applied alternative is jaw-flap: 3–4 mouth shapes cycled at 8–10 Hz while speaking, plus blink, brow, and head-tilt. Chief lives in his brass CRT TV with scanlines and flicker (R40).
- **R55 — Line discipline (§7).** Lines are chunked to ≤~180 characters (longer utterances truncate/stall in Chromium). Every spoken line is also captioned inside the TV — accessibility, silent play, and the fallback if no voice is available. Handle `getVoices()` being empty until `voiceschanged`; speech starts only after a user gesture; mute is persisted.
- **R56 — Reaction table (§7).** Chief's lines and expressions are keyed to game events, 2–3 variants each, funny for right and wrong play alike: `correct_step`, `wrong_order`, `wrong_component`, `alarm_raised`, `alarm_cleared`, `idle_30s_hint`, `milestone_complete`, `startup_complete`. Alarms take priority in the speech queue.
- **R57 — Celebration (§7).** On `milestone_complete` and `startup_complete`, Chief celebrates — dance animation in the TV window plus a particle burst (within the R23 pool). At most ~6 short hero lines may be baked in as audio if a future build allows; all other lines stay Web Speech.

## J. Unified input — touch, mouse, keyboard, gamepad (research §8)

- **R58 — Pointer Events base layer (§8).** All pointing input uses `pointerdown/move/up/cancel` with `setPointerCapture(pointerId)` (a drag that slides off a valve keeps tracking) and `touch-action: none`. The game is fully playable through the mouse — every touch action has a mouse equivalent.
- **R59 — Input-state snapshot (§8).** Handlers only set flags in an input snapshot; the game loop reads the snapshot. Touch, mouse, keyboard, and gamepad are interchangeable writers of the same state.
- **R60 — Gamepad polling (§8).** The Gamepad API is polled per frame with previous-state edge detection, dead zone ~0.25–0.5, and the standard mapping (d-pad, 0 = confirm, 1 = back). This extends Part I §9's Xbox scheme; it does not replace it.
- **R61 — Hold-to-operate (§8).** The core verb: hold → pointer capture → progress ring fills (valve 1.5 s, switch 0.8 s) → the value follows the hold and pauses on release, fully reversible → `navigator.vibrate(10)` on completion. Gamepad: hold A. Keyboard: hold Space/E. Same `hold` state for all. Releasing early stalls the control — it never snaps. Tap is reserved for pushbuttons and alarm acknowledgement (R45).
- **R62 — Multi-touch and edges (§8).** Pointers are tracked by `pointerId`, so the player can walk and hold a valve at the same time. No core mechanic is placed on OS-reserved edge swipes.

## K. Spec & build process (research §9, §10)

- **R63 — Simulation model table (§9).** **Superseded by Decision 9 (2026-11-25): Samira's original model (`reference/js/model.js`) is the source of truth for every physics value and behaviour — "there shouldn't be any deliberate differences" (Kevin). The table below is corrected to her values; `MODEL-FIDELITY.md` at the seat is the full reconciliation record. The game's sim IS her model, embedded verbatim.**

  | Quantity | Her value | Notes |
  |---|---|---|
  | Rated thermal / electric | 870 MWt / 300 MWe (ETA 0.348) | |
  | Pressure setpoint (PSET) | 7.2 MPa | bypass opens 7.45 (P_BYP); IC opens 8.0 (P_IC); SRV 8.6 lift / 8.0 reseat |
  | Pressure SCRAM (P_SCRAM) | **8.3 MPa** | trip reason: 'High steam pressure' |
  | Turbine sync (P_SYNC) / operating pressure (P_OK) | 6.3 / 6.8 MPa | sync is automatic at P_SYNC; turbine 1500 RPM |
  | Power trip (N_SCRAM) | **112%** (n = 1.12) | trip reason: 'High reactor power' |
  | Water level | setpoint 100%, alarm 85 (LVL_ALARM), SCRAM 62 (LVL_SCRAM), fuel uncover 35 (LVL_FUEL → plant failure) | **seventh gauge** — Decision 9 overrides the R65 six-gauge count |
  | Cold start state | critical at 0.2% power (NSRC 0.002), 30 °C, 0.10 MPa, rod at RC 0.30, level 100% | her create()/start() |
  | Heat-up limit (HEAT_LIM) | 150 °C/min | scored during her heatup phase |
  | Pressure law | p = psat(Tc), her 12-point saturation table | no independent pressure variable |
  | Reactor period | 1 / dln (her smoothed d(ln n)/dt) | replaces the former R63 period calibration |
  | Reactivity | rho = WORTH·(rod − RC) − (KP·nLag + KT·Tn + 0.9·boron + low-level void) | displayed in mK (dk/k × 1000) |
  | Grid dispatch | SEG 300/200/300/150/300 MWe over 210 s, tolerance 12 MWe (TOL) | her game() — Level 3 |
  | Gauge zones | derived from her constants only (see MODEL-FIDELITY.md) | temp edges 288/297 °C = psat^-1(PSET/P_SCRAM) |

- **R64 — Numbered procedure scripts (§9).** Each level's procedure (Part I §8) is written as numbered steps, each with preconditions, the expected gauge values on completion, and the consequence of the wrong action — so both the guide's reactions (R56) and scoring (Part I §12) key off the same step numbers.
- **R65 — Content inventory with counts (§9).** The build is estimated and checked from counts, not vibes: 7 gauges (R63 as corrected by Decision 9 — water level added), 8 world panels, 7+ character animations (R36), 8 guide reaction keys × 2–3 variants (R56), 3 levels, the Part I §10 failure catalogue. Any count cut requires stopping and asking (see the Claude prompt's anti-simplification rules).
- **R66 — Phased, gated build (§10).** The build runs as 9 independently testable milestones with screenshot/test gates — never one giant prompt (the documented failure mode: context rot produces placeholder art and cut scope). The full milestone plan, gate evidence, and anti-simplification language live in the Claude build prompt: `~/workspace/goals/small-nukem-bwrx-300-startup-game/claude-prompt-v2.md`.
- **R67 — Demo mode + in-play takeover (Decisions 10, 19).** A demo driver executes a level's R64 steps on the real sim through the player's own controls path, narrated by the Chief (R53–R55); attract mode on the title screen and a study walkthrough. An in-play DEMO control (button + keyboard/gamepad binding) takes over FROM THE PLAYER'S CURRENT STATE — no restart — diagnoses player-created problems (skipped/out-of-order steps, bad control positions, active alarms, caused faults), fixes them by procedure with narration, then completes; any input hands control back from wherever the demo reached. A demo-finished shift is recorded as demo-assisted in the rating. Unrecoverable handovers play out the safe-shutdown path with a cause-named debrief.
- **R68 — Character personality kit (Decision 11; extends R65).** The operator (Fluke Nukem, Decision 12) has named animations beyond locomotion: idle — gauge_glance, dial_tap, watch_check, weight_shift; work — valve_strain, rod_touch, needle_lean; reactions — alarm_snap, scram_stepback, fault_nod, self_wince, crit_grin, sync_grin. A one-liner bank keyed to events (first_criticality, grid_sync, fault_caught, scram, level_complete, idle_long), captioned, voiced where it fits, no back-to-back repeats, frequency capped.
- **R69 — Achievement + recovery cinematics (Decisions 13, 20).** In-engine live-rendered pop-up sequences (no video files), each UNIQUE per event key — distinct scene AND distinct synthesized Web Audio sound design, generated from the live plant state, framed as a learning moment (one event-specific teaching point, real term + plain explanation), duration hard-bounded 5–10 s. Achievement keys: first_criticality, grid_sync, power_ascension, fault_caught_<class> for each §10 fault class, procedure_chain, level_complete. Recovery keys: recovery_<issue> per recoverable issue class (each causable fault class + skipped step, out-of-order step, bad control position) + recovery_shutdown for the unrecoverable ride-down. Never fires mid-emergency (queued until stable); dismissal is ANY input (tap anywhere, any key, any gamepad button) — instant, input consumed, audio cut, play resumes at the live state; during demo a dismissal closes the clip only.
- **R70 — Platforms, renderer, style, mechanics, touch (Decisions 15, 17, 18, 21).** Targets: iOS Safari + Android Chrome at 390×844 (desktop a bonus). Renderer: WebGL1, one sprite atlas ≤2048×2048 batched, DPR cap 2 (30 fps mode at DPR 1), webglcontextlost handler + atlas re-upload, clear fallback message if WebGL is unavailable; M9 order is WebGL migration → mechanics adoption → art pass. Style target "Flat Plant" (Decision 18): bold few shapes, one hue family per area, gameplay-only accents, gradients-only lighting, silhouette-first character, motion as the detail budget; primary reference Prince of Persia: The Lost Crown (2024), secondary Hollow Knight: Silksong (2025). Mechanics: the style research §7 per-item mapping (24 items) is the adoption contract, accounted per item in the M9 gate report; nothing adopted may alter the model's numbers (Decision 9). Android bridge stubs (Decision 17) are wired at the event keys during M9: one feature-detect, semantic haptic names, back handler + SNBridgeEvent dispatcher, start-mode parameter, single save()/load() persistence abstraction, shell-biasable fps mode, all-sides inset-aware layout, one external audio pause/duck entry point. Touch (Decision 21): fully playable by touch alone; persistent overlay holds movement-class controls only and toggles on/off (persisted); operate controls are contextual pop-ups at the point of use shaped like the REAL device control (handwheel, rod lever, switchgear, breaker) with Flat Plant simplicity and finish; gesture direct manipulation is first-class.

## Explicitly NOT applied (research-flagged infeasible in one HTML file)

- True photorealism / photographic textures — replaced by R29/R33 (pre-rendered-look procedural shading, baked lighting).
- Normal-mapped dynamic lighting in Canvas2D — replaced by R33 (fixed-direction baked highlights + radial glows).
- Recorded/consistent human voice for all lines — replaced by R53 (Web Speech) + R57 (≤6 baked hero lines max).
- True lip-sync — replaced by R54 (jaw-flap + captions).
- 60 fps on *every* phone — replaced by R22 (60 target / 30 first-class, adaptive ladder R24).
- Any copyrighted Duke Nukem character, lines, or sprites — R39 (original, inspired only).
- Licensed-accurate BWRX-300 training values — not applicable: per Decision 9 the game uses Samira's model values throughout; where her model diverges from the real plant, MODEL-FIDELITY.md records it without changing the game.
