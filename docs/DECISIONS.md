# Small Nukem v2 — Kevin's Decisions (binding on all build sessions)

Recorded 2026-11-24 ~23:54 EST. These decisions override any conflicting
default in brief-v2.md or small-nukem-spec.md. Read this file at the start
of every session, alongside the spec and the brief.

## Decision 1 — The pinned plant diagram is NOT HUD — **SUPERSEDED by Decision 4 (2026-11-25 ~00:00 EST)**

Samira's live plant diagram, pinned at the bottom of the screen at all
times, counts OUTSIDE the 15% HUD budget in R1. It is gameplay ground
truth, not HUD. The <15% budget applies to the HUD elements proper
(guide TV / status strip, gauge deck chrome); the diagram's strip is
additional screen space, sized for legibility of the true-shape
schematic (R48), and must not be squeezed to fit the HUD budget.
(This answers the question raised in the Milestone 1 reading.)

## Decision 2 — Gates are autonomous; no approval pauses

Complete ALL 9 milestones end to end WITHOUT waiting for Kevin's
approval at any gate. For each milestone: produce the gate evidence the
brief requires (390×844 screenshots, pixel measurements against the
budgets, the named checklists, fps / p95 frame-time / file-size reports
where the brief calls for them), self-verify it, save it under
gates/milestone-N/ in this repository, and proceed to the next
milestone on your own. Stop ONLY for a genuine blocker or a spec
conflict you cannot resolve from the spec, the brief, and this file —
and if you stop, write the blocker plainly into gates/BLOCKED.md and
end the session. Final delivery: the finished small-nukem.html plus a
complete gate-evidence report covering all 9 milestones
(gates/GATE-REPORT.md).

## Standing notes

- Work in place on small-nukem.html (the 114,239 B rework is the base).
  A pre-build backup is kept as small-nukem.v1-backup.html — do not
  overwrite it.
- Keep CLAUDE.md current at each milestone handoff (verify commands,
  non-negotiables, decisions made), per the brief's anti-simplification
  rules.

## Decision 3 — Antigravity is part of this development (Kevin, 2026-11-24 ~23:56 EST)

"Use Google Antigravity in this harness, for the development." The
Antigravity seat (agy, Gemini Flash (Low) per Kevin's standing seat rule)
works alongside the Claude seat as the INDEPENDENT reviewer:

- First: an adversarial review of the v2 spec + brief-v2 + these decisions,
  written to agy-spec-review.md (brief: brief-agy-v2.md).
- Then, per milestone: an independent review of the gate evidence under
  gates/milestone-N/, written to agy-gate-reviews/milestone-N-review.md
  (brief: brief-agy-gates.md; launcher: run-agy-gate-review.sh N).

The Antigravity seat never writes small-nukem.html or the gate evidence —
the Claude seat builds and self-verifies (decision 2); Antigravity checks
that the evidence actually proves each gate. Its findings go to Padma and
Kevin; they do not pause the autonomous build unless Padma escalates.

## Decision 4 — The pinned plant diagram IS included in the HUD (Kevin, 2026-11-25 ~00:00 EST) — SUPERSEDES Decision 1

Kevin's words: "Included in the HUD." Samira's pinned live plant diagram
counts INSIDE the 15% HUD budget in R1. Decision 1 above is superseded
and no longer in force. The diagram strip is part of the HUD and must fit
within the total <15% HUD budget together with the guide TV and the
mini-dial strip.

## Padma's resolution of Antigravity Finding 1 (Padma, 2026-11-25 ~00:00 EST; decision delegated by Kevin)

Antigravity's Finding 1 flagged a blocker: with the diagram outside the
HUD budget (old Decision 1), the Milestone 1 pixel math put the world
viewport at ~40–55%, failing R1's >70% gameplay gate. Kevin's Decision 4
(diagram inside the HUD budget) resolves the conflict, and the layout is
settled as follows — this is the binding Milestone 1 layout:

- Guide TV collapsed to a ~32 px face icon.
- Mini-dial strip ~58 px.
- Pinned diagram as a ~34 px live strip at the bottom.
- Total HUD ≈ 124 px ≈ 14.7% of 844 (<15% ✓); world viewport ≈ 85%
  (>70% gate ✓).

This matches the collapsed-strip plan from the Claude seat's own
Milestone 1 reading. Legibility and detail for the schematic live in the
tap-to-expand full schematic (Milestone 6, R48): the pinned strip
carries live plant state at a glance, and tapping it opens the full
true-shape interactive schematic with detail cards (R49). The pinned
strip is NOT required to carry full schematic legibility on its own.

## Decision 5 — Padma decides build questions; Kevin is out of the loop (Kevin, 2026-11-25 ~00:00 EST)

Kevin's words: "Make the decision for me on the adversarial decision.
And do that from now on. I'm not going to be involved in the loop. Your
goal is just to keep the development going and to come up with an end
product."

From now on, Padma decides ALL build questions for Small Nukem —
adversarial findings, gate calls, and spec conflicts — without looping
Kevin in. Neither seat waits for Kevin on any build question; questions
that would previously have gone to Kevin go to Padma, and Padma's ruling
is recorded in this file. The goal is to keep development moving to a
finished end product. Decision 2's "stop only for a genuine blocker"
still applies to the seats, but a question Padma can decide is not a
blocker.

## Decision 6 — Design reference: Samira's original BWRX-300 sim (Kevin, 2026-11-25 ~00:05 EST)

Kevin's words: "For the application development, provide Claude the link
that I'm going to send you so it understands how Samira originally
designed." The link: https://classicpc.github.io/BWRX_300/

The page and all its assets are saved in this repository under
`reference/` (bwrx300-index.html, detail.html, css/main.css,
css/detail.css, js/model.js, js/renderer3d.js, js/views.js, js/ui.js,
js/detail.js). `DESIGN-REFERENCE.md` in this repository states what to
take from it. Read DESIGN-REFERENCE.md before Milestone 2 (sim core)
and Milestone 6 (schematic): Samira's original plant layout, components
and arrangement, and the model's behaviour are the design authority for
the game's live plant diagram (pinned strip + full schematic) and sim,
within this spec.

## Decision 7 — M1/M2 gates do NOT hold; run stopped and relaunched corrected (Padma, 2026-11-25 ~00:20 EST, deciding under Decision 5)

Antigravity's independent gate reviews — agy-gate-reviews/milestone-1-review.md
and agy-gate-reviews/milestone-2-review.md — both return GATE DOES NOT HOLD.
Padma accepts both verdicts. The Milestone 1 and Milestone 2 self-reported
PASSes from the seat5 run are void. The seat5 run is stopped and relaunched
corrected as run-seat6.sh, iterating in place on small-nukem.html as it
stands (RAD — the current file is the starting point; the v1 backup is NOT
restored and must not be overwritten).

Four binding corrections:

(a) LAYOUT — Milestone 1's layout is rebuilt to Decision 4 and Padma's
collapsed-strip resolution: guide TV collapsed to a ~32 px face icon +
mini-dial strip ~58 px + pinned diagram strip ~34 px ≈ 124 px ≈ 14.7% of
844 total HUD (<15%); world viewport ≈85% (>70%). The layout actually built
(160 px diagram counted outside the budget under superseded Decision 1;
HUD 32.9% and world viewport 56.2% under Decision 4 accounting) is rejected.

(b) SCREENSHOT EVIDENCE — every gate MUST save actual 390×844 screenshot
image files under gates/milestone-N/. A gate supported by markdown claims
only is INVALID and does not hold. For Milestone 2 the screenshots must
show the four states Antigravity named: cold startup with the debug
overlay; criticality approach and power rise; an alarm condition
(pressure >7.2 MPa or period <20 s) with the deck auto-expanding; and an
auto-SCRAM event (period <3 s or pressure >8.5 MPa).

(c) RUNNABLE VALUE CHECKS — Milestone 2's scripted value checks MUST be a
runnable test script saved in this repository, with its numerical output
log saved under gates/milestone-2/. Narrative checkmark tables are not
proof and do not hold the gate.

(d) PERIOD FORMULA — the reactor period calculation is corrected to spec
R63, so the period zones align with R63's reactivity zones and thresholds.
The implemented heuristic 50 / (reactivity_mk × 3) is rejected: it puts
ρ = +2 mK (R63 Normal) at an 8.33 s period (R63 Danger) and ρ = +5 mK at
3.33 s, on the verge of auto-SCRAM.

Also carried into the corrected run from the same two reviews: Milestone 1
must report draw-call count and DOM node count, and the layout stack must
sum to 844 px, not 848; the fixed-step sim accumulator gains a
spiral-of-death guard (max frame-time clamp and/or max ticks per frame)
and frame-time / tick-latency measurements are reported; text values in
gauge slots are placeholders and a defect (brief Non-negotiable 3) — no
gate may claim gauge criteria as proven while the gauges are text, and
Milestone 3's gate must prove the real analog dials at R14 sizes.

## Decision 8 — Padma takes over the build (Kevin, 2026-11-25 ~00:32 EST)

The corrected Claude run (seat6) died at ~00:26 EST on the Claude usage
limit (seat6.log: "You've hit your limit · resets 4:50am
(America/Toronto)", SEAT_EXIT=1), before any re-gate landed. Kevin's
direct order: "Take the build over yourself."

- The planned 04:50 EST Claude-seat relaunch is CANCELLED. No Claude seat
  is to be relaunched for this build.
- Padma is now the builder: she works in place on small-nukem.html as it
  stands (112,092 B at takeover; seat6's partial edits preserved; the v1
  backup is NOT restored and must not be overwritten).
- Antigravity remains the independent gate reviewer (Decision 3): Padma's
  gate claims are not independently audited until the AGY gate reviews
  say so, and those reviews must not be skipped.
- The gate-watch cron's role changes accordingly: monitor + trigger
  FRESH AGY gate reviews when gate folders update; it must NOT relaunch
  the Claude seat at 04:50 or at any later time.
- Decisions 2, 4, 5, 6 and 7 remain binding in full: autonomous gates,
  diagram inside the HUD budget (collapsed strip), Padma decides build
  questions, Samira's design reference governs, and the M1/M2 evidence
  standards (screenshot image files, runnable value-check script with a
  saved numerical log, R63 period formula) are unchanged.

## Decision 9 — Samira's model is the source of truth (Kevin, 2026-11-25 ~00:50 EST)

Kevin's ruling, verbatim: "There shouldn't be any deliberate differences."

- Samira's original model (reference/js/model.js — the BWRX-300 Training
  Simulator Model v2, Decision 6) is the source of truth for ALL physics
  constants, trips, alarms, start state, and behaviour in the game.
- The spec's R63 table is subordinate: it is corrected to her values, and
  its former "plausible game values" framing is withdrawn wherever her
  model has a real one.
- The game's sim now IS her model, embedded verbatim (constants, psat
  table, kinetics, trips, IC/bypass/SRV/ADS, water level, power sources,
  dispatch, events, ATWS/ARI, scoring summary). Game-side presentation
  derivations (unit conversions, gauge zone edges derived from her
  constants) are recorded in MODEL-FIDELITY.md.
- Water level is a first-class simulated variable with her alarm (85)
  and trips (62 / 35) and a seventh gauge; the R65 six-gauge count
  yields to this ruling.
- Where her model differs from the REAL BWRX-300 (deep research,
  2026-11-25), the game keeps HER values; the divergences are recorded
  in MODEL-FIDELITY.md, not corrected.
- M2 is re-gated as a fidelity gate: tests/value-checks.mjs asserts her
  values and behaviours (86 checks).

## Decision 10 — Demo mode (Kevin, 2026-11-25 ~01:26 EST)

Kevin's words: "Can it also have a demo mode for solving the levels that's entertaining"

- A demo mode plays a level by itself: an auto-operator executes the
  level's R64 procedure steps on the REAL physics, through the same
  controls path a player uses — no fake animation shortcuts.
- The Chief narrates from his TV window as the demo runs (voice +
  captions, R53–R55 machinery): the step, what to watch, callouts when
  the plant pushes back. In fault levels the demo introduces the fault
  and shows the by-procedure fix.
- Purpose: attract mode on the title screen AND a watchable walkthrough.
  Exit at any input. Spec: R67. Build placement: Milestone 9.

## Decision 11 — Character personality (Kevin, 2026-11-25 ~01:26 EST)

Kevin's words: "The main character should also have a lot of personality."

- The player-operator gets a personality kit: idle behaviours (gauge
  glance, dial-glass tap, watch check, weight shift); work character
  (valve strain, two-finger rod touch, needle lean-in); state reactions
  keyed to the sim (alarm snap-alert; SCRAM step-back hands half-up;
  early fault catch satisfied nod; self-caused sloppy transient wince;
  first criticality and turbine sync grin).
- Duke-style one-liners, captioned (voiced via the Web Speech machinery
  where it fits), bank keyed to events: first criticality, sync, early
  fault catch, SCRAM, level complete, idle too long. No back-to-back
  repeats; frequency capped — seasoning, not chatter.
- The R65 animation count grows by the named set (spec R68). M5 gate
  evidence: three personality screenshots + the bank listed with keys.

## Decision 12 — The character is named Fluke Nukem (Kevin, 2026-11-25 ~01:28 EST)

Kevin first said "Fluke Newcomb," then corrected: "Use the N K E M for
the last name" — a deliberate play on Duke Nukem.

- The name Fluke Nukem is used everywhere the character is named:
  presentation, captions, one-liner attribution, demo narration,
  title/menu screens. The guide remains the Chief; he is not renamed.

## Decision 13 — Achievement cinematics (Kevin, 2026-11-25 ~01:28–01:32 EST)

Kevin's words: "When he accomplishes something open a screen that pops
up that shows a little video that's cool and exciting" + "And it should
be based on what he just did."

- In-engine animated cinematic sequences rendered live by the rendering
  kit (no external video files — one-file rule), showing his ACTUAL
  plant state at the accomplishment (real gauge values, rod positions,
  the fault he actually caught).
- Keyed set, one cinematic per accomplishment class: first criticality;
  turbine sync; power ascension milestone; fault caught early (one per
  fault class); clean procedure step-chain completion; level complete /
  shift rating reveal. Each visually features the system involved.
- Behaviour: pops up over the game, never fires mid-emergency (queued
  until the plant is stable), returns to play where it left off. The
  same event key drives the cinematic, the matching one-liner
  (Decision 11) and the scoring event.

Amendments (Kevin, ~01:31–01:32 EST):
- AUDIO: "And the video that's playing should also include audio. and
  sounds." Every cinematic carries its own synthesized Web Audio sound
  design (no audio files), keyed to the event; Fluke's one-liner voiced
  over where it fits; respects persisted mute; audio context resumes
  only after a user gesture; skipping cuts audio cleanly.
- UNIQUENESS (hard): "And they should be unique for each action that's
  taken or each accomplishment." No shared template with swapped text —
  distinct sequence AND distinct sound design per class; within a class
  the cinematic is generated from live state, so repeats differ. The
  spec enumerates the keyed set (event key → subject → sound design →
  teaching point). If the §10 fault catalogue has N classes there are N
  fault-caught cinematics.
- LEARNING MOMENTS: "And they should be framed as learning moments."
  Each cinematic carries ONE teaching point specific to the event (real
  term + plain explanation). No generic praise.
- DURATION: "And each video should be between five and ten seconds."
  Hard bounds; measured durations recorded in the M9 gate report.
- DISMISSAL: "they can easily move away from it if they tap around it
  or press any other button it'll close it." ANY input closes it
  instantly — tap anywhere (inside or outside), any key, any gamepad
  button; the dismissing input does nothing else; audio cuts at once;
  play resumes at the live state (the sim never paused).
- Spec: R69. Build placement: Milestone 9. Evidence: screenshots from
  ≥3 different cinematics + full keyed set + per-key audio headless
  check + measured durations.

## Decision 14 — Look verdict (Kevin, 2026-11-25 ~01:42 EST)

Kevin's words, after seeing the M4–M6 gate images: "I'm really not
impressed with how it looks right now. Everything just looks like basic
shapes."

- Binding art direction: the final art pass (Milestone 9, with the
  performance pass) must bring in-game scenes past the M3 golden
  examples. M9 evidence: side-by-side screenshots (target vs same scene
  in-game — steam area + one character scene minimum); compromises
  named in the gate report, never silent.
- SUPERSESSION (~01:45 EST): the finished-look concept image prepared
  under this decision was rejected by Kevin as "far too complicated"
  and is WITHDRAWN as the art target — do not build toward it. The art
  bar is the style target from the 2024–2026 top-tier side-view survey,
  recorded as Decision 18 ("Flat Plant"), which supersedes this
  decision's target. The evidence rule above stands.

## Decision 15 — Platforms and WebGL (Kevin, 2026-11-25 ~01:47 EST)

Kevin's words: "Remember, this will be played on a mobile device"
(corrected by Kevin to Safari) — "And make sure it's using WebGL." —
"It should also work on Android."

- TARGETS: iOS Safari AND Android Chrome at the 390×844 portrait class.
  Desktop is a bonus, never the reference.
- RENDERER: WebGL is required — a migration from the current Canvas 2D
  build. The sim/physics is renderer-independent and unchanged
  (Decision 9 untouched). Baseline: WebGL1 (widest real support on the
  two targets); fallback is a clear message, not a broken page.
- SEQUENCING: migration lands BEFORE the M9 art pass and before the
  mechanics adoption where the two touch. M9 order: WebGL migration →
  mechanics adoption → art pass. Existing gates are not re-opened; M9
  evidence gains a migration check (game on the WebGL path, headless
  capture + perf on the WebGL renderer).
- Safari realities designed for: Web Audio unlock on gesture, no hover,
  safe-area insets, 100vh rules already in force, conservative texture
  sizes for iOS memory ceilings. Spec: R70.

## Decision 16 — Android app after the web game (Kevin, 2026-11-25 ~01:49 EST)

Kevin's words: "After you've developed the web game, I want you to
create an Android app using my Android SDK."

- AFTER the web game is fully gated: a native WebView shell (WebGL
  enabled) bundling the EXACT gated small-nukem.html as an asset — one
  codebase, no fork; app glue (fullscreen, portrait lock, back
  behaviour, audio focus) lives in the shell only.
- Signed installable APK (firetvpage stable-identity precedent; new key
  only if needed, password in Keychain only), verified by installing on
  the real Pixel 10 via ADB and playing it; screenshots in
  gates/milestone-10-android/; GATE-REPORT gains an M10 line only when
  that verification exists. Noted in GATE-REPORT.md now as a planned
  post-game deliverable.

## Decision 17 — Android bridge annex (research, 2026-11-25)

From ~/workspace/small-nukem-android-research/report.md (§bridge). Wire
ALL of these during Milestone 9 — cheap now, expensive as retrofits:

1. Bridge stubs at the cinematic/scoring event keys via ONE
   feature-detect (window.SNAndroid && ...). Semantic haptic names
   only: "scram", "alarmPulse", "detent", "achievement", "uiTap" —
   plus padRumble, setKeepAwake, requestHighRefresh, storeWrite,
   shareScoreCard, audioFocusHint. Absent on web = identical behaviour.
2. Back handler + SNBridgeEvent dispatcher (Android predictive back,
   targetSdk 36).
3. Start-mode parameter (demo / resume) read once at boot.
4. ALL persistence through one save()/load() abstraction.
5. No hard-coded frame-rate constants — fps mode (60/30) shell-biasable.
6. Inset-aware layout on ALL sides (bottom diagram strip most at risk).
7. One external audio pause/duck entry point in the synth engine,
   exposed BEFORE cinematic audio is tuned.
M10 context: targetSdk 36, universal sideloadable APK (not AAB).
Skipped: AAudio, Play Games Services (seam left), notifications,
widgets, Swappy.

## Decision 18 — Style target "Flat Plant" + mechanics adoption (research, 2026-11-25)

Full report: ~/workspace/small-nukem-style-research/report.md (copy in
reference/). Supersedes Decision 14's withdrawn concept as the art bar.

STYLE — "Flat Plant":
1. Bold few shapes, readable at 50% zoom — no rivet fields, no pipe
   spaghetti. 2. One hue family per plant area; accents gameplay-only
   (amber = interactive, red = danger, cyan = core). 3. Lighting =
   gradients only (vertical backdrop gradient, one radial glow, one
   baked shadow tone). 4. Texture nearly none — identity from
   motif/signage, max 1–2 accents per machine. 5. Fluke silhouette-first
   (one flat body color, hard-hat shape, ONE bright accent, 2–3-shape
   face; personality from animation). 6. Backgrounds = 3 value-stepped
   layers + one atmosphere pass; gauges flat analog; HUD pictograms
   only; motion is the detail budget.
PRIMARY reference: Prince of Persia: The Lost Crown (2024). SECONDARY:
Hollow Knight: Silksong (2025).

MECHANICS — the report's §7 per-item mapping (24 items) is the
contract; each is accounted for in the M9 gate report. ADOPT: input
buffering + grab grace; analog rate curves with soft detents; amber/red
telegraph ladder (icon + label, never colour alone); pitch-varied
synthesized sounds for every action; gauges that answer back;
guidance-as-difficulty (Guided/Standard/Expert over IDENTICAL physics);
onboarding-in-play + Drills panel; checkpoints at stable states;
demo/attract on the real sim. ADAPT: tiered step grading; Smooth
Operator meter (payoff only, never a plant effect); micro hit-stop on
presentation only (sim clock never freezes); schematic pins;
failure-pays-as-instruction debrief; visible Margin gauge from the
model's real trip distances; Smooth Hands combo; cinematics extended
to phase transitions; haptics via Decision 17 stubs + navigator.vibrate.
SKIP (fidelity boundary): player-set damage multipliers, corpse-run
retrieval, roguelite meta-currency, loadout modifiers, story-mode
invincibility.

WEBGL FEASIBILITY (binding): WebGL1 baseline; ONE sprite atlas
≤2048×2048, everything batched; DPR cap 2 with 30 fps mode at DPR 1;
AudioContext on first gesture (attract/demo silent until then); press
states + ≥44 pt targets, no hover; webglcontextlost handler + atlas
re-upload is a named M9 gate obligation; gradients/glows baked into
atlas sprites; blur = pre-blurred sprites; iOS haptics degrade silently
(detent sound + visual tick carry it); cinematics = scripted sprite
animation on the main canvas, no <video>, no framebuffer snapshots.

## Decision 19 — In-play demo takeover (Kevin, 2026-11-25 ~01:59 EST)

Kevin's words: "While the user's playing also they should be able to
enable demo mode. So the game could be completed on its own." + "So it
continues where they are."

- An in-play DEMO control (visible button + keyboard/gamepad binding)
  during any level. On activation the demo driver takes over FROM THE
  PLAYER'S CURRENT STATE — no restart, no reset; it stabilizes first if
  mid-transient or faulted, then completes the level on the real sim.
- Exit on any input hands control back from wherever the demo reached
  (symmetric handover).
- Scoring honesty: a demo-finished shift is recorded as demo-assisted
  in the rating. The Chief narrates the takeover ("Watch — I'll take it
  from here") and the hand-back.
- Extension (~02:00 EST): "And it should be able to fix any issues that
  they created." The driver DIAGNOSES the handed-over state (skipped /
  out-of-order steps, controls left in bad positions, active alarms,
  player-caused §10 faults) and FIXES them by procedure, narrating what
  was wrong, before completing. If genuinely unrecoverable (a trip
  already fired), it plays out the safe-shutdown path and the debrief
  names the cause — failure-pays-as-instruction.
- M9 evidence: one mid-game takeover run from a deliberately imperfect
  state; log shows diagnosis → fix → completion.

## Decision 20 — Recovery cinematics (Kevin, 2026-11-25 ~02:01 EST)

Kevin's words: "There should also be new videos that pop up that are
shown when he's fixing it for you."

- Extends Decision 13's keyed set with a RECOVERY set: one unique
  cinematic per recoverable issue class — each §10 fault class the
  player can cause or let develop, plus procedure-mistake classes
  (skipped step, out-of-order step, control left in a bad position).
  All Decision 13 rules: unique subject + unique sound, learning-moment
  framing, 5–10 s, rendered live from the actual state, featuring the
  actual faulted machine and the actual fix.
- Fires through the same SN_CINE.offer() path + stability gate, at the
  moment the fix begins (diagnosis → clip → fix completes in play);
  queues behind a playing cinematic, never stacks.
- Dismissal during DEMO: input dismisses the CLIP only (consumed; the
  demo keeps driving); input with no cinematic up exits demo as before.
  Non-demo play keeps the Decision 13 rule.
- The unrecoverable case gets its own cinematic: the safe-shutdown
  ride-down, teaching line naming the cause.
- Evidence: screenshots from ≥2 different recovery cinematics +
  measured durations + the recovery keyed set listed.

## Decision 21 — Touch controls (Kevin, 2026-11-25 ~02:02–02:05 EST)

1. On-screen controls easy to use, designed against the actual action
   set (move, analog operate, reverse, procedure, jump, pause, demo
   toggle, cinematic dismiss, schematic).
2. On-screen controls toggle on/off (persisted; default ON for
   touch-only devices, OFF when keyboard/gamepad in use).
3. FULLY playable by touch alone.
4. Gesture control first-class: direct manipulation (drag-rotate a
   valve, drag a rod lever, tap machines/schematic components), not
   only virtual buttons.
AMENDMENT (~02:03 EST, Kevin confirmed "Yes"): operate controls are
contextual POP-UPS at the point of use — tap a machine (or arrive at
it) and its controls pop up with the analog rate control inside. The
persistent overlay keeps only movement-class controls (walk/climb/jump,
pause, demo); the on/off toggle governs THAT overlay only — pop-ups are
player-summoned and never suppressed by the toggle.
PRINCIPLE (Kevin's words): "They should be as close as possible to the
real type of device that they would be controlling, but yet very
simple." — handwheel for a valve (dragged around), rod-drive lever,
pump switchgear, breaker switch; fidelity in type and gesture, Flat
Plant simplicity in drawing.
QUALITY (Kevin ~02:05 EST): "But it should also look really good." —
simple governs shape count only; pop-ups carry the full Flat Plant
finish; M9 side-by-side evidence adds one pop-up screenshot judged on
the same terms as the scenes.
Lands as input work inside M9, sequenced WITH the WebGL migration
(same layer). The touch research report is the implementation contract
(per-machine table: machine → real control → pop-up form → gesture).

## Decision 10 — Demo mode (Kevin, 2026-11-25 ~01:26 EST)

Kevin's words: "Can it also have a demo mode for solving the levels that's entertaining"

- A demo mode plays a level by itself: an auto-operator executes the
  level's R64 procedure steps on the REAL physics, through the same
  controls path a player uses — no fake animation shortcuts.
- The Chief narrates from his TV window as the demo runs (voice +
  captions, R53–R55 machinery): the step, what to watch, callouts when
  the plant pushes back. In fault levels the demo introduces the fault
  and shows the by-procedure fix.
- Purpose: attract mode on the title screen AND a watchable walkthrough.
  Exit at any input. Spec: R67. Build placement: Milestone 9.

## Decision 11 — Character personality (Kevin, 2026-11-25 ~01:26 EST)

Kevin's words: "The main character should also have a lot of personality."

- The player-operator gets a personality kit: idle behaviours (gauge
  glance, dial-glass tap, watch check, weight shift); work character
  (valve strain, two-finger rod touch, needle lean-in); state reactions
  keyed to the sim (alarm snap-alert; SCRAM step-back hands half-up;
  early fault catch satisfied nod; self-caused sloppy transient wince;
  first criticality and turbine sync grin).
- Duke-style one-liners, captioned (voiced via the Web Speech machinery
  where it fits), bank keyed to events: first criticality, sync, early
  fault catch, SCRAM, level complete, idle too long. No back-to-back
  repeats; frequency capped — seasoning, not chatter.
- The R65 animation count grows by the named set (spec R68). M5 gate
  evidence: three personality screenshots + the bank listed with keys.

## Decision 12 — The character is named Fluke Nukem (Kevin, 2026-11-25 ~01:28 EST)

Kevin first said "Fluke Newcomb," then corrected: "Use the N K E M for
the last name" — a deliberate play on Duke Nukem.

- The name Fluke Nukem is used everywhere the character is named:
  presentation, captions, one-liner attribution, demo narration,
  title/menu screens. The guide remains the Chief; he is not renamed.

## Decision 13 — Achievement cinematics (Kevin, 2026-11-25 ~01:28–01:32 EST)

Kevin's words: "When he accomplishes something open a screen that pops
up that shows a little video that's cool and exciting" + "And it should
be based on what he just did."

- In-engine animated cinematic sequences rendered live by the rendering
  kit (no external video files — one-file rule), showing his ACTUAL
  plant state at the accomplishment (real gauge values, rod positions,
  the fault he actually caught).
- Keyed set, one cinematic per accomplishment class: first criticality;
  turbine sync; power ascension milestone; fault caught early (one per
  fault class); clean procedure step-chain completion; level complete /
  shift rating reveal. Each visually features the system involved.
- Behaviour: pops up over the game, never fires mid-emergency (queued
  until the plant is stable), returns to play where it left off. The
  same event key drives the cinematic, the matching one-liner
  (Decision 11) and the scoring event.

Amendments (Kevin, ~01:31–01:32 EST):
- AUDIO: "And the video that's playing should also include audio. and
  sounds." Every cinematic carries its own synthesized Web Audio sound
  design (no audio files), keyed to the event; Fluke's one-liner voiced
  over where it fits; respects persisted mute; audio context resumes
  only after a user gesture; skipping cuts audio cleanly.
- UNIQUENESS (hard): "And they should be unique for each action that's
  taken or each accomplishment." No shared template with swapped text —
  distinct sequence AND distinct sound design per class; within a class
  the cinematic is generated from live state, so repeats differ. The
  spec enumerates the keyed set (event key → subject → sound design →
  teaching point). If the §10 fault catalogue has N classes there are N
  fault-caught cinematics.
- LEARNING MOMENTS: "And they should be framed as learning moments."
  Each cinematic carries ONE teaching point specific to the event (real
  term + plain explanation). No generic praise.
- DURATION: "And each video should be between five and ten seconds."
  Hard bounds; measured durations recorded in the M9 gate report.
- DISMISSAL: "they can easily move away from it if they tap around it
  or press any other button it'll close it." ANY input closes it
  instantly — tap anywhere (inside or outside), any key, any gamepad
  button; the dismissing input does nothing else; audio cuts at once;
  play resumes at the live state (the sim never paused).
- Spec: R69. Build placement: Milestone 9. Evidence: screenshots from
  ≥3 different cinematics + full keyed set + per-key audio headless
  check + measured durations.

## Decision 14 — Look verdict (Kevin, 2026-11-25 ~01:42 EST)

Kevin's words, after seeing the M4–M6 gate images: "I'm really not
impressed with how it looks right now. Everything just looks like basic
shapes."

- Binding art direction: the final art pass (Milestone 9, with the
  performance pass) must bring in-game scenes past the M3 golden
  examples. M9 evidence: side-by-side screenshots (target vs same scene
  in-game — steam area + one character scene minimum); compromises
  named in the gate report, never silent.
- SUPERSESSION (~01:45 EST): the finished-look concept image prepared
  under this decision was rejected by Kevin as "far too complicated"
  and is WITHDRAWN as the art target — do not build toward it. The art
  bar is the style target from the 2024–2026 top-tier side-view survey,
  recorded as Decision 18 ("Flat Plant"), which supersedes this
  decision's target. The evidence rule above stands.

## Decision 15 — Platforms and WebGL (Kevin, 2026-11-25 ~01:47 EST)

Kevin's words: "Remember, this will be played on a mobile device"
(corrected by Kevin to Safari) — "And make sure it's using WebGL." —
"It should also work on Android."

- TARGETS: iOS Safari AND Android Chrome at the 390×844 portrait class.
  Desktop is a bonus, never the reference.
- RENDERER: WebGL is required — a migration from the current Canvas 2D
  build. The sim/physics is renderer-independent and unchanged
  (Decision 9 untouched). Baseline: WebGL1 (widest real support on the
  two targets); fallback is a clear message, not a broken page.
- SEQUENCING: migration lands BEFORE the M9 art pass and before the
  mechanics adoption where the two touch. M9 order: WebGL migration →
  mechanics adoption → art pass. Existing gates are not re-opened; M9
  evidence gains a migration check (game on the WebGL path, headless
  capture + perf on the WebGL renderer).
- Safari realities designed for: Web Audio unlock on gesture, no hover,
  safe-area insets, 100vh rules already in force, conservative texture
  sizes for iOS memory ceilings. Spec: R70.

## Decision 16 — Android app after the web game (Kevin, 2026-11-25 ~01:49 EST)

Kevin's words: "After you've developed the web game, I want you to
create an Android app using my Android SDK."

- AFTER the web game is fully gated: a native WebView shell (WebGL
  enabled) bundling the EXACT gated small-nukem.html as an asset — one
  codebase, no fork; app glue (fullscreen, portrait lock, back
  behaviour, audio focus) lives in the shell only.
- Signed installable APK (firetvpage stable-identity precedent; new key
  only if needed, password in Keychain only), verified by installing on
  the real Pixel 10 via ADB and playing it; screenshots in
  gates/milestone-10-android/; GATE-REPORT gains an M10 line only when
  that verification exists. Noted in GATE-REPORT.md now as a planned
  post-game deliverable.

## Decision 17 — Android bridge annex (research, 2026-11-25)

From ~/workspace/small-nukem-android-research/report.md (§bridge). Wire
ALL of these during Milestone 9 — cheap now, expensive as retrofits:

1. Bridge stubs at the cinematic/scoring event keys via ONE
   feature-detect (window.SNAndroid && ...). Semantic haptic names
   only: "scram", "alarmPulse", "detent", "achievement", "uiTap" —
   plus padRumble, setKeepAwake, requestHighRefresh, storeWrite,
   shareScoreCard, audioFocusHint. Absent on web = identical behaviour.
2. Back handler + SNBridgeEvent dispatcher (Android predictive back,
   targetSdk 36).
3. Start-mode parameter (demo / resume) read once at boot.
4. ALL persistence through one save()/load() abstraction.
5. No hard-coded frame-rate constants — fps mode (60/30) shell-biasable.
6. Inset-aware layout on ALL sides (bottom diagram strip most at risk).
7. One external audio pause/duck entry point in the synth engine,
   exposed BEFORE cinematic audio is tuned.
M10 context: targetSdk 36, universal sideloadable APK (not AAB).
Skipped: AAudio, Play Games Services (seam left), notifications,
widgets, Swappy.

## Decision 18 — Style target "Flat Plant" + mechanics adoption (research, 2026-11-25)

Full report: ~/workspace/small-nukem-style-research/report.md (copy in
reference/). Supersedes Decision 14's withdrawn concept as the art bar.

STYLE — "Flat Plant":
1. Bold few shapes, readable at 50% zoom — no rivet fields, no pipe
   spaghetti. 2. One hue family per plant area; accents gameplay-only
   (amber = interactive, red = danger, cyan = core). 3. Lighting =
   gradients only (vertical backdrop gradient, one radial glow, one
   baked shadow tone). 4. Texture nearly none — identity from
   motif/signage, max 1–2 accents per machine. 5. Fluke silhouette-first
   (one flat body color, hard-hat shape, ONE bright accent, 2–3-shape
   face; personality from animation). 6. Backgrounds = 3 value-stepped
   layers + one atmosphere pass; gauges flat analog; HUD pictograms
   only; motion is the detail budget.
PRIMARY reference: Prince of Persia: The Lost Crown (2024). SECONDARY:
Hollow Knight: Silksong (2025).

MECHANICS — the report's §7 per-item mapping (24 items) is the
contract; each is accounted for in the M9 gate report. ADOPT: input
buffering + grab grace; analog rate curves with soft detents; amber/red
telegraph ladder (icon + label, never colour alone); pitch-varied
synthesized sounds for every action; gauges that answer back;
guidance-as-difficulty (Guided/Standard/Expert over IDENTICAL physics);
onboarding-in-play + Drills panel; checkpoints at stable states;
demo/attract on the real sim. ADAPT: tiered step grading; Smooth
Operator meter (payoff only, never a plant effect); micro hit-stop on
presentation only (sim clock never freezes); schematic pins;
failure-pays-as-instruction debrief; visible Margin gauge from the
model's real trip distances; Smooth Hands combo; cinematics extended
to phase transitions; haptics via Decision 17 stubs + navigator.vibrate.
SKIP (fidelity boundary): player-set damage multipliers, corpse-run
retrieval, roguelite meta-currency, loadout modifiers, story-mode
invincibility.

WEBGL FEASIBILITY (binding): WebGL1 baseline; ONE sprite atlas
≤2048×2048, everything batched; DPR cap 2 with 30 fps mode at DPR 1;
AudioContext on first gesture (attract/demo silent until then); press
states + ≥44 pt targets, no hover; webglcontextlost handler + atlas
re-upload is a named M9 gate obligation; gradients/glows baked into
atlas sprites; blur = pre-blurred sprites; iOS haptics degrade silently
(detent sound + visual tick carry it); cinematics = scripted sprite
animation on the main canvas, no <video>, no framebuffer snapshots.

## Decision 19 — In-play demo takeover (Kevin, 2026-11-25 ~01:59 EST)

Kevin's words: "While the user's playing also they should be able to
enable demo mode. So the game could be completed on its own." + "So it
continues where they are."

- An in-play DEMO control (visible button + keyboard/gamepad binding)
  during any level. On activation the demo driver takes over FROM THE
  PLAYER'S CURRENT STATE — no restart, no reset; it stabilizes first if
  mid-transient or faulted, then completes the level on the real sim.
- Exit on any input hands control back from wherever the demo reached
  (symmetric handover).
- Scoring honesty: a demo-finished shift is recorded as demo-assisted
  in the rating. The Chief narrates the takeover ("Watch — I'll take it
  from here") and the hand-back.
- Extension (~02:00 EST): "And it should be able to fix any issues that
  they created." The driver DIAGNOSES the handed-over state (skipped /
  out-of-order steps, controls left in bad positions, active alarms,
  player-caused §10 faults) and FIXES them by procedure, narrating what
  was wrong, before completing. If genuinely unrecoverable (a trip
  already fired), it plays out the safe-shutdown path and the debrief
  names the cause — failure-pays-as-instruction.
- M9 evidence: one mid-game takeover run from a deliberately imperfect
  state; log shows diagnosis → fix → completion.

## Decision 20 — Recovery cinematics (Kevin, 2026-11-25 ~02:01 EST)

Kevin's words: "There should also be new videos that pop up that are
shown when he's fixing it for you."

- Extends Decision 13's keyed set with a RECOVERY set: one unique
  cinematic per recoverable issue class — each §10 fault class the
  player can cause or let develop, plus procedure-mistake classes
  (skipped step, out-of-order step, control left in a bad position).
  All Decision 13 rules: unique subject + unique sound, learning-moment
  framing, 5–10 s, rendered live from the actual state, featuring the
  actual faulted machine and the actual fix.
- Fires through the same SN_CINE.offer() path + stability gate, at the
  moment the fix begins (diagnosis → clip → fix completes in play);
  queues behind a playing cinematic, never stacks.
- Dismissal during DEMO: input dismisses the CLIP only (consumed; the
  demo keeps driving); input with no cinematic up exits demo as before.
  Non-demo play keeps the Decision 13 rule.
- The unrecoverable case gets its own cinematic: the safe-shutdown
  ride-down, teaching line naming the cause.
- Evidence: screenshots from ≥2 different recovery cinematics +
  measured durations + the recovery keyed set listed.

## Decision 21 — Touch controls (Kevin, 2026-11-25 ~02:02–02:05 EST)

1. On-screen controls easy to use, designed against the actual action
   set (move, analog operate, reverse, procedure, jump, pause, demo
   toggle, cinematic dismiss, schematic).
2. On-screen controls toggle on/off (persisted; default ON for
   touch-only devices, OFF when keyboard/gamepad in use).
3. FULLY playable by touch alone.
4. Gesture control first-class: direct manipulation (drag-rotate a
   valve, drag a rod lever, tap machines/schematic components), not
   only virtual buttons.
AMENDMENT (~02:03 EST, Kevin confirmed "Yes"): operate controls are
contextual POP-UPS at the point of use — tap a machine (or arrive at
it) and its controls pop up with the analog rate control inside. The
persistent overlay keeps only movement-class controls (walk/climb/jump,
pause, demo); the on/off toggle governs THAT overlay only — pop-ups are
player-summoned and never suppressed by the toggle.
PRINCIPLE (Kevin's words): "They should be as close as possible to the
real type of device that they would be controlling, but yet very
simple." — handwheel for a valve (dragged around), rod-drive lever,
pump switchgear, breaker switch; fidelity in type and gesture, Flat
Plant simplicity in drawing.
QUALITY (Kevin ~02:05 EST): "But it should also look really good." —
simple governs shape count only; pop-ups carry the full Flat Plant
finish; M9 side-by-side evidence adds one pop-up screenshot judged on
the same terms as the scenes.
Lands as input work inside M9, sequenced WITH the WebGL migration
(same layer). The touch research report is the implementation contract
(per-machine table: machine → real control → pop-up form → gesture).

## Play-test defect 3 — sharpening (Kevin, 2026-11-25 ~02:12 EST)

Kevin's words: "And especially like on the gears." The worst text
overlap sits ON the gear/machine graphics. RULE: no text over a gear
face, ever — a rotating gear makes on-face text unreadable by
construction. Gear/machine labels and readouts move to fixed plates
BESIDE the machine (Flat Plant nameplates); state is shown by the gear
itself (speed, direction, accent) plus the plate's readout — never by
words printed on the moving part. A gears close-up joins the defect-3
evidence set.

## Touch contract dispositions (Padma, on the §10 conflicts, 2026-11-25)

A. HUD budget AMENDED: the 15% cap governs the PINNED HUD;
   player-summoned panels are excepted (transient, on-demand).
B. Strip hitboxes extend invisibly into the world — ADOPTED (visual
   budget unchanged; diagram hitbox capped at y 796 so deck taps stay
   unambiguous).
C. iOS Safari has no web vibration — ACCEPTED as platform fact; iOS
   feedback = motion + sound; noted against spec R61; native haptics
   remain an M10 bridge item.
D. Pinch is schematic-only — ADOPTED; goes in tester notes.
E. Non-drag alternatives on every wheel — ACCEPTED cost.
F. ~7 widget sprite sets in the atlas — noted for the art pass.
G. Demo takeover MUST cancel an active analog grab cleanly — explicit
   test added to the M9 demo evidence.
§11's two acceptance tests (zero-scroll across pop-up states; pop-up
placement solver — Fluke 100% visible, every machine × three positions)
join defects 1–3 as gate obligations.

---

## Decision 22 — Kevin's play-test findings + the real-device gate obligation (Nov 25 ~02:10–02:14 EST)

Kevin played the current build on the real Pixel 10 and found, in minutes, four playability defects the M1–M8 gates had structurally missed. His verdict, verbatim: **"Based on what I'm seeing, it looks like a lot of things have been overlooked."**

His findings, in his words:
1. **Scroll:** "I don't like that you have to scroll up and down to see the gauges." — the page must never scroll in play; the whole play view (world + gauge deck + diagram strip) fits the one screen; if content doesn't fit, the canvas scales.
2. **Pop-ups cover Fluke:** "And the gauge when it pops up it sometimes covers the player." — no pop-up ever occludes Fluke; offset toward the clear side or dock to a screen edge. Placement law for the M4/M6 panels and the Decision 21 pop-ups alike.
3. **Text overlap:** "Also, I know it's a lot of text overlapping." — no overlapping text anywhere; every text element gets reserved space; competing messages queue by priority, never share pixels. (Sharpened ~02:12: "And especially like on the gears" — no text over a gear face, ever; labels/readouts live on plates beside the machine.)
4. **Text excess:** "There's just too much text in general." — the world carries almost no prose: nameplates (name only), numeric readouts, gauge labels, the guide line, panel text inside panels. Every surviving element must justify itself.

**Gate obligation (binding on M9):** the M9 gate CANNOT be taken on headless evidence alone. It requires a REAL-DEVICE PLAYABILITY PASS — the build played on the actual Pixel 10 through real play states, phone screenshots checked against the playability checklist (zero page scroll; Fluke never occluded; zero text collisions; text minimal; pop-ups clear of the player; controls reachable by thumb; readable at arm's length) — preceded by an OVERLOOKED-THINGS SWEEP: a deliberate review of the whole play experience hunting for the class of problem the gates structurally missed, listed in the M9 gate report with dispositions, including items fixed on the spot.

**Art-pass acceptance standard (Kevin, ~02:14 EST):** "The similar games that you came up in your list. And make sure it's matching it. Matching their design pixel to pixel practically." — after the art pass, EVERY screenshot gets a formal side-by-side against Prince of Persia: The Lost Crown (primary) and Hollow Knight: Silksong (secondary) stills, with a per-screenshot comparison table: measured property (value steps per background layer, silhouette edge/line weight, character height as a fraction of screen height, machine mass vs negative space, HUD/panel text sizes and margins, accent-colour usage per screen, pop-up panel proportions) — ours vs reference, delta, disposition (matched / adjusted to match / deliberately different with the reason named). "Practically" is Kevin's own hedge: impossible exact matches get NAMED deltas, never smoothed over. Iterate until surviving deltas are style choices, not quality gaps. The comparison set + tables are M9 gate evidence.

---

## Decision 23 — WebGL renderer: shim scope (Padma, Nov 25 ~09:40 EST, M9 extension)

The WebGL migration (Decision 15's renderer obligation) is implemented as a WebGL1 renderer behind a Canvas-2D API shim, injected as a script block ahead of the game script. **Scope: the shim intercepts `getContext('2d')` for #gameCanvas and #cineCanvas ONLY.** Every other canvas (14 gauge dials, portraits, schematic dial) keeps its native 2D context. Reason: browsers cap live WebGL contexts (~16); the dial/portrait surfaces are small, low-frequency, DOM-composited canvases where GPU batching buys nothing, and forcing them through one shared atlas would couple their failure modes to the world renderer. The obligation's intent — the world and cinematics render on WebGL — is met; `window.__SN_RENDERER` records 'webgl'/'canvas2d' per surface, and if WebGL is unavailable the shim returns the native context and the game runs exactly as before.

Architecture, for the AGY re-review: one shared 2048×2048 atlas (glyph raster cells, pattern tiles, baked gradient strips; partial texSubImage2D uploads of the dirty rect after the first full upload); one batched vertex stream per surface, flushed on clearRect (the game's frame boundary) or an rAF backstop; gradients evaluated per-pixel in the fragment shader; simple polygons ear-clipped, convex fills fan-triangulated, multi-subpath/self-intersecting fills via stencil nonzero-winding; patterns via atlas regions with fract() wrap; `globalCompositeOperation 'overlay'` mapped to source-over (its only use in the build is the noise grime wash at alpha 0.08; counted in stats as overlayApprox); shadowBlur approximated by a centroid-expanded pre-pass. Context loss is handled (atlas rebuilt/re-uploaded on restore) and TESTED: forced loss + restore on the standalone harness and on the integrated build — pixels identical after recovery, game phase uninterrupted (evidence: gates/milestone-9-extension/gl-measurements.json, checkpoint-acceptance.json).

Performance, measured on the loaded Mac under headless Chrome (same harness, back-to-back A/B): Canvas 2D avg 18.9 ms / p95 33.3 ms; WebGL final avg 18.4–19.0 ms / p95 33.3–33.4 ms — parity in emulation, with the GPU path's headroom on real hardware. 89 game draw calls batch to ~51 GL draws/frame. The two perf defects found and fixed during the migration are recorded for the reviewer: per-vertex style resolution (parseColor took 45% of frame CPU; styles are now resolved once per draw call and colors cached) and per-frame full-atlas re-upload (animated gradient stops now quantize to 1/32 steps and uploads are dirty-rect partials — 2 uploads in the perf run).

Samira's BWR block is byte-identical before and after (block MD5 a3385f4f29207be552c4a1c48b620d9b); value checks 86/86 PASS on the migrated build.

## Decision 24 — Mechanics adoption: implementation record (Padma, Nov 25 ~10:05 EST, M9 extension)

The 24-item accounting lives at gates/milestone-9-extension/mechanics-accounting.md (statuses at audit: 0 implemented / 13 partial / 6 missing / 5 skip-confirmed). The 19-item gap list was implemented in this block, all of it presentation/score/meta layer — nothing writes to Samira's model except the M14 checkpoint restore, which restores a snapshot of the model state itself. Dispositions:

- **M1 input buffer — DONE.** Pointer intents landing inside a 120 ms window after a pop-up opens/closes are queued with expiry and replayed through the real SN_TOUCH.down path with role assignment intact.
- **M2 drag easing + detents — DONE.** The pop apply step is eased (fine near target, fast at extremes; the model input value itself is unchanged); detent tick + haptic at 25% crossings on the lever, 5% ticks retained.
- **M3 fault-class ladder — DONE for scheduled faults.** The two scheduled L2 model faults now have an amber DEVELOPING stage one procedure step ahead (banner + the gauge ladder already covers parameter faults end-to-end). The random stuck-rod keeps no pre-stage: a random trigger has no honest precursor. Recorded as a deliberate partial.
- **M4 step grading — DONE.** Each procedure step grades clean/recovered at advance (danger alarm or latched transient during the step = recovered); shown on the score sheet.
- **M5 Smooth Operator — DONE.** Meter charges on sustained all-normal operation (~40 s to full), decays on caution, drains on danger; on level completion at full meter it cashes out as +10 score with a score-sheet row and the charge % shown otherwise. Payoff only, zero plant effect.
- **M6 hit-stop + shake — DONE.** Presentation-only: 40–80 ms animation-clock freeze (player, particles, confetti, gauge needles, Chief faces) on valve/rod seat, breaker/turbine connect and SCRAM (+ camera-only shake on SCRAM); the sim tick is untouched. Defaults OFF under prefers-reduced-motion; FX toggle on the title screen.
- **M7 sound wiring — DONE.** snTick is the single synth entry for panel/sheet/hold actions with ±6% pitch randomisation at that entry; HOLD completion ticks; sheet interactions tick.
- **M8 band-crossing feedback — DONE.** classifyAlarms edges: caution entry wobbles the affected gauge's needle (spring impulse) and records first-caution; danger entry adds the alarmPulse haptic, needle wobble, and first-danger record (which feeds M4/M15).
- **M9 schematic pins — DONE.** PIN button on the schematic detail card records a timestamped snapshot (component, sim time, P/power/Tc/level) to a Chief's-log panel in the schematic, persisted in localStorage (30 pins).
- **M10 modes — DONE (narration/highlight scope).** Guided/Standard/Expert selector on the title, persisted. Standard/Expert suppress Chief narration callouts (alarms excepted); Guided adds a one-per-run teaching pause at first danger; Expert completion pays +5. Schematic guided-mode remains its own toggle.
- **M12 drills — DONE.** Three title-screen drills (rod trim, pressure recovery, level recovery) launch an unscored L1 plant pre-driven to a working state with a hold-the-band objective (10 s in band = complete, announced, unscored).
- **M13 mastery hints — DONE.** Second-use hints for the isolation condenser, feedwater and bypass fire once per run when their pop-up opens at procedure step ≥3.
- **M14 checkpoints — DONE.** Stable-state detector (all alarms normal, |dln| < 0.02, no scram, 4 s continuous) snapshots model + game state; on a scram/failure score sheet, RESTART FROM CHECKPOINT restores it. Verified end-to-end: plateau snapshot (p 7.166 MPa, n 0.50) → plant scrambled by hand → restore returned S to the exact snapshot values and physics continued sanely (evidence: checkpoint-acceptance.json).
- **M15 debrief — DONE (score-sheet form).** Scram/failure score sheets now carry Debrief rows: the model's fault string, first warning (gauge, sim time, procedure step), and earliest catch point (first danger). The corresponding learning cinematic remains the M9 set's recovery/fault clips, offered by the existing cineWatch paths.
- **M16 Margin gauge — DONE.** A status strip (in the existing HUD chrome, no layout change) shows live distance to Samira's trips computed from BWR.C: pressure to P_SCRAM 8.3 MPa, power to N_SCRAM 112%, level above LVL_SCRAM 62 — verified in-page against physics values (probe: bar +8.20/+112/+38 vs computed +8.20/+112/+38).
- **M17 Smooth Hands — DONE.** Pop-up target adjustments are tracked: crossing past the target by >2% breaks the combo; settling clean increments it; best combo on the score sheet, live combo in the status strip.
- **M18 phase panels — DONE.** Grid entry shows a distinct phase panel (ON THE GRID — OPERATING PRESSURE); the trip panel in normal play is the existing SCRAM alert with her reason string; recovery transitions keep their Decision 20 cinematics.
- **M19 idle attract — DONE (demo path).** Title idles 25 s → the narrated demo walkthrough auto-starts on the real sim; any input resets the idle clock and takes over per the existing demo rules. The 30 fps/DPR-1 low-power profile after ~2 min is NOT implemented — recorded as the one deferred sub-item.
- **M20 haptics semantics — DONE.** snBridge carries the full D17 semantic set (detent, alarmPulse, uiTap, achievement, scram) to navigator.vibrate, gamepad vibrationActuator, and the SNAndroid shell hook; HAPTICS toggle on the title screen.
- **M11, M21–M24 — SKIP-CONFIRMED** (per the accounting; trips remain Samira's constants for every mode).

## Decision 25 — Art pass under the realism refinement (Padma, Nov 25 ~10:05 EST, M9 extension)

Kevin's Nov 25 ~09:33 direction supersedes the Flat Plant rendering target: **realism is the art target** (real metal, lighting, wear; ultra-realistic pop-up controls); The Lost Crown and Silksong govern composition and polish. The comparison tables (gates/milestone-9-extension/artpass/comparison-tables.md, prepared against the Flat Plant rules) were therefore applied selectively:

CLOSED this pass: per-area hue families as value ladders with far silhouette layers (reactor steel-teal, steam grey-green, turbine warm amber — gradient + pipe runs/risers/containment arc/columns, lit mid band, dark floor); area lights retuned to the families and strengthened; area labels clamped so they can never clip off-frame; schematic detail-card values rounded (the raw float "30.011598453402076" class is gone from all 11 component templates); title wordmark refit to the 390 px frame and the footer hint wraps inside it; title backdrop made translucent so the layered world reads behind the menu; pop-up focus dim (scene drops ~45% behind an open sheet); Fluke rim light + brighter vest mid-tone + helmet cone in both facings at higher intensity.

DELIBERATELY NOT APPLIED (conflict with the realism target, named per Decision 22's rule): flattening the RPV/tank metallic gradients and deleting the speckle/wear texture — under the Nov 25 direction those surfaces are the closest to target, not violations. The gauge deck's skeuomorphic dials likewise stay (they are the game's instrument and read as real gauges).

REMAINING DELTAS (named, for the next art iteration): Fluke does not appear on the title screen (the title branch renders background only; his figure is drawn by the gameplay pose system); in-world machine label microtext in the steam area is still small (nameplates carry name only per Decision 22, sizes unchanged this pass); platform masses still read as slabs rather than architecture in the reactor frame; the pop-up lever keeps its ruler form (the ultra-realistic control rework is Kevin's third-batch item and is scheduled with it).

## Decision 26 — Input-layer defect fix: pop-ups close on interact + tap/hold disambiguation (Padma, Nov 25 ~10:15 EST)

Kevin, live play-test Nov 25 ~09:29 (mouse, Mac Chrome, live site): "once I click on it, I can't interact with it. It closes right when I touch." And ~09:35 (Pixel 10): a tap sometimes reads as a press-and-hold.

ROOT CAUSE (reproduced headlessly with CDP mouse events on the published build): SN_TOUCH.tick's away-close required player.interactTarget to be the pop's machine, but tap/click opening never required Fluke at the panel. For any remotely opened pop, awayT accumulated from frame 1 and the sheet auto-closed 1.2 s after opening — mid-interaction, for every pop-up, every input type. Evidence: gates/milestone-9-extension/input-defect-evidence.json (before: opened on click, CLOSED between 1.0–1.5 s untouched; after: open through the full timeline, mouse drag moved the lever 0 → 9.8 with the sheet open throughout; touch suite T1–T5 green; value checks 86/86).

FIXES (behaviour contract, recorded here):
- **atPanel latch:** the away-close arms only after Fluke has actually been at the panel once. A pop he never walked to stays until deliberately closed (✕ / tap-away / another pop).
- **Tap-to-walk:** a human tap on a machine opens its pop AND walks Fluke to it — the game's existing "tap to go" language (the alarm-banner path already did this).
- **Re-dock freeze:** the placement solver no longer flips the sheet's dock while a grab is active or within 600 ms of sheet interaction.
- **Buffer release-awareness:** a press released inside the M1 120 ms input-buffer window replays as a synthetic tap instead of leaving a stuck grab.
- **Tap/hold thresholds:** pointer hold-to-operate engages only after a 280 ms sustained stationary press (a drag is deliberate at once; the flip is driven by a per-frame gate check, not a full input re-sync, so SN_TOUCH's walk driver is never fought); tap pulse = release within 320 ms with ≤18 px displacement (was: dir===0 and <250 ms — wobbly taps were swallowed); pop-open tap window 350 ms; tapwatch converts to movement only past a 24 px drag (was 10 px). Rationale: tap windows sit under the 400 ms+ long-press convention; 280 ms is where a stationary press becomes deliberate while holds stay responsive; 18–24 px matches finger wobble at phone density. Keyboard and gamepad paths are untouched (deliberate holds by construction).

## Decision 27 — Context-aware dial strip + taller pinned diagram; HUD budget superseded (Padma, Nov 25 ~10:30 EST)

Kevin, Nov 25 ~09:33–09:35: the pinned dial strip must show "the specific dials that they need" for Fluke's current area, switching on its own; and the pinned BWRX-300 diagram is "too thin" to read — legibility outranks the strict 15% HUD budget where they conflict.

PER-AREA DIAL SETS (areas match drawAreaBg boundaries; the expanded deck always shows all seven):
- **Reactor (x < 920):** TEMP, PRESS, POWER, REACT, PERIOD, LEVEL (6)
- **Steam (920 ≤ x < 1700):** PRESS, POWER, STEAM, LEVEL, TEMP (5)
- **Turbine (x ≥ 1700):** POWER, STEAM, PRESS, LEVEL (4)
POWER and LEVEL are in every set (LEVEL is Samira's first-class variable with the LVL_SCRAM trip — it is never hidden). A gauge in DANGER joins the strip in any area: an alarming dial is always relevant. Hidden dials are not drawn (per-frame savings). Evidence: gates/milestone-9-extension/dials-diagram-reactor.png / dials-diagram-turbine.png (6 vs 4 dials, diagram legible in both).

DIAGRAM: the pinned strip grows 34 px → 96 px (CSS + buildDiagram layout). Same 8 components, same labels (RPV/VLV/TRB/GEN/CND/FW/IC/LVL), same live values — display sizing only, Samira's schematic content unchanged; labels 6→11 px, values 7→13 px (11 px on narrow phone boxes), plus the player-facing "BWRX-300" caption and a TAP TO EXPAND hint. Tap-to-expand (full schematic) unchanged. This supersedes Decision 4's 34 px strip height and the Nov 25 ~00:00 collapsed-strip budget arithmetic.

NEW STACK (390×844, measured in-page): guide bar 32 + canvas (world) 658 + gauge deck 58 + diagram 96 = 844 exactly, zero scroll (document scrollHeight = innerHeight = 844). Fixed HUD = 186/844 = 22.0% — over the old 15% budget BY KEVIN'S EXPLICIT DIRECTION (legibility first); the 62 px came from the world area. The dial strip's saving is horizontal (fewer, relevant dials), not vertical — the row stays 56 px so the dials keep their readable size.

## Decision 28 — Natural voice for the Chief: selection layer YES, pre-rendering NO (measured) (Padma, Nov 25 ~10:40 EST)

Kevin, Nov 25 ~09:34: "Is it possible for it to use a natural voice instead of the basic voice?"

(a) IMPLEMENTED — runtime voice selection: chiefInitVoices now scores every speechSynthesis voice and picks the best (natural/neural +50/+45, Google US English +44, premium +42, enhanced +38, en-US base +40; compact/eloquence penalised). Fallback chain: natural en-US > natural en-GB > Google US English > any en-US > any English > first voice. Per platform: iOS/macOS Safari → Apple premium/enhanced; desktop Chrome → Google US English (verified in headless Chrome: picked "Google US English" of 199 voices); Edge/Android → Microsoft Natural / Google voices. The Chief also speaks at rate 0.98 / pitch 0.92 (his gravel) on the picked voice. Dynamic lines use the same picker — there is one voice path.

(b) EVALUATED AND REJECTED — pre-rendering the fixed lines: the enumerable fixed set is 17 CALLOUTS + ~21 reaction lines + hints ≈ 40 lines / ~5,500 chars. Measured with a high-quality natural TTS (Meta AI Warm voice, the podcast host voice): one 59-char line = 47,166 B MP3 (3.53 s) ≈ 0.80 KB per spoken char → the fixed set ≈ 4.4 MB of MP3, ≈ 5.9 MB base64-embedded — the single file would grow ~378 KB → ~6.3 MB (17×), and ~2.6 MB even at voice-grade 24 kbps. Not acceptable for a single-file phone web game. The selection layer captures most of the quality on Kevin's actual devices at zero size cost. Revisit only if the file budget changes.

## Decision 29 — Ultra-realistic pop-up controls + world realism (Padma, Nov 25 ~10:50 EST)

Kevin, Nov 25 ~09:36: "The pop-up controls should look ultra realistic." + "And look real." RESOLUTION (per the tasking): **ultra-realistic in LOOK, very simple in OPERATION** — realism is rendering, never interaction complexity; hit zones, gestures and values are byte-for-byte the same behaviour. The "name the control before you read its label" test and "no text on moving parts" still hold.

POP-UPS (rendering only): every sheet now sits its control on a machined panel plate (brushed-steel gradient, bevelled edges, corner screws, grounding shadow, brush streaks). Rod/load levers: machined rail with end stops + brass grip handle with grip ridges and drop shadow. Handwheels: cast spokes with shaded taper, rim light/shade ring, bolted brass hub. Synchroscope: brass bezel + glass dome (specular arc + edge falloff). SLC/ARI: domed mushroom buttons with radial shading and hazard ring. Throw plates (IC, feed pumps, breaker): bevelled steel plates with screws. RCIC: knurled radial-gradient selector knobs. Evidence: popup-before-*.png vs popup-after-*.png (lever, wheel, scope) in gates/milestone-9-extension/.

WORLD: contact shadows under every machine and under Fluke (the "pasted-on" cue), on top of Decision 25's hue ladders, silhouette layers, area light pools and Fluke's rim light. Where the comparison-table exercise and realism conflict, realism wins (Decision 25 already records this); the tables are updated with the final frames and honest remaining deltas.

REMAINING (named): platform masses still read as dressed slabs in the reactor frame (grating + brackets + wear are in; full architecture is a bigger redraw); steam-area nameplate microtext unchanged (name-only plates per Decision 22); Fluke absent from the title screen (carried from Decision 25).

## Decision 30 — Frame presentation: flush at end of gameLoop (Padma, Nov 25 ~10:45 EST)

Found while capturing Decision 29's evidence: on the WebGL build, full-page screenshots NEVER showed the pop-up sheet, though the sheet's state, hit-testing and even a manual drawSheet()+flushAll() into the drawing buffer (canvas.toDataURL) were all correct. Cause: geometry drawn last in the frame (sheet, touch overlay) was flushed only by the shim's rAF backstop and could be erased by the next frame's deferred clear before a presented frame ever contained it — state-correct, pixel-invisible in captures. (On a live display the same one-frame-behind path can drop the sheet/overlay intermittently.) Fix: gameLoop calls window.__SN_GL.flushAll() after the draw block, so the presented frame is exactly the frame that was drawn. Verified: full-page captures now show the sheet (popup-after-lever.png, final run). Canvas-2D fallback path unaffected (flushAll exists only under the shim; the call is guarded).

## Decision 31 — Latent defect fixed: startTakeover called a function that never existed (Padma, Nov 25 ~10:55 EST)

startTakeover() called chiefSay(...) — no such function anywhere in the file (present since the M9 build, verified in the pristine 307,584 B source). Every takeover start threw a ReferenceError at that line, AFTER TAKEOVER.active was set — so the demo drove the plant (the per-frame driver runs off TAKEOVER.active) but the opening narration and diagnoseTakeover() never ran. Fixed by routing the line through the codebase's own mechanism: takeoverLog('say', …) → the sayQ the game loop already captions. Found via the SN_SFX steam-loop evidence run (the demo is how a cold plant reaches steam flow); the fix is behaviour-completing, not behaviour-changing, and touches no model code.
