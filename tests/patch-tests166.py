#!/usr/bin/env python3
# patch-tests166 - locks for patch166 (title keys + cleanup). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch166 (controls audit): title-screen keys + dead code ----
chk('p166 B1: on the title screen a focused button owns Enter/Space (the generic start key only fires with nothing focused)', html.includes("const btn166 = e && e.target && e.target.closest ? e.target.closest('button') : null;") && html.includes("if (btn166) { if (code === 'Space') btn166.click(); }") && html.includes('else startGame();'), '');
chk('p166 C1: dead KEYBOARD TRACK listeners, the empty interact-once branch and the unused gpJump are gone', !html.includes('KeyE_keyboard') && !html.includes('KeyQ_keyboard') && !html.includes('KeyE_held') && !html.includes('gpJump'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
