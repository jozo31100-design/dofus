// Accessoires de la trière spartiate (branchés sur unit-naval.js par les crochets prow / sailCols / shieldCols du costume) :
// éperon de bronze à la flottaison (embolon), œil peint (ophthalmos) à l'étrave, acrotère d'étrave recourbé, aphlaston en éventail
// à la poupe, grande voile carrée claire à bande d'équipe, hoplons de bronze et d'équipe au plat-bord.
import { PI, tone, edge, ell, poly, paint, line } from './unit-kit.js';
import { GOLD } from './unit-gear.js';
import { pr } from './unit-naval.js';

const CREAM = '#efe6cc';
const BRONZE_L = '#e0b860';
const BRONZE_D = '#7a5420';
const DARKW = '#2a1a0e';

/** Couleurs des hoplons accrochés au bordé : bronze poli et champ d'équipe en alternance. */
export function spShieldCols(tm) {
  return ['#d8ae52', tm.main, '#d8ae52', '#a8222a', '#d8ae52', tm.main, '#d8ae52', '#a8222a', '#d8ae52'];
}

/** Rayures de la grande voile carrée (lin écru, deux bandes de pourpre et d'équipe). */
export function spSailCols(tm) {
  return [CREAM, CREAM, CREAM, '#a8222a', tm.main, '#a8222a', CREAM, CREAM, CREAM];
}

/** Largeur du bordé et hauteur du plat-bord à l'abscisse u (mêmes formules que la coque). */
function profile(hd, u) {
  const s = u / (hd.L / 2);
  const a = Math.min(1, Math.abs(s));
  const B = hd.B * Math.pow(Math.max(0, 1 - Math.pow(a, hd.pe)), hd.pq);
  const H = hd.H + (s > 0 ? hd.hb : hd.hs) * Math.pow(a, hd.ph);
  return { B, H };
}

/** Éperon de bronze : pointe à trois ailerons sous la flottaison, bague de fixation à la quille. */
function ram(ctx, hd) {
  const uB = hd.L / 2;
  const a = pr(uB - 3.4, 0, 2.6);
  const tip = pr(uB + 10.5, 0, 0.1);
  const top = pr(uB - 0.2, 0, 3.0);
  const low = pr(uB - 0.6, 0, -1.4);
  ctx.beginPath();
  ctx.moveTo(a[0] - 1, a[1] - 0.6);
  ctx.lineTo(top[0], top[1] - 0.2);
  ctx.lineTo(tip[0], tip[1]);
  ctx.lineTo(low[0], low[1] + 0.8);
  ctx.lineTo(a[0] - 1, a[1] + 2.4);
  ctx.closePath();
  const gr = ctx.createLinearGradient(a[0], a[1] - 3, a[0], a[1] + 3);
  gr.addColorStop(0, BRONZE_L);
  gr.addColorStop(0.55, '#b98a3a');
  gr.addColorStop(1, BRONZE_D);
  paint(ctx, gr, edge(BRONZE_D, 0.95), 0.6);
  // ailerons : trois sillons
  ctx.strokeStyle = 'rgba(70,44,12,0.85)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const k of [0.3, 0.55, 0.78]) {
    const x = a[0] + (tip[0] - a[0]) * k;
    const y = a[1] + 0.6 + (tip[1] - a[1]) * k;
    ctx.moveTo(x, y - 2.2 * (1 - k));
    ctx.lineTo(x + 0.6, y + 2.2 * (1 - k));
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,180,0.7)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(a[0] + 1, a[1] - 0.2);
  ctx.lineTo(tip[0] - 1.6, tip[1] - 0.2);
  ctx.stroke();
}

/** Œil peint sur le bordé, près de l'étrave : amande blanche, iris sombre, sourcil aux couleurs de l'équipe. */
function eye(ctx, hd, tm) {
  const u = hd.L / 2 - 11;
  const { B, H } = profile(hd, u);
  const [x, y] = pr(u, B * 0.96, H * 0.56);
  ctx.beginPath();
  ctx.moveTo(x - 3.6, y + 0.4);
  ctx.quadraticCurveTo(x, y - 3.4, x + 3.6, y - 0.4);
  ctx.quadraticCurveTo(x, y + 2.6, x - 3.6, y + 0.4);
  ctx.closePath();
  paint(ctx, '#f7f2e0', edge('#20140a', 0.95), 0.7);
  ctx.beginPath();
  ell(ctx, x + 0.4, y - 0.1, 1.45, 1.45);
  paint(ctx, '#1a2c4a', edge('#0a1018', 0.9), 0.4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 0.1, y - 0.9, 0.7, 0.7);
  ctx.strokeStyle = tm.main;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 4.4, y - 0.4);
  ctx.quadraticCurveTo(x, y - 5.2, x + 4.6, y - 1.2);
  ctx.stroke();
}

/**
 * Proue et poupe. bp et sp : points d'écran du haut de l'étrave et de l'étambot (donnés par unit-naval.js).
 */
export function spProw(ctx, bp, sp, hd, tm, flap) {
  ram(ctx, hd);
  eye(ctx, hd, tm);
  // Acrotère d'étrave (akrostolion) : crosse de bois sombre qui se recourbe vers l'intérieur, pointe dorée
  ctx.save();
  ctx.translate(bp[0] - 0.5, bp[1] + 1.5);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1, 1);
  ctx.bezierCurveTo(2.4, -3, 5.6, -9, 3.2, -13.6);
  ctx.bezierCurveTo(1.6, -16, -1.2, -14.6, -0.6, -12.2);
  ctx.strokeStyle = DARKW;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2c';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ell(ctx, -0.6, -12.2, 1.5, 1.5);
  ctx.fill();
  ctx.strokeStyle = edge(GOLD, 0.8);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.restore();

  // Poupe : aphlaston, éventail de planches recourbé portant le pavillon de l'équipe
  ctx.save();
  ctx.translate(sp[0] - 0.5, sp[1] + 2);
  ctx.beginPath();
  ctx.moveTo(0.4, 1);
  ctx.bezierCurveTo(-2.6, -4, -2.4, -11, -6.4, -15);
  ctx.strokeStyle = DARKW;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2c';
  ctx.lineWidth = 2.0;
  ctx.stroke();
  // éventail
  const cx = -6.4;
  const cy = -15;
  for (let k = 0; k < 5; k++) {
    const a = -PI * 0.92 + (k / 4) * PI * 0.72;
    const x1 = cx + Math.cos(a) * 7.2;
    const y1 = cy + Math.sin(a) * 7.2;
    ctx.beginPath();
    poly(ctx, [cx, cy, x1 - 0.9 * Math.sin(a), y1 + 0.9 * Math.cos(a), x1 + 0.9 * Math.sin(a), y1 - 0.9 * Math.cos(a)]);
    paint(ctx, k % 2 ? BRONZE_L : tone(tm.main, 0.05), edge(BRONZE_D, 0.9), 0.4);
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ell(ctx, cx, cy, 1.3, 1.3);
  ctx.fill();
  // stylis : mât de poupe et fanion
  line(ctx, -1.6, -2, -2.4, -17, '#3a2412', 0.9);
  const w = flap * 1.6;
  ctx.beginPath();
  ctx.moveTo(-2.4, -17);
  ctx.quadraticCurveTo(-7 - w, -16 + w, -12 - w * 1.4, -17.4 + w);
  ctx.lineTo(-10 - w, -14.6 + w);
  ctx.quadraticCurveTo(-6, -14, -2.6, -13.2);
  ctx.closePath();
  paint(ctx, tm.main, edge(tm.main, 0.85), 0.4);
  ctx.restore();
}
