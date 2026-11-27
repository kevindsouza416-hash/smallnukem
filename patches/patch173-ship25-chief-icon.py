#!/usr/bin/env python3
"""patch173 - SHIP #25 change 3: the Chief icon, image only and ~30% larger.

The top-left Chief icon (the mini portrait in the collapsed guide bar) grows ~30% (24 -> 31 CSS px
desktop, 20 -> 26 px phone; the bitmap is raised 24 -> 40 px so it stays crisp) and carries no text
or label of any kind - it is the TV image only (the caption stays beside it, as the bar's own text).
The icon now also mirrors the SHOW follow state with its frame (green = following, red = stopped),
the same colour language as the SHOW button; it remains a plain tap target - no press-and-hold, no
long-press summon (AGENTS.md section 4.4).  Physics untouched.
"""
from _patchlib import apply
BASE = '1ad66a44360264126c068843d72e98b8'   # patch172 output
E = []
E.append(("""#guideBarCollapsed canvas { width: 24px; height: 24px; border-radius: 3px; border: 1px solid #3a2810; flex-shrink: 0; }""",
"""#guideBarCollapsed canvas { width: 31px; height: 31px; border-radius: 3px; border: 1px solid #3a2810; flex-shrink: 0; }   /* patch173 (ship #25): ~30% larger (was 24 px) */
#guideBarCollapsed canvas.follow-on { border-color: #37d67a; box-shadow: 0 0 5px rgba(55,214,122,0.6); }   /* patch173: frame mirrors the SHOW follow state, green = following */
#guideBarCollapsed canvas.follow-off { border-color: #e5484d; }   /* red = stopped */"""))
E.append(("""  #guideBarCollapsed canvas { width: 20px; height: 20px; }""",
"""  #guideBarCollapsed canvas { width: 26px; height: 26px; }   /* patch173: ~30% larger (was 20 px) */"""))
E.append(("""      <canvas id="portraitMini" width="24" height="24"></canvas>""",
"""      <canvas id="portraitMini" width="40" height="40"></canvas>"""))
E.append(("""  const x = c.getContext('2d');
  x.clearRect(0, 0, 24, 24);""",
"""  const x = c.getContext('2d');
  x.setTransform(c.width / 24, 0, 0, c.height / 24, 0, 0);   // patch173: the fallback face is drawn on a 24-unit grid; the bitmap is now 40 px
  x.clearRect(0, 0, 24, 24);"""))
E.append(("""  b.classList.toggle('follow-off', !!SN_HELP.showStopped && !SN_HELP.showFollow);""",
"""  b.classList.toggle('follow-off', !!SN_HELP.showStopped && !SN_HELP.showFollow);
  const ic173 = document.getElementById('portraitMini');   // patch173: the Chief icon's frame mirrors the follow state
  if (ic173) { ic173.classList.toggle('follow-on', !!SN_HELP.showFollow); ic173.classList.toggle('follow-off', !!SN_HELP.showStopped && !SN_HELP.showFollow); }"""))
# top-bar fit: the extra CINE button must not squeeze the caption to nothing on phones
E.append(("""  #audioBtn, #cineBtn, #sfxBtn, #menuBtn { height: 44px; min-height: 44px; font-size: 13px; }""",
"""  #audioBtn, #cineBtn, #sfxBtn, #menuBtn { height: 44px; min-height: 44px; font-size: 12px; padding: 0 5px; }   /* patch173: tighter so the CINE button leaves the caption room */"""))
apply(173, BASE, E)
