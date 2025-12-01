import { eq } from "drizzle-orm";
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
import { resources, InsertResource, Resource, stats } from "../drizzle/schema";

export async function getAllResources(): Promise<Resource[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resources);
}

export async function updateResourceVisibility(id: string, visible: "true" | "false"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(resources).set({ visible }).where(eq(resources.id, id));
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

