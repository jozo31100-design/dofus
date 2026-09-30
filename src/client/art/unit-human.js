// Personnage articulé vu de trois-quarts (regarde vers +x local, pieds en 0,0).
// Le corps est décrit par un « costume » (spec, cf. unit-specs.js) et une pose (angles des membres,
// inclinaison du torse…, cf. unit-poses.js). On compose : cape et objets du dos, bras lointain,
// jambes, jupe et torse, tête (coiffure, casque), bouclier ou arc, puis arme et bras proche.
import {
  PI, clamp, tone, rgba, edge, capsule, ell, poly, paint, line, seg, rot, ik, sideGrad, vGrad, ballGrad, light,
  checkPattern, mailPattern,
} from './unit-kit.js';
import * as G from './unit-gear.js';

/** Proportions de base (z = 1 : villageois de 30 px). */
/** Grossissement de la tête et des mains (silhouette héroïque, lisible à zoom 0,6). */
export const HEAD_K = 1.14;
export const HAND_R = 1.2;

export const BODY = {
  foot: 1.0,
  thigh: 5.8,
  shin: 5.6,
  upper: 4.5,
  fore: 4.2,
  headR: 3.55,
  hipN: -0.9,
  hipF: 1.1,
  shN: [-2.5, -7.7],
  shF: [2.7, -7.9],
  neck: [0.55, -8.5],
};

/** Pose neutre (tous les champs numériques qu'utilise le dessin). */
export const POSE0 = {
  bx: 0, // décalage horizontal du bassin
  dy: 0, // décalage vertical (négatif = en l'air, positif = accroupi au-delà du contact)
  lean: 0, // inclinaison du torse (+ = vers l'avant)
  head: 0, // inclinaison de la tête
  br: 0, // respiration 0..1
  nT: 0.02, nS: -0.02, // jambe proche : cuisse, tibia
  fT: -0.04, fS: -0.06, // jambe lointaine
  nU: 0.12, nF: 0.3, // bras proche : bras, avant-bras
  fU: 0.1, fF: 0.35, // bras lointain
  wA: 2.6, // angle de l'arme dans la main proche
  cape: 0, // flottement de la cape 0..1
  aim: PI / 2, // visée (arc, arbalète)
  pull: 0, // corde tirée 0..1
  shot: 0, // 1 = projectile parti (main vide / corde relâchée)
  two: 0, // 1 = outil tenu à deux mains
  grip: 0, // écart des mains sur le manche (0 = valeur du costume)
  ik: 0, // 1 = bras de l'arc, 2 = arbalète épaulée
  ikN: 0, tnx: 0, tny: 0, bendN: -1, // main proche placée directement (cible relative à l'épaule)
  ikF: 0, tfx: 0, tfy: 0, bendF: -1, // main lointaine placée directement
  rot: 0, // rotation globale (chute)
  flat: 1, // écrasement vertical (corps allongé au sol)
  fx: 0, // décalage horizontal global (chute)
  seat: 0, mx: 0, my: 0, // à cheval : position du bassin sur la selle (px)
};

/** Calcule les articulations d'une pose. */
export function rig(sp, P) {
  const z = sp.sz;
  const T = BODY.thigh * z;
  const S = BODY.shin * z;
  const F = BODY.foot * z;
  const cN = Math.cos(P.nT);
  const cF = Math.cos(P.fT);
  const eN = T * cN + S * Math.cos(P.nS) + F;
  const eF = T * cF + S * Math.cos(P.fS) + F;
  const low = Math.max(eN, eF, T * cN + 1.2 * z, T * cF + 1.2 * z);
  // À cheval, le bassin est posé sur la selle ; à pied, le pied le plus bas touche le sol.
  const hx = P.seat ? P.mx + P.bx * z : P.bx * z;
  const hy = P.seat ? P.my : -low + P.dy * z;
  const hipN = [hx + BODY.hipN * z, hy];
  const hipF = [hx + BODY.hipF * z, hy];
  const kneeN = seg(hipN[0], hipN[1], P.nT, T);
  const ankN = seg(kneeN[0], kneeN[1], P.nS, S);
  const kneeF = seg(hipF[0], hipF[1], P.fT, T);
  const ankF = seg(kneeF[0], kneeF[1], P.fS, S);
  const lift = -P.br * 0.35 * z;
  const tf = (lx, ly) => {
    const [rx, ry] = rot(lx * z, ly * z, P.lean);
    return [hx + rx, hy + ry + lift];
  };
  const shN = tf(BODY.shN[0], BODY.shN[1]);
  const shF = tf(BODY.shF[0], BODY.shF[1]);
  const neck = tf(BODY.neck[0], BODY.neck[1]);
  const headA = P.lean * 0.7 + P.head;
  const [hdx, hdy] = rot(0.25 * z, -(0.7 + BODY.headR * 0.92 * HEAD_K) * z, headA);
  const head = [neck[0] + hdx, neck[1] + hdy];
  const U = BODY.upper * z;
  const Fo = BODY.fore * z;
  let nU = P.nU;
  let nF = P.nF;
  let fU = P.fU;
  let fF = P.fF;
  const ax = Math.sin(P.aim);
  const ay = Math.cos(P.aim);
  const mode = Math.round(P.ik);
  if (mode === 1) {
    // Arc : bras lointain tendu vers la cible, main proche qui tire la corde vers la joue
    fU = P.aim - 0.08;
    fF = P.aim + 0.02;
    const e = seg(shF[0], shF[1], fU, U);
    const h = seg(e[0], e[1], fF, Fo);
    const pl = (1.6 + 6.2 * P.pull) * z;
    [nU, nF] = ik(shN[0], shN[1], h[0] - ax * pl, h[1] - ay * pl + 0.9 * z * P.pull, U, Fo, -1);
  } else if (mode === 2) {
    // Arbalète épaulée : main proche à la détente, main lointaine sous l'arc
    const tx = shN[0] + ax * 3.4 * z + 0.8 * z;
    const ty = shN[1] + ay * 3.4 * z + 1.0 * z;
    [nU, nF] = ik(shN[0], shN[1], tx, ty, U, Fo, -1);
    [fU, fF] = ik(shF[0], shF[1], tx + ax * 5.6 * z, ty + ay * 5.6 * z, U, Fo, -1);
  } else if (mode === 3) {
    // Arbalète au repos, tenue en travers du corps, pointée vers le haut
    const tx = shN[0] + 2.4 * z;
    const ty = shN[1] + 6.6 * z;
    [nU, nF] = ik(shN[0], shN[1], tx, ty, U, Fo, -1);
    [fU, fF] = ik(shF[0], shF[1], tx + ax * 4.8 * z, ty + ay * 4.8 * z, U, Fo, -1);
  }
  // Cibles directes des mains (en px locaux relatifs à l'épaule, × z) : pratique pour porter une charge
  if (P.ikN > 0.5) [nU, nF] = ik(shN[0], shN[1], shN[0] + P.tnx * z, shN[1] + P.tny * z, U, Fo, P.bendN || -1);
  if (P.ikF > 0.5) [fU, fF] = ik(shF[0], shF[1], shF[0] + P.tfx * z, shF[1] + P.tfy * z, U, Fo, P.bendF || -1);
  const elN = seg(shN[0], shN[1], nU, U);
  const handN = seg(elN[0], elN[1], nF, Fo);
  let elF = seg(shF[0], shF[1], fU, U);
  let handF = seg(elF[0], elF[1], fF, Fo);
  if (P.two > 0.01) {
    // Seconde main sur le manche, un peu plus haut que la main proche
    const d = (P.grip || sp.twoGrip || 2.4) * z;
    const tx = handN[0] + Math.sin(P.wA) * d;
    const ty = handN[1] + Math.cos(P.wA) * d;
    const [a1, a2] = ik(shF[0], shF[1], tx, ty, U, Fo, -1);
    fU += (a1 - fU) * P.two;
    fF += (a2 - fF) * P.two;
    elF = seg(shF[0], shF[1], fU, U);
    handF = seg(elF[0], elF[1], fF, Fo);
  }
  return { z, hx, hy, hipN, hipF, kneeN, ankN, kneeF, ankF, shN, shF, neck, head, headA, elN, handN, elF, handF, fU, fF, lift };
}

// ---------------------------------------------------------------------------
// Jambes
// ---------------------------------------------------------------------------

/** Dégradé diagonal de volume (lumière chaude côté soleil, ombre froide à l'opposé), à poser sur une forme déjà peinte. */
export function volGrad(ctx, x0, x1, y0, y1, a1 = 0.16, a2 = 0.26) {
  const lit = light.s < 0 ? x0 : x1;
  const dark = light.s < 0 ? x1 : x0;
  const g = ctx.createLinearGradient(lit, y0, dark, y1);
  g.addColorStop(0, `rgba(255,240,205,${a1})`);
  g.addColorStop(0.42, 'rgba(255,240,205,0)');
  g.addColorStop(0.62, 'rgba(10,18,50,0)');
  g.addColorStop(1, `rgba(10,18,50,${a2})`);
  return g;
}

function legPath(ctx, z, hip, knee, ank) {
  ctx.beginPath();
  capsule(ctx, hip[0], hip[1], 1.78 * z, knee[0], knee[1], 1.32 * z);
  capsule(ctx, knee[0], knee[1], 1.32 * z, ank[0], ank[1], 0.98 * z);
}

function drawLeg(ctx, sp, hip, knee, ank, shinA, far) {
  const z = sp.sz;
  const L = sp.legs;
  const dk = far ? -0.22 : 0;
  const base = tone(L.kind === 'bare' ? sp.skin : L.c1, dk);
  legPath(ctx, z, hip, knee, ank);
  // Braies à carreaux : remplissage à motif (sans découpage, beaucoup plus rapide)
  ctx.fillStyle = L.kind === 'check' ? checkPattern(ctx, base, tone(L.c2, dk), 2.6 * z) : base;
  ctx.fill();
  // Volume : cuisse et mollet arrondis (lumière au-dessus, ombre sous la jambe)
  const lx0 = Math.min(hip[0], knee[0], ank[0]) - 2.2 * z;
  const lx1 = Math.max(hip[0], knee[0], ank[0]) + 2.2 * z;
  ctx.fillStyle = volGrad(ctx, lx0, lx1, hip[1], ank[1], far ? 0.05 : 0.17, far ? 0.3 : 0.3);
  ctx.fill();
  ctx.strokeStyle = edge(base, 0.6);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  if (L.kind === 'wrap') {
    // Bandes molletières croisées (lanières) sur le tibia
    ctx.strokeStyle = tone(L.c2, dk);
    ctx.lineWidth = 0.5 * z;
    ctx.beginPath();
    const dx = ank[0] - knee[0];
    const dy = ank[1] - knee[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = (-dy / len) * 0.85 * z;
    const py = (dx / len) * 0.85 * z;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const t0 = 0.14 + (i / n) * 0.8;
      const t1 = t0 + 0.18;
      const ax = knee[0] + dx * t0;
      const ay = knee[1] + dy * t0;
      const bx = knee[0] + dx * t1;
      const by = knee[1] + dy * t1;
      ctx.moveTo(ax - px, ay - py);
      ctx.lineTo(bx + px, by + py);
      ctx.moveTo(ax + px, ay + py);
      ctx.lineTo(bx - px, by - py);
    }
    ctx.stroke();
  }
  if (sp.paint) {
    // Peinture de guerre au pastel (guède) sur la jambe nue
    ctx.strokeStyle = rgba('#2f55b8', far ? 0.55 : 0.8);
    ctx.lineWidth = 0.45 * z;
    ctx.beginPath();
    ctx.moveTo(hip[0] - 0.6 * z, hip[1] + 1.4 * z);
    ctx.quadraticCurveTo(knee[0] + 0.9 * z, (hip[1] + knee[1]) / 2, knee[0] - 0.3 * z, knee[1] - 0.5 * z);
    ctx.moveTo(knee[0] + 0.4 * z, knee[1] + 1.4 * z);
    ctx.lineTo(ank[0] - 0.3 * z, ank[1] - 1.6 * z);
    ctx.stroke();
  }
  // Pied chaussé
  const fr = clamp(-shinA * 0.6, -0.6, 1.2);
  const [fx, fy] = rot(1.0 * z, 0.35 * z, fr);
  ctx.beginPath();
  ell(ctx, ank[0] + fx, ank[1] + fy, 1.95 * z, 1.05 * z, fr);
  const sc = tone(sp.shoes, dk);
  paint(ctx, sc, edge(sc, 0.7), 0.6);
  // Reflet sur le cuir du soulier
  line(ctx, ank[0] + fx - 0.6 * z, ank[1] + fy - 0.45 * z, ank[0] + fx + 0.7 * z, ank[1] + fy - 0.5 * z, rgba(tone(sc, 0.55), far ? 0.3 : 0.55), 0.35 * z);
}

// ---------------------------------------------------------------------------
// Bras
// ---------------------------------------------------------------------------

function drawArm(ctx, sp, sh, el, hand, far) {
  const z = sp.sz;
  const dk = far ? -0.24 : 0;
  let cu;
  let cf;
  const sl = sp.sleeves;
  if (sl === 'bare') {
    cu = sp.skin;
    cf = sp.skin;
  } else if (sl === 'short') {
    cu = sp.tunic;
    cf = sp.skin;
  } else if (sl === 'mail') {
    cu = sp.mail.c;
    cf = sp.foreSleeve || sp.tunic;
  } else if (sl === 'robe') {
    cu = sp.robe;
    cf = sp.robe;
  } else {
    cu = sp.tunic;
    cf = sp.tunic;
  }
  cu = tone(cu, dk);
  cf = tone(cf, dk);
  ctx.beginPath();
  capsule(ctx, sh[0], sh[1], 1.55 * z, el[0], el[1], 1.18 * z);
  const ax0 = Math.min(sh[0], el[0]) - 1.5 * z;
  const ax1 = Math.max(sh[0], el[0]) + 1.5 * z;
  if (sl === 'mail') {
    // Manche de mailles
    ctx.fillStyle = mailPattern(ctx, cu, 2.3 * z);
    ctx.fill();
    ctx.fillStyle = shadeOverlay(ctx, ax0, ax1);
    ctx.fill();
    ctx.strokeStyle = edge(cu);
    ctx.lineWidth = 0.65;
    ctx.stroke();
  } else {
    paint(ctx, sideGrad(ctx, ax0, ax1, cu, 0.18, -0.2), edge(cu), 0.65);
    ctx.fillStyle = volGrad(ctx, ax0, ax1, Math.min(sh[1], el[1]) - 1.5 * z, Math.max(sh[1], el[1]) + 1.5 * z, far ? 0.04 : 0.15, 0.26);
    ctx.fill();
  }
  ctx.beginPath();
  capsule(ctx, el[0], el[1], 1.18 * z, hand[0], hand[1], sl === 'robe' ? 1.3 * z : 0.98 * z);
  paint(ctx, cf, edge(cf), 0.65);
  if (sp.paint && sl === 'bare') {
    ctx.strokeStyle = rgba('#2f55b8', far ? 0.5 : 0.8);
    ctx.lineWidth = 0.45 * z;
    ctx.beginPath();
    ctx.moveTo(sh[0] + (el[0] - sh[0]) * 0.3, sh[1] + (el[1] - sh[1]) * 0.3 - 0.6 * z);
    ctx.lineTo(sh[0] + (el[0] - sh[0]) * 0.6, sh[1] + (el[1] - sh[1]) * 0.6 + 0.6 * z);
    ctx.stroke();
  }
  if (sl === 'long' || sl === 'mail') {
    // Poignet de la manche (galon)
    const t = 0.8;
    const wx = el[0] + (hand[0] - el[0]) * t;
    const wy = el[1] + (hand[1] - el[1]) * t;
    const ang = Math.atan2(hand[1] - el[1], hand[0] - el[0]) + Math.PI / 2;
    const c = sp.trim2 && sl === 'long' ? tone(sp.trim2, dk) : tone(cf, -0.32);
    line(ctx, wx - Math.cos(ang) * 0.85 * z, wy - Math.sin(ang) * 0.85 * z, wx + Math.cos(ang) * 0.85 * z, wy + Math.sin(ang) * 0.85 * z, c, 0.6 * z);
  }
  if (sp.bracelet) {
    // Bracelet d'or au poignet
    const wx = el[0] + (hand[0] - el[0]) * 0.86;
    const wy = el[1] + (hand[1] - el[1]) * 0.86;
    const ang = Math.atan2(hand[1] - el[1], hand[0] - el[0]) + Math.PI / 2;
    const bc = tone(sp.bracelet, dk);
    line(ctx, wx - Math.cos(ang) * 1.0 * z, wy - Math.sin(ang) * 1.0 * z, wx + Math.cos(ang) * 1.0 * z, wy + Math.sin(ang) * 1.0 * z, edge(bc, 0.8), 1.2 * z);
    line(ctx, wx - Math.cos(ang) * 0.9 * z, wy - Math.sin(ang) * 0.9 * z, wx + Math.cos(ang) * 0.9 * z, wy + Math.sin(ang) * 0.9 * z, bc, 0.75 * z);
  }
  const hc = tone(sp.gloves || sp.skin, dk);
  ctx.beginPath();
  ell(ctx, hand[0], hand[1], HAND_R * z, HAND_R * z);
  paint(ctx, hc, edge(hc, 0.7), 0.6);
}

// ---------------------------------------------------------------------------
// Torse, jupe, cape
// ---------------------------------------------------------------------------

/** Abscisse d'une jambe à une profondeur d sous la hanche. */
function legXAt(R, hip, thighA, shinA, d, z) {
  const T = BODY.thigh * z;
  if (d <= T) return hip[0] + Math.sin(thighA) * d;
  return hip[0] + Math.sin(thighA) * T + Math.sin(shinA) * (d - T);
}

/** Dégradé d'ombrage translucide (clair côté lumière, sombre à l'opposé) à poser sur un motif. */
function shadeOverlay(ctx, x0, x1, y = 0, a1 = 0.22, a2 = 0.3) {
  const lit = light.s < 0 ? x0 : x1;
  const dark = light.s < 0 ? x1 : x0;
  const g = ctx.createLinearGradient(lit, y, dark, y);
  g.addColorStop(0, `rgba(255,255,255,${a1})`);
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, `rgba(0,0,0,${a2})`);
  return g;
}

function drawSkirt(ctx, sp, R, P, color, hem, mail, band) {
  const z = sp.sz;
  const h = hem * z;
  const xn = legXAt(R, R.hipN, P.nT, P.nS, h, z);
  const xf = legXAt(R, R.hipF, P.fT, P.fS, h, z);
  const xl = Math.min(xn, xf, R.hx - 3.0 * z) - 1.5 * z;
  const xr = Math.max(xn, xf, R.hx + 3.2 * z) + 1.5 * z;
  const [t1x, t1y] = rot(-3.2 * z, 0, P.lean);
  const [t2x, t2y] = rot(3.5 * z, 0, P.lean);
  const top = R.hy - 0.8 * z;
  const bot = R.hy + h;
  ctx.beginPath();
  ctx.moveTo(R.hx + t1x, top + t1y);
  ctx.lineTo(R.hx + t2x, top + t2y);
  ctx.quadraticCurveTo(xr - 0.2 * z, (top + bot) / 2, xr, bot - 0.3 * z);
  ctx.quadraticCurveTo((xl + xr) / 2, bot + 1.1 * z, xl, bot - 0.2 * z);
  ctx.quadraticCurveTo(xl + 0.3 * z, (top + bot) / 2, R.hx + t1x, top + t1y);
  ctx.closePath();
  if (mail) {
    // Pan de cotte de mailles : motif d'anneaux puis ombrage translucide
    ctx.fillStyle = mailPattern(ctx, color, 2.3 * z);
    ctx.fill();
    ctx.fillStyle = shadeOverlay(ctx, xl, xr, bot);
    ctx.fill();
    ctx.strokeStyle = edge(color, 0.7);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  } else {
    paint(ctx, sideGrad(ctx, xl, xr, color, 0.15, -0.3, bot), edge(color), 0.7);
    ctx.fillStyle = volGrad(ctx, xl, xr, top, bot, 0.14, 0.3);
    ctx.fill();
    // Plis du tissu : un grand pli central et deux plis de côté qui s'évasent vers l'ourlet
    ctx.strokeStyle = rgba(tone(color, -0.45), 0.5);
    ctx.lineWidth = 0.45 * z;
    ctx.beginPath();
    const mx = (xn + xf) / 2;
    ctx.moveTo(mx, top + 1.2 * z);
    ctx.lineTo(mx + (xn - xf) * 0.1, bot + 0.3 * z);
    ctx.moveTo(mx - 1.7 * z, top + 1.6 * z);
    ctx.quadraticCurveTo(mx - 2.0 * z, (top + bot) / 2, mx - 2.6 * z - (xn - xf) * 0.05, bot);
    ctx.stroke();
    ctx.strokeStyle = rgba(tone(color, 0.5), 0.35);
    ctx.lineWidth = 0.4 * z;
    ctx.beginPath();
    ctx.moveTo(mx - 2.4 * z, top + 1.4 * z);
    ctx.quadraticCurveTo(mx - 3.0 * z, (top + bot) / 2, mx - 3.5 * z, bot - 0.6 * z);
    ctx.stroke();
  }
  if (band) {
    // Galon (tunique) ou bande brodée aux couleurs de l'équipe (robe) le long de l'ourlet
    const bw = (color === sp.robe ? 1.8 : 1.0) * z;
    const cx = (xl + xr) / 2;
    ctx.beginPath();
    ctx.moveTo(xr - 0.05 * z, bot - 0.3 * z);
    ctx.quadraticCurveTo(cx, bot + 1.1 * z, xl + 0.05 * z, bot - 0.2 * z);
    ctx.lineTo(xl + 0.2 * z, bot - 0.2 * z - bw);
    ctx.quadraticCurveTo(cx, bot + 1.1 * z - bw, xr - 0.2 * z, bot - 0.3 * z - bw);
    ctx.closePath();
    ctx.fillStyle = band;
    ctx.fill();
    ctx.strokeStyle = rgba(tone(band, -0.5), 0.45);
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
}

function torsoPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.1, 0.6);
  ctx.bezierCurveTo(-3.4, -2.0, -4.2, -4.6, -4.0, -6.9);
  ctx.quadraticCurveTo(-3.8, -8.8, -1.4, -9.0);
  ctx.lineTo(1.7, -9.0);
  ctx.quadraticCurveTo(4.0, -8.9, 4.2, -7.0);
  ctx.bezierCurveTo(4.6, -5.4, 4.1, -3.3, 3.2, -1.6);
  ctx.lineTo(3.5, 0.6);
  ctx.closePath();
}

function drawTorso(ctx, sp, R, P) {
  const z = sp.sz;
  ctx.save();
  ctx.translate(R.hx, R.hy + R.lift);
  ctx.rotate(P.lean);
  ctx.scale(z, z);
  const lw = 0.7 / z;
  const naked = sp.naked;
  const base = naked ? sp.skin : sp.robe || sp.tunic;
  torsoPath(ctx);
  paint(ctx, sideGrad(ctx, -3.9, 4.1, base, 0.2, -0.28, -4), edge(base), lw);
  // Volume du buste : poitrine éclairée, flanc et taille dans l'ombre froide
  ctx.fillStyle = volGrad(ctx, -4.2, 4.6, -9, 0.6, 0.2, 0.3);
  ctx.fill();
  if (naked) {
    // Pectoraux et abdominaux suggérés
    ctx.strokeStyle = rgba(tone(sp.skin, -0.35), 0.6);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0.4, -5.2);
    ctx.quadraticCurveTo(2.0, -4.4, 3.6, -5.0);
    ctx.moveTo(1.8, -3.6);
    ctx.lineTo(1.9, -1.0);
    ctx.stroke();
    if (sp.paint) {
      // Spirales de guède
      ctx.strokeStyle = rgba('#2f55b8', 0.85);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(1.4, -6.2, 1.1, 0, PI * 1.6);
      ctx.moveTo(-1.8, -3.4);
      ctx.quadraticCurveTo(-0.4, -1.6, 1.2, -2.8);
      ctx.quadraticCurveTo(2.2, -3.8, 3.2, -2.4);
      ctx.moveTo(-2.4, -6.6);
      ctx.lineTo(-1.2, -4.6);
      ctx.stroke();
    }
  } else if (!sp.robe) {
    // Encolure (peau visible) et plis
    ctx.beginPath();
    poly(ctx, [0.3, -8.9, 2.3, -8.9, 1.5, -7.4]);
    ctx.fillStyle = tone(sp.skin, -0.08);
    ctx.fill();
    ctx.strokeStyle = rgba(tone(base, -0.45), 0.45);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-1.6, -6.4);
    ctx.quadraticCurveTo(-0.6, -4.6, -1.4, -2.4);
    ctx.stroke();
  }
  if (sp.mail) {
    // Cotte de mailles sur le torse
    ctx.beginPath();
    ctx.moveTo(-3.2, 0.9);
    ctx.bezierCurveTo(-3.6, -2.0, -3.95, -4.8, -3.55, -7.0);
    ctx.quadraticCurveTo(-3.2, -8.6, -1.1, -8.6);
    ctx.quadraticCurveTo(0.9, -7.6, 1.8, -8.6);
    ctx.quadraticCurveTo(3.4, -8.6, 3.75, -7.1);
    ctx.bezierCurveTo(4.25, -5.6, 4.05, -3.4, 3.25, -1.6);
    ctx.lineTo(3.6, 0.9);
    ctx.closePath();
    ctx.fillStyle = mailPattern(ctx, sp.mail.c, 2.3);
    ctx.fill();
    ctx.fillStyle = shadeOverlay(ctx, -3.9, 4.1, -4);
    ctx.fill();
    ctx.strokeStyle = edge(sp.mail.c, 0.7);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  if (sp.tabard) {
    // Tabard aux couleurs de l'équipe par-dessus la cotte (lisibilité des camps dans la mêlée)
    const c = sp.tabard;
    ctx.beginPath();
    ctx.moveTo(-2.7, 1.0);
    ctx.bezierCurveTo(-3.1, -2.0, -3.4, -5.0, -3.0, -7.3);
    ctx.quadraticCurveTo(-2.4, -8.5, -0.7, -8.5);
    ctx.lineTo(0.6, -6.9);
    ctx.lineTo(1.9, -8.5);
    ctx.quadraticCurveTo(3.2, -8.4, 3.35, -7.1);
    ctx.bezierCurveTo(3.85, -5.6, 3.65, -3.4, 2.95, -1.6);
    ctx.lineTo(3.2, 1.0);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3.4, 3.9, c, 0.22, -0.3, -4), edge(c, 0.7), lw);
    ctx.strokeStyle = sp.trim || rgba(tone(c, 0.55), 0.8);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-0.7, -8.3);
    ctx.lineTo(0.6, -6.7);
    ctx.lineTo(1.9, -8.3);
    ctx.stroke();
    if (sp.emblem) {
      ctx.fillStyle = sp.emblem;
      ctx.beginPath();
      if (sp.civ === 'gauls') {
        // Triskèle stylisé
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * PI * 2 - 0.4;
          ell(ctx, 0.5 + Math.cos(a) * 0.9, -4.6 + Math.sin(a) * 0.9, 0.62, 0.62);
        }
      } else {
        poly(ctx, [0.2, -6.2, 0.9, -6.2, 0.9, -5.0, 2.0, -5.0, 2.0, -4.3, 0.9, -4.3, 0.9, -2.6, 0.2, -2.6, 0.2, -4.3, -0.9, -4.3, -0.9, -5.0, 0.2, -5.0]);
      }
      ctx.fill();
    }
  }
  if (sp.sash) {
    // Baudrier aux couleurs de l'équipe, en travers du torse
    ctx.beginPath();
    poly(ctx, [-2.9, -8.2, -1.2, -8.6, 3.6, -1.4, 3.3, 0.2, 1.8, -0.6]);
    paint(ctx, sideGrad(ctx, -3, 3.6, sp.sash, 0.25, -0.25, -4), edge(sp.sash, 0.75), lw);
  }
  if (sp.plate) {
    // Plastron de bronze/acier (champions)
    ctx.beginPath();
    ctx.moveTo(-2.6, -1.2);
    ctx.bezierCurveTo(-3.1, -3.5, -3.2, -6.0, -2.4, -7.6);
    ctx.quadraticCurveTo(0.8, -8.2, 3.2, -7.2);
    ctx.bezierCurveTo(3.8, -5.5, 3.6, -3.2, 2.8, -1.3);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3, 3.8, sp.plate, 0.35, -0.3, -4), edge(sp.plate, 0.8), lw);
    line(ctx, -1.6, -6.9, 1.4, -6.1, rgba('#ffffff', 0.45), 0.45);
  }
  if (sp.stole) {
    // Étole large aux couleurs de l'équipe (prêtre, druide)
    ctx.beginPath();
    poly(ctx, [-0.3, -8.9, 2.3, -8.9, 3.3, 1.0, 0.8, 1.0]);
    paint(ctx, sideGrad(ctx, -0.3, 3.3, sp.stole, 0.2, -0.25, -4), edge(sp.stole), lw);
    ctx.fillStyle = G.GOLD;
    ctx.fillRect(1.0, -0.4, 2.0, 0.6);
    if (sp.civ === 'franks') {
      ctx.fillRect(1.2, -6.2, 1.2, 0.5);
      ctx.fillRect(1.55, -6.9, 0.5, 1.9);
    }
  }
  if (sp.belt) {
    ctx.beginPath();
    poly(ctx, [-3.35, -2.1, 3.3, -2.1, 3.35, -0.9, -3.3, -0.9]);
    paint(ctx, sp.belt, edge(sp.belt, 0.7), lw);
    ctx.beginPath();
    ell(ctx, 2.5, -1.5, 0.75, 0.62);
    paint(ctx, sp.buckle || G.BRONZE, null);
    if (sp.sickleBelt) {
      ctx.beginPath();
      ctx.arc(-0.8, 0.4, 1.5, -0.4, PI * 0.9);
      ctx.strokeStyle = G.GOLD;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  if (sp.torque) {
    // Torque d'or ouvert
    ctx.beginPath();
    ctx.ellipse(1.1, -8.5, 2.1, 0.9, 0.12, -0.2, PI + 0.4);
    ctx.strokeStyle = tone(G.GOLD, -0.45);
    ctx.lineWidth = 1.05;
    ctx.stroke();
    ctx.strokeStyle = G.GOLD;
    ctx.lineWidth = 0.65;
    ctx.stroke();
    ctx.fillStyle = '#fff2b0';
    ctx.beginPath();
    ell(ctx, 2.9, -8.2, 0.42, 0.42);
    ctx.fill();
  }
  if (sp.fur) {
    // Col de fourrure (capes franques)
    ctx.beginPath();
    ctx.moveTo(-3.7, -6.6);
    ctx.quadraticCurveTo(-3.8, -9.6, -0.6, -9.5);
    ctx.quadraticCurveTo(2.2, -9.7, 3.4, -8.4);
    ctx.quadraticCurveTo(1.5, -7.4, -0.2, -7.9);
    ctx.quadraticCurveTo(-2.4, -7.6, -3.7, -6.6);
    paint(ctx, sideGrad(ctx, -3.8, 3.4, sp.fur, 0.25, -0.2, -8), edge(sp.fur), lw);
    // Poils clairs
    ctx.strokeStyle = rgba(tone(sp.fur, 0.45), 0.7);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (const [x, y] of [[-2.8, -8.4], [-1.2, -9.1], [0.6, -9.0], [2.0, -8.6]]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.5, y + 1.0);
    }
    ctx.stroke();
  }
  if (sp.fibula) {
    // Fibule d'or qui ferme le manteau sur l'épaule
    ctx.beginPath();
    ell(ctx, -1.6, -7.6, 1.15, 1.15);
    paint(ctx, ballGrad(ctx, -1.6, -7.6, 1.3, sp.fibula, 0.5, -0.3), rgba('#5a3a08', 0.9), 0.4);
    ctx.fillStyle = '#c8302a';
    ctx.beginPath();
    ell(ctx, -1.6, -7.6, 0.4, 0.4);
    ctx.fill();
  }
  // Décor propre à une unité d'extension (repère du torse, unités z = 1)
  if (sp.hooks && sp.hooks.torso) sp.hooks.torso(ctx, sp, R, P);
  ctx.restore();
}

function drawCape(ctx, sp, R, P) {
  const z = sp.sz;
  const c = sp.cape;
  ctx.save();
  ctx.translate(R.hx, R.hy + R.lift);
  ctx.rotate(P.lean * 0.6);
  ctx.scale(z, z);
  const fl = P.cape;
  const len = sp.capeLen || 9;
  const w = sp.capeW || 1;
  const bot = len - 9 + 7.2 - fl * 1.2;
  ctx.beginPath();
  ctx.moveTo(-3.0, -8.6);
  ctx.quadraticCurveTo((-5.2 - fl * 1.5) * w, -3.0, (-5.8 - fl * 3.2) * w, bot);
  ctx.quadraticCurveTo((-3.2 - fl * 1.5) * w, len - 9 + 8.6 - fl * 0.6, -0.6, len - 9 + 7.8);
  ctx.lineTo(1.6, -8.4);
  ctx.closePath();
  if (sp.capeCheck) {
    // Manteau à carreaux (laine gauloise) : motif puis ombrage translucide
    ctx.fillStyle = checkPattern(ctx, sp.capeCheck[0], sp.capeCheck[1], 3.4);
    ctx.fill();
    ctx.fillStyle = shadeOverlay(ctx, -6.5 * w, 2, 0, 0.16, 0.42);
    ctx.fill();
    ctx.strokeStyle = edge(c, 0.7);
    ctx.lineWidth = 0.7 / z;
    ctx.stroke();
  } else {
    paint(ctx, sideGrad(ctx, -6 * w, 2, c, 0.12, -0.35, 0), edge(c, 0.7), 0.7 / z);
    ctx.fillStyle = volGrad(ctx, -6 * w, 2, -8, bot, 0.14, 0.3);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(tone(c, -0.45), 0.55);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-3.4, -6.5);
  ctx.quadraticCurveTo((-4.4 - fl) * w, -1.5, (-4.6 - fl * 2.2) * w, len - 9 + 7.4);
  ctx.stroke();
  if (sp.capeTrim) {
    // Galon (fourrure ou broderie) le long de l'ourlet
    ctx.beginPath();
    ctx.moveTo((-5.8 - fl * 3.2) * w, bot);
    ctx.quadraticCurveTo((-3.2 - fl * 1.5) * w, len - 9 + 8.6 - fl * 0.6, -0.6, len - 9 + 7.8);
    ctx.lineTo(-0.7, len - 9 + 5.9);
    ctx.quadraticCurveTo((-3.6 - fl * 1.5) * w, len - 9 + 6.5 - fl * 0.6, (-6.1 - fl * 3.2) * w, bot - 1.9);
    ctx.closePath();
    paint(ctx, sp.capeTrim, edge(sp.capeTrim, 0.6), 0.5);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Tête
// ---------------------------------------------------------------------------

function headFrame(ctx, R) {
  ctx.save();
  ctx.translate(R.head[0], R.head[1]);
  ctx.rotate(R.headA);
  ctx.scale(R.z * HEAD_K, R.z * HEAD_K);
}

/** Cheveux longs et capuches retombant dans le dos : dessinés avant le torse. */
function drawBackHair(ctx, sp, R) {
  if (sp.hairStyle !== 'long' && !sp.hood && !sp.aventail) return;
  headFrame(ctx, R);
  const r = BODY.headR;
  if (sp.hood) {
    const c = sp.hood;
    ctx.beginPath();
    ctx.moveTo(-r - 0.4, -1.0);
    ctx.quadraticCurveTo(-r - 2.2, 3.5, -r - 1.2, 6.8);
    ctx.lineTo(1.5, 6.4);
    ctx.lineTo(1.2, 1.0);
    ctx.closePath();
    paint(ctx, tone(c, -0.12), edge(c), 0.6);
  } else if (sp.aventail) {
    ctx.beginPath();
    ctx.moveTo(-r - 0.3, -0.6);
    ctx.quadraticCurveTo(-r - 1.0, 3.0, -r - 0.3, 5.2);
    ctx.lineTo(1.6, 5.0);
    ctx.lineTo(1.0, 1.0);
    ctx.closePath();
    paint(ctx, sp.aventail, edge(sp.aventail), 0.6);
  } else {
    const c = sp.hair;
    ctx.beginPath();
    ctx.moveTo(-r - 0.3, -1.4);
    ctx.quadraticCurveTo(-r - 1.4, 3.0, -r - 0.8, 6.2);
    ctx.quadraticCurveTo(-1.6, 6.8, -0.2, 5.6);
    ctx.quadraticCurveTo(-0.4, 2.8, 0.4, 1.0);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -r - 1.4, 1, c, 0.2, -0.3, 2), edge(c), 0.6);
  }
  ctx.restore();
}

function drawHead(ctx, sp, R) {
  const z = R.z;
  // Cou
  const nk = R.neck;
  ctx.beginPath();
  capsule(ctx, nk[0], nk[1] + 0.8 * z, 1.25 * z, R.head[0] - 0.2 * z, R.head[1] + 1.8 * z, 1.2 * z);
  ctx.fillStyle = tone(sp.skin, -0.12);
  ctx.fill();

  headFrame(ctx, R);
  const r = BODY.headR;
  const lw = 0.65 / z;
  const skin = sp.skin;
  // Crâne et mâchoire
  ctx.beginPath();
  ell(ctx, 0, 0, r, r * 1.02);
  ell(ctx, 1.25, 1.35, 2.3, 1.95, 0.25);
  paint(ctx, ballGrad(ctx, 0.4, -0.3, r * 1.1, skin, 0.25, -0.22), edge(skin, 0.6), lw);
  // Oreille
  ctx.beginPath();
  ell(ctx, -0.45, 0.35, 0.8, 1.05);
  paint(ctx, tone(skin, -0.1), edge(skin, 0.6), lw * 0.8);
  // Nez
  ctx.beginPath();
  ell(ctx, 3.45, 0.45, 0.85, 0.72, 0.3);
  paint(ctx, tone(skin, 0.05), edge(skin, 0.5), lw * 0.8);
  // Œil et sourcil
  if (!sp.visor) {
    ctx.fillStyle = '#2a1c14';
    ctx.beginPath();
    ell(ctx, 1.95, -0.25, 0.44, 0.58);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ell(ctx, 2.15, -0.45, 0.16, 0.16);
    ctx.fill();
    line(ctx, 1.2, -1.25, 2.8, -1.15, rgba(tone(sp.brow || sp.hair, -0.35), 0.9), 0.5);
  }
  // Bouche
  line(ctx, 2.5, 2.35, 3.2, 2.2, rgba('#7a3a2a', 0.7), 0.35);
  // Joues rosées
  ctx.fillStyle = rgba('#e07860', 0.22);
  ctx.beginPath();
  ell(ctx, 1.7, 1.2, 0.9, 0.6);
  ctx.fill();

  if (sp.beard) {
    const c = sp.beard;
    ctx.beginPath();
    ctx.moveTo(-0.3, 0.9);
    ctx.quadraticCurveTo(-0.2, 3.9, 2.0, sp.longBeard ? 6.4 : 4.3);
    ctx.quadraticCurveTo(3.9, sp.longBeard ? 5.6 : 3.8, 3.8, 2.0);
    ctx.quadraticCurveTo(3.0, 1.6, 2.4, 2.1);
    ctx.quadraticCurveTo(1.2, 2.3, 0.7, 0.5);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -0.3, 3.9, c, 0.2, -0.25, 2), edge(c, 0.7), lw);
  }
  if (sp.moustache) {
    // Longue moustache tombante gauloise
    const c = sp.moustache;
    const ml = sp.moustacheLong ? 2.6 : 0;
    ctx.beginPath();
    ctx.moveTo(2.0, 1.25);
    ctx.quadraticCurveTo(3.1, 0.85, 3.95, 1.3);
    ctx.quadraticCurveTo(4.5, 2.6 + ml * 0.5, 3.6, 3.7 + ml);
    ctx.quadraticCurveTo(3.3, 2.3 + ml * 0.3, 2.6, 2.2);
    ctx.quadraticCurveTo(2.0, 2.5 + ml * 0.3, 1.2, 3.4 + ml);
    ctx.quadraticCurveTo(1.3, 2.0, 2.0, 1.25);
    paint(ctx, tone(c, 0.05), edge(c, 0.8), lw);
  }
  drawHair(ctx, sp, r, lw);
  if (sp.helmet && !(sp.hooks && sp.hooks.helmet && sp.hooks.helmet(ctx, sp, r, lw))) drawHelmet(ctx, sp, r, lw);
  if (sp.hood) drawHood(ctx, sp, r, lw);
  if (sp.hooks && sp.hooks.head) sp.hooks.head(ctx, sp, r, lw);
  ctx.restore();
}

function drawHair(ctx, sp, r, lw) {
  const st = sp.hairStyle;
  if (!st || st === 'none') return;
  const c = sp.hair;
  if (sp.helmet && st !== 'long' && st !== 'spiky') return;
  if (st === 'spiky') {
    // Cheveux hérissés, blanchis à la chaux (gésates)
    ctx.beginPath();
    const pts = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const a = PI * 0.95 + (i / n) * PI * 0.95;
      const rr = i % 2 === 0 ? r + 0.4 : r + 2.6;
      pts.push(Math.cos(a) * rr - 0.2, Math.sin(a) * rr - 0.3);
    }
    ctx.moveTo(-r * 0.95, 1.2);
    for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineTo(r * 0.75, -1.6);
    ctx.quadraticCurveTo(0.6, -1.9, -0.6, -0.6);
    ctx.quadraticCurveTo(-1.2, 0.6, -r * 0.95, 1.2);
    paint(ctx, sideGrad(ctx, -r - 2, r + 1, c, 0.3, -0.2, -2), edge(c, 0.8), lw);
    return;
  }
  if (st === 'swept') {
    // Cheveux gaulois chaulés (eau de chaux) : plaqués en arrière et relevés en crinière de mèches raides
    ctx.beginPath();
    ctx.moveTo(r * 0.72, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.3, -r - 0.9, -0.4, -r - 1.1);
    const tips = [[-1.4, -r - 3.4], [-3.4, -r - 3.0], [-5.2, -r - 1.8], [-6.3, -1.6], [-5.6, 0.6]];
    let px = -0.4;
    let py = -r - 1.1;
    for (const [tx, ty] of tips) {
      ctx.quadraticCurveTo((px + tx) / 2 + 0.6, (py + ty) / 2 - 0.5, tx, ty);
      ctx.lineTo((px + tx) / 2 + 0.6 - (tx < -4 ? 0.2 : 0), (py + ty) / 2 + 1.5);
      px = tx;
      py = ty;
    }
    ctx.quadraticCurveTo(-r - 0.6, 2.6, -r * 0.6, 2.3);
    ctx.quadraticCurveTo(-1.3, 0.8, -0.95, -0.5);
    ctx.quadraticCurveTo(-0.3, -1.5, 0.6, -1.8);
    ctx.quadraticCurveTo(r * 0.5, -1.4, r * 0.72, -r * 0.55);
    paint(ctx, sideGrad(ctx, -r - 6, r, c, 0.3, -0.2, -2), edge(c, 0.75), lw);
    ctx.strokeStyle = rgba(tone(c, -0.3), 0.55);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(1.0, -r);
    ctx.quadraticCurveTo(-2.5, -r - 1.5, -5.4, -r - 1.0);
    ctx.moveTo(0.4, -r + 1.0);
    ctx.quadraticCurveTo(-3, -r, -5.8, -1.6);
    ctx.stroke();
    return;
  }
  if (st === 'bowl') {
    // Coupe « au bol » franque : calotte lisse, frange droite au front, nuque dégagée et oreille visible
    ctx.beginPath();
    ctx.moveTo(-r * 0.74, 1.9);
    ctx.arc(0, -0.1, r + 0.55, PI * 0.8, PI * 1.9);
    ctx.lineTo(r * 0.78, -1.75);
    ctx.quadraticCurveTo(r * 0.2, -2.1, -0.4, -1.8);
    ctx.quadraticCurveTo(-0.9, -1.2, -1.15, 0.4);
    ctx.quadraticCurveTo(-1.3, 1.4, -r * 0.74, 1.9);
    paint(ctx, sideGrad(ctx, -r - 0.6, r, c, 0.3, -0.25, -2), edge(c, 0.75), lw);
    ctx.strokeStyle = rgba(tone(c, -0.35), 0.55);
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(-2.6, -2.6);
    ctx.quadraticCurveTo(-0.8, -3.6, 1.4, -3.2);
    ctx.moveTo(-3.3, -0.4);
    ctx.quadraticCurveTo(-2.6, -2.0, -1.2, -2.6);
    ctx.stroke();
    ctx.strokeStyle = rgba(tone(c, 0.5), 0.55);
    ctx.beginPath();
    ctx.moveTo(-1.2, -3.4);
    ctx.quadraticCurveTo(0.4, -4.0, 2.0, -3.2);
    ctx.stroke();
    return;
  }
  if (st === 'tonsure') {
    ctx.beginPath();
    ctx.moveTo(-r - 0.2, 1.6);
    ctx.quadraticCurveTo(-r - 0.6, -1.2, -r * 0.55, -r * 0.8);
    ctx.quadraticCurveTo(-0.6, -r * 0.55, -0.3, -0.3);
    ctx.quadraticCurveTo(-0.7, 1.0, -r - 0.2, 1.6);
    ctx.moveTo(r * 0.5, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.95, -r * 0.6, r * 0.98, -r * 0.35);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.45, r * 0.5, -r * 0.85);
    paint(ctx, c, edge(c, 0.7), lw);
    return;
  }
  // Coupe courte ou longue : calotte sur le haut et l'arrière du crâne
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, 2.4);
  ctx.arc(0, -0.1, r + 0.45, PI * 0.78, PI * 1.84);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.35, r * 0.2, -r * 0.62);
  ctx.quadraticCurveTo(-0.4, -1.4, -0.95, -0.5);
  ctx.quadraticCurveTo(-1.35, 0.8, -r * 0.62, 2.4);
  paint(ctx, sideGrad(ctx, -r - 0.5, r, c, 0.28, -0.25, -2), edge(c, 0.75), lw);
  // Mèches
  ctx.strokeStyle = rgba(tone(c, -0.35), 0.6);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-2.4, -2.4);
  ctx.quadraticCurveTo(-1.0, -3.2, 0.8, -3.3);
  ctx.moveTo(-3.2, -0.6);
  ctx.quadraticCurveTo(-2.6, -2.0, -1.4, -2.6);
  ctx.stroke();
  ctx.strokeStyle = rgba(tone(c, 0.5), 0.6);
  ctx.beginPath();
  ctx.moveTo(-1.8, -3.2);
  ctx.quadraticCurveTo(-0.6, -3.8, 1.0, -3.7);
  ctx.stroke();
}

function drawHood(ctx, sp, r, lw) {
  const c = sp.hood;
  ctx.beginPath();
  ctx.moveTo(1.2, 3.4);
  ctx.quadraticCurveTo(-0.6, 2.2, -0.4, -0.4);
  ctx.quadraticCurveTo(0.4, -2.3, 2.9, -2.4);
  ctx.quadraticCurveTo(3.8, -2.4, 3.9, -1.6);
  ctx.quadraticCurveTo(4.2, -4.6, 0.6, -r - 1.0);
  ctx.quadraticCurveTo(-2.6, -r - 1.4, -r - 2.6, -r + 0.2);
  ctx.quadraticCurveTo(-r - 1.2, -1.6, -r - 0.8, 1.4);
  ctx.quadraticCurveTo(-r - 0.4, 4.4, 1.2, 3.4);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -r - 2.6, 4, c, 0.25, -0.28, -1), edge(c, 0.75), lw);
  ctx.strokeStyle = rgba(tone(c, -0.45), 0.6);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(2.9, -2.4);
  ctx.quadraticCurveTo(0.2, -2.0, -0.2, 0.6);
  ctx.stroke();
}

function drawHelmet(ctx, sp, r, lw) {
  const h = sp.helmet;
  const c = h.c || G.IRON;
  const k = h.kind;
  if (k === 'conical' || k === 'crest') {
    // Casque conique franc (spangenhelm) à nasal
    ctx.beginPath();
    ctx.moveTo(-r - 0.5, 0.2);
    ctx.quadraticCurveTo(-r - 0.4, -r * 0.9, 0.1, -r - 2.4);
    ctx.quadraticCurveTo(r + 0.3, -r * 0.8, r + 0.45, -0.6);
    ctx.quadraticCurveTo(0, -1.2, -r - 0.5, 0.2);
    paint(ctx, ballGrad(ctx, -0.6, -2.2, r + 1.8, c, 0.4, -0.3), edge(c, 0.8), lw);
    // Montants et bandeau de bronze
    ctx.strokeStyle = h.band || G.BRONZE;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(0.1, -r - 2.2);
    ctx.quadraticCurveTo(0.2, -2.0, 0.3, -0.9);
    ctx.moveTo(-r - 0.45, -0.1);
    ctx.quadraticCurveTo(0, -1.4, r + 0.4, -0.75);
    ctx.stroke();
    // Nasal
    ctx.beginPath();
    poly(ctx, [r - 0.25, -1.1, r + 0.55, -1.0, r + 0.6, 1.3, r + 0.05, 1.3]);
    paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
    if (k === 'crest') {
      // Cimier de crin aux couleurs de l'équipe
      const cc = h.crest;
      ctx.beginPath();
      ctx.moveTo(0.4, -r - 2.2);
      ctx.quadraticCurveTo(-1.6, -r - 4.4, -4.6, -r - 2.4);
      ctx.quadraticCurveTo(-6.4, -r - 0.2, -5.6, 1.2);
      ctx.quadraticCurveTo(-4.4, -1.8, -2.4, -r - 1.0);
      ctx.quadraticCurveTo(-0.8, -r - 1.5, 0.4, -r - 2.2);
      paint(ctx, sideGrad(ctx, -6, 0.5, cc, 0.3, -0.25, -4), edge(cc, 0.8), lw);
    }
    return;
  }
  if (k === 'crown') {
    // Couronne d'or à fleurons sur cheveux longs (Clovis)
    const cc = h.c || G.GOLD;
    ctx.beginPath();
    ctx.moveTo(-r - 0.25, -1.0);
    ctx.lineTo(-r - 0.4, -r - 0.6);
    ctx.lineTo(-r * 0.55, -r * 0.25 - 1.7);
    ctx.lineTo(-r * 0.55 + 0.9, -r - 1.9);
    ctx.lineTo(-0.4, -r * 0.9 - 1.0);
    ctx.lineTo(0.7, -r - 2.7);
    ctx.lineTo(1.7, -r * 0.85 - 1.0);
    ctx.lineTo(2.6, -r - 1.7);
    ctx.lineTo(r - 0.1, -r * 0.55 - 1.0);
    ctx.lineTo(r + 0.15, -0.9);
    ctx.quadraticCurveTo(0.3, -0.05, -r - 0.25, -1.0);
    ctx.closePath();
    paint(ctx, ballGrad(ctx, -0.8, -r - 0.5, r + 1.4, cc, 0.5, -0.3), edge(cc, 0.85), lw);
    // Bandeau et pierres
    ctx.strokeStyle = tone(cc, -0.3);
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-r - 0.2, -1.9);
    ctx.quadraticCurveTo(0.3, -1.05, r + 0.1, -1.85);
    ctx.stroke();
    for (const [x, y, col] of [[-2.0, -2.15, '#d02a3a'], [0.4, -1.75, '#2a62c8'], [2.5, -2.05, '#d02a3a']]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ell(ctx, x, y, 0.5, 0.5);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0.55, -r - 2.4, 0.5, 0.5);
    return;
  }
  if (k === 'leather' || k === 'kettle') {
    const lc = k === 'leather' ? h.c || '#6e4a2c' : c;
    ctx.beginPath();
    ctx.moveTo(-r - 0.4, 0.4);
    ctx.arc(0, -0.2, r + 0.45, PI * 0.95, PI * 1.93);
    ctx.quadraticCurveTo(0.4, -1.2, -r - 0.4, 0.4);
    paint(ctx, ballGrad(ctx, -0.6, -2, r + 1, lc, 0.35, -0.3), edge(lc, 0.8), lw);
    if (k === 'kettle') {
      ctx.beginPath();
      ell(ctx, 0.2, -1.0, r + 2.0, 1.0, 0.1);
      paint(ctx, tone(lc, -0.08), edge(lc, 0.8), lw);
    } else {
      line(ctx, -r * 0.2, -r - 0.2, 0.2, -1.0, rgba(tone(lc, -0.5), 0.8), 0.4);
    }
    return;
  }
  // Casques gaulois : calotte ronde (bronze ou fer), bouton sommital, couvre-nuque, paragnathides.
  // coolus : calotte hémisphérique lisse, visière et large couvre-nuque ; montefortino : haut bouton central et
  // couvre-nuque plat ; agen : calotte de fer à bandeau décoré, paragnathides et cimier de crin facultatif.
  const flat = k === 'coolus';
  // Couvre-nuque évasé (derrière la calotte)
  ctx.beginPath();
  ctx.moveTo(-r - 0.3, -0.6);
  ctx.quadraticCurveTo(-r - 2.3, 0.3, -r - 2.6, 2.2);
  ctx.quadraticCurveTo(-r - 0.9, 1.9, -r * 0.4, 0.7);
  ctx.closePath();
  paint(ctx, tone(c, -0.18), edge(c, 0.8), lw * 0.8);
  ctx.beginPath();
  ctx.moveTo(-r - 0.6, 0.3);
  ctx.arc(0, -0.25, r + 0.55, PI * 0.97, PI * 1.94);
  ctx.quadraticCurveTo(0.4, -1.3, -r - 0.6, 0.3);
  paint(ctx, ballGrad(ctx, -0.8, -2.3, r + 1.4, c, 0.5, -0.32), edge(c, 0.8), lw);
  // Reflet de calotte
  ctx.strokeStyle = rgba('#fffbe8', 0.55);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.45);
  ctx.quadraticCurveTo(-r * 0.4, -r - 0.25, 0.5, -r - 0.2);
  ctx.stroke();
  // Rebord / bandeau
  ctx.beginPath();
  ctx.moveTo(-r - 1.3, 0.8);
  ctx.quadraticCurveTo(0.2, -1.0, r + 0.7, -0.8);
  ctx.strokeStyle = tone(c, -0.3);
  ctx.lineWidth = flat ? 1.15 : 0.9;
  ctx.stroke();
  if (k === 'agen') {
    // Bandeau décoré de clous d'or
    ctx.fillStyle = h.stud || G.GOLD;
    for (const t of [0.1, 0.27, 0.44, 0.61, 0.78, 0.92]) {
      const x = -r - 1.0 + t * (2 * r + 1.6);
      ctx.beginPath();
      ell(ctx, x, 0.05 - Math.sin(t * PI) * 0.72, 0.28, 0.28);
      ctx.fill();
    }
  }
  if (h.crest && (k === 'agen' || k === 'coolus' || k === 'montefortino')) {
    // Cimier de crin (aux couleurs de l'équipe ou rouge) en arc de la nuque au front
    const cc = h.crest;
    ctx.beginPath();
    ctx.moveTo(-r - 0.4, -1.3);
    ctx.bezierCurveTo(-r - 1.4, -r - 2.6, -2.2, -r - 4.2, 0.6, -r - 3.6);
    ctx.bezierCurveTo(r * 0.7, -r - 3.2, r + 0.4, -r, r + 0.3, -1.2);
    ctx.quadraticCurveTo(r * 0.5, -r - 0.9, 0, -r - 1.1);
    ctx.quadraticCurveTo(-r * 0.6, -r - 0.8, -r - 0.4, -1.3);
    paint(ctx, sideGrad(ctx, -r - 1.5, r + 0.4, cc, 0.3, -0.25, -r - 2), edge(cc, 0.8), lw);
    ctx.strokeStyle = rgba(tone(cc, -0.4), 0.55);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -r + i * 1.4;
      ctx.moveTo(x, -r - 1.0 - Math.sin(((i + 0.5) / 6) * PI) * 1.0);
      ctx.lineTo(x - 0.25, -r - 3.0 - Math.sin(((i + 0.5) / 6) * PI) * 0.7);
    }
    ctx.stroke();
  }
  // Bouton / cimier central
  if (k === 'montefortino') {
    ctx.beginPath();
    poly(ctx, [-1.5, -r - 0.3, -1.0, -r - 1.9, 0.0, -r - 2.4, 0.5, -r - 0.9]);
    paint(ctx, ballGrad(ctx, -0.5, -r - 1.5, 1.4, c, 0.5, -0.25), edge(c, 0.8), lw);
  } else if (!h.crest) {
    ctx.beginPath();
    ell(ctx, -0.5, -r - 0.95, flat ? 0.55 : 0.75, flat ? 0.5 : 0.7);
    paint(ctx, tone(c, 0.15), edge(c, 0.8), lw);
  }
  if (flat) {
    // Petite visière (bord relevé au-dessus du front)
    ctx.beginPath();
    ctx.moveTo(r - 0.6, -1.25);
    ctx.quadraticCurveTo(r + 1.1, -1.35, r + 1.4, -0.3);
    ctx.quadraticCurveTo(r + 0.4, -0.75, r - 0.9, -0.5);
    ctx.closePath();
    paint(ctx, tone(c, 0.06), edge(c, 0.8), lw * 0.8);
  }
  if (k === 'agen' || k === 'winged' || k === 'montefortino') {
    // Paragnathide (protège-joue)
    ctx.beginPath();
    poly(ctx, [-0.2, -0.6, 1.4, -0.4, 1.3, 2.6, 0.1, 3.0]);
    paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  }
  if (k === 'winged') {
    // Ailes argentées : une en arrière, une au-delà du crâne
    const wc = h.wing || '#f0ece0';
    const wing = (sx, sy, dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + dx * 0.3, sy + dy * 1.1, sx + dx, sy + dy);
      ctx.lineTo(sx + dx * 0.78, sy + dy * 0.72);
      ctx.lineTo(sx + dx * 0.92, sy + dy * 0.55);
      ctx.lineTo(sx + dx * 0.66, sy + dy * 0.4);
      ctx.lineTo(sx + dx * 0.76, sy + dy * 0.22);
      ctx.quadraticCurveTo(sx + dx * 0.4, sy + dy * 0.1, sx, sy + 1.2);
      ctx.closePath();
      paint(ctx, vGrad(ctx, sy + dy, sy, wc, 0.2, -0.2), edge('#8a8478', 0.8), lw);
    };
    wing(-1.6, -r + 0.6, -4.0, -4.6);
    wing(1.6, -r + 0.2, 1.8, -4.8);
  }
}

// ---------------------------------------------------------------------------
// Armes et objets tenus
// ---------------------------------------------------------------------------

function drawWeapon(ctx, sp, R, P, which) {
  const z = R.z;
  const [x, y] = R.handN;
  const a = P.wA;
  switch (which) {
    case 'sword':
      G.sword(ctx, x, y, a, z, { len: sp.swordLen || 8, hilt: sp.hilt });
      break;
    case 'longsword':
      G.sword(ctx, x, y, a, z, { len: 9.5, w: 1.25, hilt: sp.hilt });
      break;
    case 'seax':
      G.seax(ctx, x, y, a, z);
      break;
    case 'scramasax':
      // Scramasaxe : long coutelas franc à un tranchant, lame large et pommeau simple
      G.seax(ctx, x, y, a, z, 8.6);
      break;
    case 'angon':
      G.angon(ctx, x, y, a, z, { fwd: sp.spearFwd || 10, back: sp.spearBack || 7 });
      break;
    case 'spear':
      G.spear(ctx, x, y, a, z, { fwd: sp.spearFwd || 11, back: sp.spearBack || 8 });
      break;
    case 'javelin':
      G.spear(ctx, x, y, a, z, { fwd: 8, back: 5, head: 2.6, hw: 0.8, w: 0.7 });
      break;
    case 'axe':
      G.axe(ctx, x, y, a, z, { len: 7.5 });
      break;
    case 'waraxe':
      G.axe(ctx, x, y, a, z, { len: 8, big: 1.15, head: '#a9b0b8' });
      break;
    case 'francisca':
      G.francisca(ctx, x, y, a, z);
      break;
    case 'pickaxe':
      G.pickaxe(ctx, x, y, a, z);
      break;
    case 'hoe':
      G.hoe(ctx, x, y, a, z);
      break;
    case 'hammer':
      G.hammer(ctx, x, y, a, z);
      break;
    case 'knife':
      G.knife(ctx, x, y, a, z);
      break;
    case 'club':
      G.club(ctx, x, y, a, z);
      break;
    case 'crossStaff':
      G.crossStaff(ctx, x, y, a, z);
      break;
    case 'druidStaff':
      G.druidStaff(ctx, x, y, a, z);
      break;
    case 'sickle':
      G.sickle(ctx, x, y, a, z);
      break;
    case 'lance':
      G.lance(ctx, x, y, a, z, sp.pennant || sp.tunic, P.cape * 1.5);
      break;
    default:
      break;
  }
}

/**
 * Dessine un personnage complet. sp = costume, P = pose (champs de POSE0), opt = options du moment :
 * { weapon, carry, basket } (arme de la main proche, charge portée, panier au bras lointain).
 */
export function drawHuman(ctx, sp, P, opt = {}) {
  const R = rig(sp, P);
  const z = R.z;
  const weapon = opt.weapon === undefined ? sp.weapon : opt.weapon;
  const carry = opt.carry || null;
  const ranged = weapon === 'bow' || weapon === 'crossbow';

  // 1. Derrière le corps : cape, carquois, cheveux longs, sac d'or sur l'épaule
  if (sp.cape) drawCape(ctx, sp, R, P);
  if (sp.back === 'quiver') {
    const [qx, qy] = rot(-2.6 * z, -5.2 * z, P.lean);
    G.quiver(ctx, R.hx + qx, R.hy + qy + R.lift, z);
  }
  if (sp.back === 'shield') {
    const [qx, qy] = rot(-3.0 * z, -4.6 * z, P.lean);
    G.shield(ctx, R.hx + qx, R.hy + qy + R.lift, z, 'round', sp.shieldFace, 0.8, -0.25);
  }
  if (carry === 'gold') {
    const [qx, qy] = rot(-3.4 * z, -7.2 * z, P.lean);
    G.loadGold(ctx, R.hx + qx, R.hy + qy + R.lift, z);
  }
  if (sp.hooks && sp.hooks.back) sp.hooks.back(ctx, sp, R, P);
  drawBackHair(ctx, sp, R);
  // Objet de dos propre à un costume (ex. tonnelet du sapeur) : sp.backItem(ctx, R, P, z)
  if (sp.backItem) sp.backItem(ctx, R, P, z);

  // 2. Bras lointain (derrière le torse)
  drawArm(ctx, sp, R.shF, R.elF, R.handF, true);

  // 3. Jambes (à cheval, la jambe lointaine est cachée par la monture)
  if (!sp.robe) {
    if (!opt.mounted) drawLeg(ctx, sp, R.hipF, R.kneeF, R.ankF, P.fS, true);
    drawLeg(ctx, sp, R.hipN, R.kneeN, R.ankN, P.nS, false);
  } else {
    // Sous la robe, seuls les pieds dépassent
    for (const [ank, s, far] of [[R.ankF, P.fS, true], [R.ankN, P.nS, false]]) {
      const fr = clamp(-s * 0.6, -0.6, 1.2);
      const [fx, fy] = rot(1.0 * z, 0.35 * z, fr);
      ctx.beginPath();
      ell(ctx, ank[0] + fx, ank[1] + fy, 1.75 * z, 0.95 * z, fr);
      const sc = tone(sp.shoes, far ? -0.22 : 0);
      paint(ctx, sc, edge(sc, 0.7), 0.6);
    }
  }

  // 4. Jupe de tunique (ou de robe), puis torse
  if (sp.robe) drawSkirt(ctx, sp, R, P, sp.robe, sp.hem || 10.6, false, sp.stole);
  else if (sp.hem) drawSkirt(ctx, sp, R, P, sp.tunic, sp.hem, false, sp.trim2);
  if (sp.mail && sp.mail.hem) drawSkirt(ctx, sp, R, P, sp.mail.c, sp.mail.hem, true);
  if (sp.loin) drawSkirt(ctx, sp, R, P, sp.loin, 2.6, false);
  drawTorso(ctx, sp, R, P);

  // 5. Tête
  drawHead(ctx, sp, R);

  // 6. Devant, côté lointain : bouclier, arc, panier, pierre
  if (sp.shield && !opt.noShield) {
    const ex = R.elF[0] + (R.handF[0] - R.elF[0]) * 0.55 + 0.6 * z;
    const ey = R.elF[1] + (R.handF[1] - R.elF[1]) * 0.55;
    if (sp.hooks && sp.hooks.shield && sp.hooks.shield(ctx, sp, ex, ey, z, P)) { /* bouclier d'extension dessiné */ } else G.shield(ctx, ex, ey, z, sp.shield.kind, sp.shield.face, sp.shield.s || 1, sp.shield.tilt || 0, sp.shield.deco);
  }
  if (weapon === 'bow') {
    let pull = null;
    if (P.pull > 0.01 && P.shot < 0.5) pull = R.handN;
    G.bow(ctx, R.handF[0], R.handF[1], P.aim, z, pull, P.pull > 0.01 && P.shot < 0.5);
  }
  if (opt.basket) G.loadFood(ctx, R.handF[0] + 0.8 * z, R.handF[1] - 0.6 * z, z * 0.85);
  if (carry === 'stone') G.loadStone(ctx, (R.handN[0] + R.handF[0]) / 2 + 0.4 * z, (R.handN[1] + R.handF[1]) / 2 - 1.2 * z, z);
  if (carry === 'food') G.loadFood(ctx, R.handF[0] + 0.6 * z, R.handF[1] - 1.4 * z, z);
  if (carry === 'wood') {
    const [qx, qy] = rot(-0.6 * z, -9.9 * z, P.lean);
    G.loadWood(ctx, R.hx + qx, R.hy + qy + R.lift, z);
  }

  if (sp.hooks && sp.hooks.front) sp.hooks.front(ctx, sp, R, P);

  // 7. Arme et bras proche
  if (sp.hooks && sp.hooks.weapon && sp.hooks.weapon(ctx, sp, R, P, weapon)) {
    // arme d'extension dessinée par le costume
  } else if (weapon === 'crossbow') {
    G.crossbow(ctx, R.handN[0], R.handN[1], P.aim, z, P.shot < 0.5, P.shot > 0.5 ? 0.6 * (1 - P.pull) : 0);
  } else if (!ranged && weapon && !(P.shot > 0.5)) {
    drawWeapon(ctx, sp, R, P, weapon);
  }
  drawArm(ctx, sp, R.shN, R.elN, R.handN, false);
  return R;
}
