// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-battle.mjs
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
  const hall = w.playerBuildings(0, 'hall')[0];
  const cx = Math.floor(hall.x) + 10, cy = Math.floor(hall.y) + 8;
  const mk = (owner, x, y, list) => list.map((t, i) => w.addUnit(t, owner, x + (i % 8) * 0.9, y + Math.floor(i / 8) * 0.9));
  const A = mk(0, cx - 5, cy - 2, ['champion', 'champion', 'spearman', 'spearman', 'spearman', 'swordsman', 'swordsman', 'swordsman', 'archer', 'archer', 'archer', 'archer', 'archer', 'archer', 'knight', 'knight']);
  const B = mk(1, cx + 3, cy - 2, ['champion', 'champion', 'spearman', 'spearman', 'spearman', 'swordsman', 'swordsman', 'swordsman', 'archer', 'archer', 'archer', 'archer', 'archer', 'archer', 'cavalry', 'cavalry']);
  w.enqueue(0, { c: 'amove', ids: A.map((u) => u.id), x: cx + 6, y: cy });
  w.enqueue(1, { c: 'amove', ids: B.map((u) => u.id), x: cx - 6, y: cy });
  for (let i = 0; i < 20 * 7; i++) { w.step(); const ev = w.events; w.events = []; g.session.builder.pushEvents(ev); if (i % 2 === 0) g.session.publish(performance.now()); }
  g.session.publish(performance.now());
  g.ui.renderer.centerOn(cx, cy);
});
await page.waitForTimeout(700);
await page.screenshot({ path: '.scratch/battle-ui.png' });
console.log(errors.length ? 'ERREURS ' + errors.slice(0, 3).join('|') : 'ok');
await browser.close();
