#!/usr/bin/env python3
"""Render every line in lines.json to its own mp3 clip with avocado_v2:magnus,
verify each clip contains real speech, and write the manifest."""
import json, os, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

W = '/home/hatch/workspace/small-nukem-chief-clips/work'
OUT = '/home/hatch/workspace/small-nukem-chief-clips'
VOICE = 'avocado_v2:magnus'
MAXW = 42  # words per synthesis chunk

def chunk_text(text):
    sents = re.split(r'(?<=[.!?])\s+', text.strip())
    units = []
    for s in sents:
        if len(s.split()) <= MAXW:
            units.append(s)
        else:  # split a long sentence at clause boundaries
            parts = re.split(r'(?<=[,;:])\s+|\s+—\s+', s)
            buf = ''
            for p in parts:
                if len((buf + ' ' + p).split()) <= MAXW:
                    buf = (buf + ' ' + p).strip()
                else:
                    if buf: units.append(buf)
                    buf = p
            if buf: units.append(buf)
    chunks, buf = [], ''
    for u in units:
        if len((buf + ' ' + u).split()) <= MAXW:
            buf = (buf + ' ' + u).strip()
        else:
            chunks.append(buf); buf = u
    if buf: chunks.append(buf)
    return [c for c in chunks if c]

def probe(path):
    dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    vol = subprocess.run(['ffmpeg', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    m = re.search(r'mean_volume:\s*(-?[\d.]+) dB', vol)
    return (float(dur) if dur else 0.0), (float(m.group(1)) if m else -99.0)

def synth(text, path):
    r = subprocess.run(['tts', 'speak', '--voice', VOICE, '--text', text, '--output', path],
                       capture_output=True, text=True, timeout=180)
    return r.returncode == 0 and os.path.exists(path)

def render_line(line):
    lid = line['id']
    final = os.path.join(OUT, lid + '.mp3')
    chunks = chunk_text(line['tts_text'])
    tmp = tempfile.mkdtemp(prefix='chiefclip_')
    parts = []
    try:
        for i, ch in enumerate(chunks):
            p = os.path.join(tmp, f'part{i}.mp3')
            if not synth(ch, p):
                return {**line, 'status': 'synth-failed', 'chunks': len(chunks)}
            parts.append(p)
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
    size = os.path.getsize(final)
    dur, meanv = probe(final)
    words = len(line['tts_text'].split())
    ok = size > 4000 and dur >= max(0.7, words * 0.16) and meanv > -45
    return {**line, 'file': lid + '.mp3', 'duration_s': round(dur, 2),
            'mean_db': meanv, 'bytes': size, 'chunks': len(chunks),
            'status': 'ok' if ok else 'verify-failed'}

def main():
    lines = json.load(open(W + '/lines.json'))
    only = sys.argv[1] if len(sys.argv) > 1 else None
    if only: lines = [l for l in lines if only in l['id']]
    results = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        for r in ex.map(render_line, lines):
            results.append(r)
            print(('OK  ' if r['status'] == 'ok' else 'FAIL'), r['id'], r.get('duration_s', ''), flush=True)
    # one retry pass for failures
    fails = [r for r in results if r['status'] != 'ok']
    if fails and not only:
        print('--- retrying', len(fails), 'failures')
        retry = []
        with ThreadPoolExecutor(max_workers=2) as ex:
            for r in ex.map(render_line, [next(l for l in lines if l['id'] == f['id']) for f in fails]):
                retry.append(r)
                print(('OK  ' if r['status'] == 'ok' else 'FAIL'), r['id'], '(retry)', r.get('duration_s', ''), flush=True)
        byid = {r['id']: r for r in retry}
        results = [byid.get(r['id'], r) for r in results]
    order = {l['id']: i for i, l in enumerate(lines)}
    results.sort(key=lambda r: order[r['id']])
    manifest = [{k: r.get(k) for k in ('id', 'group', 'key', 'source', 'text', 'tts_text',
                                        'file', 'duration_s', 'chunks', 'status')} for r in results]
    json.dump(manifest, open(OUT + '/manifest.json', 'w'), indent=1)
    ok = sum(1 for r in results if r['status'] == 'ok')
    print(f'=== {ok}/{len(results)} clips ok')
    for r in results:
        if r['status'] != 'ok': print('STILL FAILING:', r['id'], r['status'])

if __name__ == '__main__':
    main()
