#!/usr/bin/env python3
# patch-tests165 - locks for patch165 (physics: grid-emergency recovery). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patch165 (PHYSICS, deliberate deviation from her block - see docs/AUDIT-2026-11-27.md) ----
{
  const { createHash } = await import('node:crypto');
  const md5 = createHash('md5').update(html.slice(i, j + 5)).digest('hex');
  chk('p165: the BWR block is pinned at the audited MD5 (be5a0982...) - any further drift from her verbatim block must be a new, recorded patch', md5 === 'be5a0982bf00617bda59847174d69474', md5);
  // An attentive operator through the whole Level-3 grid emergency.
  const S = fresh(); let atTu3 = null, tuWasHold = false;
  for (let t = 0; t < 900 && !S.scram && S.phase !== 'complete' && S.phase !== 'failed'; t += 0.1) {
    if (S.phase === 'heatup') S.lever = 48;
    else if (S.phase === 'power') S.lever = Math.min(100, S.lever + 0.5);
    else if (S.phase === 'grid') {
      let want = S.disp / 3;
      if (S.ev.fw === 1) S.ctl.rfpStby = true;
      if (S.ev.tu === 1) want = 20;
      S.lever += Math.max(-0.8, Math.min(0.8, want - S.lever));
    }
    BWR.step(S, 0.1);
    if (S.ev.tu === 3 && !atTu3) atTu3 = { disp: S.disp, grace: S.grace, seg: BWR.SEG[S.segI].to, g: S.g, next: BWR.STARTS[S.segI + 1] };
  }
  chk('p165: when the turbine is back the dispatch target is the scheduled segment, not the emergency 60 MWe', !!atTu3 && atTu3.disp === atTu3.seg && atTu3.disp !== 60, JSON.stringify(atTu3));
  chk('p165: the scheduled segment has NOT yet changed at that instant (the stale 60 used to persist to the next boundary)', !!atTu3 && atTu3.g < atTu3.next, JSON.stringify(atTu3));
  chk('p165: recovery grace is granted - her own segment-change formula, min(30, 4 + |step|/5)', !!atTu3 && atTu3.grace >= Math.min(30, 4 + Math.abs(atTu3.seg - 60) / 5) - 0.2, JSON.stringify(atTu3));
  chk('p165: the shift still completes for the attentive operator', S.phase === 'complete', S.phase);
  const sm = BWR.summary(S);
  chk('p165: dispatch accuracy for the attentive operator is >= 0.90 (was 0.85 with the stale target and no grace)', sm.acc >= 0.90, sm.acc.toFixed(3));
}
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
