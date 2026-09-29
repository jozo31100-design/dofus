// Assemble le jeu : bundle JavaScript du rendu + fichiers statiques -> dist/
import { build, context } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
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

function buildInfo() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  let sha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : '';
  if (!sha) {
    try { sha = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { sha = 'local'; }
  }
  return { version: pkg.version, build: `${pkg.version}+${sha}` };
}

copyStatic();
fs.writeFileSync(path.join(dist, 'build-info.json'), JSON.stringify(buildInfo()));
if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Surveillance des fichiers…');
} else {
  await build(options);
}
