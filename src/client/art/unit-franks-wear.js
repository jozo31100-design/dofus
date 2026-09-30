// Parures des héros et unités spéciales franques : casques, couronnes, voile, décors du torse, objets portés,
// harnachement des chevaux. Ce module ne dessine rien seul : il fournit les « crochets » (hooks) que les
// costumes franques posent sur leur description (sp.hooks = HOOKS, cf. unit-human.js) et ceux des chevaux
// (H.hooks = HORSE_HOOKS, cf. unit-horse.js). Chaque crochet lit les champs x* du costume pour savoir quoi dessiner.
import { PI, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad, vGrad, mailPattern, light } from './unit-kit.js';
import { GOLD } from './unit-gear.js';
import {
  warMaul, flangedMace, greatSword, ironShodStaff, processionCross, knightLance, heavyCrossbow,
  franksShield, fleur, bee, goldCross, plume, bez, steelPlate,
} from './unit-franks-gear.js';
import { spear } from './unit-gear.js';

const STEEL_D = '#7d858e';

/** Dégradé translucide d'ombrage posé sur un motif de mailles. */
function shadeOv(ctx, x0, x1, y = 0) {
  const lit = light.s < 0 ? x0 : x1;
  const dark = light.s < 0 ? x1 : x0;
  const g = ctx.createLinearGradient(lit, y, dark, y);
  g.addColorStop(0, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  return g;
}

function mailFill(ctx, c, x0, x1, y, lw) {
  ctx.fillStyle = mailPattern(ctx, c, 2.3);
  ctx.fill();
  ctx.fillStyle = shadeOv(ctx, x0, x1, y);
  ctx.fill();
  ctx.strokeStyle = edge(c, 0.7);
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** Point d'une quadratique. */
function qpt(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

// ---------------------------------------------------------------------------
// Casques, couronnes, voile (repère de la tête : r = rayon du crâne, nez vers +x)
// ---------------------------------------------------------------------------

/** Casque conique à nasal ; o = { c, band, circlet, plume, finial, cheek, nasal }. */
function cone(ctx, r, lw, o) {
  const c = o.c || '#aab2ba';
  ctx.beginPath();
  ctx.moveTo(-r - 0.5, 0.2);
  ctx.quadraticCurveTo(-r - 0.4, -r * 0.9, 0.1, -r - 2.4);
  ctx.quadraticCurveTo(r + 0.3, -r * 0.8, r + 0.45, -0.6);
  ctx.quadraticCurveTo(0, -1.2, -r - 0.5, 0.2);
  paint(ctx, ballGrad(ctx, -0.6, -2.2, r + 1.8, c, 0.45, -0.3), edge(c, 0.8), lw);
  // Montants
  ctx.strokeStyle = o.band || '#c9a24a';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0.1, -r - 2.2);
  ctx.quadraticCurveTo(0.2, -2.0, 0.3, -0.9);
  ctx.moveTo(-r * 0.6, -r - 0.3);
  ctx.quadraticCurveTo(-1.2, -2.6, -1.0, -1.1);
  ctx.stroke();
  if (o.cheek) {
    ctx.beginPath();
    poly(ctx, [-0.6, -0.3, 1.5, -0.1, 1.45, 3.5, 0.2, 3.9, -0.7, 2.2]);
    paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  }
  // Nasal
  ctx.beginPath();
  poly(ctx, [r - 0.25, -1.1, r + 0.55, -1.0, r + 0.6, 1.5, r + 0.05, 1.5]);
  paint(ctx, o.nasal || tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  if (o.circlet) {
    // Cercle d'or : bandeau et petits fleurons
    const g = '#e8b93a';
    for (const x of [-2.6, -0.9, 0.9, 2.6]) {
      ctx.beginPath();
      poly(ctx, [x - 0.55, -1.6 - 0.3 * Math.abs(x) * 0.15, x, -3.0 - 0.25 * (1 - Math.abs(x) / 3.4), x + 0.55, -1.6]);
      paint(ctx, g, edge(g, 0.85), lw * 0.7);
    }
    ctx.beginPath();
    ctx.moveTo(-r - 0.55, 0.3);
    ctx.quadraticCurveTo(0, -1.4, r + 0.5, -0.65);
    ctx.lineTo(r + 0.42, -2.0);
    ctx.quadraticCurveTo(0, -2.7, -r - 0.5, -1.5);
    ctx.closePath();
    paint(ctx, ballGrad(ctx, -0.6, -1.4, r + 1.4, g, 0.5, -0.3), edge(g, 0.9), lw);
    ctx.fillStyle = '#d02a3a';
    ctx.beginPath();
    ell(ctx, 1.4, -1.35, 0.42, 0.42);
    ctx.fill();
    ctx.fillStyle = '#2a62c8';
    ctx.beginPath();
    ell(ctx, -1.8, -1.5, 0.4, 0.4);
    ctx.fill();
  }
  if (o.finial) {
    ctx.beginPath();
    ell(ctx, 0.15, -r - 2.6, 0.75, 0.75);
    paint(ctx, ballGrad(ctx, 0.15, -r - 2.6, 0.9, GOLD, 0.5, -0.3), edge(GOLD, 0.9), lw * 0.7);
  }
  if (o.plume) plume(ctx, 0.3, -r - 2.2, 0.95, o.plume);
}

/** Casque rond (calotte hémisphérique) à bandeau rivé, nasal, coiffe de mailles ; o = { c, band, coif, plume }. */
function roundCap(ctx, r, lw, o) {
  const c = o.c || '#8a929a';
  if (o.coif) {
    ctx.beginPath();
    ctx.moveTo(-r - 0.7, 0.4);
    ctx.quadraticCurveTo(-r - 1.5, 4.4, -0.7, 5.6);
    ctx.quadraticCurveTo(1.7, 5.4, 2.2, 3.4);
    ctx.lineTo(1.2, 0.2);
    ctx.closePath();
    mailFill(ctx, o.coif, -r - 1.5, 2.2, 2, lw);
  }
  ctx.beginPath();
  ctx.moveTo(-r - 0.65, 0.8);
  ctx.bezierCurveTo(-r - 0.95, -r - 0.5, -2.0, -r - 2.0, 0.6, -r - 1.95);
  ctx.bezierCurveTo(3.2, -r - 1.9, r + 0.7, -2.4, r + 0.7, -0.5);
  ctx.quadraticCurveTo(0.6, -1.3, -r - 0.65, 0.8);
  paint(ctx, ballGrad(ctx, -0.8, -2.6, r + 1.6, c, 0.5, -0.32), edge(c, 0.85), lw);
  // Bandeau et rivets
  const b = o.band || '#b98a38';
  ctx.beginPath();
  ctx.moveTo(-r - 0.6, 0.6);
  ctx.quadraticCurveTo(0.6, -1.3, r + 0.65, -0.55);
  ctx.strokeStyle = tone(b, -0.45);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = b;
  ctx.lineWidth = 0.95;
  ctx.stroke();
  ctx.fillStyle = tone(b, 0.5);
  for (const t of [0.12, 0.3, 0.5, 0.7, 0.88]) {
    const [px, py] = qpt([-r - 0.6, 0.6], [0.6, -1.3], [r + 0.65, -0.55], t);
    ctx.beginPath();
    ell(ctx, px, py, 0.26, 0.26);
    ctx.fill();
  }
  // Reflet de calotte
  ctx.strokeStyle = rgba('#ffffff', 0.5);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-2.6, -2.4);
  ctx.quadraticCurveTo(-1.2, -r - 0.9, 1.0, -r - 0.9);
  ctx.stroke();
  // Nasal
  ctx.beginPath();
  poly(ctx, [r - 0.2, -1.2, r + 0.55, -1.0, r + 0.65, 2.3, r + 0.0, 2.3]);
  paint(ctx, tone(c, -0.05), edge(c, 0.85), lw * 0.8);
  if (o.plume) plume(ctx, -0.2, -r - 1.9, 1.0, o.plume);
}

/** Couronne impériale : bandeau perlé, fleurons, arceau fermé sur bonnet de velours pourpre, globe et croix. */
function imperialCrown(ctx, r, lw) {
  const g = GOLD;
  // Bonnet de velours sous l'arceau
  ctx.beginPath();
  ctx.moveTo(-3.7, -2.0);
  ctx.bezierCurveTo(-3.8, -7.0, 3.5, -7.6, 3.75, -2.0);
  ctx.quadraticCurveTo(0, -1.4, -3.7, -2.0);
  paint(ctx, sideGrad(ctx, -4, 4, '#7a2f8a', 0.25, -0.3, -4), edge('#7a2f8a', 0.8), lw * 0.8);
  // Arceau d'or
  ctx.beginPath();
  ctx.moveTo(-3.6, -2.2);
  ctx.bezierCurveTo(-3.8, -7.4, 3.4, -8.0, 3.7, -2.2);
  ctx.strokeStyle = edge(g, 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = g;
  ctx.lineWidth = 0.95;
  ctx.stroke();
  // Globe et croix sommitale
  ctx.beginPath();
  ell(ctx, 0.05, -7.0, 0.85, 0.85);
  paint(ctx, ballGrad(ctx, 0.05, -7.0, 1, g, 0.55, -0.3), edge(g, 0.9), lw * 0.7);
  goldCross(ctx, 0.05, -8.6, 2.1, 1.5, g);
  // Fleurons derrière puis devant le bandeau
  for (const x of [-3.4, 0.1, 3.4]) {
    ctx.beginPath();
    poly(ctx, [x - 0.8, -1.9, x - 0.9, -3.3, x - 0.25, -2.7, x, -4.3, x + 0.25, -2.7, x + 0.9, -3.3, x + 0.8, -1.9]);
    paint(ctx, g, edge(g, 0.9), lw * 0.7);
  }
  // Bandeau
  ctx.beginPath();
  ctx.moveTo(-r - 0.4, -0.8);
  ctx.quadraticCurveTo(0.2, 0.1, r + 0.35, -0.75);
  ctx.lineTo(r + 0.3, -2.45);
  ctx.quadraticCurveTo(0.2, -1.7, -r - 0.4, -2.4);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.8, -1.6, r + 1.5, g, 0.55, -0.32), edge(g, 0.9), lw);
  // Perles et gemmes sur le bandeau
  const pts = [[-2.9, -1.35, '#fff6e0'], [-1.4, -1.0, '#2a62c8'], [0.2, -0.9, '#fff6e0'], [1.7, -1.05, '#d02a3a'], [3.0, -1.45, '#fff6e0']];
  for (const [x, y, col] of pts) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ell(ctx, x, y, 0.42, 0.42);
    ctx.fill();
  }
}

/** Grand heaume fermé (preux) : tonneau d'acier, fente des yeux, trous de respiration, bandes d'or, cimier à plumet. */
function greatHelm(ctx, r, lw, o) {
  const c = o.c || '#b4bcc5';
  const x0 = -r - 0.75;
  const x1 = r + 0.95;
  const top = -r - 1.7;
  const bot = 4.0;
  ctx.beginPath();
  ctx.moveTo(x0 + 0.4, bot);
  ctx.lineTo(x0, -1.0);
  ctx.quadraticCurveTo(x0 - 0.1, top + 0.7, x0 + 1.8, top);
  ctx.lineTo(x1 - 1.4, top);
  ctx.quadraticCurveTo(x1 + 0.2, top + 0.3, x1, top + 1.7);
  ctx.lineTo(x1 + 0.1, bot - 0.5);
  ctx.quadraticCurveTo((x0 + x1) / 2, bot + 1.0, x0 + 0.4, bot);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x0, x1, c, 0.4, -0.35, 0), edge(c, 0.9), lw);
  // Dessus et reflets
  ctx.strokeStyle = rgba('#ffffff', 0.55);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x0 + 1.4, top + 0.5);
  ctx.lineTo(x1 - 1.8, top + 0.5);
  ctx.stroke();
  // Bandes en croix (or)
  const g = o.band || GOLD;
  ctx.fillStyle = g;
  ctx.fillRect(x0 + 0.05, -0.15, x1 - x0, 0.85);
  ctx.fillRect(1.9, top + 0.2, 0.9, bot - top - 0.3);
  ctx.strokeStyle = edge(g, 0.8);
  ctx.lineWidth = 0.3;
  ctx.strokeRect(1.9, top + 0.2, 0.9, bot - top - 0.3);
  // Fente des yeux et respiration
  ctx.fillStyle = '#10121a';
  ctx.beginPath();
  poly(ctx, [2.9, -1.35, x1 - 0.1, -1.25, x1 - 0.05, -0.3, 2.9, -0.35]);
  ctx.fill();
  ctx.fillStyle = 'rgba(16,18,26,0.85)';
  for (const [x, y] of [[3.4, 1.3], [3.9, 1.3], [3.4, 2.1], [3.9, 2.1], [3.4, 2.9], [3.9, 2.9]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.22, 0.22);
    ctx.fill();
  }
  // Rivets
  ctx.fillStyle = rgba('#ffffff', 0.7);
  for (const [x, y] of [[x0 + 0.7, -2.4], [x0 + 0.7, 2.2], [-1.0, -2.4]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.22, 0.22);
    ctx.fill();
  }
  if (o.plume) plume(ctx, -0.6, top + 0.4, 1.2, o.plume);
}

/** Salade (casque arrondi à longue queue arrière) de l'arbalétrier impérial. */
function sallet(ctx, r, lw, o) {
  const c = o.c || '#9aa3ac';
  // Queue arrière
  ctx.beginPath();
  poly(ctx, [-r - 0.4, -1.8, -r - 3.6, 3.0, -r - 2.6, 3.8, -r + 0.2, 1.6]);
  paint(ctx, tone(c, -0.12), edge(c, 0.8), lw);
  // Calotte
  ctx.beginPath();
  ctx.moveTo(-r - 0.5, 0.5);
  ctx.arc(0, -0.3, r + 0.5, PI * 0.95, PI * 1.95);
  ctx.quadraticCurveTo(0.4, -1.3, -r - 0.5, 0.5);
  paint(ctx, ballGrad(ctx, -0.7, -2.4, r + 1.2, c, 0.5, -0.3), edge(c, 0.85), lw);
  // Bord relevé et lisière d'or
  ctx.beginPath();
  ctx.moveTo(-r - 0.7, 0.6);
  ctx.quadraticCurveTo(0.4, -1.1, r + 0.6, -0.7);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Crête centrale
  ctx.strokeStyle = tone(c, -0.3);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-r - 0.2, -1.8);
  ctx.quadraticCurveTo(0, -r - 1.2, r * 0.6, -r * 0.6);
  ctx.stroke();
  // Bandeau d'équipe noué autour de la calotte
  if (o.wrap) {
    ctx.beginPath();
    ctx.moveTo(-r - 0.5, 0.0);
    ctx.quadraticCurveTo(0.2, -1.4, r + 0.45, -0.8);
    ctx.lineTo(r + 0.4, -2.0);
    ctx.quadraticCurveTo(0.2, -2.5, -r - 0.5, -1.4);
    ctx.closePath();
    paint(ctx, o.wrap, edge(o.wrap, 0.8), lw * 0.7);
    ctx.beginPath();
    poly(ctx, [-r - 0.4, -1.0, -r - 2.4, 0.4, -r - 1.6, 1.8, -r - 0.2, 0.3]);
    paint(ctx, tone(o.wrap, -0.15), edge(o.wrap, 0.8), lw * 0.7);
  }
}

const HELMS = {
  circlet: (ctx, r, lw, h) => cone(ctx, r, lw, { c: '#b2bac2', circlet: true }),
  spang: (ctx, r, lw, h) => cone(ctx, r, lw, { c: h.c || '#a6afb8', cheek: true, finial: true, nasal: '#d9b44c', plume: h.plume, band: h.band }),
  round: (ctx, r, lw, h) => roundCap(ctx, r, lw, h),
  crown: (ctx, r, lw) => imperialCrown(ctx, r, lw),
  great: (ctx, r, lw, h) => greatHelm(ctx, r, lw, h),
  sallet: (ctx, r, lw, h) => sallet(ctx, r, lw, h),
};

function helmetHook(ctx, sp, r, lw) {
  const h = sp.xhelm;
  if (!h || !HELMS[h.kind]) return false;
  HELMS[h.kind](ctx, r, lw, h);
  return true;
}

/** Voile blanc de la reine et cercle d'or à petite croix. */
function veilHead(ctx, sp, r, lw) {
  const v = sp.veil || '#f4f0e6';
  ctx.beginPath();
  ctx.moveTo(2.9, -2.3);
  ctx.bezierCurveTo(2.3, -r - 1.5, -1.8, -r - 1.9, -r - 1.0, -1.6);
  ctx.bezierCurveTo(-r - 2.7, 1.0, -r - 2.5, 5.0, -r - 2.7, 9.0);
  ctx.quadraticCurveTo(-3.3, 10.6, -0.6, 9.4);
  ctx.bezierCurveTo(0.2, 6.6, 0.9, 4.4, 0.5, 2.4);
  ctx.quadraticCurveTo(-0.3, 0.4, 0.2, -0.9);
  ctx.quadraticCurveTo(2.0, -1.3, 2.9, -2.3);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 3, 3, v, 0.15, -0.28, 0), edge(v, 0.7), lw);
  // Plis du tissu et galon d'or sur la retombée
  ctx.strokeStyle = rgba(tone(v, -0.45), 0.5);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-r - 0.2, 0.0);
  ctx.quadraticCurveTo(-r - 1.4, 4.2, -r - 1.6, 8.4);
  ctx.moveTo(-1.0, 1.2);
  ctx.quadraticCurveTo(-1.6, 5.0, -1.4, 9.2);
  ctx.stroke();
  ctx.strokeStyle = rgba(GOLD, 0.95);
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(-r - 2.6, 8.6);
  ctx.quadraticCurveTo(-3.3, 10.4, -0.3, 9.2);
  ctx.stroke();
  // Cercle d'or ajusté sur le front
  const g = GOLD;
  ctx.beginPath();
  ctx.moveTo(-r - 0.45, -0.4);
  ctx.quadraticCurveTo(0.3, -1.6, r - 0.15, -1.0);
  ctx.lineTo(r - 0.2, -2.35);
  ctx.quadraticCurveTo(0.3, -3.0, -r - 0.45, -1.7);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -1.6, r + 1.3, g, 0.55, -0.3), edge(g, 0.9), lw);
  for (const [x, y] of [[-2.4, -2.5], [-0.6, -2.85], [1.3, -2.85]]) {
    ctx.beginPath();
    poly(ctx, [x - 0.5, y + 0.4, x, y - 0.9, x + 0.5, y + 0.4]);
    paint(ctx, g, edge(g, 0.9), lw * 0.7);
  }
  ctx.fillStyle = '#d02a3a';
  ctx.beginPath();
  ell(ctx, 1.4, -1.85, 0.4, 0.4);
  ctx.fill();
  // Cils et lèvres : visage féminin
  line(ctx, 1.75, -0.7, 2.6, -0.85, rgba('#2a1c14', 0.9), 0.35);
  line(ctx, 2.45, 2.3, 3.25, 2.15, rgba('#b04a4a', 0.95), 0.6);
}

function headHook(ctx, sp, r, lw) {
  if (sp.xhead === 'veil') veilHead(ctx, sp, r, lw);
}

// ---------------------------------------------------------------------------
// Torse (repère du torse, unités z = 1 ; x vers l'avant, y vers le bas ; y = 0 à la taille)
// ---------------------------------------------------------------------------

const TORSO = {
  pendant(ctx, sp, lw) {
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(-0.2, -8.8);
    ctx.lineTo(1.4, -5.3);
    ctx.lineTo(2.4, -8.8);
    ctx.stroke();
    goldCross(ctx, 1.4, -4.3, 3.6, 2.4);
    ctx.fillStyle = '#d02a3a';
    ctx.beginPath();
    ell(ctx, 1.4, -4.6, 0.3, 0.3);
    ctx.fill();
  },
  braid(ctx, sp, lw) {
    const c = sp.hair;
    for (let i = 0; i < 7; i++) {
      const y = -7.6 + i * 0.95;
      ctx.beginPath();
      ell(ctx, 2.7 - i * 0.05, y, 0.85, 0.62, i % 2 ? 0.6 : -0.6);
      paint(ctx, i % 2 ? tone(c, 0.12) : c, edge(c, 0.7), lw * 0.7);
    }
    ctx.beginPath();
    ell(ctx, 2.45, -0.75, 0.6, 0.45);
    paint(ctx, GOLD, edge(GOLD, 0.8), lw * 0.6);
  },
  hemEmbroidery(ctx, sp, lw) {
    // Galon brodé sur le devant de la robe : passementerie d'or
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-1.6, -8.8);
    ctx.quadraticCurveTo(-0.9, -4.0, -1.6, 0.8);
    ctx.moveTo(2.9, -8.6);
    ctx.quadraticCurveTo(3.6, -4.0, 3.0, 0.8);
    ctx.stroke();
  },
  orphrey(ctx, sp, lw) {
    // Large orfroi d'or perlé au milieu de la dalmatique impériale
    ctx.beginPath();
    poly(ctx, [-0.5, -9.0, 2.0, -9.0, 1.9, 1.4, -0.6, 1.4]);
    paint(ctx, sideGrad(ctx, -0.6, 2.0, '#e0b23a', 0.35, -0.3, -4), edge(GOLD, 0.85), lw);
    ctx.strokeStyle = rgba('#a02030', 0.8);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(0.7, -8.8);
    ctx.lineTo(0.7, 1.2);
    ctx.stroke();
    ctx.fillStyle = '#fff6e0';
    for (let y = -7.6; y < 1.2; y += 1.7) {
      ctx.beginPath();
      ell(ctx, 0.7, y, 0.34, 0.34);
      ctx.fill();
    }
  },
  ermine(ctx, sp, lw) {
    // Mouchetures d'hermine noires sur le col de fourrure
    ctx.fillStyle = '#1e1a1c';
    for (const [x, y] of [[-3.0, -8.4], [-1.7, -9.0], [-0.3, -9.3], [1.2, -9.1], [2.6, -8.6]]) {
      ctx.beginPath();
      poly(ctx, [x - 0.28, y - 0.35, x + 0.28, y - 0.35, x, y + 0.75]);
      ctx.fill();
    }
  },
  baldric(ctx, sp, lw) {
    // Baudrier de cuir clouté en biais et grosse boucle de ceinture
    ctx.beginPath();
    poly(ctx, [2.9, -8.5, 1.0, -8.9, -3.5, -1.2, -3.2, 0.2]);
    paint(ctx, '#4a3020', edge('#4a3020', 0.8), lw);
    ctx.fillStyle = '#d9b860';
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      ctx.beginPath();
      ell(ctx, 1.95 + (-3.35 - 1.95) * t, -8.7 + (-0.5 + 8.7) * t, 0.33, 0.33);
      ctx.fill();
    }
    ctx.beginPath();
    poly(ctx, [1.4, -2.3, 3.6, -2.3, 3.6, -0.7, 1.4, -0.7]);
    paint(ctx, '#b98a38', edge('#b98a38', 0.9), lw);
    ctx.fillStyle = rgba('#ffffff', 0.5);
    ctx.fillRect(1.6, -2.1, 1.6, 0.35);
  },
  bee(ctx, sp, lw) {
    bee(ctx, 0.6, -4.7, 1.25);
  },
  fleur(ctx, sp, lw) {
    fleur(ctx, 0.7, -5.0, 3.6, GOLD);
  },
  seax(ctx, sp, lw) {
    // Seax dans son fourreau, pendu à la ceinture côté dos
    ctx.beginPath();
    capsule(ctx, -3.1, -1.6, 0.75, -4.6, 3.6, 0.6);
    paint(ctx, '#5a3a22', edge('#5a3a22', 0.85), lw);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ell(ctx, -4.5, 3.5, 0.6, 0.55);
    ell(ctx, -3.3, -1.0, 0.85, 0.5);
    ctx.fill();
    ctx.beginPath();
    ell(ctx, -2.8, -2.4, 0.55, 0.55);
    paint(ctx, '#a9a28e', edge('#a9a28e', 0.8), lw * 0.7);
  },
  brigandine(ctx, sp, lw) {
    // Brigandine aux couleurs de l'équipe : plaques rivetées sous le tissu
    const c = sp.brigandine;
    ctx.beginPath();
    ctx.moveTo(-3.1, 1.1);
    ctx.bezierCurveTo(-3.6, -2.0, -4.1, -4.8, -3.75, -7.0);
    ctx.quadraticCurveTo(-3.3, -8.7, -1.3, -8.7);
    ctx.lineTo(1.9, -8.7);
    ctx.quadraticCurveTo(3.8, -8.6, 4.0, -7.0);
    ctx.bezierCurveTo(4.4, -5.4, 4.0, -3.3, 3.2, -1.6);
    ctx.lineTo(3.5, 1.1);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3.9, 4.1, c, 0.25, -0.32, -4), edge(c, 0.8), lw);
    // Coutures horizontales et rivets dorés en quinconce
    ctx.strokeStyle = rgba(tone(c, -0.5), 0.6);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (const y of [-6.5, -4.3, -2.2]) {
      ctx.moveTo(-3.6, y);
      ctx.lineTo(4.0, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#e6c860';
    for (const [row, y] of [[0, -7.6], [1, -5.4], [0, -3.2], [1, -1.1]]) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ell(ctx, -2.6 + i * 1.95 + row * 0.9, y, 0.32, 0.32);
        ctx.fill();
      }
    }
    // Ligne centrale de l'ouverture et col
    ctx.strokeStyle = rgba('#f4ecd4', 0.7);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0.9, -8.6);
    ctx.lineTo(0.9, 1.0);
    ctx.stroke();
    // Étui à carreaux à la ceinture (côté dos)
    ctx.beginPath();
    poly(ctx, [-4.6, -3.2, -2.6, -3.2, -2.5, 0.3, -4.5, 0.3]);
    paint(ctx, '#6a4226', edge('#6a4226', 0.85), lw);
    ctx.strokeStyle = '#d9c090';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (const x of [-4.1, -3.5, -2.9]) {
      ctx.moveTo(x, -3.2);
      ctx.lineTo(x, -4.6);
    }
    ctx.stroke();
  },
  olifant(ctx, sp, lw) {
    // Baudrier et olifant (cor d'ivoire aux bagues d'or) en bandoulière
    ctx.beginPath();
    poly(ctx, [-2.9, -8.4, -1.3, -8.8, 3.7, -1.2, 3.4, 0.2, 1.9, -0.7]);
    paint(ctx, '#e8dcc0', edge('#8a7a5a', 0.8), lw);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-2.3, -8.3);
    ctx.lineTo(2.9, -1.0);
    ctx.stroke();
    const horn = () => {
      ctx.beginPath();
      ctx.moveTo(-2.6, -0.9);
      ctx.quadraticCurveTo(-1.6, 4.4, 4.0, 2.4);
    };
    horn();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6a5a3a';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = '#f2ead4';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    for (const t of [0.22, 0.6]) {
      const [x, y] = qpt([-2.6, -0.9], [-1.6, 4.4], [4.0, 2.4], t);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ell(ctx, x, y, 0.55, 1.05, 0.9);
      ctx.fill();
    }
    ctx.beginPath();
    ell(ctx, 4.1, 2.4, 0.7, 1.2);
    paint(ctx, GOLD, edge(GOLD, 0.9), lw * 0.7);
  },
  scapular(ctx, sp, lw) {
    // Scapulaire aux couleurs de l'équipe, long panneau devant la robe, croix claire
    const c = sp.scapular;
    const bot = (sp.hem || 10) - 0.4;
    ctx.beginPath();
    poly(ctx, [-0.9, -9.0, 2.5, -9.0, 2.7, bot, -1.1, bot]);
    paint(ctx, sideGrad(ctx, -1.1, 2.7, c, 0.25, -0.3, -4), edge(c, 0.85), lw);
    ctx.strokeStyle = rgba(tone(c, -0.5), 0.55);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-0.6, -8.2);
    ctx.lineTo(-0.8, bot - 0.8);
    ctx.moveTo(2.2, -8.2);
    ctx.lineTo(2.4, bot - 0.8);
    ctx.stroke();
    ctx.fillStyle = '#f4ecd4';
    ctx.fillRect(0.7, -7.6, 0.75, 4.2);
    ctx.fillRect(-0.1, -6.4, 2.35, 0.75);
  },
  mailCollar(ctx, sp, lw) {
    // Gorgerin de mailles sous le capuchon
    ctx.beginPath();
    ctx.moveTo(-4.0, -6.9);
    ctx.quadraticCurveTo(-4.1, -9.8, -0.6, -9.7);
    ctx.quadraticCurveTo(2.6, -9.9, 3.8, -8.0);
    ctx.quadraticCurveTo(1.7, -5.3, -0.2, -5.6);
    ctx.quadraticCurveTo(-2.6, -5.4, -4.0, -6.9);
    ctx.closePath();
    mailFill(ctx, '#8d959d', -4, 3.8, -8, lw);
  },
  ropeTail(ctx, sp, lw) {
    ctx.strokeStyle = '#d8c48e';
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2.4, -1.4);
    ctx.quadraticCurveTo(2.1, 1.6, 2.7, 4.6);
    ctx.moveTo(2.4, -1.4);
    ctx.quadraticCurveTo(3.4, 1.4, 3.7, 3.9);
    ctx.stroke();
    ctx.fillStyle = '#b89a5a';
    ctx.beginPath();
    ell(ctx, 2.7, 4.7, 0.5, 0.45);
    ell(ctx, 3.7, 4.0, 0.45, 0.4);
    ctx.fill();
    // Croix de bois au cou
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(0.3, -8.8);
    ctx.lineTo(1.6, -4.0);
    ctx.lineTo(2.6, -8.8);
    ctx.stroke();
    ctx.fillStyle = '#7a4c2a';
    ctx.fillRect(1.3, -4.6, 0.6, 2.4);
    ctx.fillRect(0.6, -3.9, 2.0, 0.6);
  },
  pauldrons(ctx, sp, lw) {
    // Épaulières de cuir et de fer, gorgerin : carrure de Charles Martel
    for (const [x, y, rx, ry] of [[-2.4, -7.9, 2.6, 1.9], [2.9, -8.1, 2.2, 1.7]]) {
      ctx.beginPath();
      ell(ctx, x, y, rx, ry, -0.2);
      paint(ctx, ballGrad(ctx, x, y, rx + 0.4, '#6a4a30', 0.4, -0.35), edge('#6a4a30', 0.9), lw);
      ctx.strokeStyle = rgba('#b8c0c8', 0.85);
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.ellipse(x, y, rx - 0.45, ry - 0.45, -0.2, PI * 0.95, PI * 1.8);
      ctx.stroke();
      ctx.fillStyle = '#d9b860';
      ctx.beginPath();
      ell(ctx, x + 0.2, y - 0.3, 0.3, 0.3);
      ctx.fill();
    }
  },
};

function torsoHook(ctx, sp, R, P) {
  const list = sp.xtorso;
  if (!list) return;
  const lw = 0.7 / R.z;
  for (const name of list) TORSO[name](ctx, sp, lw);
}

// ---------------------------------------------------------------------------
// Derrière le corps, devant le corps (repère de base, px)
// ---------------------------------------------------------------------------

function backHook(ctx, sp, R, P) {
  const list = sp.xback;
  if (!list) return;
  const z = R.z;
  for (const name of list) {
    if (name === 'ermineCape') {
      // Mouchetures d'hermine le long de l'ourlet du manteau de pourpre
      const fl = P.cape;
      const len = sp.capeLen || 9;
      const w = sp.capeW || 1;
      const bot = len - 9 + 7.2 - fl * 1.2;
      ctx.save();
      ctx.translate(R.hx, R.hy + R.lift);
      ctx.rotate(P.lean * 0.6);
      ctx.scale(z, z);
      const A = [(-5.8 - fl * 3.2) * w, bot];
      const C = [(-3.2 - fl * 1.5) * w, len - 9 + 8.6 - fl * 0.6];
      const B = [-0.6, len - 9 + 7.8];
      ctx.fillStyle = '#1e1a1c';
      for (const t of [0.14, 0.34, 0.54, 0.74, 0.9]) {
        const [x, y] = qpt(A, C, B, t);
        ctx.beginPath();
        poly(ctx, [x - 0.3, y - 1.5, x + 0.3, y - 1.5, x, y - 0.3]);
        ctx.fill();
      }
      ctx.restore();
    } else if (name === 'cowl') {
      // Capuchon rabattu sur la nuque (moine)
      const [nx, ny] = R.neck;
      ctx.beginPath();
      ell(ctx, nx - 1.4 * z, ny + 0.9 * z, 3.3 * z, 2.3 * z, -0.25);
      paint(ctx, sideGrad(ctx, nx - 5 * z, nx + 2 * z, tone(sp.robe, -0.05), 0.2, -0.3, ny), edge(sp.robe, 0.85), 0.7);
      ctx.strokeStyle = rgba(tone(sp.robe, -0.5), 0.6);
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(nx - 3.3 * z, ny + 0.4 * z);
      ctx.quadraticCurveTo(nx - 1.6 * z, ny + 2.4 * z, nx + 0.4 * z, ny + 2.2 * z);
      ctx.stroke();
    }
  }
}

function frontHook(ctx, sp, R) {
  if (sp.xfront === 'orb') {
    // Globe impérial tenu dans la main lointaine
    const z = R.z;
    const x = R.handF[0] + 0.7 * z;
    const y = R.handF[1] - 1.9 * z;
    ctx.beginPath();
    ell(ctx, x, y, 2.0 * z, 2.0 * z);
    paint(ctx, ballGrad(ctx, x, y, 2.3 * z, GOLD, 0.6, -0.35), edge(GOLD, 0.95), 0.6);
    ctx.strokeStyle = tone(GOLD, -0.45);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.0 * z, 0.7 * z, -0.2, 0, PI * 2);
    ctx.moveTo(x - 1.9 * z, y - 0.2 * z);
    ctx.stroke();
    ctx.fillStyle = '#d02a3a';
    ctx.beginPath();
    ell(ctx, x + 0.3 * z, y - 0.2 * z, 0.4 * z, 0.4 * z);
    ctx.fill();
    goldCross(ctx, x, y - 3.4 * z, 2.6 * z, 1.9 * z);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ell(ctx, x - 0.7 * z, y - 0.8 * z, 0.35 * z, 0.3 * z);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Armes et boucliers
// ---------------------------------------------------------------------------

function weaponHook(ctx, sp, R, P, which) {
  const z = R.z;
  const [x, y] = R.handN;
  const a = P.wA;
  switch (which) {
    case 'maul':
      warMaul(ctx, x, y, a, z);
      return true;
    case 'mace':
      flangedMace(ctx, x, y, a, z);
      return true;
    case 'joyeuse':
      greatSword(ctx, x, y, a, z, { len: 12, w: 1.55, blade: '#f0ecdc', fuller: rgba('#c8902a', 0.9), hilt: GOLD, pommel: 1.15, guard: 2.6, gem: '#2a62c8' });
      return true;
    case 'durandal':
      greatSword(ctx, x, y, a, z, { len: 11.5, w: 1.5, blade: '#dfe9f4', fuller: rgba('#5a6a84', 0.75), hilt: '#d8b44a', pommel: 1.25, guard: 2.8, gem: '#d02a3a' });
      return true;
    case 'ironStaff':
      ironShodStaff(ctx, x, y, a, z);
      return true;
    case 'procCross':
      processionCross(ctx, x, y, a, z, sp.banner);
      return true;
    case 'lance':
      if (!sp.xlance) return false;
      knightLance(ctx, x, y, a, z, { pennant: sp.pennant || sp.tunic, wave: P.cape * 1.5, long: sp.xlance.long, guard: sp.xlance.guard, wood: sp.xlance.wood });
      return true;
    case 'lightLance':
      spear(ctx, x, y, a, z, { fwd: 17, back: 6.5, head: 3.3, hw: 0.95, w: 0.95, c: '#c8a070', pennant: sp.pennant || sp.tunic, wave: P.cape * 1.2 });
      return true;
    case 'xbowImp': {
      const loaded = P.shot < 0.5;
      heavyCrossbow(ctx, x, y, P.aim, z, loaded, P.shot > 0.5 ? 0.6 * (1 - P.pull) : 0, sp.brigandine || '#3b72e8');
      return true;
    }
    default:
      return false;
  }
}

function shieldHook(ctx, sp, ex, ey, z) {
  const s = sp.xshield;
  if (!s) return false;
  franksShield(ctx, ex, ey, z, s.kind, sp.shield.face, s.s || 1, s.tilt || 0);
  return true;
}

export const HOOKS = {
  torso: torsoHook,
  helmet: helmetHook,
  head: headHook,
  back: backHook,
  front: frontHook,
  weapon: weaponHook,
  shield: shieldHook,
};

// ---------------------------------------------------------------------------
// Chevaux : caparaçons brodés, barde d'acier, plumet (crochets de unit-horse.js)
// Repère du corps : x vers l'avant, unités × z ; repère de l'encolure : cf. drawNeckHead.
// ---------------------------------------------------------------------------

function horseBody(ctx, H, R, P) {
  const z = H.hz;
  if (H.xkind === 'childeric') {
    // Abeilles d'or sur le tapis de selle
    for (const [x, y, s] of [[-7.4, 0.2, 1.1], [-2.6, 1.8, 1.15], [2.2, 0.0, 1.05]]) bee(ctx, x * z, y * z, s * z * 1.15);
  } else if (H.xkind === 'roland') {
    // Chevrons clairs sur le caparaçon et bande basse
    ctx.strokeStyle = rgba('#f6f0dc', 0.86);
    ctx.lineWidth = 1.3 * z;
    ctx.lineJoin = 'round';
    for (const x0 of [-10.4, -6.2, -2.0, 2.2, 6.4]) {
      ctx.beginPath();
      ctx.moveTo((x0 - 1.4) * z, -3.4 * z);
      ctx.lineTo((x0 + 1.5) * z, 0.4 * z);
      ctx.lineTo((x0 - 1.4) * z, 4.2 * z);
      ctx.stroke();
    }
  } else if (H.xkind === 'preux') {
    // Grandes fleurs de lys d'or et bande d'argent le long de l'ourlet
    ctx.fillStyle = rgba('#e8ecf0', 0.9);
    ctx.fillRect(-13.6 * z, 5.6 * z, 24.2 * z, 1.25 * z);
    for (const [x, y] of [[-8.4, 0.8], [-1.6, 1.6], [5.2, 0.9]]) fleur(ctx, x * z, y * z, 5.0 * z, '#f0c84a');
  }
}

function horseHead(ctx, H, R, P) {
  if (H.xkind !== 'preux' && H.xkind !== 'roland' && H.xkind !== 'leude') return;
  const z = R.z;
  const [wx, wy] = R.tf(8.2, -4.2);
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(P.neck + P.pitch * 0.5);
  if (H.xkind !== 'leude') {
    // Crinet : lames d'acier articulées le long de l'encolure (la crinière reste visible au-dessus)
    const T = [[-3.6, -2.4], [-1.6, -9.0], [2.4, -14.2], [6.4, -15.4]];
    const S = [[9.4, -13.2], [8.0, -9.6], [6.6, -4.4], [5.2, 2.2]];
    for (let i = 0; i < 4; i++) {
      const t0 = 0.1 + i * 0.2;
      const t1 = t0 + 0.24;
      const inset = 0.2;
      const tp = (t) => {
        const a = bez(T[0], T[1], T[2], T[3], t);
        const b = bez(S[0], S[1], S[2], S[3], 1 - t);
        return [a[0] + (b[0] - a[0]) * inset, a[1] + (b[1] - a[1]) * inset, b[0], b[1]];
      };
      const p0 = tp(t0);
      const p1 = tp(t1);
      steelPlate(ctx, [p0[0] * z, p0[1] * z, p1[0] * z, p1[1] * z, p1[2] * z, p1[3] * z, p0[2] * z, p0[3] * z], H.xkind === 'roland' ? '#c2c9d1' : '#b4bcc5');
    }
    // Plumet entre les oreilles
    plume(ctx, 7.4 * z, -16.4 * z, z * 1.1, H.plume || '#dc4538');
  } else if (H.plume) {
    // Houppe d'équipe entre les oreilles
    ctx.beginPath();
    ell(ctx, 7.5 * z, -17.2 * z, 1.5 * z, 1.9 * z, 0.3);
    paint(ctx, H.plume, edge(H.plume, 0.85), 0.5);
    line(ctx, 7.4 * z, -16.0 * z, 7.4 * z, -15.3 * z, '#d9b860', 0.7 * z);
  }
  ctx.restore();
}

export const HORSE_HOOKS = { body: horseBody, head: horseHead };

void vGrad; void STEEL_D;
