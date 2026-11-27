#!/usr/bin/env python3
"""patch164 - landscape phones: the Chief's popped panel no longer crushes the world.

Found by the viewport sweep (docs/AUDIT-2026-11-27.md): at 844x390 / 667x375 /
740x360 the Chief's window pops open (in-flow) every time he speaks and leaves the
world canvas 50 / 35 / 20 px tall - unplayable for the ~8 s of each line.  In
short landscape the expanded panel is now an overlay anchored just under the step
bar, so the world keeps the height it has with the panel collapsed (207 px at
844x390).  Portrait and desktop CSS / JS paths are unchanged.
"""
from _patchlib import apply
BASE = 'b64de3302821b131bad5d6c0fe5c9946'   # patch163 output
E = []
E.append(("""  #stepBar { margin-top: 6px; flex-wrap: nowrap; }
  #stepBar #stepChip { flex: 1 1 auto; }
  #guideNextBtn { flex: 1 1 auto; }
}""",
"""  #stepBar { margin-top: 6px; flex-wrap: nowrap; }
  #stepBar #stepChip { flex: 1 1 auto; }
  #guideNextBtn { flex: 1 1 auto; }
  /* patch164: the popped Chief panel floats over the world instead of pushing it down (top is set by layoutTopBars to clear the step bar) */
  #guideBarExpanded { position: absolute; left: 0; right: 0; top: 100%; z-index: 40; max-height: 46vh; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.55); }
}"""))
E.append(("""  snx.style.top = top + 'px';
  // #stepBar is in-flow (static): it clears the pill via its CSS margin.""",
"""  snx.style.top = top + 'px';
  // patch164: short landscape - the expanded guide panel is an overlay (CSS); park it just below the step bar
  if (ge) {
    const land164 = window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
    ge.style.top = (land164 && gb && sb && sb.offsetParent) ? Math.max(0, sb.getBoundingClientRect().bottom - gb.getBoundingClientRect().top) + 'px' : '';
  }
  // #stepBar is in-flow (static): it clears the pill via its CSS margin."""))
apply(164, BASE, E)
