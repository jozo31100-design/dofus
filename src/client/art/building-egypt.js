// Bâtiments égyptiens : maisons de briques crues à toit-terrasse, palais du nomarque à colonnade papyriforme, caserne à cour,
// temple d'Amon à pylône et obélisques, forteresse nubienne à talus et bastions, bazar sous auvents rayés, maison de vie,
// obélisque monumental et Grande pyramide de Gizeh. Grès doré, briques crues, plâtre peint, palmiers, hiéroglyphes.
// Couleurs d'équipe : bandeaux de frise, auvents, flammes au sommet de perches dorées, disque solaire.
// Chaque dessin suit le contrat de building-franks.js : plan / ombre / peinture, quatre stades de chantier.
import { tone, rgba, HX } from './building-gfx.js';
import { scaffoldBox, scaffold, doorLocal, windowLocal, stonePile, plankPile, crenels, roundCrenels } from './building-parts.js';
import { pennant, barrel, sack, crate, weaponRack, target } from './building-props.js';
import {
  SAND, SAND_L, SAND_D, BRICK, PLASTER, FLOOR, DARK, GOLD, GOLD_D, LAPIS, TURQ, RED,
  glyphBand, winged, teamFrieze, cornice, frustum, pyramid, obelisk, column, palm, pool,
} from './building-egypt-parts.js';

const PI = Math.PI;

function paintItems(items) {
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}

/** Hauteur relative des murs selon le stade du chantier. */
const kOf = (st, a = 0.38, b = 0.8) => (st === 1 ? a : st === 2 ? b : 1);

/** Parapet bas de toit-terrasse : deux côtés arrière, rappel `between`, puis deux côtés avant. */
function parapet(g, x0, y0, x1, y1, z, h, mat, between) {
  const t = 0.06;
  g.box(x0, y0, x1, y0 + t, z, z + h, mat, { ao: false, quick: true });
  g.box(x0, y0 + t, x0 + t, y1 - t, z, z + h, mat, { ao: false, quick: true });
  if (between) between();
  g.box(x1 - t, y0 + t, x1, y1 - t, z, z + h, mat, { ao: false, quick: true });
  g.box(x0, y1 - t, x1, y1, z, z + h, mat, { ao: false, quick: true });
}

/** Amphore de terre cuite. */
function amphora(g, x, y, z = 0, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.07 * s, z, z + 12 * s);
    return;
  }
  if (!g.drawing) return;
  g.cyl(x, y, 0.075 * s, z, z + 8 * s, { col: '#b86a3a' }, { ao: false });
  g.cyl(x, y, 0.045 * s, z + 8 * s, z + 12 * s, { col: '#c4784a' }, { ao: false });
  g.cyl(x, y, 0.06 * s, z + 11 * s, z + 12.6 * s, { col: '#8a4a26' }, { ao: false });
}

/** Perche dorée à flamme d'équipe. */
const flag = (g, x, y, z0, h, len = 17) => pennant(g, x, y, z0, h, { symbol: false, len, h: 8, poleCol: '#c9a13a', knob: GOLD });

// ---------------------------------------------------------------------------
// Maison de briques
// ---------------------------------------------------------------------------

function house(g) {
  const st = g.stage;
  const hW = st === 1 ? 11 : 24;
  const items = [];
  items.push({ d: -1.6, f: () => palm(g, -0.88, -0.78, 52, 1) });
  items.push({
    d: 0,
    f: () => {
      g.box(-0.6, -0.55, 0.52, 0.45, 0, hW, BRICK, {
        plan: true,
        topMat: { col: '#cdb07a' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          doorLocal(c, w * 0.3, h, 7, 13, { leaf: false });
          windowLocal(c, w * 0.72, h * 0.4, 3.2, 4.4, { shutters: false });
          c.fillStyle = '#4a3020';
          for (let u = 3; u < w; u += 5.4) {
            c.beginPath();
            c.arc(u, 2.3, 1.1, 0, 2 * PI);
            c.fill();
          }
          c.fillStyle = 'rgba(255,248,225,0.5)';
          c.fillRect(0, h * 0.62, w, 1.4);
        },
        decoR: (c, w, h) => {
          if (st < 2) return;
          windowLocal(c, w * 0.5, h * 0.36, 3.2, 4.4, { shutters: false });
          c.fillStyle = '#4a3020';
          for (let u = 3; u < w; u += 5.4) {
            c.beginPath();
            c.arc(u, 2.3, 1.1, 0, 2 * PI);
            c.fill();
          }
        },
      });
    },
  });
  if (st >= 2) {
    items.push({
      d: 0.1,
      f: () => {
        parapet(g, -0.6, -0.55, 0.52, 0.45, hW, 3.6, BRICK, () => {
          // pièce haute blanchie
          g.box(-0.42, -0.38, 0.08, 0.08, hW, hW + 13, PLASTER, {
            decoL: (c, w, h) => {
              doorLocal(c, w * 0.5, h, 6, 9, { leaf: false });
            },
          });
          g.box(-0.46, -0.42, 0.12, 0.12, hW + 13, hW + 15.4, SAND_L, { ao: false, quick: true });
        });
        // escalier extérieur vers le toit
        for (let i = 3; i >= 0; i--) {
          const y0 = 0.3 - 0.17 * i;
          g.box(0.52, y0, 0.78, y0 + 0.17, 0, 5 + 5 * i, BRICK, { ao: false, quick: true, topMat: { col: '#d4b886' } });
        }
      },
    });
  }
  if (st === 3) {
    items.push({ d: 1.3, f: () => amphora(g, 0.9, 0.55) });
    items.push({ d: 1.0, f: () => amphora(g, 0.74, 0.74, 0, 0.85) });
    items.push({ d: 1.1, f: () => sack(g, -0.75, 0.68, 0, { s: 0.85 }) });
    items.push({ d: 0.5, f: () => flag(g, -0.22, -0.2, hW + 15, 24, 15) });
  }
  if (st === 1) items.push({ d: 1, f: () => scaffoldBox(g, -0.6, -0.55, 0.52, 0.45, 20, { step: 0.45 }) });
  if (st === 2) items.push({ d: 1, f: () => stonePile(g, 0.95, 0.5, 4, '#c29563') });
  paintItems(items);
}
house.found = { stone: false };

// ---------------------------------------------------------------------------
// Caserne du pharaon
// ---------------------------------------------------------------------------

/** Petits boucliers de peau alignés sur une face (repère local). */
function shieldRow(c, tc, w, v, n, from = 0.1, to = 0.9) {
  for (let i = 0; i < n; i++) {
    const u = w * (from + ((to - from) * i) / Math.max(1, n - 1));
    c.fillStyle = '#4a3020';
    c.beginPath();
    c.ellipse(u + 0.5, v, 2.9, 4.4, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = tc.main;
    c.beginPath();
    c.ellipse(u, v, 2.7, 4.2, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = 'rgba(240,225,190,0.8)';
    c.fillRect(u - 0.4, v - 3.4, 0.8, 6.8);
  }
}

function barracks(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st);
  const hH = 34 * k;
  const items = [];
  items.push({ d: -2.3, f: () => palm(g, -1.6, -1.55, 54, 2) });
  // salle du fond
  items.push({
    d: -1.5,
    f: () => {
      g.box(-1.4, -1.4, 1.3, -0.5, 0, hH, BRICK, {
        plan: true,
        topMat: { col: '#cdb07a' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, 3.5, 4);
          shieldRow(c, tc, w, h * 0.55, 6, 0.27, 0.93);
          doorLocal(c, w * 0.11, h, 8, 16, { leaf: false });
          glyphBand(c, w * 0.18, w, h * 0.2, { rows: 1, size: 3.6, a: 0.6 });
        },
      });
      if (st >= 2) parapet(g, -1.4, -1.4, 1.3, -0.5, hH, 4, BRICK);
      if (st === 3) cornice(g, -1.4, -1.4, 1.3, -0.5, hH + 4, { stripe: false, col: '#d8b870', d: 0.03 });
    },
  });
  // aile droite
  items.push({
    d: 0.6,
    f: () => {
      g.box(0.55, -0.5, 1.3, 1.3, 0, hH, BRICK, {
        plan: true,
        topMat: { col: '#cdb07a' },
        decoR: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, 3.5, 4);
          doorLocal(c, w * 0.72, h, 8, 16, { leaf: false });
          shieldRow(c, tc, w, h * 0.55, 3, 0.15, 0.5);
        },
        decoL: (c, w, h) => {
          if (st < 2) return;
          glyphBand(c, 2, w - 2, h * 0.3, { rows: 1, size: 3.6, a: 0.6 });
        },
      });
      if (st >= 2) parapet(g, 0.55, -0.5, 1.3, 1.3, hH, 4, BRICK);
    },
  });
  // mur bas de la cour, porte
  items.push({
    d: 1.4,
    f: () => {
      g.box(-1.4, 1.15, 0.55, 1.3, 0, 12 * k + 2, BRICK, { plan: true, topMat: { col: '#cdb07a' }, decoL: (c, w, h) => { if (st >= 2) glyphBand(c, 2, w - 2, h * 0.45, { rows: 1, size: 3.2, a: 0.55 }); } });
      g.box(-0.55, 1.05, -0.2, 1.4, 0, 20 * k + 4, SAND_L, { ao: false, topMat: { col: '#e4cf98' } });
    },
  });
  if (st === 3) {
    items.push({ d: 0, f: () => weaponRack(g, -0.55, 0.1, 'x', 0.7, { n: 6, bows: true }) });
    items.push({ d: 0.4, f: () => target(g, 0.0, 0.5, 6.5) });
    items.push({ d: 0.5, f: () => weaponRack(g, -1.15, 0.55, 'y', 0.55, { n: 5 }) });
    items.push({ d: 1.6, f: () => flag(g, -0.375, 1.2, 24, 34, 18) });
    items.push({ d: 1.8, f: () => crate(g, -0.95, 0.95) });
    items.push({ d: 1.9, f: () => barrel(g, 0.3, 0.95) });
  }
  if (st === 1) items.push({ d: 2, f: () => scaffoldBox(g, -1.4, -1.4, 1.3, -0.5, 26, { step: 0.5 }) });
  if (st === 2) items.push({ d: 2, f: () => scaffoldBox(g, 0.55, -0.5, 1.3, 1.3, 30, { step: 0.6, sides: 'R' }) });
  paintItems(items);
}
barracks.found = { stone: false };

// ---------------------------------------------------------------------------
// Palais du nomarque
// ---------------------------------------------------------------------------

function hall(g) {
  const st = g.stage;
  const tc = g.tc;
  const zp = 7;
  const k = kOf(st, 0.3, 1);
  const items = [];
  items.push({ d: -3.2, f: () => palm(g, -1.95, -0.6, 60, 0) });
  items.push({ d: 0.5, f: () => palm(g, 1.98, 0.9, 54, 3) });
  // terrasse
  items.push({
    d: -3,
    f: () => {
      g.box(-1.85, -1.85, 1.85, 1.85, 0, zp, SAND_D, { plan: true, topMat: { col: '#d8c08a' } });
      // escalier d'accès
      g.box(-0.42, 1.85, 0.42, 2.0, 0, 2.6, SAND_D, { ao: false, quick: true, topMat: { col: '#dcc590' } });
      g.box(-0.42, 1.85, 0.42, 1.93, 2.6, 5, SAND_D, { ao: false, quick: true, topMat: { col: '#dcc590' } });
    },
  });
  // corps principal
  items.push({
    d: -1,
    f: () => {
      const z1 = zp + 38 * k;
      g.box(-1.45, -1.5, 1.35, 0.55, zp, z1, SAND_L, {
        plan: true,
        topMat: { col: '#e4cf98' },
        decoL: (c, w, h, pad) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, h * 0.12, 4.6);
          glyphBand(c, 3, w - 3, h * 0.3, { rows: 2, size: 4.4, a: 0.7 });
          doorLocal(c, w * 0.5, h, 11, 24, { leaf: false, arch: false });
          winged(c, w * 0.5, h * 0.58, 15);
        },
        decoR: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, h * 0.12, 4.6);
          glyphBand(c, 3, w - 3, h * 0.32, { rows: 2, size: 4.4, a: 0.7 });
        },
      });
      if (st === 3) cornice(g, -1.45, -1.5, 1.35, 0.55, z1);
    },
  });
  if (st === 3) {
    items.push({
      d: -0.5,
      f: () => {
        // étage de lumière : lanterneau à fentes
        g.box(-0.8, -1.05, 0.6, -0.1, zp + 41, zp + 57, SAND_L, {
          decoL: (c, w, h) => {
            for (let u = 4; u < w - 3; u += 7.5) {
              c.fillStyle = '#2b1d13';
              c.fillRect(u, h * 0.3, 2.6, h * 0.42);
            }
            teamFrieze(c, tc, 0, w, h * 0.06, 3.4);
          },
          decoR: (c, w, h) => {
            for (let u = 4; u < w - 3; u += 7.5) {
              c.fillStyle = '#2b1d13';
              c.fillRect(u, h * 0.3, 2.6, h * 0.42);
            }
          },
        });
        cornice(g, -0.8, -1.05, 0.6, -0.1, zp + 57);
      },
    });
  }
  // colonnade du portique et linteau
  if (st >= 2) {
    items.push({
      d: 0.3,
      f: () => {
        g.box(-1.4, 0.55, 1.3, 1.1, zp + 34, zp + 41, SAND_L, {
          topMat: { col: '#e4cf98' },
          decoL: (c, w, h) => {
            teamFrieze(c, tc, 0, w, 1.2, 3.6);
            glyphBand(c, 3, w - 3, h * 0.62, { rows: 1, size: 3.8, a: 0.75 });
          },
        });
        if (st === 3) {
          cornice(g, -1.4, 0.55, 1.3, 1.1, zp + 41);
        }
      },
    });
    const xs = [-1.22, -0.76, -0.3, 0.16, 0.62, 1.08];
    xs.forEach((x, i) => items.push({ d: x + 0.95 + i * 0.001, f: () => column(g, x, 0.92, zp, zp + 34, 0.085) }));
  }
  if (st === 3) {
    items.push({ d: 1.8, f: () => pool(g, -1.5, 1.3, -0.65, 1.72, zp) });
    items.push({ d: 2.6, f: () => flag(g, -1.62, 1.72, zp, 46, 18) });
    items.push({ d: 2.7, f: () => flag(g, 1.62, 1.72, zp, 46, 18) });
    items.push({ d: 2.1, f: () => amphora(g, 1.2, 1.5, zp) });
    items.push({ d: 2.2, f: () => amphora(g, 0.98, 1.66, zp, 0.85) });
    items.push({ d: 2.3, f: () => palm(g, -1.78, 1.1, 40, 4) });
  }
  if (st === 1) items.push({ d: 2, f: () => scaffoldBox(g, -1.45, -1.5, 1.35, 0.55, 28, { step: 0.55 }) });
  if (st === 2) {
    items.push({ d: 2, f: () => scaffoldBox(g, -1.45, -1.5, 1.35, 0.55, zp + 44, { step: 0.7, sides: 'R' }) });
    items.push({ d: 2.1, f: () => stonePile(g, 1.45, 1.5, 6, '#dcc088') });
  }
  paintItems(items);
}
hall.found = { stone: true };

// ---------------------------------------------------------------------------
// Temple d'Amon
// ---------------------------------------------------------------------------

function temple(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.36, 0.78);
  const items = [];
  items.push({ d: -2.6, f: () => palm(g, -1.5, -1.3, 52, 2) });
  // sanctuaire du fond
  items.push({
    d: -1.6,
    f: () => {
      g.box(-0.65, -1.45, 0.65, -0.75, 0, 46 * k, SAND_L, {
        plan: true,
        topMat: { col: '#e4cf98' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          glyphBand(c, 3, w - 3, h * 0.25, { rows: 3, size: 4.2, a: 0.7 });
          winged(c, w * 0.5, h * 0.78, 10);
        },
      });
      if (st === 3) cornice(g, -0.65, -1.45, 0.65, -0.75, 46);
    },
  });
  // salle hypostyle
  items.push({
    d: -0.6,
    f: () => {
      const z1 = 34 * k;
      g.box(-1.25, -0.75, 1.25, 0.35, 0, z1, SAND, {
        plan: true,
        topMat: { col: '#dcc590' },
        decoR: (c, w, h) => {
          if (st < 2) return;
          glyphBand(c, 3, w - 3, h * 0.3, { rows: 3, size: 4.4, a: 0.7 });
        },
        decoL: (c, w, h) => {
          if (st < 2) return;
          glyphBand(c, 3, w - 3, h * 0.32, { rows: 2, size: 4.4, a: 0.7 });
        },
      });
      if (st === 3) cornice(g, -1.25, -0.75, 1.25, 0.35, z1);
    },
  });
  if (st === 3) {
    items.push({
      d: -0.4,
      f: () => {
        g.box(-0.6, -0.6, 0.6, 0.15, 37, 46, SAND, { topMat: { col: '#dcc590' } });
        cornice(g, -0.6, -0.6, 0.6, 0.15, 46);
      },
    });
  }
  // pylône : deux tours à fruit et un portail
  const tw = (x0, x1) => ({
    d: 0.9 + (x0 + x1) * 0.1,
    f: () => {
      frustum(g, x0, 0.4, x1, 1.25, 0, 64 * k, 0.08, SAND_L, {
        decoL: (c, w, h, pad) => {
          if (st < 2) return;
          // grand relief : pharaon terrassant l'ennemi, bandeaux de hiéroglyphes
          teamFrieze(c, tc, 0, w, pad + h * 0.06, 5);
          glyphBand(c, 4, w - 4, pad + h * 0.2, { rows: 3, size: 4.6, a: 0.75 });
          c.fillStyle = rgba(GOLD, 0.6);
          c.fillRect(w * 0.3, pad + h * 0.5, w * 0.4, h * 0.16);
          glyphBand(c, 4, w - 4, pad + h * 0.78, { rows: 1, size: 4.4, a: 0.75 });
        },
        decoR: (c, w, h, pad) => {
          if (st < 2) return;
          glyphBand(c, 3, w - 3, pad + h * 0.3, { rows: 3, size: 4.4, a: 0.7 });
        },
      });
      if (st === 3) cornice(g, x0 + 0.08, 0.48, x1 - 0.08, 1.17, 64);
    },
  });
  items.push(tw(-1.4, -0.32));
  items.push(tw(0.32, 1.4));
  items.push({
    d: 1.0,
    f: () => {
      g.box(-0.34, 0.42, 0.34, 1.2, 0, 50 * k, SAND_L, {
        plan: true,
        topMat: { col: '#e4cf98' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          // portail sombre sous le disque solaire ailé
          c.fillStyle = '#2b1d13';
          c.fillRect(w * 0.5 - 6.5, h - 29, 13, 29);
          c.fillStyle = GOLD;
          c.fillRect(w * 0.5 - 7.4, h - 31, 14.8, 2);
          winged(c, w * 0.5, h - 40, 13);
        },
      });
      if (st === 3) cornice(g, -0.34, 0.42, 0.34, 1.2, 50);
    },
  });
  if (st === 3) {
    items.push({ d: 1.6, f: () => obelisk(g, -0.78, 1.46, 66, { w: 0.1 }) });
    items.push({ d: 2.1, f: () => obelisk(g, 0.78, 1.46, 66, { w: 0.1 }) });
    for (const [x, y] of [[-1.12, 1.3], [-0.6, 1.3], [0.6, 1.3], [1.12, 1.3]]) items.push({ d: x + y + 0.9, f: () => flag(g, x, y, 14, 54, 17) });
    items.push({ d: 2.4, f: () => amphora(g, 1.3, 1.45) });
  }
  if (st === 1) items.push({ d: 2, f: () => scaffoldBox(g, -1.4, 0.4, 1.4, 1.25, 28, { step: 0.5 }) });
  if (st === 2) items.push({ d: 2, f: () => scaffoldBox(g, -1.4, 0.4, 1.4, 1.25, 56, { step: 0.55, sides: 'L' }) });
  paintItems(items);
}
temple.found = { stone: true };

// ---------------------------------------------------------------------------
// Forteresse nubienne
// ---------------------------------------------------------------------------

function castle(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.35, 0.8);
  const wallH = 42 * k;
  const towerH = 66 * k;
  const items = [];
  const wallDeco = (hh) => (c, w, h, pad) => {
    if (st < 2) return;
    teamFrieze(c, tc, 0, w, (pad || 0) + 3, 3.4);
    glyphBand(c, 3, w - 3, (pad || 0) + h * 0.45, { rows: 1, size: 3.6, a: 0.5 });
    void hh;
  };
  const tower = (x, y, d) => ({
    d,
    f: () => {
      g.cyl(x, y, 0.52, 0, towerH, BRICK, { plan: true, ao: true });
      if (st >= 2) {
        roundCrenels(g, x, y, 0.52, towerH, BRICK, { h: 7, n: 12 });
        if (st === 3) {
          // fenêtres-meurtrières et bandeau d'équipe sur le fût
          g.cyl(x, y, 0.535, towerH * 0.78, towerH * 0.86, { col: tc.main }, { ao: false });
        }
      }
    },
  });
  // tour du fond et murs du fond
  items.push(tower(-2.35, -2.35, -4.7));
  items.push({
    d: -4,
    f: () => {
      frustum(g, -2.3, -2.4, 2.3, -2.0, 0, wallH, 0.05, BRICK, { decoL: wallDeco(), top: true, topMat: { col: '#cdb07a' }, plan: true });
      frustum(g, -2.4, -2.0, -2.0, 2.3, 0, wallH, 0.05, BRICK, { decoR: wallDeco(), top: true, topMat: { col: '#cdb07a' }, plan: true });
      if (st >= 2) {
        crenels(g, -2.3, -2.4, 2.3, -2.0, wallH, BRICK, { t: 0.1, h: 5, mw: 0.2, gap: 0.15, hp: 1.5 });
        crenels(g, -2.4, -2.0, -2.0, 2.3, wallH, BRICK, { t: 0.1, h: 5, mw: 0.2, gap: 0.15, hp: 1.5 });
      }
    },
  });
  items.push(tower(2.35, -2.35, -0.2));
  items.push(tower(-2.35, 2.35, -0.2));
  // donjon central
  items.push({
    d: -1.6,
    f: () => {
      const kh = 96 * k;
      frustum(g, -1.0, -1.25, 0.8, 0.55, 0, kh, 0.14, BRICK, {
        plan: true,
        topMat: { col: '#d4b886' },
        decoL: (c, w, h, pad) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, pad + h * 0.14, 4.4);
          for (const [fx, fy] of [[0.22, 0.4], [0.5, 0.4], [0.78, 0.4], [0.36, 0.68], [0.64, 0.68]]) {
            c.fillStyle = '#2b1d13';
            c.fillRect(w * fx - 1.6, pad + h * fy, 3.2, 7);
          }
          glyphBand(c, 4, w - 4, pad + h * 0.85, { rows: 1, size: 3.8, a: 0.55 });
        },
        decoR: (c, w, h, pad) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, pad + h * 0.14, 4.4);
          for (const [fx, fy] of [[0.3, 0.4], [0.7, 0.4], [0.5, 0.66]]) {
            c.fillStyle = '#2b1d13';
            c.fillRect(w * fx - 1.6, pad + h * fy, 3.2, 7);
          }
        },
      });
      if (st >= 2) {
        crenels(g, -0.86, -1.11, 0.66, 0.41, kh, BRICK, { t: 0.1, h: 5, mw: 0.2, gap: 0.15, hp: 1.5 });
        if (st === 3) {
          frustum(g, -0.45, -0.75, 0.25, -0.05, kh, kh + 22, 0.05, BRICK, { plan: false, topMat: { col: '#d4b886' }, decoL: (c, w, h) => winged(c, w * 0.5, h * 0.5, 12) });
          crenels(g, -0.4, -0.7, 0.2, -0.1, kh + 22, BRICK, { t: 0.08, h: 4, mw: 0.16, gap: 0.12, hp: 1 });
        }
      }
    },
  });
  // murs avant, portail et tours de porte
  const southWall = (x0, x1) => ({
    d: 1.6 + (x0 + x1) / 4,
    f: () => {
      frustum(g, x0, 2.0, x1, 2.4, 0, wallH, 0.05, BRICK, { decoL: wallDeco(), plan: true, topMat: { col: '#cdb07a' } });
      if (st >= 2) crenels(g, x0, 2.0, x1, 2.4, wallH, BRICK, { t: 0.1, h: 5, mw: 0.2, gap: 0.15, hp: 1.5 });
    },
  });
  items.push(southWall(-2.3, -0.75));
  items.push(southWall(0.75, 2.3));
  items.push({
    d: 1.4,
    f: () => {
      frustum(g, 2.0, -2.0, 2.4, 2.0, 0, wallH, 0.05, BRICK, { decoR: wallDeco(), plan: true, topMat: { col: '#cdb07a' } });
      if (st >= 2) crenels(g, 2.0, -2.0, 2.4, 2.0, wallH, BRICK, { t: 0.1, h: 5, mw: 0.2, gap: 0.15, hp: 1.5 });
    },
  });
  items.push({
    d: 2.3,
    f: () => {
      // tours de porte carrées à fruit et passage
      const gh = 62 * k;
      for (const [x0, x1] of [[-0.98, -0.42], [0.42, 0.98]]) {
        frustum(g, x0, 1.9, x1, 2.5, 0, gh, 0.06, BRICK, {
          plan: true,
          topMat: { col: '#d4b886' },
          decoL: (c, w, h, pad) => {
            if (st < 2) return;
            teamFrieze(c, tc, 0, w, pad + h * 0.12, 3.6);
            c.fillStyle = '#2b1d13';
            c.fillRect(w * 0.5 - 1.3, pad + h * 0.4, 2.6, 7);
          },
        });
        if (st >= 2) crenels(g, x0 + 0.06, 1.96, x1 - 0.06, 2.44, gh, BRICK, { t: 0.09, h: 5, mw: 0.16, gap: 0.12, hp: 1.2 });
      }
      g.box(-0.42, 1.95, 0.42, 2.45, 38 * k, 50 * k, SAND_D, {
        topMat: { col: '#d4b886' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          glyphBand(c, 3, w - 3, h * 0.45, { rows: 1, size: 3.6, a: 0.8 });
        },
      });
      if (st >= 2) {
        // baie de la porte : passage sombre sous une voûte, herse
        g.faceL(-0.42, 0.42, 2.45, 0, 38 * k, DARK, { k: 0.9, line: false, deco: (c, w, h) => {
          c.strokeStyle = 'rgba(170,140,90,0.7)';
          c.lineWidth = 1;
          for (let u = 3; u < w; u += 4) {
            c.beginPath();
            c.moveTo(u, 2);
            c.lineTo(u, h * 0.5);
            c.stroke();
          }
        } });
      }
    },
  });
  items.push(tower(2.35, 2.35, 4.5));
  if (st === 3) {
    items.push({ d: 4.6, f: () => flag(g, 2.35, 2.35, towerH + 7, 40, 20) });
    items.push({ d: 4.4, f: () => flag(g, -2.35, 2.35, towerH + 7, 34, 18) });
    items.push({ d: 0.1, f: () => flag(g, -0.1, -0.4, 96 + 22 + 5, 34, 20) });
    items.push({ d: 3.4, f: () => palm(g, -1.4, 1.5, 44, 1) });
    items.push({ d: 3.5, f: () => barrel(g, 1.2, 1.55) });
    items.push({ d: 3.6, f: () => sack(g, 1.45, 1.35, 0, { s: 0.9 }) });
  }
  if (st === 1) items.push({ d: 5, f: () => scaffoldBox(g, -0.98, 1.9, 0.98, 2.5, 26, { step: 0.5 }) });
  if (st === 2) {
    items.push({ d: 5, f: () => scaffoldBox(g, -0.98, 1.9, 0.98, 2.5, 60, { step: 0.5, sides: 'L' }) });
    items.push({ d: 5.1, f: () => plankPile(g, 1.3, 1.6, 'x', 4, 0.6) });
  }
  paintItems(items);
}
castle.found = { stone: true };

// ---------------------------------------------------------------------------
// Bazar
// ---------------------------------------------------------------------------

function market(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.4, -1.4, 1.4, 1.4);
    return;
  }
  const items = [];
  items.push({ d: -2.4, f: () => palm(g, -1.45, -1.3, 50, 3) });
  // auvent à rayures de lin et de couleur d'équipe
  const stall = (x0, y0, x1, y1, d, tone1) => {
    items.push({
      d,
      f: () => {
        const zA = 22;
        const posts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        // étal : table de bois basse
        if (st >= 2) g.box(x0 + 0.1, y0 + 0.1, x1 - 0.1, y1 - 0.1, 0, 8, { col: '#8a5a32' }, { ao: false, quick: true, topMat: { col: '#d8c7a0' } });
        for (const [px, py] of posts.filter(([, y]) => y <= y0 + 0.01)) g.post(px, py, 0, zA, '#6f4a2a', 2.2);
        if (st >= 2) {
          for (const [px, py] of posts.filter(([, y]) => y > y0 + 0.01)) g.post(px, py, 0, zA - 3, '#6f4a2a', 2.2);
          g.box(x0 - 0.06, y0 - 0.06, x1 + 0.06, y1 + 0.06, zA - 1, zA + 2, { col: '#efe4c4' }, {
            ao: false,
            topMat: { col: '#efe4c4' },
            decoT: (c, w, h) => {
              for (let u = 0; u < w; u += 9) {
                c.fillStyle = tone1 || tc.main;
                c.fillRect(u, 0, 4.5, h);
              }
            },
            decoL: (c, w, h) => {
              for (let u = 0; u < w; u += 9) {
                c.fillStyle = tone1 || tc.main;
                c.fillRect(u, 0, 4.5, h);
              }
            },
            decoR: (c, w, h) => {
              for (let u = 0; u < w; u += 9) {
                c.fillStyle = tone1 || tc.main;
                c.fillRect(u, 0, 4.5, h);
              }
            },
          });
        }
        if (st === 3) {
          sack(g, x0 + 0.25, y1 - 0.25, 8, { s: 0.6, col: '#d8c49a' });
          amphora(g, x1 - 0.28, y1 - 0.25, 8, 0.6);
        }
      },
    });
  };
  stall(-1.3, -1.35, -0.25, -0.35, -1.4, null);
  stall(0.1, -1.35, 1.25, -0.35, -0.8, '#e0b23a');
  stall(-1.35, 0.1, -0.4, 1.0, 0.0, '#2a8a82');
  if (st === 3) {
    items.push({
      d: 1.0,
      f: () => {
        // grande balance du marché : poteau, fléau et deux plateaux
        g.post(0.5, 0.5, 0, 34, '#6f4a2a', 2.4);
        g.beam(0.25, 0.5, 34, 0.75, 0.5, 34, '#c9a13a', 1.8);
        g.beam(0.25, 0.5, 34, 0.25, 0.5, 22, '#b89a5a', 0.7);
        g.beam(0.75, 0.5, 34, 0.75, 0.5, 22, '#b89a5a', 0.7);
        g.box(0.14, 0.42, 0.36, 0.58, 20, 22, { col: '#d8c08a' }, { ao: false, quick: true });
        g.box(0.64, 0.42, 0.86, 0.58, 20, 22, { col: '#d8c08a' }, { ao: false, quick: true });
      },
    });
    items.push({ d: 1.4, f: () => amphora(g, 1.0, 1.0) });
    items.push({ d: 1.5, f: () => amphora(g, 1.2, 0.85, 0, 0.85) });
    items.push({ d: 1.3, f: () => crate(g, 0.0, 1.1) });
    items.push({ d: 1.6, f: () => sack(g, 0.15, 1.3, 0, { s: 0.9 }) });
    items.push({ d: 1.7, f: () => barrel(g, 0.7, 1.25) });
    items.push({ d: 2.0, f: () => flag(g, 1.25, 1.3, 0, 38, 16) });
  }
  if (st === 1) items.push({ d: 2, f: () => plankPile(g, 0.5, 0.9, 'x', 3, 0.6) });
  if (st === 2) items.push({ d: 2, f: () => scaffold(g, [[-1.35, 1.1], [-0.4, 1.1], [0.6, 1.1]], 26, {}) });
  paintItems(items);
}
market.found = { stone: false };

// ---------------------------------------------------------------------------
// Maison de vie (académie)
// ---------------------------------------------------------------------------

function academy(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.82);
  const items = [];
  items.push({ d: -2.4, f: () => palm(g, 1.45, -1.35, 50, 4) });
  items.push({
    d: -1,
    f: () => {
      const z1 = 32 * k;
      g.box(-1.15, -1.25, 1.15, -0.05, 0, z1, PLASTER, {
        plan: true,
        topMat: { col: '#e4cf98' },
        decoL: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, h * 0.1, 4);
          glyphBand(c, 3, w - 3, h * 0.3, { rows: 2, size: 4.2, a: 0.75 });
          doorLocal(c, w * 0.5, h, 9, 18, { leaf: false });
        },
        decoR: (c, w, h) => {
          if (st < 2) return;
          // casiers à rouleaux de papyrus : grille de bouts de rouleaux dans des niches sombres
          c.fillStyle = '#3a2a1a';
          c.fillRect(w * 0.12, h * 0.22, w * 0.76, h * 0.56);
          for (let r = 0; r < 4; r++) {
            for (let cc = 0; cc < 7; cc++) {
              c.fillStyle = cc % 3 === 1 ? '#e8d8a8' : '#f4ecd0';
              c.beginPath();
              c.arc(w * 0.12 + 3.4 + cc * (w * 0.76 - 6) / 6, h * 0.22 + 3.8 + r * 5.6, 1.9, 0, 2 * PI);
              c.fill();
              c.strokeStyle = 'rgba(120,90,50,0.8)';
              c.lineWidth = 0.4;
              c.stroke();
            }
          }
        },
      });
      if (st === 3) cornice(g, -1.15, -1.25, 1.15, -0.05, z1);
    },
  });
  if (st >= 2) {
    items.push({
      d: 0.1,
      f: () => {
        g.box(-1.2, -0.05, 1.2, 0.5, 26 * k + 0, 33 * k + 1, SAND_L, {
          topMat: { col: '#e4cf98' },
          decoL: (c, w, h) => {
            teamFrieze(c, tc, 0, w, 1, 3.2);
          },
        });
        if (st === 3) cornice(g, -1.2, -0.05, 1.2, 0.5, 34);
      },
    });
    const xs = [-1.0, -0.5, 0.0, 0.5, 1.0];
    xs.forEach((x, i) => items.push({ d: x + 0.4 + i * 0.001, f: () => column(g, x, 0.36, 0, 26 * k, 0.075, { cap: '#5e9a4a', cap2: '#2fa8a0' }) }));
  }
  if (st === 3) {
    items.push({
      d: 0,
      f: () => {
        // disque solaire ailé sur la corniche : plaque d'or posée sur le toit
        g.box(-0.3, -0.7, 0.3, -0.45, 34, 44, SAND_L, { decoL: (c, w, h) => winged(c, w * 0.5, h * 0.55, w * 0.46), ao: false });
      },
    });
    items.push({
      d: 1.6,
      f: () => {
        // pupitre du scribe : table basse, rouleau déroulé et calame
        g.box(-0.98, 1.0, -0.44, 1.34, 0, 9, { col: '#8a5a32' }, { ao: false, quick: true, topMat: { col: '#efe4c4' } });
        const c = g.ctx;
        const p = g.P(-0.71, 1.17, 9);
        c.fillStyle = '#f2e8c6';
        c.beginPath();
        c.moveTo(p[0] - 9, p[1] - 1);
        c.lineTo(p[0] + 9, p[1] + 3);
        c.lineTo(p[0] + 9, p[1] + 5);
        c.lineTo(p[0] - 9, p[1] + 1);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(90,60,30,0.7)';
        c.lineWidth = 0.6;
        c.stroke();
        c.strokeStyle = '#5a3a1c';
        c.lineWidth = 0.6;
        for (let i = -6; i <= 6; i += 3) {
          c.beginPath();
          c.moveTo(p[0] + i, p[1] + 0.5 + i * 0.2);
          c.lineTo(p[0] + i + 1.6, p[1] + 1 + i * 0.2);
          c.stroke();
        }
        c.fillStyle = '#e8d8a8';
        c.beginPath();
        c.ellipse(p[0] - 10, p[1] - 0.2, 1.8, 2.4, 0, 0, 2 * PI);
        c.fill();
        c.stroke();
      },
    });
    items.push({ d: 1.9, f: () => flag(g, 1.2, 0.7, 0, 52, 17) });
    items.push({ d: 1.8, f: () => pool(g, 0.3, 0.95, 1.1, 1.3, 0) });
    items.push({ d: 1.0, f: () => amphora(g, 1.3, 0.3) });
  }
  if (st === 1) items.push({ d: 2, f: () => scaffoldBox(g, -1.15, -1.25, 1.15, -0.05, 26, { step: 0.5 }) });
  if (st === 2) items.push({ d: 2, f: () => stonePile(g, 1.3, 0.9, 5, '#e4cf98') });
  paintItems(items);
}
academy.found = { stone: true };

// ---------------------------------------------------------------------------
// Monument : obélisque
// ---------------------------------------------------------------------------

function monument(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.9, -0.9, 0.9, 0.9);
    return;
  }
  const items = [];
  items.push({
    d: -0.3,
    f: () => {
      g.box(-0.9, -0.9, 0.9, 0.9, 0, 6, SAND_D, { topMat: { col: '#d8c08a' }, decoL: (c, w, h) => { if (st >= 2) glyphBand(c, 3, w - 3, h * 0.35, { rows: 1, size: 3.6, a: 0.6 }); } });
      g.box(-0.7, -0.7, 0.7, 0.7, 6, 12, SAND, { topMat: { col: '#dcc590' } });
      g.box(-0.5, -0.5, 0.5, 0.5, 12, 17, SAND_L, { topMat: { col: '#e4cf98' }, decoL: (c, w, h) => { if (st >= 2) teamFrieze(c, tc, 0, w, h * 0.3, 3.4); }, decoR: (c, w, h) => { if (st >= 2) teamFrieze(c, tc, 0, w, h * 0.3, 3.4); } });
    },
  });
  if (st === 1) {
    items.push({ d: 0, f: () => obelisk(g, 0, 0, 34, { w: 0.2, z0: 17, col: '#c98e7a' }) });
    items.push({ d: 1, f: () => scaffoldBox(g, -0.5, -0.5, 0.5, 0.5, 40, { step: 0.5 }) });
  } else {
    items.push({ d: 0, f: () => obelisk(g, 0, 0, st === 2 ? 84 : 104, { w: 0.2, z0: 17, col: '#c98e7a' }) });
  }
  if (st === 3) {
    items.push({ d: 1.5, f: () => flag(g, 0.74, 0.74, 12, 34, 15) });
    items.push({ d: 0.3, f: () => flag(g, -0.74, 0.74, 12, 30, 15) });
    items.push({ d: 1.0, f: () => amphora(g, 0.74, 0.3, 12, 0.8) });
    items.push({ d: 1.0, f: () => amphora(g, 0.3, 0.74, 12, 0.8) });
  }
  if (st === 2) items.push({ d: 1.2, f: () => stonePile(g, 0.95, 0.3, 4, '#c98e7a') });
  paintItems(items);
}
monument.found = { stone: true };

// ---------------------------------------------------------------------------
// Grande pyramide de Gizeh
// ---------------------------------------------------------------------------

function wonder(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-2.9, -2.9, 2.9, 2.9);
    return;
  }
  const items = [];
  const PR = 2.35;
  const PC = -0.45;
  const H = st === 1 ? 62 : st === 2 ? 150 : 206;
  const r1 = st === 3 ? 0 : PR * (1 - H / 206);
  // petites pyramides de reines, à l'arrière et à droite
  items.push({ d: -5.3, f: () => pyramid(g, -2.15, -2.3, 0.5, 0, st === 1 ? 10 : 46, { col: '#e4cfa0', courses: 7, cap: st === 3 ? 8 : 0, r1: st === 1 ? 0.3 : 0 }) });
  items.push({ d: -3.5, f: () => pyramid(g, 2.4, -2.0, 0.5, 0, st === 1 ? 10 : 42, { col: '#e4cfa0', courses: 7, cap: st === 3 ? 8 : 0, r1: st === 1 ? 0.3 : 0 }) });
  // grande pyramide
  items.push({
    d: -2,
    f: () => {
      // socle de pierre de taille
      g.box(PC - PR - 0.1, PC - PR - 0.1, PC + PR + 0.1, PC + PR + 0.1, 0, 4, SAND_D, { ao: false, quick: true, topMat: { col: '#d8c08a' } });
      pyramid(g, PC, PC, PR, 4, H, { col: '#ecd08a', r1, cap: st === 3 ? 16 : 0, topMat: SAND_L, courses: Math.round(H / 6.5) });
    },
  });
  if (st >= 2) {
    // temple funéraire au pied de la face avant et chaussée
    items.push({
      d: 2.4,
      f: () => {
        const k = st === 2 ? 0.8 : 1;
        g.box(0.95, 0.95, 2.6, 2.6, 0, 22 * k, SAND_L, {
          topMat: { col: '#e4cf98' },
          decoL: (c, w, h, pad) => {
            teamFrieze(c, tc, 0, w, h * 0.1, 4);
            glyphBand(c, 3, w - 3, h * 0.36, { rows: 2, size: 4.2, a: 0.7 });
            doorLocal(c, w * 0.5, h, 9, 14, { leaf: false });
          },
          decoR: (c, w, h) => {
            teamFrieze(c, tc, 0, w, h * 0.1, 4);
            glyphBand(c, 3, w - 3, h * 0.36, { rows: 2, size: 4.2, a: 0.7 });
          },
        });
        if (st === 3) {
          cornice(g, 0.95, 0.95, 2.6, 2.6, 22);
          g.box(1.3, 1.3, 2.25, 2.25, 25, 35, SAND, { topMat: { col: '#dcc590' }, decoL: (c, w, h) => winged(c, w * 0.5, h * 0.55, w * 0.42), ao: false });
          cornice(g, 1.3, 1.3, 2.25, 2.25, 35, { stripe: false });
        }
      },
    });
  }
  if (st === 3) {
    items.push({ d: 4.2, f: () => obelisk(g, 1.15, 2.95, 70, { w: 0.11 }) });
    items.push({ d: 4.4, f: () => obelisk(g, 2.95, 1.15, 70, { w: 0.11 }) });
    items.push({ d: 3.4, f: () => flag(g, 0.95, 2.6, 22, 44, 19) });
    items.push({ d: 3.5, f: () => flag(g, 2.6, 0.95, 22, 44, 19) });
    items.push({ d: 1.2, f: () => palm(g, -2.8, 1.2, 58, 2) });
    items.push({ d: 1.6, f: () => palm(g, -2.4, 2.4, 50, 0) });
    items.push({ d: 0.4, f: () => palm(g, 2.75, -0.6, 56, 4) });
    items.push({ d: 2.0, f: () => palm(g, -1.5, 2.9, 44, 3) });
  }
  if (st < 3) {
    // chantier : rampe de halage en briques crues, blocs et traîneaux, perches à cordes
    items.push({
      d: 1,
      f: () => {
        const c = g.ctx;
        if (!g.drawing) return;
        // rampe inclinée le long de la face droite
        const a = g.P(PC + PR + 0.15, PC + PR, 4);
        const b = g.P(PC + PR + 0.15, PC - PR * 0.1, st === 1 ? 40 : 100);
        const a2 = g.P(PC + PR + 0.6, PC + PR, 4);
        const b2 = g.P(PC + PR + 0.6, PC - PR * 0.1, st === 1 ? 40 : 100);
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.lineTo(b2[0], b2[1]);
        c.lineTo(a2[0], a2[1]);
        c.closePath();
        c.fillStyle = '#b98a58';
        c.fill();
        c.strokeStyle = 'rgba(70,45,20,0.7)';
        c.lineWidth = 0.9;
        c.stroke();
        c.strokeStyle = 'rgba(90,60,30,0.5)';
        c.lineWidth = 0.6;
        c.beginPath();
        for (let i = 1; i < 12; i++) {
          const f = i / 12;
          c.moveTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
          c.lineTo(a2[0] + (b2[0] - a2[0]) * f, a2[1] + (b2[1] - a2[1]) * f);
        }
        c.stroke();
      },
    });
    items.push({ d: 4.5, f: () => stonePile(g, 1.2, 2.9, 8, '#e6cf98') });
    items.push({ d: 4.6, f: () => stonePile(g, 2.8, 2.5, 6, '#dcc088') });
    items.push({ d: 4.7, f: () => plankPile(g, 0.2, 2.9, 'x', 4, 0.8) });
  }
  paintItems(items);
}
wonder.custom = false;
wonder.found = { stone: true };

export const EGYPT = { house, barracks, hall, temple, castle, market, academy, monument, wonder };

void [SAND, DARK, TURQ, RED, LAPIS, GOLD_D, FLOOR, HX, PI];
