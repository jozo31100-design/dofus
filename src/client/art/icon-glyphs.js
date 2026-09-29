// Pictogrammes de l'interface, dessinés dans un carré de 64 × 64 unités (l'appelant met à l'échelle).
// Style : formes pleines, contour sombre de 2 unités, dégradés doux, reflets — lisibles de 20 à 64 px.
import { TAU, PI, tone, rgba, capsule, ell, poly, line } from './unit-kit.js';

const INK = '#23170e';

/** Épaississement des contours pour les petites tailles (réglé par l'appelant avant de dessiner). */
export const ink = { k: 1 };

/** Remplit le chemin courant avec un dégradé vertical de la couleur, puis un contour épais. */
export function fillInk(ctx, c, w = 2.4, k1 = 0.3, k2 = -0.25, y0 = 8, y1 = 56) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(c, k1));
  g.addColorStop(1, tone(c, k2));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = w * ink.k;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function shine(ctx, x, y, rx, ry, a = 0.55, r = 0) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ell(ctx, x, y, rx, ry, r);
  ctx.fill();
}

function bar(ctx, x1, y1, x2, y2, w, c) {
  ctx.beginPath();
  capsule(ctx, x1, y1, w / 2, x2, y2, w / 2);
  fillInk(ctx, c, 2.2, 0.3, -0.25, Math.min(y1, y2) - w, Math.max(y1, y2) + w);
}

// ---------------------------------------------------------------------------
// Objets de base réutilisés par les icônes et les technologies
// ---------------------------------------------------------------------------

export function gSword(ctx, x = 32, y = 32, a = -PI / 4, L = 1, blade = '#d8dee6', hilt = '#c89a3e') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(L, L);
  // Lame
  ctx.beginPath();
  poly(ctx, [-4, -4, 26, -3.2, 31, 0, 26, 3.2, -4, 4]);
  fillInk(ctx, blade, 2.2, 0.35, -0.2, -4, 4);
  line(ctx, -2, -0.8, 25, -0.8, 'rgba(255,255,255,0.8)', 1.4);
  // Garde, fusée, pommeau
  ctx.beginPath();
  capsule(ctx, -5, -11, 2.4, -5, 11, 2.4);
  fillInk(ctx, hilt, 2);
  ctx.beginPath();
  capsule(ctx, -7, 0, 2.6, -18, 0, 2.4);
  fillInk(ctx, '#6a4226', 2);
  ctx.beginPath();
  ell(ctx, -20, 0, 4, 4);
  fillInk(ctx, hilt, 2);
  ctx.restore();
}

export function gAxe(ctx, x = 32, y = 32, a = -PI / 4, L = 1, head = '#aab2bc', wood = '#a8723e') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(L, L);
  // Manche
  ctx.beginPath();
  capsule(ctx, -24, 0, 3.2, 18, 0, 3.4);
  fillInk(ctx, wood, 2.2, 0.3, -0.3, -3, 3);
  // Fer large à barbe : collet autour du manche, tranchant courbe
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(19, -5);
  ctx.quadraticCurveTo(24, -9, 30, -20);
  ctx.quadraticCurveTo(22, -24, 12, -21);
  ctx.quadraticCurveTo(13, -12, 8, -5);
  ctx.closePath();
  fillInk(ctx, head, 2.4, 0.4, -0.25, -24, -4);
  ctx.beginPath();
  poly(ctx, [7, -5.5, 20, -5.5, 20, 5.5, 7, 5.5]);
  fillInk(ctx, tone(head, -0.15), 2.2, 0.3, -0.3, -5, 5);
  line(ctx, 28, -19, 16, -21, 'rgba(255,255,255,0.85)', 2);
  ctx.restore();
}

export function gPick(ctx, x = 32, y = 32, a = -PI / 4, L = 1, head = '#9aa2ac') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(L, L);
  ctx.beginPath();
  capsule(ctx, -24, 0, 3.2, 16, 0, 3.4);
  fillInk(ctx, '#a8723e', 2.2, 0.3, -0.3, -3, 3);
  // Fer à deux pointes, épais et courbé
  ctx.beginPath();
  ctx.moveTo(12, -4);
  ctx.quadraticCurveTo(22, -14, 14, -28);
  ctx.quadraticCurveTo(24, -16, 21, -3);
  ctx.quadraticCurveTo(26, 12, 33, 20);
  ctx.quadraticCurveTo(20, 12, 12, 4);
  ctx.closePath();
  fillInk(ctx, head, 2.4, 0.45, -0.25, -28, 20);
  ctx.beginPath();
  poly(ctx, [10, -5, 22, -5, 22, 5, 10, 5]);
  fillInk(ctx, tone(head, -0.15), 2.2, 0.3, -0.3, -5, 5);
  ctx.restore();
}

export function gHammer(ctx, x = 32, y = 32, a = -PI / 4, L = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(L, L);
  ctx.beginPath();
  capsule(ctx, -22, 0, 3, 14, 0, 3);
  fillInk(ctx, '#a8723e', 2.2, 0.3, -0.3, -3, 3);
  ctx.beginPath();
  poly(ctx, [10, -12, 22, -12, 22, 12, 10, 12]);
  fillInk(ctx, '#9aa2ac', 2.2, 0.4, -0.3, -12, 12);
  shine(ctx, 14, -7, 2.5, 1.6, 0.6);
  ctx.restore();
}

export function gBow(ctx, x = 32, y = 32, a = 0, L = 1, arrow = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(L, L);
  // Corde
  line(ctx, -8, -24, -8, 24, '#f2e8d0', 1.6);
  // Arc
  ctx.beginPath();
  ctx.moveTo(-8, -25);
  ctx.quadraticCurveTo(14, -18, 12, 0);
  ctx.quadraticCurveTo(14, 18, -8, 25);
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 3.6;
  ctx.strokeStyle = '#b07a42';
  ctx.stroke();
  if (arrow) {
    line(ctx, -14, 0, 20, 0, INK, 4);
    line(ctx, -14, 0, 20, 0, '#e2c890', 2);
    ctx.beginPath();
    poly(ctx, [19, -4, 28, 0, 19, 4]);
    fillInk(ctx, '#c8d0d8', 1.6);
    ctx.beginPath();
    poly(ctx, [-18, -4, -12, -4, -9, 0, -12, 4, -18, 4, -15, 0]);
    fillInk(ctx, '#d84a3a', 1.6);
  }
  ctx.restore();
}

export function gShield(ctx, x = 32, y = 32, r = 20, face = '#3b72e8') {
  ctx.beginPath();
  ell(ctx, x, y, r, r);
  fillInk(ctx, '#7a5230', 2.4);
  ctx.beginPath();
  ell(ctx, x, y, r * 0.82, r * 0.82);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
  g.addColorStop(0, tone(face, 0.35));
  g.addColorStop(1, tone(face, -0.25));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 4; i++) {
    const a0 = (i / 4) * TAU + 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r * 0.82, a0, a0 + TAU / 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ell(ctx, x, y, r * 0.3, r * 0.3);
  fillInk(ctx, '#b8c0c8', 2, 0.45, -0.3, y - r * 0.3, y + r * 0.3);
  shine(ctx, x - r * 0.1, y - r * 0.12, r * 0.1, r * 0.07, 0.8);
}

export function gFlag(ctx, x = 20, y = 10, c = '#3b72e8') {
  bar(ctx, x, y, x, y + 46, 4.5, '#8a5a32');
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.quadraticCurveTo(x + 16, y - 2, x + 32, y + 5);
  ctx.lineTo(x + 26, y + 14);
  ctx.lineTo(x + 33, y + 22);
  ctx.quadraticCurveTo(x + 16, y + 17, x + 2, y + 22);
  ctx.closePath();
  fillInk(ctx, c, 2.2, 0.3, -0.25, y, y + 22);
  ctx.beginPath();
  ell(ctx, x, y - 1, 3.2, 3.2);
  fillInk(ctx, '#e8b93a', 1.8);
}

export function gTower(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  poly(ctx, [-12, 22, -10, -12, 10, -12, 12, 22]);
  fillInk(ctx, '#b4ada0', 2.4, 0.2, -0.3, -12, 22);
  ctx.beginPath();
  poly(ctx, [-14, -12, -14, -22, -9, -22, -9, -17, -3, -17, -3, -22, 3, -22, 3, -17, 9, -17, 9, -22, 14, -22, 14, -12]);
  fillInk(ctx, '#c8c2b4', 2.4, 0.2, -0.2, -22, -12);
  ctx.beginPath();
  poly(ctx, [-4, 22, -4, 10, 0, 6, 4, 10, 4, 22]);
  fillInk(ctx, '#4a3422', 2);
  ctx.strokeStyle = 'rgba(60,50,40,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let yy = -6; yy < 22; yy += 7) {
    ctx.moveTo(-10, yy);
    ctx.lineTo(10, yy);
  }
  ctx.stroke();
  ctx.restore();
}

export function gHut(ctx, x = 32, y = 36, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  poly(ctx, [-16, 16, -16, 0, 16, 0, 16, 16]);
  fillInk(ctx, '#e8dcc0', 2.4, 0.15, -0.2, 0, 16);
  ctx.beginPath();
  poly(ctx, [-3, 16, -3, 6, 3, 6, 3, 16]);
  fillInk(ctx, '#5a3a22', 1.8);
  ctx.beginPath();
  ctx.moveTo(-22, 3);
  ctx.quadraticCurveTo(-8, -10, 0, -22);
  ctx.quadraticCurveTo(8, -10, 22, 3);
  ctx.closePath();
  fillInk(ctx, '#d0aa58', 2.4, 0.3, -0.25, -22, 3);
  ctx.strokeStyle = 'rgba(120,80,30,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-3, -16);
  ctx.moveTo(-5, 1);
  ctx.lineTo(0, -18);
  ctx.moveTo(5, 1);
  ctx.lineTo(3, -16);
  ctx.moveTo(14, 0);
  ctx.lineTo(6, -12);
  ctx.stroke();
  ctx.restore();
}

export function gArrow(ctx, x1, y1, x2, y2, c = '#f2d060', w = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - Math.cos(a) * 9;
  const hy = y2 - Math.sin(a) * 9;
  ctx.beginPath();
  const px = -Math.sin(a);
  const py = Math.cos(a);
  poly(ctx, [
    x1 + px * w * 0.5, y1 + py * w * 0.5,
    hx + px * w * 0.5, hy + py * w * 0.5,
    hx + px * w * 1.3, hy + py * w * 1.3,
    x2, y2,
    hx - px * w * 1.3, hy - py * w * 1.3,
    hx - px * w * 0.5, hy - py * w * 0.5,
    x1 - px * w * 0.5, y1 - py * w * 0.5,
  ]);
  fillInk(ctx, c, 2.2, 0.3, -0.25, Math.min(y1, y2) - w, Math.max(y1, y2) + w);
}

export function gSack(ctx, x = 32, y = 36, s = 1, c = '#c8a878') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.quadraticCurveTo(-20, -6, -17, 10);
  ctx.quadraticCurveTo(0, 20, 17, 10);
  ctx.quadraticCurveTo(20, -6, 6, -16);
  ctx.closePath();
  fillInk(ctx, c, 2.4, 0.3, -0.3, -16, 18);
  ctx.beginPath();
  poly(ctx, [-8, -16, -4, -22, 4, -22, 8, -16]);
  fillInk(ctx, c, 2.2);
  line(ctx, -8, -15, 8, -15, '#6a4222', 3);
  shine(ctx, -8, -2, 3, 5, 0.3, 0.4);
  ctx.restore();
}

export function gGoldPile(ctx, x = 32, y = 40, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const coins = [[-12, 8], [0, 9], [12, 8], [-6, 2], [6, 2], [0, -5]];
  for (const [cx, cy] of coins) {
    ctx.beginPath();
    ell(ctx, cx, cy, 9, 6);
    fillInk(ctx, '#e8b93a', 2.2, 0.4, -0.25, cy - 6, cy + 6);
    ctx.beginPath();
    ell(ctx, cx, cy - 0.5, 5.5, 3.4);
    ctx.strokeStyle = 'rgba(140,90,10,0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    shine(ctx, cx - 3, cy - 2, 2.2, 1.2, 0.8);
  }
  ctx.restore();
}

export function gLogs(ctx, x = 32, y = 36, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const logs = [[-9, 8], [9, 8], [0, -6]];
  for (const [lx, ly] of logs) {
    ctx.beginPath();
    capsule(ctx, lx - 16, ly + 5, 8, lx - 2, ly, 8);
    fillInk(ctx, '#8a5a32', 2.2, 0.25, -0.3, ly - 8, ly + 12);
    ctx.beginPath();
    ell(ctx, lx - 2, ly, 6.5, 8);
    fillInk(ctx, '#e2c28a', 2.2, 0.2, -0.1, ly - 8, ly + 8);
    ctx.strokeStyle = 'rgba(140,90,40,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ell(ctx, lx - 2, ly, 3.4, 4.4);
    ctx.stroke();
  }
  ctx.restore();
}

export function gStones(ctx, x = 32, y = 38, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const blocks = [[-12, 6, 13, 10], [10, 7, 12, 9], [-1, -6, 14, 11]];
  for (const [bx, by, w, h] of blocks) {
    ctx.beginPath();
    poly(ctx, [bx - w, by + h * 0.5, bx - w * 0.8, by - h * 0.6, bx - w * 0.1, by - h, bx + w * 0.9, by - h * 0.5, bx + w, by + h * 0.6, bx, by + h]);
    fillInk(ctx, '#aeada4', 2.4, 0.3, -0.3, by - h, by + h);
    ctx.beginPath();
    poly(ctx, [bx - w * 0.7, by - h * 0.5, bx - w * 0.1, by - h * 0.85, bx + w * 0.7, by - h * 0.45, bx, by - h * 0.15]);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }
  ctx.restore();
}

export function gMeat(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Os
  ctx.beginPath();
  capsule(ctx, 6, 6, 3.4, 20, 20, 3.4);
  ell(ctx, 20, 23, 4, 4);
  ell(ctx, 23, 20, 4, 4);
  fillInk(ctx, '#f2ead8', 2.2, 0.2, -0.2, 4, 26);
  // Viande
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.bezierCurveTo(-20, -20, 2, -24, 8, -10);
  ctx.bezierCurveTo(12, -2, 12, 6, 6, 10);
  ctx.bezierCurveTo(-4, 16, -16, 10, -18, -4);
  fillInk(ctx, '#c0503a', 2.4, 0.3, -0.25, -22, 14);
  shine(ctx, -8, -12, 5, 2.6, 0.45, -0.4);
  ctx.restore();
}

export function gWheat(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const a of [-0.35, 0, 0.35]) {
    ctx.save();
    ctx.rotate(a);
    line(ctx, 0, 24, 0, -8, INK, 4);
    line(ctx, 0, 24, 0, -8, '#c8a040', 2);
    for (let i = 0; i < 5; i++) {
      const yy = -10 - i * 3.6;
      ctx.beginPath();
      ell(ctx, -2.6, yy, 2.4, 3.6, -0.5);
      ell(ctx, 2.6, yy, 2.4, 3.6, 0.5);
      fillInk(ctx, '#e8c04a', 1.4);
    }
    ctx.restore();
  }
  ctx.restore();
}

export function gBerries(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ell(ctx, -8, -12, 8, 4.5, -0.6);
  ell(ctx, 8, -13, 8, 4.5, 0.6);
  fillInk(ctx, '#5a9a3a', 2);
  for (const [bx, by] of [[-7, 2], [7, 2], [0, -4], [0, 9], [-12, -6], [12, -6]]) {
    ctx.beginPath();
    ell(ctx, bx, by, 6, 6);
    fillInk(ctx, '#d0283a', 2, 0.35, -0.25, by - 6, by + 6);
    shine(ctx, bx - 2, by - 2, 1.6, 1.6, 0.8);
  }
  ctx.restore();
}

export function gPerson(ctx, x = 32, y = 32, s = 1, body = '#d8c8a8') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-18, 24);
  ctx.quadraticCurveTo(-18, 2, 0, 2);
  ctx.quadraticCurveTo(18, 2, 18, 24);
  ctx.closePath();
  fillInk(ctx, body, 2.4, 0.25, -0.25, 2, 24);
  ctx.beginPath();
  ell(ctx, 0, -10, 10, 10.5);
  fillInk(ctx, '#ecc49a', 2.4, 0.25, -0.2, -20, 0);
  ctx.beginPath();
  ctx.moveTo(-10.5, -9);
  ctx.quadraticCurveTo(-11, -22, 0, -21);
  ctx.quadraticCurveTo(11, -22, 10.5, -9);
  ctx.quadraticCurveTo(4, -15, -10.5, -9);
  fillInk(ctx, '#8a5a32', 2);
  ctx.restore();
}

export function gCart(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  line(ctx, 14, 2, 28, -4, INK, 5);
  line(ctx, 14, 2, 28, -4, '#a8723e', 2.6);
  ctx.beginPath();
  poly(ctx, [-22, -8, 16, -8, 14, 6, -20, 6]);
  fillInk(ctx, '#a8723e', 2.4, 0.25, -0.3, -8, 6);
  ctx.strokeStyle = 'rgba(80,50,20,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-20, -1);
  ctx.lineTo(15, -1);
  ctx.stroke();
  // Chargement
  ctx.beginPath();
  ell(ctx, -10, -11, 7, 5);
  ell(ctx, 3, -12, 8, 5.5);
  fillInk(ctx, '#d8b878', 2);
  for (const wx of [-12, 8]) {
    ctx.beginPath();
    ell(ctx, wx, 10, 8, 8);
    fillInk(ctx, '#7a5030', 2.2);
    ctx.strokeStyle = '#c8a070';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(wx - 6, 10);
    ctx.lineTo(wx + 6, 10);
    ctx.moveTo(wx, 4);
    ctx.lineTo(wx, 16);
    ctx.stroke();
  }
  ctx.restore();
}

export function gPlow(ctx, x = 32, y = 32, s = 1, iron = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Mancherons
  bar(ctx, -22, -18, 0, 8, 4.4, '#a8723e');
  bar(ctx, -14, -22, 4, 6, 4.4, '#9a6634');
  // Age
  bar(ctx, -2, 6, 26, 2, 5, '#8a5a32');
  // Soc
  ctx.beginPath();
  poly(ctx, [-6, 4, 8, 4, 18, 16, -2, 14]);
  fillInk(ctx, iron ? '#b8c0c8' : '#b88450', 2.2, 0.35, -0.25, 4, 16);
  if (iron) shine(ctx, 6, 8, 3, 1.4, 0.8);
  ctx.restore();
}

export function gBasket(ctx, x = 32, y = 36, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const [bx, by] of [[-8, -8], [0, -12], [8, -8], [-3, -5], [5, -4]]) {
    ctx.beginPath();
    ell(ctx, bx, by, 5, 5);
    fillInk(ctx, '#d0283a', 1.8, 0.35, -0.25, by - 5, by + 5);
  }
  ctx.beginPath();
  ctx.moveTo(-20, -4);
  ctx.lineTo(20, -4);
  ctx.quadraticCurveTo(18, 18, 0, 18);
  ctx.quadraticCurveTo(-18, 18, -20, -4);
  ctx.closePath();
  fillInk(ctx, '#c89a58', 2.4, 0.25, -0.3, -4, 18);
  ctx.strokeStyle = 'rgba(110,70,25,0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * 5.5, -3);
    ctx.lineTo(i * 4.6, 16);
  }
  ctx.moveTo(-18, 5);
  ctx.lineTo(18, 5);
  ctx.moveTo(-15, 11);
  ctx.lineTo(15, 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.quadraticCurveTo(0, -30, 16, -4);
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#c89a58';
  ctx.stroke();
  ctx.restore();
}

export function gHorseHead(ctx, x = 32, y = 32, s = 1, coat = '#8a5a36', barding = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-14, 24);
  ctx.bezierCurveTo(-18, 6, -12, -12, 0, -18);
  ctx.lineTo(4, -24);
  ctx.lineTo(7, -17);
  ctx.bezierCurveTo(14, -12, 22, -2, 22, 6);
  ctx.quadraticCurveTo(22, 12, 15, 11);
  ctx.bezierCurveTo(8, 9, 4, 6, 2, 8);
  ctx.bezierCurveTo(2, 14, 6, 20, 8, 24);
  ctx.closePath();
  fillInk(ctx, coat, 2.4, 0.3, -0.3, -24, 24);
  // Crinière
  ctx.beginPath();
  ctx.moveTo(-1, -18);
  ctx.bezierCurveTo(-14, -12, -20, 4, -16, 24);
  ctx.lineTo(-12, 24);
  ctx.bezierCurveTo(-14, 6, -8, -8, 3, -15);
  ctx.closePath();
  fillInk(ctx, tone(coat, -0.55), 2);
  if (barding) {
    ctx.beginPath();
    poly(ctx, [2, -14, 12, -8, 21, 2, 18, 8, 8, 2, -2, -6]);
    fillInk(ctx, barding, 2, 0.4, -0.3, -14, 8);
    shine(ctx, 10, -5, 3, 1.4, 0.6, 0.6);
  }
  ctx.beginPath();
  ell(ctx, 7, -7, 2, 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.beginPath();
  ell(ctx, 18, 7, 1.6, 1.2);
  ctx.fill();
  ctx.restore();
}

export function gMail(ctx, x = 32, y = 34, s = 1, c = '#aab2ba', plate = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-10, -22);
  ctx.lineTo(-24, -14);
  ctx.lineTo(-20, 2);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-15, 22);
  ctx.lineTo(15, 22);
  ctx.lineTo(14, 0);
  ctx.lineTo(20, 2);
  ctx.lineTo(24, -14);
  ctx.lineTo(10, -22);
  ctx.quadraticCurveTo(0, -14, -10, -22);
  ctx.closePath();
  fillInk(ctx, c, 2.4, 0.35, -0.3, -22, 22);
  ctx.save();
  ctx.clip();
  if (plate) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-15, -20, 9, 42);
    ctx.strokeStyle = 'rgba(40,40,50,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const yy of [-6, 6]) {
      ctx.moveTo(-15, yy);
      ctx.quadraticCurveTo(0, yy + 4, 15, yy);
    }
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 22);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(40,44,52,0.55)';
    ctx.lineWidth = 1;
    for (let yy = -20, j = 0; yy < 24; yy += 3.2, j++) {
      ctx.beginPath();
      for (let xx = -26 + (j % 2) * 2; xx < 26; xx += 4) {
        ctx.moveTo(xx - 2, yy);
        ctx.quadraticCurveTo(xx, yy + 2.6, xx + 2, yy);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.restore();
}

export function gVest(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-9, -22);
  ctx.lineTo(-20, -14);
  ctx.lineTo(-16, 22);
  ctx.lineTo(16, 22);
  ctx.lineTo(20, -14);
  ctx.lineTo(9, -22);
  ctx.quadraticCurveTo(0, -12, -9, -22);
  ctx.closePath();
  fillInk(ctx, '#c8b088', 2.4, 0.25, -0.3, -22, 22);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(110,80,40,0.7)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let xx = -16; xx <= 16; xx += 5) {
    ctx.moveTo(xx, -20);
    ctx.lineTo(xx, 22);
  }
  ctx.stroke();
  ctx.restore();
  line(ctx, -16, 10, 16, 10, '#6a4222', 3);
  ctx.restore();
}

export function gSpur(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.quadraticCurveTo(-4, 16, 16, -4);
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#c0c8d0';
  ctx.stroke();
  bar(ctx, -2, 5, 8, 18, 3.6, '#b8c0c8');
  // Molette étoilée
  ctx.beginPath();
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const r = i % 2 ? 3 : 8;
    const a = (i / 12) * TAU;
    pts.push(10 + Math.cos(a) * r, 21 + Math.sin(a) * r);
  }
  poly(ctx, pts);
  fillInk(ctx, '#e8b93a', 2);
  ctx.restore();
}

export function gCastle(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  poly(ctx, [-24, 20, -24, -6, -18, -6, -18, -2, -12, -2, -12, -14, -6, -14, -6, -10, 0, -10, 0, -14, 6, -14, 6, -10, 12, -10, 12, -2, 18, -2, 18, -6, 24, -6, 24, 20]);
  fillInk(ctx, '#bdb6a6', 2.4, 0.25, -0.3, -14, 20);
  ctx.beginPath();
  poly(ctx, [-5, 20, -5, 8, 0, 3, 5, 8, 5, 20]);
  fillInk(ctx, '#4a3422', 2);
  ctx.restore();
}

export function gSkull(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-16, 2);
  ctx.bezierCurveTo(-18, -22, 18, -22, 16, 2);
  ctx.quadraticCurveTo(15, 8, 10, 9);
  ctx.lineTo(10, 16);
  ctx.lineTo(-10, 16);
  ctx.lineTo(-10, 9);
  ctx.quadraticCurveTo(-15, 8, -16, 2);
  ctx.closePath();
  fillInk(ctx, '#ece6d6', 2.4, 0.2, -0.25, -20, 16);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ell(ctx, -7, -2, 5, 5.5);
  ell(ctx, 7, -2, 5, 5.5);
  ctx.fill();
  ctx.beginPath();
  poly(ctx, [0, 3, -3, 9, 3, 9]);
  ctx.fill();
  ctx.fillRect(-5, 12, 2, 4);
  ctx.fillRect(3, 12, 2, 4);
  ctx.restore();
}
