#!/usr/bin/env python3
# patch-tests149 — test locks for patch149 (ship #24, glyph supersample).
#
# Edits tests/value-checks.mjs ONLY. A16 section 3 found NO existing
# coverage of GLYPH_SS / the fillText divide-backs (grep: the only
# fillText hit in the suite is the patch77 CHECK READINGS plate), so
# all locks below are new. String locks in the suite's idiom — the
# SN_GL shim is not extractable in the suite's extract-and-run style.
#
# Usage: python3 patch-tests149.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests148: pass the post-148 suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests149 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch149 (ship #24): in-canvas text supersample ----
chk('ship24 text: GLYPH_SS supersample factor is 2, with the px-scaling font helper', html.includes('var GLYPH_SS = 2;') && html.includes('function glyphSSFont(font)'), '');
chk('ship24 text: getGlyph rasterizes with the SS font and stores ss on the glyph record', html.includes('var ssFont = glyphSSFont(font);') && html.includes('adv: adv, ss: ss, w: w, h: h, pad: pad, baselineOff: baselineOff,'), '');
chk('ship24 text: fillText total width divides each advance back by ss', html.includes('total += g.adv / (g.ss || 1);'), '');
chk('ship24 text: fillText quad origin and size divide pad / baselineOff / w / h by gss', html.includes('var x0 = penX - gl2.pad / gss, y0 = baseline - gl2.baselineOff / gss;') && html.includes('this._pt(x0 + gl2.w / gss, y0 + gl2.h / gss)'), '');
chk('ship24 text: fillText pen advance divides back by gss', html.includes('penX += gl2.adv / gss;'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests149 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
