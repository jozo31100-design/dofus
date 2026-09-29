// Comme shot.mjs, mais charge la vraie feuille de style du jeu et accepte un « hash » d'URL.
//   node tools/shot-page.mjs <entree.js> <sortie.png> [LxH] [attente_ms] [hash]
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [entry, out, size = '1400x900', waitArg = '600', hash = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const tmp = path.join(root, '.scratch', 'shotpage');
fs.mkdirSync(tmp, { recursive: true });
const bundle = path.join(tmp, 'bundle.js');
await build({ entryPoints: [path.resolve(entry)], bundle: true, outfile: bundle, format: 'iife', platform: 'browser', target: 'chrome120', logLevel: 'warning' });
fs.copyFileSync(path.join(root, 'web', 'style.css'), path.join(tmp, 'style.css'));
fs.writeFileSync(path.join(tmp, 'page.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="style.css"><body><div id="app"></div><script src="bundle.js"></script></body>');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
let failed = false;
page.on('console', (m) => console.log(`[page ${m.type()}]`, m.text()));
page.on('pageerror', (e) => { failed = true; console.log('[page EXCEPTION]', e.message, e.stack ? '\n' + e.stack.split('\n').slice(0, 5).join('\n') : ''); });
await page.goto('file://' + path.join(tmp, 'page.html') + (hash ? '#' + hash : ''));
await page.waitForTimeout(Number(waitArg));
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
await page.screenshot({ path: path.resolve(out) });
await browser.close();
console.log(failed ? 'TERMINE AVEC ERREURS' : 'ok', '->', out);
process.exit(failed ? 1 : 0);
