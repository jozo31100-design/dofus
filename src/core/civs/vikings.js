// Vikings : drakkars et raids. Module de données pur (aucun import) : voir docs/CIVS.md pour le contrat.
export default {
  id: 'vikings',
  name: 'Vikings',
  tagline: 'Maîtres des mers et berserkers.',
  story: 'Navigateurs de Scandinavie, marins, marchands et pillards : leurs drakkars remontent les fleuves et leurs berserkers frappent sans reculer.',
  bonuses: [
    'Pêche : +25 %, bateaux : +20 % de points de vie',
    'Fantassins : +1 d\'attaque',
    'Tours et murs de bois : −20 % de bois',
    'Cavalerie : −15 % de points de vie',
  ],
  uniqueUnit: 'vk_housecarl',
  uniqueTech: 'vk_axe',
  art: 'gauls',
  color: '#3f6fa0',
  effects: [
    { who: { tags: ['fisher'] }, stat: 'gather.fish', op: 'mul', v: 1.25 },
    { who: { ids: ['fishingboat', 'warship'] }, stat: 'hp', op: 'mul', v: 1.2 },
    { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 1 },
    { who: { ids: ['palisade', 'palisade_gate', 'outpost'] }, stat: 'cost.wood', op: 'mul', v: 0.8 },
    { who: { tags: ['cavalry'] }, stat: 'hp', op: 'mul', v: 0.85 },
    { who: { ids: ['vk_siegeship'] }, stat: 'hp', op: 'mul', v: 1.2 },
  ],
  names: {
    hall: 'Grande halle', house: 'Maison longue', barracks: 'Salle des guerriers', archery: 'Champ de tir', stable: 'Enclos à chevaux', forge: 'Forge du nain',
    temple: 'Temple d\'Odin', castle: 'Forteresse circulaire', market: 'Comptoir', academy: 'Skaldsal', wonder: 'Temple d\'Uppsala',
    dock: 'Port', healer: 'Völva', warship: 'Drakkar',
    militia: 'Bondi', swordsman: 'Vikingr', champion: 'Hirdmann', fishingboat: 'Barque de pêche', vk_axe: 'Hache danoise',
  },
  units: [
    // --- Unité unique (château, âge III) ---
    {
      id: 'vk_housecarl', name: 'Housecarl', age: 3, from: 'castle', cost: { food: 65, gold: 60 }, time: 28,
      hp: 80, speed: 1.4, los: 6, radius: 0.31, atk: { melee: 13 }, rof: 1.6, armor: { melee: 3, pierce: 3 }, bonus: { building: 5 },
      tags: ['infantry', 'melee', 'unique'],
      desc: 'Garde d\'élite au service du roi, cotte de mailles et grande hache danoise. Fantassin lourd qui fend aussi les portes.',
    },
    // --- Héros (un choix de deux par âge) ---
    {
      id: 'vk_ragnar', name: 'Ragnar Lothbrok', age: 2, from: 'hall', cost: { food: 200, gold: 150 }, time: 45, limit: 1, choice: true,
      hp: 250, speed: 1.9, los: 7, radius: 0.33, atk: { melee: 14 }, rof: 1.5, armor: { melee: 3, pierce: 4 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.1, r: 6 },
      desc: 'Le légendaire « Braies-velues », pilleur de Paris. +10 % d\'attaque aux alliés proches.',
    },
    {
      id: 'vk_lagertha', name: 'Lagertha', age: 2, from: 'hall', cost: { food: 180, gold: 160 }, time: 45, limit: 1, choice: true,
      hp: 210, speed: 2.2, los: 8, radius: 0.3, atk: { melee: 12 }, rof: 1.4, armor: { melee: 3, pierce: 3 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'speed', v: 0.1, r: 6 },
      desc: 'Skjaldmö intrépide, rapide et précise. +10 % de vitesse aux alliés proches.',
    },
    {
      id: 'vk_ivar', name: 'Ivar sans-os', age: 3, from: 'hall', cost: { food: 230, gold: 320 }, time: 55, limit: 1, choice: true,
      hp: 270, speed: 1.6, los: 9, radius: 0.32, atk: { pierce: 12 }, range: 5, rof: 1.6, armor: { melee: 3, pierce: 5 },
      tags: ['infantry', 'ranged', 'hero'], projectile: 'arrow', projSpeed: 15, aura: { kind: 'atk', v: 0.12, r: 7 },
      desc: 'Stratège cruel, porté sur son bouclier, archer hors pair. +12 % d\'attaque aux alliés proches.',
    },
    {
      id: 'vk_bjorn', name: 'Bjorn Côtes-de-fer', age: 3, from: 'hall', cost: { food: 250, gold: 300 }, time: 55, limit: 1, choice: true,
      hp: 350, speed: 1.6, los: 7, radius: 0.35, atk: { melee: 14 }, rof: 1.6, armor: { melee: 6, pierce: 7 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'armor', v: 1.5, r: 6 },
      desc: 'Fils de Ragnar, pilleur de la Méditerranée, presque invulnérable. +1,5 d\'armure aux alliés proches.',
    },
    {
      id: 'vk_harald', name: 'Harald Hardrada', age: 4, from: 'hall', cost: { food: 320, gold: 420 }, time: 65, limit: 1, choice: true,
      hp: 400, speed: 1.8, los: 8, radius: 0.37, atk: { melee: 19 }, rof: 1.5, armor: { melee: 7, pierce: 7 }, bonus: { building: 6 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.2, r: 7 },
      desc: 'Le dernier grand roi viking, « Dur-conseil ». +20 % d\'attaque aux alliés proches.',
    },
    {
      id: 'vk_erik', name: 'Erik le Rouge', age: 4, from: 'hall', cost: { food: 300, gold: 380 }, time: 60, limit: 1, choice: true,
      hp: 310, speed: 2.1, los: 10, radius: 0.34, atk: { melee: 14 }, rof: 1.5, armor: { melee: 4, pierce: 5 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'gather', v: 0.15, r: 9 },
      desc: 'Explorateur du Groenland. Les villageois proches récoltent 15 % plus vite.',
    },
    // --- Unités spéciales (un choix de deux par âge) ---
    {
      id: 'vk_berserker', name: 'Berserker', age: 2, from: 'barracks', cost: { food: 55, gold: 25 }, time: 22, choice: true,
      hp: 52, speed: 1.8, los: 6, radius: 0.29, atk: { melee: 12 }, rof: 1.5, armor: { melee: 0, pierce: 0 }, bonus: { archer: 4 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Guerrier en transe, rapide et sans armure. Frappe très fort, tombe vite.',
    },
    {
      id: 'vk_skjaldmo', name: 'Archer skjaldmö', age: 2, from: 'archery', cost: { wood: 35, gold: 40 }, time: 20, choice: true,
      hp: 42, speed: 1.35, los: 7, radius: 0.27, atk: { pierce: 5 }, range: 5, rof: 1.9, armor: { melee: 1, pierce: 3 },
      tags: ['archer', 'ranged', 'special'], projectile: 'arrow', projSpeed: 14,
      desc: 'Tireuse abritée derrière son bouclier rond : bien protégée contre les flèches.',
    },
    {
      id: 'vk_ulfhednar', name: 'Ulfhednar', age: 3, from: 'barracks', cost: { food: 70, gold: 60 }, time: 26, choice: true,
      hp: 85, speed: 1.7, los: 6, radius: 0.31, atk: { melee: 13 }, rof: 1.5, armor: { melee: 2, pierce: 3 }, bonus: { cavalry: 5 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Guerrier-loup couvert d\'une peau de bête : rapide, solide, fauche les cavaliers.',
    },
    {
      id: 'vk_skald', name: 'Skald', age: 3, from: 'temple', cost: { food: 50, gold: 70 }, time: 26, choice: true,
      hp: 45, speed: 1.3, los: 6, radius: 0.26, atk: {}, rof: 2, armor: { melee: 0, pierce: 0 },
      tags: ['support', 'special'], aura: { kind: 'atk', v: 0.08, r: 6 },
      desc: 'Poète guerrier dont les sagas exaltent le courage : +8 % d\'attaque aux alliés proches (non cumulable).',
    },
    {
      id: 'vk_varangian', name: 'Varègue', age: 4, from: 'barracks', cost: { food: 80, gold: 95 }, time: 30, choice: true,
      hp: 125, speed: 1.45, los: 7, radius: 0.33, atk: { melee: 17 }, rof: 1.6, armor: { melee: 5, pierce: 5 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Garde varègue de l\'empereur de Byzance : le meilleur fantassin lourd des peuples du Nord.',
    },
    {
      id: 'vk_siegeship', name: 'Drakkar-catapulte', age: 4, from: 'dock', cost: { wood: 200, gold: 140 }, time: 42, naval: true, choice: true,
      hp: 170, speed: 1.3, los: 8, radius: 0.55, atk: { pierce: 24 }, range: 10, minRange: 3, rof: 5, splash: 1.2, armor: { melee: 1, pierce: 4 }, bonus: { building: 45, ship: 4 },
      tags: ['ship', 'ranged', 'special'], projectile: 'stone', projSpeed: 9,
      desc: 'Long navire portant une catapulte à la proue : bombarde les rivages et les flottes de loin.',
    },
  ],
  techs: [
    { // technologie unique du château
      id: 'vk_axe', building: 'castle', age: 3, cost: { food: 250, gold: 200 }, time: 55,
      effects: [
        { who: { ids: ['vk_housecarl'] }, stat: 'atk.melee', op: 'add', v: 3 },
        { who: { ids: ['vk_housecarl'] }, stat: 'armor.pierce', op: 'add', v: 1 },
      ],
      desc: 'Housecarls : +3 d\'attaque et +1 d\'armure contre les tirs.',
    },
    {
      id: 'vk2a', choice: true, age: 2, name: 'Routes de l\'ambre',
      effects: [{ who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.2 }, { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.1 }],
      desc: 'Les mineurs récoltent 20 % d\'or et 10 % de pierre en plus : le commerce nordique enrichit les jarls.',
    },
    {
      id: 'vk2b', choice: true, age: 2, name: 'Frères de sang',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'hp', op: 'mul', v: 1.1 },
        { who: { tags: ['infantry'] }, stat: 'speed', op: 'add', v: 0.1 },
      ],
      desc: 'Fantassins : +10 % de points de vie et plus rapides, liés par serment.',
    },
    {
      id: 'vk3a', choice: true, age: 3, name: 'Forges du Nord',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 1 },
        { who: { tags: ['infantry'] }, stat: 'armor.melee', op: 'add', v: 1 },
        { who: { tags: ['infantry'] }, stat: 'armor.pierce', op: 'add', v: 1 },
      ],
      desc: 'Fantassins : +1 d\'attaque et +1 d\'armure (mêlée et tir).',
    },
    {
      id: 'vk3b', choice: true, age: 3, name: 'Grands drakkars',
      effects: [
        { who: { tags: ['ship'] }, stat: 'hp', op: 'mul', v: 1.2 },
        { who: { tags: ['ship'] }, stat: 'speed', op: 'add', v: 0.2 },
        { who: { ids: ['warship'] }, stat: 'atk.pierce', op: 'add', v: 2 },
      ],
      desc: 'Navires : +20 % de points de vie, plus rapides ; drakkars : +2 d\'attaque.',
    },
    {
      id: 'vk4a', choice: true, age: 4, name: 'Loi du Thing',
      effects: [
        { who: { ids: ['villager'] }, stat: 'gather.wood', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.berries', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.meat', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'carry', op: 'add', v: 5 },
      ],
      desc: 'Les villageois récoltent tout 12 % plus vite et portent 5 ressources de plus.',
    },
    {
      id: 'vk4b', choice: true, age: 4, name: 'Appel du Valhalla',
      effects: [
        { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 2 },
        { who: { tags: ['infantry'] }, stat: 'hp', op: 'mul', v: 1.1 },
        { who: { tags: ['archer', 'cavalry'] }, stat: 'atk.pierce', op: 'add', v: 1 },
      ],
      desc: 'Fantassins : +2 d\'attaque et +10 % de points de vie ; archers et cavaliers : +1 d\'attaque.',
    },
  ],
  choices: {
    2: { hero: ['vk_ragnar', 'vk_lagertha'], unit: ['vk_berserker', 'vk_skjaldmo'], bonus: ['vk2a', 'vk2b'] },
    3: { hero: ['vk_ivar', 'vk_bjorn'], unit: ['vk_ulfhednar', 'vk_skald'], bonus: ['vk3a', 'vk3b'] },
    4: { hero: ['vk_harald', 'vk_erik'], unit: ['vk_varangian', 'vk_siegeship'], bonus: ['vk4a', 'vk4b'] },
  },
};
