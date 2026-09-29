// PROVISOIRE — icônes de l'interface, portraits, icônes de technologies.
import { DEFS } from '../../core/defs.js';
import { unitMetrics, drawUnit } from './units.js';
import { getBuildingSprite } from './buildings.js';

const COLORS = { food: '#c96a3a', wood: '#8a5a32', gold: '#e6b93c', stone: '#9a9a94', pop: '#d8c8a8' };

/** Icône générique 0..size (resources : food, wood, gold, stone, pop ; actions : voir docs/ART.md). */
export function drawIcon(ctx, name, size) {
  ctx.fillStyle = COLORS[name] || '#556';
  ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(size * 0.35)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(name).slice(0, 2), size / 2, size / 2);
}

/** Portrait d'une unité ou d'un bâtiment (identifiant de définition) dans un carré size x size. */
export function drawPortrait(ctx, id, civ, teamIdx, size) {
  const def = DEFS[id];
  ctx.save();
  if (def && def.cls === 'building') {
    const s = getBuildingSprite(id, civ, teamIdx, 3);
    const k = Math.min(size / s.canvas.width, size / s.canvas.height);
    ctx.drawImage(s.canvas, (size - s.canvas.width * k) / 2, (size - s.canvas.height * k) / 2, s.canvas.width * k, s.canvas.height * k);
  } else {
    const m = unitMetrics(id);
    const k = (size * 0.8) / m.h;
    ctx.translate(size / 2, size * 0.92);
    ctx.scale(k, k);
    drawUnit(ctx, { type: id, civ, team: teamIdx, sx: 0, sy: 0, t: 0, anim: 'idle', dir: 1 });
  }
  ctx.restore();
}

/** Icône d'une technologie (identifiant de technologie) dans un carré size x size. */
export function drawTechIcon(ctx, techId, size) {
  ctx.fillStyle = '#3b3b55';
  ctx.fillRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(size * 0.28)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(techId.slice(0, 4), size / 2, size / 2);
}
