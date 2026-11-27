#!/usr/bin/env python3
"""patch172 - SHIP #25 change 2: the cinematics on/off toggle.

A CINE: ON/OFF button sits immediately beside the AUDIO button, same style and size (it shares the
AUDIO button's CSS rules and the keyboard HUD-focus ring).  OFF: every cinematic offer is dropped at
the door - no video, no cinematic audio, no queue, nothing interrupts the audio bed; an active one is
closed when the player switches it off.  ON (default): cinematics play exactly as before.  Persisted
like the audio choice (localStorage 'sn.cine', default on).  Physics untouched.
"""
from _patchlib import apply
BASE = 'a0d528ac2db01f982ed547936c85aa96'   # patch171 output
E = []
E.append(("""#audioBtn { background: #2a1c08;""", """#audioBtn, #cineBtn { background: #2a1c08;"""))
E.append(("""  #audioBtn, #sfxBtn { min-height: 26px; font-size: 11px; padding: 2px 5px; }""",
          """  #audioBtn, #cineBtn, #sfxBtn { min-height: 26px; font-size: 11px; padding: 2px 5px; }"""))
E.append(("""  #audioBtn, #sfxBtn, #menuBtn { height: 44px; min-height: 44px; font-size: 13px; }""",
          """  #audioBtn, #cineBtn, #sfxBtn, #menuBtn { height: 44px; min-height: 44px; font-size: 13px; }"""))
E.append(("""      <button id="audioBtn" onpointerdown="event.stopPropagation()" onclick="toggleAudio(event)">AUDIO: ON</button>
""", """      <button id="audioBtn" onpointerdown="event.stopPropagation()" onclick="toggleAudio(event)">AUDIO: ON</button>
      <button id="cineBtn" onpointerdown="event.stopPropagation()" onclick="toggleCine(event)" title="Cinematics: the short achievement videos">CINE: ON</button>
"""))
E.append(("""  HUD_BTNS: ['helpBtn', 'mapBtn', 'audioBtn', 'sfxBtn', 'paceBtn', 'takeoverBtn'],""",
          """  HUD_BTNS: ['helpBtn', 'mapBtn', 'audioBtn', 'cineBtn', 'sfxBtn', 'paceBtn', 'takeoverBtn'],"""))
E.append(("""const SN_AUDIO = { audio: true, sfx: true };
try {
  SN_AUDIO.audio = localStorage.getItem('sn.audio') !== 'off';""",
"""const SN_AUDIO = { audio: true, sfx: true, cine: true };   // patch172: cine = cinematics on/off (default on)
try {
  SN_AUDIO.audio = localStorage.getItem('sn.audio') !== 'off';
  SN_AUDIO.cine = localStorage.getItem('sn.cine') !== 'off';   // patch172: persisted the way the audio choice is"""))
E.append(("""  if (s) s.textContent = 'SFX: ' + (SN_AUDIO.sfx ? 'ON' : 'OFF');
}""",
"""  if (s) s.textContent = 'SFX: ' + (SN_AUDIO.sfx ? 'ON' : 'OFF');
  const c = document.getElementById('cineBtn'); if (c) c.textContent = 'CINE: ' + (SN_AUDIO.cine ? 'ON' : 'OFF');   // patch172
}
function toggleCine(ev) {   // patch172 (ship #25): CINE = the achievement / recovery cinematics, video and sound
  if (ev) ev.stopPropagation();
  SN_AUDIO.cine = !SN_AUDIO.cine;
  try { localStorage.setItem('sn.cine', SN_AUDIO.cine ? 'on' : 'off'); } catch (e) {}
  if (!SN_AUDIO.cine) { try { if (SN_CINE.state.active) SN_CINE.close(false); SN_CINE.state.queue.length = 0; } catch (e) {} }   // switching off closes the running one and empties the queue
  snSyncAudioBtns();
}"""))
E.append(("""    const def = DEFS[key]; if (!def) return;
    if (typeof gameState !== 'undefined' && gameState.phase === 'scored')""",
"""    const def = DEFS[key]; if (!def) return;
    if (typeof SN_AUDIO !== 'undefined' && !SN_AUDIO.cine) { state.log.push({ key, dur_s: 0, dismissed: false, dropped: 'cinematics_off' }); return; }   // patch172: cinematics OFF - skipped entirely, no video, no audio
    if (typeof gameState !== 'undefined' && gameState.phase === 'scored')"""))
apply(172, BASE, E)
