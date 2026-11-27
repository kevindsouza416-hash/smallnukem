#!/usr/bin/env python3
# patch-tests154 — test locks for patch154 (ship #24, dwell rebuild:
# accumulated pause-not-reset presence, 1200 ms fire, visible radial
# progress). Review: r154-review.md (APPROVE-WITH-NOTES).
#
# Edits tests/value-checks.mjs ONLY. Two parts:
#
#  1. SUPERSEDED patch-tests148 LOCKS — UPDATED HERE. R154 SS4
#     confirmed exactly three patch-tests148 locks fail on a
#     154-carrying build, all legitimate expected-updates (the texts
#     they pin are precisely what patch154 supersedes):
#       - the Edit-1 latch-clear lock (patch-tests148.py line 88),
#       - the >600 ms absence-clear lock (line 90),
#       - the >3000 ms fire-line lock (line 92).
#     Each is replaced in the suite, anchored and count-asserted,
#     with its patch154 successor. NO other patch-tests148 lock is
#     touched (R154 verified all others pass on staging154).
#  2. New patch154 locks (accumulator banking, pres154, the radial
#     fill formula and colours).
#
# Usage: python3 patch-tests154.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests153: pass the post-153 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests154 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)


def swap(old, new, label):
    global text
    n = text.count(old)
    assert n == 1, 'patch-tests154 %s anchor found %d times (need exactly 1)' % (label, n)
    text = text.replace(old, new, 1)
    assert text.count(new) == 1, 'patch-tests154 %s result not unique after replace' % label
    print('applied:', label)


# --- Superseded lock 1 (patch-tests148 line 88): patch154 Edit 1
# removed the latch clear from allow()'s reset branch — under
# pause-not-reset it would re-arm the sheet after any >600 ms absence
# and defeat the deliberate-close rule (R154 SS4, sim S5).
swap(
    """chk('ship24 dwell: a dwell reset re-arms the latch (Edit 1 backstop)', html.includes('if (this._openedKey === key) this._openedKey = null;'), '');""",
    """chk('ship24 dwell (patch154): a dwell reset does NOT clear the latch — the presence tracker owns it; the Edit-1 backstop clear is gone (supersedes the patch148 lock)', html.includes('if (now - (this.at[key] || 0) > 600) this.dwell[key] = 0;') && !html.includes('if (this._openedKey === key) this._openedKey = null;'), '');""",
    '148 lock 88 -> 154: latch clear removed from allow() reset branch')

# --- Superseded lock 2 (patch-tests148 line 90): the >600 ms
# absence-clear is the reset-on-absence behaviour 154 supersedes;
# the full clear now lives only in the >5000 ms expiry branch, with
# the accumulator fields zeroed alongside.
swap(
    """chk('ship24 dwell: absence >600 ms clears presence AND the latch (no flicker re-open, no stale presence)', html.includes('SN_UNITINFO._nearKey = null; SN_UNITINFO._nearSince = 0; if (SN_UNITINFO._openedKey === key148) SN_UNITINFO._openedKey = null;'), '');""",
    """chk('ship24 dwell (patch154): presence fully clears ONLY on >5000 ms absence expiry — tracking, bank, segment, absence and latch zeroed together (supersedes the patch148 >600 ms absence-clear lock)', html.includes('SN_UNITINFO._nearKey = null; SN_UNITINFO._nearSince = 0; SN_UNITINFO._acc154 = 0; SN_UNITINFO._seg154 = null; SN_UNITINFO._away154 = null; if (SN_UNITINFO._openedKey === key148) SN_UNITINFO._openedKey = null;'), '');""",
    '148 lock 90 -> 154: full clear only at the >5000 ms expiry branch')

# --- Superseded lock 3 (patch-tests148 line 92): the >3000 ms fire
# line inside the allow() branch is the superseded 3 s design; 154's
# fire is pres154 >= 1200, outside the allow() branch.
swap(
    """chk('ship24 dwell: the fire condition carries the presence terms (>3000 ms at this unit)', html.includes('if (isNear && SN_UNITINFO._nearKey === key148 && (now148 - SN_UNITINFO._nearSince) > 3000 && !SN_TOUCH.pop'), '');""",
    """chk('ship24 dwell (patch154): the sheet fires at pres154 >= 1200 accumulated presence, latch set before openPop (supersedes the patch148 >3000 ms fire lock)', html.includes('if (pres154 >= 1200 &&') && html.includes('SN_UNITINFO._openedKey = key148; SN_TOUCH.openPop(item); }'), '');""",
    '148 lock 92 -> 154: fire at pres154 >= 1200')

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch154 (ship #24): dwell rebuild — accumulated presence, 1200 ms fire, radial progress ----
chk('ship24 dwell154: presence is banked on the first away frame (pause-not-reset accumulator)', html.includes('SN_UNITINFO._acc154 = (SN_UNITINFO._acc154 || 0) + (now148 - SN_UNITINFO._seg154);'), '');
chk('ship24 dwell154: pres154 is the authoritative presence — bank + live segment for the tracked unit, else 0', html.includes('const pres154 = SN_UNITINFO._nearKey === key148 ? (SN_UNITINFO._acc154 || 0) + (SN_UNITINFO._seg154 != null ? now148 - SN_UNITINFO._seg154 : 0) : 0;'), '');
chk('ship24 dwell154: visible progress starts at the 200 ms onset with fill = clamp((pres154 - 200) / 1000, 0, 1)', html.includes('if (pres154 >= 200) {') && html.includes('const frac154 = Math.min(1, Math.max(0, (pres154 - 200) / 1000))'), '');
chk('ship24 dwell154: the progress ring is panel-blue while filling and hold-green at full', html.includes("frac154 >= 1 ? '#37d67a' : '#5af'"), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests154 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
