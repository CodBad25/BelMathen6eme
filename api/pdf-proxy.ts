import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).send("URL manquante");
  }

  // Vérifier que l'URL est autorisée (Nextcloud)
  if (!url.includes("nuage03.apps.education.fr") && !url.includes("nextcloud")) {
    return res.status(403).send("URL non autorisée");
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).send("Erreur lors du téléchargement du PDF");
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Erreur proxy PDF:", error);
    res.status(500).send("Erreur serveur");
  }
}
