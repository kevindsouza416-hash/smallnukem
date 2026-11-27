#!/usr/bin/env python3
# patch-tests159 — test locks for patch159 (ship #24, levers: snap +
# presets + keyboard APG). Worker T3, TEST-LOCK for patch159 only.
#
# Edits tests/value-checks.mjs ONLY. No existing check covers SNAP159,
# the preset chips, padStepFine / SN_PADSTEP_FINE, or the APG gate
# (the suite predates patch159), so all locks below are new. String
# locks in the suite's idiom (the SN_TOUCH sheet code is not
# extractable in the suite's extract-and-run style), plus two sliced
# region checks where a bare includes() cannot express the lock:
#   - snap confinement: snapTarget( occurs exactly 9 times (1 def +
#     4 padStep + 1 padStepFine + 3 up()) AND the sheetMove body —
#     the mid-drag path — contains no snapTarget call at all, so a
#     future mid-drag snap fails the suite;
#   - presets write pop.target only: the presetApply159 body slice
#     carries the four pop.target.* writes and no direct assignment
#     to the live leverPct / bypassPct / leakPct values (a preset
#     that teleported the sim value instead of the target fails).
#
# ABSENCE LOCKS (deliberate omissions, Kevin's S3.7 reservation):
# patch159 deliberately ships NO 'CUT TO 13%' chip (13 is an L3
# recovery value, not a procedure set-point) and NO commit button
# (explicit two-stage commit is deferred). The last two checks pin
# those absences: a future patch adding either silently fails here.
# They pass on unpatched ship23 too — by design: they guard against
# future additions, not against ship #23 (same semantics as B8's
# functional dwell checks passing on the control).
#
# Usage: python3 patch-tests159.py [suite_path] [expected_input_md5]
#   Chain AFTER patch-tests151 (and after T2's 152-158 locks when
#   present): pass the actual pre-edit suite MD5, or 'none'.
import hashlib
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else 'tests/value-checks.mjs'
EXPECTED = sys.argv[2] if len(sys.argv) > 2 else 'none'

text = open(PATH, encoding='utf-8').read()
in_md5 = hashlib.md5(text.encode()).hexdigest()
if EXPECTED.lower() != 'none':
    assert in_md5 == EXPECTED, 'patch-tests159 input MD5 %s != pin %s' % (in_md5, EXPECTED)
    print('input MD5 pin OK:', in_md5)
else:
    print('input MD5 pin skipped; actual:', in_md5)

ANCHOR = """console.log('\\n' + pass + ' passed, ' + fail + ' failed');"""
assert text.count(ANCHOR) == 1, 'summary anchor count %d' % text.count(ANCHOR)

BLOCK = r'''
// ---- patch159 (ship #24): lever snap tables (release/step only) ----
chk('ship24 levers: SNAP159 table — rod [0,20,39,58,100], load [0,95,100], bypass/leak end-stops [0,100]', html.includes('const SNAP159 = { rod_withdraw: [0, 20, 39, 58, 100], raise_power: [0, 95, 100], steam_valve: [0, 100], isolate_leak: [0, 100] };'), '');
chk('ship24 levers: snap window is strictly inside +/-2 (a value exactly 2 away does NOT snap)', html.includes('const SNAP_WIN159 = 2;') && html.includes('for (const p of pts) if (Math.abs(v - p) < SNAP_WIN159) return p;'), '');
chk('ship24 levers: padStep routes all four results through snapTarget (snap-in-stepper, coarse sizes unchanged)', html.includes("pop.target.lever = snapTarget(a, Math.max(0, Math.min(100, (pop.target.lever ?? leverPct) + dir * 5)));") && html.includes("pop.target.lever = snapTarget(a, Math.max(0, Math.min(100, (pop.target.lever ?? leverPct) + dir * 3)));") && html.includes("pop.target.bypass = snapTarget(a, Math.max(0, Math.min(100, (pop.target.bypass ?? bypassPct) + dir * 4)));") && html.includes("pop.target.leak = snapTarget(a, Math.max(0, Math.min(100, (pop.target.leak ?? pop.leakPct ?? 0) + dir * 5)));"), '');
chk('ship24 levers: padStepFine (the fine channel) clamps then snaps through snapTarget', html.includes('const v = snapTarget(a, Math.max(0, Math.min(100, abs != null ? abs : cur + d)));') && html.includes("if (a === 'rod_withdraw' || a === 'raise_power') pop.target.lever = v;") && html.includes("else if (a === 'steam_valve') pop.target.bypass = v;") && html.includes('else pop.target.leak = v;'), '');
chk('ship24 levers: snap is confined to step + release — exactly 9 snapTarget( sites (def + 4 padStep + 1 fine + 3 up()) and NO snap call inside sheetMove (mid-drag stays free)', (html.match(/snapTarget\(/g) || []).length === 9 && (() => { const _sm = html.indexOf('function sheetMove(x, y) {'); if (_sm < 0) return false; const _se = html.indexOf('function ', _sm + 20); return _se > _sm && !html.slice(_sm, _se).includes('snapTarget'); })(), '');
chk('ship24 levers: snap-on-release in up() runs only for the grab owned by the releasing pointer (grab.id match)', html.includes('if (pop.grab && pop.grab.id === id) {   // patch159: snap-on-release'), '');
chk('ship24 levers: up() snaps the lever for leverV/leverH grabs on release', html.includes("if ((g159.kind === 'leverV' || g159.kind === 'leverH') && pop.target.lever != null) { const s159 = snapTarget(g159.a, pop.target.lever);"), '');
chk('ship24 levers: up() snaps bypass and leak for wheel grabs on release', html.includes("else if (g159.kind === 'wheel' && g159.a === 'steam_valve' && pop.target.bypass != null) { const s159 = snapTarget(g159.a, pop.target.bypass);") && html.includes("else if (g159.kind === 'wheel' && pop.target.leak != null) { const s159 = snapTarget(g159.a, pop.target.leak);"), '');

// ---- patch159 (ship #24): one preset chip per analog panel ----
chk('ship24 presets: rod chip label SET 39% and load chip label SET 100%', html.includes("if (a === 'rod_withdraw') return 'SET 39%';") && html.includes("if (a === 'raise_power') return 'SET 100%';"), '');
chk('ship24 presets: bypass chip toggles OPEN 100% / CLOSE 0% by current value (<50 opens)', html.includes("if (a === 'steam_valve') return ((pop.target.bypass ?? bypassPct) < 50) ? 'OPEN 100%' : 'CLOSE 0%';"), '');
chk('ship24 presets: leak chip label CLOSE 100%', html.includes("if (a === 'isolate_leak') return 'CLOSE 100%';"), '');
chk('ship24 presets: preset targets — rod writes lever 39, load writes lever 100', html.includes("if (a === 'rod_withdraw') pop.target.lever = 39;") && html.includes("else if (a === 'raise_power') pop.target.lever = 100;"), '');
chk('ship24 presets: preset targets — bypass toggles 100/0 by current value, leak writes 100', html.includes("else if (a === 'steam_valve') pop.target.bypass = ((pop.target.bypass ?? bypassPct) < 50) ? 100 : 0;") && html.includes("else if (a === 'isolate_leak') pop.target.leak = 100;"), '');
chk('ship24 presets: presets write pop.target ONLY (no teleport — presetApply159 body has the 4 target writes and no direct leverPct/bypassPct/leakPct assignment)', (() => { const _pa = html.indexOf('function presetApply159'); if (_pa < 0) return false; const _pe = html.indexOf('function presetChip159', _pa); if (_pe < 0) return false; const _b = html.slice(_pa, _pe); return _b.includes('pop.target.lever = 39') && _b.includes('pop.target.lever = 100') && _b.includes('pop.target.bypass =') && _b.includes('pop.target.leak = 100') && !_b.includes('leverPct =') && !_b.includes('bypassPct =') && !_b.includes('leakPct ='); })(), '');
chk('ship24 presets: chip hit branch in sheetDown (120x44 at (cz.x, soY(248))) fires before the control branches — a chip tap never starts a drag', html.includes('if (presetLabel159(a) && Math.abs(lx - cz.x) <= 60 && Math.abs(ly - soY(248)) <= 22) { presetApply159(a); return; }'), '');
chk('ship24 presets: the chip is drawn on all three panel kinds (rod, load, wheel)', (html.match(/presetChip159\(r, a\);   \/\/ patch159/g) || []).length === 3, '');

// ---- patch159 (ship #24): rod rail mark + fine entry export ----
chk('ship24 levers: rod rail carries the gold tick + 39 label at the step target', html.includes("{ const y39 = bot - (bot - top) * 0.39; ctx.fillStyle = '#ffd75e'; ctx.fillRect(cx + 12, y39 - 1, 18, 2.5); ctx.font = 'bold 10px Courier New'; ctx.fillText('39', cx + 34, y39 + 3); }"), '');
chk('ship24 levers: window.SN_PADSTEP_FINE is exported (patch160 wheel entry)', html.includes('window.SN_PADSTEP_FINE = padStepFine;'), '');

// ---- patch159 (ship #24): keyboard APG on patch153 engagement ----
chk('ship24 APG: gate is patch153 engagement exactly — no modifiers, STEPPERS panel, (!!pop.grab || panelFocus === primary)', html.includes("if (!e.ctrlKey && !e.metaKey && !e.altKey && typeof SN_TOUCH !== 'undefined' && SN_TOUCH.pop && typeof SN_WASD !== 'undefined' && SN_WASD.STEPPERS[SN_TOUCH.pop.action] && typeof SN_PADSTEP_FINE !== 'undefined' && (!!SN_TOUCH.pop.grab || SN_WASD.panelFocus === 'primary')) {"), '');
chk('ship24 APG: arrows step +/-1 and PageUp/PageDown step +/-10', html.includes("if (e.code === 'ArrowRight' || e.code === 'ArrowUp') d159 = 1;") && html.includes("else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') d159 = -1;") && html.includes("else if (e.code === 'PageUp') d159 = 10;") && html.includes("else if (e.code === 'PageDown') d159 = -10;"), '');
chk('ship24 APG: Home goes to 0 and End goes to 100 (absolute stops)', html.includes("else if (e.code === 'Home') abs159 = 0;") && html.includes("else if (e.code === 'End') abs159 = 100;"), '');
chk('ship24 APG: a consumed key goes through SN_PADSTEP_FINE and is preventDefaulted, edge-cleared and stopImmediatePropagationed (153 coarse stepper cannot double-step)', html.includes('SN_PADSTEP_FINE(a159, d159 || 0, abs159);\n      e.preventDefault();\n      keysJustPressed[e.code] = false;\n      e.stopImmediatePropagation();'), '');

// ---- patch159 (ship #24): deliberate omissions (Kevin S3.7) ----
chk('ship24 omissions: NO CUT TO 13% chip — no quoted chip label and the string survives only in the deliberate-omission comment (<=1 occurrence)', !html.includes("'CUT TO 13%'") && !html.includes('"CUT TO 13%"') && (html.match(/CUT TO 13/g) || []).length <= 1, '');
chk('ship24 omissions: NO commit button — no COMMIT label, no commitPop, no commit function (two-stage commit stays deferred)', !html.includes('COMMIT') && !html.includes('commitPop') && !html.includes('function commit'), '');

'''
text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
open(PATH, 'w', encoding='utf-8').write(text)
print('patch-tests159 applied OK, output MD5', hashlib.md5(text.encode()).hexdigest())
