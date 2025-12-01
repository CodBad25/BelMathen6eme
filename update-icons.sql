-- Icônes pour les cours
UPDATE resources SET icon = '📚' WHERE sectionId = 'cours';

-- Icônes pour les fiches techniques
UPDATE resources SET icon = '🔧' WHERE title LIKE '%Fiche technique%';

-- Icônes pour les aides techniques
UPDATE resources SET icon = '💡' WHERE title LIKE '%Aide technique%';

-- Icônes pour les feuilles de route
UPDATE resources SET icon = '📋' WHERE sectionId = 'feuille-route';

-- Icônes pour les exercices
UPDATE resources SET icon = '✏️' WHERE sectionId = 'exercices' OR title LIKE '%exercice%';

-- Icônes pour les vidéos
UPDATE resources SET icon = '🎥' WHERE type = 'video' OR sectionId = 'videos' OR title LIKE '%Vidéo%';

-- Icônes pour les situations et activités
UPDATE resources SET icon = '🎯' WHERE title LIKE '%Situation%' OR title LIKE '%activité%' OR sectionId = 'activites';

-- Icônes spécifiques
UPDATE resources SET icon = '🏠' WHERE title LIKE '%immobilier%';
UPDATE resources SET icon = '🥩' WHERE title LIKE '%cochon%';
UPDATE resources SET icon = '🛴' WHERE title LIKE '%trottinette%';
UPDATE resources SET icon = '🍎' WHERE title LIKE '%fruits%';
UPDATE resources SET icon = '💰' WHERE title LIKE '%Impôt%';
UPDATE resources SET icon = '📀' WHERE title LIKE '%DVD%';
UPDATE resources SET icon = '🎨' WHERE title LIKE '%Anamorphose%';
UPDATE resources SET icon = '🗺️' WHERE title LIKE '%Carte mentale%';

-- Icône par défaut pour les ressources sans icône
UPDATE resources SET icon = '📄' WHERE icon IS NULL OR icon = '';
