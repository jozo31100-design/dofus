// Cheval vu de profil (tourné de trois-quarts), regardant vers +x, sabots au sol (y = 0).
// Robes, crinière, selle ou caparaçon aux couleurs de l'équipe ; galop paramétré par une phase.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, seg, rot, sideGrad, vGrad, ballGrad, light } from './unit-kit.js';

/** Pose neutre du cheval. Angles des pattes : convention des membres (0 = vertical, + = vers l'avant). */
export const HPOSE0 = {
  fnU: 0.04, fnL: 0.0, // antérieur proche : avant-bras, canon
  ffU: 0.08, ffL: 0.02, // antérieur lointain
  hnU: -0.22, hnL: 0.04, // postérieur proche : jambe, canon
  hfU: -0.18, hfL: 0.06, // postérieur lointain
  by: 0, // décalage vertical du corps (négatif = en l'air)
  pitch: 0, // tangage du corps (+ = avant qui plonge)
  neck: 0, // rotation de l'encolure (+ = tête qui descend vers l'avant)
  tail: 0, // balancement de la queue
  flat: 1, // écrasement (cheval couché sur le flanc)
  rot: 0,
};

/** Articulations du cheval (hz = échelle). */
export function horseRig(H, P) {
  const z = H.hz;
  const by = (-17.2 + P.by) * z;
  const tf = (x, y) => {
    const [rx, ry] = rot(x * z, y * z, P.pitch);
    return [rx, by + ry];
  };
  return {
    z,
    tf,
    shoulder: tf(7.2, 2.4),
    hip: tf(-8.2, 1.0),
    withers: tf(6.5, -5.2),
    saddle: tf(-1.4, -7.0),
    by,
  };
}

function legPath(ctx, x, y, a1, L1, r1, r2, a2, L2, r3) {
  const [kx, ky] = seg(x, y, a1, L1);
  const [fx, fy] = seg(kx, ky, a2, L2);
  ctx.beginPath();
  capsule(ctx, x, y, r1, kx, ky, r2);
  capsule(ctx, kx, ky, r2 * 0.75, fx, fy, r3);
  return [kx, ky, fx, fy];
}

function drawLeg(ctx, H, x, y, a1, a2, fore, far) {
  const z = H.hz;
  const dk = far ? -0.26 : 0;
  const coat = tone(H.coat, dk);
  const L1 = (fore ? 7.0 : 7.6) * z;
  const L2 = (fore ? 7.4 : 7.6) * z;
  const [, , fx, fy] = legPath(ctx, x, y, a1, L1, (fore ? 2.5 : 2.9) * z, 1.25 * z, a2, L2, 0.95 * z);
  paint(ctx, sideGrad(ctx, x - 3 * z, x + 3 * z, coat, 0.15, -0.2), edge(coat, 0.6), 0.7);
  // Balzane ou bas de jambe sombre
  if (H.socks) {
    const [kx, ky] = seg(x, y, a1, L1);
    const t0 = 0.45;
    const sx = kx + (fx - kx) * t0;
    const sy = ky + (fy - ky) * t0;
    ctx.beginPath();
    capsule(ctx, sx, sy, 1.0 * z, fx, fy, 0.95 * z);
    const sc = tone(H.socks, dk);
    paint(ctx, sc, edge(sc, 0.5), 0.5);
  }
  // Sabot
  const ha = a2;
  const [hx, hy] = seg(fx, fy, ha, 1.1 * z);
  ctx.beginPath();
  const [px, py] = [Math.cos(ha), -Math.sin(ha)];
  poly(ctx, [
    fx - px * 1.0 * z, fy - py * 1.0 * z,
    fx + px * 1.1 * z, fy + py * 1.1 * z,
    hx + px * 1.5 * z + Math.sin(ha) * 0.3 * z, hy + py * 1.5 * z,
    hx - px * 1.2 * z, hy - py * 1.2 * z,
  ]);
  paint(ctx, tone('#3a2c22', dk), 'rgba(20,14,8,0.7)', 0.5);
  if (H.feathers && !far) {
    // Fanons (poneys gaulois)
    ctx.fillStyle = rgba(tone(H.mane, 0.2), 0.8);
    ctx.beginPath();
    ell(ctx, fx - 0.6 * z, fy - 0.2 * z, 1.4 * z, 0.9 * z, 0.4);
    ctx.fill();
  }
}

function bodyPath(ctx, z) {
  ctx.beginPath();
  ctx.moveTo(9.8 * z, 1.8 * z);
  ctx.bezierCurveTo(11.6 * z, -1.4 * z, 11.2 * z, -4.8 * z, 8.6 * z, -6.2 * z);
  ctx.bezierCurveTo(5.8 * z, -7.8 * z, 1.5 * z, -6.6 * z, -2.0 * z, -6.6 * z);
  ctx.bezierCurveTo(-6.0 * z, -6.8 * z, -10.2 * z, -7.8 * z, -12.2 * z, -4.6 * z);
  ctx.bezierCurveTo(-13.8 * z, -2.0 * z, -13.2 * z, 2.2 * z, -10.8 * z, 3.4 * z);
  ctx.bezierCurveTo(-7.0 * z, 5.2 * z, 3.0 * z, 5.6 * z, 6.8 * z, 4.4 * z);
  ctx.closePath();
}

/**
 * Dessine le cheval. H = { hz, coat, mane, socks, feathers, blaze, cloth, clothTrim, caparison, capTrim,
 * armor }, P = pose. mid(ctx, rig) est appelé après le corps et l'encolure (pour placer le cavalier) ;
 * front(ctx, rig) après les pattes proches.
 */
export function drawHorse(ctx, H, P, mid) {
  const R = horseRig(H, P);
  const z = R.z;
  // Pattes lointaines
  drawLeg(ctx, H, R.shoulder[0] + 1.6 * z, R.shoulder[1] - 0.4 * z, P.ffU, P.ffL, true, true);
  drawLeg(ctx, H, R.hip[0] + 1.6 * z, R.hip[1] - 0.4 * z, P.hfU, P.hfL, false, true);

  // Queue
  ctx.save();
  const [tx, ty] = R.tf(-12.0, -3.8);
  ctx.translate(tx, ty);
  ctx.rotate(P.tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-3.6 * z, 1.0 * z, -4.8 * z, 6.0 * z, -4.6 * z, 11.5 * z);
  ctx.quadraticCurveTo(-3.0 * z, 12.4 * z, -1.6 * z, 11.6 * z);
  ctx.bezierCurveTo(-2.2 * z, 7.0 * z, -0.8 * z, 3.0 * z, 1.2 * z, 1.4 * z);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -5 * z, 1 * z, H.mane, 0.25, -0.3), edge(H.mane, 0.7), 0.6);
  ctx.strokeStyle = rgba(tone(H.mane, 0.4), 0.5);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-1.2 * z, 1.6 * z);
  ctx.quadraticCurveTo(-3.4 * z, 5 * z, -3.2 * z, 10.5 * z);
  ctx.stroke();
  ctx.restore();

  // Corps
  ctx.save();
  ctx.translate(0, R.by);
  ctx.rotate(P.pitch);
  bodyPath(ctx, z);
  paint(ctx, ballGrad(ctx, -1 * z, -3 * z, 14 * z, H.coat, 0.22, -0.3), edge(H.coat, 0.6), 0.75);
  // Ventre plus sombre et muscles
  ctx.save();
  bodyPath(ctx, z);
  ctx.clip();
  ctx.fillStyle = rgba(tone(H.coat, -0.5), 0.3);
  ctx.beginPath();
  ell(ctx, -1 * z, 6 * z, 13 * z, 3.4 * z);
  ctx.fill();
  if (H.dapple) {
    ctx.fillStyle = rgba('#ffffff', 0.18);
    for (const [dx, dy] of [[-8, -3], [-5, -1], [-9, 0.5], [-2, -3.5], [3, -2], [-6, -4.5]]) {
      ctx.beginPath();
      ell(ctx, dx * z, dy * z, 1.2 * z, 0.9 * z);
      ctx.fill();
    }
  }
  ctx.strokeStyle = rgba(tone(H.coat, -0.45), 0.45);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-8.5 * z, -5.5 * z);
  ctx.quadraticCurveTo(-6.0 * z, -1.0 * z, -8.8 * z, 3.4 * z);
  ctx.moveTo(6.2 * z, -5.0 * z);
  ctx.quadraticCurveTo(4.6 * z, -0.4 * z, 6.4 * z, 3.6 * z);
  ctx.stroke();
  ctx.restore();

  if (H.caparison) {
    // Caparaçon aux couleurs de l'équipe, bordure dorée et motif
    const c = H.caparison;
    ctx.beginPath();
    ctx.moveTo(10.6 * z, -2.8 * z);
    ctx.bezierCurveTo(10.0 * z, -6.2 * z, 5.5 * z, -7.4 * z, -2 * z, -7.0 * z);
    ctx.bezierCurveTo(-7 * z, -7.2 * z, -11.4 * z, -7.4 * z, -12.8 * z, -3.8 * z);
    ctx.lineTo(-13.2 * z, 7.6 * z);
    ctx.lineTo(-10.2 * z, 9.0 * z);
    ctx.lineTo(-7.2 * z, 7.8 * z);
    ctx.lineTo(-4.2 * z, 9.2 * z);
    ctx.lineTo(-1.2 * z, 7.9 * z);
    ctx.lineTo(1.8 * z, 9.2 * z);
    ctx.lineTo(4.8 * z, 7.8 * z);
    ctx.lineTo(7.8 * z, 9.0 * z);
    ctx.lineTo(10.6 * z, 7.4 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -13 * z, 11 * z, c, 0.22, -0.3), edge(c, 0.75), 0.75);
    ctx.save();
    ctx.clip();
    // Bande de bordure
    ctx.strokeStyle = H.capTrim || '#e8c050';
    ctx.lineWidth = 1.1 * z;
    ctx.beginPath();
    ctx.moveTo(-13.4 * z, 6.8 * z);
    ctx.lineTo(-10.2 * z, 8.2 * z);
    ctx.lineTo(-7.2 * z, 7.0 * z);
    ctx.lineTo(-4.2 * z, 8.4 * z);
    ctx.lineTo(-1.2 * z, 7.1 * z);
    ctx.lineTo(1.8 * z, 8.4 * z);
    ctx.lineTo(4.8 * z, 7.0 * z);
    ctx.lineTo(7.8 * z, 8.2 * z);
    ctx.lineTo(10.8 * z, 6.6 * z);
    ctx.stroke();
    // Motif : écartelé clair (Gaulois : carreaux ; Francs : fleurs de lys)
    ctx.fillStyle = rgba('#ffffff', 0.2);
    if (H.capPattern === 'check') {
      for (let i = -6; i < 6; i++) for (let j = -3; j < 4; j++) if ((i + j) & 1) ctx.fillRect(i * 2.2 * z, j * 2.2 * z, 2.2 * z, 2.2 * z);
    } else {
      ctx.fillStyle = H.capTrim || '#e8c050';
      for (const [lx, ly] of [[-8, 1.5], [-2, 2.5], [4, 1.5], [-5, -3.5], [1, -3]]) {
        ctx.beginPath();
        ell(ctx, lx * z, ly * z, 0.55 * z, 1.2 * z);
        ell(ctx, (lx - 0.9) * z, (ly + 0.3) * z, 0.5 * z, 0.8 * z, -0.6);
        ell(ctx, (lx + 0.9) * z, (ly + 0.3) * z, 0.5 * z, 0.8 * z, 0.6);
        ctx.fill();
      }
    }
    ctx.restore();
  } else if (H.cloth) {
    // Tapis de selle aux couleurs de l'équipe
    const c = H.cloth;
    ctx.beginPath();
    ctx.moveTo(3.8 * z, -6.8 * z);
    ctx.quadraticCurveTo(4.6 * z, -1.0 * z, 3.2 * z, 3.8 * z);
    ctx.lineTo(-6.6 * z, 3.6 * z);
    ctx.quadraticCurveTo(-7.4 * z, -1.4 * z, -6.4 * z, -6.9 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -7 * z, 4.6 * z, c, 0.2, -0.28), edge(c, 0.75), 0.7);
    ctx.strokeStyle = H.clothTrim || '#e8d9b0';
    ctx.lineWidth = 0.8 * z;
    ctx.beginPath();
    ctx.moveTo(-6.2 * z, 2.6 * z);
    ctx.lineTo(3.0 * z, 2.8 * z);
    ctx.stroke();
    // Selle
    ctx.beginPath();
    ctx.moveTo(-5.2 * z, -6.9 * z);
    ctx.quadraticCurveTo(-5.6 * z, -9.2 * z, -3.8 * z, -9.0 * z);
    ctx.quadraticCurveTo(-1.2 * z, -6.8 * z, 1.8 * z, -8.2 * z);
    ctx.quadraticCurveTo(3.2 * z, -8.8 * z, 3.2 * z, -6.6 * z);
    ctx.closePath();
    paint(ctx, '#6a4226', edge('#6a4226', 0.8), 0.6);
  }
  // Sangle
  if (!H.caparison) line(ctx, 1.6 * z, -6.4 * z, 1.2 * z, 5.0 * z, 'rgba(60,36,18,0.8)', 0.9 * z);
  ctx.restore();

  // Encolure et tête
  drawNeckHead(ctx, H, R, P);

  // Cavalier (et tout ce qui se place au-dessus du corps)
  if (mid) mid(ctx, R);

  // Pattes proches
  drawLeg(ctx, H, R.shoulder[0], R.shoulder[1], P.fnU, P.fnL, true, false);
  drawLeg(ctx, H, R.hip[0], R.hip[1], P.hnU, P.hnL, false, false);
  return R;
}

function drawNeckHead(ctx, H, R, P) {
  const z = R.z;
  const [wx, wy] = R.tf(7.0, -3.2);
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(P.neck + P.pitch * 0.5);
  // Encolure
  ctx.beginPath();
  ctx.moveTo(-2.8 * z, -2.6 * z);
  ctx.bezierCurveTo(-0.8 * z, -8.0 * z, 2.6 * z, -12.4 * z, 5.6 * z, -13.2 * z);
  ctx.lineTo(8.2 * z, -11.4 * z);
  ctx.bezierCurveTo(7.0 * z, -8.2 * z, 5.6 * z, -3.6 * z, 4.6 * z, 1.8 * z);
  ctx.lineTo(-1.0 * z, 3.4 * z);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -3 * z, 8 * z, H.coat, 0.22, -0.25), edge(H.coat, 0.6), 0.7);
  if (H.caparison) {
    // Chanfrein et crinière d'étoffe
    ctx.beginPath();
    ctx.moveTo(-2.4 * z, -2.4 * z);
    ctx.bezierCurveTo(-0.4 * z, -7.6 * z, 2.6 * z, -11.6 * z, 5.2 * z, -12.4 * z);
    ctx.lineTo(7.0 * z, -10.4 * z);
    ctx.bezierCurveTo(5.8 * z, -7.2 * z, 4.8 * z, -3.2 * z, 4.0 * z, 1.6 * z);
    ctx.lineTo(-0.8 * z, 3.0 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3 * z, 8 * z, H.caparison, 0.22, -0.3), edge(H.caparison, 0.75), 0.7);
  }
  // Tête
  ctx.save();
  ctx.translate(6.8 * z, -12.2 * z);
  ctx.rotate(0.95);
  ctx.beginPath();
  capsule(ctx, 0, 0, 2.6 * z, 7.4 * z, 0.4 * z, 1.75 * z);
  ell(ctx, 1.0 * z, 0.9 * z, 2.9 * z, 2.2 * z);
  paint(ctx, ballGrad(ctx, 2 * z, -1 * z, 5 * z, H.coat, 0.25, -0.25), edge(H.coat, 0.6), 0.65);
  if (H.blaze) {
    ctx.beginPath();
    capsule(ctx, 1.2 * z, -1.6 * z, 0.7 * z, 6.8 * z, -0.9 * z, 0.5 * z);
    ctx.fillStyle = rgba('#f4efe4', 0.9);
    ctx.fill();
  }
  if (H.armor) {
    // Chanfrein de métal
    ctx.beginPath();
    poly(ctx, [-0.4 * z, -2.4 * z, 6.8 * z, -1.4 * z, 6.8 * z, 0.4 * z, 0.4 * z, 1.2 * z]);
    paint(ctx, sideGrad(ctx, 0, 7 * z, H.armor, 0.35, -0.2), edge(H.armor, 0.8), 0.6);
  }
  // Naseau, œil, bride
  ctx.fillStyle = 'rgba(30,18,12,0.8)';
  ctx.beginPath();
  ell(ctx, 7.2 * z, 0.9 * z, 0.5 * z, 0.4 * z);
  ctx.fill();
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ell(ctx, 1.9 * z, -0.6 * z, 0.62 * z, 0.55 * z);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ell(ctx, 2.1 * z, -0.8 * z, 0.2 * z, 0.2 * z);
  ctx.fill();
  ctx.strokeStyle = H.bridle || '#4a2c18';
  ctx.lineWidth = 0.55 * z;
  ctx.beginPath();
  ctx.moveTo(0.4 * z, -2.4 * z);
  ctx.lineTo(0.6 * z, 2.2 * z);
  ctx.moveTo(0.6 * z, 0.2 * z);
  ctx.lineTo(6.2 * z, 1.4 * z);
  ctx.stroke();
  ctx.restore();
  // Oreilles
  ctx.beginPath();
  poly(ctx, [5.4 * z, -13.6 * z, 5.2 * z, -16.6 * z, 7.0 * z, -13.8 * z]);
  poly(ctx, [6.4 * z, -13.3 * z, 6.9 * z, -16.2 * z, 7.9 * z, -13.1 * z]);
  paint(ctx, tone(H.coat, -0.1), edge(H.coat, 0.7), 0.5);
  // Crinière
  ctx.beginPath();
  ctx.moveTo(5.4 * z, -13.8 * z);
  ctx.bezierCurveTo(2.2 * z, -13.4 * z, -1.4 * z, -8.8 * z, -3.4 * z, -3.0 * z);
  ctx.lineTo(-4.6 * z, -1.6 * z);
  ctx.lineTo(-3.6 * z, -4.6 * z);
  ctx.lineTo(-4.8 * z, -4.4 * z);
  ctx.lineTo(-2.4 * z, -7.8 * z);
  ctx.lineTo(-3.6 * z, -7.8 * z);
  ctx.lineTo(-0.6 * z, -10.8 * z);
  ctx.lineTo(-1.6 * z, -11.2 * z);
  ctx.bezierCurveTo(1.6 * z, -13.2 * z, 3.6 * z, -15.0 * z, 5.4 * z, -13.8 * z);
  paint(ctx, sideGrad(ctx, -4.8 * z, 5.4 * z, H.mane, 0.3, -0.25), edge(H.mane, 0.7), 0.6);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Allures
// ---------------------------------------------------------------------------

/** Galop rassemblé : phase p (tours). */
export function gallopPose(p) {
  const leg = (q, fore) => {
    const s = Math.sin(q * TAU);
    const lift = Math.max(0, Math.cos(q * TAU + 0.5));
    if (fore) {
      const up = 0.12 + 0.62 * s;
      return [up, up - 1.5 * lift * lift + 0.1 * (1 - lift)];
    }
    const up = -0.2 + 0.55 * s;
    return [up, up * 0.4 + 0.25 - 0.9 * lift * lift];
  };
  const [fnU, fnL] = leg(p, true);
  const [ffU, ffL] = leg(p + 0.1, true);
  const [hnU, hnL] = leg(p + 0.5, false);
  const [hfU, hfL] = leg(p + 0.6, false);
  const s = Math.sin(p * TAU);
  return {
    ...HPOSE0,
    fnU, fnL, ffU, ffL, hnU, hnL, hfU, hfL,
    by: -1.3 * Math.max(0, Math.sin((p + 0.15) * TAU)) + 0.4,
    pitch: 0.07 * s,
    neck: 0.1 * Math.sin((p + 0.25) * TAU) - 0.05,
    tail: -0.35 + 0.15 * s,
  };
}

/** À l'arrêt : piaffe légèrement, encolure et queue qui bougent. p = phase 0..1 (cycle lent). */
export function standPose(p) {
  const s = Math.sin(p * TAU);
  return {
    ...HPOSE0,
    neck: 0.06 + 0.07 * Math.max(0, Math.sin(p * TAU * 2 + 1)),
    tail: 0.08 * s,
    by: 0.15 * s,
  };
}

/** Le cheval tombe sur le flanc (q = avancement 0..1). */
export function fallPose(q) {
  const f = smooth(clamp(q / 0.85));
  return {
    ...HPOSE0,
    fnU: lerp(0.04, 0.9, f), fnL: lerp(0, 1.2, f),
    ffU: lerp(0.08, 0.6, f), ffL: lerp(0.02, 0.8, f),
    hnU: lerp(-0.22, -0.9, f), hnL: lerp(0.04, -0.7, f),
    hfU: lerp(-0.18, -0.6, f), hfL: lerp(0.06, -0.4, f),
    by: lerp(0, 3.0, f),
    neck: lerp(0.06, 1.0, f),
    tail: lerp(0, -0.6, f),
    flat: 1 - 0.45 * f,
    pitch: lerp(0, -0.05, f),
  };
}
