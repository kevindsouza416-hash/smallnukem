#!/usr/bin/env python3
# patch-tests174 - locks for patch174 (driver stand position). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch174 (SHIP #25 follow-up): the driver stands where the pinned panel is the nearest interactable ----
chk('p174: snStandX picks a stand position at which the pinned panel wins the game\'s nearest-interactable rule (hypot of centres, < 80)', html.includes('function snStandX(pin, side) {') && html.includes('Math.hypot(it.x + it.w / 2 - sx, it.y + it.h / 2 - py) <= d0') && html.includes('if (d0 >= 80) return false;'), '');
chk('p174: guideTick uses it instead of the fixed +/-56 px offset', html.includes('SHOWME.flukeStandX = snStandX(pin,') && !html.includes('? 56 : -56);'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
