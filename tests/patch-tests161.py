#!/usr/bin/env python3
# patch-tests161 - locks for patch161 (input hygiene). Edits tests/value-checks.mjs only.
# Usage: python3 tests/patch-tests161.py [suite_path]
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch161 (controls audit): input hygiene ----
chk('p161 D1: snReleaseAllInput clears keys, KB, latches, WASD held map, pointers, gamepad holds', html.includes('function snReleaseAllInput() {') && html.includes('for (const k in KB) KB[k] = false;') && html.includes('for (const k in SN_WASD.held) SN_WASD.held[k] = false;') && html.includes('pointers.clear();') && html.includes('GP.holdE = GP.holdQ = false;'), '');
chk('p161 D1: wired to window blur, pagehide and a hidden visibilitychange', html.includes("window.addEventListener('blur', snReleaseAllInput);") && html.includes("window.addEventListener('pagehide', snReleaseAllInput);") && html.includes("document.addEventListener('visibilitychange', () => { if (document.hidden) snReleaseAllInput(); });"), '');
chk('p161 D1: a panel grab is released through SN_TOUCH.up (snap-on-release still runs)', html.includes("if (p.role === 'pop') { try { SN_TOUCH.up(id); } catch (e) {} }"), '');
chk('p161 D2: a key skips the startup splash, shortcuts / bare modifiers excepted', html.includes("window.addEventListener('keydown', endKey, true);") && html.includes('e.ctrlKey || e.metaKey || e.altKey'), '');
chk('p161 D3: both canvas pointerdown listeners ignore non-primary mouse buttons (2 guards)', (html.match(/if \(e\.pointerType === 'mouse' && e\.button !== 0\) return;/g) || []).length === 2, '');
chk('p161 D4: mergeInput scans KB / KB_LATCH without Object.values allocations', !html.includes('Object.values(KB)') && html.includes('let phys161 = false;'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests161 applied')
