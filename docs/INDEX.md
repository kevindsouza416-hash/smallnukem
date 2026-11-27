# Small Nukem — Documentation Index

One-page map of `docs/`. Start at the top: the first three documents settle
almost every question; the rest are for the specific job named.

| Document | What it answers | When to read it |
|---|---|---|
| [spec.md](spec.md) | What is this game? The full specification: concept, audience and tone, the single-HTML-file / mobile-portrait-first platform rules, Samira's BWRX-300 model as the foundation, the pinned live plant diagram, procedures, controls, levels, scoring — plus Part II, the v2 update folding in Kevin's playtest feedback and the applied research recommendations (portrait HUD, analog gauges, performance budgets, art, the Chief, unified input). | At the start of any design or build work; whenever a requirement, budget, or rule (R-number) is in question. |
| [DECISIONS.md](DECISIONS.md) | What has Kevin already decided? The binding decision record (Decisions 1–22+, 2026-11-24/25): HUD budget and layout, autonomous gates, Padma as builder and Antigravity as reviewer, Samira's model as source of truth, demo mode, Fluke Nukem, cinematics, platforms, Android, touch controls. Decisions here override the spec and any brief. | At the start of every session, alongside the spec — and before proposing anything that might already be settled. |
| [MODEL-FIDELITY.md](MODEL-FIDELITY.md) | Are the game's numbers really Samira's? The Decision 9 fidelity record: the full reconciliation table for all 33 of her model's constants (MATCH / CHANGED / ADDED / REMOVED / MAPPED), model structure and behaviour, presentation derivations, and the recorded — not corrected — divergences from the real BWRX-300. | Before touching any physics constant, trip, alarm, or start state; whenever a value in `game/small-nukem.html` looks wrong. |
| [SHIP-LOG.md](SHIP-LOG.md) | What shipped, when, and as what build? One `## SHIP #N` entry per ship (this file covers ships #17–#24, all Nov 26, 2026): base MD5, patch numbers/scripts in composition order, final size + MD5, gate tallies, publish verification, APK size/MD5 — plus the current build's checksums at the top. If a fact about a past build is not in the ship log, treat it as unconfirmed. | To identify the current build, trace when a change or regression landed, or append the entry for a new ship. |
| [WIRING-MANIFEST.md](WIRING-MANIFEST.md) | How do the finished assets connect to the build? The verified wiring map for the Chief voice clips and cinematics: the §A0 wiring hook, direct / variant / caption-only / do-not-wire / master / orphaned dispositions for all 215 clips, finished cinematics → scene keys, and the completed Nov 25, 2026 wiring pass. Its line numbers were measured against an earlier build — anchor on function and table names, not line numbers. | Before wiring, adding, or removing any voice clip or cinematic; never invent a wiring target it marks orphaned. Second only to `AGENTS.md` in the read order — it is the map inside the game file. |
| [ops.md](ops.md) | How does the shipped build reach players, and how is a publish verified? The serving chain (build file → `tools/publish.sh` → publish folder → origin → Caddy → https://nuke.absolutejoker.ca), the Tailscale Funnel tester link, publish steps, the APK rebuild (manual asset sync + `JAVA_HOME`), and post-publish verification. | When publishing a build, rebuilding the APK, or checking how the live site and tester link are served. |
| [research/controls.md](research/controls.md) | What should the controls be, and what did ship #24 change? The controls research report: comparable games × input methods, findings per research question, recommendations, and the ship #24 change-vs-leave-alone list, with its verification record and known gaps. | Before changing keyboard, touch, trackpad, or gamepad input, hold-to-operate, or any control scheme. |
| [research/camera-angles.md](research/camera-angles.md) | How should the camera frame and zoom? The camera research report: follow/framing models, dead zones, lookahead, ladder framing, zoom as a state, two-subject (follow-the-Chief) framing, portrait specifics, a comparison table, and the recommendations adopted for Small Nukem. | Before changing camera follow, framing, or zoom behaviour. |

| [AUDIT-2026-11-27.md](AUDIT-2026-11-27.md) | What did the controls/bug audit find, how were keyboard / mouse / trackpad / touch validated, what changed (incl. Ship #25 and the one physics change), and what is still recommended? | Before touching input, layout, the gauge deck, SCRAM, the SHOW walkthrough, or when re-running `tests/controls-e2e.mjs`. |

## Read order for a new agent

Per `../AGENTS.md` §1 — read in this order, in full, before touching anything:

1. `../AGENTS.md` — invariants, commands, conventions.
2. `WIRING-MANIFEST.md` — the map inside the game file.
3. `DECISIONS.md` — Kevin's binding decisions; they override the spec and any default.
4. `SHIP-LOG.md` — what shipped, build by build.
5. `MODEL-FIDELITY.md` — the game reconciled against Samira's model.

Then, as needed: `spec.md`, `research/`, and `ops.md`.
