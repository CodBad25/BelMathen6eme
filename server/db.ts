import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Gestion des ressources pédagogiques
import { resources, InsertResource, Resource, stats, jamps, Jamp, InsertJamp, hiddenExercices } from "../drizzle/schema";

export async function getAllResources(): Promise<Resource[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resources);
}

export async function getRecentResources(days: number = 7): Promise<Resource[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const allResources = await db.select().from(resources);

  // Filter visible resources updated within the last N days
  return allResources
    .filter(r => r.visible === "true" && r.updatedAt && new Date(r.updatedAt) >= cutoffDate)
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    })
    .slice(0, 10); // Max 10 recent items
}

export async function updateResourceVisibility(id: string, visible: "true" | "false"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(resources).set({ visible }).where(eq(resources.id, id));
}

export async function updateClassVisibility(
  id: string,
  classe: "6A" | "6B" | "6C" | "6D",
  visible: "true" | "false"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const fieldMap = {
    "6A": { visible6A: visible },
    "6B": { visible6B: visible },
    "6C": { visible6C: visible },
    "6D": { visible6D: visible },
  };

  await db.update(resources).set(fieldMap[classe]).where(eq(resources.id, id));
}

export async function createResource(data: {
  chapterId: string;
  sectionId: string;
  title: string;
  description?: string;
  type: "pdf" | "video" | "link";
  url: string;
  icon?: string;
  visible: "true" | "false";
}): Promise<Resource> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { randomUUID } = await import("crypto");
  const newResource: InsertResource = {
    id: randomUUID(),
    ...data,
    order: 999, // Mettre à la fin par défaut
  };

  await db.insert(resources).values(newResource);
  return newResource as Resource;
}

export async function bulkCreateResources(resourceList: InsertResource[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(resources).values(resourceList);
}

export async function toggleChapterVisibility(chapterId: string, visible: "true" | "false"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(resources).set({ visible }).where(eq(resources.chapterId, chapterId));
}


export async function updateResource(data: {
  id: string;
  title?: string;
  url?: string;
  visible?: "true" | "false";
}): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(resources).set(updates).where(eq(resources.id, id));
  return { success: true };
}

export async function deleteResource(id: string): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(resources).where(eq(resources.id, id));
  return { success: true };
}



export async function updateChapterOrder(chapterOrder: string[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Mettre à jour displayOrder pour chaque chapitre
  for (let i = 0; i < chapterOrder.length; i++) {
    const chapterId = chapterOrder[i];
    await db
      .update(resources)
      .set({ displayOrder: i })
      .where(eq(resources.chapterId, chapterId));
  }

  return { success: true };
}

export async function moveResourceToChapter(resourceId: string, newChapterId: string): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(resources).set({ chapterId: newChapterId }).where(eq(resources.id, resourceId));
  return { success: true };
}

export async function setCorrectionForResource(resourceId: string, correctionId: string | null): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(resources).set({ correctionId }).where(eq(resources.id, resourceId));
  return { success: true };
}

// Gestion des statistiques
export async function getVisitCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.select().from(stats).where(eq(stats.key, "visit_count")).limit(1);
    return result.length > 0 ? result[0].value : 0;
  } catch {
    return 0;
  }
}

export async function incrementVisitCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const existing = await db.select().from(stats).where(eq(stats.key, "visit_count")).limit(1);

    if (existing.length === 0) {
      const { randomUUID } = await import("crypto");
      await db.insert(stats).values({
        id: randomUUID(),
        key: "visit_count",
        value: 1,
        updatedAt: new Date(),
      });
      return 1;
    } else {
      const newValue = existing[0].value + 1;
      await db.update(stats).set({ value: newValue, updatedAt: new Date() }).where(eq(stats.key, "visit_count"));
      return newValue;
    }
  } catch (error) {
    console.error("[Database] Failed to increment visit count:", error);
    return 0;
  }
}

// ========== JAMP Functions (Simplifié: 1 JAMP = 1 contenu) ==========

export async function getAllJamps(): Promise<Jamp[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jamps).orderBy(asc(jamps.displayOrder));
}

export async function getJampsByChapter(chapterId: string): Promise<Jamp[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jamps)
    .where(eq(jamps.chapterId, chapterId))
    .orderBy(asc(jamps.displayOrder));
}

export async function getJampById(id: string): Promise<Jamp | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(jamps).where(eq(jamps.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createJamp(data: {
  chapterId: string;
  title: string;
  type: "Méthode" | "Définition" | "Formule" | "Propriété" | "Astuce";
  icon?: string;
  description?: string;
  contentType?: "image" | "video" | "pdf";
  contentUrl?: string;
}): Promise<Jamp> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { randomUUID } = await import("crypto");

  // Get max displayOrder for this chapter
  const existing = await db.select().from(jamps)
    .where(eq(jamps.chapterId, data.chapterId))
    .orderBy(asc(jamps.displayOrder));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map(j => j.displayOrder)) : -1;

  const newJamp: InsertJamp = {
    id: randomUUID(),
    chapterId: data.chapterId,
    title: data.title,
    type: data.type,
    icon: data.icon || "📚",
    description: data.description || null,
    contentType: data.contentType || null,
    contentUrl: data.contentUrl || null,
    displayOrder: maxOrder + 1,
    visible: true,
  };

  await db.insert(jamps).values(newJamp);
  return newJamp as Jamp;
}

export async function updateJamp(data: {
  id: string;
  title?: string;
  type?: "Méthode" | "Définition" | "Formule" | "Propriété" | "Astuce";
  icon?: string;
  description?: string;
  contentType?: "image" | "video" | "pdf";
  contentUrl?: string;
  visible?: boolean;
  displayOrder?: number;
}): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id, ...updates } = data;
  await db.update(jamps).set(updates).where(eq(jamps.id, id));
  return { success: true };
}

export async function deleteJamp(id: string): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jamps).where(eq(jamps.id, id));
  return { success: true };
}

// ========== Settings Functions (utilise la table stats pour stocker les settings) ==========

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(stats).where(eq(stats.key, key)).limit(1);
    if (result.length > 0) {
      // La valeur est stockée comme un entier, mais on peut encoder des strings comme JSON
      // Pour les classes actives, on stocke un bitmask ou on utilise une autre approche
      return String(result[0].value);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getActiveClasses(): Promise<string[]> {
  const db = await getDb();
  if (!db) return ["6A", "6B", "6C", "6D"]; // Par défaut toutes actives

  try {
    const result = await db.select().from(stats).where(eq(stats.key, "active_classes")).limit(1);
    if (result.length > 0) {
      // Stocké comme bitmask: 1=6A, 2=6B, 4=6C, 8=6D
      const bitmask = result[0].value;
      const classes: string[] = [];
      if (bitmask & 1) classes.push("6A");
      if (bitmask & 2) classes.push("6B");
      if (bitmask & 4) classes.push("6C");
      if (bitmask & 8) classes.push("6D");
      return classes.length > 0 ? classes : ["6A", "6B", "6C", "6D"];
    }
    return ["6A", "6B", "6C", "6D"]; // Par défaut
  } catch {
    return ["6A", "6B", "6C", "6D"];
  }
}

export async function setActiveClasses(classes: string[]): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convertir en bitmask: 1=6A, 2=6B, 4=6C, 8=6D
  let bitmask = 0;
  if (classes.includes("6A")) bitmask |= 1;
  if (classes.includes("6B")) bitmask |= 2;
  if (classes.includes("6C")) bitmask |= 4;
  if (classes.includes("6D")) bitmask |= 8;

  try {
    const existing = await db.select().from(stats).where(eq(stats.key, "active_classes")).limit(1);

    if (existing.length === 0) {
      const { randomUUID } = await import("crypto");
      await db.insert(stats).values({
        id: randomUUID(),
        key: "active_classes",
        value: bitmask,
        updatedAt: new Date(),
      });
    } else {
      await db.update(stats).set({ value: bitmask, updatedAt: new Date() }).where(eq(stats.key, "active_classes"));
    }
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to set active classes:", error);
    throw error;
  }
}

// ========== Exercices cachés ==========

export async function getHiddenExercices(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(hiddenExercices);
    return result.map(r => r.id);
  } catch {
    return [];
  }
}

export async function toggleExerciceVisibility(exerciceId: string): Promise<{ hidden: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Vérifier si l'exercice est déjà masqué
    const existing = await db.select().from(hiddenExercices).where(eq(hiddenExercices.id, exerciceId)).limit(1);

    if (existing.length > 0) {
      // Il est masqué, on le rend visible (on supprime)
      await db.delete(hiddenExercices).where(eq(hiddenExercices.id, exerciceId));
      return { hidden: false };
    } else {
      // Il est visible, on le masque (on ajoute)
      await db.insert(hiddenExercices).values({ id: exerciceId });
      return { hidden: true };
    }
  } catch (error) {
    console.error("[Database] Failed to toggle exercice visibility:", error);
    throw error;
  }
}

