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
  uniqueUnit: null,
  uniqueTech: null,
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
  },
  units: [],
  techs: [],
  choices: null,
};
