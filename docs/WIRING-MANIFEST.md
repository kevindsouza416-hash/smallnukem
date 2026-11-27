# Small Nukem — Asset Wiring Manifest (PREP — no build edits made)

Prepared Nov 25, 2026, for the build owner. Everything below was verified against the
current build and the production manifests — nothing is copied from briefs on trust.

## Build identity (read-only source of truth for every anchor below)

- Build: `~/small-nukem/small-nukem.html` on the Mac — **515,247 B, MD5 `b34629d57019f3736025496ecc37a323`**
  (identical to the build the Chief clips were extracted from, per the clips manifest).
- All line numbers below are line numbers in that build.
- Clip source: `~/workspace/small-nukem-chief-clips/` — 215 mp3s, 35.9 min, voice `avocado_v2:magnus`,
  index `manifest.json` / `manifest.md` in the same folder. All 215 files verified present, status `ok`.
- Cinematic source: `~/workspace/small-nukem-cinematics/` + its `manifest.md` (statuses as of its
  last edit, Nov 25 23:38 UTC, while round 3 was still landing files).
- Verification method: every clip's canonical text was compared programmatically against the
  build's actual line tables. Result: **145 clips match an in-build line verbatim, 0 mismatches,**
  **0 in-build Chief lines without a clip (no gaps).** The other 70 clips are the 50 authored
  reworded variants and 20 script-sourced clips detailed below.

## Disposition summary — Part A (215 clips)

| Disposition | Clips | Size | Meaning |
|---|---|---|---|
| A1 DIRECT | 88 | 7.6 MB | Build already speaks this exact text via `chiefSpeak` — wire through the single hook in §A0, zero call-site changes |
| A2 VARIANT | 50 | 5.48 MB | Authored rewordings (the 50) — wire only where the rotation extension in §A2 is added for that family |
| A3 CAPTION-ONLY | 7 | 0.4 MB | In-build text exists but the build never speaks it today — needs the speak-call addition named per row |
| A4 DO NOT WIRE (as Chief) | 23 | 0.89 MB | Text belongs to FLUKE in the build — see §A4 |
| A5 MASTER (no separate wiring) | 27 | 2.29 MB | Cinematic teach narration — already inside the finished videos (Part B) |
| A6 ORPHANED | 20 | 3.41 MB | No in-build line exists — tour-film / playthrough scripts, not game lines |

## §A0 — The one wiring hook (applies to A1, and to A2/A3 once their text can be picked)

The build speaks every Chief line through ONE function: **`chiefSpeak(text, priority)`, build line 6020**.
Every call site passes the exact canonical line text (callouts via `showCallout` line 3263, reactions via
`chiefReact` line 6117, ladder explanations via `assistSay` line 4673, demonstrations via `guideSay`
line 4832, demo tour via `DEMO_TOUR.say` line 6388). So one hook wires all of A1:

1. Add a text-keyed map next to `SN_CINE.VIDEO` (same hosting pattern):
   `const CHIEF_CLIP = { "<exact canonical line text>": "voice/<clip file>", ... };`
   Keys are the canonical texts in the tables below — copy them byte-for-byte (the build's own
   tables use the same strings; `\u2014` in build source is the em-dash shown here).
2. In `chiefSpeak` (line 6020), BEFORE the `speechSynthesis` path, add the clip branch:
   if `CHIEF_CLIP[text]` exists **and** `!CHIEF.muted` **and** `CHIEF.unlocked` (the same two gates
   chiefSpeak already enforces at line 6023), play the file on a single reusable `Audio` element;
   on `priority`, stop the current clip first (mirrors `speechSynthesis.cancel()`); set
   `CHIEF.speaking = true` on play and `false` on `ended`/`error`; increment `CHIEF.utterances`; return.
   Lines with no map entry fall through to the existing TTS path unchanged.
3. File placement (mirrors `cine/` exactly): copy the wired mp3s into a `voice/` folder in BOTH
   - `/Users/kdsouza/small-nukem-publish/voice/` (web build; publish root is served on :8931)
   - `/Users/kdsouza/small-nukem/android/app/src/main/assets/voice/` (Android app assets, beside `index.html`)
   Note: `publish.sh` copies only the HTML — asset folders are placed separately, as `cine/` was.

> **Heads-up — in-build comment conflict:** the voice-selection comment above `chiefInitVoices`
> (build ~line 5990) says "(Decision 28: pre-rendered audio rejected on size.)" That comment is
> superseded by Kevin's current direction (these clips were produced on his word for this wiring);
> update or remove the comment when you land the hook so the next reader isn't misled.

## §A1 — DIRECT: wire through the §A0 hook (88 clips)

Rotation behaviour is already correct for these: the build picks the variant TEXT (REACTIONS arrays
rotate in `chiefReact` — REP_CAP keys in order 0,1,2 per state, others round-robin via
`CHIEF.variantIdx`; ASSIST_EXPLAIN lines are spoken in order by rung in `assistTick`; SHOWME_LINES
rotate in order in `guideNarrate`), so the text-keyed hook finds the right clip automatically.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `brief-intro-1.mp3` | 11.21 | CALLOUTS.intro | Reactor's cold as my ex's heart. Time to wake this baby up. We're gonna take this BWRX-300 (a small modular boiling water reactor) from cold shutdown to full power. |
| `brief-pre_check-1.mp3` | 15.55 | CALLOUTS.pre_check | Before we do anything, verify those readings. Cold shutdown should be ~30C, ~0.10 MPa, reactor critical at 0.2% power, water level 100%. Don't skip this -- even legends check twice. |
| `brief-rod_withdraw-1.mp3` | 16.44 | CALLOUTS.rod_withdraw | Time to pull rods. The control rods absorb neutrons -- pulling them out lets the chain reaction build. Easy does it: A, then B, then C. Watch that reactor period (the time it takes for power to double) like your career depends on it. Because it does. |
| `brief-approach_crit-1.mp3` | 14.93 | CALLOUTS.approach_crit | Period's coming down -- that means power is rising faster. Target 20 seconds (comfortable doubling time). Under 10 seconds and you've got a transient (an unwanted power spike) -- I'll be writing up an incident report with YOUR name on it. |
| `brief-critical-1.mp3` | 16.75 | CALLOUTS.critical | Criticality achieved (the chain reaction is now self-sustaining). Reactivity (how far from balance) is zero mK (milli-k, a unit of reactivity -- zero means perfectly balanced). The reactor's holding steady. Try not to look too smug. |
| `brief-heat_up-1.mp3` | 16.68 | CALLOUTS.heat_up | She's warming up. Let the temperature climb toward 288C, and keep the heat-up rate under 150C a minute -- that's the plant limit. The negative temperature coefficient (as temp rises, the reaction naturally slows down -- a built-in safety feature) will help you out. Physics has got your back. |
| `brief-pressurise-1.mp3` | 20.09 | CALLOUTS.pressurise | Pressure's building as the water heats up. 7.2 MPa (about 1000 psi) is the setpoint. At 6.8 MPa we're at operating pressure, and the turbine syncs itself at 6.3 MPa. Don't touch that steam valve yet -- let thermodynamics do its thing. |
| `brief-turbine_roll-1.mp3` | 14.4 | CALLOUTS.turbine_roll | Pressure's up. The turbine rolls on its own once pressure passes 6.3 MPa -- 1500 RPM, synchronous speed. Your job: watch it, and work the bypass valve if pressure runs hot. Same as a good V8, way more power. |
| `brief-sync-1.mp3` | 14.33 | CALLOUTS.sync | 1500 RPM and the generator synchronises itself to the grid. Match frequency, check phase angle -- do NOT close that breaker out of phase or I will haunt your dreams. Out-of-phase sync can destroy the generator. |
| `brief-grid-1.mp3` | 10.73 | CALLOUTS.grid | Synced to the grid. Now bring up load slowly to 300 MWe (megawatts electric -- enough to power a quarter million homes). This is what we came for. |
| `brief-period_warn-1.mp3` | 11.11 | CALLOUTS.period_warn | Hey! Reactor period (doubling time) is under 10 seconds! That's a transient (unwanted power excursion). Back those rods in, cool it down. We're running a reactor, not a drag race. |
| `brief-period_danger-1.mp3` | 19.75 | CALLOUTS.period_danger | PERIOD UNDER 5 SECONDS! INSERT RODS NOW! You're approaching prompt criticality (an uncontrolled rapid power surge where the reactor runs away from you). The protection system trips on pressure, power and water level -- don't give it a reason. Do you WANT a SCRAM on your record?! |
| `brief-scram-1.mp3` | 13.99 | CALLOUTS.scram | SCRAM (emergency shutdown -- all control rods dropped in by gravity). The automatic protection system did its job. Figure out what you did wrong before we try again. The reactor doesn't give second chances -- but the safety systems do. |
| `brief-stuck_rod-1.mp3` | 14.28 | CALLOUTS.stuck_rod | One of the rod drives isn't responding -- probably a stuck mechanism. That rod's not moving. Compensate with the adjacent ones to keep reactivity (chain reaction balance) under control. Happens more than management admits. |
| `brief-steam_leak-1.mp3` | 15.05 | CALLOUTS.steam_leak | We've got a steam leak in the tunnel! The isolation condenser (a passive cooling system that works without power -- just gravity and physics) should actuate -- but get down there and isolate that line manually. Pressure's dropping. |
| `brief-fault_cleared-1.mp3` | 8.81 | CALLOUTS.fault_cleared | Good catch. Fault isolated. The passive safety systems in this BWRX-300 are solid -- but nothing beats a sharp operator. Now get back on procedure. |
| `brief-victory-1.mp3` | 14.76 | CALLOUTS.victory | 300 MWe on the grid. That's a clean startup. The core's behaving, the level's steady, and the condenser is taking the heat by gravity. I've seen worse from people with twenty years experience. Not bad, kid. |
| `react-correct_step-1.mp3` | 3.89 | REACTIONS.correct_step[0] | That's the one. Clean work — keep her coming up nice and steady. |
| `react-correct_step-2.mp3` | 3.43 | REACTIONS.correct_step[1] | Correct. You might just make an operator yet, kid. |
| `react-correct_step-3.mp3` | 4.56 | REACTIONS.correct_step[2] | Right panel, right move. The plant thanks you. So do I, quietly. |
| `react-wrong_order-1.mp3` | 5.57 | REACTIONS.wrong_order[0] | Whoa — not yet. Procedure has an order for a reason. Check the step list. |
| `react-wrong_order-2.mp3` | 5.23 | REACTIONS.wrong_order[1] | Skipping steps is how incident reports get written. Follow the sequence. |
| `react-wrong_order-3.mp3` | 3.77 | REACTIONS.wrong_order[2] | That comes later. Right now, the procedure wants something else. |
| `react-wrong_component-1.mp3` | 4.13 | REACTIONS.wrong_component[0] | That panel won't help this step. Eyes on the procedure, operator. |
| `react-wrong_component-2.mp3` | 3.96 | REACTIONS.wrong_component[1] | Wrong iron. The step tells you what to work — trust it. |
| `react-wrong_component-3.mp3` | 3.53 | REACTIONS.wrong_component[2] | You can polish that panel later. The reactor's waiting on the right one. |
| `react-alarm_raised-1.mp3` | 4.56 | REACTIONS.alarm_raised[0] | Alarm! Eyes on the gauges — find what's out of family and deal with it. |
| `react-alarm_raised-2.mp3` | 3.55 | REACTIONS.alarm_raised[1] | That's an alarm condition. Don't admire it — respond to it. |
| `react-alarm_raised-3.mp3` | 4.01 | REACTIONS.alarm_raised[2] | Annunciator's lit for a reason. Check the deck, find the offender. |
| `react-alarm_cleared-1.mp3` | 4.03 | REACTIONS.alarm_cleared[0] | Alarm cleared. Nice recovery — that's how it's done. |
| `react-alarm_cleared-2.mp3` | 2.57 | REACTIONS.alarm_cleared[1] | Back in family. Steady as she goes. |
| `react-alarm_cleared-3.mp3` | 3.31 | REACTIONS.alarm_cleared[2] | Cleared. The plant forgives. This time. |
| `react-idle_30s_hint-1.mp3` | 4.01 | REACTIONS.idle_30s_hint[0] | Still with me? The procedure step at the top tells you what's next. |
| `react-idle_30s_hint-2.mp3` | 3.05 | REACTIONS.idle_30s_hint[1] | Plant's waiting on you, operator. Next step's in the list. |
| `react-idle_30s_hint-3.mp3` | 4.08 | REACTIONS.idle_30s_hint[2] | No rush — but the core notices when nobody's driving. |
| `react-milestone_complete-1.mp3` | 3.43 | REACTIONS.milestone_complete[0] | Milestone in the book. That's real progress, operator. |
| `react-milestone_complete-2.mp3` | 4.63 | REACTIONS.milestone_complete[1] | Phase complete. Even I'm impressed, and I don't impress. |
| `react-milestone_complete-3.mp3` | 5.57 | REACTIONS.milestone_complete[2] | That's a milestone. Log it, savour it for one second, move on. |
| `react-startup_complete-1.mp3` | 5.83 | REACTIONS.startup_complete[0] | FULL POWER. Three hundred megawatts, clean startup. Drinks are on me — in the simulator, anyway. |
| `react-startup_complete-2.mp3` | 6.0 | REACTIONS.startup_complete[1] | Startup complete! The grid's got our power and you did every step by the book. Beautiful. |
| `react-startup_complete-3.mp3` | 5.71 | REACTIONS.startup_complete[2] | She's on the grid at full power. Kid, you just started up a reactor. Frame that feeling. |
| `guide-step1-1.mp3` | 7.56 | ASSIST_EXPLAIN[0][0] | Step one: verify the cold state at the local panel. Temperature, pressure, level — read them before you touch anything. |
| `guide-step1-2.mp3` | 7.75 | ASSIST_EXPLAIN[0][1] | The panel's right there, kid. Check the readings against the procedure — 30 degrees, 0.10 MPa, level at 100. |
| `guide-step1-3.mp3` | 6.96 | ASSIST_EXPLAIN[0][2] | Last word on this one: cold state first, hands second. The local panel tells you if she's truly cold. |
| `guide-step2-1.mp3` | 10.2 | ASSIST_EXPLAIN[1][0] | Step two: the rod drives. Work the lever at the drive panels — A, then B, then C — and keep the heat-up rate under 150 a minute. |
| `guide-step2-2.mp3` | 7.73 | ASSIST_EXPLAIN[1][1] | Lever's on the rod drive panels, one floor up. Easy pulls. Watch the period — 20 seconds is comfortable, under 10 is trouble. |
| `guide-step2-3.mp3` | 6.84 | ASSIST_EXPLAIN[1][2] | Still on the lever, kid: small pulls, watch the rate. The core rewards patience and punishes enthusiasm. |
| `guide-step3-1.mp3` | 8.09 | ASSIST_EXPLAIN[2][0] | Step three is patience: let her heat up and pressurise on the saturation curve. Work the lever gently and keep the rate in family. |
| `guide-step3-2.mp3` | 7.97 | ASSIST_EXPLAIN[2][1] | Temperature climbs, pressure follows — that's the curve doing its job. Your job is just the rate: under 150 a minute. |
| `guide-step3-3.mp3` | 5.81 | ASSIST_EXPLAIN[2][2] | Nothing new to touch, operator. Heat and pressure rise together; you just keep the rate honest. |
| `guide-step4-1.mp3` | 10.51 | ASSIST_EXPLAIN[3][0] | Step four: the turbine. At 6.3 MPa she rolls to 1500 RPM and syncs herself — confirm it at the turbine control and sync panels. |
| `guide-step4-2.mp3` | 8.09 | ASSIST_EXPLAIN[3][1] | Watch the turbine panel: 1500 RPM, then the sync panel shows her matched to the grid. Confirm, don't force. |
| `guide-step4-3.mp3` | 6.12 | ASSIST_EXPLAIN[3][2] | Turbine's the show now. RPM at 1500, sync confirmed — that's the step, kid. |
| `guide-step5-1.mp3` | 9.55 | ASSIST_EXPLAIN[4][0] | Last step: raise power to 300 MWe at the load control. Bring the lever up and hold 285-plus for three seconds. |
| `guide-step5-2.mp3` | 7.68 | ASSIST_EXPLAIN[4][1] | Load control panel, kid. Lever up slow, watch the megawatts — she needs to hold over 285, steady. |
| `guide-step5-3.mp3` | 7.73 | ASSIST_EXPLAIN[4][2] | Nearly home. Full lever, steady hold, three seconds over 285 MWe. That's the whole step. |
| `ladder-announce-1.mp3` | 3.41 | literal (announce) | Step aside, kid — I'll take this one and show you how it's done. |
| `ladder-handback-1.mp3` | 2.23 | literal (handback) | Your plant. Next one's yours. |
| `showme-check_readings-1.mp3` | 12.19 | SHOWME_LINES.check_readings[0] | Watch me first: I press the panel check and read temperature, pressure and level out loud — because you never touch a control before you've verified the plant is truly in the state the procedure assumes. |
| `showme-check_readings-2.mp3` | 13.8 | SHOWME_LINES.check_readings[1] | First move is always the same: verify the cold state at the local panel. Thirty degrees, a tenth of an MPa, level at a hundred — because a startup built on assumed readings is a startup built on sand. |
| `showme-check_readings-3.mp3` | 9.79 | SHOWME_LINES.check_readings[2] | Eyes before hands, kid. I read the panel and check her numbers against the procedure, because the one time you skip it is the one time she's not cold. |
| `showme-rod_withdraw-1.mp3` | 11.64 | SHOWME_LINES.rod_withdraw[0] | Now the lever, at the rod drives — I work it the way you'd work it: hold to withdraw, easy pulls. Because the lever sets the pace of the whole heat-up, and a yanked lever means a runaway period. |
| `showme-rod_withdraw-2.mp3` | 10.87 | SHOWME_LINES.rod_withdraw[1] | Here's the touch: small, steady pulls on the drive lever. I'm keeping the period near twenty seconds because that's a doubling time you can think in — under ten, nobody can. |
| `showme-rod_withdraw-3.mp3` | 11.88 | SHOWME_LINES.rod_withdraw[2] | See the lever move? That's your hand, next time. Slow withdraw, watch the rate — because heat-up is capped at a hundred and fifty a minute, and the lever is how you respect the cap. |
| `showme-rod_drive_2-1.mp3` | 10.92 | SHOWME_LINES.rod_drive_2[0] | Drive B next — same lever, same patience. Working the drives in order keeps the core's shape even, because a lopsided withdraw makes a lopsided core. |
| `showme-rod_drive_2-2.mp3` | 9.29 | SHOWME_LINES.rod_drive_2[1] | On to B. The sequence matters more than the speed: A, then B, then C, so reactivity comes in balanced instead of all on one side. |
| `showme-rod_drive_3-1.mp3` | 8.45 | SHOWME_LINES.rod_drive_3[0] | Last drive, C — finish the set. Three drives worked in order means the flux stays symmetric, and a symmetric core is a predictable core. |
| `showme-rod_drive_3-2.mp3` | 7.99 | SHOWME_LINES.rod_drive_3[1] | C drive, same gentle pull. You've seen the whole sequence now — that's exactly how you'd do it, because it IS how it's done. |
| `showme-steam_valve-1.mp3` | 12.17 | SHOWME_LINES.steam_valve[0] | The bypass handwheel now — I open it the way you'd open it, a turn at a time. Because when pressure runs hot, the bypass is how you hand steam to the condenser instead of fighting the safety valves. |
| `showme-steam_valve-2.mp3` | 8.81 | SHOWME_LINES.steam_valve[1] | Watch the bypass: easing it open drops pressure without touching the core. You'd do the same, because pressure control lives here while the turbine's finding its feet. |
| `showme-raise_power-1.mp3` | 10.39 | SHOWME_LINES.raise_power[0] | Load control: I raise the lever slowly toward full power and hold her over 285. Because a spike trips the very machine you're trying to bring online — smooth in, steady hold. |
| `showme-raise_power-2.mp3` | 9.72 | SHOWME_LINES.raise_power[1] | Here's the finish: lever up at the load panel, megawatts climbing, and I hold the number. You'd hold it the same way, because full power is a hold, not a spike. |
| `showme-turbine_control-1.mp3` | 11.64 | SHOWME_LINES.turbine_control[0] | At the turbine panel I confirm the roll: 1500 RPM, steady. Because the turbine tells you when it's ready — your job is to witness it, not to force it. |
| `showme-turbine_control-2.mp3` | 8.21 | SHOWME_LINES.turbine_control[1] | Turbine control: I check she's at synchronous speed. Confirm, don't force — because a turbine pushed out of step punishes the whole hall. |
| `showme-sync_grid-1.mp3` | 8.4 | SHOWME_LINES.sync_grid[0] | Sync panel: I confirm frequency and phase are matched before anything closes. Because closing a breaker out of phase can wreck the generator in one bang. |
| `showme-sync_grid-2.mp3` | 10.68 | SHOWME_LINES.sync_grid[1] | Here's where patience pays: the sync check. She synchronises herself when pressure's right — I just verify it, because verification is the operator's half of this step. |
| `showme-feed_pump-1.mp3` | 10.13 | SHOWME_LINES.feed_pump[0] | Feed pump panel: I start the standby pump the way you would — one press, then watch the level answer. Because level is life in a boiling core, and feedwater is how you defend it. |
| `showme-feed_pump-2.mp3` | 8.52 | SHOWME_LINES.feed_pump[1] | Standby feed pump, on. I watch the level recover before I touch anything else, because chasing two changes at once is how operators lose the thread. |
| `showme-iso_condenser-1.mp3` | 9.05 | SHOWME_LINES.iso_condenser[0] | Isolation condenser: I put it in service with one press. Because it's the passive heat sink — gravity and physics, no power needed — and it has to be available before you need it. |
| `showme-iso_condenser-2.mp3` | 9.05 | SHOWME_LINES.iso_condenser[1] | IC valve, over to auto. Same press you'd make. It matters because when everything else trips, this is the system that quietly carries the decay heat away. |
| `showme-shutdown_rods-1.mp3` | 12.72 | SHOWME_LINES.shutdown_rods[0] | Different lesson now: I drive the lever DOWN at the rod drives until the rods are fully in. Because the first move with a plant you can't save is always the same — shut her down clean and let the condenser carry the heat. |
| `showme-shutdown_rods-2.mp3` | 11.52 | SHOWME_LINES.shutdown_rods[1] | Rods going in, all the way. I'm showing you the shutdown you'd perform: lever down, verify insertion, because a safe plant is never a failure — it's the job. |
| `showme-generic-1.mp3` | 8.64 | SHOWME_LINES.generic[0] | Follow my hands on this one: I work the control the way you'd work it, at a pace you can follow. Because a demonstration you can't imitate is just a show. |
| `showme-generic-2.mp3` | 7.92 | SHOWME_LINES.generic[1] | Same control, same motion you'd use. Watch what I do and why: every action on this panel has a reason, and the reason is the lesson. |
| `tour-intro.mp3` | 13.15 | DEMO_TOUR say('intro') | While I run her up: the arrow over Fluke points at the step's machine and warms when he's headed right, the chip up top names the step, and the plant map is on the M key. Everything I do, you can do. |
| `tour-reactor.mp3` | 16.78 | DEMO_TOUR say('reactor') | Safety tour — reactor building: the trefoil placards mark the radiation zone, and every hazard symbol in this plant can be tapped for its WHMIS card. Standby liquid control and the isolation condensers are here — shutdown and cooling that need no power. |
| `tour-steam.mp3` | 12.6 | DEMO_TOUR say('steam') | Safety tour — steam tunnel: high-pressure steam signage on the main, and the leak isolation valve is in this tunnel. Listen as much as look — you will hear a steam leak before you see it. |
| `tour-turbine.mp3` | 13.37 | DEMO_TOUR say('turbine') | Safety tour — turbine hall: electrical hazard signage on the generator, the flame pictogram on the hydrogen cooling — no sparks, ever. And the covered red button is the manual SCRAM: last resort, always in reach. |

## §A2 — VARIANT: the 50 authored rewordings (map to base line; rotation extension required)

These clips render lines that do NOT exist in the build. Each maps to the base line named in its
anchor. Per family, the extension the build owner adds so the never-repeat-verbatim rotation can
actually pick them:

- **briefings (34 clips, variants 2–3 of each CALLOUTS key):** `CALLOUTS` (line 3214) holds ONE text
  per key today. Extend `showCallout` to rotate per key through `[CALLOUTS[key], variant2, variant3]`
  in order per plant state — mirror the REP_CAP pattern already in `chiefReact` (lines 6102–6115);
  `showCalloutText` already caps identical text at 3 showings per state (lines 3243–3258). Add a
  `CALLOUT_VARIANTS = { <key>: ["voice/brief-<key>-2.mp3", "voice/brief-<key>-3.mp3"] }` map or extend
  the §A0 map when the rotation picks the variant text (variant texts are in the clips manifest).
- **showme (10 clips, variant 3 of keys that have 2 in-build variants):** append each clip's text as
  the THIRD element of its `SHOWME_LINES.<key>` array (line 4771). `guideNarrate` picks
  `variants[n % variants.length]` in order (lines 4838–4841), so the appended variant is reached on
  the third demonstration of that action with no further code change; the §A0 text hook then finds it.
- **ladder announce / handback (4 clips, variants 2–3):** the base lines are single literals at the
  `assistSay` sites (announce: lines 4710 and 8767; handback: line 4689). Convert each site to pick
  from a 3-element array in order (a per-site counter, like `SHOWME.lineUse`), then the §A0 hook applies.
- **takeover announce (2 clips, variants 2–3):** base line is the `takeoverLog('say', ...)` literal at
  line 4553. Rotate the announce text among the 3 at that site. NOTE: this family is also caption-only
  today — see §A3 for the speak-call addition it needs first.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `brief-intro-2.mp3` | 11.71 | CALLOUTS.intro authored variant 2 (no in-build text) | Cold iron, cold core, and a full shift ahead of us. This BWRX-300 (a small modular boiling water reactor) is in cold shutdown, and we're taking her all the way to full power. |
| `brief-intro-3.mp3` | 11.35 | CALLOUTS.intro authored variant 3 (no in-build text) | She's cold and she's waiting. One BWRX-300 (a small modular boiling water reactor), sitting in cold shutdown — and by the end of this shift, she'll be at full power, if we do it right. |
| `brief-pre_check-2.mp3` | 13.15 | CALLOUTS.pre_check authored variant 2 (no in-build text) | First job never changes: prove she's cold. Around 30C, about 0.10 MPa, critical at 0.2% power, water level at 100%. Read them off the panel, not off your memory. |
| `brief-pre_check-3.mp3` | 15.84 | CALLOUTS.pre_check authored variant 3 (no in-build text) | Before a single control moves, the numbers have to agree with the procedure: roughly 30C, 0.10 MPa, critical at 0.2%, level full at 100%. Check them like it's your first day — every day. |
| `brief-rod_withdraw-2.mp3` | 14.83 | CALLOUTS.rod_withdraw authored variant 2 (no in-build text) | Rods out, gently. Every rod you withdraw takes neutron absorbers out of the core and lets the reaction build. A first, then B, then C — and keep your eyes on the period (the doubling time). Your career rides on that number, so act like it. |
| `brief-rod_withdraw-3.mp3` | 13.27 | CALLOUTS.rod_withdraw authored variant 3 (no in-build text) | Time to bring her up. Withdrawing the rods removes the neutron absorbers, and the chain reaction starts to climb. Sequence is A, B, C, small pulls — and the period (how fast power doubles) is the only number that matters right now. |
| `brief-approach_crit-2.mp3` | 12.79 | CALLOUTS.approach_crit authored variant 2 (no in-build text) | Watch the period shrink — that's power doubling faster and faster. Twenty seconds is the comfortable target. Let it fall under ten and you're in a transient (an unwanted power spike), and transients come with paperwork. |
| `brief-approach_crit-3.mp3` | 13.75 | CALLOUTS.approach_crit authored variant 3 (no in-build text) | Period's shortening, which means the climb is steepening. Hold her near twenty seconds of doubling time. Under ten seconds is a transient (a power spike nobody ordered) — ease off before I have to explain you to the regulator. |
| `brief-critical-2.mp3` | 17.64 | CALLOUTS.critical authored variant 2 (no in-build text) | There it is — critical (the chain reaction sustaining itself, one fission paying for the next). Reactivity is zero mK (milli-k, the reactivity unit — zero is perfect balance). She's holding steady. Good work. Don't let it go to your head. |
| `brief-critical-3.mp3` | 13.92 | CALLOUTS.critical authored variant 3 (no in-build text) | Criticality. The reaction now feeds itself, reactivity sitting at zero mK (milli-k — zero means the core is exactly in balance). Steady as a table. That's the hardest part done quietly, the way it should be. |
| `brief-heat_up-2.mp3` | 17.52 | CALLOUTS.heat_up authored variant 2 (no in-build text) | Now we warm her through. Temperature's headed for 288C; the heat-up rate stays under 150C a minute — that's a plant limit, not a guideline. The negative temperature coefficient (the reaction eases itself as the water heats) works in your favour the whole way up. |
| `brief-heat_up-3.mp3` | 15.02 | CALLOUTS.heat_up authored variant 3 (no in-build text) | Heat-up's a patience game: climb toward 288C, never faster than 150C a minute. And remember the built-in help — the negative temperature coefficient (hotter water naturally slows the reaction). Physics is pulling with you on this one. |
| `brief-pressurise-2.mp3` | 16.73 | CALLOUTS.pressurise authored variant 2 (no in-build text) | Heat turns to pressure now. The setpoint is 7.2 MPa (about 1000 psi); operating pressure is 6.8 MPa, and the turbine syncs itself at 6.3 MPa. Hands off the steam valve — let the thermodynamics do the heavy lifting. |
| `brief-pressurise-3.mp3` | 18.74 | CALLOUTS.pressurise authored variant 3 (no in-build text) | As the water heats, pressure follows. We're aiming at the 7.2 MPa setpoint (roughly 1000 psi), through 6.8 MPa operating pressure, with the turbine syncing at 6.3 MPa. No touching the steam valve yet. The plant knows the way. |
| `brief-turbine_roll-2.mp3` | 15.14 | CALLOUTS.turbine_roll authored variant 2 (no in-build text) | Pressure's past 6.3 MPa, so the turbine rolls by itself up to 1500 RPM, synchronous speed. You watch; if pressure runs hot, the bypass valve is your tool. She's a V8 with a city block's worth of power — treat her accordingly. |
| `brief-turbine_roll-3.mp3` | 13.87 | CALLOUTS.turbine_roll authored variant 3 (no in-build text) | There's the roll. Once pressure passes 6.3 MPa the turbine comes up on its own to 1500 RPM. Your job is witness and watchkeeper: eyes on the gauges, bypass valve ready if pressure misbehaves. |
| `brief-sync-2.mp3` | 11.57 | CALLOUTS.sync authored variant 2 (no in-build text) | Fifteen hundred RPM and she synchronises to the grid herself. Frequency matched, phase angle checked — that's the whole ceremony. Close a breaker out of phase and the generator loses, every time. So we don't. |
| `brief-sync-3.mp3` | 14.47 | CALLOUTS.sync authored variant 3 (no in-build text) | At 1500 RPM the generator syncs to the grid. Your part is verification: frequency matched, phase angle right. An out-of-phase close can wreck the machine in one bang — check it twice, close it once. |
| `brief-grid-2.mp3` | 13.63 | CALLOUTS.grid authored variant 2 (no in-build text) | On the grid. Now raise load slowly toward 300 MWe (megawatts electric — a quarter of a million homes, give or take). Smooth on the lever. This is the moment the whole startup was for. |
| `brief-grid-3.mp3` | 15.07 | CALLOUTS.grid authored variant 3 (no in-build text) | Synchronised and delivering. Bring her up gently to 300 MWe (megawatts electric — enough for a quarter million homes). No spikes, no showing off. Just a clean climb to full power. |
| `brief-period_warn-2.mp3` | 14.64 | CALLOUTS.period_warn authored variant 2 (no in-build text) | Hey — period's under ten seconds. That's a transient (an unwanted power excursion), and we don't ride those. Rods back in a touch, let her settle. Reactors reward patience; they punish drag racers. |
| `brief-period_warn-3.mp3` | 9.41 | CALLOUTS.period_warn authored variant 3 (no in-build text) | Period under ten seconds — too fast. Insert the rods a little and cool the climb down. We're starting a reactor here, not setting a lap time. |
| `brief-period_danger-2.mp3` | 16.2 | CALLOUTS.period_danger authored variant 2 (no in-build text) | PERIOD UNDER FIVE SECONDS — RODS IN, NOW! You're closing on prompt criticality (a runaway surge where the reactor outruns its operators). The protection system trips on pressure, power and level — do not make it prove that. |
| `brief-period_danger-3.mp3` | 13.44 | CALLOUTS.period_danger authored variant 3 (no in-build text) | Five seconds and falling — INSERT RODS IMMEDIATELY! That's prompt criticality territory (power rising faster than anyone can steer). Back her down now, or the protection system does it for you and writes SCRAM on your record. |
| `brief-scram-2.mp3` | 15.12 | CALLOUTS.scram authored variant 2 (no in-build text) | That's a SCRAM (emergency shutdown — every rod dropped in by gravity). The protection system earned its pay today. Before we reset: walk the sequence back and find where it turned. The plant forgives once — learn from the once. |
| `brief-scram-3.mp3` | 11.81 | CALLOUTS.scram authored variant 3 (no in-build text) | SCRAM. All rods in by gravity, reaction stopped, plant safe — the protection system did exactly what it's built for. Now the real work: figure out what you did wrong. We debrief first, restart second. |
| `brief-stuck_rod-2.mp3` | 13.03 | CALLOUTS.stuck_rod authored variant 2 (no in-build text) | One drive's not answering — a stuck rod mechanism. It happens; the manual even has a page for it. Compensate with the adjacent drives and keep reactivity (the chain reaction balance) under control while we work around it. |
| `brief-stuck_rod-3.mp3` | 11.59 | CALLOUTS.stuck_rod authored variant 3 (no in-build text) | That rod's stuck — drive's not responding. Don't force it. Work the neighbouring drives to hold reactivity (chain reaction balance) steady. Machinery sticks; good operators adapt. |
| `brief-steam_leak-2.mp3` | 13.63 | CALLOUTS.steam_leak authored variant 2 (no in-build text) | Steam leak in the tunnel — hear it? The isolation condenser (passive cooling: gravity and physics, no power needed) should pick up the load, but I want that line isolated by hand. Move with purpose; pressure's falling. |
| `brief-steam_leak-3.mp3` | 11.23 | CALLOUTS.steam_leak authored variant 3 (no in-build text) | We've got a leak on the steam line. The isolation condenser (a passive system — gravity does the work) is your backstop, but backstops don't replace operators: get down there and isolate that line manually. |
| `brief-fault_cleared-2.mp3` | 12.53 | CALLOUTS.fault_cleared authored variant 2 (no in-build text) | Isolated and cleared. The BWRX-300's passive safety is genuinely good — but it was a sharp operator who caught that, not a sensor. Credit where it's due. Now, back on procedure. |
| `brief-fault_cleared-3.mp3` | 8.04 | CALLOUTS.fault_cleared authored variant 3 (no in-build text) | Fault's dealt with. The plant's passive systems are solid, and so, apparently, is my operator. Reset your head, pick the procedure back up where we left it. |
| `brief-victory-2.mp3` | 14.71 | CALLOUTS.victory authored variant 2 (no in-build text) | Three hundred MWe on the grid, and a clean startup to boot. Core steady, level steady, condenser carrying the heat by gravity. I've watched twenty-year operators make a meal of that. You didn't. Well done, kid. |
| `brief-victory-3.mp3` | 11.28 | CALLOUTS.victory authored variant 3 (no in-build text) | Full power, on the grid, no trips, no violations. That's how a startup is supposed to read. The core's behaving and the plant's happy. Log it and savour it — you earned this one. |
| `ladder-announce-2.mp3` | 5.76 | announce authored variant 2 (no in-build text) | Enough telling — time for showing. I'll take this one myself, and I'll talk you through every move while I make it. |
| `ladder-announce-3.mp3` | 7.25 | announce authored variant 3 (no in-build text) | My turn, kid. Watch the whole thing: I'll do this step the way it should be done, and explain it as I go. |
| `ladder-handback-2.mp3` | 4.25 | handback authored variant 2 (no in-build text) | There — done, and the plant's yours again. Next step has your name on it. |
| `ladder-handback-3.mp3` | 4.25 | handback authored variant 3 (no in-build text) | Handing her back. That one's in the book; the next one's all you. |
| `showme-rod_drive_2-3.mp3` | 9.53 | SHOWME_LINES.rod_drive_2 authored variant 3 (in-build has 2) | B drive now. I keep the pulls small and even, because the core remembers every lopsided move you make — balance in, balance out. |
| `showme-rod_drive_3-3.mp3` | 9.55 | SHOWME_LINES.rod_drive_3 authored variant 3 (in-build has 2) | And C completes the pattern. Worked in order, the three drives bring her up symmetric — and symmetric is what keeps the next hour boring, which is the goal. |
| `showme-steam_valve-3.mp3` | 9.53 | SHOWME_LINES.steam_valve authored variant 3 (in-build has 2) | One more tool for your kit: the bypass handwheel. A turn at a time from me — because steam you route calmly to the condenser is steam that never argues with you. |
| `showme-raise_power-3.mp3` | 9.67 | SHOWME_LINES.raise_power authored variant 3 (in-build has 2) | Final climb, same discipline: lever up slowly, megawatts rising, and I hold her steady over 285 — because the hold is the step, not the climb. |
| `showme-turbine_control-3.mp3` | 10.51 | SHOWME_LINES.turbine_control authored variant 3 (in-build has 2) | Turbine panel, confirmation only: 1500 RPM and holding. I don't touch what doesn't need touching, because a machine at synchronous speed is already doing its job. |
| `showme-sync_grid-3.mp3` | 9.65 | SHOWME_LINES.sync_grid authored variant 3 (in-build has 2) | At the sync panel I do the operator's half: verify. Frequency matched, phase matched — because the breaker only closes when the two sides agree, and I'm the witness who signs it. |
| `showme-feed_pump-3.mp3` | 9.72 | SHOWME_LINES.feed_pump authored variant 3 (in-build has 2) | Standby pump started, and now I watch the level answer before anything else moves — because one change at a time is how you always know what worked. |
| `showme-iso_condenser-3.mp3` | 9.36 | SHOWME_LINES.iso_condenser authored variant 3 (in-build has 2) | Putting the isolation condenser in service — one press, done early on purpose, because the time to prove your passive heat sink is before the plant ever asks for it. |
| `showme-shutdown_rods-3.mp3` | 11.71 | SHOWME_LINES.shutdown_rods authored variant 3 (in-build has 2) | Watch the shutdown done properly: lever down at the drives, rods fully in, insertion verified — because ending a shift safely is a skill, not a surrender. |
| `showme-generic-3.mp3` | 10.61 | SHOWME_LINES.generic authored variant 3 (in-build has 2) | Nothing up my sleeve: the same panel, the same control, the same motion you'd make. If you can follow my hands, you can do the step — that's the point of the demonstration. |
| `takeover-announce-2.mp3` | 9.36 | takeover announce authored variant (no in-build text) | Right — my turn at the wheel. I'll take it from here: first I look at what you've handed me, then I fix it in the open where you can watch. |
| `takeover-announce-3.mp3` | 8.95 | takeover announce authored variant (no in-build text) | Stepping in. I'll take it from here — diagnosis first, then the fix, all of it where you can see my hands. Watch closely; this is the good stuff. |

(For VARIANT rows the "line text" column is the CLIP's text — the rewording itself; the anchor names
the base in-build line it alternates with.)

## §A3 — CAPTION-ONLY in the build today (7 clips): add the named speak call, then the §A0 hook applies

- **hints (3):** `SNX_HINTS` (line 2704) is shown with `showCalloutText(h)` only (line 2712, inside a
  700 ms `setTimeout`). The build never speaks hints. Add `chiefSpeak(h, false)` beside that call.
- **takeover announce (1) + demo on/off (3):** all takeover narration drains through
  `TAKEOVER.sayQ` → `showCalloutText(...)` at line 8691 — captions only, 2.5 s apart. Do NOT add
  speech at the drain: the same queue carries the runtime `Found:` / `Fixed:` / debrief texts (§A7),
  which must stay unvoiced-by-clip. Instead, in `takeoverLog` (line 4527) add: when
  `kind === 'say'`, also call `chiefSpeak(text, false)`. The demo on/off lines are direct
  `showCalloutText` literals at lines 4456 / 4464 / 4469 — add `chiefSpeak(<same text>, false)` at
  each of the three sites.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `takeover-announce-1.mp3` | 3.53 | literal (announce) | Watch — I'll take it from here. First, I diagnose what you've handed me… |
| `takeover-demo-on.mp3` | 5.23 | literal in startDemo (build line 4456), showCalloutText only | Demo mode. Watch Fluke work the startup — touch anything to take the plant yourself. |
| `takeover-demo-off.mp3` | 3.19 | literal in demo exit (build line 4464), showCalloutText only | Demo off. The plant is yours, operator. |
| `takeover-off.mp3` | 4.85 | literal in takeover exit (build line 4469), showCalloutText only | Takeover off. Your plant, operator — it stays as the driver left it. |
| `hint-iso_condenser.mp3` | 6.0 | SNX_HINTS.iso_condenser | Second use: the isolation condenser pulls pressure down passively — no bypass steam wasted. |
| `hint-feed_pump.mp3` | 6.53 | SNX_HINTS.feed_pump | Second use: feedwater trims power too — small flow changes move MW without touching the rods. |
| `hint-steam_valve.mp3` | 6.17 | SNX_HINTS.steam_valve | Second use: the bypass is a load trim — crack it to hold pressure while the turbine catches up. |

## §A4 — DO NOT WIRE as Chief (23 clips): these lines are FLUKE's in the build

**Flag 1 (from the brief) — VERIFIED, and wider than one line.** Every `SN_CINE.DEFS.<key>.line`
(the "quip") is assigned to Fluke by the build:

- `playNext` renders it with `flukeSay(def.line)` in BOTH the video path (line 5875) and the canvas
  path (line 5894). `flukeSay` (line 5027) is Fluke's speech-bubble setter.
- `"Hail to the king of the core."` specifically: it is `FLUKE_LINES.level_complete[0]` (line 7965),
  spoken by Fluke's TTS in `flukeBark` (line 7969, pitch 0.6), AND called directly as
  `flukeSay('Hail to the king of the core.')` on level completion (line 8472). The Chief clip
  `cine-level_complete-quip.mp3` renders this line in the Chief's voice — **do not wire it as Chief.**
- The other 21 quip clips are the same pattern (each renders its scene's `DEFS.line`). They are
  listed below so none is wired by mistake. If Fluke ever gets pre-rendered voice, these texts are
  his — but in the Chief's voice recording they cannot be used for him either; treat as unused.
- Special case: `ladder-coach-line.mp3` ("Watch how it's done, kid.") is the Chief's own coaching
  line semantically, but in the build it sits in the same slot — `SN_CINE.DEFS.assist_coach.line`,
  set by `ensureAssistClip` (line 4719) and refreshed at lines 4712/8769 — so the cine path renders
  it through `flukeSay` like every other def.line. Wiring it as Chief requires special-casing
  `assist_coach` in the cine path; do not fold it into the §A0 text hook (the same text never passes
  through `chiefSpeak`). Decision left to the build owner; default: leave unwired.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `ladder-coach-line.mp3` | 1.49 | SN_CINE.DEFS.assist_coach.line (via ensureAssistClip) | Watch how it's done, kid. |
| `cine-first_criticality-quip.mp3` | 1.85 | SN_CINE.DEFS.first_criticality.line | Critical. She purrs. |
| `cine-grid_sync-quip.mp3` | 2.57 | SN_CINE.DEFS.grid_sync.line | Synchronised. Smooth as I am. |
| `cine-power_ascension-quip.mp3` | 3.24 | SN_CINE.DEFS.power_ascension.line | More power. Carefully. Mostly. |
| `cine-procedure_chain-quip.mp3` | 2.09 | SN_CINE.DEFS.procedure_chain.line | By the book. The book works. |
| `cine-level_complete-quip.mp3` | 1.85 | SN_CINE.DEFS.level_complete.line | Hail to the king of the core. |
| `cine-cold_state_verified-quip.mp3` | 3.53 | SN_CINE.DEFS.cold_state_verified.line | Cold, shut down, and proven — not assumed. |
| `cine-fault_caught_fw-quip.mp3` | 1.92 | SN_CINE.DEFS.fault_caught_fw.line | Caught it early. That's the job. |
| `cine-fault_caught_turb-quip.mp3` | 2.93 | SN_CINE.DEFS.fault_caught_turb.line | Turbine's out, plant's fine. Watch me. |
| `cine-fault_caught_loop-quip.mp3` | 1.73 | SN_CINE.DEFS.fault_caught_loop.line | Grid hiccup. We didn't. |
| `cine-fault_caught_sea-quip.mp3` | 2.83 | SN_CINE.DEFS.fault_caught_sea.line | Lake's moody. Condenser's fine. |
| `cine-fault_caught_atws-quip.mp3` | 3.41 | SN_CINE.DEFS.fault_caught_atws.line | Rods said no. Boron said yes. |
| `cine-recovery_rate-quip.mp3` | 2.59 | SN_CINE.DEFS.recovery_rate.line | Rate's mine now. Watch the dial. |
| `cine-recovery_rods-quip.mp3` | 2.64 | SN_CINE.DEFS.recovery_rods.line | Rods where they belong. By the numbers. |
| `cine-recovery_press-quip.mp3` | 3.05 | SN_CINE.DEFS.recovery_press.line | Pressure's coming home. Easy does it. |
| `cine-recovery_bypass-quip.mp3` | 3.05 | SN_CINE.DEFS.recovery_bypass.line | Bypass was doing overtime. Closing it down. |
| `cine-recovery_fw-quip.mp3` | 2.35 | SN_CINE.DEFS.recovery_fw.line | Standby pump's up. Level's coming back. |
| `cine-recovery_level-quip.mp3` | 3.12 | SN_CINE.DEFS.recovery_level.line | Level's the lifeline. Bringing it home. |
| `cine-recovery_turb-quip.mp3` | 3.77 | SN_CINE.DEFS.recovery_turb.line | She'll roll again. Steam first, pride later. |
| `cine-recovery_ic-quip.mp3` | 3.0 | SN_CINE.DEFS.recovery_ic.line | IC's on the job. Gravity does the heavy lifting. |
| `cine-recovery_order-quip.mp3` | 3.65 | SN_CINE.DEFS.recovery_order.line | Steps exist in order for a reason. Resetting. |
| `cine-recovery_alarm-quip.mp3` | 2.28 | SN_CINE.DEFS.recovery_alarm.line | Alarm's a question. Here's the answer. |
| `cine-recovery_shutdown-quip.mp3` | 2.76 | SN_CINE.DEFS.recovery_shutdown.line | She's down safe. Now we learn why. |

## §A5 — MASTER (27 clips): cinematic teach narration — no separate wiring

These clips render `SN_CINE.DEFS.<key>.teach` (and, for the 5 ladder-teach clips,
`ASSIST_TEACH[step]`, which becomes `DEFS.assist_coach.teach` per step at lines 4712/8769).
In the canvas cine path the teach text is drawn on screen (chrome(), lines ~5638–5646), never spoken;
in the video path the SAME narration is already mixed into the finished video's audio track
(voice-first, per the cinematics manifest). So: **where a scene's video is wired (Part B), its teach
clip needs nothing.** For scenes still pending video, the teach clip is the narration master the
production line already used — it wires only as part of that scene's video, not standalone.
Note the assist_coach scene has FIVE teach variants (one per procedure step) but the `VIDEO` map
has one slot per key — an assist_coach video cannot carry all five; that is a production decision,
not a wiring one.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `ladder-teach-step1.mp3` | 6.05 | ASSIST_TEACH[0] (= SN_CINE.DEFS.assist_coach.teach for step 1) | Verify before you touch: temperature, pressure, level — read them, don't assume them. |
| `ladder-teach-step2.mp3` | 5.95 | ASSIST_TEACH[1] (= SN_CINE.DEFS.assist_coach.teach for step 2) | The lever sets the pace of the whole heat-up. Slow hands, steady rate — under 150 a minute. |
| `ladder-teach-step3.mp3` | 5.23 | ASSIST_TEACH[2] (= SN_CINE.DEFS.assist_coach.teach for step 3) | Heat makes pressure. Ride the saturation curve and let physics do the lifting. |
| `ladder-teach-step4.mp3` | 5.95 | ASSIST_TEACH[3] (= SN_CINE.DEFS.assist_coach.teach for step 4) | 1500 RPM is the magic number — frequency and phase matched before the breaker closes. |
| `ladder-teach-step5.mp3` | 7.56 | ASSIST_TEACH[4] (= SN_CINE.DEFS.assist_coach.teach for step 5) | Full power is a hold, not a spike: 285+ MWe, steady, for three full seconds. |
| `cine-first_criticality-teach.mp3` | 10.25 | SN_CINE.DEFS.first_criticality.teach | Criticality: each fission now triggers exactly one more — the chain reaction sustains itself. From here, rod position is power. |
| `cine-grid_sync-teach.mp3` | 9.17 | SN_CINE.DEFS.grid_sync.teach | Sync: the breaker may only close when turbine frequency and voltage match the grid — close out of phase and the machine, not the grid, loses. |
| `cine-power_ascension-teach.mp3` | 9.6 | SN_CINE.DEFS.power_ascension.teach | Ascension is a negotiation: raise power in holds, let temperature and pressure settle at each plateau, and never chase a moving needle. |
| `cine-procedure_chain-teach.mp3` | 8.33 | SN_CINE.DEFS.procedure_chain.teach | Steps in order, checks before action: a clean chain is not luck — it is the procedure doing the thinking before the plant does the surprising. |
| `cine-level_complete-teach.mp3` | 9.17 | SN_CINE.DEFS.level_complete.teach | A shift is judged on margins kept, not power made: every trip you never caused is the real score. Log it, hand it over clean. |
| `cine-cold_state_verified-teach.mp3` | 7.51 | SN_CINE.DEFS.cold_state_verified.teach | Verify the cold state before touching anything: temperature, pressure, level, all read and recorded first. |
| `cine-fault_caught_fw-teach.mp3` | 10.8 | SN_CINE.DEFS.fault_caught_fw.teach | Feedwater loss shows first as level shrink and a pump note change — the standby pump and RCIC buy time, but only diagnosis buys a recovery. |
| `cine-fault_caught_turb-teach.mp3` | 9.12 | SN_CINE.DEFS.fault_caught_turb.teach | A turbine trip is a steam problem instantly: bypass open first, questions later — the steam has to go somewhere that is not the relief valves. |
| `cine-fault_caught_loop-teach.mp3` | 8.76 | SN_CINE.DEFS.fault_caught_loop.teach | Loss of offsite power: the diesels and batteries carry the safety loads — your job is load discipline until the grid returns, not heroics. |
| `cine-fault_caught_sea-teach.mp3` | 9.36 | SN_CINE.DEFS.fault_caught_sea.teach | Losing circulating water warms the condenser and vacuum decays slowly — slow faults reward early eyes: trend it, don't wait for the alarm. |
| `cine-fault_caught_atws-teach.mp3` | 11.71 | SN_CINE.DEFS.fault_caught_atws.teach | ATWS — the scram that didn't: ARI drives the rods by a diverse path and SLC boron shuts the core down chemically. Two independent answers, by design. |
| `cine-recovery_rate-teach.mp3` | 6.43 | SN_CINE.DEFS.recovery_rate.teach | Heat-up rate is a stress limit, not a suggestion: ease the lever back and let metal and water agree on a speed. |
| `cine-recovery_rods-teach.mp3` | 9.6 | SN_CINE.DEFS.recovery_rods.teach | Rod position is reactivity: return to the procedure position notch by notch — never park the core somewhere the procedure didn't bless. |
| `cine-recovery_press-teach.mp3` | 9.79 | SN_CINE.DEFS.recovery_press.teach | Pressure is steam with nowhere to go: bypass and the isolation condenser are the exits — open one before the relief valves open themselves. |
| `cine-recovery_bypass-teach.mp3` | 10.13 | SN_CINE.DEFS.recovery_bypass.teach | An abandoned bypass dumps your steam to the condenser: power stalls and pressure hunts. A control left in a bad position is a fault you scheduled. |
| `cine-recovery_fw-teach.mp3` | 9.41 | SN_CINE.DEFS.recovery_fw.teach | Feedwater recovery is a sequence: standby pump running, flow proven, THEN restart the main — swapping pumps blind swaps one trip for two. |
| `cine-recovery_level-teach.mp3` | 8.95 | SN_CINE.DEFS.recovery_level.teach | Level is the core's blanket: below the alarm, feed is the only conversation; below the scram setpoint, the plant ends the conversation for you. |
| `cine-recovery_turb-teach.mp3` | 8.76 | SN_CINE.DEFS.recovery_turb.teach | Turbine recovery starts with the steam path proven and the bypass in hand — re-roll into a pressure spike and you'll trip twice. |
| `cine-recovery_ic-teach.mp3` | 9.07 | SN_CINE.DEFS.recovery_ic.teach | The isolation condenser needs no power and no pump: open its path and hot water rises, condenses, and falls back — physics as the backup generator. |
| `cine-recovery_order-teach.mp3` | 12.77 | SN_CINE.DEFS.recovery_order.teach | A skipped step is a debt the plant collects later, with interest: go back, do the step, then continue — the procedure forgives, physics doesn't. |
| `cine-recovery_alarm-teach.mp3` | 8.23 | SN_CINE.DEFS.recovery_alarm.teach | An alarm is the plant asking a specific question — answer THAT one, in its procedure, before touching anything else. |
| `cine-recovery_shutdown-teach.mp3` | 8.35 | SN_CINE.DEFS.recovery_shutdown.teach | A trip is the plant protecting itself when the procedure window closed — the debrief names the cause so the next shift doesn't repeat it. |

## §A6 — ORPHANED (20 clips): no in-build line — do not invent a target

**Flag 3 (from the brief) — VERIFIED both directions:** the build has NO level-2/level-3-specific
briefings (one `CALLOUTS` table serves all levels; L2 adds only amber banner texts at lines
3707–3708, L3 only dispatch behaviour), and the clip set contains no L2/L3 briefing clips — nothing
is orphaned on that account. The actual orphans are the two script-sourced groups below: their texts
appear nowhere in the build (verified by full-text search). They narrate the recorded tour film
(`tour-script`, 17 clips, from `~/workspace/small-nukem-tour/`) and the demo playthrough video
(`demo-narration`, 3 clips). They belong to those videos, not the game. Leave them out of the build.

| Clip file | Dur (s) | Build anchor | In-build line text (canonical) |
|---|---|---|---|
| `tourscript-shot1.mp3` | 15.86 | no build source (script-sourced) | Welcome to Small Nukem. That's Fluke — hard hat, shades, and a reactor to wake up. This is a BWRX-300, a real small modular reactor design, and you're going to start it from cold shutdown. Let me show you everything this plant gives you to work with. |
| `tourscript-shot2.mp3` | 19.44 | no build source (script-sourced) | First, the Chief. He's your control room operator, and his window opens by default — you never have to go looking for him. He talks you through every step, and listen closely: he never repeats himself word for word. Every reminder comes back phrased a different way, a few times — then he stops, and lets you work. |
| `tourscript-shot3.mp3` | 21.43 | no build source (script-sourced) | Your procedure is right on screen — where you are, step one of five, what's done, what's next. One tap opens the full procedure. No hunting through menus. The steps are the real startup sequence: verify the cold state, raise the lever slowly, heat up and pressurise, sync the turbine, then raise power to three hundred megawatts. |
| `tourscript-shot4.mp3` | 26.66 | no build source (script-sourced) | Now the part this game takes seriously: safety. See the symbols posted on the equipment? Those aren't decoration. The trefoil is the real radiation warning — prescribed by Canada's nuclear regulator, the CNSC. The steam lines carry high pressure steam warnings, and the hazard striping marks where you don't stand. In a real plant these signs are the law. Here, they're how you learn to read a plant. |
| `tourscript-shot5.mp3` | 27.19 | no build source (script-sourced) | Tap any symbol and you get its card. Real WHMIS — the Workplace Hazardous Materials Information System. The class name, what the pictogram means, where that hazard lives in this plant, and the one precaution that matters. Compressed gas. Corrosives at the boron system and the battery rooms. And the card tells you straight when a sign is plant signage or the regulator's — not WHMIS at all. No faking the labels. |
| `tourscript-shot6.mp3` | 20.47 | no build source (script-sourced) | And if you get it wrong? The plant protects itself. Push pressure to eight point three megapascals, or power past a hundred and twelve percent, and the reactor SCRAMs — every rod in, reaction stopped. Failures in this game end in a safe shutdown. Never an explosion. That's not a softened game rule — that's how the real machine is built. |
| `tourscript-shot7.mp3` | 16.56 | no build source (script-sourced) | Lost? Follow the arrow. It points at your current step's target — and it plays warmer-cooler with you. Head the wrong way, it cools to blue. Close the distance, it warms toward red. Target on another floor, it tells you up or down. When you arrive, it hands you off to the machine itself. |
| `tourscript-shot8.mp3` | 17.14 | no build source (script-sourced) | Every machine has its own control panel, modelled on the real device. Walk up, and the game tells you how to work it. Hold to withdraw the rods — gently. This is a startup, not a drag race. Heat-up stays under a hundred and fifty degrees a minute, or the Chief will have words. |
| `tourscript-shot9a.mp3` | 30.65 | no build source (script-sourced) | Across the bottom, your instruments — as plain text you can actually read on a phone. Temperature, pressure, power, water level. The strip shows what matters for the area you're standing in. And when you need the big picture, the plant map pops up: the whole plant laid out, with a you-are-here marker on Fluke that tracks him live from area to area. Inside that same pop-up lives the detailed BWRX-300 schematic, for when you want every pipe and valve. Right now the map is still — cold plant, nothing moving, nothing glowing. |
| `tourscript-shot9b.mp3` | 10.03 | no build source (script-sourced) | Now look at the same map at power. Steam is flowing through the lines, and the vessel is radiating heat — the map isn't a picture, it's driven by the plant's real values, live. |
| `tourscript-shot9c.mp3` | 13.32 | no build source (script-sourced) | And it doesn't flatter you. That overheating component? I did that — pushed the plant too hard and hurt it. The map shows the plant as it truly is, including what you did to it. No hiding your mistakes from yourself in here. |
| `tourscript-shot10.mp3` | 15.05 | no build source (script-sourced) | Do something right, and the game stops to mark it — with a cinematic clip built from your own plant, at that moment. Each one carries a single teaching point. This one: verify the cold state before you touch anything. Proven — not assumed. |
| `tourscript-shot11.mp3` | 19.61 | no build source (script-sourced) | Want to watch it done properly? Demo mode runs the whole startup on the real physics, the Chief narrating as he goes. And mid-play, he can take over from wherever you've got the plant — fix what you broke, or shut it down safe and tell you why. A demo-finished shift is marked demo-assisted. The score stays honest. |
| `tourscript-shot12ab.mp3` | 11.59 | no build source (script-sourced) | Stuck? First, the Chief just tells you. Plainly, the way a trainer would. Still stuck, he tells you again — same point, different words, because hearing it the same way twice doesn't teach anybody anything. |
| `tourscript-shot12cd.mp3` | 16.75 | no build source (script-sourced) | Still stuck after that, he stops telling and starts showing. He takes the controls, does the task himself, and talks you through what he's doing while he does it — watch his hands, not just the result. Then it's yours again. That's the whole ladder: told, retold, shown — then back to work. |
| `tourscript-shot13.mp3` | 3.84 | no build source (script-sourced) | Even the prompts dress the part — every key is drawn as a key. |
| `tourscript-shot14.mp3` | 13.85 | no build source (script-sourced) | Any time you need out, the menu button is right there — one tap, back to the title, no maze. That's Small Nukem: a real reactor, a real procedure, real safety — and a Chief who won't let you fake any of it. Your shift, kid. |
| `demo-narration-part1.mp3` | 43.75 | no build source (script-sourced) | Welcome to Small Nukem. This is Level One, a cold startup of the BWRX three hundred, and we are taking this reactor from cold shutdown all the way to full power. Fluke is on the ground floor of the Reactor Building, standing in front of the vessel, and the Chief is watching from the control room. Before anything moves, we verify the cold state. The core sits at thirty degrees, pressure is zero point one megapascals, and the reactor is critical, steady at zero point two percent power. Water level is full at one hundred percent. Those are exactly the numbers the procedure demands, so we are cleared to begin. Step one is the pre-start checks, run at the local panel beside the vessel, and the Chief signs them off. |
| `demo-narration-part2.mp3` | 41.4 | no build source (script-sourced) | Step two, the lever comes up slowly and the control rods withdraw. We keep the heat-up gentle, under one hundred and fifty degrees a minute, because a vessel this size does not like to be rushed. From there the plant heats up and pressurises, pressure riding the saturation curve as temperature climbs toward two hundred and eighty-eight degrees. At six point three megapascals, the turbine rolls and synchronises itself to the grid. We confirm it on the grid at exactly fifteen hundred RPM, generator locked in, steam flowing. The plant settles there, parked at one hundred and sixty-nine megawatts, pressure at seven point one seven megapascals, water level steady and full. |
| `demo-narration-part3.mp3` | 32.81 | no build source (script-sourced) | Now the final step. The lever comes up further and power climbs toward three hundred megawatts electric, easing through two hundred, and we hold above two hundred and eighty-five megawatts for a full three seconds. Target met. The scorecard reads clean: five steps done in two hundred and eighty-eight seconds, one transient on the way up, no SCRAMs, and no step violations. Verify the cold state, draw the rods out gently, ride the curve up, let the turbine sync itself, then load to full power. That is how you wake up a reactor, kid. |

(For ORPHAN rows the anchor records the script source and the text column is the clip's own text —
there is no in-build line text.)

## §A7 — RUNTIME templates: no clips exist, none should be pre-rendered

**Flag 2 (from the brief) — VERIFIED.** These TAKEOVER texts are built at runtime from live plant
state and must stay runtime-generated:

- Diagnosis lines: `takeoverLog('diagnosis', 'Found: ' + p.text + '.')` — line 4571; the `p.text`
  values come from `diagnoseTakeover` (line 4531+) and embed live numbers (rate, pressure, level).
- Fix lines: `takeoverLog('fix', 'Fixed: ' + TAKEOVER.problems[i].text + '.')` — line 4605.
- Safe-shutdown debrief: the template literal assigned to `TAKEOVER.debrief` at line 4562
  (interpolates `${S.why}` and the diagnosed causes), logged at line 4564.
- No clips in the set render these (the takeover group is announce/demo_on/demo_off/takeover_off
  only). All three drain as captions via `TAKEOVER.sayQ` (line 8691). Do not route them to the
  §A0 hook with recorded audio; if they are ever voiced, it is by live TTS on the generated text.

## Gap check (reverse direction)

Every Chief line the build can speak or display was checked against the clip set: `CALLOUTS` (17),
`REACTIONS` (24), `ASSIST_EXPLAIN` (15), `SHOWME_LINES` in-build variants (26), `ASSIST_TEACH` (5),
`DEMO_TOUR` (4), `SNX_HINTS` (3), all 22 static `SN_CINE.DEFS` teach + line texts, the dynamic
`assist_coach` line, and the announce/handback/demo literals — **all have a matching clip; gap list
is empty.** (The static placeholder in the HTML at line 431 shows the first two sentences of
`CALLOUTS.intro` — display default only, not a separate line.)
## Part B — Finished cinematics → scene keys

### §B0 — How a scene's video is wired (the first_criticality pattern, verified in the build and on disk)

1. **The map:** build line 5597, inside `SN_CINE`:
   `const VIDEO = { first_criticality: 'cine/first_criticality.mp4' };`
   Add one entry per finished scene, exactly: `<key>: 'cine/<key>.mp4',`
2. **Playback:** `playNext` (build ~line 5866) checks `VIDEO[item.key]`; if set, it points the
   `#cineVideo` element at the path and plays it. Playback ends on the element's `onended` —
   **`DEFS[key].dur` (6–8 s) does NOT limit video playback**, so the standard 9.6 s files play in
   full with no duration edit. A load error retries once on the canvas-rendered scene
   (`noVideo: true`). During playback the build also shows `DEFS[key].line` as Fluke's speech
   bubble (`flukeSay`, line 5875) — unchanged by this wiring.
3. **File placement:** copy the scene's finished file to `cine/<key>.mp4` in BOTH places the
   build lives beside a `cine/` folder:
   - `/Users/kdsouza/small-nukem-publish/cine/<key>.mp4` (web; publish root served on :8931 —
     `publish.sh` copies only the HTML, asset folders are placed separately)
   - `/Users/kdsouza/small-nukem/android/app/src/main/assets/cine/<key>.mp4` (Android assets,
     beside `index.html`; picked up by the next APK rebuild)
4. **Format standard:** 1280×720 h264 video + AAC 24 kHz mono audio. All six new finished files
   below were probed with ffprobe and match exactly (duration 9.625 s each).
5. **Naming exception, scene 1 only:** the workspace master is named
   `first-criticality-prototype.mp4`; it is placed as `cine/first_criticality.mp4`. Already done
   in both destinations — MD5 `8282cc1a715a5180a166dca2cc9fb0d0` in both, verified identical to
   the workspace master (1280×720 h264 + AAC, 8.0 s). Every other scene's workspace file is
   already named `<key>.mp4` — copy it under its own name.

### §B1 — FINISHED scenes (per the cinematics manifest): 7 of 23 — 1 already wired, 6 to wire

| # | Scene key (SN_CINE.DEFS) | Build title | Source file (~/workspace/small-nukem-cinematics/) | Size | Format (probed) | Action |
|---|---|---|---|---|---|---|
| 1 | first_criticality | FIRST CRITICALITY | first-criticality-prototype.mp4 | 6,298,649 B | 1280×720 h264 + AAC, 8.0 s | ALREADY WIRED — `VIDEO` entry present (line 5597); `cine/first_criticality.mp4` in place in both destinations, MD5-verified |
| 2 | cold_state_verified | COLD STATE VERIFIED | cold_state_verified.mp4 | 3,535,628 B | 1280×720 h264 + AAC, 9.625 s | Add `cold_state_verified: 'cine/cold_state_verified.mp4'` + copy file to both `cine/` destinations |
| 3 | grid_sync | ON THE GRID | grid_sync.mp4 | 3,812,331 B | 1280×720 h264 + AAC, 9.625 s | Add `grid_sync: 'cine/grid_sync.mp4'` + copy to both |
| 4 | power_ascension | POWER ASCENSION | power_ascension.mp4 | 8,040,606 B | 1280×720 h264 + AAC, 9.625 s | Add `power_ascension: 'cine/power_ascension.mp4'` + copy to both |
| 5 | procedure_chain | CLEAN PROCEDURE CHAIN | procedure_chain.mp4 | 5,132,886 B | 1280×720 h264 + AAC, 9.625 s | Add `procedure_chain: 'cine/procedure_chain.mp4'` + copy to both |
| 6 | fault_caught_fw | FAULT CAUGHT — FEEDWATER | fault_caught_fw.mp4 | 4,111,041 B | 1280×720 h264 + AAC, 9.625 s | Add `fault_caught_fw: 'cine/fault_caught_fw.mp4'` + copy to both |
| 7 | fault_caught_turb | FAULT CAUGHT — TURBINE | fault_caught_turb.mp4 | 4,839,584 B | 1280×720 h264 + AAC, 9.625 s | Add `fault_caught_turb: 'cine/fault_caught_turb.mp4'` + copy to both |

Production note carried from the cinematics manifest (not a wiring blocker): in
`procedure_chain.mp4` the Chief's wardrobe drifts to an orange suit in the last TV frames
(face/mug correct). The scene is marked DONE.

### §B2 — PENDING scenes: 16 of 23 — do NOT wire yet

**Producing (round 3) — 6 scenes.** ⚠️ **Warning:** final-name files for the first four already
exist in `~/workspace/small-nukem-cinematics/` (level_complete.mp4 2,748,995 B;
fault_caught_loop.mp4 3,421,376 B; fault_caught_sea.mp4 4,043,014 B; fault_caught_atws.mp4
3,499,469 B — all probe 1280×720 h264, 9.625 s; written Nov 25 23:22–23:36 UTC while round 3
was running). **The cinematics manifest still marks every one of these scenes PRODUCING** —
its frame-check (character AND aspect, the two failures that killed round-2 composites) has
not been recorded as passed for them. A file sitting at the final name is not a finished
scene: **wire a scene from this group only after the cinematics manifest marks it DONE,**
then treat it exactly like a §B1 row.

| Scene key | Cinematics-manifest status | File at final name? |
|---|---|---|
| level_complete | PRODUCING (round 3) — round-2 redo fixed Fluke but came back portrait; composite deleted; round-3 regen in progress | Yes — unverified, do not wire |
| fault_caught_loop | AUDIO DONE / PRODUCING (round 3) — round-2 raw was portrait; narration + mix final | Yes — unverified, do not wire |
| fault_caught_sea | PRODUCING (round 3) — narration + bed + mix built; video generation in progress | Yes — unverified, do not wire |
| fault_caught_atws | PRODUCING (round 3) — narration + mix built; video generation was queued behind fault_caught_sea | Yes — unverified, do not wire |
| recovery_rate | PRODUCING (round 3) — narration + bed + mix built; video generation in progress | No |
| recovery_rods | PRODUCING (round 3) — narration + bed + mix built; video generation queued behind recovery_rate | No |

**Queued — 10 scenes** (no production started; no files): `recovery_press`, `recovery_bypass`,
`recovery_fw`, `recovery_level`, `recovery_turb`, `recovery_ic`, `recovery_order`,
`recovery_alarm`, `recovery_shutdown`, `assist_coach`.

Note on `assist_coach`: its `SN_CINE.DEFS` entry is created dynamically by `ensureAssistClip`
(build line 4719), but the `VIDEO` map slot works the same way once a video exists. Its teach
text varies per procedure step (five variants — see §A5), which a single video cannot carry;
that is a production decision that precedes any wiring.

Only the files named in §B1 are wiring sources. Other mp4s in the cinematics folder
(`media-generation-*.mp4` raws, `production/<key>/` material) are production intermediates —
never copy them into `cine/`.

---

## Anything that doesn't line up (all findings, gathered)

1. **Quips recorded in the wrong voice for their build role (§A4):** all 22 `cine-*-quip.mp3`
   clips render `DEFS.line` texts that the build assigns to Fluke. They cannot be wired as
   Chief lines, and (being the Chief's recorded voice) cannot serve as Fluke lines either.
   22 finished recordings with no valid in-build use — a production-side mismatch, surfaced
   here rather than silently dropped.
2. **In-build comment contradicts this wiring (§A0):** "(Decision 28: pre-rendered audio
   rejected on size.)" above `chiefInitVoices`. Superseded by Kevin's current direction;
   flagged for the build owner to update when landing the hook.
3. **Round-3 files vs manifest status (Part B):** four scenes have final-format files on disk
   while their manifest status is still PRODUCING. The manifest governs; wiring waits for DONE.
4. **assist_coach asymmetry (§A5/§B2):** five per-step teach narrations exist as clips
   (`ladder-teach-step1..5.mp3`) but the scene has one `VIDEO` slot and no produced video.
5. **Caption-only speech paths (§A3):** hints and all takeover/demo narration are text-only in
   the current build — the clips exist, but three small speak-call additions (named per row)
   are required before they can sound. The `Found:` / `Fixed:` / debrief texts in the same
   queue must stay runtime-generated (§A7).
6. Everything else lines up: clip texts vs build tables (145 verbatim matches, 0 mismatches),
   the reverse gap check (0 in-build Chief lines without a clip), scene keys (build
   `SN_CINE.DEFS` 22 static + `assist_coach` = cinematics manifest's 23), and the finished
   videos' format (all probe to the 1280×720 h264 + AAC standard).

---

## WIRING PASS — COMPLETED Nov 25, 2026 (~20:15 EST)

Build: **581,457 B, MD5 f9854951c2eaa817d7a755320dd29359** (from 537,811 B /
b30c74d5). Samira physics hash a3385f4f29207be552c4a1c48b620d9b asserted
byte-identical before/after every patch. Check suite **128/128** (§17 added,
21 wiring checks). Pre-wiring backup: `small-nukem.pre-wiring-backup-2026-11-25.html`
on the Mac. Patches: ~/workspace/small-nukem-wiring/patches/patch60–66 +
patch-tests60; data generated by gen_wiring_data.py (every included text
verified against the CURRENT build, every variant verified absent).

- **§A1 DIRECT — LANDED with two evidence-based exceptions.** 82 of the 88
  play via the CHIEF_CLIP hook (patch60). Exceptions: `ladder-announce-1`
  and the five `guide-step*-3` clips — the controls pass deleted the ladder
  announce site and ASSIST_EXPLAIN lines[2] has no speak site in the current
  build, so there is no verbatim site; left unwired rather than inventing
  sites (see §A2 note). The 5 `ladder-teach-*` clips (§A5 "master") ARE
  wired — ASSIST_TEACH is spoken by SN_HELP rung 2.
- **§A2 VARIANT — LANDED (48 of 50).** Briefings rotate base→v2→v3 per
  plant state in showCallout (patch61, CALLOUT_VARIANTS/nextCalloutText);
  SHOWME_LINES gained its 10 third variants (patch62); handback and
  takeover-announce rotate via rotPick (patch62). The 2 ladder-announce
  variants share the deleted site above and stay unwired.
- **§A3 CAPTION-ONLY — LANDED (patch63).** Speak calls added at the
  __snxPopHint display site, in takeoverLog for kind === 'say' (at the log
  call, NOT the sayQ drain), and at the three demo literals.
- **§A4 DO NOT WIRE — HELD.** No Fluke-line clip is in CHIEF_CLIP
  (suite §17 asserts it); ladder-coach-line left unwired per the default.
- **§A5 MASTER — as manifested:** cine teach clips not wired (narration is
  mixed into the videos); ladder-teach wired as audio (above).
- **§A6 ORPHANED — HELD.** tourscript-* and demo-narration-* not wired.
- **§A7 RUNTIME TEMPLATES — HELD.** takeoverLog speaks only kind 'say';
  Found:/Fixed:/debrief stay live-voice.
- **Part B cinematics — LANDED (patch64).** All 23 scenes in SN_CINE.VIDEO;
  22 new mp4s copied to cine/ in the publish root + Android assets
  (first_criticality already present, MD5 matches the master). 165/165
  asset paths (142 voice + 23 cine) serve HTTP 200 from the publish root.
- **Decision-28 comment — UPDATED** (patch60): records the Nov 25 reversal.
- **Panel restyle (added to this pass by Kevin's Nov 25 ~19:36 approval) —
  LANDED (patch65).** PANEL_SYS in SN_TOUCH: enamel band + system name,
  plate tint, detail-strip border per driven system (rod_withdraw /
  read_period / check_readings / slc_panel / ari_button → ROD CONTROL
  violet; feed_pump / rcic_panel → FEEDWATER · PUMPS teal; turbine_control
  / sync_grid / raise_power → TURBINE · GENERATOR amber-gold; steam_valve /
  iso_condenser / isolate_leak / check_sg → PRESSURE · STEAM copper-red;
  grid_connect → ELECTRICAL yellow). Materials only.
- **Patch66 — TDZ fix.** The runtime probe caught the two
  Object.assign(CHIEF_CLIP, …) blocks executing before the const map
  (load-time ReferenceError, whole script dead). Both blocks were cut and
  re-inserted immediately after the map; byte count unchanged. The check
  suite's string checks could not see this — the headless runtime probe
  is what caught it.
- **Verification:** runtime probe (verify-wiring.mjs) — map 142 entries,
  chiefSpeak plays brief-intro-1.mp3 (utterances/speaking tracked),
  unmapped line leaves the clip alone, callout rotation base→v2→v3 all
  clipped, handback rotation in order, recovery_press cinematic plays
  (readyState 4, currentTime advancing), five system panels screenshotted
  at phone size over HTTP (zero page errors). The two WebGL
  tainted-canvas errors seen under file:// reproduce identically on the
  pre-wiring build from the same folder — pre-existing probe artifact,
  not a wiring regression. Hands-off demo: headless probes stall
  identically (~28 s, pin check_readings) on the PRE-WIRING and wired
  builds in both folder layouts — a headless-environment artifact,
  not a regression (full isolation record:
  ~/workspace/small-nukem-fix/evidence/wiring-demo-isolation.txt);
  on the Pixel 10 the wired build's attract demo was observed running
  (tour narration captioned, core temp 30 → 51.2 °C).
- **Publish + APK:** publish.sh byte-identical (f9854951…); APK
  124,280,880 B, MD5 b99b734aae209484d636b1c4f48b3122, bundled
  assets/index.html byte-identical to the web build, 142 voice + 23 cine
  assets inside; installed on the Pixel 10 (install -r Success) and
  launched — attract demo running, DEMO_TOUR reactor line captioned.
  Evidence: ~/workspace/small-nukem-fix/evidence/wiring-*.png.

---

## Ship #24 Addendum (Nov 26 2026)

> **Status of this addendum:** appended Nov 26, 2026, following W19's completeness
> check (`work/w19-wiring-check.md`, verdict: STALE). The body above is **not**
> rewritten — it remains the historical wiring record as prepared Nov 25, 2026,
> plus its Nov 25 wiring-pass completion note. This addendum is the ship #24
> update to that record. Where this addendum and the body disagree, this
> addendum governs for ship #24.

### 1. New build identity (ship #24)

- **Ship:** #24 — controls/input stack, patches 148–160 composed on the
  ship #23 base (patch 150 was reserved and **not** used).
- **File:** `game/small-nukem.html` — **1,082,451 B, 12,243 lines,
  MD5 `6dc80315b5ef9fb69d537227c3411ab0`** (measured on the staging copy
  this run; matches the ship #24 identity in `docs/SHIP-LOG.md` and
  `AGENTS.md`).
- **Suite:** **538/538** (`node tests/value-checks.mjs` — 538 passed,
  0 failed, per the ship #24 entry in `docs/SHIP-LOG.md`).
- **Line numbers:** every line number in the main body above is a
  ship-≤23 anchor (the body's stated build was 515,247 B /
  `b34629d57019f3736025496ecc37a323`, and its wiring-pass note recorded
  581,457 B / `f9854951c2eaa817d7a755320dd29359`). Those numbers **may
  have shifted** — W19 measured drift of +633 to +2,447 lines on 10/10
  spot-checked anchors, and at least one body number now points at a
  different construct. **Anchor on function/table names and exact
  strings, not on the body's line numbers.** Line numbers given in
  this addendum are ship #24 lines, measured this run.
- What still holds from the body: W19 re-verified the in-scope wiring
  record against ship #24 — `CHIEF_CLIP` (line 7594, 142 `voice/`
  entries), `CALLOUT_VARIANTS` (line 4088), and the full 23-entry
  `SN_CINE.VIDEO` map (line 7758) are all present as the wiring-pass
  note describes.

### 2. §B2 items — LANDED in ship #24 (superseding the §B2 body text)

The §B2 body above lists 16 of 23 scenes as "PENDING — do NOT wire
yet". That status is **superseded**: the Nov 25 wiring pass landed all
23 scenes (see the "WIRING PASS — COMPLETED" note above, patch64), and
W19 verified all 23 keys present in `SN_CINE.VIDEO` in the ship #24
file (re-verified this run at line 7758). The 16 §B2 items are
therefore marked **LANDED** — each has a `'<key>': 'cine/<key>.mp4'`
entry in `SN_CINE.VIDEO` in ship #24:

- Producing (round 3) group — all 6 LANDED: `level_complete`,
  `fault_caught_loop`, `fault_caught_sea`, `fault_caught_atws`,
  `recovery_rate`, `recovery_rods`.
- Queued group — all 10 LANDED: `recovery_press`, `recovery_bypass`,
  `recovery_fw`, `recovery_level`, `recovery_turb`, `recovery_ic`,
  `recovery_order`, `recovery_alarm`, `recovery_shutdown`,
  `assist_coach`.

Do not re-apply the §B2 "do not wire" instruction to ship #24 or later.

### 3. New systems — patches 148–160 (not covered in the body above)

Each entry: one line on what it does, plus the anchor(s) to grep in
`game/small-nukem.html`. Every anchor below was verified present in
the ship #24 staging file by grep this run (ship #24 line given).

- **Dwell pop-up (patches 148/154)** — unit info sheet that opens on
  accumulated presence (≈1,200 ms for the sheet; the info plate keeps
  the older >3 s dwell), with a deliberate-close latch so a closed
  sheet does not re-open until presence fully resets.
  Grep: `SN_UNITINFO` (const at line 5687).
- **Canvas text (patch 149)** — glyph supersampling for canvas text:
  glyphs are rasterized into the atlas at 2× their CSS size and
  divided back on draw, so text stays crisp at high DPR.
  Grep: `GLYPH_SS` (line 1177), `glyphSSFont` (line 1178).
- **Hold-input / named-action layer (patches 151/156/158)** — the
  single named-action input snapshot every device writes and the loop
  reads, with press-time pointer sync and `INPUT.interactPulse` as
  the primary panel-open verb.
  Grep: `INPUT` (const at line 5616), `syncPointerInput` (first ref
  line 3332), `interactPulse` (panel-open use at line 6428).
- **Camera (patches 132/152)** — state-based camera zoom (in on
  approach, steady while operating, out on leaving; lookahead and
  dead zone; approach fit-guarantee clamp) plus Reduce Camera Motion,
  persisted as `sn.camMotion`.
  Grep: `SN_ZOOM` (const at line 3708), `cycleCamMotion` (line 3226).
- **Keyboard (patches 153/159)** — dual WASD + arrow held-key map with
  a 170 ms sub-frame press latch and scroll armour, plus the APG fine
  channel (±1% steps, snap + clamp) for panel steppers.
  Grep: `KB_LATCH` (line 4183), `SN_WASD`, `padStepFine` (line 7104),
  `SN_PADSTEP_FINE` (line 7072 area; first ref line 4196).
- **Freeze (patch 155)** — time-held freeze while setting a control:
  physics/elapsed time pause, the freeze record (`used`, `heldSec`)
  is carried in checkpoints, shown as the TIME HELD pill and scored
  on the scorecard as FREEZE-ASSISTED.
  Grep: `SN_FREEZE` (const at line 4714), `TIME HELD` (`#fzPill`,
  lines 84/841; scorecard line `FREEZE-ASSISTED (TIME HELD)` at
  line 998).
- **Segmented touch zone (patch 157)** — the on-screen movement zone
  as one segmented zone with sector hit-testing, a 12 px dead strip
  at the split, and live-sector following when a finger slides.
  Grep: `zoneSectorAt` (line 6975), `zoneRects` (line 6962),
  `zoneInDeadStrip`.
- **Trackpad wheel (patches 128/160)** — trackpad/mouse-wheel input
  as hold/pulse movement and gated panel stepping: one notch = 40 px,
  momentum clamped to ≤2 steps per event, STEPPERS gate, fine steps
  routed through the APG fine channel.
  Grep: `SN_PAD` (`window.SN_PAD` at line 11956), `SN_PADSTEP_FINE`,
  `NOTCH` (line 11902).
