// Outils communs aux bâtiments « civiques » (port, marché, académie, merveille) : murs polygonaux,
// toits à facettes, auvents rayés aux couleurs d'équipe, coque de barque sur chevalet, filets,
// amphores, balance, chaudron, pupitres, cordages et guirlandes de fanions.
// Tout respecte le mode du peintre g (plan / ombre / peinture) ; les petits objets n'ont pas d'ombre propre.

import { MAT, K_LEFT, K_RIGHT, RX, RY, tone, rgba, ink } from './building-gfx.js';
import { WOOD, WOOD_DARK, WOOD_LIGHT, INTERIOR, stick } from './building-parts.js';
import { GOLD, BRONZE } from './building-props.js';

const PI = Math.PI;

/** Éclairage (0 = face +x sombre, 1 = face +y claire) d'une normale horizontale (nx, ny). */
export const lit = (nx, ny) => Math.max(0, Math.min(1, 0.5 + (ny - nx) * 0.5));
export const kOf = (nx, ny) => K_RIGHT + (K_LEFT - K_RIGHT) * lit(nx, ny);

/**
 * Mur vertical quelconque entre deux points du sol a → b (monde), de z0 à z1, vu de l'extérieur.
 * La normale sortante est (dy, −dx) : parcourir le contour dans le sens des angles croissants.
 */
export function wallQuad(g, a, b, z0, z1, mat, o = {}) {
  if (!g.drawing || z1 <= z0 + 0.01) return;
  let nx = b[1] - a[1];
  let ny = -(b[0] - a[0]);
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl;
  ny /= nl;
  let A = a;
  let B = b;
  let pa = g.P(A[0], A[1], z1);
  let pb = g.P(B[0], B[1], z1);
  if (pb[0] < pa[0]) {
    A = b;
    B = a;
    pa = g.P(A[0], A[1], z1);
    pb = g.P(B[0], B[1], z1);
  }
  const lu = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
  if (lu < 0.5) return;
  const U = [(pb[0] - pa[0]) / lu, (pb[1] - pa[1]) / lu];
  const k = o.k ?? kOf(nx, ny);
  g.plane(pa, U, [0, 1], lu, z1 - z0, mat, k, { ao: o.ao, eave: o.eave, deco: o.deco });
  if (o.line !== false) g.outline([pa, pb, g.P(B[0], B[1], z0), g.P(A[0], A[1], z0)], tone(mat.col, k));
}

/** Sommets d'un octogone régulier (rayon R au sommet) : côtés orientés vers +x, +x+y, +y… */
export function octPts(cx, cy, R, n = 8) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = PI / n + (i * 2 * PI) / n;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return pts;
}

/** Murs d'un prisme octogonal (les côtés visibles). deco(i) renvoie le décor local du côté i ou null. */
export function octWalls(g, cx, cy, R, z0, z1, mat, o = {}) {
  const pts = octPts(cx, cy, R);
  if (g.mode === 'shadow') {
    g.shadowOf(pts.flatMap((p) => [[p[0], p[1], z0], [p[0], p[1], z1]]));
    return;
  }
  if (!g.drawing) return;
  for (let i = 0; i < 8; i++) {
    const na = ((i + 1) * PI) / 4;
    if (Math.cos(na) + Math.sin(na) < 0.05) continue;
    wallQuad(g, pts[i], pts[(i + 1) % 8], z0, z1, mat, { deco: o.deco ? o.deco(i) : null, eave: o.eave, ao: o.ao });
  }
  if (o.top !== false) {
    g.fillPoly(pts.map((p) => g.P(p[0], p[1], z1)), o.topCol || tone(mat.col, 1.02));
  }
}

/** Anneau octogonal (corniche) : petit débord de pierre. */
export function octRing(g, cx, cy, R, z0, z1, mat, o = {}) {
  octWalls(g, cx, cy, R, z0, z1, mat, { ...o, ao: false });
}

export const DOME_RINGS = [[1.0, 0], [0.9, 0.24], [0.68, 0.55], [0.4, 0.8], [0.14, 0.95], [0, 1]];

/** Toit octogonal à facettes bombées (coupole dorée). */
export function octDome(g, cx, cy, z0, R, H, col, o = {}) {
  const base = octPts(cx, cy, R);
  if (g.mode === 'shadow') {
    g.shadowOf([...base.map((p) => [p[0], p[1], z0]), [cx, cy, z0 + H]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const ring = (j, i) => {
    const [f, hh] = DOME_RINGS[j];
    const a = PI / 8 + (i * PI) / 4;
    return g.P(cx + R * f * Math.cos(a), cy + R * f * Math.sin(a), z0 + H * hh);
  };
  const order = [];
  for (let i = 0; i < 8; i++) order.push({ i, d: Math.cos(((i + 1) * PI) / 4) + Math.sin(((i + 1) * PI) / 4) });
  order.sort((p, q) => p.d - q.d);
  for (const { i } of order) {
    const na = ((i + 1) * PI) / 4;
    const L = lit(Math.cos(na), Math.sin(na));
    for (let j = 0; j < DOME_RINGS.length - 1; j++) {
      const p0 = ring(j, i);
      const p1 = ring(j, (i + 1) % 8);
      const p2 = ring(j + 1, (i + 1) % 8);
      const p3 = ring(j + 1, i);
      const k = 0.62 + 0.55 * L + (j === 1 ? 0.08 : 0) + (o.shine ? 0.05 * j : 0);
      g.fillPoly([p0, p1, p2, p3], tone(col, k), false);
    }
    // reflet sur l'arête gauche et nervure
    const b0 = ring(0, i);
    const t0 = ring(DOME_RINGS.length - 1, i);
    c.strokeStyle = rgba(tone(col, 1.35), 0.5 * (0.4 + L));
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(b0[0], b0[1]);
    for (let j = 1; j < DOME_RINGS.length; j++) {
      const p = ring(j, i);
      c.lineTo(p[0], p[1]);
    }
    c.stroke();
    void t0;
  }
  // joints de facettes
  c.strokeStyle = rgba(tone(col, 0.42), 0.55);
  c.lineWidth = 0.8;
  for (let j = 1; j < DOME_RINGS.length - 1; j++) {
    c.beginPath();
    for (let i = 0; i <= 8; i++) {
      const p = ring(j, i % 8);
      if (i) c.lineTo(p[0], p[1]);
      else c.moveTo(p[0], p[1]);
    }
    c.stroke();
  }
  // liseré du bas
  c.strokeStyle = ink(col, 0.7);
  c.lineWidth = 1.1;
  c.beginPath();
  for (let i = 0; i <= 8; i++) {
    const p = ring(0, i % 8);
    if (i) c.lineTo(p[0], p[1]);
    else c.moveTo(p[0], p[1]);
  }
  c.stroke();
}

/** Croix d'or (ou globe et croix) sur pointe, dessinée à l'écran. */
export function crossTop(g, x, y, z, s = 1, col = GOLD) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.fillStyle = col;
  c.strokeStyle = tone(col, 0.5);
  c.lineWidth = 0.7;
  c.beginPath();
  c.arc(px, py - 2 * s, 2.3 * s, 0, 2 * PI);
  c.fill();
  c.stroke();
  stick(c, px, py - 3 * s, px, py - 14 * s, col, 1.5 * s);
  stick(c, px - 3.6 * s, py - 10 * s, px + 3.6 * s, py - 10 * s, col, 1.4 * s);
}

// ---------------------------------------------------------------------------
// Tissus et auvents
// ---------------------------------------------------------------------------

/** Matériau de toile rayée (bandes d'équipe / écru) ; les rayures suivent la pente. */
export function stripeMat(tc, o = {}) {
  const sw = o.sw ?? 6;
  const a = o.a || tc.main;
  const b = o.b || '#efe5c8';
  return {
    col: b,
    tex(c, w, h) {
      c.fillStyle = b;
      c.fillRect(-2, -2, w + 4, h + 4);
      c.fillStyle = a;
      let i = 0;
      for (let u = 0; u < w; u += sw, i++) if (i % 2 === 0) c.fillRect(u, -2, Math.min(sw, w - u), h + 4);
      // plis
      c.fillStyle = 'rgba(0,0,0,0.13)';
      for (let u = sw * 0.5; u < w; u += sw * 2) c.fillRect(u, -2, 0.7, h + 4);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      for (let u = 1; u < w; u += sw) c.fillRect(u, -2, 0.7, h + 4);
      // volant festonné
      const vh = Math.min(4.5, h * 0.3);
      i = 0;
      for (let u = 0; u < w; u += sw, i++) {
        c.fillStyle = i % 2 ? b : a;
        c.beginPath();
        c.moveTo(u, h - vh);
        c.lineTo(u + sw, h - vh);
        c.arc(u + sw / 2, h - vh, sw / 2, 0, PI);
        c.closePath();
        c.fill();
      }
      c.fillStyle = 'rgba(40,20,10,0.25)';
      c.fillRect(-1, h - vh - 0.5, w + 2, 0.8);
    },
  };
}

/** Auvent en appentis. dir 'y' : pente vers +y (pan éclairé) ; 'x' : vers +x (pan sombre). */
export function awning(g, o) {
  const { x0, y0, x1, y1, zHigh, zLow } = o;
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowOf([[x0, y0, zHigh], [x1, y0, zHigh], [x0, y1, zLow], [x1, y1, zLow]]);
    return;
  }
  const mat = o.mat || stripeMat(g.tc, o);
  const partial = g.stage === 2 && o.partial;
  if ((o.dir || 'y') === 'y') {
    g.slope([x0, y0, zHigh], [x1, y0, zHigh], [x0, y1, zLow], mat, 0.97, { deco: partial ? partialCloth() : null });
    g.outline([g.P(x0, y0, zHigh), g.P(x1, y0, zHigh), g.P(x1, y1, zLow), g.P(x0, y1, zLow)], tone('#8a7a5a', 0.9));
  } else {
    g.slope([x0, y1, zHigh], [x0, y0, zHigh], [x1, y1, zLow], mat, 0.76, { deco: partial ? partialCloth() : null });
    g.outline([g.P(x0, y1, zHigh), g.P(x0, y0, zHigh), g.P(x1, y0, zLow), g.P(x1, y1, zLow)], tone('#8a7a5a', 0.72));
  }
}

function partialCloth() {
  return (c, w, h) => {
    c.fillStyle = INTERIOR;
    c.fillRect(-2, -2, w + 4, h * 0.55 + 2);
    c.strokeStyle = '#a07a50';
    c.lineWidth = 1.4;
    for (let u = 3; u < w; u += 9) {
      c.beginPath();
      c.moveTo(u, 0);
      c.lineTo(u, h * 0.55);
      c.stroke();
    }
  };
}

// ---------------------------------------------------------------------------
// Cordages
// ---------------------------------------------------------------------------

/** Corde (courbe pendante) entre deux points 3D. */
export function rope(g, a, b, sag = 4, o = {}) {
  if (!g.drawing) return;
  const c = g.ctx;
  const p = g.P(a[0], a[1], a[2]);
  const q = g.P(b[0], b[1], b[2]);
  c.strokeStyle = o.shade || 'rgba(60,40,20,0.55)';
  c.lineWidth = (o.w ?? 1.3) + 0.8;
  c.beginPath();
  c.moveTo(p[0], p[1]);
  c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + sag, q[0], q[1]);
  c.stroke();
  c.strokeStyle = o.col || '#d8c9a0';
  c.lineWidth = o.w ?? 1.3;
  c.stroke();
}

/** Guirlande de fanions aux couleurs d'équipe entre deux points 3D. */
export function bunting(g, a, b, n = 6, sag = 5, o = {}) {
  if (!g.drawing) return;
  const c = g.ctx;
  const p = g.P(a[0], a[1], a[2]);
  const q = g.P(b[0], b[1], b[2]);
  const at = (t) => {
    const x = p[0] + (q[0] - p[0]) * t;
    const y = p[1] + (q[1] - p[1]) * t + 4 * sag * t * (1 - t) * 0.5 * 2;
    return [x, y];
  };
  c.strokeStyle = 'rgba(70,45,20,0.8)';
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i <= 20; i++) {
    const [x, y] = at(i / 20);
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.stroke();
  const tc = g.tc;
  for (let i = 0; i < n; i++) {
    const [x, y] = at((i + 0.5) / n);
    const col = i % 2 ? (o.alt || tc.light) : tc.main;
    c.fillStyle = col;
    c.strokeStyle = rgba(tc.dark, 0.7);
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x - 2.6, y);
    c.lineTo(x + 2.6, y);
    c.lineTo(x, y + 6);
    c.closePath();
    c.fill();
    c.stroke();
  }
}

// ---------------------------------------------------------------------------
// Objets du quotidien
// ---------------------------------------------------------------------------

/** Amphore (dessinée à l'écran) : panse ventrue, col, deux anses. */
export function amphora(g, x, y, z = 0, s = 1, col = '#b9723e') {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.07 * s, z, z + 13 * s);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py);
  c.scale(s, s);
  c.beginPath();
  c.moveTo(-1.6, -13);
  c.bezierCurveTo(-1.8, -11, -5.4, -9.5, -5, -5);
  c.bezierCurveTo(-4.6, -1.5, -2, 0.4, 0, 0.6);
  c.bezierCurveTo(2, 0.4, 4.6, -1.5, 5, -5);
  c.bezierCurveTo(5.4, -9.5, 1.8, -11, 1.6, -13);
  c.closePath();
  const gr = c.createLinearGradient(-5, 0, 5, 0);
  gr.addColorStop(0, tone(col, 1.25));
  gr.addColorStop(0.4, col);
  gr.addColorStop(1, tone(col, 0.55));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = ink(col, 0.7);
  c.lineWidth = 0.8;
  c.stroke();
  // bandeau peint
  c.strokeStyle = 'rgba(60,25,10,0.55)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(0, -6.5, 4.9, 1.3, 0, 0.1, PI - 0.1);
  c.stroke();
  // lèvre et anses
  c.fillStyle = tone(col, 0.7);
  c.fillRect(-3, -14.6, 6, 2);
  c.strokeStyle = ink(col, 0.7);
  c.lineWidth = 0.6;
  c.strokeRect(-3, -14.6, 6, 2);
  c.strokeStyle = tone(col, 0.65);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-1.6, -12.5);
  c.quadraticCurveTo(-5.2, -13, -4.4, -8.8);
  c.moveTo(1.6, -12.5);
  c.quadraticCurveTo(5.2, -13, 4.4, -8.8);
  c.stroke();
  c.restore();
}

/** Petit poisson argenté (à l'écran). */
function fish(c, x, y, a, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.scale(s, s);
  c.fillStyle = '#c9d6df';
  c.strokeStyle = 'rgba(40,60,80,0.7)';
  c.lineWidth = 0.5;
  c.beginPath();
  c.ellipse(0, 0, 3.4, 1.3, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = '#8fa6b8';
  c.beginPath();
  c.moveTo(-3, 0);
  c.lineTo(-5, -1.6);
  c.lineTo(-5, 1.6);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fillRect(-1.6, -0.9, 2.6, 0.5);
  c.fillStyle = '#243040';
  c.fillRect(1.8, -0.5, 0.7, 0.7);
  c.restore();
}

/** Caisse de poissons : caisse basse, tas d'argent visible dessus. */
export function fishCrate(g, x, y, z = 0, s = 0.16) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - s, y - s * 0.8, x + s, y + s * 0.8, z, z + 6);
    return;
  }
  if (!g.drawing) return;
  const brace = (c, w, h) => {
    c.strokeStyle = 'rgba(60,35,15,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, h * 0.5);
    c.lineTo(w, h * 0.5);
    c.stroke();
  };
  g.box(x - s, y - s * 0.8, x + s, y + s * 0.8, z, z + 6, { col: '#a77b4c' }, { ao: false, quick: false, decoL: brace, decoR: brace, topMat: { col: '#5a4030' } });
  const c = g.ctx;
  const [px, py] = g.P(x, y, z + 6);
  const rnd = g.rng(x * 7, y * 5, 3);
  for (let i = 0; i < 5; i++) fish(c, px + (rnd() - 0.5) * 12, py + (rnd() - 0.5) * 4, (rnd() - 0.5) * 1.4, 0.85);
}

/** Bitte d'amarrage : petit fût de bois sombre avec tour de corde. */
export function bollard(g, x, y, z = 0) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  const gr = c.createLinearGradient(px - 2.6, 0, px + 2.6, 0);
  gr.addColorStop(0, '#8a6a48');
  gr.addColorStop(0.5, '#5e4530');
  gr.addColorStop(1, '#382818');
  c.fillStyle = gr;
  c.fillRect(px - 2.4, py - 6, 4.8, 6);
  c.fillStyle = '#7a5c3c';
  c.beginPath();
  c.ellipse(px, py - 6, 3.1, 1.6, 0, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(30,18,8,0.7)';
  c.lineWidth = 0.7;
  c.stroke();
  c.strokeStyle = '#d8c9a0';
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(px, py - 3.4, 2.7, 1.1, 0, 0, PI);
  c.ellipse(px, py - 2.2, 2.7, 1.1, 0, 0, PI);
  c.stroke();
}

/** Étendoir à filets : deux perches, traverse, filet maillé qui sèche, flotteurs. */
export function netRack(g, a, b, z0 = 0, h = 36, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(a[0], a[1], z0, z0 + h, 0.03);
    g.shadowPole(b[0], b[1], z0, z0 + h, 0.03);
    g.shadowOf([[a[0], a[1], z0 + h], [b[0], b[1], z0 + h], [a[0], a[1], z0 + h - 20], [b[0], b[1], z0 + h - 20]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const back = a[0] + a[1] > b[0] + b[1] ? b : a;
  const front = back === a ? b : a;
  g.post(back[0], back[1], z0, z0 + h, WOOD, 2.6);
  const pa = g.P(a[0], a[1], z0 + h - 2);
  const pb = g.P(b[0], b[1], z0 + h - 2);
  const drop = o.drop ?? 20;
  // filet : polygone à bas festonné
  c.save();
  c.beginPath();
  c.moveTo(pa[0], pa[1]);
  c.lineTo(pb[0], pb[1]);
  const n = 8;
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const x = pa[0] + (pb[0] - pa[0]) * t;
    const y = pa[1] + (pb[1] - pa[1]) * t + drop * (0.75 + 0.25 * Math.sin(t * 9 + (o.seed || 0))) - 4 * Math.sin(t * PI) * 0;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = 'rgba(190,170,120,0.22)';
  c.fill();
  c.clip();
  c.strokeStyle = 'rgba(214,196,150,0.85)';
  c.lineWidth = 0.7;
  c.beginPath();
  const minX = Math.min(pa[0], pb[0]) - 4;
  const maxX = Math.max(pa[0], pb[0]) + 4;
  const minY = Math.min(pa[1], pb[1]) - 2;
  const maxY = Math.max(pa[1], pb[1]) + drop + 4;
  for (let x = minX - (maxY - minY); x < maxX; x += 3.6) {
    c.moveTo(x, minY);
    c.lineTo(x + (maxY - minY), maxY);
    c.moveTo(x + (maxY - minY), minY);
    c.lineTo(x, maxY);
  }
  c.stroke();
  c.restore();
  c.strokeStyle = 'rgba(80,55,30,0.7)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(pa[0], pa[1]);
  c.lineTo(pb[0], pb[1]);
  c.stroke();
  // flotteurs de liège au bas
  c.fillStyle = '#c99a5c';
  for (let i = 1; i < n; i += 2) {
    const t = i / n;
    c.beginPath();
    c.arc(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t + drop * (0.75 + 0.25 * Math.sin(t * 9 + (o.seed || 0))), 1.5, 0, 2 * PI);
    c.fill();
  }
  g.post(front[0], front[1], z0, z0 + h, tone(WOOD, 1.05), 2.8);
}

/**
 * Coque de barque retournée sur deux tréteaux (quille en l'air), le long de x ou de y.
 * civ 'franks' : bordé à clins ; 'gauls' : planches jointes et cerclage d'osier. Bande aux couleurs d'équipe.
 */
export function boatHull(g, x, y, z0, axis, L, o = {}) {
  const d = axis === 'x' ? [1, 0] : [0, 1];
  const a = [x - (d[0] * L) / 2, y - (d[1] * L) / 2];
  const b = [x + (d[0] * L) / 2, y + (d[1] * L) / 2];
  if (g.mode === 'shadow') {
    g.shadowOf([[a[0], a[1], z0], [b[0], b[1], z0], [a[0], a[1], z0 + 12], [b[0], b[1], z0 + 12]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const franks = g.civ === 'franks';
  // tréteaux
  for (const t of [0.24, 0.76]) {
    const cx = a[0] + (b[0] - a[0]) * t;
    const cy = a[1] + (b[1] - a[1]) * t;
    const perp = axis === 'x' ? [0, 1] : [1, 0];
    for (const s of [-1, 1]) {
      const [gx, gy] = g.P(cx + perp[0] * 0.13 * s, cy + perp[1] * 0.13 * s, z0);
      const [tx, ty] = g.P(cx, cy, z0 + 5);
      stick(c, gx, gy, tx, ty, WOOD_DARK, 1.8);
    }
  }
  const A = g.P(a[0], a[1], z0 + 5);
  const B = g.P(b[0], b[1], z0 + 5);
  const N = 18;
  const top = [];
  const bot = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const s = Math.sin(PI * t);
    const bx = A[0] + (B[0] - A[0]) * t;
    const by = A[1] + (B[1] - A[1]) * t;
    top.push([bx, by - 9.5 * Math.pow(s, 0.6) - 1.5 * s]);
    bot.push([bx, by + 3.2 * Math.pow(s, 0.8)]);
  }
  const col = o.col || (franks ? '#8a6a48' : '#94703f');
  const path = () => {
    c.beginPath();
    top.forEach(([x2, y2], i) => (i ? c.lineTo(x2, y2) : c.moveTo(x2, y2)));
    for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
    c.closePath();
  };
  path();
  const gr = c.createLinearGradient(0, Math.min(...top.map((p) => p[1])), 0, Math.max(...bot.map((p) => p[1])));
  gr.addColorStop(0, tone(col, 1.3));
  gr.addColorStop(0.5, col);
  gr.addColorStop(1, tone(col, 0.55));
  c.fillStyle = gr;
  c.fill();
  c.save();
  path();
  c.clip();
  const lineAt = (u) => {
    c.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = [top[i][0] + (bot[i][0] - top[i][0]) * u, top[i][1] + (bot[i][1] - top[i][1]) * u];
      if (i) c.lineTo(p[0], p[1]);
      else c.moveTo(p[0], p[1]);
    }
    c.stroke();
  };
  // bande d'équipe le long du plat-bord
  c.fillStyle = g.tc.main;
  c.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = [top[i][0] + (bot[i][0] - top[i][0]) * 0.66, top[i][1] + (bot[i][1] - top[i][1]) * 0.66];
    if (i) c.lineTo(p[0], p[1]);
    else c.moveTo(p[0], p[1]);
  }
  for (let i = N; i >= 0; i--) {
    c.lineTo(top[i][0] + (bot[i][0] - top[i][0]) * 0.86, top[i][1] + (bot[i][1] - top[i][1]) * 0.86);
  }
  c.closePath();
  c.fill();
  if (franks) {
    // clins : recouvrements
    for (const u of [0.18, 0.36, 0.54, 0.66, 0.86]) {
      c.strokeStyle = 'rgba(30,15,5,0.55)';
      c.lineWidth = 1;
      lineAt(u);
      c.strokeStyle = 'rgba(255,230,190,0.28)';
      c.lineWidth = 0.7;
      c.save();
      c.translate(0, 0.9);
      lineAt(u);
      c.restore();
    }
  } else {
    for (const u of [0.3, 0.66, 0.86]) {
      c.strokeStyle = 'rgba(30,15,5,0.5)';
      c.lineWidth = 0.9;
      lineAt(u);
    }
    // membrures et cerclage d'osier
    c.strokeStyle = 'rgba(30,15,5,0.4)';
    c.lineWidth = 0.9;
    for (let i = 2; i < N - 1; i += 2) {
      c.beginPath();
      c.moveTo(top[i][0], top[i][1]);
      c.lineTo(bot[i][0], bot[i][1]);
      c.stroke();
    }
  }
  // quille (arête haute)
  c.strokeStyle = 'rgba(255,240,210,0.5)';
  c.lineWidth = 1;
  c.beginPath();
  top.forEach(([x2, y2], i) => (i ? c.lineTo(x2, y2 + 0.8) : c.moveTo(x2, y2 + 0.8)));
  c.stroke();
  c.restore();
  path();
  c.strokeStyle = ink(col, 0.75);
  c.lineWidth = 1;
  c.stroke();
  c.strokeStyle = tone(col, 0.5);
  c.lineWidth = 2;
  c.beginPath();
  top.forEach(([x2, y2], i) => (i ? c.lineTo(x2, y2 - 0.4) : c.moveTo(x2, y2 - 0.4)));
  c.stroke();
  // étraves relevées
  for (const [p, sgn] of [[A, -1], [B, 1]]) {
    stick(c, p[0], p[1] - 1, p[0] + sgn * 2.5, p[1] - 7.5, tone(col, 0.8), 2);
  }
}

/** Grand chaudron de fer sur trépied, bouillon brun et lueur. */
export function cauldron(g, x, y, z = 0, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.16 * s, z, z + 14 * s);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  for (const dx of [-6, 0, 6]) stick(c, px + dx * s, py + 1, px + dx * 0.2 * s, py - 13 * s, '#3a2a1c', 1.3);
  c.save();
  c.translate(px, py - 6 * s);
  c.scale(s, s);
  const gr = c.createLinearGradient(-8, 0, 8, 0);
  gr.addColorStop(0, '#6b7078');
  gr.addColorStop(0.45, '#3a3e46');
  gr.addColorStop(1, '#16181d');
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(-8, -5);
  c.bezierCurveTo(-9.5, 2, -5, 7, 0, 7);
  c.bezierCurveTo(5, 7, 9.5, 2, 8, -5);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.75)';
  c.lineWidth = 0.9;
  c.stroke();
  c.fillStyle = '#5a5e66';
  c.beginPath();
  c.ellipse(0, -5, 8.2, 2.6, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillStyle = '#7a4a26';
  c.beginPath();
  c.ellipse(0, -5, 6.9, 1.9, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(255,190,90,0.5)';
  c.beginPath();
  c.ellipse(-1.5, -5.3, 3.2, 0.8, 0, 0, 2 * PI);
  c.fill();
  c.restore();
}

/** Balance géante : socle de pierre, fût, fléau, chaînes et deux plateaux (pièces d'or / sacs). */
export function bigScale(g, x, y, o = {}) {
  const zt = o.h ?? 54;
  const d = o.arm ?? 0.44;
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.2, y - 0.2, x + 0.2, y + 0.2, 0, 6);
    g.shadowPole(x, y, 6, zt, 0.04);
    g.shadowOf([[x - d, y + d, zt], [x + d, y - d, zt], [x - d, y + d, zt - 20], [x + d, y - d, zt - 20]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.box(x - 0.22, y - 0.22, x + 0.22, y + 0.22, 0, 7, MAT.stoneLight, { ao: false, topMat: MAT.stone });
  g.box(x - 0.13, y - 0.13, x + 0.13, y + 0.13, 7, 11, MAT.stone, { ao: false });
  g.post(x, y, 11, zt, '#6a4a2c', 4.4);
  const L = g.P(x - d, y + d, zt - 1.5);
  const R = g.P(x + d, y - d, zt + 1.5);
  stick(c, L[0], L[1], R[0], R[1], '#7a5634', 2.6);
  const [tx, ty] = g.P(x, y, zt);
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(tx, ty - 1, 2.4, 0, 2 * PI);
  c.fill();
  c.strokeStyle = tone(GOLD, 0.5);
  c.lineWidth = 0.7;
  c.stroke();
  for (const [P, coin, dz] of [[L, true, 21], [R, false, 19]]) {
    const py = P[1] + dz;
    c.strokeStyle = 'rgba(70,50,25,0.85)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(P[0], P[1]);
    c.lineTo(P[0] - 7, py - 1);
    c.moveTo(P[0], P[1]);
    c.lineTo(P[0] + 7, py - 1);
    c.moveTo(P[0], P[1]);
    c.lineTo(P[0], py - 4);
    c.stroke();
    // plateau
    c.fillStyle = '#b9873c';
    c.beginPath();
    c.ellipse(P[0], py, 8.5, 2.9, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(60,35,10,0.8)';
    c.stroke();
    c.fillStyle = '#e4b95a';
    c.beginPath();
    c.ellipse(P[0], py - 0.6, 7.4, 2.2, 0, 0, 2 * PI);
    c.fill();
    if (coin) {
      for (let i = 0; i < 9; i++) {
        c.fillStyle = i % 2 ? '#f6d766' : '#e0a92e';
        c.beginPath();
        c.ellipse(P[0] - 5 + i * 1.3, py - 1.5 - (i % 3) * 1.3, 1.9, 1.2, 0, 0, 2 * PI);
        c.fill();
        c.strokeStyle = 'rgba(90,55,10,0.6)';
        c.lineWidth = 0.4;
        c.stroke();
      }
    } else {
      c.fillStyle = '#d8c49a';
      c.beginPath();
      c.ellipse(P[0] - 1, py - 3.8, 4.4, 3.6, 0, 0, 2 * PI);
      c.fill();
      c.strokeStyle = 'rgba(80,60,30,0.7)';
      c.lineWidth = 0.7;
      c.stroke();
      c.fillStyle = '#9a9488';
      c.beginPath();
      c.arc(P[0] + 4, py - 2.8, 2.2, 0, 2 * PI);
      c.fill();
      c.stroke();
    }
  }
}

/** Petit tas de pièces d'or posé à (px, py) écran. */
export function coinsAt(c, px, py, n = 6, s = 1) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = i % 2 ? '#f6d766' : '#e0a92e';
    c.beginPath();
    c.ellipse(px + ((i * 5) % 7 - 3) * 0.7 * s, py - (i % 3) * 1.2 * s, 2 * s, 1.2 * s, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(90,55,10,0.55)';
    c.lineWidth = 0.4;
    c.stroke();
  }
}

/** Pupitre incliné avec livre ouvert (dessiné à l'écran). */
export function lectern(g, x, y, z = 0, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.1, y - 0.1, x + 0.1, y + 0.1, z, z + 15 * s);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py);
  c.scale(s, s);
  stick(c, -3, 0, -3, -10, '#6a4a2c', 2);
  stick(c, 3, 0, 3, -10, '#6a4a2c', 2);
  stick(c, -5, 0, 5, 0, '#5a3a20', 1.4);
  // plan incliné
  c.fillStyle = '#8a6440';
  c.beginPath();
  c.moveTo(-8, -10);
  c.lineTo(8, -10);
  c.lineTo(6.5, -16);
  c.lineTo(-6.5, -16);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(40,20,5,0.75)';
  c.lineWidth = 0.8;
  c.stroke();
  // livre ouvert
  c.fillStyle = '#efe4c6';
  c.beginPath();
  c.moveTo(-6, -11);
  c.lineTo(0, -11.6);
  c.lineTo(0, -16.6);
  c.lineTo(-5.2, -15.8);
  c.closePath();
  c.moveTo(6, -11);
  c.lineTo(0, -11.6);
  c.lineTo(0, -16.6);
  c.lineTo(5.2, -15.8);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(70,45,20,0.6)';
  c.lineWidth = 0.5;
  c.stroke();
  c.strokeStyle = 'rgba(60,40,30,0.55)';
  c.beginPath();
  for (const q of [-13.2, -14.6]) {
    c.moveTo(-4.6, q + 0.4);
    c.lineTo(-0.8, q);
    c.moveTo(0.8, q);
    c.lineTo(4.6, q + 0.4);
  }
  c.stroke();
  c.fillStyle = g.tc.main;
  c.fillRect(-0.4, -16.8, 0.8, 5.4);
  c.restore();
}

/** Enseigne suspendue à une potence : écu aux couleurs d'équipe portant un grand rouleau et une plume. */
export function scrollSign(g, x, y, z, s = 1) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py);
  c.scale(s, s);
  c.translate(-px, -py);
  // potence
  stick(c, px - 15, py - 3, px + 8, py - 3, '#2f2a26', 1.6);
  stick(c, px - 12, py - 3, px - 5, py + 4, '#2f2a26', 1.2);
  stick(c, px - 8, py - 2, px - 8, py + 2, '#2f2a26', 1);
  stick(c, px + 5, py - 2, px + 5, py + 2, '#2f2a26', 1);
  // panneau
  const w = 26;
  const h = 26;
  const x0 = px - 8 - w / 2 + 8;
  const y0 = py + 2;
  c.fillStyle = '#5a4128';
  c.fillRect(x0 - 1.5, y0 - 1.5, w + 3, h + 3);
  const gr = c.createLinearGradient(x0, 0, x0 + w, 0);
  gr.addColorStop(0, tone(g.tc.main, 1.12));
  gr.addColorStop(1, tone(g.tc.main, 0.8));
  c.fillStyle = gr;
  c.fillRect(x0, y0, w, h);
  c.strokeStyle = GOLD;
  c.lineWidth = 1;
  c.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
  // rouleau de parchemin
  const cx = x0 + w / 2;
  const cy = y0 + h / 2 + 1;
  c.fillStyle = '#f1e6c8';
  c.strokeStyle = 'rgba(80,55,25,0.85)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.rect(cx - 8, cy - 4.5, 16, 9);
  c.fill();
  c.stroke();
  c.fillStyle = '#d8c79c';
  for (const dx of [-8, 8]) {
    c.beginPath();
    c.ellipse(cx + dx, cy, 2.2, 5.4, 0, 0, 2 * PI);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(cx + dx, cy, 0.9, 2.3, 0, 0, 2 * PI);
    c.stroke();
  }
  c.strokeStyle = 'rgba(70,45,30,0.7)';
  c.lineWidth = 0.6;
  c.beginPath();
  for (const dy of [-2.4, 0, 2.4]) {
    c.moveTo(cx - 5.5, cy + dy);
    c.lineTo(cx + 5.5, cy + dy + (dy === 0 ? 0 : 0));
  }
  c.stroke();
  // plume
  c.strokeStyle = '#f4f0e6';
  c.fillStyle = '#f4f0e6';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(cx + 3, cy + 5);
  c.quadraticCurveTo(cx + 9, cy - 3, cx + 11, cy - 10);
  c.quadraticCurveTo(cx + 5, cy - 5, cx + 3, cy + 5);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(60,50,40,0.85)';
  c.stroke();
  c.strokeStyle = '#4a3a2a';
  c.beginPath();
  c.moveTo(cx + 3, cy + 5);
  c.lineTo(cx + 1.5, cy + 8.5);
  c.stroke();
  c.restore();
}

/** Rondin cerclé de bronze, torche fixée sur poteau : lampadaire (brasero) à flamme figée. */
export function brazier(g, x, y, z = 0, h = 22) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z, z + h, 0.04);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  stick(c, px, py, px, py - h, '#4a3826', 2);
  c.fillStyle = '#3a3634';
  c.beginPath();
  c.moveTo(px - 5, py - h - 1);
  c.lineTo(px + 5, py - h - 1);
  c.lineTo(px + 3, py - h + 4);
  c.lineTo(px - 3, py - h + 4);
  c.closePath();
  c.fill();
  c.strokeStyle = BRONZE;
  c.lineWidth = 0.9;
  c.stroke();
  const gr = c.createRadialGradient(px, py - h - 4, 0, px, py - h - 4, 7);
  gr.addColorStop(0, 'rgba(255,240,150,0.95)');
  gr.addColorStop(0.5, 'rgba(255,150,40,0.85)');
  gr.addColorStop(1, 'rgba(255,90,20,0)');
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(px - 4, py - h - 1);
  c.quadraticCurveTo(px - 4, py - h - 8, px, py - h - 13);
  c.quadraticCurveTo(px + 4, py - h - 8, px + 4, py - h - 1);
  c.closePath();
  c.fill();
}

void WOOD_LIGHT;
void RX;
void RY;
