// Bâtiments spartiates d'allure dorique (Sparte classique, Ve-IVe s. av. J.-C.) : stylobate à degrés, colonnes cannelées de calcaire
// clair, architrave à triglyphes (métopes aux couleurs d'équipe), frontons à lambda, tuiles rouges, oliviers, trépieds de bronze,
// statues d'hoplites. Pas de murailles en ville (Sparte n'en avait pas) : les pièces défensives sont en calcaire à tuiles.
// Ce module : hall (mégaron), house (oikos), barracks (syssition), temple (Arès), castle (acropole), wonder (Amyclées), monument,
// market (agora), academy (gérousia), infirmary ; les autres types sont dans building-sparta-more.js. Pièces communes :
// building-sparta-parts.js. DESIGNS.sparta dans buildings.js.
import { MAT } from './building-gfx.js';
import { longHouse, scaffoldBox, doorLocal, windowLocal } from './building-parts.js';
import { banner, barrel, crate, weaponRack, shieldLocal, GOLD } from './building-props.js';
import { brazier, amphora, lectern } from './building-civic.js';
import {
  MARBLE, STYL, WALL, TILE, TILE_EDGE, lambdaDisc, column, doric, flankBanners, hoplonLocal, olive, tripod, statue,
} from './building-sparta-parts.js';
import { MORE } from './building-sparta-more.js';
import { tone } from './building-gfx.js';

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

function hall(g) {
  // Mégaron royal : grande salle dorique sur une terrasse en degrés, statues et trépieds de part et d'autre de l'escalier
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-1.95, -1.95, 1.95, 1.95);
    return;
  }
  g.box(-1.95, -1.95, 1.95, 1.95, 0, 4, STYL, { topMat: { col: '#c6c0ae' } });
  if (st === 3) olive(g, -1.8, -1.75, 0.95);
  if (st >= 2) g.box(-1.82, -1.82, 1.82, 1.82, 4, 8, MARBLE, { topMat: { col: '#d6d0c0' } });
  doric(g, {
    x0: -1.6, y0: -1.2, x1: 1.5, y1: 1.2, z0: 8, colH: 32, ny: 6, nx: 8, pedH: 30, entH: 9, stepH: 6, cut: -0.3,
    extra: (gg) => {
      brazier(gg, 1.72, -0.7, 8, 18);
      brazier(gg, 1.72, 0.7, 8, 18);
      statue(gg, 1.8, -1.45, 8, 38);
      statue(gg, 1.8, 1.45, 8, 38);
      tripod(gg, 1.72, 0, 8, 1.1);
      flankBanners(gg, 1.85, -1.05, 1.05, 8);
    },
  });
  if (st === 3) {
    olive(g, -1.75, 1.75, 1.05);
    olive(g, 1.75, 1.85, 0.9);
  }
}

function house(g) {
  const tc = g.tc;
  longHouse(g, {
    x0: -0.6, y0: -0.5, x1: 0.5, y1: 0.32, plinthH: 5, plinthMat: STYL, wallH: 19, ridgeH: 40, axis: 'x',
    wallMat: WALL, roofMat: TILE, gableMat: WALL, edge: TILE_EDGE, ov: 0.12, ovg: 0.07, th: 2.6, ridge: '#7a3020',
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.32, h, 7, 12);
      windowLocal(c, w * 0.74, h * 0.45, 4, 4.5);
      c.fillStyle = tc.main;
      c.fillRect(w * 0.32 - 4.5, h - 15, 9, 2);
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.5, h * 0.45, 4, 4.5);
      if (g.stage === 3) hoplonLocal(c, tc, w * 0.78, h * 0.4, 3.6);
    },
    gableDeco: g.stage === 3 ? (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.42, 4.2) : null,
  });
  if (g.stage === 3) {
    amphora(g, 0.72, 0.1, 0, 1);
    barrel(g, 0.72, -0.2, 0, 0.8);
    olive(g, -0.78, 0.72, 0.7);
  }
}

function barracks(g) {
  // Syssition : salle commune aux murs pleins, portique de deux fois quatre colonnes, hoplons suspendus au mur
  const tc = g.tc;
  doric(g, {
    x0: -1.3, y0: -1.0, x1: 1.3, y1: 1.0, colH: 25, ny: 4, nx: 2, pedH: 20, entH: 7, stepH: 6, cut: -0.1,
    cellaDecoL: (c, w, h) => {
      if (g.stage < 3) return;
      for (const u of [0.18, 0.38, 0.62, 0.82]) hoplonLocal(c, tc, w * u, h * 0.42, 4.6);
    },
    extra: (gg) => {
      weaponRack(gg, 1.55, -0.35, 'y', 0.7);
      crate(gg, 1.55, 0.55, 0);
      banner(gg, 1.45, 1.05, 0, 34, { w: 9, h: 13, pole: true });
      olive(gg, -1.45, 1.25, 0.8);
    },
  });
}

function temple(g) {
  // Temple d'Arès : périptère dorique, autel à flamme, statue du dieu en armes, trépieds
  doric(g, {
    x0: -1.25, y0: -0.95, x1: 1.25, y1: 0.95, colH: 29, ny: 4, nx: 6, pedH: 25, entH: 8, stepH: 8, cut: -0.1,
    extra: (gg) => {
      const c = gg.ctx;
      gg.box(1.42, -0.16, 1.66, 0.16, 0, 8, MARBLE, { topMat: STYL, ao: false, quick: true });
      const [fx, fy] = gg.P(1.54, 0, 8);
      const fl = c.createRadialGradient(fx, fy - 5, 0, fx, fy - 5, 7);
      fl.addColorStop(0, 'rgba(255,245,170,0.95)');
      fl.addColorStop(0.5, 'rgba(255,140,40,0.85)');
      fl.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = fl;
      c.beginPath();
      c.moveTo(fx - 4, fy);
      c.quadraticCurveTo(fx - 4, fy - 8, fx, fy - 13);
      c.quadraticCurveTo(fx + 4, fy - 8, fx + 4, fy);
      c.closePath();
      c.fill();
      tripod(gg, 1.5, -0.62, 0, 1.0);
      tripod(gg, 1.5, 0.62, 0, 1.0);
      banner(gg, 1.3, -1.05, 0, 42, { w: 10, h: 15, pole: true });
      banner(gg, 1.3, 1.05, 0, 42, { w: 10, h: 15, pole: true });
      olive(gg, -1.4, 1.2, 0.85);
    },
  });
}

function academy(g) {
  // Gérousia : salle du conseil des Anciens, portique simple, pupitre et statue
  doric(g, {
    x0: -1.2, y0: -0.95, x1: 1.2, y1: 0.95, colH: 23, ny: 4, nx: 5, pedH: 21, entH: 7, stepH: 6, cut: -0.1,
    extra: (gg) => {
      lectern(gg, 1.45, 0.45, 0, 1);
      amphora(gg, 1.45, -0.4, 0, 0.9, '#c48a4e');
      statue(gg, 1.45, -1.12, 0, 30);
      olive(gg, -1.38, 1.2, 0.8);
    },
  });
}

function infirmary(g) {
  // Asklépieion : petit temple aux marches de calcaire, amphores d'herbes, olivier sacré
  doric(g, {
    x0: -1.15, y0: -0.9, x1: 1.15, y1: 0.9, colH: 21, ny: 3, nx: 4, pedH: 18, entH: 6, stepH: 5, cut: -0.1, r: 0.06,
    extra: (gg) => {
      amphora(gg, 1.4, 0.35, 0, 0.9, '#9ab07a');
      amphora(gg, 1.4, -0.3, 0, 0.8, '#c48a4e');
      olive(gg, -1.3, 1.15, 0.9);
    },
  });
}

function market(g) {
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.3, -1.3, 1.3, 1.25);
    return;
  }
  // Agora : stoa (portique couvert) au fond, étals aux auvents d'équipe, olivier et statue
  doric(g, {
    x0: -1.3, y0: -1.3, x1: 1.3, y1: -0.3, colH: 22, ny: 3, nx: 7, pedH: 16, entH: 6, stepH: 5, cut: -1.4, backWall: true, plan: false, noAcro: true,
  });
  if (g.stage < 3) return;
  const awn = (x, y) => {
    if (g.mode === 'shadow') {
      g.shadowBox(x - 0.3, y - 0.22, x + 0.3, y + 0.22, 0, 22);
      return;
    }
    g.box(x - 0.26, y - 0.16, x + 0.26, y + 0.16, 0, 8, { col: '#8e7458' }, { quick: true });
    for (const [px, py] of [[x - 0.3, y - 0.2], [x + 0.3, y - 0.2], [x - 0.3, y + 0.2], [x + 0.3, y + 0.2]]) g.post(px, py, 0, 22, '#7a5a38', 2);
    const c = g.ctx;
    const P = (px, py) => g.P(px, py, 22);
    g.fillPoly([P(x - 0.36, y - 0.26), P(x + 0.36, y - 0.26), P(x + 0.36, y + 0.26), P(x - 0.36, y + 0.26)], tc.main);
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 1.6;
    c.beginPath();
    for (const k of [-0.2, 0, 0.2]) {
      const a = P(x + k, y - 0.26);
      const b = P(x + k, y + 0.26);
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
    }
    c.stroke();
  };
  awn(-0.6, 0.3);
  awn(0.5, 0.75);
  awn(-0.4, 1.0);
  amphora(g, 0.9, 0.05, 0, 1);
  barrel(g, 1.0, 0.3, 0, 0.9);
  crate(g, -1.1, 0.6, 0);
  olive(g, 1.05, 1.0, 0.85);
  statue(g, -1.1, 0.0, 0, 26);
}

function monument(g) {
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.85, -0.85, 0.85, 0.85);
    return;
  }
  const st = g.stage;
  g.box(-0.85, -0.85, 0.85, 0.85, 0, 5, STYL, { topMat: STYL });
  g.box(-0.65, -0.65, 0.65, 0.65, 5, 10, MARBLE, { topMat: { col: '#d4cebe' } });
  if (st === 1) {
    if (g.mode === 'draw') scaffoldBox(g, -0.4, -0.4, 0.4, 0.4, 40, { step: 0.4 });
    return;
  }
  const relief = (c, w, h) => {
    c.fillStyle = tc.main;
    c.fillRect(3, 3, w - 6, h - 6);
    if (st === 3) lambdaDisc(c, tc, w / 2, h / 2, Math.min(8, h * 0.3));
  };
  g.box(-0.4, -0.4, 0.4, 0.4, 10, 28, MARBLE, { topMat: { col: '#d4cebe' }, decoL: relief, decoR: relief });
  g.box(-0.46, -0.46, 0.46, 0.46, 28, 32, STYL, { topMat: STYL, ao: false });
  if (st === 2) return;
  column(g, 0, 0, 32, 92, 0.15);
  g.box(-0.24, -0.24, 0.24, 0.24, 92, 97, MARBLE, { quick: true, ao: false });
  if (g.mode === 'draw') {
    // hoplon d'or dressé au sommet, face aux spectateurs
    const c = g.ctx;
    const [x, y] = g.P(0, 0, 112);
    c.fillStyle = '#7a5a14';
    c.beginPath();
    c.ellipse(x + 1, y + 1, 13, 15, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = tone('#d8b44a', 1);
    c.beginPath();
    c.ellipse(x, y, 13, 15, 0, 0, 2 * PI);
    c.fill();
    lambdaDisc(c, tc, x, y, 9);
  }
  banner(g, 0.72, 0.72, 10, 40, { w: 10, h: 14, pole: true });
  brazier(g, 0.2, 0.76, 10, 14);
  tripod(g, -0.72, 0.72, 10, 0.9);
}

function castle(g) {
  // Acropole : terrasse en degrés (sans créneaux : Sparte n'avait pas de remparts), temple dorique, tours rondes aux toits de tuiles
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-2.15, -2.15, 2.15, 2.15);
    return;
  }
  const st = g.stage;
  const H = 12;
  const tower = (x, y, top) => {
    g.cyl(x, y, 0.42, 0, top, STYL, { ao: true });
    if (st >= 3) {
      g.cyl(x, y, 0.48, top, top + 4, STYL, { ao: false });
      g.cone(x, y, top + 4, 0.5, top + 26, TILE);
    }
  };
  const items = [];
  items.push({ d: -4, f: () => tower(-1.85, -1.85, 50) });
  items.push({
    d: -2,
    f: () => {
      g.box(-2.15, -2.15, 2.15, 2.15, 0, H * 0.55, MAT.stoneLight, { topMat: { col: '#c4beac' }, eave: 0 });
      g.box(-2.0, -2.0, 2.0, 2.0, H * 0.55, H, MAT.stone, { topMat: { col: '#b9b3a4' }, eave: 0 });
    },
  });
  items.push({ d: 0, f: () => doric(g, { x0: -1.35, y0: -1.05, x1: 1.35, y1: 1.05, z0: H, colH: 34, ny: 5, nx: 6, pedH: 30, entH: 9, stepH: 6, cut: -0.3 }) });
  items.push({ d: -0.5, f: () => tower(-1.85, 1.85, 50) });
  items.push({ d: -0.4, f: () => tower(1.85, -1.85, 50) });
  items.push({ d: 4, f: () => tower(1.85, 1.85, 50) });
  if (st === 3) {
    items.push({ d: -3, f: () => olive(g, -1.75, 0.2, 0.95) });
    items.push({ d: -3, f: () => olive(g, 0.3, -1.85, 0.9) });
    items.push({ d: 3, f: () => tripod(g, 1.78, 0.85, H, 1.0) });
    items.push({ d: 3, f: () => tripod(g, 1.78, -0.85, H, 1.0) });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  if (st === 3 && g.drawing) {
    banner(g, 2.4, -0.6, 0, 60, { w: 12, h: 18, pole: true });
    banner(g, 2.4, 0.6, 0, 60, { w: 12, h: 18, pole: true });
    const c = g.ctx;
    const [x, y] = g.P(2.16, 0, 7);
    lambdaDisc(c, tc, x, y, 6);
  }
}

function wonder(g) {
  // Sanctuaire d'Apollon à Amyclées : immense temple dorique sur double terrasse, trépieds d'or, lyre au fronton
  if (g.mode === 'plan') {
    g.planRect(-2.6, -2.6, 2.6, 2.6);
    return;
  }
  const st = g.stage;
  g.box(-2.6, -2.6, 2.6, 2.6, 0, 6, STYL, { topMat: { col: '#c2bcab' } });
  g.box(-2.35, -2.35, 2.35, 2.35, 6, 12, MARBLE, { topMat: { col: '#d4cebe' } });
  if (st === 3) olive(g, -2.4, -2.3, 1.0);
  if (st >= 2 && g.drawing) {
    for (const y of [-1.6, 1.6]) brazier(g, 2.15, y, 12, 20);
  }
  doric(g, {
    x0: -2.0, y0: -1.55, x1: 2.0, y1: 1.55, z0: 12, colH: 62, ny: 8, nx: 10, pedH: 50, entH: 13, stepH: 7, r: 0.085, cut: -0.3, noAcro: true,
    extra: (gg) => {
      const c = gg.ctx;
      // lyre d'or au centre du fronton
      const [x, y] = gg.P(2.05, 0, 12 + 7 + 62 + 13 + 25);
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 7, PI * 0.1, PI * 0.9);
      c.moveTo(x - 6.4, y + 2);
      c.lineTo(x - 6.4, y - 8);
      c.moveTo(x + 6.4, y + 2);
      c.lineTo(x + 6.4, y - 8);
      c.stroke();
      for (const k of [-3, 0, 3]) {
        c.beginPath();
        c.moveTo(x + k, y - 7);
        c.lineTo(x + k, y + 6);
        c.lineWidth = 0.7;
        c.stroke();
      }
      banner(gg, 2.45, -1.0, 12, 62, { w: 13, h: 19, pole: true });
      banner(gg, 2.45, 1.0, 12, 62, { w: 13, h: 19, pole: true });
      tripod(gg, 2.3, -0.35, 12, 1.3);
      tripod(gg, 2.3, 0.35, 12, 1.3);
      olive(gg, -2.35, 2.35, 1.1);
      olive(gg, 2.35, 2.4, 1.0);
    },
  });
}

export const SPARTA = { hall, house, barracks, temple, castle, wonder, monument, market, academy, infirmary, ...MORE };
void [PI, shieldLocal];
