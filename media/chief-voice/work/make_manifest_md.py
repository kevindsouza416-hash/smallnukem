#!/usr/bin/env python3
"""Render manifest.md from manifest.json."""
import json
from collections import Counter

OUT = '/home/hatch/workspace/small-nukem-chief-clips'
man = json.load(open(OUT + '/manifest.json'))
groups = Counter(m['group'] for m in man)
total_dur = sum(m.get('duration_s') or 0 for m in man)

lines = []
lines.append('# Small Nukem — The Chief: pre-rendered voice clips')
lines.append('')
lines.append('Voice: avocado_v2:magnus (warm Scottish engineer register per decision A2 —')
lines.append('built from described qualities, not an imitation of any person).')
lines.append('Source build: ~/small-nukem/small-nukem.html, 515,247 B, MD5 b34629d57019f3736025496ecc37a323.')
lines.append('')
lines.append(f'**{len(man)} clips · total {total_dur/60:.1f} min of speech**')
lines.append('')
lines.append('| Group | Clips |')
lines.append('|---|---|')
for g, n in groups.items():
    lines.append(f'| {g} | {n} |')
lines.append('')
lines.append('`text` is the canonical line (matches the build verbatim for build-sourced lines).')
lines.append('`tts_text` is the spoken form actually synthesized — identical to `text` unless')
lines.append('numbers/units were spelled out for pronunciation (MPa → megapascals, MWe →')
lines.append('megawatts electric, 1500 RPM → fifteen hundred RPM, BWRX-300 → BWRX three')
lines.append('hundred, % → percent, mK → milli-k, acronyms letter-spelled).')
lines.append('`source`: build = extracted verbatim from the shipped build · authored-variant =')
lines.append('written for this set to satisfy the no-repeat rule (same facts, Chief register) ·')
lines.append('tour-script / playthrough-script = from the recorded tour / demo narration scripts.')
lines.append('')
lines.append('| id | group | key | source | file | dur (s) | text |')
lines.append('|---|---|---|---|---|---|---|')
for m in man:
    text = m['text'].replace('|', '\\|')
    lines.append(f"| {m['id']} | {m['group']} | {m['key']} | {m['source']} | {m['file']} | {m.get('duration_s')} | {text} |")
lines.append('')
open(OUT + '/manifest.md', 'w').write('\n'.join(lines))
print('manifest.md written:', len(man), 'rows')
