#!/usr/bin/env python3
# patch-tests160 — test locks for patch160 (ship #24, trackpad wheel
# fine-adjust). Review: r160-review.md (APPROVE-WITH-NOTES; notes are
# pre-existing/theoretical, none introduced by 160).
#
# Edits tests/value-checks.mjs ONLY. First block of locks asserts the
# five patch128 suite-lock strings are UNCHANGED by the whole ship:
# exact occurrence counts for the four whose counts cannot legit-
# imately move (wheel listener, passive:false, the ctrlKey pinch
# exclusion, pointers.set('pad')), and presence for 'window.SN_PAD'
# — it prefixes SN_PADSTEP / SN_PADSTEP_FINE, so its substring count
# legitimately rises when fine entries are added (A160/R160 SS4);
# the lock is an includes() check and no pre-existing occurrence may
# be removed. Then the NOTCH / fine-channel / momentum-clamp locks.
#
# Usage: python3 patch-tests160.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests158 (159 has no test script — separate
#   lane): pass the post-158 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests160 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch160 (ship #24): wheel fine-adjust + patch128 locks unchanged ----
// The five patch128 lock strings (suite L633-635), asserted with the
// counts measured on ship #23 and re-verified on the composed build:
// patch160 must not have moved any of them.
chk('ship24 wheel128: wheel listener count unchanged (1)', (html.match(/addEventListener\('wheel'/g) || []).length === 1, '');
chk('ship24 wheel128: passive: false count unchanged (1)', (html.match(/passive: false/g) || []).length === 1, '');
chk('ship24 wheel128: ctrlKey pinch exclusion count unchanged (1)', (html.match(/if \(e\.ctrlKey\) return;/g) || []).length === 1, '');
chk("ship24 wheel128: pointers.set('pad' count unchanged (2)", (html.match(/pointers\.set\('pad'/g) || []).length === 2, '');
chk('ship24 wheel128: window.SN_PAD still present (prefix of SN_PADSTEP_FINE — count may rise, never fall)', html.includes('window.SN_PAD'), '');
chk('ship24 wheel: one notch is 40 px — const NOTCH = 40 drives the panel accumulation loop', html.includes('const NOTCH = 40;') && html.includes('acc -= Math.sign(acc) * NOTCH;'), '');
chk('ship24 wheel: momentum clamp — at most 2 steps per wheel event', html.includes('while (Math.abs(acc) >= NOTCH && steps160 < 2) {'), '');
chk('ship24 wheel: the carried remainder is clamped to one notch after each event', html.includes('acc = Math.max(-NOTCH, Math.min(NOTCH, acc));'), '');
chk('ship24 wheel: analog sheets step FINE — call order padStepFine, then SN_PADSTEP_FINE, coarse pair only as fallback', html.includes('SN_WASD.padStepFine(padPop.action, dir);') && html.includes('else if (window.SN_PADSTEP_FINE) window.SN_PADSTEP_FINE(padPop.action, dir);'), '');
chk('ship24 wheel: the standalone fine entry is GUARDED — it defers to a 159-provided SN_PADSTEP_FINE', html.includes('if (!window.SN_PADSTEP_FINE) window.SN_PADSTEP_FINE = function (a, dir) {'), '');
chk('ship24 wheel: non-analog sheets get no wheel step at all (STEPPERS gate)', html.includes('SN_WASD.STEPPERS[padPop.action])) return;'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests160 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
