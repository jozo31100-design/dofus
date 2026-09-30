// Pièces communes des bâtiments égyptiens : matériaux (grès doré, briques crues, plâtre), corniche à gorge, colonnes
// papyriformes, obélisques, troncs de pyramide, palmiers, bassins, hiéroglyphes et disque solaire ailé peints sur les faces.
// Tous les dessins sont déterministes (aucun Math.random) ; chaque pièce gère les trois passes (plan, ombre, peinture).
import { MAT, tone, rgba, ink, texStone, ctexStone, K_LEFT, K_RIGHT, HX, HY } from './building-gfx.js';

const PI = Math.PI;

export const SAND = { col: '#dcc088', tex: texStone, ctex: ctexStone, rh: 6, sw: 15, tile: true, rows: true };
export const SAND_L = { col: '#ecd9a8', tex: texStone, ctex: ctexStone, rh: 6, sw: 16, tile: true, rows: true };
export const SAND_D = { col: '#c6a46a', tex: texStone, ctex: ctexStone, rh: 5, sw: 12, tile: true, rows: true };
export const BRICK = { col: '#c29563', tex: texStone, ctex: ctexStone, rh: 4, sw: 9, tile: true, rows: true };
export const PLASTER = { col: '#efe3c4', tex: MAT.plaster.tex, tile: true, dirt: true };
export const FLOOR = { col: '#cbb07a' };
export const DARK = { col: '#2b1d13' };
export const GOLD = '#e6b93c';
export const GOLD_D = '#8a5f12';
export const LAPIS = '#2d55a8';
export const TURQ = '#2fa8a0';
export const RED = '#b8452e';
export const GREEN = '#4c8a3c';

const hashN = (...v) => {
  let h = 2166136261;
  for (const x of v) {
    h ^= Math.floor(x * 131) + 0x9e37;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------
// Décors peints sur une face (repère local : u vers la droite, v vers le bas)
// ---------------------------------------------------------------------------

/** Petit hiéroglyphe n° k centré en (u, v), taille s. */
function glyph(c, k, u, v, s) {
  switch (k % 9) {
    case 0: // ankh
      c.beginPath();
      c.ellipse(u, v - s * 0.55, s * 0.28, s * 0.36, 0, 0, 2 * PI);
      c.moveTo(u, v - s * 0.2);
      c.lineTo(u, v + s * 0.7);
      c.moveTo(u - s * 0.4, v);
      c.lineTo(u + s * 0.4, v);
      c.stroke();
      break;
    case 1: // œil d'Horus
      c.beginPath();
      c.moveTo(u - s * 0.5, v);
      c.quadraticCurveTo(u, v - s * 0.5, u + s * 0.5, v);
      c.quadraticCurveTo(u, v + s * 0.25, u - s * 0.5, v);
      c.stroke();
      c.beginPath();
      c.arc(u, v - s * 0.05, s * 0.14, 0, 2 * PI);
      c.fill();
      break;
    case 2: // oiseau
      c.beginPath();
      c.ellipse(u, v, s * 0.4, s * 0.22, -0.3, 0, 2 * PI);
      c.fill();
      c.beginPath();
      c.moveTo(u + s * 0.25, v - s * 0.1);
      c.lineTo(u + s * 0.5, v - s * 0.45);
      c.moveTo(u - s * 0.1, v + s * 0.2);
      c.lineTo(u - s * 0.1, v + s * 0.55);
      c.stroke();
      break;
    case 3: // eau
      c.beginPath();
      c.moveTo(u - s * 0.5, v - s * 0.15);
      c.lineTo(u - s * 0.25, v + s * 0.15);
      c.lineTo(u, v - s * 0.15);
      c.lineTo(u + s * 0.25, v + s * 0.15);
      c.lineTo(u + s * 0.5, v - s * 0.15);
      c.stroke();
      break;
    case 4: // roseau
      c.beginPath();
      c.moveTo(u, v + s * 0.6);
      c.lineTo(u, v - s * 0.4);
      c.moveTo(u - s * 0.25, v - s * 0.1);
      c.quadraticCurveTo(u, v - s * 0.7, u + s * 0.25, v - s * 0.1);
      c.stroke();
      break;
    case 5: // disque solaire
      c.beginPath();
      c.arc(u, v, s * 0.36, 0, 2 * PI);
      c.stroke();
      c.beginPath();
      c.arc(u, v, s * 0.1, 0, 2 * PI);
      c.fill();
      break;
    case 6: // serpent
      c.beginPath();
      c.moveTo(u - s * 0.5, v + s * 0.3);
      c.bezierCurveTo(u - s * 0.3, v - s * 0.4, u, v + s * 0.5, u + s * 0.3, v - s * 0.2);
      c.stroke();
      break;
    case 7: // pain
      c.beginPath();
      c.moveTo(u - s * 0.45, v + s * 0.3);
      c.quadraticCurveTo(u, v - s * 0.6, u + s * 0.45, v + s * 0.3);
      c.closePath();
      c.stroke();
      break;
    default: // colonne djed
      c.beginPath();
      c.moveTo(u, v - s * 0.55);
      c.lineTo(u, v + s * 0.55);
      for (const d of [-0.35, -0.12, 0.11]) {
        c.moveTo(u - s * 0.3, v + s * d);
        c.lineTo(u + s * 0.3, v + s * d);
      }
      c.stroke();
  }
}

/** Frise de hiéroglyphes peints : rangées de signes colorés. o = { rows, size, cols[], a } */
export function glyphBand(c, u0, u1, v, o = {}) {
  const rows = o.rows ?? 1;
  const s = o.size ?? 4.4;
  const cols = o.cols || ['#5a3a1c', '#2d55a8', '#b8452e', '#2a8a82'];
  c.save();
  c.globalAlpha = o.a ?? 0.85;
  c.lineWidth = 0.7;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let r = 0; r < rows; r++) {
    let i = 0;
    for (let u = u0 + s * 0.7; u < u1 - s * 0.4; u += s * 1.2, i++) {
      const k = Math.floor(hashN(u0, r, i, o.seed || 0) * 97);
      c.strokeStyle = cols[k % cols.length];
      c.fillStyle = cols[k % cols.length];
      glyph(c, k, u, v + r * s * 1.45, s);
    }
  }
  c.restore();
}

/** Disque solaire ailé (gold, lapis, turquoise) centré en (u, v), envergure totale 2·span. */
export function winged(c, u, v, span, o = {}) {
  const s = span / 11;
  c.save();
  c.lineJoin = 'round';
  for (const d of [-1, 1]) {
    [[GOLD, 0, 11, -1.5, 2.8], [o.c2 || LAPIS, 1.2, 9.6, 1.0, 2.5], [TURQ, 2.3, 7.8, 3.4, 2.1]].forEach(([col, oy, L, ey, w]) => {
      c.beginPath();
      c.moveTo(u + d * 2.4 * s, v + oy * s);
      c.quadraticCurveTo(u + d * L * 0.55 * s, v + (oy - 2.6 + ey) * s, u + d * L * s, v + (ey - 0.4) * s);
      c.lineTo(u + d * (L - 1.4) * s, v + (ey + w) * s);
      c.quadraticCurveTo(u + d * L * 0.5 * s, v + (oy + 1.4 + w * 0.3) * s, u + d * 2.4 * s, v + (oy + 1.4) * s);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      c.strokeStyle = GOLD_D;
      c.lineWidth = 0.5;
      c.stroke();
    });
  }
  c.beginPath();
  c.arc(u, v, 3.0 * s, 0, 2 * PI);
  c.fillStyle = '#d8452c';
  c.fill();
  c.strokeStyle = GOLD_D;
  c.lineWidth = 0.7;
  c.stroke();
  c.beginPath();
  c.arc(u, v, 1.4 * s, 0, 2 * PI);
  c.fillStyle = '#ffe27a';
  c.fill();
  c.restore();
}

/** Bande de couleur d'équipe ornée (frise de lotus) le long d'une face : bande pleine + petits triangles d'or. */
export function teamFrieze(c, tc, u0, u1, v, hh = 4) {
  c.fillStyle = tc.main;
  c.fillRect(u0, v, u1 - u0, hh);
  c.fillStyle = tc.dark;
  c.fillRect(u0, v + hh, u1 - u0, 0.8);
  c.fillStyle = GOLD;
  for (let u = u0 + 2; u < u1 - 2; u += 5) {
    c.beginPath();
    c.moveTo(u, v + hh - 0.4);
    c.lineTo(u + 1.6, v + 0.7);
    c.lineTo(u + 3.2, v + hh - 0.4);
    c.fill();
  }
}

// ---------------------------------------------------------------------------
// Volumes
// ---------------------------------------------------------------------------

/** Corniche à gorge : tore de pierre et bandeau d'or sur le pourtour d'un rectangle, au sommet z. */
export function cornice(g, x0, y0, x1, y1, z, o = {}) {
  const d = o.d ?? 0.05;
  g.box(x0 - d, y0 - d, x1 + d, y1 + d, z, z + 3, { col: o.col || '#d9b357' }, { ao: false, quick: true, top: true, topMat: { col: '#e8cc78' } });
  if (o.stripe !== false) g.box(x0 - d * 0.5, y0 - d * 0.5, x1 + d * 0.5, y1 + d * 0.5, z - 2, z, { col: o.stripeCol || LAPIS }, { ao: false, quick: true, top: false });
}

/**
 * Tronc de pyramide à base rectangulaire (x0..x1, y0..y1) de z0 à z1, rétréci de t sur chaque bord.
 * mat : matériau texturé des faces ; o.decoL / o.decoR (c, w, h) : décors locaux ; o.top : matériau du dessus.
 */
export function frustum(g, x0, y0, x1, y1, z0, z1, t, mat, o = {}) {
  if (g.mode === 'plan') {
    if (o.plan !== false) g.planRect(x0, y0, x1, y1);
    return;
  }
  const tp = [[x0 + t, y0 + t], [x1 - t, y0 + t], [x1 - t, y1 - t], [x0 + t, y1 - t]];
  if (g.mode === 'shadow') {
    if (o.shadow === false) return;
    g.shadowOf([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], ...tp.map(([x, y]) => [x, y, z1])]);
    return;
  }
  if (!g.drawing || z1 <= z0) return;
  const pad = 40 * t + 3;
  const H = z1 - z0 + pad;
  const W = (x1 - x0) * HX + 4;
  // face « gauche » (normale +y) : O en haut à gauche du rectangle englobant, U = [1, 0.5], V = [0, 1]
  {
    const O = g.P(x0, y1, z1 + pad);
    const loc = (x, y, z) => {
      const S = g.P(x, y, z);
      const u = S[0] - O[0];
      return [u, S[1] - O[1] - 0.5 * u];
    };
    const pts = [loc(x0, y1, z0), loc(x1, y1, z0), loc(x1 - t, y1 - t, z1), loc(x0 + t, y1 - t, z1)];
    g.plane(O, [1, 0.5], [0, 1], W, H, mat, o.kL ?? K_LEFT, {
      ao: false,
      shape: (c) => {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < 4; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
      },
      deco: o.decoL ? (c) => o.decoL(c, W, H - pad, pad) : null,
    });
    g.outline([g.P(x0, y1, z0), g.P(x1, y1, z0), g.P(x1 - t, y1 - t, z1), g.P(x0 + t, y1 - t, z1)], mat.col, 0.5);
  }
  // face « droite » (normale +x)
  {
    const O = g.P(x1, y1, z1 + pad);
    const Wr = (y1 - y0) * HX + 4;
    const loc = (x, y, z) => {
      const S = g.P(x, y, z);
      const u = S[0] - O[0];
      return [u, S[1] - O[1] + 0.5 * u];
    };
    const pts = [loc(x1, y1, z0), loc(x1, y0, z0), loc(x1 - t, y0 + t, z1), loc(x1 - t, y1 - t, z1)];
    g.plane(O, [1, -0.5], [0, 1], Wr, H, mat, o.kR ?? K_RIGHT, {
      ao: false,
      shape: (c) => {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < 4; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
      },
      deco: o.decoR ? (c) => o.decoR(c, Wr, H - pad, pad) : null,
    });
    g.outline([g.P(x1, y1, z0), g.P(x1, y0, z0), g.P(x1 - t, y0 + t, z1), g.P(x1 - t, y1 - t, z1)], mat.col, 0.5);
  }
  if (o.top !== false) g.faceTop(x0 + t, y0 + t, x1 - t, y1 - t, z1, o.topMat || SAND_L);
}

/** Pyramide lisse : faces en polygones, assises horizontales, pyramidion d'or. o = { col, cap, courses, r1 (tronquée), z1 } */
export function pyramid(g, cx, cy, r0, z0, H, o = {}) {
  const r1 = o.r1 ?? 0;
  const zt = z0 + H;
  if (g.mode === 'plan') {
    if (o.plan !== false) g.planRect(cx - r0, cy - r0, cx + r0, cy + r0);
    return;
  }
  const corners = [[cx - r0, cy - r0], [cx + r0, cy - r0], [cx + r0, cy + r0], [cx - r0, cy + r0]];
  const apex = [cx, cy];
  if (g.mode === 'shadow') {
    const top = r1 > 0 ? [[cx - r1, cy - r1], [cx + r1, cy - r1], [cx + r1, cy + r1], [cx - r1, cy + r1]] : [apex];
    g.shadowOf([...corners.map(([x, y]) => [x, y, z0]), ...top.map(([x, y]) => [x, y, zt])]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const col = o.col || '#e2c98e';
  const face = (A, B, TA, TB, k, shadeDir) => {
    const a = g.P(A[0], A[1], z0);
    const b = g.P(B[0], B[1], z0);
    const ta = g.P(TA[0], TA[1], zt);
    const tb = g.P(TB[0], TB[1], zt);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.lineTo(tb[0], tb[1]);
    if (r1 > 0) c.lineTo(ta[0], ta[1]);
    c.closePath();
    const gr = c.createLinearGradient(a[0], 0, b[0], 0);
    gr.addColorStop(0, tone(col, k * (shadeDir > 0 ? 1.08 : 1.0)));
    gr.addColorStop(1, tone(col, k * (shadeDir > 0 ? 0.92 : 0.84)));
    c.fillStyle = gr;
    c.fill();
    c.save();
    c.clip();
    // assises
    const n = o.courses ?? Math.max(8, Math.round(H / 7));
    c.strokeStyle = rgba(tone(col, k * 0.66), 0.5);
    c.lineWidth = 0.7;
    c.beginPath();
    for (let i = 1; i < n; i++) {
      const f = i / n;
      const pa = [a[0] + (ta[0] - a[0]) * f, a[1] + (ta[1] - a[1]) * f];
      const pb = [b[0] + (tb[0] - b[0]) * f, b[1] + (tb[1] - b[1]) * f];
      c.moveTo(pa[0], pa[1]);
      c.lineTo(pb[0], pb[1]);
    }
    c.stroke();
    // joints verticaux décalés
    c.strokeStyle = rgba(tone(col, k * 0.72), 0.32);
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const f0 = i / n;
      const f1 = (i + 1) / n;
      const steps = Math.max(2, Math.round((1 - (f0 + f1) / 2) * 10 * (r0 * 1.2)));
      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5 + (i % 2) * 0.5) / (steps + 0.5);
        const p0 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const q0 = [ta[0] + (tb[0] - ta[0]) * t, ta[1] + (tb[1] - ta[1]) * t];
        c.moveTo(p0[0] + (q0[0] - p0[0]) * f0, p0[1] + (q0[1] - p0[1]) * f0);
        c.lineTo(p0[0] + (q0[0] - p0[0]) * f1, p0[1] + (q0[1] - p0[1]) * f1);
      }
    }
    c.stroke();
    c.restore();
    if (o.cap && r1 === 0) {
      // pyramidion d'or : triangle sommital de hauteur o.cap (px)
      const f = 1 - o.cap / H;
      const pa = [a[0] + (ta[0] - a[0]) * f, a[1] + (ta[1] - a[1]) * f];
      const pb = [b[0] + (tb[0] - b[0]) * f, b[1] + (tb[1] - b[1]) * f];
      c.beginPath();
      c.moveTo(pa[0], pa[1]);
      c.lineTo(pb[0], pb[1]);
      c.lineTo(tb[0], tb[1]);
      c.closePath();
      const g2 = c.createLinearGradient(pa[0], 0, pb[0], 0);
      g2.addColorStop(0, tone('#ffe488', k * 1.05));
      g2.addColorStop(1, tone('#c58a22', k * 0.95));
      c.fillStyle = g2;
      c.fill();
      c.strokeStyle = 'rgba(90,60,10,0.8)';
      c.lineWidth = 0.7;
      c.stroke();
    }
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.lineTo(tb[0], tb[1]);
    if (r1 > 0) c.lineTo(ta[0], ta[1]);
    c.closePath();
    c.strokeStyle = ink(col, 0.55);
    c.lineWidth = 1;
    c.stroke();
  };
  const T = (x, y) => (r1 > 0 ? [cx + (x - cx) * (r1 / r0), cy + (y - cy) * (r1 / r0)] : apex);
  // face gauche (normale +y) : coins (x−, y+) → (x+, y+)
  face(corners[3], corners[2], T(...corners[3]), T(...corners[2]), K_LEFT, 1);
  // face droite (normale +x) : coins (x+, y+) → (x+, y−)
  face(corners[2], corners[1], T(...corners[2]), T(...corners[1]), K_RIGHT, -1);
  if (r1 > 0 && o.top !== false) g.faceTop(cx - r1, cy - r1, cx + r1, cy + r1, zt, o.topMat || SAND_L);
}

/** Obélisque : fût effilé de granit rose, pyramidion d'or, colonnes de hiéroglyphes ; base carrée de demi-côté w. */
export function obelisk(g, x, y, h, o = {}) {
  const w = o.w ?? 0.11;
  const wt = w * 0.62;
  const z0 = o.z0 ?? 0;
  const zs = z0 + h;
  const cap = h * 0.11;
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - w, y - w, z0], [x + w, y - w, z0], [x + w, y + w, z0], [x - w, y + w, z0], [x, y, zs + cap]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const col = o.col || '#c98e7a';
  const P = (xx, yy, zz) => g.P(xx, yy, zz);
  const face = (a, b, ta, tb, k) => {
    const pa = P(a[0], a[1], z0);
    const pb = P(b[0], b[1], z0);
    const pta = P(ta[0], ta[1], zs);
    const ptb = P(tb[0], tb[1], zs);
    c.beginPath();
    c.moveTo(pa[0], pa[1]);
    c.lineTo(pb[0], pb[1]);
    c.lineTo(ptb[0], ptb[1]);
    c.lineTo(pta[0], pta[1]);
    c.closePath();
    const gr = c.createLinearGradient(pa[0], 0, pb[0], 0);
    gr.addColorStop(0, tone(col, k * 1.06));
    gr.addColorStop(1, tone(col, k * 0.9));
    c.fillStyle = gr;
    c.fill();
    c.strokeStyle = ink(col, 0.6);
    c.lineWidth = 0.8;
    c.stroke();
    // colonnes de hiéroglyphes gravées
    c.save();
    c.clip();
    c.strokeStyle = rgba(tone(col, k * 0.5), 0.55);
    c.lineWidth = 0.5;
    const nCol = 2;
    for (let i = 0; i < nCol; i++) {
      const t = (i + 0.5) / nCol;
      for (let zz = 0.1; zz < 0.93; zz += 0.045) {
        const cx0 = pa[0] + (pb[0] - pa[0]) * t + (pta[0] - pa[0]) * zz * 0.7;
        const cy0 = pa[1] + (pb[1] - pa[1]) * t + (pta[1] - pa[1]) * zz;
        const kk = Math.floor(hashN(i, zz, x, y) * 5);
        c.beginPath();
        if (kk === 0) c.arc(cx0, cy0, 0.9, 0, 2 * PI);
        else if (kk === 1) {
          c.moveTo(cx0 - 1, cy0);
          c.lineTo(cx0 + 1, cy0);
          c.moveTo(cx0, cy0 - 1);
          c.lineTo(cx0, cy0 + 1.2);
        } else if (kk === 2) {
          c.moveTo(cx0 - 1, cy0 + 0.6);
          c.lineTo(cx0, cy0 - 0.8);
          c.lineTo(cx0 + 1, cy0 + 0.6);
        } else if (kk === 3) c.ellipse(cx0, cy0, 1.1, 0.6, 0, 0, 2 * PI);
        else {
          c.moveTo(cx0, cy0 - 1);
          c.lineTo(cx0, cy0 + 1);
        }
        c.stroke();
      }
    }
    c.restore();
  };
  // socle
  g.box(x - w * 1.35, y - w * 1.35, x + w * 1.35, y + w * 1.35, z0, z0 + 5, SAND_D, { ao: false, quick: true, topMat: { col: '#d6bb80' } });
  face([x - w, y + w], [x + w, y + w], [x - wt, y + wt], [x + wt, y + wt], K_LEFT);
  face([x + w, y + w], [x + w, y - w], [x + wt, y + wt], [x + wt, y - wt], K_RIGHT);
  // pyramidion
  const a = P(x - wt, y + wt, zs);
  const b = P(x + wt, y + wt, zs);
  const d = P(x + wt, y - wt, zs);
  const t = P(x, y, zs + cap);
  for (const [p, q, k] of [[a, b, 1.0], [b, d, 0.78]]) {
    c.beginPath();
    c.moveTo(p[0], p[1]);
    c.lineTo(q[0], q[1]);
    c.lineTo(t[0], t[1]);
    c.closePath();
    const gr = c.createLinearGradient(p[0], 0, q[0], 0);
    gr.addColorStop(0, tone('#ffe488', k));
    gr.addColorStop(1, tone('#c58a22', k));
    c.fillStyle = gr;
    c.fill();
    c.strokeStyle = 'rgba(90,60,10,0.8)';
    c.lineWidth = 0.7;
    c.stroke();
  }
}

/** Colonne papyriforme : fût cannelé (sable), collier, chapiteau en bouton de papyrus vert et turquoise. */
export function column(g, x, y, z0, z1, r = 0.085, o = {}) {
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r * 1.3, z0, z1);
    return;
  }
  if (!g.drawing) return;
  const mat = o.mat || SAND_L;
  const cap = Math.min(9, (z1 - z0) * 0.22);
  g.cyl(x, y, r, z0, z1 - cap, mat, { ao: false });
  // collier peint
  g.cyl(x, y, r * 1.06, z1 - cap - 2.2, z1 - cap, { col: o.ring || LAPIS }, { ao: false });
  // chapiteau : bouton de papyrus qui s'évase
  g.cyl(x, y, r * 1.22, z1 - cap, z1 - cap * 0.45, { col: o.cap || '#5e9a4a' }, { ao: false });
  g.cyl(x, y, r * 1.5, z1 - cap * 0.45, z1, { col: o.cap2 || TURQ }, { ao: false });
  g.box(x - r * 1.7, y - r * 1.7, x + r * 1.7, y + r * 1.7, z1, z1 + 2.4, SAND, { ao: false, quick: true });
}

/** Palmier-dattier : tronc annelé et couronne de palmes arquées. */
export function palm(g, x, y, h = 46, seed = 0) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, 0, h, 0.05);
    g.shadowOf([[x - 0.32, y - 0.12, h], [x + 0.32, y + 0.12, h], [x, y + 0.3, h - 8], [x, y - 0.3, h - 8]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const lean = ((seed * 7) % 5 - 2) * 1.5;
  const tx = px + lean;
  const ty = py - h;
  // tronc : fuseau légèrement courbe
  c.beginPath();
  c.moveTo(px - 2.3, py);
  c.quadraticCurveTo(px + lean * 0.3 - 1.8, py - h * 0.5, tx - 1.3, ty);
  c.lineTo(tx + 1.3, ty);
  c.quadraticCurveTo(px + lean * 0.3 + 1.8, py - h * 0.5, px + 2.3, py);
  c.closePath();
  const gr = c.createLinearGradient(px - 2.5, 0, px + 2.5, 0);
  gr.addColorStop(0, '#a8825a');
  gr.addColorStop(0.5, '#8a6440');
  gr.addColorStop(1, '#5a3e24');
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = 'rgba(50,30,14,0.7)';
  c.lineWidth = 0.7;
  c.stroke();
  c.strokeStyle = 'rgba(40,24,10,0.45)';
  c.lineWidth = 0.6;
  c.beginPath();
  for (let f = 0.1; f < 0.95; f += 0.1) {
    const yy = py - h * f;
    const xx = px + lean * f * f;
    c.moveTo(xx - 2, yy);
    c.lineTo(xx + 2, yy + 0.9);
  }
  c.stroke();
  // régime de dattes
  c.fillStyle = '#7a4a1c';
  c.beginPath();
  c.ellipse(tx + 1.4, ty + 2.6, 1.7, 2.4, 0.2, 0, 2 * PI);
  c.fill();
  // palmes
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = PI * (1.08 + (0.84 * i) / (n - 1));
    const L = 14 + ((i * 5 + seed * 3) % 4) * 1.6;
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.5 + (Math.abs(Math.cos(a)) > 0.5 ? 6 : 1.5);
    const mx = tx + Math.cos(a) * L * 0.55;
    const my = ty + Math.sin(a) * L * 0.85 - 1;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(mx, my, ex, ey);
    c.strokeStyle = 'rgba(28,48,18,0.95)';
    c.lineWidth = 3.4;
    c.stroke();
    c.strokeStyle = i % 2 ? '#5a9a3c' : '#4a8a34';
    c.lineWidth = 2.3;
    c.stroke();
    c.strokeStyle = 'rgba(200,230,150,0.55)';
    c.lineWidth = 0.6;
    c.stroke();
  }
  c.lineCap = 'butt';
}

/** Bassin d'eau : margelle de pierre et miroir d'eau bleu-vert avec reflets et lotus. */
export function pool(g, x0, y0, x1, y1, z = 0) {
  if (g.mode === 'plan') return;
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  g.box(x0 - 0.06, y0 - 0.06, x1 + 0.06, y1 + 0.06, z, z + 3, SAND_L, { ao: false, quick: true, top: true, topMat: { col: '#e4cf98' } });
  const a = g.P(x0, y0, z + 3);
  const b = g.P(x1, y0, z + 3);
  const d = g.P(x1, y1, z + 3);
  const e = g.P(x0, y1, z + 3);
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.lineTo(d[0], d[1]);
  c.lineTo(e[0], e[1]);
  c.closePath();
  const gr = c.createLinearGradient(a[0], a[1], d[0], d[1]);
  gr.addColorStop(0, '#5ab0b8');
  gr.addColorStop(1, '#2f7e98');
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 0.6;
  c.beginPath();
  const m1 = g.P((x0 + x1) / 2, (y0 + y1) / 2, z + 3);
  c.moveTo(m1[0] - 6, m1[1] - 1);
  c.lineTo(m1[0] + 2, m1[1] + 1);
  c.moveTo(m1[0] - 2, m1[1] + 3);
  c.lineTo(m1[0] + 7, m1[1] + 2);
  c.stroke();
  // lotus
  for (const [u, v] of [[0.3, 0.3], [0.7, 0.6]]) {
    const p = g.P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, z + 3);
    c.fillStyle = '#3f8a4a';
    c.beginPath();
    c.ellipse(p[0], p[1], 3, 1.4, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = '#f2b4c8';
    c.beginPath();
    c.ellipse(p[0], p[1] - 1.2, 1.1, 1.6, 0, 0, 2 * PI);
    c.fill();
  }
}

/** Fanion d'équipe en long flamme sur une perche dorée (peint sous forme de pennant). */
export function tallPole(g, x, y, z0, h, len = 18) {
  return { x, y, z0, h, len };
}

export { K_LEFT, K_RIGHT, HX, HY };
