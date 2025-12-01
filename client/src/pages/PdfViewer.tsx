import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function PdfViewer() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const url = params.get("url") || "";
  const title = params.get("title") || "Document";

  const handlePrint = () => {
    const iframe = document.getElementById("pdf-frame") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-100">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[50vw]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={url} download>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-2">
        <iframe
          id="pdf-frame"
          src={url}
          className="w-full h-full rounded border bg-white"
          title={title}
        />
      </main>
    </div>
  );
}
