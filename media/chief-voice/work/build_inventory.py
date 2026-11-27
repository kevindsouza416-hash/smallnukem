#!/usr/bin/env python3
"""Build the full Chief clip line inventory: build lines (exact) + authored
variants (no-repeat rule) + script narration. Produces lines.json with
id / group / text (canonical) / tts_text (spoken form actually synthesized)."""
import json, re, sys

W = '/home/hatch/workspace/small-nukem-chief-clips/work'
ext = json.load(open(W + '/extracted.json'))

lines = []
def add(id_, group, text, source, key='', tts=None):
    lines.append({'id': id_, 'group': group, 'key': key, 'text': text,
                  'source': source, 'tts_override': tts})

# ---------------------------------------------------------------- CALLOUTS
# Authored variants v2/v3 per key (same facts/numbers/teaching, Chief register).
CALLOUT_VARIANTS = {
 'intro': [
   "Cold iron, cold core, and a full shift ahead of us. This BWRX-300 (a small modular boiling water reactor) is in cold shutdown, and we're taking her all the way to full power.",
   "She's cold and she's waiting. One BWRX-300 (a small modular boiling water reactor), sitting in cold shutdown — and by the end of this shift, she'll be at full power, if we do it right."],
 'pre_check': [
   "First job never changes: prove she's cold. Around 30C, about 0.10 MPa, critical at 0.2% power, water level at 100%. Read them off the panel, not off your memory.",
   "Before a single control moves, the numbers have to agree with the procedure: roughly 30C, 0.10 MPa, critical at 0.2%, level full at 100%. Check them like it's your first day — every day."],
 'rod_withdraw': [
   "Rods out, gently. Every rod you withdraw takes neutron absorbers out of the core and lets the reaction build. A first, then B, then C — and keep your eyes on the period (the doubling time). Your career rides on that number, so act like it.",
   "Time to bring her up. Withdrawing the rods removes the neutron absorbers, and the chain reaction starts to climb. Sequence is A, B, C, small pulls — and the period (how fast power doubles) is the only number that matters right now."],
 'approach_crit': [
   "Watch the period shrink — that's power doubling faster and faster. Twenty seconds is the comfortable target. Let it fall under ten and you're in a transient (an unwanted power spike), and transients come with paperwork.",
   "Period's shortening, which means the climb is steepening. Hold her near twenty seconds of doubling time. Under ten seconds is a transient (a power spike nobody ordered) — ease off before I have to explain you to the regulator."],
 'critical': [
   "There it is — critical (the chain reaction sustaining itself, one fission paying for the next). Reactivity is zero mK (milli-k, the reactivity unit — zero is perfect balance). She's holding steady. Good work. Don't let it go to your head.",
   "Criticality. The reaction now feeds itself, reactivity sitting at zero mK (milli-k — zero means the core is exactly in balance). Steady as a table. That's the hardest part done quietly, the way it should be."],
 'heat_up': [
   "Now we warm her through. Temperature's headed for 288C; the heat-up rate stays under 150C a minute — that's a plant limit, not a guideline. The negative temperature coefficient (the reaction eases itself as the water heats) works in your favour the whole way up.",
   "Heat-up's a patience game: climb toward 288C, never faster than 150C a minute. And remember the built-in help — the negative temperature coefficient (hotter water naturally slows the reaction). Physics is pulling with you on this one."],
 'pressurise': [
   "Heat turns to pressure now. The setpoint is 7.2 MPa (about 1000 psi); operating pressure is 6.8 MPa, and the turbine syncs itself at 6.3 MPa. Hands off the steam valve — let the thermodynamics do the heavy lifting.",
   "As the water heats, pressure follows. We're aiming at the 7.2 MPa setpoint (roughly 1000 psi), through 6.8 MPa operating pressure, with the turbine syncing at 6.3 MPa. No touching the steam valve yet. The plant knows the way."],
 'turbine_roll': [
   "Pressure's past 6.3 MPa, so the turbine rolls by itself up to 1500 RPM, synchronous speed. You watch; if pressure runs hot, the bypass valve is your tool. She's a V8 with a city block's worth of power — treat her accordingly.",
   "There's the roll. Once pressure passes 6.3 MPa the turbine comes up on its own to 1500 RPM. Your job is witness and watchkeeper: eyes on the gauges, bypass valve ready if pressure misbehaves."],
 'sync': [
   "Fifteen hundred RPM and she synchronises to the grid herself. Frequency matched, phase angle checked — that's the whole ceremony. Close a breaker out of phase and the generator loses, every time. So we don't.",
   "At 1500 RPM the generator syncs to the grid. Your part is verification: frequency matched, phase angle right. An out-of-phase close can wreck the machine in one bang — check it twice, close it once."],
 'grid': [
   "On the grid. Now raise load slowly toward 300 MWe (megawatts electric — a quarter of a million homes, give or take). Smooth on the lever. This is the moment the whole startup was for.",
   "Synchronised and delivering. Bring her up gently to 300 MWe (megawatts electric — enough for a quarter million homes). No spikes, no showing off. Just a clean climb to full power."],
 'period_warn': [
   "Hey — period's under ten seconds. That's a transient (an unwanted power excursion), and we don't ride those. Rods back in a touch, let her settle. Reactors reward patience; they punish drag racers.",
   "Period under ten seconds — too fast. Insert the rods a little and cool the climb down. We're starting a reactor here, not setting a lap time."],
 'period_danger': [
   "PERIOD UNDER FIVE SECONDS — RODS IN, NOW! You're closing on prompt criticality (a runaway surge where the reactor outruns its operators). The protection system trips on pressure, power and level — do not make it prove that.",
   "Five seconds and falling — INSERT RODS IMMEDIATELY! That's prompt criticality territory (power rising faster than anyone can steer). Back her down now, or the protection system does it for you and writes SCRAM on your record."],
 'scram': [
   "That's a SCRAM (emergency shutdown — every rod dropped in by gravity). The protection system earned its pay today. Before we reset: walk the sequence back and find where it turned. The plant forgives once — learn from the once.",
   "SCRAM. All rods in by gravity, reaction stopped, plant safe — the protection system did exactly what it's built for. Now the real work: figure out what you did wrong. We debrief first, restart second."],
 'stuck_rod': [
   "One drive's not answering — a stuck rod mechanism. It happens; the manual even has a page for it. Compensate with the adjacent drives and keep reactivity (the chain reaction balance) under control while we work around it.",
   "That rod's stuck — drive's not responding. Don't force it. Work the neighbouring drives to hold reactivity (chain reaction balance) steady. Machinery sticks; good operators adapt."],
 'steam_leak': [
   "Steam leak in the tunnel — hear it? The isolation condenser (passive cooling: gravity and physics, no power needed) should pick up the load, but I want that line isolated by hand. Move with purpose; pressure's falling.",
   "We've got a leak on the steam line. The isolation condenser (a passive system — gravity does the work) is your backstop, but backstops don't replace operators: get down there and isolate that line manually."],
 'fault_cleared': [
   "Isolated and cleared. The BWRX-300's passive safety is genuinely good — but it was a sharp operator who caught that, not a sensor. Credit where it's due. Now, back on procedure.",
   "Fault's dealt with. The plant's passive systems are solid, and so, apparently, is my operator. Reset your head, pick the procedure back up where we left it."],
 'victory': [
   "Three hundred MWe on the grid, and a clean startup to boot. Core steady, level steady, condenser carrying the heat by gravity. I've watched twenty-year operators make a meal of that. You didn't. Well done, kid.",
   "Full power, on the grid, no trips, no violations. That's how a startup is supposed to read. The core's behaving and the plant's happy. Log it and savour it — you earned this one."],
}
for key, text in ext['CALLOUTS'].items():
    add(f'brief-{key}-1', 'briefings', text, 'build', key)
    for i, v in enumerate(CALLOUT_VARIANTS[key]):
        add(f'brief-{key}-{i+2}', 'briefings', v, 'authored-variant', key)

# ---------------------------------------------------------------- REACTIONS
for key, variants in ext['REACTIONS'].items():
    for i, v in enumerate(variants):
        add(f'react-{key}-{i+1}', 'reactions', v['t'], 'build', key)

# ---------------------------------------------------------------- GUIDANCE (ASSIST_EXPLAIN)
for step, variants in enumerate(ext['ASSIST_EXPLAIN']):
    for i, v in enumerate(variants):
        add(f'guide-step{step+1}-{i+1}', 'guidance', v, 'build', f'step{step+1}')

# ---------------------------------------------------------------- LADDER
for step, t in enumerate(ext['ASSIST_TEACH']):
    add(f'ladder-teach-step{step+1}', 'ladder', t, 'build', f'step{step+1}')
add('ladder-announce-1', 'ladder', ext['FIXED']['assist_announce'], 'build', 'announce')
add('ladder-announce-2', 'ladder', "Enough telling — time for showing. I'll take this one myself, and I'll talk you through every move while I make it.", 'authored-variant', 'announce')
add('ladder-announce-3', 'ladder', "My turn, kid. Watch the whole thing: I'll do this step the way it should be done, and explain it as I go.", 'authored-variant', 'announce')
add('ladder-handback-1', 'ladder', ext['FIXED']['assist_handback'], 'build', 'handback')
add('ladder-handback-2', 'ladder', "There — done, and the plant's yours again. Next step has your name on it.", 'authored-variant', 'handback')
add('ladder-handback-3', 'ladder', "Handing her back. That one's in the book; the next one's all you.", 'authored-variant', 'handback')
add('ladder-coach-line', 'ladder', ext['FIXED']['assist_coach_line'], 'build', 'assist_coach')

# ---------------------------------------------------------------- SHOWME (takeover/demo narration)
SHOWME_EXTRA = {
 'rod_drive_2': "B drive now. I keep the pulls small and even, because the core remembers every lopsided move you make — balance in, balance out.",
 'rod_drive_3': "And C completes the pattern. Worked in order, the three drives bring her up symmetric — and symmetric is what keeps the next hour boring, which is the goal.",
 'steam_valve': "One more tool for your kit: the bypass handwheel. A turn at a time from me — because steam you route calmly to the condenser is steam that never argues with you.",
 'raise_power': "Final climb, same discipline: lever up slowly, megawatts rising, and I hold her steady over 285 — because the hold is the step, not the climb.",
 'turbine_control': "Turbine panel, confirmation only: 1500 RPM and holding. I don't touch what doesn't need touching, because a machine at synchronous speed is already doing its job.",
 'sync_grid': "At the sync panel I do the operator's half: verify. Frequency matched, phase matched — because the breaker only closes when the two sides agree, and I'm the witness who signs it.",
 'feed_pump': "Standby pump started, and now I watch the level answer before anything else moves — because one change at a time is how you always know what worked.",
 'iso_condenser': "Putting the isolation condenser in service — one press, done early on purpose, because the time to prove your passive heat sink is before the plant ever asks for it.",
 'shutdown_rods': "Watch the shutdown done properly: lever down at the drives, rods fully in, insertion verified — because ending a shift safely is a skill, not a surrender.",
 'generic': "Nothing up my sleeve: the same panel, the same control, the same motion you'd make. If you can follow my hands, you can do the step — that's the point of the demonstration.",
}
for key, variants in ext['SHOWME_LINES'].items():
    for i, v in enumerate(variants):
        add(f'showme-{key}-{i+1}', 'showme', v, 'build', key)
    if key in SHOWME_EXTRA:
        add(f'showme-{key}-{len(variants)+1}', 'showme', SHOWME_EXTRA[key], 'authored-variant', key)

# ---------------------------------------------------------------- TAKEOVER / DEMO fixed lines
add('takeover-announce-1', 'takeover', ext['FIXED']['takeover_announce'], 'build', 'announce')
add('takeover-announce-2', 'takeover', "Right — my turn at the wheel. I'll take it from here: first I look at what you've handed me, then I fix it in the open where you can watch.", 'authored-variant', 'announce')
add('takeover-announce-3', 'takeover', "Stepping in. I'll take it from here — diagnosis first, then the fix, all of it where you can see my hands. Watch closely; this is the good stuff.", 'authored-variant', 'announce')
add('takeover-demo-on', 'takeover', ext['FIXED']['demo_on'], 'build', 'demo_on')
add('takeover-demo-off', 'takeover', ext['FIXED']['demo_off'], 'build', 'demo_off')
add('takeover-off', 'takeover', ext['FIXED']['takeover_off'], 'build', 'takeover_off')

# ---------------------------------------------------------------- CINEMATICS
for name, scene in ext['CINE'].items():
    if scene['teach']:
        add(f'cine-{name}-teach', 'cinematics', scene['teach'], 'build', name)
    if scene['line']:
        add(f'cine-{name}-quip', 'cinematics-quips', scene['line'], 'build', name)

# ---------------------------------------------------------------- DEMO TOUR (in-build)
for item in ext['DEMO_TOUR']:
    add(f"tour-{item['key']}", 'tour', item['text'], 'build', item['key'])

# ---------------------------------------------------------------- PANEL HINTS
for key, t in ext['SNX_HINTS'].items():
    add(f'hint-{key}', 'hints', t, 'build', key)

# ---------------------------------------------------------------- TOUR SCRIPT narration (tour-script.md)
tour_md = open('/home/hatch/workspace/small-nukem-tour/tour-script.md', encoding='utf-8').read()
blocks = re.findall(r'NARRATION[^"]*"((?:[^"\\]|\\.)*)"', tour_md, re.S)
labels = ['shot1','shot2','shot3','shot4','shot5','shot6','shot7','shot8',
          'shot9a','shot9b','shot9c','shot10','shot11','shot12ab','shot12cd','shot13','shot14']
assert len(blocks) == len(labels), f'tour blocks: {len(blocks)}'
for lab, b in zip(labels, blocks):
    text = ' '.join(b.split())
    add(f'tourscript-{lab}', 'tour-script', text, 'tour-script', lab)

# ---------------------------------------------------------------- PLAYTHROUGH narration (narration-script.txt)
narr = open('/home/hatch/workspace/small-nukem-playthrough/narration-script.txt', encoding='utf-8').read()
parts = re.split(r'\nPART \d\n', narr)
parts = [p.strip() for p in parts if len(p.strip()) > 200 and 'Target:' not in p]
assert len(parts) == 3, f'narration parts: {len(parts)}'
for i, p in enumerate(parts):
    add(f'demo-narration-part{i+1}', 'demo-narration', ' '.join(p.split()), 'playthrough-script', f'part{i+1}')

# ---------------------------------------------------------------- spoken form (tts_text)
REPLACEMENTS = [
    ('BWRX-300', 'BWRX three hundred'),
    ('0.10 MPa', 'zero point one megapascals'),
    ('7.2 MPa', 'seven point two megapascals'),
    ('6.8 MPa', 'six point eight megapascals'),
    ('6.3 MPa', 'six point three megapascals'),
    ('of an MPa', 'of a megapascal'),
    ('~30C', 'about thirty degrees'), ('~0.10', 'about zero point one'),
    ('30C', 'thirty degrees'), ('288C', 'two hundred and eighty-eight degrees'),
    ('150C', 'a hundred and fifty degrees'),
    ('0.2%', 'zero point two percent'), ('100%', 'one hundred percent'),
    ('1500 RPM', 'fifteen hundred RPM'),
    ('300 MWe', 'three hundred megawatts electric'),
    ('285+ MWe', 'two hundred and eighty-five plus megawatts'),
    ('285-plus', 'two hundred and eighty-five plus'),
    (' mK', ' milli-k'),
    ('V8', 'V-eight'),
    ('RCIC', 'R-C-I-C'), ('ATWS', 'A-T-W-S'), ('ARI', 'A-R-I'), ('SLC', 'S-L-C'),
    (' MW ', ' megawatts '),
    ('285 MWe', 'two hundred and eighty-five megawatts'),
    (' MWe', ' megawatts electric'),
    ('--', '—'),
    ('~', 'about '),
]
OVERRIDES = {
 'brief-critical-1': "Criticality achieved (the chain reaction is now self-sustaining). Reactivity (how far from balance) is zero milli-k — a unit of reactivity — zero means perfectly balanced. The reactor's holding steady. Try not to look too smug.",
}
for ln in lines:
    t = ln['tts_override'] or ln['text']
    if ln['id'] in OVERRIDES:
        t = OVERRIDES[ln['id']]
    else:
        for a, b in REPLACEMENTS:
            t = t.replace(a, b)
    ln['tts_text'] = t
    del ln['tts_override']

ids = [l['id'] for l in lines]
assert len(ids) == len(set(ids)), 'duplicate ids'
json.dump(lines, open(W + '/lines.json', 'w'), indent=1)
from collections import Counter
print('total lines:', len(lines))
print(Counter(l['group'] for l in lines))
print(Counter(l['source'] for l in lines))
