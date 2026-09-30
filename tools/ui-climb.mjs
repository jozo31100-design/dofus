// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-climb.mjs
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(root, '.scratch', 'uitest');
fs.mkdirSync(tmp, { recursive: true });
await build({ entryPoints: [path.join(root, 'tools/ui-shot.js')], bundle: true, outfile: path.join(tmp, 'bundle.js'), format: 'iife', platform: 'browser', target: 'chrome120', logLevel: 'warning' });
fs.copyFileSync(path.join(root, 'web', 'style.css'), path.join(tmp, 'style.css'));
fs.writeFileSync(path.join(tmp, 'page.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="style.css"><body><div id="app"></div><script src="bundle.js"></script></body>');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(tmp, 'page.html') + '#game');
page.on('console', (m) => { if (/chargement/.test(m.text())) console.log('  ' + m.text()); });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
await page.waitForFunction(() => window.__game.ui.renderer.hits.length > 20, null, { timeout: 10000 });
await page.waitForTimeout(300);
const G = (fn, arg) => page.evaluate(fn, arg);
const setup = await G(() => {
  const g = window.__game; const w = g.session.world; const r = g.ui.renderer;
  const pl = w.players[0]; pl.techs.add('ladders'); pl.techList.push('ladders'); pl.statCache.clear();
  const hall = w.playerBuildings(0, 'hall')[0];
  const wx = Math.floor(hall.x) - 9, wy = Math.floor(hall.y) + 2;
  const walls = [];
  for (let i = -3; i <= 3; i++) walls.push(w.addBuilding('wall', 1, wx, wy + i, true));
  const men = [0, 1].map((i) => w.addUnit('swordsman', 0, wx + 2.5, wy + i * 0.8 - 0.4));
  g.session.publish(performance.now());
  return { wid: walls[3].id, ids: men.map((m) => m.id), wx, wy };
});
await page.waitForTimeout(400);
const scr = await G((s) => {
  const g = window.__game; const r = g.ui.renderer; const now = performance.now();
  const wall = g.state.ents.get(s.wid);
  const units = s.ids.map((i) => g.state.ents.get(i));
  g.ui.setSel(units);
  r.centerOn(wall.x, wall.y);
  return null;
}, setup);
await page.waitForTimeout(400);
const pos = await G((s) => {
  const g = window.__game; const r = g.ui.renderer; const now = performance.now();
  const wall = g.state.ents.get(s.wid);
  const [sx, sy] = r.worldToScreen(wall.x, wall.y);
  const hits = r.hits.filter((h) => h.e.id === wall.id).length;
  return { sx, sy, hits, n: r.hits.length };
}, setup);
console.log('hits sur le mur', JSON.stringify(pos));
await page.mouse.move(pos.sx, pos.sy - 14);
await page.waitForTimeout(200);
const picked = await G(() => { const g = window.__game; const t = g.ui.renderer.pick(g.ui.mouse.x, g.ui.mouse.y); return t ? { cls: t.cls, type: t.type, owner: t.owner } : null; });
console.log('pick :', JSON.stringify(picked));
await page.mouse.click(pos.sx, pos.sy - 14, { button: 'right' });
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(1500);
  const s = await G((s) => { const g = window.__game; const w = g.session.world; return s.ids.map((i) => { const u = w.get(i); return `${u.x.toFixed(1)},${u.y.toFixed(1)} ${u.order ? u.order.t + ':' + (u.order.phase || '') : '-'} ${u.climbing ? 'CLIMB' : ''}`; }).join(' | '); }, setup);
  console.log(s);
}
console.log('mur x =', setup.wx);
console.log(errors.length ? 'ERREURS ' + errors.slice(0, 3).join('|') : 'pas d\'erreur de page');
await browser.close();
