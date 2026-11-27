# Small Nukem — Milestone 10: Android app

**Date:** Nov 25, 2026. **Mandate:** Kevin — build the Android version using his Mac's Android SDK, research SDK leverage first, Padma decides, keep it moving.
**Prior research:** `~/workspace/small-nukem-android-research/report.md` (Nov 25) — this document builds on it; nothing below re-opens its settled questions.

## What the gated web build actually exposes (measured, Nov 25)

- The live web build is a **single self-contained HTML file** (397,685 B, MD5 `fcb0a915a8cc852cbc784218d2d370a0`): no external `src=`/`href=` references, no remote `url()` loads. It bundles perfectly as one WebView asset — fully offline by construction.
- Its entire native-bridge surface is **one call**: `snBridge(name)` feature-detects `window.SNAndroid` and calls `SNAndroid.haptic(name)` for exactly five names — `scram`, `detent`, `alarmPulse`, `uiTap`, `achievement` — falling back to `navigator.vibrate()` patterns when the bridge is absent.
- The gated build has **no shell→game event dispatcher** (no `SNBridgeEvent`), no `storeRead` caller, no share caller. The gated HTML must ship byte-identical (its MD5 and Samira's model-block MD5 `a3385f4f…` are the gate), so those research items cannot be consumed by this build no matter what the shell offers.

## Architecture decision

**Hand-rolled native WebView shell** (single Java Activity, framework APIs only — no AndroidX, no Capacitor, no TWA), Gradle + AGP 8.11.1 (both already in Kevin's Gradle cache), `compileSdk/targetSdk 36`, `minSdk 26`, universal APK signed with the local debug key for sideloading on the Pixel 10.

Why not the alternatives:
- **TWA (Trusted Web Activity):** requires the game hosted at a public HTTPS origin + Digital Asset Links, and the content is fetched over the network — contradicts the offline requirement and adds a hosting dependency for a game that is one local file.
- **Capacitor:** a Node/npm toolchain and a plugin runtime wrapped around the same WebView, for a bridge surface of exactly one method. Real cost (toolchain, APK size, another dependency tree to keep alive), zero measured gain here.
- **Native rewrite / game engine port:** forks Samira's model and the whole gated game. Explicitly out of scope — the shell hosts the *same* gated build.

The shell's job is to disappear: load `file:///android_asset/index.html`, give it the whole screen, keep it awake, and make its one bridge call feel physical.

## SDK features — disposition

**In M10 v1 (consumable by the gated build today):**
1. **Immersive fullscreen** — `WindowInsetsController` hides system bars (transient-by-swipe), `layoutInDisplayCutoutMode = SHORT_EDGES` so the plant uses the full panel; the game's existing CSS safe-area handling keeps HUD elements off the Pixel 10 cutout.
2. **Landscape lock** — `sensorLandscape` in the manifest (either landscape direction, never portrait).
3. **Wake lock** — `FLAG_KEEP_SCREEN_ON` while the activity is foreground; no `WAKE_LOCK` permission needed. A game whose core loop is watching gauges must not dim mid-startup.
4. **Offline asset bundle** — the gated HTML ships in `assets/`; the app declares **no `INTERNET` permission at all**, so offline is guaranteed by the platform, not by discipline.
5. **Native haptics** — `SNAndroid.haptic(name)` maps the game's five names to amplitude-shaped `VibrationEffect`s (predefined `EFFECT_TICK`/`EFFECT_CLICK` where apt, amplitude waveforms where the device supports them, detent throttled to ≥40 ms). The SCRAM gets a heavy two-stage thump `navigator.vibrate()` cannot express.
6. **High-refresh request** — the shell sets the window's preferred display mode to the highest refresh rate at the current resolution (Pixel 10: 120 Hz). A request, never an assumption; the system still owns thermal/battery overrides.
7. **Predictive-back handling** — at targetSdk 36 `onBackPressed()` is dead; the shell registers an `OnBackInvokedCallback` and sends the task to the background instead of destroying the activity mid-shift (the game exposes no back hook, so exiting is the only alternative — backgrounding is strictly better and matches the Home-button behaviour).
8. **Adaptive icon** — vector gauge icon (background + foreground layers, API 26+), tints correctly with themed icons; no raster favicon-in-a-box.
9. **App shortcuts** — long-press: "Demo Mode" and "Launch" via a `smallnukem://start?mode=…` deep link the shell forwards as the game's `?mode=` query (the game reads query params at boot).

**Deferred, with reasons (all need a game-side consumer the gated build doesn't have):**
- Shell→game events (`thermal`, `audioFocus`, `pause/resume` beyond lifecycle, Game Mode hint): no dispatcher exists in the gated build; WebView lifecycle already delivers `visibilitychange` on backgrounding, which is the seam the game does use.
- Bridge-backed saves (`storeWrite/storeRead`): no game-side caller; DOM storage is enabled and persists in app-private data. Revisit when a web build routes saves through the bridge.
- Share sheet, controller rumble (`padRumble`): no game-side caller in the gated build.
- Native low-latency audio (AAudio/Oboe), Play Games Services, widgets, notifications: **skipped** per the prior research — small/unreliable gain, Console-registration cost, or no honest in-game moment. Unchanged.

## Build / sign / install facts

- Toolchain on the Mac: Android Studio JBR (JAVA_HOME), SDK `~/Library/Android/sdk`, build-tools 36.0.0, platform android-36, Gradle 8.14.3 (cached), AGP 8.11.1 (cached).
- Signing: release build signed with the **local debug key** (`~/.android/debug.keystore`, AGP's built-in debug signing config) — appropriate for a sideloaded personal build; no Keychain keystore touched.
- Package: `com.smallnukem.app`, label **Small Nukem**. No "Samira" anywhere user-facing.
