#!/usr/bin/env python3
# patch-tests183 - locks for patch183 (the snActionLift layout cache key gains H, so an H change can no longer hit the cache and bypass the patch180 clamp). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch 183 (climb-prompt overlap fix, sn-climb-fix evidence T1/T3): the snActionLift layout cache key includes H ----
// Defect: patch180's clamp (clear = min(clear, max(0, H - bh - 4))) is a pure function of H, but the recompute gate
// cached on a key built from ladderShown, below, the player's 16 px screen cell and the button size only - no H.
// A frame computed below + 220 under H >= 276 (clamp a no-op), the gauge deck then expanded, H settled at 209 with
// every key field unchanged, and every later call returned at the gate: the clamp never ran, the stale bottom stood.
// Failing state (recorded live): below = 255, bh = 52, ladder clear nominal 220, key 'L|255|6|22|168x52', bottom 475.
// p183keyAt evaluates the game's OWN key expression, extracted verbatim from snActionLift in the file under test,
// with w2sX/w2sY as identity (camera at origin, zoom 1), the player at screen (352, 96) - the failing cells
// (round(352/16) = 22, round(96/16) = 6) - and the button at 168x52. On the unpatched file the extracted expression
// ignores H, so every H-sensitive lock below fails; on the patched file it ends in the H segment and they pass.
const p183count = (s) => html.split(s).length - 1;
const p183keyAt = (() => { const f = html.indexOf('function snActionLift'); const k = html.indexOf('const key =', f); const e = html.indexOf(';', k); const expr = html.slice(k + 'const key ='.length, e); const fn = new Function('ladderShown', 'below', 'w2sY', 'w2sX', 'player', 'ab', 'H', 'return (' + expr + ');'); return (H, below = 255) => fn(true, below, (wy) => wy, (wx) => wx, { x: 352, y: 96 }, { offsetWidth: 168, offsetHeight: 52 }, H); })();
const p183geom = (below, nominal, H, bh) => { const eff = Math.min(nominal, Math.max(0, H - bh - 4)); return { H: H, eff: eff, bottom: below + eff, top: H - eff - bh }; };
const p183sim = (Hs) => { let stored = ''; let out = { bottom: null, eff: null, top: null, computes: 0 }; for (const H of Hs) { const k = p183keyAt(H); if (k === stored) continue; stored = k; const g = p183geom(255, 220, H, 52); out = { bottom: g.bottom, eff: g.eff, top: g.top, computes: out.computes + 1 }; } return out; };
chk('p183: the snActionLift cache key line carries H as its final segment, exactly once, inside snActionLift before the cache gate', p183count("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") === 1 && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") > html.indexOf('function snActionLift') && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") < html.indexOf('if (key === _snLiftKey) return;'), '');
chk('p183: the cache itself is untouched - _snLiftKey declaration, gate and store each occur exactly once (3 occurrences in the whole file), and the patch180 clamp line still stands exactly once, after the key line', p183count("let _snLiftKey = '';") === 1 && p183count('if (key === _snLiftKey) return;') === 1 && p183count('_snLiftKey = key;') === 1 && p183count('_snLiftKey') === 3 && p183count('clear = Math.min(clear, Math.max(0, H - bh - 4));') === 1 && html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;") > html.indexOf('function snActionLift') && html.indexOf('clear = Math.min(clear, Math.max(0, H - bh - 4));') > html.indexOf("ab.offsetWidth + 'x' + ab.offsetHeight + '|' + H;"), '');
chk('p183: the game key for the failing fields (ladder, below 255, cells 6/22, button 168x52) ends in the H in force - |209 at the settled height, |366 at the pre-drop height', p183keyAt(209) === 'L|255|6|22|168x52|209' && p183keyAt(366) === 'L|255|6|22|168x52|366', '');
chk('p183: REGRESSION - the key at H 366 differs from the key at H 209 with every other field equal, and no two adjacent canvas heights 60..900 share a key', p183keyAt(366) !== p183keyAt(209) && (() => { for (let H = 60; H < 900; H++) { if (p183keyAt(H) === p183keyAt(H + 1)) return false; } return true; })(), '');
chk('p183: THE BUG, end to end through the cache - primed at H 366 the lift computes clear 220 / bottom 475; when H then settles at 209 with all key fields unchanged the lift MUST recompute: clamped clear 153, bottom 408, button top exactly 4 (the stale value would leave it at -63)', (() => { const a = p183sim([366]); const b = p183sim([366, 209]); return a.eff === 220 && a.bottom === 475 && (209 - 220 - 52) === -63 && b.computes === 2 && b.eff === 153 && b.bottom === 408 && b.top === 4; })(), '');
chk('p183: after any H change from a primed cache, the recompute runs the patch180 clamp for every canvas height 60..900 (bottom = 255 + clamped clear, prompt top never above the 4 px margin)', (() => { for (let H = 60; H <= 900; H++) { const r = p183sim([1000, H]); const eff = Math.min(220, Math.max(0, H - 52 - 4)); if (r.computes !== 2 || r.eff !== eff || r.bottom !== 255 + eff || r.top !== H - eff - 52 || r.top < Math.min(4, H - 52)) return false; } return true; })(), '');
chk('p183: NO-OP at fixed H - the key is stable across repeated computation at H 209 and a repeated call still hits the cache (exactly one compute, bottom unchanged at 408): the fix does not disable the cache', p183keyAt(209) === p183keyAt(209) && p183keyAt(209) === 'L|255|6|22|168x52|209' && (() => { const r = p183sim([209, 209, 209]); return r.computes === 1 && r.bottom === 408 && r.eff === 153; })(), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests183 applied')
