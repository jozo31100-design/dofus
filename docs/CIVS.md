# Ajouter un peuple

Un peuple supplémentaire est un module de **données pures** `src/core/civs/<id>.js` (aucun import), déclaré dans `src/core/civs/index.js`.
`defs.js` le fusionne au chargement : `CIVS[id]`, unités, technologies, `CHOICES[id]` et noms propres. Les unités propres à un peuple
(`civ` est posé automatiquement) rejoignent d'elles-mêmes la liste `trains` de leur bâtiment `from`.

```js
export default {
  id, name, tagline, story, bonuses: [4 lignes], color,        // fiche du peuple (menu de choix)
  art: 'franks' | 'gauls',        // style de base des dessins tant qu'un dessin propre n'existe pas
  uniqueUnit: 'id', uniqueTech: 'id',   // unité (bâtiment `castle`, âge 3) et technologie (`castle`, âge 3) propres
  effects: [{ who, stat, op: 'add'|'mul', v }],   // bonus de peuple (même format que CIVS.franks.effects)
  names: { idDefinition: 'Nom propre' },          // noms affichés (bâtiments, unités de base, techs) pour ce peuple
  units: [ ... ], techs: [ ... ],                 // définitions (voir defs.js) ; `civ` est ajouté tout seul
  choices: { 2: { hero: [a, b], unit: [a, b], bonus: [a, b] }, 3: {...}, 4: {...} },
};
```

* **Identifiants uniques** dans tout le jeu (une erreur est levée au chargement en cas de doublon).
* **Héros** : `from: 'hall'`, `limit: 1`, `choice: true`, `age` = âge du choix, tags `[..., 'hero']`, `aura: { kind: 'atk'|'armor'|'speed'|'heal'|'gather', v, r }`.
* **Unités spéciales** : `choice: true`, `from` = un bâtiment existant (`barracks`, `archery`, `stable`, `temple`, `siege`, `dock`, `castle`…).
* **Bonus d'âge** : dans `techs`, `{ id, choice: true, age, name, effects: [...], desc }` (pas de `building`).
* `who` : `{ tags: [...] }`, `{ ids: [...] }`, `{ from: 'barracks' }`, `{ all: true }`. `stat` : `hp`, `speed`, `atk.melee`, `atk.pierce`, `armor.melee`, `armor.pierce`, `range`, `rof`, `time`, `cost.food|wood|gold|stone`, `gather.food|wood|gold|stone|farm|fish`, `carry`, `los`.
* Projectiles disponibles : `arrow`, `axe`, `stone`, `bolt` (pas de nouveau type sans toucher au réseau).
* Un même id d'unité ne doit pas être réutilisé d'un peuple à l'autre ; les unités de base (villager, militia, spearman…) sont communes à tous.

## Dessin

* Unités : `src/client/art/unit-ext-<id>.js` exporte `TYPES, METRICS, KINDS, spec(type, civ, teamIdx)` (voir `docs/ART.md` §5–6) ; il est enregistré dans `MODS` de `unit-ext.js`.
  `spec` est appelée avec le peuple réel (`civ === '<id>'`) : elle dessine les unités propres **et peut aussi donner un costume propre aux unités de base**
  (en partant de `unitSpec(type, artBase, teamIdx)` avec `artBase` = `'franks'|'gauls'`).
* Bâtiments : `DESIGNS[<id>]` dans `buildings.js` (type → dessin) ; les types absents retombent sur le style `art`. Le contexte de dessin expose `g.civ` (style de base) et `g.civId` (le peuple réel).
* Icônes des technologies et des unités : voir `icons.js` / `icon-glyphs3.js`.
