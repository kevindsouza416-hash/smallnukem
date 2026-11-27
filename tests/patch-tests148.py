#!/usr/bin/env python3
# patch-tests148 — test locks for patch148 (ship #24, dwell sheet-open).
#
# Edits tests/value-checks.mjs ONLY. Pattern: anchored exact-count
# insertion (assert count == 1) before the suite's summary line,
# input MD5 pinned, output written only on success.
#
# WHY NO UPDATE TO CHECKS 581/702: A16 predicted 581/702 would need
# updating ONLY if patch148 changed the literal
# 'return this.dwell[key] > 3;'. It did not — patch148 edited allow()'s
# >600 ms reset branch and the drawEquipment dwell branch; the
# threshold literal is byte-identical. Measured on the VM staging
# build (148->149->151): suite 443/443 with the UNMODIFIED suite, and
# 443/443 on the unpatched ship #23 control. So 581/702 stay as-is.
#
# REFRESH (post-amendment): patch148 was amended — Edit 2's single-frame
# latch clear was replaced by a PRESENCE tracker (_nearKey/_nearSince/
# _nearLast, key148) and the fire line gained presence terms
# (_nearKey === key148 && (now148 - _nearSince) > 3000). The string
# locks below pin the AMENDED text; Edit 1 (dwell-reset backstop) is
# byte-identical to v1 and its lock is unchanged.
#
# NEW LOCKS (A16 section 2): functional extract-and-run dwell checks
# in the patch145/patch146 idiom (SN_UNITINFO.allow(item, tNow) takes
# synthetic timestamps, so dwell is driven deterministically), plus
# string locks for the sheet-open latch and its guards (the openPop
# wiring lives in drawEquipment, which the suite's idiom cannot run —
# string locks are the closest faithful form there).
#
# Usage: python3 patch-tests148.py [suite_path] [expected_input_md5]
#   expected defaults to the pristine suite MD5; pass the actual
#   pre-edit MD5 when chaining, or 'none' to skip the pin.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else '5e5214fae9cb2df0b6b4ca377f78ac85'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests148 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch148 (ship #24): dwell > 3 s opens the readings sheet ----
// Functional dwell locks: extract SN_UNITINFO and drive allow(item, t)
// with synthetic timestamps (100 ms frames, the suite's own dt idiom).
const _ui = html.indexOf('const SN_UNITINFO = {');
const _uj = html.indexOf('window.SN_UNITINFO = SN_UNITINFO;', _ui);
function snUnitInfo() {
  return new Function('window', html.slice(_ui, _uj + 'window.SN_UNITINFO = SN_UNITINFO;'.length) + '\nreturn SN_UNITINFO;')({});
}
const _itA = { area: 'a', action: 'x', x: 100 };
const _itB = { area: 'a', action: 'x', x: 200 };
chk('ship24 dwell (functional): closed at <=3 s of continuous presence, open at >3 s', (() => {
  const U = snUnitInfo(); let r = true;
  for (let k = 0; k < 30; k++) r = U.allow(_itA, 10000 + k * 100);   // 3.0 s accumulated
  return r === false && U.allow(_itA, 13000) === true;               // 3.1 s crosses
})(), '');
chk('ship24 dwell (functional): dwell is per-unit — alternating units never sum', (() => {
  const U = snUnitInfo(); let ra = true, rb = true;
  for (let k = 0; k < 40; k++) { const it = k % 2 ? _itB : _itA; const r = U.allow(it, 10000 + k * 100); if (k % 2) rb = r; else ra = r; }
  return ra === false && rb === false;   // 4 s elapsed, each unit only 2.0 s
})(), '');
chk('ship24 dwell (functional): absence >600 ms resets the unit dwell to zero', (() => {
  const U = snUnitInfo();
  for (let k = 0; k < 20; k++) U.allow(_itA, 10000 + k * 100);       // 2.0 s banked
  const r = U.allow(_itA, 12900 + 1000);                             // return after 1 s away
  return r === false && Math.abs(U.dwell['a:x:100'] - 0.1) < 1e-9;
})(), '');
chk('ship24 dwell (functional): a single 5 s timestamp jump cannot open (frame-dt clamp + reset)', (() => {
  const U = snUnitInfo();
  U.allow(_itA, 10000);
  return U.allow(_itA, 15000) === false && U.dwell['a:x:100'] <= 0.1 + 1e-9;
})(), '');
// Sheet-open wiring (drawEquipment — string locks; the draw path is not
// extractable in the suite's idiom): exactly one dwell-driven openPop,
// latched per unit, re-armed on reset and on target change, and gated
// against pop-open / non-playing / cinematic / demo / takeover.
chk('ship24 dwell: the sheet opens exactly once from the dwell branch (single openPop(item) site)', (html.match(/SN_TOUCH\.openPop\(item\)/g) || []).length === 1 && html.includes('SN_TOUCH.openPop(item); }'), '');
chk('ship24 dwell: the dwell-open is latched per unit (_openedKey guard on key148)', html.includes('SN_UNITINFO._openedKey !== key148') && html.includes('SN_UNITINFO._openedKey = key148; SN_TOUCH.openPop(item);'), '');
chk('ship24 dwell: a dwell reset re-arms the latch (Edit 1 backstop)', html.includes('if (this._openedKey === key) this._openedKey = null;'), '');
chk('ship24 dwell: the PRESENCE tracker exists exactly once (key148 / _nearKey / _nearSince / _nearLast)', (html.match(/const key148 = item\.area/g) || []).length === 1 && html.includes('SN_UNITINFO._nearKey = key148; SN_UNITINFO._nearSince = now148;') && html.includes('SN_UNITINFO._nearLast = now148;'), '');
chk('ship24 dwell: absence >600 ms clears presence AND the latch (no flicker re-open, no stale presence)', html.includes('SN_UNITINFO._nearKey = null; SN_UNITINFO._nearSince = 0; if (SN_UNITINFO._openedKey === key148) SN_UNITINFO._openedKey = null;'), '');
chk('ship24 dwell: switching units restarts presence and clears the previous unit latch', html.includes('if (SN_UNITINFO._nearKey !== key148) { if (SN_UNITINFO._openedKey === SN_UNITINFO._nearKey) SN_UNITINFO._openedKey = null;'), '');
chk('ship24 dwell: the fire condition carries the presence terms (>3000 ms at this unit)', html.includes('if (isNear && SN_UNITINFO._nearKey === key148 && (now148 - SN_UNITINFO._nearSince) > 3000 && !SN_TOUCH.pop'), '');
chk('ship24 dwell: sheet never opens during demo/cinematic/takeover, over an open pop, or when not standing at the panel', html.includes("gameState.phase === 'playing'") && html.includes('CINE_ACTIVE') && html.includes('DEMO.active') && html.includes('TAKEOVER.active') && html.includes('SN_UNITINFO._openedKey !== key148'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests148 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
