// Test d'endurance : partie IA contre IA de 40 minutes avec toute la chaîne de synchronisation (JSON).
import { World } from '../src/core/world.js';
import { SnapshotBuilder } from '../src/core/snapshot.js';
import { ClientState } from '../src/client/state.js';
import { DT } from '../src/core/defs.js';

const mins = Number(process.argv[2] || 40);
const w = new World({ seed: 21, players: [{ name: 'A', civ: 'franks', ai: 'moyen' }, { name: 'B', civ: 'gauls', ai: 'difficile' }] });
// les IA ne sont pas soumises au brouillard : on force ici la vision « humaine » pour tester le filtrage
for (const p of w.players) p.ai = false;
const bots = w.bots;
const builders = [new SnapshotBuilder(w, 0), new SnapshotBuilder(w, 1)];
const states = [new ClientState({ myIdx: 0 }), new ClientState({ myIdx: 1 })];
let now = 0;
let bytes = 0;
let maxSnap = 0;
let snaps = 0;
const t0 = performance.now();
const heap0 = process.memoryUsage().heapUsed;
for (let i = 0; i < (mins * 60) / DT && !w.over; i++) {
  w.step();
  // les bots lisent pl.ai pour savoir si on les soumet au brouillard ; ici ils jouent quand même
  const ev = w.events;
  w.events = [];
  for (const b of builders) b.pushEvents(ev);
  now += 50;
  for (let k = 0; k < 2; k++) {
    const line = JSON.stringify(builders[k].build());
    bytes += line.length;
    maxSnap = Math.max(maxSnap, line.length);
    snaps++;
    states[k].apply(JSON.parse(line), now);
    states[k].drainEvents();
  }
  if (i % 12000 === 11999) {
    const s = states[0];
    const own = [...s.ents.values()].filter((e) => e.owner === 0 && e.cls === 'unit').length;
    const real = w.units.filter((u) => u.owner === 0 && !u.inside).length;
    console.log(`min ${((i + 1) * DT / 60).toFixed(0)}: unités A client ${own} / monde ${real}, entités client ${s.ents.size}, fantômes ${s.ghosts.size}, tas ${((process.memoryUsage().heapUsed - heap0) / 1e6).toFixed(0)} Mo`);
  }
}
// cohérence finale
let bad = 0;
for (let k = 0; k < 2; k++) {
  for (const u of w.units) {
    if (u.owner !== k || u.inside || u.dead) continue;
    const c = states[k].ents.get(u.id);
    if (!c || Math.abs(c.x - u.x) > 0.06 || Math.abs(c.y - u.y) > 0.06) bad++;
  }
}
console.log(`fin : ${w.over ? 'vainqueur ' + w.players[w.winner].name : 'pas de vainqueur'} à ${(w.tick * DT / 60).toFixed(1)} min ; unités divergentes : ${bad}`);
console.log(`instantanés : ${snaps}, moyenne ${(bytes / snaps).toFixed(0)} octets, maximum ${maxSnap} octets, débit moyen par joueur ${(bytes / snaps * 20 / 1024).toFixed(1)} Ko/s`);
console.log(`durée réelle ${((performance.now() - t0) / 1000).toFixed(1)} s`);
void bots;
if (bad) process.exit(1);
