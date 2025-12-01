/**
 * Script de seed complet avec tous les chapitres
 *
 * INSTRUCTIONS:
 * 1. Remplacez les URLs "TODO_URL_..." par vos liens Nextcloud
 * 2. Exécutez: npx tsx scripts/seed-complete.ts
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import "dotenv/config";

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

// ============================================================
// DONNÉES - Remplacez les TODO_URL par vos liens Nextcloud
// ============================================================

const allResources = [
  // ========== CHAPITRE 1 - LES PRIX ==========
  {
    id: "ch1-feuille-route",
    chapterId: "chapitre-1",
    sectionId: "feuille-route",
    title: "Feuille de route - PRIX 4e",
    description: "Document de présentation du chapitre",
    type: "pdf" as const,
    url: "TODO_URL_ch1_feuille_route",
    icon: "📋",
    visible: "false" as const,
    order: 1,
    displayOrder: 1,
  },
  {
    id: "ch1-cours",
    chapterId: "chapitre-1",
    sectionId: "cours",
    title: "Les Prix - Cours 4e",
    description: "Cours complet",
    type: "pdf" as const,
    url: "TODO_URL_ch1_cours",
    icon: "📚",
    visible: "false" as const,
    order: 1,
    displayOrder: 1,
  },
  {
    id: "ch1-fiche-1",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°1",
    description: "Moyenne, médiane, étendue",
    type: "pdf" as const,
    url: "TODO_URL_ch1_fiche_1",
    icon: "🔧",
    visible: "false" as const,
    order: 1,
    displayOrder: 1,
  },
  {
    id: "ch1-aide-1",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Aide technique n°1",
    description: "Moyenne, médiane, étendue",
    type: "pdf" as const,
    url: "TODO_URL_ch1_aide_1",
    icon: "💡",
    visible: "false" as const,
    order: 2,
    displayOrder: 1,
  },
  {
    id: "ch1-fiche-2",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°2",
    description: "Proportionnalité, Pourcentages",
    type: "pdf" as const,
    url: "TODO_URL_ch1_fiche_2",
    icon: "🔧",
    visible: "false" as const,
    order: 3,
    displayOrder: 1,
  },
  {
    id: "ch1-aide-2",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Aide technique n°2",
    description: "Proportionnalité, Pourcentages",
    type: "pdf" as const,
    url: "TODO_URL_ch1_aide_2",
    icon: "💡",
    visible: "false" as const,
    order: 4,
    displayOrder: 1,
  },
  {
    id: "ch1-fiche-3",
    chapterId: "chapitre-1",
    sectionId: "fiches-techniques",
    title: "Fiche technique n°3",
    description: "Calcul littéral 1ère Partie",
    type: "pdf" as const,
    url: "TODO_URL_ch1_fiche_3",
    icon: "🔧",
    visible: "false" as const,
    order: 5,
    displayOrder: 1,
  },
  {
    id: "ch1-exercices",
    chapterId: "chapitre-1",
    sectionId: "exercices",
    title: "Feuille d'exercices Les Prix 4e",
    description: "Exercices d'application",
    type: "pdf" as const,
    url: "TODO_URL_ch1_exercices",
    icon: "✏️",
    visible: "false" as const,
    order: 1,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-1",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°1",
    description: "Prix immobilier à Lyon",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_1",
    icon: "🏠",
    visible: "false" as const,
    order: 1,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-2",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°2",
    description: "Côte de cochon",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_2",
    icon: "🥩",
    visible: "false" as const,
    order: 2,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-3",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°3",
    description: "Location trottinette",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_3",
    icon: "🛴",
    visible: "false" as const,
    order: 3,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-4",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°4",
    description: "Évolution Prix fruits et légumes",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_4",
    icon: "🍎",
    visible: "false" as const,
    order: 4,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-5",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°5",
    description: "Impôt sur le revenu",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_5",
    icon: "💰",
    visible: "false" as const,
    order: 5,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-6",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°6",
    description: "Location de DVD",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_6",
    icon: "📀",
    visible: "false" as const,
    order: 6,
    displayOrder: 1,
  },
  {
    id: "ch1-situation-7",
    chapterId: "chapitre-1",
    sectionId: "activites",
    title: "Situation n°7",
    description: "Mise en place calcul littéral et résolution d'équations",
    type: "pdf" as const,
    url: "TODO_URL_ch1_situation_7",
    icon: "🎯",
    visible: "false" as const,
    order: 7,
    displayOrder: 1,
  },

  // ========== CHAPITRE 2 - LES LONGUEURS ==========
  {
    id: "ch2-cours",
    chapterId: "chapitre-2",
    sectionId: "cours",
    title: "Les Longueurs - Cours",
    description: "Cours complet sur les longueurs",
    type: "pdf" as const,
    url: "TODO_URL_ch2_cours",
    icon: "📚",
    visible: "false" as const,
    order: 1,
    displayOrder: 2,
  },
  {
    id: "ch2-fiche-1",
    chapterId: "chapitre-2",
    sectionId: "fiches-techniques",
    title: "Fiche technique",
    description: "Fiche technique sur les longueurs",
    type: "pdf" as const,
    url: "TODO_URL_ch2_fiche",
    icon: "🔧",
    visible: "false" as const,
    order: 1,
    displayOrder: 2,
  },
  {
    id: "ch2-aide-1",
    chapterId: "chapitre-2",
    sectionId: "fiches-techniques",
    title: "Aide technique",
    description: "Aide technique sur les longueurs",
    type: "pdf" as const,
    url: "TODO_URL_ch2_aide",
    icon: "💡",
    visible: "false" as const,
    order: 2,
    displayOrder: 2,
  },
  {
    id: "ch2-situations",
    chapterId: "chapitre-2",
    sectionId: "activites",
    title: "Situations et activités",
    description: "Activités sur les longueurs",
    type: "pdf" as const,
    url: "TODO_URL_ch2_situations",
    icon: "🎯",
    visible: "false" as const,
    order: 1,
    displayOrder: 2,
  },
  {
    id: "ch2-video-1",
    chapterId: "chapitre-2",
    sectionId: "videos",
    title: "Vidéo du chapitre n°2",
    description: "Vidéo explicative",
    type: "video" as const,
    url: "TODO_URL_ch2_video",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 2,
  },

  // ========== CHAPITRE 3 - LES TEMPÉRATURES ==========
  {
    id: "ch3-fiche-1",
    chapterId: "chapitre-3",
    sectionId: "fiches-techniques",
    title: "Fiche technique",
    description: "Fiche technique sur les températures",
    type: "pdf" as const,
    url: "TODO_URL_ch3_fiche",
    icon: "🔧",
    visible: "false" as const,
    order: 1,
    displayOrder: 3,
  },
  {
    id: "ch3-aide-1",
    chapterId: "chapitre-3",
    sectionId: "fiches-techniques",
    title: "Aide technique",
    description: "Aide technique sur les températures",
    type: "pdf" as const,
    url: "TODO_URL_ch3_aide",
    icon: "💡",
    visible: "false" as const,
    order: 2,
    displayOrder: 3,
  },
  {
    id: "ch3-exercices",
    chapterId: "chapitre-3",
    sectionId: "exercices",
    title: "Feuille d'exercices + rituels",
    description: "Exercices sur les températures",
    type: "pdf" as const,
    url: "TODO_URL_ch3_exercices",
    icon: "✏️",
    visible: "false" as const,
    order: 1,
    displayOrder: 3,
  },
  {
    id: "ch3-situations",
    chapterId: "chapitre-3",
    sectionId: "activites",
    title: "Situations et activité",
    description: "Activités sur les températures",
    type: "pdf" as const,
    url: "TODO_URL_ch3_situations",
    icon: "🎯",
    visible: "false" as const,
    order: 1,
    displayOrder: 3,
  },
  {
    id: "ch3-video-1",
    chapterId: "chapitre-3",
    sectionId: "videos",
    title: "Vidéos du chapitre n°3",
    description: "Vidéos explicatives",
    type: "video" as const,
    url: "TODO_URL_ch3_video",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 3,
  },

  // ========== CHAPITRE 3BIS - LES FRACTIONS ==========
  {
    id: "ch3bis-anamorphose",
    chapterId: "chapitre-3bis",
    sectionId: "ressources",
    title: "Anamorphose Fractions",
    description: "Activité artistique sur les fractions",
    type: "pdf" as const,
    url: "TODO_URL_ch3bis_anamorphose",
    icon: "🎨",
    visible: "false" as const,
    order: 1,
    displayOrder: 4,
  },
  {
    id: "ch3bis-carte-mentale",
    chapterId: "chapitre-3bis",
    sectionId: "ressources",
    title: "Carte mentale sur les fractions",
    description: "Carte mentale récapitulative",
    type: "pdf" as const,
    url: "TODO_URL_ch3bis_carte_mentale",
    icon: "🗺️",
    visible: "false" as const,
    order: 2,
    displayOrder: 4,
  },
  {
    id: "ch3bis-videos",
    chapterId: "chapitre-3bis",
    sectionId: "videos",
    title: "Vidéos Fractions",
    description: "Vidéos explicatives sur les fractions",
    type: "video" as const,
    url: "TODO_URL_ch3bis_videos",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 4,
  },

  // ========== CHAPITRE 4 - CHANCE ==========
  {
    id: "ch4-cours",
    chapterId: "chapitre-4",
    sectionId: "cours",
    title: "Cours",
    description: "Cours sur les probabilités",
    type: "pdf" as const,
    url: "TODO_URL_ch4_cours",
    icon: "📚",
    visible: "false" as const,
    order: 1,
    displayOrder: 5,
  },
  {
    id: "ch4-videos",
    chapterId: "chapitre-4",
    sectionId: "videos",
    title: "Vidéos CHANCES",
    description: "Vidéos sur les probabilités",
    type: "video" as const,
    url: "TODO_URL_ch4_videos",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 5,
  },

  // ========== CHAPITRE 5 - LES AIRES ==========
  {
    id: "ch5-cours",
    chapterId: "chapitre-5",
    sectionId: "cours",
    title: "Cours",
    description: "Cours sur les aires",
    type: "pdf" as const,
    url: "TODO_URL_ch5_cours",
    icon: "📚",
    visible: "false" as const,
    order: 1,
    displayOrder: 6,
  },
  {
    id: "ch5-fiches",
    chapterId: "chapitre-5",
    sectionId: "fiches-techniques",
    title: "Fiches techniques",
    description: "Fiches techniques sur les aires",
    type: "pdf" as const,
    url: "TODO_URL_ch5_fiches",
    icon: "🔧",
    visible: "false" as const,
    order: 1,
    displayOrder: 6,
  },
  {
    id: "ch5-aides",
    chapterId: "chapitre-5",
    sectionId: "fiches-techniques",
    title: "Aides techniques",
    description: "Aides techniques sur les aires",
    type: "pdf" as const,
    url: "TODO_URL_ch5_aides",
    icon: "💡",
    visible: "false" as const,
    order: 2,
    displayOrder: 6,
  },
  {
    id: "ch5-situations",
    chapterId: "chapitre-5",
    sectionId: "activites",
    title: "Situations + Activités",
    description: "Activités sur les aires",
    type: "pdf" as const,
    url: "TODO_URL_ch5_situations",
    icon: "🎯",
    visible: "false" as const,
    order: 1,
    displayOrder: 6,
  },
  {
    id: "ch5-videos",
    chapterId: "chapitre-5",
    sectionId: "videos",
    title: "Vidéos AIRES",
    description: "Vidéos sur les aires",
    type: "video" as const,
    url: "TODO_URL_ch5_videos",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 6,
  },

  // ========== CHAPITRE 6 - LES ANGLES ==========
  {
    id: "ch6-angles-videos",
    chapterId: "chapitre-6-angles",
    sectionId: "videos",
    title: "Vidéos ANGLES",
    description: "Vidéos sur les angles",
    type: "video" as const,
    url: "TODO_URL_ch6_angles_videos",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 7,
  },

  // ========== CHAPITRE 6 - LES VOLUMES ==========
  {
    id: "ch6-volumes-cours",
    chapterId: "chapitre-6-volumes",
    sectionId: "cours",
    title: "Cours",
    description: "Cours sur les volumes",
    type: "pdf" as const,
    url: "TODO_URL_ch6_volumes_cours",
    icon: "📚",
    visible: "false" as const,
    order: 1,
    displayOrder: 8,
  },
  {
    id: "ch6-volumes-fiche",
    chapterId: "chapitre-6-volumes",
    sectionId: "fiches-techniques",
    title: "Fiche technique",
    description: "Fiche technique sur les volumes",
    type: "pdf" as const,
    url: "TODO_URL_ch6_volumes_fiche",
    icon: "🔧",
    visible: "false" as const,
    order: 1,
    displayOrder: 8,
  },
  {
    id: "ch6-volumes-aide",
    chapterId: "chapitre-6-volumes",
    sectionId: "fiches-techniques",
    title: "Aide technique",
    description: "Aide technique sur les volumes",
    type: "pdf" as const,
    url: "TODO_URL_ch6_volumes_aide",
    icon: "💡",
    visible: "false" as const,
    order: 2,
    displayOrder: 8,
  },
  {
    id: "ch6-volumes-situations",
    chapterId: "chapitre-6-volumes",
    sectionId: "activites",
    title: "Situations / Activités",
    description: "Activités sur les volumes",
    type: "pdf" as const,
    url: "TODO_URL_ch6_volumes_situations",
    icon: "🎯",
    visible: "false" as const,
    order: 1,
    displayOrder: 8,
  },
  {
    id: "ch6-volumes-videos",
    chapterId: "chapitre-6-volumes",
    sectionId: "videos",
    title: "Vidéos VOLUMES",
    description: "Vidéos sur les volumes",
    type: "video" as const,
    url: "TODO_URL_ch6_volumes_videos",
    icon: "🎥",
    visible: "false" as const,
    order: 1,
    displayOrder: 8,
  },
];

// ============================================================
// SCRIPT D'EXÉCUTION
// ============================================================

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL non définie dans .env");
    process.exit(1);
  }

  // Vérifier qu'il n'y a plus de TODO_URL
  const missingUrls = allResources.filter(r => r.url.startsWith("TODO_URL"));
  if (missingUrls.length > 0) {
    console.log("⚠️  URLs manquantes à compléter :");
    missingUrls.forEach(r => {
      console.log(`   - ${r.id}: ${r.url}`);
    });
    console.log("\n❌ Veuillez remplacer les TODO_URL par vos liens Nextcloud avant d'exécuter le script.");
    process.exit(1);
  }

  console.log("🌱 Initialisation de la base de données...\n");

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Supprimer les anciennes ressources
  console.log("🗑️  Suppression des anciennes ressources...");
  await db.delete(resources);

  // Insérer les nouvelles
  console.log(`📥 Insertion de ${allResources.length} ressources...`);

  for (const resource of allResources) {
    await db.insert(resources).values(resource);
    process.stdout.write(".");
  }

  console.log("\n\n✅ Base de données mise à jour avec succès !");
  console.log(`   ${allResources.length} ressources créées`);

  // Résumé par chapitre
  const chapters = new Map<string, number>();
  allResources.forEach(r => {
    chapters.set(r.chapterId, (chapters.get(r.chapterId) || 0) + 1);
  });

  console.log("\n📊 Résumé par chapitre:");
  chapters.forEach((count, chapterId) => {
    console.log(`   ${chapterId}: ${count} ressources`);
  });

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
