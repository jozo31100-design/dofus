// Parures spartiates : casque corinthien à crinière, pilos, couronnes de laurier, hoplon (grand bouclier rond de bronze
// à lambda), cuirasses de bronze et de lin, lances à fer de bronze, bâtons. Ce module ne dessine rien seul : il fournit les
// « crochets » (hooks) que les costumes posent sur leur description (sp.hooks = HOOKS, cf. unit-human.js).
// Champs lus : sp.xhelm (casque), sp.xshield (hoplon), sp.xtorso (liste de décors du torse), sp.xhead.
import { PI, TAU, tone, rgba, edge, ell, poly, paint, line, sideGrad, ballGrad, capsule } from './unit-kit.js';
import { GOLD, spear } from './unit-gear.js';

export const BRONZE_S = '#c9a04a';
export const CREST_RED = '#c22a2c';
export const LAMBDA = '#f4ead0';

// ---------------------------------------------------------------------------
// Casques (repère de la tête : r = rayon du crâne, nez vers +x, bas du visage vers y = 3.6)
// ---------------------------------------------------------------------------

/** Crinière de crin : longitudinale (fore-aft) ou transversale (officiers, oreille à oreille). */
function crest(ctx, r, lw, o) {
  const c = o.crest || CREST_RED;
  const h = o.crestH || 3.0;
  if (o.trans) {
    // Vue de profil : une lame haute et étroite posée en travers du dôme
    ctx.beginPath();
    ctx.moveTo(-1.5, -r - 1.5);
    ctx.lineTo(-1.8, -r - 1.5 - h);
    ctx.quadraticCurveTo(0.0, -r - 2.3 - h, 1.9, -r - 1.5 - h * 0.92);
    ctx.lineTo(1.7, -r - 1.3);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -1.8, 1.9, c, 0.3, -0.25, -r - 3), edge(c, 0.8), lw);
    ctx.strokeStyle = rgba(tone(c, -0.5), 0.6);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (const x of [-0.9, 0, 0.9]) {
      ctx.moveTo(x, -r - 1.5);
      ctx.lineTo(x * 1.05, -r - 1.2 - h * 0.85);
    }
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r - 1.5);
  ctx.quadraticCurveTo(r * 0.3, -r - 1.7 - h, -1.2, -r - 1.5 - h * 0.85);
  ctx.quadraticCurveTo(-r - 1.6, -r - 1.0 - h * 0.45, -r - 2.4 - h * 0.15, 1.4 + h * 0.2);
  ctx.quadraticCurveTo(-r - 1.4, -0.6, -r - 0.7, 0.4);
  ctx.quadraticCurveTo(-r - 0.6, -r - 0.6, -0.8, -r - 1.4);
  ctx.quadraticCurveTo(0, -r - 1.7, r * 0.55, -r - 1.5);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 3, r, c, 0.3, -0.28, -4), edge(c, 0.8), lw);
  // Crins : quelques traits sombres le long de la courbe
  ctx.strokeStyle = rgba(tone(c, -0.5), 0.55);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (const t of [0.25, 0.5, 0.75]) {
    ctx.moveTo(-0.6 - t * 2.4, -r - 1.5 - h * (0.9 - t * 0.3));
    ctx.quadraticCurveTo(-r - 0.6 - t, -r * 0.6, -r - 1.2 - t * 0.6, 0.6 + t);
  }
  ctx.stroke();
}

/** Casque corinthien : dôme, joues et protège-nez, fente des yeux ; o = { c, crest, trans, crestH, noCrest, trim }. */
function corinth(ctx, r, lw, o) {
  const c = o.c || '#b98a3c';
  if (!o.noCrest) crest(ctx, r, lw, o);
  ctx.beginPath();
  ctx.moveTo(-r - 0.8, 1.7);
  ctx.bezierCurveTo(-r - 1.1, -r - 0.1, -1.6, -r - 2.1, 0.6, -r - 2.0);
  ctx.bezierCurveTo(2.9, -r - 1.9, r + 0.6, -2.6, r + 0.8, -0.7);
  ctx.lineTo(r + 1.0, 0.9);
  ctx.quadraticCurveTo(r + 0.9, 3.5, r - 0.5, 4.0);
  ctx.quadraticCurveTo(0.9, 4.1, -0.1, 2.5);
  ctx.quadraticCurveTo(-1.2, 2.2, -r - 0.8, 1.7);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.8, -2.4, r + 2.0, c, 0.5, -0.34), edge(c, 0.85), lw);
  // Liseré de bord et reflet sur le dôme
  ctx.strokeStyle = rgba(tone(c, 0.55), 0.8);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-r - 0.3, -1.6);
  ctx.quadraticCurveTo(-r, -r - 0.6, 0.4, -r - 1.4);
  ctx.stroke();
  // Ouverture du visage : fente sombre des yeux, bande du nez
  ctx.fillStyle = 'rgba(20,14,10,0.9)';
  ctx.beginPath();
  ctx.moveTo(r - 1.5, -0.9);
  ctx.quadraticCurveTo(r - 0.3, -1.3, r + 0.75, -0.7);
  ctx.lineTo(r + 0.7, 0.35);
  ctx.quadraticCurveTo(r - 0.4, 0.5, r - 1.5, 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(tone(c, -0.45), 0.85);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(r + 0.1, 0.5);
  ctx.lineTo(r + 0.15, 3.3);
  ctx.moveTo(-0.2, 2.4);
  ctx.quadraticCurveTo(r * 0.5, 3.5, r - 0.5, 3.95);
  ctx.stroke();
  if (o.trim) {
    ctx.strokeStyle = o.trim;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-r - 0.6, 1.2);
    ctx.quadraticCurveTo(0, 1.6, r + 0.9, 0.8);
    ctx.stroke();
  }
}

/** Pilos : bonnet conique de feutre (archers, péltastes, hilotes) ; o = { c, band }. */
function pilos(ctx, r, lw, o) {
  const c = o.c || '#c9b48a';
  ctx.beginPath();
  ctx.moveTo(-r - 0.5, 0.5);
  ctx.quadraticCurveTo(-r - 0.5, -r * 0.8, -0.6, -r - 2.6);
  ctx.quadraticCurveTo(0.6, -r - 3.2, 1.4, -r - 2.2);
  ctx.quadraticCurveTo(r + 0.3, -r * 0.6, r + 0.45, -0.3);
  ctx.quadraticCurveTo(0, -1.4, -r - 0.5, 0.5);
  paint(ctx, ballGrad(ctx, -0.6, -2.2, r + 1.6, c, 0.4, -0.3), edge(c, 0.8), lw);
  ctx.strokeStyle = o.band || tone(c, -0.35);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-r - 0.4, -0.2);
  ctx.quadraticCurveTo(0, -1.5, r + 0.4, -0.6);
  ctx.stroke();
}

/** Couronne de laurier ; o = { c (feuilles), berry }. */
function laurel(ctx, r, lw, o) {
  const c = o.c || '#5f8a3a';
  ctx.strokeStyle = tone(c, -0.35);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, -0.4, r + 0.35, PI * 0.93, PI * 1.98);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = PI * (1.0 + i * 0.1);
    const x = Math.cos(a) * (r + 0.35);
    const y = -0.4 + Math.sin(a) * (r + 0.35);
    ctx.beginPath();
    ell(ctx, x, y - 0.25, 1.05, 0.5, a + PI / 2 + 0.5);
    paint(ctx, i % 2 ? c : tone(c, 0.2), edge(c, 0.8), 0.3);
  }
  if (o.band) {
    ctx.fillStyle = o.band;
    ctx.beginPath();
    ell(ctx, -r - 0.5, 0.6, 0.6, 1.4, 0.3);
    ctx.fill();
  }
}

/** Diadème d'or et voile léger (Gorgo). */
function diadem(ctx, r, lw, o) {
  const g = o.c || GOLD;
  const v = o.veil || '#f3efe4';
  if (v !== 'none') {
    ctx.beginPath();
    ctx.moveTo(1.0, -r - 1.2);
    ctx.bezierCurveTo(-2.4, -r - 2.2, -r - 1.6, -r * 0.4, -r - 2.0, 3.0);
    ctx.quadraticCurveTo(-r - 2.2, 7.4, -r - 0.6, 9.4);
    ctx.quadraticCurveTo(-2.2, 9.6, -1.6, 6.0);
    ctx.quadraticCurveTo(-1.0, 3.0, -0.6, 1.8);
    ctx.quadraticCurveTo(0.8, 0.6, 1.0, -r - 1.2);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -r - 2.4, 1, v, 0.15, -0.25, 0), edge(v, 0.7), lw);
  }
  ctx.beginPath();
  ctx.moveTo(-r - 0.4, -0.3);
  ctx.quadraticCurveTo(0, -1.7, r + 0.4, -1.0);
  ctx.lineTo(r + 0.4, -2.0);
  ctx.quadraticCurveTo(0, -2.9, -r - 0.4, -1.4);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -1.6, r + 1.4, g, 0.5, -0.3), edge(g, 0.9), lw);
  ctx.fillStyle = '#c22a2c';
  ctx.beginPath();
  ell(ctx, 1.6, -1.9, 0.4, 0.4);
  ctx.fill();
}

export const HELMS = { corinth, pilos, laurel, diadem };

function helmetHook(ctx, sp, r, lw) {
  const h = sp.xhelm;
  if (!h || !HELMS[h.kind]) return false;
  HELMS[h.kind](ctx, r, lw, h);
  return true;
}

// ---------------------------------------------------------------------------
// Torse (repère du torse, unités z = 1 ; x vers l'avant, y vers le bas ; y = 0 à la taille)
// ---------------------------------------------------------------------------

function torsoPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.2, 1.0);
  ctx.bezierCurveTo(-3.7, -2.0, -4.0, -4.8, -3.7, -7.0);
  ctx.quadraticCurveTo(-3.3, -8.6, -1.3, -8.6);
  ctx.lineTo(1.9, -8.6);
  ctx.quadraticCurveTo(3.7, -8.5, 3.95, -7.0);
  ctx.bezierCurveTo(4.3, -5.4, 3.9, -3.3, 3.2, -1.6);
  ctx.lineTo(3.4, 1.0);
  ctx.closePath();
}

const TORSO = {
  cuirass(ctx, sp, lw) {
    // Cuirasse de bronze musclée : pectoraux, abdomen, bord doré, lambrequins de cuir
    const c = sp.xcuirass || '#b98a3c';
    torsoPath(ctx);
    paint(ctx, sideGrad(ctx, -4, 4.1, c, 0.35, -0.32, -4), edge(c, 0.85), lw);
    ctx.strokeStyle = rgba(tone(c, -0.5), 0.7);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0.9, -8.2);
    ctx.lineTo(0.95, -0.4);
    ctx.moveTo(-0.8, -6.3);
    ctx.quadraticCurveTo(0.5, -5.2, 1.4, -6.0);
    ctx.moveTo(1.6, -6.2);
    ctx.quadraticCurveTo(3.0, -5.3, 3.8, -6.3);
    ctx.moveTo(-0.4, -2.6);
    ctx.quadraticCurveTo(0.9, -2.0, 2.2, -2.6);
    ctx.stroke();
    ctx.strokeStyle = rgba(tone(c, 0.6), 0.75);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-2.6, -7.6);
    ctx.quadraticCurveTo(-3.0, -4.6, -2.6, -1.8);
    ctx.stroke();
    // Lambrequins (pteruges) : bandes de cuir sous la cuirasse
    const l = sp.xpteruges || '#8a5a30';
    for (let i = 0; i < 6; i++) {
      const x = -3.4 + i * 1.22;
      ctx.beginPath();
      poly(ctx, [x, 0.6, x + 1.12, 0.6, x + 1.05, 3.0, x + 0.06, 3.0]);
      paint(ctx, i % 2 ? tone(l, -0.12) : l, edge(l, 0.85), lw * 0.7);
    }
    ctx.fillStyle = GOLD;
    ctx.fillRect(-3.6, 0.3, 7.3, 0.55);
  },
  linen(ctx, sp, lw) {
    // Linothorax : cuirasse de lin collé, blanche, galon d'équipe et lambrequins
    const c = sp.xlinen || '#e9e0c8';
    torsoPath(ctx);
    paint(ctx, sideGrad(ctx, -4, 4.1, c, 0.2, -0.3, -4), edge(c, 0.8), lw);
    ctx.strokeStyle = rgba(tone(c, -0.45), 0.6);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (const y of [-6.4, -4.4, -2.4]) {
      ctx.moveTo(-3.7, y);
      ctx.lineTo(3.9, y);
    }
    ctx.stroke();
    const t = sp.xtrim || '#c22a2c';
    ctx.fillStyle = t;
    ctx.fillRect(-3.8, -8.4, 0.85, 7.8);
    ctx.fillRect(0.6, -8.6, 0.8, 9);
    for (let i = 0; i < 6; i++) {
      const x = -3.4 + i * 1.22;
      ctx.beginPath();
      poly(ctx, [x, 0.6, x + 1.12, 0.6, x + 1.05, 2.8, x + 0.06, 2.8]);
      paint(ctx, i % 2 ? tone(c, -0.1) : c, edge(c, 0.8), lw * 0.7);
    }
  },
  baldric(ctx, sp, lw) {
    // Baudrier de cuir et bracelet de fourreau
    ctx.strokeStyle = '#5a3a20';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-2.2, -8.4);
    ctx.lineTo(3.0, -1.0);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.fillRect(0.2, -5.4, 0.9, 0.9);
  },
  vest(ctx, sp, lw) {
    // Peau de mouton jetée sur les épaules (hilotes)
    const c = sp.xvest || '#8a6a44';
    torsoPath(ctx);
    paint(ctx, sideGrad(ctx, -4, 4.1, c, 0.2, -0.3, -4), edge(c, 0.8), lw);
    ctx.strokeStyle = rgba(tone(c, 0.55), 0.7);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (const [x, y] of [[-2.6, -6.6], [-0.8, -4.4], [1.6, -6.0], [2.6, -2.8], [-2.0, -2.0], [0.4, -1.0]]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.45, y + 0.9);
    }
    ctx.stroke();
  },
  ephod(ctx, sp, lw) {
    // Peplos de Gorgo : rabat plissé, fibule d'or
    ctx.strokeStyle = rgba(tone(sp.robe || '#ecebe2', -0.4), 0.6);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (const x of [-1.6, 0, 1.6, 3.0]) {
      ctx.moveTo(x, -8.4);
      ctx.lineTo(x + 0.2, 0.6);
    }
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ell(ctx, -1.6, -7.8, 0.75, 0.75);
    ell(ctx, 2.9, -7.8, 0.75, 0.75);
    ctx.fill();
  },
  greaves(ctx) {
    void ctx;
  },
};

function torsoHook(ctx, sp, R) {
  const list = sp.xtorso;
  if (!list) return;
  const lw = 0.7 / R.z;
  for (const name of list) TORSO[name](ctx, sp, lw);
}

// ---------------------------------------------------------------------------
// Hoplon : grand bouclier rond de bronze, face d'équipe, lambda de Lacédémone
// ---------------------------------------------------------------------------

export function hoplon(ctx, cx, cy, z, face, s = 1, o = {}) {
  const k = z * s;
  const rx = 4.4 * k;
  const ry = 5.9 * k;
  const rim = o.rim || '#c9a04a';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(o.tilt || 0);
  // Tranche arrière (épaisseur du bouclier vu de trois-quarts)
  ctx.beginPath();
  ell(ctx, -0.7 * k, 0.15 * k, rx, ry);
  paint(ctx, tone(rim, -0.45), edge(rim, 0.9), 0.6);
  // Bord de bronze
  ctx.beginPath();
  ell(ctx, 0, 0, rx, ry);
  paint(ctx, ballGrad(ctx, -1.2 * k, -2 * k, ry + 1.5 * k, rim, 0.5, -0.34), edge(rim, 0.9), 0.7);
  // Champ de couleur
  ctx.beginPath();
  ell(ctx, 0, 0, rx - 0.95 * k, ry - 1.05 * k);
  paint(ctx, ballGrad(ctx, -1.3 * k, -2 * k, ry, face, 0.36, -0.3), edge(face, 0.85), 0.5);
  // Filet intérieur
  ctx.beginPath();
  ell(ctx, 0, 0, rx - 1.35 * k, ry - 1.5 * k);
  ctx.strokeStyle = rgba(tone(rim, 0.25), 0.8);
  ctx.lineWidth = 0.45 * k;
  ctx.stroke();
  // Lambda (Λ) : deux jambages, le droit plus court
  const lc = o.lambda || LAMBDA;
  if (lc !== 'none') {
    ctx.strokeStyle = lc;
    ctx.lineWidth = 1.05 * k;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-1.6 * k, 2.6 * k);
    ctx.lineTo(0.0, -2.6 * k);
    ctx.lineTo(1.8 * k, 2.6 * k);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  if (o.emblem) {
    ctx.fillStyle = o.emblem;
    ctx.beginPath();
    ell(ctx, 0, 3.6 * k, 0.6 * k, 0.6 * k);
    ell(ctx, 0, -3.8 * k, 0.6 * k, 0.6 * k);
    ctx.fill();
  }
  ctx.restore();
}

function shieldHook(ctx, sp, ex, ey, z) {
  const s = sp.xshield;
  if (!s) return false;
  hoplon(ctx, ex, ey, z, sp.shield.face, s.s || 1, s);
  return true;
}

// ---------------------------------------------------------------------------
// Armes : lance (dory) à fer de bronze, bâtons
// ---------------------------------------------------------------------------

function dirs(a) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  return [dx, dy, -dy, dx];
}

function shaft(ctx, x, y, a, back, fwd, w, c) {
  const [dx, dy] = dirs(a);
  ctx.beginPath();
  capsule(ctx, x - dx * back, y - dy * back, w / 2, x + dx * fwd, y + dy * fwd, w / 2);
  paint(ctx, c, edge(c, 0.75), 0.4);
}

/** Bâton d'olivier (Gorgo) : long bâton noueux, rameau au sommet. */
function oliveStaff(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 8 * z, 12.5 * z, 0.95 * z, '#8a6a42');
  const tx = x + dx * 12.5 * z;
  const ty = y + dy * 12.5 * z;
  for (const [t, side] of [[0, 0], [1.3, 1], [2.3, -1], [3.2, 1]]) {
    const bx = tx - dx * (3.4 - t) * z;
    const by = ty - dy * (3.4 - t) * z;
    ctx.beginPath();
    ell(ctx, bx + px * side * 1.0 * z + dx * 0.8 * z, by + py * side * 1.0 * z + dy * 0.8 * z, 1.2 * z, 0.55 * z, a + side * 0.7);
    paint(ctx, t % 2 ? '#6f9a48' : '#8fb560', edge('#6f9a48', 0.8), 0.3);
  }
  ctx.beginPath();
  ell(ctx, tx + dx * 1.3 * z, ty + dy * 1.3 * z, 1.25 * z, 0.6 * z, a);
  paint(ctx, '#7aa64e', edge('#6f9a48', 0.8), 0.3);
}

/** Bâton d'Asclépios : bâton noueux entouré d'un serpent. */
function serpentStaff(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 8 * z, 12 * z, 1.0 * z, '#7a5a38');
  ctx.strokeStyle = '#d9cfa0';
  ctx.lineWidth = 0.75 * z;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const u = -1 + t * 12;
    const w = Math.sin(t * TAU * 2.2) * 1.05;
    const X = x + dx * u * z + px * w * z;
    const Y = y + dy * u * z + py * w * z;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  const hx = x + dx * 11.8 * z + px * 0.8 * z;
  const hy = y + dy * 11.8 * z + py * 0.8 * z;
  ctx.beginPath();
  ell(ctx, hx, hy, 0.85 * z, 0.65 * z);
  paint(ctx, '#e6dcae', edge('#9a8a50', 0.8), 0.3);
}

function weaponHook(ctx, sp, R, P, which) {
  const z = R.z;
  const [x, y] = R.handN;
  const a = P.wA;
  switch (which) {
    case 'spear':
      spear(ctx, x, y, a, z, { fwd: sp.spearFwd || 11, back: sp.spearBack || 8, steel: sp.xspear || '#d2ac52', head: 3.6, hw: 1.15, c: '#9a6e3c' });
      return true;
    case 'oliveStaff':
      oliveStaff(ctx, x, y, a, z);
      return true;
    case 'serpentStaff':
      serpentStaff(ctx, x, y, a, z);
      return true;
    default:
      return false;
  }
}

function headHook() {
  return false;
}

/** Cnémides : jambière de bronze moulée sur le tibia de la jambe proche (sp.xgreaves = couleur du bronze). */
function greavesHook(ctx, sp, R) {
  if (!sp.xgreaves) return;
  const z = R.z;
  const col = sp.xgreaves;
  const [kx, ky] = R.kneeN;
  const [ax, ay] = R.ankN;
  const sx = kx + (ax - kx) * 0.18;
  const sy = ky + (ay - ky) * 0.18;
  ctx.beginPath();
  capsule(ctx, sx, sy, 1.55 * z, ax, ay - 0.6 * z, 1.1 * z);
  paint(ctx, sideGrad(ctx, Math.min(sx, ax) - 2, Math.max(sx, ax) + 2, col, 0.45, -0.3), edge(col, 0.85), 0.5);
  line(ctx, sx - 0.4 * z, sy + 0.8 * z, ax - 0.4 * z, ay - 1.4 * z, 'rgba(255,240,190,0.65)', 0.35 * z);
  // genouillère : petit liseré au sommet
  line(ctx, sx - 1.2 * z, sy - 0.2 * z, sx + 1.2 * z, sy - 0.2 * z, rgba(tone(col, -0.4), 0.7), 0.4 * z);
}

export const HOOKS = {
  front: greavesHook,
  torso: torsoHook,
  helmet: helmetHook,
  head: headHook,
  shield: shieldHook,
  weapon: weaponHook,
};

void line;
