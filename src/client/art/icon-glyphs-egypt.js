// Pictogrammes des technologies égyptiennes (carré de 64 unités, cf. icon-glyphs3.js) : arcs composites, crue du Nil,
// levée d'archers, chars renforcés, maîtres bâtisseurs, double couronne, faveur de Râ (disque solaire ailé).
// Exporte EGYPT_TECH_ART : { idTech: { cat, draw(g) } }, fusionné dans TECH_ART de icons.js.
import { TAU, PI, ell, poly, capsule, line } from './unit-kit.js';
import { fillInk, shine, bar, gWheat, gArrow } from './icon-glyphs.js';

const INK = '#23170e';
const GOLD = '#f0c23c';
const LAPIS = '#2d55a8';
const TURQ = '#2fa8a0';
const RED = '#c4402e';

function glow(g, c, r = 26) {
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, r);
  gr.addColorStop(0, c);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
}

/** Flèche à penne turquoise, inclinée de a autour de (x, y). */
function arrow(g, x, y, a, L = 1, fletch = TURQ) {
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.scale(L, L);
  line(g, -22, 0, 20, 0, INK, 4.4);
  line(g, -22, 0, 20, 0, '#dcc08a', 2.2);
  g.beginPath();
  poly(g, [14, -5, 29, 0, 14, 5, 18, 0]);
  fillInk(g, '#dfe6ee', 1.8);
  for (const s of [-1, 1]) {
    g.beginPath();
    poly(g, [-24, 0, -19, s * 6, -12, s * 6, -15, 0]);
    fillInk(g, fletch, 1.6);
  }
  g.restore();
}

/** Arc composite à double courbure (recourbé aux extrémités), corde tendue. */
function compositeBow(g, x, y, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  const path = () => {
    g.beginPath();
    g.moveTo(-6, -27);
    g.bezierCurveTo(4, -24, 10, -18, 9, -8);
    g.bezierCurveTo(8, -3, 12, -2, 12, 0);
    g.bezierCurveTo(12, 2, 8, 3, 9, 8);
    g.bezierCurveTo(10, 18, 4, 24, -6, 27);
  };
  path();
  g.strokeStyle = INK;
  g.lineWidth = 7.4;
  g.lineCap = 'round';
  g.stroke();
  path();
  g.strokeStyle = '#8a5a32';
  g.lineWidth = 4.6;
  g.stroke();
  path();
  g.strokeStyle = 'rgba(255,220,150,0.6)';
  g.lineWidth = 1.2;
  g.stroke();
  // poignée dorée
  g.beginPath();
  capsule(g, 11, -4, 2.6, 11, 4, 2.6);
  fillInk(g, GOLD, 1.8);
  line(g, -6, -27, -6, 27, INK, 2.2);
  line(g, -6, -27, -6, 27, '#f4ecd0', 0.9);
  g.restore();
}

function waves(g, y, c, amp = 3, w = 3) {
  g.beginPath();
  g.moveTo(6, y);
  for (let x = 6; x < 58; x += 13) g.quadraticCurveTo(x + 3.25, y - amp, x + 6.5, y), g.quadraticCurveTo(x + 9.75, y + amp, x + 13, y);
  g.strokeStyle = INK;
  g.lineWidth = w + 2.4;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = c;
  g.lineWidth = w;
  g.stroke();
}

// ---------------------------------------------------------------------------

/** Arcs composites : arc de corne et de bois, flèche encochée, lueur d'or. */
function gCompositeBows(g) {
  glow(g, 'rgba(255,214,90,0.7)');
  compositeBow(g, 26, 32, 0.95, 0);
  arrow(g, 34, 32, 0, 0.62);
}

/** Crue du Nil : soleil, limon, eaux qui montent et blé. */
function gNileFlood(g) {
  g.beginPath();
  ell(g, 44, 18, 8, 8);
  fillInk(g, '#f2b233', 2, 0.35, -0.2, 10, 26);
  g.beginPath();
  poly(g, [6, 40, 58, 40, 58, 56, 6, 56]);
  fillInk(g, '#8a6a3a', 2, 0.2, -0.2, 40, 56);
  gWheat(g, 24, 30, 0.95);
  waves(g, 44, '#4aa0d0', 3.4, 4);
  waves(g, 52, '#2a78b0', 3.2, 4);
  shine(g, 48, 16, 2.4, 3.2, 0.7, 0.5);
}

/** Levée d'archers : carquois de cuir, faisceau de flèches et pièce de bois. */
function gArcherLevy(g) {
  g.save();
  g.translate(32, 34);
  g.rotate(0.22);
  for (const [dx, dy, r] of [[-7, -1, -0.12], [0, -3, 0.0], [7, -1, 0.12]]) {
    g.save();
    g.translate(dx, dy);
    g.rotate(r);
    line(g, 0, -22, 0, 4, INK, 4);
    line(g, 0, -22, 0, 4, '#dcc08a', 1.9);
    g.beginPath();
    poly(g, [-3, -22, 0, -29, 3, -22]);
    fillInk(g, '#dfe6ee', 1.6);
    g.beginPath();
    poly(g, [-4, -4, 0, -10, 4, -4, 0, 4]);
    fillInk(g, dx === 0 ? RED : TURQ, 1.4);
    g.restore();
  }
  // corps du carquois
  g.beginPath();
  g.moveTo(-11, -6);
  g.lineTo(11, -6);
  g.lineTo(9, 26);
  g.quadraticCurveTo(0, 30, -9, 26);
  g.closePath();
  fillInk(g, '#8a5a32', 2.2, 0.25, -0.3, -6, 30);
  g.beginPath();
  poly(g, [-11, 2, 11, 2, 10.6, 7, -10.8, 7]);
  fillInk(g, GOLD, 1.6);
  g.beginPath();
  poly(g, [-9.6, 14, 9.6, 14, 9.2, 18, -9.4, 18]);
  fillInk(g, LAPIS, 1.4);
  g.restore();
  shine(g, 26, 22, 2, 7, 0.4, 0.2);
}

/** Chars renforcés : roue à six rayons cerclée d'or devant une plaque de bronze. */
function gChariotWheel(g) {
  g.beginPath();
  ell(g, 32, 33, 23, 23);
  fillInk(g, '#8a5a32', 3.4, 0.3, -0.3, 10, 56);
  g.beginPath();
  ell(g, 32, 33, 18.5, 18.5);
  g.strokeStyle = GOLD;
  g.lineWidth = 3;
  g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6 + 0.3;
    bar(g, 32, 33, 32 + Math.cos(a) * 18, 33 + Math.sin(a) * 18, 4.4, '#c9965a');
  }
  g.beginPath();
  ell(g, 32, 33, 6.4, 6.4);
  fillInk(g, GOLD, 2.2, 0.4, -0.2, 26, 40);
  g.beginPath();
  ell(g, 32, 33, 2.2, 2.2);
  fillInk(g, '#7a4a10', 1.2);
  shine(g, 22, 22, 4, 2.4, 0.5, -0.6);
}

/** Maîtres bâtisseurs : pyramide, équerre et fil à plomb. */
function gBuilders(g) {
  g.beginPath();
  poly(g, [32, 10, 56, 46, 8, 46]);
  fillInk(g, '#e6cc8c', 2.4, 0.3, -0.2, 10, 46);
  g.beginPath();
  poly(g, [32, 10, 56, 46, 36, 46]);
  fillInk(g, '#c4a460', 2.2, 0.15, -0.25, 10, 46);
  g.strokeStyle = 'rgba(120,90,40,0.55)';
  g.lineWidth = 1;
  for (const y of [21, 28, 35, 41]) {
    const f = (y - 10) / 36;
    g.beginPath();
    g.moveTo(32 - 24 * f, y);
    g.lineTo(32 + 24 * f, y);
    g.stroke();
  }
  g.beginPath();
  poly(g, [29, 10, 32, 3, 35, 10]);
  fillInk(g, GOLD, 1.8);
  // équerre de maçon
  g.beginPath();
  poly(g, [8, 30, 12, 30, 12, 52, 34, 52, 34, 56, 8, 56]);
  fillInk(g, '#b98351', 2, 0.3, -0.25, 30, 56);
  // fil à plomb
  line(g, 48, 34, 48, 50, INK, 2.6);
  line(g, 48, 34, 48, 50, '#f4ecd0', 1);
  g.beginPath();
  poly(g, [48, 58, 44, 50, 52, 50]);
  fillInk(g, '#9aa2ac', 1.8);
}

/** Double couronne (pschent) : cône blanc dans la coupe rouge, uræus d'or. */
function gDoubleCrown(g) {
  glow(g, 'rgba(255,214,90,0.6)', 28);
  g.beginPath();
  g.moveTo(14, 52);
  g.lineTo(12, 30);
  g.quadraticCurveTo(14, 22, 24, 22);
  g.lineTo(24, 14);
  g.lineTo(28, 14);
  g.quadraticCurveTo(34, 24, 50, 28);
  g.quadraticCurveTo(52, 40, 50, 52);
  g.quadraticCurveTo(32, 58, 14, 52);
  g.closePath();
  fillInk(g, RED, 2.4, 0.3, -0.3, 14, 56);
  g.beginPath();
  g.moveTo(24, 44);
  g.quadraticCurveTo(22, 28, 28, 14);
  g.quadraticCurveTo(32, 4, 36, 14);
  g.quadraticCurveTo(40, 30, 42, 44);
  g.closePath();
  fillInk(g, '#f6f2e4', 2.4, 0.2, -0.22, 4, 44);
  g.beginPath();
  g.moveTo(49, 29);
  g.quadraticCurveTo(58, 26, 55, 17);
  g.strokeStyle = INK;
  g.lineWidth = 3.4;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = RED;
  g.lineWidth = 1.6;
  g.stroke();
  // uræus au front
  g.beginPath();
  g.moveTo(45, 50);
  g.bezierCurveTo(42, 40, 46, 34, 50, 34);
  g.bezierCurveTo(54, 34, 54, 40, 51, 42);
  g.bezierCurveTo(52, 46, 52, 48, 51, 52);
  g.closePath();
  fillInk(g, GOLD, 1.8);
  shine(g, 22, 34, 2.2, 6, 0.4, 0.1);
}

/** Faveur de Râ : disque solaire rouge, rayons, ailes d'or et de lapis. */
function gRaWings(g) {
  glow(g, 'rgba(255,190,70,0.85)', 30);
  for (const d of [-1, 1]) {
    [[GOLD, 0, 27, -6, 7], [LAPIS, 5, 23, 1, 6.4], [TURQ, 10, 19, 8, 5.6]].forEach(([c, oy, L, ey, w]) => {
      g.beginPath();
      g.moveTo(32 + d * 7, 30 + oy);
      g.quadraticCurveTo(32 + d * L * 0.6, 24 + oy + ey * 0.4, 32 + d * L, 27 + ey);
      g.lineTo(32 + d * (L - 3.4), 27 + ey + w);
      g.quadraticCurveTo(32 + d * L * 0.5, 34 + oy + w * 0.3, 32 + d * 7, 35 + oy);
      g.closePath();
      fillInk(g, c, 1.8, 0.3, -0.2, 14, 50);
    });
  }
  g.beginPath();
  ell(g, 32, 28, 10, 10);
  fillInk(g, '#e8452c', 2.4, 0.3, -0.25, 18, 38);
  g.beginPath();
  ell(g, 32, 28, 5, 5);
  g.fillStyle = '#ffe27a';
  g.fill();
  for (const d of [-1, 1]) {
    g.beginPath();
    g.moveTo(32 + d * 10, 34);
    g.quadraticCurveTo(32 + d * 16, 32, 32 + d * 14, 42);
    g.quadraticCurveTo(32 + d * 12, 39, 32 + d * 9, 37);
    g.closePath();
    fillInk(g, '#d8452c', 1.4);
  }
  shine(g, 28, 24, 2.6, 2, 0.6, -0.5);
}

export const EGYPT_TECH_ART = {
  eg_arcs_composites: { cat: 'unique', draw: (g) => gCompositeBows(g) },
  eg2a: { cat: 'unique', draw: (g) => gNileFlood(g) },
  eg2b: { cat: 'unique', draw: (g) => gArcherLevy(g) },
  eg3a: { cat: 'unique', draw: (g) => gChariotWheel(g) },
  eg3b: { cat: 'unique', draw: (g) => gBuilders(g) },
  eg4a: { cat: 'unique', draw: (g) => gDoubleCrown(g) },
  eg4b: { cat: 'unique', draw: (g) => gRaWings(g) },
};

void [PI, gArrow];
