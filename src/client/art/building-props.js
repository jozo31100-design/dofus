// Accessoires et décors des bâtiments : couleurs d'équipe (fanions, bannières, boucliers), emblèmes,
// carnyx et sangliers, tonneaux, sacs, rondins, foin, enclumes, cibles, râteliers, chariots, meules,
// épouvantails, menhirs, chêne sacré, fumée figée… Tout respecte le mode du peintre g (ombre / peinture).

import { MAT, RX, RY, tone, rgba, ink, mulCol } from './building-gfx.js';
import { stick, postScreen, WOOD, WOOD_DARK } from './building-parts.js';

const PI = Math.PI;
export const BRONZE = '#b98a3e';
export const GOLD = '#e6b93c';
export const STEEL = '#b9c0c8';
export const STRAW = '#d9b45e';

// ---------------------------------------------------------------------------
// Emblèmes (dessinés centrés en (0, 0), taille s ≈ demi-hauteur)
// ---------------------------------------------------------------------------

/** Fleur de lys stylisée. */
export function fleurDeLys(c, x, y, s, col = GOLD) {
  c.save();
  c.translate(x, y);
  c.fillStyle = col;
  c.strokeStyle = rgba(tone(col, 0.4), 0.8);
  c.lineWidth = 0.5;
  c.beginPath();
  // pétale central
  c.moveTo(0, -s);
  c.quadraticCurveTo(s * 0.42, -s * 0.35, 0, s * 0.25);
  c.quadraticCurveTo(-s * 0.42, -s * 0.35, 0, -s);
  // pétales latéraux recourbés
  c.moveTo(-s * 0.12, s * 0.05);
  c.quadraticCurveTo(-s * 0.85, -s * 0.55, -s * 0.72, s * 0.05);
  c.quadraticCurveTo(-s * 0.62, s * 0.3, -s * 0.2, s * 0.22);
  c.closePath();
  c.moveTo(s * 0.12, s * 0.05);
  c.quadraticCurveTo(s * 0.85, -s * 0.55, s * 0.72, s * 0.05);
  c.quadraticCurveTo(s * 0.62, s * 0.3, s * 0.2, s * 0.22);
  c.closePath();
  c.fill();
  // bande et pied
  c.fillRect(-s * 0.45, s * 0.2, s * 0.9, s * 0.18);
  c.beginPath();
  c.moveTo(-s * 0.12, s * 0.38);
  c.lineTo(0, s * 0.95);
  c.lineTo(s * 0.12, s * 0.38);
  c.closePath();
  c.fill();
  c.restore();
}

/** Abeille d'or (emblème mérovingien). */
export function bee(c, x, y, s, col = GOLD) {
  c.save();
  c.translate(x, y);
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(-s * 0.45, -s * 0.35, s * 0.42, s * 0.28, -0.6, 0, 2 * PI);
  c.ellipse(s * 0.45, -s * 0.35, s * 0.42, s * 0.28, 0.6, 0, 2 * PI);
  c.fill();
  c.beginPath();
  c.ellipse(0, s * 0.1, s * 0.28, s * 0.7, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = rgba(tone(col, 0.35), 0.7);
  c.fillRect(-s * 0.26, s * 0.1, s * 0.52, s * 0.12);
  c.fillRect(-s * 0.22, s * 0.38, s * 0.44, s * 0.1);
  c.beginPath();
  c.arc(0, -s * 0.72, s * 0.2, 0, 2 * PI);
  c.fillStyle = col;
  c.fill();
  c.restore();
}

/** Triskèle celte simplifié (trois volutes). */
export function triskele(c, x, y, s, col = '#f3ead2') {
  c.save();
  c.translate(x, y);
  c.strokeStyle = col;
  c.lineWidth = Math.max(0.8, s * 0.28);
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    c.save();
    c.rotate((i * 2 * PI) / 3);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(s * 0.9, -s * 0.2, s * 0.55, -s * 0.8);
    c.stroke();
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, s * 0.18, 0, 2 * PI);
  c.fillStyle = col;
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------
// Couleurs d'équipe : fanions, bannières, boucliers
// ---------------------------------------------------------------------------

/** Fanion gaulois effilé flottant vers la droite, au sommet d'une perche (hauteur hPole au-dessus de z0). */
export function pennant(g, x, y, z0, hPole, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + hPole);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z0);
  const top = py - hPole;
  if (o.pole !== false) stick(c, px, py, px, top, o.poleCol || '#6b4a2c', o.poleW ?? 1.6);
  const L = o.len ?? 20;
  const H = o.h ?? 9;
  const tc = g.tc;
  const y0 = top + 1.5;
  c.beginPath();
  c.moveTo(px + 0.6, y0);
  c.bezierCurveTo(px + L * 0.3, y0 - 2.5, px + L * 0.62, y0 + 3.5, px + L, y0 + H * 0.3);
  c.lineTo(px + L * 0.72, y0 + H * 0.52);
  c.lineTo(px + L * 0.96, y0 + H * 0.8);
  c.bezierCurveTo(px + L * 0.6, y0 + H * 0.78, px + L * 0.32, y0 + H + 2, px + 0.6, y0 + H);
  c.closePath();
  const gr = c.createLinearGradient(px, 0, px + L, 0);
  gr.addColorStop(0, tone(tc.main, 1.12));
  gr.addColorStop(0.3, tc.main);
  gr.addColorStop(0.5, tone(tc.main, 0.78));
  gr.addColorStop(0.72, tone(tc.main, 1.08));
  gr.addColorStop(1, tone(tc.main, 0.8));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.85);
  c.lineWidth = 0.9;
  c.stroke();
  if (o.symbol !== false) triskele(c, px + L * 0.24, y0 + H * 0.48, Math.min(3.4, H * 0.36));
  // pommeau de bronze
  c.fillStyle = o.knob || BRONZE;
  c.beginPath();
  c.arc(px, top - 0.5, 1.6, 0, 2 * PI);
  c.fill();
}

/** Bannière franque (gonfanon) suspendue à une traverse au sommet d'une hampe. */
export function banner(g, x, y, z0, hPole, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + hPole);
    g.shadowOf([[x, y, z0 + hPole], [x + 0.02, y + 0.02, z0 + hPole - (o.h ?? 17)], [x + 0.18, y - 0.18, z0 + hPole]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z0);
  const top = py - hPole;
  const W = o.w ?? 12;
  const H = o.h ?? 17;
  const tc = g.tc;
  if (o.pole !== false) stick(c, px, py, px, top - 2, o.poleCol || '#5b4430', o.poleW ?? 1.7);
  // traverse
  stick(c, px - W / 2 - 1.5, top + 1, px + W / 2 + 1.5, top + 1, '#5b4430', 1.3);
  const xl = px - W / 2;
  const y0 = top + 1.8;
  c.beginPath();
  c.moveTo(xl, y0);
  c.lineTo(xl + W, y0);
  c.lineTo(xl + W, y0 + H * 0.82);
  c.lineTo(xl + W * 0.83, y0 + H);
  c.lineTo(xl + W * 0.66, y0 + H * 0.84);
  c.lineTo(xl + W * 0.5, y0 + H + 0.8);
  c.lineTo(xl + W * 0.34, y0 + H * 0.84);
  c.lineTo(xl + W * 0.17, y0 + H);
  c.lineTo(xl, y0 + H * 0.82);
  c.closePath();
  const gr = c.createLinearGradient(xl, 0, xl + W, 0);
  gr.addColorStop(0, tone(tc.main, 1.1));
  gr.addColorStop(0.35, tc.main);
  gr.addColorStop(0.55, tone(tc.main, 0.8));
  gr.addColorStop(0.8, tone(tc.main, 0.95));
  gr.addColorStop(1, tone(tc.main, 0.7));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = rgba(GOLD, 0.9);
  c.lineWidth = 0.9;
  c.stroke();
  if (o.emblem === 'bee') bee(c, px, y0 + H * 0.42, W * 0.3);
  else fleurDeLys(c, px, y0 + H * 0.42, W * 0.34);
  // embouts dorés de la traverse
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(px - W / 2 - 1.6, top + 1, 1.1, 0, 2 * PI);
  c.arc(px + W / 2 + 1.6, top + 1, 1.1, 0, 2 * PI);
  c.fill();
  c.beginPath();
  c.arc(px, top - 2.5, 1.5, 0, 2 * PI);
  c.fill();
}

/** Bannière accrochée à plat sur une face (dessinée dans le repère local de la face, sous l'ombrage). */
export function wallBannerLocal(c, tc, u, v, w, h, o = {}) {
  const x = u - w / 2;
  c.fillStyle = WOOD_DARK;
  c.fillRect(x - 1.5, v - 1.6, w + 3, 1.8);
  c.beginPath();
  c.moveTo(x, v);
  c.lineTo(x + w, v);
  c.lineTo(x + w, v + h * 0.8);
  c.lineTo(x + w / 2, v + h);
  c.lineTo(x, v + h * 0.8);
  c.closePath();
  const gr = c.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, tone(tc.main, 1.08));
  gr.addColorStop(0.5, tc.main);
  gr.addColorStop(1, tone(tc.main, 0.82));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = GOLD;
  c.lineWidth = 0.8;
  c.stroke();
  // bande dorée horizontale
  c.fillStyle = rgba(GOLD, 0.9);
  c.fillRect(x, v + h * 0.12, w, 0.8);
  if (o.emblem === 'cross') {
    c.fillRect(x + w / 2 - 0.8, v + h * 0.25, 1.6, h * 0.5);
    c.fillRect(x + w * 0.25, v + h * 0.4, w * 0.5, 1.6);
  } else if (o.emblem === 'bee') bee(c, x + w / 2, v + h * 0.47, w * 0.3);
  else if (o.emblem !== false) fleurDeLys(c, x + w / 2, v + h * 0.47, w * 0.32);
}

/** Bouclier accroché (repère local d'une face) : rond franc ou ovale gaulois, face aux couleurs d'équipe. */
export function shieldLocal(c, tc, u, v, r, civ, variant = 0) {
  if (civ === 'franks') {
    c.fillStyle = '#6b5a48';
    c.beginPath();
    c.arc(u, v, r + 0.9, 0, 2 * PI);
    c.fill();
    c.fillStyle = variant % 2 ? tc.main : tone(tc.main, 0.9);
    c.beginPath();
    c.arc(u, v, r, 0, 2 * PI);
    c.fill();
    c.fillStyle = rgba(tc.light, 0.85);
    if (variant % 3 === 0) {
      c.fillRect(u - r, v - 0.6, r * 2, 1.2);
      c.fillRect(u - 0.6, v - r, 1.2, r * 2);
    } else {
      c.beginPath();
      c.moveTo(u, v);
      c.arc(u, v, r, -PI / 2, 0);
      c.closePath();
      c.moveTo(u, v);
      c.arc(u, v, r, PI / 2, PI);
      c.closePath();
      c.fill();
    }
    c.fillStyle = STEEL;
    c.beginPath();
    c.arc(u, v, r * 0.3, 0, 2 * PI);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillRect(u - r * 0.15, v - r * 0.18, r * 0.12, r * 0.12);
  } else {
    const rx = r * 0.68;
    c.fillStyle = '#5a4128';
    c.beginPath();
    c.ellipse(u, v, rx + 0.8, r + 0.8, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = variant % 2 ? tc.main : tone(tc.main, 0.9);
    c.beginPath();
    c.ellipse(u, v, rx, r, 0, 0, 2 * PI);
    c.fill();
    // motif : demi-lunes claires
    c.fillStyle = rgba(tc.light, 0.8);
    c.beginPath();
    c.ellipse(u, v - r * 0.55, rx * 0.55, r * 0.22, 0, 0, PI);
    c.ellipse(u, v + r * 0.55, rx * 0.55, r * 0.22, 0, PI, 2 * PI);
    c.fill();
    // arête (spina) et umbo
    c.fillStyle = '#7a5a36';
    c.fillRect(u - 0.7, v - r * 0.9, 1.4, r * 1.8);
    c.fillStyle = '#8a8f96';
    c.beginPath();
    c.ellipse(u, v, rx * 0.35, r * 0.2, 0, 0, 2 * PI);
    c.fill();
  }
}

// ---------------------------------------------------------------------------
// Gaulois : carnyx, sanglier-enseigne
// ---------------------------------------------------------------------------

/** Tête de sanglier stylisée (bronze) : d = 1 regarde à droite, −1 à gauche. */
function boarHead(c, x, y, s, d, col = BRONZE) {
  c.save();
  c.translate(x, y);
  c.scale(d * s, s);
  c.fillStyle = col;
  c.strokeStyle = rgba(tone(col, 0.35), 0.9);
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(-2.2, 2);
  c.quadraticCurveTo(-2.8, -1.5, 0, -2.4);
  c.quadraticCurveTo(2.4, -2.2, 4.4, -0.6);
  c.lineTo(4.6, 0.6);
  c.lineTo(2.2, 0.4);
  c.lineTo(4.2, 1.8);
  c.lineTo(1.2, 2.4);
  c.closePath();
  c.fill();
  c.stroke();
  // crête
  c.beginPath();
  c.moveTo(-2, -1.4);
  c.lineTo(-1.6, -3.6);
  c.lineTo(-0.9, -2.3);
  c.lineTo(-0.4, -4);
  c.lineTo(0.3, -2.4);
  c.lineTo(0.9, -3.4);
  c.lineTo(1.3, -2.2);
  c.closePath();
  c.fill();
  // oreille, œil, langue
  c.fillStyle = tone(col, 0.6);
  c.beginPath();
  c.moveTo(0.2, -2);
  c.lineTo(-0.9, -3.4);
  c.lineTo(1, -2.6);
  c.closePath();
  c.fill();
  c.fillStyle = '#b8322a';
  c.fillRect(2.4, 0.6, 1.4, 0.8);
  c.fillStyle = '#1e140c';
  c.fillRect(1.1, -1.3, 0.8, 0.8);
  c.fillStyle = rgba('#fff4c8', 0.6);
  c.fillRect(-1, -2, 2.6, 0.5);
  c.restore();
}

/** Carnyx dressé : long cor de bronze à tête de sanglier, fixé à une hampe. */
export function carnyx(g, x, y, z0, h, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + h, 0.03);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const d = o.dir ?? 1;
  const [px, py] = g.P(x, y, z0);
  stick(c, px - 1.5 * d, py, px - 1.5 * d, py - h * 0.72, '#5b4028', 1.5);
  // tube de bronze
  const top = py - h;
  const gr = c.createLinearGradient(px - 1.5, 0, px + 1.5, 0);
  gr.addColorStop(0, '#f2cf86');
  gr.addColorStop(0.5, BRONZE);
  gr.addColorStop(1, '#6e4c1e');
  c.strokeStyle = rgba('#3a2608', 0.8);
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(px, py - h * 0.18);
  c.lineTo(px, top + 3);
  c.quadraticCurveTo(px, top - 1, px + d * 2.5, top - 1.5);
  c.stroke();
  c.strokeStyle = gr;
  c.lineWidth = 2.1;
  c.stroke();
  // embouchure
  c.fillStyle = BRONZE;
  c.fillRect(px - 1.6, py - h * 0.18, 3.2, 1.4);
  boarHead(c, px + d * 4, top - 1.5, o.s ?? 1.25, d);
}

/** Enseigne au sanglier de bronze sur une hampe. */
export function boarStandard(g, x, y, z0, h, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + h);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const d = o.dir ?? 1;
  const s = o.s ?? 1.1;
  const [px, py] = g.P(x, y, z0);
  stick(c, px, py, px, py - h, '#5b4028', 1.6);
  const top = py - h;
  c.save();
  c.translate(px, top - 3 * s);
  c.scale(d * s, s);
  c.fillStyle = BRONZE;
  c.strokeStyle = rgba('#3a2608', 0.9);
  c.lineWidth = 0.4;
  c.beginPath();
  c.ellipse(-0.5, 0, 5, 2.6, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  // tête et groin
  c.beginPath();
  c.moveTo(3.5, -1.6);
  c.lineTo(7.5, 0.4);
  c.lineTo(7.4, 1.6);
  c.lineTo(3.4, 1.8);
  c.closePath();
  c.fill();
  c.stroke();
  // crête
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    c.moveTo(-4 + i * 1.4, -1.8);
    c.lineTo(-3.4 + i * 1.4, -4.2 + (i % 2) * 0.8);
    c.lineTo(-2.8 + i * 1.4, -1.8);
  }
  c.fill();
  // pattes
  c.fillRect(-4, 1.6, 1.1, 2.4);
  c.fillRect(-1.6, 1.8, 1.1, 2.2);
  c.fillRect(1.2, 1.8, 1.1, 2.2);
  c.fillRect(3.2, 1.6, 1.1, 2.4);
  c.fillStyle = '#f5d690';
  c.fillRect(-3.5, -1.5, 5, 0.6);
  c.fillStyle = '#1e140c';
  c.fillRect(5.2, -0.4, 0.8, 0.8);
  c.restore();
}

// ---------------------------------------------------------------------------
// Objets du quotidien
// ---------------------------------------------------------------------------

const barrelMat = {
  col: '#9a6c3e',
  ctex(c, X, Y, rx, ry, z0, z1, rnd, col) {
    // douelles
    for (let t = 0.2; t < PI; t += 0.45) {
      c.fillStyle = 'rgba(40,20,5,0.4)';
      c.fillRect(X + rx * Math.cos(t) - 0.3, Y - z1, 0.6, z1 - z0 + ry * 2);
    }
    // cercles de fer
    c.strokeStyle = '#4a4440';
    c.lineWidth = 1.2;
    for (const f of [0.2, 0.8]) {
      c.beginPath();
      c.ellipse(X, Y - z0 - (z1 - z0) * f, rx + 0.3, ry, 0, 0, PI);
      c.stroke();
    }
  },
};

/** Tonneau debout. */
export function barrel(g, x, y, z = 0, s = 1) {
  const r = 0.1 * s;
  const h = 10 * s;
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r, z, z + h);
    return;
  }
  if (!g.drawing) return;
  g.cyl(x, y, r, z, z + h, barrelMat, { ao: false });
  g.disc(x, y, r, z + h, { col: '#b58450' }, {
    inner: (c, X, Y, rx, ry) => {
      c.strokeStyle = '#4a4440';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(X, Y, rx - 0.6, ry - 0.4, 0, 0, 2 * PI);
      c.stroke();
    },
  });
}

/** Sac de toile (grain, farine, minerai). */
export function sack(g, x, y, z = 0, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.07, y - 0.07, x + 0.07, y + 0.07, z, z + 8);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const s = o.s ?? 1;
  const col = o.col || '#d8c49a';
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py);
  c.scale(s, s);
  c.beginPath();
  c.moveTo(-4.6, -1);
  c.bezierCurveTo(-5.4, -5.5, -3.4, -8.5, -1.4, -8.8);
  c.lineTo(-1.8, -10.4);
  c.lineTo(1.8, -10.4);
  c.lineTo(1.4, -8.8);
  c.bezierCurveTo(3.4, -8.5, 5.4, -5.5, 4.6, -1);
  c.quadraticCurveTo(0, 1.6, -4.6, -1);
  c.closePath();
  const gr = c.createLinearGradient(-5, 0, 5, 0);
  gr.addColorStop(0, tone(col, 1.08));
  gr.addColorStop(0.45, col);
  gr.addColorStop(1, tone(col, 0.62));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 0.8;
  c.stroke();
  c.strokeStyle = '#7a5a36';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-1.7, -8.9);
  c.lineTo(1.7, -8.9);
  c.stroke();
  if (o.spill) {
    c.fillStyle = o.spill;
    c.beginPath();
    c.ellipse(0, -10.6, 2, 0.9, 0, 0, 2 * PI);
    c.fill();
  }
  c.restore();
}

/** Caisse de planches. */
export function crate(g, x, y, z = 0, s = 0.11, h = 8) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - s, y - s, x + s, y + s, z, z + h);
    return;
  }
  if (!g.drawing) return;
  const brace = (c, w, hh) => {
    c.strokeStyle = 'rgba(60,35,15,0.7)';
    c.lineWidth = 1.2;
    c.strokeRect(0.6, 0.6, w - 1.2, hh - 1.2);
    c.beginPath();
    c.moveTo(0.6, hh - 0.6);
    c.lineTo(w - 0.6, 0.6);
    c.stroke();
  };
  g.box(x - s, y - s, x + s, y + s, z, z + h, { col: '#a77b4c', tex: null }, { ao: false, decoL: brace, decoR: brace, topMat: { col: '#b98c5a' } });
}

/** Rondin couché (cylindre horizontal) le long de x ou de y ; (x, y) = centre, z = bas. rho : rayon (px). */
export function logH(g, x, y, z, axis, L, rho = 3.2, o = {}) {
  if (g.mode === 'shadow') {
    if (axis === 'x') g.shadowBox(x - L / 2, y - 0.08, x + L / 2, y + 0.08, z, z + rho * 2);
    else g.shadowBox(x - 0.08, y - L / 2, x + 0.08, y + L / 2, z, z + rho * 2);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const zc = z + rho;
  const A = axis === 'x' ? g.P(x - L / 2, y, zc) : g.P(x, y - L / 2, zc);
  const B = axis === 'x' ? g.P(x + L / 2, y, zc) : g.P(x, y + L / 2, zc);
  const bark = o.bark || '#7a5634';
  // corps
  const nx = axis === 'x' ? -0.447 : 0.447;
  const ny = 0.894;
  const w = rho * 1.2;
  const mx = (A[0] + B[0]) / 2;
  const my = (A[1] + B[1]) / 2;
  const gr = c.createLinearGradient(mx - nx * w, my - ny * w, mx + nx * w, my + ny * w);
  gr.addColorStop(0, tone(bark, 1.25));
  gr.addColorStop(0.45, bark);
  gr.addColorStop(1, tone(bark, 0.5));
  c.strokeStyle = ink(bark, 0.8);
  c.lineWidth = w * 2 + 1;
  c.beginPath();
  c.moveTo(A[0], A[1]);
  c.lineTo(B[0], B[1]);
  c.stroke();
  c.strokeStyle = gr;
  c.lineWidth = w * 2;
  c.stroke();
  // bout coupé visible
  c.save();
  if (axis === 'x') c.setTransform(-0.894 * rho, 0.447 * rho, 0, -rho, B[0], B[1]);
  else c.setTransform(0.894 * rho, 0.447 * rho, 0, -rho, B[0], B[1]);
  c.beginPath();
  c.arc(0, 0, 1, 0, 2 * PI);
  c.fillStyle = o.cut || '#dcb77e';
  c.fill();
  c.lineWidth = 0.35;
  c.strokeStyle = '#5a3a1e';
  c.stroke();
  c.lineWidth = 0.18;
  c.strokeStyle = 'rgba(120,80,40,0.8)';
  c.beginPath();
  c.arc(0, 0, 0.55, 0, 2 * PI);
  c.stroke();
  c.beginPath();
  c.arc(0.05, 0, 0.2, 0, 2 * PI);
  c.stroke();
  c.restore();
}

/** Pile de rondins en pyramide (rangs : ex. [4, 3, 2]). */
export function logPile(g, x, y, axis = 'x', rows = [4, 3, 2], L = 0.9, rho = 3.2) {
  const d = (rho * 2) / (axis === 'x' ? 35.8 : 35.8);
  for (let r = 0; r < rows.length; r++) {
    const n = rows[r];
    const z = r * rho * 1.7;
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    // arrière d'abord
    for (const i of idx) {
      const off = (i - (n - 1) / 2) * d;
      if (axis === 'x') logH(g, x + ((r * 7 + i * 3) % 5) * 0.012, y + off, z, 'x', L, rho);
      else logH(g, x + off, y + ((r * 7 + i * 3) % 5) * 0.012, z, 'y', L, rho);
    }
  }
}

/** Meule de foin arrondie. */
export function haystack(g, x, y, r = 0.3, h = 18) {
  if (g.mode === 'shadow') {
    g.shadowCone(x, y, r, 0, h);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  const rx = r * RX;
  const ry = r * RY;
  const path = () => {
    c.beginPath();
    c.moveTo(X - rx, Y);
    c.bezierCurveTo(X - rx * 1.05, Y - h * 0.65, X - rx * 0.45, Y - h, X, Y - h);
    c.bezierCurveTo(X + rx * 0.45, Y - h, X + rx * 1.05, Y - h * 0.65, X + rx, Y);
    c.ellipse(X, Y, rx, ry, 0, 0, PI, false);
    c.closePath();
  };
  c.save();
  path();
  c.clip();
  c.fillStyle = STRAW;
  c.fillRect(X - rx - 2, Y - h - 2, rx * 2 + 4, h + ry + 4);
  const rnd = g.rng(x, y, 55);
  c.lineWidth = 0.8;
  for (let i = 0; i < rx * 5; i++) {
    const px = X + (rnd() - 0.5) * rx * 2;
    const py = Y - rnd() * h;
    c.strokeStyle = rnd() < 0.5 ? 'rgba(255,240,180,0.6)' : 'rgba(140,100,30,0.45)';
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + (rnd() - 0.5) * 3, py + 2 + rnd() * 3);
    c.stroke();
  }
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = g.roundShade(X, rx, 0.6);
  c.fillRect(X - rx - 2, Y - h - 2, rx * 2 + 4, h + ry + 4);
  c.restore();
  path();
  c.strokeStyle = ink(STRAW, 0.5);
  c.lineWidth = 1;
  c.stroke();
}

/** Botte de foin rectangulaire. */
export function hayBale(g, x, y, z = 0, axis = 'x') {
  const a = axis === 'x' ? 0.16 : 0.1;
  const b = axis === 'x' ? 0.1 : 0.16;
  const tex = (c, w, h) => {
    c.strokeStyle = 'rgba(120,85,25,0.5)';
    c.lineWidth = 0.6;
    for (let u = 1; u < w; u += 2.2) {
      c.beginPath();
      c.moveTo(u, 0);
      c.lineTo(u + 0.6, h);
      c.stroke();
    }
    c.fillStyle = 'rgba(90,60,20,0.6)';
    c.fillRect(w * 0.3, 0, 0.8, h);
    c.fillRect(w * 0.7, 0, 0.8, h);
  };
  g.box(x - a, y - b, x + a, y + b, z, z + 6, { col: STRAW, tex }, { ao: false, topMat: { col: tone(STRAW, 1.08), tex } });
}

/** Enclume sur son billot. */
export function anvil(g, x, y) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.1, y - 0.1, x + 0.1, y + 0.1, 0, 12);
    return;
  }
  if (!g.drawing) return;
  g.cyl(x, y, 0.1, 0, 7, { col: '#7a5634', ctex: null }, { top: { col: '#b08658' } });
  const c = g.ctx;
  const [px, py] = g.P(x, y, 7);
  c.fillStyle = '#4c4f55';
  c.strokeStyle = 'rgba(15,15,20,0.8)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(px - 3, py - 0.5);
  c.lineTo(px - 2, py - 3);
  c.lineTo(px - 5, py - 4);
  c.quadraticCurveTo(px - 8.5, py - 4.6, px - 9, py - 5.6);
  c.lineTo(px + 5.5, py - 6);
  c.lineTo(px + 5.5, py - 4);
  c.lineTo(px + 2.5, py - 3);
  c.lineTo(px + 3.5, py - 0.5);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#9aa0a8';
  c.fillRect(px - 8, py - 6, 13.5, 0.9);
  // marteau posé
  c.fillStyle = '#6b4a2c';
  c.fillRect(px - 1, py - 7.4, 6, 1);
  c.fillStyle = '#5a5e66';
  c.fillRect(px + 4, py - 8.4, 2.2, 3);
}

/** Lueur de foyer (dégradé radial additif). */
export function glow(g, x, y, z, r = 10, col = [255, 150, 50]) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  const gr = c.createRadialGradient(px, py, 0, px, py, r);
  gr.addColorStop(0, `rgba(${col[0]},${Math.min(255, col[1] + 70)},${col[2] + 60},0.95)`);
  gr.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},0.6)`);
  gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = gr;
  c.fillRect(px - r, py - r, r * 2, r * 2);
  c.restore();
}

/** Fumée figée : volutes qui montent en dérivant vers la droite. */
export function smoke(g, x, y, z, o = {}) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  const n = o.n ?? 6;
  const rnd = g.rng(x, y, z, 91);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = 3.5 + t * 7 + rnd() * 1.5;
    const cx = px + t * t * 16 + (rnd() - 0.5) * 2;
    const cy = py - 4 - t * (o.h ?? 34);
    const gr = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    const a = (1 - t) * 0.55 + 0.1;
    gr.addColorStop(0, `rgba(235,232,228,${a})`);
    gr.addColorStop(0.6, `rgba(170,168,170,${a * 0.7})`);
    gr.addColorStop(1, 'rgba(150,150,155,0)');
    c.fillStyle = gr;
    c.beginPath();
    c.arc(cx, cy, r, 0, 2 * PI);
    c.fill();
  }
}

/** Cible de paille sur chevalet, face à la caméra. */
export function target(g, x, y, r = 7) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, r * 2 + 6);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const cy = py - r - 5;
  stick(c, px - r * 0.6, py, px - 1, cy - r * 0.4, '#7a5634', 1.4);
  stick(c, px + r * 0.6, py, px + 1, cy - r * 0.4, '#7a5634', 1.4);
  stick(c, px + 1.5, py + 1.5, px, cy, '#6a4a2c', 1.2);
  const rings = [[r, STRAW], [r * 0.78, '#f0e6cc'], [r * 0.6, '#c23a2e'], [r * 0.4, '#f0e6cc'], [r * 0.2, '#c23a2e']];
  for (const [rr, col] of rings) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(px, cy, rr, 0, 2 * PI);
    c.fill();
  }
  c.strokeStyle = 'rgba(120,85,25,0.8)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.arc(px, cy, r, 0, 2 * PI);
  c.stroke();
  // ombrage
  c.save();
  c.beginPath();
  c.arc(px, cy, r, 0, 2 * PI);
  c.clip();
  c.globalCompositeOperation = 'multiply';
  const gr = c.createLinearGradient(px - r, cy - r, px + r, cy + r);
  gr.addColorStop(0, mulCol(1));
  gr.addColorStop(1, mulCol(0.72));
  c.fillStyle = gr;
  c.fillRect(px - r, cy - r, r * 2, r * 2);
  c.restore();
  // flèches plantées
  c.strokeStyle = '#4a3420';
  c.lineWidth = 0.8;
  for (const [dx, dy] of [[-2, -1.5], [1.5, 1], [3, -3]]) {
    c.beginPath();
    c.moveTo(px + dx, cy + dy);
    c.lineTo(px + dx + 4, cy + dy + 2.5);
    c.stroke();
    c.fillStyle = '#efe6d0';
    c.fillRect(px + dx + 3.2, cy + dy + 1.6, 1.6, 1.4);
  }
}

/** Râtelier d'armes (lances et épées) le long de x ou de y. */
export function weaponRack(g, x, y, axis = 'x', L = 0.6, o = {}) {
  const ax = axis === 'x' ? L / 2 : 0;
  const ay = axis === 'y' ? L / 2 : 0;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - ax, y - ay, 0], [x + ax, y + ay, 0], [x - ax, y - ay, 18], [x + ax, y + ay, 18]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.post(x - ax, y - ay, 0, 11, WOOD, 2);
  const n = o.n ?? 5;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const px = x - ax + 2 * ax * t;
    const py = y - ay + 2 * ay * t;
    const [bx, by] = g.P(px, py, 0);
    const [tx, ty] = g.P(px - 0.04, py - 0.04, 21 + (i % 2) * 3);
    if (o.bows && i % 2) {
      c.strokeStyle = '#7a4a22';
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(bx, by - 2);
      c.quadraticCurveTo(bx + 5, (by + ty) / 2, tx, ty + 2);
      c.stroke();
      c.strokeStyle = 'rgba(240,235,220,0.8)';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(bx, by - 2);
      c.lineTo(tx, ty + 2);
      c.stroke();
    } else {
      stick(c, bx, by - 1, tx, ty, '#8a6440', 1);
      c.fillStyle = STEEL;
      c.beginPath();
      c.moveTo(tx - 1.4, ty + 1);
      c.lineTo(tx - 0.3, ty - 4);
      c.lineTo(tx + 1, ty + 1);
      c.closePath();
      c.fill();
    }
  }
  g.beam(x - ax, y - ay, 10, x + ax, y + ay, 10, WOOD, 1.8);
  g.post(x + ax, y + ay, 0, 11, WOOD, 2);
}

/** Roue de bois verticale dans le plan d'axe `axis` (roue d'un chariot roulant selon axis). */
export function wheel(g, x, y, z, rpx, axis = 'x', col = '#7a5634') {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  // disque dans le plan vertical contenant l'axe de roulement
  if (axis === 'x') c.setTransform(0.894 * rpx, 0.447 * rpx, 0, -rpx, px, py);
  else c.setTransform(-0.894 * rpx, 0.447 * rpx, 0, -rpx, px, py);
  c.lineWidth = 0.22;
  c.strokeStyle = col;
  c.beginPath();
  c.arc(0, 0, 0.88, 0, 2 * PI);
  c.stroke();
  c.lineWidth = 0.1;
  c.strokeStyle = tone(col, 0.6);
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * PI) / 3;
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * 0.85, Math.sin(a) * 0.85);
  }
  c.stroke();
  c.fillStyle = tone(col, 0.7);
  c.beginPath();
  c.arc(0, 0, 0.18, 0, 2 * PI);
  c.fill();
  c.restore();
}

/** Chariot (caisse sur deux roues) chargé ; load : 'gold' | 'stone' | 'ore' | 'wood' | null. */
export function cart(g, x, y, axis = 'x', load = 'stone') {
  const a = axis === 'x' ? 0.26 : 0.16;
  const b = axis === 'x' ? 0.16 : 0.26;
  if (g.mode === 'shadow') {
    g.shadowBox(x - a, y - b, x + a, y + b, 0, 12);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  // roue arrière (cachée en partie)
  if (axis === 'x') wheel(g, x, y - b - 0.02, 6, 5.5, 'x');
  else wheel(g, x - a - 0.02, y, 6, 5.5, 'y');
  const plank = { col: '#9a7048', tex: (cc, w, h, rnd) => {
    cc.fillStyle = 'rgba(40,20,5,0.45)';
    for (let v = 3; v < h; v += 3) cc.fillRect(0, v, w, 0.6);
  } };
  // intérieur
  g.box(x - a, y - b, x + a, y + b, 5, 6, plank, { ao: false });
  if (load) {
    const rnd = g.rng(x, y, 3);
    const col = load === 'gold' ? '#e8c04a' : load === 'ore' ? '#6e6a64' : load === 'wood' ? '#8a6440' : '#a9a498';
    const [px, py] = g.P(x, y, 10);
    for (let i = 0; i < 9; i++) {
      c.fillStyle = tone(col, 0.8 + rnd() * 0.4);
      c.beginPath();
      c.ellipse(px + (rnd() - 0.5) * 12, py + (rnd() - 0.5) * 4, 2 + rnd(), 1.5 + rnd() * 0.8, 0, 0, 2 * PI);
      c.fill();
      if (load === 'gold') {
        c.fillStyle = 'rgba(255,250,210,0.9)';
        c.fillRect(px + (rnd() - 0.5) * 10, py + (rnd() - 0.5) * 3 - 1, 1, 1);
      }
    }
  }
  // flancs
  g.faceR(x + a, y - b, y + b, 5, 11, plank, { ao: false });
  g.faceL(x - a, x + a, y + b, 5, 11, plank, { ao: false });
  // timon
  const [t0x, t0y] = axis === 'x' ? g.P(x + a, y, 6) : g.P(x, y + b, 6);
  const [t1x, t1y] = axis === 'x' ? g.P(x + a + 0.3, y, 1) : g.P(x, y + b + 0.3, 1);
  stick(c, t0x, t0y, t1x, t1y, '#6a4a2c', 1.4);
  if (axis === 'x') wheel(g, x, y + b + 0.02, 6, 5.5, 'x');
  else wheel(g, x + a + 0.02, y, 6, 5.5, 'y');
}

/** Meule de pierre (disque épais) couchée. */
export function millstone(g, x, y, z = 0, r = 0.16, h = 4) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r, z, z + h);
    return;
  }
  if (!g.drawing) return;
  g.cyl(x, y, r, z, z + h, { col: '#a19c92', ctex: null }, { ao: false });
  g.disc(x, y, r, z + h, { col: '#b8b3a8' }, {
    inner: (c, X, Y, rx, ry) => {
      c.strokeStyle = 'rgba(70,65,60,0.5)';
      c.lineWidth = 0.6;
      for (let i = 0; i < 8; i++) {
        const a = (i * PI) / 4;
        c.beginPath();
        c.moveTo(X + Math.cos(a) * rx * 0.3, Y + Math.sin(a) * ry * 0.3);
        c.lineTo(X + Math.cos(a) * rx * 0.9, Y + Math.sin(a) * ry * 0.9);
        c.stroke();
      }
      c.fillStyle = '#3a342e';
      c.beginPath();
      c.ellipse(X, Y, rx * 0.18, ry * 0.18, 0, 0, 2 * PI);
      c.fill();
    },
  });
}

/** Meule de pierre dressée (appuyée), face à la caméra. */
export function millstoneUp(g, x, y, rpx = 7) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.1, y - 0.1, x + 0.1, y + 0.1, 0, rpx * 2);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const cy = py - rpx;
  // tranche
  c.fillStyle = '#7e7970';
  c.beginPath();
  c.ellipse(px + 1.6, cy + 0.6, rpx, rpx, 0, 0, 2 * PI);
  c.fill();
  const gr = c.createLinearGradient(px - rpx, cy - rpx, px + rpx, cy + rpx);
  gr.addColorStop(0, '#c9c4b8');
  gr.addColorStop(1, '#8e897f');
  c.fillStyle = gr;
  c.beginPath();
  c.ellipse(px, cy, rpx, rpx, 0, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(50,45,40,0.6)';
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = '#3a342e';
  c.beginPath();
  c.arc(px, cy, rpx * 0.2, 0, 2 * PI);
  c.fill();
}

/** Chevalet de sciage avec une bille de bois. */
export function sawhorse(g, x, y, axis = 'x') {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.25, y - 0.1, x + 0.25, y + 0.1, 0, 12);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const L = 0.36;
  for (const s of [-1, 1]) {
    const px = axis === 'x' ? x + s * L * 0.7 : x;
    const py = axis === 'y' ? y + s * L * 0.7 : y;
    const [a1x, a1y] = g.P(px + (axis === 'x' ? 0 : -0.1), py + (axis === 'x' ? -0.1 : 0), 0);
    const [a2x, a2y] = g.P(px + (axis === 'x' ? 0 : 0.1), py + (axis === 'x' ? 0.1 : 0), 0);
    const [tx, ty] = g.P(px, py, 9);
    stick(c, a1x, a1y, tx + 1, ty - 2, '#8a6440', 1.4);
    stick(c, a2x, a2y, tx - 1, ty - 2, '#8a6440', 1.4);
  }
  logH(g, x, y, 7, axis, L * 2.2, 2.6);
  // scie
  const [sx, sy] = axis === 'x' ? g.P(x + 0.05, y + 0.12, 12) : g.P(x + 0.12, y + 0.05, 12);
  c.fillStyle = '#c3c8cc';
  c.beginPath();
  c.moveTo(sx - 5, sy);
  c.lineTo(sx + 5, sy + 2.5);
  c.lineTo(sx + 5, sy + 4);
  c.lineTo(sx - 5, sy + 1.5);
  c.closePath();
  c.fill();
  c.fillStyle = '#6a4a2c';
  c.fillRect(sx - 7, sy - 1, 2.4, 3.4);
}

/** Hache plantée dans un billot. */
export function stumpAxe(g, x, y) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.1, 0, 12);
    return;
  }
  if (!g.drawing) return;
  g.cyl(x, y, 0.11, 0, 6, { col: '#7a5634' }, {
    top: { col: '#d6b07a' },
  });
  const c = g.ctx;
  const [px, py] = g.P(x, y, 6);
  stick(c, px - 1, py - 0.5, px + 5, py - 9, '#8a6440', 1.3);
  c.fillStyle = '#9aa2aa';
  c.beginPath();
  c.moveTo(px - 3.2, py - 0.2);
  c.lineTo(px + 1.4, py - 1.4);
  c.lineTo(px + 0.6, py + 1.4);
  c.closePath();
  c.fill();
}

/** Abreuvoir / mangeoire. */
export function trough(g, x, y, axis = 'x', L = 0.5) {
  const a = axis === 'x' ? L / 2 : 0.09;
  const b = axis === 'x' ? 0.09 : L / 2;
  if (g.mode === 'shadow') {
    g.shadowBox(x - a, y - b, x + a, y + b, 0, 5);
    return;
  }
  if (!g.drawing) return;
  g.box(x - a, y - b, x + a, y + b, 0, 5, MAT.planksDark, { ao: false, topMat: { col: '#4f7f93' }, decoT: (c, w, h) => {
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(w * 0.2, h * 0.3, w * 0.4, 1);
  } });
}

/** Épouvantail vêtu aux couleurs d'équipe. */
export function scarecrow(g, x, y, civ) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, 0, 26, 0.05);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const tc = g.tc;
  const [px, py] = g.P(x, y, 0);
  stick(c, px, py, px, py - 24, '#7a5634', 1.6);
  stick(c, px - 8, py - 18, px + 8, py - 19, '#7a5634', 1.4);
  // tunique
  c.fillStyle = tc.main;
  c.beginPath();
  c.moveTo(px - 5, py - 19);
  c.lineTo(px + 5, py - 19.5);
  c.lineTo(px + 4, py - 9);
  c.lineTo(px + 1.5, py - 10.5);
  c.lineTo(px - 1, py - 8.5);
  c.lineTo(px - 4, py - 9.5);
  c.closePath();
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.9);
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = rgba(tc.dark, 0.5);
  c.fillRect(px + 1, py - 19.3, 3.5, 10);
  // manches de paille
  c.strokeStyle = STRAW;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px - 8, py - 18);
  c.lineTo(px - 10, py - 16);
  c.moveTo(px - 8, py - 18);
  c.lineTo(px - 10, py - 18.5);
  c.moveTo(px + 8, py - 19);
  c.lineTo(px + 10, py - 17);
  c.moveTo(px + 8, py - 19);
  c.lineTo(px + 10.5, py - 19.5);
  c.stroke();
  // tête de toile et chapeau
  c.fillStyle = '#e2d2a8';
  c.beginPath();
  c.arc(px, py - 22.5, 2.8, 0, 2 * PI);
  c.fill();
  c.fillStyle = civ === 'franks' ? '#5b4a3a' : STRAW;
  c.beginPath();
  c.ellipse(px, py - 24.4, 4.8, 1.3, 0, 0, 2 * PI);
  c.fill();
  c.beginPath();
  c.ellipse(px, py - 25.5, 2.4, 1.8, 0, PI, 2 * PI);
  c.fill();
  c.fillStyle = '#2a1c12';
  c.fillRect(px - 1.3, py - 23, 0.8, 0.8);
  c.fillRect(px + 0.6, py - 23, 0.8, 0.8);
}

/** Menhir (pierre levée) irrégulier, h en px. */
export function menhir(g, x, y, h = 26, o = {}) {
  const w = o.w ?? 0.09;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - w, y - w, 0], [x + w, y + w, 0], [x, y, h], [x + w, y - w, 0], [x - w, y + w, 0]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x, y, h, 13);
  const [px, py] = g.P(x, y, 0);
  const hw = w * 44 + rnd() * 1.5;
  const lean = (rnd() - 0.5) * 3;
  const top = [px + lean, py - h];
  const L = [
    [px - hw, py + 1],
    [px - hw - 1 + rnd(), py - h * 0.45],
    [px - hw * 0.7 + lean, py - h * 0.85],
    [top[0] - 1, top[1]],
    [top[0] + 1.5, top[1] + 1],
  ];
  const R = [
    [top[0] + 1.5, top[1] + 1],
    [px + hw * 0.75 + lean, py - h * 0.8],
    [px + hw + 1, py - h * 0.4],
    [px + hw, py + 1],
  ];
  const ridge = [px + 1 + lean * 0.5, py + 2];
  const col = o.col || '#a4a197';
  // face gauche éclairée
  g.fillPoly([...L, [top[0] + 1.5, top[1] + 1], ridge], tone(col, 1.02), false);
  g.fillPoly([...R, ridge], tone(col, 0.7), false);
  const all = [...L, ...R.slice(1)];
  g.path(all);
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 1;
  c.stroke();
  // lichens et gravures
  c.fillStyle = 'rgba(150,170,90,0.45)';
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(px + (rnd() - 0.5) * hw, py - rnd() * h * 0.8, 1.5 + rnd() * 1.5, 1 + rnd(), 0, 0, 2 * PI);
    c.fill();
  }
  if (o.carve) {
    c.strokeStyle = 'rgba(60,55,50,0.6)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.arc(px - 1, py - h * 0.55, 2, 0, 1.6 * PI);
    c.stroke();
  }
}

/** Grand chêne (bosquet sacré) : tronc noueux, houppier en boules, gui. h : hauteur totale. */
export function oak(g, x, y, h = 105, o = {}) {
  const R = o.R ?? 44;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - 0.1, y - 0.1, 0], [x + 0.1, y + 0.1, 0], [x - 0.8, y + 0.8, h * 0.55], [x + 0.8, y - 0.8, h * 0.55], [x, y, h], [x + 0.6, y + 0.6, h * 0.5], [x - 0.6, y - 0.6, h * 0.7]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x, y, h, 21);
  const [px, py] = g.P(x, y, 0);
  // tronc et branches maîtresses
  const trunk = '#5e4430';
  const tg = c.createLinearGradient(px - 7, 0, px + 7, 0);
  tg.addColorStop(0, tone(trunk, 1.25));
  tg.addColorStop(0.5, trunk);
  tg.addColorStop(1, tone(trunk, 0.55));
  c.fillStyle = tg;
  c.beginPath();
  c.moveTo(px - 8, py + 1);
  c.quadraticCurveTo(px - 4, py - 8, px - 4.5, py - h * 0.35);
  c.lineTo(px - 14, py - h * 0.55);
  c.lineTo(px - 11, py - h * 0.57);
  c.lineTo(px - 2, py - h * 0.45);
  c.lineTo(px + 1, py - h * 0.6);
  c.lineTo(px + 4, py - h * 0.58);
  c.lineTo(px + 3.5, py - h * 0.44);
  c.lineTo(px + 13, py - h * 0.55);
  c.lineTo(px + 15, py - h * 0.52);
  c.lineTo(px + 5, py - h * 0.36);
  c.quadraticCurveTo(px + 4, py - 8, px + 9, py + 1);
  c.closePath();
  c.fill();
  c.strokeStyle = ink(trunk, 0.6);
  c.lineWidth = 0.9;
  c.stroke();
  c.strokeStyle = 'rgba(30,20,10,0.35)';
  c.beginPath();
  c.moveTo(px - 2, py - 3);
  c.lineTo(px - 1, py - h * 0.3);
  c.moveTo(px + 2, py - 6);
  c.lineTo(px + 2.5, py - h * 0.25);
  c.stroke();
  // houppier : boules superposées, du fond vers l'avant
  const cy = py - h * 0.68;
  const blobs = [];
  for (let i = 0; i < 22; i++) {
    const a = rnd() * 2 * PI;
    const d = Math.sqrt(rnd());
    const bx = px + Math.cos(a) * R * 0.78 * d;
    const by = cy + Math.sin(a) * R * 0.52 * d - (1 - d) * 6;
    blobs.push({ x: bx, y: by, r: 11 + rnd() * 7 });
  }
  blobs.sort((a, b) => a.y - b.y);
  const greens = ['#2f5a24', '#3f7330', '#548c3a', '#6ea447'];
  for (const b of blobs) {
    const gr = c.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
    gr.addColorStop(0, greens[3]);
    gr.addColorStop(0.45, greens[2]);
    gr.addColorStop(0.85, greens[1]);
    gr.addColorStop(1, greens[0]);
    c.fillStyle = gr;
    c.beginPath();
    c.arc(b.x, b.y, b.r, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(20,40,15,0.35)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(b.x, b.y, b.r, PI * 0.15, PI * 0.95);
    c.stroke();
    // feuillage découpé
    c.fillStyle = 'rgba(150,200,100,0.35)';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.arc(b.x - b.r * 0.4 + rnd() * b.r * 0.6, b.y - b.r * 0.5 + rnd() * b.r * 0.5, 1.6, 0, 2 * PI);
      c.fill();
    }
  }
  // gui
  for (let i = 0; i < 3; i++) {
    const b = blobs[Math.floor(rnd() * blobs.length)];
    c.fillStyle = '#b8c96a';
    c.beginPath();
    c.arc(b.x + (rnd() - 0.5) * 8, b.y + b.r * 0.5, 3, 0, 2 * PI);
    c.fill();
    c.fillStyle = '#f4f2dc';
    c.fillRect(b.x - 1, b.y + b.r * 0.5 - 1, 1.2, 1.2);
  }
  if (o.ribbons) {
    // rubans aux couleurs d'équipe noués aux branches basses
    const tc = g.tc;
    for (const [dx, dy] of [[-12, -h * 0.5], [11, -h * 0.49], [-3, -h * 0.44]]) {
      c.strokeStyle = tc.main;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(px + dx, py + dy);
      c.quadraticCurveTo(px + dx + 2, py + dy + 6, px + dx + 1, py + dy + 11);
      c.stroke();
    }
  }
}

/** Puits de pierre avec treuil. */
export function well(g, x, y) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.2, 0, 20);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  g.post(x - 0.16, y - 0.16, 0, 20, WOOD, 2);
  g.cyl(x, y, 0.2, 0, 7, MAT.stone, { top: { col: '#1d2a33' } });
  g.post(x + 0.16, y + 0.16, 0, 20, WOOD, 2);
  const a = g.P(x - 0.2, y - 0.2, 18);
  const b = g.P(x + 0.2, y + 0.2, 18);
  stick(c, a[0], a[1], b[0], b[1], WOOD_DARK, 1.6);
  c.strokeStyle = '#d8cfb4';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(X, Y - 18);
  c.lineTo(X, Y - 10);
  c.stroke();
  c.fillStyle = '#7a5634';
  c.fillRect(X - 1.8, Y - 11, 3.6, 3);
}

/** Petit feu de camp (cendres et braises, sans flamme animée). */
export function campfire(g, x, y) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  c.fillStyle = 'rgba(40,30,25,0.6)';
  c.beginPath();
  c.ellipse(px, py, 7, 3.5, 0, 0, 2 * PI);
  c.fill();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * PI;
    c.fillStyle = '#8e8a84';
    c.beginPath();
    c.ellipse(px + Math.cos(a) * 6, py + Math.sin(a) * 3, 1.6, 1.1, 0, 0, 2 * PI);
    c.fill();
  }
  stick(c, px - 4, py + 1, px + 3, py - 2, '#4a3020', 1.4);
  stick(c, px - 3, py - 2, px + 4, py + 1, '#4a3020', 1.4);
  glow(g, x, y, 1, 7);
}

/** Pierre à aiguiser / tas d'armes brisées, etc. : petit amas de débris. */
export function debris(g, x, y, n = 6, cols = ['#8e8a84', '#6f4a2a']) {
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x, y, n, 44);
  for (let i = 0; i < n; i++) {
    const [px, py] = g.P(x + (rnd() - 0.5) * 0.3, y + (rnd() - 0.5) * 0.3, 0);
    c.fillStyle = cols[i % cols.length];
    c.beginPath();
    c.ellipse(px, py - 1, 1.5 + rnd() * 1.5, 1 + rnd(), rnd() * 3, 0, 2 * PI);
    c.fill();
  }
}

export { stick, postScreen };
