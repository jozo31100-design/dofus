// Structures composites des bâtiments : huttes rondes, longues maisons à pignon, toits, charpentes,
// échafaudages, fondations, palissades, remparts, créneaux. Chaque fonction reçoit le peintre `g`
// (building-gfx.js) et respecte son mode (plan / ombre / peinture) et le stade de construction :
//   0 fondations (géré par foundation()), 1 murs à 40 % + charpente + échafaudage,
//   2 murs finis, toit à moitié couvert, 3 terminé.

import { MAT, K_LEFT, K_RIGHT, HX, RX, RY, tone, rgba, ink, mulCol, hull } from './building-gfx.js';

const PI = Math.PI;
export const WOOD = '#6f4a2a';
export const WOOD_DARK = '#4e3219';
export const WOOD_LIGHT = '#a67c4e';
export const SCAF = '#b48d5e';
export const CORD = '#efe6cc';
export const EARTH = '#8a6c4c';
export const INTERIOR = '#2a1f17';

// ---------------------------------------------------------------------------
// Petits éléments dessinés à l'écran
// ---------------------------------------------------------------------------

/** Poteau vertical dessiné en coordonnées écran (px, py = pied). */
export function postScreen(c, px, py, h, w = 2.6, col = WOOD) {
  const g = c.createLinearGradient(px - w / 2, 0, px + w / 2, 0);
  g.addColorStop(0, tone(col, 1.18));
  g.addColorStop(0.45, col);
  g.addColorStop(1, tone(col, 0.6));
  c.fillStyle = g;
  c.fillRect(px - w / 2, py - h, w, h);
  c.strokeStyle = ink(col, 0.5);
  c.lineWidth = 0.7;
  c.strokeRect(px - w / 2, py - h, w, h);
}

/** Trait de bois entre deux points écran. */
export function stick(c, ax, ay, bx, by, col = WOOD, w = 2) {
  c.lineCap = 'round';
  c.strokeStyle = ink(col, 0.7);
  c.lineWidth = w + 1;
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(bx, by);
  c.stroke();
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
  c.lineCap = 'butt';
}

// ---------------------------------------------------------------------------
// Ouvertures dans une face plane (repère local : u vers la droite, v vers le bas, h = hauteur de la face)
// ---------------------------------------------------------------------------

/** Porte centrée en u, posée au bas de la face. w, dh : largeur et hauteur (px). */
export function doorLocal(c, u, h, w, dh, o = {}) {
  const x = u - w / 2;
  const y = h - dh;
  const frame = o.frame || WOOD_DARK;
  c.fillStyle = INTERIOR;
  if (o.arch) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x, y + w / 2);
    c.arc(u, y + w / 2, w / 2, PI, 0);
    c.lineTo(x + w, h);
    c.closePath();
    c.fill();
  } else c.fillRect(x, y, w, dh);
  if (o.leaf !== false) {
    // vantail de planches entrouvert
    const lw = w * (o.open ?? 0.55);
    c.fillStyle = o.leafCol || '#7c5634';
    c.fillRect(x + (o.leafRight ? w - lw : 0), y + (o.arch ? w * 0.3 : 0), lw, dh - (o.arch ? w * 0.3 : 0));
    c.fillStyle = 'rgba(0,0,0,0.35)';
    for (let k = 1; k < 3; k++) c.fillRect(x + (o.leafRight ? w - lw : 0) + (lw * k) / 3, y + (o.arch ? w * 0.3 : 0), 0.6, dh);
    c.fillStyle = 'rgba(40,40,45,0.8)';
    c.fillRect(x + (o.leafRight ? w - lw : 0), y + dh * 0.3, lw, 0.9);
    c.fillRect(x + (o.leafRight ? w - lw : 0), y + dh * 0.72, lw, 0.9);
  }
  // encadrement
  c.strokeStyle = frame;
  c.lineWidth = 1.6;
  if (o.arch) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x, y + w / 2);
    c.arc(u, y + w / 2, w / 2, PI, 0);
    c.lineTo(x + w, h);
    c.stroke();
  } else {
    c.beginPath();
    c.moveTo(x - 0.4, h);
    c.lineTo(x - 0.4, y - 0.4);
    c.lineTo(x + w + 0.4, y - 0.4);
    c.lineTo(x + w + 0.4, h);
    c.stroke();
    c.fillStyle = frame;
    c.fillRect(x - 1.8, y - 2.2, w + 3.6, 2);
  }
}

/** Fenêtre (ouverture sombre + volets) centrée en (u, v). */
export function windowLocal(c, u, v, w, hh, o = {}) {
  c.fillStyle = INTERIOR;
  if (o.arch) {
    c.beginPath();
    c.moveTo(u - w / 2, v + hh / 2);
    c.lineTo(u - w / 2, v - hh / 2 + w / 2);
    c.arc(u, v - hh / 2 + w / 2, w / 2, PI, 0);
    c.lineTo(u + w / 2, v + hh / 2);
    c.closePath();
    c.fill();
  } else c.fillRect(u - w / 2, v - hh / 2, w, hh);
  if (o.glow) {
    c.fillStyle = 'rgba(255,190,90,0.55)';
    c.fillRect(u - w / 2 + 0.8, v - hh / 2 + 1.5, w - 1.6, hh - 2);
  }
  if (o.shutters !== false) {
    c.fillStyle = o.shutter || '#6e4d2e';
    c.fillRect(u - w / 2 - w * 0.55, v - hh / 2, w * 0.5, hh);
    c.fillRect(u + w / 2 + w * 0.05, v - hh / 2, w * 0.5, hh);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(u - w / 2 - w * 0.3, v - hh / 2, 0.5, hh);
    c.fillRect(u + w / 2 + w * 0.3, v - hh / 2, 0.5, hh);
  }
  c.fillStyle = o.sill || '#5a3d22';
  c.fillRect(u - w / 2 - 1, v + hh / 2, w + 2, 1.4);
}

// ---------------------------------------------------------------------------
// Chantier (stade 1) : volumes ouverts, poteaux, sablières
// ---------------------------------------------------------------------------

/** Cylindre ouvert (murs partiels) : face intérieure du mur arrière et sol, vus d'en haut. */
export function openCyl(g, x, y, r, z0, zt, mat) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  const rx = r * RX;
  const ry = r * RY;
  c.save();
  c.beginPath();
  c.ellipse(X, Y - zt, rx, ry, 0, 0, 2 * PI);
  c.clip();
  const gr = c.createLinearGradient(X - rx, 0, X + rx, 0);
  gr.addColorStop(0, tone(mat.col, 0.5));
  gr.addColorStop(1, tone(mat.col, 0.78));
  c.fillStyle = gr;
  c.fillRect(X - rx, Y - zt - ry, 2 * rx, 2 * ry);
  c.fillStyle = '#76593e';
  c.beginPath();
  c.ellipse(X, Y - z0, rx, ry, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(20,10,5,0.25)';
  c.beginPath();
  c.ellipse(X, Y - z0 + ry * 0.35, rx * 0.95, ry * 0.8, 0, 0, 2 * PI);
  c.fill();
  c.restore();
  c.lineWidth = 2.2;
  c.strokeStyle = tone(mat.col, 1.05);
  c.beginPath();
  c.ellipse(X, Y - zt, rx - 1, ry - 0.6, 0, 0, 2 * PI);
  c.stroke();
  c.lineWidth = 0.8;
  c.strokeStyle = ink(mat.col, 0.5);
  c.stroke();
}

/** Prisme ouvert (murs partiels) : faces intérieures des murs arrière et sol. */
export function openBox(g, x0, y0, x1, y1, z0, zt, mat) {
  if (!g.drawing) return;
  g.faceR(x0, y0, y1, z0, zt, mat, { k: 0.55, ao: false });
  g.faceL(x0, x1, y0, z0, zt, mat, { k: 0.74, ao: false });
  g.faceTop(x0, y0, x1, y1, z0, MAT.earth, { k: 0.8 });
}

/** Arête supérieure (épaisseur) de murs partiels d'un prisme ouvert. */
export function boxRim(g, x0, y0, x1, y1, z, mat) {
  if (!g.drawing) return;
  const c = g.ctx;
  g.path([g.P(x0, y0, z), g.P(x1, y0, z), g.P(x1, y1, z), g.P(x0, y1, z)]);
  c.lineWidth = 2.2;
  c.strokeStyle = tone(mat.col, 1.08);
  c.stroke();
  c.lineWidth = 0.8;
  c.strokeStyle = ink(mat.col, 0.5);
  c.stroke();
}

/** Poteaux le long d'un segment (pas ≈ step cases), de z0 à z1. */
export function postsAlong(g, xa, ya, xb, yb, step, z0, z1, col = WOOD, w = 2.6) {
  const L = Math.hypot(xb - xa, yb - ya);
  const n = Math.max(1, Math.round(L / step));
  for (let i = 0; i <= n; i++) g.post(xa + ((xb - xa) * i) / n, ya + ((yb - ya) * i) / n, z0, z1, col, w);
}

// ---------------------------------------------------------------------------
// Échafaudages
// ---------------------------------------------------------------------------

/** Échafaudage : perches aux points pts ([x, y], dans l'ordre le long du mur), lisses, écharpes, plancher. */
export function scaffold(g, pts, zTop, o = {}) {
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    for (const [x, y] of pts) g.shadowPole(x, y, 0, zTop, 0.02);
    return;
  }
  const col = o.col || SCAF;
  const step = o.step || 12;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    if (i % 2 === 0) g.beam(ax, ay, 3, bx, by, Math.min(zTop - 3, step * 2), tone(col, 0.85), 1.1);
    for (let z = step; z <= zTop - 3; z += step) g.beam(ax, ay, z, bx, by, z, col, 1.4);
    if (o.deck) {
      // plancher de travail : quelques planches posées sur les lisses
      const zd = Math.floor(o.deck / step) * step + 1.2;
      const [p, q, r2] = [g.P(ax, ay, zd), g.P(bx, by, zd), g.P(bx + (o.dx || 0), by + (o.dy || 0), zd)];
      g.fillPoly([p, q, r2, g.P(ax + (o.dx || 0), ay + (o.dy || 0), zd)], '#c49a66');
    }
  }
  for (const [x, y] of pts) g.post(x, y, 0, zTop, col, 1.7);
}

/** Échelle appuyée entre deux points 3D (pied, sommet). */
export function ladder(g, x0, y0, x1, y1, z1, col = SCAF) {
  if (!g.drawing) return;
  const c = g.ctx;
  const a = g.P(x0, y0, 0);
  const b = g.P(x1, y1, z1);
  const off = 2.2;
  stick(c, a[0] - off, a[1], b[0] - off, b[1], col, 1.2);
  stick(c, a[0] + off, a[1], b[0] + off, b[1], col, 1.2);
  const n = Math.max(2, Math.round(z1 / 5));
  c.strokeStyle = col;
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    c.moveTo(x - off, y);
    c.lineTo(x + off, y);
  }
  c.stroke();
}

/** Échafaudage devant les deux faces visibles d'un prisme (x0..x1, y0..y1). */
export function scaffoldBox(g, x0, y0, x1, y1, zTop, o = {}) {
  const d = o.gap ?? 0.13;
  const step = o.step ?? 0.5;
  const sides = o.sides || 'LR';
  if (sides.includes('R')) {
    const pts = [];
    const n = Math.max(1, Math.round((y1 - y0) / step));
    for (let i = 0; i <= n; i++) pts.push([x1 + d, y0 + ((y1 - y0) * i) / n]);
    scaffold(g, pts, zTop, { deck: o.deck, dx: -d * 0.8 });
  }
  if (sides.includes('L')) {
    const pts = [];
    const n = Math.max(1, Math.round((x1 - x0) / step));
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y1 + d]);
    scaffold(g, pts, zTop, { deck: o.deck, dy: -d * 0.8 });
  }
}

/** Échafaudage autour de l'avant d'un cylindre. */
export function scaffoldRound(g, x, y, r, zTop, o = {}) {
  const pts = [];
  const a0 = o.a0 ?? -0.2;
  const a1 = o.a1 ?? PI / 2 + 0.2 + PI / 2;
  const n = o.n ?? 5;
  for (let i = 0; i <= n; i++) {
    // angle monde : de -x+y (gauche) vers +x-y (droite) en passant par l'avant (+x+y)
    const phi = a1 - ((a1 - a0) * i) / n;
    pts.push([x + (r + 0.14) * Math.cos(phi), y + (r + 0.14) * Math.sin(phi)]);
  }
  scaffold(g, pts, zTop, o);
}

// ---------------------------------------------------------------------------
// Toits à pignon
// ---------------------------------------------------------------------------

/** Géométrie d'un toit à deux pans au-dessus du rectangle de murs (x0..x1, y0..y1). */
export function gableGeo(o) {
  const { x0, y0, x1, y1, zw, zr } = o;
  const axis = o.axis || 'x';
  const ov = o.ov ?? 0.14;
  const ovg = o.ovg ?? 0.1;
  // o.xa / o.ya : prolonge le faîtage vers l'arrière (toit qui vient s'appuyer sur un autre toit)
  if (axis === 'x') {
    const yc = (y0 + y1) / 2;
    const slope = (zr - zw) / ((y1 - y0) / 2);
    return { axis, x0, y0, x1, y1, zw, zr, yc, ze: zw - ov * slope, xa: o.xa ?? x0 - ovg, xb: x1 + ovg, ya: y0 - ov, yb: y1 + ov };
  }
  const xc = (x0 + x1) / 2;
  const slope = (zr - zw) / ((x1 - x0) / 2);
  return { axis, x0, y0, x1, y1, zw, zr, xc, ze: zw - ov * slope, xa: x0 - ov, xb: x1 + ov, ya: o.ya ?? y0 - ovg, yb: y1 + ovg };
}

/** Pignon triangulaire sur une face droite (x = x) ou gauche (y = y). */
function gableWall(g, G, mat, deco) {
  const h = G.zr - G.zw;
  if (h <= 0.5) return;
  if (G.axis === 'x') {
    const w = (G.y1 - G.y0) * HX;
    const shape = (c) => {
      c.moveTo(0, h + 0.5);
      c.lineTo(w / 2, 0);
      c.lineTo(w, h + 0.5);
      c.closePath();
    };
    g.plane(g.P(G.x1, G.y1, G.zr), [1, -0.5], [0, 1], w, h, mat, K_RIGHT, { ao: false, shape, deco });
    g.outline([g.P(G.x1, G.y1, G.zw), g.P(G.x1, G.yc, G.zr), g.P(G.x1, G.y0, G.zw)], tone(mat.col, K_RIGHT));
  } else {
    const w = (G.x1 - G.x0) * HX;
    const shape = (c) => {
      c.moveTo(0, h + 0.5);
      c.lineTo(w / 2, 0);
      c.lineTo(w, h + 0.5);
      c.closePath();
    };
    g.plane(g.P(G.x0, G.y1, G.zr), [1, 0.5], [0, 1], w, h, mat, K_LEFT, { ao: false, shape, deco });
    g.outline([g.P(G.x0, G.y1, G.zw), g.P(G.xc, G.y1, G.zr), g.P(G.x1, G.y1, G.zw)], tone(mat.col, K_LEFT));
  }
}

/** Chevrons d'un toit à pignon (charpente nue). part : 'back' (arrière + faîtière) ou 'front'. */
export function gableRafters(g, G, part, o = {}) {
  const step = o.step ?? 0.34;
  const col = o.col || WOOD_LIGHT;
  if (G.axis === 'x') {
    const n = Math.max(1, Math.round((G.x1 - G.x0) / step));
    if (part === 'back') {
      for (let i = 0; i <= n; i++) {
        const x = G.x0 + ((G.x1 - G.x0) * i) / n;
        g.beam(x, G.ya + 0.05, G.ze + 1, x, G.yc, G.zr, col, 1.8);
      }
      g.beam(G.x0 - 0.05, G.yc, G.zr, G.x1 + 0.05, G.yc, G.zr, tone(col, 0.9), 2.4);
    } else {
      for (let i = 0; i <= n; i++) {
        const x = G.x0 + ((G.x1 - G.x0) * i) / n;
        g.beam(x, G.yc, G.zr, x, G.yb - 0.05, G.ze + 1, col, 1.8);
      }
      // poinçon et entrait au pignon visible
      g.beam(G.x1, G.y0, G.zw, G.x1, G.y1, G.zw, col, 2);
      g.beam(G.x1, G.yc, G.zw, G.x1, G.yc, G.zr, col, 1.8);
    }
  } else {
    const n = Math.max(1, Math.round((G.y1 - G.y0) / step));
    if (part === 'back') {
      for (let i = 0; i <= n; i++) {
        const y = G.y0 + ((G.y1 - G.y0) * i) / n;
        g.beam(G.xa + 0.05, y, G.ze + 1, G.xc, y, G.zr, col, 1.8);
      }
      g.beam(G.xc, G.y0 - 0.05, G.zr, G.xc, G.y1 + 0.05, G.zr, tone(col, 0.9), 2.4);
    } else {
      for (let i = 0; i <= n; i++) {
        const y = G.y0 + ((G.y1 - G.y0) * i) / n;
        g.beam(G.xc, y, G.zr, G.xb - 0.05, y, G.ze + 1, col, 1.8);
      }
      g.beam(G.x0, G.y1, G.zw, G.x1, G.y1, G.zw, col, 2);
      g.beam(G.xc, G.y1, G.zw, G.xc, G.y1, G.zr, col, 1.8);
    }
  }
}

/** Décor « toit en cours de pose » dans le repère d'un pan (u le long du faîte, v vers l'égout). */
function partialRoofDeco(mat, frac = 0.5) {
  return (c, w, h) => {
    const cut = h * frac;
    c.fillStyle = INTERIOR;
    c.fillRect(-2, -2, w + 4, cut + 2);
    c.fillStyle = '#a07a50';
    for (let v = 2.5; v < cut; v += 4.5) c.fillRect(-2, v, w + 4, 1.1);
    c.fillStyle = '#8a6440';
    for (let u = 3; u < w; u += 10) {
      c.fillRect(u, -2, 2.4, cut + 3);
      c.fillStyle = 'rgba(255,230,190,0.35)';
      c.fillRect(u, -2, 0.7, cut + 3);
      c.fillStyle = '#8a6440';
    }
    // bord irrégulier de la couverture
    c.fillStyle = mat.col;
    c.beginPath();
    c.moveTo(-2, cut + 3);
    for (let u = -2; u <= w + 4; u += 3) c.lineTo(u, cut - 1.5 + ((u * 7.3) % 3));
    c.lineTo(w + 4, cut + 4);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(-2, cut + 2, w + 4, 1);
  };
}

/** Têtes sculptées croisées au sommet d'un pignon (Francs). pf, pb : égouts avant / arrière ; pr : faîte. */
export function gableHeads(g, pf, pb, pr, o = {}) {
  const c = g.ctx;
  const k = o.k ?? 0.3;
  const col = o.col || '#5a3a20';
  const e1 = [pr[0] + (pr[0] - pf[0]) * k, pr[1] + (pr[1] - pf[1]) * k];
  const e2 = [pr[0] + (pr[0] - pb[0]) * k, pr[1] + (pr[1] - pb[1]) * k];
  stick(c, pr[0], pr[1] + 1, e1[0], e1[1], col, 2);
  stick(c, pr[0], pr[1] + 1, e2[0], e2[1], col, 2);
  for (const [e, d] of [[e1, e1[0] >= pr[0] ? 1 : -1], [e2, e2[0] >= pr[0] ? 1 : -1]]) {
    // tête de dragon / cheval stylisée : volute et museau tournés vers l'extérieur
    c.fillStyle = col;
    c.strokeStyle = ink(col, 0.8);
    c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(e[0], e[1] - 0.5, 2.3, 1.9, 0, 0, 2 * PI);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(e[0] + d * 1.2, e[1] - 1.6);
    c.lineTo(e[0] + d * 4.6, e[1] - 0.2);
    c.lineTo(e[0] + d * 1.5, e[1] + 1.1);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = o.eye || '#e6b93c';
    c.fillRect(e[0] + d * 0.6 - 0.5, e[1] - 1.3, 1, 1);
  }
}

/**
 * Toit à deux pans. o : { x0, y0, x1, y1, zw, zr, axis, ov, ovg, mat, gableMat, th (épaisseur),
 * edge (couleur des rives), heads (têtes sculptées), ridge (couleur du faîtage), gableDeco }.
 * Stade 1 : rien (la charpente est gérée par l'appelant) ; stade 2 : couverture partielle ; 3 : complet.
 */
export function gableRoof(g, o) {
  const G = gableGeo(o);
  if (g.mode === 'plan') return G;
  if (g.mode === 'shadow') {
    g.shadowOf([
      [G.xa, G.ya, G.ze], [G.xb, G.ya, G.ze], [G.xa, G.yb, G.ze], [G.xb, G.yb, G.ze],
      [G.axis === 'x' ? G.xa : G.xc, G.axis === 'x' ? G.yc : G.ya, G.zr],
      [G.axis === 'x' ? G.xb : G.xc, G.axis === 'x' ? G.yc : G.yb, G.zr],
    ]);
    return G;
  }
  const st = g.stage;
  const mat = o.mat || MAT.shingle;
  const th = o.th ?? 3;
  const edge = o.edge || WOOD_DARK;
  const edgeMat = o.edgeMat || { col: edge };
  const partial = st === 2 && !o.complete;
  const c = g.ctx;
  if (G.axis === 'x') {
    const { yc, ze, xa, xb, ya, yb, zr } = G;
    if (g.P(xa, ya, ze)[1] < g.P(xa, yc, zr)[1]) g.slope([xb, yc, zr], [xa, yc, zr], [xb, ya, ze], mat, 0.78);
    gableWall(g, G, o.gableMat || MAT.planks, o.gableDeco);
    g.slope([xa, yc, zr], [xb, yc, zr], [xa, yb, ze], mat, o.kFront ?? 0.97, { deco: partial ? partialRoofDeco(mat) : o.roofDeco });
    g.outline([g.P(xa, yc, zr), g.P(xb, yc, zr), g.P(xb, yb, ze), g.P(xa, yb, ze)], tone(mat.col, 0.9));
    // rive du pignon droit (épaisseur du toit)
    g.fillPoly([g.P(xb, yc, zr), g.P(xb, yb, ze), g.P(xb, yb, ze - th), g.P(xb, yc, zr - th), g.P(xb, ya, ze - th), g.P(xb, ya, ze)], tone(edge, 0.7));
    // bord d'égout
    g.faceL(xa, xb, yb, ze - th, ze, edgeMat, { ao: false });
    if (!partial) {
      // faîtage
      const p = g.P(xa, yc, zr);
      const q = g.P(xb, yc, zr);
      stick(c, p[0], p[1] - 0.5, q[0], q[1] - 0.5, o.ridge || tone(mat.col, 0.7), o.ridgeW ?? 2.2);
      if (o.heads) {
        gableHeads(g, g.P(xa, yb, ze), g.P(xa, ya, ze), g.P(xa, yc, zr), o.headOpts);
        gableHeads(g, g.P(xb, yb, ze), g.P(xb, ya, ze), g.P(xb, yc, zr), o.headOpts);
      }
    }
  } else {
    const { xc, ze, xa, xb, ya, yb, zr } = G;
    if (g.P(xa, yb, ze)[1] < g.P(xc, yb, zr)[1]) g.slope([xc, ya, zr], [xc, yb, zr], [xa, ya, ze], mat, 1.0);
    gableWall(g, G, o.gableMat || MAT.planks, o.gableDeco);
    g.slope([xc, yb, zr], [xc, ya, zr], [xb, yb, ze], mat, o.kFront ?? 0.76, { deco: partial ? partialRoofDeco(mat) : o.roofDeco });
    g.outline([g.P(xc, yb, zr), g.P(xc, ya, zr), g.P(xb, ya, ze), g.P(xb, yb, ze)], tone(mat.col, 0.72));
    g.fillPoly([g.P(xc, yb, zr), g.P(xb, yb, ze), g.P(xb, yb, ze - th), g.P(xc, yb, zr - th), g.P(xa, yb, ze - th), g.P(xa, yb, ze)], tone(edge, 0.88));
    g.faceR(xb, ya, yb, ze - th, ze, edgeMat, { ao: false });
    if (!partial) {
      const p = g.P(xc, yb, zr);
      const q = g.P(xc, ya, zr);
      stick(c, p[0], p[1] - 0.5, q[0], q[1] - 0.5, o.ridge || tone(mat.col, 0.7), o.ridgeW ?? 2.2);
      if (o.heads) {
        gableHeads(g, g.P(xb, yb, ze), g.P(xa, yb, ze), g.P(xc, yb, zr), o.headOpts);
        gableHeads(g, g.P(xb, ya, ze), g.P(xa, ya, ze), g.P(xc, ya, zr), o.headOpts);
      }
    }
  }
  return G;
}

// ---------------------------------------------------------------------------
// Toits en appentis (auvents)
// ---------------------------------------------------------------------------

/**
 * Toit à un seul pan, du côté haut (arrière) vers le côté bas (avant).
 * dir : 'y' (pente vers +y, pan éclairé) ou 'x' (pente vers +x, pan sombre).
 */
export function leanRoof(g, o) {
  const { x0, y0, x1, y1, zHigh, zLow } = o;
  const mat = o.mat || MAT.shingle;
  const th = o.th ?? 3;
  const edge = o.edge || WOOD_DARK;
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowOf([[x0, y0, zHigh], [x1, y0, zHigh], [x0, y1, zLow], [x1, y1, zLow], [x0, y0, zHigh - th], [x1, y1, zLow - th]]);
    return;
  }
  const partial = g.stage === 2 && !o.complete;
  if ((o.dir || 'y') === 'y') {
    g.slope([x0, y0, zHigh], [x1, y0, zHigh], [x0, y1, zLow], mat, 0.97, { deco: partial ? partialRoofDeco(mat, 0.4) : null });
    g.outline([g.P(x0, y0, zHigh), g.P(x1, y0, zHigh), g.P(x1, y1, zLow), g.P(x0, y1, zLow)], tone(mat.col, 0.9));
    g.fillPoly([g.P(x1, y0, zHigh), g.P(x1, y1, zLow), g.P(x1, y1, zLow - th), g.P(x1, y0, zHigh - th)], tone(edge, 0.7));
    g.faceL(x0, x1, y1, zLow - th, zLow, { col: edge }, { ao: false });
  } else {
    g.slope([x0, y1, zHigh], [x0, y0, zHigh], [x1, y1, zLow], mat, 0.76, { deco: partial ? partialRoofDeco(mat, 0.4) : null });
    g.outline([g.P(x0, y1, zHigh), g.P(x0, y0, zHigh), g.P(x1, y0, zLow), g.P(x1, y1, zLow)], tone(mat.col, 0.72));
    g.fillPoly([g.P(x0, y1, zHigh), g.P(x1, y1, zLow), g.P(x1, y1, zLow - th), g.P(x0, y1, zHigh - th)], tone(edge, 0.88));
    g.faceR(x1, y0, y1, zLow - th, zLow, { col: edge }, { ao: false });
  }
}

/**
 * Appentis ouvert sur poteaux (auvent) : o = { x0, y0, x1, y1, zHigh, zLow, dir, mat, backWall (matériau),
 * sideWall, contents(g) (dessiné sous le toit), postCol }. Stade 1 : poteaux et sablières ; 2 : toit partiel.
 */
export function shed(g, o) {
  const { x0, y0, x1, y1, zHigh, zLow } = o;
  const dir = o.dir || 'y';
  const th = o.th ?? 3;
  if (g.mode === 'plan') {
    if (o.plan !== false) g.planRect(x0, y0, x1, y1);
    return;
  }
  const st = g.stage;
  const pc = o.postCol || WOOD;
  const zAt = (x, y) => (dir === 'y' ? zHigh + ((zLow - zHigh) * (y - y0)) / (y1 - y0) : zHigh + ((zLow - zHigh) * (x - x0)) / (x1 - x0)) - th;
  const inset = 0.06;
  const P = [[x0 + inset, y0 + inset], [x1 - inset, y0 + inset], [x0 + inset, y1 - inset], [x1 - inset, y1 - inset]];
  const back = [P[0], P[1], P[2]].filter((p) => !(p[0] > x1 - 0.1 && p[1] > y1 - 0.1));
  // poteaux arrière
  for (const [x, y] of back) g.post(x, y, 0, zAt(x, y), pc, 3);
  if (o.backWall && st >= 2) {
    if (dir === 'y') g.faceL(x0 + inset, x1 - inset, y0 + inset + 0.02, 0, zAt(x0, y0) - 1, o.backWall, { k: 0.8 });
    else g.faceR(x0 + inset + 0.02, y0 + inset, y1 - inset, 0, zAt(x0, y0) - 1, o.backWall, { k: 0.6 });
  }
  if (o.sideWall && st >= 2) {
    // mur latéral plein (côté x0 pour dir 'y', côté y0 pour dir 'x')
    if (dir === 'y') g.faceR(x0 + inset, y0 + inset, y1 - inset, 0, zAt(x0, y1 - inset) - 1, o.sideWall, { k: 0.58 });
    else g.faceL(x0 + inset, x1 - inset, y0 + inset, 0, zAt(x1 - inset, y0) - 1, o.sideWall, { k: 0.78 });
  }
  if (o.contents && st >= 2) o.contents(g);
  if (st === 1) {
    g.beam(P[0][0], P[0][1], zAt(...P[0]), P[1][0], P[1][1], zAt(...P[1]), WOOD, 2);
    g.beam(P[0][0], P[0][1], zAt(...P[0]), P[2][0], P[2][1], zAt(...P[2]), WOOD, 2);
    g.beam(P[1][0], P[1][1], zAt(...P[1]), P[3][0], P[3][1], zAt(...P[3]), WOOD, 2);
    g.beam(P[2][0], P[2][1], zAt(...P[2]), P[3][0], P[3][1], zAt(...P[3]), WOOD, 2);
  } else {
    leanRoof(g, { x0, y0, x1, y1, zHigh, zLow, dir, mat: o.mat, th, edge: o.edge });
  }
  g.post(P[3][0], P[3][1], 0, zAt(...P[3]), pc, 3);
  if (st === 1 && o.scaffold !== false) scaffold(g, [[x0 - 0.05, y1 + 0.1], [x1 * 0.5 + x0 * 0.5, y1 + 0.1]], zLow + 4);
}

// ---------------------------------------------------------------------------
// Toits coniques de chaume et pyramidaux
// ---------------------------------------------------------------------------

/** Bord épais d'un toit de chaume (tranche des bottes de paille sous l'égout). */
export function eaveBand(g, G, th, col) {
  const c = g.ctx;
  const { X, Yb, rx, ry } = G;
  const path = () => {
    c.beginPath();
    c.moveTo(X - rx, Yb);
    c.ellipse(X, Yb, rx, ry, 0, PI, 0, true);
    c.lineTo(X + rx, Yb + th * 0.7);
    c.ellipse(X, Yb + th, rx, ry, 0, 0, PI, false);
    c.closePath();
  };
  c.save();
  path();
  c.clip();
  c.fillStyle = tone(col, 0.8);
  c.fillRect(X - rx - 2, Yb - 2, rx * 2 + 4, ry + th + 4);
  c.lineWidth = 1;
  const n = Math.round(rx * 1.4);
  for (let i = 0; i <= n; i++) {
    const t = PI - (PI * i) / n;
    const x = X + rx * Math.cos(t);
    const y = Yb + ry * Math.sin(t);
    c.strokeStyle = i % 2 ? rgba(tone(col, 1.25), 0.55) : rgba(tone(col, 0.55), 0.5);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + (i % 3) * 0.3 - 0.3, y + th + 0.6);
    c.stroke();
  }
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = g.roundShade(X, rx, 0.55);
  c.fillRect(X - rx - 2, Yb - 2, rx * 2 + 4, ry + th + 4);
  c.restore();
  path();
  c.strokeStyle = ink(col, 0.55);
  c.lineWidth = 1;
  c.stroke();
  // franges
  c.strokeStyle = rgba(tone(col, 0.6), 0.6);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 0; i < n; i += 2) {
    const t = PI - (PI * (i + 0.5)) / n;
    const x = X + rx * Math.cos(t);
    const y = Yb + th + ry * Math.sin(t);
    c.moveTo(x, y);
    c.lineTo(x + 0.2, y + 1.6);
  }
  c.stroke();
}

/** Bandeau de couleur (tissu teint) serrant le chaume près du sommet d'un cône. */
export function coneBand(g, G, f1, f2, col, pattern = true) {
  const c = g.ctx;
  c.save();
  g.coneBandPath(G, f1, f2);
  c.clip();
  c.fillStyle = col;
  c.fillRect(G.X - G.rx, G.Ya - 2, G.rx * 2, G.Yb - G.Ya + G.ry + 4);
  if (pattern) {
    // petits chevrons clairs tissés
    const fm = (f1 + f2) / 2;
    c.fillStyle = 'rgba(255,245,220,0.75)';
    for (let t = -G.a + 0.18; t < PI + G.a; t += 0.42) {
      const p = g.coneAt(G, fm, t);
      c.beginPath();
      c.arc(p[0], p[1], 0.9, 0, 2 * PI);
      c.fill();
    }
  }
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = g.roundShade(G.X, G.rx * f2, 0.55);
  c.fillRect(G.X - G.rx, G.Ya - 2, G.rx * 2, G.Yb - G.Ya + G.ry + 4);
  c.restore();
  g.coneBandPath(G, f1, f2);
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 0.9;
  c.stroke();
}

/**
 * Toit conique de chaume : cône, égout épais, bandeau et coiffe. Stade 2 : couverture partielle
 * (chevrons nus en haut) ; le stade 1 est géré par roundHut (charpente seule).
 * o : { x, y, zb, R, za, mat, th, band (couleur), cap (couleur de la coiffe) }
 */
export function thatchCone(g, o) {
  const x = o.x ?? 0;
  const y = o.y ?? 0;
  const { zb, R, za } = o;
  const mat = o.mat || MAT.thatch;
  const th = o.th ?? 5;
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowCone(x, y, R, zb - th, za);
    return;
  }
  const c = g.ctx;
  const G = g.coneGeo(x, y, zb, R, za);
  const partial = g.stage === 2 && !o.complete;
  const f0 = 0.46;
  if (partial) {
    // intérieur sombre vu par le haut ouvert et chevrons
    c.fillStyle = INTERIOR;
    c.beginPath();
    c.ellipse(G.X, G.Ya + f0 * (G.Yb - G.Ya), f0 * G.rx, f0 * G.ry, 0, 0, 2 * PI);
    c.fill();
    coneRafters(g, G, f0, 'back');
  }
  g.cone(x, y, zb, R, za, mat, { f0: partial ? f0 : 0, shadow: false });
  eaveBand(g, G, th, mat.col);
  if (partial) {
    coneRafters(g, G, f0, 'front');
    return G;
  }
  if (o.band) coneBand(g, G, o.bandF1 ?? 0.13, o.bandF2 ?? 0.22, o.band);
  // coiffe : botte serrée au sommet
  const capCol = o.cap || tone(mat.col, 0.72);
  c.save();
  g.coneBandPath(G, 0.001, 0.09);
  c.fillStyle = capCol;
  c.fill();
  c.strokeStyle = ink(capCol, 0.6);
  c.lineWidth = 0.8;
  c.stroke();
  c.restore();
  return G;
}

/** Chevrons d'un cône : de la couronne f (ou de la base) jusqu'au sommet. */
export function coneRafters(g, G, f, part, n = 12, col = WOOD_LIGHT) {
  const c = g.ctx;
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * 2 * PI;
    const front = Math.sin(t) > 0;
    if ((part === 'front') !== front) continue;
    const p = g.coneAt(G, f, t);
    stick(c, p[0], p[1], G.X, G.Ya, col, 1.6);
  }
}

/** Toit pyramidal (4 pans) au-dessus du carré x0..x1, y0..y1 ; base à zb, sommet à za. */
export function pyramidRoof(g, o) {
  const { x0, y0, x1, y1, zb, za } = o;
  const mat = o.mat || MAT.slate;
  const ov = o.ov ?? 0.08;
  const th = o.th ?? 2;
  const X0 = x0 - ov;
  const Y0 = y0 - ov;
  const X1 = x1 + ov;
  const Y1 = y1 + ov;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowOf([[X0, Y0, zb], [X1, Y0, zb], [X1, Y1, zb], [X0, Y1, zb], [cx, cy, za]]);
    return;
  }
  const A = [cx, cy, za];
  const partial = g.stage === 2 && !o.complete;
  const tri = (c, w, h) => {
    c.moveTo(w / 2, -0.5);
    c.lineTo(w + 0.5, h);
    c.lineTo(-0.5, h);
    c.closePath();
  };
  const face = (L, Rr, k) => {
    // L, Rr : coins bas gauche / droite (3D) ; repère : u parallèle à l'égout, v du sommet vers l'égout
    const pl = g.P(...L);
    const pr = g.P(...Rr);
    const pa = g.P(...A);
    const mid = [(pl[0] + pr[0]) / 2, (pl[1] + pr[1]) / 2];
    const ux = pr[0] - pl[0];
    const uy = pr[1] - pl[1];
    const lu = Math.hypot(ux, uy);
    const vx = mid[0] - pa[0];
    const vy = mid[1] - pa[1];
    const lv = Math.hypot(vx, vy);
    const U = [ux / lu, uy / lu];
    const V = [vx / lv, vy / lv];
    const O = [pa[0] - (U[0] * lu) / 2, pa[1] - (U[1] * lu) / 2];
    g.plane(O, U, V, lu, lv, mat, k, { ao: false, shape: tri, deco: partial ? partialRoofDeco(mat, 0.45) : null });
    g.outline([pa, pr, pl], tone(mat.col, k));
    return { pl, pr };
  };
  face([X0, Y1, zb], [X1, Y1, zb], 0.96);
  face([X1, Y1, zb], [X1, Y0, zb], 0.72);
  // tranches d'égout
  g.faceL(X0, X1, Y1, zb - th, zb, { col: o.edge || WOOD_DARK }, { ao: false });
  g.faceR(X1, Y0, Y1, zb - th, zb, { col: o.edge || WOOD_DARK }, { ao: false });
  if (!partial && o.finial !== false) finial(g, cx, cy, za, o.finialCol);
}

/** Épi de faîtage doré (boule et pointe) au sommet d'un toit. */
export function finial(g, x, y, z, col = '#d9a93a', h = 7) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.strokeStyle = tone(col, 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(px, py - h);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.arc(px, py - h * 0.55, 1.7, 0, 2 * PI);
  c.fill();
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 0.6;
  c.stroke();
}

// ---------------------------------------------------------------------------
// Hutte ronde gauloise
// ---------------------------------------------------------------------------

/** Porte percée dans un mur rond, à l'angle écran td (π/2 = face à la caméra). */
export function roundDoor(c, X, Y, rx, ry, z0, td, dw, dh, o = {}) {
  const s = Math.sin(td);
  const hw = dw / 2 / (rx * Math.max(0.3, s));
  const t1 = td + hw;
  const t2 = td - hw;
  const pt = (t, z) => [X + rx * Math.cos(t), Y - z + ry * Math.sin(t)];
  const path = (zb, zt) => {
    c.beginPath();
    const a = pt(t1, zb);
    c.moveTo(a[0], a[1]);
    c.ellipse(X, Y - zb, rx, ry, 0, t1, t2, true);
    const b = pt(t2, zt);
    c.lineTo(b[0], b[1]);
    c.ellipse(X, Y - zt, rx, ry, 0, t2, t1, false);
    c.closePath();
  };
  path(z0, z0 + dh);
  c.fillStyle = INTERIOR;
  c.fill();
  // vantail entrouvert
  const tm = td + hw * 0.1;
  c.save();
  path(z0, z0 + dh);
  c.clip();
  c.fillStyle = o.leaf || '#7a5230';
  const a = pt(t1, z0);
  const m = pt(tm, z0);
  c.fillRect(a[0], a[1] - dh - 3, m[0] - a[0], dh + 6);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.fillRect(a[0] + (m[0] - a[0]) * 0.5, a[1] - dh - 3, 0.6, dh + 6);
  c.restore();
  // encadrement
  const f = o.frame || WOOD_DARK;
  const l0 = pt(t1, z0);
  const l1 = pt(t1, z0 + dh + 1);
  const r0 = pt(t2, z0);
  const r1 = pt(t2, z0 + dh + 1);
  stick(c, l0[0] - 0.8, l0[1], l1[0] - 0.8, l1[1], f, 1.6);
  stick(c, r0[0] + 0.8, r0[1], r1[0] + 0.8, r1[1], f, 1.6);
  c.strokeStyle = f;
  c.lineWidth = 2.2;
  c.beginPath();
  c.ellipse(X, Y - z0 - dh - 1.5, rx, ry, 0, t1 + 0.04, t2 - 0.04, true);
  c.stroke();
}

/** Poteaux apparents (et porte, bandeau peint) sur un mur rond de torchis. */
function roundWallDeco(c, X, Y, rx, ry, z0, zw, o) {
  const n = o.posts ?? 7;
  if (n > 0) {
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * PI;
      const s = Math.sin(t);
      const px = X + rx * Math.cos(t);
      const w = 2.6 * s + 0.5;
      c.fillStyle = o.timber || WOOD;
      c.fillRect(px - w / 2, Y - zw + ry * s - 1, w, zw - z0 + 1);
      c.fillStyle = 'rgba(255,225,180,0.28)';
      c.fillRect(px - w / 2, Y - zw + ry * s - 1, Math.max(0.4, w * 0.3), zw - z0 + 1);
    }
  }
  if (o.band) {
    // frise peinte (zigzag) sous l'avant-toit
    const zb = z0 + (zw - z0) * (o.bandAt ?? 0.62);
    c.strokeStyle = o.band;
    c.lineWidth = 1.2;
    c.beginPath();
    let first = true;
    for (let t = PI; t >= 0; t -= 0.07) {
      const up = Math.round(t / 0.07) % 2 ? 1.6 : -1.6;
      const x = X + rx * Math.cos(t);
      const y = Y - zb + ry * Math.sin(t) + up;
      if (first) c.moveTo(x, y);
      else c.lineTo(x, y);
      first = false;
    }
    c.stroke();
  }
  if (o.door != null) roundDoor(c, X, Y, rx, ry, z0, o.door, o.doorW ?? 8, o.doorH ?? Math.min(14, (zw - z0) * 0.8), o);
  if (o.wallDeco) o.wallDeco(c, X, Y, rx, ry, z0, zw);
}

/**
 * Hutte ronde : mur de torchis (ou autre matériau) et toit conique de chaume.
 * o : { x, y, r, z0, wallH, R, apex, drop, wallMat, roofMat, posts, door, doorW, doorH, band, roofBand, th }
 */
export function roundHut(g, o) {
  const x = o.x ?? 0;
  const y = o.y ?? 0;
  const r = o.r;
  const z0 = o.z0 ?? 0;
  const zw = z0 + o.wallH;
  const R = o.R ?? r + 0.17;
  const za = o.apex;
  const zb = zw - (o.drop ?? 3);
  const wall = o.wallMat || MAT.daub;
  const roof = o.roofMat || MAT.thatch;
  if (g.mode === 'plan') {
    if (o.plan !== false) g.planCircle(x, y, r + 0.05);
    return;
  }
  if (g.stage === 1) {
    roundFrame(g, { ...o, x, y, r, z0, zw, za, wall, R, zb });
    return;
  }
  g.cyl(x, y, r, z0, zw, wall, { eave: 5, deco: (c, X, Y, rx, ry) => roundWallDeco(c, X, Y, rx, ry, z0, zw, o) });
  thatchCone(g, { x, y, zb, R, za, mat: roof, th: o.th ?? 5, band: o.roofBand, cap: o.cap });
}

/** Stade 1 d'une hutte ronde : murs à 40 %, poteaux, sablière, chevrons. */
function roundFrame(g, o) {
  const { x, y, r, z0, zw, za, wall } = o;
  const zt = z0 + (zw - z0) * 0.4;
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r, z0, zt);
    return;
  }
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  const rx = r * RX;
  const ry = r * RY;
  const n = 12;
  const ts = [];
  for (let i = 0; i < n; i++) ts.push(((i + 0.5) / n) * 2 * PI);
  openCyl(g, x, y, r, z0, zt, wall);
  const G = { X, Ya: Y - za, Yb: Y - zw, rx, ry, a: 0 };
  // poteaux et chevrons arrière
  for (const t of ts) if (Math.sin(t) < 0) postScreen(c, X + rx * Math.cos(t), Y - z0 + ry * Math.sin(t), zw - z0, 2.4);
  c.strokeStyle = WOOD;
  c.lineWidth = 2.4;
  c.beginPath();
  c.ellipse(X, Y - zw, rx, ry, 0, PI, 2 * PI);
  c.stroke();
  coneRafters(g, G, 1, 'back', 10);
  // mur avant partiel, poteaux et chevrons avant
  g.cyl(x, y, r, z0, zt, wall, {});
  for (const t of ts) if (Math.sin(t) >= 0) postScreen(c, X + rx * Math.cos(t), Y - z0 + ry * Math.sin(t), zw - z0, 2.6);
  c.strokeStyle = WOOD;
  c.lineWidth = 2.6;
  c.beginPath();
  c.ellipse(X, Y - zw, rx, ry, 0, 0, PI);
  c.stroke();
  c.strokeStyle = 'rgba(255,225,180,0.35)';
  c.lineWidth = 0.8;
  c.stroke();
  coneRafters(g, G, 1, 'front', 10);
  if (o.scaffold !== false) scaffoldRound(g, x, y, r, zw + 2, { n: 4 });
}

// ---------------------------------------------------------------------------
// Longue maison (murs droits et toit à deux pans)
// ---------------------------------------------------------------------------

/**
 * o : { x0, y0, x1, y1, z0, plinthH, plinthMat, wallH, ridgeH, axis, wallMat, roofMat, gableMat,
 *       ov, ovg, th, edge, heads, ridge, decoL, decoR, gableDeco, frame (stade 1 : ossature de bois) }
 */
export function longHouse(g, o) {
  const { x0, y0, x1, y1 } = o;
  const z0 = o.z0 ?? 0;
  const zp = z0 + (o.plinthH || 0);
  const zw = z0 + o.wallH;
  const zr = z0 + o.ridgeH;
  const wall = o.wallMat || MAT.planks;
  const roofO = { ...o, x0, y0, x1, y1, zw, zr, mat: o.roofMat || MAT.shingle, gableMat: o.gableMat || wall };
  if (g.mode === 'plan') {
    if (o.plan !== false) g.planRect(x0, y0, x1, y1);
    return;
  }
  const st = g.stage;
  const plinth = () => {
    if (o.plinthH) g.box(x0 - 0.035, y0 - 0.035, x1 + 0.035, y1 + 0.035, z0, zp, o.plinthMat || MAT.stone, { top: false, ao: true });
  };
  if (st === 1) {
    const zt = zp + (zw - zp) * 0.4;
    if (g.mode === 'shadow') {
      g.shadowBox(x0, y0, x1, y1, z0, zt);
      return;
    }
    const G = gableGeo(roofO);
    const frame = o.frame !== false;
    plinth();
    openBox(g, x0, y0, x1, y1, zp, zt, wall);
    if (frame) {
      postsAlong(g, x0, y0, x1, y0, 0.55, zp, zw);
      postsAlong(g, x0, y0 + 0.01, x0, y1, 0.55, zp, zw);
      g.beam(x0, y0, zw, x1, y0, zw, WOOD, 2.2);
      g.beam(x0, y0, zw, x0, y1, zw, WOOD, 2.2);
      gableRafters(g, G, 'back');
    }
    g.faceR(x1, y0, y1, zp, zt, wall, { ao: !o.plinthH });
    g.faceL(x0, x1, y1, zp, zt, wall, { ao: !o.plinthH });
    boxRim(g, x0, y0, x1, y1, zt, wall);
    if (frame) {
      postsAlong(g, x1, y0, x1, y1, 0.55, zp, zw);
      postsAlong(g, x0, y1, x1 - 0.01, y1, 0.55, zp, zw);
      g.beam(x1, y0, zw, x1, y1, zw, WOOD, 2.2);
      g.beam(x0, y1, zw, x1, y1, zw, WOOD, 2.2);
      gableRafters(g, G, 'front');
    }
    if (o.scaffold !== false) scaffoldBox(g, x0, y0, x1, y1, zw + 3, { sides: o.scafSides || 'LR' });
    return;
  }
  if (g.mode === 'shadow') {
    g.shadowBox(x0, y0, x1, y1, z0, zw);
    gableRoof(g, roofO);
    return;
  }
  plinth();
  g.box(x0, y0, x1, y1, zp, zw, wall, { top: false, eave: o.eave ?? 6, ao: !o.plinthH, decoL: o.decoL, decoR: o.decoR });
  gableRoof(g, roofO);
  if (st === 2 && o.scaffold !== false) scaffoldBox(g, x0, y0, x1, y1, zw + 4, { sides: o.scafSides2 || 'R' });
}

// ---------------------------------------------------------------------------
// Fondations (stade 0) et sol
// ---------------------------------------------------------------------------

/** Contour 3D (liste de points au sol) d'une emprise relevée. */
function planOutline(p, grow = 0) {
  if (p.k === 'rect') {
    return [[p.x0 - grow, p.y0 - grow], [p.x1 + grow, p.y0 - grow], [p.x1 + grow, p.y1 + grow], [p.x0 - grow, p.y1 + grow]];
  }
  const pts = [];
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI;
    pts.push([p.x + (p.r + grow) * Math.cos(a), p.y + (p.r + grow) * Math.sin(a)]);
  }
  return pts;
}

/** Tache de terre battue aux bords adoucis sous des emprises (sol d'un bâtiment ou d'un chantier). */
export function groundPatch(g, plans, o = {}) {
  if (!g.drawing || !plans.length) return;
  const c = g.ctx;
  const grow = o.grow ?? 0.18;
  c.save();
  c.filter = `blur(${o.blur ?? 2.5}px)`;
  c.fillStyle = o.col || rgba('#8a6a48', o.alpha ?? 0.55);
  for (const p of plans) {
    const pts = planOutline(p, grow).map(([x, y]) => g.P(x, y, 0));
    g.path(p.k === 'rect' ? roundCorners(pts, 6) : pts);
    c.fill();
  }
  c.restore();
  if (o.speckle !== false) {
    // cailloux et brins de paille
    const rnd = g.rng(77, plans.length);
    for (const p of plans) {
      const pts = planOutline(p, grow * 0.6);
      const xs = pts.map((q) => q[0]);
      const ys = pts.map((q) => q[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const n = Math.round((maxX - minX) * (maxY - minY) * (o.density ?? 26));
      for (let i = 0; i < n; i++) {
        const x = minX + rnd() * (maxX - minX);
        const y = minY + rnd() * (maxY - minY);
        if (p.k === 'circle' && Math.hypot(x - p.x, y - p.y) > p.r + grow * 0.5) continue;
        const [sx, sy] = g.P(x, y, 0);
        const k = rnd();
        if (k < 0.45) {
          c.fillStyle = k < 0.2 ? 'rgba(60,40,20,0.35)' : 'rgba(230,210,170,0.45)';
          c.fillRect(sx, sy, 1.4, 0.9);
        } else if (k < 0.62 && o.straw !== false) {
          c.strokeStyle = 'rgba(225,190,100,0.6)';
          c.lineWidth = 0.7;
          c.beginPath();
          c.moveTo(sx, sy);
          c.lineTo(sx + (rnd() - 0.5) * 5, sy + (rnd() - 0.5) * 2);
          c.stroke();
        }
      }
    }
  }
}

function roundCorners(pts, r) {
  // adoucit un losange en ajoutant des points près des coins
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    out.push([p[0] + ((a[0] - p[0]) * r) / da, p[1] + ((a[1] - p[1]) * r) / da]);
    out.push([p[0] + ((b[0] - p[0]) * r) / db, p[1] + ((b[1] - p[1]) * r) / db]);
  }
  return out;
}

/** Piquet de chantier (petit pieu clair à tête pointue). */
function stake(c, sx, sy, h = 9) {
  c.fillStyle = '#c9a676';
  c.beginPath();
  c.moveTo(sx - 1.1, sy);
  c.lineTo(sx - 1.1, sy - h + 2);
  c.lineTo(sx, sy - h);
  c.lineTo(sx + 1.1, sy - h + 2);
  c.lineTo(sx + 1.1, sy);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(80,50,20,0.5)';
  c.fillRect(sx + 0.2, sy - h + 2, 0.9, h - 2);
  c.strokeStyle = 'rgba(60,35,15,0.55)';
  c.lineWidth = 0.6;
  c.stroke();
}

/** Tas de planches posé au sol, allongé selon x ou y. */
export function plankPile(g, x, y, axis = 'x', n = 4, len = 0.55) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.15, y - 0.15, x + 0.15, y + 0.15, 0, n * 1.6);
    return;
  }
  if (!g.drawing) return;
  const w = 0.13;
  for (let i = 0; i < n; i++) {
    const z0 = i * 1.6;
    const off = (i % 2) * 0.03;
    if (axis === 'x') g.box(x - len / 2 + off, y - w, x + len / 2 + off, y + w, z0, z0 + 1.6, MAT.planks, { ao: false, topMat: { col: '#b98d5c', tex: null } });
    else g.box(x - w, y - len / 2 + off, x + w, y + len / 2 + off, z0, z0 + 1.6, MAT.planks, { ao: false, topMat: { col: '#b98d5c', tex: null } });
  }
}

/** Tas de pierres de taille. */
export function stonePile(g, x, y, n = 5, col = '#a9a498') {
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.15, y - 0.15, x + 0.15, y + 0.15, 0, 6);
    return;
  }
  if (!g.drawing) return;
  const rnd = g.rng(x, y, 31);
  const blocks = [];
  for (let i = 0; i < n; i++) {
    const lvl = i < 3 ? 0 : 1;
    blocks.push({ x: x + (rnd() - 0.5) * 0.28, y: y + (rnd() - 0.5) * 0.28, z: lvl * 3.4, s: 0.06 + rnd() * 0.03 });
  }
  blocks.sort((a, b) => a.z - b.z || a.x + a.y - (b.x + b.y));
  for (const b of blocks) g.box(b.x - b.s, b.y - b.s * 0.8, b.x + b.s, b.y + b.s * 0.8, b.z, b.z + 3.4, { col: tone(col, 0.9 + rnd() * 0.2) }, { ao: false });
}

/**
 * Stade 0 : terre battue, tranchées, piquets, cordeau, quelques matériaux et un fanion d'équipe.
 * o : { stone (première assise de pierres), planks, logs, flag }
 */
export function foundation(g, plans, o = {}) {
  if (g.mode === 'shadow') {
    plankPile(g, 0, 0, 'x', 1);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  groundPatch(g, plans, { alpha: 0.75, col: rgba('#7d5f40', 0.8), grow: 0.12, blur: 1.5, density: 40 });
  // tranchées : contour sombre des murs futurs
  for (const p of plans) {
    const pts = planOutline(p, -0.02).map(([x, y]) => g.P(x, y, 0));
    g.path(pts);
    c.strokeStyle = 'rgba(55,35,18,0.55)';
    c.lineWidth = 3.2;
    c.stroke();
    c.strokeStyle = 'rgba(200,170,120,0.35)';
    c.lineWidth = 1;
    c.stroke();
  }
  // première assise de pierres (bâtiments maçonnés)
  if (o.stone) {
    for (const p of plans) {
      const pts = planOutline(p, -0.02);
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        if (i % 3 === 2) continue;
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % n];
        const segs = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 0.22));
        for (let j = 0; j < segs; j++) {
          if ((i * 7 + j) % 5 === 4) continue;
          const t = (j + 0.5) / segs;
          const x = ax + (bx - ax) * t;
          const y = ay + (by - ay) * t;
          g.box(x - 0.08, y - 0.08, x + 0.08, y + 0.08, 0, 3, MAT.stone, { ao: false });
        }
      }
    }
  }
  // piquets et cordeau
  const stakes = [];
  for (const p of plans) {
    const pts = planOutline(p, 0.1);
    const step = p.k === 'rect' ? 1 : 2;
    const ring = [];
    for (let i = 0; i < pts.length; i += step) ring.push(pts[i]);
    const scr = ring.map(([x, y]) => g.P(x, y, 0));
    c.strokeStyle = rgba(CORD, 0.9);
    c.lineWidth = 0.8;
    c.beginPath();
    scr.forEach(([sx, sy], i) => (i ? c.lineTo(sx, sy - 6) : c.moveTo(sx, sy - 6)));
    c.closePath();
    c.stroke();
    for (const q of ring) stakes.push(q);
  }
  stakes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of stakes) {
    const [sx, sy] = g.P(x, y, 0);
    stake(c, sx, sy, 9);
  }
  // matériaux au bord du chantier
  const s = g.size / 2;
  plankPile(g, s * 0.55, s * 0.78, 'x', 3, Math.min(0.7, 0.3 + s * 0.15));
  if (o.stone || g.size >= 3) stonePile(g, s * 0.8, s * 0.3, 5);
  if (o.logs !== false) logPileSmall(g, -s * 0.2, s * 0.8);
}

/** Petit tas de rondins (chantier). */
function logPileSmall(g, x, y) {
  if (!g.drawing) return;
  const c = g.ctx;
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = g.P(x - 0.25, y + i * 0.06, i === 2 ? 3 : 0);
    const [bx, by] = g.P(x + 0.25, y + i * 0.06, i === 2 ? 3 : 0);
    stick(c, ax + (i === 2 ? 2 : 0), ay - 1.5, bx + (i === 2 ? 2 : 0), by - 1.5, '#8a6440', 3);
    c.fillStyle = '#d8b47e';
    c.beginPath();
    c.ellipse(bx + (i === 2 ? 2 : 0) + 0.5, by - 1.5, 1.4, 1.7, 0, 0, 2 * PI);
    c.fill();
  }
}

// ---------------------------------------------------------------------------
// Palissades de pieux
// ---------------------------------------------------------------------------

const stakeSprites = new Map();
/** Sprite d'un pieu pointu (mis en cache) : largeur w, hauteur h. */
function stakeSprite(h, col) {
  const key = h + col;
  let s = stakeSprites.get(key);
  if (s) return s;
  const w = 5;
  const cv = document.createElement('canvas');
  cv.width = w + 2;
  cv.height = h + 2;
  const c = cv.getContext('2d');
  const gr = c.createLinearGradient(1, 0, w + 1, 0);
  gr.addColorStop(0, tone(col, 1.2));
  gr.addColorStop(0.4, col);
  gr.addColorStop(1, tone(col, 0.55));
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(1, h + 1);
  c.lineTo(1, 5);
  c.lineTo(1 + w / 2, 1);
  c.lineTo(1 + w, 5);
  c.lineTo(1 + w, h + 1);
  c.closePath();
  c.fill();
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 0.8;
  c.stroke();
  // pointe taillée plus claire
  c.fillStyle = 'rgba(240,210,160,0.55)';
  c.beginPath();
  c.moveTo(1.5, 5);
  c.lineTo(1 + w / 2, 1.5);
  c.lineTo(1 + w * 0.55, 5.5);
  c.closePath();
  c.fill();
  // écorce
  c.fillStyle = 'rgba(40,20,5,0.3)';
  for (let y = 8; y < h; y += 5) c.fillRect(2 + ((y * 3) % 3), y, 1.6, 0.7);
  s = { cv, w: w + 2, h: h + 2 };
  stakeSprites.set(key, s);
  return s;
}

/** Pieux de palissade aux points (x, y) donnés (triés par profondeur), hauteur moyenne h. */
export function stakes(g, pts, h, o = {}) {
  const col = o.col || '#8a6440';
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    // ombre par petits tronçons
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[Math.min(pts.length - 1, i + 2)];
      g.shadowOf([[ax, ay, 0], [bx, by, 0], [ax, ay, h], [bx, by, h]]);
    }
    return;
  }
  const c = g.ctx;
  const z0 = o.z0 ?? 0;
  const list = pts.map((p, i) => ({ p, i, d: p[0] + p[1] }));
  list.sort((a, b) => a.d - b.d);
  for (const { p, i } of list) {
    const hh = Math.round(h * (0.85 + ((i * 37) % 11) / 36));
    const s = stakeSprite(hh, col);
    const [sx, sy] = g.P(p[0], p[1], z0);
    c.drawImage(s.cv, Math.round(sx - s.w / 2), Math.round(sy - s.h + 1.5));
  }
}

/** Points régulièrement espacés sur un segment. */
export function linePts(xa, ya, xb, yb, step = 0.13) {
  const L = Math.hypot(xb - xa, yb - ya);
  const n = Math.max(1, Math.round(L / step));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([xa + ((xb - xa) * i) / n, ya + ((yb - ya) * i) / n]);
  return pts;
}

/** Points sur un arc de cercle (angles monde a0 → a1, en radians). */
export function arcPts(cx, cy, r, a0, a1, step = 0.13) {
  const n = Math.max(1, Math.round((Math.abs(a1 - a0) * r) / step));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Clôture de clayonnage (osier tressé) le long d'une polyligne. */
export function wickerFence(g, pts, h = 8, o = {}) {
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    for (let i = 0; i + 1 < pts.length; i++) g.shadowOf([[...pts[i], 0], [...pts[i + 1], 0], [...pts[i], h], [...pts[i + 1], h]]);
    return;
  }
  const segs = [];
  for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1]]);
  segs.sort((a, b) => a[0][0] + a[0][1] + a[1][0] + a[1][1] - (b[0][0] + b[0][1] + b[1][0] + b[1][1]));
  const c = g.ctx;
  for (const [[ax, ay], [bx, by]] of segs) {
    // panneau plan quelconque : repère u le long du segment, v vers le bas
    const pa = g.P(ax, ay, h);
    const pb = g.P(bx, by, h);
    const lu = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const U = [(pb[0] - pa[0]) / lu, (pb[1] - pa[1]) / lu];
    const nx = by - ay;
    const ny = -(bx - ax);
    // luminosité selon l'orientation de la normale (vers +y : 0.86, vers +x : 0.66)
    const L = Math.hypot(nx, ny) || 1;
    const k = 0.76 + 0.1 * (Math.abs(ny) - Math.abs(nx)) / L;
    g.plane(pa, U, [0, 1], lu, h, MAT.wicker, k, { ao: false });
    g.outline([pa, pb, g.P(bx, by, 0), g.P(ax, ay, 0)], tone(MAT.wicker.col, k), 0.45);
  }
  // piquets dépassant
  const list = pts.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of list) {
    const [sx, sy] = g.P(x, y, 0);
    postScreen(c, sx, sy, h + 2.5, 1.8, o.post || '#7a5a36');
  }
}

/** Clôture de perches (Francs) : poteaux et deux lisses. */
export function railFence(g, pts, h = 9, o = {}) {
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    for (let i = 0; i + 1 < pts.length; i++) g.shadowOf([[...pts[i], h * 0.4], [...pts[i + 1], h * 0.4], [...pts[i], h], [...pts[i + 1], h]]);
    return;
  }
  const col = o.col || '#8c6a44';
  const list = pts.slice();
  for (let i = 0; i + 1 < list.length; i++) {
    const [ax, ay] = list[i];
    const [bx, by] = list[i + 1];
    g.beam(ax, ay, h * 0.45, bx, by, h * 0.45, col, 1.5);
    g.beam(ax, ay, h * 0.85, bx, by, h * 0.85, col, 1.5);
  }
  const sorted = list.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of sorted) g.post(x, y, 0, h + 1, tone(col, 0.9), 2);
}

// ---------------------------------------------------------------------------
// Remparts circulaires (murus gallicus) et parapets
// ---------------------------------------------------------------------------

/**
 * Rempart circulaire : part 'back' (face intérieure et chemin de ronde arrière) ou 'front'
 * (chemin de ronde et parement avant). o : { x, y, R (rayon extérieur), t (épaisseur), h, mat, gate: [t0, t1] }
 */
export function ringWall(g, o, part) {
  const x = o.x ?? 0;
  const y = o.y ?? 0;
  const { R, t, mat } = o;
  const h = g.stage === 1 ? o.h * 0.45 : o.h;
  const ri = R - t;
  if (g.mode === 'plan') {
    if (part === 'back') g.planCircle(x, y, R - t / 2);
    return;
  }
  if (g.mode === 'shadow') {
    if (part === 'front') {
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * 2 * PI;
        const a1 = ((i + 1) / 16) * 2 * PI;
        g.shadowOf([
          [x + R * Math.cos(a0), y + R * Math.sin(a0), 0], [x + R * Math.cos(a1), y + R * Math.sin(a1), 0],
          [x + R * Math.cos(a0), y + R * Math.sin(a0), h], [x + R * Math.cos(a1), y + R * Math.sin(a1), h],
        ]);
      }
    }
    return;
  }
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  const rxo = R * RX;
  const ryo = R * RY;
  const rxi = ri * RX;
  const ryi = ri * RY;
  const gate = o.gate; // [tg0, tg1] angles écran de l'ouverture (dans ]0, π[)
  const clipGate = () => {
    if (!gate) return;
    const xa = X + rxo * Math.cos(gate[1]);
    const xb = X + rxo * Math.cos(gate[0]);
    c.beginPath();
    c.rect(X - rxo - 5, Y - h - ryo - 5, xa - (X - rxo - 5), ryo * 2 + h + 10);
    c.rect(xb, Y - h - ryo - 5, X + rxo + 5 - xb, ryo * 2 + h + 10);
    c.clip();
  };
  if (part === 'back') {
    // face intérieure de la moitié arrière
    c.save();
    c.beginPath();
    c.moveTo(X - rxi, Y - h);
    c.ellipse(X, Y - h, rxi, ryi, 0, PI, 2 * PI, false);
    c.lineTo(X + rxi, Y);
    c.ellipse(X, Y, rxi, ryi, 0, 2 * PI, PI, true);
    c.closePath();
    c.clip();
    c.fillStyle = mat.col;
    c.fillRect(X - rxi - 2, Y - h - ryi - 2, rxi * 2 + 4, h + ryi * 2 + 4);
    innerCourses(c, X, Y, rxi, ryi, h, g.rng(x, y, R, 5), mat);
    c.globalCompositeOperation = 'multiply';
    const gr = c.createLinearGradient(X - rxi, 0, X + rxi, 0);
    gr.addColorStop(0, mulCol(0.58));
    gr.addColorStop(1, mulCol(0.86));
    c.fillStyle = gr;
    c.fillRect(X - rxi - 2, Y - h - ryi - 2, rxi * 2 + 4, h + ryi * 2 + 4);
    c.restore();
    // chemin de ronde arrière (moitié haute de l'anneau)
    c.save();
    c.beginPath();
    c.rect(X - rxo - 2, Y - h - ryo - 2, rxo * 2 + 4, ryo + 2);
    c.clip();
    ringTop(g, c, X, Y - h, rxo, ryo, rxi, ryi, mat);
    c.restore();
    return;
  }
  // moitié avant : parement extérieur puis chemin de ronde
  c.save();
  clipGate();
  g.cyl(x, y, R, 0, h, mat, { ao: true });
  c.beginPath();
  c.rect(X - rxo - 2, Y - h, rxo * 2 + 4, ryo + 2);
  c.clip();
  ringTop(g, c, X, Y - h, rxo, ryo, rxi, ryi, mat);
  c.restore();
}

function innerCourses(c, X, Y, rx, ry, h, rnd, mat) {
  c.strokeStyle = rgba(tone(mat.col, 0.5), 0.6);
  c.lineWidth = 0.8;
  for (let z = 3; z < h; z += 3.5 + rnd() * 1.2) {
    c.beginPath();
    c.ellipse(X, Y - z, rx, ry, 0, PI, 2 * PI);
    c.stroke();
  }
  c.fillStyle = rgba(tone(mat.col, 0.5), 0.6);
  for (let i = 0; i < rx * h * 0.05; i++) {
    const t = PI + rnd() * PI;
    const z = rnd() * h;
    c.fillRect(X + rx * Math.cos(t), Y - z + ry * Math.sin(t), 0.8, 3);
  }
  if (mat.beams) {
    for (let z = 5; z < h - 2; z += mat.by || 10) {
      for (let t = PI + 0.15; t < 2 * PI - 0.1; t += 0.22) {
        const s = -Math.sin(t);
        const px = X + rx * Math.cos(t);
        const py = Y - z + ry * Math.sin(t);
        c.fillStyle = '#4a2f18';
        c.fillRect(px - 1.8 * s, py - 1.8, 3.6 * s, 3.6);
        c.fillStyle = '#9a7048';
        c.fillRect(px - 1.2 * s, py - 1.2, 2.4 * s, 2.4);
      }
    }
  }
}

function ringTop(g, c, X, Yt, rxo, ryo, rxi, ryi, mat) {
  c.beginPath();
  c.ellipse(X, Yt, rxo, ryo, 0, 0, 2 * PI);
  c.ellipse(X, Yt, rxi, ryi, 0, 0, 2 * PI, true);
  c.fillStyle = tone(mat.col, 1.06);
  c.fill('evenodd');
  c.strokeStyle = ink(mat.col, 0.45);
  c.lineWidth = 0.8;
  c.stroke();
  // pierres du dessus
  c.strokeStyle = rgba(tone(mat.col, 0.6), 0.5);
  c.beginPath();
  c.ellipse(X, Yt, (rxo + rxi) / 2, (ryo + ryi) / 2, 0, 0, 2 * PI);
  c.stroke();
}

/** Merlons (créneaux) le long des bords d'un rectangle au sommet z. */
export function crenels(g, x0, y0, x1, y1, z, mat, o = {}) {
  const t = o.t ?? 0.11;
  const h = o.h ?? 6;
  const mw = o.mw ?? 0.15;
  const gap = o.gap ?? 0.13;
  const hp = o.hp ?? 2.5; // parapet continu sous les merlons
  const boxes = [];
  const along = (a, b) => {
    const L = b - a;
    const n = Math.max(1, Math.round((L + gap) / (mw + gap)));
    const out = [];
    const sp = (L - mw) / Math.max(1, n - 1);
    for (let i = 0; i < n; i++) out.push(a + i * sp);
    return out;
  };
  for (const xs of along(x0, x1)) {
    boxes.push([xs, y0, xs + mw, y0 + t]);
    boxes.push([xs, y1 - t, xs + mw, y1]);
  }
  for (const ys of along(y0 + t, y1 - t - mw + mw)) {
    if (ys + mw > y1 - t + 1e-6) continue;
    boxes.push([x0, ys, x0 + t, ys + mw]);
    boxes.push([x1 - t, ys, x1, ys + mw]);
  }
  if (g.mode === 'shadow') {
    g.shadowBox(x0, y0, x1, y1, z, z + h);
    return;
  }
  if (!g.drawing) return;
  // parapet bas : arrière puis avant
  if (hp > 0) {
    g.box(x0, y0, x1, y0 + t, z, z + hp, mat, { ao: false });
    g.box(x0, y0 + t, x0 + t, y1 - t, z, z + hp, mat, { ao: false });
  }
  const back = boxes.filter((b) => b[1] < y0 + t + 1e-6 || b[0] < x0 + t + 1e-6);
  const front = boxes.filter((b) => !back.includes(b));
  const key = (b) => b[0] + b[2] + b[1] + b[3];
  back.sort((a, b) => key(a) - key(b));
  front.sort((a, b) => key(a) - key(b));
  for (const b of back) g.box(b[0], b[1], b[2], b[3], z + hp, z + hp + h, mat, { ao: false });
  if (o.between) o.between();
  if (hp > 0) {
    g.box(x1 - t, y0 + t, x1, y1 - t, z, z + hp, mat, { ao: false });
    g.box(x0, y1 - t, x1, y1, z, z + hp, mat, { ao: false });
  }
  for (const b of front) g.box(b[0], b[1], b[2], b[3], z + hp, z + hp + h, mat, { ao: false });
}

/** Parapet crénelé circulaire au sommet d'une tour ronde (rayon r, hauteur z). */
export function roundCrenels(g, x, y, r, z, mat, o = {}) {
  const h = o.h ?? 8;
  const n = o.n ?? 12;
  const depth = o.depth ?? 4;
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r, z, z + h);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(x, y, 0);
  const rx = r * RX;
  const ry = r * RY;
  const ri = r - (o.t ?? 0.1);
  const rxi = ri * RX;
  const ryi = ri * RY;
  const notches = (back) => {
    // découpe des créneaux (rectangles écran) — renvoie un chemin à exclure
    c.beginPath();
    c.rect(X - rx - 3, Y - z - h - ry - 3, rx * 2 + 6, h + ry * 2 + 6);
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * 2 * PI;
      const s = Math.sin(t);
      if (back ? s > 0 : s < 0) continue;
      const hw = (0.5 * PI) / n;
      const xa = X + rx * Math.cos(t + hw);
      const xb = X + rx * Math.cos(t - hw);
      const yTop = Y - z - h + ry * s;
      c.rect(Math.min(xa, xb), yTop - 3, Math.abs(xb - xa), depth + 3);
    }
  };
  // arrière : face intérieure du parapet
  c.save();
  notches(true);
  c.clip('evenodd');
  c.save();
  c.beginPath();
  c.moveTo(X - rxi, Y - z - h);
  c.ellipse(X, Y - z - h, rxi, ryi, 0, PI, 2 * PI, false);
  c.lineTo(X + rxi, Y - z);
  c.ellipse(X, Y - z, rxi, ryi, 0, 2 * PI, PI, true);
  c.closePath();
  const gr = c.createLinearGradient(X - rxi, 0, X + rxi, 0);
  gr.addColorStop(0, tone(mat.col, 0.55));
  gr.addColorStop(1, tone(mat.col, 0.85));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = ink(mat.col, 0.45);
  c.lineWidth = 0.8;
  c.stroke();
  c.restore();
  c.restore();
  // sol du chemin de ronde
  c.fillStyle = tone(mat.col, 0.92);
  c.beginPath();
  c.ellipse(X, Y - z, rxi, ryi, 0, 0, 2 * PI);
  c.fill();
  if (o.inside) o.inside();
  // avant : parement extérieur crénelé
  c.save();
  notches(false);
  c.clip('evenodd');
  g.cyl(x, y, r, z, z + h, mat, { ao: false });
  c.restore();
  // dessus des merlons (liseré clair)
  c.strokeStyle = rgba(tone(mat.col, 1.2), 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(X, Y - z - h + 0.5, rx - 0.5, ry - 0.3, 0, 0, 2 * PI);
  c.stroke();
}

export { hull };
