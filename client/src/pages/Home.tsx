import { Link } from "wouter";
import { getSchoolYear } from "@shared/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClasse } from "@/contexts/ClasseContext";

// Icône personnalisée pour les Aires (quadrillage avec un carreau coloré)
const AireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="3"/>
    <line x1="35" y1="5" x2="35" y2="95" stroke="currentColor" strokeWidth="2"/>
    <line x1="65" y1="5" x2="65" y2="95" stroke="currentColor" strokeWidth="2"/>
    <line x1="5" y1="35" x2="95" y2="35" stroke="currentColor" strokeWidth="2"/>
    <line x1="5" y1="65" x2="95" y2="65" stroke="currentColor" strokeWidth="2"/>
    <rect x="36" y="36" width="28" height="28" fill="currentColor" opacity="0.5"/>
  </svg>
);

// Icône personnalisée pour les Angles (angle avec arc)
const AngleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <line x1="15" y1="80" x2="85" y2="80" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <line x1="15" y1="80" x2="70" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <path d="M 35 80 A 20 20 0 0 1 28 65" fill="none" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

const grandeurs = [
  { id: "chapitre-1-angles", name: "Les Angles", icon: "angle", color: "from-indigo-400 to-blue-500" },
  { id: "chapitre-2-prix", name: "Les Prix", icon: "💶", color: "from-green-400 to-emerald-500" },
  { id: "chapitre-3-aires", name: "Les Aires", icon: "aire", color: "from-teal-400 to-cyan-500" },
  { id: "chapitre-4-durees", name: "Les Durées", icon: "⏱️", color: "from-orange-400 to-amber-500" },
  { id: "chapitre-5-volumes", name: "Les Volumes", icon: "📦", color: "from-purple-400 to-violet-500" },
];

const chapterNames: Record<string, string> = {
  "chapitre-1-angles": "Les Angles",
  "chapitre-2-prix": "Les Prix",
  "chapitre-3-aires": "Les Aires",
  "chapitre-4-durees": "Les Durées",
  "chapitre-5-volumes": "Les Volumes",
};

const sectionNames: Record<string, string> = {
  "introduction": "Introduction",
  "cours": "Cours",
  "etude-1": "Étude n°1",
  "etude-2": "Étude n°2",
  "etude-3": "Étude n°3",
  "etude-4": "Étude n°4",
  "activite-rapide": "Activités Rapides",
};

// Citations célèbres sur les mathématiques
const citations = [
  { text: "Les mathématiques sont la poésie de la logique.", author: "Albert Einstein" },
  { text: "En mathématiques, on ne comprend pas les choses, on s'y habitue.", author: "John von Neumann" },
  { text: "La nature est un livre écrit en langage mathématique.", author: "Galilée" },
  { text: "Les maths sont le seul endroit où la vérité et la beauté signifient la même chose.", author: "Danica McKellar" },
  { text: "Sans les mathématiques, il n'y a rien que vous puissiez faire.", author: "Shakuntala Devi" },
  { text: "Les mathématiques ne mentent jamais.", author: "Pythagore" },
];

// Couleurs par chapitre
const chapterColors: Record<string, string> = {
  "chapitre-1-angles": "from-indigo-400 to-blue-500",
  "chapitre-2-prix": "from-green-400 to-emerald-500",
  "chapitre-3-aires": "from-teal-400 to-cyan-500",
  "chapitre-4-durees": "from-orange-400 to-amber-500",
  "chapitre-5-volumes": "from-purple-400 to-violet-500",
};

// Composant Nouveautés avec badge et popup
function NouveautesPopover({
  resources,
  linkPrefix,
  chapterNames,
  sectionNames,
}: {
  resources: any[];
  linkPrefix: string;
  chapterNames: Record<string, string>;
  sectionNames: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="mt-8 flex justify-center">
      <div className="relative">
        {/* Badge cliquable */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full px-4 py-2 shadow-sm transition-all hover:shadow-md"
        >
          <span className="text-sm font-medium text-gray-700">Nouveautés</span>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {resources.length}
          </span>
        </button>

        {/* Popup avec détails */}
        {isOpen && (
          <>
            {/* Overlay pour fermer */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {/* Contenu popup - grille compacte */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-[600px] max-w-[95vw]">
              <div className="p-2 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 text-sm">Nouveautés cette semaine</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-2 grid grid-cols-4 gap-1.5 max-h-48 overflow-auto">
                {resources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`${linkPrefix}/grandeur/${resource.chapterId}/${resource.sectionId}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`bg-gradient-to-br ${chapterColors[resource.chapterId] || "from-gray-400 to-gray-500"} rounded p-1.5 cursor-pointer hover:opacity-90 transition-opacity`}>
                      <p className="text-[10px] font-medium text-white truncate">{resource.title}</p>
                      <p className="text-[9px] text-white/70">{formatDate((resource as any).updatedAt ?? resource.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [citation] = useState(() => citations[Math.floor(Math.random() * citations.length)]);
  const { classe, isClasseView } = useClasse();

  // Préfixe pour les liens selon la classe
  const linkPrefix = isClasseView ? `/${classe}` : "";

  // Compteur de visites côté serveur
  const { data: visitData } = trpc.stats.getVisitCount.useQuery();
  const incrementMutation = trpc.stats.incrementVisitCount.useMutation();

  // Ressources récentes (nouveautés)
  const { data: recentResources } = trpc.resources.getRecent.useQuery();

  useEffect(() => {
    // Animation cascade : chaque carte apparaît avec un délai
    grandeurs.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards((prev) => [...prev, index]);
      }, index * 100);
    });

    // Incrémenter le compteur une seule fois par session
    if (!sessionStorage.getItem("visit-counted")) {
      incrementMutation.mutate();
      sessionStorage.setItem("visit-counted", "true");
    }
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      <header className="bg-gradient-to-r from-blue-400 to-purple-400 text-white py-6 md:py-8 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center space-y-1">
          <p className="text-sm opacity-80">Réalisé avec <span className="inline-block animate-pulse">❤️</span> par M.BELHAJ</p>
          <h1 className="text-3xl md:text-5xl font-bold">
            Mathématiques 6e{isClasseView && ` - ${classe}`}
          </h1>
          <p className="text-base md:text-xl opacity-90">Collège Gaston Chaissac - {getSchoolYear()}</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Les Grandeurs</h2>
          <p className="text-sm text-purple-600 italic mt-2">"{citation.text}"</p>
          <p className="text-xs text-gray-500">— {citation.author}</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-4 max-w-3xl mx-auto">
          {grandeurs.map((grandeur, index) => (
            <Link key={grandeur.id} href={`${linkPrefix}/grandeur/${grandeur.id}`}>
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg
                  ${visibleCards.includes(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                  }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className={`bg-gradient-to-br ${grandeur.color} h-16 md:h-20 flex items-center justify-center`}>
                  {grandeur.icon === "aire" ? (
                    <AireIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  ) : grandeur.icon === "angle" ? (
                    <AngleIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  ) : (
                    <span className="text-3xl md:text-4xl">{grandeur.icon}</span>
                  )}
                </div>
                <CardContent className="p-2 text-center">
                  <h3 className="font-semibold text-xs md:text-sm text-gray-800">
                    {grandeur.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Notification Nouveautés */}
        {recentResources && recentResources.length > 0 && (
          <NouveautesPopover
            resources={recentResources}
            linkPrefix={linkPrefix}
            chapterNames={chapterNames}
            sectionNames={sectionNames}
          />
        )}

        <div className="mt-6 text-center space-y-2">
          <Link href={`${linkPrefix}/cours`}>
            <span className="text-sm text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer">
              Voir tous les chapitres
            </span>
          </Link>
          {visitData && visitData.count > 0 && (
            <p className="text-xs text-gray-400">
              {visitData.count} visite{visitData.count > 1 ? "s" : ""} sur cette page
            </p>
          )}
        </div>
      </main>

      <footer className="bg-gray-100 border-t py-3 text-center text-gray-600 text-sm relative">
        <p>Mathématiques 6e{isClasseView && ` - ${classe}`} - Collège Gaston Chaissac</p>
        {!isClasseView && (
          <Link href="/admin">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer">
              🔒
            </span>
          </Link>
        )}
      </footer>
    </div>
  );
}
