// Sparte : hoplites et phalange. Module de données pur (aucun import) : voir docs/CIVS.md pour le contrat.
export default {
  id: 'sparta',
  name: 'Spartiates',
  tagline: 'Hoplites invincibles et phalange de bronze.',
  story: 'La cité-État guerrière de Laconie : enfants soldats élevés à l\'agogè, boucliers de bronze alignés en phalange, et des hilotes qui travaillent la terre.',
  bonuses: [
    'Fantassins : +20 % de points de vie',
    'Caserne : fantassins formés 15 % plus vite',
    'Camp minier : pierre +15 %',
    'Cavalerie : +20 % de coût en nourriture',
  ],
  uniqueUnit: 'sp_lochage',
  uniqueTech: 'sp_agoge',
  art: 'franks',
  color: '#b8322a',
  effects: [
    { who: { tags: ['infantry'] }, stat: 'hp', op: 'mul', v: 1.2 },
    { who: { from: 'barracks' }, stat: 'time', op: 'mul', v: 0.85 },
    { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.15 },
    { who: { tags: ['cavalry'] }, stat: 'cost.food', op: 'mul', v: 1.2 },
  ],
  names: {
    hall: 'Mégaron', house: 'Oikos', barracks: 'Syssition', archery: 'Champ des archers', stable: 'Haras', forge: 'Forge de Héphaïstos',
    temple: 'Temple d\'Arès', castle: 'Acropole', market: 'Agora', academy: 'Gérousia', wonder: 'Sanctuaire d\'Apollon à Amyclées',
    dock: 'Port de Gythion', healer: 'Prêtre d\'Asclépios', warship: 'Trière',
    villager: 'Hilote', militia: 'Péltaste', spearman: 'Hoplite', swordsman: 'Xiphophore', champion: 'Spartiate', archer: 'Archer crétois',
    crossbow: 'Gastraphète', scout: 'Éclaireur périèque', cavalry: 'Cavalier thessalien', knight: 'Cavalier lourd', fishingboat: 'Barque de Laconie',
  },
  units: [
    // --- Unité unique (Acropole, âge III) ---
    {
      id: 'sp_lochage', name: 'Lochage', age: 3, from: 'castle', cost: { food: 60, gold: 50 }, time: 27,
      hp: 90, speed: 1.35, los: 6, radius: 0.31, atk: { melee: 11 }, rof: 1.6, armor: { melee: 3, pierce: 3 }, bonus: { cavalry: 4 },
      tags: ['infantry', 'melee', 'spear', 'unique'],
      desc: 'Officier d\'élite de la phalange, formé dès l\'enfance à l\'agogè. Hoplite lourd, très solide.',
    },
    // --- Héros (un choix de deux par âge) ---
    {
      id: 'sp_brasidas', name: 'Brasidas', age: 2, from: 'hall', cost: { food: 200, gold: 150 }, time: 45, limit: 1, choice: true,
      hp: 250, speed: 2.0, los: 8, radius: 0.33, atk: { melee: 13 }, rof: 1.6, armor: { melee: 3, pierce: 4 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'speed', v: 0.1, r: 6 },
      desc: 'Stratège audacieux vainqueur à Amphipolis. +10 % de vitesse aux alliés proches.',
    },
    {
      id: 'sp_gorgo', name: 'Gorgo', age: 2, from: 'hall', cost: { food: 150, gold: 180 }, time: 45, limit: 1, choice: true,
      hp: 160, speed: 1.3, los: 7, radius: 0.27, atk: {}, rof: 2, armor: { melee: 1, pierce: 1 },
      heal: { amount: 4, every: 2, range: 5 }, tags: ['healer', 'hero'], aura: { kind: 'heal', v: 1.2, r: 6 },
      desc: 'Reine de Sparte, fille et épouse de rois. Soigne les soldats et régénère les alliés proches.',
    },
    {
      id: 'sp_leonidas', name: 'Léonidas', age: 3, from: 'hall', cost: { food: 250, gold: 350 }, time: 60, limit: 1, choice: true,
      hp: 330, speed: 1.6, los: 7, radius: 0.35, atk: { melee: 15 }, rof: 1.6, armor: { melee: 6, pierce: 7 }, bonus: { cavalry: 4 },
      tags: ['infantry', 'melee', 'hero', 'unique'], aura: { kind: 'armor', v: 1.5, r: 6 },
      desc: 'Le roi des Trois Cents, héros des Thermopyles. Très résistant ; +1,5 d\'armure aux alliés proches.',
    },
    {
      id: 'sp_lysandre', name: 'Lysandre', age: 3, from: 'hall', cost: { food: 250, gold: 300 }, time: 55, limit: 1, choice: true,
      hp: 270, speed: 1.9, los: 9, radius: 0.33, atk: { melee: 13 }, rof: 1.5, armor: { melee: 4, pierce: 5 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'gather', v: 0.15, r: 9 },
      desc: 'Amiral vainqueur d\'Aigos Potamos, riche de l\'or perse. Les villageois proches récoltent 15 % plus vite.',
    },
    {
      id: 'sp_agesilas', name: 'Agésilas', age: 4, from: 'hall', cost: { food: 320, gold: 420 }, time: 65, limit: 1, choice: true,
      hp: 390, speed: 1.7, los: 9, radius: 0.36, atk: { melee: 18 }, rof: 1.6, armor: { melee: 7, pierce: 8 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.15, r: 10 },
      desc: 'Le roi boiteux qui tint l\'Asie et la Grèce. +15 % d\'attaque aux alliés, sur un très large rayon.',
    },
    {
      id: 'sp_pausanias', name: 'Pausanias', age: 4, from: 'hall', cost: { food: 300, gold: 380 }, time: 60, limit: 1, choice: true,
      hp: 350, speed: 1.8, los: 8, radius: 0.36, atk: { melee: 17 }, rof: 1.5, armor: { melee: 8, pierce: 7 }, bonus: { cavalry: 6 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.2, r: 7 },
      desc: 'Régent vainqueur de Platées. +20 % d\'attaque aux alliés proches ; fauche la cavalerie.',
    },
    // --- Unités spéciales (un choix de deux par âge) ---
    {
      id: 'sp_lacedemonien', name: 'Hoplite lacédémonien', age: 2, from: 'barracks', cost: { food: 70, gold: 35 }, time: 22, choice: true,
      hp: 90, speed: 1.3, los: 6, radius: 0.3, atk: { melee: 9 }, rof: 1.8, armor: { melee: 3, pierce: 3 }, bonus: { cavalry: 4 },
      tags: ['infantry', 'melee', 'spear', 'special'],
      desc: 'Hoplite en armure de bronze, hoplon au bras : solide au corps à corps comme sous les flèches.',
    },
    {
      id: 'sp_skirite', name: 'Skiritès', age: 2, from: 'archery', cost: { food: 40, wood: 30 }, time: 18, choice: true,
      hp: 50, speed: 1.75, los: 8, radius: 0.26, atk: { pierce: 7 }, range: 4, rof: 1.8, armor: { melee: 1, pierce: 1 },
      tags: ['infantry', 'ranged', 'special'], projectile: 'axe', projSpeed: 12,
      desc: 'Éclaireur montagnard de Laconie : rapide, lance le javelot de près.',
    },
    {
      id: 'sp_hilote', name: 'Hilote armé', age: 3, from: 'barracks', cost: { food: 40, wood: 10 }, time: 14, choice: true,
      hp: 55, speed: 1.5, los: 6, radius: 0.27, atk: { melee: 6 }, rof: 1.7, armor: { melee: 0, pierce: 1 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Serf emmené à la guerre : bon marché, formé vite, nombreux.',
    },
    {
      id: 'sp_hippeus', name: 'Hippeus', age: 3, from: 'stable', cost: { food: 70, gold: 70 }, time: 26, choice: true,
      hp: 90, speed: 2.3, los: 7, radius: 0.34, atk: { melee: 10 }, rof: 1.8, armor: { melee: 2, pierce: 3 }, bonus: { archer: 4 },
      tags: ['cavalry', 'melee', 'special'],
      desc: 'Garde à cheval des rois de Sparte : rapide, il poursuit les tireurs.',
    },
    {
      id: 'sp_homoios', name: 'Homoios', age: 4, from: 'barracks', cost: { food: 85, gold: 100 }, time: 30, choice: true,
      hp: 140, speed: 1.4, los: 7, radius: 0.33, atk: { melee: 17 }, rof: 1.6, armor: { melee: 5, pierce: 6 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Spartiate de plein droit, « égal » parmi ses pairs : le meilleur fantassin de la Grèce.',
    },
    {
      id: 'sp_oxybele', name: 'Oxybèle', age: 4, from: 'siege', cost: { wood: 150, gold: 100 }, time: 40, choice: true,
      hp: 120, speed: 0.9, los: 8, radius: 0.5, atk: { pierce: 22 }, range: 9, minRange: 2, rof: 4, armor: { melee: 0, pierce: 4 }, bonus: { infantry: 4 },
      tags: ['siege', 'ranged', 'special'], projectile: 'bolt', projSpeed: 18,
      desc: 'Baliste à carreaux grecque : transperce les fantassins à longue portée.',
    },
  ],
  techs: [
    {
      id: 'sp_agoge', name: 'Agogè', building: 'castle', age: 3, cost: { food: 250, gold: 200 }, time: 55,
      effects: [
        { who: { ids: ['sp_lochage'] }, stat: 'atk.melee', op: 'add', v: 3 },
        { who: { ids: ['sp_lochage'] }, stat: 'armor.melee', op: 'add', v: 2 },
      ],
      desc: 'Lochages : +3 d\'attaque et +2 d\'armure de mêlée.',
    },
    {
      id: 'sp2a', choice: true, age: 2, name: 'Dîme des hilotes',
      effects: [
        { who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.2 },
        { who: { ids: ['villager'] }, stat: 'gather.berries', op: 'mul', v: 1.15 },
      ],
      desc: 'Les hilotes travaillent la terre pour les citoyens : fermes +20 %, cueillette +15 %.',
    },
    {
      id: 'sp2b', choice: true, age: 2, name: 'Éducation de l\'agogè',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 1 },
        { who: { tags: ['infantry'] }, stat: 'cost.food', op: 'mul', v: 0.9 },
      ],
      desc: 'Fantassins : +1 d\'attaque et 10 % moins chers en nourriture.',
    },
    {
      id: 'sp3a', choice: true, age: 3, name: 'Panoplie de bronze',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'armor.melee', op: 'add', v: 1 },
        { who: { tags: ['infantry'] }, stat: 'armor.pierce', op: 'add', v: 2 },
      ],
      desc: 'Cuirasses, jambières et boucliers épais : fantassins +1 d\'armure de mêlée, +2 contre les tirs.',
    },
    {
      id: 'sp3b', choice: true, age: 3, name: 'Mines du Taygète',
      effects: [
        { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.2 },
        { who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.15 },
        { who: { ids: ['villager'] }, stat: 'carry', op: 'add', v: 5 },
      ],
      desc: 'Pierre +20 %, or +15 % ; les villageois portent 5 ressources de plus.',
    },
    {
      id: 'sp4a', choice: true, age: 4, name: 'Gloire des Trois Cents',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'hp', op: 'mul', v: 1.1 },
        { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 2 },
      ],
      desc: 'Fantassins : +10 % de points de vie et +2 d\'attaque de mêlée.',
    },
    {
      id: 'sp4b', choice: true, age: 4, name: 'Hégémonie sur la Grèce',
      effects: [
        { who: { ids: ['villager'] }, stat: 'gather.wood', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.berries', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.meat', op: 'mul', v: 1.12 },
        { who: { from: 'barracks' }, stat: 'time', op: 'mul', v: 0.9 },
      ],
      desc: 'Les hilotes récoltent tout 12 % plus vite ; fantassins formés 10 % plus vite.',
    },
  ],
  choices: {
    2: { hero: ['sp_brasidas', 'sp_gorgo'], unit: ['sp_lacedemonien', 'sp_skirite'], bonus: ['sp2a', 'sp2b'] },
    3: { hero: ['sp_leonidas', 'sp_lysandre'], unit: ['sp_hilote', 'sp_hippeus'], bonus: ['sp3a', 'sp3b'] },
    4: { hero: ['sp_agesilas', 'sp_pausanias'], unit: ['sp_homoios', 'sp_oxybele'], bonus: ['sp4a', 'sp4b'] },
  },
};
