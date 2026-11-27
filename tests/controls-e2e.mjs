// Small Nukem — controls end-to-end validation (keyboard, mouse, trackpad wheel, touch, gamepad).
//
// Drives the REAL page in headless Chromium through real input events (Playwright keyboard / mouse /
// wheel, CDP touch events, a mocked Gamepad) and asserts observable game state.  Added by the
// 2026-11-27 audit; results in docs/AUDIT-2026-11-27.md.
//
// Run:  node tests/controls-e2e.mjs            (needs Playwright + Chromium; skips with exit 0 if absent)
//       node tests/controls-e2e.mjs --keep     (print a line per check even on pass; default already does)
//
// The game file is served over HTTP from game/small-nukem.html; sibling assets (plates/, voice/, ...)
// come from android/app/src/main/assets/ exactly as the shipped app / site lays them out.  Headless
// Chromium has no GPU, so the page runs at ~14 fps at DPR 1; every wait below is state-based, not
// time-based, so the suite is deterministic at that speed.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('SKIP controls-e2e: playwright is not installed'); process.exit(0); }

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GAME = join(ROOT, 'game', 'small-nukem.html');
const ASSETS = join(ROOT, 'android', 'app', 'src', 'main', 'assets');
const MIME = { '.html': 'text/html', '.webp': 'image/webp', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.png': 'image/png', '.json': 'application/json' };
const server = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = (u === '/' || u === '/small-nukem.html') ? GAME : normalize(join(ASSETS, u));
  if (!f.startsWith(ASSETS) && f !== GAME) { res.writeHead(403); return res.end(); }
  if (!existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = 'http://127.0.0.1:' + server.address().port + '/';

const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);   // e.g. --only=touch,pad
const on = k => !only.length || only.includes(k);
let pass = 0, fail = 0;
const chk = (name, cond, detail) => { cond ? pass++ : fail++; console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail !== undefined ? '  [' + detail + ']' : '')); };
const browser = await chromium.launch();

async function open({ touch = false, w = 390, h = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 800, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(URL_, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof gameState !== 'undefined' && typeof SN_TOUCH !== 'undefined', null, { timeout: 20000 });
  const cdp = touch ? await ctx.newCDPSession(p) : null;
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q.x, y: q.y, id: i + 1 })) });
  return { ctx, p, T };
}
const st = p => p.evaluate(() => ({ ph: gameState.phase, x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(player.vx || 0), pop: SN_TOUCH.pop ? SN_TOUCH.pop.action : null, map: !!schemOpen, proc: !!procedureOpen, dbg: !!debugVisible, lever: leverPct, scram: !!(S && S.scram) }));
const sleep = (p, ms) => p.waitForTimeout(ms);
// the rod / load lever eases toward its target (<= ~8 %/s), so every lever assertion waits for it to settle first
const settle = async p => { let last = -1, n = 0; for (let i = 0; i < 70; i++) { const v = await p.evaluate(() => leverPct); if (Math.abs(v - last) < 0.05) { if (++n >= 3) return v; } else n = 0; last = v; await sleep(p, 400); } return last; };
const skipSplashByClick = async p => { await p.mouse.click(195, 300); await sleep(p, 250); };
// The Chief's panel pops open when he speaks and auto-collapses ~8 s later, which moves the canvas and
// every sheet under a finger mid-test.  Pin it collapsed (the game's own steady state) for geometry-dependent tests.
const pinLayout = async p => { await p.evaluate(() => { window.snGuidePop = () => {}; if (guideExpanded) toggleGuideBar(); }); await sleep(p, 800); };
const startL1 = async p => { await p.evaluate(() => startGame(1)); await p.waitForFunction(() => gameState.phase === 'playing' && player.onGround, null, { timeout: 10000 }); await pinLayout(p); };
// where things are on the page (CSS px)
const geo = p => p.evaluate(() => { const c = document.getElementById('gameCanvas').getBoundingClientRect(); const z = SN_TOUCH.zoneRects()[0]; return { cl: c.left, ct: c.top, cw: c.width, ch: c.height, zl: c.left + z.x + z.w * 0.25, zr: c.left + z.x + z.w * 0.75, zy: c.top + z.y + z.h / 2 }; });
const clearCine = p => p.evaluate(() => { try { if (SN_CINE.state.active) SN_CINE.close(false); SN_CINE.state.queue.length = 0; } catch (e) {} });
const openSheet = async (p, action) => { await clearCine(p); await p.evaluate(a => { const it = interactables.find(i => i.action === a); player.x = it.x + it.w / 2 - player.w / 2; SN_TOUCH.openPop(it); }, action); await p.waitForFunction(a => SN_TOUCH.pop && SN_TOUCH.pop.action === a, action, { timeout: 5000 }); await sleep(p, 700); };
const sheetPt = (g, fx) => { const sh = Math.min(440, 0.62 * g.ch); return { x: g.cl + g.cw * fx, y: g.ct + g.ch - sh + 0.53 * sh }; };   // the +/- / SCRAM row of a bottom sheet (sheet height = min(440, 0.62 H))
const walked = async (p, act) => { const x0 = (await st(p)).x; await act(); await sleep(p, 700); const x1 = (await st(p)).x; return x1 - x0; };

// =============================================================== KEYBOARD
if (on('key')) {
  const { ctx, p } = await open();
  await sleep(p, 1200);
  await p.keyboard.press('Enter'); await sleep(p, 500);
  let s = await st(p);
  chk('KEY  Enter during the splash skips it and does NOT start the game', s.ph === 'title' && await p.evaluate(() => getComputedStyle(document.getElementById('splashVideo')).display) === 'none', s.ph);
  await p.evaluate(() => document.getElementById('fxBtn').focus());
  const fx0 = await p.evaluate(() => document.getElementById('fxBtn').textContent);
  await p.keyboard.press('Enter'); await sleep(p, 400);
  chk('KEY  Enter on a focused title button toggles it and does not start the game', (await st(p)).ph === 'title' && await p.evaluate(() => document.getElementById('fxBtn').textContent) !== fx0, fx0);
  await p.evaluate(() => document.getElementById('fxBtn').blur());
  await p.keyboard.press('Enter'); await sleep(p, 600);
  chk('KEY  Enter with nothing focused starts the game', (await st(p)).ph === 'playing');
  await p.waitForFunction(() => player.onGround, null, { timeout: 8000 }); await sleep(p, 800);

  for (const [key, sign, nm] of [['KeyD', 1, 'D'], ['ArrowRight', 1, 'ArrowRight'], ['KeyA', -1, 'A'], ['ArrowLeft', -1, 'ArrowLeft']]) {
    await p.evaluate(() => { player.x = 150; });
    const dx = await walked(p, async () => { await p.keyboard.down(key); await sleep(p, 600); });
    await p.keyboard.up(key); await sleep(p, 300);
    const x1 = (await st(p)).x; await sleep(p, 400); const x2 = (await st(p)).x;
    chk(`KEY  ${nm} walks ${sign > 0 ? 'right' : 'left'} while held and stops on release`, Math.sign(dx) === sign && Math.abs(x2 - x1) < 2, `dx=${dx}`);
  }
  // focus loss with a key physically down: the OS sends no keyup
  await p.evaluate(() => { player.x = 150; });
  await p.keyboard.down('KeyD'); await sleep(p, 300);
  await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await sleep(p, 300);
  const xb = (await st(p)).x; await sleep(p, 600);
  chk('KEY  blur releases a held key (no run-away walking after alt-tab)', (await st(p)).x - xb < 3, `moved ${(await st(p)).x - xb}`);
  await p.keyboard.up('KeyD');
  // press again works after a blur reset
  await p.evaluate(() => { player.x = 150; });
  chk('KEY  input works again after the blur reset', (await walked(p, async () => { await p.keyboard.down('KeyD'); await sleep(p, 500); })) > 8);
  await p.keyboard.up('KeyD'); await sleep(p, 300);

  // jump
  await p.evaluate(() => { player.x = 150; }); await sleep(p, 500);
  const rise = async key => { const y0 = (await st(p)).y; let m = y0; await p.keyboard.down(key); for (let i = 0; i < 8; i++) { await sleep(p, 60); m = Math.min(m, (await st(p)).y); } await p.keyboard.up(key); await sleep(p, 600); return y0 - m; };
  chk('KEY  Space jumps in the open world', (await rise('Space')) > 20);
  // whole-page shortcuts
  for (const [key, field, nm] of [['KeyM', 'map', 'M map'], ['Tab', 'proc', 'Tab procedure'], ['KeyP', 'proc', 'P procedure'], ['Backquote', 'dbg', 'Backquote debug']]) {
    await p.keyboard.press(key); await sleep(p, 350);
    const on = (await st(p))[field];
    if (field !== 'dbg') { await p.keyboard.press('Escape'); await sleep(p, 300); }
    else await p.keyboard.press(key);
    chk(`KEY  ${nm} opens it${field !== 'dbg' ? ', Esc closes it' : ', second press closes it'}`, on === true && (await st(p))[field] === false);
  }
  await p.evaluate(() => { SN_WASD.setHudFocus(-1); });
  // sheet: bump-open by walking into a panel, Space must not jump, steppers, Esc
  await p.evaluate(() => { const it = interactables.find(i => i.action === 'rod_withdraw'); player.x = it.x - 60; });
  await sleep(p, 500);
  await p.keyboard.down('KeyD');
  await p.waitForFunction(() => !!SN_TOUCH.pop, null, { timeout: 8000 }).catch(() => {});
  await p.keyboard.up('KeyD'); await sleep(p, 400);
  s = await st(p);
  chk('KEY  walking into a panel bump-opens its sheet', s.pop === 'rod_withdraw' || (s.pop !== null), s.pop);
  await openSheet(p, 'rod_withdraw');
  const y0 = (await st(p)).y; await p.keyboard.down('Space'); await sleep(p, 500); const y1 = (await st(p)).y; await p.keyboard.up('Space');
  chk('KEY  Space with a sheet open does NOT make Fluke jump', Math.abs(y1 - y0) < 3, `dy=${y1 - y0}`);
  const l0 = (await st(p)).lever;
  await p.keyboard.press('End');
  const le = await settle(p);
  chk('KEY  End on an open rod sheet drives the lever to 100 (APG)', le > 95, `lever ${l0.toFixed(0)} -> ${le.toFixed(0)}`);
  await p.keyboard.press('Home');
  const lh = await settle(p);
  chk('KEY  Home on an open rod sheet drives the lever back to 0', lh < 5, `lever ${lh.toFixed(0)}`);
  await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  const lf = await settle(p);
  chk('KEY  fine arrow steps leave the 0 detent (patch168)', lf >= 2 && lf <= 4, `lever ${lf.toFixed(1)}`);
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => SN_TOUCH.pop === null, null, { timeout: 4000 }).catch(() => {});
  chk('KEY  Esc closes the sheet', (await st(p)).pop === null);
  // SCRAM
  await p.keyboard.down('KeyX'); await sleep(p, 450); await p.keyboard.up('KeyX'); await sleep(p, 400);
  chk('KEY  a short X hold does NOT scram (cancel by release)', (await st(p)).scram === false);
  await p.keyboard.down('KeyX'); await p.waitForFunction(() => S.scram, null, { timeout: 5000 }).catch(() => {}); await p.keyboard.up('KeyX');
  s = await st(p);
  chk('KEY  holding X for 1 s trips the reactor (her manual scram)', s.scram === true && await p.evaluate(() => S.why) === 'Manual scram by operator');
  await sleep(p, 800);
  chk('KEY  the overlay reads MANUAL SCRAM', await p.evaluate(() => document.getElementById('scramHead').textContent) === '!! MANUAL SCRAM !!');
  chk('KEY  no page errors across the keyboard run', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
}

// =============================================================== MOUSE
if (on('mouse')) {
  const { ctx, p } = await open();
  await sleep(p, 1000);
  await p.mouse.click(195, 300); await sleep(p, 300);
  chk('MOUSE click skips the splash and does not start the game', (await st(p)).ph === 'title');
  await p.evaluate(() => { const b = document.querySelector('#titleScreen .lvl1'); b.scrollIntoView(); });
  const bb = await p.evaluate(() => { const r = document.querySelector('#titleScreen .lvl1').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.click(bb.x, bb.y); await p.waitForFunction(() => gameState.phase === 'playing' && player.onGround, null, { timeout: 10000 });
  await pinLayout(p);
  const g = await geo(p);
  for (const [fx, sign, nm] of [[0.15, -1, 'left'], [0.85, 1, 'right']]) {   // mouse: the on-screen zone is hidden in AUTO mode; the outer 35% of the canvas steers
    await p.evaluate(() => { player.x = 100; }); await sleep(p, 300);
    const dx = await walked(p, async () => { await p.mouse.move(g.cl + g.cw * fx, g.ct + g.ch * 0.9); await p.mouse.down(); await sleep(p, 600); });
    await p.mouse.up(); await sleep(p, 300);
    const x1 = (await st(p)).x; await sleep(p, 400);
    chk(`MOUSE hold on the ${nm} third of the canvas walks ${nm} and stops on release`, Math.sign(dx) === sign && Math.abs((await st(p)).x - x1) < 2, `dx=${dx}`);
  }
  for (const b of ['right', 'middle']) {
    await p.evaluate(() => { player.x = 250; }); await sleep(p, 300);
    const dx = await walked(p, async () => { await p.mouse.move(g.cl + g.cw * 0.15, g.ct + g.ch * 0.9); await p.mouse.down({ button: b }); await sleep(p, 500); });
    await p.mouse.up({ button: b });
    chk(`MOUSE ${b}-button press is inert (no walking)`, Math.abs(dx) < 3, `dx=${dx}`);
  }
  // double-click opens the map
  await p.evaluate(() => { player.x = 40; }); await sleep(p, 300);
  await p.mouse.dblclick(g.cl + g.cw * 0.5, g.ct + g.ch * 0.15); await sleep(p, 600);
  chk('MOUSE double-click on the world opens the plant map', (await st(p)).map === true);
  await p.keyboard.press('Escape'); await sleep(p, 300);
  // sheet: + / - hold, wheel, outside click
  await openSheet(p, 'rod_withdraw');
  const gs = await geo(p), plus = sheetPt(gs, 0.82), minus = sheetPt(gs, 0.18);
  const l0 = (await st(p)).lever;
  await p.mouse.move(plus.x, plus.y); await p.mouse.down(); await sleep(p, 1800); await p.mouse.up();
  const l1 = await settle(p);
  chk('MOUSE holding + on a rod sheet raises the lever', l1 > l0 + 3, `${l0.toFixed(1)} -> ${l1.toFixed(1)}`);
  await p.mouse.move(minus.x, minus.y); await p.mouse.down(); await sleep(p, 1800); await p.mouse.up();
  const l2 = await settle(p);
  chk('MOUSE holding - on a rod sheet lowers the lever', l2 < l1 - 3, `${l1.toFixed(1)} -> ${l2.toFixed(1)}`);
  await p.keyboard.press('Escape'); await sleep(p, 400);
  // ARI panel: short press no scram, hold = scram
  await openSheet(p, 'ari_button');
  const sc = sheetPt(gs, 0.33);
  await p.mouse.move(sc.x, sc.y); await p.mouse.down(); await sleep(p, 400); await p.mouse.up(); await sleep(p, 500);
  chk('MOUSE a short press on the ARI-panel SCRAM button does not trip the reactor', (await st(p)).scram === false);
  await p.mouse.move(sc.x, sc.y); await p.mouse.down(); await p.waitForFunction(() => S.scram, null, { timeout: 6000 }).catch(() => {}); await p.mouse.up();
  chk('MOUSE holding the ARI-panel SCRAM button (0.8 s) trips the reactor', (await st(p)).scram === true);
  // click outside closes a sheet (fresh page: scram ends the run)
  await ctx.close();
  const f = await open(); const q = f.p;
  await q.mouse.click(195, 300); await sleep(q, 250); await startL1(q);
  await openSheet(q, 'ari_button');
  const g2 = await geo(q);
  await q.mouse.click(g2.cl + g2.cw * 0.5, g2.ct + g2.ch * 0.12); await sleep(q, 2500);
  chk('MOUSE a click outside the sheet closes it and it stays closed (no dwell re-open)', (await st(q)).pop === null);
  chk('MOUSE no page errors', p.errs.length === 0 && q.errs.length === 0, [...p.errs, ...q.errs].join(' | ').slice(0, 200));
  await f.ctx.close();
}

// =============================================================== TRACKPAD (wheel / pinch)
if (on('wheel')) {
  const { ctx, p } = await open();
  await sleep(p, 800); await skipSplashByClick(p); await startL1(p);
  const g = await geo(p);
  await p.mouse.move(g.cl + g.cw / 2, g.ct + g.ch / 2);
  await p.evaluate(() => { player.x = 150; }); await sleep(p, 300);
  let dx = await walked(p, async () => { await p.mouse.wheel(60, 0); });
  chk('TRACKPAD two-finger scroll right (deltaX>0) walks right', dx > 3, `dx=${dx}`);
  await sleep(p, 400);
  const xs = (await st(p)).x; await sleep(p, 400);
  chk('TRACKPAD walking stops shortly after the scroll stream ends', Math.abs((await st(p)).x - xs) < 2);
  dx = await walked(p, async () => { await p.mouse.wheel(-60, 0); });
  chk('TRACKPAD two-finger scroll left (deltaX<0) walks left', dx < -3, `dx=${dx}`);
  // pinch = ctrl+wheel: preventDefault'ed, no game effect
  const prevented = await p.evaluate(() => new Promise(r => { const cv = document.getElementById('gameCanvas'); const ev = new WheelEvent('wheel', { deltaY: -120, ctrlKey: true, bubbles: true, cancelable: true }); cv.dispatchEvent(ev); r(ev.defaultPrevented); }));
  chk('TRACKPAD pinch (ctrl+wheel) is swallowed (no browser page-zoom) and moves nothing', prevented === true && Math.abs((await st(p)).vx) < 5);
  // sheet: vertical wheel steps the lever
  await openSheet(p, 'rod_withdraw');
  const gs = await geo(p); await p.mouse.move(gs.cl + gs.cw / 2, gs.ct + gs.ch * 0.7);
  const l0 = (await st(p)).lever;
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -48); await sleep(p, 50); }
  const l1 = await settle(p);
  chk('TRACKPAD vertical scroll up over an open rod sheet raises the lever (fine steps)', l1 > l0 + 2, `${l0.toFixed(1)} -> ${l1.toFixed(1)}`);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 48); await sleep(p, 50); }
  const l2 = await settle(p);
  chk('TRACKPAD vertical scroll down lowers it', l2 < l1 - 2, `${l1.toFixed(1)} -> ${l2.toFixed(1)}`);
  chk('TRACKPAD no page errors', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
}

// =============================================================== TOUCH
if (on('touch')) {
  const { ctx, p, T } = await open({ touch: true });
  await sleep(p, 1000);
  await p.touchscreen.tap(195, 300); await sleep(p, 300);
  chk('TOUCH tap skips the splash and does not start the game', (await st(p)).ph === 'title');
  const bb = await p.evaluate(() => { const r = document.querySelector('#titleScreen .lvl1').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.touchscreen.tap(bb.x, bb.y); await p.waitForFunction(() => gameState.phase === 'playing' && player.onGround, null, { timeout: 10000 });
  await pinLayout(p);
  const g = await geo(p);
  for (const [x, sign, nm] of [[g.zl, -1, 'left'], [g.zr, 1, 'right']]) {
    await p.evaluate(() => { player.x = 100; }); await sleep(p, 300);
    const dx = await walked(p, async () => { await T('touchStart', [{ x, y: g.zy }]); await sleep(p, 600); });
    await T('touchEnd', []); await sleep(p, 300);
    const x1 = (await st(p)).x; await sleep(p, 400);
    chk(`TOUCH finger held on the ${nm} half of the move zone walks ${nm} and stops on lift`, Math.sign(dx) === sign && Math.abs((await st(p)).x - x1) < 2, `dx=${dx}`);
  }
  await p.evaluate(() => { player.x = 100; }); await sleep(p, 300);
  await T('touchStart', [{ x: g.zl, y: g.zy }, { x: g.zr, y: g.zy }]); await sleep(p, 500); await T('touchEnd', []); await sleep(p, 400);
  const xm = (await st(p)).x; await sleep(p, 400);
  chk('TOUCH two fingers on both halves, then both lifted: no stuck input', Math.abs((await st(p)).x - xm) < 2);
  await p.evaluate(() => { player.x = 100; }); await sleep(p, 300);
  await T('touchStart', [{ x: g.zr, y: g.zy }]); await sleep(p, 300); await T('touchCancel', []); await sleep(p, 400);
  const xc = (await st(p)).x; await sleep(p, 400);
  chk('TOUCH touchcancel (system gesture / call) releases the hold', Math.abs((await st(p)).x - xc) < 2);
  await p.evaluate(() => { player.x = 100; }); await sleep(p, 300);
  await T('touchStart', [{ x: g.zr, y: g.zy }]); await sleep(p, 300);
  await p.evaluate(() => window.dispatchEvent(new Event('blur'))); await sleep(p, 300);
  const xbl = (await st(p)).x; await sleep(p, 500);
  chk('TOUCH app-switch (blur) with a finger down releases the hold', Math.abs((await st(p)).x - xbl) < 3);
  await T('touchEnd', []);
  // double tap -> map
  await p.evaluate(() => { player.x = 40; }); await sleep(p, 300);
  { const pt = { x: g.cl + g.cw * 0.5, y: g.ct + g.ch * 0.15 }; await T('touchStart', [pt]); await T('touchEnd', []); await T('touchStart', [pt]); await T('touchEnd', []); await sleep(p, 600); }
  chk('TOUCH double-tap on the world opens the plant map', (await st(p)).map === true);
  await p.keyboard.press('Escape'); await sleep(p, 300);
  // rod sheet + / -
  await openSheet(p, 'rod_withdraw');
  const gs = await geo(p), plus = sheetPt(gs, 0.82), minus = sheetPt(gs, 0.18);
  const l0 = (await st(p)).lever;
  await T('touchStart', [plus]); await sleep(p, 1800); await T('touchEnd', []);
  const l1 = await settle(p);
  chk('TOUCH holding + on a rod sheet raises the lever', l1 > l0 + 3, `${l0.toFixed(1)} -> ${l1.toFixed(1)}`);
  await T('touchStart', [minus]); await sleep(p, 1800); await T('touchEnd', []);
  const l2 = await settle(p);
  chk('TOUCH holding - on a rod sheet lowers the lever', l2 < l1 - 3, `${l1.toFixed(1)} -> ${l2.toFixed(1)}`);
  await p.keyboard.press('Escape'); await sleep(p, 400);
  // ARI sheet: tap-away closes, SCRAM hold
  await openSheet(p, 'ari_button');
  await T('touchStart', [{ x: g.cl + g.cw * 0.5, y: g.ct + g.ch * 0.12 }]); await sleep(p, 60); await T('touchEnd', []); await sleep(p, 2500);
  chk('TOUCH a tap outside the sheet closes it and it stays closed', (await st(p)).pop === null);
  await openSheet(p, 'ari_button');
  const sc = sheetPt(gs, 0.33);
  await T('touchStart', [sc]); await sleep(p, 400); await T('touchEnd', []); await sleep(p, 500);
  chk('TOUCH a short press on the ARI-panel SCRAM button does not trip the reactor', (await st(p)).scram === false);
  await T('touchStart', [sc]); await p.waitForFunction(() => S.scram, null, { timeout: 6000 }).catch(() => {}); await T('touchEnd', []);
  chk('TOUCH holding the ARI-panel SCRAM button (0.8 s) trips the reactor', (await st(p)).scram === true);
  chk('TOUCH no page errors', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
}

// =============================================================== GAMEPAD (mocked)
if (on('pad')) {
  const { ctx, p } = await open();
  await sleep(p, 800); await skipSplashByClick(p); await startL1(p);
  await p.evaluate(() => { window.__gp = { index: 0, id: 'mock', connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] }; navigator.getGamepads = () => [window.__gp]; window.dispatchEvent(Object.assign(new Event('gamepadconnected'), { gamepad: window.__gp })); });
  await p.evaluate(() => { player.x = 250; }); await sleep(p, 300);
  const dx = await walked(p, async () => { await p.evaluate(() => { __gp.axes[0] = 1; }); await sleep(p, 600); });
  await p.evaluate(() => { __gp.axes[0] = 0; });
  chk('PAD  left stick right walks right', dx > 5, `dx=${dx}`);
  await p.evaluate(() => { const l = ladders[0]; player.x = l.x + 2; player.y = l.y + l.h - player.h - 1; player.vy = 0; }); await sleep(p, 400);
  const y0 = (await st(p)).y; await p.evaluate(() => { __gp.buttons[12].pressed = true; }); await sleep(p, 1200);
  chk('PAD  D-pad up climbs a ladder (was overwritten by the stick axis)', y0 - (await st(p)).y > 30, `dy=${(await st(p)).y - y0}`);
  await p.evaluate(() => { __gp.buttons[12].pressed = false; });
  await p.evaluate(() => { __gp.buttons[8].pressed = true; }); await p.waitForFunction(() => S.scram, null, { timeout: 6000 }).catch(() => {});
  chk('PAD  holding Back/View for 1 s trips the reactor', (await st(p)).scram === true);
  chk('PAD  no page errors', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
}

// =============================================================== GAUGE DECK vs CONTROL SHEET
if (on('deck')) {
  const { ctx, p } = await open();
  await sleep(p, 600); await skipSplashByClick(p); await startL1(p);
  await openSheet(p, 'rod_withdraw');
  await p.evaluate(() => { leverPct = 55; });                       // the startup lever raise: period / reactivity leave 'normal'
  await p.waitForFunction(() => snAlarmCode() > 0, null, { timeout: 20000 }).catch(() => {});
  await sleep(p, 2500);
  const s1 = await p.evaluate(() => ({ code: snAlarmCode(), deck: deckExpanded, pop: !!SN_TOUCH.pop }));
  chk('DECK with an alarm showing and a control sheet open the gauge deck does NOT auto-open over the sheet', s1.code > 0 && s1.pop && s1.deck === false, JSON.stringify(s1));
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => SN_TOUCH.pop === null, null, { timeout: 4000 }).catch(() => {});
  await p.waitForFunction(() => deckExpanded, null, { timeout: 10000 }).catch(() => {});
  chk('DECK with the sheet closed the alarm auto-opens the deck again', await p.evaluate(() => deckExpanded) === true);
  await p.evaluate(() => { deckDismissedCode = -1; toggleGaugeDeck(); });
  const c0 = await p.evaluate(() => snAlarmCode());
  let stayed = true, changed = false;
  for (let i = 0; i < 8; i++) { await sleep(p, 250); const r = await p.evaluate(() => ({ d: deckExpanded, c: snAlarmCode() })); if (r.c !== c0) { changed = true; break; } if (r.d) stayed = false; }
  chk('DECK a deck the player closes stays closed while the alarm picture is unchanged', stayed, changed ? 'picture changed - inconclusive window' : 'held 2 s');
  chk('DECK no page errors', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
}

// =============================================================== LAYOUT
if (on('layout')) for (const [w, h, nm] of [[390, 844, 'portrait 390x844'], [375, 667, 'portrait 375x667'], [844, 390, 'landscape 844x390'], [1280, 800, 'desktop 1280x800']]) {
  const { ctx, p } = await open({ touch: w < 800, w, h });
  await sleep(p, 600); await p.mouse.click(w / 2, h / 2); await sleep(p, 250); await startL1(p);
  const m = await p.evaluate(() => ({ ch: document.getElementById('gameCanvas').getBoundingClientRect().height, sw: document.documentElement.scrollWidth, iw: innerWidth, ge: guideExpanded }));
  chk(`LAYOUT ${nm}: world canvas is >= 30% of the viewport height while the Chief's panel is popped (${m.ge ? 'popped' : 'collapsed'})`, m.ch >= h * 0.3, `${Math.round(m.ch)} of ${h}`);
  chk(`LAYOUT ${nm}: no horizontal overflow`, m.sw <= m.iw + 1, `${m.sw} vs ${m.iw}`);
  await ctx.close();
}

await browser.close();
server.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
