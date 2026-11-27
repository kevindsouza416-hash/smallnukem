#!/usr/bin/env python3
# patch-tests157 — test locks for patch157 (ship #24, segmented touch
# movement zone). Review: r157-review.md (APPROVE-WITH-NOTES; the
# notes are wording/scope, geometry is D0's prescribed rects).
#
# Edits tests/value-checks.mjs ONLY. Locks follow A157's suggested
# set: zoneSectorAt on the SN_TOUCH exports, the pointermove re-route
# branch, overlayBtns absent — plus the down() routing and the zone
# geometry constants (R157: the small climb height sits exactly at
# the 48 dp floor, so the rect constants are worth pinning).
#
# Usage: python3 patch-tests157.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests156: pass the post-156 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests157 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch157 (ship #24): segmented touch movement zone ----
chk('ship24 touchzone: SN_TOUCH.down routes through zoneSectorAt (same ovl:<id> role strings as the old circles)', html.includes('const btn = zoneSectorAt(x, y);'), '');
chk('ship24 touchzone: the zone functions are exported on SN_TOUCH', html.includes('drawSheet, drawOverlay, zoneSectorAt, zoneRects, zoneInDeadStrip, openPop,'), '');
chk('ship24 touchzone: pointermove re-routes ovl:* pointers by LIVE sector, with the 12 px dead strip at the split', html.includes("if (p.role.startsWith('ovl:')) {") && html.includes('SN_TOUCH.zoneInDeadStrip(fx * W, fy * H)'), '');
chk('ship24 touchzone: the old per-circle overlayBtns() is gone (one zone surface, not separate circles)', !html.includes('function overlayBtns()'), '');
chk('ship24 touchzone: zone geometry constants — small move 188x96 bottom-left, small climb 188x96 bottom-right (climb sector height exactly 48, the floor)', html.includes("{ kind: 'move', x: 8, y: H - 104, w: 188, h: 96 }") && html.includes("{ kind: 'climb', x: W - 196, y: H - 104, w: 188, h: 96 }"), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests157 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
