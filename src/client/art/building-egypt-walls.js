// Murailles égyptiennes : enceintes de briques crues (mur, grand rempart), portes à tours à fruit et mâts d'oriflammes,
// palissade basse de briques et de roseaux, bastion nubien (fort à talus) et poste de guet. Ces pièces réutilisent le
// moteur de pièces raccordables de building-walls.js (masque de voisinage, chantier, chemin de ronde).
// Couleurs d'équipe : disque et bandeau peints sur les faces, oriflammes au bout de mâts dorés.
import { K_LEFT, K_RIGHT, tone, texStone } from './building-gfx.js';
import { crenels, scaffoldBox, stonePile, plankPile } from './building-parts.js';
import { pennant, barrel, sack } from './building-props.js';
import { wallPiece, gatePiece, boxUV, uvRect, uvPt, per32 } from './building-walls.js';
import { ctexStone } from './building-gfx.js';
import { BRICK, SAND_D, SAND_L, GOLD, LAPIS, palm, teamFrieze, glyphBand, winged, frustum, cornice } from './building-egypt-parts.js';

const PI = Math.PI;

const MUD = { col: '#c4905a', tex: per32(texStone, 31), rh: 4.6, sw: 9.5, tile: true, rows: true };
const MUD_BIG = { col: '#c4905a', tex: per32(texStone, 32), rh: 5.6, sw: 11.5, tile: true, rows: true };
const LIME = { col: '#f0d797', tex: per32(texStone, 33), rh: 5, sw: 10.5, tile: true, rows: true };

const flagOf = (g, x, y, z0, h, len = 17) => pennant(g, x, y, z0, h, { symbol: false, len, h: 8, poleCol: '#c9a13a', knob: GOLD });

/** Disque solaire d'équipe et bandeau de lapis sur une face (repère local). */
function mark(c, tc, u, h, r = 4) {
  c.fillStyle = LAPIS;
  c.fillRect(u - r - 2.6, h * 0.1, (r + 2.6) * 2, 1.6);
  c.fillStyle = tc.main;
  c.beginPath();
  c.arc(u, h * 0.6, r, 0, 2 * PI);
  c.fill();
  c.fillStyle = '#f3e3a8';
  c.beginPath();
  c.arc(u, h * 0.6, r * 0.45, 0, 2 * PI);
  c.fill();
}

const EG_WALL = {
  civ: 'egypt', e: 0.19, pe: 0.27, R: 0.5, h: 44, hp: 56,
  mat: MUD, pmat: MUD, topCol: '#d6b47c', coreCol: '#9a7448', merCol: '#e1c690', mh: 7, mt: 0.075, mw: 0.15,
  centers: [-1 / 3, 0, 1 / 3], straightDeco: true, faceMark: (c, tc, u, h) => mark(c, tc, u, h, 3.6),
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const d = 0.04;
    g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 4, hp, LIME, { ao: false, topMat: { col: '#e4cf98' } });
    g.box(-pe - d - 0.02, -pe - d - 0.02, pe + d + 0.02, pe + d + 0.02, hp - 6.6, hp - 4, { col: LAPIS }, { ao: false, quick: true, top: false });
    crenels(g, -pe - d, -pe - d, pe + d, pe + d, hp, { col: '#e8d3a0' }, { h: 6, t: 0.085, mw: 0.12, gap: 0.085, hp: 2 });
    flagOf(g, 0, 0, hp + 2, A.n <= 1 ? 26 : 18, A.n <= 1 ? 17 : 14);
  },
};

const EG_GATE = {
  ...EG_WALL,
  gateTop(g, S, ax, ht, hc, pw, ev) {
    // tours à corniche dorée, mâts d'oriflammes de part et d'autre du passage
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.03, -ev + 0.03, u1 - 0.03, ev - 0.03);
      cornice(g, x0, y0, x1, y1, ht, { stripe: true });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    flagOf(g, bx, by, ht + 3, 34, 18);
    flagOf(g, fx, fy, ht + 3, 34, 18);
  },
  centerDeco(g, S, st, arch) {
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) winged(c, w * 0.5, h * 0.12, 9);
    };
  },
};

const EG_RAMP = {
  ...EG_WALL,
  e: 0.42, pe: 0.58, R: 1, h: 66, hp: 76, mat: MUD_BIG, pmat: MUD_BIG, mh: 10, mt: 0.11, mw: 0.22,
  centers: [-0.8, -0.4, 0, 0.4, 0.8], faceMark: undefined, straightDeco: false,
  faceDeco(g, S, a, b, st) {
    if (st < 3 || a > -S.R + 0.01 || b < S.R - 0.01) return null;
    const tc = g.tc;
    return (c, w, h) => {
      teamFrieze(c, tc, 0, w, h * 0.06, 5);
      glyphBand(c, 4, w - 4, h * 0.3, { rows: 1, size: 4.6, a: 0.55 });
      winged(c, w * 0.5, h * 0.62, 16);
      c.fillStyle = '#2b1d13';
      for (const f of [0.17, 0.83]) c.fillRect(w * f - 1.1, h * 0.32, 2.2, 10);
    };
  },
  pdeco(g, S, hp) {
    return (c, w, h) => {
      c.fillStyle = '#2b1d13';
      c.fillRect(w * 0.5 - 1.1, h * 0.35, 2.2, 10);
      c.fillStyle = LAPIS;
      c.fillRect(0, h * 0.08, w, 2);
      void hp;
    };
  },
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const d = 0.07;
    g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 7, hp, LIME, { ao: false, topMat: { col: '#e4cf98' } });
    crenels(g, -pe - d, -pe - d, pe + d, pe + d, hp, { col: '#e8d3a0' }, { h: 9, t: 0.12, mw: 0.19, gap: 0.12, hp: 3 });
    flagOf(g, 0, 0, hp + 2, 32, 20);
    if (A.n >= 2) flagOf(g, pe * 0.7, pe * 0.7, hp + 4, 16, 14);
  },
};

const EG_GG = {
  ...EG_RAMP,
  faceDeco: null,
  pw: 0.5, ev: 0.62, ht: 92, hc: 66, archW: 26, archH: 42, doorW: 3.4, gPitch: 0.3,
  gateMark: (g, S, st) => (c, w, h) => {
    if (st < 3) return;
    const tc = g.tc;
    teamFrieze(c, tc, 0, w, h * 0.08, 4.6);
    c.fillStyle = '#2b1d13';
    c.fillRect(w / 2 - 1.2, h * 0.4, 2.4, 11);
    mark(c, tc, w / 2, h * 0.9, 4.4);
  },
  centerDeco(g, S, st, arch) {
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) winged(c, w * 0.5, h * 0.1, 14);
    };
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    // pylône : corniche dorée sur chaque tour, mâts à oriflammes
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.04, -ev + 0.04, u1 - 0.04, ev - 0.04);
      cornice(g, x0, y0, x1, y1, ht, { stripe: true });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    flagOf(g, bx, by, ht + 3, 46, 20);
    flagOf(g, fx, fy, ht + 3, 46, 20);
    const [cx, cy] = uvPt(ax, 0, 0);
    flagOf(g, cx, cy, hc + 2, 22, 16);
  },
};
delete EG_GG.pdeco;

/** Palissade : mur bas de briques crues coiffé d'un lit de roseaux liés. */
const EG_PAL = {
  ...EG_WALL, e: 0.09, pe: 0.16, h: 26, hp: 32, mat: MUD, pmat: MUD, mh: 4, mt: 0.045, mw: 0.12, straightDeco: false, faceMark: undefined,
  centers: [-0.375, -0.125, 0.125, 0.375],
  pillarTop(g, S, hp) {
    g.box(-0.2, -0.2, 0.2, 0.2, hp - 3, hp, LIME, { ao: false, quick: true, topMat: { col: '#e4cf98' } });
    flagOf(g, 0, 0, hp, 18, 12);
  },
};
const EG_PAL_GATE = {
  ...EG_PAL, pw: 0.2, ev: 0.14, ht: 36, hc: 30, archW: 10, archH: 18, gPitch: 0.13, noCenterMerlons: true,
  gateTop(g, S, ax, ht) {
    const [bx, by] = uvPt(ax, -(S.R + 0.2) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + 0.2) / 2, 0);
    flagOf(g, bx, by, ht, 22, 13);
    flagOf(g, fx, fy, ht, 22, 13);
  },
};

function piece(S, kind) {
  const f = (g) => {
    if (g.mode === 'plan') return;
    (kind === 'gate' ? gatePiece : wallPiece)(g, S);
  };
  f.custom = true;
  f.noFlag = true;
  return f;
}

// ---------------------------------------------------------------------------
// Bastion nubien (3×3) : fort de briques crues à talus, deux étages, chemin de ronde crénelé
// ---------------------------------------------------------------------------

function bastion(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = st === 1 ? 0.4 : st === 2 ? 0.8 : 1;
  const items = [];
  const face = (w1) => (c, w, h, pad) => {
    if (st < 2) return;
    teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.1, 4);
    c.fillStyle = '#2b1d13';
    for (const f of w1) c.fillRect(w * f - 1.2, (pad || 0) + h * 0.45, 2.4, 9);
    glyphBand(c, 4, w - 4, (pad || 0) + h * 0.82, { rows: 1, size: 3.8, a: 0.5 });
  };
  items.push({ d: -3, f: () => palm(g, -1.25, -1.2, 58, 1) });
  items.push({
    d: -1,
    f: () => {
      frustum(g, -1.3, -1.3, 1.3, 1.3, 0, 54 * k, 0.17, BRICK, {
        plan: true, topMat: { col: '#d8c08a' }, decoL: face([0.2, 0.5, 0.8]), decoR: face([0.25, 0.5, 0.75]),
      });
      if (st >= 2) crenels(g, -1.13, -1.13, 1.13, 1.13, 54 * k, { col: '#d9bd86' }, { t: 0.1, h: 6, mw: 0.2, gap: 0.14, hp: 2 });
    },
  });
  // porte d'entrée en arc sombre sur la face avant
  if (st >= 2) {
    items.push({
      d: 0.2,
      f: () => g.faceL(-0.2, 0.2, 1.135, 0, 22, { col: '#2b1d13' }, { k: 0.9, line: false, deco: (c, w, h) => {
        c.strokeStyle = 'rgba(170,140,90,0.6)';
        c.lineWidth = 1;
        for (let u = 3; u < w; u += 4) {
          c.beginPath();
          c.moveTo(u, 3);
          c.lineTo(u, h);
          c.stroke();
        }
      } }),
    });
  }
  items.push({
    d: 0,
    f: () => {
      const z0 = 54 * k;
      frustum(g, -0.75, -0.75, 0.75, 0.75, z0, z0 + 36 * k, 0.1, SAND_L, {
        plan: false, topMat: { col: '#e6d29c' },
        decoL: (c, w, h, pad) => { if (st >= 2) { teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.12, 4); c.fillStyle = '#2b1d13'; c.fillRect(w * 0.5 - 1.3, (pad || 0) + h * 0.45, 2.6, 8); } },
        decoR: (c, w, h, pad) => { if (st >= 2) { teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.12, 4); c.fillStyle = '#2b1d13'; c.fillRect(w * 0.5 - 1.3, (pad || 0) + h * 0.45, 2.6, 8); } },
      });
      if (st >= 2) crenels(g, -0.66, -0.66, 0.66, 0.66, z0 + 36 * k, { col: '#eedaa6' }, { t: 0.09, h: 5, mw: 0.17, gap: 0.12, hp: 1.6 });
    },
  });
  if (st === 3) {
    items.push({ d: 1, f: () => flagOf(g, 0, 0, 92, 40, 22) });
    items.push({ d: 2.5, f: () => flagOf(g, 1.22, 1.22, 54, 20, 15) });
    items.push({ d: 2.6, f: () => barrel(g, 1.0, 1.42) });
    items.push({ d: 2.7, f: () => sack(g, -0.9, 1.45, 0, { s: 0.9 }) });
  }
  if (st === 1) items.push({ d: 4, f: () => scaffoldBox(g, -1.3, -1.3, 1.3, 1.3, 40, { step: 0.6 }) });
  if (st === 2) {
    items.push({ d: 4, f: () => scaffoldBox(g, -1.3, -1.3, 1.3, 1.3, 64, { step: 0.7, sides: 'R' }) });
    items.push({ d: 4.1, f: () => stonePile(g, 1.0, 1.45, 5, '#c29563') });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
bastion.found = { stone: true };

// ---------------------------------------------------------------------------
// Poste de guet (1×1) : petite tour de briques crues à fruit et toit-terrasse à auvent de roseaux
// ---------------------------------------------------------------------------

function outpost(g) {
  const st = g.stage;
  const tc = g.tc;
  const k = st === 1 ? 0.42 : st === 2 ? 0.8 : 1;
  const H = 62 * k;
  if (g.mode === 'plan') {
    g.planRect(-0.3, -0.3, 0.3, 0.3);
    return;
  }
  frustum(g, -0.3, -0.3, 0.3, 0.3, 0, H, 0.06, BRICK, {
    plan: true, topMat: { col: '#d8c08a' },
    decoL: (c, w, h, pad) => {
      if (st < 2) return;
      teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.14, 3.2);
      c.fillStyle = '#2b1d13';
      c.fillRect(w * 0.5 - 1, (pad || 0) + h * 0.5, 2, 6);
    },
    decoR: (c, w, h, pad) => {
      if (st < 2) return;
      teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.14, 3.2);
    },
  });
  if (st >= 2) crenels(g, -0.25, -0.25, 0.25, 0.25, H, { col: '#d9bd86' }, { t: 0.08, h: 5, mw: 0.14, gap: 0.1, hp: 1.5 });
  if (st === 3) {
    // auvent de roseaux sur quatre perches
    for (const [x, y] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) g.post(x, y, H, H + 18, '#8a6a42', 2);
    g.box(-0.3, -0.3, 0.3, 0.3, H + 18, H + 21, { col: '#b99a52' }, { ao: false, quick: true, topMat: { col: '#c8aa62' } });
    flagOf(g, 0, 0, H + 21, 18, 14);
  }
  if (st === 1) scaffoldBox(g, -0.3, -0.3, 0.3, 0.3, 34, { step: 0.4 });
  if (st === 2) plankPile(g, 0.5, 0.45, 'x', 3, 0.4);
}
outpost.found = { stone: true };

export const EGYPT_WALLS = {
  palisade: piece(EG_PAL, 'wall'),
  palisade_gate: piece(EG_PAL_GATE, 'gate'),
  wall: piece(EG_WALL, 'wall'),
  gate: piece(EG_GATE, 'gate'),
  rampart: piece(EG_RAMP, 'wall'),
  great_gate: piece(EG_GG, 'gate'),
  bastion,
  outpost,
};
void [K_LEFT, K_RIGHT, tone, ctexStone, SAND_D, SAND_L, boxUV, PI];
