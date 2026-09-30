// Unités ajoutées (franks) : voir unit-ext.js pour le contrat du module.
// 11 unités : héros childeric, clotilde, charles_martel, charlemagne, roland ; spéciales antrustion, leude, sergent,
// moine, preux, arbaletrier_imp. Les costumes sont dans unit-franks-spec.js, les armes dans unit-franks-gear.js,
// les parures (casques, voile, décors, harnachement) dans unit-franks-wear.js.
import { TYPES as FRANK_TYPES, METRICS as FRANK_METRICS, franksSpec } from './unit-franks-spec.js';

export const TYPES = FRANK_TYPES;
export const METRICS = FRANK_METRICS;
export const KINDS = {};

export function spec(type, civ, teamIdx) {
  void civ;
  return franksSpec(type, teamIdx);
}
