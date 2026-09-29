// Cheval vu de profil (tourné de trois-quarts), regardant vers +x, sabots au sol (y = 0).
// Robes, crinière, selle ou caparaçon aux couleurs de l'équipe ; galop paramétré par une phase.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, seg, rot, sideGrad, vGrad, ballGrad, light, checkPattern } from './unit-kit.js';

/** Pose neutre du cheval. Angles des pattes : convention des membres (0 = vertical, + = vers l'avant). */
export const HPOSE0 = {
  fnU: 0.04, fnL: 0.0, // antérieur proche : avant-bras, canon
  ffU: 0.08, ffL: 0.02, // antérieur lointain
  hnU: -0.26, hnL: 0.08, // postérieur proche : jambe, canon
  hfU: -0.22, hfL: 0.1, // postérieur lointain
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
  const by = (-18.3 + P.by) * z;
  const tf = (x, y) => {
    const [rx, ry] = rot(x * z, y * z, P.pitch);
    return [rx, by + ry];
  };
  return {
    z,
    tf,
    shoulder: tf(8.2, 2.6),
    hip: tf(-9.4, 1.4),
    withers: tf(7.0, -6.2),
    saddle: tf(-1.6, -7.4),
    by,
  };
}

function drawLeg(ctx, H, x, y, a1, a2, fore, far) {
  const z = H.hz;
  const dk = far ? -0.26 : 0;
  const coat = tone(H.coat, dk);
  const L1 = (fore ? 7.2 : 7.8) * z;
  const L2 = (fore ? 7.3 : 8.1) * z;
  const [kx, ky] = seg(x, y, a1, L1);
  const [fx, fy] = seg(kx, ky, a2, L2);
  // Bras/jambe musclés, genou ou jarret marqué, canon fin
  ctx.beginPath();
  capsule(ctx, x, y, (fore ? 2.8 : 3.3) * z, kx, ky, 1.2 * z);
  ell(ctx, kx, ky, 1.3 * z, 1.35 * z);
  capsule(ctx, kx, ky, 1.05 * z, fx, fy, 0.9 * z);
  paint(ctx, sideGrad(ctx, x - 3 * z, x + 3 * z, coat, 0.18, -0.22), edge(coat, 0.65), 0.7);
  // Balzane ou bas de jambe sombre
  if (H.socks) {
    const t0 = 0.5;
    const sx = kx + (fx - kx) * t0;
    const sy = ky + (fy - ky) * t0;
    ctx.beginPath();
    capsule(ctx, sx, sy, 1.0 * z, fx, fy, 0.98 * z);
    const sc = tone(H.socks, dk);
    paint(ctx, sc, edge(sc, 0.5), 0.5);
  }
  // Sabot
  const [hx, hy] = seg(fx, fy, a2, 1.3 * z);
  const px = Math.cos(a2);
  const py = -Math.sin(a2);
  ctx.beginPath();
  poly(ctx, [
    fx - px * 1.0 * z, fy - py * 1.0 * z,
    fx + px * 1.1 * z, fy + py * 1.1 * z,
    hx + px * 1.7 * z, hy + py * 1.7 * z,
    hx - px * 1.2 * z, hy - py * 1.2 * z,
  ]);
  paint(ctx, tone('#3a2c22', dk), 'rgba(20,14,8,0.75)', 0.5);
  if (H.feathers && !far) {
    // Fanons (poneys gaulois)
    ctx.fillStyle = rgba(tone(H.mane, 0.2), 0.85);
    ctx.beginPath();
    ell(ctx, fx - 0.5 * z, fy - 0.3 * z, 1.5 * z, 1.0 * z, 0.4);
    ctx.fill();
  }
}

function bodyPath(ctx, z) {
  ctx.beginPath();
  ctx.moveTo(10.6 * z, 2.8 * z);
  ctx.bezierCurveTo(12.9 * z, -0.2 * z, 12.8 * z, -4.8 * z, 10.4 * z, -6.6 * z);
  ctx.bezierCurveTo(7.8 * z, -8.4 * z, 3.2 * z, -6.9 * z, -1.5 * z, -6.9 * z);
  ctx.bezierCurveTo(-6.5 * z, -7.0 * z, -11.6 * z, -8.6 * z, -13.8 * z, -5.2 * z);
  ctx.bezierCurveTo(-15.4 * z, -2.4 * z, -14.8 * z, 2.4 * z, -12.2 * z, 3.8 * z);
  ctx.bezierCurveTo(-8.2 * z, 5.8 * z, 3.4 * z, 6.3 * z, 7.4 * z, 5.0 * z);
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
  drawLeg(ctx, H, R.shoulder[0] + 1.8 * z, R.shoulder[1] - 0.5 * z, P.ffU, P.ffL, true, true);
  drawLeg(ctx, H, R.hip[0] + 1.8 * z, R.hip[1] - 0.5 * z, P.hfU, P.hfL, false, true);

  // Queue fournie
  ctx.save();
  const [tx, ty] = R.tf(-13.6, -4.4);
  ctx.translate(tx, ty);
  ctx.rotate(P.tail);
  ctx.beginPath();
  ctx.moveTo(1.0 * z, -0.6 * z);
  ctx.bezierCurveTo(-3.4 * z, -0.6 * z, -5.6 * z, 5.0 * z, -5.2 * z, 12.2 * z);
  ctx.quadraticCurveTo(-3.6 * z, 13.6 * z, -1.4 * z, 12.4 * z);
  ctx.bezierCurveTo(-2.4 * z, 7.4 * z, -0.4 * z, 3.4 * z, 1.8 * z, 1.8 * z);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -5.5 * z, 1.8 * z, H.mane, 0.28, -0.3), edge(H.mane, 0.75), 0.6);
  ctx.strokeStyle = rgba(tone(H.mane, 0.45), 0.55);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-1.0 * z, 1.2 * z);
  ctx.quadraticCurveTo(-3.8 * z, 5.4 * z, -3.6 * z, 11.4 * z);
  ctx.moveTo(0.2 * z, 1.6 * z);
  ctx.quadraticCurveTo(-1.8 * z, 5.6 * z, -2.2 * z, 10.4 * z);
  ctx.stroke();
  ctx.restore();

  // Corps
  ctx.save();
  ctx.translate(0, R.by);
  ctx.rotate(P.pitch);
  bodyPath(ctx, z);
  paint(ctx, ballGrad(ctx, -1 * z, -3.5 * z, 16 * z, H.coat, 0.24, -0.32), edge(H.coat, 0.65), 0.75);
  // Ventre plus sombre et reflet du dos (second remplissage du même contour, sans découpage)
  bodyPath(ctx, z);
  const bg = ctx.createLinearGradient(0, -7 * z, 0, 6.5 * z);
  bg.addColorStop(0, 'rgba(255,255,255,0.14)');
  bg.addColorStop(0.3, 'rgba(255,255,255,0)');
  bg.addColorStop(0.72, 'rgba(0,0,0,0)');
  bg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = bg;
  ctx.fill();
  if (H.dapple) {
    ctx.fillStyle = rgba('#ffffff', 0.2);
    for (const [dx, dy] of [[-9, -3], [-6, -1], [-10, 0.5], [-3, -3.5], [2, -2], [-7, -4.5], [5, -3]]) {
      ctx.beginPath();
      ell(ctx, dx * z, dy * z, 1.2 * z, 0.9 * z);
      ctx.fill();
    }
  }
  ctx.strokeStyle = rgba(tone(H.coat, -0.45), 0.5);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-9.6 * z, -6.0 * z);
  ctx.quadraticCurveTo(-6.4 * z, -1.2 * z, -9.6 * z, 3.8 * z);
  ctx.moveTo(7.4 * z, -5.6 * z);
  ctx.quadraticCurveTo(5.4 * z, -0.6 * z, 7.6 * z, 4.0 * z);
  ctx.stroke();

  if (H.caparison) {
    // Caparaçon aux couleurs de l'équipe, bordure dorée et motif
    const c = H.caparison;
    const hem = [[-14.6, 8.2], [-11.4, 9.8], [-8.2, 8.4], [-5.0, 10.0], [-1.8, 8.6], [1.4, 10.0], [4.6, 8.6], [7.8, 10.0], [11.2, 8.0]];
    ctx.beginPath();
    ctx.moveTo(12.0 * z, -3.0 * z);
    ctx.bezierCurveTo(11.6 * z, -6.8 * z, 6.5 * z, -8.0 * z, -2 * z, -7.4 * z);
    ctx.bezierCurveTo(-7.5 * z, -7.6 * z, -12.6 * z, -8.2 * z, -14.4 * z, -4.2 * z);
    for (const [x, y] of hem) ctx.lineTo(x * z, y * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -14 * z, 12 * z, c, 0.24, -0.32), edge(c, 0.8), 0.75);
    if (H.capPattern === 'check') {
      // Carreaux gaulois (motif translucide sur le même contour)
      ctx.fillStyle = checkPattern(ctx, 'rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 4.6 * z);
      ctx.fill();
    }
    ctx.strokeStyle = H.capTrim || '#e8c050';
    ctx.lineWidth = 1.2 * z;
    ctx.beginPath();
    hem.forEach(([x, y], i) => (i ? ctx.lineTo(x * z, (y - 1.0) * z) : ctx.moveTo((x + 0.4) * z, (y - 1.0) * z)));
    ctx.stroke();
    if (H.capPattern !== 'check') {
      // Fleurs de lys dorées
      ctx.fillStyle = H.capTrim || '#e8c050';
      for (const [lx, ly] of [[-9, 2], [-3, 3], [3, 2], [-6, -3.4], [0, -3], [6.5, -2.5]]) {
        ctx.beginPath();
        ell(ctx, lx * z, ly * z, 0.55 * z, 1.25 * z);
        ell(ctx, (lx - 0.95) * z, (ly + 0.35) * z, 0.5 * z, 0.85 * z, -0.6);
        ell(ctx, (lx + 0.95) * z, (ly + 0.35) * z, 0.5 * z, 0.85 * z, 0.6);
        ctx.fill();
      }
    }
  } else if (H.cloth) {
    // Tapis de selle aux couleurs de l'équipe, bordure claire et franges
    const c = H.cloth;
    ctx.beginPath();
    ctx.moveTo(5.8 * z, -6.8 * z);
    ctx.quadraticCurveTo(7.2 * z, -0.6 * z, 5.2 * z, 5.0 * z);
    ctx.lineTo(-9.6 * z, 4.8 * z);
    ctx.quadraticCurveTo(-11.0 * z, -1.4 * z, -9.2 * z, -7.2 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -11 * z, 7.2 * z, c, 0.24, -0.3), edge(c, 0.8), 0.7);
    ctx.strokeStyle = H.clothTrim || '#efe2b8';
    ctx.lineWidth = 0.95 * z;
    ctx.beginPath();
    ctx.moveTo(-9.7 * z, 3.6 * z);
    ctx.lineTo(5.3 * z, 3.8 * z);
    ctx.stroke();
    ctx.strokeStyle = rgba(tone(c, -0.45), 0.85);
    ctx.lineWidth = 0.55 * z;
    ctx.beginPath();
    for (let x = -9.0; x < 5.0; x += 1.6) {
      ctx.moveTo(x * z, 4.8 * z);
      ctx.lineTo((x - 0.2) * z, 6.0 * z);
    }
    ctx.stroke();
    // Selle de cuir
    ctx.beginPath();
    ctx.moveTo(-5.8 * z, -7.2 * z);
    ctx.quadraticCurveTo(-6.2 * z, -9.6 * z, -4.2 * z, -9.4 * z);
    ctx.quadraticCurveTo(-1.4 * z, -7.2 * z, 1.8 * z, -8.6 * z);
    ctx.quadraticCurveTo(3.4 * z, -9.2 * z, 3.4 * z, -6.9 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -6 * z, 3.4 * z, '#6a4226', 0.25, -0.2), edge('#6a4226', 0.85), 0.6);
  }
  // Sangle
  if (!H.caparison) line(ctx, 1.4 * z, -6.8 * z, 1.0 * z, 5.6 * z, 'rgba(60,36,18,0.85)', 1.0 * z);
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
  const [wx, wy] = R.tf(8.2, -4.2);
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(P.neck + P.pitch * 0.5);
  // Encolure arquée
  const neck = () => {
    ctx.beginPath();
    ctx.moveTo(-3.6 * z, -2.4 * z);
    ctx.bezierCurveTo(-1.6 * z, -9.0 * z, 2.4 * z, -14.2 * z, 6.4 * z, -15.4 * z);
    ctx.lineTo(9.4 * z, -13.2 * z);
    ctx.bezierCurveTo(8.0 * z, -9.6 * z, 6.6 * z, -4.4 * z, 5.2 * z, 2.2 * z);
    ctx.lineTo(-1.4 * z, 4.0 * z);
    ctx.closePath();
  };
  neck();
  paint(ctx, sideGrad(ctx, -3.6 * z, 9.4 * z, H.coat, 0.24, -0.26), edge(H.coat, 0.65), 0.7);
  ctx.strokeStyle = rgba(tone(H.coat, -0.45), 0.4);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(6.8 * z, -11.6 * z);
  ctx.quadraticCurveTo(4.8 * z, -6 * z, 3.8 * z, 1 * z);
  ctx.stroke();
  if (H.caparison) {
    // Housse d'encolure aux couleurs de l'équipe
    ctx.beginPath();
    ctx.moveTo(-3.2 * z, -2.2 * z);
    ctx.bezierCurveTo(-1.2 * z, -8.4 * z, 2.4 * z, -13.2 * z, 6.0 * z, -14.4 * z);
    ctx.lineTo(8.2 * z, -12.2 * z);
    ctx.bezierCurveTo(7.0 * z, -8.8 * z, 5.8 * z, -4.0 * z, 4.6 * z, 2.0 * z);
    ctx.lineTo(-1.2 * z, 3.6 * z);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3.2 * z, 8.2 * z, H.caparison, 0.24, -0.3), edge(H.caparison, 0.8), 0.7);
    line(ctx, 7.6 * z, -12.0 * z, 4.4 * z, 1.8 * z, H.capTrim || '#e8c050', 0.9 * z);
  }
  // Tête
  ctx.save();
  ctx.translate(7.6 * z, -14.0 * z);
  ctx.rotate(1.0);
  ctx.beginPath();
  capsule(ctx, 0, 0, 2.9 * z, 8.4 * z, 0.5 * z, 1.95 * z);
  ell(ctx, 1.2 * z, 1.1 * z, 3.2 * z, 2.5 * z);
  paint(ctx, ballGrad(ctx, 2 * z, -1 * z, 6 * z, H.coat, 0.28, -0.25), edge(H.coat, 0.65), 0.65);
  if (H.blaze) {
    ctx.beginPath();
    capsule(ctx, 1.4 * z, -1.9 * z, 0.75 * z, 7.8 * z, -1.0 * z, 0.55 * z);
    ctx.fillStyle = rgba('#f4efe4', 0.92);
    ctx.fill();
  }
  if (H.armor) {
    // Chanfrein de métal
    ctx.beginPath();
    poly(ctx, [-0.6 * z, -2.8 * z, 7.6 * z, -1.6 * z, 7.6 * z, 0.4 * z, 0.4 * z, 1.4 * z]);
    paint(ctx, sideGrad(ctx, 0, 8 * z, H.armor, 0.4, -0.2), edge(H.armor, 0.85), 0.6);
    line(ctx, 0.6 * z, -1.9 * z, 6.8 * z, -1.0 * z, rgba('#ffffff', 0.5), 0.4 * z);
  }
  // Naseau, bouche, œil, bride
  ctx.fillStyle = 'rgba(30,18,12,0.85)';
  ctx.beginPath();
  ell(ctx, 8.3 * z, 1.0 * z, 0.55 * z, 0.45 * z);
  ctx.fill();
  line(ctx, 6.4 * z, 2.3 * z, 8.4 * z, 2.0 * z, 'rgba(30,18,12,0.6)', 0.4 * z);
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ell(ctx, 2.1 * z, -0.7 * z, 0.7 * z, 0.62 * z);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ell(ctx, 2.35 * z, -0.95 * z, 0.22 * z, 0.22 * z);
  ctx.fill();
  ctx.strokeStyle = H.bridle || '#4a2c18';
  ctx.lineWidth = 0.6 * z;
  ctx.beginPath();
  ctx.moveTo(0.4 * z, -2.8 * z);
  ctx.lineTo(0.7 * z, 2.6 * z);
  ctx.moveTo(0.7 * z, 0.3 * z);
  ctx.lineTo(7.0 * z, 1.6 * z);
  ctx.stroke();
  ctx.restore();
  // Oreilles et toupet
  ctx.beginPath();
  poly(ctx, [6.0 * z, -15.6 * z, 5.6 * z, -19.0 * z, 7.7 * z, -15.9 * z]);
  poly(ctx, [7.2 * z, -15.3 * z, 7.9 * z, -18.6 * z, 8.9 * z, -15.0 * z]);
  paint(ctx, tone(H.coat, -0.08), edge(H.coat, 0.75), 0.5);
  ctx.beginPath();
  ell(ctx, 8.2 * z, -14.8 * z, 1.6 * z, 0.9 * z, 0.6);
  paint(ctx, H.mane, edge(H.mane, 0.7), 0.4);
  // Crinière
  ctx.beginPath();
  ctx.moveTo(6.2 * z, -15.8 * z);
  ctx.bezierCurveTo(2.6 * z, -15.4 * z, -1.6 * z, -10.2 * z, -4.2 * z, -3.4 * z);
  ctx.lineTo(-5.6 * z, -1.8 * z);
  ctx.lineTo(-4.4 * z, -5.2 * z);
  ctx.lineTo(-5.8 * z, -5.0 * z);
  ctx.lineTo(-2.8 * z, -8.8 * z);
  ctx.lineTo(-4.2 * z, -8.8 * z);
  ctx.lineTo(-0.6 * z, -12.4 * z);
  ctx.lineTo(-1.8 * z, -12.8 * z);
  ctx.bezierCurveTo(1.8 * z, -15.0 * z, 4.0 * z, -17.0 * z, 6.2 * z, -15.8 * z);
  paint(ctx, sideGrad(ctx, -5.8 * z, 6.2 * z, H.mane, 0.32, -0.25), edge(H.mane, 0.75), 0.6);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Allures
// ---------------------------------------------------------------------------

/** Galop : phase p (tours). Antérieurs puis postérieurs décalés, temps de suspension rassemblé. */
export function gallopPose(p) {
  const leg = (q, fore) => {
    const s = Math.sin(q * TAU);
    const lift = Math.max(0, Math.cos(q * TAU + 0.5));
    if (fore) {
      const up = 0.14 + 0.58 * s;
      return [up, up - 1.45 * lift * lift + 0.08 * (1 - lift)];
    }
    const up = -0.24 + 0.46 * s;
    return [up, up * 0.35 + 0.22 - 0.85 * lift * lift];
  };
  const [fnU, fnL] = leg(p, true);
  const [ffU, ffL] = leg(p + 0.1, true);
  const [hnU, hnL] = leg(p + 0.5, false);
  const [hfU, hfL] = leg(p + 0.6, false);
  const s = Math.sin(p * TAU);
  return {
    ...HPOSE0,
    fnU, fnL, ffU, ffL, hnU, hnL, hfU, hfL,
    by: -1.2 * Math.max(0, Math.sin((p + 0.15) * TAU)) + 0.5,
    pitch: 0.065 * s,
    neck: 0.1 * Math.sin((p + 0.25) * TAU) - 0.04,
    tail: -0.35 + 0.15 * s,
  };
}

/** À l'arrêt : encolure et queue qui bougent doucement. p = phase 0..1 (cycle lent). */
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
    hnU: lerp(-0.26, -0.9, f), hnL: lerp(0.08, -0.7, f),
    hfU: lerp(-0.22, -0.6, f), hfL: lerp(0.1, -0.4, f),
    by: lerp(0, 3.0, f),
    neck: lerp(0.06, 1.0, f),
    tail: lerp(0, -0.6, f),
    flat: 1 - 0.42 * f,
    pitch: lerp(0, -0.05, f),
  };
}
