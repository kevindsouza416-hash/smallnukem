#!/usr/bin/env python3
# patch-tests163 - locks for patch163 (gamepad D-pad climb, no jump while operating). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch163 (controls audit): movement input ----
chk('p163 G1: the gamepad stick axis is OR-ed into gpUp/gpDown (it used to overwrite the D-pad)', html.includes('if (gp.axes[1] < -0.5) gpUp = true;') && html.includes('if (gp.axes[1] > 0.5) gpDown = true;') && !html.includes('gpUp = gp.axes[1] < -0.5;'), '');
chk('p163 J1: Space / gamepad A jump only when no sheet is open and no interact target', html.includes('const operating163 = !!(SN_TOUCH.pop || p.interactTarget);') && html.includes("(keys['Space'] && !operating163)"), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
