// PROVISOIRE — remplacé par le vrai dessin des bâtiments.
import { BUILDINGS } from '../../core/defs.js';
import { TILE_W, TILE_H } from './constants.js';
import { makeCanvas, team, shade } from './palette.js';

const cache = new Map();
const HEIGHT = { hall: 90, house: 34, farm: 2, mill: 60, lumber: 30, mining: 30, barracks: 56, archery: 46, stable: 50, forge: 50, tower: 100, temple: 70, siege: 60, castle: 120 };

export function buildingMetrics(typeId) {
  return { h: HEIGHT[typeId] || 50 };
}

/**
 * Sprite d'un bâtiment. stage : 0 fondations, 1 à moitié, 2 presque fini, 3 terminé.
 * Renvoie { canvas, ax, ay, h } : (ax, ay) = centre de l'emprise au sol, h = hauteur au-dessus du sol en px.
 */
export function getBuildingSprite(typeId, civ, teamIdx, stage = 3) {
  const key = `${typeId}|${civ}|${teamIdx}|${stage}`;
  let s = cache.get(key);
  if (s) return s;
  const size = BUILDINGS[typeId].size;
  const hgt = (HEIGHT[typeId] || 50) * (stage === 3 ? 1 : 0.25 + stage * 0.25);
  const w = size * TILE_W + 8;
  const hh = (size * TILE_H) + hgt + 12;
  const { canvas, ctx } = makeCanvas(w, hh);
  const ax = w / 2;
  const ay = hh - (size * TILE_H) / 2 - 6;
  const hw = (size * TILE_W) / 2;
  const hd = (size * TILE_H) / 2;
  const base = team(teamIdx).main;
  const top = (dy) => { ctx.beginPath(); ctx.moveTo(ax, ay - hd - dy); ctx.lineTo(ax + hw, ay - dy); ctx.lineTo(ax, ay + hd - dy); ctx.lineTo(ax - hw, ay - dy); ctx.closePath(); };
  ctx.fillStyle = '#9a7a56'; ctx.beginPath(); ctx.moveTo(ax - hw, ay); ctx.lineTo(ax, ay + hd); ctx.lineTo(ax, ay + hd - hgt); ctx.lineTo(ax - hw, ay - hgt); ctx.fill();
  ctx.fillStyle = '#7a5c3c'; ctx.beginPath(); ctx.moveTo(ax + hw, ay); ctx.lineTo(ax, ay + hd); ctx.lineTo(ax, ay + hd - hgt); ctx.lineTo(ax + hw, ay - hgt); ctx.fill();
  top(hgt); ctx.fillStyle = shade(base, 0.1); ctx.fill();
  s = { canvas, ax, ay, h: hgt };
  cache.set(key, s);
  return s;
}

/** Tas de gravats laissé par un bâtiment détruit de size x size cases. Renvoie { canvas, ax, ay }. */
export function getRubbleSprite(size, variant = 0) {
  const key = `rubble|${size}|${variant}`;
  let s = cache.get(key);
  if (s) return s;
  const w = size * TILE_W;
  const h = size * TILE_H + 16;
  const { canvas, ctx } = makeCanvas(w, h);
  const ax = w / 2;
  const ay = h / 2 + 4;
  ctx.fillStyle = '#5b4a3a';
  ctx.beginPath(); ctx.ellipse(ax, ay, (size * TILE_W) / 2.4, (size * TILE_H) / 2.4, 0, 0, 7); ctx.fill();
  s = { canvas, ax, ay };
  cache.set(key, s);
  return s;
}
