#!/usr/bin/env python3
# patch-tests170 - locks for patch170 (an auto-opened deck yields to a control sheet). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch170 (controls audit): an auto-opened deck yields to the control sheet ----
chk('p170: autoExpandDeck marks the deck as game-opened; any manual toggle clears the mark', html.includes('deckExpanded = true; deckAutoOpened = true;') && html.includes("deckAutoOpened = false;   // patch170: any manual toggle makes the deck the player's"), '');
chk('p170: updateDeckAutoClose closes a game-opened deck as soon as a control sheet is open (player-opened decks are left alone)', html.includes('if (deckExpanded && deckAutoOpened && typeof SN_TOUCH !== \'undefined\' && SN_TOUCH.pop) {'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
