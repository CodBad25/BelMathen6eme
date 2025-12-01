/**
 * Script pour créer des liens publics Nextcloud pour tous les fichiers d'un dossier
 *
 * Usage:
 * 1. Créez un mot de passe d'application dans Nextcloud (Paramètres → Sécurité)
 * 2. Configurez les variables ci-dessous
 * 3. Exécutez: npx tsx scripts/nextcloud-share.ts
 */

// ============ CONFIGURATION À MODIFIER ============
const CONFIG = {
  // URL de votre Nextcloud (sans / à la fin)
  nextcloudUrl: "https://nuage03.apps.education.fr",

  // Votre nom d'utilisateur Nextcloud
  username: "belhaj mohamed",

  // Mot de passe d'application (Paramètres → Sécurité → Mots de passe d'application)
  appPassword: "n45t6-KF9LS-K4Zqp-CExzs-THMJT",

  // Chemin du dossier contenant les PDFs (depuis la racine de votre Nextcloud)
  // Exemple: "/Documents/Maths-4e" ou "/Cours/2024-2025/Maths"
  folderPath: "/MES COURS/4EME/Maths_4e_Nextcloud",
};
// ==================================================

import * as fs from "fs";
import * as path from "path";

interface FileInfo {
  name: string;
  path: string;
  type: "file" | "directory";
}

interface ShareResult {
  fileName: string;
  originalPath: string;
  publicUrl: string;
  error?: string;
}

async function makeRequest(endpoint: string, method: string = "GET", body?: string): Promise<any> {
  const auth = Buffer.from(`${CONFIG.username}:${CONFIG.appPassword}`).toString("base64");

  const response = await fetch(`${CONFIG.nextcloudUrl}${endpoint}`, {
    method,
    headers: {
      "Authorization": `Basic ${auth}`,
      "OCS-APIRequest": "true",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function listFilesInFolder(folderPath: string): Promise<{ files: FileInfo[], subdirs: string[] }> {
  const auth = Buffer.from(`${CONFIG.username}:${CONFIG.appPassword}`).toString("base64");
  const encodedUsername = encodeURIComponent(CONFIG.username);

  const response = await fetch(`${CONFIG.nextcloudUrl}/remote.php/dav/files/${encodedUsername}${encodeURIComponent(folderPath).replace(/%2F/g, "/")}`, {
    method: "PROPFIND",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Depth": "1",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
      <d:propfind xmlns:d="DAV:">
        <d:prop>
          <d:resourcetype/>
          <d:displayname/>
        </d:prop>
      </d:propfind>`,
  });

  if (!response.ok) {
    throw new Error(`Impossible de lister le dossier: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const files: FileInfo[] = [];
  const subdirs: string[] = [];

  // Parse XML responses
  const responseMatches = xml.split("<d:response>").slice(1);

  for (const resp of responseMatches) {
    const hrefMatch = resp.match(/<d:href>([^<]+)<\/d:href>/);
    if (!hrefMatch) continue;

    const href = decodeURIComponent(hrefMatch[1]);
    const filePath = href.replace(`/remote.php/dav/files/${encodeURIComponent(CONFIG.username).replace(/%20/g, " ")}`, "");
    const cleanPath = filePath.replace(/\/$/, "");

    // Ignorer le dossier courant
    if (cleanPath === folderPath || cleanPath === folderPath.replace(/\/$/, "")) continue;

    const isDirectory = resp.includes("<d:collection/>");
    const name = cleanPath.split("/").filter(Boolean).pop() || "";

    if (isDirectory) {
      subdirs.push(cleanPath);
    } else if (name && (name.toLowerCase().endsWith(".pdf"))) {
      files.push({
        name,
        path: cleanPath,
        type: "file",
      });
    }
  }

  return { files, subdirs };
}

async function listAllPDFs(rootPath: string): Promise<FileInfo[]> {
  const allFiles: FileInfo[] = [];

  // Niveau 1: dossier racine (chapitres)
  const { files: rootFiles, subdirs: chapters } = await listFilesInFolder(rootPath);
  allFiles.push(...rootFiles);

  // Niveau 2: chapitres (contiennent sections)
  for (const chapter of chapters) {
    const chapterName = chapter.split("/").pop();
    console.log(`  📂 ${chapterName}`);

    const { files: chapterFiles, subdirs: sections } = await listFilesInFolder(chapter);
    allFiles.push(...chapterFiles);

    // Niveau 3: sections (contiennent les PDFs)
    for (const section of sections) {
      const sectionName = section.split("/").pop();
      const { files: sectionFiles } = await listFilesInFolder(section);
      if (sectionFiles.length > 0) {
        console.log(`     └─ ${sectionName}: ${sectionFiles.length} PDF(s)`);
        allFiles.push(...sectionFiles);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allFiles;
}

async function createPublicShare(filePath: string): Promise<string> {
  const body = new URLSearchParams({
    path: filePath,
    shareType: "3", // 3 = public link
    permissions: "1", // 1 = read only
  }).toString();

  const result = await makeRequest(
    "/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json",
    "POST",
    body
  );

  if (result.ocs?.data?.url) {
    // Ajouter /download pour lien direct
    return result.ocs.data.url + "/download";
  }

  throw new Error("Impossible de créer le partage: " + JSON.stringify(result));
}

async function main() {
  console.log("🔗 Création de liens publics Nextcloud\n");
  console.log(`📁 Dossier: ${CONFIG.folderPath}`);
  console.log(`🌐 Serveur: ${CONFIG.nextcloudUrl}\n`);

  // Vérification de la configuration
  if (CONFIG.nextcloudUrl.includes("VOTRE-NEXTCLOUD")) {
    console.error("❌ Erreur: Veuillez configurer CONFIG.nextcloudUrl dans le script");
    process.exit(1);
  }
  if (CONFIG.username === "VOTRE_USERNAME") {
    console.error("❌ Erreur: Veuillez configurer CONFIG.username dans le script");
    process.exit(1);
  }
  if (CONFIG.appPassword === "VOTRE_MOT_DE_PASSE_APPLICATION") {
    console.error("❌ Erreur: Veuillez configurer CONFIG.appPassword dans le script");
    process.exit(1);
  }

  try {
    console.log("📋 Récupération de la liste des fichiers...");
    const files = await listAllPDFs(CONFIG.folderPath);

    if (files.length === 0) {
      console.log("⚠️  Aucun fichier PDF trouvé dans ce dossier");
      console.log("   Vérifiez le chemin: " + CONFIG.folderPath);
      return;
    }

    console.log(`✓ ${files.length} fichiers PDF trouvés\n`);

    const results: ShareResult[] = [];

    for (const file of files) {
      process.stdout.write(`  📄 ${file.name}... `);

      try {
        const publicUrl = await createPublicShare(file.path);
        results.push({
          fileName: file.name,
          originalPath: file.path,
          publicUrl,
        });
        console.log("✓");
      } catch (error: any) {
        // Si le partage existe déjà, essayer de le récupérer
        if (error.message.includes("already shared")) {
          console.log("(déjà partagé)");
          results.push({
            fileName: file.name,
            originalPath: file.path,
            publicUrl: "DÉJÀ PARTAGÉ - vérifier manuellement",
          });
        } else {
          console.log("✗ " + error.message);
          results.push({
            fileName: file.name,
            originalPath: file.path,
            publicUrl: "",
            error: error.message,
          });
        }
      }

      // Petit délai pour ne pas surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Sauvegarder les résultats
    const outputPath = path.join(process.cwd(), "nextcloud-links.json");
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n✅ Terminé ! Résultats sauvegardés dans: ${outputPath}`);

    // Afficher un résumé
    const success = results.filter(r => r.publicUrl && !r.error).length;
    const errors = results.filter(r => r.error).length;
    console.log(`\n📊 Résumé: ${success} liens créés, ${errors} erreurs`);

    // Afficher les URLs
    console.log("\n📋 Liste des liens publics:\n");
    for (const r of results) {
      if (r.publicUrl && !r.error) {
        console.log(`${r.fileName}:`);
        console.log(`  ${r.publicUrl}\n`);
      }
    }

  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);
    if (error.message.includes("401")) {
      console.error("   → Vérifiez vos identifiants (username et appPassword)");
    }
    if (error.message.includes("404")) {
      console.error("   → Vérifiez l'URL de votre Nextcloud et le chemin du dossier");
    }
    process.exit(1);
  }
}

main();
