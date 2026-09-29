// Convertit build/icon.svg en build/icon.png (512x512) avec Chromium.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
const svg = fs.readFileSync(path.join(root, 'build/icon.svg'), 'utf8');
await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
await page.screenshot({ path: path.join(root, 'build/icon.png'), omitBackground: true });
await browser.close();
console.log('icône générée');
