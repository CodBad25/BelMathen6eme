/**
 * Script de seed v2 - avec icônes et sections correctes
 *
 * Usage: npx tsx scripts/seed-nextcloud-v2.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import * as dotenv from "dotenv";

dotenv.config();

// Schema
const typeEnum = pgEnum("type", ["pdf", "video", "link"]);
const visibleEnum = pgEnum("visible", ["true", "false"]);

const resources = pgTable("resources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  sectionId: varchar("sectionId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: typeEnum("type").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  visible: visibleEnum("visible").default("false").notNull(),
  order: integer("order").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Toutes les ressources avec le bon mapping
const allResources = [
  // ========== CHAPITRE 1 - LES PRIX ==========
  {
    id: "ch1-feuille-route",
    chapterId: "chapitre-1",
    sectionId: "feuille-route",
    title: "Feuille de route - PRIX 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/Wj83pMZNi2MfA9b/download"
  },
  {
    id: "ch1-cours",
    chapterId: "chapitre-1",
    sectionId: "cours",
    title: "Les Prix - Cours 4e",
    description: "Cours complet",
    icon: "📘",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/mycFKzA5PGT8nAT/download"
  },
  {
    id: "ch1-fiche-1",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°1",
    description: "Moyenne, médiane, étendue",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/2Xpz3KBNniKA3rM/download"
  },
  {
    id: "ch1-aide-1",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Aide technique n°1",
    description: "Moyenne, médiane, étendue",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/iqiXCrMp48NCYy6/download"
  },
  {
    id: "ch1-fiche-2",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°2",
    description: "Proportionnalité, Pourcentages",
    icon: "📊",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/Gi2G6MiZf2CMpQR/download"
  },
  {
    id: "ch1-aide-2",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Aide technique n°2",
    description: "Proportionnalité, Pourcentages",
    icon: "💡",
    visible: "true",
    order: 4,
    url: "https://nuage03.apps.education.fr/index.php/s/dFdeHiBRrKqjdQ6/download"
  },
  {
    id: "ch1-fiche-3",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°3",
    description: "Calcul littéral 1ère Partie",
    icon: "📊",
    visible: "true",
    order: 5,
    url: "https://nuage03.apps.education.fr/index.php/s/crG5tjLExfXrkrC/download"
  },
  {
    id: "ch1-exercices",
    chapterId: "chapitre-1",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Prix 4e",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/Rf4EkW62sCpR6Dp/download"
  },
  {
    id: "ch1-situation-1",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°1",
    description: "Prix immobilier à Lyon",
    icon: "🏘️",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/C4eCZBytPMJSaJk/download"
  },
  {
    id: "ch1-situation-2",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°2",
    description: "Côte de cochon",
    icon: "🥩",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/KqH9LMyZ6nQXWrm/download"
  },
  {
    id: "ch1-situation-3",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°3",
    description: "Location trottinette",
    icon: "🛴",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/8WyPKdEqdyArmLa/download"
  },
  {
    id: "ch1-situation-4",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°4",
    description: "Evolution Prix fruits et légumes",
    icon: "🍎",
    visible: "true",
    order: 4,
    url: "https://nuage03.apps.education.fr/index.php/s/BwYs86Fyc5oaANc/download"
  },
  {
    id: "ch1-situation-5",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°5",
    description: "Impôts sur le revenu",
    icon: "💰",
    visible: "true",
    order: 5,
    url: "https://nuage03.apps.education.fr/index.php/s/eLbWcHdxZszFfJW/download"
  },
  {
    id: "ch1-situation-6",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°6",
    description: "Location de DVD",
    icon: "📀",
    visible: "true",
    order: 6,
    url: "https://nuage03.apps.education.fr/index.php/s/mW9PP964eWT5r3p/download"
  },
  {
    id: "ch1-situation-7",
    chapterId: "chapitre-1",
    sectionId: "situations",
    title: "Situation n°7",
    description: "Calcul littéral et résolution d'équations",
    icon: "🔢",
    visible: "true",
    order: 7,
    url: "https://nuage03.apps.education.fr/index.php/s/oCrZL2wMXNarEwT/download"
  },

  // ========== CHAPITRE 2 - LES LONGUEURS ==========
  {
    id: "ch2-feuille-route",
    chapterId: "chapitre-2",
    sectionId: "feuille-route",
    title: "Feuille de route - Longueurs 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/CH7qaEqiyJBfN4C/download"
  },
  {
    id: "ch2-cours",
    chapterId: "chapitre-2",
    sectionId: "cours",
    title: "Les Longueurs - Cours 4e",
    description: "Cours complet",
    icon: "📘",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/fnDPsZ7oQgYyEfp/download"
  },
  {
    id: "ch2-fiche-6",
    chapterId: "chapitre-2",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°6",
    description: "Puissances de 10 et notation scientifique",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/DKSpaTsqynobdgJ/download"
  },
  {
    id: "ch2-aide-6",
    chapterId: "chapitre-2",
    sectionId: "fiches-techniques",
    title: "Aide technique n°6",
    description: "Puissances de 10",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/TbdrPSNoZ6WK2HE/download"
  },
  {
    id: "ch2-exercices",
    chapterId: "chapitre-2",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Longueurs 4e",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/73RJbXJLPj3bpFH/download"
  },
  {
    id: "ch2-situation-1",
    chapterId: "chapitre-2",
    sectionId: "situations",
    title: "Situation n°1",
    description: "Infiniment grand, infiniment petit, puissances de 10",
    icon: "🔭",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/QjGc7eMFx32AZDS/download"
  },
  {
    id: "ch2-situation-2",
    chapterId: "chapitre-2",
    sectionId: "situations",
    title: "Situation n°2",
    description: "Vitesse et calculs de distances",
    icon: "🚗",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/EBLipjCew8f3GBb/download"
  },

  // ========== CHAPITRE 3 - LES TEMPÉRATURES ==========
  {
    id: "ch3-fiche-9",
    chapterId: "chapitre-3",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°9",
    description: "Opérations de nombres relatifs",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/6pmMZF7tpT2QEpC/download"
  },
  {
    id: "ch3-aide-9",
    chapterId: "chapitre-3",
    sectionId: "fiches-techniques",
    title: "Aide technique n°9",
    description: "Nombres relatifs",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/2WaZs7x9GczHoyr/download"
  },
  {
    id: "ch3-exercices",
    chapterId: "chapitre-3",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Températures 4e",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/yb5H6nK54j9846K/download"
  },
  {
    id: "ch3-situation-1",
    chapterId: "chapitre-3",
    sectionId: "situations",
    title: "Situation n°1",
    description: "Le froid arrive au Québec",
    icon: "❄️",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/afNYRQYzLtdEKXA/download"
  },
  {
    id: "ch3-situation-2",
    chapterId: "chapitre-3",
    sectionId: "situations",
    title: "Situation n°2",
    description: "Degré Celsius et Degré Fahrenheit",
    icon: "🌡️",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/2GwJNtSftM7FW3x/download"
  },
  {
    id: "ch3-situation-3",
    chapterId: "chapitre-3",
    sectionId: "situations",
    title: "Situation n°3",
    description: "Scratch Les températures 4e",
    icon: "🐱",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/9kMefP7TgQSE8S9/download"
  },
  {
    id: "ch3-situation-4",
    chapterId: "chapitre-3",
    sectionId: "situations",
    title: "Situation n°4",
    description: "Température ressentie",
    icon: "🧊",
    visible: "true",
    order: 4,
    url: "https://nuage03.apps.education.fr/index.php/s/GNG7zLLazteDjjF/download"
  },

  // ========== CHAPITRE 3bis - LES FRACTIONS ==========
  {
    id: "ch3bis-fiche-10",
    chapterId: "chapitre-3bis",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°10",
    description: "Généralités sur les fractions",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/H6YWpoZ2Yg5C7mQ/download"
  },
  {
    id: "ch3bis-aide-10",
    chapterId: "chapitre-3bis",
    sectionId: "fiches-techniques",
    title: "Aide technique n°10",
    description: "Généralités sur les fractions",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/bLoAcc6yWafyXxw/download"
  },
  {
    id: "ch3bis-carte-mentale",
    chapterId: "chapitre-3bis",
    sectionId: "fiches-techniques",
    title: "Carte mentale Fractions",
    description: "Synthèse visuelle",
    icon: "🧠",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/Tab7a5FDZkfSnmd/download"
  },
  {
    id: "ch3bis-situation-1",
    chapterId: "chapitre-3bis",
    sectionId: "situations",
    title: "Anamorphose - Consignes",
    description: "Activité artistique avec les fractions",
    icon: "🎨",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/QS6BnLz8scxSdRW/download"
  },
  {
    id: "ch3bis-situation-2",
    chapterId: "chapitre-3bis",
    sectionId: "situations",
    title: "Anamorphose - Fractions",
    description: "Grille de travail",
    icon: "🖼️",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/T6zXT29NEMCxKg8/download"
  },

  // ========== CHAPITRE 4 - CHANCE (PROBABILITÉS) ==========
  {
    id: "ch4-feuille-route",
    chapterId: "chapitre-4",
    sectionId: "feuille-route",
    title: "Feuille de route - CHANCE 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/EDoZxyNCyd4mkYG/download"
  },
  {
    id: "ch4-cours",
    chapterId: "chapitre-4",
    sectionId: "cours",
    title: "Version élève - Chance",
    description: "Document élève",
    icon: "📘",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/ZTkLb9SdZgME7nP/download"
  },
  {
    id: "ch4-situation-1",
    chapterId: "chapitre-4",
    sectionId: "situations",
    title: "Activité",
    description: "De la vie courante aux probabilités",
    icon: "🎲",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/oWmmqLbd9ECPqZR/download"
  },

  // ========== CHAPITRE 5 - LES AIRES (PYTHAGORE) ==========
  {
    id: "ch5-feuille-route",
    chapterId: "chapitre-5",
    sectionId: "feuille-route",
    title: "Feuille de route - AIRE 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/sErNw7CjntmMaby/download"
  },
  {
    id: "ch5-cours",
    chapterId: "chapitre-5",
    sectionId: "cours",
    title: "Version élève - AIRES",
    description: "Document élève",
    icon: "📘",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/itr9t5mdGjmFEHx/download"
  },
  {
    id: "ch5-fiche-10",
    chapterId: "chapitre-5",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°10",
    description: "Théorème de Pythagore",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/CQoQmiCxRPWGrkY/download"
  },
  {
    id: "ch5-aide-10",
    chapterId: "chapitre-5",
    sectionId: "fiches-techniques",
    title: "Aide technique n°10",
    description: "Théorème de Pythagore",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/GHGiEaGc3goTrne/download"
  },
  {
    id: "ch5-carte-mentale",
    chapterId: "chapitre-5",
    sectionId: "fiches-techniques",
    title: "Carte mentale Pythagore",
    description: "Synthèse visuelle",
    icon: "🧠",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/ReZ9kwW3fqdGPzC/download"
  },
  {
    id: "ch5-exercices",
    chapterId: "chapitre-5",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Aires 4e",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/i2YDr5PXfkk89AH/download"
  },
  {
    id: "ch5-situation-1",
    chapterId: "chapitre-5",
    sectionId: "situations",
    title: "Situation n°1",
    description: "Somme des aires des carrés - Théorème de Pythagore",
    icon: "📐",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/kaZPZEzxycYd9wA/download"
  },
  {
    id: "ch5-situation-3",
    chapterId: "chapitre-5",
    sectionId: "situations",
    title: "Situation n°3",
    description: "Pose store banne",
    icon: "🏠",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/ztwEbHRqRCeLqQ5/download"
  },

  // ========== CHAPITRE 6 - LES ANGLES (COSINUS) ==========
  {
    id: "ch6a-feuille-route",
    chapterId: "chapitre-6-angles",
    sectionId: "feuille-route",
    title: "Feuille de route - Angles 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/dgtnLzknTKwyXxD/download"
  },
  {
    id: "ch6a-fiche-14",
    chapterId: "chapitre-6-angles",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°14",
    description: "Cosinus d'un angle",
    icon: "📊",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/FwLBg2nWXEWeLLf/download"
  },
  {
    id: "ch6a-aide-14",
    chapterId: "chapitre-6-angles",
    sectionId: "fiches-techniques",
    title: "Aide technique n°14",
    description: "Cosinus d'un angle",
    icon: "💡",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/YDpZ5Qtk9BmgCnA/download"
  },
  {
    id: "ch6a-exercices",
    chapterId: "chapitre-6-angles",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Angles 4e",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/TBdk5cd44J6wps6/download"
  },

  // ========== CHAPITRE 6 - LES VOLUMES ==========
  {
    id: "ch6v-feuille-route",
    chapterId: "chapitre-6-volumes",
    sectionId: "feuille-route",
    title: "Plan de travail - VOLUME 4e",
    description: "Document de présentation du chapitre",
    icon: "📄",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/gEB7jH7ngm2ezen/download"
  },
  {
    id: "ch6v-cours",
    chapterId: "chapitre-6-volumes",
    sectionId: "cours",
    title: "Version élève - VOLUMES Complet",
    description: "Document élève",
    icon: "📘",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/G4FbtAHnGemYJRb/download"
  },
  {
    id: "ch6v-exercices",
    chapterId: "chapitre-6-volumes",
    sectionId: "exercices",
    title: "Feuille d'exercices Volumes",
    description: "Exercices d'application",
    icon: "📝",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/3GadgYbWyZwaTpY/download"
  },
  {
    id: "ch6v-situation-1",
    chapterId: "chapitre-6-volumes",
    sectionId: "situations",
    title: "Situation n°1",
    description: "Construction préau et normes",
    icon: "🏗️",
    visible: "true",
    order: 1,
    url: "https://nuage03.apps.education.fr/index.php/s/Dcb6JkwL94bEKiC/download"
  },
  {
    id: "ch6v-situation-2",
    chapterId: "chapitre-6-volumes",
    sectionId: "situations",
    title: "Situation n°2",
    description: "Construction préau",
    icon: "🔨",
    visible: "true",
    order: 2,
    url: "https://nuage03.apps.education.fr/index.php/s/teizwcZHqHfkasn/download"
  },
  {
    id: "ch6v-situation-4",
    chapterId: "chapitre-6-volumes",
    sectionId: "situations",
    title: "Situation n°4",
    description: "Réalisation carport",
    icon: "🚗",
    visible: "true",
    order: 3,
    url: "https://nuage03.apps.education.fr/index.php/s/ibXpg9w5e3nqBbx/download"
  },
  {
    id: "ch6v-situation-6",
    chapterId: "chapitre-6-volumes",
    sectionId: "situations",
    title: "Situation n°6",
    description: "Étagère échelle",
    icon: "📚",
    visible: "true",
    order: 4,
    url: "https://nuage03.apps.education.fr/index.php/s/tdPMF4HCWJXT2TA/download"
  },
];

async function main() {
  console.log("Seed Nextcloud Resources v2 - avec icônes\n");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL non configurée");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Vider la table
  console.log("Suppression des anciennes ressources...");
  await sql`DELETE FROM resources`;

  // Insérer les ressources
  console.log("Insertion des nouvelles ressources...\n");

  for (const resource of allResources) {
    await db.insert(resources).values({
      id: resource.id,
      chapterId: resource.chapterId,
      sectionId: resource.sectionId,
      title: resource.title,
      description: resource.description,
      type: "pdf",
      url: resource.url,
      icon: resource.icon,
      visible: resource.visible as "true" | "false",
      order: resource.order,
      displayOrder: resource.order,
    });
    console.log(`  ✓ ${resource.icon} ${resource.title}`);
  }

  console.log(`\n✅ Terminé ! ${allResources.length} ressources insérées.`);
}

main().catch(console.error);
