# Small Nukem — Build State

> Repo edition of the Mac working file `~/small-nukem/CLAUDE.md` (last updated
> 2026-11-25). Wording is preserved from that file — including where it
> duplicates `AGENTS.md`, which is the canonical instruction file for all
> coding agents on this project — with paths updated to this repository's
> layout: `game/`, `android/`, `tests/`, `docs/`, `tools/`, `media/`,
> `provenance/`. The dated build-state sections below are the 2026-11-25
> record; later ships are recorded in `docs/SHIP-LOG.md`. Do not start
> from this file alone — it is build-state notes from the pre-repo
> workflow and parts are stale (e.g. it still cites "86 checks" in the
> dated sections; the suite has grown far past that — see `AGENTS.md` §5).

Read AGENTS.md — it is the canonical instruction file for all coding agents on this project.

## Repository layout

- `game/small-nukem.html` — the game: one single self-contained HTML file.
- `android/` — the Android app wrapper (Decision 16).
- `tests/` — `tests/value-checks.mjs` and the `tests/patch-tests*.py` suites.
- `docs/` — `docs/spec.md`, `docs/DECISIONS.md`, `docs/MODEL-FIDELITY.md`,
  `docs/SHIP-LOG.md`, `docs/WIRING-MANIFEST.md`, `docs/ops.md`,
  `docs/research/`; start from `docs/INDEX.md`.
- `patches/` — numbered game patch scripts `patch<N>[-slug].py`; the game
  file is edited only via these (see `AGENTS.md` §4, §6).
- `tools/` — `tools/publish.sh` and operational tooling (see `docs/ops.md`).
- `media/` — `media/chief-voice/` (Chief voice clips) and `media/marketing/`.
- `provenance/` — gate evidence (`provenance/gates/`), Samira's original
  BWRX-300 design reference (`provenance/reference/`), and other source
  material the build is grounded in.

## Builder
- **Padma is the builder** (Decision 8, 2026-11-25): Kevin directed the takeover after the Claude seat (seat6) died on its usage limit. The planned 04:50 Claude-seat relaunch is CANCELLED — do not relaunch any Claude seat.
- **Antigravity is the independent gate reviewer** (Decision 3): it never writes the build or the evidence. Fresh AGY reviews are triggered per re-gated milestone (`./run-agy-gate-review.sh N`).
- Kevin is out of the loop (Decision 5): Padma decides build questions within the spec + `docs/DECISIONS.md`; surface only the finished product or a blocker written to `provenance/gates/BLOCKED.md`.

## Verify Commands
- Open `game/small-nukem.html` in browser (no server needed, single-file)
- Test at 390x844 in device emulation (iPhone 14 Pro)
- Script check: `python3 check-scripts.py game/small-nukem.html` (node --check over ALL script blocks; expect: 3 blocks, all OK)
- Value checks: `node tests/value-checks.mjs` (asserts Samira's model values/behaviours; prints "<n> passed, <m> failed", exit 0 iff 0 failed — the count grows as patches add locks; ship tallies in `AGENTS.md` §5)
- Gate screenshots + measurements (optional, pre-repo tooling): `node capture-gates.mjs` (headless Chrome via CDP, writes PNGs + measurements.json into `provenance/gates/`)
- Gate poses: `game/small-nukem.html?gate=m1|deck|cold|critical|alarm|scram|perf`
- Tap gauge deck to expand/collapse; tap guide bar to expand/collapse; touch title screen to start

## Non-Negotiables
1. One single self-contained HTML file. No external dependencies.
2. Mobile portrait primary (390x844). Desktop/gamepad secondary.
3. Analog gauges, never bars. (The dial engine is DONE — pre-rendered faces, spring-damper needles; text stand-ins are a defect, Decision 7.)
4. No placeholders, no grey boxes, no simplification.
5. Settled design unchanged: single player, 2D side view, 3 levels, physics-driven, Samira's diagram pinned, safe shutdown only.
6. Performance budgets: file ≤1.5MB target / 3MB max; ≤100 draw calls/frame target; ≥30fps sustained; DPR capped at 2; no canvas >2048²; zero hot-loop allocations.

## Decisions in force (docs/DECISIONS.md is the record)
- **Decision 4 (binding, supersedes Decision 1):** the pinned plant diagram counts INSIDE the 15% HUD budget. Layout = collapsed strip: guide bar 32px + gauge deck 58px (incl. border; six 54px mini dials) + diagram strip 34px = 124px HUD (14.69%); world 720px (85.3%); stack sums to exactly 844px. Expanded deck = overlay bottom sheet (288px, 34.1%) above the strip.
- **Decision 2:** gates are autonomous — no approval pauses; stop only for a genuine blocker (`provenance/gates/BLOCKED.md`).
- **Decision 6:** `provenance/DESIGN-REFERENCE.md` + `provenance/reference/` (Samira's original BWRX-300 design) read before M2 (done) and M6.
- **Decision 7:** seat5's M1/M2 gates void. Evidence standard: real 390×844 screenshot FILES, runnable check scripts with saved logs.
- **Decision 9 (binding):** Samira's model (`provenance/reference/js/model.js`) is the source of truth for ALL physics — no deliberate differences. The sim is her model embedded verbatim; R63 corrected to her values; see `docs/MODEL-FIDELITY.md`. Water level is a first-class variable with a 7th gauge (R65 count yields).
- **Decision 8:** Padma builds; Antigravity reviews; no Claude seat.

## Current State: Milestones 1–2 FIDELITY RE-GATED (2026-11-25, Decision 9)
- Layout per Decision 4, measured in `provenance/gates/milestone-1/measurements.json` (unchanged by the fidelity patch)
- Real analog dial engine: **7** mini (52px) + **7** deck (116px) canvas dials — TEMP / PRESS / POWER / REACT / PERIOD / STEAM / **LEVEL** — faces pre-rendered once per size, needle spring-damper + jitter, zone arcs derived from her constants (`docs/MODEL-FIDELITY.md`), setpoint triangles, digital readout windows, redline rim pulse
- Sim core: **Samira's model embedded verbatim** (BWR block) at a fixed-step 10 Hz accumulator with spiral-of-death guard (0.5 s clamp, PERF accounting); the game drives her lever/bypass controls and reads her state for all displays; PERF exposed as window.__SN_PERF__
- Deck auto-expand: any danger, plus caution in temp/power/period/steam/high-pressure; standing cold-state cautions do not pop the deck
- File size: 226,537 B

## Milestone Status
- [x] M1: Shell + portrait layout (re-gated 2026-11-25, evidence in `provenance/gates/milestone-1/`)
- [x] M2: Simulation core (fidelity re-gated 2026-11-25 vs Samira's model, Decision 9; evidence in `provenance/gates/milestone-2/`)
- [x] M3: Rendering kit + golden examples (gated 2026-11-25: R33 kit + RPV golden machine + R10 checklist; evidence in `provenance/gates/milestone-3/`)
- [x] M4: All machines, panels, gauges (gated 2026-11-25: 17 panels, annunciators R44-R47, all machines kit-shaded; evidence in `provenance/gates/milestone-4/`)
- [x] M5: Character + animations (gated 2026-11-25: articulated figure, full R36 set, R37 stride-locked; evidence in `provenance/gates/milestone-5/`)
- [x] M6: Schematic (gated 2026-11-25: true-shape SVG, 11 detail cards + focused dials, tags everywhere, live flow/trace, Guided/Live; evidence in `provenance/gates/milestone-6/`)
- [x] M7: Chief — guide TV + voice (gated 2026-11-25: CRT TV, jaw-flap face, Web Speech, 8x3 reaction table wired, celebrations; evidence in `provenance/gates/milestone-7/`)
- [x] M8: Unified input + hold-to-operate (gated 2026-11-25: pointer layer built from nothing, INPUT snapshot + merge, hold rings 1.5s/0.8s measured, multi-touch measured; evidence in `provenance/gates/milestone-8/`)
- [x] M9: Procedures, scoring, performance (gated 2026-11-25: L1/L2/L3 driver-completed through the real input layer, demo + takeover recovery with diagnosis/fix log, Fluke named, ACH hook, perf within R21; evidence in `provenance/gates/milestone-9/`)
- [x] M9 play-test addendum (Decision 22, 2026-11-25): Kevin's four Pixel 10 defects (scroll / pop-up occlusion / text overlap / text excess) fixed with headless + real-device evidence; overlooked-things sweep (20 items) + device playability pass in `provenance/gates/milestone-9/gate-report.md`. Current build 307,584 B, md5 ad877e2ddd51285c393903683b213a80, checks 86/86, published 03:28 EST. AGY M9 review blocked on Antigravity quota (resets ~165 h from Nov 25 02:46 EST) — re-run owed. M9 extension block still owed: WebGL migration, mechanics adoption, art pass + comparison tables, touch acceptance tests.
