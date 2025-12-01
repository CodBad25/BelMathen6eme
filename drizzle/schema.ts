import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
