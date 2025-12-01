import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getSchoolYear } from "@shared/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, ArrowLeft, BookOpen, Bot } from "lucide-react";

// Chapitres qui ont des méthodes disponibles
const chaptersWithMethods = ["chapitre-2-prix"];

// Chapitres qui ont des ressources IA disponibles
const chaptersWithIA = ["chapitre-2-prix"];

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-1-angles": { name: "Les Angles", icon: "📐", color: "from-indigo-500 to-blue-600" },
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
  "chapitre-3-aires": { name: "Les Aires", icon: "🔲", color: "from-teal-500 to-cyan-600" },
  "chapitre-4-durees": { name: "Les Durées", icon: "⏱️", color: "from-orange-500 to-amber-600" },
  "chapitre-5-volumes": { name: "Les Volumes", icon: "📦", color: "from-purple-500 to-violet-600" },
};

// Sections spécifiques par chapitre (structure Nextcloud)
const sectionsByChapter: Record<string, Array<{ id: string; name: string; icon: string; color: string }>> = {
  "chapitre-1-angles": [
    { id: "introduction", name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    { id: "etude-1", name: "Étude n°1 - Comparer des angles", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "etude-2", name: "Étude n°2 - Multiplier et diviser des angles", icon: "📖", color: "from-green-500 to-emerald-600" },
    { id: "etude-3", name: "Étude n°3 - Mesurer des angles", icon: "📖", color: "from-purple-500 to-violet-600" },
    { id: "activite-rapide", name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  ],
  "chapitre-2-prix": [
    { id: "introduction", name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    { id: "etude-1", name: "Étude n°1 - Comparer des prix", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "etude-2", name: "Étude n°2 - Calculer des prix", icon: "📖", color: "from-green-500 to-emerald-600" },
    { id: "etude-3", name: "Étude n°3 - Partager des prix", icon: "📖", color: "from-purple-500 to-violet-600" },
    { id: "activite-rapide", name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  ],
  "chapitre-3-aires": [
    { id: "introduction", name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    { id: "etude-1", name: "Étude n°1 - Comparer des aires", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "etude-2", name: "Étude n°2 - Mesurer une aire", icon: "📖", color: "from-green-500 to-emerald-600" },
    { id: "etude-3", name: "Étude n°3 - Calculer une aire", icon: "📖", color: "from-purple-500 to-violet-600" },
    { id: "activite-rapide", name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  ],
  "chapitre-4-durees": [
    { id: "introduction", name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    { id: "etude-1", name: "Étude n°1 - Comparer, additionner, soustraire des durées", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "etude-2", name: "Étude n°2 - Multiplier et diviser des durées", icon: "📖", color: "from-green-500 to-emerald-600" },
    { id: "etude-3", name: "Étude n°3 - Calculer des horaires, des dates ou des durées", icon: "📖", color: "from-purple-500 to-violet-600" },
    { id: "activite-rapide", name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  ],
  "chapitre-5-volumes": [
    { id: "introduction", name: "Introduction", icon: "🎯", color: "from-slate-500 to-gray-600" },
    { id: "etude-1", name: "Étude n°1 - Comparer des volumes", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "etude-2", name: "Étude n°2 - Rapport entre les volumes", icon: "📖", color: "from-green-500 to-emerald-600" },
    { id: "etude-3", name: "Étude n°3 - Mesurer un volume", icon: "📖", color: "from-purple-500 to-violet-600" },
    { id: "etude-4", name: "Étude n°4 - Calculer un volume", icon: "📖", color: "from-red-500 to-rose-600" },
    { id: "activite-rapide", name: "Activités Rapides", icon: "⚡", color: "from-yellow-500 to-amber-600" },
  ],
};

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { data: resources, isLoading } = trpc.resources.list.useQuery();

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const sections = chapterId ? sectionsByChapter[chapterId] || [] : [];

  // Compter les ressources par section pour ce chapitre
  const sectionCounts: Record<string, number> = {};
  resources?.forEach((r) => {
    if (r.chapterId === chapterId && r.visible === "true") {
      sectionCounts[r.sectionId] = (sectionCounts[r.sectionId] || 0) + 1;
    }
  });

  // Filtrer les sections qui ont des ressources
  const availableSections = sections.filter((s) => sectionCounts[s.id] > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!grandeur) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Grandeur non trouvée</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className={`bg-gradient-to-r ${grandeur.color} text-white py-[2vh] md:py-6 px-4 shadow-lg`}>
        <div className="max-w-6xl mx-auto">
          <p className="text-[2vw] md:text-sm opacity-75 text-center">Réalisé avec ❤️ par M.BELHAJ</p>
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <Home className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Accueil</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[10vw] md:text-5xl">{grandeur.icon}</span>
              <div>
                <h1 className="text-[6vw] md:text-3xl font-bold">{grandeur.name}</h1>
                <p className="text-[3vw] md:text-base opacity-90">Collège Gaston Chaissac</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto p-[2vw] md:p-6 w-full flex flex-col">
        <div className="text-center mb-[1vh] md:mb-4">
          <h2 className="text-[4.5vw] md:text-2xl font-bold text-gray-800">Que veux-tu consulter ?</h2>
        </div>

        {availableSections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucune ressource disponible.</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-[2vw] md:gap-4 content-center">
            {availableSections.map((section) => (
              <Link key={section.id} href={`/grandeur/${chapterId}/${section.id}`}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                  <div className={`bg-gradient-to-br ${section.color} p-[2vw] md:p-4 text-center`}>
                    <span className="text-[8vw] md:text-4xl">{section.icon}</span>
                  </div>
                  <CardContent className="p-[1.5vw] md:p-3 text-center">
                    <h3 className="font-semibold text-[3vw] md:text-base text-gray-800 group-hover:text-purple-600 transition-colors leading-tight">
                      {section.name}
                    </h3>
                    <p className="text-[2.5vw] md:text-xs text-purple-600 mt-0.5">
                      {sectionCounts[section.id]} ressource{sectionCounts[section.id] > 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-[1vh] md:mt-4 text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            {chapterId && chaptersWithMethods.includes(chapterId) && (
              <Link href={`/grandeur/${chapterId}/methodes`}>
                <Button variant="outline" className="gap-2 text-green-700 border-green-500 hover:bg-green-50">
                  <BookOpen className="w-4 h-4" />
                  Méthodes du chapitre
                </Button>
              </Link>
            )}
            {chapterId && chaptersWithIA.includes(chapterId) && (
              <Link href={`/grandeur/${chapterId}/ia-ressources`}>
                <Button variant="outline" className="gap-2 text-indigo-700 border-indigo-500 hover:bg-indigo-50">
                  <Bot className="w-4 h-4" />
                  Mon AMIE IA MAIS...
                </Button>
              </Link>
            )}
          </div>
          <div>
            <Link href={`/cours/${chapterId}`}>
              <span className="text-[3vw] md:text-base text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer">
                Voir toutes les ressources
              </span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
