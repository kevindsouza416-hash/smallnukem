#!/usr/bin/env python3
# patch-tests168 - locks for patch168 (fine step may leave a detent). Edits tests/value-checks.mjs only.
# EXPECTED-UPDATE (superseded behaviour, rewritten in place): the ship24 padStepFine lock pinned the
# exact pre-168 line 'const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)));'.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
OLD = "html.includes('const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)));')"
NEW = "html.includes('const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)), abs != null ? null : cur);')   /* patch168: origin passed so a fine step can leave a detent */"
assert text.count(OLD) == 1
text = text.replace(OLD, NEW, 1)
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch168 (controls audit): fine step vs detent ----
{
  // Re-evaluate the game's own snapTarget / padStepFine logic in isolation (extracted from the source text).
  const m = html.match(/const SNAP159 = [^\n]+\n[\s\S]*?const SNAP_WIN159 = 2;[^\n]*\n\s*function snapTarget\(a, v, from\) \{[\s\S]*?\n  \}/);
  chk('p168: snapTarget(a, v, from) is present with the SNAP159 table and window', !!m, '');
  if (m) {
    const snap = new Function(m[0].replace(/\/\/[^\n]*/g, '') + '\nreturn snapTarget;')();
    const fine = (a, cur, d) => snap(a, Math.max(0, Math.min(100, cur + d)), cur);
    chk('p168: from the 0 detent a +1 fine step leaves 0 (it used to snap back to 0 forever)', fine('rod_withdraw', 0, 1) === 1);
    chk('p168: from the 100 detent a -1 fine step leaves 100', fine('rod_withdraw', 100, -1) === 99 && fine('steam_valve', 100, -1) === 99);
    chk('p168: from the 39 band-edge detent both fine directions leave it', fine('rod_withdraw', 39, 1) === 40 && fine('rod_withdraw', 39, -1) === 38);
    chk('p168: the magnet still works - arriving within the window from outside snaps onto the detent', fine('rod_withdraw', 37, 1) === 39 && fine('rod_withdraw', 22, -1) === 20 && fine('raise_power', 94, 1) === 95);
    chk('p168: coarse / release snaps (no origin) are unchanged', snap('rod_withdraw', 20.7) === 20 && snap('rod_withdraw', 22) === 22 && snap('rod_withdraw', 1.9) === 0);
    let v = 0; for (let k = 0; k < 40; k++) v = fine('rod_withdraw', v, 1);
    chk('p168: forty +1 fine steps from 0 travel the whole way to 40 (magnet jumps at most 2 once per detent)', v >= 40, 'reached ' + v);
  }
}
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
