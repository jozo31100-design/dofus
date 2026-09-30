// Icônes des technologies vikings (carré de 64 unités, mêmes conventions que icon-glyphs3.js) :
// vk_axe (unique du château), vk2a … vk4b (bonus d'âge). Enregistrées dans TECH_ART par icons.js (VIKINGS_TECH_ART).
import { TAU, PI, tone, rgba, capsule, ell, poly, line } from './unit-kit.js';
import { fillInk, shine, bar, gAxe, gSword, gShield, gGoldPile } from './icon-glyphs.js';

const INK = '#23170e';
const GOLDC = '#e8b93a';

function glow(g, c) {
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 28);
  gr.addColorStop(0, rgba(c, 0.8));
  gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
}

/** vk_axe : deux haches danoises croisées devant un bouclier rond. */
function gTwinAxes(g) {
  glow(g, '#6aa0ff');
  gShield(g, 32, 34, 19, '#b8322a');
  gAxe(g, 32, 34, -PI / 4 - 0.15, 1.05, '#e8eef4', '#6a4226');
  g.save();
  g.translate(64, 0);
  g.scale(-1, 1);
  gAxe(g, 32, 34, -PI / 4 - 0.15, 1.05, '#e8eef4', '#6a4226');
  g.restore();
}

/** vk2a : gouttes d'ambre polies et quelques pièces. */
function gAmber(g) {
  const drop = (x, y, s, rot) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(0, -17);
    g.bezierCurveTo(12, -4, 15, 4, 11, 11);
    g.bezierCurveTo(6, 19, -6, 19, -11, 11);
    g.bezierCurveTo(-15, 4, -12, -4, 0, -17);
    g.closePath();
    fillInk(g, '#e89a1c', 2.3, 0.5, -0.3, -17, 19);
    shine(g, -4, -2, 3, 6, 0.6, 0.4);
    g.fillStyle = 'rgba(120,50,0,0.45)';
    g.beginPath();
    ell(g, 3, 8, 3, 1.6, 0.4);
    g.fill();
    g.restore();
  };
  drop(24, 40, 1.05, -0.3);
  drop(42, 36, 0.8, 0.35);
  drop(32, 22, 0.7, 0.05);
  gGoldPile(g, 46, 54, 0.45);
}

/** vk2b : goutte de sang entre deux haches croisées (frères de sang). */
function gBloodBrothers(g) {
  gAxe(g, 32, 34, -PI / 4 - 0.25, 0.95, '#aab2bc', '#8a5a32');
  g.save();
  g.translate(64, 0);
  g.scale(-1, 1);
  gAxe(g, 32, 34, -PI / 4 - 0.25, 0.95, '#aab2bc', '#8a5a32');
  g.restore();
  g.beginPath();
  g.moveTo(32, 12);
  g.bezierCurveTo(44, 28, 47, 36, 42, 45);
  g.bezierCurveTo(37, 54, 27, 54, 22, 45);
  g.bezierCurveTo(17, 36, 20, 28, 32, 12);
  g.closePath();
  fillInk(g, '#c8232c', 2.5, 0.4, -0.3, 12, 54);
  shine(g, 27, 36, 2.6, 6, 0.6, 0.3);
}

/** vk3a : enclume nordique, épée fraîchement forgée et étincelles. */
function gNorthForge(g) {
  glow(g, '#ff9030');
  // enclume
  g.beginPath();
  g.moveTo(10, 36);
  g.lineTo(54, 36);
  g.quadraticCurveTo(58, 34, 60, 30);
  g.lineTo(46, 30);
  g.lineTo(18, 30);
  g.quadraticCurveTo(10, 30, 10, 36);
  g.closePath();
  fillInk(g, '#5b626c', 2.4, 0.4, -0.3, 28, 38);
  g.beginPath();
  poly(g, [20, 36, 46, 36, 42, 44, 40, 52, 48, 55, 16, 55, 24, 52, 26, 44]);
  fillInk(g, '#4a505a', 2.4, 0.3, -0.3, 36, 55);
  line(g, 14, 32, 48, 32, 'rgba(255,255,255,0.45)', 1.4);
  gSword(g, 22, 20, -0.12, 0.72, '#f6e6b8', '#c89a3e');
  // étincelles
  g.fillStyle = '#ffd860';
  for (const [x, y, r] of [[44, 18, 2.2], [52, 26, 1.6], [38, 12, 1.4], [56, 14, 1.2], [47, 8, 1.3]]) {
    g.beginPath();
    poly(g, [x, y - r * 2, x + r * 0.6, y - r * 0.6, x + r * 2, y, x + r * 0.6, y + r * 0.6, x, y + r * 2, x - r * 0.6, y + r * 0.6, x - r * 2, y, x - r * 0.6, y - r * 0.6]);
    g.fill();
  }
}

/** vk3b : proue de drakkar à tête de dragon sur les flots. */
function gDragonProw(g) {
  // vagues
  g.beginPath();
  g.moveTo(4, 46);
  for (let x = 4; x <= 60; x += 14) g.quadraticCurveTo(x + 7, 38, x + 14, 46);
  g.lineTo(60, 60);
  g.lineTo(4, 60);
  g.closePath();
  fillInk(g, '#2f7fc0', 2.2, 0.35, -0.3, 40, 60);
  // coque
  g.beginPath();
  g.moveTo(6, 44);
  g.quadraticCurveTo(28, 52, 44, 40);
  g.lineTo(40, 38);
  g.quadraticCurveTo(24, 46, 8, 38);
  g.closePath();
  fillInk(g, '#6a4527', 2.2, 0.3, -0.3, 38, 52);
  // cou du dragon (S) et tête
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(40, 42);
  g.bezierCurveTo(34, 30, 50, 28, 44, 14);
  g.strokeStyle = INK;
  g.lineWidth = 11;
  g.stroke();
  g.strokeStyle = '#4e3220';
  g.lineWidth = 7.4;
  g.stroke();
  g.strokeStyle = GOLDC;
  g.lineWidth = 1.6;
  g.setLineDash([2.4, 4]);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(38, 14);
  g.quadraticCurveTo(42, 4, 52, 6);
  g.quadraticCurveTo(58, 7, 61, 12);
  g.lineTo(54, 13);
  g.lineTo(60, 17);
  g.quadraticCurveTo(52, 19, 44, 18);
  g.closePath();
  fillInk(g, '#5e3c24', 2.2, 0.35, -0.3, 4, 19);
  g.beginPath();
  poly(g, [40, 7, 34, 2, 38, 10, 32, 10, 39, 13]);
  fillInk(g, GOLDC, 1.6);
  g.fillStyle = '#ffe07a';
  g.beginPath();
  ell(g, 45, 10, 2, 1.8);
  g.fill();
  g.fillStyle = '#b01818';
  g.beginPath();
  ell(g, 45.3, 10, 0.9, 0.9);
  g.fill();
  // boucliers au plat-bord
  for (const [x, c] of [[14, '#e0b53a'], [22, '#b8322a'], [30, '#1c1a18']]) {
    g.beginPath();
    ell(g, x, 42.5, 3.4, 3.4);
    fillInk(g, c, 1.6, 0.35, -0.3, 39, 46);
  }
}

/** vk4a : pierre runique du Thing entourée d'un cercle de pierres basses. */
function gThingStone(g) {
  for (const [x, y, w, h] of [[8, 44, 10, 9], [20, 50, 12, 8], [34, 51, 12, 8], [47, 47, 11, 9], [52, 38, 8, 8]]) {
    g.beginPath();
    g.moveTo(x, y + h);
    g.quadraticCurveTo(x - 1, y + 1, x + w * 0.5, y);
    g.quadraticCurveTo(x + w + 1, y + 1, x + w, y + h);
    g.closePath();
    fillInk(g, '#9a968c', 2, 0.35, -0.25, y, y + h);
  }
  g.beginPath();
  g.moveTo(21, 52);
  g.lineTo(23, 14);
  g.quadraticCurveTo(32, 4, 41, 14);
  g.lineTo(43, 52);
  g.closePath();
  fillInk(g, '#b4b0a4', 2.4, 0.4, -0.3, 6, 52);
  // runes rouges
  g.strokeStyle = '#b8282a';
  g.lineWidth = 2.3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(32, 16);
  g.lineTo(32, 46);
  g.moveTo(32, 20);
  g.lineTo(38, 26);
  g.lineTo(32, 32);
  g.moveTo(32, 34);
  g.lineTo(27, 39);
  g.lineTo(32, 44);
  g.moveTo(27, 22);
  g.lineTo(32, 28);
  g.stroke();
  shine(g, 27, 18, 2.2, 4, 0.5, -0.2);
}

/** vk4b : valknut doré (trois triangles entrelacés), nœud des guerriers tombés, sur un rayonnement. */
function gValknut(g) {
  glow(g, '#ffb040');
  const tri = (k, col, back) => {
    const a = -PI / 2 + (k * TAU) / 3;
    g.save();
    g.translate(32 + Math.cos(a) * 9.5, 36 + Math.sin(a) * 9.5);
    g.rotate(a + PI / 2);
    g.beginPath();
    const R = 17;
    g.moveTo(0, -R);
    g.lineTo(R * 0.866, R * 0.5);
    g.lineTo(-R * 0.866, R * 0.5);
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = back ? 9 : 8.4;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = back ? 5.2 : 5;
    g.strokeStyle = col;
    g.stroke();
    g.restore();
  };
  tri(0, '#f0c84a');
  tri(1, '#e8b93a');
  tri(2, '#d9a526');
  // entrelacs : la première branche repasse par-dessus la troisième
  g.save();
  g.beginPath();
  g.rect(18, 14, 14, 24);
  g.clip();
  tri(0, '#f0c84a');
  g.restore();
  void bar; void capsule; void tone;
}

export const VIKINGS_TECH_ART = {
  vk_axe: { cat: 'unique', draw: gTwinAxes },
  vk2a: { cat: 'unique', draw: gAmber },
  vk2b: { cat: 'unique', draw: gBloodBrothers },
  vk3a: { cat: 'unique', draw: gNorthForge },
  vk3b: { cat: 'unique', draw: gDragonProw },
  vk4a: { cat: 'unique', draw: gThingStone },
  vk4b: { cat: 'unique', draw: gValknut },
};

void PI;
