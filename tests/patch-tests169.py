#!/usr/bin/env python3
# patch-tests169 - locks for patch169 (gauge deck vs control sheet). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch169 (controls audit): the auto-expanding gauge deck vs an open control sheet ----
chk('p169: autoExpandDeck never opens the deck while a control sheet is open', html.includes("if (typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop) return;   // patch169"), '');
chk('p169: a deck closed by hand stays closed for the same alarm picture (base-3 alarm code, no allocation)', html.includes('function snAlarmCode()') && html.includes('deckDismissedCode = (!deckExpanded && typeof alarms') && html.includes('if (deckDismissedCode >= 0 && snAlarmCode() === deckDismissedCode) return;'), '');
chk('p169: an all-normal plant re-arms the auto-expand', html.includes('if (hasAlarm) autoExpandDeck(); else deckDismissedCode = -1;'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
