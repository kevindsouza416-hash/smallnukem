#!/usr/bin/env python3
"""node --check over every inline <script> block of a single-file HTML game.

Usage: python3 tools/check-scripts.py game/small-nukem.html
Expect: 3 blocks, all OK (AGENTS.md section 5).
"""
import re, subprocess, sys, tempfile, os

path = sys.argv[1] if len(sys.argv) > 1 else "game/small-nukem.html"
html = open(path, encoding="utf-8").read()
blocks = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
bad = 0
for n, code in enumerate(blocks, 1):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(code)
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    os.unlink(f.name)
    ok = r.returncode == 0
    bad += not ok
    print(f"block {n}: {len(code):,} chars  {'OK' if ok else 'FAIL'}")
    if not ok:
        print(r.stderr)
print(f"{len(blocks)} blocks, {'all OK' if not bad else str(bad) + ' FAILED'}")
sys.exit(1 if bad else 0)
