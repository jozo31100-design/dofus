// Pictogrammes supplémentaires (port, marché, académie, héros) : même style que icon-glyphs.js
// (formes pleines, contour sombre, dégradés doux, reflets), dessinés dans un carré de 64 × 64 unités.
import { TAU, PI, tone, rgba, capsule, ell, poly, line } from './unit-kit.js';
import { fillInk, shine, bar, gWheat, gMeat, gBerries, gLogs, gStones, gGoldPile } from './icon-glyphs.js';

const INK = '#23170e';

// ---------------------------------------------------------------------------
// Poisson, pièce, couronne, navire, heaume
// ---------------------------------------------------------------------------

/** Poisson argenté vu de profil, tête à droite (~56 unités de long à l'échelle 1). */
export function gFish(ctx, x = 32, y = 32, s = 1, rot = 0, body = '#b4cfe0') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // Queue en éventail et nageoires
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-30, -13);
  ctx.quadraticCurveTo(-24, 0, -30, 13);
  ctx.closePath();
  fillInk(ctx, '#6f95b0', 2.2, 0.3, -0.3, -13, 13);
  ctx.beginPath();
  poly(ctx, [-6, -11, 2, -21, 12, -11]);
  fillInk(ctx, '#5b84a2', 2, 0.3, -0.3, -21, -10);
  ctx.beginPath();
  poly(ctx, [-2, 10, 3, 18, 10, 10]);
  fillInk(ctx, '#7ea0b8', 1.8);
  // Corps
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(26, 1);
    ctx.bezierCurveTo(20, -16, -2, -17, -18, -3);
    ctx.lineTo(-18, 3);
    ctx.bezierCurveTo(-2, 17, 18, 16, 26, 1);
    ctx.closePath();
  };
  bodyPath();
  fillInk(ctx, body, 2.4, 0.4, -0.2, -17, 17);
  // Dos bleu sombre (bande sur le haut du corps)
  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(30, -2);
  ctx.bezierCurveTo(16, -6, -2, -8, -20, -1);
  ctx.lineTo(-20, -20);
  ctx.lineTo(30, -20);
  ctx.closePath();
  ctx.fillStyle = 'rgba(44,88,124,0.75)';
  ctx.fill();
  // Ventre clair
  ctx.beginPath();
  ell(ctx, 4, 12, 20, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  // Écailles
  ctx.strokeStyle = 'rgba(40,80,110,0.4)';
  ctx.lineWidth = 1.1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.beginPath();
      ctx.arc(-10 + c * 6 + (r % 2) * 3, 0 + r * 4, 3, -0.5, 1.9);
      ctx.stroke();
    }
  }
  ctx.restore();
  bodyPath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // Ouïe, œil et reflet
  ctx.beginPath();
  ctx.moveTo(13, -9);
  ctx.quadraticCurveTo(9, 0, 13, 9);
  ctx.strokeStyle = 'rgba(30,60,90,0.8)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, 19, -3.5, 3.4, 3.4);
  fillInk(ctx, '#ffffff', 1.4, 0, 0);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ell(ctx, 19.6, -3.5, 1.7, 1.7);
  ctx.fill();
  shine(ctx, -3, -8, 8, 1.8, 0.7, -0.1);
  ctx.restore();
}

/** Pièce d'or de face avec la tranche visible (rayon r). */
export function gCoin(ctx, x = 32, y = 32, s = 1, r = 20) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Tranche
  ctx.beginPath();
  ell(ctx, 1.8, 2.6, r, r);
  fillInk(ctx, '#b0781a', 2.4, 0.1, -0.35, -r, r + 3);
  // Face
  ctx.beginPath();
  ell(ctx, 0, 0, r, r);
  fillInk(ctx, '#f4cc4c', 2.4, 0.5, -0.28, -r, r);
  ctx.beginPath();
  ell(ctx, 0, 0, r * 0.73, r * 0.73);
  ctx.strokeStyle = 'rgba(150,96,10,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Rosace au centre (étoile à huit branches)
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 ? r * 0.2 : r * 0.5;
    const a = (i / 16) * TAU - PI / 2;
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.beginPath();
  poly(ctx, pts);
  ctx.fillStyle = '#d6a12a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,76,8,0.9)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, 0, 0, r * 0.14, r * 0.14);
  ctx.fillStyle = '#fff0a8';
  ctx.fill();
  // Reflet
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, PI * 1.02, PI * 1.55);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.restore();
}

/** Couronne d'or à cinq fleurons, pierres rouges et bleues. */
export function gCrown(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Bonnet de velours rouge entre les pointes
  ctx.beginPath();
  ctx.moveTo(-17, 6);
  ctx.quadraticCurveTo(-18, -12, 0, -14);
  ctx.quadraticCurveTo(18, -12, 17, 6);
  ctx.closePath();
  fillInk(ctx, '#b02a30', 2, 0.25, -0.3, -14, 6);
  // Couronne
  ctx.beginPath();
  poly(ctx, [-24, 16, -27, -11, -14, 0, -8, -20, 0, -4, 8, -20, 14, 0, 27, -11, 24, 16]);
  fillInk(ctx, '#f0c24a', 2.6, 0.5, -0.3, -20, 16);
  // Bandeau et gemmes
  ctx.beginPath();
  poly(ctx, [-24, 6, 24, 6, 24, 17, -24, 17]);
  fillInk(ctx, '#d9a02e', 2.4, 0.4, -0.3, 6, 17);
  for (const [gx, col] of [[-14, '#d83a4a'], [0, '#3a78e0'], [14, '#d83a4a']]) {
    ctx.beginPath();
    ell(ctx, gx, 11.5, 3.4, 3.4);
    fillInk(ctx, col, 1.6, 0.45, -0.2, 8, 15);
    shine(ctx, gx - 1, 10.3, 1, 1, 0.9);
  }
  // Boules aux pointes
  for (const [bx, by] of [[-27, -13], [-8, -22], [8, -22], [27, -13]]) {
    ctx.beginPath();
    ell(ctx, bx, by, 3.6, 3.6);
    fillInk(ctx, '#fff2b8', 1.8, 0.2, -0.25, by - 4, by + 4);
  }
  shine(ctx, -18, 0, 5, 1.6, 0.6, -0.9);
  ctx.restore();
}

/** Voilier à voile carrée rayée, flamme et vagues. */
export function gShip(ctx, x = 32, y = 34, s = 1, sail = '#c83a2a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Coque effilée à haute étrave
  ctx.beginPath();
  ctx.moveTo(-30, 2);
  ctx.quadraticCurveTo(-24, 18, -6, 19);
  ctx.lineTo(12, 19);
  ctx.quadraticCurveTo(26, 15, 32, -6);
  ctx.quadraticCurveTo(24, 2, 14, 3);
  ctx.closePath();
  fillInk(ctx, '#a87848', 2.6, 0.25, -0.35, -6, 19);
  ctx.beginPath();
  ctx.moveTo(-27, 5);
  ctx.quadraticCurveTo(-4, 9, 27, 3);
  ctx.strokeStyle = 'rgba(60,34,14,0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Boucliers le long du bord
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ell(ctx, -18 + i * 9, 11, 3.6, 3.6);
    fillInk(ctx, i % 2 ? '#f0e4c4' : sail, 1.6, 0.3, -0.25, 7, 15);
  }
  // Mât, vergue et voile
  bar(ctx, 0, 5, 0, -30, 3.6, '#7a5030');
  ctx.beginPath();
  ctx.moveTo(-19, -26);
  ctx.lineTo(19, -26);
  ctx.quadraticCurveTo(24, -12, 17, 0);
  ctx.lineTo(-17, 0);
  ctx.quadraticCurveTo(-24, -12, -19, -26);
  ctx.closePath();
  fillInk(ctx, '#f0e4c4', 2.6, 0.25, -0.2, -26, 0);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = sail;
  for (let i = 0; i < 5; i += 2) ctx.fillRect(-24 + i * 9.6, -30, 9.6, 34);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-19, -26);
  ctx.lineTo(19, -26);
  ctx.quadraticCurveTo(24, -12, 17, 0);
  ctx.lineTo(-17, 0);
  ctx.quadraticCurveTo(-24, -12, -19, -26);
  ctx.closePath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  bar(ctx, -22, -27, 22, -27, 3.4, '#6a4426');
  // Flamme au sommet
  ctx.beginPath();
  poly(ctx, [1, -34, 16, -31, 1, -28]);
  fillInk(ctx, sail, 1.8);
  // Vagues devant la coque
  ctx.beginPath();
  ctx.moveTo(-34, 16);
  for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(-34 + i * 12 + 3, 8 + (i % 2) * 2, -34 + i * 12 + 6, 16);
  ctx.lineTo(38, 26);
  ctx.lineTo(-34, 26);
  ctx.closePath();
  fillInk(ctx, '#3c8ad0', 2.2, 0.35, -0.25, 8, 26);
  ctx.beginPath();
  ctx.moveTo(-28, 18);
  ctx.quadraticCurveTo(-20, 14, -12, 19);
  ctx.moveTo(6, 19);
  ctx.quadraticCurveTo(14, 14, 22, 19);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
}

/** Heaume à plumet (vu de face, cimier rouge, nasal et gardes-joues) ; star = étoile d'or de héros. */
export function gHelm(ctx, x = 32, y = 34, s = 1, star = false, plume = '#d83a3a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Plumet : crinière qui retombe en arrière
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.bezierCurveTo(-4, -34, -22, -34, -26, -16);
  ctx.bezierCurveTo(-27, -8, -24, 2, -20, 8);
  ctx.bezierCurveTo(-19, -4, -14, -12, -6, -14);
  ctx.closePath();
  fillInk(ctx, plume, 2.4, 0.3, -0.3, -34, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, -26);
  ctx.quadraticCurveTo(-18, -26, -21, -12);
  ctx.moveTo(-10, -22);
  ctx.quadraticCurveTo(-18, -20, -19, -8);
  ctx.stroke();
  // Calotte
  ctx.beginPath();
  ctx.moveTo(-19, 4);
  ctx.bezierCurveTo(-21, -20, -8, -24, 0, -24);
  ctx.bezierCurveTo(8, -24, 21, -20, 19, 4);
  ctx.lineTo(19, 12);
  ctx.quadraticCurveTo(19, 22, 8, 22);
  ctx.lineTo(4, 22);
  ctx.lineTo(4, 8);
  ctx.lineTo(-4, 8);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-8, 22);
  ctx.quadraticCurveTo(-19, 22, -19, 12);
  ctx.closePath();
  fillInk(ctx, '#bcc6d2', 2.6, 0.5, -0.32, -24, 22);
  // Bandeau d'or, nasal et fente des yeux
  ctx.beginPath();
  poly(ctx, [-19, -5, 19, -5, 19, 1, -19, 1]);
  fillInk(ctx, '#e8b93a', 2, 0.4, -0.3, -5, 1);
  ctx.beginPath();
  poly(ctx, [-4, -5, 4, -5, 4, 8, -4, 8]);
  fillInk(ctx, '#aeb8c4', 2, 0.35, -0.3, -5, 8);
  ctx.fillStyle = INK;
  ctx.fillRect(-14, 3, 8, 3.4);
  ctx.fillRect(6, 3, 8, 3.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-13, -18);
  ctx.quadraticCurveTo(-9, -22, -2, -22);
  ctx.stroke();
  if (star) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 12;
      const a = (i / 10) * TAU - PI / 2;
      pts.push(16 + Math.cos(a) * r, -21 + Math.sin(a) * r);
    }
    ctx.beginPath();
    poly(ctx, pts);
    fillInk(ctx, '#f6cc44', 2.2, 0.5, -0.25, -33, -9);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Objets des technologies
// ---------------------------------------------------------------------------

/** Tête de chien de chasse (lévrier brun à oreille pendante et collier d'équipe). */
export function gDog(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Cou et poitrail
  ctx.beginPath();
  ctx.moveTo(-22, 26);
  ctx.bezierCurveTo(-24, 8, -18, -6, -8, -12);
  ctx.lineTo(8, 8);
  ctx.lineTo(14, 26);
  ctx.closePath();
  fillInk(ctx, '#a8703c', 2.4, 0.3, -0.3, -12, 26);
  ctx.beginPath();
  poly(ctx, [-3, 14, 14, 26, -6, 26]);
  ctx.fillStyle = '#f2e6d0';
  ctx.fill();
  // Tête : crâne, long museau
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.bezierCurveTo(-14, -22, 4, -26, 12, -18);
  ctx.bezierCurveTo(18, -14, 26, -8, 28, -2);
  ctx.quadraticCurveTo(29, 3, 24, 4);
  ctx.bezierCurveTo(18, 5, 12, 6, 8, 10);
  ctx.bezierCurveTo(-4, 12, -12, 6, -12, -6);
  ctx.closePath();
  fillInk(ctx, '#b87c44', 2.4, 0.35, -0.3, -26, 12);
  // Chanfrein clair et truffe
  ctx.beginPath();
  ctx.moveTo(14, -12);
  ctx.quadraticCurveTo(24, -5, 26, -1);
  ctx.quadraticCurveTo(20, 1, 14, 0);
  ctx.closePath();
  ctx.fillStyle = '#efdcbc';
  ctx.fill();
  ctx.beginPath();
  ell(ctx, 27, -2, 3.2, 2.8);
  ctx.fillStyle = INK;
  ctx.fill();
  // Langue
  ctx.beginPath();
  ctx.moveTo(12, 4);
  ctx.quadraticCurveTo(16, 14, 11, 15);
  ctx.quadraticCurveTo(7, 12, 8, 6);
  ctx.closePath();
  fillInk(ctx, '#e0606a', 1.6);
  // Œil et oreille pendante
  ctx.beginPath();
  ell(ctx, 8, -8, 3, 3.2);
  fillInk(ctx, '#f8f0d8', 1.4, 0, 0);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ell(ctx, 8.6, -8, 1.7, 1.9);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.bezierCurveTo(-18, -18, -22, -2, -12, 10);
  ctx.bezierCurveTo(-4, 6, -2, -6, -6, -18);
  ctx.closePath();
  fillInk(ctx, '#6a4222', 2.2, 0.25, -0.3, -18, 10);
  // Collier rouge à plaque d'or
  ctx.beginPath();
  poly(ctx, [-16, 8, 8, 12, 9, 19, -18, 16]);
  fillInk(ctx, '#d0343a', 2, 0.3, -0.3, 8, 19);
  ctx.beginPath();
  ell(ctx, -2, 17, 3.2, 3.2);
  fillInk(ctx, '#f0c040', 1.6);
  ctx.restore();
}

/** Filet de pêche : mailles, flotteurs de liège et poisson pris (double : deux filets et deux poissons). */
export function gNet(ctx, x = 32, y = 32, s = 1, double = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const one = (cx, cy, r, tilt) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    // Filet : disque à mailles losangées
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.2);
    ctx.bezierCurveTo(-r, -r * 1.1, r, -r * 1.1, r, -r * 0.2);
    ctx.quadraticCurveTo(r * 0.8, r * 1.0, 0, r * 1.15);
    ctx.quadraticCurveTo(-r * 0.8, r * 1.0, -r, -r * 0.2);
    ctx.closePath();
    fillInk(ctx, '#3f6a56', 2.4, 0.2, -0.35, -r, r);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(238,226,186,0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
      ctx.moveTo(i * r * 0.28 - r * 1.2, -r * 1.2);
      ctx.lineTo(i * r * 0.28 + r * 1.2, r * 1.2);
      ctx.moveTo(i * r * 0.28 + r * 1.2, -r * 1.2);
      ctx.lineTo(i * r * 0.28 - r * 1.2, r * 1.2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.2);
    ctx.bezierCurveTo(-r, -r * 1.1, r, -r * 1.1, r, -r * 0.2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    // Flotteurs de liège sur le haut
    for (let i = 0; i < 5; i++) {
      const a = PI * (1.12 + i * 0.19);
      ctx.beginPath();
      ell(ctx, Math.cos(a) * r * 0.98, -r * 0.2 + Math.sin(a) * r * 0.9, 3.4, 3);
      fillInk(ctx, '#d8a860', 1.8, 0.35, -0.25, -r, 0);
    }
    ctx.restore();
  };
  if (double) {
    one(-8, -4, 19, -0.25);
    one(10, 3, 19, 0.2);
    gFish(ctx, -8, 6, 0.4, -0.2);
    gFish(ctx, 12, 12, 0.4, 0.3);
  } else {
    one(0, -2, 22, 0);
    gFish(ctx, 1, 6, 0.46, -0.1);
  }
  ctx.restore();
}

/** Coque renforcée : bordé cerclé de fer, rivets et pointe d'éperon. */
export function gHull(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-30, -6);
  ctx.lineTo(30, -6);
  ctx.quadraticCurveTo(26, 16, 8, 21);
  ctx.lineTo(-10, 21);
  ctx.quadraticCurveTo(-27, 16, -30, -6);
  ctx.closePath();
  fillInk(ctx, '#a87848', 2.6, 0.25, -0.35, -6, 21);
  ctx.save();
  ctx.clip();
  // Planches
  ctx.strokeStyle = 'rgba(60,34,14,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const yy of [1, 8, 15]) {
    ctx.moveTo(-32, yy);
    ctx.lineTo(32, yy);
  }
  ctx.stroke();
  // Bandes de fer
  for (const bx of [-18, 0, 18]) {
    ctx.beginPath();
    poly(ctx, [bx - 4.5, -8, bx + 4.5, -8, bx + 4.5, 24, bx - 4.5, 24]);
    fillInk(ctx, '#aab3be', 2, 0.5, -0.3, -8, 24);
    ctx.fillStyle = INK;
    for (const ry of [-2, 6, 14]) {
      ctx.beginPath();
      ell(ctx, bx, ry, 1.5, 1.5);
      ctx.fill();
    }
  }
  ctx.restore();
  // Rebord de fer
  ctx.beginPath();
  poly(ctx, [-32, -12, 32, -12, 31, -5, -31, -5]);
  fillInk(ctx, '#c4ccd6', 2.4, 0.5, -0.3, -12, -5);
  // Vagues
  ctx.beginPath();
  ctx.moveTo(-34, 20);
  for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(-34 + i * 12 + 3, 14 + (i % 2) * 2, -34 + i * 12 + 6, 20);
  ctx.lineTo(38, 28);
  ctx.lineTo(-34, 28);
  ctx.closePath();
  fillInk(ctx, '#3c8ad0', 2.2, 0.35, -0.25, 14, 28);
  ctx.restore();
}

/** Baliste de pont : arc de cornes, corde tendue, gros carreau sur son affût. */
export function gBallista(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Affût
  ctx.beginPath();
  poly(ctx, [-14, 22, -8, 4, 8, 4, 14, 22]);
  fillInk(ctx, '#8a5a30', 2.4, 0.25, -0.3, 4, 22);
  bar(ctx, -26, 6, 24, 6, 5, '#a8723e');
  // Bras courbes de l'arc
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.bezierCurveTo(-14, -6, -24, -14, -28, -26);
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = '#b07a42';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -4);
  ctx.bezierCurveTo(14, -6, 24, -14, 28, -26);
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = '#b07a42';
  ctx.stroke();
  // Corde
  ctx.beginPath();
  ctx.moveTo(-28, -26);
  ctx.lineTo(0, 8);
  ctx.lineTo(28, -26);
  ctx.strokeStyle = 'rgba(250,240,210,0.95)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Rail et carreau
  bar(ctx, 0, 12, 0, -30, 4.4, '#6a4426');
  ctx.beginPath();
  poly(ctx, [-3, -20, 0, -32, 3, -20]);
  fillInk(ctx, '#dfe6ee', 1.8, 0.4, -0.2, -32, -20);
  ctx.beginPath();
  poly(ctx, [-1.4, -8, 1.4, -8, 1.4, 6, -1.4, 6]);
  ctx.fillStyle = '#e8d8b0';
  ctx.fill();
  ctx.restore();
}

/** Balance de marchand : fléau, deux plateaux (pièces d'un côté, sacs de l'autre). */
export function gScales(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Pied et colonne
  ctx.beginPath();
  poly(ctx, [-12, 24, -6, 16, 6, 16, 12, 24]);
  fillInk(ctx, '#c8963c', 2.4, 0.35, -0.3, 16, 24);
  bar(ctx, 0, 18, 0, -22, 4.4, '#d8a840');
  // Fléau légèrement incliné
  ctx.save();
  ctx.translate(0, -20);
  ctx.rotate(-0.09);
  bar(ctx, -26, 0, 26, 0, 4, '#e0b040');
  // Cordes et plateaux
  for (const [px, py, gold] of [[-26, 14, true], [26, 8, false]]) {
    ctx.beginPath();
    ctx.moveTo(px, 1);
    ctx.lineTo(px - 10, py + 10);
    ctx.moveTo(px, 1);
    ctx.lineTo(px + 10, py + 10);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = '#f0e2b0';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (gold) {
      // Pièces sur le plateau lourd
      for (const [cx, cy] of [[px - 4, py + 6], [px + 4, py + 6], [px, py + 2]]) {
        ctx.beginPath();
        ell(ctx, cx, cy, 5, 3);
        fillInk(ctx, '#f2c94a', 1.6, 0.4, -0.25, cy - 3, cy + 3);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(px - 4, py + 8);
      ctx.quadraticCurveTo(px - 8, py - 2, px, py - 2);
      ctx.quadraticCurveTo(px + 8, py - 2, px + 4, py + 8);
      ctx.closePath();
      fillInk(ctx, '#c8a878', 1.8, 0.3, -0.3, py - 4, py + 8);
    }
    ctx.beginPath();
    ctx.moveTo(px - 12, py + 10);
    ctx.quadraticCurveTo(px, py + 20, px + 12, py + 10);
    ctx.closePath();
    fillInk(ctx, '#d8a840', 2, 0.4, -0.3, py + 10, py + 18);
  }
  ctx.beginPath();
  ell(ctx, 0, 0, 3.6, 3.6);
  fillInk(ctx, '#fff0a0', 1.8);
  ctx.restore();
  ctx.restore();
}

/** Sac de pièces ouvert d'où débordent des pièces d'or. */
export function gCoinBag(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Pièces à terre
  for (const [cx, cy] of [[14, 22], [24, 18], [-22, 20]]) {
    ctx.beginPath();
    ell(ctx, cx, cy, 7, 4.6);
    fillInk(ctx, '#f2c94a', 1.8, 0.45, -0.25, cy - 5, cy + 5);
    ctx.beginPath();
    ell(ctx, cx, cy - 0.4, 4, 2.4);
    ctx.strokeStyle = 'rgba(140,90,10,0.7)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  // Sac
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.quadraticCurveTo(-22, 0, -19, 16);
  ctx.quadraticCurveTo(-8, 25, 8, 24);
  ctx.quadraticCurveTo(22, 20, 19, 10);
  ctx.quadraticCurveTo(18, -2, 8, -10);
  ctx.closePath();
  fillInk(ctx, '#b58a4c', 2.6, 0.3, -0.32, -10, 24);
  // Pièces qui débordent
  for (const [cx, cy, r] of [[-5, -16, 6], [5, -18, 6.4], [-1, -22, 5.6], [10, -12, 5]]) {
    ctx.beginPath();
    ell(ctx, cx, cy, r, r * 0.9);
    fillInk(ctx, '#f6d050', 2, 0.5, -0.25, cy - r, cy + r);
    ctx.beginPath();
    ell(ctx, cx, cy, r * 0.6, r * 0.5);
    ctx.strokeStyle = 'rgba(140,90,10,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    shine(ctx, cx - r * 0.35, cy - r * 0.35, 1.4, 0.9, 0.9);
  }
  // Col froncé et lien
  ctx.beginPath();
  poly(ctx, [-11, -8, 11, -8, 9, -3, -9, -3]);
  fillInk(ctx, '#8a5a30', 2.2, 0.2, -0.3, -8, -3);
  line(ctx, -11, -5.5, 11, -5.5, '#e8d090', 2);
  // Signe monétaire : petit disque
  ctx.beginPath();
  ell(ctx, 0, 12, 6.4, 6.4);
  fillInk(ctx, '#f2c94a', 1.8, 0.45, -0.25, 6, 18);
  ctx.strokeStyle = 'rgba(120,76,8,0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2.4, 9);
  ctx.lineTo(2.4, 9);
  ctx.moveTo(-2.4, 12);
  ctx.lineTo(2.4, 12);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 16);
  ctx.stroke();
  ctx.restore();
}

/** Branche de gui : feuilles vertes par paires, baies blanches, ruban et faucille d'or à la base. */
export function gHerbs(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Tiges
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 24);
  ctx.quadraticCurveTo(-4, 4, -12, -14);
  ctx.moveTo(-8, 24);
  ctx.quadraticCurveTo(-2, 4, 6, -16);
  ctx.moveTo(-6, 6);
  ctx.quadraticCurveTo(6, 0, 16, -4);
  ctx.stroke();
  ctx.strokeStyle = '#6a9a3a';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Feuilles ovales par paires
  const leaf = (lx, ly, a) => {
    ctx.beginPath();
    ell(ctx, lx, ly, 10, 4.6, a);
    fillInk(ctx, '#58a83c', 2, 0.35, -0.3, ly - 8, ly + 8);
    ctx.beginPath();
    ctx.moveTo(lx - Math.cos(a) * 8, ly - Math.sin(a) * 8);
    ctx.lineTo(lx + Math.cos(a) * 8, ly + Math.sin(a) * 8);
    ctx.strokeStyle = 'rgba(30,80,20,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  leaf(-20, -16, -0.5);
  leaf(-6, -22, 0.5);
  leaf(-2, -12, -0.9);
  leaf(14, -22, -0.3);
  leaf(2, -8, 0.6);
  leaf(22, -8, 0.4);
  leaf(10, -2, -0.6);
  // Baies blanches
  for (const [bx, by] of [[-11, -8], [-7, -3], [5, -13], [10, -9], [-13, -12], [17, -14]]) {
    ctx.beginPath();
    ell(ctx, bx, by, 3.7, 3.7);
    fillInk(ctx, '#fbf8ec', 1.6, 0.05, -0.15, by - 4, by + 4);
    shine(ctx, bx - 1, by - 1.3, 1, 0.9, 0.9);
  }
  // Ruban
  ctx.beginPath();
  poly(ctx, [-16, 16, 0, 12, 1, 19, -15, 23]);
  fillInk(ctx, '#d84a3a', 2, 0.3, -0.3, 12, 23);
  // Faucille d'or
  ctx.beginPath();
  ctx.arc(16, 14, 11, PI * 0.15, PI * 1.25, true);
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#f0c240';
  ctx.stroke();
  bar(ctx, 24, 22, 28, 27, 3.2, '#8a5a30');
  ctx.restore();
}

/** Bénédiction : rayons dorés, croix de guérison lumineuse et étincelles. */
export function gBless(ctx, x = 32, y = 32, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Rayons
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const a2 = a + TAU / 24;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - 0.09) * 30, Math.sin(a - 0.09) * 30);
    ctx.lineTo(Math.cos(a2) * 21, Math.sin(a2) * 21);
    ctx.lineTo(Math.cos(a + 0.09) * 30, Math.sin(a + 0.09) * 30);
    ctx.closePath();
  }
  fillInk(ctx, '#f6cc44', 1.6, 0.5, -0.2, -30, 30);
  // Halo
  ctx.beginPath();
  ell(ctx, 0, 0, 17, 17);
  fillInk(ctx, '#fff4c0', 2.2, 0.15, -0.15, -17, 17);
  // Croix
  ctx.beginPath();
  poly(ctx, [-4.5, -12, 4.5, -12, 4.5, -4.5, 12, -4.5, 12, 4.5, 4.5, 4.5, 4.5, 12, -4.5, 12, -4.5, 4.5, -12, 4.5, -12, -4.5, -4.5, -4.5]);
  fillInk(ctx, '#4ab84a', 2.2, 0.35, -0.25, -12, 12);
  shine(ctx, -2, -7, 1.6, 3, 0.7);
  // Étincelles
  for (const [sx, sy, r] of [[22, -22, 4], [-24, 20, 3.4], [24, 22, 3]]) {
    ctx.beginPath();
    poly(ctx, [sx, sy - r * 2, sx + r * 0.5, sy - r * 0.5, sx + r * 2, sy, sx + r * 0.5, sy + r * 0.5, sx, sy + r * 2, sx - r * 0.5, sy + r * 0.5, sx - r * 2, sy, sx - r * 0.5, sy - r * 0.5]);
    fillInk(ctx, '#ffffff', 1.4, 0, -0.1);
  }
  ctx.restore();
}

/** Carte au trésor roulée (parchemin, pointillé et croix) avec une longue-vue en travers. */
export function gSpyglass(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Parchemin
  ctx.beginPath();
  ctx.moveTo(-26, -14);
  ctx.quadraticCurveTo(-12, -20, 0, -15);
  ctx.quadraticCurveTo(12, -20, 26, -14);
  ctx.lineTo(24, 18);
  ctx.quadraticCurveTo(12, 22, 0, 18);
  ctx.quadraticCurveTo(-12, 22, -24, 18);
  ctx.closePath();
  fillInk(ctx, '#e8d6a0', 2.4, 0.3, -0.25, -20, 22);
  // Terres, mer et route pointillée
  ctx.beginPath();
  ctx.moveTo(-20, -6);
  ctx.quadraticCurveTo(-12, -14, -4, -8);
  ctx.quadraticCurveTo(0, 0, -10, 4);
  ctx.quadraticCurveTo(-18, 8, -20, -6);
  ctx.fillStyle = 'rgba(90,140,70,0.75)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(16, -6, 22, 2);
  ctx.quadraticCurveTo(20, 12, 10, 12);
  ctx.closePath();
  ctx.fillStyle = 'rgba(90,140,70,0.75)';
  ctx.fill();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#a03a2a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.quadraticCurveTo(-4, 14, 4, 4);
  ctx.quadraticCurveTo(10, -6, 16, 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#c02a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(13, -1);
  ctx.lineTo(20, 6);
  ctx.moveTo(20, -1);
  ctx.lineTo(13, 6);
  ctx.stroke();
  // Longue-vue
  ctx.save();
  ctx.translate(2, 6);
  ctx.rotate(-0.6);
  for (const [x0, x1, w, c] of [[-24, -6, 9, '#8a5a30'], [-6, 8, 12, '#b07a42'], [8, 24, 16, '#c8963c']]) {
    ctx.beginPath();
    ctx.moveTo(x0, -w / 2);
    ctx.lineTo(x1, -w / 2 - 0.6);
    ctx.lineTo(x1, w / 2 + 0.6);
    ctx.lineTo(x0, w / 2);
    ctx.closePath();
    fillInk(ctx, c, 2.2, 0.35, -0.3, -w, w);
  }
  ctx.beginPath();
  ell(ctx, 24.5, 0, 3.4, 8.4);
  fillInk(ctx, '#7ac0e8', 2, 0.5, -0.1, -9, 9);
  shine(ctx, 24, -3, 1, 3, 0.8);
  for (const bx of [-6, 8]) line(ctx, bx, -7, bx, 7, '#f0d070', 1.8);
  ctx.restore();
  ctx.restore();
}

/** Calendrier des saisons : feuillet à bandeau rouge et une faucille d'or devant. */
export function gCalendar(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  poly(ctx, [-22, -18, 22, -18, 22, 22, -22, 22]);
  fillInk(ctx, '#f4ecd4', 2.6, 0.2, -0.25, -18, 22);
  ctx.beginPath();
  poly(ctx, [-22, -18, 22, -18, 22, -6, -22, -6]);
  fillInk(ctx, '#c83a2a', 2.6, 0.3, -0.3, -18, -6);
  // Anneaux de reliure
  for (const rx of [-12, 12]) {
    line(ctx, rx, -24, rx, -14, INK, 5);
    line(ctx, rx, -24, rx, -14, '#c4ccd6', 2.4);
  }
  // Jours : grille de points
  ctx.fillStyle = 'rgba(70,50,30,0.85)';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillRect(-16 + c * 7.6, -1 + r * 7.4, 4.6, 3.6);
    }
  }
  ctx.fillStyle = '#c83a2a';
  ctx.fillRect(-16 + 2 * 7.6, -1 + 7.4, 4.6, 3.6);
  // Épi de blé et faucille
  ctx.beginPath();
  ctx.arc(8, 16, 16, PI * 1.05, PI * 1.85);
  ctx.lineWidth = 7.5;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = '#f0c240';
  ctx.stroke();
  bar(ctx, 21, 14, 24, 24, 3.6, '#8a5a30');
  ctx.restore();
}

/** Épée dressée derrière un heaume (art de la guerre). */
export function gStrat(ctx, x = 32, y = 34, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Épée verticale derrière
  ctx.beginPath();
  poly(ctx, [-3.6, -30, 0, -36, 3.6, -30, 3.6, 8, -3.6, 8]);
  fillInk(ctx, '#e4eaf2', 2.2, 0.4, -0.2, -36, 8);
  line(ctx, 0, -32, 0, 6, 'rgba(255,255,255,0.85)', 1.4);
  bar(ctx, -12, 9, 12, 9, 4.6, '#d8a840');
  bar(ctx, 0, 12, 0, 26, 4, '#7a4a2a');
  ctx.beginPath();
  ell(ctx, 0, 28, 4, 4);
  fillInk(ctx, '#d8a840', 2);
  ctx.restore();
  gHelm(ctx, x, y + 6, s * 0.9, false, '#d83a3a');
}

// ---------------------------------------------------------------------------
// Achat et vente au marché : symbole de la ressource, pièce d'or et flèche
// ---------------------------------------------------------------------------

/** Symbole d'une ressource (food | wood | stone) centré en (x, y), tenant dans ~ 28 unités. */
export function gResource(ctx, res, x, y, s) {
  if (res === 'food') {
    gBerries(ctx, x + 9 * s, y + 9 * s, 0.5 * s * 1.15);
    gMeat(ctx, x - 5 * s, y - 2 * s, 0.82 * s);
  } else if (res === 'wood') gLogs(ctx, x + 2 * s, y + 1 * s, 0.92 * s);
  else if (res === 'stone') gStones(ctx, x, y + 1 * s, 0.98 * s);
  else if (res === 'gold') gGoldPile(ctx, x, y + 2 * s, 0.9 * s);
  else gWheat(ctx, x, y, 0.8 * s);
}

/**
 * Icône d'échange. sell : la ressource (à gauche) part vers la pièce d'or (à droite), flèche orange sortante ;
 * buy : la pièce d'or (à gauche) part vers la ressource (à droite), flèche verte entrante.
 */
export function gTrade(ctx, res, mode) {
  const sell = mode === 'sell';
  const left = 19;
  const right = 46;
  const top = 21;
  // Plaque de fond : deux familles nettement distinctes (orange pour vendre, vert pour acheter)
  const tint = sell ? 'rgba(242,160,64,0.30)' : 'rgba(106,208,96,0.30)';
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(58, 8);
  ctx.quadraticCurveTo(61, 8, 61, 11);
  ctx.lineTo(61, 53);
  ctx.quadraticCurveTo(61, 56, 58, 56);
  ctx.lineTo(6, 56);
  ctx.quadraticCurveTo(3, 56, 3, 53);
  ctx.lineTo(3, 11);
  ctx.quadraticCurveTo(3, 8, 6, 8);
  ctx.closePath();
  ctx.fillStyle = tint;
  ctx.fill();
  if (sell) {
    gResource(ctx, res, left, top + 1, 0.86);
    gCoin(ctx, right, top, 1, 13.5);
  } else {
    gCoin(ctx, left, top, 1, 13.5);
    gResource(ctx, res, right, top + 1, 0.86);
  }
  // Flèche épaisse sous les deux symboles, toujours vers la droite (de ce qu'on donne à ce qu'on reçoit)
  const c = sell ? '#f2a040' : '#5ed05a';
  ctx.beginPath();
  poly(ctx, [7, 43, 39, 43, 39, 37, 57, 49, 39, 61, 39, 55, 7, 55]);
  fillInk(ctx, c, 2.4, 0.4, -0.25, 37, 61);
  ctx.beginPath();
  ctx.moveTo(10, 46);
  ctx.lineTo(36, 46);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}
