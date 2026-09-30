// Outil de contrôle visuel : empaquette un script d'entrée, l'exécute dans Chromium (sans écran)
// et enregistre une capture PNG.
//
//   node tools/shot.mjs <entree.js> <sortie.png> [LARGEURxHAUTEUR] [attente_ms]
//
// Le script d'entrée est un module ES normal qui dessine dans document.body (canvas, etc.).
// Les erreurs de la page (console.error, exceptions) sont affichées dans le terminal.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [entry, out, size = '1400x900', waitArg = '300'] = process.argv.slice(2);
if (!entry || !out) {
  console.error('usage: node tools/shot.mjs <entree.js> <sortie.png> [LxH] [attente_ms]');
  process.exit(2);
}
const [W, H] = size.split('x').map(Number);
const tmp = path.join(root, '.scratch', 'shot');
fs.mkdirSync(tmp, { recursive: true });
const bundle = path.join(tmp, 'bundle-' + process.pid + '.js');
await build({ entryPoints: [path.resolve(entry)], bundle: true, outfile: bundle, format: 'iife', platform: 'browser', target: 'chrome120', logLevel: 'warning' });
const html = path.join(tmp, 'page-' + process.pid + '.html');
fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#2b2b2b;color:#ddd;font:12px sans-serif"><script src="${path.basename(bundle)}"></script></body>`);

const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
let failed = false;
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`[page ${m.type()}]`, m.text()); else if (m.type() === 'log') console.log('[page]', m.text()); });
page.on('pageerror', (e) => { failed = true; console.log('[page EXCEPTION]', e.message, e.stack ? '\n' + e.stack.split('\n').slice(0, 4).join('\n') : ''); });
await page.setDefaultTimeout(600000); await page.goto('file://' + html, { timeout: 600000 });
await page.waitForTimeout(Number(waitArg));
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
await page.screenshot({ path: path.resolve(out), fullPage: true });
await browser.close();
fs.rmSync(bundle, { force: true });
fs.rmSync(html, { force: true });
console.log(failed ? 'TERMINE AVEC ERREURS' : 'ok', '->', out);
process.exit(failed ? 1 : 0);
