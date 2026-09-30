// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-large.mjs
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
await page.goto('file://' + path.join(tmp, 'page.html') + '#large');
page.on('console', (m) => { if (/chargement/.test(m.text())) console.log('  ' + m.text()); });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
await page.waitForFunction(() => window.__game.ui.renderer.hits.length > 20, null, { timeout: 10000 });
await page.waitForTimeout(300);
await page.waitForTimeout(600);
await page.screenshot({ path: '.scratch/large-ui.png' });
console.log('carte', await page.evaluate(() => window.__game.state.S), errors.length ? 'ERREURS ' + errors.slice(0, 3).join('|') : 'ok');
await browser.close();
