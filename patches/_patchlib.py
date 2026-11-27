"""Shared helper for numbered game patch scripts (AGENTS.md section 4.2).

A patch script lists (anchor, replacement) pairs.  Every anchor must occur
EXACTLY once; the Samira physics block (the BWR block) is hashed before and
after.  Usage from a patch script:

    from _patchlib import apply
    apply(161, base_md5='6dc8...', edits=[(old, new), ...])

For a deliberate physics change pass phys_after=<new md5>; every other patch
leaves the default so the block must stay byte-identical.
"""
import hashlib, os, sys

PHYS_MD5 = 'a3385f4f29207be552c4a1c48b620d9b'          # ship #24 and every earlier ship
GAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game', 'small-nukem.html')


def phys_md5(html):
    i = html.index('const BWR = (() => {')
    j = html.index('})();', i)
    return hashlib.md5(html[i:j + 5].encode()).hexdigest()


def apply(num, base_md5, edits, phys_before=PHYS_MD5, phys_after=None, path=GAME):
    phys_after = phys_after or phys_before
    raw = open(path, 'rb').read()
    got = hashlib.md5(raw).hexdigest()
    assert got == base_md5, 'patch%s: base MD5 %s != pinned %s' % (num, got, base_md5)
    html = raw.decode('utf-8')
    assert phys_md5(html) == phys_before, 'patch%s: physics block MD5 mismatch BEFORE' % num
    for n, (old, new) in enumerate(edits, 1):
        c = html.count(old)
        assert c == 1, 'patch%s edit %d: anchor occurs %d times (need exactly 1): %r' % (num, n, c, old[:90])
        html = html.replace(old, new, 1)
    assert phys_md5(html) == phys_after, 'patch%s: physics block MD5 mismatch AFTER (%s)' % (num, phys_md5(html))
    out = html.encode('utf-8')
    open(path, 'wb').write(out)
    print('patch%s applied: %s -> %s (%d B), physics %s' % (num, base_md5, hashlib.md5(out).hexdigest(), len(out), phys_md5(html)))
