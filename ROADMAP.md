# Roadmap - Maths 6e

## État actuel (1er décembre 2024)

### Structure du site
- **5 Grandeurs** : Angles, Prix, Aires, Durées, Volumes
- Chaque grandeur a : Introduction, 3-4 Études, Activités Rapides
- Base de données Neon PostgreSQL avec 42 ressources seedées

### Pages fonctionnelles
| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Liste des 5 grandeurs |
| Chapitre | `/grandeur/:chapterId` | Sections d'un chapitre |
| Section | `/grandeur/:chapterId/:sectionId` | Ressources d'une section |
| Méthodes (liste) | `/grandeur/:chapterId/methodes` | Cartes des méthodes |
| Méthode (détail) | `/grandeur/:chapterId/methodes/:methodeId` | Slides interactifs |
| Cours élèves | `/cours` et `/cours/:chapterId` | Vue liste des cours |
| Admin | `/admin` | Toggle visibilité ressources |
| Admin Gestion | `/admin/gestion` | CRUD ressources |
| Admin Ordre | `/admin/ordre` | Réorganiser (drag & drop) |

### Méthodes intégrées (depuis Obsidian)
- **M2.1** - Comparer deux nombres décimaux (5 slides)
- **M2.2** - Calculer une différence de prix (6 slides)

Format : Slides interactifs sans scroll, navigation par flèches ou indicateurs ronds.

### Fichiers clés pour les méthodes
```
client/src/pages/
├── MethodesPage.tsx       # Liste des méthodes (cartes cliquables)
├── MethodeDetailPage.tsx  # Détail méthode (slides interactifs)
├── ChapterPage.tsx        # Page chapitre (bouton "Méthodes" si dispo)
└── App.tsx                # Routes définies ici
```

### Configuration
- **Port** : 3001
- **Base de données** : Neon PostgreSQL
- **Admin password** : maths6e2024

### Vault Obsidian (source des contenus)
Chemin : `/Users/macbelhaj/Nextcloud/6ème/Obsidian-Vault-6eme/`

Contenu disponible :
- `Méthodes/` : M2.1, M2.2
- `Corrections/` : Ex1 Prix du gazoil
- `Études/` : Fichiers par chapitre
- `Quiz/` : Quiz M2.1

### Pour ajouter des méthodes à un autre chapitre
1. `ChapterPage.tsx` : Ajouter l'ID dans `chaptersWithMethods`
2. `MethodesPage.tsx` : Ajouter les données dans `methodesByChapter`
3. `MethodeDetailPage.tsx` : Ajouter le contenu des slides dans `methodesContent`

### Commandes utiles
```bash
# Démarrer le serveur
PORT=3001 pnpm dev

# Seed la base de données
npx tsx scripts/seed-resources.ts
```

### URLs de test
- Site : http://localhost:3001
- Méthodes Prix : http://localhost:3001/grandeur/chapitre-2-prix/methodes
- Admin : http://localhost:3001/admin

---

## Fonctionnalités futures

### 1. Bouton Correction intégré (Priorité haute)
**Description :** Afficher un bouton "C" sur chaque ressource qui possède une correction associée.

**Comportement :**
- Bouton vert : correction disponible ET visible pour les élèves
- Bouton gris : correction disponible mais masquée (visible uniquement pour l'admin)
- Pas de bouton : aucune correction associée

**Implémentation technique :**
- [ ] Ajouter un champ `correctionId` (varchar, nullable) dans la table `resources`
- [ ] Créer une interface admin pour associer une correction à une ressource
- [ ] Modifier `SectionPage.tsx` pour afficher le bouton C
- [ ] Au clic sur C : ouvrir la correction dans un nouvel onglet

**Alternative :** Convention de nommage automatique (ex: "exercice-1" → "correction-exercice-1")

---

### 2. Tri/Réorganisation des ressources (Priorité haute)
**Description :** Permettre de réordonner les ressources au sein d'une section par drag & drop.

**Implémentation technique :**
- [ ] Utiliser une librairie comme `@dnd-kit/core` ou `react-beautiful-dnd`
- [ ] Ajouter un endpoint `resources.reorder` pour mettre à jour l'ordre
- [ ] Interface dans `/admin/gestion` avec mode "réorganiser"

---

### 3. Aperçu avant publication (Priorité moyenne)
**Description :** Bouton "Prévisualiser" dans l'admin pour voir une ressource comme un élève la verrait.

**Implémentation technique :**
- [ ] Ajouter un bouton œil à côté de chaque ressource dans l'admin
- [ ] Ouvrir un modal ou nouvel onglet avec la vue élève

---

### 4. Export/Import en masse (Priorité moyenne)
**Description :** Permettre d'exporter toutes les ressources en JSON/CSV et de les réimporter.

**Cas d'usage :**
- Sauvegarde des données
- Migration vers une autre instance
- Ajout massif de ressources

**Implémentation technique :**
- [ ] Endpoint `resources.export` → retourne JSON
- [ ] Endpoint `resources.import` → valide et insère les données
- [ ] Interface admin avec boutons Export/Import
- [ ] Validation des données importées (format, URLs valides, etc.)

---

### 5. Statistiques de consultation (Priorité basse)
**Description :** Tracker les clics sur les ressources pour voir lesquelles sont les plus consultées.

**Données à collecter :**
- Nombre de clics par ressource
- Date/heure des consultations
- (Optionnel) Par chapitre/section

**Implémentation technique :**
- [ ] Nouvelle table `resource_views` (resourceId, viewedAt, sessionId?)
- [ ] Endpoint `resources.trackView` appelé au clic
- [ ] Dashboard admin avec graphiques (chart.js ou recharts)

**Considérations :**
- Pas de données personnelles (RGPD)
- Agrégation par jour/semaine/mois

---

### 6. Notifications élèves (Priorité basse)
**Description :** Informer les élèves quand de nouvelles ressources sont disponibles.

**Options possibles :**
- Badge "Nouveau" sur les ressources récentes (< 7 jours)
- Bannière en haut de page "X nouvelles ressources cette semaine"
- (Avancé) Système de notifications push

**Implémentation technique (version simple) :**
- [ ] Utiliser le champ `createdAt` existant
- [ ] Afficher un badge "Nouveau" si createdAt < 7 jours
- [ ] Compteur de nouvelles ressources sur la page d'accueil

---

## Notes techniques

### IMPORTANT : Double configuration API (Bug récurrent)

Ce projet a **deux fichiers API distincts** qui doivent rester synchronisés :

| Fichier | Utilisé par | Description |
|---------|-------------|-------------|
| `/server/routers.ts` | Serveur de développement local (`pnpm dev`) | Routeur tRPC pour le dev |
| `/api/trpc/[trpc].ts` | Vercel en production | API serverless autonome |

**Symptôme du bug :**
- Erreur 404 sur un endpoint (ex: `resources.setCorrection`)
- Message "Erreur lors de..." côté frontend
- L'endpoint fonctionne en production mais pas en local (ou inversement)

**Cause :**
Les deux fichiers définissent les mêmes endpoints mais de manière indépendante. Si vous ajoutez un endpoint dans un fichier mais pas dans l'autre, vous aurez une erreur 404.

**Solution :**
Quand vous ajoutez/modifiez un endpoint, vous devez le faire dans **LES DEUX fichiers** :

1. **Pour le dev local** :
   - Ajouter l'endpoint dans `/server/routers.ts`
   - Ajouter la fonction DB dans `/server/db.ts` si nécessaire

2. **Pour la production Vercel** :
   - Ajouter l'endpoint dans `/api/trpc/[trpc].ts`
   - Le schéma DB est défini inline dans ce fichier

**Exemple d'ajout d'endpoint :**

```typescript
// 1. Dans /server/db.ts - ajouter la fonction
export async function setCorrectionForResource(resourceId: string, correctionId: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resources).set({ correctionId }).where(eq(resources.id, resourceId));
  return { success: true };
}

// 2. Dans /server/routers.ts - ajouter l'endpoint
setCorrection: protectedProcedure
  .input(z.object({ id: z.string(), correctionId: z.string().nullable() }))
  .mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Unauthorized");
    const { setCorrectionForResource } = await import("./db");
    return await setCorrectionForResource(input.id, input.correctionId);
  }),

// 3. Dans /api/trpc/[trpc].ts - ajouter l'endpoint (version Vercel)
setCorrection: publicProcedure
  .input(z.object({ id: z.string(), correctionId: z.string().nullable() }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.isAdmin) throw new Error("Unauthorized");
    const db = getDb();
    await db.update(resources).set({ correctionId: input.correctionId }).where(eq(resources.id, input.id));
    return { success: true };
  }),
```

**Checklist avant de tester un nouvel endpoint :**
- [ ] Endpoint ajouté dans `/server/routers.ts`
- [ ] Fonction ajoutée dans `/server/db.ts` (si nouvelle logique)
- [ ] Endpoint ajouté dans `/api/trpc/[trpc].ts`
- [ ] Schéma DB mis à jour dans les deux endroits si nouveau champ

---

### Stack actuelle
- Frontend : React + Vite + Tailwind CSS + shadcn/ui
- Backend : tRPC + Drizzle ORM
- Base de données : PostgreSQL (Neon)
- Hébergement : Vercel (serverless)
- Auth : JWT avec cookies HttpOnly

### Fichiers clés
- `/api/trpc/[trpc].ts` - API Vercel (serverless)
- `/client/src/pages/SectionPage.tsx` - Vue élève des ressources
- `/client/src/pages/AdminGestion.tsx` - Gestion admin
- `/client/src/pages/Admin.tsx` - Dashboard admin

### Base de données
Table `resources` :
- id, chapterId, sectionId, title, description
- type (pdf/video/link), url, icon
- visible (true/false), order, displayOrder
- createdAt

---

## Historique des versions

### v1.3 (2 décembre 2024)
- **Simplification du système JAMP** (J'Apprends à Mi-Parcours) :
  - Suppression de la table `jampSlides` - maintenant 1 JAMP = 1 contenu
  - Ajout des colonnes `contentType` et `contentUrl` directement dans la table `jamps`
  - `AdminJamp.tsx` : Formulaire simplifié pour créer un JAMP avec son contenu (image/PDF/vidéo)
  - `JampDetailPage.tsx` : Affichage direct du contenu (support YouTube, PDF avec lien externe)
  - Migration SQL exécutée sur la base de données Neon

- **Persistance des classes actives en base de données** :
  - Ajout des fonctions `getActiveClasses()` et `setActiveClasses()` dans `server/db.ts`
  - Stockage en bitmask dans la table `stats` (clé `active_classes`)
  - Nouveau router `settings` dans `server/routers.ts` avec endpoints `getActiveClasses` et `setActiveClasses`
  - `Admin.tsx` et `AdminGestion.tsx` utilisent maintenant l'API au lieu de localStorage
  - Les classes sélectionnées persistent entre les sessions et appareils

- **Sections cliquables dans l'admin** :
  - `Admin.tsx` : Les titres de sections (Étude n°1, Étude n°2...) sont maintenant cliquables
  - Clic = active/désactive toutes les ressources de la section
  - Indicateurs visuels : bordure verte (tout visible), grise (tout masqué), jaune (partiel)
  - Badge compteur (ex: 2/3 ressources visibles)

- **En attente** :
  - Déploiement sur Vercel (attente feu vert utilisateur)

---

## Prochaine fonctionnalité : Visibilité individuelle des exercices (Priorité haute)

### Analyse du code actuel

**Fichiers concernés :**
- `client/src/pages/ExercicesPage.tsx` : Liste des exercices (cartes cliquables)
- `client/src/pages/ExerciceDetailPage.tsx` : Détail d'un exercice avec questions

**Structure actuelle (hardcodée) :**

```typescript
// ExercicesPage.tsx (lignes 7-26)
const exercicesByEtude = {
  "chapitre-2-prix": {
    "etude-1": [
      { id: "ex1", title: "Exercice 1", subtitle: "Prix du gazole", icon: "⛽", questionsCount: 4, hasCorrection: true },
      { id: "ex2", title: "Exercice 2", subtitle: "Remplir un chèque", icon: "📝", ... },
      // ... 7 exercices au total
    ]
  }
};

// ExerciceDetailPage.tsx (lignes 281-290)
// Visibilité HARDCODÉE - devrait être en base de données
const visibilityState = {
  "ex1": {
    "a": { correction: true, jamp: true },
    "b": { correction: true, jamp: true },
    // ...
  }
};
```

**Problème :** La visibilité des exercices est codée en dur. Le prof ne peut pas activer/désactiver un exercice individuellement depuis l'admin.

### Solution proposée

#### 1. Nouvelle table `exercise_visibility` en base de données

```sql
CREATE TABLE exercise_visibility (
  id VARCHAR(64) PRIMARY KEY,
  chapter_id VARCHAR(64) NOT NULL,
  section_id VARCHAR(64) NOT NULL,
  exercise_id VARCHAR(64) NOT NULL,
  visible BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, section_id, exercise_id)
);
```

#### 2. Nouveaux endpoints API

**Dans `/server/routers.ts` et `/api/trpc/[trpc].ts` :**

```typescript
exercises: router({
  // Récupérer la visibilité de tous les exercices d'une section
  getVisibility: publicProcedure
    .input(z.object({ chapterId: z.string(), sectionId: z.string() }))
    .query(async ({ input }) => { ... }),

  // Toggle la visibilité d'un exercice
  toggleVisibility: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      sectionId: z.string(),
      exerciseId: z.string(),
      visible: z.boolean()
    }))
    .mutation(async ({ input }) => { ... }),
})
```

#### 3. Page Admin pour les exercices

**Option A : Nouvelle page `/admin/exercices`**
- Affiche les cartes d'exercices comme sur ExercicesPage
- Clic sur une carte = toggle la visibilité
- Bordure verte = visible, grise = masqué

**Option B : Intégrer dans Admin.tsx existant**
- Quand on clique sur "Exercices" dans une section
- Afficher les cartes d'exercices cliquables en dessous

#### 4. Modifier `ExercicesPage.tsx`

```typescript
// Au lieu de lire exercicesByEtude directement
const { data: visibility } = trpc.exercises.getVisibility.useQuery({ chapterId, sectionId });

// Filtrer les exercices selon leur visibilité
const visibleExercices = exercices.filter(ex => visibility?.[ex.id]?.visible ?? false);
```

### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `drizzle/schema.ts` | Ajouter table `exercise_visibility` |
| `server/db.ts` | Fonctions `getExerciseVisibility`, `setExerciseVisibility` |
| `server/routers.ts` | Router `exercises` avec endpoints |
| `api/trpc/[trpc].ts` | Dupliquer le router pour Vercel |
| `client/src/pages/ExercicesPage.tsx` | Filtrer selon visibilité BDD |
| `client/src/pages/Admin.tsx` | Interface pour toggler les exercices |

### Estimation

Cette fonctionnalité nécessite :
- Migration SQL pour la nouvelle table
- ~4 fichiers backend à modifier
- ~2 fichiers frontend à modifier
- Tests en local puis déploiement Vercel

### v1.2 (1er décembre 2024)
- **Système d'exercices interactifs** : Remplace les PDFs par des cartes interactives
  - `ExercicesPage.tsx` : Grille des exercices avec icônes
  - `ExerciceDetailPage.tsx` : Détail avec énoncés exacts et boutons Correction/Méthode
  - Système de verrouillage : corrections masquées par défaut, activables par le prof
  - Navigation depuis SectionPage : clic sur "Exercices" → page interactive

- **Exercice 1 "Prix du gazole" complètement intégré** :
  - 4 questions (a, b, c, d) avec énoncés exacts du PDF
  - Corrections en images manuscrites pour chaque question
  - Liens vers méthodes M2.1 et M2.2

- **Images de corrections** dans `/client/public/exercices/prix/ex1/` :
  - `ex1_a_1.png`, `ex1_a_2.png` : Question a) comparaison
  - `6A_Correction 1_1.png`, `6A_Correction 1_2.png` : Question b) calcul 10ℓ
  - `ex1_c_1.png` : Question c) calcul 100ℓ
  - `ex1_1.png`, `ex1_2.png` : Question d) prix minimum 5ℓ

### Prochaines étapes (planifiées)
- [ ] Ajouter le chèque à remplir dans la question c)
- [ ] Créer des fiches méthodes pédagogiques expertes basées sur les 4 questions :
  - Stratégies transversales ("Deux méthodes valent mieux qu'une")
  - Réutilisation des résultats précédents
  - Pièges à éviter (erreur "HORREUR" dans les soustractions)
  - Proportionnalité (×10, ×100, ×5)
- [ ] Interface admin pour activer/désactiver les corrections par question
- [ ] Stocker la visibilité en base de données (actuellement hardcodé)

### v1.1 (30 novembre 2024)
- Méthodes M2.1 et M2.2 en slides interactifs (sans scroll)
- Navigation par flèches et indicateurs ronds

### v1.0 (Novembre 2024)
- Structure par chapitres et sections
- Gestion de la visibilité des ressources
- Interface admin complète
- Sections : Feuille de route, Cours, Fiches techniques, Situations problèmes, Exercices, Corrections, Activité rapide, Vidéos
