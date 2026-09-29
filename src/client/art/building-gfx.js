// Boîte à outils isométrique des bâtiments (Canvas 2D uniquement).
//
// Repère « monde » d'un sprite : (x, y) en cases, relatives au centre de l'emprise ; z en pixels au-dessus du sol.
// Projection (zoom 1) : sx = ax + (x − y)·32, sy = ay + (x + y)·16 − z.
// Faces visibles d'un prisme : le dessus, la face « gauche » (normale +y) et la face « droite » (normale +x).
// Lumière en haut à gauche : dessus 100 %, gauche ~86 %, droite ~66 % ; ombres portées vers le bas-droite.
//
// Principe d'ombrage : chaque face est d'abord peinte dans ses couleurs « naturelles » (texture, décor),
// puis assombrie d'un coup par un calque en mode « multiply » (légèrement bleuté pour des ombres froides).
// Les décors posés sur une face (portes, boucliers…) reçoivent ainsi automatiquement le bon éclairage.

import { hexToRgb, rgbToHex, mulberry32, team as teamColor } from './palette.js';

export const HX = 32; // demi-largeur d'une case à l'écran
export const HY = 16; // demi-hauteur d'une case à l'écran
export const RX = HX * Math.SQRT2; // demi-axe horizontal (écran) d'un cercle de rayon 1 case
export const RY = HY * Math.SQRT2; // demi-axe vertical (écran)

export const K_TOP = 1;
export const K_LEFT = 0.86;
export const K_RIGHT = 0.66;

/** Ombre portée : déplacement écran par pixel de hauteur (vers le bas-droite). */
export const SH_X = 0.5;
export const SH_Y = 0.2;

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Couleurs
// ---------------------------------------------------------------------------

const toneCache = new Map();
/** Éclaircit (k > 1, lumière chaude) ou assombrit (k < 1, ombre froide) une couleur « #rrggbb ». */
export function tone(c, k) {
  k = Math.round(k * 100) / 100;
  const key = c + k;
  let r = toneCache.get(key);
  if (r === undefined) {
    const [R, G, B] = hexToRgb(c);
    if (k >= 1) {
      const t = Math.min(1, k - 1);
      r = rgbToHex([R + (255 - R) * t, G + (248 - G) * t, B + (225 - B) * t]);
    } else {
      const t = 1 - k;
      r = rgbToHex([R * k + 18 * t, G * k + 16 * t, B * k + 40 * t]);
    }
    toneCache.set(key, r);
  }
  return r;
}

const rgbaCache = new Map();
export function rgba(c, a) {
  const key = c + a;
  let r = rgbaCache.get(key);
  if (r === undefined) {
    const [R, G, B] = hexToRgb(c);
    r = `rgba(${R},${G},${B},${a})`;
    rgbaCache.set(key, r);
  }
  return r;
}

/** Couleur de contour : teinte sombre et translucide de la couleur locale. */
export function ink(c, a = 0.5) {
  return rgba(tone(c, 0.35), a);
}

/** Couleur du calque « multiply » d'une face de luminosité k (ombre légèrement bleutée). */
export function mulCol(k) {
  const t = 1 - k;
  const r = Math.round(255 * k + 8 * t);
  const g = Math.round(255 * k + 14 * t);
  const b = Math.min(255, Math.round(255 * k + 48 * t));
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// Hasard reproductible, géométrie
// ---------------------------------------------------------------------------

/** Hachage de quelques nombres en un entier 32 bits (graine de mulberry32). */
export function hash(...v) {
  let h = 0x811c9dc5;
  for (let i = 0; i < v.length; i++) {
    const n = typeof v[i] === 'string' ? strHash(v[i]) : Math.round(v[i] * 997) | 0;
    h ^= n;
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 15;
  }
  return h >>> 0;
}
function strHash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x5bd1e995) ^ (h >>> 13);
  return h | 0;
}
export const rngOf = (...v) => mulberry32(hash(...v));

/** Enveloppe convexe (chaîne monotone) d'une liste de points [x, y]. */
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  const up = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
}

export function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

// ---------------------------------------------------------------------------
// Textures planes : dessinées dans le repère local d'une face (u vers la droite, v vers le bas),
// en couleurs naturelles. Signature : (c, w, h, rnd, col, m).
// ---------------------------------------------------------------------------

/** Planches verticales. m.pw : largeur moyenne d'une planche. */
export function texPlanks(c, w, h, rnd, col, m = {}) {
  const pw = m.pw || 5;
  const seam = tone(col, 0.5);
  const grain = tone(col, 0.78);
  let u = -rnd() * pw;
  while (u < w) {
    const bw = pw * (0.8 + rnd() * 0.45);
    c.fillStyle = tone(col, 0.9 + rnd() * 0.2);
    c.fillRect(u, -1, bw, h + 2);
    c.fillStyle = grain;
    c.globalAlpha = 0.35;
    for (let k = 0; k < 2; k++) c.fillRect(u + 1 + rnd() * (bw - 2), rnd() * h * 0.5, 0.6, h * (0.3 + rnd() * 0.5));
    c.globalAlpha = 1;
    c.fillStyle = seam;
    c.fillRect(u, -1, 0.9, h + 2);
    c.fillStyle = 'rgba(255,240,210,0.14)';
    c.fillRect(u + 0.9, -1, 0.7, h + 2);
    if (rnd() < 0.22) {
      c.fillStyle = seam;
      c.beginPath();
      c.ellipse(u + bw * 0.5, 2 + rnd() * (h - 4), 0.8, 1.3, 0, 0, 7);
      c.fill();
    }
    u += bw;
  }
  if (m.battens) {
    // traverses horizontales clouées
    c.fillStyle = tone(col, 0.8);
    for (const f of m.battens) {
      c.fillRect(-1, h * f - 1.2, w + 2, 2.4);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(-1, h * f + 1.2, w + 2, 0.7);
      c.fillStyle = tone(col, 0.8);
    }
  }
}

/** Rondins horizontaux (mur de rondins). */
export function texLogsH(c, w, h, rnd, col, m = {}) {
  const lh = m.lh || 4.5;
  for (let v = h; v > -lh; v -= lh) {
    const g = c.createLinearGradient(0, v - lh, 0, v);
    g.addColorStop(0, tone(col, 1.12));
    g.addColorStop(0.55, col);
    g.addColorStop(1, tone(col, 0.62));
    c.fillStyle = g;
    c.fillRect(-1, v - lh, w + 2, lh);
    c.fillStyle = 'rgba(40,20,5,0.45)';
    c.fillRect(-1, v - 0.8, w + 2, 0.8);
    if (rnd() < 0.5) {
      c.fillStyle = tone(col, 0.7);
      c.fillRect(rnd() * w, v - lh * 0.6, 3 + rnd() * 5, 0.6);
    }
  }
}

/** Assises de pierres taillées. m.rh : hauteur d'assise, m.sw : longueur moyenne. */
export function texStone(c, w, h, rnd, col, m = {}) {
  const rh = m.rh || 5;
  const sw = m.sw || 10;
  c.fillStyle = tone(col, 0.62);
  c.fillRect(-1, -1, w + 2, h + 2);
  for (let v = h; v > -rh; v -= rh) {
    let u = -rnd() * sw;
    while (u < w) {
      const bw = sw * (0.55 + rnd() * 0.9);
      c.fillStyle = tone(col, 0.86 + rnd() * 0.26);
      rrect(c, u + 0.55, v - rh + 0.6, bw - 1.1, rh - 1.15, 1.2);
      c.fill();
      c.fillStyle = 'rgba(255,250,235,0.22)';
      c.fillRect(u + 1.2, v - rh + 0.65, bw - 2.4, 0.75);
      u += bw;
    }
  }
  if (m.moss) {
    c.fillStyle = 'rgba(90,110,50,0.22)';
    for (let i = 0; i < w * h / 160; i++) {
      c.beginPath();
      c.ellipse(rnd() * w, h - rnd() * rnd() * h, 2 + rnd() * 3, 1 + rnd() * 1.5, 0, 0, 7);
      c.fill();
    }
  }
}

/** Pierres sèches plates et irrégulières (murets gaulois). */
export function texDryStone(c, w, h, rnd, col, m = {}) {
  c.fillStyle = tone(col, 0.45);
  c.fillRect(-1, -1, w + 2, h + 2);
  let v = h;
  while (v > -5) {
    const rh = 2.6 + rnd() * 2.4;
    let u = -rnd() * 8;
    while (u < w) {
      const bw = 3.5 + rnd() * 9;
      c.fillStyle = tone(col, 0.8 + rnd() * 0.32);
      c.beginPath();
      c.moveTo(u + 0.5, v - 0.45);
      c.lineTo(u + bw - 0.5, v - 0.45 - rnd() * 0.5);
      c.lineTo(u + bw - 0.4 - rnd() * 0.8, v - rh + 0.55);
      c.lineTo(u + 0.7 + rnd() * 0.8, v - rh + 0.5 + rnd() * 0.5);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,248,230,0.2)';
      c.fillRect(u + 1, v - rh + 0.6, bw - 2.2, 0.6);
      u += bw;
    }
    v -= rh;
  }
  if (m.beams) murusBeams(c, w, h, m);
}

/** Têtes de poutres en quinconce du murus gallicus. */
function murusBeams(c, w, h, m) {
  const dx = m.bx || 13;
  const dy = m.by || 10;
  let row = 0;
  for (let v = h - 5; v > 3; v -= dy, row++) {
    for (let u = (row % 2) * dx * 0.5 + 4; u < w - 2; u += dx) {
      c.fillStyle = '#4a2f18';
      c.fillRect(u - 1.9, v - 1.9, 3.8, 3.8);
      c.fillStyle = '#9a7048';
      c.fillRect(u - 1.3, v - 1.3, 2.4, 2.4);
      c.fillStyle = '#c29a68';
      c.fillRect(u - 1.3, v - 1.3, 2.4, 0.7);
    }
  }
}

/** Torchis chaulé : plaques d'enduit et salissures au pied. */
export function texDaub(c, w, h, rnd, col, m = {}) {
  const n = Math.ceil((w * h) / 70);
  for (let i = 0; i < n; i++) {
    c.fillStyle = rnd() < 0.55 ? 'rgba(255,255,250,0.16)' : 'rgba(140,110,70,0.08)';
    c.beginPath();
    c.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 5, 1.2 + rnd() * 2.5, 0, 0, 7);
    c.fill();
  }
  const hh = Math.min(10, h * 0.6);
  const g = c.createLinearGradient(0, h, 0, h - hh);
  g.addColorStop(0, 'rgba(110,78,45,0.5)');
  g.addColorStop(1, 'rgba(110,78,45,0)');
  c.fillStyle = g;
  c.fillRect(-1, h - hh, w + 2, hh + 1);
  if (m.frame) {
    // colombage : poteaux et sablières
    const tim = m.timber || '#6a4526';
    const step = m.frame;
    c.fillStyle = tim;
    for (let u = step * 0.5; u < w; u += step) c.fillRect(u - 1.3, -1, 2.6, h + 2);
    c.fillRect(-1, -1, w + 2, 2.6);
    c.fillStyle = 'rgba(255,230,190,0.2)';
    for (let u = step * 0.5; u < w; u += step) c.fillRect(u - 1.3, -1, 0.7, h + 2);
  }
}

/** Chaume sur un pan plat (fibres dans le sens de la pente, rangs superposés). */
export function texThatch(c, w, h, rnd, col, m = {}) {
  const lt = tone(col, 1.22);
  const dk = tone(col, 0.66);
  const n = Math.ceil((w * h) / 5);
  c.lineWidth = 0.8;
  for (const [sty, a] of [[dk, 0.4], [lt, 0.45]]) {
    c.strokeStyle = sty;
    c.globalAlpha = a;
    c.beginPath();
    for (let i = 0; i < n / 2; i++) {
      const u = rnd() * w;
      const v = rnd() * h;
      const L = 3 + rnd() * 5;
      c.moveTo(u, v);
      c.lineTo(u + (rnd() - 0.5) * 0.8, v + L);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  const lh = m.lh || 7;
  for (let v = lh * (0.6 + rnd() * 0.4); v < h - 2; v += lh) {
    c.fillStyle = 'rgba(70,45,10,0.28)';
    c.beginPath();
    c.moveTo(-1, v);
    for (let u = 0; u <= w + 4; u += 4) c.lineTo(u, v + (rnd() - 0.5) * 1.4);
    c.lineTo(w + 2, v + 1.8);
    c.lineTo(-1, v + 1.8);
    c.fill();
    c.fillStyle = 'rgba(255,240,190,0.22)';
    c.fillRect(-1, v - 1.2, w + 2, 1);
  }
}

/** Bardeaux / ardoises : rangs posés de l'égout (bas) vers le faîte (haut). m.rh, m.tw, m.round. */
export function texShingles(c, w, h, rnd, col, m = {}) {
  const rh = m.rh || 4;
  const tw = m.tw || 5;
  const seam = rgba(tone(col, 0.4), 0.7);
  let row = 0;
  for (let v = h; v > -rh; v -= rh, row++) {
    const off = (row % 2) * tw * 0.5 + (rnd() - 0.5) * 1.2;
    for (let u = -tw + off; u < w + tw; u += tw) {
      c.fillStyle = tone(col, 0.84 + rnd() * 0.28);
      if (m.round) {
        c.beginPath();
        c.moveTo(u, v - rh - 0.5);
        c.lineTo(u + tw, v - rh - 0.5);
        c.lineTo(u + tw, v - rh * 0.45);
        c.quadraticCurveTo(u + tw, v + 0.3, u + tw * 0.5, v + 0.3);
        c.quadraticCurveTo(u, v + 0.3, u, v - rh * 0.45);
        c.closePath();
        c.fill();
      } else {
        c.fillRect(u, v - rh - 0.3, tw, rh + 0.6);
      }
      c.fillStyle = seam;
      c.fillRect(u, v - rh, 0.55, rh * (m.round ? 0.6 : 1));
    }
    c.fillStyle = 'rgba(10,5,20,0.3)';
    c.fillRect(-1, v - rh, w + 2, 0.9);
    c.fillStyle = 'rgba(255,245,220,0.16)';
    c.fillRect(-1, v - 1.1, w + 2, 0.6);
  }
}

/** Clayonnage (osier tressé) horizontal entre des piquets. */
export function texWicker(c, w, h, rnd, col) {
  const lt = tone(col, 1.2);
  const dk = tone(col, 0.6);
  c.fillStyle = dk;
  c.fillRect(-1, -1, w + 2, h + 2);
  const sh = 2.2;
  let row = 0;
  for (let v = 0.5; v < h + sh; v += sh, row++) {
    for (let u = (row % 2) * 3 - 3; u < w + 3; u += 6) {
      c.fillStyle = tone(col, 0.9 + rnd() * 0.2);
      c.beginPath();
      c.ellipse(u + 3, v, 3.2, sh * 0.55, 0, 0, 7);
      c.fill();
      c.fillStyle = lt;
      c.globalAlpha = 0.4;
      c.fillRect(u + 1.5, v - sh * 0.45, 3, 0.5);
      c.globalAlpha = 1;
    }
  }
}

/** Terre battue (sols intérieurs, chantiers). */
export function texEarth(c, w, h, rnd, col) {
  const n = Math.ceil((w * h) / 30);
  for (let i = 0; i < n; i++) {
    c.fillStyle = rnd() < 0.5 ? 'rgba(255,240,200,0.12)' : 'rgba(40,25,10,0.14)';
    c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1);
  }
}

// ---------------------------------------------------------------------------
// Textures de cylindres (dessinées à l'écran, dans la silhouette du fût).
// Signature : (c, X, Y, rx, ry, z0, z1, rnd, col, m) ; (X, Y) = centre au sol à l'écran.
// Paramètre d'angle écran t ∈ ]0, π[ pour la moitié avant : x = X + rx·cos t, y = Y − z + ry·sin t.
// ---------------------------------------------------------------------------

/** Torchis sur un mur rond. */
export function ctexDaub(c, X, Y, rx, ry, z0, z1, rnd, col) {
  const h = z1 - z0;
  const n = Math.ceil((rx * h) / 35);
  for (let i = 0; i < n; i++) {
    const t = 0.1 + rnd() * (PI - 0.2);
    const z = z0 + rnd() * h;
    c.fillStyle = rnd() < 0.55 ? 'rgba(255,255,250,0.16)' : 'rgba(140,110,70,0.09)';
    c.beginPath();
    c.ellipse(X + rx * Math.cos(t), Y - z + ry * Math.sin(t), (2 + rnd() * 5) * Math.sin(t) + 1, 1.2 + rnd() * 2.2, 0, 0, 7);
    c.fill();
  }
  c.save();
  c.lineWidth = 9;
  c.strokeStyle = 'rgba(110,78,45,0.22)';
  c.beginPath();
  c.ellipse(X, Y - z0, rx, ry, 0, 0, PI);
  c.stroke();
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(110,78,45,0.3)';
  c.stroke();
  c.restore();
}

/** Assises de pierres sur un cylindre. */
export function ctexStone(c, X, Y, rx, ry, z0, z1, rnd, col, m = {}) {
  const rh = m.rh || 5;
  const sw = m.sw || 10;
  c.fillStyle = tone(col, 0.6);
  c.fillRect(X - rx - 2, Y - z1 - ry - 2, rx * 2 + 4, z1 - z0 + ry * 2 + 4);
  const dry = !!m.dry;
  for (let z = z0; z < z1; z += dry ? 0 : rh) {
    const hh = dry ? 2.6 + rnd() * 2.4 : rh;
    let t = -rnd() * (sw / rx);
    while (t < PI) {
      const dt = (sw * (0.55 + rnd() * 0.9)) / rx;
      const ta = Math.max(t, -0.05);
      const tb = Math.min(t + dt, PI + 0.05);
      if (tb > ta) {
        const g = 0.55 / (rx * Math.max(0.25, Math.sin((ta + tb) / 2)));
        c.fillStyle = tone(col, (dry ? 0.8 : 0.86) + rnd() * (dry ? 0.32 : 0.26));
        c.beginPath();
        c.ellipse(X, Y - z - 0.5, rx, ry, 0, ta + g, tb - g, false);
        c.ellipse(X, Y - z - hh + 0.6, rx, ry, 0, tb - g, ta + g, true);
        c.closePath();
        c.fill();
      }
      t += dt;
    }
    c.strokeStyle = 'rgba(255,250,235,0.18)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(X, Y - z - hh + 0.9, rx, ry, 0, 0.05, PI - 0.05);
    c.stroke();
    if (dry) z += hh;
  }
  if (m.beams) {
    // têtes de poutres du murus gallicus
    const dz = m.by || 10;
    let row = 0;
    for (let z = z0 + 5; z < z1 - 3; z += dz, row++) {
      const step = (m.bx || 13) / rx;
      for (let t = 0.12 + (row % 2) * step * 0.5; t < PI - 0.08; t += step) {
        const s = Math.sin(t);
        const x = X + rx * Math.cos(t);
        const y = Y - z + ry * Math.sin(t);
        c.fillStyle = '#4a2f18';
        c.fillRect(x - 1.9 * s - 0.2, y - 1.9, 3.8 * s + 0.4, 3.8);
        c.fillStyle = '#9a7048';
        c.fillRect(x - 1.3 * s, y - 1.3, 2.6 * s, 2.6);
      }
    }
  }
}

/** Rondins ou planches verticaux sur un cylindre. m.lw : largeur (px à l'écran au centre). */
export function ctexLogs(c, X, Y, rx, ry, z0, z1, rnd, col, m = {}) {
  const lw = m.lw || 5;
  let t = PI + 0.05;
  while (t > -0.05) {
    const dt = (lw * (0.85 + rnd() * 0.3)) / rx;
    const ta = t;
    const tb = t - dt;
    const xa = X + rx * Math.cos(ta);
    const xb = X + rx * Math.cos(tb);
    const ya0 = Y - z0 + ry * Math.sin(ta);
    const yb0 = Y - z0 + ry * Math.sin(tb);
    const ya1 = Y - z1 + ry * Math.sin(ta);
    const yb1 = Y - z1 + ry * Math.sin(tb);
    c.fillStyle = tone(col, 0.9 + rnd() * 0.2);
    c.beginPath();
    c.moveTo(xa, ya1 - 1);
    c.lineTo(xb, yb1 - 1);
    c.lineTo(xb, yb0 + 1);
    c.lineTo(xa, ya0 + 1);
    c.closePath();
    c.fill();
    if (m.round !== false) {
      c.fillStyle = 'rgba(255,240,210,0.18)';
      c.fillRect(xa, Math.min(ya1, yb1) - 1, Math.max(0.5, (xb - xa) * 0.3), z1 - z0 + ry + 2);
    }
    c.fillStyle = rgba(tone(col, 0.45), 0.8);
    c.fillRect(xb - 0.4, Math.min(ya1, yb1) - 1, 0.8, z1 - z0 + ry * 2 + 2);
    t = tb;
  }
}

// ---------------------------------------------------------------------------
// Matériaux
// ---------------------------------------------------------------------------

export const MAT = {
  daub: { col: '#ede3c9', tex: texDaub, ctex: ctexDaub },
  daubFrame: { col: '#ede3c9', tex: texDaub, frame: 14, timber: '#6a4526' },
  planks: { col: '#8e7458', tex: texPlanks, ctex: ctexLogs, pw: 5, lw: 4 },
  planksGrey: { col: '#8a7d6c', tex: texPlanks, ctex: ctexLogs, pw: 5, lw: 4 },
  planksDark: { col: '#6c5540', tex: texPlanks, pw: 4.5 },
  logs: { col: '#8a6440', tex: texLogsH, ctex: ctexLogs, lw: 5 },
  stone: { col: '#aaa69c', tex: texStone, ctex: ctexStone, rh: 5, sw: 10 },
  stoneLight: { col: '#c2bdb0', tex: texStone, ctex: ctexStone, rh: 5, sw: 11 },
  stoneDark: { col: '#8e8a82', tex: texStone, ctex: ctexStone, rh: 4, sw: 8 },
  dryStone: { col: '#a79c86', tex: texDryStone, ctex: ctexStone, dry: true },
  murus: { col: '#a79c86', tex: texDryStone, ctex: ctexStone, dry: true, beams: true },
  thatch: { col: '#c9a257', tex: texThatch, lh: 7 },
  shingle: { col: '#7c6857', tex: texShingles, rh: 4, tw: 5 },
  slate: { col: '#5d6b7c', tex: texShingles, rh: 3.5, tw: 4.5, round: true },
  wicker: { col: '#9a7a4c', tex: texWicker },
  earth: { col: '#8e7152', tex: texEarth },
  timber: { col: '#6f4a2a' },
  plaster: { col: '#e4dccb', tex: texDaub },
};

// ---------------------------------------------------------------------------
// Le « peintre » isométrique
// ---------------------------------------------------------------------------

/**
 * Contexte de dessin d'un sprite de bâtiment.
 * mode : 'plan' (relevé des emprises pour les fondations), 'shadow' (relevé des ombres), 'draw' (peinture).
 * stage : 0 fondations, 1 charpente, 2 presque fini, 3 terminé.
 */
export class Gfx {
  constructor(ctx, ax, ay, o = {}) {
    this.ctx = ctx;
    this.ax = ax;
    this.ay = ay;
    this.stage = o.stage ?? 3;
    this.civ = o.civ || 'gauls';
    this.teamIdx = o.team || 0;
    this.tc = teamColor(this.teamIdx);
    this.size = o.size || 2;
    this.seed = o.seed || 1;
    this.mode = 'draw';
    this.shadows = [];
    this.plans = [];
  }

  get drawing() {
    return this.mode === 'draw';
  }
  get done() {
    return this.stage >= 3;
  }

  P(x, y, z = 0) {
    return [this.ax + (x - y) * HX, this.ay + (x + y) * HY - z];
  }

  rng(...v) {
    return mulberry32(hash(this.seed, ...v));
  }

  // --- Relevés ------------------------------------------------------------

  planRect(x0, y0, x1, y1) {
    if (this.mode === 'plan') this.plans.push({ k: 'rect', x0, y0, x1, y1 });
  }
  planCircle(x, y, r) {
    if (this.mode === 'plan') this.plans.push({ k: 'circle', x, y, r });
  }

  /** Ombre d'un nuage de points 3D : enveloppe convexe de leurs projections au sol. */
  shadowOf(pts3) {
    if (this.mode !== 'shadow') return;
    const s = [];
    for (const [x, y, z] of pts3) {
      const [sx, sy] = this.P(x, y, 0);
      s.push([sx + SH_X * z, sy + SH_Y * z]);
    }
    this.shadows.push(hull(s));
  }
  shadowBox(x0, y0, x1, y1, z0, z1) {
    this.shadowOf([
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ]);
  }
  shadowCyl(cx, cy, r, z0, z1) {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * PI * 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      pts.push([x, y, z0], [x, y, z1]);
    }
    this.shadowOf(pts);
  }
  shadowCone(cx, cy, r, zb, za) {
    const pts = [[cx, cy, za]];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * PI * 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), zb], [cx + r * Math.cos(a), cy + r * Math.sin(a), 0]);
    }
    this.shadowOf(pts);
  }
  shadowPole(x, y, z0, z1, w = 0.035) {
    this.shadowBox(x - w, y - w, x + w, y + w, z0, z1);
  }

  // --- Tracés élémentaires (coordonnées écran) ------------------------------

  path(pts) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }

  outline(pts, col, a = 0.5) {
    const c = this.ctx;
    this.path(pts);
    c.strokeStyle = ink(col, a);
    c.lineWidth = 1;
    c.stroke();
  }

  /** Polygone plein (points écran) avec contour. */
  fillPoly(pts, fill, line = true) {
    const c = this.ctx;
    this.path(pts);
    c.fillStyle = fill;
    c.fill();
    if (line) {
      c.strokeStyle = typeof line === 'string' ? line : ink(fill);
      c.lineWidth = 1;
      c.stroke();
    }
  }

  /** Pièce de bois entre deux points 3D (trait épais avec contour et arête éclairée). */
  beam(x0, y0, z0, x1, y1, z1, col = '#6f4a2a', w = 2) {
    if (this.mode === 'shadow') {
      this.shadowOf([[x0, y0, z0], [x1, y1, z1], [x0 + 0.02, y0 + 0.02, z0], [x1 + 0.02, y1 + 0.02, z1]]);
      return;
    }
    if (!this.drawing) return;
    const c = this.ctx;
    const [ax, ay] = this.P(x0, y0, z0);
    const [bx, by] = this.P(x1, y1, z1);
    c.lineCap = 'round';
    c.strokeStyle = ink(col, 0.75);
    c.lineWidth = w + 1.2;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = w;
    c.stroke();
    if (w >= 1.8) {
      c.strokeStyle = rgba(tone(col, 1.35), 0.55);
      c.lineWidth = Math.max(0.6, w * 0.3);
      c.beginPath();
      c.moveTo(ax - w * 0.25, ay - w * 0.25);
      c.lineTo(bx - w * 0.25, by - w * 0.25);
      c.stroke();
    }
    c.lineCap = 'butt';
  }

  /** Poteau vertical (rond) de hauteur z0 → z1, largeur w px. */
  post(x, y, z0, z1, col = '#6f4a2a', w = 2.6) {
    if (this.mode === 'shadow') {
      this.shadowPole(x, y, z0, z1, w / 70);
      return;
    }
    if (!this.drawing) return;
    const c = this.ctx;
    const [px, py] = this.P(x, y, 0);
    const g = c.createLinearGradient(px - w / 2, 0, px + w / 2, 0);
    g.addColorStop(0, tone(col, 1.15));
    g.addColorStop(0.45, col);
    g.addColorStop(1, tone(col, 0.6));
    c.fillStyle = g;
    c.fillRect(px - w / 2, py - z1, w, z1 - z0);
    c.strokeStyle = ink(col, 0.55);
    c.lineWidth = 0.8;
    c.strokeRect(px - w / 2, py - z1, w, z1 - z0);
  }

  // --- Faces planes -----------------------------------------------------------

  /**
   * Peint une face plane. O : origine écran du repère local ; U, V : vecteurs écran par unité locale ;
   * w × h : taille locale ; mat : matériau ; k : luminosité de la face.
   * o.shape(c, w, h) : forme de découpe locale (défaut : rectangle) ; o.deco(c, w, h) : décor local ;
   * o.ao : assombrissement au pied ; o.eave : hauteur (px) de l'ombre d'avant-toit en haut.
   */
  plane(O, U, V, w, h, mat, k, o = {}) {
    const c = this.ctx;
    c.save();
    c.setTransform(U[0], U[1], V[0], V[1], O[0], O[1]);
    c.beginPath();
    if (o.shape) o.shape(c, w, h);
    else c.rect(0, 0, w, h);
    c.clip();
    c.fillStyle = mat.col;
    c.fillRect(-2, -2, w + 4, h + 4);
    if (mat.tex) mat.tex(c, w, h, o.rnd || this.rng(O[0], O[1], w, h, k), mat.col, mat);
    if (o.deco) o.deco(c, w, h);
    if (o.ao !== false && h > 4) {
      const hh = Math.min(9, h * 0.5);
      const g = c.createLinearGradient(0, h - hh, 0, h);
      g.addColorStop(0, 'rgba(30,18,6,0)');
      g.addColorStop(1, 'rgba(30,18,6,0.28)');
      c.fillStyle = g;
      c.fillRect(-2, h - hh, w + 4, hh + 2);
    }
    if (o.eave) {
      const g = c.createLinearGradient(0, 0, 0, o.eave);
      g.addColorStop(0, 'rgba(20,10,20,0.5)');
      g.addColorStop(1, 'rgba(20,10,20,0)');
      c.fillStyle = g;
      c.fillRect(-2, -2, w + 4, o.eave + 2);
    }
    if (o.grad) o.grad(c, w, h);
    if (k < 0.995) {
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = mulCol(k);
      c.fillRect(-2, -2, w + 4, h + 4);
    } else if (k > 1.005) {
      c.globalCompositeOperation = 'screen';
      const t = Math.min(1, k - 1);
      c.fillStyle = `rgba(255,245,215,${t})`;
      c.fillRect(-2, -2, w + 4, h + 4);
    }
    c.restore();
  }

  /** Face de normale +y (à gauche à l'écran), de x0 à x1, hauteurs z0 → z1. */
  faceL(x0, x1, y, z0, z1, mat, o = {}) {
    if (!this.drawing || z1 <= z0 + 0.01 || x1 <= x0) return;
    const k = o.k ?? K_LEFT;
    this.plane(this.P(x0, y, z1), [1, 0.5], [0, 1], (x1 - x0) * HX, z1 - z0, mat, k, o);
    if (o.line !== false) this.outline([this.P(x0, y, z1), this.P(x1, y, z1), this.P(x1, y, z0), this.P(x0, y, z0)], tone(mat.col, k));
  }

  /** Face de normale +x (à droite à l'écran), de y1 (gauche) à y0 (droite), hauteurs z0 → z1. */
  faceR(x, y0, y1, z0, z1, mat, o = {}) {
    if (!this.drawing || z1 <= z0 + 0.01 || y1 <= y0) return;
    const k = o.k ?? K_RIGHT;
    this.plane(this.P(x, y1, z1), [1, -0.5], [0, 1], (y1 - y0) * HX, z1 - z0, mat, k, o);
    if (o.line !== false) this.outline([this.P(x, y1, z1), this.P(x, y0, z1), this.P(x, y0, z0), this.P(x, y1, z0)], tone(mat.col, k));
  }

  /** Face horizontale à la hauteur z. */
  faceTop(x0, y0, x1, y1, z, mat, o = {}) {
    if (!this.drawing) return;
    const k = o.k ?? K_TOP;
    this.plane(this.P(x0, y0, z), [1, 0.5], [-1, 0.5], (x1 - x0) * HX, (y1 - y0) * HX, mat, k, { ao: false, ...o });
    if (o.line !== false) this.outline([this.P(x0, y0, z), this.P(x1, y0, z), this.P(x1, y1, z), this.P(x0, y1, z)], tone(mat.col, k));
  }

  /** Prisme droit. o.top : false pour ne pas peindre le dessus ; o.topMat ; o.decoL / o.decoR : décors des faces. */
  box(x0, y0, x1, y1, z0, z1, mat, o = {}) {
    if (this.mode === 'plan') {
      if (o.plan) this.planRect(x0, y0, x1, y1);
      return;
    }
    if (this.mode === 'shadow') {
      if (o.shadow !== false) this.shadowBox(x0, y0, x1, y1, z0, z1);
      return;
    }
    const base = { ao: o.ao, eave: o.eave, k: undefined };
    this.faceR(x1, y0, y1, z0, z1, o.matR || mat, { ...base, deco: o.decoR, k: o.kR });
    this.faceL(x0, x1, y1, z0, z1, o.matL || mat, { ...base, deco: o.decoL, k: o.kL });
    if (o.top !== false) this.faceTop(x0, y0, x1, y1, z1, o.topMat || mat, { deco: o.decoT });
  }

  // --- Volumes de révolution --------------------------------------------------

  cylPath(X, Y, rx, ry, z0, z1) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(X - rx, Y - z1);
    c.lineTo(X - rx, Y - z0);
    c.ellipse(X, Y - z0, rx, ry, 0, PI, 0, true);
    c.lineTo(X + rx, Y - z1);
    c.ellipse(X, Y - z1, rx, ry, 0, 0, PI, false);
    c.closePath();
  }

  /** Dégradé « multiply » d'un volume de révolution (clair à gauche, sombre à droite). */
  roundShade(X, rx, dark = 0.6) {
    const c = this.ctx;
    const g = c.createLinearGradient(X - rx, 0, X + rx, 0);
    g.addColorStop(0, mulCol(0.84));
    g.addColorStop(0.28, mulCol(1));
    g.addColorStop(0.62, mulCol(0.8));
    g.addColorStop(1, mulCol(dark));
    return g;
  }

  /**
   * Fût cylindrique (moitié avant visible). o.top : matériau du dessus (sinon ouvert/caché) ;
   * o.deco(c, X, Y, rx, ry) : décor peint sur le fût avant l'ombrage ; o.eave : ombre d'avant-toit (px).
   */
  cyl(cx, cy, r, z0, z1, mat, o = {}) {
    if (this.mode === 'plan') {
      if (o.plan) this.planCircle(cx, cy, r);
      return;
    }
    if (this.mode === 'shadow') {
      if (o.shadow !== false) this.shadowCyl(cx, cy, r, z0, z1);
      return;
    }
    if (z1 <= z0) return;
    const c = this.ctx;
    const [X, Y] = this.P(cx, cy, 0);
    const rx = r * RX;
    const ry = r * RY;
    c.save();
    this.cylPath(X, Y, rx, ry, z0, z1);
    c.clip();
    c.fillStyle = mat.col;
    c.fillRect(X - rx - 2, Y - z1 - ry - 2, rx * 2 + 4, z1 - z0 + ry * 2 + 4);
    if (mat.ctex) mat.ctex(c, X, Y, rx, ry, z0, z1, this.rng(cx, cy, r, z0, z1), mat.col, mat);
    if (o.deco) o.deco(c, X, Y, rx, ry);
    if (o.ao !== false) {
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(30,18,6,0.22)';
      c.beginPath();
      c.ellipse(X, Y - z0, rx, ry, 0, 0, PI);
      c.stroke();
    }
    if (o.eave) {
      c.lineWidth = o.eave * 2;
      c.strokeStyle = 'rgba(20,10,20,0.4)';
      c.beginPath();
      c.ellipse(X, Y - z1, rx, ry, 0, 0, PI);
      c.stroke();
    }
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = this.roundShade(X, rx);
    c.fillRect(X - rx - 2, Y - z1 - ry - 2, rx * 2 + 4, z1 - z0 + ry * 2 + 4);
    c.restore();
    this.cylPath(X, Y, rx, ry, z0, z1);
    c.strokeStyle = ink(mat.col, 0.55);
    c.lineWidth = 1;
    c.stroke();
    if (o.top) this.disc(cx, cy, r, z1, o.top);
  }

  /** Disque horizontal (dessus d'un cylindre). */
  disc(cx, cy, r, z, mat, o = {}) {
    if (!this.drawing) return;
    const c = this.ctx;
    const [X, Y] = this.P(cx, cy, z);
    const rx = r * RX;
    const ry = r * RY;
    c.save();
    c.beginPath();
    c.ellipse(X, Y, rx, ry, 0, 0, PI * 2);
    c.clip();
    c.fillStyle = mat.col;
    c.fillRect(X - rx - 1, Y - ry - 1, rx * 2 + 2, ry * 2 + 2);
    if (mat.tex) {
      // texture « à plat » dans le repère du sol, centrée sur le disque
      const S = r * HX;
      c.setTransform(1, 0.5, -1, 0.5, X, Y);
      c.translate(-S, -S);
      mat.tex(c, S * 2, S * 2, this.rng(cx, cy, z, 7), mat.col, mat);
      c.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (o.inner) o.inner(c, X, Y, rx, ry);
    if (o.k && o.k < 0.995) {
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = mulCol(o.k);
      c.fillRect(X - rx - 1, Y - ry - 1, rx * 2 + 2, ry * 2 + 2);
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    c.beginPath();
    c.ellipse(X, Y, rx, ry, 0, 0, PI * 2);
    c.strokeStyle = ink(mat.col, 0.5);
    c.lineWidth = 1;
    c.stroke();
  }

  conePath(X, Ya, Yb, rx, ry, a) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(X, Ya);
    c.lineTo(X + rx * Math.cos(PI + a), Yb + ry * Math.sin(PI + a));
    c.ellipse(X, Yb, rx, ry, 0, PI + a, -a, true);
    c.closePath();
  }

  /** Géométrie écran d'un cône (base à zb, rayon R, sommet à za). */
  coneGeo(cx, cy, zb, R, za) {
    const [X, Y] = this.P(cx, cy, 0);
    const rx = R * RX;
    const ry = R * RY;
    const Yb = Y - zb;
    const Ya = Y - za;
    const a = Math.asin(Math.min(0.995, ry / Math.max(1, za - zb)));
    return { X, Y, Ya, Yb, rx, ry, a };
  }

  /**
   * Cône (toit conique). mat.cone(c, geo, rnd, col, mat) peint la texture ; o.deco(c, geo) avant l'ombrage.
   */
  cone(cx, cy, zb, R, za, mat, o = {}) {
    if (this.mode === 'plan') return;
    if (this.mode === 'shadow') {
      if (o.shadow !== false) this.shadowCone(cx, cy, R, zb, za);
      return;
    }
    const c = this.ctx;
    const G = this.coneGeo(cx, cy, zb, R, za);
    const f0 = o.f0 || 0; // > 0 : seule la bande basse (f0 → 1) est couverte (toit en cours de pose)
    c.save();
    if (f0 > 0) this.coneBandPath(G, f0, 1);
    else this.conePath(G.X, G.Ya, G.Yb, G.rx, G.ry, G.a);
    c.clip();
    c.fillStyle = mat.col;
    c.fillRect(G.X - G.rx - 2, G.Ya - 2, G.rx * 2 + 4, G.Yb - G.Ya + G.ry + 4);
    if (mat.cone) mat.cone(c, G, this.rng(cx, cy, zb, R, za), mat.col, mat);
    if (o.deco) o.deco(c, G);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = this.roundShade(G.X, G.rx, 0.62);
    c.fillRect(G.X - G.rx - 2, G.Ya - 2, G.rx * 2 + 4, G.Yb - G.Ya + G.ry + 4);
    // léger assombrissement vers l'égout
    const gv = c.createLinearGradient(0, G.Ya, 0, G.Yb + G.ry);
    gv.addColorStop(0, 'rgb(255,255,255)');
    gv.addColorStop(1, mulCol(0.88));
    c.fillStyle = gv;
    c.fillRect(G.X - G.rx - 2, G.Ya - 2, G.rx * 2 + 4, G.Yb - G.Ya + G.ry + 4);
    c.restore();
    if (f0 > 0) this.coneBandPath(G, f0, 1);
    else this.conePath(G.X, G.Ya, G.Yb, G.rx, G.ry, G.a);
    c.strokeStyle = ink(mat.col, 0.55);
    c.lineWidth = 1;
    c.stroke();
    return G;
  }

  /** Point d'un cône à la fraction f (0 sommet → 1 base) et à l'angle écran t. */
  coneAt(G, f, t) {
    return [G.X + f * G.rx * Math.cos(t), G.Ya + f * (G.Yb - G.Ya) + f * G.ry * Math.sin(t)];
  }

  /** Chemin d'une bande du cône entre les fractions f1 < f2 (partie visible). */
  coneBandPath(G, f1, f2) {
    const c = this.ctx;
    const { X, Ya, Yb, rx, ry, a } = G;
    c.beginPath();
    const p = this.coneAt(G, f2, PI + a);
    c.moveTo(p[0], p[1]);
    c.ellipse(X, Ya + f2 * (Yb - Ya), f2 * rx, f2 * ry, 0, PI + a, -a, true);
    const q = this.coneAt(G, f1, -a);
    c.lineTo(q[0], q[1]);
    c.ellipse(X, Ya + f1 * (Yb - Ya), Math.max(0.01, f1 * rx), Math.max(0.01, f1 * ry), 0, -a, PI + a, false);
    c.closePath();
  }

  // --- Pans inclinés ----------------------------------------------------------

  /**
   * Pan de toit quadrilatère donné par ses 4 coins 3D : A→B = faîte (ou arête haute), D = sous A à l'égout.
   * Le repère local : u le long de A→B, v de A vers D. mat.tex dessine dans ce repère.
   */
  slope(A, B, D, mat, k, o = {}) {
    if (!this.drawing) return;
    const a = this.P(...A);
    const b = this.P(...B);
    const d = this.P(...D);
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const vx = d[0] - a[0];
    const vy = d[1] - a[1];
    const lu = Math.hypot(ux, uy);
    const lv = Math.hypot(vx, vy);
    this.plane(a, [ux / lu, uy / lu], [vx / lv, vy / lv], lu, lv, mat, k, { ao: false, ...o });
    return { a, b, d, lu, lv };
  }
}

/** Texture de chaume sur un cône (fibres le long des génératrices, rangs en couronnes). */
export function coneThatch(c, G, rnd, col, m = {}) {
  const { X, Ya, Yb, rx, ry, a } = G;
  const lt = tone(col, 1.25);
  const dk = tone(col, 0.62);
  const H = Yb - Ya + ry;
  const n = Math.ceil(rx * 2.2);
  c.lineWidth = 0.9;
  for (const [sty, al] of [[dk, 0.42], [lt, 0.5]]) {
    c.strokeStyle = sty;
    c.globalAlpha = al;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const t = -a + rnd() * (PI + 2 * a);
      const f0 = 0.08 + rnd() * 0.85;
      const f1 = Math.min(1.02, f0 + 0.08 + rnd() * 0.2);
      c.moveTo(X + f0 * rx * Math.cos(t), Ya + f0 * (Yb - Ya) + f0 * ry * Math.sin(t));
      c.lineTo(X + f1 * rx * Math.cos(t), Ya + f1 * (Yb - Ya) + f1 * ry * Math.sin(t));
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  // couronnes (rangs de chaume)
  const tiers = Math.max(2, Math.round(H / 13));
  for (let i = 1; i <= tiers; i++) {
    const f = 0.22 + (0.78 * i) / (tiers + 0.35) + (rnd() - 0.5) * 0.03;
    const cy = Ya + f * (Yb - Ya);
    c.lineWidth = 2.2;
    c.strokeStyle = 'rgba(70,45,12,0.26)';
    c.beginPath();
    c.ellipse(X, cy + 1.2, f * rx, f * ry, 0, -a * 0.5, PI + a * 0.5);
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(255,240,190,0.3)';
    c.beginPath();
    c.ellipse(X, cy - 0.6, f * rx, f * ry, 0, -a * 0.5, PI + a * 0.5);
    c.stroke();
  }
  // lissage du sommet
  c.fillStyle = rgba(tone(col, 0.9), 0.5);
  c.beginPath();
  c.ellipse(X, Ya + 0.12 * (Yb - Ya), 0.1 * rx + 1, 0.1 * ry + 1, 0, 0, PI * 2);
  c.fill();
}

/** Texture d'ardoises / bardeaux sur un cône (rangs en couronnes, joints décalés). */
export function coneShingle(c, G, rnd, col, m = {}) {
  const { X, Ya, Yb, rx, ry, a } = G;
  const H = Yb - Ya;
  const rh = m.rh || 3.6;
  const rows = Math.max(3, Math.round(H / rh));
  for (let i = rows; i >= 1; i--) {
    const f = i / rows;
    const f0 = (i - 1) / rows;
    const cy = Ya + f * H;
    const step = (m.tw || 4.5) / Math.max(4, f * rx);
    let t = -a - (i % 2) * step * 0.5;
    while (t < PI + a) {
      c.fillStyle = tone(col, 0.84 + rnd() * 0.3);
      c.beginPath();
      c.moveTo(X + f0 * rx * Math.cos(t), Ya + f0 * H + f0 * ry * Math.sin(t));
      c.lineTo(X + f * rx * Math.cos(t), cy + f * ry * Math.sin(t) + 0.6);
      c.lineTo(X + f * rx * Math.cos(t + step), cy + f * ry * Math.sin(t + step) + 0.6);
      c.lineTo(X + f0 * rx * Math.cos(t + step), Ya + f0 * H + f0 * ry * Math.sin(t + step));
      c.closePath();
      c.fill();
      t += step;
    }
    c.strokeStyle = 'rgba(10,5,25,0.3)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(X, Ya + f0 * H + 0.5, Math.max(0.01, f0 * rx), Math.max(0.01, f0 * ry), 0, -a, PI + a);
    c.stroke();
  }
}

MAT.thatch.cone = coneThatch;
MAT.slate.cone = coneShingle;
MAT.shingle.cone = coneShingle;
