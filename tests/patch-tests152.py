#!/usr/bin/env python3
# patch-tests152 — test locks for patch152 (ship #24, camera fit
# guarantee, approach state). Review: r152-review.md (APPROVE-WITH-
# NOTES; Note 1 is REDUCED-inertness wording only, no code change).
#
# Edits tests/value-checks.mjs ONLY. Pattern: anchored exact-count
# insertion before the suite's summary line, input MD5 pinned.
# String locks in the suite's idiom — updateZoomCamera is not
# extractable in the suite's extract-and-run style.
#
# The centrepiece lock is the span-overflow REFIT line itself
# (fit152 < Z.zHold glide-down): if the approach refit is removed,
# that lock fails. The floor-exit, the approach-only goal clamp, and
# the popOpen (operate) exclusion are locked alongside it.
#
# Usage: python3 patch-tests152.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests151: pass the post-151 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests152 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch152 (ship #24): camera fit guarantee in approach ----
chk('ship24 camera: approach span is recomputed from the CURRENT Fluke-panel span each frame', html.includes('const spanX152 = dist + tgt.w / 2 + p.w / 2 + 56;') && html.includes('const spanY152 = Math.abs(tcy - pcy) + tgt.h / 2 + p.h / 2 + 56;'), '');
chk('ship24 camera: the approach REFIT glides the captured hold DOWN to the current-span fit, monotonic (removing the refit breaks this lock)', html.includes('const fit152 = snFitZ(maxZ, spanX152, spanY152); if (fit152 < Z.zHold) Z.zHold = fit152;'), '');
chk('ship24 camera: a span that cannot fit even at the MIN_FIT floor exits approach to wide', html.includes('if (spanX152 > W / SN_ZOOM.MIN_FIT || spanY152 > H / SN_ZOOM.MIN_FIT) exit152 = true;') && html.includes("if (exit152) { Z.state = 'wide'; Z.holdTgt = null; }"), '');
chk('ship24 camera: the refit/floor-exit never runs while a pop is open (operate keeps its captured zoom dead steady)', html.includes('let exit152 = false;') && html.includes('if (!popOpen) {'), '');
chk('ship24 camera: the focus-goal safety clamp exists, approach ONLY, bounds tightened by half sprite + lag allowance', html.includes("if (Z.state === 'approach') {") && html.includes('const limX152 = Math.max(0, vw * 0.48 - p.w / 2 - Math.abs(p.vx || 0) / rate);') && html.includes('gx = Math.max(pcx - limX152, Math.min(pcx + limX152, gx));'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests152 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
