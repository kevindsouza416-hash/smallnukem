#!/usr/bin/env python3
# patch-tests175 - locks for patches 175-179 (the driver fixes the Ship #25 walkthrough needs). Edits tests/value-checks.mjs only.
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
text = open(PATH, encoding='utf-8').read()
ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1
BLOCK = r'''
// ---- patches 175-179 (SHIP #25 support): the demo / takeover / walkthrough driver can finish Level 2 ----
chk('p175: snDriverUrgent (turbine trip / feedwater lost / p>7.5 / level<85) and boosted-clock stretches skip the driver walk', html.includes('function snDriverUrgent() {') && html.includes('S.turbTrip > 0 || (S.ev && S.ev.tu === 1) || !S.fwOK || S.p > 7.5 || S.level < 85') && html.includes('(snDriverUrgent() || SN_PACE.effective > 1.5) && SHOWME.walkT > 0.25'), '');
chk('p175: the driver arrives at Level 2\'s scheduled turbine trip at low power (lever 15) and the D20 fix-start cinematic is held back in a live emergency', html.includes("gameState.level === 2 && gameState.l2Stage === 1 && S.phase === 'heatup') leverT = 15;") && html.includes('if (!(SN_WALK.active && snDriverUrgent())) SN_CINE.offer(key);'), '');
chk('p176: the auto-boost clock never runs while a cinematic holds the player (paceTick) - game-layer pacing only', html.includes("if (typeof CINE_ACTIVE !== 'undefined' && CINE_ACTIVE) { SN_PACE.effective = SN_PACE.player;"), '');
chk('p176: a walkthrough skips mid-level cinematics (level_complete still plays) and closes a running one when the driver is needed', html.includes("dropped: 'walkthrough_driving'") && html.includes("key !== 'level_complete'") && html.includes('if (!SN_WALK.gap && CINE_ACTIVE && snDriverUrgent())'), '');
chk('p174/177: snStandX chooses a stand where the pinned panel is the nearest interactable AND Fluke stands on the panel\'s own deck', html.includes('const onDeck = sx => platforms.some(') && html.includes('if (!onDeck(sx)) return false;'), '');
chk('p178: the operate phase heals a mis-targeted panel by placing Fluke at it (demoPin)', html.includes('if (pin && player.interactTarget !== pin && (TAKEOVER.active || DEMO.active)) demoPin();'), '');
chk('p179: the driver closes an isolation condenser latched open by an excursion (it capped the plant at 274 MWe < 285)', html.includes("S.phase === 'power' && S.icOpen && S.ctl.ic !== 'off' && S.p < 7.35 && S.turbTrip <= 0) { action = 'iso_condenser'; mode = 'tap'; }"), '');
'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
