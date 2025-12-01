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

// Citations célèbres sur les mathématiques
const citations = [
  { text: "Les mathématiques sont la poésie de la logique.", author: "Albert Einstein" },
  { text: "En mathématiques, on ne comprend pas les choses, on s'y habitue.", author: "John von Neumann" },
  { text: "La nature est un livre écrit en langage mathématique.", author: "Galilée" },
  { text: "Les maths sont le seul endroit où la vérité et la beauté signifient la même chose.", author: "Danica McKellar" },
  { text: "Sans les mathématiques, il n'y a rien que vous puissiez faire.", author: "Shakuntala Devi" },
  { text: "Les mathématiques ne mentent jamais.", author: "Pythagore" },
];

export default function Home() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [citation] = useState(() => citations[Math.floor(Math.random() * citations.length)]);
  const { classe, isClasseView } = useClasse();

  // Préfixe pour les liens selon la classe
  const linkPrefix = isClasseView ? `/${classe}` : "";

  // Compteur de visites côté serveur
  const { data: visitData } = trpc.stats.getVisitCount.useQuery();
  const incrementMutation = trpc.stats.incrementVisitCount.useMutation();

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
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className="bg-gradient-to-r from-blue-400 to-purple-400 text-white py-[3vh] md:py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto text-center space-y-[0.5vh] md:space-y-2">
          <p className="text-[2.5vw] md:text-base opacity-80">Réalisé avec <span className="inline-block animate-pulse text-[3vw] md:text-lg">❤️</span> par M.BELHAJ</p>
          <h1 className="text-[8vw] md:text-5xl font-bold">
            Mathématiques 6e{isClasseView && ` - ${classe}`}
          </h1>
          <p className="text-[3.5vw] md:text-xl opacity-90">Collège Gaston Chaissac - {getSchoolYear()}</p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto p-[2vw] md:p-6 w-full flex flex-col">
        <div className="text-center mb-[1vh] md:mb-4">
          <h2 className="text-[5vw] md:text-3xl font-bold text-gray-800">Les Grandeurs</h2>
          {/* Citation célèbre */}
          <div className="mt-1">
            <p className="text-[2.5vw] md:text-sm text-purple-600 italic">"{citation.text}"</p>
            <p className="text-[2vw] md:text-xs text-gray-500">— {citation.author}</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-[1.5vw] md:gap-4 content-center">
          {grandeurs.map((grandeur, index) => (
            <Link key={grandeur.id} href={`${linkPrefix}/grandeur/${grandeur.id}`}>
              <div
                className={`group cursor-pointer transition-all duration-500 h-[22vw] md:h-36
                  ${visibleCards.includes(index)
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-8 scale-95"
                  }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  perspective: "1000px"
                }}
              >
                <div
                  className="relative w-full h-full transition-transform duration-500 group-hover:[transform:rotateY(180deg)]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Face avant */}
                  <Card className="absolute inset-0 overflow-hidden [backface-visibility:hidden]">
                    <div className={`bg-gradient-to-br ${grandeur.color} h-[14vw] md:h-24 flex items-center justify-center`}>
                      {grandeur.icon === "aire" ? (
                        <AireIcon className="w-[11vw] h-[11vw] md:w-16 md:h-16 text-white" />
                      ) : grandeur.icon === "angle" ? (
                        <AngleIcon className="w-[11vw] h-[11vw] md:w-16 md:h-16 text-white" />
                      ) : (
                        <span className="text-[11vw] md:text-6xl leading-none">{grandeur.icon}</span>
                      )}
                    </div>
                    <CardContent className="p-[1.5vw] md:p-3 text-center">
                      <h3 className="font-semibold text-[2.8vw] md:text-base text-gray-800 leading-tight">
                        {grandeur.name}
                      </h3>
                    </CardContent>
                  </Card>
                  {/* Face arrière */}
                  <Card
                    className={`absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br ${grandeur.color} flex items-center justify-center`}
                  >
                    <CardContent className="p-[2vw] md:p-4 text-center text-white">
                      <span className="text-[6vw] md:text-3xl mb-2 block">👆</span>
                      <p className="font-bold text-[3vw] md:text-sm">Clique pour explorer !</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-[1vh] md:mt-4 text-center space-y-1">
          <Link href={`${linkPrefix}/cours`}>
            <span className="text-[3vw] md:text-base text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer">
              Voir tous les chapitres
            </span>
          </Link>
          {/* Compteur de visites */}
          {visitData && visitData.count > 0 && (
            <p className="text-[2vw] md:text-xs text-gray-400">
              {visitData.count} visite{visitData.count > 1 ? "s" : ""} sur cette page
            </p>
          )}
        </div>
      </main>

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm relative">
        <p>Mathématiques 6e{isClasseView && ` - ${classe}`} - Collège Gaston Chaissac</p>
        {!isClasseView && (
          <Link href="/admin">
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer text-[3vw] md:text-base">
              🔒
            </span>
          </Link>
        )}
      </footer>
    </div>
  );
}
