// Icônes des technologies spartiates (carré de 64 unités, même conventions que icon-glyphs3.js) : sp_agoge (unique),
// sp2a … sp4b (bonus d'âge). Enregistrées dans TECH_ART par icons.js.
import { TAU, PI, ell, poly } from './unit-kit.js';
import { fillInk, shine, bar, gSword, gWheat, gMail, gPick } from './icon-glyphs.js';
import { gCrown } from './icon-glyphs2.js';
import { gStar } from './icon-glyphs3.js';

const BRZ = '#c9a04a';
const RED = '#c22a2c';

/** Hoplon au lambda. */
function gHoplon(g, x = 32, y = 34, r = 19, face = '#b8322a') {
  g.beginPath();
  ell(g, x, y, r, r);
  fillInk(g, BRZ, 2.4, 0.4, -0.3, y - r, y + r);
  g.beginPath();
  ell(g, x, y, r - 4, r - 4);
  fillInk(g, face, 1.6, 0.35, -0.3, y - r, y + r);
  g.strokeStyle = '#f4ead0';
  g.lineWidth = 4.4;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x - 6, y + 9);
  g.lineTo(x, y - 9);
  g.lineTo(x + 7, y + 9);
  g.stroke();
  g.lineCap = 'butt';
  shine(g, x - r * 0.4, y - r * 0.45, r * 0.2, r * 0.12, 0.5, -0.6);
}

/** Casque corinthien à crinière. */
function gCorinth(g, x = 32, y = 34, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.moveTo(-6, -22);
  g.quadraticCurveTo(-2, -30, 6, -26);
  g.quadraticCurveTo(18, -20, 20, -6);
  g.lineTo(-18, -10);
  g.quadraticCurveTo(-14, -22, -6, -22);
  g.closePath();
  fillInk(g, RED, 2, 0.3, -0.25, -30, -6);
  g.beginPath();
  g.moveTo(-17, 22);
  g.bezierCurveTo(-24, 4, -20, -14, -4, -18);
  g.bezierCurveTo(10, -20, 18, -10, 17, 2);
  g.lineTo(17, 8);
  g.quadraticCurveTo(15, 22, 8, 24);
  g.quadraticCurveTo(-2, 24, -5, 14);
  g.quadraticCurveTo(-12, 14, -17, 22);
  g.closePath();
  fillInk(g, BRZ, 2.4, 0.45, -0.3, -18, 24);
  g.beginPath();
  poly(g, [5, -3, 14, -4, 14, 2, 5, 2]);
  g.fillStyle = '#20140c';
  g.fill();
  shine(g, -8, -10, 3, 7, 0.55, -0.3);
  g.restore();
}

function gSpear(g, x1, y1, x2, y2) {
  bar(g, x1, y1, x2, y2, 3.2, '#a8723e');
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.save();
  g.translate(x2, y2);
  g.rotate(a);
  g.beginPath();
  g.moveTo(-1, 0);
  g.quadraticCurveTo(4, -5, 12, 0);
  g.quadraticCurveTo(4, 5, -1, 0);
  fillInk(g, '#d6b25a', 1.6, 0.3, -0.2, -5, 5);
  g.restore();
}

function gMountain(g, x = 32, y = 38) {
  g.beginPath();
  poly(g, [x - 26, y + 14, x - 8, y - 14, x, y - 4, x + 10, y - 20, x + 27, y + 14]);
  fillInk(g, '#8b8478', 2.4, 0.35, -0.3, y - 20, y + 14);
  g.beginPath();
  poly(g, [x + 10, y - 20, x + 4, y - 8, x + 9, y - 10, x + 13, y - 6, x + 15, y - 12]);
  g.fillStyle = '#f2f0ea';
  g.fill();
}

export const SPARTA_TECH_ART = {
  sp_agoge: { cat: 'unique', draw: (g) => gHoplon(g, 32, 34, 20, '#b8322a') },
  sp2a: { cat: 'unique', draw: (g) => { gWheat(g, 26, 32, 1.05); bar(g, 40, 50, 48, 18, 3, '#7a5a38'); g.beginPath(); g.arc(44, 18, 9, PI * 1.1, PI * 2.0); g.lineWidth = 3.6; g.strokeStyle = '#23170e'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#d8dee6'; g.stroke(); } },
  sp2b: { cat: 'unique', draw: (g) => { gSword(g, 34, 36, -PI / 4, 1.0, '#e0e6ee', '#d8b44a'); gStar(g, 18, 18, 9, '#f2c640'); } },
  sp3a: { cat: 'unique', draw: (g) => gMail(g, 32, 34, 1.05, '#c9a04a', true) },
  sp3b: { cat: 'unique', draw: (g) => { gMountain(g, 32, 38); gPick(g, 44, 46, -PI / 4, 0.8, '#c8ced6'); } },
  sp4a: { cat: 'unique', draw: (g) => { gSpear(g, 12, 54, 32, 10); gSpear(g, 52, 54, 32, 10); gSpear(g, 32, 56, 32, 8); gCorinth(g, 32, 36, 0.75); } },
  sp4b: { cat: 'unique', draw: (g) => { gHoplon(g, 32, 38, 15, '#b8322a'); gCrown(g, 32, 14, 0.8); } },
};
void TAU;
