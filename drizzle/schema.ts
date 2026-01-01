import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Ressources pédagogiques
export const typeEnum = pgEnum("type", ["pdf", "video", "link"]);
export const visibleEnum = pgEnum("visible", ["true", "false"]);

export const resources = pgTable("resources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  sectionId: varchar("sectionId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: typeEnum("type").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  visible: visibleEnum("visible").default("false").notNull(),
  // Visibilité par classe (4 classes max)
  visible6A: visibleEnum("visible6A").default("true").notNull(),
  visible6B: visibleEnum("visible6B").default("true").notNull(),
  visible6C: visibleEnum("visible6C").default("true").notNull(),
  visible6D: visibleEnum("visible6D").default("true").notNull(),
  order: integer("order").notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  // Lien vers la correction associée (nullable)
  correctionId: varchar("correctionId", { length: 64 }),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// Statistiques du site
export const stats = pgTable("stats", {
  id: varchar("id", { length: 64 }).primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: integer("value").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Stat = typeof stats.$inferSelect;

// JAMP (J'Apprends à Mi-Parcours) - Simplifié : 1 JAMP = 1 contenu
export const jampTypeEnum = pgEnum("jampType", ["Méthode", "Définition", "Formule", "Propriété", "Astuce"]);
export const jampContentTypeEnum = pgEnum("jampContentType", ["image", "video", "pdf"]);

export const jamps = pgTable("jamps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  type: jampTypeEnum("type").notNull(),
  icon: text("icon").default("📚"),
  description: text("description"),
  // Contenu direct (plus de slides)
  contentType: jampContentTypeEnum("contentType"),
  contentUrl: text("contentUrl"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Jamp = typeof jamps.$inferSelect;
export type InsertJamp = typeof jamps.$inferInsert;

// Exercices masqués (par défaut tout est visible, on stocke seulement les masqués)
export const hiddenExercices = pgTable("hiddenExercices", {
  id: varchar("id", { length: 128 }).primaryKey(), // Format: "chapitre-2-prix/etude-1/ex1"
  createdAt: timestamp("createdAt").defaultNow(),
});

export type HiddenExercice = typeof hiddenExercices.$inferSelect;
