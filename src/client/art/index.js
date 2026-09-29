// Point d'entrée unique du dessin : le rendu et l'interface n'importent que ce fichier.
export { TILE_W, TILE_H, TERRAIN_PPT, project } from './constants.js';
export { renderTerrainTexture } from './terrain.js';
export { getNodeSprite, drawAnimal, drawProjectile } from './nature.js';
export { drawUnit, unitMetrics, prewarmUnit, unitStats } from './units.js';
export { getBuildingSprite, getRubbleSprite, buildingMetrics } from './buildings.js';
export { drawIcon, drawPortrait, drawTechIcon } from './icons.js';
