// Série de parties IA contre IA pour vérifier l'équilibre entre les deux peuples.
//   node tools/balance.mjs [niveau] [minutes] [graines]
import { World } from '../src/core/world.js';
import { DT } from '../src/core/defs.js';

const [level = 'moyen', mins = '45', nSeeds = '3'] = process.argv.slice(2);
const results = [];
const t0 = performance.now();
for (const [civA, civB] of [['franks', 'gauls'], ['gauls', 'franks']]) {
  for (let seed = 1; seed <= Number(nSeeds); seed++) {
    const w = new World({ seed, players: [{ name: 'A', civ: civA, ai: level }, { name: 'B', civ: civB, ai: level }] });
    const max = Number(mins) * 60 / DT;
    for (let i = 0; i < max && !w.over; i++) w.step();
    const win = w.winner >= 0 ? w.players[w.winner].civ : 'aucun';
    results.push({ civA, civB, seed, win, minutes: +(w.tick * DT / 60).toFixed(1), kills: w.players.map((p) => p.kills), razed: w.players.map((p) => p.razed), age: w.players.map((p) => p.age), pop: w.players.map((p) => p.pop) });
    console.log(`${civA}(A) vs ${civB}(B) graine ${seed}: ${w.over ? 'vainqueur ' + win + ' à ' + (w.tick * DT / 60).toFixed(1) + ' min' : 'pas de vainqueur'} | éliminations ${w.players.map((p) => p.kills)} | bâtiments détruits ${w.players.map((p) => p.razed)} | âges ${w.players.map((p) => p.age)} | pop ${w.players.map((p) => p.pop)}`);
  }
}
const wins = { franks: 0, gauls: 0, aucun: 0 };
for (const r of results) wins[r.win]++;
console.log('BILAN', JSON.stringify(wins), `(${((performance.now() - t0) / 1000).toFixed(0)} s)`);
