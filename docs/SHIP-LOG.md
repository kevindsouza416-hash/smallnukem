# Small Nukem — Ship Log (Ships #17–#25)

All ships: Nov 26, 2026 (EST), live site https://nuke.absolutejoker.ca/ — playtests only on the live URL.
Primary records: `~/workspace/goals/small-nukem-bwrx-300-startup-game/GOAL.md` (per-ship entries),
`~/workspace/sn-ship24/docs24-shiplog-draft.md` + `docs24-shiplog-filled.md` (ship #24),
and the ship #24 lane note on the Mac (`~/ObsidianVault/Documents/Coordination/lane-small-nukem-fixes-ship24.md`).

## CHECKSUMS — audit branch build (ship #25, NOT published)

- **Branch build MD5:** `fad27ff3ed0fa1391c14029817466be5` — 1,096,485 B (`claude/festive-pasteur-l8clmg`; not merged, not published, no APK)
- **Samira physics block MD5 on this branch:** `be5a0982bf00617bda59847174d69474` (ONE authorised deviation, patch165 — see `docs/MODEL-FIDELITY.md`; `main` / ship #24 stay `a3385f4f…`)
- **Suite:** `node tests/value-checks.mjs` 589 passed / 0 failed; `python3 tools/check-scripts.py` 3 blocks OK; `node tests/controls-e2e.mjs` (opt-in browser suite, see `docs/AUDIT-2026-11-27.md`)

## CHECKSUMS — published build (ship #24)

- **Current build MD5:** `6dc80315b5ef9fb69d537227c3411ab0`
- **Current build size:** 1,082,451 B
- **Samira physics block MD5:** `a3385f4f29207be552c4a1c48b620d9b` (byte-identical in every ship below; asserted before/after every patch)
- **APK:** `SmallNukem-1.0.apk`, 155,693,121 B, built Nov 26 21:55 EST, attached to Release ship-24
  - APK MD5 (per GOAL.md ship #24 entry): `31c3daa457d1268d68abfdf723e09769`; bundled `assets/index.html` MD5 = build MD5 `6dc80315b5ef9fb69d537227c3411ab0`

## Summary table

| Ship | Date (Nov 26, 2026) | MD5 | Size (B) | Suite |
|---|---|---|---|---|
| #17 | ~11:14 EST | `02f6f7c4f9e73234f99fafa2576e44ee` | 1,013,361 | 381/381 |
| #18 | ~12:50 EST | `54241e05469da6cf98467b0de7f84d58` | 1,014,023 | 386/386 |
| #19 | ~13:00–13:07 EST | `4048d5b8c44586837df5c03d485cca6b` | 1,021,015 | 395/395 |
| #20 | ~15:04–15:21 EST | `243e73fd93b820669efa244998ee44f8` | 1,023,991 | 413/413 |
| #21 | ~15:24–15:43 EST | `c2b98382c59acfb58df538185992cab6` | 1,033,722 | 433/433 |
| #22 | ~15:47 EST | `c9cc0ae75715fa815f3a6c5d7d92b5fb` | 1,037,100 | 443/443 |
| #23 | ~19:28–19:30 EST | `b7c6970f611dca5f73f4ba5a5d06bee4` | 1,052,106 | 443/443 |
| #24 | ~21:55–21:59 EST | `6dc80315b5ef9fb69d537227c3411ab0` | 1,082,451 | 538/538 |
| #25 (branch, unpublished) | Nov 27, 2026 | `fad27ff3ed0fa1391c14029817466be5` | 1,096,485 | 589/589 |

---

## SHIP #17 — Live-call consolidation, patches 126–140 (~11:14 EST)

Kevin's live-call consolidation: "fold everything into the current build."

- patch126 steam sprites (four seeded variants, radial envelope — fixes boxy steam); patch127 RPV-01 trefoil made a flat decal; patch128/128b trackpad parity; patch129 panel fade (450 ms) at cinematic/step-completion; patch130 (+b/c/d) game-end media stop (`SN_STOP_ALL_MEDIA()`); patch131 main menu rebuilt as Concept 1 "The Console"; patch132/132b camera R1–R11 (dead zone 30% W / 25% H, one 6/s rate, time-based lookahead, zoom as a state machine, Reduce Camera Motion); patch133/133b plain white panel labels; patch134 AUDIO / SFX split toggles; patch135 ghost-ladder fix (`snSyncPlateLadder()`); patch136 unit pop-ups — dwell >3 s only, measured-text width; patch137 scorecard = Concept 2 "The Shift Log"; patch138 buttons rule (long-press Chief-summon removed; help only from SHOW); patch139 menu fit; patch140 stepBar gaps.
- **Gates:** build 1,013,361 B, MD5 `02f6f7c4f9e73234f99fafa2576e44ee`, suites 381/381, all 3 script blocks `node --check` clean, physics block MD5 `a3385f4f29207be552c4a1c48b620d9b` re-verified.
- **Published:** origin (127.0.0.1:8931) and https://nuke.absolutejoker.ca both serve MD5 = build MD5.
- **APK:** rebuilt, bundled `index.html` MD5 = build MD5; installed on Pixel 10, lastUpdateTime 2026-11-26 11:14:03, force-stop + relaunch verified.

## SHIP #18 — RPV local panel v2 wired, patch141 (~12:50 EST)

Kevin approved the v2 samples ~12:44 EST ("RPV approved").

- RPV local panel face is now the approved v2 render in two state faces — cold (`plates/panel_rpv.webp`) and at-power (`plates/panel_rpv_hot.webp`), 234×512 WebP q84. New `snPanelImg()`: at-power face once `physics.power_pct >= 1`, cold below; both the world cabinet face and the check_readings sheet/pop-up backing go through it.
- **Gates:** build 1,014,023 B, MD5 `54241e05469da6cf98467b0de7f84d58`; `node --check` clean on all 3 script blocks; suites 386/386 (381 + 5 patch141 locks); physics MD5 verified before, after, and independently. Pre-patch backup `small-nukem.html.bak-pre-patch141` (= ship #17).
- **Published:** publish.sh 12:50 EST — build file, publish index, origin and live URL all MD5 `54241e05…`; plates serve from origin (cold `24813e35…` / hot `c349cd6f…`).
- **APK:** rebuilt, 155,918,257 B, bundled `assets/index.html` MD5 = build MD5; installed on Pixel 10, lastUpdateTime 2026-11-26 12:56:09 EST.

## SHIP #19 — Menu + scorecard rebuilt on Kevin's exact sample artwork, patch142 (~13:00–13:07 EST)

Provenance verdict proved ship #17's menu/scorecard were code-drawn approximations using neither picked sample; Kevin approved the rebuild ~12:48 EST ("Go ahead"). Method: painted artwork as the background plate, live text/controls laid over it; nothing live flattened into an image. Base = ship #18 (`54241e05…`).

- Menu (Concept 1 "The Console"): the sample PNG itself as `menu-console.webp` (295,826 B, WebP q88) background of a `.menu-stage` wrapper; code-drawn patch131 visuals display:none (DOM/ids/handlers preserved); transparent hit areas on the painted tiles; five live settings toggles ride on a matching dark plate over the sample's baked static settings strip (region conflict resolved openly — five live segments cannot fit the sample's one line).
- Scorecard (Concept 2 "The Shift Log"): the sample's text-free painted base (`scorecard-shiftlog.webp`, 145,594 B); live elements at the compositor's exact coordinates/sizes/ink colour; RESTART/checkpoint buttons below the clipboard on the dark surround.
- **Gates:** build 1,021,015 B, MD5 `4048d5b8c44586837df5c03d485cca6b`; `node --check` clean; suites 395/395 (386 + 9 patch142 locks); physics MD5 asserted before and after.
- **Published:** publish index, origin and live URL all serve MD5 `4048d5b8…`.
- **APK:** rebuilt, 156,214,285 B, bundled MD5 = build MD5; installed on Pixel 10, lastUpdateTime 2026-11-26 13:07:27 EST.

## SHIP #20 — Fix ship: D1, D2, step-count, attract 1×, D5, SFX-muted-on-load, patches 144+145 (~15:04–15:21 EST)

Base = ship #19 (`4048d5b8…`).

1. **D1** — WASD panel-mode A/D hold now synthesizes the operate edge (`_opEdge` latch) so tap-class panel actions fire on hold.
2. **D2** — Fluke anchored to his standing deck via `WORLD_H` / `snDeckAnchor()` / `snDeckReseat()`, so a layout resize no longer changes his floor.
3. **Step-count** — `advanceProcedure(PROCEDURE_STEPS.length)` before endGame at both completion branches; a perfect run now totals 750, not 650.
4. **Attract mode at 1×** — `paceTick` returns 1 while `DEMO.active`.
5. **D5** — `#procedurePanel` moved to the pop-up layer (z-index 900); an open pop-up is front-most.
6. **SFX muted on load (patch145)** — `SN_AUDIO.sfx = false;` forced at boot after the persisted read; AUDIO keeps its persisted read; the SFX toggle still unmutes in-session.

- **Gates:** MD5 `243e73fd93b820669efa244998ee44f8`, 1,023,991 B; `node --check` clean; suites 413/413; physics MD5 asserted before and after by both patches.
- **Published:** publish.sh 15:04:45 EST — publish index, origin and live URL all serve MD5 `243e73fd…`, HTTP 200.
- **Browser verifications:** all run, zero deferred — D1, D2, step-count (end-to-end, 5/5 steps, total 750, PASSED), attract 1×, D5, and SFX-on-load all PASS.
- **APK:** rebuilt, 155,594,399 B, MD5 `74ec56a54aca9a13cc0183a9c26cdb32`, bundled MD5 = build MD5; installed on Pixel 10, lastUpdateTime 2026-11-26 15:20:53 EST.

## SHIP #21 — Realistic steam: SN_GL mode-5 noise erosion + jet rebuild, patch143 (~15:24–15:43 EST)

Base = ship #20 (`243e73fd…`). Governing spec: WebGL2 steam research report §5/§8 + Kevin's shape rules (Nov 26 ~13:33–13:34).

- SN_GL fragment shader gains mode 5: two-scale tileable FBM noise erodes the steam sprite with domain warp and a life-rising erosion threshold, so silhouettes boil rough and dissolve downstream instead of fading as discs. Jet spawner rebuilt to the point-source rule: spawns 2–4.5 units at the vent, ±7° cone, exit 300–460 u/s, entrainment growth, pulsing emission; native-2D fallback keeps the plain patch126 sprites.
- **Gates:** MD5 `c2b98382c59acfb58df538185992cab6`, 1,033,722 B; `node --check` clean; suites 433/433 (413 + 20 patch143 locks); physics MD5 asserted before/after and independently re-verified.
- **Published:** publish.sh 15:25:06 EST; live URL verified HTTP 200, MD5 `c2b98382…`.
- **APK:** rebuilt, 155,598,643 B, MD5 `b9a3a93cdd87813bc44b3badfe48d5ea`, bundled MD5 = build MD5; installed on Pixel 10, lastUpdateTime 2026-11-26 15:43:13 EST.
- **Device note:** mode 5 live on device; same-session A/B showed no FPS delta from the shader (16.2 on vs 14.3 off) — the ~15 fps session level was a device-state confound (Google Photos backup / swap), not patch143. The 240 ambient cap stays.

## SHIP #22 — Edge/fence: sample-2 hatch + waist-high fence asset, patch146 (~15:47 EST; close-out verified ~15:50–16:02 EST)

Base = ship #21 (`c2b98382…`). Spec: Kevin's edge-marker pick (Nov 26 ~13:28–13:44). Note: GOAL.md carries two ship #22 entries (the close-out verification entry and the patch entry); they describe the same build and are merged here.

- `plates/fence_end.webp` + `plates/hatch_strip.webp` registered in SN_PLATES (Kevin's exact sample-2 safety-orange/near-black 45° swatch). Sample-2 hatch replaces both yellow elements (patch98 ledge rail and `drawWarningStripe` stripe; fallback paints the measured swatch colours #f27f32 / #1d1d1d). `snDrawFenceEnds()` draws a physical fence at railed deck ends at `SN_FENCE_H = 32` (waist of Fluke's 64). The Chief gets the same rail stop (`snChiefRailClamp`); the patch98 collision clamp itself is untouched.
- **Gates:** MD5 `c9cc0ae75715fa815f3a6c5d7d92b5fb`, 1,037,100 B; `node --check` clean; suites 443/443 (433 + 10 patch146 locks). Close-out repair was test-file only (one unescaped apostrophe in a patch146 lock); game file untouched, MD5 re-verified. Physics MD5 independently re-verified.
- **Published:** publish.sh 15:49:16 EST; live file, publish index and live URL all serve MD5 `c9cc0ae7…`, HTTP 200; both plates live (fence 62,628 B, hatch 14,906 B).
- **Proofs:** player fence stop pinned at exactly x=774, Chief at exactly 787, open-end pass unimpeded, completability run 5/5 steps, total 750, PASSED.
- **APK:** rebuilt, 155,677,601 B, MD5 `0e7e4310d9cc39f9812d30eb507715aa`, bundled MD5 = build MD5; installed on Pixel 10 (lastUpdateTime recorded as 2026-11-26 15:53:39 EST in the patch entry and 16:02:15 EST in the close-out entry — see gap report).

## SHIP #23 — iPhone fix: layout stack F1–F11 + C3/D2/D2b/D3 (~19:28–19:30 EST, publish.sh 19:28:50 EST)

Trigger — Samira D'Souza's iPhone report, 2026-11-26 15:58:41 EST: the game was "kinda smashed on iPhone" so she couldn't maneuver or see all the features. Publish signal: the coordinator's explicit ship #23 publish message, Thu 2026-11-26 19:27:57 EST, naming candidate `staging-ship23-v3.html`. Base = ship #22 (`c9cc0ae75715fa815f3a6c5d7d92b5fb`, 1,037,100 B) → ship #23 (`b7c6970f611dca5f73f4ba5a5d06bee4`, 1,052,106 B). Composition order F5 → F1 → F2 → F2b → F3 → F4 → F6 → F7 → F8 → F9, then C3 + D2 + D3, then F10 → D2b → F11.

- F1 zoom fit (`snFitZ`, 0.5 floor); F2/F2b portrait chrome stack compaction; F3 sheet height min(440, 0.62·H); F4 touch cluster split to both bottom corners on narrow screens; F5 step row 19→15 px nowrap, mini-gauges two rows, map HUD 47vw→40vw; F6 dwell info plate clamped in view, plates widened; F7 top bar 48 px, settings buttons 40 px; F8 landscape stage rotated to full width; F9 label repositioning; F10 landscape sheet guards; F11 annunciator tile labels shrink-to-fit; C3/D2/D2b/D3 reconciliations (44 px touch floors, landscape settings strip).
- **Gates (Mac):** `python3 check-scripts.py` — 3 script blocks, all OK; `node tests/value-checks.mjs` — 443 passed, 0 failed, exit 0; physics MD5 `a3385f4f29207be552c4a1c48b620d9b` unchanged, verified on the v3 candidate and asserted inside every patch step. 5 EXPECTED-UPDATE assertion swaps (lines 242, 399, 582, 679, 704).
- **Published:** publish.sh — "published 1052106 bytes at Thu Nov 26 19:28:50 EST 2026"; Mac build file, publish index and origin all agree at `b7c6970f…`; public URL verified from the VM: HTTP 200, 1,052,106 B, same MD5. No server restart.
- **CDP smoke (live URL only):** via holder ws://127.0.0.1:60942, work window 450531917, 1280×800 DSF 1 — title screen renders, LEVEL 1/2/3 + DEMO + 3 DRILL buttons visible, zero script errors; screenshot `~/workspace/small-nukem-iphone/shots/ship23-desktop-1280x800-menu.png` (474,003 B). Tab closed, override cleared.
- **Residuals carried open at ship time:** R3 sheet residual; map-HUD cap; F10 full-height landscape sheet trade; C6 rotated-stage landscape eyeball; R4 W<360 overlap. APK rebuild/install was a separate later step, not part of this web publish.

## SHIP #24 — Controls/input stack, patches 148–160 (patch150 not used) (~21:55–21:59 EST, publish.sh 21:57:03 EST)

Trigger — Kevin's order on the live call ~21:05 EST, Nov 26 2026: "Can you fix the issues?" — the proven defects from the ship #23 iPhone / Pixel 3 XL / Level 3 evidence, plus his controls-research acceptance ~21:20 EST and his firsthand camera and keyboard reports. Publish signal: the coordinator's explicit ship #24 integrator tasking, Thu 2026-11-26 21:54:13 EST, naming the hard gate that the Mac final MD5 must equal `6dc80315b5ef9fb69d537227c3411ab0` (1,082,451 B), independently composed twice on the VM (RECOMP + RECOMPV, cmp identical). Base = ship #23 (`b7c6970f611dca5f73f4ba5a5d06bee4`, 1,052,106 B) → ship #24 (`6dc80315b5ef9fb69d537227c3411ab0`, 1,082,451 B; delta +30,345 B / +2.88%).

**Composition (Mac-applied, running-MD5 pin at every step, each step reproduced exactly):**
148 → `46a9452ef922ca0406756ecc67c4dc2b` → 149 → `d98b85ae9382494914bf53a0ae5f40c2` → 151 → `eb920ceed5b62d54f2e135a3e3ffbb13` → 152 → `6fcc7bb1bcf6511eb6bdc3f3a733ac16` → 153 → `15ba6b4323d7ace4652f3ce57d915214` → 154 → `702e9dd5b490f0f600420163d0c54496` → 155 (amendment #2) → `1d09e47390556c337742120bcacfdd90` → 156 → `cb22c934bfccb83625ff8c53f5819595` → 157 → `b15c7730f10ba5d6e3c3b6c709fd0fcc` → 158 (dedup variant — Edit 1 removed, 156 already inserted the identical `INPUT.interact/interactPulse` literal; edits 2–4 only) → `ab96c509baf469d22d7999e58e8671aa` → 159 → `98792c09a7a0e21ba5b27d6123967319` → 160 (amended guard — double-apply assert on `steps160`, not the bare substring `patch160`) → `6dc80315b5ef9fb69d537227c3411ab0`. Patch150 (SHOW) was reserved and NOT used.

**What changed (one line per patch):**
- patch148 dwell wiring — `SN_TOUCH.openPop` now fires on dwell (latched per unit via `_openedKey`); before this patch no dwell→sheet code path existed at all.
- patch149 text supersample — canvas glyphs rasterize at 2× supersample (`GLYPH_SS = 2`) in the SN_GL shim, fixing blocky in-canvas text at XL resolution.
- patch151 hold sync — `syncPointerInput()` called at press time in the `tRole` branch of `pointerdown` and in `snxReplayDown()`, so a stationary hold latches `INPUT.left/right` immediately.
- patch152 camera refit+clamp — approach state only: span-overflow refit + goal clamp, so Fluke + target panel stay in frame while walking away/reversing. (R152 correction: the clamp is NOT inert in REDUCED — it can bind by ≤ ~0.30 world units toward Fluke on far normal approaches; no REDUCED setting changed.)
- patch153 keyboard dual/latch — arrows + WASD live together in every `SN_WASD` mode; panel-mode arrows adjust only while a lever is engaged; press latch mirrors the wheel `padHold` 170 ms idiom; `preventDefault` on arrows/space (skipped under modifiers; Space no longer natively activates a DOM-focused HUD button — accepted, R153).
- patch154 dwell rebuild 1.2 s — 1,200 ms accumulated presence, ~200 ms onset delay with a visible radial progress ring, pause-not-reset; supersedes patch136's 3 s dwell-only rule for the sheet (the info plate keeps its >3 s semantics).
- patch155 freeze + amendments #1/#2 — freeze-while-adjusting for the Level 3 grid emergency (Kevin's ~21:20 EST decision): `updatePhysics` gated while a control is adjusted under L3 + grid + !scram + (`ev.tu` 1|2) + phase 'playing'; `elapsedSec` pauses; freeze-assisted runs are stamped FREEZE-ASSISTED in the Shift Log, points unchanged. Amendment #2: the freeze record is carried by the checkpoint (`snxSnapshot` captures `fz:{used,heldSec}`; `snxRestore` applies it value-aware); the flat reset occurs exactly once, in `snxResetRun()`.
- patch156 plumbing armour — SAFE SUBSET only: CSS `-webkit-touch-callout: none` / `user-select: none` armour, `#sheetCanvas` touch-action, `INPUT.interact`/`interactPulse` fields (sync/merge bodies byte-untouched), AudioContext resume at head of `pointerdown`, gesture guard widened. The named-action refactor is deferred to the remap ship.
- patch157 segmented zone — separate circular hold-buttons replaced by one segmented touch movement zone (same `'ovl:<id>'` role strings, 12 px slide dead strip); patch151's lines asserted byte-identical pre/post.
- patch158 Interact primary + guard — Interact-press is the primary panel-open path: patch90's 2 s hide of the `#actionBtn` prompt exempts mode `'open'` + `player.interactTarget` (opacity settles at 0.9), `snActionPress` sets `INPUT.interactPulse`, and the guard stops an Interact-opened sheet from dwell-re-opening once closed. (`INPUT.interactPulse` is set but not yet consumed — remap-ship scope.)
- patch159 snap/presets/APG — lever/valve detent snap on release/step only (rod [0,20,39,58,100], load [0,95,100], bypass/leak end-stops), one preset chip per analog panel writing `pop.target` only, keyboard APG wired to patch153's engagement expression. No commit button added; no "CUT TO 13%" chip — reserved as Kevin's pick, absence-locked.
- patch160 wheel fine — trackpad wheel-over-lever fine adjust: notch accumulation 48→40 px (deltaMode normalised), fine ±1% steps via `SN_PADSTEP_FINE` (patch159's unconditional entry at L7115 wins over patch160's guarded definition at L7072), momentum clamp ≤2 steps/event.

**Reviews:** every patch independently reviewed, all APPROVE or APPROVE-WITH-NOTES (148 B2, 149 B6, 151 B7, 152 R152, 153 R153 adversarial 30/30, 154 R154 sim 20/20, 155 R155 + amendment-#2 review DELTA2 APPROVED harness 27/27, 156 R156, 157 R157 adversarial 25/25, 158 R158, 159 R159, 160 R160 adversarial 17/17).

**Gates (Mac, after the swap):** `python3 check-scripts.py small-nukem.html` — 3 script blocks, all OK (52,993 / 956,645 / 936 chars), exit 0. `node tests/value-checks.mjs` — **538 passed, 0 failed**, exit 0 (443 pristine + 95 new locks; final Mac suite MD5 `e3fef54dc51f09fe4593aeb4b03c01ca`). Physics block MD5 `a3385f4f29207be552c4a1c48b620d9b` unchanged, asserted before/after every patch and independently re-extracted on the final file. 6 EXPECTED-UPDATE assertion swaps + 2 new locks (suite lines 472, 595, 850, 852, 854, 904–906 — verbatim pairs in the GOAL.md ship #24 entry).

**Pre-publish backups (Mac, all MD5-verified before the swap):** `small-nukem.html.bak-pre-ship24` = `b7c6970f…` (1,052,106 B); `tests/value-checks.mjs.bak-pre-ship24` = `5e5214fae9cb2df0b6b4ca377f78ac85`; `~/small-nukem-publish/index.html.bak-pre-ship24` = `b7c6970f…`; ship #23 APK preserved as `SmallNukem-1.0.apk.bak-pre-ship24` = `b669395c6880c0ed7b17d2082ad5b076` (155,683,229 B). Rollback set kept intact, not deleted.

**Published:** publish.sh — "published 1082451 bytes at Thu Nov 26 21:57:03 EST 2026". Four-way MD5 agreement at `6dc80315b5ef9fb69d537227c3411ab0`: Mac build file, `~/small-nukem-publish/index.html`, origin http://127.0.0.1:8931/, and the public URL https://nuke.absolutejoker.ca/ (HTTP 200, 1,082,451 B, verified from the VM). No server restart. (Confirmed independently in the Mac lane note, 22:06 EST entry.)

**APK:** rebuilt per procedure (manual asset sync, `JAVA_HOME` mandatory, `assembleRelease` — BUILD SUCCESSFUL; ship copy `~/small-nukem/SmallNukem-1.0.apk`): 155,693,121 B, MD5 `31c3daa457d1268d68abfdf723e09769`; bundled `assets/index.html` MD5 = `6dc80315b5ef9fb69d537227c3411ab0`. Installed on the Pixel 3 XL (192.168.2.37:5555 via Mac adb, install -r → Success): lastUpdateTime 2026-11-26 21:58:54, advanced from ship #23's 2026-11-26 19:32:13; versionName 1.0 / versionCode 1 unchanged; relaunched, MainActivity top-resumed. XL never rebooted.

**Carried open after ship #24:** CDP desktop smoke + Wave D live verification still owed by the coordinator's lanes at log time (the integrator had no browser access and stated so plainly); patch150 (SHOW) ruling still Kevin's — 150 stays unused, never reused; general two-stage commit deferred; named-action refactor deferred to the remap ship. Post-publish snap triage (lane note, 22:10 EST): 8 of 8 findings pre-existing in ship #23, zero introduced by ship #24, none blocks the ship — all queued for ship #25. The post-publish Claude Opus inspection was HELD at Kevin's word (~22:02 EST) and had not run at log time.

## SHIP #25 — SHOW walkthrough, cinematics toggle, Chief icon (+ the 2026-11-27 audit fixes), patches 161–173 (branch `claude/festive-pasteur-l8clmg`, NOT published)

Trigger — Kevin's rulings of Nov 26 ~22:14–22:19 EST (AGENTS.md §10), delivered on the audit branch on Nov 27, 2026 together with the controls audit. Base = ship #24 (`6dc80315b5ef9fb69d537227c3411ab0`, 1,082,451 B) → branch build `fad27ff3ed0fa1391c14029817466be5` (1,096,485 B; +14,034 B / +1.30%). Everything is a numbered patch script in `patches/` (the directory did not exist in the repo; `patches/_patchlib.py` is the shared helper) with a `tests/patch-tests<N>.py` companion; the whole chain was replayed from the ship #24 file and reproduced the branch file byte for byte (patches 161–165, before 166+ were added).

**Composition (running-MD5 pin):** 161 → `55eeced51c29d0ef3a29abd155a34888` → 162 → `140e2743957dd0c701b0a5847e45dcb2` → 163 → `b64de3302821b131bad5d6c0fe5c9946` → 164 → `bbf6e1d6b1301e5313c3f3cba9bdabd9` → **165 (PHYSICS)** → `4cf05a14376e00f8519b158268731cf0` → 166 → `ef30007720fc5681aa407d21bf3fab62` → 167 → `473c83983bdb2e0c02d0da3c20bb926d` → 168 → `39c82c2b9bb9290d59b18a412573d180` → 169 → `71cf907d2b86584f50ad4f82468b66bb` → 170 → `8be106263d5586f9c09a8336ae36176f` → **171** → `a0d528ac2db01f982ed547936c85aa96` → **172** → `1ad66a44360264126c068843d72e98b8` → **173** → `fad27ff3ed0fa1391c14029817466be5`.

**The three approved Ship #25 changes (own commits):**
- **patch171 — SHOW walkthrough.** SHOW starts the Chief's demo of whatever remains of the CURRENT level (the takeover driver: from the current state, no restart); when the level completes the game advances on its own to the next level and demos it, through all three. ANY keyboard / mouse / trackpad-wheel / touch / gamepad input — or a second SHOW press — stops it at once (0.5 s start grace; key repeat and bare modifiers ignored). Steps it completes are DEMO-ASSISTED (+50) via `ASSIST.assisted` (now cleared per run — it never was). 30 s cap, pacing layer, demo mechanics untouched. Intermediate levels skip the score card; the final level scores normally. Two patch99 locks rewritten in place.
- **patch172 — cinematics toggle.** `CINE: ON/OFF` button immediately after AUDIO, sharing its CSS, mobile sizes and the keyboard HUD ring; OFF drops every cinematic offer (no video, no audio) and closes a running one; default ON; persisted as `sn.cine` like `sn.audio`. Four older locks rewritten in place.
- **patch173 — Chief icon.** Image-only, ~30% larger (24→31 px, phone 20→26 px, bitmap 40 px); frame mirrors the SHOW follow state; no press-and-hold. Top-bar buttons tightened so the extra button leaves caption room.

**Audit fixes carried in the same ship (own commits, details in `docs/AUDIT-2026-11-27.md`):** 161 input hygiene (release input on blur/pagehide/hidden, key-skippable splash, primary-button-only mouse, allocation-free mergeInput); 162 manual SCRAM restored (hold X / gamepad Back, ARI-panel hold button, MANUAL SCRAM overlay); 163 gamepad D-pad climb + no Space-jump while operating; 164 landscape-phone Chief overlay; **165 PHYSICS — dispatch target restored + recovery grace after the Level-3 grid emergency**; 166 title-screen Enter/Space on focused buttons + dead-code removal; 167 double-tap map crash (`openMap` undefined); 168 fine ±1% step could not leave a detent; 169/170 gauge deck vs control sheet.

**Gates (Linux, branch):** `python3 tools/check-scripts.py game/small-nukem.html` — 3 blocks OK; `node tests/value-checks.mjs` — **589 passed, 0 failed** (538 pristine + 51 new locks; superseded locks rewritten in place: patch99 ×2 [SHOW one-step demo], patch145 boot [SN_AUDIO declaration], patch85/112/134 ×3 [AUDIO rule, HUD ring, SN_AUDIO], patch ship24 padStepFine ×1); physics MD5 `be5a0982…` locked in the suite.
**Not done / owed:** not published, no APK, no tag, no GitHub Release (the task forbade publishing/merging); Kevin to confirm or revert the patch165 physics deviation against Decision 9; full real-device pass of the walkthrough; Antigravity review still owed.
