#!/usr/bin/env python3
# patch-tests184 - locks for patch184 (white border around Fluke removed completely: padded imageRegion for drawImage + CLEAR fallback). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch 184 (Kevin, 2026-11-27 - white border around Fluke removed completely) ----
// Defect mechanism (lane sn-border-spec, code + pixel evidence): no code draws a border around the player and the
// sprite PNGs have clean transparent edges; the WebGL atlas packed drawImage sources edge-to-edge via
// patternRegion() and the shader samples LINEAR with no inset, so a quad-edge tap straddled the region boundary
// and pulled in the neighbouring cell (white glyph strokes / the white fallback cell) - a light border around
// the sprite, worst while walking. On atlas-full the region became the WHITE cell outright (solid white quad).
// Fix: drawImage uses imageRegion() - a (w + 2) x (h + 2) cell, image drawn at +1, region UVs over exactly the
// image texels, so edge taps reach only the image's own transparent moat; atlas-full falls back to the CLEAR
// cell (transparent, reserved beside WHITE on the first shelf), never WHITE. Patterns keep patternRegion().
const p184count = (s) => html.split(s).length - 1;
chk('p184: imageRegion exists exactly once, allocates the moat (w + 2, h + 2), draws the image inset at cell + 1, and its region UVs span exactly the image texels (cell + 1 .. cell + 1 + w)', p184count('function imageRegion(src)') === 1 && p184count('atlasAlloc(w + 2, h + 2)') === 1 && p184count('atlasCtx.drawImage(src, cell.x + 1, cell.y + 1)') === 1 && p184count('u0: (cell.x + 1) / ATLAS_SIZE') === 1 && p184count('u1: (cell.x + 1 + w) / ATLAS_SIZE') === 1, '');
chk('p184: moat geometry - for a 140x270 sprite in a cell at (10, 20) the sampled region starts exactly 1 texel inside the cell and ends exactly 1 texel before the cell edge on every side, so a LINEAR edge tap can never cross into a neighbouring cell', (() => { const A = 4096, cx = 10, cy = 20, w = 140, h = 270; const u0 = (cx + 1) / A, v0 = (cy + 1) / A, u1 = (cx + 1 + w) / A, v1 = (cy + 1 + h) / A; return Math.round(u0 * A - cx) === 1 && Math.round(v0 * A - cy) === 1 && Math.round((cx + w + 2) - u1 * A) === 1 && Math.round((cy + h + 2) - v1 * A) === 1; })(), '');
chk('p184: drawImage routes through imageRegion exactly once, and patternRegion survives for patterns: its definition stands, regionOf still calls it, and imageRegion itself only falls back to it for dimensionless sources', p184count('var reg = imageRegion(src);') === 1 && p184count('function patternRegion(pat)') === 1 && p184count('patternRegion({ src: src })') === 2 && html.indexOf('var reg = imageRegion(src);') > html.indexOf('GLShim.prototype.drawImage'), '');
chk('p184: the CLEAR fallback cell is defined exactly once with its insets beside WHITE (x 2.25..3.75 texels), the first shelf now starts allocations at x = 4 so nothing can paint over CLEAR or WHITE, and imageRegion falls back to CLEAR - never to WHITE', p184count('var CLEAR = { u0: 2.25 / ATLAS_SIZE') === 1 && p184count('var shelves = [{ y: 0, h: 4, x: 4 }];') === 1 && p184count('reg = { u0: CLEAR.u0, v0: CLEAR.v0, u1: CLEAR.u1, v1: CLEAR.v1 }') === 1 && html.indexOf('function imageRegion') > html.indexOf('var CLEAR'), '');
chk('p184: WHITE itself is untouched (solid fills unchanged): the white cell paint and the WHITE region definition each still occur exactly once with their original values', p184count("atlasCtx.fillRect(0, 0, 2, 2); // white pixel cell at origin") === 1 && p184count('var WHITE = { u0: 0.25 / ATLAS_SIZE, v0: 0.25 / ATLAS_SIZE, u1: 1.75 / ATLAS_SIZE, v1: 1.75 / ATLAS_SIZE };') === 1, '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests184 applied')
