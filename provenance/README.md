# Provenance — Samira's Original BWRX-300 Simulator

## What this is

`samira-original/` holds Samira D'Souza's original BWRX-300 simulator
page and model — the complete hosted asset set, mirrored verbatim.

- **Upstream:** https://classicpc.github.io/BWRX_300/
- **Mirrored:** November 25, 2026 (~00:05 EST), at Kevin D'Souza's
  direction (Decision 6 in `docs/DECISIONS.md`: "provide Claude the
  link … so it understands how Samira originally designed").
- **Mac source copied from:** `/Users/kdsouza/small-nukem/reference/`
  — the mirror as downloaded on Nov 25, 2026.
- The core of the set is `samira-original/js/model.js` — the
  "BWRX-300 Training Simulator Model v2: Physics, Kinetics,
  Thermodynamics, and Fault Logic" (870 MWt / 300 MWe).

No file in the mirror carries an in-file author or copyright line;
attribution rests on Kevin's direction and the project records
(Decisions 6 and 9, `DESIGN-REFERENCE.md`, `docs/MODEL-FIDELITY.md`).

## How Small Nukem uses it

Kevin's Small Nukem embeds her physics model **verbatim** as the
`BWR` block in `game/small-nukem.html`. That block is byte-locked:

- **Invariant MD5 (BWR block): `a3385f4f29207be552c4a1c48b620d9b`**
- Decision 9 (Kevin, 2026-11-25): "There shouldn't be any deliberate
  differences" — her constants, trips, alarms, start state, and
  behaviour are the source of truth for all physics in the game.
- Full reconciliation: see `docs/MODEL-FIDELITY.md`.

Her design also governs the plant diagram's layout, components, and
arrangement.

## Inventory — verified

The nine files below are the complete asset set the hosted page
loads. File sizes were **verified against the `DESIGN-REFERENCE.md`
inventory** — every staged size matches that inventory byte-for-byte,
and every staged size also matches the Mac mirror measured at
staging time (2026-11-26). MD5s below are the staged copies;
`js/model.js` and both CSS files were additionally hash-checked
directly against the Mac mirror and match.

| File (relative to `samira-original/`) | Size (bytes) | MD5 |
|---|---|---|
| `bwrx300-index.html` | 35,581 | `ccc768dc90a349849a917c7a9cb278ab` |
| `detail.html` | 42,442 | `2361f067750f53081dfa501493736a10` |
| `css/main.css` | 34,127 | `c0ab34019a895ee172d1b7d1edec8183` |
| `css/detail.css` | 10,457 | `cab95f9f963688ae613626029a6edfbc` |
| `js/model.js` | 17,583 | `ffd57964ae733d88a48fb10f0a4a8b56` |
| `js/detail.js` | 19,820 | `af8b570b85cd660dfac2caaeffda3d44` |
| `js/renderer3d.js` | 28,834 | `caa00b4dc0e20f7136e2ffb5421a67c4` |
| `js/ui.js` | 62,633 | `69795da3e92799ead0af4e7cc37153ae` |
| `js/views.js` | 79,560 | `4704b653e2d18ceafa49ba14f97f9f72` |

Cross-check performed at staging: the staged `js/model.js` MD5
(`ffd57964ae733d88a48fb10f0a4a8b56`) **matches** the independent VM
copy at `~/workspace/small-nukem-takeover/model.js`, and the two
files are byte-identical (`cmp` clean).

Note: the Mac `reference/` folder also contains two later Kevin-side
research notes (`android-research.md`, `style-mechanics-research.md`,
both Nov 25, 2026 02:10) that are **not** part of Samira's nine-file
mirror and are not staged here. The mirror's only external references
are Google Fonts, which were not mirrored.

## Credit

Model © Samira D'Souza, included with credit.

Samira D'Souza is the author of the original BWRX-300 reactor model
that is the source of the game's physics. See also `CREDITS.md` at
the repository root.
