// Fait jouer deux IA l'une contre l'autre sans interface : node tools/sim-match.mjs [niveauA] [niveauB] [minutes] [graine] [civA] [civB]
import { World } from '../src/core/world.js';
import { DT } from '../src/core/defs.js';

const [la = 'moyen', lb = 'moyen', mins = '25', seed = '1', civA = 'franks', civB = 'gauls'] = process.argv.slice(2);
const w = new World({ seed: Number(seed), players: [{ name: 'A', civ: civA, ai: la }, { name: 'B', civ: civB, ai: lb }] });
const t0 = performance.now();
let worst = 0;
const max = Number(mins) * 60 * 20;
for (let i = 0; i < max && !w.over; i++) {
  const s = performance.now();
  w.step();
  worst = Math.max(worst, performance.now() - s);
  if (i % (20 * 60) === 0 && i > 0) {
    const line = w.players.map((p) => {
      const units = w.units.filter((u) => u.owner === p.idx);
      const vil = units.filter((u) => u.type === 'villager').length;
      return `${p.name}[${p.civ} âge${p.age}] pop ${p.pop}/${p.popCap} vill ${vil} armée ${units.length - vil} bât ${w.buildings.filter((b) => b.owner === p.idx).length} res ${p.res.food | 0}/${p.res.wood | 0}/${p.res.gold | 0}/${p.res.stone | 0}`;
    });
    console.log(`min ${i / 1200}: ${line.join(' || ')}`);
  }
}
console.log(w.over ? `FIN à ${(w.tick * DT / 60).toFixed(1)} min — vainqueur : ${w.winner >= 0 ? w.players[w.winner].name : 'personne'}` : `pas de vainqueur après ${mins} min`);
for (const p of w.players) console.log(`${p.name}: éliminations ${p.kills}, pertes ${p.losses}, bâtiments détruits ${p.razed}, formées ${p.trained}, techs ${p.researched}, récolté ${JSON.stringify(p.gathered)}`);
console.log(`temps réel ${((performance.now() - t0) / 1000).toFixed(1)} s, pas le plus lent ${worst.toFixed(1)} ms`);
