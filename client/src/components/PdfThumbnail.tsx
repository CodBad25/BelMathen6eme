import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Skeleton } from "@/components/ui/skeleton";

// Configuration du worker PDF.js - utiliser le fichier local
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfThumbnailProps {
  url: string;
  className?: string;
  width?: number;
  onClick?: () => void;
}

export function PdfThumbnail({ url, className = "", width = 200, onClick }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      if (!canvasRef.current) return;

      try {
        setLoading(true);
        setError(false);

        // Pour les fichiers locaux (commençant par /), pas besoin de proxy
        const pdfUrl = url.startsWith("/") ? url : `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        // Obtenir la première page
        const page = await pdf.getPage(1);

        if (cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        // Calculer l'échelle pour la largeur souhaitée
        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Définir les dimensions du canvas
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Rendre la page
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement du PDF:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [url, width]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width, height: width * 1.4 }}
        onClick={onClick}
      >
        <span className="text-4xl">📄</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {loading && (
        <Skeleton
          className="absolute inset-0 rounded-lg"
          style={{ width, height: width * 1.4 }}
        />
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${loading ? "opacity-0" : "opacity-100"}`}
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}
