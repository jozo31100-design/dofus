// Tour de siège : grande tour roulante de bois à trois étages, vue en projection oblique (comme le bélier).
// Coordonnées modèle : u vers l'avant (droite de l'écran), v vers le spectateur, h vers le haut (p3 de unit-siege.js).
import { PI, TAU, lerp, smooth, clamp, tone, rgba, edge, ell, poly, paint, line, sideGrad, vGrad } from './unit-kit.js';
import { WOOD, WOOD_D, GOLD, IRON } from './unit-gear.js';
import { p3, quad, beamU, post, strut, wheel, pennant } from './unit-siege.js';

const UB = 19; // demi-longueur de la tour
const VB = 12; // demi-largeur
const H = [9, 34, 59]; // bas des trois étages
const SH = 25; // hauteur d'un étage
const TOP = H[2] + SH; // 87

/** Face proche (plan v = VB). */
function nearQuad(ctx, u0, u1, h0, h1, v = VB) {
  quad(ctx, p3(u0, v, h1), p3(u1, v, h1), p3(u1, v, h0), p3(u0, v, h0));
}
/** Face avant (plan u = UB). */
function frontQuad(ctx, h0, h1, v0 = -VB, v1 = VB, u = UB) {
  quad(ctx, p3(u, v1, h1), p3(u, v0, h1), p3(u, v0, h0), p3(u, v1, h0));
}

/** Effondrement d'un groupe (étage i) : décalage, rotation et chute au fil de b (0..1). */
function collapse(ctx, b, i) {
  if (b <= 0) return;
  const e = smooth(b);
  const drop = [0, 24, 50][i];
  const dx = [-3, 6, -9][i];
  const rot = [0.04, -0.2, 0.42][i];
  const [cx, cy] = p3(0, 0, H[i]);
  ctx.translate(cx + dx * e, cy + drop * e * e);
  ctx.rotate(rot * e);
  ctx.translate(-cx, -cy);
}

/** Habillage d'une face : peaux (Gaulois) ou planches et peaux humides (Francs), selon l'étage. */
function cladFace(ctx, S, k, plane, u0, u1, h0, h1, ex) {
  const gaul = S.civ === 'gauls';
  const base = gaul ? (k === 1 ? '#b99868' : '#9a7446') : k === 1 ? '#77828a' : '#8a7560';
  // Fond
  const xa = plane === 'n' ? p3(u0, VB, h0)[0] : p3(UB, VB, h0)[0];
  const xb = plane === 'n' ? p3(u1, VB, h0)[0] : p3(UB, -VB, h0)[0];
  if (plane === 'n') nearQuad(ctx, u0, u1, h0, h1);
  else frontQuad(ctx, h0, h1);
  paint(ctx, sideGrad(ctx, Math.min(xa, xb), Math.max(xa, xb), base, plane === 'n' ? 0.16 : 0, plane === 'n' ? -0.18 : -0.36), edge(base, 0.6), 0.5);
  ctx.save();
  if (plane === 'n') nearQuad(ctx, u0, u1, h0, h1);
  else frontQuad(ctx, h0, h1);
  ctx.clip();
  const pt = (a, hh) => (plane === 'n' ? p3(a, VB, hh) : p3(UB, a, hh));
  const span = plane === 'n' ? [u0, u1] : [-VB, VB];
  ctx.lineWidth = 0.6;
  if (gaul || k === 1) {
    // Peaux : grands panneaux cousus de lacets clairs, tache sombre et traînées d'eau
    const n = plane === 'n' ? 4 : 2;
    const w = (span[1] - span[0]) / n;
    for (let i = 0; i < n; i++) {
      const a0 = span[0] + i * w;
      const tint = (i + k) % 2 ? 0.1 : -0.08;
      const p0 = pt(a0, h1);
      const p1 = pt(a0 + w, h1);
      const p2 = pt(a0 + w, h0);
      const p3_ = pt(a0, h0);
      quad(ctx, p0, p1, p2, p3_);
      ctx.fillStyle = rgba(tone(base, tint), 0.85);
      ctx.fill();
      ctx.strokeStyle = 'rgba(50,30,14,0.6)';
      ctx.stroke();
      ctx.setLineDash([1, 1.2]);
      ctx.strokeStyle = 'rgba(245,225,185,0.65)';
      ctx.stroke();
      ctx.setLineDash([]);
      const [sx, sy] = pt(a0 + w * 0.5, (h0 + h1) / 2 + 2 - (i % 2) * 3);
      ctx.fillStyle = 'rgba(60,40,22,0.22)';
      ctx.beginPath();
      ell(ctx, sx, sy, 2.6, 1.7, -0.25);
      ctx.fill();
      const [dx0, dy0] = pt(a0 + w * 0.25, h1 - 1);
      const [dx1, dy1] = pt(a0 + w * 0.3, h0 + 6 + (i % 3) * 3);
      ctx.strokeStyle = 'rgba(200,225,240,0.32)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(dx0, dy0);
      ctx.lineTo(dx1, dy1);
      ctx.stroke();
      ctx.lineWidth = 0.6;
    }
  } else {
    // Planches verticales clouées
    const n = plane === 'n' ? 9 : 5;
    ctx.strokeStyle = 'rgba(35,25,16,0.6)';
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const a = span[0] + ((span[1] - span[0]) * i) / n;
      const A = pt(a, h0);
      const B = pt(a, h1);
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,30,32,0.6)';
    for (let i = 0; i < n; i++) {
      const a = span[0] + ((span[1] - span[0]) * (i + 0.5)) / n;
      for (const hh of [h0 + 3, h1 - 3]) {
        const [x, y] = pt(a, hh);
        ctx.fillRect(x - 0.3, y - 0.3, 0.6, 0.6);
      }
    }
  }
  if (ex) ex(ctx, pt);
  ctx.restore();
}

/** Fente de tir sombre sur la face proche. */
function slit(ctx, u, hc) {
  quad(ctx, p3(u - 1.1, VB, hc + 3.6), p3(u + 1.1, VB, hc + 3.6), p3(u + 1.1, VB, hc - 3.6), p3(u - 1.1, VB, hc - 3.6));
  ctx.fillStyle = '#1c130c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,120,0.5)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
}

/** Un étage : corps, poteaux d'angle, traverses et contreventement. */
function storey(ctx, S, k) {
  const h0 = H[k];
  const h1 = h0 + SH;
  const wd = S.civ === 'gauls' ? WOOD : '#6f5e4d';
  cladFace(ctx, S, k, 'f', -VB, VB, h0 + 1, h1 - 1);
  cladFace(ctx, S, k, 'n', -UB, UB, h0 + 1, h1 - 1, (c, pt) => {
    if (k === 0) return;
  });
  // Contreventement en croix sur la face proche
  strut(ctx, [-UB + 1, VB + 0.3, h0 + 1.5], [-3, VB + 0.3, h1 - 1.5], 0.9, wd);
  strut(ctx, [UB - 1, VB + 0.3, h0 + 1.5], [3, VB + 0.3, h1 - 1.5], 0.9, wd);
  // Traverses
  for (const hh of [h0, h1 - 1.8]) {
    beamU(ctx, -UB - 0.8, UB + 0.8, VB - 0.6, VB + 1.2, hh, hh + 2.2, wd);
  }
  // Poteaux d'angle
  post(ctx, -UB, VB, 1.4, h0, h1, wd);
  post(ctx, UB, VB, 1.6, h0, h1, wd);
  post(ctx, UB, -VB, 1.4, h0, h1, tone(wd, -0.2));
}

/** Bannière d'équipe suspendue sur la face proche de l'étage du milieu. */
function banner(ctx, S, wave) {
  const tm = S.team;
  const gaul = S.civ === 'gauls';
  const hTop = H[1] + SH - 3;
  const hBot = H[1] + 2.5;
  const u0 = -10;
  const u1 = 10;
  const v = VB + 1.4;
  ctx.beginPath();
  const a = p3(u0, v, hTop);
  const b = p3(u1, v, hTop);
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  const n = 3;
  const tail = [];
  for (let i = 0; i <= n; i++) {
    const u = u1 - ((u1 - u0) * i) / n;
    const d = gaul ? (i % 2 ? 0 : 3.2) : i % 2 ? 3.6 : 0;
    const p = p3(u, v, hBot - d + Math.sin(i + wave) * 0.5);
    tail.push(p);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
  paint(ctx, vGrad(ctx, a[1], a[1] + 26, tm.main, 0.24, -0.26), edge(tm.main, 0.75), 0.6);
  line(ctx, a[0], a[1], b[0], b[1], WOOD_D, 1.4);
  // Emblème
  const [ex, ey] = p3(0, v, (hTop + hBot) / 2 + 0.5);
  ctx.fillStyle = gaul ? GOLD : '#f2ecd8';
  ctx.beginPath();
  if (gaul) {
    ell(ctx, ex - 4, ey, 2.0, 1.6);
    ell(ctx, ex + 1, ey - 2.4, 2.0, 1.6);
    ell(ctx, ex + 3.6, ey + 2.2, 2.0, 1.6);
  } else {
    poly(ctx, [ex - 0.9, ey - 5, ex + 0.9, ey - 5, ex + 0.9, ey - 1, ex + 4, ey - 1, ex + 4, ey + 1, ex + 0.9, ey + 1, ex + 0.9, ey + 5, ex - 0.9, ey + 5, ex - 0.9, ey + 1, ex - 4, ey + 1, ex - 4, ey - 1, ex - 0.9, ey - 1]);
  }
  ctx.fill();
}

/** Porte basse (rampe d'accès) au pied de la face proche. */
function door(ctx, S) {
  const wd = S.civ === 'gauls' ? WOOD_D : '#4c3e31';
  const u = -5;
  quad(ctx, p3(u - 4, VB + 0.05, H[0] + 11), p3(u + 4, VB + 0.05, H[0] + 11), p3(u + 4, VB + 0.05, H[0] + 1), p3(u - 4, VB + 0.05, H[0] + 1));
  paint(ctx, '#20150d', edge(wd, 0.9), 0.6);
  quad(ctx, p3(u - 4, VB + 0.05, H[0] + 11), p3(u, VB + 0.05, H[0] + 11), p3(u, VB + 0.05, H[0] + 1), p3(u - 4, VB + 0.05, H[0] + 1));
  paint(ctx, tone('#7a5a3a', -0.1), edge(wd, 0.9), 0.5);
}

/** Hourd crénelé du sommet, fanion et pont-levis. br = angle d'abaissement du pont-levis (0 = relevé .. 1 = abaissé). */
function crown(ctx, S, P) {
  const gaul = S.civ === 'gauls';
  const wd = gaul ? WOOD : '#6f5e4d';
  const ov = 2.2;
  const hb = TOP;
  // Plancher saillant
  beamU(ctx, -UB - ov, UB + ov, VB - 0.8, VB + ov, hb - 1.2, hb + 1.4, tone(wd, -0.1));
  quad(ctx, p3(UB + ov, VB + ov, hb + 1.4), p3(UB + ov, -VB - ov, hb + 1.4), p3(UB + ov, -VB - ov, hb - 1.2), p3(UB + ov, VB + ov, hb - 1.2));
  paint(ctx, tone(wd, -0.3), edge(wd, 0.6), 0.5);
  // Merlons de bois (face proche puis avant)
  const mc = gaul ? '#9a7446' : '#7d6a56';
  for (let i = 0; i < 6; i++) {
    const u0 = -UB - ov + 1 + i * 7.2;
    quad(ctx, p3(u0, VB + ov, hb + 6.5), p3(u0 + 4.4, VB + ov, hb + 6.5), p3(u0 + 4.4, VB + ov, hb + 1.4), p3(u0, VB + ov, hb + 1.4));
    paint(ctx, sideGrad(ctx, p3(u0, 0, 0)[0], p3(u0 + 4.4, 0, 0)[0], mc, 0.16, -0.16), edge(mc, 0.65), 0.5);
    quad(ctx, p3(u0 + 4.4, VB + ov, hb + 6.5), p3(u0 + 4.4, VB + ov - 1.4, hb + 6.5), p3(u0 + 4.4, VB + ov - 1.4, hb + 1.4), p3(u0 + 4.4, VB + ov, hb + 1.4));
    paint(ctx, tone(mc, -0.3), edge(mc, 0.65), 0.4);
  }
  // Bande d'équipe le long du hourd
  nearQuad(ctx, -UB - ov, UB + ov, hb - 1.2, hb + 1.4, VB + ov + 0.05);
  quad(ctx, p3(-UB - ov, VB + ov + 0.05, hb + 1.4), p3(UB + ov, VB + ov + 0.05, hb + 1.4), p3(UB + ov, VB + ov + 0.05, hb - 1.2), p3(-UB - ov, VB + ov + 0.05, hb - 1.2));
  paint(ctx, S.team.main, edge(S.team.main, 0.7), 0.5);
  // Pont-levis : pivot à l'avant, au niveau du plancher du 3e étage
  const ph = H[2] + 1.5;
  const L = 26;
  const th = (P.bridge || 0) * (PI / 2); // 0 relevé .. π/2 abaissé
  const pu = UB + 0.6;
  const dirU = Math.sin(th);
  const dirH = Math.cos(th);
  const end = (v) => p3(pu + dirU * L, v, ph + dirH * L);
  const sta = (v) => p3(pu, v, ph);
  const bw = 8;
  // Chaînes (en dessous du pont)
  if (P.bridge > 0.05) {
    for (const v of [-bw, bw]) {
      const a = p3(pu + 1.8, v, TOP + 2);
      const e = end(v);
      ctx.setLineDash([1.2, 0.9]);
      line(ctx, a[0], a[1], e[0], e[1], '#5c636b', 0.8);
      ctx.setLineDash([]);
    }
  }
  quad(ctx, sta(bw), end(bw), end(-bw), sta(-bw));
  const bc = gaul ? '#8d6238' : '#6b5a48';
  paint(ctx, vGrad(ctx, end(0)[1], sta(0)[1], bc, 0.2, -0.22), edge(bc, 0.65), 0.6);
  // Planches et renforts du pont
  ctx.strokeStyle = 'rgba(30,20,12,0.55)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const a = p3(pu + dirU * L * t, bw, ph + dirH * L * t);
    const c = p3(pu + dirU * L * t, -bw, ph + dirH * L * t);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(c[0], c[1]);
  }
  ctx.stroke();
  for (const v of [-bw + 0.8, bw - 0.8]) {
    const a = sta(v);
    const e = end(v);
    line(ctx, a[0], a[1], e[0], e[1], tone(bc, -0.35), 1.0);
  }
  // Bande de fer et crocs à l'extrémité
  const e0 = p3(pu + dirU * L * 0.88, bw, ph + dirH * L * 0.88);
  const e1 = p3(pu + dirU * L * 0.88, -bw, ph + dirH * L * 0.88);
  line(ctx, e0[0], e0[1], e1[0], e1[1], IRON, 1.2);
  for (const v of [-4.6, -1.5, 1.5, 4.6]) {
    const c = end(v);
    ctx.beginPath();
    poly(ctx, [c[0] - 0.9, c[1] - 0.4, c[0] + 0.9, c[1] - 0.4, c[0] + (dirU > 0.5 ? 2.2 : 0), c[1] + (dirU > 0.5 ? 2.2 : -2.6)]);
    ctx.fillStyle = IRON;
    ctx.fill();
  }
  // Bande d'équipe sur le pont relevé
  if (P.bridge < 0.6) {
    const t0 = 0.36;
    const t1 = 0.56;
    quad(ctx, p3(pu + dirU * L * t0, bw - 0.3, ph + dirH * L * t0), p3(pu + dirU * L * t1, bw - 0.3, ph + dirH * L * t1), p3(pu + dirU * L * t1, -bw + 0.3, ph + dirH * L * t1), p3(pu + dirU * L * t0, -bw + 0.3, ph + dirH * L * t0));
    paint(ctx, S.team.main, edge(S.team.main, 0.7), 0.4);
  }
  // Mât et fanion
  post(ctx, -UB + 1, -VB + 2, 1.0, TOP, TOP + 12, WOOD_D);
  const [fx, fy] = p3(-UB + 1, -VB + 2, TOP + 12);
  pennant(ctx, fx, fy - 9, S.team.main, P.wave || 0, 13);
}

/**
 * P = { spin, bob, wave, bridge (0..1), brk (effondrement 0..1), sway }.
 */
export function drawTower(ctx, S, P) {
  const b = P.brk || 0;
  const gaul = S.civ === 'gauls';
  const wd = gaul ? WOOD : '#6f5e4d';
  ctx.save();
  ctx.translate(0, P.bob || 0);
  // Roues lointaines
  for (const [u, k] of [[-12, 1], [12, 2]]) {
    ctx.save();
    if (b > 0) {
      const e = smooth(b);
      const [cx, cy] = p3(u, -14.5, 7);
      ctx.translate(cx + (k % 2 ? 6 : -5) * e, cy + 2 * e);
      ctx.rotate((k % 2 ? 0.5 : -0.4) * e);
      ctx.translate(-cx, -cy);
    }
    wheel(ctx, u, -14.5, 7, P.spin, true, true);
    ctx.restore();
  }
  beamU(ctx, -21, 21, -13, -8.5, 3, 9, tone(wd, -0.35));
  // Corps : le balancement fait pivoter l'ensemble autour du pied
  ctx.save();
  if (P.sway) {
    ctx.translate(0, -2);
    ctx.rotate(P.sway);
    ctx.translate(0, 2);
  }
  for (let i = 0; i < 3; i++) {
    ctx.save();
    collapse(ctx, b, i);
    storey(ctx, S, i);
    if (i === 0) door(ctx, S);
    if (i === 1) banner(ctx, S, P.wave || 0);
    if (i === 2) {
      // Fentes de tir du dernier étage
      for (const u of [-12, -4, 4, 12]) slit(ctx, u, H[2] + 12);
      crown(ctx, S, P);
    }
    ctx.restore();
  }
  ctx.restore();
  // Châssis proche et roues proches
  beamU(ctx, -21, 21, 8.5, 13, 3, 9.2, wd);
  // Bande d'équipe sur le châssis
  quad(ctx, p3(-19, 13.05, 8.6), p3(-7, 13.05, 8.6), p3(-7, 13.05, 4.2), p3(-19, 13.05, 4.2));
  paint(ctx, S.team.main, edge(S.team.main, 0.6), 0.4);
  for (const [u, k] of [[-12, 3], [12, 4]]) {
    ctx.save();
    if (b > 0) {
      const e = smooth(b);
      const [cx, cy] = p3(u, 14.5, 7);
      ctx.translate(cx + (k % 2 ? 9 : -8) * e, cy + 1 * e);
      ctx.rotate((k % 2 ? 0.6 : -0.7) * e);
      ctx.translate(-cx, -cy);
    }
    wheel(ctx, u, 14.5, 7, P.spin, false, true);
    ctx.restore();
  }
  ctx.restore();
  // Poussière de l'effondrement
  if (b > 0.25) dust(ctx, (b - 0.25) / 0.75, 1, 26);
}

/** Nuage de poussière (x, y locaux, rayon max r). */
export function dust(ctx, t, n = 1, spread = 10, yy = -2) {
  const e = smooth(clamp(t));
  const a = (1 - e) * 0.55;
  if (a <= 0.01) return;
  const pts = [[-0.8, 0.2, 1], [-0.3, -0.4, 0.8], [0.3, 0.3, 1.1], [0.8, -0.2, 0.9], [0, -0.7, 0.7], [-0.6, -0.9, 0.6], [0.6, -0.8, 0.65]];
  for (const [px, py, s] of pts) {
    const r = (3 + e * 8) * s * (spread > 12 ? 1.5 : 1);
    ctx.fillStyle = rgba('#d8c8a0', a * 0.8);
    ctx.beginPath();
    ell(ctx, px * spread * (0.4 + e * 0.6), yy + py * spread * 0.45 * (0.3 + e) - e * 4, r, r * 0.75);
    ctx.fill();
    ctx.fillStyle = rgba('#fff2d0', a * 0.35);
    ctx.beginPath();
    ell(ctx, px * spread * (0.4 + e * 0.6) - r * 0.25, yy + py * spread * 0.45 * (0.3 + e) - e * 4 - r * 0.25, r * 0.5, r * 0.4);
    ctx.fill();
  }
  void TAU; void lerp;
}
