// Icônes de l'interface, portraits et icônes de technologies (API publique : drawIcon, drawPortrait,
// drawTechIcon). Les pictogrammes sont dessinés dans un carré de 64 unités puis mis à l'échelle ; chaque
// rendu est mis en cache à la résolution réelle de l'écran (taille × échelle du contexte).
import { DEFS, TECHS } from '../../core/defs.js';
import { unitMetrics, drawUnit } from './units.js';
import { getBuildingSprite } from './buildings.js';
import { getNodeSprite, drawAnimal } from './nature.js';
import { TAU, PI, tone, rgba, capsule, ell, poly, line } from './unit-kit.js';
import * as I from './icon-glyphs.js';
import * as J from './icon-glyphs2.js';
import * as K from './icon-glyphs3.js';
import { SPARTA_TECH_ART } from './icon-glyphs-sparta.js';
import { VIKINGS_TECH_ART } from './icon-glyphs-vikings.js';
import { EGYPT_TECH_ART } from './icon-glyphs-egypt.js';

const INK = '#23170e';
const iconCache = new Map();

function cached(ctx, key, size, draw) {
  const m = ctx.getTransform();
  const k = Math.max(0.25, Math.min(8, Math.hypot(m.a, m.b)));
  const kk = Math.round(k * 32) / 32;
  const full = key + '|' + size + '|' + kk;
  let c = iconCache.get(full);
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(size * kk));
    c.height = Math.max(1, Math.ceil(size * kk));
    const g = c.getContext('2d');
    const px = size * kk;
    g.scale(px / 64, px / 64);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    // Aux petites tailles : pictogramme un peu agrandi et contours plus épais
    I.ink.k = px <= 22 ? 1.7 : px <= 34 ? 1.35 : px <= 50 ? 1.12 : 1;
    if (px <= 34) {
      g.translate(32, 32);
      g.scale(1.1, 1.1);
      g.translate(-32, -32);
    }
    draw(g);
    I.ink.k = 1;
    if (iconCache.size > 800) iconCache.clear();
    iconCache.set(full, c);
  }
  ctx.drawImage(c, 0, 0, size, size);
}

// ---------------------------------------------------------------------------
// Icônes génériques
// ---------------------------------------------------------------------------

const ICONS = {
  food(g) {
    I.gBerries(g, 44, 40, 0.62);
    I.gMeat(g, 26, 30, 0.95);
  },
  wood(g) {
    I.gLogs(g, 36, 34, 1.15);
  },
  gold(g) {
    I.gGoldPile(g, 32, 34, 1.3);
  },
  stone(g) {
    I.gStones(g, 32, 34, 1.3);
  },
  pop(g) {
    I.gPerson(g, 24, 34, 0.85, '#b8a888');
    I.gPerson(g, 40, 38, 0.95, '#d8c8a8');
  },
  attack(g) {
    I.gSword(g, 30, 34, -PI / 4, 1.05);
    // Traits de frappe
    g.strokeStyle = '#e84a2a';
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(48, 12);
    g.lineTo(56, 6);
    g.moveTo(52, 22);
    g.lineTo(60, 20);
    g.moveTo(42, 8);
    g.lineTo(44, 2);
    g.stroke();
  },
  stop(g) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + PI / 8;
      pts.push(32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26);
    }
    g.beginPath();
    poly(g, pts);
    I.fillInk(g, '#d63a2a', 2.6);
    g.beginPath();
    poly(g, [16, 27, 48, 27, 48, 37, 16, 37]);
    I.fillInk(g, '#f6f0e4', 2, 0.1, -0.1);
  },
  delete(g) {
    I.gSkull(g, 32, 32, 1.1);
  },
  repair(g) {
    I.gHammer(g, 30, 34, -PI / 4, 1.1);
    g.beginPath();
    poly(g, [46, 6, 50, 14, 58, 14, 52, 20, 54, 28, 46, 23, 38, 28, 40, 20, 34, 14, 42, 14]);
    I.fillInk(g, '#f2d060', 1.8);
  },
  garrison(g) {
    I.gTower(g, 38, 34, 1.0);
    I.gArrow(g, 4, 40, 24, 40, '#6ad060');
  },
  ungarrison(g) {
    I.gTower(g, 26, 34, 1.0);
    I.gArrow(g, 40, 40, 60, 40, '#f2a040');
  },
  cancel(g) {
    g.lineCap = 'round';
    g.strokeStyle = INK;
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(14, 14);
    g.lineTo(50, 50);
    g.moveTo(50, 14);
    g.lineTo(14, 50);
    g.stroke();
    g.strokeStyle = '#e04030';
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(16, 13);
    g.lineTo(30, 27);
    g.stroke();
  },
  rally(g) {
    g.setLineDash([4, 5]);
    g.strokeStyle = '#f2e6c0';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(6, 58);
    g.quadraticCurveTo(10, 36, 26, 52);
    g.stroke();
    g.setLineDash([]);
    I.gFlag(g, 28, 8, '#e8b93a');
  },
  'build-eco'(g) {
    I.gHut(g, 28, 36, 1.0);
    I.gHammer(g, 46, 44, -PI / 4, 0.62);
  },
  'build-mil'(g) {
    I.gTower(g, 26, 34, 0.95);
    I.gSword(g, 46, 44, -PI / 4, 0.6);
  },
  'build-civ'(g) {
    K.gForum(g, 26, 34, 0.95);
    I.gHammer(g, 47, 44, -PI / 4, 0.62);
  },
  'build-def'(g) {
    K.gWallIcon(g);
    I.gHammer(g, 47, 46, -PI / 4, 0.62);
  },
  choices(g) {
    K.gChoices(g);
  },
  climb(g) {
    K.gClimbIcon(g);
  },
  age(g) {
    // Marches montantes et étoile dorée
    g.beginPath();
    poly(g, [6, 58, 6, 46, 22, 46, 22, 34, 38, 34, 38, 22, 58, 22, 58, 58]);
    I.fillInk(g, '#b4ada0', 2.4);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 12;
      const a = (i / 10) * TAU - PI / 2;
      pts.push(20 + Math.cos(a) * r, 18 + Math.sin(a) * r);
    }
    g.beginPath();
    poly(g, pts);
    I.fillInk(g, '#f2c43a', 2.2);
  },
  hammer(g) {
    I.gHammer(g, 32, 34, -PI / 4, 1.2);
  },
  sword(g) {
    I.gSword(g, 30, 34, -PI / 4, 1.15);
  },
  shield(g) {
    I.gShield(g, 32, 32, 24, '#3b72e8');
  },
  bow(g) {
    I.gBow(g, 30, 32, -PI / 4, 1.05);
  },
  flag(g) {
    I.gFlag(g, 18, 8, '#dc4538');
  },
  menu(g) {
    for (const y of [16, 32, 48]) {
      g.beginPath();
      capsule(g, 12, y, 4.5, 52, y, 4.5);
      I.fillInk(g, '#efe6d0', 2.2);
    }
  },
  pause(g) {
    for (const x of [22, 42]) {
      g.beginPath();
      capsule(g, x, 12, 6, x, 52, 6);
      I.fillInk(g, '#efe6d0', 2.4);
    }
  },
  'idle-villager'(g) {
    I.gPerson(g, 28, 36, 1.05, '#3b72e8');
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 4;
    g.strokeStyle = INK;
    g.fillStyle = '#f6f0e4';
    g.strokeText('z', 48, 20);
    g.fillText('z', 48, 20);
    g.font = 'bold 14px sans-serif';
    g.strokeText('z', 56, 8);
    g.fillText('z', 56, 8);
  },
  clock(g) {
    g.beginPath();
    ell(g, 32, 32, 26, 26);
    I.fillInk(g, '#e8dcc0', 2.6, 0.2, -0.2);
    g.beginPath();
    ell(g, 32, 32, 21, 21);
    g.strokeStyle = 'rgba(90,70,40,0.5)';
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = INK;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      g.beginPath();
      ell(g, 32 + Math.cos(a) * 19, 32 + Math.sin(a) * 19, i % 3 ? 1.2 : 2, i % 3 ? 1.2 : 2);
      g.fill();
    }
    line(g, 32, 32, 32, 16, INK, 3.5);
    line(g, 32, 32, 44, 38, INK, 3);
    g.beginPath();
    ell(g, 32, 32, 3, 3);
    g.fillStyle = '#c83a2a';
    g.fill();
  },
  // Icônes supplémentaires
  heal(g) {
    g.beginPath();
    poly(g, [24, 8, 40, 8, 40, 24, 56, 24, 56, 40, 40, 40, 40, 56, 24, 56, 24, 40, 8, 40, 8, 24, 24, 24]);
    I.fillInk(g, '#4ab84a', 2.6);
  },
  check(g) {
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(12, 34);
    g.lineTo(26, 48);
    g.lineTo(52, 16);
    g.strokeStyle = INK;
    g.lineWidth = 13;
    g.stroke();
    g.strokeStyle = '#5ac84a';
    g.lineWidth = 8;
    g.stroke();
  },
  lock(g) {
    g.beginPath();
    g.arc(32, 26, 12, PI, 0);
    g.lineWidth = 9;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = '#b8c0c8';
    g.stroke();
    g.beginPath();
    poly(g, [14, 26, 50, 26, 50, 54, 14, 54]);
    I.fillInk(g, '#e8b93a', 2.4);
    g.beginPath();
    ell(g, 32, 38, 4, 4);
    g.fillStyle = INK;
    g.fill();
    g.fillRect(30, 38, 4, 9);
  },
  axe(g) {
    I.gAxe(g, 30, 34, -PI / 4, 1.1);
  },
  pickaxe(g) {
    I.gPick(g, 30, 36, -PI / 4, 1.05);
  },
  meat(g) {
    I.gMeat(g, 30, 32, 1.1);
  },
  berries(g) {
    I.gBerries(g, 32, 36, 1.1);
  },
  wheat(g) {
    I.gWheat(g, 32, 34, 1.1);
  },
  house(g) {
    I.gHut(g, 32, 36, 1.2);
  },
  castle(g) {
    I.gCastle(g, 32, 32, 1.15);
  },
  // Port, marché, héros
  fish(g) {
    J.gFish(g, 34, 34, 0.98, -0.35);
  },
  coin(g) {
    J.gCoin(g, 30, 30, 1.18);
  },
  crown(g) {
    J.gCrown(g, 32, 36, 1.05);
  },
  ship(g) {
    J.gShip(g, 32, 34, 0.98);
  },
  hero(g) {
    J.gHelm(g, 30, 38, 0.98, true);
  },
  'buy-food'(g) {
    J.gTrade(g, 'food', 'buy');
  },
  'buy-wood'(g) {
    J.gTrade(g, 'wood', 'buy');
  },
  'buy-stone'(g) {
    J.gTrade(g, 'stone', 'buy');
  },
  'sell-food'(g) {
    J.gTrade(g, 'food', 'sell');
  },
  'sell-wood'(g) {
    J.gTrade(g, 'wood', 'sell');
  },
  'sell-stone'(g) {
    J.gTrade(g, 'stone', 'sell');
  },
  star(g) {
    K.gStar(g, 32, 33, 29);
  },
  choice(g) {
    K.gScrollStar(g);
  },
  wall(g) {
    K.gWallIcon(g);
  },
  gate(g) {
    K.gGateIcon(g);
  },
  ladder(g) {
    K.gLadder(g, 32, 32, 1.05, 0.32);
  },
  'unit-special'(g) {
    K.gSpecialUnit(g);
  },
};

/** Noms d'icônes disponibles. */
export const ICON_NAMES = Object.keys(ICONS);

/**
 * Icône générique dans le carré (0,0)-(size,size) du contexte (ressources : food, wood, gold, stone, pop ;
 * actions : attack stop delete repair garrison ungarrison cancel rally build-eco build-mil age hammer sword
 * shield bow flag menu pause idle-villager clock build-civ build-def choices climb star choice wall gate ladder
 * unit-special ; en plus : heal check lock axe pickaxe meat berries wheat
 * house castle fish coin crown ship hero ; marché : buy-food buy-wood buy-stone sell-food sell-wood sell-stone
 * = la pièce d'or et le symbole de la ressource reliés par une flèche : « buy » = or → ressource (flèche verte),
 * « sell » = ressource → or (flèche orange)).
 */
export function drawIcon(ctx, name, size) {
  const f = ICONS[name];
  cached(ctx, 'i:' + name, size, (g) => {
    if (f) f(g);
    else {
      g.beginPath();
      ell(g, 32, 32, 24, 24);
      I.fillInk(g, '#8a8aa0', 2.4);
      g.font = 'bold 34px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('?', 32, 34);
    }
  });
}

// ---------------------------------------------------------------------------
// Portraits
// ---------------------------------------------------------------------------

/** Portrait carré d'une unité, d'un bâtiment, d'un animal ou d'une ressource, sur fond transparent. */
export function drawPortrait(ctx, id, civ, teamIdx, size) {
  const def = DEFS[id];
  ctx.save();
  if (def && def.cls === 'building') {
    const s = getBuildingSprite(id, civ, teamIdx, 3);
    const k = Math.min((size * 0.96) / s.canvas.width, (size * 0.96) / s.canvas.height);
    ctx.drawImage(s.canvas, (size - s.canvas.width * k) / 2, (size - s.canvas.height * k) / 2, s.canvas.width * k, s.canvas.height * k);
  } else if (def && def.cls === 'animal') {
    const k = size / (id === 'sheep' ? 26 : 34);
    ctx.translate(size * 0.47, size * 0.86);
    ctx.scale(k, k);
    drawAnimal(ctx, { type: id, sx: 0, sy: 0, t: 4.2, anim: 'idle', dir: 1 });
  } else if (def && def.cls === 'node') {
    const s = getNodeSprite(id, 0, 1);
    const k = Math.min((size * 0.92) / s.canvas.width, (size * 0.92) / s.canvas.height);
    ctx.drawImage(s.canvas, (size - s.canvas.width * k) / 2, (size - s.canvas.height * k) / 2, s.canvas.width * k, s.canvas.height * k);
  } else {
    const m = unitMetrics(id);
    const wide = m.w > 12;
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();
    if (id === 'fishingboat' || id === 'warship') {
      // Bateaux : coque entière, voile comprise, cadrée sur la ligne de flottaison
      const war = id === 'warship';
      const k = (size * 0.98) / (war ? 100 : 62);
      ctx.translate(size * 0.5, size * (war ? 0.8 : 0.74));
      ctx.scale(k, k);
    } else if (wide) {
      // Montures et engins : silhouette entière
      const k = Math.min((size * 0.9) / m.h, (size * 0.94) / (m.w * 2.3));
      ctx.translate(size * (m.h > 45 && m.w < 25 ? 0.42 : 0.47), size * 0.95);
      ctx.scale(k, k);
    } else {
      // Fantassins : cadrés en pied jusqu'aux genoux, tête en haut du cadre
      const k = (size * 1.08) / m.h;
      ctx.translate(size * 0.44, size * 1.16);
      ctx.scale(k, k);
    }
    drawUnit(ctx, { type: id, civ, team: teamIdx, sx: 0, sy: 0, t: 0.8, anim: 'idle', dir: 1 });
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Technologies
// ---------------------------------------------------------------------------

const TECH_ART = {
  age2: { cat: 'age', draw: (g) => ageBanner(g, 'II') },
  age3: { cat: 'age', draw: (g) => ageBanner(g, 'III') },
  carry1: { cat: 'eco', lvl: 1, draw: (g) => I.gSack(g, 32, 36, 1.05) },
  carry2: { cat: 'eco', lvl: 2, draw: (g) => I.gCart(g, 30, 36, 0.95) },
  plow1: { cat: 'eco', lvl: 1, draw: (g) => I.gPlow(g, 32, 32, 1.0, false) },
  plow2: { cat: 'eco', lvl: 2, draw: (g) => I.gPlow(g, 32, 32, 1.0, true) },
  baskets: { cat: 'eco', draw: (g) => I.gBasket(g, 32, 36, 1.0) },
  axe1: { cat: 'eco', lvl: 1, draw: (g) => I.gAxe(g, 30, 34, -PI / 4, 1.0, '#8e959e', '#a8723e') },
  axe2: { cat: 'eco', lvl: 2, draw: (g) => I.gAxe(g, 30, 34, -PI / 4, 1.05, '#dfe6ee', '#7a4a2a') },
  pick1: { cat: 'eco', lvl: 1, draw: (g) => I.gPick(g, 30, 36, -PI / 4, 0.95, '#8e959e') },
  pick2: { cat: 'eco', lvl: 2, draw: (g) => I.gPick(g, 30, 36, -PI / 4, 1.0, '#dfe6ee') },
  atk_inf1: { cat: 'mil', lvl: 1, draw: (g) => I.gSword(g, 30, 34, -PI / 4, 1.0, '#c8ced6') },
  atk_inf2: { cat: 'mil', lvl: 2, draw: (g) => { glow(g, '#ffb040'); I.gSword(g, 30, 34, -PI / 4, 1.05, '#f4f8fc', '#e8b93a'); } },
  atk_cav1: { cat: 'mil', lvl: 1, draw: (g) => I.gSpur(g, 32, 30, 1.0) },
  atk_cav2: { cat: 'mil', lvl: 2, draw: (g) => lanceGlyph(g) },
  atk_arch1: { cat: 'mil', lvl: 1, draw: (g) => barbedArrow(g, false) },
  atk_arch2: { cat: 'mil', lvl: 2, draw: (g) => barbedArrow(g, true) },
  arm_inf1: { cat: 'mil', lvl: 1, draw: (g) => I.gMail(g, 32, 34, 1.0, '#aab2ba', false) },
  arm_inf2: { cat: 'mil', lvl: 2, draw: (g) => I.gMail(g, 32, 34, 1.0, '#c8d0d8', true) },
  arm_cav1: { cat: 'mil', lvl: 1, draw: (g) => I.gHorseHead(g, 32, 34, 1.0, '#8a5a36', '#8a5a32') },
  arm_cav2: { cat: 'mil', lvl: 2, draw: (g) => I.gHorseHead(g, 32, 34, 1.0, '#8a5a36', '#c0c8d0') },
  arm_arch1: { cat: 'mil', lvl: 1, draw: (g) => I.gVest(g, 32, 34, 1.0) },
  bloodlines: { cat: 'mil', draw: (g) => I.gHorseHead(g, 32, 34, 1.05, '#f0ece2', null) },
  frank_axe: { cat: 'unique', draw: (g) => { glow(g, '#6aa0ff'); I.gAxe(g, 30, 34, -PI / 3, 1.0, '#e8eef4', '#6a4226'); } },
  gaul_fury: { cat: 'unique', draw: (g) => furyGlyph(g) },
  // Moulin, port, marché, académie
  hunt1: { cat: 'eco', draw: (g) => J.gDog(g, 32, 34, 1.0) },
  nets1: { cat: 'eco', lvl: 1, draw: (g) => J.gNet(g, 32, 32, 1.0, false) },
  nets2: { cat: 'eco', lvl: 2, draw: (g) => J.gNet(g, 32, 32, 1.0, true) },
  hull1: { cat: 'mil', lvl: 1, draw: (g) => J.gHull(g, 32, 34, 0.98) },
  naval_atk: { cat: 'mil', lvl: 2, draw: (g) => J.gBallista(g, 32, 34, 0.98) },
  trade1: { cat: 'eco', lvl: 1, draw: (g) => J.gScales(g, 32, 34, 0.98) },
  trade2: { cat: 'eco', lvl: 2, draw: (g) => J.gCoinBag(g, 32, 34, 0.98) },
  med1: { cat: 'mil', lvl: 1, draw: (g) => J.gHerbs(g, 32, 34, 0.98) },
  med2: { cat: 'mil', lvl: 2, draw: (g) => { glow(g, '#ffe070'); J.gBless(g, 32, 32, 0.96); } },
  scout1: { cat: 'eco', draw: (g) => J.gSpyglass(g, 32, 34, 0.98) },
  eco1: { cat: 'eco', draw: (g) => J.gCalendar(g, 32, 34, 0.98) },
  strat1: { cat: 'mil', draw: (g) => J.gStrat(g, 32, 34, 0.98) },
  // Extension 2 : siège, maçonnerie, âge impérial, bonus de choix
  age4: { cat: 'age', draw: (g) => K.gImperial(g) },
  ladders: { cat: 'mil', draw: (g) => K.gLadder(g, 32, 32, 1.0, 0.3) },
  fire_arrows: { cat: 'mil', draw: (g) => K.gFireArrow(g) },
  mason1: { cat: 'eco', lvl: 1, draw: (g) => K.gTrowelWall(g) },
  mason2: { cat: 'eco', lvl: 2, draw: (g) => K.gRampart(g) },
  g2a: { cat: 'unique', draw: (g) => K.gOakAxe(g) },
  g2b: { cat: 'unique', draw: (g) => K.gClans(g) },
  g3a: { cat: 'unique', draw: (g) => K.gAnvilSword(g) },
  g3b: { cat: 'unique', draw: (g) => K.gOppidum(g) },
  g4a: { cat: 'unique', draw: (g) => K.gAssembly(g) },
  g4b: { cat: 'unique', draw: (g) => { glow(g, '#ff5030'); K.gBoarRoar(g); } },
  f2a: { cat: 'unique', draw: (g) => K.gSealWheat(g) },
  f2b: { cat: 'unique', draw: (g) => K.gLeudes(g) },
  f3a: { cat: 'unique', draw: (g) => K.gCarolForge(g) },
  f3b: { cat: 'unique', draw: (g) => K.gMarches(g) },
  f4a: { cat: 'unique', draw: (g) => K.gEmpire(g) },
  f4b: { cat: 'unique', draw: (g) => K.gTwelve(g) },
};

Object.assign(TECH_ART, SPARTA_TECH_ART);
Object.assign(TECH_ART, VIKINGS_TECH_ART);
Object.assign(TECH_ART, EGYPT_TECH_ART);

const FRAME = {
  eco: { bg: '#4a6a2e', rim: '#c8a060' },
  mil: { bg: '#6a2a24', rim: '#b8c0c8' },
  age: { bg: '#3e3070', rim: '#e8c050' },
  unique: { bg: '#24406e', rim: '#e8c050' },
};

function glow(g, c) {
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 28);
  gr.addColorStop(0, rgba(c, 0.8));
  gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
}

function ageBanner(g, num) {
  // Étendard d'âge : bannière à pointes et chiffre romain
  line(g, 32, 6, 32, 58, INK, 6);
  line(g, 32, 6, 32, 58, '#8a5a32', 3);
  g.beginPath();
  poly(g, [14, 12, 50, 12, 50, 44, 41, 38, 32, 46, 23, 38, 14, 44]);
  I.fillInk(g, '#c83a2a', 2.4, 0.3, -0.3, 12, 46);
  g.beginPath();
  ell(g, 32, 7, 4, 4);
  I.fillInk(g, '#e8b93a', 2);
  g.font = 'bold 18px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 3.5;
  g.strokeStyle = INK;
  g.strokeText(num, 32, 27);
  g.fillStyle = '#f2d060';
  g.fillText(num, 32, 27);
}

function lanceGlyph(g) {
  g.save();
  g.translate(32, 32);
  g.rotate(-PI / 4);
  g.beginPath();
  capsule(g, -26, 0, 3.4, 18, 0, 2.6);
  I.fillInk(g, '#c9a878', 2.2);
  g.beginPath();
  poly(g, [16, -4, 30, 0, 16, 4]);
  I.fillInk(g, '#dfe6ee', 2);
  g.beginPath();
  poly(g, [-14, -6, -8, -6, -6, 6, -16, 6]);
  I.fillInk(g, '#9aa2ac', 2);
  g.beginPath();
  g.moveTo(8, -3);
  g.quadraticCurveTo(0, -16, -8, -14);
  g.lineTo(-2, -8);
  g.lineTo(-10, -4);
  g.closePath();
  I.fillInk(g, '#dc4538', 2);
  g.restore();
}

function barbedArrow(g, steel) {
  g.save();
  g.translate(32, 32);
  g.rotate(-PI / 4);
  const n = steel ? 2 : 1;
  for (let i = 0; i < n; i++) {
    g.save();
    g.translate(0, (i - (n - 1) / 2) * 12);
    line(g, -24, 0, 18, 0, INK, 5);
    line(g, -24, 0, 18, 0, '#d8b880', 2.6);
    g.beginPath();
    poly(g, [14, -7, 28, 0, 14, 7, 18, 0]);
    I.fillInk(g, steel ? '#e8eef4' : '#9aa2ac', 2);
    g.beginPath();
    poly(g, [-28, -6, -20, -6, -16, 0, -20, 6, -28, 6, -24, 0]);
    I.fillInk(g, '#d84a3a', 1.8);
    g.restore();
  }
  g.restore();
}

function furyGlyph(g) {
  glow(g, '#ff5030');
  // Hure de sanglier gauloise
  g.beginPath();
  g.moveTo(10, 30);
  g.bezierCurveTo(12, 14, 30, 8, 44, 14);
  g.lineTo(56, 26);
  g.quadraticCurveTo(58, 36, 52, 40);
  g.bezierCurveTo(40, 48, 22, 50, 10, 30);
  I.fillInk(g, '#6a4a34', 2.4, 0.3, -0.3, 8, 50);
  g.beginPath();
  poly(g, [22, 16, 26, 4, 32, 14]);
  I.fillInk(g, '#5a3c28', 2);
  g.beginPath();
  g.moveTo(46, 38);
  g.quadraticCurveTo(52, 30, 46, 22);
  g.lineWidth = 5;
  g.strokeStyle = INK;
  g.stroke();
  g.lineWidth = 2.8;
  g.strokeStyle = '#f4ecd8';
  g.stroke();
  g.beginPath();
  ell(g, 38, 22, 3, 3);
  g.fillStyle = '#ff3a1a';
  g.fill();
  // Crinière hérissée
  g.beginPath();
  poly(g, [12, 26, 8, 16, 16, 20, 16, 10, 22, 16, 26, 6, 28, 14]);
  I.fillInk(g, '#3a281a', 1.8);
}

/** Icône d'une technologie dans un carré size × size : cadre (économie, armée, âge, unique), symbole, niveau. */
export function drawTechIcon(ctx, techId, size) {
  const art = TECH_ART[techId];
  cached(ctx, 't:' + techId, size, (g) => {
    const cat = art ? art.cat : 'eco';
    const F = FRAME[cat];
    const lvl = art ? art.lvl || 0 : 0;
    // Cadre biseauté
    g.beginPath();
    g.roundRect ? g.roundRect(2, 2, 60, 60, 9) : poly(g, [2, 2, 62, 2, 62, 62, 2, 62]);
    g.fillStyle = INK;
    g.fill();
    const rim = lvl === 2 ? '#f0c850' : F.rim;
    g.beginPath();
    g.roundRect ? g.roundRect(4, 4, 56, 56, 7) : poly(g, [4, 4, 60, 4, 60, 60, 4, 60]);
    const gr = g.createLinearGradient(0, 4, 0, 60);
    gr.addColorStop(0, tone(rim, 0.35));
    gr.addColorStop(1, tone(rim, -0.35));
    g.fillStyle = gr;
    g.fill();
    g.beginPath();
    g.roundRect ? g.roundRect(8, 8, 48, 48, 5) : poly(g, [8, 8, 56, 8, 56, 56, 8, 56]);
    const bg = g.createRadialGradient(26, 22, 4, 32, 32, 40);
    bg.addColorStop(0, tone(F.bg, 0.35));
    bg.addColorStop(1, tone(F.bg, -0.35));
    g.fillStyle = bg;
    g.fill();
    // Symbole
    g.save();
    g.beginPath();
    g.rect(8, 8, 48, 48);
    g.clip();
    g.translate(32, 32);
    g.scale(0.9, 0.9);
    g.translate(-32, -32);
    if (art) art.draw(g);
    else {
      g.font = 'bold 22px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('?', 32, 33);
    }
    g.restore();
    // Pastille de niveau (I / II)
    if (lvl) {
      const txt = lvl === 2 ? 'II' : 'I';
      g.beginPath();
      g.roundRect ? g.roundRect(lvl === 2 ? 38 : 42, 42, lvl === 2 ? 22 : 18, 18, 4) : poly(g, [40, 42, 60, 42, 60, 60, 40, 60]);
      g.fillStyle = lvl === 2 ? '#f0c850' : '#c8ccd0';
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = INK;
      g.stroke();
      g.font = 'bold 14px serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = INK;
      g.fillText(txt, lvl === 2 ? 49 : 51, 52);
    }
  });
}

/** Liste des technologies qui ont une icône dédiée (contrôle). */
export const TECH_ICON_IDS = Object.keys(TECH_ART).filter((id) => TECHS[id]);
