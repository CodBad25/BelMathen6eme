# BelMathen6eme - Documentation du Projet

## Site de Mathématiques 6ème - Collège Gaston Chaissac

**URL de production** : https://belmathen6eme.vercel.app
**Repo GitHub** : https://github.com/CodBad25/BelMathen6eme
**Dernière mise à jour** : 1er décembre 2025

---

## Structure du Projet

```
belmathen6eme/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   │   ├── InteractiveExercise.tsx  # Exercice interactif "À toi de jouer"
│   │   │   └── ui/            # Composants UI (shadcn)
│   │   ├── pages/             # Pages de l'application
│   │   │   ├── Home.tsx       # Page d'accueil avec les 5 grandeurs
│   │   │   ├── ChapterPage.tsx    # Page d'un chapitre (sections)
│   │   │   ├── SectionPage.tsx    # Page d'une section (ressources)
│   │   │   ├── MethodesPage.tsx   # Liste des méthodes
│   │   │   ├── MethodeDetailPage.tsx  # Détail d'une méthode
│   │   │   ├── IAResourcesPage.tsx    # "Mon AMIE IA MAIS..."
│   │   │   ├── ExercicesPage.tsx      # Liste des exercices
│   │   │   ├── ExerciceDetailPage.tsx # Détail exercice avec interactif
│   │   │   ├── Admin.tsx          # Connexion admin
│   │   │   ├── AdminGestion.tsx   # Gestion des ressources
│   │   │   ├── AdminDragDrop.tsx  # Réorganisation drag & drop
│   │   │   ├── CoursEleves.tsx    # Vue "tous les cours"
│   │   │   └── PdfViewer.tsx      # Visualiseur PDF
│   │   └── lib/
│   │       └── trpc.ts        # Client tRPC
├── server/                    # Backend Express + tRPC
│   ├── db.ts                  # Connexion Drizzle + Neon
│   └── routers.ts             # Routes API tRPC
├── drizzle/                   # Migrations et schéma DB
│   └── schema.ts              # Schéma de la base de données
└── public/
    └── ia-ressources/         # Ressources IA (vidéos, images, PDF)
```

---

## Fonctionnalités Principales

### 1. Navigation par Grandeurs
- **5 grandeurs** : Angles, Prix, Aires, Durées, Volumes
- Chaque grandeur contient des **sections** (Introduction, Études, Activités Rapides)
- Chaque section contient des **ressources** (PDF, vidéos, exercices)

### 2. Exercice Interactif "À toi de jouer" (chapitre Prix)
**Fichier** : `client/src/components/InteractiveExercise.tsx`

#### Fonctionnalités :
- **Écran de sélection des objectifs** : L'élève clique sur les parties qu'il veut travailler (a, b, c, d)
- **Sélection multiple** possible avec feedback visuel
- **Bouton "Tout sélectionner"** et **"Commencer"**
- **Questions en déroulé** : toutes visibles, scrollable
- **Bilan final** uniquement pour les parties sélectionnées
- **Options de fin** : "Refaire l'exercice" ou "Exercice similaire"

#### Prix aléatoires :
- Un prix a **3 décimales**, l'autre **2 décimales** (jamais les deux pareils)
- **Pas de zéros inutiles** (pas de 1,500 ni 1,X0Y)
- **Fourchette réaliste** 2024-2025 : 1.45€ - 1.89€

#### Structure des questions :
- **a)** Comparer les prix (2 questions)
- **b)** Calculer pour 10 L (5 questions avec réponses groupées)
- **c)** Calculer pour 100 L (5 questions avec réponses groupées)
- **d)** Calculer pour 5 L - rédiger un chèque (2 questions)

#### Validation du chèque :
- Montant en chiffres : accepte uniquement les nombres
- Montant en lettres : tolérance de 85% (fautes d'orthographe acceptées)
- Conversion automatique nombre → mots en français

### 3. "Mon AMIE IA MAIS..." (NotebookLM)
**Fichier** : `client/src/pages/IAResourcesPage.tsx`

- Ressources générées par IA (NotebookLM)
- Organisées par **objectif d'apprentissage**
- Chaque objectif a : vidéo + illustration
- **Avertissement** : "Vérifie toujours avec ton cours et ton professeur"
- Modal diaporama avec navigation

### 4. Système de Méthodes
**Fichiers** : `MethodesPage.tsx`, `MethodeDetailPage.tsx`

- Fiches méthodes par chapitre
- Contenu structuré avec exemples

### 5. Administration
**Fichiers** : `Admin.tsx`, `AdminGestion.tsx`, `AdminDragDrop.tsx`

- **Connexion** : mot de passe simple
- **Gestion** : visibilité des ressources (visible/masqué)
- **Ordre** : drag & drop pour réorganiser les ressources

---

## Base de Données

**Hébergement** : Neon (PostgreSQL serverless)
**ORM** : Drizzle

### Tables :
- `resources` : toutes les ressources (PDF, vidéos, etc.)
- `visits` : compteur de visites

### Champs d'une ressource :
```typescript
{
  id: string,
  name: string,
  type: "pdf" | "video" | "image" | "interactive",
  path: string,
  chapterId: string,
  sectionId: string,
  visible: "true" | "false",
  order: number
}
```

---

## Déploiement

### Vercel
- **Projet** : belmathen6eme
- **Déploiement automatique** depuis GitHub (branche master)
- **Build command** : `pnpm run build:vercel`

### Variables d'environnement (Vercel)
```
DATABASE_URL=postgresql://...@neon.tech/...
```

### Commandes utiles
```bash
# Développement local
pnpm dev

# Build pour Vercel
pnpm run build:vercel

# Pousser les changements (déclenche le déploiement)
git add -A && git commit -m "message" && git push origin master
```

---

## Prochaines Évolutions Prévues

### Système de Classes (6A / 6B)
**Objectif** : Gérer 2 classes de 6ème avec des progressions différentes

**Solution proposée** :
- URLs différentes : `/6A` et `/6B`
- Chaque ressource a un champ `classes: string[]`
- Dans l'admin : cocher les classes qui voient chaque ressource
- Un seul projet, une seule base de données

**Avantages** :
- Pas de duplication de code
- Contrôle granulaire par ressource
- Facile à maintenir

---

## Chapitres et Sections

### Chapitre 1 - Les Angles
- Introduction
- Étude n°1 - Comparer des angles
- Étude n°2 - Multiplier et diviser des angles
- Étude n°3 - Mesurer des angles
- Activités Rapides

### Chapitre 2 - Les Prix *(avec exercice interactif + IA)*
- Introduction
- Étude n°1 - Comparer des prix
- Étude n°2 - Calculer des prix
- Étude n°3 - Partager des prix
- Activités Rapides

### Chapitre 3 - Les Aires
- Introduction
- Étude n°1 - Comparer des aires
- Étude n°2 - Mesurer une aire
- Étude n°3 - Calculer une aire
- Activités Rapides

### Chapitre 4 - Les Durées
- Introduction
- Étude n°1 - Comparer, additionner, soustraire des durées
- Étude n°2 - Multiplier et diviser des durées
- Étude n°3 - Calculer des horaires, des dates ou des durées
- Activités Rapides

### Chapitre 5 - Les Volumes
- Introduction
- Étude n°1 - Comparer des volumes
- Étude n°2 - Rapport entre les volumes
- Étude n°3 - Mesurer un volume
- Étude n°4 - Calculer un volume
- Activités Rapides

---

## Notes Techniques

### Responsive Design
- Utilisation de `vw` et `vh` pour le mobile
- Media queries avec `md:` pour desktop
- Design "mobile-first"

### Stack Technique
- **Frontend** : React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Express + tRPC
- **Base de données** : Neon (PostgreSQL) + Drizzle ORM
- **Routing** : Wouter (léger, simple)
- **Déploiement** : Vercel

---

*Documentation créée le 1er décembre 2025 après une nuit blanche de développement !*
