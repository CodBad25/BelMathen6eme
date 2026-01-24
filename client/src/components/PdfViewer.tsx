import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";

// Configuration du worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

// Échelle de rendu fixe pour la qualité
const RENDER_SCALE = 1.5;

export function PdfViewer({ url, title, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [baseZoom, setBaseZoom] = useState(100); // Zoom calculé pour "fit"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Charger le PDF
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(false);

        // Pour les fichiers locaux (commençant par /), pas besoin de proxy
        const pdfUrl = url.startsWith("/") ? url : `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err) {
        console.error("Erreur chargement PDF:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Rendre la page courante et calculer le zoom optimal
  useEffect(() => {
    if (!pdf || !canvasRef.current || !containerRef.current) return;

    let cancelled = false;

    async function renderPage() {
      const page = await pdf!.getPage(currentPage);
      if (cancelled) return;

      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d")!;
      const container = containerRef.current!;

      // Calculer le zoom optimal pour que la page rentre dans le conteneur
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = container.clientWidth - 32; // padding
      const containerHeight = container.clientHeight - 32;

      // Calculer le ratio pour fit width et fit height
      const scaleWidth = containerWidth / viewport.width;
      const scaleHeight = containerHeight / viewport.height;

      // Prendre le plus petit pour que tout rentre
      const optimalScale = Math.min(scaleWidth, scaleHeight);
      const optimalZoom = Math.floor(optimalScale * 100 / RENDER_SCALE);

      // Appliquer le zoom optimal seulement au premier chargement
      if (baseZoom === 100 && optimalZoom < 100) {
        setBaseZoom(optimalZoom);
        setZoom(optimalZoom);
      }

      const renderViewport = page.getViewport({ scale: RENDER_SCALE });
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;

      await page.render({
        canvasContext: context,
        viewport: renderViewport,
      }).promise;
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pdf, currentPage, baseZoom]);

  const handleDownload = () => {
    window.open(url, "_blank");
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 30));

  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 flex flex-col h-full w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold truncate flex-1 text-sm">{title}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/20 h-7 w-7 p-0" title="Télécharger">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-7 w-7 p-0" title="Fermer">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-100 px-3 py-1.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage <= 1} className="h-7 w-7 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage >= totalPages} className="h-7 w-7 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={zoomOut} className="h-7 w-7 p-0">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setZoom(baseZoom)}
            className="text-xs min-w-[40px] text-center hover:bg-gray-200 rounded px-1"
            title="Réinitialiser le zoom"
          >
            {zoom}%
          </button>
          <Button variant="outline" size="sm" onClick={zoomIn} className="h-7 w-7 p-0">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            Erreur lors du chargement du PDF
          </div>
        ) : (
          <div className="flex justify-center" style={{ minWidth: 'fit-content' }}>
            <canvas
              ref={canvasRef}
              className="shadow-lg origin-top-left"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
