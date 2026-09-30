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
  uniqueUnit: null,
  uniqueTech: null,
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
    dock: 'Port du Nil', healer: 'Prêtre', warship: 'Navire de guerre',
  },
  units: [],
  techs: [],
  choices: null,
};
