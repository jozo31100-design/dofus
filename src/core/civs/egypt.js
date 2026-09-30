// Égypte : pharaons, chars et monuments. Module de données pur (aucun import) : voir docs/CIVS.md pour le contrat.
export default {
  id: 'egypt',
  name: 'Égyptiens',
  tagline: 'Archers, chars et monuments éternels.',
  story: 'Le royaume du Nil : des crues fertiles, des archers innombrables, des chars de guerre et des pharaons qui bâtissent pour l\'éternité.',
  bonuses: [
    'Fermes : récolte +20 % (crue du Nil)',
    'Archers : +15 % de points de vie',
    'Mines d\'or : +10 %',
    'Bâtiments de pierre : +10 % de points de vie',
  ],
  uniqueUnit: 'eg_char_royal',
  uniqueTech: 'eg_arcs_composites',
  art: 'franks',
  color: '#d6a531',
  effects: [
    { who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.2 },
    { who: { tags: ['archer'] }, stat: 'hp', op: 'mul', v: 1.15 },
    { who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.1 },
    { who: { tags: ['stone'] }, stat: 'hp', op: 'mul', v: 1.1 },
  ],
  names: {
    hall: 'Palais du nomarque', house: 'Maison de briques', barracks: 'Caserne du pharaon', archery: 'Champ des archers', stable: 'Écurie des chars',
    forge: 'Forge de Ptah', temple: 'Temple d\'Amon', castle: 'Forteresse', market: 'Bazar', academy: 'Maison de vie', wonder: 'Grande pyramide de Gizeh',
    dock: 'Port du Nil', healer: 'Prêtre', warship: 'Navire de guerre', fishingboat: 'Barque de papyrus',
    villager: 'Fellah', militia: 'Milicien', swordsman: 'Guerrier au khopesh', champion: 'Garde du pharaon',
    archer: 'Archer nubien', crossbow: 'Archer composite', scout: 'Coureur du désert', cavalry: 'Char léger', knight: 'Char lourd',
  },
  units: [
    // ---- unité unique (château, âge III)
    {
      id: 'eg_char_royal', name: 'Char d\'archer royal', age: 3, from: 'castle', cost: { wood: 60, gold: 70 }, time: 28,
      hp: 100, speed: 2.5, los: 8, radius: 0.4, atk: { pierce: 8 }, range: 5, rof: 1.9, armor: { melee: 1, pierce: 3 },
      tags: ['cavalry', 'ranged', 'archer', 'unique'], projectile: 'arrow', projSpeed: 15,
      desc: 'Le char de guerre du pharaon : un archer et son conducteur qui criblent l\'ennemi en pleine course.',
    },
    // ---- héros (hall), deux par âge
    {
      id: 'eg_narmer', name: 'Narmer', age: 2, from: 'hall', cost: { food: 200, gold: 150 }, time: 45, limit: 1, choice: true,
      hp: 250, speed: 1.8, los: 7, radius: 0.33, atk: { melee: 13 }, rof: 1.6, armor: { melee: 3, pierce: 4 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'armor', v: 1.2, r: 6 },
      desc: 'Le roi qui unifia les Deux Terres. Massue blanche levée, il endurcit ses soldats : +1,2 d\'armure aux alliés proches.',
    },
    {
      id: 'eg_hatchepsout', name: 'Hatchepsout', age: 2, from: 'hall', cost: { food: 170, gold: 170 }, time: 45, limit: 1, choice: true,
      hp: 180, speed: 1.9, los: 8, radius: 0.29, atk: { pierce: 9 }, range: 5, rof: 1.7, armor: { melee: 2, pierce: 2 },
      tags: ['infantry', 'ranged', 'hero'], projectile: 'arrow', projSpeed: 14, aura: { kind: 'gather', v: 0.12, r: 8 },
      desc: 'La femme-pharaon, archère et bâtisseuse. Les villageois proches récoltent 12 % plus vite.',
    },
    {
      id: 'eg_thoutmosis', name: 'Thoutmosis III', age: 3, from: 'hall', cost: { food: 230, gold: 330 }, time: 55, limit: 1, choice: true,
      hp: 300, speed: 2.4, los: 9, radius: 0.4, atk: { pierce: 11 }, range: 5, rof: 1.7, armor: { melee: 4, pierce: 5 },
      tags: ['cavalry', 'ranged', 'hero'], projectile: 'arrow', projSpeed: 15, aura: { kind: 'atk', v: 0.15, r: 6 },
      desc: 'Le Napoléon égyptien, archer sur son char. +15 % d\'attaque aux alliés proches.',
    },
    {
      id: 'eg_nefertari', name: 'Néfertari', age: 3, from: 'hall', cost: { food: 150, gold: 200 }, time: 50, limit: 1, choice: true,
      hp: 160, speed: 1.3, los: 7, radius: 0.27, atk: {}, rof: 2, armor: { melee: 1, pierce: 1 },
      heal: { amount: 5, every: 2, range: 5 }, tags: ['healer', 'hero'], aura: { kind: 'heal', v: 1.5, r: 7 },
      desc: 'La grande épouse royale, « celle pour qui le soleil brille ». Soigne les soldats et régénère les alliés proches.',
    },
    {
      id: 'eg_ramses', name: 'Ramsès II', age: 4, from: 'hall', cost: { food: 320, gold: 420 }, time: 65, limit: 1, choice: true,
      hp: 390, speed: 1.8, los: 9, radius: 0.36, atk: { melee: 19 }, rof: 1.6, armor: { melee: 7, pierce: 7 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'atk', v: 0.2, r: 8 },
      desc: 'Ramsès le Grand, vainqueur de Qadesh, khopesh au poing. +20 % d\'attaque aux alliés proches.',
    },
    {
      id: 'eg_cleopatre', name: 'Cléopâtre', age: 4, from: 'hall', cost: { food: 280, gold: 400 }, time: 60, limit: 1, choice: true,
      hp: 280, speed: 2.0, los: 9, radius: 0.3, atk: { melee: 9 }, rof: 1.6, armor: { melee: 3, pierce: 4 },
      tags: ['infantry', 'melee', 'hero'], aura: { kind: 'gather', v: 0.18, r: 10 },
      desc: 'Dernière reine d\'Égypte, fine diplomate. Les villageois proches récoltent 18 % plus vite.',
    },
    // ---- unités spéciales, deux par âge
    {
      id: 'eg_medjay', name: 'Medjay', age: 2, from: 'barracks', cost: { food: 55, gold: 30 }, time: 20, choice: true,
      hp: 62, speed: 1.6, los: 7, radius: 0.28, atk: { melee: 8 }, rof: 1.7, armor: { melee: 2, pierce: 2 }, bonus: { archer: 4 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Éclaireur et gendarme nubien au visage peint : infanterie légère et rapide, chasseuse d\'archers.',
    },
    {
      id: 'eg_archer_desert', name: 'Archer du désert', age: 2, from: 'archery', cost: { wood: 30, gold: 35 }, time: 18, choice: true,
      hp: 30, speed: 1.7, los: 8, radius: 0.25, atk: { pierce: 5 }, range: 5, rof: 1.8, armor: { melee: 0, pierce: 1 },
      tags: ['archer', 'ranged', 'special'], projectile: 'arrow', projSpeed: 15,
      desc: 'Tireur nomade à l\'arc court : rapide, voit loin et frappe vite.',
    },
    {
      id: 'eg_sekhmet', name: 'Garde de Sekhmet', age: 3, from: 'barracks', cost: { food: 65, gold: 65 }, time: 26, choice: true,
      hp: 92, speed: 1.4, los: 6, radius: 0.3, atk: { melee: 12 }, rof: 1.6, armor: { melee: 3, pierce: 4 },
      tags: ['infantry', 'melee', 'special'],
      desc: 'Guerrier d\'élite de la lionne, grand bouclier et khopesh : solide et mortel.',
    },
    {
      id: 'eg_pretre_sekhmet', name: 'Prêtre de Sekhmet', age: 3, from: 'temple', cost: { food: 45, gold: 65 }, time: 25, choice: true,
      hp: 55, speed: 1.2, los: 6, radius: 0.27, atk: { melee: 5 }, rof: 1.8, armor: { melee: 1, pierce: 1 }, heal: { amount: 4, every: 2, range: 5 },
      tags: ['infantry', 'melee', 'healer', 'special'], aura: { kind: 'atk', v: 0.06, r: 6 },
      desc: 'Soigne les blessés et invoque la fureur de la déesse : +6 % d\'attaque aux alliés proches (non cumulable).',
    },
    {
      id: 'eg_char_assaut', name: 'Char d\'assaut', age: 4, from: 'stable', cost: { food: 80, gold: 110 }, time: 30, choice: true,
      hp: 165, speed: 2.4, los: 7, radius: 0.42, atk: { melee: 15 }, rof: 1.7, armor: { melee: 3, pierce: 5 }, bonus: { infantry: 4 },
      tags: ['cavalry', 'melee', 'special'],
      desc: 'Char lourd bardé de bronze, lance et faux : il fauche l\'infanterie à pleine vitesse.',
    },
    {
      id: 'eg_scarabee', name: 'Scarabée-catapulte', age: 4, from: 'siege', cost: { wood: 160, gold: 110 }, time: 42, choice: true,
      hp: 125, speed: 0.85, los: 8, radius: 0.5, atk: { pierce: 24 }, range: 10, minRange: 2, rof: 4.2, armor: { melee: 0, pierce: 4 }, bonus: { building: 12 },
      tags: ['siege', 'ranged', 'special'], projectile: 'bolt', projSpeed: 18,
      desc: 'Baliste sacrée ornée d\'un scarabée : longs carreaux qui transpercent fantassins et murailles.',
    },
  ],
  techs: [
    {
      id: 'eg_arcs_composites', building: 'castle', age: 3, name: 'Arcs composites', cost: { food: 250, gold: 200 }, time: 55,
      effects: [
        { who: { ids: ['eg_char_royal', 'eg_thoutmosis'] }, stat: 'atk.pierce', op: 'add', v: 2 },
        { who: { ids: ['eg_char_royal'] }, stat: 'range', op: 'add', v: 1 },
        { who: { ids: ['archer', 'crossbow', 'eg_archer_desert'] }, stat: 'range', op: 'add', v: 1 },
      ],
      desc: 'Chars d\'archer royaux : +2 d\'attaque et +1 de portée ; archers : +1 de portée.',
    },
    {
      id: 'eg2a', choice: true, age: 2, name: 'Crue du Nil',
      effects: [{ who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.2 }, { who: { ids: ['villager'] }, stat: 'gather.fish', op: 'mul', v: 1.2 }],
      desc: 'Les cultivateurs et les pêcheurs travaillent 20 % plus vite : le limon fertile du fleuve.',
    },
    {
      id: 'eg2b', choice: true, age: 2, name: 'Levée d\'archers',
      effects: [{ who: { tags: ['archer'] }, stat: 'cost.wood', op: 'mul', v: 0.85 }, { who: { from: 'archery' }, stat: 'time', op: 'mul', v: 0.85 }],
      desc: 'Archers 15 % moins chers en bois, formés 15 % plus vite.',
    },
    {
      id: 'eg3a', choice: true, age: 3, name: 'Chars renforcés',
      effects: [
        { who: { tags: ['cavalry'] }, stat: 'armor.pierce', op: 'add', v: 1 },
        { who: { tags: ['cavalry'] }, stat: 'hp', op: 'mul', v: 1.1 },
        { who: { tags: ['archer'] }, stat: 'atk.pierce', op: 'add', v: 1 },
      ],
      desc: 'Chars : +10 % de points de vie et +1 d\'armure contre les tirs ; archers : +1 d\'attaque.',
    },
    {
      id: 'eg3b', choice: true, age: 3, name: 'Maîtres bâtisseurs',
      effects: [{ who: { cls: 'building' }, stat: 'hp', op: 'mul', v: 1.2 }, { who: { tags: ['tower'] }, stat: 'range', op: 'add', v: 1 }, { who: { ids: ['castle'] }, stat: 'range', op: 'add', v: 1 }],
      desc: 'Tous les bâtiments ont 20 % de points de vie en plus ; tours et forteresse : +1 de portée.',
    },
    {
      id: 'eg4a', choice: true, age: 4, name: 'Gloire des Deux Terres',
      effects: [
        { who: { ids: ['villager'] }, stat: 'gather.wood', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.farm', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.berries', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.gold', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'gather.stone', op: 'mul', v: 1.12 }, { who: { ids: ['villager'] }, stat: 'gather.meat', op: 'mul', v: 1.12 },
        { who: { ids: ['villager'] }, stat: 'carry', op: 'add', v: 5 },
      ],
      desc: 'Les villageois récoltent tout 12 % plus vite et portent 5 ressources de plus.',
    },
    {
      id: 'eg4b', choice: true, age: 4, name: 'Faveur de Râ',
      effects: [
        { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.melee', op: 'add', v: 2 },
        { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'atk.pierce', op: 'add', v: 2 },
        { who: { tags: ['infantry', 'cavalry', 'archer'] }, stat: 'hp', op: 'mul', v: 1.05 },
      ],
      desc: 'Le dieu-soleil bénit l\'armée : soldats +2 d\'attaque et +5 % de points de vie.',
    },
  ],
  choices: {
    2: { hero: ['eg_narmer', 'eg_hatchepsout'], unit: ['eg_medjay', 'eg_archer_desert'], bonus: ['eg2a', 'eg2b'] },
    3: { hero: ['eg_thoutmosis', 'eg_nefertari'], unit: ['eg_sekhmet', 'eg_pretre_sekhmet'], bonus: ['eg3a', 'eg3b'] },
    4: { hero: ['eg_ramses', 'eg_cleopatre'], unit: ['eg_char_assaut', 'eg_scarabee'], bonus: ['eg4a', 'eg4b'] },
  },
};
