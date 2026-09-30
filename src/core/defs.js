import CIV_MODULES from './civs/index.js';

// Données du jeu : tout est déclaratif. Le moteur (sim.js) ne connaît aucun nom d'unité :
// il lit ces tables. Pour équilibrer ou ajouter du contenu, on ne touche qu'à ce fichier.

export const TICK_RATE = 20; // pas de simulation par seconde de jeu
export const DT = 1 / TICK_RATE;
/** Hauteur (px) du chemin de ronde des murs, pour dessiner les soldats qui s'y trouvent. */
export const DECK_TOP = { palisade: 30, palisade_gate: 34, wall: 58, gate: 58, rampart: 94, great_gate: 94 };
export const MAP_SIZE = 140; // taille par défaut (Moyenne) ; Petite 100, Grande 180 : choisies par partie (cfg.mapSize)
export const MAP_SIZES = { small: 100, medium: 140, large: 180 };
export const MAP_KINDS = { river: 'La Rivière des Carnutes', forest: 'La Forêt Hercynienne' };
export const MAX_POP = 150;

export const RESOURCES = ['food', 'wood', 'gold', 'stone'];
export const RES_LABEL = { food: 'Nourriture', wood: 'Bois', gold: 'Or', stone: 'Pierre' };

export const TEAM_COLORS = [
  { name: 'Bleu', main: '#3b72e8', dark: '#1c3f9a', light: '#adc8ff' },
  { name: 'Rouge', main: '#dc4538', dark: '#8a1f19', light: '#ffb3a9' },
  { name: 'Vert', main: '#3fae4a', dark: '#1d6a27', light: '#b3f0b8' },
  { name: 'Jaune', main: '#e8c636', dark: '#9a7d10', light: '#fff0a0' },
  { name: 'Violet', main: '#9a55d6', dark: '#572496', light: '#dcbcff' },
  { name: 'Orange', main: '#ee8a2c', dark: '#9a4d0c', light: '#ffd0a0' },
  { name: 'Turquoise', main: '#33bfc0', dark: '#136b6d', light: '#b0f0f0' },
  { name: 'Rose', main: '#e46aa8', dark: '#94306a', light: '#ffc0df' },
  { name: 'Neutre', main: '#a8a08a', dark: '#5e584a', light: '#e4ddc8' }, // points stratégiques non capturés (index NEUTRAL_TEAM)
];
export const MAX_PLAYERS = 8;
export const NEUTRAL_TEAM = 8;
/** Couleur d'équipe d'un propriétaire (les bâtiments neutres, propriétaire −1, prennent la couleur neutre). */
export const teamOf = (owner) => (owner >= 0 ? owner : NEUTRAL_TEAM);

export const AGE_NAMES = ['', 'Âge du Village', 'Âge du Bourg', 'Âge de la Forteresse', 'Âge Impérial'];
export const AGE_SHORT = ['', 'I', 'II', 'III', 'IV'];
export const MAX_AGE = 4;

// Vitesse de récolte de base (par seconde et par villageois), avant technologies.
export const GATHER_BASE = { wood: 0.55, berries: 0.65, farm: 0.45, meat: 1.0, gold: 0.6, stone: 0.65, fish: 0.8 };
export const CARRY_BASE = 10;
export const BUILD_EXPONENT = 0.7; // n bâtisseurs => n^0.7 fois plus vite
export const FARM_RESEED_COST = 60; // bois pour semer de nouveau une ferme épuisée
export const FARM_MAX_WORKERS = 3;

// Marché : prix de 100 unités de ressource, en or, selon l'offre et la demande (voir econ.js).
export const TRADE_LOT = 100;
export const TRADE_FEE = 0.3; // commission de base (réduite par les technologies)
export const TRADE_RES = ['food', 'wood', 'stone'];
// Aura des héros : bonus d'attaque des alliés proches.
export const HERO_AURA = { range: 6, atk: 0.15 }; // (valeur par défaut : chaque héros définit sa propre aura)
// Escalade des murailles : secondes pour franchir une pièce, sans et avec l'aide d'une tour de siège
export const CLIMB_TIME = { wood: 4, stone: 7, great: 10, towerAssist: 1.6 };
export const CLIMB_VULN = 1.6; // dégâts subis en plein escalade

export const START_RESOURCES = {
  standard: { food: 200, wood: 200, gold: 150, stone: 200, label: 'Standard' },
  riche: { food: 800, wood: 800, gold: 500, stone: 300, label: 'Abondantes' },
};

// ---------------------------------------------------------------------------
// Aides
// ---------------------------------------------------------------------------

const cost = (o) => ({ food: 0, wood: 0, gold: 0, stone: 0, ...o });

// Tout coûte 40 % de plus (unités, bâtiments, technologies), sauf l'essentiel pour démarrer : villageois, ferme, maison.
export const COST_MUL = 1.4;
const COST_EXEMPT = new Set(['villager', 'farm', 'house']);
const scaled = (id, o) => {
  const c = cost(o || {});
  if (COST_EXEMPT.has(id)) return c;
  for (const r of ['food', 'wood', 'gold', 'stone']) c[r] = Math.round((c[r] * COST_MUL) / 5) * 5;
  return c;
};

function finishUnit(u) {
  return {
    cls: 'unit',
    pop: 1,
    radius: 0.28,
    range: 0,
    minRange: 0,
    rof: 2,
    splash: 0,
    los: 6,
    tags: [],
    bonus: {},
    ...u,
    atk: { melee: 0, pierce: 0, ...(u.atk || {}) },
    armor: { melee: 0, pierce: 0, ...(u.armor || {}) },
    cost: scaled(u.id, u.cost),
  };
}

// Les bâtiments sont plus fragiles qu'au départ (moins de points de vie et d'armure : les sièges aboutissent), murs et portes un peu moins.
const BUILDING_HP_MUL = 0.7;
const WALL_HP_MUL = 0.8;
const BUILDING_ARMOR_MUL = 0.75;

function finishBuilding(b) {
  const frail = !b.capture;
  const hpMul = !frail ? 1 : (b.wall || b.gate) ? WALL_HP_MUL : BUILDING_HP_MUL;
  const am = frail ? BUILDING_ARMOR_MUL : 1;
  b = { ...b, hp: frail ? Math.round(b.hp * hpMul / 5) * 5 : b.hp, armor: { melee: Math.round((b.armor ? b.armor.melee || 0 : 0) * am), pierce: Math.round((b.armor ? b.armor.pierce || 0 : 0) * am) } };
  return {
    cls: 'building',
    los: 6,
    pop: 0,
    drop: [],
    trains: [],
    tags: ['building'],
    walkable: false,
    ...b,
    size: b.size,
    atk: { melee: 0, pierce: 0, ...(b.atk || {}) },
    armor: { melee: 0, pierce: 0, ...(b.armor || {}) },
    cost: scaled(b.id, b.cost),
  };
}

// ---------------------------------------------------------------------------
// Unités
// ---------------------------------------------------------------------------

const UNIT_LIST = [
  {
    id: 'villager', name: 'Villageois', age: 1, from: 'hall', cost: { food: 50 }, time: 18,
    hp: 25, speed: 1.2, los: 5, radius: 0.25, atk: { melee: 3 }, rof: 2, armor: { melee: 0, pierce: 0 },
    bonus: { animal: 4 }, tags: ['villager'], worker: true,
    desc: 'Récolte les ressources, construit et répare les bâtiments. Chasse aussi le gibier.',
  },
  {
    id: 'militia', name: 'Milicien', age: 1, from: 'barracks', cost: { food: 55, gold: 20 }, time: 20,
    hp: 40, speed: 1.35, los: 5, atk: { melee: 4 }, rof: 1.8, armor: { melee: 0, pierce: 1 },
    tags: ['infantry', 'melee'],
    desc: 'Fantassin bon marché. Utile pour défendre dès le début de la partie.',
  },
  {
    id: 'spearman', name: 'Lancier', age: 2, from: 'barracks', cost: { food: 35, wood: 25 }, time: 20,
    hp: 45, speed: 1.35, los: 5, atk: { melee: 3 }, rof: 2, armor: { melee: 0, pierce: 0 }, bonus: { cavalry: 14 },
    tags: ['infantry', 'melee', 'spear'],
    desc: 'Redoutable contre la cavalerie (+14). Fragile face aux archers et aux épéistes.',
  },
  {
    id: 'swordsman', name: 'Épéiste', age: 2, from: 'barracks', cost: { food: 50, gold: 25 }, time: 22,
    hp: 60, speed: 1.3, los: 5, atk: { melee: 8 }, rof: 1.8, armor: { melee: 1, pierce: 1 },
    tags: ['infantry', 'melee'],
    desc: 'Fantassin solide qui brise les archers, les béliers et les lanciers.',
  },
  {
    id: 'champion', name: 'Champion', age: 3, from: 'barracks', cost: { food: 60, gold: 55 }, time: 28,
    hp: 75, speed: 1.3, los: 6, radius: 0.3, atk: { melee: 12 }, rof: 1.6, armor: { melee: 2, pierce: 2 },
    tags: ['infantry', 'melee'],
    desc: 'Le meilleur fantassin : lourdement armé, il domine les champs de bataille.',
  },
  {
    id: 'archer', name: 'Archer', age: 2, from: 'archery', cost: { wood: 30, gold: 40 }, time: 20,
    hp: 30, speed: 1.35, los: 7, radius: 0.25, atk: { pierce: 4 }, range: 5, rof: 2, armor: { melee: 0, pierce: 0 },
    tags: ['archer', 'ranged'], projectile: 'arrow', projSpeed: 14,
    desc: 'Tire de loin. Très efficace en nombre, à protéger de la cavalerie.',
  },
  {
    id: 'crossbow', name: 'Arbalétrier', age: 3, from: 'archery', cost: { wood: 35, gold: 55 }, time: 24,
    hp: 38, speed: 1.35, los: 8, radius: 0.25, atk: { pierce: 6 }, range: 6, rof: 1.8, armor: { melee: 0, pierce: 1 },
    tags: ['archer', 'ranged'], projectile: 'arrow', projSpeed: 15,
    desc: 'Tireur d\'élite : portée et dégâts supérieurs à l\'archer.',
  },
  {
    id: 'scout', name: 'Éclaireur', age: 2, from: 'stable', cost: { food: 75 }, time: 18,
    hp: 45, speed: 2.6, los: 9, radius: 0.32, atk: { melee: 3 }, rof: 1.7, armor: { melee: 0, pierce: 2 },
    tags: ['cavalry', 'melee', 'scout'],
    desc: 'Très rapide, voit loin. Parfait pour explorer et chasser les archers isolés.',
  },
  {
    id: 'cavalry', name: 'Cavalier', age: 2, from: 'stable', cost: { food: 60, gold: 55 }, time: 25,
    hp: 75, speed: 2.3, los: 6, radius: 0.34, atk: { melee: 8 }, rof: 1.8, armor: { melee: 1, pierce: 2 },
    tags: ['cavalry', 'melee'],
    desc: 'Cavalier rapide qui écrase les archers. Craint les lanciers.',
  },
  {
    id: 'knight', name: 'Chevalier', age: 3, from: 'stable', cost: { food: 65, gold: 90 }, time: 30,
    hp: 115, speed: 2.1, los: 6, radius: 0.36, atk: { melee: 12 }, rof: 1.7, armor: { melee: 2, pierce: 3 },
    tags: ['cavalry', 'melee'],
    desc: 'Cavalier lourd. Puissant et résistant, mais cher — et toujours vulnérable aux lanciers.',
  },
  {
    id: 'ram', name: 'Bélier', age: 3, from: 'siege', cost: { wood: 160, gold: 75 }, time: 36,
    hp: 200, speed: 0.9, los: 5, radius: 0.5, atk: { melee: 3 }, rof: 3, armor: { melee: 0, pierce: 20 },
    bonus: { building: 260 }, tags: ['siege', 'melee', 'ram'], onlyTargets: ['building'],
    desc: 'Détruit les bâtiments à toute vitesse (un mur de pierre en une demi-minute, une salle principale en moins d\'une minute avec quelques béliers). Insensible aux flèches, sans défense face aux épéistes.',
  },
  {
    id: 'catapult', name: 'Catapulte', age: 3, from: 'siege', cost: { wood: 180, gold: 120 }, time: 45,
    hp: 110, speed: 0.75, los: 8, radius: 0.5, atk: { pierce: 35 }, range: 9, minRange: 3, rof: 5, splash: 1.4,
    armor: { melee: 0, pierce: 5 }, bonus: { building: 190 }, tags: ['siege', 'ranged', 'catapult'],
    projectile: 'stone', projSpeed: 8,
    desc: 'Lance des rochers à longue portée : ravage les bâtiments et les groupes. Fragile de près.',
  },
  {
    id: 'francisque', name: 'Francisque', civ: 'franks', age: 3, from: 'castle', cost: { food: 55, wood: 30 }, time: 26,
    hp: 60, speed: 1.5, los: 7, atk: { pierce: 9 }, range: 4, rof: 1.7, armor: { melee: 1, pierce: 1 },
    tags: ['infantry', 'ranged', 'unique'], projectile: 'axe', projSpeed: 11,
    desc: 'Guerrier franc qui lance sa hache de jet. Dégâts élevés à courte portée.',
  },
  {
    id: 'gesate', name: 'Gésate', civ: 'gauls', age: 3, from: 'castle', cost: { food: 60, gold: 25 }, time: 24,
    hp: 55, speed: 1.8, los: 6, atk: { melee: 13 }, rof: 1.5, armor: { melee: 0, pierce: 0 }, bonus: { archer: 6 },
    tags: ['infantry', 'melee', 'unique'],
    desc: 'Guerrier gaulois nu, rapide et fou furieux. Frappe fort, ne porte aucune armure.',
  },
  {
    id: 'fishingboat', name: 'Barque de pêche', age: 1, from: 'dock', cost: { wood: 60 }, time: 20, naval: true, fisher: true, carry: 20,
    hp: 50, speed: 1.6, los: 7, radius: 0.42, atk: {}, rof: 2, armor: { melee: 0, pierce: 2 }, tags: ['ship', 'fisher'],
    desc: 'Pêche les bancs de poissons et rapporte la nourriture au port. Ne navigue que sur l\'eau.',
  },
  {
    id: 'warship', names: { franks: 'Drakkar', gauls: 'Navire vénète' }, age: 2, from: 'dock', cost: { wood: 120, gold: 60 }, time: 32, naval: true,
    hp: 150, speed: 1.7, los: 8, radius: 0.5, atk: { pierce: 8 }, range: 7, rof: 2.2, armor: { melee: 1, pierce: 3 }, bonus: { ship: 3 },
    tags: ['ship', 'ranged'], projectile: 'arrow', projSpeed: 14,
    desc: 'Navire de guerre : ses archers arrosent les rives, les gués et les autres navires. Insensible à l\'infanterie de mêlée.',
  },

  // ===================================== Héros (un choix de deux par âge) ================================
  {
    id: 'brennus', name: 'Brennus', civ: 'gauls', age: 2, from: 'hall', cost: { food: 200, gold: 150 }, time: 45, limit: 1, choice: true,
    hp: 240, speed: 1.8, los: 7, radius: 0.33, atk: { melee: 14 }, rof: 1.5, armor: { melee: 3, pierce: 4 }, bonus: { building: 10 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.1, r: 6 },
    desc: 'Chef des Sénons, pilleur de Rome. Redoutable contre les bâtiments ; +10 % d\'attaque aux alliés proches.',
  },
  {
    id: 'ambiorix', name: 'Ambiorix', civ: 'gauls', age: 2, from: 'hall', cost: { food: 180, gold: 170 }, time: 45, limit: 1, choice: true,
    hp: 190, speed: 2.1, los: 8, radius: 0.3, atk: { pierce: 9 }, range: 5, rof: 1.6, armor: { melee: 2, pierce: 2 },
    tags: ['infantry', 'ranged', 'hero'], projectile: 'arrow', projSpeed: 14, aura: { kind: 'speed', v: 0.1, r: 6 },
    desc: 'Roi des Éburons, maître de l\'embuscade. Tire de loin ; +10 % de vitesse aux alliés proches.',
  },
  {
    id: 'camulogene', name: 'Camulogène', civ: 'gauls', age: 3, from: 'hall', cost: { food: 250, gold: 300 }, time: 55, limit: 1, choice: true,
    hp: 330, speed: 1.6, los: 7, radius: 0.34, atk: { melee: 12 }, rof: 1.6, armor: { melee: 6, pierce: 8 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'armor', v: 1.5, r: 6 },
    desc: 'Chef des Parisii, défenseur acharné. Très résistant ; +1,5 d\'armure aux alliés proches.',
  },
  {
    id: 'divico', name: 'Divico', civ: 'gauls', age: 4, from: 'hall', cost: { food: 300, gold: 400 }, time: 60, limit: 1, choice: true,
    hp: 380, speed: 1.8, los: 8, radius: 0.36, atk: { melee: 18 }, rof: 1.5, armor: { melee: 6, pierce: 7 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.2, r: 7 },
    desc: 'Chef des Helvètes, vainqueur de Rome à Agen. +20 % d\'attaque aux alliés proches.',
  },
  {
    id: 'commios', name: 'Commios', civ: 'gauls', age: 4, from: 'hall', cost: { food: 300, gold: 380 }, time: 60, limit: 1, choice: true,
    hp: 300, speed: 2.1, los: 9, radius: 0.34, atk: { melee: 14 }, rof: 1.5, armor: { melee: 4, pierce: 5 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'gather', v: 0.15, r: 9 },
    desc: 'Roi des Atrébates, fin diplomate. Les villageois proches récoltent 15 % plus vite.',
  },
  {
    id: 'childeric', name: 'Childéric', civ: 'franks', age: 2, from: 'hall', cost: { food: 200, gold: 150 }, time: 45, limit: 1, choice: true,
    hp: 260, speed: 2.3, los: 8, radius: 0.36, atk: { melee: 12 }, rof: 1.7, armor: { melee: 3, pierce: 4 },
    tags: ['cavalry', 'melee', 'hero'], aura: { kind: 'speed', v: 0.1, r: 6 },
    desc: 'Roi des Francs saliens, cavalier émérite. +10 % de vitesse aux alliés proches.',
  },
  {
    id: 'clotilde', name: 'Clotilde', civ: 'franks', age: 2, from: 'hall', cost: { food: 150, gold: 180 }, time: 45, limit: 1, choice: true,
    hp: 150, speed: 1.3, los: 7, radius: 0.27, atk: {}, rof: 2, armor: { melee: 1, pierce: 1 },
    heal: { amount: 4, every: 2, range: 5 }, tags: ['healer', 'hero'], aura: { kind: 'heal', v: 1.2, r: 6 },
    desc: 'La reine pieuse. Soigne les soldats et régénère les alliés proches.',
  },
  {
    id: 'clovis', name: 'Clovis', civ: 'franks', age: 3, from: 'hall', cost: { food: 250, gold: 350 }, time: 60, limit: 1, choice: true,
    hp: 280, speed: 1.9, los: 8, radius: 0.34, atk: { melee: 15 }, rof: 1.5, armor: { melee: 4, pierce: 5 },
    tags: ['infantry', 'melee', 'hero', 'unique'], aura: { kind: 'atk', v: 0.15, r: 6 },
    desc: 'Le roi des Francs. Terrible au combat, il galvanise les soldats proches (+15 % d\'attaque).',
  },
  {
    id: 'charles_martel', name: 'Charles Martel', civ: 'franks', age: 3, from: 'hall', cost: { food: 250, gold: 300 }, time: 55, limit: 1, choice: true,
    hp: 340, speed: 1.6, los: 7, radius: 0.35, atk: { melee: 15 }, rof: 1.7, armor: { melee: 6, pierce: 6 }, bonus: { cavalry: 8 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'armor', v: 1.5, r: 6 },
    desc: 'Le Marteau, vainqueur de Poitiers. Fauche la cavalerie ; +1,5 d\'armure aux alliés proches.',
  },
  {
    id: 'charlemagne', name: 'Charlemagne', civ: 'franks', age: 4, from: 'hall', cost: { food: 320, gold: 420 }, time: 65, limit: 1, choice: true,
    hp: 400, speed: 1.7, los: 9, radius: 0.36, atk: { melee: 18 }, rof: 1.6, armor: { melee: 7, pierce: 8 },
    tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.15, r: 10 },
    desc: 'L\'empereur. +15 % d\'attaque aux alliés, sur un très large rayon.',
  },
  {
    id: 'roland', name: 'Roland', civ: 'franks', age: 4, from: 'hall', cost: { food: 300, gold: 380 }, time: 60, limit: 1, choice: true,
    hp: 340, speed: 2.4, los: 8, radius: 0.37, atk: { melee: 20 }, rof: 1.6, armor: { melee: 8, pierce: 6 },
    tags: ['cavalry', 'melee', 'hero'], aura: { kind: 'speed', v: 0.12, r: 7 },
    desc: 'Le preux de Roncevaux, son épée Durandal fend tout. +12 % de vitesse aux alliés proches.',
  },
  // ===================================== Unités spéciales (un choix de deux par âge) =======================
  {
    id: 'frondeur', name: 'Frondeur', civ: 'gauls', age: 2, from: 'archery', cost: { wood: 25, gold: 30 }, time: 18, choice: true,
    hp: 28, speed: 1.4, los: 7, radius: 0.25, atk: { pierce: 5 }, range: 6, rof: 2.2, armor: { melee: 0, pierce: 0 }, bonus: { infantry: 2 },
    tags: ['archer', 'ranged', 'special'], projectile: 'stone', projSpeed: 13,
    desc: 'Lance des pierres de sa fronde : bon marché, précis contre les fantassins.',
  },
  {
    id: 'molosse', name: 'Chien de guerre', civ: 'gauls', age: 2, from: 'barracks', cost: { food: 45 }, time: 14, choice: true,
    hp: 36, speed: 2.7, los: 6, radius: 0.26, atk: { melee: 6 }, rof: 1.2, armor: { melee: 0, pierce: 0 }, bonus: { archer: 4 },
    tags: ['infantry', 'melee', 'beast', 'special'],
    desc: 'Molosse rapide et peu coûteux : poursuit et mord les tireurs.',
  },
  {
    id: 'barde', name: 'Barde', civ: 'gauls', age: 3, from: 'temple', cost: { food: 50, gold: 70 }, time: 26, choice: true,
    hp: 45, speed: 1.3, los: 6, radius: 0.26, atk: {}, rof: 2, armor: { melee: 0, pierce: 0 },
    tags: ['support', 'special'], aura: { kind: 'atk', v: 0.08, r: 6 },
    desc: 'Son carnyx galvanise les guerriers : +8 % d\'attaque aux alliés proches (plusieurs bardes ne se cumulent pas).',
  },
  {
    id: 'essedaire', name: 'Essédaire', civ: 'gauls', age: 3, from: 'stable', cost: { food: 70, gold: 80 }, time: 28, choice: true,
    hp: 110, speed: 2.4, los: 7, radius: 0.4, atk: { pierce: 7 }, range: 4, rof: 1.8, armor: { melee: 1, pierce: 3 },
    tags: ['cavalry', 'ranged', 'special'], projectile: 'axe', projSpeed: 13,
    desc: 'Char de guerre gaulois : lance des javelots en passant à toute vitesse.',
  },
  {
    id: 'soldurius', name: 'Soldurius', civ: 'gauls', age: 4, from: 'barracks', cost: { food: 80, gold: 90 }, time: 30, choice: true,
    hp: 115, speed: 1.5, los: 7, radius: 0.32, atk: { melee: 15 }, rof: 1.5, armor: { melee: 3, pierce: 4 },
    tags: ['infantry', 'melee', 'special'],
    desc: 'Guerrier voué à son chef jusque dans la mort. Fantassin d\'élite.',
  },
  {
    id: 'baliste', name: 'Baliste', civ: 'gauls', age: 4, from: 'siege', cost: { wood: 150, gold: 100 }, time: 40, choice: true,
    hp: 120, speed: 0.9, los: 8, radius: 0.5, atk: { pierce: 22 }, range: 9, minRange: 2, rof: 4, armor: { melee: 0, pierce: 4 }, bonus: { infantry: 4, building: 40 },
    tags: ['siege', 'ranged', 'special'], projectile: 'bolt', projSpeed: 18,
    desc: 'Lance de gros carreaux à longue portée : transperce les fantassins.',
  },
  {
    id: 'antrustion', name: 'Antrustion', civ: 'franks', age: 2, from: 'barracks', cost: { food: 70, gold: 40 }, time: 22, choice: true,
    hp: 85, speed: 1.3, los: 6, radius: 0.3, atk: { melee: 9 }, rof: 1.8, armor: { melee: 3, pierce: 3 },
    tags: ['infantry', 'melee', 'special'],
    desc: 'Garde du roi, lourdement équipé : solide et fidèle.',
  },
  {
    id: 'leude', name: 'Leude', civ: 'franks', age: 2, from: 'stable', cost: { food: 65, gold: 50 }, time: 24, choice: true,
    hp: 88, speed: 2.4, los: 7, radius: 0.34, atk: { melee: 9 }, rof: 1.8, armor: { melee: 1, pierce: 2 }, bonus: { archer: 5 },
    tags: ['cavalry', 'melee', 'special'],
    desc: 'Compagnon à cheval du roi : écrase les tireurs.',
  },
  {
    id: 'sergent', name: 'Sergent d\'armes', civ: 'franks', age: 3, from: 'barracks', cost: { food: 65, gold: 70 }, time: 26, choice: true,
    hp: 95, speed: 1.4, los: 6, radius: 0.3, atk: { melee: 11 }, rof: 1.7, armor: { melee: 4, pierce: 5 },
    tags: ['infantry', 'melee', 'special'],
    desc: 'Fantassin lourd discipliné, très résistant aux flèches.',
  },
  {
    id: 'moine', name: 'Moine soldat', civ: 'franks', age: 3, from: 'temple', cost: { food: 40, gold: 60 }, time: 24, choice: true,
    hp: 60, speed: 1.2, los: 6, radius: 0.27, atk: { melee: 6 }, rof: 1.8, armor: { melee: 1, pierce: 1 }, heal: { amount: 3, every: 2.5, range: 4 },
    tags: ['infantry', 'melee', 'healer', 'special'],
    desc: 'Se bat au bâton et soigne ses frères d\'armes.',
  },
  {
    id: 'preux', name: 'Preux', civ: 'franks', age: 4, from: 'stable', cost: { food: 90, gold: 130 }, time: 32, choice: true,
    hp: 175, speed: 2.2, los: 7, radius: 0.37, atk: { melee: 16 }, rof: 1.7, armor: { melee: 4, pierce: 6 },
    tags: ['cavalry', 'melee', 'special'],
    desc: 'Chevalier d\'élite de l\'empire : charge irrésistible.',
  },
  {
    id: 'arbaletrier_imp', name: 'Arbalétrier impérial', civ: 'franks', age: 4, from: 'archery', cost: { wood: 40, gold: 80 }, time: 26, choice: true,
    hp: 55, speed: 1.4, los: 9, radius: 0.26, atk: { pierce: 10 }, range: 7, rof: 1.6, armor: { melee: 1, pierce: 2 },
    tags: ['archer', 'ranged', 'special'], projectile: 'bolt', projSpeed: 16,
    desc: 'Tireur d\'élite : carreaux puissants à longue portée.',
  },
  // ===================================== Machines de siège pour les murailles =============================
  {
    id: 'sapper', name: 'Sapeur', age: 3, from: 'siege', cost: { food: 50, gold: 70 }, time: 22,
    hp: 45, speed: 1.5, los: 5, radius: 0.26, atk: { melee: 2 }, rof: 2, armor: { melee: 0, pierce: 0 }, onlyTargets: ['building'],
    suicide: { dmg: 900, r: 1.6 }, tags: ['siege', 'melee', 'sapper'],
    desc: 'Mine les murailles : creuse, fait s\'effondrer une brèche (et disparaît dans l\'effondrement). Inutile contre les unités.',
  },
  {
    id: 'siegetower', name: 'Tour de siège', age: 3, from: 'siege', cost: { wood: 260, gold: 40 }, time: 45,
    hp: 750, speed: 0.8, los: 6, radius: 0.9, atk: {}, rof: 2, armor: { melee: 4, pierce: 18 }, tags: ['siege', 'tower'], cargo: 8,
    desc: 'Transporte 8 fantassins à l\'abri (clic droit d\'un fantassin sur la tour pour monter). Collée à un mur ennemi (clic droit sur le mur), elle abaisse son pont et les fait passer de l\'autre côté ; elle accélère aussi les échelles proches.',
  },
  {
    id: 'vercingetorix', name: 'Vercingétorix', civ: 'gauls', age: 3, from: 'hall', cost: { food: 250, gold: 350 }, time: 60, limit: 1, choice: true,
    hp: 280, speed: 1.9, los: 8, radius: 0.34, atk: { melee: 15 }, rof: 1.5, armor: { melee: 4, pierce: 5 },
    tags: ['infantry', 'melee', 'hero', 'unique'], aura: { kind: 'atk', v: 0.15, r: 6 },
    desc: 'Le chef des Arvernes. Redoutable guerrier, il galvanise les soldats proches (+15 % d\'attaque).',
  },
  {
    id: 'healer', name: 'Guérisseur', names: { franks: 'Prêtre', gauls: 'Druide' }, age: 2, from: 'temple',
    cost: { gold: 90 }, time: 30, hp: 25, speed: 1.1, los: 6, radius: 0.25, atk: {}, rof: 2,
    heal: { amount: 4, every: 2, range: 4 }, tags: ['healer'],
    desc: 'Soigne les soldats blessés autour de lui.',
  },
];

// Animaux sauvages (gibier). Ils ne sont à personne : owner = -1.
const ANIMAL_LIST = [
  { id: 'deer', name: 'Cerf', cls: 'animal', hp: 8, speed: 1.6, fleeSpeed: 2.6, radius: 0.3, food: 100, wander: 3.5, flees: true, los: 6, tags: ['animal'] },
  { id: 'sheep', name: 'Mouton', cls: 'animal', hp: 6, speed: 0.6, fleeSpeed: 0.6, radius: 0.25, food: 100, wander: 1.6, flees: false, los: 4, tags: ['animal'] },
];

// Ressources à récolter sur la carte.
const NODE_LIST = [
  { id: 'tree', name: 'Arbre', cls: 'node', res: 'wood', kind: 'wood', amount: 100, size: 1 },
  { id: 'berries', name: 'Buisson de baies', cls: 'node', res: 'food', kind: 'berries', amount: 200, size: 1 },
  { id: 'gold', name: "Filon d'or", cls: 'node', res: 'gold', kind: 'gold', amount: 1400, size: 1 },
  { id: 'stone', name: 'Carrière de pierre', cls: 'node', res: 'stone', kind: 'stone', amount: 1100, size: 1 },
  { id: 'carcass', name: 'Carcasse', cls: 'node', res: 'food', kind: 'meat', amount: 100, size: 0 },
  { id: 'fish', name: 'Banc de poissons', cls: 'node', res: 'food', kind: 'fish', amount: 300, size: 1, water: true },
];

// ---------------------------------------------------------------------------
// Bâtiments
// ---------------------------------------------------------------------------

const BUILDING_LIST = [
  {
    id: 'hall', names: { franks: 'Grande Salle', gauls: 'Oppidum' }, page: 'eco', size: 4, hp: 2400,
    armor: { melee: 3, pierce: 10 }, cost: { wood: 275, stone: 100 }, time: 100, age: 2, los: 10, pop: 10,
    drop: ['food', 'wood', 'gold', 'stone'],
    trains: ['villager', 'brennus', 'ambiorix', 'vercingetorix', 'camulogene', 'divico', 'commios', 'childeric', 'clotilde', 'clovis', 'charles_martel', 'charlemagne', 'roland'],
    atk: { pierce: 12 }, range: 7, rof: 2, arrows: 1, projectile: 'arrow', projSpeed: 14, garrison: 15,
    desc: 'Cœur de votre peuple : forme les villageois et vos héros, reçoit toutes les ressources, fait progresser les âges.',
  },
  {
    id: 'house', names: { franks: 'Maison de bois', gauls: 'Hutte gauloise' }, page: 'eco', size: 2, hp: 500,
    armor: { melee: 1, pierce: 8 }, cost: { wood: 30 }, time: 20, age: 1, los: 5, pop: 5,
    desc: 'Augmente la population maximale de 5.',
  },
  {
    id: 'farm', names: { franks: 'Ferme', gauls: 'Ferme' }, page: 'eco', size: 3, hp: 250, walkable: true,
    armor: { melee: 0, pierce: 0 }, cost: { wood: 60 }, time: 12, age: 1, los: 3, food: 350,
    desc: 'Source de nourriture inépuisable (3 villageois au maximum). Se ressème toute seule contre 60 de bois.',
  },
  {
    id: 'mill', names: { franks: 'Moulin', gauls: 'Moulin' }, page: 'eco', size: 2, hp: 600,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 100 }, time: 25, age: 1, los: 6, drop: ['food'],
    desc: 'On y dépose la nourriture. Construisez-le près des baies et des fermes. Améliore la récolte de nourriture.',
  },
  {
    id: 'lumber', names: { franks: 'Scierie', gauls: 'Scierie' }, page: 'eco', size: 2, hp: 600,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 100 }, time: 25, age: 1, los: 6, drop: ['wood'],
    desc: 'On y dépose le bois. Construisez-la au bord d\'une forêt. Améliore la coupe du bois.',
  },
  {
    id: 'mining', names: { franks: 'Camp minier', gauls: 'Camp minier' }, page: 'eco', size: 2, hp: 600,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 100 }, time: 25, age: 1, los: 6, drop: ['gold', 'stone'],
    desc: 'On y dépose l\'or et la pierre. Construisez-le près d\'un filon. Améliore l\'extraction.',
  },
  {
    id: 'barracks', names: { franks: 'Caserne', gauls: 'Maison des guerriers' }, page: 'mil', size: 3, hp: 1200,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 175 }, time: 40, age: 1, los: 7,
    trains: ['militia', 'spearman', 'swordsman', 'champion', 'molosse', 'antrustion', 'sergent', 'soldurius'],
    desc: 'Forme les fantassins : miliciens, lanciers, épéistes et champions.',
  },
  {
    id: 'archery', names: { franks: 'Champ de tir', gauls: 'Champ de tir' }, page: 'mil', size: 3, hp: 1200,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 175 }, time: 40, age: 2, los: 7, trains: ['archer', 'crossbow', 'frondeur', 'arbaletrier_imp'],
    desc: 'Forme les archers et les arbalétriers.',
  },
  {
    id: 'stable', names: { franks: 'Écurie', gauls: 'Enclos à chevaux' }, page: 'mil', size: 3, hp: 1200,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 175 }, time: 40, age: 2, los: 7, trains: ['scout', 'cavalry', 'knight', 'leude', 'essedaire', 'preux'],
    desc: 'Forme les éclaireurs, les cavaliers et les chevaliers.',
  },
  {
    id: 'forge', names: { franks: 'Forge', gauls: 'Forge' }, page: 'mil', size: 3, hp: 1000,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 150 }, time: 40, age: 2, los: 6,
    desc: 'Améliore l\'attaque et l\'armure de votre armée.',
  },
  {
    id: 'tower', names: { franks: 'Tour de guet', gauls: 'Tour de guet' }, page: 'mil', size: 2, hp: 850,
    armor: { melee: 5, pierce: 9 }, cost: { wood: 50, stone: 100 }, time: 35, age: 2, los: 10,
    atk: { pierce: 15 }, range: 8, rof: 2, arrows: 1, projectile: 'arrow', projSpeed: 15, garrison: 5, tags: ['building', 'tower', 'stone'],
    desc: 'Tour de défense : tire des flèches sur les ennemis proches. Chaque soldat à l\'intérieur ajoute une flèche. Clic droit sur un ennemi : cible prioritaire.',
  },
  {
    id: 'slingtower', names: { franks: 'Tour à mangonneau', gauls: 'Tour lance-pierres' }, page: 'mil', size: 2, hp: 1100,
    armor: { melee: 6, pierce: 12 }, cost: { wood: 120, stone: 300, gold: 220 }, time: 60, age: 3, los: 10,
    atk: { pierce: 24 }, range: 10, rof: 4, splash: 1.7, arrows: 1, projectile: 'stone', projSpeed: 9, garrison: 5, tags: ['building', 'tower', 'stone'],
    desc: 'Très coûteuse. Lance de lourdes pierres qui frappent toute une zone : redoutable contre les groupes de soldats. Deux soldats abrités ajoutent un tir.',
  },
  {
    id: 'temple', names: { franks: 'Chapelle', gauls: 'Nemeton' }, page: 'mil', size: 3, hp: 1000,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 120, stone: 100 }, time: 45, age: 2, los: 7, trains: ['healer', 'barde', 'moine'],
    desc: 'Lieu sacré : forme les guérisseurs qui soignent vos soldats.',
  },
  {
    id: 'siege', names: { franks: 'Atelier de siège', gauls: 'Atelier de siège' }, page: 'mil', size: 4, hp: 1600,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 200 }, time: 50, age: 3, los: 7, trains: ['ram', 'catapult', 'sapper', 'siegetower', 'baliste'],
    desc: 'Fabrique les béliers et les catapultes pour abattre les murs ennemis.',
  },
  {
    id: 'castle', names: { franks: 'Château', gauls: 'Citadelle' }, page: 'mil', size: 5, hp: 3600,
    armor: { melee: 8, pierce: 12 }, cost: { stone: 400 }, time: 110, age: 3, los: 11,
    trains: ['francisque', 'gesate'], atk: { pierce: 22 }, range: 9, rof: 1.8, arrows: 3, projectile: 'arrow', projSpeed: 16,
    garrison: 20,
    desc: 'Forteresse imprenable : forme votre guerrier unique, tire une volée de flèches et abrite 20 soldats.',
  },
  {
    id: 'dock', names: { franks: 'Port', gauls: 'Embarcadère' }, page: 'eco', size: 3, hp: 1100,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 150 }, time: 40, age: 1, los: 8, drop: ['food'], trains: ['fishingboat', 'warship'],
    shore: true,
    desc: 'À construire au bord de l\'eau. On y forme les barques de pêche et les navires de guerre ; la pêche y est déposée.',
  },
  {
    id: 'market', names: { franks: 'Marché', gauls: 'Marché' }, page: 'civ', size: 3, hp: 1000,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 150, gold: 30 }, time: 45, age: 2, los: 6, market: true,
    desc: 'Achetez et vendez nourriture, bois et pierre contre de l\'or. Les prix suivent l\'offre et la demande.',
  },
  {
    id: 'academy', names: { franks: 'Scriptorium', gauls: 'Cercle des druides' }, page: 'civ', size: 3, hp: 1000,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 150, stone: 100 }, time: 50, age: 2, los: 7,
    desc: 'Lieu de savoir : recherches de médecine, de cartographie, d\'organisation et de stratégie.',
  },
  {
    id: 'great_house', names: { franks: 'Grande maison', gauls: 'Grande hutte' }, page: 'eco', size: 3, hp: 900,
    armor: { melee: 2, pierce: 9 }, cost: { wood: 130 }, time: 30, age: 2, los: 5, pop: 12,
    desc: 'Loge 12 habitants : moins encombrante que trois maisons, pour bâtir une vraie cité.',
  },
  {
    id: 'infirmary', names: { franks: 'Hôtel-Dieu', gauls: 'Maison des guérisseurs' }, page: 'civ', size: 3, hp: 1000,
    armor: { melee: 2, pierce: 8 }, cost: { wood: 130, gold: 40 }, time: 40, age: 2, los: 6, aura: { kind: 'heal', v: 1.5, r: 6 }, regen: { hp: 3, r: 7, garrison: 8 }, garrison: 10,
    desc: 'Soigne les unités blessées à proximité (3 PV par seconde) et bien plus vite celles qui s\'y abritent (jusqu\'à 10).',
  },
  {
    id: 'monument', names: { franks: 'Croix monumentale', gauls: 'Menhir sculpté' }, page: 'civ', size: 2, hp: 1200,
    armor: { melee: 4, pierce: 10 }, cost: { gold: 200, stone: 80 }, time: 40, age: 3, los: 7, aura: { kind: 'gather', v: 0.1, r: 10 },
    desc: 'Fierté de la cité : les villageois proches récoltent 10 % plus vite.',
  },
  // ---------------------------------- Défenses : palissades, murailles, portes, bastions ---------------------------
  {
    id: 'palisade', names: { franks: 'Palissade', gauls: 'Palissade' }, page: 'def', size: 1, hp: 450,
    armor: { melee: 2, pierce: 10 }, cost: { wood: 8 }, time: 6, age: 1, los: 2, wall: true, deckCap: 3, tags: ['building', 'wall', 'wood'],
    desc: 'Enceinte de troncs pointus : pas chère, vite montée, mais elle brûle. Se trace en ligne.',
  },
  {
    id: 'palisade_gate', names: { franks: 'Porte de palissade', gauls: 'Porte de palissade' }, page: 'def', size: 1, hp: 800,
    armor: { melee: 3, pierce: 12 }, cost: { wood: 35 }, time: 12, age: 1, los: 3, gate: true, deckCap: 3, tags: ['building', 'gate', 'wall', 'wood'],
    desc: 'Laisse passer vos unités, pas celles de l\'ennemi. Les béliers l\'enfoncent vite.',
  },
  {
    id: 'wall', names: { franks: 'Mur de pierre', gauls: 'Murus gallicus' }, page: 'def', size: 1, hp: 2200,
    armor: { melee: 6, pierce: 18 }, cost: { stone: 28 }, time: 12, age: 2, los: 3, wall: true, deckCap: 4,
    atk: { pierce: 9 }, range: 7, rof: 2, arrows: 0, projectile: 'arrow', projSpeed: 14, tags: ['building', 'wall', 'stone'],
    desc: 'Muraille de pierre : difficile à détruire. Deux soldats peuvent y prendre position et tirer depuis le chemin de ronde.',
  },
  {
    id: 'gate', names: { franks: 'Porte fortifiée', gauls: 'Porte fortifiée' }, page: 'def', size: 1, hp: 1800,
    armor: { melee: 6, pierce: 18 }, cost: { stone: 45, wood: 25 }, time: 18, age: 2, los: 4, gate: true, deckCap: 4,
    atk: { pierce: 9 }, range: 7, rof: 2, arrows: 0, projectile: 'arrow', projSpeed: 14, tags: ['building', 'gate', 'wall', 'stone'],
    desc: 'Porte de pierre : vos unités passent, celles de l\'ennemi doivent la détruire ou escalader la muraille.',
  },
  {
    id: 'rampart', names: { franks: 'Grande muraille', gauls: 'Grand rempart' }, page: 'def', size: 2, hp: 6500,
    armor: { melee: 10, pierce: 25 }, cost: { stone: 110, gold: 20 }, time: 30, age: 3, los: 4, wall: true, deckCap: 10,
    atk: { pierce: 12 }, range: 8, rof: 2, arrows: 0, projectile: 'arrow', projSpeed: 15, tags: ['building', 'wall', 'stone', 'great'],
    desc: 'Immense muraille : très chère, presque indestructible sans machines de siège. Quatre soldats y tirent du haut du chemin de ronde.',
  },
  {
    id: 'great_gate', names: { franks: 'Grande porte', gauls: 'Grande porte' }, page: 'def', size: 2, hp: 4500,
    armor: { melee: 10, pierce: 25 }, cost: { stone: 140, wood: 60, gold: 30 }, time: 40, age: 3, los: 5, gate: true, deckCap: 6,
    atk: { pierce: 12 }, range: 8, rof: 2, arrows: 0, projectile: 'arrow', projSpeed: 15, tags: ['building', 'gate', 'wall', 'stone', 'great'],
    desc: 'Porte monumentale de la Grande muraille : passage large pour vos armées.',
  },
  {
    id: 'bastion', names: { franks: 'Bastion', gauls: 'Bastion' }, page: 'def', size: 3, hp: 3600,
    armor: { melee: 8, pierce: 16 }, cost: { stone: 320, wood: 60 }, time: 70, age: 3, los: 11, garrison: 16, walk: true,
    atk: { pierce: 20 }, range: 10, rof: 1.8, arrows: 3, projectile: 'arrow', projSpeed: 16, tags: ['building', 'tower', 'stone', 'great'],
    desc: 'Tour massive à poser aux angles des murailles : volées de flèches à longue portée, abrite 10 soldats.',
  },
  {
    id: 'outpost', names: { franks: 'Poste de guet', gauls: 'Poste de guet' }, page: 'def', size: 1, hp: 500,
    armor: { melee: 1, pierce: 8 }, cost: { wood: 35 }, time: 12, age: 1, los: 14, tags: ['building', 'wood'],
    desc: 'Simple mirador qui voit très loin : pour surveiller les gués et l\'orée des forêts.',
  },
  // --- Points stratégiques (posés par la carte, neutres au départ : on les capture en y tenant des soldats) ---
  {
    id: 'pt_treasure', name: 'Trésor des Anciens', page: null, size: 2, hp: 9999, armor: { melee: 99, pierce: 99 }, cost: {}, time: 1, age: 1, los: 12,
    capture: { r: 4.5, income: { gold: 1.5, stone: 0.7 } }, tag: 'Or et pierre', tags: ['building', 'point'],
    desc: 'Ruines d\'un ancien trésor au milieu du gué. Tenez-le avec des soldats (sans ennemi à proximité) pour le capturer : il rapporte de l\'or et de la pierre en continu.',
  },
  {
    id: 'pt_hill', name: 'Colline sacrée', page: null, size: 2, hp: 9999, armor: { melee: 99, pierce: 99 }, cost: {}, time: 1, age: 1, los: 15,
    capture: { r: 4.5, income: { food: 0.8, wood: 0.6 } }, aura: { kind: 'atk', v: 0.1, r: 9 }, tag: 'Vue et attaque', tags: ['building', 'point'],
    desc: 'Haut lieu qui domine la région. Capturé, il offre une vue lointaine, un peu de nourriture et de bois, et +10 % d\'attaque à vos soldats proches.',
  },
  {
    id: 'countersiege', names: { franks: 'Chevalet de contre-siège', gauls: 'Murs de contre-siège' }, page: 'def', size: 3, hp: 2600,
    armor: { melee: 6, pierce: 14 }, cost: { stone: 450, wood: 250, gold: 350 }, time: 75, age: 3, los: 8, tags: ['building', 'stone'],
    counter: { r: 9, mul: 0.6, fire: 6 },
    desc: 'Très coûteux. Pots de poix, herses et contre-machines : les bâtiments proches subissent 40 % de dégâts de siège en moins, et les machines ennemies à portée brûlent.',
  },
];

// ---------------------------------------------------------------------------
// Technologies
// effets : { who: { ids, tags (au moins une), cls, from }, stat, op: 'add' | 'mul', v }
// ---------------------------------------------------------------------------

const INF = { tags: ['infantry'] };
const CAV = { tags: ['cavalry'] };
const RNG = { tags: ['archer', 'ranged'] };
const VIL = { ids: ['villager'] };

const TECH_LIST = [
  // --- Grande Salle : les âges ---
  {
    id: 'age2', name: 'Âge du Bourg', building: 'hall', age: 1, ageUp: 2, cost: { food: 500 }, time: 50,
    requires: { count: 2, among: ['mill', 'lumber', 'mining', 'barracks'], label: '2 bâtiments : moulin, scierie, camp minier ou caserne' },
    desc: 'Débloque le champ de tir, l\'écurie, la forge, la tour, le temple, les murs de pierre et un premier choix de héros, d\'unité spéciale et de bonus.',
  },
  {
    id: 'age3', name: 'Âge de la Forteresse', building: 'hall', age: 2, ageUp: 3, cost: { food: 700, gold: 250 }, time: 65,
    requires: { count: 2, among: ['archery', 'stable', 'forge', 'tower', 'temple'], label: '2 bâtiments : champ de tir, écurie, forge, tour ou temple' },
    desc: 'Débloque le château, l\'atelier de siège, les champions, les chevaliers, les arbalétriers, les grandes murailles et un deuxième choix de héros, d\'unité spéciale et de bonus.',
  },
  {
    id: 'age4', name: 'Âge Impérial', building: 'hall', age: 3, ageUp: 4, cost: { food: 1100, gold: 650, stone: 250 }, time: 80,
    requires: { count: 3, among: ['castle', 'siege', 'academy', 'market', 'forge', 'temple', 'bastion', 'infirmary'], label: '3 bâtiments : château, atelier de siège, académie, marché, forge, temple, bastion ou infirmerie' },
    desc: 'Débloque un troisième choix de héros, d\'unité spéciale et de bonus.',
  },
  {
    id: 'carry1', name: 'Sacs de portage', building: 'hall', age: 1, cost: { food: 100, wood: 100 }, time: 30,
    effects: [{ who: VIL, stat: 'carry', op: 'add', v: 5 }],
    desc: 'Les villageois transportent 5 ressources de plus à chaque trajet.',
  },
  {
    id: 'carry2', name: 'Charrettes', building: 'hall', age: 2, cost: { food: 200, wood: 150 }, time: 40, requiresTech: 'carry1',
    effects: [{ who: VIL, stat: 'carry', op: 'add', v: 5 }],
    desc: 'Les villageois transportent encore 5 ressources de plus.',
  },
  // --- Moulin ---
  {
    id: 'plow1', name: 'Araire de bois', building: 'mill', age: 1, cost: { food: 100, wood: 75 }, time: 30,
    effects: [{ who: VIL, stat: 'gather.farm', op: 'mul', v: 1.25 }],
    desc: 'Les fermiers travaillent 25 % plus vite.',
  },
  {
    id: 'plow2', name: 'Charrue de fer', building: 'mill', age: 2, cost: { food: 150, wood: 100 }, time: 40, requiresTech: 'plow1',
    effects: [{ who: VIL, stat: 'gather.farm', op: 'mul', v: 1.25 }],
    desc: 'Les fermiers travaillent encore 25 % plus vite.',
  },
  {
    id: 'baskets', name: 'Paniers tressés', building: 'mill', age: 1, cost: { food: 100, wood: 50 }, time: 25,
    effects: [{ who: VIL, stat: 'gather.berries', op: 'mul', v: 1.3 }],
    desc: 'La cueillette des baies est 30 % plus rapide.',
  },
  // --- Scierie ---
  {
    id: 'axe1', name: 'Hache de fer', building: 'lumber', age: 1, cost: { food: 100, wood: 50 }, time: 30,
    effects: [{ who: VIL, stat: 'gather.wood', op: 'mul', v: 1.25 }],
    desc: 'Les bûcherons coupent 25 % plus vite.',
  },
  {
    id: 'axe2', name: 'Hache d\'acier', building: 'lumber', age: 2, cost: { food: 150, wood: 100 }, time: 40, requiresTech: 'axe1',
    effects: [{ who: VIL, stat: 'gather.wood', op: 'mul', v: 1.25 }],
    desc: 'Les bûcherons coupent encore 25 % plus vite.',
  },
  // --- Camp minier ---
  {
    id: 'pick1', name: 'Pioche de fer', building: 'mining', age: 1, cost: { food: 100, wood: 75 }, time: 30,
    effects: [
      { who: VIL, stat: 'gather.gold', op: 'mul', v: 1.25 },
      { who: VIL, stat: 'gather.stone', op: 'mul', v: 1.25 },
    ],
    desc: 'Les mineurs extraient l\'or et la pierre 25 % plus vite.',
  },
  {
    id: 'pick2', name: 'Pioche d\'acier', building: 'mining', age: 2, cost: { food: 150, wood: 100 }, time: 40, requiresTech: 'pick1',
    effects: [
      { who: VIL, stat: 'gather.gold', op: 'mul', v: 1.25 },
      { who: VIL, stat: 'gather.stone', op: 'mul', v: 1.25 },
    ],
    desc: 'Les mineurs extraient encore 25 % plus vite.',
  },
  // --- Forge ---
  {
    id: 'atk_inf1', name: 'Lames affûtées', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [{ who: INF, stat: 'atk.melee', op: 'add', v: 1 }], desc: 'Fantassins : +1 d\'attaque.',
  },
  {
    id: 'atk_inf2', name: 'Lames trempées', building: 'forge', age: 3, cost: { food: 200, gold: 140 }, time: 50, requiresTech: 'atk_inf1',
    effects: [{ who: INF, stat: 'atk.melee', op: 'add', v: 2 }], desc: 'Fantassins : +2 d\'attaque.',
  },
  {
    id: 'atk_cav1', name: 'Éperons de fer', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [{ who: CAV, stat: 'atk.melee', op: 'add', v: 1 }], desc: 'Cavaliers : +1 d\'attaque.',
  },
  {
    id: 'atk_cav2', name: 'Lances renforcées', building: 'forge', age: 3, cost: { food: 200, gold: 140 }, time: 50, requiresTech: 'atk_cav1',
    effects: [{ who: CAV, stat: 'atk.melee', op: 'add', v: 2 }], desc: 'Cavaliers : +2 d\'attaque.',
  },
  {
    id: 'atk_arch1', name: 'Flèches barbelées', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [{ who: RNG, stat: 'atk.pierce', op: 'add', v: 1 }], desc: 'Tireurs : +1 d\'attaque.',
  },
  {
    id: 'atk_arch2', name: 'Flèches d\'acier', building: 'forge', age: 3, cost: { food: 200, gold: 140 }, time: 50, requiresTech: 'atk_arch1',
    effects: [
      { who: RNG, stat: 'atk.pierce', op: 'add', v: 1 },
      { who: { tags: ['archer'] }, stat: 'range', op: 'add', v: 1 },
    ],
    desc: 'Tireurs : +1 d\'attaque, archers : +1 de portée.',
  },
  {
    id: 'arm_inf1', name: 'Cottes de mailles', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [
      { who: INF, stat: 'armor.melee', op: 'add', v: 1 },
      { who: INF, stat: 'armor.pierce', op: 'add', v: 1 },
    ],
    desc: 'Fantassins : +1 d\'armure (mêlée et tir).',
  },
  {
    id: 'arm_inf2', name: 'Armures de plates', building: 'forge', age: 3, cost: { food: 200, gold: 140 }, time: 50, requiresTech: 'arm_inf1',
    effects: [
      { who: INF, stat: 'armor.melee', op: 'add', v: 2 },
      { who: INF, stat: 'armor.pierce', op: 'add', v: 2 },
    ],
    desc: 'Fantassins : +2 d\'armure (mêlée et tir).',
  },
  {
    id: 'arm_cav1', name: 'Barde de cuir', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [
      { who: CAV, stat: 'armor.melee', op: 'add', v: 1 },
      { who: CAV, stat: 'armor.pierce', op: 'add', v: 1 },
    ],
    desc: 'Cavaliers : +1 d\'armure (mêlée et tir).',
  },
  {
    id: 'arm_cav2', name: 'Barde de plates', building: 'forge', age: 3, cost: { food: 200, gold: 140 }, time: 50, requiresTech: 'arm_cav1',
    effects: [
      { who: CAV, stat: 'armor.melee', op: 'add', v: 1 },
      { who: CAV, stat: 'armor.pierce', op: 'add', v: 2 },
    ],
    desc: 'Cavaliers : +1 d\'armure de mêlée, +2 contre les tirs.',
  },
  {
    id: 'arm_arch1', name: 'Gilets matelassés', building: 'forge', age: 2, cost: { food: 100, gold: 60 }, time: 35,
    effects: [
      { who: RNG, stat: 'armor.melee', op: 'add', v: 1 },
      { who: RNG, stat: 'armor.pierce', op: 'add', v: 1 },
    ],
    desc: 'Tireurs : +1 d\'armure (mêlée et tir).',
  },
  // --- Écurie ---
  {
    id: 'bloodlines', name: 'Lignée de destriers', building: 'stable', age: 2, cost: { food: 150, gold: 80 }, time: 40,
    effects: [{ who: CAV, stat: 'hp', op: 'add', v: 20 }], desc: 'Cavaliers : +20 points de vie.',
  },
  // --- Moulin : chasse ---
  {
    id: 'hunt1', name: 'Chiens de chasse', building: 'mill', age: 1, cost: { food: 100, wood: 50 }, time: 25,
    effects: [{ who: VIL, stat: 'gather.meat', op: 'mul', v: 1.4 }],
    desc: 'Les chasseurs rapportent la viande 40 % plus vite.',
  },
  // --- Port ---
  {
    id: 'nets1', name: 'Filets de pêche', building: 'dock', age: 1, cost: { food: 100, wood: 100 }, time: 30,
    effects: [{ who: { tags: ['fisher'] }, stat: 'gather.fish', op: 'mul', v: 1.3 }],
    desc: 'Les barques de pêche récoltent 30 % plus vite.',
  },
  {
    id: 'nets2', name: 'Grands filets', building: 'dock', age: 2, cost: { food: 150, wood: 150 }, time: 40, requiresTech: 'nets1',
    effects: [{ who: { tags: ['fisher'] }, stat: 'gather.fish', op: 'mul', v: 1.3 }, { who: { tags: ['fisher'] }, stat: 'carry', op: 'add', v: 10 }],
    desc: 'Les barques pêchent encore 30 % plus vite et portent 10 poissons de plus.',
  },
  {
    id: 'hull1', name: 'Coques renforcées', building: 'dock', age: 2, cost: { wood: 150, gold: 100 }, time: 40,
    effects: [
      { who: { tags: ['ship'] }, stat: 'hp', op: 'add', v: 40 },
      { who: { tags: ['ship'] }, stat: 'armor.pierce', op: 'add', v: 1 },
    ],
    desc: 'Navires : +40 points de vie et +1 d\'armure contre les tirs.',
  },
  {
    id: 'naval_atk', name: 'Balistes de pont', building: 'dock', age: 3, cost: { wood: 200, gold: 150 }, time: 50, requiresTech: 'hull1',
    effects: [
      { who: { ids: ['warship'] }, stat: 'atk.pierce', op: 'add', v: 3 },
      { who: { ids: ['warship'] }, stat: 'range', op: 'add', v: 1 },
    ],
    desc: 'Navires de guerre : +3 d\'attaque et +1 de portée.',
  },
  // --- Marché ---
  {
    id: 'trade1', name: 'Marchands itinérants', building: 'market', age: 2, cost: { wood: 100, gold: 150 }, time: 40,
    trade: 0.2,
    desc: 'La commission du marché passe de 30 % à 20 %.',
  },
  {
    id: 'trade2', name: 'Guilde des marchands', building: 'market', age: 3, cost: { wood: 150, gold: 300 }, time: 55, requiresTech: 'trade1',
    trade: 0.08,
    desc: 'La commission du marché tombe à 8 %.',
  },
  // --- Académie ---
  {
    id: 'med1', name: 'Herboristerie', building: 'academy', age: 2, cost: { food: 100, gold: 100 }, time: 40,
    effects: [
      { who: { ids: ['healer'] }, stat: 'heal.amount', op: 'add', v: 2 },
      { who: { ids: ['healer'] }, stat: 'heal.range', op: 'add', v: 1 },
    ],
    desc: 'Les guérisseurs soignent davantage (+2) et de plus loin (+1 case).',
  },
  {
    id: 'med2', name: 'Bénédiction', building: 'academy', age: 3, cost: { food: 200, gold: 200 }, time: 55, requiresTech: 'med1',
    effects: [{ who: { ids: ['healer'] }, stat: 'heal.every', op: 'mul', v: 0.6 }],
    desc: 'Les guérisseurs soignent 40 % plus souvent.',
  },
  {
    id: 'scout1', name: 'Cartographie', building: 'academy', age: 2, cost: { food: 150, gold: 100 }, time: 40,
    effects: [{ who: { all: true }, stat: 'los', op: 'add', v: 1 }],
    desc: 'Toutes vos unités et bâtiments voient une case plus loin.',
  },
  {
    id: 'eco1', name: 'Almanach des saisons', building: 'academy', age: 2, cost: { food: 200, gold: 100 }, time: 50,
    effects: [
      { who: VIL, stat: 'gather.wood', op: 'mul', v: 1.1 },
      { who: VIL, stat: 'gather.farm', op: 'mul', v: 1.1 },
      { who: VIL, stat: 'gather.berries', op: 'mul', v: 1.1 },
      { who: VIL, stat: 'gather.gold', op: 'mul', v: 1.1 },
      { who: VIL, stat: 'gather.stone', op: 'mul', v: 1.1 },
      { who: VIL, stat: 'gather.meat', op: 'mul', v: 1.1 },
    ],
    desc: 'Les villageois récoltent tout 10 % plus vite.',
  },
  {
    id: 'strat1', name: 'Art de la guerre', building: 'academy', age: 3, cost: { food: 250, gold: 250 }, time: 60,
    effects: [{ who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'hp', op: 'mul', v: 1.1 }],
    desc: 'Fantassins, cavaliers et archers : +10 % de points de vie.',
  },
  // --- Murailles et sièges ---
  {
    id: 'ladders', name: 'Échelles d\'assaut', building: 'barracks', age: 2, cost: { food: 100, wood: 150 }, time: 35,
    unlocks: 'ladders',
    desc: 'Vos fantassins peuvent escalader les murailles ennemies (lentement, et très exposés). Clic droit sur un mur ennemi.',
  },
  {
    id: 'fire_arrows', name: 'Flèches enflammées', building: 'forge', age: 2, cost: { food: 100, gold: 100 }, time: 35,
    effects: [
      { who: { tags: ['archer'] }, stat: 'bonus.wood', op: 'add', v: 6 },
      { who: { tags: ['tower'] }, stat: 'bonus.wood', op: 'add', v: 6 },
      { who: { ids: ['castle', 'hall'] }, stat: 'bonus.wood', op: 'add', v: 6 },
    ],
    desc: 'Vos tireurs et vos tours font +6 de dégâts aux constructions en bois (palissades, portes de bois, maisons).',
  },
  {
    id: 'mason1', name: 'Maçonnerie', building: 'hall', age: 2, cost: { food: 150, wood: 100, stone: 50 }, time: 40,
    effects: [
      { who: { tags: ['wall'] }, stat: 'hp', op: 'mul', v: 1.25 },
      { who: { tags: ['tower'] }, stat: 'hp', op: 'mul', v: 1.25 },
    ],
    desc: 'Murailles, portes et tours : +25 % de points de vie.',
  },
  {
    id: 'mason2', name: 'Fortifications', building: 'hall', age: 3, cost: { food: 250, wood: 150, stone: 150 }, time: 55, requiresTech: 'mason1',
    effects: [
      { who: { tags: ['wall'] }, stat: 'hp', op: 'mul', v: 1.3 },
      { who: { tags: ['wall'] }, stat: 'armor.melee', op: 'add', v: 2 },
      { who: { tags: ['tower'] }, stat: 'range', op: 'add', v: 1 },
    ],
    desc: 'Murailles : +30 % de points de vie et +2 d\'armure de mêlée ; tours : +1 de portée.',
  },
  // --- Château : technologies uniques ---
  {
    id: 'frank_axe', name: 'Haches barbelées', civ: 'franks', building: 'castle', age: 3, cost: { food: 250, gold: 200 }, time: 55,
    effects: [
      { who: { ids: ['francisque'] }, stat: 'range', op: 'add', v: 1 },
      { who: { ids: ['francisque'] }, stat: 'atk.pierce', op: 'add', v: 2 },
    ],
    desc: 'Francisques : +1 de portée et +2 d\'attaque.',
  },
  {
    id: 'gaul_fury', name: 'Fureur celtique', civ: 'gauls', building: 'castle', age: 3, cost: { food: 250, gold: 200 }, time: 55,
    effects: [
      { who: { ids: ['gesate'] }, stat: 'atk.melee', op: 'add', v: 3 },
      { who: { ids: ['gesate'] }, stat: 'speed', op: 'add', v: 0.2 },
    ],
    desc: 'Gésates : +3 d\'attaque et plus rapides.',
  },
  // --- Bonus choisis à chaque âge (un parmi deux) ---
  {
    id: 'g2a', civ: 'gauls', choice: true, age: 2, name: 'Forêts sacrées',
    effects: [{ who: VIL, stat: 'gather.wood', op: 'mul', v: 1.2 }],
    desc: 'Les bûcherons coupent 20 % plus vite : la forêt est le sanctuaire des Gaulois.',
  },
  {
    id: 'g2b', civ: 'gauls', choice: true, age: 2, name: 'Levée des clans',
    effects: [{ who: INF, stat: 'cost.food', op: 'mul', v: 0.85 }, { who: { from: 'barracks' }, stat: 'time', op: 'mul', v: 0.9 }],
    desc: 'Fantassins 15 % moins chers en nourriture, formés 10 % plus vite.',
  },
  {
    id: 'g3a', civ: 'gauls', choice: true, age: 3, name: 'Forges gauloises',
    effects: [{ who: INF, stat: 'atk.melee', op: 'add', v: 1 }, { who: INF, stat: 'armor.pierce', op: 'add', v: 1 }],
    desc: 'Fantassins : +1 d\'attaque et +1 d\'armure contre les tirs.',
  },
  {
    id: 'g3b', civ: 'gauls', choice: true, age: 3, name: 'Oppida fortifiés',
    effects: [{ who: { cls: 'building' }, stat: 'hp', op: 'mul', v: 1.2 }, { who: { tags: ['tower'] }, stat: 'range', op: 'add', v: 1 }],
    desc: 'Tous les bâtiments ont 20 % de points de vie en plus ; tours et bastions : +1 de portée.',
  },
  {
    id: 'g4a', civ: 'gauls', choice: true, age: 4, name: 'Grande assemblée',
    effects: [
      { who: VIL, stat: 'gather.wood', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.farm', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.berries', op: 'mul', v: 1.12 },
      { who: VIL, stat: 'gather.gold', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.stone', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.meat', op: 'mul', v: 1.12 },
      { who: VIL, stat: 'carry', op: 'add', v: 5 },
    ],
    desc: 'Les villageois récoltent tout 12 % plus vite et portent 5 ressources de plus.',
  },
  {
    id: 'g4b', civ: 'gauls', choice: true, age: 4, name: 'Fureur de Teutatès',
    effects: [
      { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.melee', op: 'add', v: 2 },
      { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.pierce', op: 'add', v: 2 },
      { who: { tags: ['infantry', 'cavalry'] }, stat: 'speed', op: 'add', v: 0.15 },
    ],
    desc: 'Soldats : +2 d\'attaque ; fantassins et cavaliers plus rapides.',
  },
  {
    id: 'f2a', civ: 'franks', choice: true, age: 2, name: 'Terres du fisc',
    effects: [{ who: VIL, stat: 'gather.farm', op: 'mul', v: 1.2 }, { who: VIL, stat: 'gather.berries', op: 'mul', v: 1.15 }],
    desc: 'Les fermiers travaillent 20 % plus vite, la cueillette est 15 % plus rapide.',
  },
  {
    id: 'f2b', civ: 'franks', choice: true, age: 2, name: 'Levée de leudes',
    effects: [{ who: CAV, stat: 'cost.food', op: 'mul', v: 0.85 }, { who: { from: 'stable' }, stat: 'time', op: 'mul', v: 0.9 }],
    desc: 'Cavaliers 15 % moins chers en nourriture, formés 10 % plus vite.',
  },
  {
    id: 'f3a', civ: 'franks', choice: true, age: 3, name: 'Forges carolingiennes',
    effects: [
      { who: { tags: ['infantry', 'cavalry'] }, stat: 'armor.melee', op: 'add', v: 1 },
      { who: { tags: ['infantry', 'cavalry'] }, stat: 'armor.pierce', op: 'add', v: 1 },
    ],
    desc: 'Fantassins et cavaliers : +1 d\'armure (mêlée et tir).',
  },
  {
    id: 'f3b', civ: 'franks', choice: true, age: 3, name: 'Marches fortifiées',
    effects: [{ who: { cls: 'building' }, stat: 'hp', op: 'mul', v: 1.2 }, { who: { tags: ['tower'] }, stat: 'range', op: 'add', v: 1 }, { who: { ids: ['castle'] }, stat: 'range', op: 'add', v: 1 }],
    desc: 'Tous les bâtiments ont 20 % de points de vie en plus ; tours, bastions et château : +1 de portée.',
  },
  {
    id: 'f4a', civ: 'franks', choice: true, age: 4, name: 'Empire carolingien',
    effects: [
      { who: VIL, stat: 'gather.wood', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.farm', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.berries', op: 'mul', v: 1.12 },
      { who: VIL, stat: 'gather.gold', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.stone', op: 'mul', v: 1.12 }, { who: VIL, stat: 'gather.meat', op: 'mul', v: 1.12 },
      { who: VIL, stat: 'carry', op: 'add', v: 5 },
    ],
    desc: 'Les villageois récoltent tout 12 % plus vite et portent 5 ressources de plus.',
  },
  {
    id: 'f4b', civ: 'franks', choice: true, age: 4, name: 'Serment des douze pairs',
    effects: [
      { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'hp', op: 'mul', v: 1.1 },
      { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.melee', op: 'add', v: 1 },
      { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.pierce', op: 'add', v: 1 },
    ],
    desc: 'Soldats : +10 % de points de vie et +1 d\'attaque.',
  },
];

// ---------------------------------------------------------------------------
// Civilisations
// ---------------------------------------------------------------------------

export const CIVS = {
  franks: {
    id: 'franks',
    name: 'Francs',
    tagline: 'Cavaliers lourds et lanceurs de francisques.',
    story: 'Peuple de guerriers germaniques établi dans le nord de la Gaule, dont la cavalerie et les haches de jet sont redoutées.',
    bonuses: [
      'Cavalerie : +25 % de points de vie',
      'Écurie : cavaliers formés 20 % plus vite',
      'Fermes : récolte +15 %',
      'Château : −25 % de pierre',
    ],
    uniqueUnit: 'francisque',
    uniqueTech: 'frank_axe',
    effects: [
      { who: CAV, stat: 'hp', op: 'mul', v: 1.25 },
      { who: VIL, stat: 'gather.farm', op: 'mul', v: 1.15 },
      { who: { ids: ['castle'] }, stat: 'cost.stone', op: 'mul', v: 0.75 },
      { who: { from: 'stable' }, stat: 'time', op: 'mul', v: 0.8 },
    ],
  },
  gauls: {
    id: 'gauls',
    name: 'Gaulois',
    tagline: 'Bûcherons infatigables et hordes de guerriers.',
    story: 'Tribus celtes de forêts et d\'oppida, réputées pour leur bravoure, leurs artisans et leurs charges furieuses.',
    bonuses: [
      'Bûcherons : coupe du bois +15 %',
      'Caserne : fantassins formés 15 % plus vite',
      'Fantassins : −10 % de nourriture',
    ],
    uniqueUnit: 'gesate',
    uniqueTech: 'gaul_fury',
    effects: [
      { who: VIL, stat: 'gather.wood', op: 'mul', v: 1.15 },
      { who: { from: 'barracks' }, stat: 'time', op: 'mul', v: 0.85 },
      { who: INF, stat: 'cost.food', op: 'mul', v: 0.9 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Choix à chaque âge (comme les dieux mineurs d'Age of Mythology) : en passant à l'âge II, III puis IV, le joueur
// choisit UN héros parmi deux, UNE unité spéciale parmi deux et UN bonus parmi deux. Les options sont propres à chaque peuple.
// ---------------------------------------------------------------------------

export const CHOICE_CATS = ['hero', 'unit', 'bonus'];
export const CHOICE_LABEL = { hero: 'Héros', unit: 'Unité spéciale', bonus: 'Bonus' };
export const CHOICE_AGES = [2, 3, 4];
export const CHOICES = {
  gauls: {
    2: { hero: ['brennus', 'ambiorix'], unit: ['frondeur', 'molosse'], bonus: ['g2a', 'g2b'] },
    3: { hero: ['vercingetorix', 'camulogene'], unit: ['barde', 'essedaire'], bonus: ['g3a', 'g3b'] },
    4: { hero: ['divico', 'commios'], unit: ['soldurius', 'baliste'], bonus: ['g4a', 'g4b'] },
  },
  franks: {
    2: { hero: ['childeric', 'clotilde'], unit: ['antrustion', 'leude'], bonus: ['f2a', 'f2b'] },
    3: { hero: ['clovis', 'charles_martel'], unit: ['sergent', 'moine'], bonus: ['f3a', 'f3b'] },
    4: { hero: ['charlemagne', 'roland'], unit: ['preux', 'arbaletrier_imp'], bonus: ['f4a', 'f4b'] },
  },
};

/** Les deux options d'un choix (identifiants d'unités pour héros et unités spéciales, de technologies pour les bonus). */
export function choiceOptions(civ, age, cat) {
  return (CHOICES[civ] && CHOICES[civ][age] && CHOICES[civ][age][cat]) || [];
}

/** Clé d'un choix dans la table des décisions d'un joueur. */
export const choiceKey = (age, cat) => `${age}${cat}`;

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

// Civilisations supplémentaires : chaque module de src/core/civs/ apporte sa fiche (CIVS), ses unités, ses technologies,
// ses choix d'âge et ses noms propres. Elles sont ajoutées après les données de base (les numéros réseau restent stables).
for (const c of CIV_MODULES) {
  CIVS[c.id] = {
    id: c.id, name: c.name, tagline: c.tagline, story: c.story, bonuses: c.bonuses, uniqueUnit: c.uniqueUnit, uniqueTech: c.uniqueTech,
    effects: c.effects || [], art: c.art || 'franks', names: c.names || {}, color: c.color,
  };
  for (const u of c.units || []) {
    if (UNIT_LIST.some((x) => x.id === u.id)) throw new Error(`Unité en double : ${u.id} (${c.id})`);
    UNIT_LIST.push({ civ: c.id, ...u });
  }
  for (const t of c.techs || []) {
    if (TECH_LIST.some((x) => x.id === t.id)) throw new Error(`Technologie en double : ${t.id} (${c.id})`);
    TECH_LIST.push({ civ: c.id, ...t });
  }
  if (c.choices) CHOICES[c.id] = c.choices;
}
export const CIV_IDS = Object.keys(CIVS);

export const UNITS = {};
for (const u of UNIT_LIST) UNITS[u.id] = finishUnit(u);
export const ANIMALS = {};
for (const a of ANIMAL_LIST) ANIMALS[a.id] = { atk: { melee: 0, pierce: 0 }, armor: { melee: 0, pierce: 0 }, ...a };
export const NODES = {};
for (const n of NODE_LIST) NODES[n.id] = { tags: ['node'], ...n };
export const BUILDINGS = {};
for (const b of BUILDING_LIST) BUILDINGS[b.id] = finishBuilding(b);
// les unités propres à un peuple rejoignent automatiquement la liste de production de leur bâtiment
for (const u of Object.values(UNITS)) {
  const b = u.from && BUILDINGS[u.from];
  if (b && !b.trains.includes(u.id)) b.trains.push(u.id);
}
export const TECHS = {};
for (const t of TECH_LIST) TECHS[t.id] = { effects: [], ...t, cost: scaled(t.id, t.cost) };

/** Toutes les définitions par identifiant. */
export const DEFS = { ...UNITS, ...ANIMALS, ...NODES, ...BUILDINGS };
for (const id of Object.keys(DEFS)) DEFS[id].id = id;

/** Numéro stable de chaque type (utilisé par le réseau). */
export const DEF_IDS = Object.keys(DEFS);
export const DEF_INDEX = Object.fromEntries(DEF_IDS.map((id, i) => [id, i]));

export const UNIT_IDS = Object.keys(UNITS);
export const BUILDING_IDS = Object.keys(BUILDINGS);
export const TECH_IDS = Object.keys(TECHS);

/** Nom affiché d'une définition selon la civilisation. */
export function nameOf(id, civ) {
  const d = DEFS[id] || TECHS[id];
  if (!d) return id;
  if (civ && CIVS[civ] && CIVS[civ].names && CIVS[civ].names[id]) return CIVS[civ].names[id];
  if (d.names && civ && d.names[civ]) return d.names[civ];
  return d.name || (d.names && Object.values(d.names)[0]) || id;
}

/** Une unité est-elle disponible pour cette civilisation ? */
export function unitForCiv(id, civ) {
  const u = UNITS[id];
  return !!u && (!u.civ || u.civ === civ) && !(u.not && u.not.includes(civ)) && (!u.civs || u.civs.includes(civ));
}

/** Une technologie est-elle disponible pour cette civilisation ? */
export function techForCiv(id, civ) {
  const t = TECHS[id];
  return !!t && (!t.civ || t.civ === civ) && !(t.not && t.not.includes(civ)) && (!t.civs || t.civs.includes(civ));
}

/** Un ensemble d'effets s'applique-t-il à cette définition ? */
export function matchesWho(def, who) {
  if (!who || who.all) return true;
  if (who.ids && !who.ids.includes(def.id)) return false;
  if (who.cls && who.cls !== def.cls) return false;
  if (who.from && who.from !== def.from) return false;
  if (who.tags && !who.tags.some((t) => def.tags && def.tags.includes(t))) return false;
  return true;
}

/**
 * Caractéristiques d'un type pour un joueur : définition de base + bonus de civilisation
 * + technologies recherchées. Fonction pure : le moteur met le résultat en cache par joueur.
 */
export function computeStats(typeId, civ, techs) {
  const base = DEFS[typeId];
  const s = {
    id: typeId,
    hp: base.hp || 1,
    speed: base.speed || 0,
    los: base.los || 0,
    range: base.range || 0,
    minRange: base.minRange || 0,
    rof: base.rof || 2,
    splash: base.splash || 0,
    atk: { melee: base.atk ? base.atk.melee : 0, pierce: base.atk ? base.atk.pierce : 0 },
    armor: { melee: base.armor ? base.armor.melee : 0, pierce: base.armor ? base.armor.pierce : 0 },
    bonus: { ...(base.bonus || {}) },
    cost: { ...(base.cost || {}) },
    time: base.time || 0,
    carry: base.carry !== undefined ? base.carry : base.worker ? CARRY_BASE : 0,
    arrows: base.arrows || 0,
    gather: { wood: 1, berries: 1, farm: 1, meat: 1, gold: 1, stone: 1, fish: 1 },
    heal: base.heal ? { ...base.heal } : null,
  };
  const lists = [];
  if (civ && CIVS[civ]) lists.push(CIVS[civ].effects);
  for (const tid of techs || []) if (TECHS[tid]) lists.push(TECHS[tid].effects);
  const adds = {};
  const muls = {};
  for (const list of lists) {
    for (const e of list) {
      if (!matchesWho(base, e.who)) continue;
      if (e.op === 'add') adds[e.stat] = (adds[e.stat] || 0) + e.v;
      else muls[e.stat] = (muls[e.stat] || 1) * e.v;
    }
  }
  const apply = (stat, get, set) => {
    const cur = get();
    if (cur === undefined) return;
    if ((stat === 'atk.melee' || stat === 'atk.pierce') && !(cur > 0)) return;
    set((cur + (adds[stat] || 0)) * (muls[stat] || 1));
  };
  apply('hp', () => s.hp, (v) => { s.hp = v; });
  apply('speed', () => s.speed, (v) => { s.speed = v; });
  apply('los', () => s.los, (v) => { s.los = v; });
  apply('range', () => s.range, (v) => { s.range = v; });
  apply('atk.melee', () => s.atk.melee, (v) => { s.atk.melee = v; });
  apply('atk.pierce', () => s.atk.pierce, (v) => { s.atk.pierce = v; });
  apply('armor.melee', () => s.armor.melee, (v) => { s.armor.melee = v; });
  apply('armor.pierce', () => s.armor.pierce, (v) => { s.armor.pierce = v; });
  apply('time', () => s.time, (v) => { s.time = v; });
  apply('carry', () => s.carry, (v) => { s.carry = v; });
  if (s.heal) {
    apply('heal.amount', () => s.heal.amount, (v) => { s.heal.amount = v; });
    apply('heal.range', () => s.heal.range, (v) => { s.heal.range = v; });
    apply('heal.every', () => s.heal.every, (v) => { s.heal.every = v; });
  }
  for (const k of Object.keys(s.gather)) apply('gather.' + k, () => s.gather[k], (v) => { s.gather[k] = v; });
  for (const k of Object.keys(adds)) if (k.startsWith('bonus.')) s.bonus[k.slice(6)] = (s.bonus[k.slice(6)] || 0) + adds[k];
  for (const r of RESOURCES) apply('cost.' + r, () => s.cost[r], (v) => { s.cost[r] = Math.round(v); });
  return s;
}

/** Or obtenu (vente) ou à payer (achat) pour un lot, selon le prix relatif et la commission. */
export function tradeQuote(price, fee, sell) {
  return sell ? Math.floor(TRADE_LOT * price * (1 - fee)) : Math.ceil(TRADE_LOT * price * (1 + fee));
}

/** Commission du marché selon les technologies acquises (ensemble ou liste d'identifiants). */
export function tradeFee(techs) {
  let fee = TRADE_FEE;
  for (const id of techs || []) if (TECHS[id] && TECHS[id].trade !== undefined) fee = Math.min(fee, TECHS[id].trade);
  return fee;
}

/** Tout ce que la civilisation peut former dans un bâtiment donné (héros et unités spéciales : seulement ceux que le joueur a choisis). */
export function trainableAt(buildingId, civ, chosen) {
  const b = BUILDINGS[buildingId];
  if (!b) return [];
  return b.trains.filter((id) => unitForCiv(id, civ) && (!UNITS[id].choice || !chosen || chosen.has(id)));
}

/** Technologies proposées par un bâtiment pour une civilisation. */
export function techsAt(buildingId, civ) {
  return TECH_IDS.filter((id) => TECHS[id].building === buildingId && techForCiv(id, civ));
}

export function costText(c) {
  const parts = [];
  if (c.food) parts.push(`${c.food} nourriture`);
  if (c.wood) parts.push(`${c.wood} bois`);
  if (c.gold) parts.push(`${c.gold} or`);
  if (c.stone) parts.push(`${c.stone} pierre`);
  return parts.join(', ');
}
