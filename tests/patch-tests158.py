#!/usr/bin/env python3
# patch-tests158 — test locks for patch158 (ship #24, Interact-press
# = primary panel-open path). Review: r158-review.md (APPROVE-WITH-
# NOTES; the composition dedupe is handled at the patch level, not
# here). Scoping: d0-controls-scoping.md SS158.
#
# Edits tests/value-checks.mjs ONLY. Two parts:
#
#  1. SUPERSEDED patch90 LOCK — UPDATED HERE. The pristine suite's
#     L472 pins the exact pre-158 hide line; patch158 supersedes
#     that line BY DESIGN (D0 SS158 prescribes the replacement:
#     "string lock on the compound condition"). R158 SS5 reproduced
#     the single failure (442/1 on staging158, 443/443 control) and
#     verified the replacement literal verbatim, exactly once. The
#     other patch90 locks (L471 CSS, L473 per-prompt key) are NOT
#     touched — they still pass.
#  2. New patch158 locks: the hide exemption, the opacity settling,
#     the INPUT.interactPulse write, and the _openedKey B11 guard
#     (a deliberate Interact-open must latch the dwell path out, so
#     a close at banked presence >= 1200 ms cannot dwell-re-open).
#
# Usage: python3 patch-tests158.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests157: pass the post-157 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests158 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

# --- The one legitimate suite update (A158/R158): L472's patch90
# hide-line lock is replaced by the compound-condition lock.
OLD472 = r"""chk('patch90: a prompt fades away at ~2 s and stays gone for that prompt', html.includes('if (actAge >= 2) { ab.style.display = \'none\'; return; }'), '');"""
NEW472 = """chk('patch158: a prompt fades away at ~2 s and stays gone for that prompt — EXCEPT the at-panel OPEN prompt, which stays pressable (supersedes the patch90 lock)', html.includes("if (actAge >= 2 && !(mode === 'open' && player.interactTarget)) { ab.style.display = 'none'; return; }"), '');"""
n = text.count(OLD472)
assert n == 1, 'patch-tests158 L472 anchor found %d times (need exactly 1)' % n
text = text.replace(OLD472, NEW472, 1)
assert text.count(NEW472) == 1, 'patch-tests158 L472 result not unique after replace'
print('applied: L472 patch90 hide lock updated to the patch158 compound condition')

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch158 (ship #24): Interact-press is the primary panel-open path ----
chk('ship24 interact: the patch90 2 s hide exempts ONLY the at-panel OPEN prompt (CLIMB/WALK keep their 2 s life)', html.includes("if (actAge >= 2 && !(mode === 'open' && player.interactTarget)) { ab.style.display = 'none'; return; }"), '');
chk('ship24 interact: the exempt OPEN prompt settles at opacity 0.9 instead of fading through 0', html.includes("(mode === 'open' && player.interactTarget)) ? '0.9'"), '');
chk('ship24 interact: the press names the verb in the action layer (INPUT.interactPulse, 156 field)', html.includes('INPUT.interactPulse = true;'), '');
chk('ship24 interact: the press sets the 148/154 dwell latch for the pressed unit (B11 guard — a deliberate close cannot dwell-re-open)', html.includes("SN_UNITINFO._openedKey = player.interactTarget.area + ':' + player.interactTarget.action + ':' + Math.round(player.interactTarget.x);"), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests158 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
