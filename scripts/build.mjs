// Assemble le jeu : bundle JavaScript du rendu + fichiers statiques -> dist/
import { build, context } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prod = process.argv.includes('--prod');
const watch = process.argv.includes('--watch');
const dist = path.join(root, 'dist');

fs.mkdirSync(dist, { recursive: true });

function copyStatic() {
  for (const f of fs.readdirSync(path.join(root, 'web'))) {
    fs.copyFileSync(path.join(root, 'web', f), path.join(dist, f));
  }
}

const options = {
  entryPoints: [path.join(root, 'src/client/main.js')],
  bundle: true,
  outfile: path.join(dist, 'renderer.js'),
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  sourcemap: prod ? false : 'inline',
  minify: prod,
  legalComments: 'none',
  logLevel: 'info',
};

copyStatic();
if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Surveillance des fichiers…');
} else {
  await build(options);
}
