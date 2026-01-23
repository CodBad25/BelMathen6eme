import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Download } from "lucide-react";
import { useFilteredResources } from "@/hooks/useFilteredResources";
import { useClasse } from "@/contexts/ClasseContext";
import { PdfThumbnail } from "@/components/PdfThumbnail";
import { PdfViewer } from "@/components/PdfViewer";

interface OpenPdf {
  id: string;
  url: string;
  title: string;
}

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-1-angles": { name: "Les Angles", icon: "📐", color: "from-indigo-500 to-blue-600" },
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
  "chapitre-3-aires": { name: "Les Aires", icon: "🔲", color: "from-teal-500 to-cyan-600" },
  "chapitre-4-durees": { name: "Les Durées", icon: "⏱️", color: "from-orange-500 to-amber-600" },
  "chapitre-5-volumes": { name: "Les Volumes", icon: "📦", color: "from-purple-500 to-violet-600" },
};

// Sections spécifiques par chapitre (structure Nextcloud)
const sectionsByChapter: Record<string, Record<string, { name: string; icon: string; color: string }>> = {
  "chapitre-1-angles": {
    "introduction": { name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    "cours": { name: "Cours", icon: "📚", color: "from-rose-500 to-pink-600" },
    "etude-1": { name: "Étude n°1 - Comparer des angles", icon: "📖", color: "from-blue-500 to-indigo-600" },
    "etude-2": { name: "Étude n°2 - Multiplier et diviser des angles", icon: "📖", color: "from-green-500 to-emerald-600" },
    "etude-3": { name: "Étude n°3 - Mesurer des angles", icon: "📖", color: "from-purple-500 to-violet-600" },
    "activite-rapide": { name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  },
  "chapitre-2-prix": {
    "introduction": { name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    "cours": { name: "Cours", icon: "📚", color: "from-rose-500 to-pink-600" },
    "etude-1": { name: "Étude n°1 - Comparer des prix", icon: "📖", color: "from-blue-500 to-indigo-600" },
    "etude-2": { name: "Étude n°2 - Calculer des prix", icon: "📖", color: "from-green-500 to-emerald-600" },
    "etude-3": { name: "Étude n°3 - Partager des prix", icon: "📖", color: "from-purple-500 to-violet-600" },
    "activite-rapide": { name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  },
  "chapitre-3-aires": {
    "introduction": { name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    "cours": { name: "Cours", icon: "📚", color: "from-rose-500 to-pink-600" },
    "etude-1": { name: "Étude n°1 - Comparer des aires", icon: "📖", color: "from-blue-500 to-indigo-600" },
    "etude-2": { name: "Étude n°2 - Mesurer une aire", icon: "📖", color: "from-green-500 to-emerald-600" },
    "etude-3": { name: "Étude n°3 - Calculer une aire", icon: "📖", color: "from-purple-500 to-violet-600" },
    "activite-rapide": { name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  },
  "chapitre-4-durees": {
    "introduction": { name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    "cours": { name: "Cours", icon: "📚", color: "from-rose-500 to-pink-600" },
    "etude-1": { name: "Étude n°1 - Comparer, additionner, soustraire des durées", icon: "📖", color: "from-blue-500 to-indigo-600" },
    "etude-2": { name: "Étude n°2 - Multiplier et diviser des durées", icon: "📖", color: "from-green-500 to-emerald-600" },
    "etude-3": { name: "Étude n°3 - Calculer des horaires, des dates ou des durées", icon: "📖", color: "from-purple-500 to-violet-600" },
    "activite-rapide": { name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  },
  "chapitre-5-volumes": {
    "introduction": { name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    "cours": { name: "Cours", icon: "📚", color: "from-rose-500 to-pink-600" },
    "etude-1": { name: "Étude n°1 - Comparer des volumes", icon: "📖", color: "from-blue-500 to-indigo-600" },
    "etude-2": { name: "Étude n°2 - Rapport entre les volumes", icon: "📖", color: "from-green-500 to-emerald-600" },
    "etude-3": { name: "Étude n°3 - Mesurer un volume", icon: "📖", color: "from-purple-500 to-violet-600" },
    "etude-4": { name: "Étude n°4 - Calculer un volume", icon: "📖", color: "from-red-500 to-rose-600" },
    "activite-rapide": { name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  },
};

export default function SectionPage() {
  const { chapterId, sectionId } = useParams<{ chapterId: string; sectionId: string }>();
  const { resources, allResources, isLoading } = useFilteredResources();
  const { classe, isClasseView } = useClasse();
  const [, navigate] = useLocation();
  const [modalPdf, setModalPdf] = useState<OpenPdf | null>(null);

  // Préfixe pour les liens selon la classe
  const linkPrefix = isClasseView ? `/${classe}` : "";

  const openResource = (resource: { id: string; type: string; url: string; title: string }) => {
    // Si c'est la carte "Exercices", naviguer vers la page interactive
    if (resource.title.toLowerCase().includes("exercices") || resource.title.toLowerCase().includes("exercice")) {
      navigate(`${linkPrefix}/grandeur/${chapterId}/${sectionId}/exercices`);
      return;
    }
    // Ouvrir le viewer PDF
    const isPdf = resource.type === "pdf" || resource.url.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setModalPdf({ id: resource.id, url: resource.url, title: resource.title });
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const downloadResource = (url: string) => window.open(url, '_blank');

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const section = (chapterId && sectionId) ? sectionsByChapter[chapterId]?.[sectionId] : null;

  const sectionResources = resources?.filter(
    (r) => r.chapterId === chapterId && r.sectionId === sectionId
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!grandeur || !section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Page non trouvée</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      <header className={`bg-gradient-to-r ${section.color} text-white py-3 px-4 shadow-lg sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`${linkPrefix}/grandeur/${chapterId}`}>
            <Button variant="secondary" size="sm" className="h-8 px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline ml-1">Retour</span>
            </Button>
          </Link>
          <span className="text-2xl">{section.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{section.name}</h1>
            <p className="text-sm opacity-90">{grandeur.icon} {grandeur.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-4 w-full">
        {sectionResources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucune ressource disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionResources.map((resource) => {
              // Trouver la correction associée si elle existe (dans toutes les ressources)
              const correction = resource.correctionId
                ? allResources?.find(r => r.id === resource.correctionId)
                : null;
              // Afficher le bouton C seulement si la correction est visible
              const showCorrectionButton = correction && correction.visible === "true";
              const isPdf = resource.type === "pdf" || resource.url.toLowerCase().endsWith(".pdf");
              const isExercices = resource.title.toLowerCase().includes("exercices") || resource.title.toLowerCase().includes("exercice");

              // Affichage différent pour les exercices (carte compacte) vs les PDFs (avec miniature)
              if (isExercices) {
                return (
                  <Card
                    key={resource.id}
                    className="hover:shadow-md transition-all cursor-pointer relative"
                    onClick={() => openResource(resource)}
                  >
                    {showCorrectionButton && (
                      <button
                        className="absolute top-1 right-1 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPdf({ id: correction.id, url: correction.url, title: correction.title });
                        }}
                      >
                        C
                      </button>
                    )}
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <span className="text-4xl mb-2">{resource.icon || "📄"}</span>
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                        {resource.title}
                      </h3>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={resource.id} className="hover:shadow-lg transition-all relative overflow-hidden">
                  {showCorrectionButton && (
                    <button
                      className="absolute top-1 right-1 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10"
                      onClick={() => setModalPdf({ id: correction.id, url: correction.url, title: correction.title })}
                    >
                      C
                    </button>
                  )}
                  <CardContent className="p-0">
                    {isPdf ? (
                      <div
                        className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => openResource(resource)}
                      >
                        <PdfThumbnail url={resource.url} width={400} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div
                        className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center cursor-pointer"
                        onClick={() => openResource(resource)}
                      >
                        <span className="text-6xl">{resource.icon || "📄"}</span>
                      </div>
                    )}
                    <div className="p-3 border-t bg-white">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-center mb-2">
                        {resource.title}
                      </h3>
                      {isPdf && (
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="default" className="flex-1 h-8 text-xs" onClick={() => openResource(resource)}>
                            <Eye className="w-3 h-3 mr-1" />
                            Aperçu
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => downloadResource(resource.url)}>
                            <Download className="w-3 h-3 mr-1" />
                            Ouvrir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-2 text-center text-gray-600 text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>

      {/* Modal PDF */}
      {modalPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl h-[85vh]">
            <PdfViewer
              url={modalPdf.url}
              title={modalPdf.title}
              onClose={() => setModalPdf(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
