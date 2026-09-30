// Unités navales : barque de pêche (Francs : barque à clins ; Gaulois : barque de chêne à fond plat bordée d'osier)
// et navire de guerre (Francs : drakkar ; Gaulois : navire vénète). Les coques se dessinent en projection oblique
// (comme les engins de siège) : u vers l'avant (+x à l'écran), v vers le spectateur, h vers le haut.
// Une coque est décrite par son profil (demi-largeur au plat-bord, hauteur du bordé, demi-largeur à la flottaison) ;
// le flanc proche, l'intérieur visible, le flanc lointain et les bordages sont déduits de ce profil.
// Le reflet, le sillage et les rides sont un calque « sous » le contour (cf. bakeSprite) : jamais d'ombre sur l'herbe.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, vGrad, ballGrad } from './unit-kit.js';
import { mulberry32 } from './palette.js';
import { drawHuman } from './unit-human.js';
import { full, idlePose, attackPose, STANCE, WIDE } from './unit-poses.js';
import { WOOD_D, GOLD, IRON, BRONZE } from './unit-gear.js';
import { EG_HULLS, egBowHead, egSternHead } from './unit-egypt-naval.js';

const LX = -0.42;
const LY = 0.52;
/** Projection d'un point du modèle (u avant, v vers le spectateur, h haut). */
export function pr(u, v, h) {
  return [u + v * LX, v * LY - h];
}

const CREAM = '#eadfc4';
const HULLS = {
  'fish/franks': { L: 52, B: 6.0, H: 5.0, hb: 9.0, hs: 4.2, wl: 0.56, pe: 2.3, pq: 0.72, ph: 2.6, strakes: 3, light: '#a37848', dark: '#6b4626' },
  'fish/gauls': { L: 46, B: 7.4, H: 4.4, hb: 4.6, hs: 4.2, wl: 0.78, pe: 3.4, pq: 0.5, ph: 2.4, strakes: 3, light: '#8a6238', dark: '#654322' },
  'war/franks': { L: 88, B: 7.4, H: 6.4, hb: 13, hs: 9.5, wl: 0.5, pe: 2.4, pq: 0.72, ph: 2.8, strakes: 4, light: '#cfa76c', dark: '#6a4527' },
  'fish/vikings': { L: 50, B: 6.4, H: 5.0, hb: 10.5, hs: 6.5, wl: 0.56, pe: 2.3, pq: 0.72, ph: 2.6, strakes: 3, light: '#7a5634', dark: '#33231a' },
  'war/vikings': { L: 92, B: 7.0, H: 6.0, hb: 16, hs: 12, wl: 0.46, pe: 2.4, pq: 0.72, ph: 2.6, strakes: 4, light: '#8a6440', dark: '#2c1e14' },
  'war/gauls': { L: 78, B: 10.6, H: 10.5, hb: 9.5, hs: 10.5, wl: 0.62, pe: 3.0, pq: 0.55, ph: 2.6, strakes: 5, light: '#7d5735', dark: '#4f3620' },
};
Object.assign(HULLS, EG_HULLS); // coques égyptiennes (clés 'fish/egypt' et 'war/egypt')
const sampleCache = new Map();
/** Points de la coque le long de la quille (resserrés aux extrémités) : { u, B, bw, H }. */
function samples(hd, key) {
  let out = sampleCache.get(key);
  if (out) return out;
  out = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const s = Math.sin((i / n - 0.5) * PI);
    const a = Math.abs(s);
    const B = hd.B * Math.pow(Math.max(0, 1 - Math.pow(a, hd.pe)), hd.pq);
    const H = hd.H + (s > 0 ? hd.hb : hd.hs) * Math.pow(a, hd.ph);
    out.push({ u: (s * hd.L) / 2, B, bw: B * hd.wl, H });
  }
  sampleCache.set(key, out);
  return out;
}

/** Ligne de la coque à la fraction f de la hauteur (0 = flottaison, 1 = plat-bord), côté +1 (proche) ou −1 (lointain). */
function at(S, f, side) {
  return S.map((p) => pr(p.u, side * (p.bw + (p.B - p.bw) * f), p.H * f));
}
/** Bande fermée entre deux lignes de points. */
function strip(ctx, A, B) {
  ctx.beginPath();
  ctx.moveTo(A[0][0], A[0][1]);
  for (let i = 1; i < A.length; i++) ctx.lineTo(A[i][0], A[i][1]);
  for (let i = B.length - 1; i >= 0; i--) ctx.lineTo(B[i][0], B[i][1]);
  ctx.closePath();
}
function trace(ctx, A, c, w) {
  ctx.beginPath();
  ctx.moveTo(A[0][0], A[0][1]);
  for (let i = 1; i < A.length; i++) ctx.lineTo(A[i][0], A[i][1]);
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.stroke();
}
function xRange(A) {
  let a = 1e9;
  let b = -1e9;
  for (const p of A) {
    if (p[0] < a) a = p[0];
    if (p[0] > b) b = p[0];
  }
  return [a, b];
}

// ---------------------------------------------------------------------------
// Calque sous le sujet : reflet sombre sur l'eau, rides, sillage et écume
// ---------------------------------------------------------------------------

function foam(ctx, x, y, rx, ry, a) {
  ctx.fillStyle = rgba('#f2fbff', a);
  ctx.beginPath();
  ell(ctx, x, y, rx, ry, 0);
  ctx.fill();
}

/**
 * Reflet et écume de la coque. F = { walk (0/1), q (phase), ripple (0..1), sink (0..1 : coulée), war, dx (décalage du centre) }.
 */
export function drawWater(ctx, hd, F) {
  const L2 = hd.L / 2;
  const cy = 1.6 + (F.sink || 0) * 2;
  const S = F.sink || 0;
  // Reflet / ombre de la coque sur l'eau : bleu nuit, décalé vers le bas-droite (lumière en haut à gauche)
  const rx = L2 + 4.5;
  const ry = hd.B * LY * 2 + 2.6;
  ctx.save();
  ctx.translate(2.4, cy + 1.2);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(6,26,54,0.55)');
  g.addColorStop(0.6, 'rgba(8,34,66,0.36)');
  g.addColorStop(1, 'rgba(8,34,66,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Reflets clairs de ciel sur l'eau autour de la coque
  ctx.strokeStyle = 'rgba(214,240,250,0.32)';
  ctx.lineWidth = 0.8;
  const rp = F.ripple || 0;
  for (let k = 0; k < 2; k++) {
    const ph = (rp + k * 0.5) % 1;
    const a = 0.5 * (1 - ph) * (0.6 + 0.4 * (F.walk ? 0.5 : 1));
    ctx.strokeStyle = rgba('#e6f6ff', a * 0.75);
    ctx.beginPath();
    ctx.ellipse(0.5, cy + 0.5, L2 + 2.5 + ph * 9, hd.B * LY * 1.5 + 2.6 + ph * 4.2, 0, 0, TAU);
    ctx.stroke();
  }
  // Liseré d'écume à la flottaison (la coque entre dans l'eau)
  ctx.strokeStyle = 'rgba(240,252,255,0.75)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(0, cy - 0.2 + S * 1.2, L2 - hd.L * 0.03 + 0.5, hd.B * hd.wl * LY + 1.5, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,252,255,0.35)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // Sillage en marche : deux branches divergentes derrière la poupe et gerbe à l'étrave
  if (F.walk) {
    const r = mulberry32(hd.L * 31 + 5);
    const period = 7;
    const shift = (F.q || 0) * period;
    const n = F.war ? 15 : 11;
    for (let i = 0; i < n; i++) {
      const d = i * period + shift;
      const t = d / (n * period);
      const u = -L2 + 2 - d * (F.war ? 1.05 : 0.95);
      const spread = (hd.B * 0.5 + d * 0.27) * (F.war ? 1.1 : 1);
      const a = 0.78 * (1 - t) * (1 - t) + 0.05;
      for (const side of [-1, 1]) {
        const [x, y] = pr(u, side * spread, 0);
        const j = r() * 1.4;
        foam(ctx, x, y + 1.6, 3.3 + t * 3.4 + j * 0.4, 1.3 + t * 1.3, a);
        if (i % 2 === 0) foam(ctx, x + 2.4, y + 1.6 + side * 0.9, 1.9 + j * 0.5, 0.8, a * 0.75);
      }
      // Remous central
      if (i < n - 2) {
        const [x, y] = pr(u - 2, 0, 0);
        foam(ctx, x, y + 1.6, 4.4 + t * 5.8, 1.7 + t * 1.7, a * 0.62);
      }
    }
    // Vague d'étrave
    for (const [dx, dy, rxx, ryy, a] of [[3.6, 1.8, 6.6, 2.3, 0.78], [6.4, 3.4, 4.8, 1.6, 0.6], [0.8, 4.4, 5.6, 1.4, 0.5]]) {
      const [x, y] = pr(L2 - 1 + dx, 0, 0);
      foam(ctx, x, y + dy, rxx, ryy, a);
    }
  }
}

// ---------------------------------------------------------------------------
// Coque : intérieur, flanc lointain, flanc proche et bordages
// ---------------------------------------------------------------------------

function drawInterior(ctx, hd, S, civ) {
  const nearTop = at(S, 1, 1);
  const farTop = at(S, 1, -1);
  strip(ctx, nearTop, farTop);
  const [x0, x1] = xRange(nearTop);
  const yTop = Math.min(...farTop.map((p) => p[1]));
  paint(ctx, vGrad(ctx, yTop, yTop + 12, '#3a2716', 0.2, -0.3), null);
  // Face intérieure du flanc lointain (éclairée : elle regarde le spectateur et la lumière)
  const inner = S.map((p) => pr(p.u, -p.bw * 0.7, 0.4));
  strip(ctx, farTop, inner);
  const wood = civ === 'gauls' ? '#73502c' : '#8b6337';
  paint(ctx, sideGrad(ctx, x0, x1, wood, 0.22, -0.18), null);
  // Membrures visibles
  ctx.strokeStyle = rgba(tone(wood, -0.6), 0.55);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 2; i < S.length - 2; i += 2) {
    const a = farTop[i];
    const b = inner[i];
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
  // Plat-bord lointain (épaisseur)
  trace(ctx, farTop, tone(wood, 0.32), 1.5);
  trace(ctx, farTop, edge(wood, 0.6), 0.5);
}

function drawNearFlank(ctx, hd, S, civ, tm, war) {
  const n = hd.strakes;
  const top = at(S, 1, 1);
  const bot = at(S, 0, 1);
  const [x0, x1] = xRange(top.concat(bot));
  const gaul = civ === 'gauls';
  for (let k = 0; k < n; k++) {
    const f0 = k / n;
    const f1 = (k + 1) / n;
    strip(ctx, at(S, f1, 1), at(S, f0, 1));
    let base;
    if (gaul) base = k % 2 ? tone(hd.light, -0.05) : hd.light;
    else base = k % 2 ? hd.dark : hd.light;
    paint(ctx, sideGrad(ctx, x0, x1, base, 0.22, -0.3), null);
    // Ombre sous chaque bordage (clins qui se chevauchent) puis fil clair au-dessus
    trace(ctx, at(S, f0 + 0.004, 1), rgba(tone(base, -0.65), 0.75), 0.75);
    trace(ctx, at(S, f1 - 0.03, 1), rgba(tone(base, 0.45), 0.4), 0.5);
  }
  if (gaul) {
    // Joints verticaux des planches de chêne et chevilles
    ctx.strokeStyle = rgba('#2c1a0c', 0.5);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 1; i < S.length - 1; i += 2) {
      const a = at([S[i]], 0.02, 1)[0];
      const b = at([S[i]], war ? 0.74 : 0.7, 1)[0];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }
  const bandC = tm.main;
  if (!war) {
    // Bande d'équipe au plat-bord
    const f0 = gaul ? 0.62 : 0.8;
    const f1 = gaul ? 0.76 : 1;
    strip(ctx, at(S, f1, 1), at(S, f0, 1));
    paint(ctx, sideGrad(ctx, x0, x1, bandC, 0.25, -0.3), null);
    trace(ctx, at(S, f0, 1), edge(bandC, 0.7), 0.6);
    trace(ctx, at(S, f1, 1), rgba(tone(bandC, 0.55), 0.7), 0.5);
    if (gaul) {
      // Bordure d'osier tressé sur le haut du plat-bord
      strip(ctx, at(S, 1, 1), at(S, 0.76, 1));
      paint(ctx, sideGrad(ctx, x0, x1, '#b39552', 0.25, -0.25), null);
      ctx.strokeStyle = rgba('#5e4520', 0.7);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const A = at(S, 0.76, 1);
      const B = at(S, 1, 1);
      for (let i = 0; i < S.length - 1; i++) {
        ctx.moveTo(A[i][0], A[i][1]);
        ctx.lineTo(B[i + 1][0], B[i + 1][1]);
        ctx.moveTo(B[i][0], B[i][1]);
        ctx.lineTo(A[i + 1][0], A[i + 1][1]);
      }
      ctx.stroke();
      trace(ctx, at(S, 0.76, 1), edge('#b39552', 0.8), 0.6);
    }
  }
  // Contour et liseré clair du plat-bord proche
  strip(ctx, top, bot);
  ctx.strokeStyle = edge(hd.dark, 0.75);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  trace(ctx, at(S, 1, 1), rgba(tone(hd.light, 0.5), 0.75), 0.6);
}

// ---------------------------------------------------------------------------
// Voiles, mâts, agrès
// ---------------------------------------------------------------------------

/** Direction de la vergue (braquée : la voile présente sa face au spectateur). */
const YD = [0.9, 0.44];

/** Point d'une voile carrée : s = position le long de la vergue (−w..w), h = hauteur, b = ventre. */
function sailPt(u0, s, h, b) {
  // le ventre pousse vers l'avant, perpendiculairement à la vergue
  return pr(u0 + s * YD[0] + b * YD[1], s * YD[1] - b * YD[0], h);
}

/**
 * Voile carrée braquée sur son mât en u0 : bandes verticales, ventre vers l'avant.
 * stripes : couleurs des bandes ; w : demi-largeur ; h0..h1 : bords bas/haut ; belly : gonflement (px).
 */
function drawSail(ctx, u0, w, h0, h1, belly, stripes, leather) {
  const n = stripes.length;
  const m = 7;
  const bel = (s, h) => belly * Math.sin((PI * (s + w)) / (2 * w)) * Math.pow(Math.sin((PI * (h - h0)) / (h1 - h0)), 0.8);
  const col = (s) => {
    const out = [];
    for (let k = 0; k <= m; k++) {
      const h = h0 + ((h1 - h0) * k) / m;
      out.push(sailPt(u0, s, h, bel(s, h)));
    }
    return out;
  };
  for (let j = 0; j < n; j++) {
    const sA = -w + (2 * w * j) / n;
    const sB = -w + (2 * w * (j + 1)) / n;
    const A = col(sA);
    const B = col(sB);
    ctx.beginPath();
    ctx.moveTo(A[0][0], A[0][1]);
    for (let k = 1; k <= m; k++) ctx.lineTo(A[k][0], A[k][1]);
    for (let k = m; k >= 0; k--) ctx.lineTo(B[k][0], B[k][1]);
    ctx.closePath();
    const c = stripes[j];
    // Ombrage : plus clair côté lumière (gauche), creux du ventre plus sombre
    const sh = 0.16 - 0.3 * (j / Math.max(1, n - 1)) - 0.06 * Math.sin((PI * (j + 0.5)) / n) * (belly > 0.6 ? 1 : 0);
    const top = Math.min(A[m][1], B[m][1]);
    const bot = Math.max(A[0][1], B[0][1]);
    const gr = ctx.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, tone(c, sh + 0.08));
    gr.addColorStop(1, tone(c, sh - 0.14));
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = leather ? rgba('#3a2412', 0.75) : rgba(tone(c, -0.55), 0.5);
    ctx.lineWidth = leather ? 0.7 : 0.45;
    ctx.stroke();
    if (leather && j < n - 1) {
      // Points de couture clairs le long de la couture
      ctx.setLineDash([1.1, 1.2]);
      ctx.strokeStyle = 'rgba(250,232,190,0.6)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(B[0][0] - 0.7, B[0][1]);
      for (let k = 1; k <= m; k++) ctx.lineTo(B[k][0] - 0.7, B[k][1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  // Ourlet du bas et ralingue du haut
  const bl = sailPt(u0, -w, h0, 0);
  const br = sailPt(u0, w, h0, 0);
  line(ctx, bl[0], bl[1], br[0], br[1], rgba('#2a1a0e', 0.55), 0.9);
}

/** Bande horizontale d'une voile (couleur d'équipe) entre les hauteurs h0 et h1. */
function sailBand(ctx, u0, w, h0, h1, ha, hb, belly, c) {
  const m = 8;
  const bel = (s, h) => belly * Math.sin((PI * (s + w)) / (2 * w)) * Math.pow(Math.sin((PI * (h - h0)) / (h1 - h0)), 0.8);
  const lo = [];
  const hi = [];
  for (let k = 0; k <= m; k++) {
    const s = -w + (2 * w * k) / m;
    lo.push(sailPt(u0, s, ha, bel(s, ha)));
    hi.push(sailPt(u0, s, hb, bel(s, hb)));
  }
  strip(ctx, hi, lo);
  paint(ctx, sideGrad(ctx, lo[0][0], lo[m][0], c, 0.2, -0.28), edge(c, 0.75), 0.5);
}

function yard(ctx, u0, w, h, c = '#5c3d22') {
  const a = sailPt(u0, -w - 2.5, h, 0);
  const b = sailPt(u0, w + 2.5, h, 0);
  ctx.beginPath();
  capsule(ctx, a[0], a[1], 1.15, b[0], b[1], 0.95);
  paint(ctx, vGrad(ctx, a[1] - 1, a[1] + 2, c, 0.3, -0.25), edge(c, 0.7), 0.5);
}

function mast(ctx, u0, h0, h1, thick = 1.5) {
  const a = pr(u0, 0, h0);
  const b = pr(u0, 0, h1);
  ctx.beginPath();
  capsule(ctx, a[0], a[1], thick, b[0], b[1], thick * 0.72);
  paint(ctx, sideGrad(ctx, a[0] - thick, a[0] + thick, '#7a5230', 0.3, -0.3), edge('#7a5230', 0.7), 0.5);
}

/** Fanion d'équipe au bout d'une hampe. */
function pennant(ctx, x, y, c, wave, len = 9) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - len * 0.5, y - 0.8 + wave, x - len, y + 0.6 + wave * 1.4);
  ctx.lineTo(x - len * 0.72, y + 2.1 + wave);
  ctx.lineTo(x - len, y + 3.8 + wave * 1.4);
  ctx.quadraticCurveTo(x - len * 0.5, y + 3.6 + wave, x, y + 3.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x - len, x, c, 0.22, -0.2), edge(c, 0.8), 0.5);
}

function rope(ctx, a, b, sag = 0) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]);
  ctx.strokeStyle = 'rgba(50,34,18,0.85)';
  ctx.lineWidth = 0.55;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Objets à bord : poissons, filet
// ---------------------------------------------------------------------------

function fishBody(ctx, x, y, len, rot, k = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const h = len * 0.26;
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, 0);
  ctx.quadraticCurveTo(-len * 0.2, -h * 1.15, len * 0.26, -h * 0.55);
  ctx.quadraticCurveTo(len * 0.52, -h * 0.1, len * 0.5, 0.15);
  ctx.quadraticCurveTo(len * 0.3, h * 0.9, -len * 0.16, h * 0.9);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, k % 2 ? '#7f9cb0' : '#6f8fa8');
  g.addColorStop(0.5, '#d4e2ea');
  g.addColorStop(1, '#f4f8fa');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,50,70,0.75)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  // Queue
  ctx.beginPath();
  ctx.moveTo(-len * 0.46, 0);
  ctx.lineTo(-len * 0.7, -h * 0.95);
  ctx.lineTo(-len * 0.62, 0.05);
  ctx.lineTo(-len * 0.7, h * 0.95);
  ctx.closePath();
  ctx.fillStyle = '#8aa6b8';
  ctx.fill();
  ctx.stroke();
  // Œil
  ctx.fillStyle = '#1d2830';
  ctx.beginPath();
  ell(ctx, len * 0.34, -h * 0.2, Math.max(0.35, len * 0.045), Math.max(0.35, len * 0.045));
  ctx.fill();
  ctx.restore();
}

/** Tas de poissons argentés dans la barque (centre (x, y) du tas, taille s). */
function fishPile(ctx, x, y, s) {
  ctx.beginPath();
  ell(ctx, x, y + 1.2 * s, 8.2 * s, 3.4 * s);
  paint(ctx, '#4d5f6a', edge('#4d5f6a', 0.5), 0.4);
  const spots = [
    [-5.2, 0.6, 0.25], [-1.4, 1.1, -0.15], [3.6, 0.9, 0.2], [6.2, 1.4, -0.3],
    [-3.4, -1.0, -0.3], [1.0, -0.4, 0.28], [4.6, -0.9, -0.1], [-0.6, -2.5, 0.12], [2.4, -2.3, -0.32],
  ];
  spots.forEach(([dx, dy, r], i) => fishBody(ctx, x + dx * s, y + dy * s, (i < 4 ? 6.6 : 6.0) * s, r + (i % 2 ? PI * 0.02 : 0), i));
  // Éclats argentés
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [dx, dy] of [[-2.2, -2.4], [3.4, -2.8], [0.4, -0.7]]) {
    ctx.fillRect(x + dx * s, y + dy * s, 0.7, 0.7);
  }
}

/** Filet : maille dessinée à plat (ellipse) ; r = 0..1 : ouverture ; g = 0..1 : filet ramassé. */
function drawNet(ctx, x, y, rx, ry, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ell(ctx, 0, 0, rx, ry);
  ctx.fillStyle = 'rgba(30,50,40,0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,220,182,0.85)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ell(ctx, 0, 0, rx, ry);
  ell(ctx, 0, 0, rx * 0.62, ry * 0.62);
  ell(ctx, 0, 0, rx * 0.28, ry * 0.28);
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * TAU;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
  }
  ctx.stroke();
  // Flotteurs de liège autour du filet
  for (let i = 0; i < 9; i++) {
    const a = spin + (i / 9) * TAU;
    const fx = Math.cos(a) * rx;
    const fy = Math.sin(a) * ry;
    ctx.fillStyle = '#c9a060';
    ctx.strokeStyle = 'rgba(60,36,12,0.85)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ell(ctx, fx, fy, 0.8, 0.65);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bordage d'étrave et de poupe : têtes sculptées
// ---------------------------------------------------------------------------

/** Tête de dragon (drakkar) dressée à l'étrave : cou en S, gueule ouverte, dents, œil rouge. (x, y) = pied du cou. */
function dragonHead(ctx, x, y, s, gold) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const c = '#7a2f22';
  // Cou : courbe épaisse effilée
  ctx.beginPath();
  ctx.moveTo(-3.4, 1.6);
  ctx.bezierCurveTo(-2.0, -6, 3.8, -8, 5.6, -13.4);
  ctx.lineTo(9.8, -12.2);
  ctx.bezierCurveTo(8, -6.6, 3.4, -4, 2.6, 1.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -3, 10, '#8a3626', 0.28, -0.3), edge('#7a2f22', 0.85), 0.6);
  // Écailles dorées le long du cou
  ctx.strokeStyle = gold;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const [ax, ay] of [[-0.6, -1.6], [0.6, -4.4], [2.4, -7.2], [4.2, -10]]) {
    ctx.moveTo(ax - 1, ay + 0.6);
    ctx.lineTo(ax + 1.8, ay - 0.2);
  }
  ctx.stroke();
  // Tête : crâne, mâchoires ouvertes
  ctx.beginPath();
  ctx.moveTo(4.4, -12.6);
  ctx.quadraticCurveTo(6.4, -17.4, 10.6, -16.4);
  ctx.quadraticCurveTo(14.8, -16.2, 17.4, -13.8);
  ctx.lineTo(13.4, -13.0);
  ctx.lineTo(17.2, -11.2);
  ctx.quadraticCurveTo(13.4, -9.6, 9.6, -10.4);
  ctx.quadraticCurveTo(6.8, -10.2, 4.4, -12.6);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 8, -14, 8, '#9a3a28', 0.3, -0.3), edge('#7a2f22', 0.9), 0.6);
  // Crête/oreille
  ctx.beginPath();
  poly(ctx, [5.6, -15.6, 3.2, -19.2, 8.4, -17.0]);
  paint(ctx, gold, edge(gold, 0.8), 0.5);
  // Dents
  ctx.fillStyle = '#f4ecd8';
  for (const [tx, ty] of [[11.4, -13.2], [13.4, -13.0], [15.4, -12.9]]) {
    ctx.beginPath();
    poly(ctx, [tx - 0.8, ty, tx + 0.8, ty, tx, ty + 1.6]);
    ctx.fill();
  }
  // Œil et narine
  ctx.fillStyle = '#ffdf60';
  ctx.beginPath();
  ell(ctx, 9.2, -15.0, 1.15, 1.0);
  ctx.fill();
  ctx.fillStyle = '#b01818';
  ctx.beginPath();
  ell(ctx, 9.4, -15.0, 0.55, 0.55);
  ctx.fill();
  ctx.fillStyle = '#2a1008';
  ctx.beginPath();
  ell(ctx, 15.8, -15.0, 0.55, 0.4);
  ctx.fill();
  ctx.restore();
}

/** Tête de sanglier de bronze (proue vénète) : hure crêtée de soies, groin, défense, collier d'équipe. */
function boarHead(ctx, x, y, s, team) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const c = '#a4712c';
  // Cou et collier aux couleurs de l'équipe
  ctx.beginPath();
  poly(ctx, [-5.6, 4.6, -3.4, -2.4, 3.4, -2.0, 3.2, 4.6]);
  paint(ctx, sideGrad(ctx, -5, 4, tone(c, -0.15), 0.2, -0.3), edge(c, 0.9), 0.5);
  ctx.beginPath();
  poly(ctx, [-5.4, 3.4, -4.7, 0.2, 3.7, 0.4, 3.3, 3.4]);
  paint(ctx, team, edge(team, 0.85), 0.5);
  // Crête de soies
  ctx.beginPath();
  ctx.moveTo(-5.0, -1.6);
  const bs = [[-6.4, -6.0], [-3.8, -4.4], [-4.2, -9.6], [-1.4, -6.6], [0.6, -12.0], [2.2, -7.8], [5.4, -11.2], [6.0, -7.2], [9.4, -8.4], [9.2, -5.2]];
  for (const [bx, by] of bs) ctx.lineTo(bx, by);
  ctx.lineTo(4, -2.4);
  ctx.closePath();
  paint(ctx, '#3a2818', edge('#3a2818', 0.9), 0.5);
  // Hure
  ctx.beginPath();
  ctx.moveTo(-4.6, 3.6);
  ctx.bezierCurveTo(-6.2, -3.4, -1.6, -8.4, 4.2, -7.8);
  ctx.quadraticCurveTo(9.6, -7.0, 12.6, -3.6);
  ctx.lineTo(14.2, -3.4);
  ctx.lineTo(14.6, 0.8);
  ctx.quadraticCurveTo(11.6, 2.2, 8.6, 3.0);
  ctx.quadraticCurveTo(3.4, 5.4, -4.6, 3.6);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 3.5, -3.4, 10, c, 0.5, -0.4), edge(c, 0.95), 0.6);
  // Museau : disque du groin
  ctx.beginPath();
  ell(ctx, 14.3, -1.3, 1.5, 2.7);
  paint(ctx, tone(c, 0.3), edge(c, 0.9), 0.5);
  ctx.fillStyle = '#20140a';
  ctx.beginPath();
  ell(ctx, 14.6, -2.2, 0.42, 0.62);
  ell(ctx, 14.6, -0.2, 0.42, 0.62);
  ctx.fill();
  // Défense d'ivoire qui se relève
  ctx.beginPath();
  ctx.moveTo(8.6, 2.6);
  ctx.quadraticCurveTo(13.2, 3.4, 12.0, -3.2);
  ctx.strokeStyle = 'rgba(40,28,12,0.9)';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = '#f6efd8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Œil et sourcil, oreille
  ctx.fillStyle = '#ffe070';
  ctx.beginPath();
  ell(ctx, 7.6, -3.7, 1.3, 1.15);
  ctx.fill();
  ctx.fillStyle = '#1c1008';
  ctx.beginPath();
  ell(ctx, 7.8, -3.7, 0.55, 0.6);
  ctx.fill();
  line(ctx, 5.6, -5.4, 9.4, -4.8, 'rgba(30,18,6,0.9)', 0.8);
  ctx.beginPath();
  poly(ctx, [0.6, -7.4, 1.6, -12.0, 4.2, -8.0]);
  paint(ctx, tone(c, -0.2), edge(c, 0.9), 0.5);
  ctx.restore();
}

/** Volute de poupe (drakkar) : queue de dragon enroulée. (x, y) = pied. */
function sternCurl(ctx, x, y, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(1.6, 1.0);
  ctx.bezierCurveTo(1.6, -7, -1.8, -11, -5.8, -12.4);
  ctx.bezierCurveTo(-9.2, -13.4, -10.6, -9.6, -7.6, -8.0);
  ctx.bezierCurveTo(-5.4, -7.0, -4.0, -9.4, -5.8, -10.4);
  ctx.lineWidth = 3.6;
  ctx.strokeStyle = 'rgba(30,16,8,0.9)';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = c;
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = 'rgba(255,240,200,0.5)';
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Équipage
// ---------------------------------------------------------------------------

const NET_LAND = { x: 34, y: 9 };

/** État du filet du pêcheur selon la phase p du cycle de pêche (0..1). */
function netState(p) {
  // 0..0.24 préparation ; 0.24..0.42 lancer ; 0.42..0.6 sur l'eau ; 0.6..0.86 halage ; 0.86..1 relevé
  const hx = -2.6;
  const hy = -12;
  if (p < 0.24) return { air: 0, x: hx, y: hy, r: 0, inHands: 1, rope: 0 };
  if (p < 0.42) {
    const t = (p - 0.24) / 0.18;
    return { x: lerp(hx + 4, NET_LAND.x, smooth(t)), y: lerp(hy, NET_LAND.y, t) - Math.sin(t * PI) * 14, r: smooth(t), inHands: 0, rope: 1, spread: t };
  }
  if (p < 0.6) return { x: NET_LAND.x, y: NET_LAND.y, r: 1, rope: 1, spread: 1, ring: (p - 0.42) / 0.18 };
  if (p < 0.86) {
    const t = smooth((p - 0.6) / 0.26);
    return { x: lerp(NET_LAND.x, 8, t), y: lerp(NET_LAND.y, 8.5, t), r: lerp(1, 0.42, t), rope: 1, spread: 1 - t * 0.5, haul: 1 };
  }
  const t = smooth((p - 0.86) / 0.14);
  return { x: lerp(8, hx + 6, t), y: lerp(8.5, hy - 1, t), r: lerp(0.42, 0.1, t), rope: 1, spread: 0.3, lift: 1, catchGlint: 1 };
}

/** Pose du pêcheur : phase de pêche. */
function fisherPose(p) {
  const keys = [
    [0.0, { nU: 0.7, nF: 1.7, fU: 0.5, fF: 1.6, lean: 0.06, ...STANCE }],
    [0.16, { nU: -0.5, nF: 0.3, fU: -0.3, fF: 0.5, lean: -0.16, ...WIDE }],
    [0.3, { nU: 2.7, nF: 2.5, fU: 2.4, fF: 2.3, lean: 0.24, ...WIDE, nT: -0.3 }],
    [0.42, { nU: 1.6, nF: 1.9, fU: 1.5, fF: 1.8, lean: 0.14, ...WIDE }],
    [0.6, { nU: 1.3, nF: 1.6, fU: 1.2, fF: 1.5, lean: 0.06, ...WIDE }],
    [0.72, { nU: 0.4, nF: 1.2, fU: 0.9, fF: 1.7, lean: -0.2, ...WIDE }],
    [0.8, { nU: 1.3, nF: 1.7, fU: 0.4, fF: 1.1, lean: -0.2, ...WIDE }],
    [0.9, { nU: 0.6, nF: 1.7, fU: 0.5, fF: 1.5, lean: -0.05, ...STANCE }],
    [1.0, { nU: 0.7, nF: 1.7, fU: 0.5, fF: 1.6, lean: 0.06, ...STANCE }],
  ];
  // interpolation manuelle (mêmes règles que keyPose sans boucle)
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, a] = keys[i];
    const [p1, b] = keys[i + 1];
    if (p >= p0 && p <= p1) {
      const t = smooth((p - p0) / (p1 - p0));
      const o = {};
      for (const k in a) o[k] = a[k] + ((b[k] === undefined ? a[k] : b[k]) - a[k]) * t;
      return full(o);
    }
  }
  return full(keys[0][1]);
}

// ---------------------------------------------------------------------------
// Dessin complet d'un bateau
// ---------------------------------------------------------------------------

function hullKey(S) {
  return (S.ship === 'war' ? 'war/' : 'fish/') + S.civ;
}

/** Paramètres de coque d'une unité (utilisés aussi par le calque d'eau). */
export function hullOf(S) {
  return HULLS[hullKey(S)];
}

const DECK = -1;

/** Rangée de boucliers ronds accrochés au bordé (drakkar). */
function shieldRow(ctx, hd, S, tm, colFn) {
  const cols = colFn ? colFn(tm) : [tm.main, CREAM, tm.main, '#c9a24a', tm.main, CREAM, tm.main, '#2f4058'];
  let i = 0;
  for (let u = -35; u <= 35.1; u += 8.75, i++) {
    const s = u / (hd.L / 2);
    const p = S.find((q) => Math.abs(q.u - u) < 2.4) || null;
    const a = Math.abs(s);
    const B = hd.B * Math.pow(Math.max(0, 1 - Math.pow(a, hd.pe)), hd.pq);
    const H = hd.H + (s > 0 ? hd.hb : hd.hs) * Math.pow(a, hd.ph);
    void p;
    const f = 0.62;
    const [x, y] = pr(u, B * hd.wl + (B - B * hd.wl) * f + 0.3, H * f);
    const c = cols[i % cols.length];
    ctx.beginPath();
    ell(ctx, x - 0.5, y, 3.05, 3.1);
    paint(ctx, '#3b2a1a', null);
    ctx.beginPath();
    ell(ctx, x, y, 3.0, 3.1);
    paint(ctx, ballGrad(ctx, x, y, 3.4, c, 0.3, -0.32), edge(c, 0.85), 0.55);
    ctx.beginPath();
    ell(ctx, x + 0.1, y, 0.85, 0.85);
    paint(ctx, ballGrad(ctx, x, y, 1, '#b7bfc8', 0.5, -0.3), 'rgba(30,30,34,0.85)', 0.35);
    ctx.strokeStyle = rgba('#ffffff', 0.35);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, PI * 0.95, PI * 1.6);
    ctx.stroke();
  }
}

/** Rames du drakkar (flanc proche) : balancement en marche, pales aux couleurs de l'équipe. */
function oars(ctx, hd, tm, anim, q, dying) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const u = -34 + i * 8.5 + 4.2;
    const s = u / (hd.L / 2);
    const a = Math.abs(s);
    const B = hd.B * Math.pow(Math.max(0, 1 - Math.pow(a, hd.pe)), hd.pq);
    const H = hd.H + (s > 0 ? hd.hb : hd.hs) * Math.pow(a, hd.ph);
    const ph = q * TAU + i * 0.5;
    let sw = 0;
    let lift = 0;
    if (anim === 1) {
      sw = 5.5 * Math.sin(ph);
      lift = 3.2 * Math.max(0, Math.cos(ph));
    } else if (dying) {
      sw = 0;
      lift = 5;
    } else {
      sw = 0.8 * Math.sin(q * TAU + i);
      lift = 1.2;
    }
    const port = pr(u, B * 0.92, H * 0.55);
    const inb = pr(u + 1.2, B * 0.3, H + 2.6);
    const tip = pr(u - 1.2 - sw * 0.35, B + 5.2, -1.0 + lift);
    const blade = pr(u - 1.8 - sw * 0.45, B + 8.6, -1.8 + lift * 0.9);
    // Manche (de l'intérieur, par le sabord, jusqu'à l'eau)
    ctx.beginPath();
    ctx.moveTo(inb[0], inb[1]);
    ctx.lineTo(port[0], port[1]);
    ctx.lineTo(tip[0], tip[1]);
    ctx.strokeStyle = 'rgba(30,18,8,0.9)';
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.strokeStyle = '#c8a06a';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Pale
    const ang = Math.atan2(blade[1] - tip[1], blade[0] - tip[0]);
    ctx.save();
    ctx.translate((tip[0] + blade[0]) / 2, (tip[1] + blade[1]) / 2);
    ctx.rotate(ang);
    ctx.beginPath();
    ell(ctx, 0, 0, Math.hypot(blade[0] - tip[0], blade[1] - tip[1]) / 2 + 0.6, 1.25);
    paint(ctx, tm.main, edge(tm.main, 0.85), 0.5);
    ctx.restore();
  }
}

/** Épaisses barres de bordé (murailles vénètes) : boulons de fer et lisses. */
function gaulWarDetails(ctx, hd, S, tm) {
  const [x0, x1] = xRange(at(S, 1, 1));
  // Bande d'équipe peinte sous le plat-bord
  const f0 = 0.78;
  const f1 = 0.9;
  strip(ctx, at(S, f1, 1), at(S, f0, 1));
  paint(ctx, sideGrad(ctx, x0, x1, tm.main, 0.25, -0.3), null);
  trace(ctx, at(S, f0, 1), edge(tm.main, 0.8), 0.6);
  trace(ctx, at(S, f1, 1), edge(tm.main, 0.8), 0.6);
  // Lisses de chêne (bandes claires épaisses) et boulons
  for (const f of [0.34, 0.6]) {
    trace(ctx, at(S, f, 1), rgba('#b48a52', 0.85), 1.6);
    trace(ctx, at(S, f - 0.012, 1), rgba('#2c1a0c', 0.6), 0.6);
  }
  ctx.fillStyle = '#c4cbd2';
  ctx.strokeStyle = 'rgba(20,20,24,0.8)';
  ctx.lineWidth = 0.3;
  for (const f of [0.34, 0.6, 0.72]) {
    const L = at(S, f, 1);
    for (let i = 2; i < L.length - 2; i += 2) {
      ctx.beginPath();
      ell(ctx, L[i][0], L[i][1], 0.75, 0.75);
      ctx.fill();
      ctx.stroke();
    }
  }
  // Pavois : montants de bois au-dessus du plat-bord aux deux extrémités (hautes murailles avant et arrière)
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const u = side * (28 + k * 3.3);
      const s = u / (hd.L / 2);
      const a = Math.abs(s);
      const B = hd.B * Math.pow(Math.max(0, 1 - Math.pow(a, hd.pe)), hd.pq);
      const H = hd.H + (s > 0 ? hd.hb : hd.hs) * Math.pow(a, hd.ph);
      const p0 = pr(u, B, H - 0.3);
      const p1 = pr(u, B, H + 2.6);
      line(ctx, p0[0], p0[1], p1[0], p1[1], '#2e1c0c', 1.9);
      line(ctx, p0[0], p0[1], p1[0], p1[1], '#8a6236', 1.0);
    }
  }
}

/**
 * S = spec { ship: 'fish'|'war', civ, team: {main, dark, light}, sp (pêcheur), archer (costume des archers) } ;
 * P = { anim: 0 idle | 1 walk | 2 work | 3 attack | 4 die, q (phase), carry (0/2), aim (angle de membre) }.
 */
export function drawBoat(ctx, S, P) {
  const key = hullKey(S);
  const hd = HULLS[key];
  const SM = samples(hd, key);
  const war = S.ship === 'war';
  const gaul = S.civ === 'gauls';
  const tm = S.team;
  const q = P.q || 0;
  const anim = P.anim;
  const dying = anim === 4;
  const e = dying ? smooth(clamp(q / 0.95)) : 0;

  // Mouvement : tangage doux à l'arrêt, roulis léger en marche, gîte et enfoncement à la mort
  let pitch;
  let bob;
  if (anim === 1) {
    pitch = 0.026 * Math.sin(q * TAU) + 0.01;
    bob = -0.7 * (0.5 + 0.5 * Math.sin(q * TAU * 2));
  } else {
    pitch = (war ? 0.024 : 0.036) * Math.sin(q * TAU);
    bob = -0.9 * (0.5 + 0.5 * Math.sin(q * TAU + 1.2));
  }
  let sinkY = 0;
  if (dying) {
    pitch = 0.02 + (war ? 0.42 : 0.95) * e;
    sinkY = e * (war ? 36 : 22);
    bob = 0;
  }
  const belly = anim === 1 ? (war ? 5 : 3.2) : dying ? 0.4 : 1.2 + 0.6 * Math.sin(q * TAU);
  const flap = anim === 1 ? 0.5 + 0.5 * Math.sin(q * TAU * 3) : Math.sin(q * TAU) * 0.4;
  const uB = hd.L / 2;
  const Hb = hd.H + hd.hb;
  const Hs = hd.H + hd.hs;
  const crewOn = !dying || e < 0.35;

  ctx.save();
  if (dying) {
    // Tout ce qui passe sous la ligne de flottaison est masqué
    ctx.beginPath();
    ctx.rect(-240, -240, 480, 240 + 3.4);
    ctx.clip();
  }
  ctx.translate(0, bob + sinkY);
  ctx.rotate(pitch);

  drawInterior(ctx, hd, SM, S.civ);

  // Étraves : poteaux d'extrémité (derrière le flanc proche)
  if (!(gaul && war)) {
    ctx.beginPath();
    const a = pr(uB - 1.2, 0, hd.H + hd.hb * 0.55);
    const b = pr(uB + (war ? 3.0 : 1.4), 0, Hb + (war ? 3.5 : 2.6));
    capsule(ctx, a[0], a[1], 1.2, b[0], b[1], 1.0);
    paint(ctx, tone(hd.dark, 0.1), edge(hd.dark, 0.8), 0.5);
  }

  if (!war) {
    // Bancs de la barque
    for (const u of [-11, 3, 15]) {
      const a = pr(u, -hd.B * 0.9, 3.2);
      const b = pr(u, hd.B * 0.9, 3.2);
      ctx.beginPath();
      capsule(ctx, a[0], a[1], 0.9, b[0], b[1], 0.9);
      paint(ctx, gaul ? '#6f4d2b' : '#8a6137', edge('#5a3a20', 0.7), 0.4);
    }
    // Cargaison : tas de poissons argentés
    if (P.carry === 2 && !dying) {
      const [fx, fy] = pr(gaul ? -1 : 2, -0.6, -0.2);
      fishPile(ctx, fx, fy - 0.4, 1.02);
    }
    // Pêcheur, tourné vers l'étrave
    if (crewOn) {
      const fp = pr(gaul ? -7 : -8, 0.4, DECK);
      ctx.save();
      ctx.translate(fp[0], fp[1] + (dying ? e * 8 : 0));
      let Pf;
      if (dying) Pf = full({ ...STANCE, nU: 2.6, nF: 2.9, fU: 2.4, fF: 2.7, lean: -0.15 });
      else if (anim === 2) Pf = fisherPose(q);
      else if (anim === 1) Pf = full({ ...STANCE, nU: 0.4 + 0.15 * Math.sin(q * TAU), nF: 1.5, fU: 0.3, fF: 1.3, lean: 0.08 });
      else {
        Pf = idlePose('sword', q, null);
        Pf.nU = 0.9;
        Pf.nF = 1.75;
        Pf.fU = 0.6;
        Pf.fF = 1.5;
      }
      const R = drawHuman(ctx, S.sp, Pf, { weapon: null });
      P.hand = [fp[0] + R.handN[0], fp[1] + R.handN[1]];
      ctx.restore();
    }
    // Voile, mât, haubans
    const u0 = gaul ? 6 : 7;
    const w = gaul ? 8.5 : 8;
    const h0 = 9.5;
    const h1 = 27;
    mast(ctx, u0, 0, h1 + 3, 1.05);
    const base = gaul ? '#b98c5a' : CREAM;
    drawSail(ctx, u0, w, h0, h1, belly * 0.6, [base, base, base, base], gaul);
    sailBand(ctx, u0, w, h0, h1, h0 + 0.3, h0 + 4.4, belly * 0.6, tm.main);
    if (!gaul) sailBand(ctx, u0, w, h0, h1, h1 - 4.4, h1 - 0.3, belly * 0.6, tm.main);
    yard(ctx, u0, w, h1 + 0.2);
    const top = pr(u0, 0, h1 + 3);
    pennant(ctx, top[0], top[1] - 0.5, tm.main, flap, 7);
    rope(ctx, pr(u0, 0, h1 + 2), pr(uB - 0.5, 0, Hb - 0.5), 1.2);
    rope(ctx, pr(u0, 0, h1 + 2), pr(-uB + 0.5, 0, Hs - 0.5), 1.4);
  } else {
    // Archers à bord (2 ou 3), sur le pont ou les plates-formes d'extrémité
    const spots = gaul ? [[-30, 8.5], [-2, 4.5], [31, 8.5]] : [[-31, 4.5], [19, 0.5], [33, 6]];
    if (S.deck && crewOn) S.deck(ctx, S, P, pr);
    if (crewOn && !S.deck) {
      spots.forEach(([u, h], i) => {
        const [x, y] = pr(u, gaul ? -0.5 : 0.4, h + DECK);
        let Pa;
        if (anim === 3) {
          const qq = clamp(q - i * 0.035);
          Pa = attackPose('bow', qq, P.aim === undefined ? 1.2 : P.aim);
        } else {
          Pa = idlePose('bow', (q + i * 0.31) % 1, null);
          if (anim === 1) Pa.lean += 0.03;
        }
        ctx.save();
        ctx.translate(x, y + (dying ? e * 10 : 0));
        drawHuman(ctx, S.archer, Pa, { weapon: 'bow' });
        ctx.restore();
      });
    }
    // Mât, voile, agrès (le mât tombe à la mort)
    const fall = dying ? smooth(clamp(q * 1.7)) : 0;
    const u0 = gaul ? 0 : -1;
    const hm = gaul ? 64 : 60;
    const h0 = gaul ? 27 : 23;
    const h1 = gaul ? 56 : 52;
    const w = gaul ? 17 : 17.5;
    const base = pr(u0, 0, 0);
    ctx.save();
    if (fall > 0) {
      ctx.translate(base[0], base[1]);
      ctx.rotate(fall * (gaul ? 1.4 : -1.35));
      ctx.translate(-base[0], -base[1]);
    }
    mast(ctx, u0, 0, hm, 1.7);
    // Haubans (dessinés derrière la voile)
    if (!fall) {
      rope(ctx, pr(u0, 0, hm - 1), pr(uB + 2, 0, Hb + 1), 2.0);
      rope(ctx, pr(u0, 0, hm - 1), pr(-uB - 1, 0, Hs + 1), 2.4);
    }
    if (gaul) {
      drawSail(ctx, u0, w, h0, h1, belly, [tm.main, tm.main, tm.main, tm.main, tm.main, tm.main], true);
      // Emblème : disque clair à spirale (triskèle stylisé) au centre de la voile
      const [cx, cy] = sailPt(u0, 0, (h0 + h1) / 2, belly * 0.95);
      ctx.beginPath();
      ell(ctx, cx, cy, 6.2, 6.6);
      ctx.fillStyle = rgba('#f2e6c0', 0.9);
      ctx.fill();
      ctx.strokeStyle = rgba(tone(tm.main, -0.45), 0.9);
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU - 0.6;
        ctx.moveTo(cx, cy);
        ctx.arc(cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, 2.2, a + PI, a + PI * 2.2);
      }
      ctx.strokeStyle = rgba(tone(tm.main, -0.4), 0.95);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      const st = [];
      const sc = S.sailCols ? S.sailCols(tm) : [tm.main, CREAM];
      for (let k = 0; k < 9; k++) st.push(sc[k % sc.length]);
      drawSail(ctx, u0, w, h0, h1, belly, st, false);
      sailBand(ctx, u0, w, h0, h1, h1 - 2.2, h1, belly, tone(tm.main, -0.1));
    }
    yard(ctx, u0, w, h1 + 0.3, '#5a3a1e');
    const top = pr(u0, 0, hm + 1);
    line(ctx, top[0], top[1], top[0], top[1] - 4, '#4a3220', 1);
    pennant(ctx, top[0], top[1] - 4, tm.main, flap, gaul ? 13 : 12);
    ctx.restore();
    // Galhaubans de chaque bord
    if (!fall) {
      for (const sd of [-1, 1]) {
        rope(ctx, pr(u0, 0, hm - 14), pr(u0 - 3, sd * (hd.B - 0.3), hd.H - 0.5), 0.6);
        rope(ctx, pr(u0, 0, hm - 14), pr(u0 + 4, sd * (hd.B - 0.4), hd.H - 0.5), 0.6);
      }
    }
  }

  // Flanc proche
  drawNearFlank(ctx, hd, SM, S.civ, tm, war);
  if (war) {
    if (gaul) gaulWarDetails(ctx, hd, SM, tm);
    else {
      oars(ctx, hd, tm, anim, q, dying);
      shieldRow(ctx, hd, SM, tm, S.shieldCols);
    }
  }

  // Étraves, têtes sculptées et fanions
  if (!war) {
    const bowTop = pr(uB + 1.4, 0, Hb + 2.6);
    if (!gaul) {
      ctx.beginPath();
      ctx.moveTo(bowTop[0] - 1.8, bowTop[1] + 3.6);
      ctx.bezierCurveTo(bowTop[0] + 0.6, bowTop[1] - 1, bowTop[0] + 5.2, bowTop[1] - 2.4, bowTop[0] + 4.6, bowTop[1] + 1.6);
      ctx.quadraticCurveTo(bowTop[0] + 3.6, bowTop[1] + 3.2, bowTop[0] + 2.2, bowTop[1] + 1.6);
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = 'rgba(30,16,8,0.9)';
      ctx.stroke();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = tone(hd.dark, 0.14);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ell(ctx, bowTop[0] + 3.2, bowTop[1] + 0.8, 0.85, 0.85);
      ctx.fill();
    } else {
      const a = pr(uB, 0, hd.H + hd.hb * 0.6);
      const b = pr(uB + 1.4, 0, Hb + 2);
      ctx.beginPath();
      capsule(ctx, a[0], a[1], 1.7, b[0], b[1], 1.3);
      paint(ctx, tone(hd.light, 0.05), edge(hd.dark, 0.85), 0.5);
      ctx.fillStyle = tm.main;
      ctx.beginPath();
      ell(ctx, b[0], b[1] - 0.2, 1.1, 1.1);
      ctx.fill();
    }
    const st = pr(-uB + 1.5, 0, Hs + 1);
    line(ctx, st[0], st[1], st[0], st[1] - 11, '#4a3220', 0.9);
    pennant(ctx, st[0], st[1] - 11, tm.main, flap, 9);
  } else if (!gaul) {
    const bp = pr(uB + 1.5, 0, Hb - 1);
    const sp = pr(-uB - 0.5, 0, Hs - 1);
    if (S.prow) S.prow(ctx, bp, sp, hd, tm, flap);
    else {
      if (S.civ === 'egypt') egBowHead(ctx, bp[0] - 1, bp[1] + 2, 1.1, tm);
    else dragonHead(ctx, bp[0] - 1, bp[1] + 2, 1.22, GOLD);
      if (S.civ === 'egypt') egSternHead(ctx, sp[0], sp[1] + 1, 1.0, tm);
    else sternCurl(ctx, sp[0], sp[1] + 1, 1.2, hd.dark);
    }
  } else {
    const bp = pr(uB + 0.5, 0, Hb + 0.5);
    boarHead(ctx, bp[0] - 1, bp[1] + 0.5, 1.12, tm.main);
    // Étendard d'équipe dressé à la poupe
    const sp = pr(-uB + 2, 0, Hs + 0.5);
    line(ctx, sp[0], sp[1] + 1, sp[0], sp[1] - 17, '#3a2412', 1.3);
    line(ctx, sp[0], sp[1] + 1, sp[0], sp[1] - 17, '#8a6236', 0.7);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ell(ctx, sp[0], sp[1] - 17.5, 1.2, 1.2);
    ctx.fill();
    pennant(ctx, sp[0], sp[1] - 16, tm.main, flap, 12);
  }

  // Filet lancé : par-dessus tout (devant le flanc proche)
  if (!war && anim === 2 && P.hand) drawFishing(ctx, q, P.hand);

  ctx.restore();
}

/** Filet et corde du pêcheur (phase q du cycle). */
function drawFishing(ctx, q, hand) {
  const N = netState(q);
  if (N.inHands) return;
  const rxN = 13 * N.r * (N.spread === undefined ? 1 : 0.35 + 0.65 * N.spread);
  const ryN = rxN * 0.5;
  if (N.ring !== undefined || N.haul) {
    const k = N.ring === undefined ? 0.4 : N.ring;
    ctx.strokeStyle = rgba('#eaf8ff', 0.7 * (1 - k * 0.8));
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(N.x, N.y + 0.6, rxN + 3 + k * 7, ryN + 1.5 + k * 3.5, 0, 0, TAU);
    ctx.stroke();
  }
  const edgeX = N.x - rxN * 0.6;
  const edgeY = N.y;
  ctx.beginPath();
  ctx.moveTo(hand[0], hand[1]);
  ctx.quadraticCurveTo((hand[0] + edgeX) / 2, Math.min(hand[1], edgeY) - 3 + (N.haul ? 2.5 : 0), edgeX, edgeY);
  ctx.strokeStyle = 'rgba(232,220,182,0.95)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  drawNet(ctx, N.x, N.y, Math.max(1.4, rxN), Math.max(0.7, ryN), N.r * 3);
  if (N.catchGlint) {
    fishBody(ctx, N.x - 1.2, N.y - 1.6, 5.6, -0.3, 0);
    fishBody(ctx, N.x + 1.6, N.y - 2.4, 5.2, 0.4, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(N.x + 3, N.y - 4.6, 0.8, 0.8);
    ctx.fillRect(N.x - 3.2, N.y - 3.8, 0.8, 0.8);
  }
}
