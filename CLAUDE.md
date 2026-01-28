# Instructions pour Claude

## Workflow de développement

**IMPORTANT** : Procéder de manière incrémentale et laisser l'utilisateur répondre au fur et à mesure.

- Ne pas poser plusieurs questions à la fois
- Avancer étape par étape
- Attendre la réponse de l'utilisateur avant de continuer
- Proposer des choix simples quand c'est possible

## Workflow de déploiement

**IMPORTANT** : Avant de déployer sur Vercel, toujours laisser l'utilisateur tester en local d'abord, sauf contre-indication explicite.

Processus :
1. Faire les modifications
2. Attendre la validation de l'utilisateur après test local
3. Déployer uniquement après confirmation

## Structure du projet

- `api/trpc/[trpc].ts` - Backend Vercel (API serverless) - C'EST LE VRAI BACKEND
- `server/routers.ts` - Routeurs locaux (pour dev)
- `client/src/pages/` - Pages React

## Sections par chapitre

Chaque chapitre (Angles, Prix, Aires, Durées, Volumes) a les sections suivantes :
- introduction
- cours
- etude-1, etude-2, etude-3 (etude-4 pour volumes)
- activite-rapide
- corrections

## Visibilité par classe

Les ressources ont une visibilité par classe (6A, 6B, 6C, 6D) via les champs :
- `visible` - visibilité générale
- `visible6A`, `visible6B`, `visible6C`, `visible6D` - par classe

## Classes actives

Les classes actives sont stockées dans localStorage (`maths6e_active_classes`).

## Masquage des exercices

Les exercices peuvent être masqués/affichés par l'admin :
- **Table** : `hiddenExercices` (stocke uniquement les IDs des exercices masqués)
- **Format ID** : `chapitre-2-prix/etude-1/ex1`
- **Page** : `/grandeur/{chapitre}/{section}/exercices`
- **Usage** : Cliquer sur l'icône œil (visible uniquement en mode admin)
- **Routes tRPC** : `exercices.getHidden`, `exercices.toggleVisibility`

## Cadenas Admin

Un cadenas discret est affiché en bas à droite de toutes les pages :
- **Composant** : `client/src/components/AdminLock.tsx`
- **Ajouté dans** : `client/src/App.tsx`
- Redirige vers `/admin` au clic

## Exercices interactifs "À toi de jouer"

Composants pour le mode interactif des exercices avec questions aléatoires.

### InteractiveExercise2.tsx (Chapitre Prix - Écrire en lettres)

- **Fichier** : `client/src/components/InteractiveExercise2.tsx`
- **Page** : `/grandeur/chapitre-2-prix/etude-1/exercices/ex2`
- **Fonctionnalités** :
  - 4 niveaux : Original, Facile, Moyen, Difficile
  - Questions : chiffres → lettres et lettres → chiffres
  - Tolérance orthographique (Levenshtein, 1-2 erreurs = "almost")
  - Évite les nombres de l'exercice original (`numbersToAvoid`)
  - Auto-focus sur l'input de la question courante
  - Mode Défi avec chronomètre optionnel
  - Capture PNG des résultats (html2canvas)
  - Partage via Web Share API ou presse-papier
- **Dépendance** : `html2canvas` (import statique requis, pas dynamique)

### Conversion nombres → lettres

Fonction `numberToWords()` avec règles françaises :
- Trait d'union partout (réforme 1990)
- "et" pour 21, 31, 41, 51, 61, 71 (pas 81, 91)
- "vingt" et "cent" avec "s" si multipliés ET en fin
- "mille" invariable

## Fichiers clés

- `client/src/components/AdminLock.tsx` - Cadenas accès admin
- `client/src/components/InteractiveExercise2.tsx` - Exercice interactif Prix
- `client/src/pages/ExercicesPage.tsx` - Liste exercices avec masquage
- `client/src/pages/ExerciceDetailPage.tsx` - Détail exercice avec mode interactif
- `server/db.ts` - Fonctions `getHiddenExercices()`, `toggleExerciceVisibility()`
- `drizzle/schema.ts` - Table `hiddenExercices`
