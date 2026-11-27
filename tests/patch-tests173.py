#!/usr/bin/env python3
# patch-tests173 - locks for patch173 (SHIP #25: Chief icon). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch173 (SHIP #25): the Chief icon ----
chk('s25 icon: the Chief icon is ~30% larger (24 -> 31 px, phone 20 -> 26 px) on a 40 px bitmap', html.includes('#guideBarCollapsed canvas { width: 31px; height: 31px;') && html.includes('#guideBarCollapsed canvas { width: 26px; height: 26px; }') && html.includes('<canvas id="portraitMini" width="40" height="40"></canvas>'), '');
chk('s25 icon: image only - the icon element carries no text, label or title', /<canvas id="portraitMini"[^>]*><\/canvas>/.test(html) && !/<canvas id="portraitMini"[^>]*(title|aria-label|alt)=/.test(html), '');
chk('s25 icon: the frame mirrors the SHOW follow state (green following / red stopped); it adds no press-and-hold or long-press handler', html.includes("ic173.classList.toggle('follow-on'") && !/portraitMini[^\n]*(long|hold|contextmenu)/i.test(html.slice(html.indexOf('#guideBarCollapsed canvas { width: 31px'), html.indexOf('#guideBarCollapsed canvas { width: 31px') + 600)), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
