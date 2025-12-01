import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { resources } from "../drizzle/schema";
import { randomUUID } from "crypto";

// URL de la base de données directement
const DATABASE_URL = "postgresql://neondb_owner:npg_IjlHg46BDZwp@ep-polished-bar-ageapmn1-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Structure des ressources à créer (basée sur tes vrais dossiers Nextcloud)
const seedData = [
  // CHAPITRE 1 - LES ANGLES
  { chapterId: "chapitre-1-angles", sectionId: "introduction", title: "Présentation du chapitre", icon: "🎯", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-1", title: "Cours - Comparer des angles", icon: "📖", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-1", title: "Exercices - Comparer des angles", icon: "✏️", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-2", title: "Cours - Multiplier et diviser des angles", icon: "📖", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-2", title: "Exercices - Multiplier et diviser des angles", icon: "✏️", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-3", title: "Cours - Mesurer des angles", icon: "📖", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "etude-3", title: "Exercices - Mesurer des angles", icon: "✏️", type: "pdf" as const, displayOrder: 0 },
  { chapterId: "chapitre-1-angles", sectionId: "activite-rapide", title: "Activité rapide n°1", icon: "⚡", type: "pdf" as const, displayOrder: 0 },

  // CHAPITRE 2 - LES PRIX
  { chapterId: "chapitre-2-prix", sectionId: "introduction", title: "Présentation du chapitre", icon: "🎯", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-1", title: "Cours - Comparer des prix", icon: "📖", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-1", title: "Exercices - Comparer des prix", icon: "✏️", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-2", title: "Cours - Calculer des prix", icon: "📖", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-2", title: "Exercices - Calculer des prix", icon: "✏️", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-3", title: "Cours - Partager des prix", icon: "📖", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "etude-3", title: "Exercices - Partager des prix", icon: "✏️", type: "pdf" as const, displayOrder: 1 },
  { chapterId: "chapitre-2-prix", sectionId: "activite-rapide", title: "Activité rapide n°1", icon: "⚡", type: "pdf" as const, displayOrder: 1 },

  // CHAPITRE 3 - LES AIRES
  { chapterId: "chapitre-3-aires", sectionId: "introduction", title: "Présentation du chapitre", icon: "🎯", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-1", title: "Cours - Comparer des aires", icon: "📖", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-1", title: "Exercices - Comparer des aires", icon: "✏️", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-2", title: "Cours - Mesurer une aire", icon: "📖", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-2", title: "Exercices - Mesurer une aire", icon: "✏️", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-3", title: "Cours - Calculer une aire", icon: "📖", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "etude-3", title: "Exercices - Calculer une aire", icon: "✏️", type: "pdf" as const, displayOrder: 2 },
  { chapterId: "chapitre-3-aires", sectionId: "activite-rapide", title: "Activité rapide n°1", icon: "⚡", type: "pdf" as const, displayOrder: 2 },

  // CHAPITRE 4 - LES DURÉES
  { chapterId: "chapitre-4-durees", sectionId: "introduction", title: "Présentation du chapitre", icon: "🎯", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-1", title: "Cours - Comparer, additionner, soustraire des durées", icon: "📖", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-1", title: "Exercices - Comparer, additionner, soustraire des durées", icon: "✏️", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-2", title: "Cours - Multiplier et diviser des durées", icon: "📖", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-2", title: "Exercices - Multiplier et diviser des durées", icon: "✏️", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-3", title: "Cours - Calculer des horaires, des dates ou des durées", icon: "📖", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "etude-3", title: "Exercices - Calculer des horaires, des dates ou des durées", icon: "✏️", type: "pdf" as const, displayOrder: 3 },
  { chapterId: "chapitre-4-durees", sectionId: "activite-rapide", title: "Activité rapide n°1", icon: "⚡", type: "pdf" as const, displayOrder: 3 },

  // CHAPITRE 5 - LES VOLUMES (4 études)
  { chapterId: "chapitre-5-volumes", sectionId: "introduction", title: "Présentation du chapitre", icon: "🎯", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-1", title: "Cours - Comparer des volumes", icon: "📖", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-1", title: "Exercices - Comparer des volumes", icon: "✏️", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-2", title: "Cours - Rapport entre les volumes", icon: "📖", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-2", title: "Exercices - Rapport entre les volumes", icon: "✏️", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-3", title: "Cours - Mesurer un volume", icon: "📖", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-3", title: "Exercices - Mesurer un volume", icon: "✏️", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-4", title: "Cours - Calculer un volume", icon: "📖", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "etude-4", title: "Exercices - Calculer un volume", icon: "✏️", type: "pdf" as const, displayOrder: 4 },
  { chapterId: "chapitre-5-volumes", sectionId: "activite-rapide", title: "Activité rapide n°1", icon: "⚡", type: "pdf" as const, displayOrder: 4 },
];

async function seed() {
  console.log("Seeding resources...");

  const resourcesToInsert = seedData.map((item) => ({
    id: randomUUID(),
    chapterId: item.chapterId,
    sectionId: item.sectionId,
    title: item.title,
    description: null,
    type: item.type,
    url: "https://example.com/placeholder.pdf", // URL placeholder - à remplacer
    icon: item.icon,
    visible: "true" as const, // Visible pour voir la structure
    order: 0,
    displayOrder: item.displayOrder,
    correctionId: null,
  }));

  try {
    await db.insert(resources).values(resourcesToInsert);
    console.log(`✅ ${resourcesToInsert.length} ressources créées avec succès!`);
  } catch (error) {
    console.error("Erreur lors du seeding:", error);
    process.exit(1);
  }
}

seed();
