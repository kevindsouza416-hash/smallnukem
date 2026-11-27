#!/usr/bin/env python3
"""Recovery pass: verify every existing clip on disk; render only the
missing/invalid ones SERIALLY (the 4-way parallel run tripped the TTS
backend — a contiguous window of synth failures). Idempotent: safe to
re-run; valid files are never re-rendered. Writes the final manifest."""
import json, os, re, subprocess, tempfile, time

W = '/home/hatch/workspace/small-nukem-chief-clips/work'
OUT = '/home/hatch/workspace/small-nukem-chief-clips'
VOICE = 'avocado_v2:magnus'
import importlib.util
spec = importlib.util.spec_from_file_location('render', W + '/render.py')
render = importlib.util.module_from_spec(spec)
import sys; sys.argv = ['render.py', '__import_only__']
# reuse chunk_text/probe/synth from render.py without running main
src = open(W + '/render.py').read().replace("if __name__ == '__main__':\n    main()", '')
exec(compile(src, 'render.py', 'exec'))

def check(line):
    path = os.path.join(OUT, line['id'] + '.mp3')
    if not os.path.exists(path):
        return None
    size = os.path.getsize(path)
    dur, meanv = probe(path)
    words = len(line['tts_text'].split())
    ok = size > 4000 and dur >= max(0.7, words * 0.16) and meanv > -45
    return {'size': size, 'dur': dur, 'meanv': meanv, 'ok': ok}

def render_serial(line):
    lid = line['id']
    final = os.path.join(OUT, lid + '.mp3')
    chunks = chunk_text(line['tts_text'])
    tmp = tempfile.mkdtemp(prefix='chiefclip_')
    parts = []
    try:
        for i, ch in enumerate(chunks):
            p = os.path.join(tmp, f'part{i}.mp3')
            if not synth(ch, p):
                return False
            parts.append(p)
            time.sleep(0.5)
        if len(parts) == 1:
            subprocess.run(['cp', parts[0], final], check=True)
        else:
            lst = os.path.join(tmp, 'list.txt')
            with open(lst, 'w') as f:
                for p in parts: f.write(f"file '{p}'\n")
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0',
                            '-i', lst, '-c:a', 'libmp3lame', '-q:a', '3', final], check=True)
    finally:
        subprocess.run(['rm', '-rf', tmp])
    return True

def main():
    lines = json.load(open(W + '/lines.json'))
    state = {}
    todo = []
    for line in lines:
        c = check(line)
        if c and c['ok']:
            state[line['id']] = c
        else:
            todo.append(line)
    print(f'verified on disk: {len(state)}/{len(lines)}; to render: {len(todo)}', flush=True)
    for line in todo:
        ok = render_serial(line)
        c = check(line) if ok else None
        if c and c['ok']:
            state[line['id']] = c
            print('OK  ', line['id'], round(c['dur'], 2), flush=True)
        else:
            print('FAIL', line['id'], flush=True)
        time.sleep(1.0)
    manifest = []
    for line in lines:
        c = state.get(line['id'])
        manifest.append({
            'id': line['id'], 'group': line['group'], 'key': line['key'],
            'source': line['source'], 'text': line['text'], 'tts_text': line['tts_text'],
            'file': line['id'] + '.mp3' if c else None,
            'duration_s': round(c['dur'], 2) if c else None,
            'chunks': len(chunk_text(line['tts_text'])),
            'status': 'ok' if c else 'failed'})
    json.dump(manifest, open(OUT + '/manifest.json', 'w'), indent=1)
    ok = sum(1 for m in manifest if m['status'] == 'ok')
    print(f'=== {ok}/{len(manifest)} clips ok')
    for m in manifest:
        if m['status'] != 'ok': print('STILL FAILING:', m['id'])

if __name__ == '__main__':
    main()
