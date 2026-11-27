# Small Nukem

**Small Nukem** is a 2D side-view operator-training game for the BWRX-300 small
modular reactor (SMR). You play Fluke Nukem, a plant operator working through
startup — heat-up, pressurisation, first criticality, turbine roll and grid
sync — guided by the Chief, while faults, alarms and trips test whether you
actually learned the plant.

The whole game is **one self-contained HTML file** — no build step, no
dependencies, no server-side code. Open it in a browser and it runs.

- **Built by:** Kevin D'Souza
- **Original plant model:** Samira D'Souza — her BWRX-300 model (constants,
  trips, alarms, start state and behaviour) is embedded in the game and is the
  source of truth for the physics. See [CREDITS.md](CREDITS.md) and
  [docs/MODEL-FIDELITY.md](docs/MODEL-FIDELITY.md).
- **Live:** <https://nuke.absolutejoker.ca>

## Repository layout

| Folder | What's in it |
|---|---|
| `game/` | The game itself — `game/small-nukem.html`, the single self-contained HTML file. This is the only file a player needs. |
| `android/` | The Android wrapper project (Gradle) that packages the game as an APK. |
| `tests/` | `tests/value-checks.mjs` — the fidelity test suite asserting Samira's model values and behaviours — plus the per-patch test scripts (`patch-tests*.py`). |
| `docs/` | Project documentation: `docs/spec.md` (game specification), `docs/DECISIONS.md` (binding design decisions), `docs/MODEL-FIDELITY.md` (fidelity record), `docs/WIRING-MANIFEST.md` (asset wiring), `docs/research/` (research notes), and `docs/ops.md` (operations / publishing). |
| `tools/` | Project tooling, including `tools/publish.sh`, the publish script. |
| `media/` | Game and project media: `media/chief-voice/` (the Chief's voice lines) and `media/marketing/` (posters, screenshots, social and video assets, store listing, press kit). |
| `provenance/` | Provenance records for the game's source material — where the model, artwork and assets came from. |

Top-level files: this `README.md`, [CREDITS.md](CREDITS.md) (credits and
ownership), and [AGENTS.md](AGENTS.md) (instructions for AI coding agents).

## Run the tests

The fidelity suite extracts Samira's BWR model from the game file and asserts
her constants, start state, trips, alarms and behaviours — it fails if the
game drifts from her model.

Requirements: Node.js. From the repository root:

```sh
node tests/value-checks.mjs
```

Exit code `0` means all checks pass; failures are printed as `FAIL` lines with
details. Run this before publishing any change to the game.

## Build the APK

The Android app is a thin wrapper around the same game file, built with the
Gradle wrapper in `android/`.

Requirements: a JDK and the Android SDK installed on your machine.

From the `android/` folder:

**macOS / Linux**

```sh
cd android
./gradlew assembleDebug
```

**Windows**

```bat
cd android
gradlew.bat assembleDebug
```

The debug APK is written under `android/app/build/outputs/apk/`.

> **Note:** `local.properties` (which sets `sdk.dir` to your local Android SDK
> path) is machine-local configuration. It is **not** in this repository —
> create it in `android/` on your own machine, or let Android Studio generate
> it.

## How a publish works

In short:

1. Run the tests (above) — a publish never ships on a failing suite.
2. Publish the current build of the game file: it is copied as `index.html`
   (atomically — written to a temporary file, then moved into place, so
   visitors never catch a half-copied file) to the publish location served at
   <https://nuke.absolutejoker.ca>. `tools/publish.sh` performs this step.
3. Verify the live site is serving the new build (check the version/cache —
   a stale cached copy is not a successful publish).
4. If an Android release is needed, rebuild the APK as described above.

The authoritative, step-by-step procedure — hosts, paths, verification and
rollback — is in **[docs/ops.md](docs/ops.md)**. Follow that document, not
this summary, when actually publishing.

## Credits

See [CREDITS.md](CREDITS.md).

## For AI coding agents

If you are an AI coding agent working in this repository, start at
[AGENTS.md](AGENTS.md) — read it before making changes. It points you to the
binding decisions, the model-fidelity rules (Samira's physics block is not to
be altered), and the test and publish procedures.
