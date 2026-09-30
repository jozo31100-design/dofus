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
  uniqueUnit: null,
  uniqueTech: null,
  art: 'gauls',
  color: '#3f6fa0',
  effects: [
    { who: { tags: ['fisher'] }, stat: 'gather.fish', op: 'mul', v: 1.25 },
    { who: { ids: ['fishingboat', 'warship'] }, stat: 'hp', op: 'mul', v: 1.2 },
    { who: { tags: ['infantry'] }, stat: 'atk.melee', op: 'add', v: 1 },
    { who: { ids: ['palisade', 'palisade_gate', 'outpost'] }, stat: 'cost.wood', op: 'mul', v: 0.8 },
    { who: { tags: ['cavalry'] }, stat: 'hp', op: 'mul', v: 0.85 },
  ],
  names: {
    hall: 'Grande halle', house: 'Maison longue', barracks: 'Salle des guerriers', archery: 'Champ de tir', stable: 'Enclos à chevaux', forge: 'Forge du nain',
    temple: 'Temple d\'Odin', castle: 'Forteresse circulaire', market: 'Comptoir', academy: 'Skaldsal', wonder: 'Temple d\'Uppsala',
    dock: 'Port', healer: 'Völva', warship: 'Drakkar',
  },
  units: [],
  techs: [],
  choices: null,
};
