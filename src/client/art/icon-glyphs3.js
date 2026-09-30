// Pictogrammes de l'extension 2 (échelles, flèches enflammées, maçonnerie, âge impérial, bonus de choix, étoile,
// parchemin, murs, porte…), dessinés dans un carré de 64 unités comme icon-glyphs.js.
import { TAU, PI, tone, ell, poly } from './unit-kit.js';
import { fillInk, shine, bar, gShield, gTower, gSword, gAxe, gHammer, gPerson, gMail, gWheat, gHorseHead } from './icon-glyphs.js';
import { gCrown } from './icon-glyphs2.js';

const INK = '#23170e';
const STONE = '#b4ada0';
const WOODC = '#a8723e';

/** Étoile à n branches. */
export function gStar(g, x = 32, y = 32, R = 22, c = '#f2c640', inner = 0.46) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? R * inner : R;
    const a = -PI / 2 + (i * PI) / 5;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.beginPath();
  poly(g, pts);
  fillInk(g, c, 2.4, 0.4, -0.25, y - R, y + R);
  shine(g, x - R * 0.2, y - R * 0.25, R * 0.12, R * 0.22, 0.6, -0.4);
}

/** Flamme (trois langues). */
export function gFlame(g, x, y, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.moveTo(0, 10);
  g.bezierCurveTo(-10, 8, -11, -2, -5, -8);
  g.bezierCurveTo(-5, -2, -2, -2, -3, -10);
  g.bezierCurveTo(1, -14, 2, -20, 1, -24);
  g.bezierCurveTo(8, -18, 10, -12, 7, -4);
  g.bezierCurveTo(12, -4, 11, 8, 0, 10);
  g.closePath();
  fillInk(g, '#f0702a', 2, 0.35, -0.2, -24, 10);
  g.beginPath();
  g.moveTo(0, 8);
  g.bezierCurveTo(-5, 6, -5, 0, -1, -4);
  g.bezierCurveTo(0, -1, 3, -1, 4, -5);
  g.bezierCurveTo(7, 0, 6, 7, 0, 8);
  g.closePath();
  g.fillStyle = '#ffe070';
  g.fill();
  g.restore();
}

/** Échelle de bois inclinée (rails + barreaux). */
export function gLadder(g, x = 32, y = 32, s = 1, a = 0.32) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.scale(s, s);
  const hw = 10;
  const L = 29;
  for (const sx of [-hw, hw]) bar(g, sx, -L, sx, L, 5, sx < 0 ? '#b98351' : '#8f5e34');
  for (let yy = -21; yy <= 21; yy += 10.5) bar(g, -hw, yy, hw, yy, 3.6, '#d09a5e');
  g.restore();
}

/** Flèche enflammée. */
export function gFireArrow(g) {
  g.save();
  g.translate(25, 40);
  g.rotate(-PI / 4);
  bar(g, -22, 0, 24, 0, 3.4, '#d8b880');
  g.beginPath();
  poly(g, [22, -6, 38, 0, 22, 6, 26, 0]);
  fillInk(g, '#dfe6ee', 2, 0.3, -0.2, -6, 6);
  g.beginPath();
  poly(g, [-28, -7, -19, -7, -14, 0, -19, 7, -28, 7, -24, 0]);
  fillInk(g, '#e0493a', 1.8);
  g.restore();
  gFlame(g, 46, 18, 0.95);
}

function bricks(g, x0, y0, x1, y1, rows = 3, cols = 3, c = '#c4705a') {
  g.beginPath();
  poly(g, [x0, y0, x1, y0, x1, y1, x0, y1]);
  fillInk(g, c, 2.4, 0.22, -0.25, y0, y1);
  g.strokeStyle = 'rgba(60,25,15,0.65)';
  g.lineWidth = 1.6;
  g.beginPath();
  const rh = (y1 - y0) / rows;
  const cw = (x1 - x0) / cols;
  for (let r = 1; r < rows; r++) {
    g.moveTo(x0, y0 + r * rh);
    g.lineTo(x1, y0 + r * rh);
  }
  for (let r = 0; r < rows; r++) {
    for (let k = 1; k < cols; k++) {
      const xx = x0 + k * cw + (r % 2 ? cw * 0.5 : 0);
      if (xx < x1 - 1) {
        g.moveTo(xx, y0 + r * rh);
        g.lineTo(xx, y0 + (r + 1) * rh);
      }
    }
  }
  g.stroke();
}

/** Truelle posée sur un petit mur de briques. */
export function gTrowelWall(g) {
  bricks(g, 6, 38, 58, 58, 3, 4);
  g.save();
  g.translate(30, 20);
  g.rotate(0.75);
  bar(g, 0, -4, 0, 18, 4.5, '#8a5a32');
  g.beginPath();
  poly(g, [-9, -6, 9, -6, 0, -28]);
  fillInk(g, '#d8dee6', 2.2, 0.35, -0.2, -28, -6);
  g.restore();
}

/** Muraille crénelée avec une tour. */
function crenWall(g, x0, x1, yTop, yBot, c = STONE, n = 3) {
  const w = x1 - x0;
  const m = w / (n * 2 - 1);
  const pts = [x0, yBot, x0, yTop - 8];
  for (let i = 0; i < n; i++) {
    const a = x0 + i * 2 * m;
    pts.push(a, yTop - 8, a + m, yTop - 8);
    if (i < n - 1) pts.push(a + m, yTop, a + 2 * m, yTop);
  }
  pts.push(x1, yBot);
  g.beginPath();
  poly(g, pts);
  fillInk(g, c, 2.4, 0.22, -0.28, yTop - 8, yBot);
  g.strokeStyle = 'rgba(50,42,34,0.5)';
  g.lineWidth = 1.3;
  g.beginPath();
  for (let yy = yTop + 6; yy < yBot - 2; yy += 7) {
    g.moveTo(x0, yy);
    g.lineTo(x1, yy);
  }
  g.stroke();
}

export function gRampart(g) {
  gTower(g, 46, 32, 0.95);
  crenWall(g, 4, 34, 34, 56, STONE, 2);
  // trait de fondation
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(5, 54);
  g.lineTo(33, 54);
  g.stroke();
}

/** Couronne et rayons (âge impérial). */
export function gImperial(g) {
  g.save();
  g.translate(32, 34);
  for (let i = 0; i < 13; i++) {
    const a = PI + (i / 12) * PI;
    g.beginPath();
    g.moveTo(Math.cos(a - 0.07) * 14, Math.sin(a - 0.07) * 14);
    g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
    g.lineTo(Math.cos(a + 0.07) * 14, Math.sin(a + 0.07) * 14);
    g.closePath();
    g.fillStyle = i % 2 ? 'rgba(255,230,120,0.55)' : 'rgba(255,250,200,0.8)';
    g.fill();
  }
  g.restore();
  gCrown(g, 32, 38, 1.15);
}

// ---------------------------------------------------------------------------
// Bonus de choix gaulois
// ---------------------------------------------------------------------------

/** g2a : chêne sacré et hache. */
export function gOakAxe(g) {
  g.beginPath();
  poly(g, [25, 56, 28, 34, 34, 34, 37, 56]);
  fillInk(g, '#8a5a32', 2.2, 0.25, -0.3, 34, 56);
  for (const [x, y, r, c] of [[20, 26, 12, '#4f8a34'], [44, 26, 12, '#4f8a34'], [32, 15, 13, '#5f9e3c'], [32, 30, 13, '#56933a']]) {
    g.beginPath();
    ell(g, x, y, r, r * 0.92);
    fillInk(g, c, 2.2, 0.35, -0.25, y - r, y + r);
  }
  shine(g, 27, 12, 5, 3, 0.35);
  gAxe(g, 47, 50, -PI / 4 - 0.4, 0.62, '#c6ccd4', '#a8723e');
}

/** g2b : trois boucliers et une hache. */
export function gClans(g) {
  gAxe(g, 32, 32, PI / 4 + 0.0, 1.05, '#c6ccd4', '#a8723e');
  gShield(g, 19, 28, 13, '#3b72e8');
  gShield(g, 45, 28, 13, '#d84a3a');
  gShield(g, 32, 42, 15, '#e8b93a');
}

/** g3a : enclume et épée. */
export function gAnvilSword(g) {
  g.save();
  g.translate(32, 18);
  g.rotate(0.0);
  gSword(g, 0, 4, -PI / 4 - 0.25, 0.75, '#f0f4f8');
  g.restore();
  g.beginPath();
  poly(g, [6, 35, 54, 35, 58, 38, 50, 43, 42, 43, 40, 50, 46, 57, 18, 57, 24, 50, 22, 43, 14, 43]);
  fillInk(g, '#6f7882', 2.4, 0.35, -0.3, 35, 57);
  g.beginPath();
  poly(g, [9, 36, 52, 36, 54, 38, 10, 38]);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fill();
  g.fillStyle = '#ffd860';
  for (const [x, y] of [[14, 26], [50, 24], [44, 14], [20, 14]]) {
    g.beginPath();
    ell(g, x, y, 1.6, 1.6);
    g.fill();
  }
}

/** g3b : rempart de pierre à poutres (murus gallicus). */
export function gOppidum(g) {
  crenWall(g, 4, 60, 28, 57, STONE, 4);
  for (const yy of [35, 46]) {
    bar(g, 4, yy, 60, yy, 4.2, WOODC);
    g.fillStyle = tone('#d8a060', 0.1);
    for (let x = 10; x < 58; x += 12) {
      g.beginPath();
      ell(g, x, yy, 2.0, 2.0);
      g.fill();
    }
  }
}

/** g4a : grande assemblée autour du chaudron. */
export function gAssembly(g) {
  gPerson(g, 11, 40, 0.72, '#c8a878');
  gPerson(g, 53, 40, 0.72, '#b8c8a0');
  gPerson(g, 20, 34, 0.68, '#d8c8a8');
  gPerson(g, 44, 34, 0.68, '#e0b890');
  // bûches
  bar(g, 20, 58, 44, 50, 5, '#7a5230');
  bar(g, 20, 50, 44, 58, 5, '#8f633a');
  gFlame(g, 32, 28, 0.85);
  g.beginPath();
  g.moveTo(21, 36);
  g.bezierCurveTo(19, 52, 45, 52, 43, 36);
  g.closePath();
  fillInk(g, '#3a3c42', 2.4, 0.35, -0.3, 36, 50);
  g.beginPath();
  ell(g, 32, 36, 11.2, 3.2);
  fillInk(g, '#22242a', 2);
  g.beginPath();
  ell(g, 32, 36.3, 8.8, 1.8);
  g.fillStyle = '#e88a30';
  g.fill();
  shine(g, 26, 43, 2.5, 4, 0.3, 0.3);
}

/** g4b : tête de sanglier rugissant (Teutatès). */
export function gBoarRoar(g) {
  // crinière
  g.beginPath();
  poly(g, [10, 30, 6, 18, 15, 22, 16, 9, 23, 17, 28, 5, 32, 14, 38, 8, 40, 16]);
  fillInk(g, '#3a281a', 1.8);
  // mâchoire
  g.beginPath();
  g.moveTo(24, 40);
  g.bezierCurveTo(30, 54, 50, 56, 56, 42);
  g.lineTo(50, 38);
  g.closePath();
  fillInk(g, '#5e4028', 2.2, 0.3, -0.3, 38, 56);
  // bouche ouverte
  g.beginPath();
  g.moveTo(26, 38);
  g.quadraticCurveTo(40, 52, 54, 40);
  g.lineTo(50, 34);
  g.closePath();
  fillInk(g, '#b02820', 1.8);
  // crâne et groin
  g.beginPath();
  g.moveTo(8, 34);
  g.bezierCurveTo(8, 14, 30, 8, 44, 14);
  g.lineTo(58, 26);
  g.quadraticCurveTo(61, 34, 54, 36);
  g.bezierCurveTo(44, 38, 30, 40, 8, 34);
  fillInk(g, '#77543a', 2.4, 0.3, -0.3, 8, 40);
  g.beginPath();
  ell(g, 55, 28, 4.2, 3.4);
  fillInk(g, '#3a2a22', 1.6);
  // défenses
  for (const [x, y, dx] of [[47, 38, 3], [33, 40, -3]]) {
    g.beginPath();
    poly(g, [x - 2.2, y - 1, x + 2.2, y - 1, x + dx, y - 12]);
    fillInk(g, '#f6f0dc', 1.6, 0.1, -0.2, y - 12, y);
  }
  g.beginPath();
  poly(g, [22, 16, 26, 4, 32, 14]);
  fillInk(g, '#5a3c28', 2);
  g.beginPath();
  ell(g, 38, 22, 3.4, 3);
  g.fillStyle = '#ff3a1a';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(32, 15);
  g.lineTo(43, 19);
  g.stroke();
}

// ---------------------------------------------------------------------------
// Bonus de choix francs
// ---------------------------------------------------------------------------

/** f2a : gerbe de blé et sceau. */
export function gSealWheat(g) {
  gWheat(g, 26, 30, 1.15);
  g.beginPath();
  ell(g, 44, 44, 12, 12);
  fillInk(g, '#c83a2a', 2.4, 0.3, -0.3, 32, 56);
  g.beginPath();
  ell(g, 44, 44, 8.2, 8.2);
  g.strokeStyle = '#f2c860';
  g.lineWidth = 2.2;
  g.stroke();
  gStar(g, 44, 44, 5.2, '#f2d060');
  bar(g, 38, 54, 34, 62, 4, '#d8b868');
  bar(g, 50, 54, 54, 62, 4, '#c8a858');
}

/** f2b : tête de cheval et lance à fanion. */
export function gLeudes(g) {
  bar(g, 10, 60, 52, 6, 3.2, '#b98351');
  g.beginPath();
  g.moveTo(51, 7);
  g.quadraticCurveTo(58, 8, 62, 14);
  g.lineTo(58, 17);
  g.lineTo(60, 22);
  g.quadraticCurveTo(54, 20, 46, 18);
  g.closePath();
  fillInk(g, '#d84a3a', 2, 0.3, -0.25, 6, 22);
  gHorseHead(g, 30, 36, 1.0, '#6a4428', null);
}

/** f3a : cotte de mailles et marteau de forge. */
export function gCarolForge(g) {
  gMail(g, 28, 32, 1.0, '#c4ccd4', true);
  gHammer(g, 44, 44, -PI / 4 + 1.6, 0.85);
  g.fillStyle = '#ffd860';
  for (const [x, y] of [[50, 30], [56, 38], [54, 22]]) {
    g.beginPath();
    ell(g, x, y, 1.7, 1.7);
    g.fill();
  }
}

/** f3b : tour de guet et mur (marches). */
export function gMarches(g) {
  crenWall(g, 28, 60, 38, 57, STONE, 2);
  gTower(g, 22, 34, 0.98);
  // fanion
  bar(g, 22, 4, 22, 14, 2.4, '#8a5a32');
  g.beginPath();
  poly(g, [23, 4, 34, 7, 23, 11]);
  fillInk(g, '#d84a3a', 1.6);
}

/** f4a : couronne et globe. */
export function gEmpire(g) {
  // globe crucigère
  g.beginPath();
  ell(g, 32, 43, 15, 15);
  const gr = g.createRadialGradient(26, 36, 2, 32, 43, 17);
  gr.addColorStop(0, '#9cc8ff');
  gr.addColorStop(1, '#2f5ea8');
  g.fillStyle = gr;
  g.fill();
  g.save();
  g.beginPath();
  ell(g, 32, 43, 14.4, 14.4);
  g.clip();
  g.fillStyle = '#62a040';
  for (const [x, y, rx, ry] of [[26, 38, 6, 4], [38, 48, 7, 4], [24, 50, 4, 3]]) {
    g.beginPath();
    ell(g, x, y, rx, ry, 0.4);
    g.fill();
  }
  g.restore();
  g.beginPath();
  ell(g, 32, 43, 15, 15);
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.stroke();
  // bande d'or
  g.beginPath();
  ell(g, 32, 43, 15, 4.6);
  g.strokeStyle = '#f2c640';
  g.lineWidth = 2.4;
  g.stroke();
  shine(g, 26, 36, 3.6, 2.2, 0.55, -0.6);
  gCrown(g, 32, 20, 0.88);
}

/** f4b : douze épées en couronne. */
export function gTwelve(g) {
  g.save();
  g.translate(32, 32);
  for (let i = 0; i < 12; i++) {
    g.save();
    g.rotate((i / 12) * TAU);
    g.beginPath();
    poly(g, [-2.2, -15, 2.2, -15, 0, -31]);
    fillInk(g, '#e4eaf0', 1.7, 0.3, -0.2, -31, -15);
    g.beginPath();
    g.moveTo(-4.5, -14);
    g.lineTo(4.5, -14);
    g.lineWidth = 2.6;
    g.strokeStyle = INK;
    g.stroke();
    g.strokeStyle = '#e8b93a';
    g.lineWidth = 1.2;
    g.stroke();
    g.restore();
  }
  g.restore();
  g.beginPath();
  ell(g, 32, 32, 13.5, 13.5);
  fillInk(g, '#3a2a6a', 2, 0.3, -0.3, 18, 46);
  gCrown(g, 32, 34, 0.6);
}

// ---------------------------------------------------------------------------
// Icônes génériques
// ---------------------------------------------------------------------------

/** Parchemin enroulé portant une étoile (choix). */
export function gScrollStar(g) {
  g.beginPath();
  poly(g, [14, 12, 50, 12, 50, 52, 14, 52]);
  fillInk(g, '#ecdcae', 2.4, 0.25, -0.2, 12, 52);
  for (const yy of [12, 52]) {
    g.beginPath();
    g.moveTo(8, yy);
    g.lineTo(56, yy);
    g.lineWidth = 9 * 1;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 5.4;
    g.strokeStyle = '#c89a52';
    g.stroke();
    g.beginPath();
    ell(g, 8, yy, 2.6, 4.6);
    ell(g, 56, yy, 2.6, 4.6);
    fillInk(g, '#a87a3a', 1.6);
  }
  g.strokeStyle = 'rgba(110,80,40,0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(21, 20);
  g.lineTo(43, 20);
  g.moveTo(21, 45);
  g.lineTo(43, 45);
  g.stroke();
  gStar(g, 32, 32, 11.5, '#e8a820');
}

/** Pan de mur de pierre crénelé. */
export function gWallIcon(g) {
  crenWall(g, 5, 59, 24, 54, STONE, 4);
  g.strokeStyle = 'rgba(50,42,34,0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let r = 0; r < 4; r++) {
    for (let x = 10 + (r % 2) * 7; x < 58; x += 14) {
      g.moveTo(x, 30 + r * 7);
      g.lineTo(x, 37 + r * 7);
    }
  }
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.fillRect(6, 24, 52, 2.5);
}

/** Porte fortifiée : arche sombre et herse. */
export function gGateIcon(g) {
  crenWall(g, 4, 60, 18, 57, STONE, 4);
  g.beginPath();
  g.moveTo(20, 57);
  g.lineTo(20, 36);
  g.quadraticCurveTo(20, 24, 32, 24);
  g.quadraticCurveTo(44, 24, 44, 36);
  g.lineTo(44, 57);
  g.closePath();
  fillInk(g, '#2e2620', 2.4, 0.1, -0.1, 24, 57);
  g.strokeStyle = '#8a929c';
  g.lineWidth = 2.4;
  g.beginPath();
  for (const x of [24.5, 29, 35, 39.5]) {
    g.moveTo(x, 26);
    g.lineTo(x, 57);
  }
  for (const y of [33, 42, 50]) {
    g.moveTo(21, y);
    g.lineTo(43, y);
  }
  g.stroke();
}

/** Icône d'unité spéciale : bouclier orné d'une étoile et d'un ruban. */
export function gSpecialUnit(g) {
  gShield(g, 32, 31, 22, '#3b72e8');
  gStar(g, 32, 31, 11, '#f6d050');
  g.beginPath();
  poly(g, [20, 50, 28, 52, 24, 62, 20, 57, 14, 59]);
  fillInk(g, '#d84a3a', 1.8);
  g.beginPath();
  poly(g, [44, 50, 36, 52, 40, 62, 44, 57, 50, 59]);
  fillInk(g, '#d84a3a', 1.8);
}

/** Colonnade et fronton (monuments et savoir). */
export function gForum(g, x = 28, y = 34, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  poly(g, [-22, -8, 0, -24, 22, -8]);
  fillInk(g, '#d8d0bc', 2.4, 0.3, -0.2, -24, -8);
  g.beginPath();
  poly(g, [-20, -8, 20, -8, 20, -3, -20, -3]);
  fillInk(g, '#c4bca8', 2, 0.25, -0.2, -8, -3);
  for (const cx of [-14, -5, 5, 14]) {
    g.beginPath();
    poly(g, [cx - 2.6, -3, cx + 2.6, -3, cx + 2.2, 18, cx - 2.2, 18]);
    fillInk(g, '#e4dcc8', 1.8, 0.3, -0.25, -3, 18);
  }
  g.beginPath();
  poly(g, [-22, 18, 22, 18, 22, 23, -22, 23]);
  fillInk(g, '#b4ac98', 2, 0.25, -0.2, 18, 23);
  ell(g, 0, -13, 2.4, 2.4);
  g.fillStyle = '#e8b93a';
  g.fill();
  g.restore();
}

/** Parchemin à trois sceaux (choix d'âge). */
export function gChoices(g) {
  g.beginPath();
  poly(g, [12, 8, 52, 8, 52, 44, 12, 44]);
  fillInk(g, '#ecdcae', 2.4, 0.25, -0.2, 8, 44);
  for (const yy of [8, 44]) {
    bar(g, 7, yy, 57, yy, 6, '#c89a52');
  }
  g.strokeStyle = 'rgba(110,80,40,0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(19, 17);
  g.lineTo(45, 17);
  g.moveTo(19, 24);
  g.lineTo(40, 24);
  g.stroke();
  gStar(g, 32, 32, 7.5, '#e8a820');
  for (const [x, c] of [[16, '#3b72e8'], [32, '#d83a2a'], [48, '#e8b93a']]) {
    g.beginPath();
    ell(g, x, 54, 7, 7);
    fillInk(g, c, 2.2, 0.3, -0.3, 47, 61);
    shine(g, x - 2, 51.5, 2, 1.4, 0.6, -0.5);
  }
}

/** Échelle posée contre un pan de mur (action « escalader »). */
export function gClimbIcon(g) {
  g.beginPath();
  poly(g, [36, 6, 60, 6, 60, 58, 36, 58]);
  fillInk(g, STONE, 2.4, 0.2, -0.28, 6, 58);
  g.strokeStyle = 'rgba(50,42,34,0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let yy = 16; yy < 58; yy += 10) {
    g.moveTo(37, yy);
    g.lineTo(59, yy);
  }
  g.stroke();
  gLadder(g, 26, 34, 1.0, 0.22);
}
