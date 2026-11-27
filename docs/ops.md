# Small Nukem — Operations (serving, publishing, verification)

How the shipped build reaches players, and how a publish is verified.
The live build is a single HTML file: `~/small-nukem/small-nukem.html` on
Kevin's Mac (`/Users/kdsouza/small-nukem/small-nukem.html`).

## Serving chain

```
build file  ~/small-nukem/small-nukem.html          (Mac)
    │  tools/publish.sh — atomic copy (see below)
    ▼
publish folder  ~/small-nukem-publish/              (Mac)
    index.html + sibling assets (plates/ voice/ cine/ chief-tv/ sprites/
    menu-console.webp, scorecard-shiftlog.webp, splash-control-room.mp4)
    │  python3 -m http.server 8931 --bind 127.0.0.1 --directory ~/small-nukem-publish
    │  LaunchAgent com.padma.small-nukem-site (RunAtLoad + KeepAlive,
    │  log ~/small-nukem-publish/server.log)
    ▼
origin  http://127.0.0.1:8931/                       (Mac, loopback only)
    │  Caddy reverse proxy fronts the origin
    │  (live responses carry `Via: 1.0 Caddy` and
    │   `Server: SimpleHTTP/0.6 Python/3.9.6`)
    ▼
public  https://nuke.absolutejoker.ca/
```

- The apex site `absolutejoker.ca` is a separate site and is **untouched**
  by this chain — only the `nuke.` subdomain serves the game.
- Publishing is a **copy**, not the live path: editing the build file does
  nothing to the served site until `tools/publish.sh` runs.
- New or changed sibling assets (plates, WebPs, media) are **not** copied by
  `publish.sh` — it copies only the HTML. Copy new assets into
  `~/small-nukem-publish/` by hand, and verify each one serves from the
  origin (see verification below).

## Tester link (Tailscale Funnel)

The same publish folder is also exposed to testers through a Tailscale
Funnel, kept alive by `~/small-nukem/funnel-keeper.sh` + LaunchAgent
`com.padma.small-nukem-funnel`:

- **https://kjd-2.tail31b1ef.ts.net:10000** → `127.0.0.1:8931`

This is a different hostname fronting the same origin — a publish updates
both the public site and the tester link at once.

## Publish steps

Run on the Mac, after the ship gates pass (script checks + full test suite
+ Samira's physics block byte-identical — see the ship procedure):

1. **Back up before the swap.** Keep `.bak-pre-shipN` copies, MD5-verified
   before publishing (pattern proven at ships #23/#24):
   - `~/small-nukem/small-nukem.html.bak-pre-shipN` — the previous build
   - `~/small-nukem/tests/value-checks.mjs.bak-pre-shipN` — the previous suite
   - `~/small-nukem-publish/index.html.bak-pre-shipN` — the previous served file
   - `~/small-nukem/SmallNukem-1.0.apk.bak-pre-shipN` — the previous APK,
     taken before any APK step
   These rollback copies are **kept, not deleted** after the ship.
2. **Stage the build into the publish folder:**

   ```bash
   tools/publish.sh
   # on the Mac this is ~/small-nukem-publish/publish.sh; the staged copy
   # in this repo is tools/publish.sh
   ```

   It copies `~/small-nukem/small-nukem.html` to
   `~/small-nukem-publish/index.html.tmp` and atomically renames it to
   `index.html` (`cp` + `mv`), so no reader ever catches a half-copied
   file. It prints `published <bytes> bytes at <date>`. Run it per ship /
   per gate landed — never mid-milestone.
3. Copy any new sibling assets into `~/small-nukem-publish/` by hand
   (step does not exist in `publish.sh`).
4. Rebuild the APK (next section) and verify the publish (last section).

## APK rebuild

The Android release project is `~/small-nukem/android/` on the Mac.
There is no asset-sync script — skipping the manual copy ships the OLD
HTML inside a new APK.

```bash
# 1. Manual asset sync (mandatory)
cp ~/small-nukem/small-nukem.html ~/small-nukem/android/app/src/main/assets/index.html
#    plus any new sibling assets into android/app/src/main/assets/… by hand
#    verify: shasum -a 256 of source and asset must match

# 2. Build — system Java does not exist on the Mac; JAVA_HOME is mandatory
cd ~/small-nukem/android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleRelease        # expect BUILD SUCCESSFUL

# 3. Ship copy
cp app/build/outputs/apk/release/app-release.apk ~/small-nukem/SmallNukem-1.0.apk

# 4. Verify the bundle: extract assets/index.html from the APK —
#    its MD5 must equal the shipped build's MD5
```

The release is signed with the local debug key by design
(`~/.android/debug.keystore`) — do not regenerate it, or
install-over-the-top breaks. Install with `adb install -r`
(versionCode stays 1), then confirm the package's `lastUpdateTime` is new
and relaunch the app.

## Post-publish verification

A publish is not done until all of these pass:

1. **MD5 match, three ways.** The live file fetched over the public URL
   must hash identically to the shipped build:

   ```bash
   md5 ~/small-nukem/small-nukem.html                 # Mac: the shipped build
   curl -s http://127.0.0.1:8931/ | md5sum            # Mac: the origin
   curl -s https://nuke.absolutejoker.ca/ | md5sum    # anywhere: the public URL
   ```

   All three MD5s and the byte size must agree, with HTTP 200 from the
   public URL. Record build file / publish index / public URL MD5s in the
   ship log.
2. **New assets serve.** Fetch each new or changed sibling asset from the
   origin and confirm its MD5 matches the source file.
3. **Cache warning — confirm the new graphics actually load.** The old
   build can load from browser cache and *look* published while showing
   stale assets. On every playtest load, check the loaded build's
   version/checksum against the current live build and confirm the NEW
   graphics are actually on screen (not stale cached assets). A stale
   load is reloaded / cache-bypassed, never played on. Playtests run only
   against https://nuke.absolutejoker.ca — never a local address.
4. **APK bundle check.** The `assets/index.html` extracted from the
   rebuilt APK must MD5-match the shipped build (step 4 of the APK
   section above).

## Source notes

- `tools/publish.sh` in this repo is a verbatim copy of the Mac's
  `~/small-nukem-publish/publish.sh` (407 bytes).
- The Caddy configuration mapping `nuke.absolutejoker.ca` to
  `127.0.0.1:8931` was not located on the Mac during the ship-procedure
  research; the mapping is established from live response headers
  (`Via: 1.0 Caddy`) and the ship logs.
