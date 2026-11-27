#!/usr/bin/env python3
# patch-tests156 — test locks for patch156 (ship #24, input plumbing
# safe subset). Review: r156-review.md (APPROVE-WITH-NOTES).
#
# Edits tests/value-checks.mjs ONLY. The first three locks are the
# three A156 proposed in a156-patch156-notes.md (callout / canvas
# user-select / interact fields); the audio-resume, gesture-widening
# and sheetCanvas locks complete the patch's five edits.
#
# Usage: python3 patch-tests156.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests155: pass the post-155 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests156 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch156 (ship #24): input plumbing armour + INPUT action-layer fields ----
chk('ship24 plumbing: iOS touch-callout is disabled in BOTH CSS armour rules (html,body and #gameCanvas)', (html.match(/-webkit-touch-callout: none/g) || []).length === 2, '');
chk('ship24 plumbing: the #gameCanvas rule carries user-select armour beside touch-action', html.includes('#gameCanvas { touch-action: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;'), '');
chk('ship24 plumbing: INPUT carries the named-action interact fields (patch158 wires the writers)', html.includes('tapAltPulse: false, interact: false, interactPulse: false };'), '');
chk('ship24 plumbing: AudioContext resumes at the head of the canvas pointerdown handler (never creates a context)', html.includes("try { if (AUDIO_CTX && AUDIO_CTX.state === 'suspended') AUDIO_CTX.resume(); } catch (err) {}"), '');
chk('ship24 plumbing: the gesture guard covers #gameContainer (a pinch starting on a DOM button is guarded)', html.includes("document.getElementById('gameContainer')]) {"), '');
chk('ship24 plumbing: #sheetCanvas carries touch-action:none (defence in depth)', html.includes('display:none;touch-action:none'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests156 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
