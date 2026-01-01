-- Exercices masqués (par défaut tout est visible, on stocke seulement les masqués)
CREATE TABLE IF NOT EXISTS "hiddenExercices" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "createdAt" timestamp DEFAULT now()
);
