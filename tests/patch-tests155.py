#!/usr/bin/env python3
# patch-tests155 — test locks for patch155 (ship #24, freeze-while-
# adjusting, AMENDED version #2 — staging MD5
# 8b660cafe4b10debbe6052ed6d1efbe0). Review: r155-review.md +
# delta re-review (APPROVE; the note-1 per-run-reset amendment is
# part of the patch and is locked here) + F3 freeze×scoring audit
# (amendment #2).
#
# v2 (T155U currency check vs amendment #2): amendment #1's flat
# reset in snxRestore was REPLACED by a value-aware restore that
# applies the snapshot's captured freeze record, and snxSnapshot
# now captures {used, heldSec} as `fz`. The v1 lock pinning the
# flat-reset statement at EXACTLY TWICE therefore went stale
# (measured count on amendment-#2 staging: 1, not 2 — it was the
# ONLY stale lock of the 8; the other 7 pass unchanged). v2:
#   * keeps the 7 still-valid locks byte-identical;
#   * replaces the stale count lock with (a) a count lock pinning
#     the flat reset at EXACTLY ONCE (snxResetRun only — a fresh
#     run has no snapshot) and (b) a string lock on the exact
#     value-aware restore line in snxRestore;
#   * ADDS a lock for the snapshot capture (site 10): snxSnapshot
#     carries `fz: { used: SN_FREEZE.used, heldSec: SN_FREEZE.heldSec }`.
# Net locks in this block: 10 (was 8).
#
# Edits tests/value-checks.mjs ONLY. String locks in the suite's
# idiom.
#
# Usage: python3 patch-tests155.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests154: pass the post-154 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests155 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch155 (ship #24): freeze-while-adjusting, L3 grid emergency (amended #2) ----
chk('ship24 freeze: the SN_FREEZE record exists (active / used / heldSec)', html.includes('const SN_FREEZE = { active: false, used: false, heldSec: 0 };'), '');
chk('ship24 freeze: the emergency window is L3 grid phase, no scram, turbine event warning or trip in progress', html.includes("gameState.level === 3 && gameState.phase === 'playing' && S.phase === 'grid' && !S.scram") && html.includes('(S.ev.tu === 1 || S.ev.tu === 2)'), '');
chk('ship24 freeze: DEMO and TAKEOVER hands never freeze the sim', html.includes("if (typeof DEMO !== 'undefined' && DEMO.active) return false;") && html.includes("if (typeof TAKEOVER !== 'undefined' && TAKEOVER.active) return false;"), '');
chk('ship24 freeze: the sheet pop getter exposes tgt — a committed target still travelling holds the freeze', html.includes('tgt: (pop.target.lever != null || pop.target.bypass != null)'), '');
chk('ship24 freeze: gameLoop skips the sim feed while frozen', html.includes('if (!SN_FREEZE.active) updatePhysics(simDt, true);'), '');
chk('ship24 freeze: the run clock is held too — elapsedSec does not advance while frozen', html.includes('if (!SN_FREEZE.active) gameState.elapsedSec += dt;'), '');
chk('ship24 freeze: the player is told time is held (TIME HELD pill)', html.includes('id="fzPill"') && html.includes("fp.textContent = 'TIME HELD"), '');
chk('ship24 freeze (F3 amendment #2): the flat per-run SN_FREEZE reset occurs EXACTLY ONCE (snxResetRun only — snxRestore is value-aware, not a flat reset)', (html.match(/SN_FREEZE\.active = false; SN_FREEZE\.used = false; SN_FREEZE\.heldSec = 0;/g) || []).length === 1, '');
chk('ship24 freeze (F3 amendment #2): snxRestore applies the snapshot freeze record (value-aware restore, not a flat reset)', html.includes('SN_FREEZE.active = false; SN_FREEZE.used = !!(c.fz && c.fz.used); SN_FREEZE.heldSec = (c.fz && c.fz.heldSec) || 0;'), '');
chk('ship24 freeze (F3 amendment #2): snxSnapshot captures the freeze record (fz carries used / heldSec)', html.includes('fz: { used: SN_FREEZE.used, heldSec: SN_FREEZE.heldSec }'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests155 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
