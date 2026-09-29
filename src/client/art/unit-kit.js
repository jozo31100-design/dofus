// Boîte à outils du dessin des personnages, montures et engins :
// maths d'animation, couleurs mémorisées, chemins (membres effilés, ellipses), peinture ombrée,
// cinématique inverse à deux segments et « cuisson » des sprites (contour de silhouette, ombre, recadrage).
//
// Conventions des angles de membres : 0 = pendant vers le bas, +π/2 = tendu vers l'avant (vers +x local),
// π = levé vers le haut, −π/2 = tendu vers l'arrière. Un segment d'angle a et de longueur L va de (x, y)
// à (x + L·sin a, y + L·cos a). En coordonnées locales l'unité regarde toujours vers +x ; le retournement
// (dir = −1) est appliqué par une mise à l'échelle (−1, 1) au moment de la cuisson.

import { shade, hexToRgb } from './palette.js';

export const PI = Math.PI;
export const TAU = PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeIn = (t) => t * t;
/** Partie fractionnaire positive. */
export const fract = (v) => v - Math.floor(v);
/** Onde sinusoïdale d'une phase exprimée en tours. */
export const wave = (p) => Math.sin(p * TAU);

// ---------------------------------------------------------------------------
// Couleurs
// ---------------------------------------------------------------------------

const toneMemo = new Map();
/** Éclaircit (k > 0) ou assombrit (k < 0) une couleur « #rrggbb » ; résultat mémorisé. */
export function tone(c, k) {
  if (!k) return c;
  const key = c + k;
  let v = toneMemo.get(key);
  if (v === undefined) {
    v = shade(c, k);
    toneMemo.set(key, v);
  }
  return v;
}

const rgbaMemo = new Map();
/** Couleur avec opacité, mémorisée. */
export function rgba(c, a) {
  const key = c + a;
  let v = rgbaMemo.get(key);
  if (v === undefined) {
    const [r, g, b] = hexToRgb(c);
    v = `rgba(${r},${g},${b},${a})`;
    rgbaMemo.set(key, v);
  }
  return v;
}

/** Couleur du contour fin d'une pièce : teinte nettement plus sombre, semi-transparente. */
export function edge(c, a = 0.55) {
  return rgba(tone(c, -0.62), a);
}

// ---------------------------------------------------------------------------
// Lumière : elle vient du haut-gauche de l'écran. En coordonnées locales (retournées si dir = −1),
// le côté éclairé est donc −dir. Les dégradés utilisent LS pour rester cohérents dans les deux sens.
// ---------------------------------------------------------------------------

export const light = { s: -1 };
export function setLightSide(dir) {
  light.s = -(dir || 1);
}

/** Dégradé horizontal du côté éclairé vers le côté ombré, sur l'étendue [x0, x1]. */
export function sideGrad(ctx, x0, x1, c, k1 = 0.2, k2 = -0.25, y = 0) {
  const lit = light.s < 0 ? x0 : x1;
  const dark = light.s < 0 ? x1 : x0;
  const g = ctx.createLinearGradient(lit, y, dark, y);
  g.addColorStop(0, tone(c, k1));
  g.addColorStop(0.5, c);
  g.addColorStop(1, tone(c, k2));
  return g;
}

/** Dégradé vertical (haut clair, bas sombre). */
export function vGrad(ctx, y0, y1, c, k1 = 0.18, k2 = -0.22) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(c, k1));
  g.addColorStop(1, tone(c, k2));
  return g;
}

/** Dégradé radial d'un volume arrondi éclairé en haut du côté de la lumière. */
export function ballGrad(ctx, x, y, r, c, k1 = 0.28, k2 = -0.3) {
  const g = ctx.createRadialGradient(x + light.s * r * 0.4, y - r * 0.45, r * 0.08, x, y, r * 1.08);
  g.addColorStop(0, tone(c, k1));
  g.addColorStop(0.55, c);
  g.addColorStop(1, tone(c, k2));
  return g;
}

// ---------------------------------------------------------------------------
// Motifs (remplissages texturés sans découpage, bien plus rapides qu'un clip)
// ---------------------------------------------------------------------------

const tiles = new Map();
/**
 * Motif répété : tuile de n × n pixels dessinée une fois par draw(g, n), puis appliquée au contexte ctx
 * avec une période de `period` unités locales. Renvoie un CanvasPattern utilisable comme fillStyle.
 */
export function pattern(ctx, key, n, period, draw) {
  let t = tiles.get(key);
  if (!t) {
    t = document.createElement('canvas');
    t.width = n;
    t.height = n;
    draw(t.getContext('2d'), n);
    tiles.set(key, t);
  }
  const p = ctx.createPattern(t, 'repeat');
  if (p && p.setTransform) p.setTransform(new DOMMatrix([period / n, 0, 0, period / n, 0, 0]));
  return p;
}

/** Motif à carreaux (braies gauloises) de deux couleurs, avec un fin liseré clair. */
export function checkPattern(ctx, c1, c2, period) {
  return pattern(ctx, 'chk' + c1 + c2, 8, period, (g, n) => {
    g.fillStyle = c1;
    g.fillRect(0, 0, n, n);
    g.fillStyle = c2;
    g.fillRect(0, 0, n / 2, n / 2);
    g.fillRect(n / 2, n / 2, n / 2, n / 2);
    g.fillStyle = rgba(tone(c2, 0.4), 0.55);
    g.fillRect(n / 4 - 0.5, 0, 1, n);
  });
}

/** Motif de cotte de mailles : rangées d'anneaux en quinconce. */
export function mailPattern(ctx, c, period) {
  return pattern(ctx, 'mail' + c, 12, period, (g, n) => {
    g.fillStyle = c;
    g.fillRect(0, 0, n, n);
    g.strokeStyle = rgba(tone(c, -0.55), 0.8);
    g.lineWidth = 1.2;
    const arc = (x, y) => {
      g.beginPath();
      g.arc(x, y, n / 4, 0.15, Math.PI - 0.15);
      g.stroke();
    };
    arc(n / 4, n / 4);
    arc((3 * n) / 4, n / 4);
    arc(0, (3 * n) / 4);
    arc(n / 2, (3 * n) / 4);
    arc(n, (3 * n) / 4);
    g.fillStyle = rgba('#ffffff', 0.35);
    g.fillRect(n / 4 - 1, n / 4 - 2, 2, 1);
    g.fillRect((3 * n) / 4 - 1, (3 * n) / 4 - 2, 2, 1);
  });
}

// ---------------------------------------------------------------------------
// Chemins
// ---------------------------------------------------------------------------

/**
 * Ajoute au chemin courant un segment effilé à bouts ronds : deux disques (x1, y1, r1) et (x2, y2, r2)
 * reliés par leurs tangentes extérieures (bras, jambes, cou, pattes…).
 */
export function capsule(ctx, x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L <= Math.abs(r1 - r2) + 1e-4) {
    const big = r1 > r2;
    const cx = big ? x1 : x2;
    const cy = big ? y1 : y2;
    const r = big ? r1 : r2;
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, TAU);
    return;
  }
  const th = Math.atan2(dy, dx);
  const al = Math.acos((r1 - r2) / L);
  ctx.moveTo(x1 + r1 * Math.cos(th + al), y1 + r1 * Math.sin(th + al));
  ctx.arc(x1, y1, r1, th + al, th + TAU - al);
  ctx.arc(x2, y2, r2, th - al, th + al);
  ctx.closePath();
}

/** Ajoute une ellipse fermée au chemin courant. */
export function ell(ctx, x, y, rx, ry, rot = 0) {
  ctx.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}

/** Ajoute un polygone fermé au chemin courant (tableau plat [x0, y0, x1, y1, …]). */
export function poly(ctx, p) {
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath();
}

/** Remplit le chemin courant puis trace son contour fin. */
export function paint(ctx, fill, line, lw = 0.8) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) {
    ctx.strokeStyle = line;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Trait simple à bouts ronds. */
export function line(ctx, x1, y1, x2, y2, c, w) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** Point d'un segment d'angle a (convention des membres). */
export function seg(x, y, a, L) {
  return [x + L * Math.sin(a), y + L * Math.cos(a)];
}

/** Rotation d'un vecteur (convention canvas : angle positif = sens horaire à l'écran). */
export function rot(x, y, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}

/**
 * Cinématique inverse à deux segments : angles (convention des membres) d'un bras ou d'une jambe dont
 * l'origine est (sx, sy) et l'extrémité doit atteindre (tx, ty). bend = +1 ou −1 choisit le côté du coude.
 */
export function ik(sx, sy, tx, ty, L1, L2, bend = 1) {
  let dx = tx - sx;
  let dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const maxD = (L1 + L2) * 0.999;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  d = Math.max(d, Math.abs(L1 - L2) + 0.01);
  const base = Math.atan2(dx, dy); // angle de la cible dans la convention des membres
  const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
  const A = Math.acos(cosA);
  const a1 = base + bend * A;
  const ex = sx + L1 * Math.sin(a1);
  const ey = sy + L1 * Math.cos(a1);
  const a2 = Math.atan2(tx - ex, ty - ey);
  return [a1, a2];
}

// ---------------------------------------------------------------------------
// Poses : objets plats de nombres, interpolés entre images clés.
// ---------------------------------------------------------------------------

/** Mélange linéaire champ par champ de deux poses (les champs absents de b gardent la valeur de a). */
export function blendPose(a, b, t) {
  const out = {};
  for (const k in a) {
    const va = a[k];
    const vb = b[k];
    out[k] = vb === undefined ? va : va + (vb - va) * t;
  }
  for (const k in b) if (out[k] === undefined) out[k] = b[k];
  return out;
}

/**
 * Pose à l'instant p (0..1) d'une suite d'images clés [[p0, pose0], [p1, pose1], …] triées.
 * Interpolation adoucie (smoothstep) ; si loop, la dernière image rejoint la première.
 */
export function keyPose(keys, p, loop = false) {
  const n = keys.length;
  if (p <= keys[0][0] && !loop) return keys[0][1];
  for (let i = 0; i < n - 1; i++) {
    const [p0, a] = keys[i];
    const [p1, b] = keys[i + 1];
    if (p >= p0 && p <= p1) return blendPose(a, b, smooth((p - p0) / Math.max(1e-6, p1 - p0)));
  }
  if (loop) {
    const [p0, a] = keys[n - 1];
    const [p1, b] = keys[0];
    const span = 1 - p0 + p1;
    const q = p >= p0 ? p - p0 : p + 1 - p0;
    return blendPose(a, b, smooth(q / Math.max(1e-6, span)));
  }
  return keys[n - 1][1];
}

// ---------------------------------------------------------------------------
// Cuisson des sprites
// ---------------------------------------------------------------------------

let scratchA = null;
let scratchB = null;
let scratchC = null;

function scratch(which, w, h, read) {
  let s = which;
  if (!s) {
    const canvas = document.createElement('canvas');
    s = { canvas, ctx: canvas.getContext('2d', read ? { willReadFrequently: true } : undefined) };
  }
  if (s.canvas.width < w || s.canvas.height < h) {
    s.canvas.width = Math.max(s.canvas.width, w);
    s.canvas.height = Math.max(s.canvas.height, h);
  }
  s.ctx.setTransform(1, 0, 0, 1, 0, 0);
  s.ctx.globalAlpha = 1;
  s.ctx.globalCompositeOperation = 'source-over';
  s.ctx.clearRect(0, 0, w, h);
  return s;
}

/**
 * Cuit un sprite. box = [gauche, haut, droite, bas] : étendue locale maximale (px à zoom 1, pieds en 0,0).
 * b = résolution (pixels de canvas par px local). draw(ctx) dessine le sujet en coordonnées locales ;
 * shadow(ctx) (facultatif) dessine son ombre au sol, sans contour. outline = [couleur, opacité] du
 * contour de silhouette (1 pixel de canvas autour du sujet). Renvoie { c, ox, oy } : canvas recadré au plus
 * juste et position des pieds dans ce canvas (en pixels de canvas).
 */
export function bake(box, b, draw, shadow, outline) {
  const pad = 3;
  const ox = Math.ceil(-box[0] * b) + pad;
  const oy = Math.ceil(-box[1] * b) + pad;
  const W = ox + Math.ceil(box[2] * b) + pad;
  const H = oy + Math.ceil(box[3] * b) + pad;

  scratchA = scratch(scratchA, W, H, false);
  const a = scratchA.ctx;
  a.setTransform(b, 0, 0, b, ox, oy);
  a.lineJoin = 'round';
  a.lineCap = 'round';
  draw(a);
  a.setTransform(1, 0, 0, 1, 0, 0);

  scratchC = scratch(scratchC, W, H, true);
  const c = scratchC.ctx;
  if (shadow) {
    c.setTransform(b, 0, 0, b, ox, oy);
    shadow(c);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (outline) {
    // Silhouette sombre décalée d'un pixel dans les quatre directions : contour lisible sur l'herbe.
    scratchB = scratch(scratchB, W, H, false);
    const s = scratchB.ctx;
    s.drawImage(scratchA.canvas, 0, 0, W, H, 0, 0, W, H);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = outline[0];
    s.fillRect(0, 0, W, H);
    s.globalCompositeOperation = 'source-over';
    c.globalAlpha = outline[1];
    const d = Math.max(1, Math.round(b * 0.75));
    c.drawImage(scratchB.canvas, 0, 0, W, H, -d, 0, W, H);
    c.drawImage(scratchB.canvas, 0, 0, W, H, d, 0, W, H);
    c.drawImage(scratchB.canvas, 0, 0, W, H, 0, -d, W, H);
    c.drawImage(scratchB.canvas, 0, 0, W, H, 0, d, W, H);
    c.globalAlpha = 1;
  }
  c.drawImage(scratchA.canvas, 0, 0, W, H, 0, 0, W, H);

  // Recadrage au plus juste (moins de pixels à copier à chaque image).
  const data = c.getImageData(0, 0, W, H).data;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    const row = y * W * 4 + 3;
    for (let x = 0; x < W; x++) {
      if (data[row + x * 4] > 3) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  if (x1 < 0) {
    x0 = 0;
    y0 = 0;
    x1 = 0;
    y1 = 0;
  }
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(scratchC.canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { c: out, ox: ox - x0, oy: oy - y0 };
}

/**
 * Cache de sprites cuits, borné (les plus anciens sont oubliés en premier).
 */
export class SpriteCache {
  constructor(max) {
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(key, v) {
    if (this.map.size >= this.max) {
      let n = Math.ceil(this.max * 0.1);
      for (const k of this.map.keys()) {
        this.map.delete(k);
        if (--n <= 0) break;
      }
    }
    this.map.set(key, v);
  }
  get size() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
}

// ---------------------------------------------------------------------------
// Résolution de cuisson : on cuit à l'échelle exacte de l'écran quand elle est stable (copie au pixel
// près, rapide et nette), sinon au palier le plus proche au-dessus (copie mise à l'échelle).
// ---------------------------------------------------------------------------

const STEPS = [0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8];

export class ScalePicker {
  constructor(threshold = 400) {
    this.counts = new Map();
    this.threshold = threshold;
  }
  /** Renvoie la résolution de cuisson pour une échelle effective k (quantifiée au 1/4096). */
  pick(k) {
    const q = Math.round(k * 4096) / 4096;
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i] === q) return q;
    // Échelle hors paliers : on la compte ; utilisée telle quelle dès qu'elle est stable.
    let c = this.counts.get(q) || 0;
    if (c < this.threshold) {
      if (this.counts.size > 48) this.counts.clear();
      this.counts.set(q, ++c);
    }
    if (c >= this.threshold && q >= 0.25 && q <= 8) return q;
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i] >= q * 0.98) return STEPS[i];
    return STEPS[STEPS.length - 1];
  }
}

/**
 * Dessine un sprite cuit (pieds en sx, sy ; s = échelle demandée par l'appelant ; b = résolution de cuisson ;
 * m = transformation courante du contexte). Copie au pixel près quand c'est possible.
 */
export function blit(ctx, spr, sx, sy, s, b, m, alphaMul) {
  const inv = s / b;
  const x = sx - spr.ox * inv;
  const y = sy - spr.oy * inv;
  let ga = -1;
  if (alphaMul < 1) {
    ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * alphaMul;
  }
  if (m.b === 0 && m.c === 0 && m.a > 0 && Math.abs(m.a * inv - 1) < 2e-3 && Math.abs(m.d * inv - 1) < 2e-3) {
    const dx = Math.round(m.a * x + m.e);
    const dy = Math.round(m.d * y + m.f);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(spr.c, dx, dy);
    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  } else {
    ctx.drawImage(spr.c, x, y, spr.c.width * inv, spr.c.height * inv);
  }
  if (ga >= 0) ctx.globalAlpha = ga;
}
