/**
 * Script de seed pour peupler la base de données avec les ressources Nextcloud
 *
 * Usage: npx tsx scripts/seed-nextcloud.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import * as dotenv from "dotenv";

dotenv.config();

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

// Mapping des dossiers Nextcloud vers les chapitres de l'app
const chapterMapping: Record<string, string> = {
  "4° 1_PRIX": "chapitre-1",
  "4° 2_LONGUEURS": "chapitre-2",
  "4° 3_TEMPERATURES": "chapitre-3",
  "4° 4_FRACTIONS": "chapitre-3bis",
  "4° 5_CHANCE": "chapitre-4",
  "4° 6_AIRES": "chapitre-5",
  "4° 7_ANGLES": "chapitre-6-angles",
  "4° 8_VOLUMES": "chapitre-6-volumes",
};

// Mapping des sections Nextcloud vers les sections de l'app
function getSectionId(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes("cours") && !lower.includes("feuille")) return "cours";
  if (lower.includes("situation")) return "situations";
  if (lower.includes("feuille_de_route") || lower.includes("feuille de route")) return "feuille-route";
  if (lower.includes("fiches_techniques") || lower.includes("fiches techniques")) return "fiches-techniques";
  if (lower.includes("aides_techniques") || lower.includes("aides techniques")) return "aides-techniques";
  if (lower.includes("exercices_et_situations")) return "situations";
  if (lower.includes("autres") || lower.includes("exercices")) return "exercices";
  if (lower.includes("video")) return "videos";
  return "autres";
}

// Les ressources générées par nextcloud-share.ts
const nextcloudLinks = [
  {
    "fileName": "Cours sur les Prix 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Cours/Cours sur les Prix 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/mycFKzA5PGT8nAT/download"
  },
  {
    "fileName": "1- Situation - Prix immobilier a Lyon.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/1- Situation - Prix immobilier a Lyon.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/C4eCZBytPMJSaJk/download"
  },
  {
    "fileName": "2- Situation - Cote de cochon.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/2- Situation - Cote de cochon.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/KqH9LMyZ6nQXWrm/download"
  },
  {
    "fileName": "3- Situation - Location trottinette.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/3- Situation - Location trottinette.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/8WyPKdEqdyArmLa/download"
  },
  {
    "fileName": "4- Situation - Evolution Prix fruits et legumes.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/4- Situation - Evolution Prix fruits et legumes.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/BwYs86Fyc5oaANc/download"
  },
  {
    "fileName": "5- Situation - Impot sur le revenu.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/5- Situation - Impot sur le revenu.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/eLbWcHdxZszFfJW/download"
  },
  {
    "fileName": "6- Situation - Location de DVD.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/6- Situation - Location de DVD.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/mW9PP964eWT5r3p/download"
  },
  {
    "fileName": "7- Mise en place calcul litteral et resolution d'equations.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/7- Mise en place calcul litteral et resolution d'equations.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/oCrZL2wMXNarEwT/download"
  },
  {
    "fileName": "Feuille d'exercices Les Prix 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Exercices_et_situations/Feuille d'exercices Les Prix 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/Rf4EkW62sCpR6Dp/download"
  },
  {
    "fileName": "Feuille de route - PRIX 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Feuille_de_route/Feuille de route - PRIX 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/Wj83pMZNi2MfA9b/download"
  },
  {
    "fileName": "3.1- Aide technique n1 - Moyenne, mediane, etendue.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Fiches_techniques/3.1- Aide technique n1 - Moyenne, mediane, etendue.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/iqiXCrMp48NCYy6/download"
  },
  {
    "fileName": "3- Fiche technique n1 - Moyenne, mediane, etendue.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Fiches_techniques/3- Fiche technique n1 - Moyenne, mediane, etendue.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/2Xpz3KBNniKA3rM/download"
  },
  {
    "fileName": "4.1- Aide technique n2 - Proportionnalite, Pourcentages.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Fiches_techniques/4.1- Aide technique n2 - Proportionnalite, Pourcentages.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/dFdeHiBRrKqjdQ6/download"
  },
  {
    "fileName": "4- Fiche technique n2 - Proportionnalite, Pourcentages.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Fiches_techniques/4- Fiche technique n2 - Proportionnalite, Pourcentages.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/Gi2G6MiZf2CMpQR/download"
  },
  {
    "fileName": "5- Fiche technique n3 - Calcul litteral 1ere Partie.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 1_PRIX/Fiches_techniques/5- Fiche technique n3 - Calcul litteral 1ere Partie.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/crG5tjLExfXrkrC/download"
  },
  {
    "fileName": "Situation 1 - Infiniment grand infiniment petit puissances de 10.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_1.Situations/Situation 1 - Infiniment grand infiniment petit puissances de 10.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/QjGc7eMFx32AZDS/download"
  },
  {
    "fileName": "Situation 2 - Vitesse et calculs de distances.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_1.Situations/Situation 2 - Vitesse et calculs de distances.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/EBLipjCew8f3GBb/download"
  },
  {
    "fileName": "Feuille de route Longueur 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_2.Aides techniques/Feuille de route Longueur 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/CH7qaEqiyJBfN4C/download"
  },
  {
    "fileName": "Feuille exercices Les Longueurs 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_2.Aides techniques/Feuille exercices Les Longueurs 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/73RJbXJLPj3bpFH/download"
  },
  {
    "fileName": "Les Longueurs Cours 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_2.Aides techniques/Les Longueurs Cours 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/fnDPsZ7oQgYyEfp/download"
  },
  {
    "fileName": "Aide technique 6 Puissances de 10.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_3.Fiches techniques/Aide technique 6 Puissances de 10.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/TbdrPSNoZ6WK2HE/download"
  },
  {
    "fileName": "Fiche technique 6 Puissances de 10 et notation scientifique.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 2_LONGUEURS/4° LONGUEURS_3.Fiches techniques/Fiche technique 6 Puissances de 10 et notation scientifique.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/DKSpaTsqynobdgJ/download"
  },
  {
    "fileName": "Situation 1 Le froid arrive au Quebec.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_1.Situations/Situation 1 Le froid arrive au Quebec.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/afNYRQYzLtdEKXA/download"
  },
  {
    "fileName": "Situation 2 Degre Celsius et Degre Fahrenheit.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_1.Situations/Situation 2 Degre Celsius et Degre Fahrenheit.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/2GwJNtSftM7FW3x/download"
  },
  {
    "fileName": "Situation 3 Scratch Les temperatures 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_1.Situations/Situation 3 Scratch Les temperatures 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/9kMefP7TgQSE8S9/download"
  },
  {
    "fileName": "Situation 4 Temperature ressentie.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_1.Situations/Situation 4 Temperature ressentie.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/GNG7zLLazteDjjF/download"
  },
  {
    "fileName": "Aide technique 9 Nombres relatifs.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_3.Fiches techniques/Aide technique 9 Nombres relatifs.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/2WaZs7x9GczHoyr/download"
  },
  {
    "fileName": "Fiche technique 9 Operations de nombres relatifs.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_3.Fiches techniques/Fiche technique 9 Operations de nombres relatifs.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/6pmMZF7tpT2QEpC/download"
  },
  {
    "fileName": "Feuille exercices Les Temperatures 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 3_TEMPERATURES/4° TEMPERATURES_5.Autres/Feuille exercices Les Temperatures 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/yb5H6nK54j9846K/download"
  },
  {
    "fileName": "Aide technique 10 Generalites sur les fractions.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 4_FRACTIONS/4° FRACTIONS_1.Situations/Aide technique 10 Generalites sur les fractions.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/bLoAcc6yWafyXxw/download"
  },
  {
    "fileName": "Anamorphose Consignes.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 4_FRACTIONS/4° FRACTIONS_1.Situations/Anamorphose Consignes.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/QS6BnLz8scxSdRW/download"
  },
  {
    "fileName": "Anamorphose Fractions.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 4_FRACTIONS/4° FRACTIONS_1.Situations/Anamorphose Fractions.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/T6zXT29NEMCxKg8/download"
  },
  {
    "fileName": "Carte mentale Fractions.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 4_FRACTIONS/4° FRACTIONS_1.Situations/Carte mentale Fractions.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/Tab7a5FDZkfSnmd/download"
  },
  {
    "fileName": "Fiche technique 10 Generalites sur les fractions.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 4_FRACTIONS/4° FRACTIONS_1.Situations/Fiche technique 10 Generalites sur les fractions.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/H6YWpoZ2Yg5C7mQ/download"
  },
  {
    "fileName": "Activite De la vie courante aux probabilites.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 5_CHANCE/4° CHANCE_1.Situations/Activite De la vie courante aux probabilites.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/oWmmqLbd9ECPqZR/download"
  },
  {
    "fileName": "Feuille de route CHANCE 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 5_CHANCE/4° CHANCE_1.Situations/Feuille de route CHANCE 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/EDoZxyNCyd4mkYG/download"
  },
  {
    "fileName": "Version eleve Chance.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 5_CHANCE/4° CHANCE_1.Situations/Version eleve Chance.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/ZTkLb9SdZgME7nP/download"
  },
  {
    "fileName": "Situation 1 Somme aires carres Theoreme Pythagore.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_1.Situations/Situation 1 Somme aires carres Theoreme Pythagore.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/kaZPZEzxycYd9wA/download"
  },
  {
    "fileName": "Situation 3 Pose store banne.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_1.Situations/Situation 3 Pose store banne.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/ztwEbHRqRCeLqQ5/download"
  },
  {
    "fileName": "Aide technique 10 Theoreme de Pythagore.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_3.Fiches techniques/Aide technique 10 Theoreme de Pythagore.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/GHGiEaGc3goTrne/download"
  },
  {
    "fileName": "Carte mentale Pythagore.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_3.Fiches techniques/Carte mentale Pythagore.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/ReZ9kwW3fqdGPzC/download"
  },
  {
    "fileName": "Fiche technique 10 Theoreme de Pythagore.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_3.Fiches techniques/Fiche technique 10 Theoreme de Pythagore.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/CQoQmiCxRPWGrkY/download"
  },
  {
    "fileName": "Feuille de route AIRE 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_5.Autres/Feuille de route AIRE 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/sErNw7CjntmMaby/download"
  },
  {
    "fileName": "Feuille exercices Les Aires 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_5.Autres/Feuille exercices Les Aires 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/i2YDr5PXfkk89AH/download"
  },
  {
    "fileName": "Version eleve AIRES.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 6_AIRES/4° AIRES_5.Autres/Version eleve AIRES.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/itr9t5mdGjmFEHx/download"
  },
  {
    "fileName": "Aide technique 14 Cosinus angle.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 7_ANGLES/4° ANGLES_3.Fiches techniques/Aide technique 14 Cosinus angle.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/YDpZ5Qtk9BmgCnA/download"
  },
  {
    "fileName": "Fiche technique 14 Cosinus angle.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 7_ANGLES/4° ANGLES_3.Fiches techniques/Fiche technique 14 Cosinus angle.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/FwLBg2nWXEWeLLf/download"
  },
  {
    "fileName": "Feuille de route Angles 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 7_ANGLES/4° ANGLES_5.Autres/Feuille de route Angles 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/dgtnLzknTKwyXxD/download"
  },
  {
    "fileName": "Feuille exercices Les Angles 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 7_ANGLES/4° ANGLES_5.Autres/Feuille exercices Les Angles 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/TBdk5cd44J6wps6/download"
  },
  {
    "fileName": "Situation 1 Construction preau et normes.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_1.Situations/Situation 1 Construction preau et normes.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/Dcb6JkwL94bEKiC/download"
  },
  {
    "fileName": "Situation 2 Construction preau.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_1.Situations/Situation 2 Construction preau.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/teizwcZHqHfkasn/download"
  },
  {
    "fileName": "Situation 4 Realisation carport.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_1.Situations/Situation 4 Realisation carport.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/ibXpg9w5e3nqBbx/download"
  },
  {
    "fileName": "Situation 6 Etagere echelle.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_1.Situations/Situation 6 Etagere echelle.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/tdPMF4HCWJXT2TA/download"
  },
  {
    "fileName": "Feuille exercices Volumes.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_5.Autres/Feuille exercices Volumes.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/3GadgYbWyZwaTpY/download"
  },
  {
    "fileName": "Plan de travail VOLUME 4e.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_5.Autres/Plan de travail VOLUME 4e.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/gEB7jH7ngm2ezen/download"
  },
  {
    "fileName": "Version eleve VOLUMES Complet.pdf",
    "originalPath": "/MES COURS/4EME/Maths_4e_Nextcloud/4° 8_VOLUMES/4° VOLUMES_5.Autres/Version eleve VOLUMES Complet.pdf",
    "publicUrl": "https://nuage03.apps.education.fr/index.php/s/G4FbtAHnGemYJRb/download"
  }
];

function getChapterId(path: string): string {
  for (const [folder, chapterId] of Object.entries(chapterMapping)) {
    if (path.includes(folder)) {
      return chapterId;
    }
  }
  return "unknown";
}

function cleanTitle(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/^\d+[-\s]*/, "") // Remove leading numbers
    .replace(/_/g, " ")
    .trim();
}

function generateId(chapterId: string, sectionId: string, index: number): string {
  return `${chapterId}-${sectionId}-${index}`;
}

async function main() {
  console.log("Seed Nextcloud Resources\n");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL non configuree");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Vider la table
  console.log("Suppression des anciennes ressources...");
  await sql`DELETE FROM resources`;

  // Grouper par chapitre/section pour l'ordre
  const grouped: Record<string, Record<string, typeof nextcloudLinks>> = {};

  for (const link of nextcloudLinks) {
    const chapterId = getChapterId(link.originalPath);
    const sectionId = getSectionId(link.originalPath);

    if (!grouped[chapterId]) grouped[chapterId] = {};
    if (!grouped[chapterId][sectionId]) grouped[chapterId][sectionId] = [];
    grouped[chapterId][sectionId].push(link);
  }

  // Insérer les ressources
  let totalInserted = 0;

  for (const [chapterId, sections] of Object.entries(grouped)) {
    console.log(`\nChapitre: ${chapterId}`);

    for (const [sectionId, files] of Object.entries(sections)) {
      console.log(`  Section: ${sectionId} (${files.length} fichiers)`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = generateId(chapterId, sectionId, i + 1);
        const title = cleanTitle(file.fileName);

        await db.insert(resources).values({
          id,
          chapterId,
          sectionId,
          title,
          description: null,
          type: "pdf",
          url: file.publicUrl,
          icon: null,
          visible: "true", // Visible par defaut
          order: i + 1,
          displayOrder: i + 1,
        });

        totalInserted++;
      }
    }
  }

  console.log(`\nTermine ! ${totalInserted} ressources inserees.`);
}

main().catch(console.error);
