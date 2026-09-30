// Pièces de costume et armes égyptiennes (dessinées en vectoriel, sans aléa) : khopesh, masse blanche, sceptres,
// boucliers de peau, couronnes, nemes, perruques, collier usekh, peau de léopard, cuirasse d'écailles, plumes d'autruche.
// Les fonctions « tête » travaillent dans le repère de la tête (nez vers +x, r = rayon du crâne), les fonctions « torse »
// dans le repère du torse (unités z = 1, hanches en 0, épaules vers y = −8), les armes depuis la main (x, y, angle a, échelle z).
import { PI, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad } from './unit-kit.js';

export const LINEN = '#f1ead2';
export const LINEN_D = '#d6cba6';
export const GOLDE = '#e3b437';
export const GOLD_D = '#9a6a16';
export const TURQ = '#2fa8a0';
export const LAPIS = '#2d55a8';
export const CARNE = '#c4402e';
export const HIDE = '#d8c39a';
export const HIDE_D = '#6f4a2e';
export const OCHRE = '#c48a3c';
export const COPPER = '#c9823e';

function dirs(a) {
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  return [dx, dy, -dy, dx];
}

// ---------------------------------------------------------------------------
// Armes (depuis la main)
// ---------------------------------------------------------------------------

/** Khopesh : manche court, lame droite puis recourbée en faucille (tranchant à l'extérieur). o = { blade, hilt, len } */
export function khopesh(ctx, x, y, a, z, o = {}) {
  const [dx, dy, px, py] = dirs(a);
  const L = (o.len || 1) * z;
  const hilt = o.hilt || GOLDE;
  const blade = o.blade || '#d9dde2';
  const T = (u, p) => [x + dx * u * L + px * p * L, y + dy * u * L + py * p * L];
  // poignée et pommeau
  const h0 = T(-1.8, 0);
  const h1 = T(1.0, 0);
  ctx.lineCap = 'round';
  line(ctx, h0[0], h0[1], h1[0], h1[1], '#3a2412', 1.7 * z);
  line(ctx, h0[0], h0[1], h1[0], h1[1], '#8a5a32', 1.0 * z);
  ctx.beginPath();
  ell(ctx, h0[0], h0[1], 0.85 * z, 0.85 * z);
  paint(ctx, hilt, edge(hilt), 0.5);
  // lame : trait épais le long de l'axe puis de l'arc
  const path = () => {
    const a0 = T(1.2, 0);
    const a1 = T(5.4, 0);
    const c1 = T(9.8, 0.2);
    const a2 = T(9.6, 4.6);
    ctx.beginPath();
    ctx.moveTo(a0[0], a0[1]);
    ctx.lineTo(a1[0], a1[1]);
    ctx.quadraticCurveTo(c1[0], c1[1], a2[0], a2[1]);
  };
  path();
  ctx.strokeStyle = 'rgba(40,30,20,0.85)';
  ctx.lineWidth = 2.1 * z;
  ctx.stroke();
  path();
  ctx.strokeStyle = blade;
  ctx.lineWidth = 1.35 * z;
  ctx.stroke();
  path();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.4 * z;
  ctx.stroke();
  // garde
  const g0 = T(1.2, 1.6);
  const g1 = T(1.2, -1.6);
  line(ctx, g0[0], g0[1], g1[0], g1[1], hilt, 1.0 * z);
}

/** Masse blanche en forme de poire (Narmer) : long manche, tête de pierre. */
export function pearMace(ctx, x, y, a, z) {
  const [dx, dy] = dirs(a);
  const e = [x + dx * 8.4 * z, y + dy * 8.4 * z];
  line(ctx, x - dx * 2 * z, y - dy * 2 * z, e[0], e[1], '#3a2412', 1.7 * z);
  line(ctx, x - dx * 2 * z, y - dy * 2 * z, e[0], e[1], '#8a5a32', 1.0 * z);
  const cx = x + dx * 10.4 * z;
  const cy = y + dy * 10.4 * z;
  ctx.beginPath();
  ell(ctx, cx, cy, 2.0 * z, 2.5 * z, -a);
  paint(ctx, ballGrad(ctx, cx, cy, 2.6 * z, '#f4f1e6', 0.3, -0.3), edge('#8a8270', 0.8), 0.6);
  ctx.beginPath();
  ell(ctx, x + dx * 8.4 * z, y + dy * 8.4 * z, 0.9 * z, 0.9 * z);
  paint(ctx, GOLDE, edge(GOLDE), 0.4);
}

/** Bâton à ankh doré (prêtres, reines). */
export function ankhStaff(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  const top = [x + dx * 11.5 * z, y + dy * 11.5 * z];
  line(ctx, x - dx * 6 * z, y - dy * 6 * z, top[0], top[1], '#3a2412', 1.5 * z);
  line(ctx, x - dx * 6 * z, y - dy * 6 * z, top[0], top[1], '#a87840', 0.9 * z);
  // ankh : anneau + croix
  const c = [top[0] + dx * 2.6 * z, top[1] + dy * 2.6 * z];
  ctx.beginPath();
  ell(ctx, c[0] + dx * 1.6 * z, c[1] + dy * 1.6 * z, 1.25 * z, 1.6 * z, -a);
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 1.5 * z;
  ctx.stroke();
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 0.85 * z;
  ctx.stroke();
  const b0 = [top[0] - dx * 0.4 * z, top[1] - dy * 0.4 * z];
  const b1 = [top[0] + dx * 2.8 * z, top[1] + dy * 2.8 * z];
  line(ctx, b0[0], b0[1], b1[0], b1[1], GOLD_D, 1.4 * z);
  line(ctx, b0[0], b0[1], b1[0], b1[1], GOLDE, 0.8 * z);
  const w0 = [top[0] + dx * 0.9 * z + px * 1.7 * z, top[1] + dy * 0.9 * z + py * 1.7 * z];
  const w1 = [top[0] + dx * 0.9 * z - px * 1.7 * z, top[1] + dy * 0.9 * z - py * 1.7 * z];
  line(ctx, w0[0], w0[1], w1[0], w1[1], GOLD_D, 1.4 * z);
  line(ctx, w0[0], w0[1], w1[0], w1[1], GOLDE, 0.8 * z);
}

/** Sceptre heqa (crochet) doré et fléau : attribut royal. */
export function crookScepter(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  const top = [x + dx * 10 * z, y + dy * 10 * z];
  line(ctx, x - dx * 3 * z, y - dy * 3 * z, top[0], top[1], GOLD_D, 1.5 * z);
  line(ctx, x - dx * 3 * z, y - dy * 3 * z, top[0], top[1], GOLDE, 0.9 * z);
  // crochet
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  ctx.quadraticCurveTo(top[0] + dx * 3.6 * z + px * 0.2 * z, top[1] + dy * 3.6 * z + py * 0.2 * z, top[0] + dx * 2.2 * z + px * 2.8 * z, top[1] + dy * 2.2 * z + py * 2.8 * z);
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 1.5 * z;
  ctx.stroke();
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 0.9 * z;
  ctx.stroke();
  // bandes bleues le long de la hampe
  for (const t of [0.3, 0.5, 0.7]) {
    const bx = x + dx * (10 * t - 1) * z;
    const by = y + dy * (10 * t - 1) * z;
    line(ctx, bx - px * 0.8 * z, by - py * 0.8 * z, bx + px * 0.8 * z, by + py * 0.8 * z, LAPIS, 0.7 * z);
  }
}

// ---------------------------------------------------------------------------
// Boucliers (centre cx, cy)
// ---------------------------------------------------------------------------

function hideShape(ctx, hw, hh, top) {
  ctx.beginPath();
  ctx.moveTo(-hw, hh);
  ctx.lineTo(-hw, -hh + top);
  ctx.quadraticCurveTo(-hw, -hh, 0, -hh);
  ctx.quadraticCurveTo(hw, -hh, hw, -hh + top);
  ctx.lineTo(hw, hh);
  ctx.closePath();
}

/**
 * Grand bouclier de peau à sommet arrondi : champ aux couleurs de l'équipe, taches de robe de vache, bâti de bois.
 * kind : 'hide' (fantassin), 'tower' (garde d'élite, plus grand, lionne d'or), 'buckler' (rond et petit), 'hero' (cartouche d'or).
 */
export function egyptShield(ctx, cx, cy, z, kind, face, s = 1) {
  const k = z * s;
  ctx.save();
  ctx.translate(cx, cy);
  if (kind === 'buckler') {
    const r = 3.5 * k;
    ctx.beginPath();
    ell(ctx, -0.8 * k, 0, r, r * 1.1);
    paint(ctx, '#4a3020', 'rgba(20,12,6,0.6)', 0.6);
    ctx.beginPath();
    ell(ctx, 0, 0, r, r * 1.1);
    paint(ctx, sideGrad(ctx, -r, r, face, 0.22, -0.28), edge(face, 0.7), 0.7);
    ctx.beginPath();
    ell(ctx, 0, 0, r * 0.62, r * 0.68);
    ctx.strokeStyle = HIDE;
    ctx.lineWidth = 0.7 * k;
    ctx.stroke();
    ctx.beginPath();
    ell(ctx, 0.2 * k, 0, 1.1 * k, 1.25 * k);
    paint(ctx, ballGrad(ctx, 0.2 * k, 0, 1.3 * k, COPPER, 0.4, -0.3), 'rgba(30,20,10,0.8)', 0.5);
    ctx.restore();
    return;
  }
  const big = kind === 'tower';
  const hw = (big ? 4.4 : 3.6) * k;
  const hh = (big ? 8.4 : 6.6) * k;
  const top = hw * 1.15;
  // épaisseur (bord arrière)
  ctx.save();
  ctx.translate(-0.9 * k, 0);
  hideShape(ctx, hw, hh, top);
  paint(ctx, '#4a3020', 'rgba(20,12,6,0.6)', 0.6);
  ctx.restore();
  hideShape(ctx, hw, hh, top);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = sideGrad(ctx, -hw, hw, face, 0.22, -0.3);
  ctx.fillRect(-hw - 1, -hh - 1, hw * 2 + 2, hh * 2 + 2);
  // bordure de peau crème et taches de robe
  ctx.fillStyle = rgba(HIDE, 0.92);
  ctx.fillRect(-hw - 1, -hh - 1, hw * 2 + 2, 1.5 * k);
  ctx.fillRect(-hw - 1, hh - 1.5 * k, hw * 2 + 2, 1.6 * k);
  ctx.fillStyle = rgba(HIDE_D, 0.75);
  for (const [u, v, r] of [[-0.55, -0.35, 0.3], [0.5, 0.25, 0.26], [-0.25, 0.55, 0.2], [0.35, -0.75, 0.18]]) {
    ctx.beginPath();
    ell(ctx, u * hw, v * hh, r * hw, r * hh * 0.7, 0.4);
    ctx.fill();
  }
  ctx.restore();
  hideShape(ctx, hw, hh, top);
  ctx.strokeStyle = edge(face, 0.8);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // montant central de bois et ombilic
  ctx.beginPath();
  capsule(ctx, 0.3 * k, -hh * 0.9, 0.42 * k, 0.3 * k, hh * 0.92, 0.42 * k);
  paint(ctx, '#b58a5a', 'rgba(40,25,10,0.5)', 0.4);
  if (big || kind === 'hero') {
    // lionne ou cartouche d'or au centre
    ctx.fillStyle = GOLDE;
    ctx.strokeStyle = GOLD_D;
    ctx.lineWidth = 0.4;
    if (kind === 'hero') {
      ctx.beginPath();
      ctx.rect(-hw * 0.4, -hh * 0.42, hw * 0.8, hh * 0.84);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = GOLD_D;
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (const v of [-0.22, 0, 0.22]) {
        ctx.moveTo(-hw * 0.26, v * hh);
        ctx.lineTo(hw * 0.26, v * hh);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ell(ctx, 0.2 * k, -hh * 0.1, hw * 0.52, hh * 0.3);
      ctx.fill();
      ctx.stroke();
      // oreilles et crinière
      ctx.beginPath();
      ell(ctx, -hw * 0.28, -hh * 0.36, 0.7 * k, 0.8 * k);
      ell(ctx, hw * 0.4, -hh * 0.36, 0.7 * k, 0.8 * k);
      ctx.fill();
      ctx.fillStyle = '#7a4a10';
      ctx.beginPath();
      ell(ctx, 0.3 * k, -hh * 0.06, 0.6 * k, 0.45 * k);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ell(ctx, 0.3 * k, 0, 1.2 * k, 1.3 * k);
    paint(ctx, ballGrad(ctx, 0.3 * k, 0, 1.4 * k, COPPER, 0.4, -0.3), 'rgba(30,20,10,0.8)', 0.5);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Plumes
// ---------------------------------------------------------------------------

/** Plume d'autruche courbée (pointe vers le haut, légèrement vers l'arrière), base en (x, y), hauteur h. */
export function ostrichPlume(ctx, x, y, h, c, lean = -0.25) {
  ctx.beginPath();
  ctx.moveTo(x - 0.9, y);
  ctx.bezierCurveTo(x - 1.8 + lean * h * 0.3, y - h * 0.4, x - 1.2 + lean * h, y - h * 0.85, x + lean * h * 1.3, y - h);
  ctx.bezierCurveTo(x + 2.6 + lean * h * 0.8, y - h * 0.8, x + 2.4, y - h * 0.3, x + 0.9, y);
  ctx.closePath();
  paint(ctx, c, edge(c, 0.75), 0.45);
  ctx.strokeStyle = rgba(tone(c, -0.4), 0.6);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * h * 0.4, y - h * 0.5, x + lean * h * 1.2, y - h * 0.96);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Coiffes et couronnes (repère de la tête)
// ---------------------------------------------------------------------------

/** Petit cobra dressé (uræus) doré, base en (x, y). */
export function uraeus(ctx, x, y, s = 1) {
  ctx.beginPath();
  ctx.moveTo(x - 0.5 * s, y + 0.6 * s);
  ctx.bezierCurveTo(x - 0.9 * s, y - 0.4 * s, x - 0.6 * s, y - 1.6 * s, x + 0.1 * s, y - 2.3 * s);
  ctx.bezierCurveTo(x + 0.9 * s, y - 2.3 * s, x + 1.2 * s, y - 1.5 * s, x + 0.7 * s, y - 1.0 * s);
  ctx.bezierCurveTo(x + 0.8 * s, y - 0.2 * s, x + 0.8 * s, y + 0.2 * s, x + 0.7 * s, y + 0.6 * s);
  ctx.closePath();
  paint(ctx, GOLDE, GOLD_D, 0.4);
  ctx.fillStyle = CARNE;
  ctx.beginPath();
  ell(ctx, x + 0.3 * s, y - 1.6 * s, 0.25 * s, 0.25 * s);
  ctx.fill();
}

/** Bandes (nemes) : remplit le chemin courant en or, puis des rayures obliques de la couleur c2. */
function stripes(ctx, c1, c2, x0, y0, x1, y1, step, w, ang = 0.5) {
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c1;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = c2;
  ctx.lineWidth = w;
  ctx.beginPath();
  for (let t = x0 - (y1 - y0); t < x1; t += step) {
    ctx.moveTo(t, y0);
    ctx.lineTo(t + (y1 - y0) * ang * 2, y1);
  }
  ctx.stroke();
  ctx.restore();
}

/** Nemes royal : calotte rayée, retombées latérales. o = { c (fond), stripe, uraeus, lappet (longueur) }. */
export function nemes(ctx, r, lw, o = {}) {
  const c1 = o.c || GOLDE;
  const c2 = o.stripe || LAPIS;
  // calotte sur le crâne (du front à la nuque)
  ctx.beginPath();
  ctx.moveTo(r + 0.35, -1.2);
  ctx.quadraticCurveTo(r + 0.4, -r - 0.4, 0.8, -r - 1.5);
  ctx.quadraticCurveTo(-r - 1.4, -r - 1.2, -r - 1.9, 0.2);
  ctx.lineTo(-r - 1.2, 2.6);
  ctx.quadraticCurveTo(-0.6, 0.2, -0.3, 0.6);
  ctx.quadraticCurveTo(-0.2, -0.8, 0.4, -1.0);
  ctx.quadraticCurveTo(1.6, -1.6, r + 0.35, -1.2);
  ctx.closePath();
  stripes(ctx, c1, c2, -r - 2.5, -r - 2, r + 1, 3, 1.25, 0.6, 0.35);
  ctx.beginPath();
  ctx.moveTo(r + 0.35, -1.2);
  ctx.quadraticCurveTo(r + 0.4, -r - 0.4, 0.8, -r - 1.5);
  ctx.quadraticCurveTo(-r - 1.4, -r - 1.2, -r - 1.9, 0.2);
  ctx.lineTo(-r - 1.2, 2.6);
  ctx.quadraticCurveTo(-0.6, 0.2, -0.3, 0.6);
  ctx.quadraticCurveTo(-0.2, -0.8, 0.4, -1.0);
  ctx.quadraticCurveTo(1.6, -1.6, r + 0.35, -1.2);
  ctx.closePath();
  ctx.strokeStyle = edge(c1, 0.8);
  ctx.lineWidth = lw;
  ctx.stroke();
  // bandeau frontal d'or
  ctx.beginPath();
  ctx.moveTo(r + 0.3, -1.05);
  ctx.quadraticCurveTo(1.8, -1.8, 0.2, -1.0);
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  // retombée avant sur la poitrine (côté proche)
  const L = o.lappet ?? 7.6;
  ctx.beginPath();
  ctx.moveTo(-0.7, 1.0);
  ctx.lineTo(1.9, 1.3);
  ctx.lineTo(2.6, 1.3 + L);
  ctx.lineTo(-0.2, 1.6 + L);
  ctx.closePath();
  stripes(ctx, c1, c2, -1, 1, 3, 2 + L, 1.15, 0.6, 0.12);
  ctx.beginPath();
  ctx.moveTo(-0.7, 1.0);
  ctx.lineTo(1.9, 1.3);
  ctx.lineTo(2.6, 1.3 + L);
  ctx.lineTo(-0.2, 1.6 + L);
  ctx.closePath();
  ctx.strokeStyle = edge(c1, 0.8);
  ctx.lineWidth = lw;
  ctx.stroke();
  if (o.uraeus) uraeus(ctx, r + 0.0, -1.7, 1.25);
}

/** Retombée arrière du nemes / de la perruque (à dessiner derrière le torse). */
export function nemesBack(ctx, r, o = {}) {
  const c1 = o.c || GOLDE;
  const c2 = o.stripe || LAPIS;
  const L = o.back ?? 9;
  ctx.beginPath();
  ctx.moveTo(-r - 1.6, -0.4);
  ctx.quadraticCurveTo(-r - 2.4, 3, -r - 1.6, L);
  ctx.lineTo(-0.6, L + 0.4);
  ctx.quadraticCurveTo(-0.4, 3, 0.4, 0.6);
  ctx.closePath();
  stripes(ctx, tone(c1, -0.12), tone(c2, -0.1), -r - 3, -1, 1, L + 1, 1.2, 0.6, 0.12);
  ctx.beginPath();
  ctx.moveTo(-r - 1.6, -0.4);
  ctx.quadraticCurveTo(-r - 2.4, 3, -r - 1.6, L);
  ctx.lineTo(-0.6, L + 0.4);
  ctx.quadraticCurveTo(-0.4, 3, 0.4, 0.6);
  ctx.closePath();
  ctx.strokeStyle = edge(c1, 0.8);
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

/** Perruque noire à frange, retombée sur les épaules ; o = { c, fillet (ruban), long }. */
export function wig(ctx, r, lw, o = {}) {
  const c = o.c || '#16120f';
  ctx.beginPath();
  ctx.moveTo(r + 0.3, -1.3);
  ctx.quadraticCurveTo(r + 0.5, -r - 0.6, 0.6, -r - 1.5);
  ctx.quadraticCurveTo(-r - 1.8, -r - 1.2, -r - 1.7, 1.0);
  ctx.lineTo(-r - 1.2, 2.8);
  ctx.quadraticCurveTo(-0.5, 0.4, -0.2, 0.6);
  ctx.quadraticCurveTo(-0.1, -0.9, 0.5, -1.0);
  ctx.quadraticCurveTo(1.8, -1.7, r + 0.3, -1.3);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -2.4, r + 1.6, c, 0.4, -0.25), edge(c, 0.8), lw);
  // reflets de mèches
  ctx.strokeStyle = rgba('#7a8aa0', 0.5);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(-2.2, -3.4);
  ctx.quadraticCurveTo(-0.6, -4.0, 1.2, -3.4);
  ctx.moveTo(-3.6, -0.8);
  ctx.quadraticCurveTo(-3.2, -2.6, -1.6, -3.3);
  ctx.stroke();
  // frange droite sur le front
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(r + 0.3, -1.3);
  ctx.lineTo(r + 0.05, -0.5);
  ctx.lineTo(r - 0.9, -0.85);
  ctx.closePath();
  ctx.fill();
  if (o.fillet) {
    ctx.beginPath();
    ctx.moveTo(r + 0.3, -1.3);
    ctx.quadraticCurveTo(0.2, -2.2, -r - 1.7, -0.6);
    ctx.strokeStyle = o.fillet;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
}

/** Retombée de la perruque (derrière le torse). */
export function wigBack(ctx, r, o = {}) {
  const c = o.c || '#16120f';
  const L = o.back ?? 6.6;
  ctx.beginPath();
  ctx.moveTo(-r - 1.5, -0.6);
  ctx.quadraticCurveTo(-r - 2.4, 3, -r - 1.3, L);
  ctx.quadraticCurveTo(-2.2, L + 1.0, -0.2, L - 0.4);
  ctx.quadraticCurveTo(-0.3, 3, 0.4, 0.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 2.4, 1, c, 0.3, -0.25, 2), edge(c, 0.8), 0.6);
}

/** Couronne blanche de Haute-Égypte (hedjet) : quille haute renflée au sommet. */
export function whiteCrown(ctx, r, lw, o = {}) {
  const c = o.c || '#f6f2e6';
  ctx.beginPath();
  ctx.moveTo(-r - 0.4, -0.4);
  ctx.quadraticCurveTo(-r - 0.7, -r - 2.6, -1.6, -r - 7.2);
  ctx.quadraticCurveTo(-0.6, -r - 9.2, 0.9, -r - 8.0);
  ctx.quadraticCurveTo(2.4, -r - 4.0, r - 0.8, -r - 1.4);
  ctx.quadraticCurveTo(r + 0.4, -r, r + 0.3, -1.3);
  ctx.quadraticCurveTo(0.5, -2.0, -r - 0.4, -0.4);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 1, r + 1, c, 0.3, -0.28, -2), edge('#8a8270', 0.85), lw);
  ctx.strokeStyle = rgba('#b7ad94', 0.6);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-1.0, -r - 7.6);
  ctx.quadraticCurveTo(-1.6, -r - 3, -r, -2.0);
  ctx.stroke();
  if (o.uraeus) uraeus(ctx, r + 0.0, -1.7, 1.2);
}

/** Couronne rouge (deshret) à spirale frontale et haute arête arrière. */
export function redCrown(ctx, r, lw, o = {}) {
  const c = o.c || '#c4402e';
  ctx.beginPath();
  ctx.moveTo(-r - 0.5, -0.3);
  ctx.lineTo(-r - 0.8, -r - 5.6);
  ctx.lineTo(-r - 0.1, -r - 5.8);
  ctx.quadraticCurveTo(0.6, -r - 3.4, r - 0.6, -r - 2.0);
  ctx.quadraticCurveTo(r + 0.5, -r, r + 0.3, -1.3);
  ctx.quadraticCurveTo(0.5, -2.0, -r - 0.5, -0.3);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 1, r + 1, c, 0.25, -0.3, -2), edge(c, 0.85), lw);
  // fil enroulé sur le devant
  ctx.strokeStyle = c;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(r - 0.6, -r - 2.0);
  ctx.quadraticCurveTo(r + 1.6, -r - 5.0, r + 0.4, -r - 6.4);
  ctx.quadraticCurveTo(r - 0.6, -r - 6.0, r - 0.2, -r - 5.2);
  ctx.stroke();
  if (o.uraeus) uraeus(ctx, r + 0.0, -1.7, 1.2);
}

/** Couronne bleue de guerre (khepresh) : dôme bleu semé de disques d'or. */
export function blueCrown(ctx, r, lw, o = {}) {
  const c = o.c || LAPIS;
  ctx.beginPath();
  ctx.moveTo(-r - 1.2, 1.4);
  ctx.bezierCurveTo(-r - 1.8, -r - 1.6, -r + 0.5, -r - 5.2, 1.2, -r - 4.6);
  ctx.bezierCurveTo(r + 0.6, -r - 3.2, r + 1.0, -2.2, r + 0.3, -1.3);
  ctx.quadraticCurveTo(0.5, -2.0, -0.4, -0.8);
  ctx.quadraticCurveTo(-0.6, 0.6, -r - 0.6, 2.6);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -r - 1.6, r + 2.4, c, 0.4, -0.3), edge(c, 0.85), lw);
  ctx.fillStyle = GOLDE;
  for (const [x, y] of [[-2.6, -3.0], [-0.6, -5.0], [1.4, -6.0], [-3.4, -0.6], [1.2, -3.2], [2.8, -2.6], [-1.6, -1.4]]) {
    ctx.beginPath();
    ell(ctx, x + 0.2, y - 0.2, 0.42, 0.42);
    ctx.fill();
  }
  // bandeau d'or
  ctx.beginPath();
  ctx.moveTo(r + 0.3, -1.25);
  ctx.quadraticCurveTo(0.6, -2.1, -r - 1.0, -0.1);
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  if (o.uraeus !== false) uraeus(ctx, r + 0.0, -1.7, 1.25);
}

/** Double couronne (pschent) : blanche dans la rouge. */
export function pschent(ctx, r, lw, o = {}) {
  redCrown(ctx, r, lw, { c: '#c4402e' });
  ctx.save();
  ctx.translate(0.6, -0.9);
  ctx.scale(0.74, 0.86);
  whiteCrown(ctx, r, lw * 1.3, {});
  ctx.restore();
  if (o.uraeus !== false) uraeus(ctx, r + 0.0, -1.7, 1.2);
}

/** Coiffe de vautour + disque solaire entre deux cornes de vache (Hathor, reines) sur perruque. o = { tall } */
export function hathorDisc(ctx, r, lw, o = {}) {
  wig(ctx, r, lw, { fillet: GOLDE });
  // support d'or (modius)
  ctx.beginPath();
  poly(ctx, [-1.2, -r - 0.5, 1.6, -r - 0.8, 1.4, -r - 2.3, -1.0, -r - 2.0]);
  paint(ctx, GOLDE, GOLD_D, 0.45);
  // cornes de vache recourbées
  ctx.strokeStyle = GOLD_D;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0.2 + s * 0.8, -r - 1.6);
    ctx.quadraticCurveTo(0.2 + s * 4.4, -r - 1.4, 0.2 + s * 3.6, -r - 5.6);
    ctx.stroke();
  }
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0.2 + s * 0.8, -r - 1.6);
    ctx.quadraticCurveTo(0.2 + s * 4.4, -r - 1.4, 0.2 + s * 3.6, -r - 5.6);
    ctx.stroke();
  }
  // disque solaire
  ctx.beginPath();
  ell(ctx, 0.2, -r - 3.6, 1.7, 1.7);
  paint(ctx, ballGrad(ctx, 0.2, -r - 3.6, 2, '#e8563a', 0.3, -0.3), GOLD_D, 0.6);
  if (o.plumes) {
    ostrichPlume(ctx, -1.0, -r - 2.0, 7, '#f4f0e0', 0.05);
    ostrichPlume(ctx, 1.6, -r - 2.0, 7, '#f4f0e0', 0.05);
  }
  uraeus(ctx, r + 0.0, -1.7, 1.1);
}

/** Coiffe de vautour (reine) : tête et ailes d'oiseau sur la perruque. */
export function vultureCap(ctx, r, lw, o = {}) {
  wig(ctx, r, lw, { fillet: GOLDE });
  // ailes repliées le long de la perruque, tête d'oiseau sur le front
  ctx.beginPath();
  ctx.moveTo(r - 0.6, -2.0);
  ctx.quadraticCurveTo(0.6, -r - 1.6, -r - 1.2, -0.6);
  ctx.quadraticCurveTo(-r - 1.8, 2.2, -r - 0.9, 3.4);
  ctx.quadraticCurveTo(-1.6, 0.6, r - 0.6, -2.0);
  paint(ctx, TURQ, GOLD_D, 0.5);
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(r - 1.6, -2.2);
  ctx.quadraticCurveTo(-0.2, -r - 0.6, -r - 0.6, 0.0);
  ctx.moveTo(r - 2.0, -1.6);
  ctx.quadraticCurveTo(-0.6, -r + 0.2, -r - 0.3, 1.8);
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, r - 0.2, -2.2, 1.1, 0.95);
  paint(ctx, GOLDE, GOLD_D, 0.4);
  if (o.uraeus !== false) uraeus(ctx, r + 0.6, -2.4, 1.0);
  if (o.plumes) {
    ostrichPlume(ctx, -0.8, -r - 1.2, 7.5, '#f4f0e0', 0.05);
    ostrichPlume(ctx, 1.4, -r - 1.2, 7.5, '#dc4538', 0.05);
  }
}

/** Calotte serrée de cuir ou de bronze (soldats). o = { c, band (couleur d'équipe), studs } */
export function skullcap(ctx, r, lw, o = {}) {
  const c = o.c || '#8a5a32';
  ctx.beginPath();
  ctx.moveTo(-r - 0.6, 0.9);
  ctx.bezierCurveTo(-r - 0.9, -r - 0.3, -1.6, -r - 1.8, 0.6, -r - 1.7);
  ctx.bezierCurveTo(3.0, -r - 1.6, r + 0.6, -2.4, r + 0.6, -0.7);
  ctx.quadraticCurveTo(0.6, -1.4, -r - 0.6, 0.9);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.8, -2.5, r + 1.4, c, 0.4, -0.3), edge(c, 0.85), lw);
  if (o.band) {
    ctx.beginPath();
    ctx.moveTo(-r - 0.6, 0.6);
    ctx.quadraticCurveTo(0.6, -1.4, r + 0.6, -0.6);
    ctx.strokeStyle = o.band;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  if (o.studs) {
    ctx.fillStyle = tone(COPPER, 0.3);
    for (const [x, y] of [[-2.2, -2.6], [-0.4, -3.6], [1.6, -3.1], [2.9, -1.9], [-3.0, -0.6]]) {
      ctx.beginPath();
      ell(ctx, x, y, 0.36, 0.36);
      ctx.fill();
    }
  }
  if (o.ear) {
    // couvre-nuque
    ctx.beginPath();
    poly(ctx, [-r - 0.6, 0.6, -r - 1.0, 3.4, -1.0, 3.2, -0.4, 0.5]);
    paint(ctx, tone(c, -0.12), edge(c, 0.8), lw * 0.8);
  }
}

/** Foulard de lin noué sur la tête, bande de couleur, pan tombant dans le dos. o = { c, band } */
export function headcloth(ctx, r, lw, o = {}) {
  const c = o.c || LINEN;
  ctx.beginPath();
  ctx.moveTo(r + 0.15, -1.6);
  ctx.quadraticCurveTo(r + 0.2, -r - 0.4, 0.4, -r - 1.2);
  ctx.quadraticCurveTo(-r - 1.5, -r - 0.8, -r - 1.5, 0.8);
  ctx.quadraticCurveTo(-r - 1.4, 3.6, -r + 0.2, 3.8);
  ctx.quadraticCurveTo(-1.0, 1.0, -0.4, 0.4);
  ctx.quadraticCurveTo(-0.3, -0.9, 0.5, -1.1);
  ctx.quadraticCurveTo(1.8, -1.7, r + 0.15, -1.6);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -2.4, r + 1.6, c, 0.3, -0.25), edge(c, 0.8), lw);
  if (o.band) {
    ctx.beginPath();
    ctx.moveTo(r + 0.15, -1.6);
    ctx.quadraticCurveTo(0.6, -2.4, -r - 1.4, -0.3);
    ctx.strokeStyle = o.band;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(tone(c, -0.4), 0.5);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-2.4, -3.2);
  ctx.quadraticCurveTo(-3.6, -1.6, -3.4, 1.6);
  ctx.moveTo(-0.6, -4.2);
  ctx.quadraticCurveTo(-2.2, -3.4, -3.0, -1.0);
  ctx.stroke();
}

/** Cheveux crépus courts d'un Nubien, bandeau d'équipe et plume d'autruche. o = { hair, band, plume } */
export function nubianHair(ctx, r, lw, o = {}) {
  const c = o.hair || '#151110';
  ctx.beginPath();
  ctx.moveTo(-r - 0.9, 1.6);
  ctx.bezierCurveTo(-r - 1.6, -r - 0.6, -2.2, -r - 2.6, 0.6, -r - 2.1);
  ctx.bezierCurveTo(3.2, -r - 1.9, r + 0.9, -2.6, r + 0.5, -0.9);
  ctx.quadraticCurveTo(0.6, -1.5, -0.7, -0.8);
  ctx.quadraticCurveTo(-1.1, 0.8, -r - 0.9, 1.6);
  ctx.closePath();
  paint(ctx, c, edge(c, 0.8), lw);
  // petites boucles
  ctx.fillStyle = tone(c, 0.12);
  for (const [x, y] of [[-3.2, -1.8], [-2.0, -3.4], [-0.2, -4.5], [1.8, -3.9], [3.0, -2.5], [-3.8, 0.2]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.75, 0.7);
    ctx.fill();
  }
  if (o.band) {
    ctx.beginPath();
    ctx.moveTo(r + 0.45, -1.4);
    ctx.quadraticCurveTo(0.4, -2.3, -r - 1.2, -0.2);
    ctx.strokeStyle = o.band;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  if (o.plume) ostrichPlume(ctx, -1.4, -r - 1.9, 6.2, o.plume, -0.35);
}

/** Coiffe de lionne (Garde de Sekhmet) : peau de félin ocre, crinière, oreilles rondes, gueule sur le front. */
export function lionHead(ctx, r, lw, o = {}) {
  const c = o.c || OCHRE;
  // crinière qui encadre le visage (derrière)
  ctx.beginPath();
  ctx.moveTo(-r - 0.4, -1.0);
  ctx.bezierCurveTo(-r - 2.6, -r - 1.4, -1.2, -r - 3.3, 1.8, -r - 2.2);
  ctx.bezierCurveTo(r + 1.6, -r - 1.2, r + 0.9, -2.6, r + 0.3, -1.4);
  ctx.quadraticCurveTo(0.4, -2.2, -0.6, -0.4);
  ctx.quadraticCurveTo(-0.6, 2.4, -r - 0.9, 3.8);
  ctx.quadraticCurveTo(-r - 2.4, 1.6, -r - 0.4, -1.0);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 2, r + 1, tone(c, -0.12), 0.25, -0.3, -2), edge(c, 0.85), lw);
  // mèches
  ctx.strokeStyle = rgba(tone(c, -0.5), 0.6);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (const [x, y, x2, y2] of [[-3, -2.4, -4.6, 0.4], [-1.4, -4.6, -2.8, -2.0], [0.4, -5.2, 0.2, -3.0], [2.4, -4.4, 2.2, -2.6]]) {
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  // oreilles
  ctx.fillStyle = tone(c, 0.1);
  for (const x of [-1.4, 1.6]) {
    ctx.beginPath();
    ell(ctx, x, -r - 2.6, 1.0, 1.1);
    paint(ctx, tone(c, 0.1), edge(c, 0.8), 0.4);
  }
  // museau sur le front
  ctx.beginPath();
  ell(ctx, r - 0.2, -2.0, 1.5, 1.0, 0.2);
  paint(ctx, tone(c, 0.15), edge(c, 0.85), 0.4);
  ctx.fillStyle = '#2a1608';
  ctx.beginPath();
  ell(ctx, r + 0.8, -2.0, 0.36, 0.3);
  ctx.fill();
  if (o.band) {
    ctx.beginPath();
    ctx.moveTo(r + 0.2, -0.9);
    ctx.quadraticCurveTo(0.6, -1.5, -r - 0.6, 0.3);
    ctx.strokeStyle = o.band;
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
}

/** Fausse barbe royale tressée (sous le menton). */
export function falseBeard(ctx, c1 = GOLDE, c2 = LAPIS) {
  ctx.beginPath();
  poly(ctx, [2.2, 3.0, 3.9, 2.6, 4.3, 7.4, 3.2, 8.0]);
  ctx.save();
  stripes(ctx, c1, c2, 2, 2.4, 4.6, 8.2, 1.0, 0.5, 0.05);
  ctx.restore();
  ctx.beginPath();
  poly(ctx, [2.2, 3.0, 3.9, 2.6, 4.3, 7.4, 3.2, 8.0]);
  ctx.strokeStyle = edge(c1, 0.8);
  ctx.lineWidth = 0.4;
  ctx.stroke();
}

/** Khôl : trait noir allongé autour de l'œil (repère de la tête). */
export function kohl(ctx) {
  ctx.strokeStyle = '#120c08';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.38;
  ctx.beginPath();
  ctx.moveTo(2.85, -0.6);
  ctx.quadraticCurveTo(1.9, -0.75, 1.0, -0.35);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Torse (repère du torse)
// ---------------------------------------------------------------------------

/** Large collier usekh : demi-lune de perles (or, turquoise, lapis, cornaline). o = { c (rang extérieur) } */
export function usekh(ctx, o = {}) {
  const rows = [
    [GOLDE, 0],
    [TURQ, 0.75],
    [LAPIS, 1.4],
    [CARNE, 2.0],
    [GOLDE, 2.55],
  ];
  const curve = (inset) => {
    ctx.beginPath();
    ctx.moveTo(-3.3 + inset * 0.4, -8.4 + inset * 0.15);
    ctx.quadraticCurveTo(0.7, -2.7 - inset * 1.5, 4.0 - inset * 0.3, -8.1 + inset * 0.15);
  };
  ctx.lineCap = 'butt';
  for (let i = 0; i < rows.length; i++) {
    const [c, inset] = rows[i];
    curve(inset);
    ctx.strokeStyle = i === 0 && o.c ? o.c : c;
    ctx.lineWidth = 0.78;
    ctx.stroke();
  }
  // contour
  curve(-0.25);
  ctx.strokeStyle = 'rgba(40,24,6,0.6)';
  ctx.lineWidth = 0.35;
  ctx.stroke();
  // perles pendantes
  ctx.fillStyle = GOLDE;
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const x = -3.3 + (4.0 + 3.3) * t;
    const y = -8.4 + 0.15 + (1 - Math.pow(2 * t - 1, 2)) * 5.6 * 0.5 - 0.1;
    ctx.beginPath();
    ell(ctx, x, y + 0.2, 0.3, 0.32);
    ctx.fill();
  }
}

/** Peau de léopard en bandoulière (prêtres) : fond ocre tacheté de noir, patte à la hanche. */
export function leopard(ctx) {
  ctx.beginPath();
  poly(ctx, [-3.2, -8.0, -0.7, -8.8, 3.9, -1.2, 3.7, 0.8, 1.5, 0.5, -1.0, -2.0]);
  paint(ctx, sideGrad(ctx, -3.2, 3.9, '#d09a48', 0.2, -0.25, -4), edge('#7a4a14', 0.8), 0.45);
  ctx.fillStyle = '#2a1a0c';
  for (const [x, y] of [[-2.2, -7.4], [-0.6, -6.6], [0.5, -5.2], [1.8, -4.0], [2.6, -2.6], [0.6, -3.4], [1.6, -1.4], [-0.2, -1.4], [-1.2, -4.6]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.36, 0.3, 0.5);
    ctx.fill();
  }
  // pattes pendantes sur la poitrine
  ctx.beginPath();
  poly(ctx, [2.8, 0.2, 3.8, 0.5, 3.6, 2.6, 2.6, 2.3]);
  paint(ctx, '#d09a48', edge('#7a4a14', 0.8), 0.35);
}

/** Cuirasse d'écailles de bronze (soldats d'élite) avec liseré d'équipe au bas. o = { c, trim } */
export function scales(ctx, o = {}) {
  const c = o.c || COPPER;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-3.3, 0.5);
  ctx.bezierCurveTo(-3.6, -2.0, -4.0, -4.8, -3.7, -7.0);
  ctx.quadraticCurveTo(-3.2, -8.6, -1.0, -8.5);
  ctx.quadraticCurveTo(0.8, -7.5, 1.8, -8.5);
  ctx.quadraticCurveTo(3.5, -8.5, 3.9, -7.1);
  ctx.bezierCurveTo(4.3, -5.6, 4.1, -3.3, 3.3, -1.5);
  ctx.lineTo(3.6, 0.5);
  ctx.closePath();
  ctx.fillStyle = sideGrad(ctx, -3.9, 4.1, c, 0.25, -0.3, -4);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = rgba(tone(c, -0.55), 0.75);
  ctx.lineWidth = 0.35;
  for (let row = 0; row < 8; row++) {
    const y = -8.2 + row * 1.15;
    for (let x = -4.6 + (row % 2) * 0.8; x < 4.6; x += 1.6) {
      ctx.beginPath();
      ctx.arc(x, y, 0.85, 0.05, PI - 0.05);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(-4, -8.6, 2, 9);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-3.3, 0.5);
  ctx.bezierCurveTo(-3.6, -2.0, -4.0, -4.8, -3.7, -7.0);
  ctx.quadraticCurveTo(-3.2, -8.6, -1.0, -8.5);
  ctx.quadraticCurveTo(0.8, -7.5, 1.8, -8.5);
  ctx.quadraticCurveTo(3.5, -8.5, 3.9, -7.1);
  ctx.bezierCurveTo(4.3, -5.6, 4.1, -3.3, 3.3, -1.5);
  ctx.lineTo(3.6, 0.5);
  ctx.closePath();
  ctx.strokeStyle = edge(c, 0.8);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  if (o.trim) {
    ctx.beginPath();
    poly(ctx, [-3.3, -0.4, 3.45, -0.4, 3.6, 0.6, -3.35, 0.6]);
    paint(ctx, o.trim, edge(o.trim, 0.8), 0.3);
  }
}

/** Tablier du pagne royal : pan triangulaire plissé, bande d'or ; repose sur la jupe (longueur len, unités torse). */
export function apron(ctx, len, c1 = GOLDE, c2 = LAPIS) {
  const L = Math.max(3.4, len - 0.4);
  ctx.beginPath();
  poly(ctx, [-0.4, -0.7, 3.2, -0.7, 4.0, L, -1.2, L]);
  paint(ctx, sideGrad(ctx, -1.2, 4.0, c1, 0.25, -0.3, 0), edge(c1, 0.85), 0.45);
  ctx.strokeStyle = rgba(tone(c1, -0.5), 0.6);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (const x of [0.4, 1.4, 2.4]) {
    ctx.moveTo(x, -0.4);
    ctx.lineTo(x * 1.2 - 0.4, L - 0.3);
  }
  ctx.stroke();
  ctx.beginPath();
  poly(ctx, [-1.1, L - 1.0, 3.9, L - 1.0, 4.0, L, -1.2, L]);
  paint(ctx, c2, edge(c2, 0.8), 0.3);
}

/** Plis fins du pagne de lin, par-dessus la jupe. */
export function pleats(ctx, len) {
  ctx.strokeStyle = 'rgba(150,135,95,0.55)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = -2.8 + i * 1.45;
    ctx.moveTo(x, 0.9);
    ctx.lineTo(x - 0.25, len - 0.2);
  }
  ctx.stroke();
}

/** Queue de taureau royale accrochée à la ceinture, derrière la jupe. */
export function bullTail(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.2, -1.2);
  ctx.bezierCurveTo(-6.0, 0.4, -6.4, 3.4, -5.2, 6.0);
  ctx.strokeStyle = '#3a2a1c';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, -5.2, 6.6, 0.9, 1.4, 0.2);
  paint(ctx, '#2a1c12', null);
}
