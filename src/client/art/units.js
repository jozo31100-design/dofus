// PROVISOIRE — remplacé par le vrai dessin des unités.
import { team } from './palette.js';

const HEIGHT = { villager: 26, ram: 34, catapult: 40, scout: 38, cavalry: 40, knight: 44 };

/** Dimensions pour la sélection et les barres de vie : { h : hauteur en px, w : demi-largeur en px }. */
export function unitMetrics(type) {
  const h = HEIGHT[type] || 30;
  return { h, w: type === 'ram' || type === 'catapult' ? 22 : 9 };
}

/**
 * Dessine une unité.
 * o : { type, civ, team, sx, sy (pieds), t (horloge en s), anim: 'idle'|'walk'|'work'|'attack'|'die',
 *       dir: 1|-1, aim (angle écran), work: 'wood'|'mine'|'farm'|'forage'|'build'|'repair'|'hunt'|'butcher',
 *       carry: null|'wood'|'food'|'gold'|'stone', deathT: 0..1, scale }
 */
export function drawUnit(ctx, o) {
  const m = unitMetrics(o.type);
  const s = o.scale || 1;
  ctx.save();
  ctx.translate(o.sx, o.sy);
  ctx.scale(s, s);
  if (o.anim === 'die') { ctx.globalAlpha = 1 - (o.deathT || 0); ctx.rotate((o.deathT || 0) * 1.4 * o.dir); }
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0, 0, m.w + 2, 5, 0, 0, 7); ctx.fill();
  const bob = o.anim === 'walk' ? Math.abs(Math.sin(o.t * 8)) * 2 : 0;
  ctx.fillStyle = team(o.team).main;
  ctx.fillRect(-m.w / 2, -m.h * 0.7 - bob, m.w, m.h * 0.55);
  ctx.fillStyle = '#e8c39c';
  ctx.beginPath(); ctx.arc(0, -m.h * 0.82 - bob, 4.5, 0, 7); ctx.fill();
  ctx.restore();
}
