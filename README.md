# Terres de Gaule

Jeu de stratégie en temps réel façon *Age of Empires*, **Francs contre Gaulois**, à jouer **à deux en réseau local**
(deux PC sur la même box ou le même Wi-Fi) ou seul contre l'ordinateur. Deux cartes en duel, *La Rivière des Carnutes* et *La Forêt Hercynienne* (une ceinture d'arbres à abattre ou à franchir par trois clairières), plus la *Grande arène* à partir de 3 joueurs ; trois tailles au choix : petite (100 x 100), moyenne (140) et grande (180).

- 2 peuples aux bonus et unités uniques différents (Francs : cavalerie lourde et francisque ; Gaulois : bûcherons, hordes de fantassins et gésates)
- **4 âges** avec des **choix à la Age of Mythology** : à chaque âge (II, III, IV) on choisit 1 héros, 1 unité spéciale et 1 bonus parmi deux
  (touche `K`) ; 12 héros, 12 unités spéciales et 12 bonus propres aux deux peuples
- La **cité** : palissades, murs de pierre, grands remparts et portes (qu'on trace en glissant la souris), bastions, postes de guet,
  infirmerie, grande maison, monument. Les murs sont chers et très solides ; on les franchit avec des **échelles d'assaut** (lent et exposé),
  des **tours de siège**, on les mine avec des **sapeurs** ou on les abat avec béliers et catapultes. Les **portes** ne s'ouvrent que pour leur propriétaire,
  et les soldats postés dans un rempart tirent sur les assaillants
- **3 points stratégiques** posés sur la carte (le Trésor des Anciens au milieu du gué, deux Collines sacrées sur les flancs) : on les capture en y tenant des soldats,
  ils rapportent des ressources ou un bonus tant qu'on les garde (indestructibles, mais on peut les reprendre). Le **contre-siège**, très coûteux, protège les bâtiments voisins des machines de siège (−40 % de dégâts) et brûle celles qui approchent
- **Formation automatique** : un groupe se déplace à la vitesse de son membre le plus lent, avec les plus solides au premier rang, les tireurs derrière et les machines en queue
- **Tour lance-pierres** (très coûteuse, tir de zone), **infirmerie** qui soigne les unités proches et celles qui s'y abritent ; tout coûte 82 % plus cher qu'au départ (+40 % puis +30 %, hors villageois, fermes et maisons ; changements d'âge compris)
- **Jusqu'à 8 joueurs** : 1 à 7 ordinateurs en solo (chacun pour soi, carte « Grande arène » avec les camps en cercle), ordinateurs supplémentaires aussi dans les parties en réseau
- **Murailles praticables** : les soldats postés sur un mur ou un rempart y sont visibles, les archers tirent avec leur propre portée (+ bonus de hauteur) ; une porte se pose à la place d'un mur ; tours et remparts tirent sur la **cible prioritaire** désignée par clic droit
- **Chemin de ronde** : les soldats montent sur leurs murs (clic droit sur le mur), marchent d'un tronçon à l'autre, restent visibles en hauteur ; les archers tirent d'en haut, la mêlée ne peut pas les atteindre
- **Combats lisibles** : anneau de couleur d'équipe sous chaque unité, chiffres de dégâts (F4 pour les masquer), barres de vie des blessés, cercles rouges sur la minimap aux endroits où l'on se bat, soldats qui se répartissent autour de leur cible au lieu de s'empiler
- **L'ordinateur** fortifie sa base (ligne de murs avec porte et tours), poste ses archers sur les murs quand on l'attaque, construit des bastions avec sa pierre, et **assiège les villes murées** : béliers, catapultes et sapeurs sur la muraille (de préférence la porte), tours de siège chargées de fantassins, échelles en dernier recours
- **Pilotage automatique** : bouton *Explorer* pour les éclaireurs (ils découvrent seuls la carte, fuient vers votre base dès qu'un ennemi armé approche ou les attaque, et évitent la zone ensuite) ; bouton *Ronde* pour les soldats (allers-retours entre leur position et un point, en combattant ce qu'ils croisent)
- Environ 35 unités, 28 bâtiments, 60 technologies : villageois, récolte (bois, nourriture, or, pierre), fermes, chasse, pêche,
  construction, armées, béliers et catapultes, tours et château, brouillard de guerre
- Le **port** et les **bateaux** (barques de pêche, drakkars et navires vénètes qui se battent sur la rivière), le **marché**
  (achat et vente de ressources aux cours variables), le **Scriptorium / Cercle des druides** (recherches de médecine, de
  cartographie…), les **héros** Clovis et Vercingétorix (aura d'attaque)
- Application de bureau Windows (un seul `.exe`), tout est dessiné par le code (aucune image externe)

## Aperçu

![Menu principal](docs/screenshots/menu.jpg)

*Un village gaulois (huttes rondes, champs, forêts) et son interface : ici la maison des guerriers est sélectionnée.*

![Village gaulois et interface](docs/screenshots/partie-gaulois.jpg)

*Les Francs (en rouge) attaquent un village gaulois (en bleu).*

![Bataille entre Francs et Gaulois](docs/screenshots/bataille.jpg)

*Le salon de l'hôte : il donne son adresse à l'autre joueur, qui la voit apparaître dans sa liste ou la saisit.*

![Salon de l'hôte](docs/screenshots/salon.jpg)

## Jouer

### 1. Récupérer le jeu

Le fichier `.exe` est fabriqué automatiquement sur GitHub à chaque mise à jour :

1. Ouvrez l'onglet **Actions** du dépôt ([liste des compilations](../../actions/workflows/build-windows.yml)), puis la dernière exécution **« Compiler pour Windows »** (coche verte).
2. En bas de la page, téléchargez l'archive **TerresDeGaule-Windows** (il faut être connecté à GitHub) et décompressez-la.
3. Vous obtenez deux fichiers :
   - **`TerresDeGaule-…-portable.exe`** : se lance d'un double-clic, sans installation (recommandé pour l'envoyer à quelqu'un ; le tout premier démarrage prend quelques secondes) ;
   - `TerresDeGaule-Setup-….exe` : installeur classique.

> **Windows affichera un avertissement bleu** (« Windows a protégé votre ordinateur ») car le jeu n'est pas signé numériquement.
> Cliquez sur **Informations complémentaires**, puis **Exécuter quand même**. Ce n'est demandé qu'une fois.

Pour qu'une personne qui n'a pas de compte GitHub reçoive le jeu, envoyez-lui simplement le fichier `…-portable.exe`
(clé USB, messagerie, Drive…). Si un antivirus le met en quarantaine, autorisez-le : il n'y a rien de dangereux dedans.

### 2. Jouer à deux en réseau local

Les deux ordinateurs doivent être **sur le même réseau** (même box, même Wi-Fi ; pas de VPN) et utiliser **exactement la même version du jeu**
(le numéro s'affiche en bas à droite du menu ; en cas de différence, le jeu refuse la connexion et l'indique : envoyez alors le même `.exe` aux deux joueurs).

**Joueur 1 (l'hôte)**
1. Menu principal → **Héberger une partie en réseau**.
2. Windows demande d'autoriser le jeu sur le réseau : cliquez sur **Autoriser** (réseaux privés). Sans cela, l'autre joueur ne pourra pas se connecter.
3. Le jeu affiche une ou plusieurs **adresses** (par exemple `192.168.1.20`) : donnez-la à l'autre joueur. Choisissez votre peuple et les options.

**Joueur 2 (l'invité)**
1. Menu principal → **Rejoindre une partie**.
2. La partie de l'hôte apparaît automatiquement dans la liste ; sinon saisissez l'adresse donnée par l'hôte, puis **Se connecter**.
3. Choisissez votre peuple et attendez que l'hôte lance la partie.

L'hôte clique sur **Lancer la partie** dès que l'invité est connecté. Le PC de l'hôte calcule la partie : il est préférable que ce soit
le plus puissant. Si l'invité se déconnecte, l'hôte gagne ; si l'hôte se déconnecte, la partie s'arrête.

**En cas de problème de connexion**
- « Connexion refusée » ou « délai dépassé » : le pare-feu de l'hôte bloque le jeu (Paramètres Windows → Pare-feu → *Autoriser une application* → « Terres de Gaule », cases *Privé* et *Public* cochées), ou l'adresse est fausse, ou les deux PC ne sont pas sur le même réseau.
- Le jeu utilise le port **47615** (TCP) pour la partie et **47616** (UDP) pour la recherche automatique des parties.
- Plusieurs adresses affichées : essayez celle qui commence par `192.168.` ou `10.` (les autres viennent souvent de VPN ou de machines virtuelles).

### 3. Jouer contre l'ordinateur

Menu principal → **Jouer contre l'ordinateur** : choisissez votre peuple, le niveau (facile, moyen, difficile), les ressources de départ et la vitesse.

## Commandes

| Action | Commande |
|---|---|
| Sélectionner | clic gauche, ou cadre en glissant ; double-clic = tous les mêmes à l'écran |
| Ordre (déplacer, attaquer, récolter, réparer…) | **clic droit** ; **Maj + clic droit** pour enchaîner les ordres |
| Construire | sélectionner un villageois → *Bâtiments civils / militaires / Monuments / Murailles* → choisir → clic sur la carte (Maj : en poser plusieurs ; murs : **glisser** pour tracer une ligne) |
| Choix d'âge | `K` ou bouton **Choix** en haut |
| Escalader une muraille | rechercher *Échelles d'assaut* (maison des guerriers), sélectionner des fantassins, clic droit sur le mur ennemi |
| Former une unité / rechercher | sélectionner le bâtiment → bouton (Maj + clic : en former 5) |
| Point de ralliement | bâtiment sélectionné → clic droit sur la carte ou sur une ressource |
| Attaque en marchant | soldats sélectionnés → bouton « Attaquer en marchant » |
| Commandes du panneau | touches **A Z E R / Q S D F / W X C V** selon votre clavier (elles suivent la disposition des boutons) |
| Groupes | `Ctrl + 1…9` créer, `1…9` rappeler (deux fois : centrer) |
| Villageois inoccupé | `.` ou `,` |
| Salle principale / dernière attaque | `H` / `Espace` |
| Vue | flèches, molette (zoom), clic molette ; en plein écran, bord de l'écran |
| Détruire la sélection | `Suppr` (à confirmer) |
| Pause / menu / aide / plein écran | `P` / `F10` ou `Échap` / `F1` / `F11` |

**But :** détruire tous les bâtiments et villageois de l'adversaire. Récoltez, construisez des maisons pour agrandir la population,
passez à l'âge suivant (Grande Salle ou Oppidum), formez une armée équilibrée : les lanciers battent la cavalerie, la cavalerie
bat les archers, les archers et les épéistes se complètent, les béliers abattent les bâtiments.

## Développer

```bash
npm install          # dépendances (Electron, electron-builder, esbuild)
npm test             # tests automatiques (réseau, chemins, simulation, synchronisation, session)
npm start            # compile et lance le jeu
npm run dist         # fabrique les .exe Windows (sous Windows)
```

Outils de contrôle (dans `tools/`) : `sim-match.mjs` (IA contre IA sans interface), `balance.mjs` (équilibre des peuples),
`map-image.mjs` (aperçu de la carte), `ui-test.mjs` et `e2e-lan.mjs` (tests avec de vrais clics ; le second lance deux instances d'Electron
et les fait jouer en réseau), `shot.mjs` (capture d'un script dessiné dans Chromium).

### Architecture

| Dossier | Rôle |
|---|---|
| `electron/` | processus principal : fenêtre, réseau TCP/UDP (`netcore.cjs`), pont sécurisé vers le jeu |
| `src/core/` | règles du jeu, sans dépendance à l'interface : données (`defs.js`), carte, chemins A\*, simulation, IA, instantanés réseau |
| `src/client/` | rendu isométrique, interface, menus, sons, état côté joueur |
| `src/client/art/` | dessin procédural des bâtiments, unités, terrain, icônes (contrat : `docs/ART.md`) |
| `test/` | tests automatiques (`node --test`) |

**Réseau.** L'hôte exécute la simulation (à 20 pas par seconde) et envoie à l'invité, après chaque pas, uniquement ce qui a changé et qu'il a le droit de voir
(brouillard de guerre). L'invité envoie ses commandes. Le solo est le même code avec une IA à la place du second joueur.
Toutes les règles et caractéristiques sont dans `src/core/defs.js` : pour équilibrer le jeu, on ne touche qu'à ce fichier.
