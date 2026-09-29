// Test bout en bout : deux instances réelles de l'application Electron jouent l'une contre l'autre en réseau (localhost).
//   xvfb-run -a node tools/e2e-lan.mjs
import { _electron as electron } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = path.join(root, '.scratch', 'lan');
fs.mkdirSync(shots, { recursive: true });
const exe = path.join(root, 'node_modules/electron/dist/electron');
const launch = (name) => electron.launch({
  executablePath: exe,
  args: [root, `--user-data-dir=${path.join('/tmp', 'tdg-e2e-' + name + '-' + process.pid)}`],
  env: { ...process.env, TDG_DISABLE_GPU: '1' },
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log('  ' + m);

const A = await launch('hote');
const B = await launch('invite');
const pa = await A.firstWindow();
const pb = await B.firstWindow();
const errs = { A: [], B: [] };
for (const [k, p] of [['A', pa], ['B', pb]]) {
  p.on('pageerror', (e) => errs[k].push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/AudioContext/.test(m.text())) errs[k].push(m.text()); });
}
await pa.waitForSelector('text=Terres de Gaule');
await pb.waitForSelector('text=Terres de Gaule');

// noms des joueurs
await pa.fill('input[type=text]', 'Jo');
await pb.fill('input[type=text]', 'Papa');
await pa.dispatchEvent('input[type=text]', 'input');
await pb.dispatchEvent('input[type=text]', 'input');

// --- l'hôte ouvre une partie
await pa.click('text=Héberger une partie en réseau');
await pa.waitForSelector('text=En attente d\'un joueur');
const ips = await pa.$$eval('.ip-chip', (els) => els.map((e) => e.textContent));
log(`hôte : adresses proposées ${JSON.stringify(ips)}`);
await pa.screenshot({ path: path.join(shots, '1-hote-attente.png') });

// --- l'invité se connecte (adresse locale saisie à la main)
await pb.click('text=Rejoindre une partie');
await pb.fill('input[placeholder^="ex."]', '127.0.0.1');
await pb.click('button:has-text("Se connecter")');
await pb.waitForSelector('text=Connecté !', { timeout: 10000 });
await pa.waitForSelector('text=Papa', { timeout: 10000 });
log('invité connecté : le salon de l\'hôte le montre');

// choix des peuples : l'hôte prend les Francs, l'invité les Gaulois
await pa.click('.civ-card:has-text("Francs")');
await pb.click('.civ-card:has-text("Gaulois")');
await sleep(600);
const lobbyRow = await pa.$$eval('.player-row', (rows) => rows.map((r) => r.textContent));
log(`salon de l'hôte : ${JSON.stringify(lobbyRow)}`);
assert.ok(lobbyRow.join('|').includes('Gaulois'), 'l\'hôte doit voir le peuple choisi par l\'invité');
await pb.screenshot({ path: path.join(shots, '2-invite-salon.png') });

// --- lancement
await pa.click('button:has-text("Lancer la partie")');
await pa.waitForFunction(() => window.__game && window.__game.state.tick > 20, null, { timeout: 60000 });
await pb.waitForFunction(() => window.__game && window.__game.state.ents.size > 100 && window.__game.state.tick > 20, null, { timeout: 60000 });
log('les deux joueurs sont en partie');
await sleep(2500);

const info = (p) => p.evaluate(() => {
  const s = window.__game.state;
  const mine = [...s.ents.values()].filter((e) => e.owner === s.myIdx);
  return { idx: s.myIdx, tick: s.tick, civ: s.civ, units: mine.filter((e) => e.cls === 'unit').length, buildings: mine.filter((e) => e.cls === 'building').length, res: s.me.res, players: s.players.map((p) => p.name + ':' + p.civ), ents: s.ents.size };
});
const ia = await info(pa);
const ib = await info(pb);
log(`hôte : ${JSON.stringify(ia)}`);
log(`invité : ${JSON.stringify(ib)}`);
assert.equal(ia.idx, 0);
assert.equal(ib.idx, 1);
assert.equal(ia.civ, 'franks');
assert.equal(ib.civ, 'gauls');
assert.equal(ia.units, 5);
assert.equal(ib.units, 5);
assert.ok(Math.abs(ia.tick - ib.tick) < 40, `écart de temps hôte/invité : ${ia.tick} / ${ib.tick}`);
assert.deepEqual(ia.players, ['Jo:franks', 'Papa:gauls']);

// --- l'invité donne des ordres : former 3 villageois et envoyer des villageois récolter
await pb.evaluate(() => {
  const g = window.__game; const s = g.state;
  const hall = [...s.ents.values()].find((e) => e.type === 'hall' && e.owner === s.myIdx);
  g.ui.setSel([hall]);
});
await sleep(400);
await pb.keyboard.press('KeyQ');
await pb.keyboard.press('KeyQ');
await pb.keyboard.press('KeyQ');
await pb.evaluate(() => {
  const g = window.__game; const s = g.state;
  const hall = [...s.ents.values()].find((e) => e.type === 'hall' && e.owner === s.myIdx);
  let best = null; let bd = 1e9;
  for (const e of s.ents.values()) if (e.type === 'berries') { const d = Math.hypot(e.x - hall.x, e.y - hall.y); if (d < bd) { bd = d; best = e; } }
  const ids = [...s.ents.values()].filter((e) => e.type === 'villager' && e.owner === s.myIdx).map((e) => e.id);
  g.session.command({ c: 'gather', ids, tid: best.id });
});
await sleep(3000);
const hostWorld = await pa.evaluate(() => {
  const w = window.__game.session.world;
  const p1 = w.players[1];
  return { queue: w.playerBuildings(1, 'hall')[0].queue.length, gatherers: w.playerUnits(1, 'villager').filter((u) => u.order && u.order.t === 'gather').length, food: p1.res.food, pop: p1.pop };
});
log(`côté hôte, le joueur invité a : ${JSON.stringify(hostWorld)}`);
assert.ok(hostWorld.queue >= 3 || hostWorld.pop > 5, 'les 3 villageois demandés par l\'invité doivent être en production');
assert.ok(hostWorld.gatherers >= 3, 'les ordres de récolte de l\'invité doivent être exécutés par l\'hôte');

// --- jouer un moment : l'invité doit voir ses propres unités bouger
await pb.waitForFunction(() => { const s = window.__game.state; return [...s.ents.values()].filter((e) => e.cls === 'unit' && e.owner === s.myIdx).length > 5; }, null, { timeout: 40000 });
const ib2 = await info(pb);
log(`invité plus tard : ${JSON.stringify(ib2)}`);
assert.ok(ib2.units > 5, 'les villageois formés apparaissent chez l\'invité');
assert.ok(ib2.tick > ib.tick + 100, 'le temps avance chez l\'invité');

await pa.screenshot({ path: path.join(shots, '3-hote-partie.png') });
await pb.screenshot({ path: path.join(shots, '4-invite-partie.png') });

// --- l'invité quitte : l'hôte est prévenu et gagne
await B.close();
await sleep(3500);
const over = await pa.evaluate(() => ({ over: window.__game.state.over, paused: window.__game.state.paused }));
log(`après le départ de l'invité, côté hôte : ${JSON.stringify(over)}`);
assert.ok(over.over && over.over.winner === 0, 'l\'hôte doit gagner par abandon');
await pa.screenshot({ path: path.join(shots, '5-hote-victoire.png') });
await A.close();

const all = [...errs.A, ...errs.B];
if (all.length) { console.log('ERREURS :\n' + all.join('\n')); process.exit(1); }
console.log('TEST RÉSEAU BOUT EN BOUT : OK');
