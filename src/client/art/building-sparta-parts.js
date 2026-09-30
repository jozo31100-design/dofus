// Pièces communes des bâtiments spartiates (Sparte classique, Ve-IVe s. av. J.-C.) : stylobate à degrés, colonnes doriques cannelées
// de calcaire clair, architrave à triglyphes (métopes aux couleurs d'équipe), frontons à lambda, tuiles rouges ; accessoires
// laconiens : olivier, trépied de bronze, statue d'hoplite, hoplons suspendus, palmettes d'acrotère.
import { MAT, tone, ink } from './building-gfx.js';
import { gableRoof, scaffoldBox, doorLocal, windowLocal, stick } from './building-parts.js';
import { banner as baseBanner, GOLD } from './building-props.js';

/** Bannière d'équipe au lambda d'or. */
export const banner = (g, x, y, z0, h, o = {}) => baseBanner(g, x, y, z0, h, { emblem: 'lambda', ...o });

const PI = Math.PI;
export const MARBLE = { ...MAT.stoneLight, col: '#dcd6c6' };
export const STYL = { ...MAT.stoneLight, col: '#c9c3b2' };
export const WALL = { ...MAT.plaster, col: '#e8dcc0' };
export const TILE = { ...MAT.shingle, col: '#b4553c' };
export const TILE_EDGE = '#8a3a2a';
export const LAMBDA = '#f8e8a0';

/** Lambda d'or dans un disque d'équipe (tympan, socles). */
export function lambdaDisc(c, tc, x, y, r) {
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(x, y, r + 1.2, 0, 2 * PI);
  c.fill();
  c.fillStyle = tc.main;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * PI);
  c.fill();
  c.strokeStyle = LAMBDA;
  c.lineWidth = Math.max(1.1, r * 0.22);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.5, y + r * 0.6);
  c.lineTo(x, y - r * 0.62);
  c.lineTo(x + r * 0.55, y + r * 0.6);
  c.stroke();
  c.lineCap = 'butt';
}

/** Colonne cannelée. */
export function column(g, x, y, z0, z1, r) {
  if (g.mode !== 'draw') {
    g.cyl(x, y, r, z0, z1, MARBLE);
    return;
  }
  g.cyl(x, y, r, z0, z1, MARBLE, {
    ao: false,
    deco: (c, X, Y, rx) => {
      c.strokeStyle = 'rgba(90,84,70,0.4)';
      c.lineWidth = 0.6;
      c.beginPath();
      for (const k of [-0.55, -0.15, 0.3, 0.7]) {
        c.moveTo(X + rx * k, Y - z1);
        c.lineTo(X + rx * k, Y - z0);
      }
      c.stroke();
    },
  });
  g.box(x - r * 1.45, y - r * 1.45, x + r * 1.45, y + r * 1.45, z1 - 2.6, z1, MARBLE, { quick: true, ao: false });
}

/**
 * Temple périptère : stylobate, colonnade, cella, architrave, toit à fronton (façade vers +x).
 * o : { x0, y0, x1, y1, z0, colH, ny (colonnes en façade), nx (colonnes sur les côtés), pedH, stepH, r, cella, backWall, flat }
 */
export function doric(g, o) {
  const { x0, y0, x1, y1 } = o;
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const st = g.stage;
  const tc = g.tc;
  const z0 = o.z0 || 0;
  const sh = o.stepH || 6;
  const zc = z0 + sh;
  const colH = o.colH;
  const eh = o.entH || 8;
  const zt = zc + colH + eh;
  const zr = zt + (o.pedH || 22);
  const ins = 0.17;
  const r = o.r || 0.065;
  // Colonnes : façade (x1) et fond (x0) en ny colonnes, flancs en nx
  const cols = [];
  const ny = o.ny;
  const nx = o.nx;
  for (let i = 0; i < ny; i++) {
    const y = y0 + ins + ((y1 - y0 - 2 * ins) * i) / (ny - 1);
    cols.push([x1 - ins, y], [x0 + ins, y]);
  }
  for (let i = 1; i < nx - 1; i++) {
    const x = x0 + ins + ((x1 - x0 - 2 * ins) * i) / (nx - 1);
    cols.push([x, y0 + ins], [x, y1 - ins]);
  }
  cols.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const cut = o.cut ?? 0;
  const back = cols.filter((p) => p[0] + p[1] < cut);
  const front = cols.filter((p) => p[0] + p[1] >= cut);
  g.box(x0, y0, x1, y1, z0, z0 + sh * 0.5, STYL, { topMat: STYL });
  g.box(x0 + 0.07, y0 + 0.07, x1 - 0.07, y1 - 0.07, z0 + sh * 0.5, zc, STYL, { topMat: { col: '#d4cebe' } });
  if (st === 1) {
    for (const [x, y] of back) column(g, x, y, zc, zc + colH * 0.45, r);
    if (g.mode === 'draw') scaffoldBox(g, x0, y0, x1, y1, zc + colH + 4, { sides: 'LR' });
    return;
  }
  for (const [x, y] of back) column(g, x, y, zc, zc + colH, r);
  if (o.cella !== false) {
    const k = ins + 0.2;
    const frontDoor = (c, w, h) => {
      c.fillStyle = '#2a1f17';
      const dw = Math.min(10, w * 0.22);
      c.fillRect(w / 2 - dw / 2, h - colH * 0.66, dw, colH * 0.66);
      c.fillStyle = tc.main;
      c.fillRect(w / 2 - dw / 2 - 1.5, h - colH * 0.7, dw + 3, 2.4);
    };
    if (o.backWall) {
      g.box(x0 + 0.3, y0 + k - 0.08, x1 - 0.3, y0 + k + 0.05, zc, zc + colH, WALL, { ao: true });
    } else {
      g.box(x0 + k, y0 + k, x1 - k, y1 - k, zc, zc + colH, WALL, { decoR: frontDoor, decoL: o.cellaDecoL || ((c, w, h) => windowLocal(c, w * 0.5, h * 0.5, 4, 6)), ao: true });
    }
  }
  g.box(x0 + 0.05, y0 + 0.05, x1 - 0.05, y1 - 0.05, zc + colH, zt, MARBLE, {
    topMat: { col: '#cfc9b8' },
    decoL: (c, w, h) => frieze(c, tc, w, h),
    decoR: (c, w, h) => frieze(c, tc, w, h),
    ao: false,
  });
  gableRoof(g, {
    x0: x0 + 0.05, y0: y0 + 0.05, x1: x1 - 0.05, y1: y1 - 0.05, zw: zt, zr, axis: 'x', ov: 0.07, ovg: 0.05, th: 2.4,
    mat: TILE, gableMat: MARBLE, edge: TILE_EDGE, ridge: '#7a3020',
    gableDeco: (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.55, Math.min(8, h * 0.3)),
  });
  for (const [x, y] of front) column(g, x, y, zc, zc + colH, r);
  if (st === 3 && g.drawing && !o.noAcro) palmette(g, x1 + 0.02, 0, zr - 1, 1.15);
  if (st === 3 && o.extra) o.extra(g);
}

/** Frise dorique : triglyphes sombres, métopes aux couleurs de l'équipe. */
export function frieze(c, tc, w, h) {
  c.fillStyle = tc.main;
  c.fillRect(0, h * 0.28, w, h * 0.5);
  c.fillStyle = '#d9d3c3';
  for (let u = 3; u < w - 3; u += 9) {
    c.fillRect(u, h * 0.2, 4.2, h * 0.64);
    c.fillStyle = 'rgba(70,64,54,0.6)';
    c.fillRect(u + 1, h * 0.24, 0.7, h * 0.56);
    c.fillRect(u + 2.6, h * 0.24, 0.7, h * 0.56);
    c.fillStyle = '#d9d3c3';
  }
  c.fillStyle = '#b8b2a0';
  c.fillRect(0, h * 0.84, w, h * 0.16);
}

export function flankBanners(g, x, y0, y1, z) {
  banner(g, x, y0, z, 40, { w: 10, h: 15, pole: true });
  banner(g, x, y1, z, 40, { w: 10, h: 15, pole: true });
}

// ---------------------------------------------------------------------------
// Accessoires laconiens
// ---------------------------------------------------------------------------

/** Hoplon de bronze suspendu (repère local d'une face) : disque poli, liseré, lambda d'équipe. */
export function hoplonLocal(c, tc, u, v, r) {
  const gr = c.createRadialGradient(u - r * 0.35, v - r * 0.4, r * 0.1, u, v, r);
  gr.addColorStop(0, '#f6dc88');
  gr.addColorStop(0.55, '#c99a42');
  gr.addColorStop(1, '#8a6226');
  c.fillStyle = gr;
  c.beginPath();
  c.arc(u, v, r, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(60,36,12,0.7)';
  c.lineWidth = 0.7;
  c.stroke();
  c.fillStyle = tc.main;
  c.beginPath();
  c.arc(u, v, r * 0.62, 0, 2 * PI);
  c.fill();
  c.strokeStyle = LAMBDA;
  c.lineWidth = Math.max(0.9, r * 0.17);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(u - r * 0.3, v + r * 0.34);
  c.lineTo(u, v - r * 0.38);
  c.lineTo(u + r * 0.32, v + r * 0.34);
  c.stroke();
  c.lineCap = 'butt';
}

/** Olivier : tronc noueux tordu, houppier gris-vert argenté en boules superposées, quelques olives sombres. s = échelle. */
export function olive(g, x, y, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowOf([[x - 0.06, y - 0.06, 0], [x + 0.06, y + 0.06, 0], [x - 0.3 * s, y + 0.3 * s, 22 * s], [x + 0.3 * s, y - 0.3 * s, 22 * s], [x, y, 34 * s]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x * 100, y * 100, 77);
  const [px, py] = g.P(x, y, 0);
  const trunk = '#6b5844';
  const tg = c.createLinearGradient(px - 4, 0, px + 4, 0);
  tg.addColorStop(0, tone(trunk, 1.3));
  tg.addColorStop(0.5, trunk);
  tg.addColorStop(1, tone(trunk, 0.55));
  c.fillStyle = tg;
  c.beginPath();
  c.moveTo(px - 4.2 * s, py + 0.5);
  c.quadraticCurveTo(px - 1.5 * s, py - 6 * s, px - 3 * s, py - 13 * s);
  c.lineTo(px - 7 * s, py - 19 * s);
  c.lineTo(px - 4 * s, py - 19 * s);
  c.lineTo(px - 0.4 * s, py - 15 * s);
  c.lineTo(px + 2.4 * s, py - 20 * s);
  c.lineTo(px + 4.4 * s, py - 18 * s);
  c.lineTo(px + 2.4 * s, py - 12 * s);
  c.quadraticCurveTo(px + 3 * s, py - 5 * s, px + 4.6 * s, py + 0.5);
  c.closePath();
  c.fill();
  c.strokeStyle = ink(trunk, 0.6);
  c.lineWidth = 0.8;
  c.stroke();
  const blobs = [];
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 2 * PI;
    const d = Math.sqrt(rnd());
    blobs.push({ x: px + Math.cos(a) * 11 * s * d, y: py - 24 * s + Math.sin(a) * 6.5 * s * d - (1 - d) * 3, r: (6 + rnd() * 3.5) * s });
  }
  blobs.sort((a, b) => a.y - b.y);
  const greens = ['#5c7a48', '#7d9a64', '#9db684', '#c4d4a4'];
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
    c.strokeStyle = 'rgba(30,50,25,0.35)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.arc(b.x, b.y, b.r, PI * 0.15, PI * 0.95);
    c.stroke();
  }
  c.fillStyle = '#3a3a2a';
  for (let k = 0; k < 5; k++) {
    const b = blobs[(rnd() * blobs.length) | 0];
    c.fillRect(b.x + (rnd() - 0.5) * b.r, b.y + b.r * 0.3, 1.3, 1.6);
  }
}

/** Trépied de bronze (offrande) : trois pieds à sabots, cuve et flamme. */
export function tripod(g, x, y, z = 0, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z, z + 16 * s, 0.05);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.strokeStyle = '#6a4a1c';
  c.lineWidth = 2.2 * s;
  c.beginPath();
  for (const dx of [-4.5, 4.5]) {
    c.moveTo(px + dx * s, py);
    c.lineTo(px + dx * 0.4 * s, py - 11 * s);
  }
  c.stroke();
  c.strokeStyle = '#d8aa48';
  c.lineWidth = 1.2 * s;
  c.beginPath();
  for (const dx of [-4.5, 0, 4.5]) {
    c.moveTo(px + dx * s, py);
    c.lineTo(px + dx * 0.4 * s, py - 11 * s);
  }
  c.stroke();
  const gr = c.createLinearGradient(px - 5 * s, 0, px + 5 * s, 0);
  gr.addColorStop(0, '#f0cc66');
  gr.addColorStop(0.6, '#c79a3c');
  gr.addColorStop(1, '#7c5a20');
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(px - 5.6 * s, py - 12 * s);
  c.quadraticCurveTo(px - 4 * s, py - 7.5 * s, px, py - 7.5 * s);
  c.quadraticCurveTo(px + 4 * s, py - 7.5 * s, px + 5.6 * s, py - 12 * s);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(60,36,10,0.8)';
  c.lineWidth = 0.7;
  c.stroke();
  const fl = c.createRadialGradient(px, py - 15 * s, 0, px, py - 15 * s, 6 * s);
  fl.addColorStop(0, 'rgba(255,245,170,0.95)');
  fl.addColorStop(0.5, 'rgba(255,150,40,0.85)');
  fl.addColorStop(1, 'rgba(255,90,20,0)');
  c.fillStyle = fl;
  c.beginPath();
  c.moveTo(px - 3.6 * s, py - 12 * s);
  c.quadraticCurveTo(px - 3.6 * s, py - 18 * s, px, py - 22 * s);
  c.quadraticCurveTo(px + 3.6 * s, py - 18 * s, px + 3.6 * s, py - 12 * s);
  c.closePath();
  c.fill();
}

/** Statue d'hoplite sur plinthe (bronze patiné) : casque à cimier, lance, hoplon. h = hauteur totale (px). */
export function statue(g, x, y, z = 0, h = 40, o = {}) {
  const ped = h * 0.3;
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.13, y - 0.13, x + 0.13, y + 0.13, z, z + h);
    return;
  }
  if (!g.drawing) return;
  g.box(x - 0.14, y - 0.14, x + 0.14, y + 0.14, z, z + ped, MARBLE, { topMat: STYL, ao: false, quick: true });
  const c = g.ctx;
  const [px, py] = g.P(x, y, z + ped);
  const k = (h - ped) / 26;
  const bz = o.col || '#6f9a82';
  c.save();
  c.translate(px, py);
  c.scale(k, k);
  // jambes, tunique, torse, bras
  c.fillStyle = tone(bz, 0.72);
  c.fillRect(-3.4, -8, 2.6, 8);
  c.fillRect(0.6, -8, 2.6, 8);
  c.fillStyle = bz;
  c.beginPath();
  c.moveTo(-4.6, -8);
  c.lineTo(-4, -17);
  c.lineTo(4, -17);
  c.lineTo(4.6, -8);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(20,50,40,0.6)';
  c.lineWidth = 0.6;
  c.stroke();
  // lance levée
  c.strokeStyle = tone(bz, 0.6);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(5.4, -2);
  c.lineTo(5.4, -30);
  c.stroke();
  // hoplon
  const gr = c.createRadialGradient(-3, -13, 1, -2, -12, 6.5);
  gr.addColorStop(0, tone(bz, 1.5));
  gr.addColorStop(1, tone(bz, 0.75));
  c.fillStyle = gr;
  c.beginPath();
  c.arc(-2.6, -12, 6.2, 0, 2 * PI);
  c.fill();
  c.stroke();
  // tête, casque et cimier
  c.fillStyle = tone(bz, 1.15);
  c.beginPath();
  c.arc(0, -20.5, 3.3, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = tone(bz, 0.85);
  c.beginPath();
  c.moveTo(-2.6, -22);
  c.quadraticCurveTo(0, -30, 3.2, -22);
  c.closePath();
  c.fill();
  c.restore();
}

/** Acrotère : palmette de terre cuite au sommet d'un fronton (x, y au sol, z = hauteur de base). */
export function palmette(g, x, y, z, s = 1) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.fillStyle = '#c4683e';
  c.strokeStyle = 'rgba(80,30,14,0.8)';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(px - 3 * s, py);
  c.quadraticCurveTo(px - 4.6 * s, py - 6 * s, px, py - 9 * s);
  c.quadraticCurveTo(px + 4.6 * s, py - 6 * s, px + 3 * s, py);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(px, py - 4.4 * s, 1.1 * s, 0, 2 * PI);
  c.fill();
}

void [stick, scaffoldBox, doorLocal, windowLocal];
