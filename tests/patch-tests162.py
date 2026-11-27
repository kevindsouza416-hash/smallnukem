#!/usr/bin/env python3
# patch-tests162 - locks for patch162 (manual SCRAM). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch162 (controls audit): the operator's manual SCRAM ----
{
  const S = fresh(); run(S, 5); BWR.scramNow(S);
  chk('p162 model: her scramNow() trips with her reason string "Manual scram by operator" (the game now calls it)', S.scram === true && S.why === 'Manual scram by operator' && S.phase === 'tripped', S.why);
}
chk('p162: manual SCRAM is wired to the model through snManualScram -> BWR.scramNow(S)', html.includes('function snManualScram() {') && html.includes('BWR.scramNow(S);'), '');
chk('p162: keyboard X and gamepad Back/View hold (1.0 s) with a progress pill; release cancels', html.includes("KB['KeyX'] || (gp && gp.buttons[8] && gp.buttons[8].pressed)") && html.includes('HOLD_S: 1.0') && html.includes('snScramHoldTick(dt);'), '');
chk('p162: ARI-01 panel carries a SCRAM hold button (left) beside the ARI tap button (right)', html.includes("fx: 'scramFire'") && html.includes("if (pop.grab.fx === 'scramFire')"), '');
chk('p162: overlay heading distinguishes a manual SCRAM from an automatic one', html.includes('id="scramHead"') && html.includes("'!! MANUAL SCRAM !!'") && html.includes("'!! AUTOMATIC SCRAM !!'"), '');
chk('p162: the Chief stock automatic-trip line is NOT used for a manual SCRAM', html.includes('} else showCallout(\'scram\');'), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests162 applied')
