# Small Nukem — Gemini / Antigravity

Small Nukem is a single-player 2D browser game about operating a BWRX-300
reactor, built on Samira D'Souza's plant model and shipped as one
self-contained HTML file (`game/small-nukem.html`); on this project the
Gemini / Antigravity seat is the independent reviewer — it reviews specs,
gate evidence, and builds, and never writes the game file or the evidence.

Read AGENTS.md — it is the canonical instruction file for all coding agents on this project.

## Read order

Read in this order, in full, before touching anything (per `AGENTS.md` §1):

1. `AGENTS.md` — invariants, commands, conventions.
2. `docs/WIRING-MANIFEST.md` — where every system, line table, voice clip, and cinematic is wired in the game file.
3. `docs/DECISIONS.md` — Kevin's binding decisions; they override the spec and any default.
4. `docs/SHIP-LOG.md` — one entry per ship: base MD5, patches in composition order, final size + MD5, gate tallies, publish verification, APK size/MD5.
5. `docs/MODEL-FIDELITY.md` — the full reconciliation of the game against Samira's model.

Then, as needed: `docs/spec.md` (the full game specification), `docs/research/` (camera, controls), `docs/ops.md` (publishing / hosting operations), and `docs/INDEX.md` (the one-page map of `docs/`).
