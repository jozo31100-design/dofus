// Lance l'appli Electron réelle, attend le chargement et prend une capture.
import { _electron as electron } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, '.scratch', 'smoke.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
const app = await electron.launch({
  executablePath: path.join(root, 'node_modules/electron/dist/electron'),
  args: [root],
  env: { ...process.env, TDG_DISABLE_GPU: '1' },
});
const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(600);
console.log('titre :', await page.title());
console.log('texte :', await page.evaluate(() => document.getElementById('app').textContent));
await page.screenshot({ path: out });
await app.close();
console.log('capture :', out);
