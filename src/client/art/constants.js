// Projection isométrique et conventions communes à tout le dessin.
//
// Le monde est une grille de cases (x vers le « bas-droite » de l'écran, y vers le « bas-gauche »).
// Un point du monde (x, y) — en unités de case, flottantes — se projette ainsi (zoom 1) :
//     sx = (x - y) * TILE_W / 2
//     sy = (x + y) * TILE_H / 2
// La caméra regarde depuis le coin (+x, +y) : un objet dont x + y est plus grand est plus proche.
// La lumière vient du haut-gauche : le dessus est clair, la face gauche moyenne, la face droite sombre,
// et les ombres portées partent vers le bas-droite.

export const TILE_W = 64;
export const TILE_H = 32;

/** Pixels par case dans la texture du sol (image « à plat », déformée ensuite par la projection). */
export const TERRAIN_PPT = 32;

export function project(x, y) {
  return [((x - y) * TILE_W) / 2, ((x + y) * TILE_H) / 2];
}
