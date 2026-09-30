// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-hunt.mjs
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
const info = await G(() => {
  const g = window.__game; const r = g.ui.renderer; const now = performance.now();
  const v = [...g.state.ents.values()].find((e) => e.cls === 'unit' && e.type === 'villager' && e.owner === g.state.myIdx);
  const a = [...g.state.ents.values()].filter((e) => e.cls === 'animal').sort((p, q) => Math.hypot(p.x - v.x, p.y - v.y) - Math.hypot(q.x - v.x, q.y - v.y))[0];
  g.ui.setSel([v]);
  const [sx, sy] = r.worldToScreen(...g.state.posOf(a, now));
  return { vid: v.id, aid: a.id, type: a.type, sx, sy: sy - 8, n: [...g.state.ents.values()].filter((e) => e.cls === 'animal').length };
});
console.log('animaux visibles', info.n, 'cible', info.type);
await page.mouse.move(info.sx, info.sy);
await page.waitForTimeout(200);
const picked = await G(() => { const g = window.__game; const t = g.ui.renderer.pick(g.ui.mouse.x, g.ui.mouse.y); return t ? { cls: t.cls, type: t.type, id: t.id } : null; });
console.log('pick sous le curseur :', JSON.stringify(picked));
await page.mouse.click(info.sx, info.sy, { button: 'right' });
await page.waitForTimeout(400);
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(2500);
  const s = await G((i) => { const g = window.__game; const v = g.state.ents.get(i.vid); const a = g.state.ents.get(i.aid); return { food: g.state.me.res[0], vx: v && v.x, carry: v && v.carryAmt, ahp: a && a.hp, ac: a && a.cls, at: a && a.type }; }, info);
  console.log(JSON.stringify(s));
}
console.log(errors.length ? 'ERREURS ' + errors.slice(0, 3).join('|') : 'pas d\'erreur de page');
await browser.close();
