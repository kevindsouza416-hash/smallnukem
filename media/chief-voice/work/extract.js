// Extract the Chief's line structures from the build copy (read-only).
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/small-nukem-build.html', 'utf8');

function grab(marker, endMarker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  const j = src.indexOf(endMarker, i);
  if (j < 0) throw new Error('end marker not found for: ' + marker);
  return src.slice(i, j + endMarker.length);
}
function evalObj(code, name) {
  const fn = new Function(code + '; return ' + name + ';');
  return fn();
}

const out = {};

// CALLOUTS
out.CALLOUTS = evalObj(grab('const CALLOUTS = {', '};'), 'CALLOUTS');
// REACTIONS
out.REACTIONS = evalObj(grab('const REACTIONS = {', '};'), 'REACTIONS');
// ASSIST_TEACH / ASSIST_EXPLAIN
out.ASSIST_TEACH = evalObj(grab('const ASSIST_TEACH = [', '];'), 'ASSIST_TEACH');
out.ASSIST_EXPLAIN = evalObj(grab('const ASSIST_EXPLAIN = [', '];'), 'ASSIST_EXPLAIN');
// SHOWME_LINES
out.SHOWME_LINES = evalObj(grab('const SHOWME_LINES = {', '};'), 'SHOWME_LINES');
// SNX_HINTS
out.SNX_HINTS = evalObj(grab('const SNX_HINTS = {', '};'), 'SNX_HINTS');

// SN_CINE DEFS: pull line/teach per scene by regex over the DEFS region
const defsStart = src.indexOf('const DEFS = {');
const defsRegion = src.slice(defsStart, defsStart + 80000);
const sceneRe = /^\s{4}(\w+): \{ title:/gm;
const scenes = [];
let m;
while ((m = sceneRe.exec(defsRegion))) scenes.push({ name: m[1], idx: m.index });
const cine = {};
scenes.forEach((s, k) => {
  const seg = defsRegion.slice(s.idx, k + 1 < scenes.length ? scenes[k + 1].idx : s.idx + 4000);
  const lineM = seg.match(/line: ("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
  const teachM = seg.match(/teach: ("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
  const titleM = seg.match(/title: '([^']+)'/);
  cine[s.name] = {
    title: titleM ? titleM[1] : s.name,
    line: lineM ? eval(lineM[1]) : null,
    teach: teachM ? eval(teachM[1]) : null,
  };
});
out.CINE = cine;

// DEMO_TOUR say() lines
const tour = [];
const tourRe = /say\('(\w+)',\s*"((?:[^"\\]|\\.)*)"\)/g;
const tourStart = src.indexOf('function demoTourTick()');
const tourRegion = src.slice(tourStart, tourStart + 3000);
while ((m = tourRe.exec(tourRegion))) tour.push({ key: m[1], text: eval('"' + m[2] + '"') });
out.DEMO_TOUR = tour;

// Fixed spoken/caption strings elsewhere
out.FIXED = {
  takeover_announce: 'Watch — I\'ll take it from here. First, I diagnose what you\'ve handed me…',
  assist_announce: "Step aside, kid — I'll take this one and show you how it's done.",
  assist_handback: 'Your plant. Next one\'s yours.',
  assist_coach_line: "Watch how it's done, kid.",
  demo_on: 'Demo mode. Watch Fluke work the startup — touch anything to take the plant yourself.',
  demo_off: 'Demo off. The plant is yours, operator.',
  takeover_off: 'Takeover off. Your plant, operator — it stays as the driver left it.',
};

fs.writeFileSync(__dirname + '/extracted.json', JSON.stringify(out, null, 2));
let n = 0;
const count = (o) => { if (typeof o === 'string') n++; else if (o && typeof o === 'object') Object.values(o).forEach(count); };
count(out);
console.log('structures extracted; total strings:', n);
console.log('CALLOUTS keys:', Object.keys(out.CALLOUTS).length);
console.log('REACTIONS keys:', Object.keys(out.REACTIONS).length);
console.log('SHOWME keys:', Object.keys(out.SHOWME_LINES).length);
console.log('CINE scenes:', Object.keys(out.CINE).length);
console.log('DEMO_TOUR lines:', out.DEMO_TOUR.length);
