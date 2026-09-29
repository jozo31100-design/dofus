// Test fonctionnel de l'interface : de vrais clics et touches dans Chromium, vérifiés sur l'état du jeu.
//   node tools/ui-test.mjs
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

process.on('uncaughtException', (e) => { console.log('ÉCHEC :', e.message); if (errors.length) console.log('ERREURS DE LA PAGE :\n' + errors.slice(0, 5).join('\n')); process.exit(1); });
const G = (fn, arg) => page.evaluate(fn, arg);
let step = 0;
const log = (m) => console.log(`  ${++step}. ${m}`);

// 1. boîte de sélection sur les villageois
const vill = await G(() => {
  const g = window.__game; const r = g.ui.renderer;
  const list = [...g.state.ents.values()].filter((e) => e.cls === 'unit' && e.type === 'villager' && e.owner === g.state.myIdx);
  return list.map((e) => { const [x, y] = r.worldToScreen(...g.state.posOf(e, performance.now())); return { id: e.id, x, y }; });
});
assert.equal(vill.length, 4);
const cx = vill.reduce((a, v) => a + v.x, 0) / 4;
const cy = vill.reduce((a, v) => a + v.y, 0) / 4;
await page.mouse.move(cx - 120, cy - 100);
await page.mouse.down();
await page.mouse.move(cx + 120, cy + 80, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(200);
let sel = await G(() => [...window.__game.ui.sel].length);
assert.ok(sel >= 4, `sélection au cadre : ${sel}`);
log(`cadre de sélection : ${sel} unités`);

// 2. la grille propose les bâtiments (touche Q en QWERTY : indice 0)
await page.waitForTimeout(300);
const slot0 = await G(() => window.__game.ui.slots[0] && window.__game.ui.slots[0].title);
assert.equal(slot0, 'Bâtiments civils');
await page.click('#cmds .cmd[data-slot="0"]');
await page.waitForTimeout(200);
const titles = await G(() => window.__game.ui.slots.filter(Boolean).map((s) => s.title));
assert.ok(titles.includes('Maison de bois') || titles.some((t) => /Maison|Hutte/.test(t)), titles.join(','));
log(`page des bâtiments civils : ${titles.join(', ')}`);

// 3. placer une maison : clic sur le bouton, puis clic gauche sur un endroit libre
const houseIdx = await G(() => window.__game.ui.slots.findIndex((s) => s && s.id === 'house'));
await page.click(`#cmds .cmd[data-slot="${houseIdx}"]`);
await page.waitForTimeout(200);
assert.ok(await G(() => !!window.__game.ui.placing), 'le mode placement doit être actif');
// emplacement valide à côté de la salle
const spot = await G(() => {
  const g = window.__game; const u = g.ui; const r = u.renderer;
  const hall = [...g.state.ents.values()].find((e) => e.type === 'hall' && e.owner === g.state.myIdx);
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
    const tx = hall.tx + dx; const ty = hall.ty + dy;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) continue;
    if (u.checkPlacement('house', tx, ty).valid) { const [sx, sy] = r.worldToScreen(tx + 1, ty + 1); return { sx, sy, tx, ty }; }
  }
  return null;
});
assert.ok(spot, 'aucun emplacement');
await page.mouse.move(spot.sx, spot.sy);
await page.waitForTimeout(150);
await page.mouse.click(spot.sx, spot.sy);
await page.waitForTimeout(400);
const houses1 = await G(() => window.__game.session.world.buildings.filter((b) => b.type === 'house' && b.owner === 0).length);
assert.equal(houses1, 1, 'la maison doit être posée');
log('maison posée par un clic');

// 4. clic droit sur un arbre : les villageois récoltent
const tree = await G(() => {
  const g = window.__game; const r = g.ui.renderer;
  const hall = [...g.state.ents.values()].find((e) => e.type === 'hall' && e.owner === g.state.myIdx);
  let best = null; let bd = 1e9;
  for (const e of g.state.ents.values()) {
    if (e.type !== 'tree') continue;
    const d = Math.hypot(e.x - hall.x, e.y - hall.y);
    const [sx, sy] = r.worldToScreen(e.x, e.y);
    if (d < bd && sx > 60 && sx < 1340 && sy > 100 && sy < 560) { bd = d; best = { id: e.id, sx, sy: sy - 20 }; }
  }
  return best;
});
await G(() => { const g = window.__game; g.ui.setSel([...g.state.ents.values()].filter((e) => e.type === 'villager' && e.owner === g.state.myIdx).slice(1)); });
await page.mouse.click(tree.sx, tree.sy, { button: 'right' });
await page.waitForTimeout(300);
const gathering = await G(() => window.__game.session.world.units.filter((u) => u.owner === 0 && u.order && u.order.t === 'gather').length);
assert.ok(gathering >= 2, `villageois en récolte : ${gathering}`);
log(`clic droit sur un arbre : ${gathering} villageois récoltent`);

// 5. former des villageois avec la salle (sélection de la salle, touche Q = 1er bouton)
await G(() => { const g = window.__game; const hall = [...g.state.ents.values()].find((e) => e.type === 'hall' && e.owner === 0); g.ui.setSel([hall]); });
await page.waitForTimeout(400);
await page.keyboard.press('KeyQ');
await page.keyboard.press('KeyQ');
await page.waitForTimeout(300);
const q = await G(() => window.__game.session.world.playerBuildings(0, 'hall')[0].queue.length);
assert.equal(q, 2, 'deux villageois en file');
log('deux villageois mis en production avec la touche de la grille');

// 6. accélérer la partie et vérifier la construction, la fin de production et l'information
await G(() => { window.__game.session.speed = 6; });
await page.waitForTimeout(9000);
const st = await G(() => { const w = window.__game.session.world; return { house: w.playerBuildings(0, 'house').map((b) => b.done), pop: w.players[0].pop, cap: w.players[0].popCap, wood: w.players[0].res.wood, food: w.players[0].res.food }; });
assert.ok(st.house.length === 1 && st.house[0] === true, 'la maison est terminée');
assert.ok(st.pop >= 6, `population ${st.pop}`);
log(`après 54 s de jeu accéléré : population ${st.pop}/${st.cap}, bois ${Math.round(st.wood)}`);

// 7. contrôle : groupe, pause, menu
await G(() => { const g = window.__game; g.ui.setSel([...g.state.ents.values()].filter((e) => e.type === 'villager' && e.owner === 0)); });
await page.keyboard.press('Control+Digit1');
await G(() => window.__game.ui.setSel([]));
await page.keyboard.press('Digit1');
sel = await G(() => window.__game.ui.sel.size);
assert.ok(sel >= 4, 'groupe rappelé');
log(`groupe de contrôle rappelé : ${sel} unités`);
await page.keyboard.press('KeyP');
await page.waitForTimeout(500);
assert.equal(await G(() => window.__game.session.world.paused), true);
await page.keyboard.press('KeyP');
await page.waitForTimeout(300);
assert.equal(await G(() => window.__game.session.world.paused), false);
log('pause et reprise');
await page.keyboard.press('F10');
await page.waitForTimeout(200);
assert.ok(await page.isVisible('#overlay .dialog'));
await page.screenshot({ path: path.join(root, '.scratch', 'ui-menu.png') });
await page.keyboard.press('Escape');
log('menu ouvert et fermé');

await page.screenshot({ path: path.join(root, '.scratch', 'ui-test-final.png') });

// 8. fin de partie : défaite par abandon, écran de statistiques, retour au menu
await G(() => window.__game.session.command({ c: 'resign' }));
await page.waitForSelector('.dialog.end', { timeout: 8000 });
const endTitle = await page.textContent('.dialog.end h1');
assert.equal(endTitle, 'Défaite…');
assert.ok((await page.textContent('.dialog.end table')).includes('Unités formées'));
await page.screenshot({ path: path.join(root, '.scratch', 'ui-end.png') });
log('écran de défaite avec statistiques');
await page.click('text=Retour au menu principal');
await page.waitForSelector('text=Jouer contre l\'ordinateur');
log('retour au menu principal');

// 9. nouvelle partie juste après (rien ne doit traîner) puis victoire en détruisant l'adversaire
await G(() => { window.__prevGame = window.__game; });
await page.click('text=Jouer contre l\'ordinateur');
await page.click('text=Lancer la partie');
await page.waitForFunction(() => window.__game !== window.__prevGame && window.__game.ui.renderer.hits.length > 20 && window.__game.state.tick > 5, null, { timeout: 60000 });
await G(() => { const w = window.__game.session.world; for (const b of w.playerBuildings(1)) w.removeEntity(b); for (const u of w.playerUnits(1)) w.removeEntity(u); w.sweepDead(); });
await page.waitForSelector('.dialog.end', { timeout: 10000 });
assert.equal(await page.textContent('.dialog.end h1'), 'Victoire !');
log('deuxième partie lancée puis victoire affichée');
await page.click('text=Retour au menu principal');
await page.waitForSelector('text=Jouer contre l\'ordinateur');
await browser.close();
const relevant = errors.filter((e) => !/AudioContext/.test(e));
if (relevant.length) { console.log('ERREURS DE LA PAGE :\n' + relevant.join('\n')); process.exit(1); }
console.log('TOUS LES CONTRÔLES DE L\'INTERFACE SONT PASSÉS');
