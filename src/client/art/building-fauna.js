// Petits détails de vie des bâtiments : chevaux, poules, cochons, linge qui sèche, poteau de trophées,
// panier d'osier, bûcher de forgeron. Tout respecte le mode du peintre g (rien en 'plan', ombre discrète
// en 'shadow', peinture en 'draw') et reste déterministe (pas de Math.random).

import { tone } from './building-gfx.js';
import { stick, WOOD, WOOD_DARK } from './building-parts.js';

const PI = Math.PI;

/** Ombre de contact ovale sous un animal. */
function contact(c, rx, ry) {
  c.fillStyle = 'rgba(20,25,10,0.28)';
  c.beginPath();
  c.ellipse(1, 0.5, rx, ry, 0, 0, 2 * PI);
  c.fill();
}

/**
 * Cheval de profil, ~24 px de long. o : { dir (1 | −1), col, mane, pose ('stand' | 'graze' | 'look'), s, blaze }.
 */
export function horse(g, x, y, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowOf([[x - 0.14, y - 0.06, 0], [x + 0.14, y + 0.06, 0], [x, y, 15]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const dir = o.dir || 1;
  const col = o.col || '#8a5530';
  const mane = o.mane || '#2a1a10';
  const s = o.s ?? 1;
  const pose = o.pose || 'stand';
  c.save();
  c.translate(px, py);
  c.scale(dir * s, s);
  contact(c, 10, 3);
  const dark = tone(col, 0.62);
  const out = 'rgba(30,18,8,0.75)';
  // jambes lointaines puis proches
  const leg = (lx, ly, col2, w) => {
    c.strokeStyle = col2;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(lx, -10);
    c.lineTo(lx + ly * 0.25, -5);
    c.lineTo(lx + ly * 0.1, -0.6);
    c.stroke();
    c.fillStyle = '#2b2118';
    c.fillRect(lx + ly * 0.1 - 1.1, -1.8, 2.2, 1.6);
  };
  leg(-5.6, 1, dark, 1.9);
  leg(5.2, -1, dark, 1.9);
  // queue
  c.strokeStyle = mane;
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(-8.4, -13);
  c.bezierCurveTo(-13, -12, -13.5, -7, -12, -3.5);
  c.stroke();
  // corps
  const body = c.createLinearGradient(0, -17, 0, -6);
  body.addColorStop(0, tone(col, 1.22));
  body.addColorStop(0.5, col);
  body.addColorStop(1, tone(col, 0.74));
  c.fillStyle = body;
  c.strokeStyle = out;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-9, -13);
  c.bezierCurveTo(-9.6, -17, -3, -17.6, 2, -16.6);
  c.bezierCurveTo(6, -16.6, 9.2, -16, 9.6, -12.6);
  c.bezierCurveTo(9.6, -8.4, 6, -6.4, 2, -6.6);
  c.bezierCurveTo(-3, -6.4, -8.6, -8, -9, -13);
  c.closePath();
  c.fill();
  c.stroke();
  // encolure et tête
  const hx = pose === 'graze' ? 15.5 : 14.5;
  const hy = pose === 'graze' ? -3.5 : pose === 'look' ? -24 : -21;
  c.beginPath();
  c.moveTo(5, -17);
  c.quadraticCurveTo(10, -18, hx - 2, hy - 2.4);
  c.lineTo(hx + 1, hy + 2.6);
  c.quadraticCurveTo(10, -9, 7.4, -8.6);
  c.closePath();
  c.fill();
  c.stroke();
  c.save();
  c.translate(hx, hy);
  c.rotate(pose === 'graze' ? 0.95 : 0.55);
  c.fillStyle = tone(col, 1.05);
  c.beginPath();
  c.ellipse(0.5, 0, 4.6, 2.2, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = tone(col, 0.6);
  c.beginPath();
  c.ellipse(3.6, 0.6, 1.6, 1.5, 0, 0, 2 * PI);
  c.fill();
  if (o.blaze) {
    c.fillStyle = '#f2ead8';
    c.fillRect(-1.5, -0.6, 5.5, 1.1);
  }
  c.fillStyle = '#140c06';
  c.fillRect(-1.2, -1, 1, 1);
  c.restore();
  // oreilles et crinière
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(hx - 2.6, hy - 2.4);
  c.lineTo(hx - 3.2, hy - 5.6);
  c.lineTo(hx - 0.8, hy - 2.8);
  c.fill();
  c.strokeStyle = mane;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(hx - 2.4, hy - 2.6);
  c.quadraticCurveTo(6, -21, 3.4, -16.6);
  c.stroke();
  // jambes proches
  leg(-2.4, -1, col, 2.1);
  leg(8, 1, col, 2.1);
  c.restore();
}

/** Poule (ou coq) qui picore, ~6 px. */
export function hen(g, x, y, o = {}) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  c.save();
  c.translate(px, py);
  c.scale(o.dir || 1, 1);
  contact(c, 3.4, 1.2);
  c.fillStyle = o.col || '#d9cbb0';
  c.strokeStyle = 'rgba(60,40,20,0.6)';
  c.lineWidth = 0.6;
  c.beginPath();
  c.ellipse(0, -3.6, 3, 2.3, 0.1, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(2.6, -5.8, 1.3, 0, 2 * PI);
  c.fill();
  c.fillStyle = '#c4362a';
  c.fillRect(2.4, -7.4, 1, 1);
  c.fillStyle = '#e8a22a';
  c.fillRect(3.7, -5.9, 1.3, 0.8);
  c.fillStyle = o.tail || '#8a5a30';
  c.beginPath();
  c.moveTo(-2.4, -4);
  c.lineTo(-4.6, -6.6);
  c.lineTo(-2, -2.8);
  c.fill();
  c.strokeStyle = '#b07a2a';
  c.beginPath();
  c.moveTo(-0.6, -1.4);
  c.lineTo(-0.6, 0);
  c.moveTo(0.9, -1.4);
  c.lineTo(0.9, 0);
  c.stroke();
  c.restore();
}

/** Cochon rose (porcherie gauloise), ~14 px. */
export function pig(g, x, y, o = {}) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  c.save();
  c.translate(px, py);
  c.scale(o.dir || 1, 1);
  contact(c, 7, 2.2);
  const col = o.col || '#e7a79a';
  c.strokeStyle = 'rgba(80,30,25,0.6)';
  c.lineWidth = 0.7;
  c.fillStyle = tone(col, 0.8);
  c.fillRect(-4.2, -3, 1.8, 3);
  c.fillRect(3, -3, 1.8, 3);
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, -5.6, 7, 4.3, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(6.6, -5.2, 3, 2.7, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = tone(col, 0.72);
  c.beginPath();
  c.moveTo(5.4, -8.4);
  c.lineTo(6.6, -10.4);
  c.lineTo(7.8, -8);
  c.fill();
  c.fillStyle = tone(col, 1.2);
  c.fillRect(8.6, -5.6, 1.6, 2);
  c.fillStyle = '#24100c';
  c.fillRect(7.6, -6.6, 0.9, 0.9);
  c.strokeStyle = tone(col, 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-6.8, -6);
  c.quadraticCurveTo(-9, -8, -7.4, -9);
  c.stroke();
  c.fillStyle = tone(col, 1.05);
  c.fillRect(-2, -3, 1.8, 3);
  c.fillRect(4.4, -3, 1.6, 3);
  c.restore();
}

/**
 * Corde à linge tendue entre deux poteaux (x0,y0) → (x1,y1) à la hauteur z ; quelques pièces de tissu.
 */
export function laundry(g, x0, y0, x1, y1, z = 22, o = {}) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  const a = g.P(x0, y0, 0);
  const b = g.P(x1, y1, 0);
  stick(c, a[0], a[1], a[0], a[1] - z, WOOD, 1.6);
  stick(c, b[0], b[1], b[0], b[1] - z, WOOD, 1.6);
  const sag = 3;
  const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] - z + (b[1] - a[1]) * t + Math.sin(t * PI) * sag];
  c.strokeStyle = 'rgba(235,225,200,0.9)';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(a[0], a[1] - z);
  for (let i = 1; i <= 8; i++) {
    const p = at(i / 8);
    c.lineTo(p[0], p[1]);
  }
  c.stroke();
  const cols = o.cols || ['#ece4d0', '#b5603a', '#6d8fb8', '#e9d9a0'];
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.25;
    const p = at(t);
    const w = 4.2 - i * 0.4;
    const h = 6.5 - (i % 2) * 2;
    c.fillStyle = cols[i % cols.length];
    c.strokeStyle = 'rgba(60,40,25,0.45)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(p[0] - w, p[1]);
    c.lineTo(p[0] + w, p[1]);
    c.lineTo(p[0] + w - 0.6, p[1] + h);
    c.quadraticCurveTo(p[0], p[1] + h + 1, p[0] - w + 0.6, p[1] + h);
    c.closePath();
    c.fill();
    c.stroke();
  }
}

/**
 * Poteau de trophées gaulois : perche portant un crâne de cheval/bœuf blanchi, des lanières et un bouclier ;
 * rester sobre (tout public).
 */
export function trophyPole(g, x, y, h = 38, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, 0, h);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  stick(c, px, py, px, py - h, WOOD_DARK, 2.6);
  stick(c, px - 0.6, py - 1, px - 0.6, py - h, 'rgba(200,150,90,0.4)', 0.8);
  // crâne de cheval
  const hy = py - h + 4;
  c.fillStyle = '#efe6cf';
  c.strokeStyle = 'rgba(60,45,30,0.7)';
  c.lineWidth = 0.7;
  c.beginPath();
  c.ellipse(px, hy, 3, 4, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = '#2a2018';
  c.fillRect(px - 2, hy - 1, 1.4, 1.6);
  c.fillRect(px + 0.6, hy - 1, 1.4, 1.6);
  c.strokeStyle = '#efe6cf';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(px - 2.6, hy - 3);
  c.quadraticCurveTo(px - 7, hy - 6, px - 6, hy - 9);
  c.moveTo(px + 2.6, hy - 3);
  c.quadraticCurveTo(px + 7, hy - 6, px + 6, hy - 9);
  c.stroke();
  // lanières rouges et plumes
  c.strokeStyle = o.col || '#b5403a';
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(px, py - h + 12);
  c.quadraticCurveTo(px + 6, py - h + 16, px + 4, py - h + 23);
  c.moveTo(px, py - h + 12);
  c.quadraticCurveTo(px - 6, py - h + 15, px - 4, py - h + 21);
  c.stroke();
}

/** Tas de charbon de bois et bûches du forgeron. */
export function charcoal(g, x, y) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const rnd = g.rng(x, y, 77);
  for (let i = 0; i < 9; i++) {
    const dx = (rnd() - 0.5) * 12;
    const dy = (rnd() - 0.5) * 4.5;
    c.fillStyle = tone('#2b2724', 0.9 + rnd() * 0.7);
    c.beginPath();
    c.ellipse(px + dx, py + dy - 2 - (6 - Math.abs(dx)) * 0.35, 2.4 + rnd(), 1.7, rnd(), 0, 2 * PI);
    c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.2)';
  c.fillRect(px - 2, py - 6, 2, 0.8);
}
