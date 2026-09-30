// Contrôle de robustesse limité aux unités franques d'extension : toutes les combinaisons doivent se dessiner sans erreur.
import { drawUnit, unitMetrics } from '../src/client/art/units.js';

const NEW = ['childeric', 'clotilde', 'charles_martel', 'charlemagne', 'roland', 'antrustion', 'leude', 'sergent', 'moine', 'preux', 'arbaletrier_imp'];
const c = document.createElement('canvas');
c.width = 400;
c.height = 300;
document.body.appendChild(c);
const ctx = c.getContext('2d');
const problems = [];
let count = 0;
const t0 = performance.now();
for (const type of NEW) {
  for (const civ of ['franks', 'gauls']) for (const team of [0, 1]) for (const anim of ['idle', 'walk', 'work', 'attack', 'die']) for (const dir of [1, -1]) {
    for (const work of anim === 'work' ? [undefined, 'wood', 'climb', 'heal'] : [undefined]) {
      try {
        ctx.clearRect(0, 0, 400, 300);
        for (const t of [0, 0.13, 0.5, 1.7, NaN]) drawUnit(ctx, { type, civ, team, sx: 200, sy: 220, t, anim, dir, aim: 0.7, work, carry: 'wood', deathT: Math.min(1, Math.abs(t) || 0), scale: 1 });
        count++;
      } catch (e) {
        problems.push(`${type}/${civ}/${team}/${anim}/${dir}/${work} : ${e.message}`);
      }
    }
  }
  const m = unitMetrics(type);
  if (!(m.h > 30 && m.w > 5)) problems.push('métriques ' + type);
}
console.log(`${count} combinaisons dessinées en ${(performance.now() - t0).toFixed(0)} ms, ${problems.length} problème(s)`);
for (const p of problems.slice(0, 30)) console.log('PROBLÈME', p);
