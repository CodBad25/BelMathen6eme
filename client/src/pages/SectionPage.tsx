import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useFilteredResources } from "@/hooks/useFilteredResources";
import { useClasse } from "@/contexts/ClasseContext";

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

  // Préfixe pour les liens selon la classe
  const linkPrefix = isClasseView ? `/${classe}` : "";

  const openResource = (resource: { type: string; url: string; title: string }) => {
    // Si c'est la carte "Exercices", naviguer vers la page interactive
    if (resource.title.toLowerCase().includes("exercices") || resource.title.toLowerCase().includes("exercice")) {
      navigate(`${linkPrefix}/grandeur/${chapterId}/${sectionId}/exercices`);
      return;
    }
    // Ouvrir directement dans un nouvel onglet - le navigateur gère l'affichage et l'impression
    window.open(resource.url, '_blank');
  };

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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className={`bg-gradient-to-r ${section.color} text-white py-[2vh] md:py-6 px-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[2vw] md:text-sm opacity-75 text-center">Réalisé avec ❤️ par M.BELHAJ</p>
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href={`${linkPrefix}/grandeur/${chapterId}`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">{section.icon}</span>
              <div>
                <h1 className="text-[5vw] md:text-2xl font-bold">{section.name}</h1>
                <p className="text-[3vw] md:text-base opacity-90">{grandeur.icon} {grandeur.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-[2vw] md:p-6 w-full flex flex-col">
        {sectionResources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucune ressource disponible.</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-[1.5vw] md:gap-3 content-center">
            {sectionResources.map((resource) => {
              // Trouver la correction associée si elle existe (dans toutes les ressources)
              const correction = resource.correctionId
                ? allResources?.find(r => r.id === resource.correctionId)
                : null;
              // Afficher le bouton C seulement si la correction est visible
              const showCorrectionButton = correction && correction.visible === "true";

              return (
                <Card
                  key={resource.id}
                  className="hover:shadow-md transition-all cursor-pointer relative"
                  onClick={() => openResource(resource)}
                >
                  {/* Bouton Correction */}
                  {showCorrectionButton && (
                    <button
                      className="absolute top-1 right-1 md:top-2 md:right-2 w-[5vw] h-[5vw] md:w-6 md:h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-[2.5vw] md:text-xs font-bold shadow-md transition-colors z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(correction.url, '_blank');
                      }}
                      title="Voir la correction"
                    >
                      C
                    </button>
                  )}
                  <CardContent className="p-[2vw] md:p-3 flex flex-col items-center text-center">
                    <span className="text-[5vw] md:text-2xl mb-1">{resource.icon || "📄"}</span>
                    <h3 className="text-[3vw] md:text-sm font-semibold leading-tight line-clamp-1">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-[2.5vw] md:text-xs text-gray-600 leading-tight line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
