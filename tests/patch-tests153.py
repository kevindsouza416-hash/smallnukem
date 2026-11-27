#!/usr/bin/env python3
# patch-tests153 — test locks for patch153 (ship #24, keyboard dual
# families + press latch). Review: r153-review.md (APPROVE-WITH-
# NOTES). B12's suite-lock analysis, verified verbatim by R153 SS5:
# exactly ONE existing suite literal changes presence under patch153
# — the patch119 held-map literal at value-checks.mjs L595. This
# script performs that one legitimate expected-update (anchored,
# count-asserted) and adds the new patch153 locks.
#
# Usage: python3 patch-tests153.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests152: pass the post-152 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests153 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

# --- The one legitimate suite update (B12/R153): patch119's held-map
# literal gains the arrow family (dual keyboard defaults). The lock's
# intent is preserved and extended; its second clause ('this.held[')
# is untouched.
OLD595 = """chk('patch119: SN_WASD reads its own held map (freezeKeys cannot erase a hold)', html.includes('held: { KeyW: false, KeyA: false, KeyS: false, KeyD: false }') && html.includes('this.held['), '');"""
NEW595 = """chk('patch119: SN_WASD reads its own held map (freezeKeys cannot erase a hold)', html.includes('held: { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }') && html.includes('this.held['), '');   // patch153 expected-update (B12/R153): the held map now carries the arrow family too — dual keyboard defaults"""
n = text.count(OLD595)
assert n == 1, 'patch-tests153 L595 anchor found %d times (need exactly 1)' % n
text = text.replace(OLD595, NEW595, 1)
assert text.count(NEW595) == 1, 'patch-tests153 L595 result not unique after replace'
print('applied: L595 patch119 held-map literal updated to the dual-family map')

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch153 (ship #24): dual keyboard families + 170 ms press latch ----
chk('ship24 keyboard: the KB latch map exists and every keydown stamps it +170 ms (the padHold idiom)', html.includes('const KB_LATCH = {};') && html.includes('KB_LATCH[e.code] = performance.now() + 170;'), '');
chk('ship24 keyboard: SN_WASD held map carries its own latch and kbHeld() reads held OR unexpired latch', html.includes('heldLatch: {},') && html.includes('kbHeld(c) { return !!(this.held[c] || (this.heldLatch[c] || 0) > performance.now()); }'), '');
chk('ship24 keyboard: mergeInput composes keys from KB + latch (kbEff153), WASD levels included', html.includes('const kbEff153 = c => !!(KB[c] || (KB_LATCH[c] || 0) > kbNow153);') && html.includes("keys['KeyW'] = kbEff153('KeyW');"), '');
chk('ship24 keyboard: the panel engagement rule is pop.grab OR panelFocus primary (153/B12, pre-existing flags)', html.includes("const engaged153 = !!pop.grab || this.panelFocus === 'primary';"), '');
chk('ship24 keyboard: HUD branch — ArrowUp/Down navigate and exit exactly as KeyW/KeyS', html.includes("if (jp['KeyW'] || jp['ArrowUp']) this.setHudFocus((this.hudIdx + n - 1) % n);") && html.includes("if (jp['KeyS'] || jp['ArrowDown']) { if (this.hudIdx === n - 1) { this.setHudFocus(-1); this.freezeKeys(); return; }"), '');
chk('ship24 keyboard: world bump-open fires on ArrowLeft/Right exactly as KeyA/KeyD', html.includes("jp['KeyA'] || jp['KeyD'] || jp['ArrowLeft'] || jp['ArrowRight']) && typeof SN_TOUCH !== 'undefined'"), '');
chk('ship24 keyboard: preventDefault armour covers Arrow*/Space only, and never a modified shortcut', html.includes("if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.code === 'Space' || e.code.startsWith('Arrow'))) e.preventDefault();"), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests153 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
