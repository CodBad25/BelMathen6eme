import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { resources } from "../drizzle/schema";
import { eq, and, like } from "drizzle-orm";
import { randomUUID } from "crypto";

const DATABASE_URL = "postgresql://neondb_owner:npg_IjlHg46BDZwp@ep-polished-bar-ageapmn1-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function fixActivitesRapides() {
  console.log("Fixing activités rapides for chapitre-2-prix...");

  // 1. Récupérer toutes les ressources de la section activite-rapide du chapitre 2
  const existingResources = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.chapterId, "chapitre-2-prix"),
        eq(resources.sectionId, "activite-rapide")
      )
    );

  console.log(`Found ${existingResources.length} existing resources:`);
  existingResources.forEach(r => console.log(`  - ${r.title} (${r.url})`));

  // 2. Supprimer toutes les anciennes ressources de cette section
  await db.delete(resources).where(
    and(
      eq(resources.chapterId, "chapitre-2-prix"),
      eq(resources.sectionId, "activite-rapide")
    )
  );
  console.log("Deleted all old resources for this section.");

  // 3. Insérer les nouvelles ressources avec les bonnes URLs
  const newResources = [
    { title: "Séquence n°1", url: "/activites-rapides/prix/sequence-1.pdf", order: 1 },
    { title: "Séquence n°2", url: "/activites-rapides/prix/sequence-2.pdf", order: 2 },
    { title: "Séquence n°3", url: "/activites-rapides/prix/sequence-3.pdf", order: 3 },
    { title: "Séquence n°4", url: "/activites-rapides/prix/sequence-4.pdf", order: 4 },
    { title: "Séquence n°5", url: "/activites-rapides/prix/sequence-5.pdf", order: 5 },
    { title: "Séquence n°6", url: "/activites-rapides/prix/sequence-6.pdf", order: 6 },
    { title: "Séquence n°7", url: "/activites-rapides/prix/sequence-7.pdf", order: 7 },
    { title: "Séquence notée", url: "/activites-rapides/prix/sequence-notee.pdf", order: 8 },
  ];

  const resourcesToInsert = newResources.map((item) => ({
    id: randomUUID(),
    chapterId: "chapitre-2-prix",
    sectionId: "activite-rapide",
    title: item.title,
    description: null,
    type: "pdf" as const,
    url: item.url,
    icon: "⚡",
    visible: "true" as const,
    order: item.order,
    displayOrder: 1,
    correctionId: null,
  }));

  await db.insert(resources).values(resourcesToInsert);
  console.log(`✅ ${resourcesToInsert.length} nouvelles ressources créées!`);

  // Vérifier le résultat
  const finalResources = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.chapterId, "chapitre-2-prix"),
        eq(resources.sectionId, "activite-rapide")
      )
    );

  console.log("\nFinal resources:");
  finalResources.forEach(r => console.log(`  - ${r.title}: ${r.url}`));
}

fixActivitesRapides().catch(console.error);
