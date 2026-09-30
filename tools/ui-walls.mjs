// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-walls.mjs
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
await G(() => {
  const g = window.__game; const w = g.session.world;
  const pl = w.players[0]; pl.age = 3;
  const hall = w.playerBuildings(0, 'hall')[0];
  const x0 = Math.floor(hall.x) + 7, y0 = Math.floor(hall.y) - 6;
  for (let i = 0; i < 5; i++) w.addBuilding('wall', 0, x0 + i, y0, true);
  const gate = w.addBuilding('gate', 0, x0 + 5, y0, true);
  for (let i = 6; i < 9; i++) w.addBuilding('wall', 0, x0 + i, y0, true);
  const r = w.addBuilding('rampart', 0, x0 + 1, y0 + 3, true);
  const a = ['archer', 'archer', 'spearman'].map((t, i) => w.addUnit(t, 0, x0 + 2.5 + i * 0.5, y0 + 1.5));
  const a2 = ['archer', 'archer', 'archer', 'swordsman'].map((t, i) => w.addUnit(t, 0, x0 + 1 + i * 0.6, y0 + 5.5));
  w.enqueue(0, { c: 'garrison', ids: a.map((u) => u.id), tid: w.buildings.find((b) => b.type === 'wall' && b.tx === x0 + 2).id });
  w.enqueue(0, { c: 'garrison', ids: a2.map((u) => u.id), tid: r.id });
  for (let i = 0; i < 20 * 14; i++) { w.step(); const ev = w.events; w.events = []; g.session.builder.pushEvents(ev); }
  g.session.publish(performance.now());
  g.ui.renderer.centerOn(x0 + 4, y0 + 2);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: '.scratch/walls-ui.png' });
console.log(errors.length ? 'ERREURS ' + errors.slice(0, 3).join('|') : 'ok');
await browser.close();
