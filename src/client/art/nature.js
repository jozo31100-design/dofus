// PROVISOIRE — arbres, buissons, mines, animaux, projectiles.
import { makeCanvas } from './palette.js';

const spriteCache = new Map();

/** Sprite statique d'une ressource. Renvoie { canvas, ax, ay, h } (ax, ay : point au sol, h : hauteur en px). */
export function getNodeSprite(type, variant = 0, frac = 1) {
  const key = `${type}|${variant}|${Math.round(frac * 4)}`;
  let s = spriteCache.get(key);
  if (s) return s;
  const { canvas, ctx } = makeCanvas(64, 80);
  const ax = 32;
  const ay = 60;
  const col = { tree: '#2f6b2a', berries: '#8a2a4a', gold: '#e6b93c', stone: '#8d8d88', carcass: '#a0522d' }[type] || '#f0f';
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(ax, ay, 16, 8, 0, 0, 7); ctx.fill();
  if (type === 'tree') {
    ctx.fillStyle = '#5c3a1e'; ctx.fillRect(ax - 3, ay - 22, 6, 22);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ax, ay - 34, 16, 22, 0, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ax, ay - 8, 14, 10, 0, 0, 7); ctx.fill();
  }
  s = { canvas, ax, ay, h: 56 };
  spriteCache.set(key, s);
  return s;
}

/** Animal animé. o : { type, sx, sy, t, anim: 'idle'|'walk'|'flee'|'die', dir: 1|-1, deathT } */
export function drawAnimal(ctx, o) {
  ctx.save();
  ctx.translate(o.sx, o.sy);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = o.type === 'deer' ? '#b58a52' : '#f2f2ee';
  ctx.beginPath(); ctx.ellipse(0, -8, 10, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(o.dir * 10, -13, 4, 0, 7); ctx.fill();
  ctx.restore();
}

/** Projectile en vol. kind : 'arrow' | 'axe' | 'stone' | 'bolt'. angle : direction à l'écran (radians). */
export function drawProjectile(ctx, kind, sx, sy, angle, t = 0) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(kind === 'axe' ? t * 18 : angle);
  if (kind === 'stone') {
    ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
  } else if (kind === 'axe') {
    ctx.fillStyle = '#ccc'; ctx.fillRect(-5, -2, 10, 4);
  } else {
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
  }
  ctx.restore();
}
