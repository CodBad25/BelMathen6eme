-- Script d'initialisation pour base de données PostgreSQL (Neon)
-- Maths 4e - Collège André Dulin

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table resources
CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(64) PRIMARY KEY,
  "chapterId" VARCHAR(64) NOT NULL,
  "sectionId" VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'link')),
  url TEXT NOT NULL,
  icon TEXT,
  visible VARCHAR(10) DEFAULT 'false' NOT NULL CHECK (visible IN ('true', 'false')),
  "order" INTEGER NOT NULL,
  "displayOrder" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_resources_chapter ON resources("chapterId");
CREATE INDEX IF NOT EXISTS idx_resources_visible ON resources(visible);
CREATE INDEX IF NOT EXISTS idx_resources_display_order ON resources("displayOrder");

-- Afficher les tables créées
\dt

