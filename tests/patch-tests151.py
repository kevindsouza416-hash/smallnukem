#!/usr/bin/env python3
# patch-tests151 — test locks for patch151 (ship #24, hold-input sync).
#
# Edits tests/value-checks.mjs ONLY. No existing check covers
# syncPointerInput() in the tRole branches (grep: 0 hits), so these
# are new string locks, scoped to each branch's exact patched line —
# the live pointerdown handler and its buffered-replay twin
# snxReplayDown() must BOTH sync at press time.
#
# Usage: python3 patch-tests151.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests149: pass the post-149 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests151 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch151 (ship #24): press-time input sync in both tRole branches ----
chk('ship24 hold: live pointerdown tRole branch syncs input at press time', html.includes('if (tRole) { pointers.set(e.pointerId, { role: tRole, startY: e.clientY, startX: e.clientX, dir: 0, t: performance.now() }); syncPointerInput();'), '');
chk('ship24 hold: snxReplayDown tRole branch syncs input at press time (replay twin)', html.includes('if (tRole) { pointers.set(q.id, { role: tRole, startY: 0, startX: 0, dir: 0, t: performance.now() }); syncPointerInput();'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests151 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
