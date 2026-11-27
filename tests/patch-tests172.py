#!/usr/bin/env python3
# patch-tests172 - locks for patch172 (SHIP #25: cinematics toggle). Edits tests/value-checks.mjs only.
# EXPECTED-UPDATE (rewritten in place): the patch145 boot lock located the SN_AUDIO block by the exact old
# declaration 'const SN_AUDIO = { audio: true, sfx: true };'; the declaration now carries cine: true.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
OLD = "html.indexOf('const SN_AUDIO = { audio: true, sfx: true };')"
assert text.count(OLD) == 1
text = text.replace(OLD, "html.indexOf('const SN_AUDIO = { audio: true, sfx: true, cine: true };')")
# EXPECTED-UPDATE swaps (three more patch85/112/134 locks pinned the pre-ship-25 strings)
SWAPS = [
    ("html.includes('#audioBtn { background: #2a1c08;')", "html.includes('#audioBtn, #cineBtn { background: #2a1c08;')   /* ship #25: CINE shares the AUDIO rule */"),
    ("html.includes(\"HUD_BTNS: ['helpBtn', 'mapBtn', 'audioBtn', 'sfxBtn', 'paceBtn', 'takeoverBtn']\")", "html.includes(\"HUD_BTNS: ['helpBtn', 'mapBtn', 'audioBtn', 'cineBtn', 'sfxBtn', 'paceBtn', 'takeoverBtn']\")   /* ship #25 */"),
    ("html.includes(\"const SN_AUDIO = { audio: true, sfx: true };\")", "html.includes(\"const SN_AUDIO = { audio: true, sfx: true, cine: true };\")   /* ship #25 */"),
]
for old, new in SWAPS:
    assert text.count(old) == 1, old
    text = text.replace(old, new)
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch172 (SHIP #25): cinematics toggle ----
chk('s25 cine: a CINE button sits immediately after the AUDIO button and shares its CSS rule, mobile sizes and the keyboard HUD ring', html.includes('onclick="toggleAudio(event)">AUDIO: ON</button>\n      <button id="cineBtn"') && html.includes('#audioBtn, #cineBtn { background: #2a1c08;') && html.includes('#audioBtn, #cineBtn, #sfxBtn { min-height: 26px;') && html.includes('#audioBtn, #cineBtn, #sfxBtn, #menuBtn { height: 44px;') && html.includes("'audioBtn', 'cineBtn', 'sfxBtn'"), '');
chk('s25 cine (functional): default ON; persisted OFF boots OFF; the audio / SFX boot rules are untouched', (() => { const d = snAudioBoot({}); const o = snAudioBoot({ 'sn.cine': 'off' }); const a = snAudioBoot({ 'sn.sfx': 'on', 'sn.audio': 'on', 'sn.cine': 'on' }); return d.cine === true && o.cine === false && a.cine === true && a.sfx === false && a.audio === true; })(), '');
chk('s25 cine: toggleCine persists under sn.cine like the audio choice, and switching off closes the running cinematic and empties the queue', html.includes("localStorage.setItem('sn.cine', SN_AUDIO.cine ? 'on' : 'off');") && html.includes('if (SN_CINE.state.active) SN_CINE.close(false); SN_CINE.state.queue.length = 0;'), '');
chk('s25 cine: with cinematics off every offer is dropped at the door - no video, no audio graph, no queue', html.includes("!SN_AUDIO.cine) { state.log.push({ key, dur_s: 0, dismissed: false, dropped: 'cinematics_off' }); return; }"), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
