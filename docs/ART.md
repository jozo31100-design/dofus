# Direction artistique et contrat de dessin

**Terres de Gaule** est un jeu de stratégie en temps réel façon *Age of Empires* (Francs contre Gaulois), en 2D
isométrique. **Aucune image externe** : tout est dessiné par le code avec l'API Canvas 2D. Ce document est le
contrat entre le moteur de rendu (`src/client/render.js`, `src/client/hud.js`) et les modules de dessin
(`src/client/art/*`).

## 1. Projection

- Voir `src/client/art/constants.js`. Cases de 64 × 32 px à l'écran (zoom 1), projection 2:1 :
  `sx = (x - y) * 32`, `sy = (x + y) * 16`. La caméra regarde depuis le coin (+x, +y).
- **Lumière** : haut-gauche. Dessus clair (100 %), face gauche moyenne (~85 %), face droite sombre (~65 %).
  Les ombres portées partent vers le **bas-droite** de l'écran (douces, ~25 % d'opacité).
- L'emprise au sol d'un bâtiment de `n × n` cases est un losange de `n*64` px de large et `n*32` px de haut.
- Le rendu final est vu entre zoom 0,6 et 1,25 : les détails doivent rester lisibles à 60 %, et beaux à 125 %.

## 2. Style

Dessin « peint / dessin animé » chaleureux : dégradés doux, contour fin (1 px) d'une teinte plus sombre que la
couleur locale (~35–50 % d'opacité), ombrage à deux ou trois tons, petites touches de lumière. Couleurs naturelles
et riches, mais **lisibles** : chaque silhouette doit se reconnaître au premier coup d'œil.

**Couleurs d'équipe** (`TEAM_COLORS` dans `core/defs.js`, indice 0 = bleu, 1 = rouge) : sur les unités, tunique/manches,
cape ou face du bouclier ; sur les bâtiments, bannières, fanions, bandeaux de toit. Assez de surface pour qu'on
distingue les camps dans une foule à zoom 0,6. Ne jamais teinter tout le sprite.

### Gaulois (`civ === 'gauls'`)
- Palette : verts, ocres, bruns chauds, blanc cassé (torchis chaulé), paille dorée.
- Bâtiments : plans **ronds** ou ovales, toits **coniques en chaume**, murs de torchis blanc sur ossature de bois apparente,
  palissades de troncs pointus, murs en pierres sèches à poutres (*murus gallicus*), **carnyx** (long cor de bronze
  à tête de sanglier) et sangliers sur des mâts, boucliers peints, clôtures d'osier.
- Personnages : longues **moustaches**, cheveux blond paille ou roux, **braies à carreaux** (vert/brun), torque doré au cou,
  boucliers ovales/hexagonaux en bois avec ombilic de fer, casques simples ou ailés pour les élites.

### Francs (`civ === 'franks'`)
- Palette : bruns-gris, ardoise, bleu-gris, blanc, acier, touches d'or.
- Bâtiments : **longues salles de bois** à bardeaux, toits à forte pente avec **têtes sculptées aux pignons**, murs de planches
  verticales sur soubassement de pierre ; château de pierre à donjon carré et tours d'angle ; bannières à emblème doré
  (abeille / fleur de lys), boucliers ronds accrochés, croix pour la chapelle.
- Personnages : tuniques longues, jambes **entrelacées de lanières**, cheveux longs ou barbe, capes de fourrure, boucliers ronds
  à ombilic métallique, cottes de mailles et casques coniques à nasal pour les unités avancées.

## 3. API (à respecter à l'identique)

Tous les modules sont des modules ES sans dépendance, **Canvas 2D uniquement** (pas d'API Node, pas d'image externe,
pas de `Math.random()` : utiliser `mulberry32(seed)` de `palette.js`). Les commentaires sont en français.
Les fichiers `src/client/art/index.js`, `constants.js` et `palette.js` définissent les exports publics ;
on peut **ajouter** des exports, jamais en retirer ni en changer la signature.

### Sol — `terrain.js`
`renderTerrainTexture(terrain, W, H, seed) -> HTMLCanvasElement` (taille `W*TERRAIN_PPT` × `H*TERRAIN_PPT`).
`terrain` est un `Uint8Array` de `W*H` : **0 herbe, 1 gué (eau peu profonde, franchissable), 2 eau profonde**.
Texture *à plat* (vue de dessus, 1 case = `TERRAIN_PPT` = 32 px) : le moteur la déforme ensuite avec la matrice affine
`setTransform(32/PPT, 16/PPT, -32/PPT, 16/PPT, ox, oy)` pour obtenir l'isométrie ; les motifs ronds deviendront des ellipses
aplaties « posées au sol » (c'est voulu). Doit contenir : herbe variée (grandes plages de verts + fines touffes, fleurs,
cailloux), rivage de sable/galets qui s'estompe, eau profonde plus sombre au centre, reflets/ondulations, gués clairs
et sablonneux. Les transitions entre types doivent être **douces** (pas de carreaux visibles). Génération < 1,5 s.
Les objets qui se dressent (arbres…) ne font PAS partie de la texture.

### Ressources et animaux — `nature.js`
- `getNodeSprite(type, variant, frac) -> { canvas, ax, ay, h }` : `type` ∈ `tree | berries | gold | stone | carcass`.
  `(ax, ay)` = point au sol au centre de la case dans le canvas, `h` = hauteur visible en px. `variant` (entier ≥ 0, à prendre
  modulo le nombre de variantes) varie l'aspect ; `frac` ∈ ]0,1] = quantité restante (baies/pépites/roches qui diminuent ;
  ignoré pour les arbres). `carcass` : variante 0 = cerf, 1 = mouton. Sprites mis en cache. Arbres : ≥ 6 variantes
  (pins, chênes, bouleau, sapin sombre…), 44 à 72 px de haut, houppiers qui se chevauchent joliment en forêt dense.
  Buissons de baies : ~28 px. Mines : monticule rocheux 1 case avec filons d'or (jaune brillant) ou blocs gris.
- `drawAnimal(ctx, o)` : `o = { type: 'deer'|'sheep', sx, sy, t, anim: 'idle'|'walk'|'flee'|'die', dir: 1|-1, deathT }`.
  `idle` = broute/lève la tête, `flee` = galop bondissant, `die` : `t` = secondes depuis la mort ; tombe sur le côté (`deathT` 0→1).
- `drawProjectile(ctx, kind, sx, sy, angle, t)` : `kind` ∈ `arrow | axe | stone | bolt`. `angle` = direction à l'écran.
  Flèche fine avec pointe et plumes ; hache qui tournoie (`t` en s) ; rocher rond ; `bolt` = carreau d'arbalète.

### Unités — `units.js`
`drawUnit(ctx, o)` avec `o = { type, civ, team, sx, sy, t, anim, dir, aim, work, carry, deathT, scale }` :
- `sx, sy` : **pieds** de l'unité à l'écran ; `dir` = +1 regarde vers la droite de l'écran, −1 vers la gauche (tout est dessiné
  de trois-quarts, on se contente de retourner) ; `scale` (défaut 1).
- `anim` : `idle` (respiration, arme qui balance légèrement) ; `walk` (cycle de marche, `t` en s **déjà multiplié par la vitesse**,
  ~1 cycle par 0,7 s à `t` = 1 ; cavalerie au galop, roues des engins qui tournent) ; `work` (selon `o.work`, cyclique) ;
  `attack` (coup unique, `t` = secondes depuis le début de l'attaque, ~0,5 s : préparation puis frappe ; après la fin,
  reprendre la pose d'attente ; les tireurs visent selon `aim` = angle à l'écran vers la cible) ; `die` (`t` en s, `deathT` 0→1 :
  s'effondre puis s'efface ; les engins de siège se disloquent).
- `work` ∈ `wood` (hache), `mine` (pioche), `farm` (faucille/houe), `forage` (cueille en se penchant), `build` et `repair` (marteau),
  `hunt` (couteau/épieu), `butcher` (dépèce).
- `carry` : `null | 'wood' | 'food' | 'gold' | 'stone'` — le villageois porte la charge bien visible (fagot sur l'épaule,
  panier/sac de grain, sac lourd d'or, pierre) en marchant et en attendant.
- Chaque unité dessine sa propre **ombre** (ellipse douce sous les pieds).
- `unitMetrics(type) -> { h, w }` : hauteur (pieds → sommet de la tête, en px, sert aux barres de vie et à la sélection) et demi-largeur.
- Tailles indicatives à zoom 1 : villageois 30 px ; fantassins/tireurs 33–36 ; champion 38 ; cavaliers 46, chevalier 52 ;
  bélier ~70 px de long × 40 de haut ; catapulte ~70 × 54.
- Identifiants (`core/defs.js`) : `villager militia spearman swordsman champion archer crossbow scout cavalry knight ram catapult
  francisque gesate healer`. `francisque` (Francs) : lanceur de hache de jet, torse en cotte, cheveux longs, hache à la main.
  `gesate` (Gaulois) : guerrier **nu** aux motifs bleus (peinture de guerre), torque, moustache, cheveux hérissés, épée/lance, sans bouclier.
  `healer` : Gaulois = **druide** en robe blanche à capuche et faucille d'or / gui ; Francs = **prêtre** en robe brune, croix et bâton.
  Chaque unité existe pour les deux civilisations (tenue et coiffure différentes), sauf les uniques.
- Progression visuelle : villageois (simple) < milicien (casque simple) < lancier / épéiste (bouclier, armure) < champion (armure
  complète, casque à cimier/ailes) ; archer (capuche, arc, carquois) < arbalétrier (arbalète, cotte) ; éclaireur (petit cheval, cavalier léger)
  < cavalier < chevalier (cheval caparaçonné aux couleurs de l'équipe, lance à fanion).
- **Performance** : au moins 400 `drawUnit` par image doivent tenir en ~6 ms (Chromium sans GPU). Mettre en cache des sprites
  pré-rendus (par type/civ/équipe/animation/image/direction) si nécessaire, mais garder le résultat identique.

### Bâtiments — `buildings.js`
- `getBuildingSprite(typeId, civ, teamIdx, stage) -> { canvas, ax, ay, h }`. `stage` : 0 fondations (terre battue, piquets,
  cordeau, quelques planches), 1 charpente/murs à ~40 % avec échafaudage, 2 presque fini (toit incomplet ou échafaudage),
  3 terminé. `(ax, ay)` = centre de l'emprise au sol dans le canvas ; `h` = hauteur du sommet au-dessus du sol en px.
  Le sprite inclut son ombre portée et sa bannière/couleur d'équipe. Mis en cache.
- `getRubbleSprite(size, variant) -> { canvas, ax, ay }` : décombres d'un bâtiment de `size × size` cases (pierres, poutres brisées, cendres).
- `buildingMetrics(typeId) -> { h }`.
- Emprises (`core/defs.js`) : hall 4×4, house 2×2, farm 3×3 (plat), mill 2×2, lumber 2×2, mining 2×2, barracks 3×3, archery 3×3,
  stable 3×3, forge 3×3, tower 2×2, temple 3×3, siege 4×4, castle 5×5. Le dessin doit **remplir** l'emprise
  (le losange au sol) de façon crédible : un bâtiment ne doit ni déborder de son losange ni le laisser presque vide.
- Chaque type existe en version gauloise et franque (mêmes proportions, style différent, cf. §2) :
  - `hall` — Gaulois : *Oppidum*, grande salle ronde de bois et chaume sur un rempart de pierre à poutres, palissade, carnyx.
    Francs : *Grande Salle*, longue salle de bois à grand toit de bardeaux et pignons sculptés, bannières. Hauteur ~110–150 px.
  - `house` — hutte ronde à toit de chaume conique / petite maison de bois à pignon. ~40–55 px.
  - `farm` — champ plat aux sillons de blé (semis en stage 0-2, épis dorés en 3), piquets, épouvantail.
  - `mill` — Gaulois : hutte avec meules et sacs de grain ; Francs : petit moulin à vent en bois. ~70–95 px.
  - `lumber` — auvent ouvert, tas de rondins, chevalet de sciage, haches. `mining` — auvent, chariot de minerai, pioches, sacs. ~40–50 px.
  - `barracks` — grande salle d'entraînement, râteliers d'armes, boucliers alignés, bannière. ~80–100 px.
  - `archery` — bâtiment ouvert avec cibles de paille et râteliers d'arcs. `stable` — grange avec enclos, foin, mangeoire. ~60–80 px.
  - `forge` — atelier de pierre avec cheminée qui fume (fumée figée), enclume dehors, foyer rougeoyant. ~70–90 px.
  - `tower` — tour haute (~150 px), pierre + hourd de bois, créneaux, bannière.
  - `temple` — Gaulois : *Nemeton*, bosquet sacré de menhirs et petit sanctuaire de bois autour d'un chêne ; Francs : chapelle de pierre,
    clocher, croix. ~90–120 px.
  - `siege` — grand atelier ouvert avec bâtis de catapultes et rondins de béliers. ~80–100 px.
  - `castle` — Francs : *Château* de pierre, donjon carré, quatre tours d'angle, créneaux, bannières. Gaulois : *Citadelle*
    de pierre et bois (*murus gallicus*), tours de guet, donjon au toit de chaume, carnyx. ~170–220 px.
- Pas de fumée ni de flamme animées ni de barre de vie : le moteur les ajoute par-dessus.

### Interface — `icons.js`
- `drawIcon(ctx, name, size)` : dessine dans le carré (0,0)-(size,size) du contexte (l'appelant place/échelonne). Noms : ressources
  `food wood gold stone pop` ; actions `attack stop delete repair garrison ungarrison cancel rally build-eco build-mil age
  hammer sword shield bow flag menu pause idle-villager clock` ; on peut en ajouter. Lisibles de 20 à 64 px.
- `drawPortrait(ctx, id, civ, teamIdx, size)` : portrait carré d'une unité ou d'un bâtiment (utiliser `drawUnit`/`getBuildingSprite`
  cadrés joliment, sur fond neutre transparent).
- `drawTechIcon(ctx, techId, size)` : icône de chacune des technologies de `TECHS` (cadre + symbole : hache, pioche, araire, panier, sac,
  charrette, épée, cheval, arc, armure, drapeau d'âge…), doit distinguer les niveaux (I / II) et l'économie de l'armée.

## 4. Livrables et contrôle qualité

1. Remplacer les fichiers provisoires par de vrais dessins **sans changer les exports**.
2. Fournir des « planches » de contrôle sous `tools/` (`artboard-*.js`), lancées avec  
   `node tools/shot.mjs tools/artboard-XXX.js .scratch/art/XXX.png 1600x1000` ; **regarder les PNG obtenus** (outil de lecture d'image),
   corriger, recommencer jusqu'à ce que le résultat soit vraiment beau et cohérent. Une planche montre : tous les éléments, les deux
   civilisations, les deux équipes, les états (marche, travail, attaque, mort ; fondations → terminé), en contexte sur de l'herbe.
3. Mesurer les performances (temps de génération, temps d'une image de 400 unités) et les indiquer dans le rapport final.
4. Ne modifier **que** les fichiers qui vous sont attribués ; ne pas lancer de commande `git`, ne pas installer de paquet.

## 5. Extension : port, bateaux, marché, académie, merveille, héros

Nouveaux identifiants (déjà présents dans `src/core/defs.js`, à lire). **On ne change aucune signature existante** ; on complète.

### Unités navales et héros (`units.js`, `unit-*.js`)
Les bateaux se dessinent avec `drawUnit` comme les autres unités : `sx, sy` = point de flottaison au centre de la coque ;
même `dir`, `anim`, `t`, `deathT`, `team`, `civ`, `scale`. Chaque coque a une **ombre/reflet** sombre sur l'eau, un léger sillage d'écume
(en marche) et un **tangage** doux à l'arrêt. Tailles à zoom 1 : barque ~58 × 34 px ; navire de guerre ~100 × 76 px (mât compris).
- `fishingboat` (Barque de pêche, les deux peuples). Francs : barque à clins (planches qui se chevauchent), étrave sculptée, petite
  voile carrée écrue ; Gaulois : barque de chêne à fond plat, bordé d'osier, voile de cuir. Couleur d'équipe : fanion à la poupe +
  bande sur la voile/le plat-bord. Un pêcheur à bord. `anim` : `idle` (tangage), `walk` (avance, rame/voile gonflée, sillage),
  `work` avec `work === 'fish'` (**nouvelle valeur**) : le pêcheur lance/relève son filet (cycle), `die` : chavire et coule (`deathT` 0→1).
  `carry === 'food'` : tas de poissons argentés visible dans la barque (en `idle`, `walk` et `work`).
- `warship` (Francs : **Drakkar** ; Gaulois : **Navire vénète**). Francs : long navire à clins, étrave à tête de dragon, rangée de boucliers
  ronds le long du bord, grande voile carrée rayée aux couleurs de l'équipe, rames. Gaulois : haute coque de chêne massif à hautes
  murailles avant/arrière, grande voile de cuir teinte aux couleurs de l'équipe, proue à tête de sanglier. Deux ou trois archers à bord.
  `anim` : `idle` (tangage), `walk` (voile gonflée, sillage plus marqué), `attack` (les archers bandent puis tirent, `aim` = angle à
  l'écran vers la cible, comme les archers), `die` (chavire lentement, mât qui tombe, coule).
- `clovis` (Francs) et `vercingetorix` (Gaulois) : **héros à pied**, plus grands que les champions (~42 px), très reconnaissables, avec un
  **anneau doré** fin et lumineux sous les pieds (signe de héros). Clovis : couronne d'or sur cheveux longs, cotte de mailles, grand manteau
  bleu-gris à fourrure et fibule dorée, épée et bouclier rond orné. Vercingétorix : longues moustaches, casque ailé d'or, torque et bracelets d'or,
  manteau à carreaux, bouclier ovale peint, épée longue. Mêmes animations que les fantassins (`idle walk attack die`).
- `unitMetrics`, `prewarmUnit`, `unitStats` et les caches doivent couvrir ces types ; `prewarmUnit` doit préparer `work`/`carry` de `fishingboat`.

### Poissons (`nature.js`)
`getNodeSprite('fish', variant, frac)` : banc de poissons **sur l'eau**, une case (losange 64 × 32). Anneaux de rides concentriques clairs,
3 à 6 poissons argentés/bleutés entrevus sous la surface, éclaboussure et poisson qui saute (image figée par variante).
`frac` ∈ ]0,1] : moins de poissons quand le banc s'épuise. Doit rester lisible sur l'eau bleue du terrain (voir `terrain.js`). `h` ≈ 20 px.

### Bâtiments (`buildings.js`, `building-*.js`)
Même contrat que §3 : 4 stades (fondations → terminé), ombre, couleurs d'équipe, un sprite par (type, civ, équipe, stade), cache, `buildingMetrics`.
- `dock` — **Port** (Francs) / **Embarcadère** (Gaulois), emprise 3×3 (~60–90 px de haut). Doit sembler posé **au bord de l'eau** quel que soit
  le côté : pas de jetée orientée ; un quai de planches sur pilotis tout autour de deux faces avant, bittes d'amarrage, cordages, barils,
  caisses de poisson, filets qui sèchent sur des perches, une coque de barque sur un chevalet. Francs : entrepôt à pignon sur pilotis,
  grue à poulie. Gaulois : cabane ronde de chaume sur plateforme, amphores, piliers ornés de crânes-trophées **non** (rester tout public :
  des poteaux à fanions). Bannière d'équipe.
- `market` — **Marché**, 3×3 (~60–80 px). Étals sous auvents rayés aux couleurs d'équipe autour d'un puits ou d'une balance géante,
  sacs, amphores, tissus, pièces. Francs : étals de bois et toile ; Gaulois : tentes de perches et de peaux, cordes, chaudrons.
- `academy` — Francs : **Scriptorium** (petite abbaye : salle de pierre avec clocheton, pupitres, grand rouleau et plume sur l'enseigne) ;
  Gaulois : **Cercle des druides** (cercle de menhirs autour d'un grand chêne et d'une petite hutte, gui, faucille d'or, chaudron). 3×3 (~80–110 px).
- `wonder` — emprise **6×6**, très grand (~230–300 px). Francs : **Palais d'Aix-la-Chapelle** (chapelle palatine octogonale à coupole
  dorée, grande salle voisine, tours d'escalier, arcades, bannières impériales). Gaulois : **Sanctuaire de Bibracte** (grande enceinte de
  *murus gallicus* avec sanctuaire monumental de bois sculpté à toit de chaume doré, carnyx géants, menhirs, statues de sanglier dorées).
  Il doit avoir de l'allure : c'est la pièce maîtresse de la partie. Stades de chantier crédibles.
- `getRubbleSprite(size, variant)` doit aussi accepter `size = 6`.

### Icônes (`icons.js`)
Nouvelles icônes de `drawIcon` : `fish` (poisson argenté), `coin` (pièce d'or), `crown` (couronne), `ship` (voilier), `hero` (heaume à plumet et étoile),
`buy-food buy-wood buy-stone sell-food sell-wood sell-stone` (le symbole de la ressource + une pièce d'or + une flèche : **verte vers le haut
pour vendre** (on reçoit de l'or), **rouge vers le bas pour acheter** — non : `buy-*` = flèche entrante verte ; `sell-*` = flèche sortante
dorée ; l'essentiel : deux familles clairement différentes et lisibles à 44 px).
`drawTechIcon` : ajouter `hunt1 nets1 nets2 hull1 naval_atk trade1 trade2 med1 med2 scout1 eco1 strat1` (chien de chasse, filet, filet doublé,
coque renforcée, baliste, balance/marchand, sac de pièces, herbes/gui, bénédiction, longue-vue/carte, calendrier/faucille, casque + épée…),
niveaux I/II distingués comme les autres.
