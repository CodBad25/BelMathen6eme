import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Structure des exercices par étude
const exercicesByEtude: Record<string, Record<string, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  questionsCount?: number;
  hasCorrection: boolean;
}[]>> = {
  "chapitre-2-prix": {
    "etude-1": [
      { id: "ex1", title: "Exercice 1", subtitle: "Prix du gazole", icon: "⛽", questionsCount: 4, hasCorrection: true },
      { id: "ex2", title: "Exercice 2", subtitle: "Remplir un chèque", icon: "📝", questionsCount: 3, hasCorrection: false },
      { id: "ex3", title: "Exercice 3", subtitle: "Ai-je assez d'argent ?", icon: "💰", questionsCount: 3, hasCorrection: false },
      { id: "ex4", title: "Exercice 4", subtitle: "Les romains", icon: "🏛️", questionsCount: 1, hasCorrection: false },
      { id: "ex5", title: "Exercice 5", subtitle: "Prix de référence", icon: "⚖️", questionsCount: 3, hasCorrection: false },
      { id: "ex6", title: "Exercice 6", subtitle: "Les salaires en k€", icon: "💼", questionsCount: 1, hasCorrection: false },
      { id: "ex7", title: "Exercice 7", subtitle: "Comparer des salaires", icon: "📊", questionsCount: 1, hasCorrection: false },
    ]
  }
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-1-angles": { name: "Les Angles", icon: "📐", color: "from-indigo-500 to-blue-600" },
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
  "chapitre-3-aires": { name: "Les Aires", icon: "🔲", color: "from-teal-500 to-cyan-600" },
  "chapitre-4-durees": { name: "Les Durées", icon: "⏱️", color: "from-orange-500 to-amber-600" },
  "chapitre-5-volumes": { name: "Les Volumes", icon: "📦", color: "from-purple-500 to-violet-600" },
};

const etudeNames: Record<string, Record<string, string>> = {
  "chapitre-2-prix": {
    "etude-1": "Comparer des prix",
    "etude-2": "Calculer des prix",
    "etude-3": "Partager des prix",
  }
};

export default function ExercicesPage() {
  const { chapterId, sectionId } = useParams<{ chapterId: string; sectionId: string }>();

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const exercices = (chapterId && sectionId) ? exercicesByEtude[chapterId]?.[sectionId] || [] : [];
  const etudeName = (chapterId && sectionId) ? etudeNames[chapterId]?.[sectionId] || sectionId : "";

  if (!grandeur) {
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
      <header className={`bg-gradient-to-r ${grandeur.color} text-white py-[2vh] md:py-4 px-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href={`/grandeur/${chapterId}/${sectionId}`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">✏️</span>
              <div>
                <h1 className="text-[4vw] md:text-xl font-bold">Exercices</h1>
                <p className="text-[3vw] md:text-sm opacity-90">{etudeName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-[3vw] md:p-6 w-full overflow-auto">
        <div className="text-center mb-[2vh] md:mb-4">
          <h2 className="text-[4vw] md:text-xl font-bold text-gray-800">Choisis un exercice</h2>
          <p className="text-[3vw] md:text-sm text-gray-600">{exercices.length} exercices disponibles</p>
        </div>

        {exercices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucun exercice disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[3vw] md:gap-4">
            {exercices.map((exercice) => (
              <Link key={exercice.id} href={`/grandeur/${chapterId}/${sectionId}/exercices/${exercice.id}`}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full bg-white relative overflow-hidden">
                  {exercice.hasCorrection && (
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 w-[5vw] h-[5vw] md:w-6 md:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[2.5vw] md:text-xs font-bold">
                      ✓
                    </div>
                  )}
                  <CardContent className="p-[3vw] md:p-4 flex flex-col items-center text-center h-full justify-center">
                    <span className="text-[10vw] md:text-5xl mb-[1vh] md:mb-2">{exercice.icon}</span>
                    <h3 className="font-bold text-[3.5vw] md:text-base text-gray-800 group-hover:text-blue-600 transition-colors">
                      {exercice.title}
                    </h3>
                    <p className="text-[2.5vw] md:text-sm text-gray-600 mt-1">
                      {exercice.subtitle}
                    </p>
                    {exercice.questionsCount && (
                      <div className="mt-[1vh] md:mt-2 flex items-center gap-1 text-[2.5vw] md:text-xs text-blue-600">
                        <span>{exercice.questionsCount} questions</span>
                        <ChevronRight className="w-[3vw] h-[3vw] md:w-3 md:h-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
