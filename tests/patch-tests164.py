#!/usr/bin/env python3
# patch-tests164 - locks for patch164 (landscape guide overlay). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch164 (controls audit): landscape phones ----
chk('p164: short-landscape CSS floats the popped Chief panel over the world (absolute, not in-flow)', html.includes('#guideBarExpanded { position: absolute; left: 0; right: 0; top: 100%; z-index: 40; max-height: 46vh;'), '');
chk('p164: layoutTopBars parks the overlay below the step bar and clears the inline top outside landscape', html.includes("(orientation: landscape) and (max-height: 500px)').matches;") && html.includes("sb.getBoundingClientRect().bottom - gb.getBoundingClientRect().top") && html.includes(": '';"), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
