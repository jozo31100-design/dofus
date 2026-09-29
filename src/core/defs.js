// Données du jeu : tout est déclaratif. Le moteur (sim.js) ne connaît aucun nom d'unité :
// il lit ces tables. Pour équilibrer ou ajouter du contenu, on ne touche qu'à ce fichier.

export const TICK_RATE = 20; // pas de simulation par seconde de jeu
export const DT = 1 / TICK_RATE;
export const MAP_SIZE = 96; // la carte est un carré de 96 x 96 cases
export const MAX_POP = 150;

export const RESOURCES = ['food', 'wood', 'gold', 'stone'];
export const RES_LABEL = { food: 'Nourriture', wood: 'Bois', gold: 'Or', stone: 'Pierre' };

export const TEAM_COLORS = [
  { name: 'Bleu', main: '#3b72e8', dark: '#1c3f9a', light: '#adc8ff' },
  { name: 'Rouge', main: '#dc4538', dark: '#8a1f19', light: '#ffb3a9' },
];

export const AGE_NAMES = ['', 'Âge du Village', 'Âge du Bourg', 'Âge de la Forteresse'];
export const AGE_SHORT = ['', 'I', 'II', 'III'];

// Vitesse de récolte de base (par seconde et par villageois), avant technologies.
export const GATHER_BASE = { wood: 0.55, berries: 0.65, farm: 0.45, meat: 1.0, gold: 0.5, stone: 0.5 };
export const CARRY_BASE = 10;
export const BUILD_EXPONENT = 0.7; // n bâtisseurs => n^0.7 fois plus vite
export const FARM_RESEED_COST = 60; // bois pour semer de nouveau une ferme épuisée
export const FARM_MAX_WORKERS = 3;

export const START_RESOURCES = {
  standard: { food: 200, wood: 200, gold: 100, stone: 100, label: 'Standard' },
  riche: { food: 800, wood: 800, gold: 500, stone: 300, label: 'Abondantes' },
};

// ---------------------------------------------------------------------------
// Aides
// ---------------------------------------------------------------------------

const cost = (o) => ({ food: 0, wood: 0, gold: 0, stone: 0, ...o });

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
    cost: cost(u.cost || {}),
  };
}

function finishBuilding(b) {
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
    cost: cost(b.cost || {}),
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
    bonus: { building: 80 }, tags: ['siege', 'melee', 'ram'], onlyTargets: ['building'],
    desc: 'Détruit les bâtiments à toute vitesse. Insensible aux flèches, sans défense face aux épéistes.',
  },
  {
    id: 'catapult', name: 'Catapulte', age: 3, from: 'siege', cost: { wood: 180, gold: 120 }, time: 45,
    hp: 110, speed: 0.75, los: 8, radius: 0.5, atk: { pierce: 35 }, range: 9, minRange: 3, rof: 6, splash: 1.4,
    armor: { melee: 0, pierce: 5 }, bonus: { building: 55 }, tags: ['siege', 'ranged', 'catapult'],
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
  { id: 'gold', name: "Filon d'or", cls: 'node', res: 'gold', kind: 'gold', amount: 800, size: 1 },
  { id: 'stone', name: 'Carrière de pierre', cls: 'node', res: 'stone', kind: 'stone', amount: 400, size: 1 },
  { id: 'carcass', name: 'Carcasse', cls: 'node', res: 'food', kind: 'meat', amount: 100, size: 0 },
];

// ---------------------------------------------------------------------------
// Bâtiments
// ---------------------------------------------------------------------------

const BUILDING_LIST = [
  {
    id: 'hall', names: { franks: 'Grande Salle', gauls: 'Oppidum' }, page: 'eco', size: 4, hp: 2400,
    armor: { melee: 3, pierce: 10 }, cost: { wood: 275, stone: 100 }, time: 100, age: 2, los: 10, pop: 10,
    drop: ['food', 'wood', 'gold', 'stone'], trains: ['villager'],
    atk: { pierce: 6 }, range: 7, rof: 2, arrows: 1, projectile: 'arrow', projSpeed: 14, garrison: 15,
    desc: 'Cœur de votre peuple : forme les villageois, reçoit toutes les ressources, fait progresser les âges.',
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
    trains: ['militia', 'spearman', 'swordsman', 'champion'],
    desc: 'Forme les fantassins : miliciens, lanciers, épéistes et champions.',
  },
  {
    id: 'archery', names: { franks: 'Champ de tir', gauls: 'Champ de tir' }, page: 'mil', size: 3, hp: 1200,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 175 }, time: 40, age: 2, los: 7, trains: ['archer', 'crossbow'],
    desc: 'Forme les archers et les arbalétriers.',
  },
  {
    id: 'stable', names: { franks: 'Écurie', gauls: 'Enclos à chevaux' }, page: 'mil', size: 3, hp: 1200,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 175 }, time: 40, age: 2, los: 7, trains: ['scout', 'cavalry', 'knight'],
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
    atk: { pierce: 6 }, range: 8, rof: 2, arrows: 1, projectile: 'arrow', projSpeed: 15, garrison: 5,
    desc: 'Tour de défense : tire des flèches sur les ennemis proches. Chaque soldat à l\'intérieur ajoute une flèche.',
  },
  {
    id: 'temple', names: { franks: 'Chapelle', gauls: 'Nemeton' }, page: 'mil', size: 3, hp: 1000,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 120, stone: 100 }, time: 45, age: 2, los: 7, trains: ['healer'],
    desc: 'Lieu sacré : forme les guérisseurs qui soignent vos soldats.',
  },
  {
    id: 'siege', names: { franks: 'Atelier de siège', gauls: 'Atelier de siège' }, page: 'mil', size: 4, hp: 1600,
    armor: { melee: 3, pierce: 9 }, cost: { wood: 200 }, time: 50, age: 3, los: 7, trains: ['ram', 'catapult'],
    desc: 'Fabrique les béliers et les catapultes pour abattre les murs ennemis.',
  },
  {
    id: 'castle', names: { franks: 'Château', gauls: 'Citadelle' }, page: 'mil', size: 5, hp: 3600,
    armor: { melee: 8, pierce: 12 }, cost: { stone: 400 }, time: 110, age: 3, los: 11,
    trains: ['francisque', 'gesate'], atk: { pierce: 10 }, range: 9, rof: 1.8, arrows: 3, projectile: 'arrow', projSpeed: 16,
    garrison: 20,
    desc: 'Forteresse imprenable : forme votre guerrier unique, tire une volée de flèches et abrite 20 soldats.',
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
    desc: 'Débloque le champ de tir, l\'écurie, la forge, la tour, le temple et de nouvelles unités.',
  },
  {
    id: 'age3', name: 'Âge de la Forteresse', building: 'hall', age: 2, ageUp: 3, cost: { food: 700, gold: 250 }, time: 65,
    requires: { count: 2, among: ['archery', 'stable', 'forge', 'tower', 'temple'], label: '2 bâtiments : champ de tir, écurie, forge, tour ou temple' },
    desc: 'Débloque le château, l\'atelier de siège, les champions, les chevaliers et les arbalétriers.',
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
export const CIV_IDS = Object.keys(CIVS);

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export const UNITS = {};
for (const u of UNIT_LIST) UNITS[u.id] = finishUnit(u);
export const ANIMALS = {};
for (const a of ANIMAL_LIST) ANIMALS[a.id] = { atk: { melee: 0, pierce: 0 }, armor: { melee: 0, pierce: 0 }, ...a };
export const NODES = {};
for (const n of NODE_LIST) NODES[n.id] = { tags: ['node'], ...n };
export const BUILDINGS = {};
for (const b of BUILDING_LIST) BUILDINGS[b.id] = finishBuilding(b);
export const TECHS = {};
for (const t of TECH_LIST) TECHS[t.id] = { effects: [], ...t, cost: cost(t.cost) };

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
  if (d.names && civ && d.names[civ]) return d.names[civ];
  return d.name || (d.names && Object.values(d.names)[0]) || id;
}

/** Une unité est-elle disponible pour cette civilisation ? */
export function unitForCiv(id, civ) {
  const u = UNITS[id];
  return !!u && (!u.civ || u.civ === civ);
}

/** Une technologie est-elle disponible pour cette civilisation ? */
export function techForCiv(id, civ) {
  const t = TECHS[id];
  return !!t && (!t.civ || t.civ === civ);
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
    carry: base.worker ? CARRY_BASE : 0,
    arrows: base.arrows || 0,
    gather: { wood: 1, berries: 1, farm: 1, meat: 1, gold: 1, stone: 1 },
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
  for (const k of Object.keys(s.gather)) apply('gather.' + k, () => s.gather[k], (v) => { s.gather[k] = v; });
  for (const r of RESOURCES) apply('cost.' + r, () => s.cost[r], (v) => { s.cost[r] = Math.round(v); });
  return s;
}

/** Tout ce que la civilisation peut former dans un bâtiment donné. */
export function trainableAt(buildingId, civ) {
  const b = BUILDINGS[buildingId];
  if (!b) return [];
  return b.trains.filter((id) => unitForCiv(id, civ));
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
