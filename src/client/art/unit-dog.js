// Molosse : chien de guerre gaulois (grand chien de meute au collier cloûté et au caparaçon aux couleurs de l'équipe).
// Genre `dog` : dessin d'une image d'animation (attente, trot, bond-morsure, effondrement) vue de profil, regard vers +x,
// pattes au sol (y = 0). Les coordonnées du corps sont exprimées autour de son centre, puis mises à l'échelle (S.z).
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, seg, rot, sideGrad, ballGrad } from './unit-kit.js';
import { BRONZE } from './unit-gear.js';

const L1F = 4.0; // bras (antérieur)
const L2F = 4.3; // avant-bras + patte
const L1H = 4.4; // cuisse
const L2H = 4.0; // jambe + patte
const SH = [5.0, 1.6]; // épaule
const HP = [-6.6, 1.5]; // hanche

export function dogSpec(tm) {
  return {
    kind: 'dog',
    type: 'molosse',
    hold: 'bite',
    box: [-24, -30, 30, 6],
    dog: { z: 1.0, coat: '#8d7a62', saddle: '#574838', belly: '#cbbd9f', muzzle: '#3b2f27', paws: '#b9a886', team: tm },
  };
}

/** Pose neutre : angles des pattes (convention des membres, 0 = vers le bas), tête, mâchoire, queue. */
function pose0() {
  return {
    fnA: 0.05, fnB: 0.0, ffA: 0.1, ffB: 0.02, hnA: -0.25, hnB: 0.3, hfA: -0.2, hfB: 0.32,
    tx: 0, by: 0, pitch: 0, neck: 0, head: 0, jaw: 0.05, tail: 0, tailUp: 0, flat: 1, tongue: 0, lift: 0, eyeShut: 0, byFix: null, bob: 0,
  };
}

function trot(p) {
  const leg = (q, fore) => {
    const th = 0.62 * Math.sin(q * TAU);
    const l = Math.max(0, Math.cos(q * TAU + 0.45));
    if (fore) return [th, th - 1.2 * l * l];
    return [-0.24 + th * 0.85, 0.3 + th * 0.4 - 0.25 - 1.1 * l * l + 0.25];
  };
  const [fnA, fnB] = leg(p, true);
  const [hfA, hfB] = leg(p, false);
  const [ffA, ffB] = leg(p + 0.5, true);
  const [hnA, hnB] = leg(p + 0.5, false);
  return { ...pose0(), fnA, fnB, ffA, ffB, hnA, hnB, hfA, hfB, bob: Math.abs(Math.sin(p * TAU * 2)) * 0.9, pitch: 0.025 * Math.sin(p * TAU * 2), neck: 0.05 * Math.sin(p * TAU * 2 + 1), tail: 0.5 * Math.sin(p * TAU * 2), tailUp: 0.3, jaw: 0.12 + 0.05 * Math.sin(p * TAU * 2), tongue: 0.6 };
}

function idle(p) {
  const b = Math.sin(p * TAU);
  return { ...pose0(), by: 0.15 * b, neck: 0.12 + 0.08 * Math.max(0, Math.sin(p * TAU * 2)), head: 0.08 * Math.sin(p * TAU * 2 + 0.6), tail: 0.7 * Math.sin(p * TAU * 3), tailUp: 0.15, jaw: 0.05, pitch: -0.01 * b };
}

/** Bond et morsure (q = 0..1) : on s'accroupit, on saute gueule ouverte, on referme les crocs, on recule. */
function attack(q) {
  const c = smooth(clamp(q / 0.3));
  let tx = -2.4 * c;
  let lift = 0;
  let jaw = 0.1 + 0.3 * c;
  let pitch = 0.16 * c;
  let neck = 0.2 * c;
  let L = { fnA: 0.05 + 0.5 * c, fnB: -0.2 * c, ffA: 0.1 + 0.6 * c, ffB: 0.0, hnA: -0.25 - 0.45 * c, hnB: 0.3 + 0.55 * c, hfA: -0.2 - 0.45 * c, hfB: 0.32 + 0.6 * c };
  if (q >= 0.3 && q < 0.72) {
    const s = smooth(clamp((q - 0.3) / 0.22));
    tx = lerp(-2.4, 8.5, s);
    lift = Math.sin(clamp((q - 0.3) / 0.36, 0, 1) * PI) * 4.4;
    const w = smooth(clamp((q - 0.3) / 0.14));
    L = { fnA: lerp(0.55, 1.35, w), fnB: lerp(-0.2, 1.05, w), ffA: lerp(0.7, 1.5, w), ffB: lerp(0, 1.1, w), hnA: lerp(-0.7, -1.15, w), hnB: lerp(0.85, -0.5, w), hfA: lerp(-0.65, -1.05, w), hfB: lerp(0.9, -0.3, w) };
    jaw = q < 0.54 ? lerp(0.4, 1.0, smooth(clamp((q - 0.3) / 0.2))) : lerp(1.0, 0.03, smooth(clamp((q - 0.54) / 0.06)));
    pitch = lerp(0.16, -0.18, w) + (q > 0.54 ? 0.3 * smooth(clamp((q - 0.54) / 0.08)) : 0);
    neck = lerp(0.2, -0.15, w) + (q > 0.54 ? 0.3 * smooth(clamp((q - 0.54) / 0.08)) : 0);
  } else if (q >= 0.72) {
    const r = smooth(clamp((q - 0.72) / 0.28));
    tx = lerp(8.5, 0, r);
    lift = 0;
    const l0 = { fnA: 0.5, fnB: 0.3, ffA: 0.6, ffB: 0.3, hnA: -0.4, hnB: 0.4, hfA: -0.4, hfB: 0.4 };
    L = { fnA: lerp(l0.fnA, 0.05, r), fnB: lerp(l0.fnB, 0, r), ffA: lerp(l0.ffA, 0.1, r), ffB: lerp(l0.ffB, 0.02, r), hnA: lerp(l0.hnA, -0.25, r), hnB: lerp(l0.hnB, 0.3, r), hfA: lerp(l0.hfA, -0.2, r), hfB: lerp(l0.hfB, 0.32, r) };
    jaw = lerp(0.3, 0.05, r);
    pitch = lerp(0.12, 0, r);
    neck = lerp(0.3, 0.1, r);
  }
  return { ...pose0(), ...L, tx, lift, jaw, pitch, neck, tail: 0.3, tailUp: 0.5, tongue: jaw > 0.5 ? 1 : 0.3, byFix: null };
}

/** Le chien s'écroule sur le flanc, langue pendante. */
function die(q) {
  const f = smooth(clamp(q / 0.8));
  return {
    ...pose0(),
    fnA: lerp(0.05, 1.05, f), fnB: lerp(0, 0.6, f), ffA: lerp(0.1, 0.75, f), ffB: lerp(0, 0.5, f),
    hnA: lerp(-0.25, -1.1, f), hnB: lerp(0.3, -0.3, f), hfA: lerp(-0.2, -0.8, f), hfB: lerp(0.3, -0.1, f),
    neck: lerp(0.1, 0.95, f), head: lerp(0, 0.4, f), jaw: lerp(0.05, 0.5, f), tongue: f, eyeShut: f,
    tail: -0.3 * f, tailUp: -0.4 * f, flat: 1 - 0.3 * f, byFix: lerp(0, 3.4, f), tx: -3 * f, pitch: -0.05 * f,
  };
}

function poseOf(fr) {
  if (fr.anim === 1) return trot(fr.q);
  if (fr.anim === 3) return attack(fr.q);
  if (fr.anim === 4) return die(fr.q);
  return idle(fr.q);
}

function pawPath(ctx, x, y, ang) {
  ctx.beginPath();
  ell(ctx, x + 0.7, y + 0.35, 1.6, 0.95, clamp(-ang * 0.4, -0.5, 0.7));
}

function drawLeg(ctx, D, jx, jy, a1, a2, L1, L2, fore, far, pitch) {
  const dk = far ? -0.3 : 0;
  const coat = tone(D.coat, dk);
  const [kx, ky] = seg(jx, jy, a1 - pitch, L1);
  const [fx, fy] = seg(kx, ky, a2 - pitch, L2);
  ctx.beginPath();
  capsule(ctx, jx, jy, fore ? 2.2 : 2.6, kx, ky, 1.15);
  capsule(ctx, kx, ky, 1.15, fx, fy, 0.85);
  paint(ctx, sideGrad(ctx, jx - 3, jx + 3, coat, 0.2, -0.22), edge(coat, 0.65), 0.6);
  // patte claire
  const p = tone(D.paws, dk);
  ctx.beginPath();
  capsule(ctx, kx + (fx - kx) * 0.55, ky + (fy - ky) * 0.55, 0.9, fx, fy, 0.86);
  paint(ctx, p, edge(p, 0.5), 0.4);
  pawPath(ctx, fx, fy, a2);
  paint(ctx, tone(p, 0.05), edge(p, 0.7), 0.5);
  line(ctx, fx + 0.9, fy + 0.6, fx + 1.3, fy + 0.1, rgba('#3a2a1c', 0.5), 0.3);
}

function bodyPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(9.6, 1.0);
  ctx.bezierCurveTo(9.8, -2.6, 8.0, -4.8, 5.0, -5.1);
  ctx.bezierCurveTo(1.0, -5.4, -4.0, -5.0, -8.0, -4.4);
  ctx.bezierCurveTo(-11.2, -3.8, -11.8, 0.6, -10.4, 2.0);
  ctx.bezierCurveTo(-8.0, 3.6, -4.0, 3.0, -1.0, 3.8);
  ctx.bezierCurveTo(2.0, 6.0, 7.0, 6.2, 9.0, 3.6);
  ctx.closePath();
}

function drawHead(ctx, D, P, tm) {
  const coat = D.coat;
  const dim = P.eyeShut > 0.5;
  // mâchoire basse (derrière le museau)
  ctx.save();
  ctx.translate(1.2, 1.8);
  ctx.rotate(P.jaw * 0.62);
  ctx.beginPath();
  capsule(ctx, 0.2, 0.3, 1.4, 4.2, 1.0, 1.05);
  paint(ctx, tone(D.muzzle, 0.06), edge(D.muzzle, 0.7), 0.5);
  if (P.jaw > 0.25) {
    // langue et crocs du bas
    ctx.beginPath();
    ell(ctx, 2.4 + P.tongue * 0.6, 0.2 + P.jaw * 0.3, 1.7 + P.tongue * 0.6, 0.6, 0.1);
    paint(ctx, '#d4566a', rgba('#6a1c2a', 0.7), 0.3);
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    poly(ctx, [4.3, 0.2, 4.7, -1.5, 5.1, 0.2]);
    poly(ctx, [2.6, 0.1, 2.9, -0.9, 3.3, 0.1]);
    ctx.fill();
  } else if (P.tongue > 0.3) {
    ctx.beginPath();
    ell(ctx, 3.2, 0.9 + P.jaw, 1.3, 0.45, 0.15);
    paint(ctx, '#d4566a', null);
  }
  ctx.restore();
  // crâne et museau
  ctx.beginPath();
  ell(ctx, 0, 0, 3.7, 3.3);
  capsule(ctx, 1.6, 0.9, 2.5, 5.0, 1.45, 1.9);
  paint(ctx, ballGrad(ctx, 1.4, -1.4, 5.4, coat, 0.26, -0.26), edge(coat, 0.65), 0.6);
  // masque sombre
  ctx.beginPath();
  capsule(ctx, 2.6, 1.2, 2.1, 5.2, 1.5, 1.75);
  paint(ctx, D.muzzle, null);
  ctx.beginPath();
  ell(ctx, 6.3, 1.0, 1.1, 1.0);
  paint(ctx, '#15100c', null);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(5.8, 0.4, 0.6, 0.35);
  // babine et croc du haut
  if (P.jaw > 0.25) {
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    poly(ctx, [4.2, 2.4, 4.6, 4.0, 5.0, 2.4]);
    poly(ctx, [2.9, 2.5, 3.2, 3.5, 3.6, 2.5]);
    ctx.fill();
  }
  line(ctx, 2.8, 2.7, 5.6, 2.5, rgba('#1a120c', 0.6), 0.35);
  // œil, sourcil froncé
  if (dim) {
    line(ctx, 1.6, -0.7, 2.6, -0.4, '#1a120c', 0.45);
  } else {
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ell(ctx, 2.4, -0.45, 0.6, 0.55);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(2.35, -0.85, 0.3, 0.3);
    line(ctx, 1.2, -1.7, 3.6, -0.95, rgba(tone(D.saddle, -0.3), 0.95), 0.6);
  }
  // oreille rognée rabattue
  ctx.beginPath();
  ctx.moveTo(-0.9, -2.8);
  ctx.quadraticCurveTo(-2.4, -4.6, -0.6, -4.6);
  ctx.quadraticCurveTo(1.0, -4.2, 1.6, -2.4);
  ctx.closePath();
  paint(ctx, tone(D.saddle, 0.08), edge(D.saddle, 0.8), 0.45);
}

function collar(ctx, D) {
  const tm = D.team;
  // cou : ruban de cuir aux couleurs de l'équipe, clous de bronze
  ctx.save();
  ctx.translate(9.3, -2.8);
  ctx.rotate(0.35);
  ctx.beginPath();
  poly(ctx, [-1.3, -3.4, 1.5, -3.4, 1.6, 3.2, -1.1, 3.4]);
  paint(ctx, sideGrad(ctx, -1.3, 1.6, tm.main, 0.25, -0.25), edge(tm.main, 0.8), 0.45);
  ctx.fillStyle = BRONZE;
  for (const y of [-2.2, -0.6, 1.0, 2.5]) {
    ctx.beginPath();
    poly(ctx, [0.0, y - 0.7, 1.9, y, 0.0, y + 0.7]);
    ctx.fill();
  }
  ctx.restore();
}

function blanket(ctx, D) {
  const tm = D.team;
  ctx.beginPath();
  ctx.moveTo(4.6, -5.2);
  ctx.quadraticCurveTo(5.4, -1.0, 4.4, 1.6);
  ctx.lineTo(-5.2, 1.9);
  ctx.lineTo(-5.0, 0.6);
  ctx.lineTo(-5.8, 0.2);
  ctx.quadraticCurveTo(-5.6, -3.0, -5.8, -4.8);
  ctx.quadraticCurveTo(-0.6, -5.6, 4.6, -5.2);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -6, 5.4, tm.main, 0.22, -0.3), edge(tm.main, 0.8), 0.55);
  ctx.strokeStyle = tone(tm.light, 0.1);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-5.4, 1.2);
  ctx.lineTo(4.3, 1.1);
  ctx.stroke();
  ctx.fillStyle = BRONZE;
  ctx.beginPath();
  ell(ctx, -0.6, -2.0, 0.85, 0.85);
  ctx.fill();
}

export const DOG = {
  draw(ctx, S, fr) {
    const D = S.dog;
    const P = poseOf(fr);
    const z = D.z * 0.86;
    // sol : la patte la plus basse touche y = 0
    const feet = [
      [SH, P.fnA, P.fnB, L1F, L2F],
      [SH, P.ffA, P.ffB, L1F, L2F],
      [HP, P.hnA, P.hnB, L1H, L2H],
      [HP, P.hfA, P.hfB, L1H, L2H],
    ];
    let low = -99;
    for (const [j, a1, a2, L1, L2] of feet) {
      const k = seg(j[0], j[1], a1 - P.pitch, L1);
      const f = seg(k[0], k[1], a2 - P.pitch, L2);
      const [, ry] = rot(f[0], f[1] + 1.0, P.pitch);
      if (ry > low) low = ry;
    }
    ctx.save();
    ctx.scale(z, z);
    ctx.translate(P.tx, 0);
    if (P.flat < 1) ctx.scale(1, P.flat);
    ctx.translate(0, -low - P.lift - P.bob + P.by + (P.byFix || 0));
    ctx.save();
    ctx.rotate(P.pitch);
    // pattes lointaines
    drawLeg(ctx, D, SH[0] + 1.6, SH[1] - 0.4, P.ffA, P.ffB, L1F, L2F, true, true, P.pitch);
    drawLeg(ctx, D, HP[0] + 1.6, HP[1] - 0.4, P.hfA, P.hfB, L1H, L2H, false, true, P.pitch);
    // queue
    ctx.save();
    ctx.translate(-10.4, -2.6);
    ctx.rotate(PI + 0.55 + P.tailUp * 0.35 + P.tail * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.quadraticCurveTo(5.0, 1.8 + P.tail, 9.0, -1.0 - P.tail * 2.0);
    ctx.quadraticCurveTo(5.0, -0.5 + P.tail, 0, -1.5);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, 0, 9.6, D.coat, 0.15, -0.25), edge(D.coat, 0.65), 0.55);
    ctx.restore();
    // corps
    bodyPath(ctx);
    paint(ctx, ballGrad(ctx, -1.5, -2.4, 12, D.coat, 0.2, -0.3), edge(D.coat, 0.7), 0.7);
    // dos sombre (selle) et ventre clair
    bodyPath(ctx);
    const g = ctx.createLinearGradient(0, -5.4, 0, 6.2);
    g.addColorStop(0, rgba(D.saddle, 0.85));
    g.addColorStop(0.42, rgba(D.saddle, 0));
    g.addColorStop(0.74, rgba(D.belly, 0));
    g.addColorStop(1, rgba(D.belly, 0.75));
    ctx.fillStyle = g;
    ctx.fill();
    // poil bringé
    ctx.strokeStyle = rgba(D.saddle, 0.45);
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    for (const [x, y] of [[-7.5, -3.2], [-5.4, -3.8], [-2.8, -4.0], [0.2, -4.2], [3.0, -4.0], [-6.4, -0.6], [-3.4, -1.4]]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.5, y + 1.7);
    }
    ctx.stroke();
    // cuisse marquée
    ctx.strokeStyle = rgba(tone(D.coat, -0.5), 0.45);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-7.8, -2.6);
    ctx.quadraticCurveTo(-5.0, 0.4, -6.6, 3.0);
    ctx.stroke();
    blanket(ctx, D);
    // encolure
    ctx.save();
    ctx.translate(7.2, -2.6);
    ctx.rotate(-0.7 + P.neck * 0.8);
    ctx.beginPath();
    capsule(ctx, 0, 0, 3.3, 5.4, 0, 2.7);
    paint(ctx, ballGrad(ctx, 2.5, -2.0, 6, D.coat, 0.22, -0.26), edge(D.coat, 0.65), 0.6);
    ctx.beginPath();
    capsule(ctx, 0.6, -1.4, 2.0, 4.6, -1.3, 1.7);
    ctx.fillStyle = rgba(D.saddle, 0.45);
    ctx.fill();
    // collier cloûté
    ctx.save();
    ctx.translate(1.6, 0);
    ctx.rotate(0.0);
    ctx.beginPath();
    poly(ctx, [-0.9, -3.3, 1.5, -3.2, 1.6, 3.3, -0.8, 3.4]);
    paint(ctx, sideGrad(ctx, -0.9, 1.6, D.team.main, 0.25, -0.25), edge(D.team.main, 0.8), 0.45);
    ctx.fillStyle = BRONZE;
    for (const y of [-2.3, -0.7, 0.9, 2.4]) {
      ctx.beginPath();
      poly(ctx, [0.2, y - 0.65, 2.2, y, 0.2, y + 0.65]);
      ctx.fill();
    }
    ctx.restore();
    // tête
    ctx.translate(5.4, -0.2);
    ctx.rotate(0.7 - P.neck * 0.8 + P.head + P.pitch * 0.3);
    drawHead(ctx, D, P, D.team);
    ctx.restore();
    // pattes proches
    drawLeg(ctx, D, SH[0], SH[1], P.fnA, P.fnB, L1F, L2F, true, false, P.pitch);
    drawLeg(ctx, D, HP[0], HP[1], P.hnA, P.hnB, L1H, L2H, false, false, P.pitch);
    ctx.restore();
    ctx.restore();
  },
  shadow(S, fr, m) {
    const f = fr.anim === 4 ? smooth(clamp((fr.q - 0.1) / 0.6)) : 0;
    const off = fr.anim === 3 ? 7 * Math.sin(clamp((fr.q - 0.3) / 0.25, 0, 1) * PI * 0.5) * (fr.q < 0.72 ? 1 : 1 - (fr.q - 0.72) / 0.28) : 0;
    return { cx: 1 + off, cy: 1, rx: lerp(m.w + 3, 14, f), ry: lerp(4.0, 4.6, f), a: 0.3 };
  },
};
