#!/usr/bin/env python3
# patch-tests181 - locks for patch181 (freeze world-hold while the sheet is dwell-open, ship #24 W57 defect).
# Edits tests/value-checks.mjs only.  The five FZ1 regression cases (a)-(e) are executed against the game's
# own snFreezeEmergency / snFreezeAdjusting extracted from the source text (same pattern as patch-tests168),
# with the game globals stubbed on globalThis.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch181 (freeze world-hold): the dwell-open sheet must not shadow the world hold (ship #24 W57) ----
{
  const mE = html.match(/function snFreezeEmergency\(\) \{[\s\S]*?\n\}/);
  const mA = html.match(/function snFreezeAdjusting\(\) \{[\s\S]*?\n\}/);
  const F = (mE && mA) ? new Function(mE[0] + '\n' + mA[0] + '\nreturn { e: snFreezeEmergency, a: snFreezeAdjusting };')() : null;
  const base = () => {   // the W57 live state: L3 grid emergency, sheet dwell-open at the steam valve
    globalThis.S = { phase: 'grid', scram: false, ev: { tu: 1 } };
    globalThis.gameState = { level: 3, phase: 'playing' };
    globalThis.DEMO = { active: false }; globalThis.TAKEOVER = { active: false }; globalThis.CINE_ACTIVE = false;
    globalThis.SN_TOUCH = { pop: { action: 'steam_valve', grab: false, tgt: false } };
    globalThis.SN_WASD = { kbPanel: false, held: {} };
    globalThis.player = { interactTarget: { action: 'steam_valve' } };
    globalThis.keys = {};
  };
  const now = () => !!(F && F.e() && F.a());   // snFreezeNow(): the exact gate the game loop (FZ155) freezes on
  base(); globalThis.keys = { KeyE: true };
  chk('p181a: sheet dwell-open + KeyE world hold at the steam valve in the L3 grid emergency -> freeze holds (W57 defect)', now());
  base();
  chk('p181b: sheet dwell-open, no keys held -> no freeze', F && !now());
  base(); const grabHeld = (() => { globalThis.SN_TOUCH.pop.grab = true; return now(); })();
  base(); const tgtHeld = (() => { globalThis.SN_TOUCH.pop.tgt = true; return now(); })();
  base(); const kbHeld = (() => { globalThis.SN_WASD = { kbPanel: true, held: { KeyA: true } }; return now(); })();
  chk('p181c: sheet grab / committed target travelling / kbPanel KeyA-KeyD hold -> still freeze', !!(grabHeld && tgtHeld && kbHeld));
  base(); globalThis.SN_TOUCH.pop = null; globalThis.keys = { KeyE: true };
  chk('p181d: sheet closed + KeyE world hold -> still freeze (fall-through path unchanged)', now());
  base(); globalThis.keys = { KeyE: true }; const demoBlocks = (() => { globalThis.DEMO.active = true; return !now(); })();
  base(); globalThis.keys = { KeyE: true }; const takeBlocks = (() => { globalThis.TAKEOVER.active = true; return !now(); })();
  base(); globalThis.keys = { KeyE: true }; const cineBlocks = (() => { globalThis.CINE_ACTIVE = true; return !now(); })();
  chk('p181e: DEMO / TAKEOVER / cinematic active -> still no freeze, even with sheet open + KeyE held', !!(demoBlocks && takeBlocks && cineBlocks));
}
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests181 applied')
