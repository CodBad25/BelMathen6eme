import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Play, Image, FileDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

// Structure par objectif pédagogique
interface LearningObjective {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  relatedTo: string;
  resources: {
    video?: string;
    image?: string;
  };
}

interface ChapterIAData {
  title: string;
  description: string;
  objectives: LearningObjective[];
  globalResources?: {
    id: string;
    title: string;
    description: string;
    type: "pdf";
    url: string;
  }[];
}

const iaChapterResources: Record<string, ChapterIAData> = {
  "chapitre-2-prix": {
    title: "Les Prix",
    description: "Ressources IA pour le chapitre sur les prix et la comparaison de nombres décimaux",
    objectives: [
      {
        id: "comparer-decimaux",
        title: "Comparer des nombres décimaux",
        description: "Apprendre à comparer deux prix en analysant les parties entières et décimales",
        icon: "⚖️",
        color: "from-blue-500 to-indigo-600",
        relatedTo: "Exercice 1 - Question a)",
        resources: {
          video: "/ia-ressources/ex1/video_comparer_decimaux.mp4",
          image: "/ia-ressources/ex1/comparer_nombres_q1a.png",
        }
      },
      {
        id: "calculer-ecart",
        title: "Calculer un écart de prix",
        description: "Maîtriser le calcul de la différence entre deux prix",
        icon: "🧮",
        color: "from-green-500 to-emerald-600",
        relatedTo: "Exercice 1 - Question b)",
        resources: {
          video: "/ia-ressources/ex1/video_difference_prix.mp4",
          image: "/ia-ressources/ex1/ecart_prix_q1b.png",
        }
      }
    ],
    globalResources: [
      {
        id: "diaporama-comparaison",
        title: "Diaporama récapitulatif",
        description: "Résumé complet des stratégies de comparaison décimale",
        type: "pdf",
        url: "/ia-ressources/ex1/diaporama_comparaison.pdf",
      }
    ]
  }
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
};

export default function IAResourcesPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);
  const [currentSlide, setCurrentSlide] = useState<"video" | "image">("video");

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const iaData = chapterId ? iaChapterResources[chapterId] : null;

  if (!grandeur || !iaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Ressources IA non trouvées</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-[3vh] md:py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3 mb-[1vh] md:mb-2">
            <Link href={`/grandeur/${chapterId}`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw] md:gap-3">
              <Bot className="w-[8vw] h-[8vw] md:w-10 md:h-10" />
              <div>
                <h1 className="text-[5vw] md:text-2xl font-bold">Mon AMIE IA MAIS...</h1>
                <p className="text-[3vw] md:text-sm opacity-90">{iaData.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-[4vw] md:p-6 w-full">
        {/* Avertissement */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-[4vw] md:p-4 mb-[4vh] md:mb-6">
          <p className="text-[3vw] md:text-sm text-amber-800">
            <strong>⚠️ Attention :</strong> Ces ressources ont été générées par une Intelligence Artificielle (NotebookLM).
            Elles peuvent t'aider à comprendre les notions, mais <strong>vérifie toujours avec ton cours et ton professeur</strong> !
          </p>
        </div>

        {/* Objectifs pédagogiques */}
        <h2 className="text-[4.5vw] md:text-xl font-bold text-gray-800 mb-[3vh] md:mb-4 flex items-center gap-2">
          <span>🎯</span> Par objectif d'apprentissage
        </h2>

        <div className="grid gap-[4vw] md:gap-4 mb-[6vh] md:mb-8">
          {iaData.objectives.map((objective) => (
            <Card
              key={objective.id}
              className="bg-white hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedObjective(objective);
                setCurrentSlide("video");
              }}
            >
              <div className={`bg-gradient-to-r ${objective.color} p-[3vw] md:p-4`}>
                <div className="flex items-center gap-[2vw] md:gap-3">
                  <span className="text-[8vw] md:text-4xl">{objective.icon}</span>
                  <div className="text-white">
                    <h3 className="text-[4vw] md:text-lg font-bold">{objective.title}</h3>
                    <p className="text-[2.5vw] md:text-xs opacity-90">{objective.relatedTo}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-[4vw] md:p-4">
                <p className="text-[3vw] md:text-sm text-gray-600 mb-[2vh] md:mb-3">
                  {objective.description}
                </p>
                <div className="flex gap-[2vw] md:gap-2">
                  {objective.resources.video && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjective(objective);
                        setCurrentSlide("video");
                      }}
                      className="inline-flex items-center gap-1 text-[2.5vw] md:text-xs px-[2vw] py-[1vw] md:px-2 md:py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      <Play className="w-[3vw] h-[3vw] md:w-3 md:h-3" /> Vidéo
                    </button>
                  )}
                  {objective.resources.image && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjective(objective);
                        setCurrentSlide("image");
                      }}
                      className="inline-flex items-center gap-1 text-[2.5vw] md:text-xs px-[2vw] py-[1vw] md:px-2 md:py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      <Image className="w-[3vw] h-[3vw] md:w-3 md:h-3" /> Illustration
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ressources globales (PDF) */}
        {iaData.globalResources && iaData.globalResources.length > 0 && (
          <>
            <h2 className="text-[4.5vw] md:text-xl font-bold text-gray-800 mb-[3vh] md:mb-4 flex items-center gap-2">
              <span>📚</span> Ressources récapitulatives
            </h2>

            <div className="grid gap-[3vw] md:gap-3">
              {iaData.globalResources.map((resource) => (
                <Card
                  key={resource.id}
                  className="bg-white hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <CardContent className="p-[4vw] md:p-4 flex items-center gap-[3vw] md:gap-4">
                    <div className="p-[3vw] md:p-3 rounded-xl bg-orange-100 text-orange-700">
                      <FileDown className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[4vw] md:text-base font-semibold text-gray-800">{resource.title}</h3>
                      <p className="text-[3vw] md:text-sm text-gray-600">{resource.description}</p>
                    </div>
                    <span className="text-[2.5vw] md:text-xs px-[2vw] py-[1vw] md:px-2 md:py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                      PDF
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal Diaporama par objectif */}
      {selectedObjective && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedObjective(null)}
        >
          {/* Header du modal */}
          <div
            className={`bg-gradient-to-r ${selectedObjective.color} text-white p-[4vw] md:p-4 flex items-center justify-between`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-[2vw] md:gap-3">
              <span className="text-[6vw] md:text-3xl">{selectedObjective.icon}</span>
              <div>
                <h3 className="font-bold text-[4vw] md:text-lg">{selectedObjective.title}</h3>
                <p className="text-[2.5vw] md:text-xs opacity-80">{selectedObjective.relatedTo}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedObjective(null)}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
            </button>
          </div>

          {/* Navigation slides */}
          <div
            className="bg-gray-800 px-[4vw] md:px-4 py-[2vw] md:py-2 flex justify-center gap-[4vw] md:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedObjective.resources.video && (
              <button
                onClick={() => setCurrentSlide("video")}
                className={`flex items-center gap-[1vw] md:gap-2 px-[4vw] py-[2vw] md:px-4 md:py-2 rounded-full text-[3vw] md:text-sm font-medium transition-all ${
                  currentSlide === "video"
                    ? "bg-red-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Play className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Vidéo
              </button>
            )}
            {selectedObjective.resources.image && (
              <button
                onClick={() => setCurrentSlide("image")}
                className={`flex items-center gap-[1vw] md:gap-2 px-[4vw] py-[2vw] md:px-4 md:py-2 rounded-full text-[3vw] md:text-sm font-medium transition-all ${
                  currentSlide === "image"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Image className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Illustration
              </button>
            )}
          </div>

          {/* Contenu du slide */}
          <div
            className="flex-1 flex items-center justify-center p-[4vw] md:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flèche gauche */}
            <button
              onClick={() => setCurrentSlide(currentSlide === "video" ? "image" : "video")}
              className="absolute left-[2vw] md:left-4 p-[2vw] md:p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
            >
              <ChevronLeft className="w-[6vw] h-[6vw] md:w-8 md:h-8" />
            </button>

            {/* Contenu */}
            <div className="max-w-4xl w-full">
              {currentSlide === "video" && selectedObjective.resources.video && (
                <video
                  key={`video-${selectedObjective.id}`}
                  src={selectedObjective.resources.video}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] rounded-xl"
                />
              )}
              {currentSlide === "image" && selectedObjective.resources.image && (
                <img
                  key={`image-${selectedObjective.id}`}
                  src={selectedObjective.resources.image}
                  alt={selectedObjective.title}
                  className="w-full max-h-[70vh] object-contain rounded-xl"
                />
              )}
            </div>

            {/* Flèche droite */}
            <button
              onClick={() => setCurrentSlide(currentSlide === "video" ? "image" : "video")}
              className="absolute right-[2vw] md:right-4 p-[2vw] md:p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
            >
              <ChevronRight className="w-[6vw] h-[6vw] md:w-8 md:h-8" />
            </button>
          </div>

          {/* Indicateur de slide */}
          <div
            className="bg-gray-800 py-[2vw] md:py-3 flex justify-center gap-[2vw] md:gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedObjective.resources.video && (
              <div
                className={`w-[2vw] h-[2vw] md:w-2 md:h-2 rounded-full transition-all ${
                  currentSlide === "video" ? "bg-white" : "bg-gray-600"
                }`}
              />
            )}
            {selectedObjective.resources.image && (
              <div
                className={`w-[2vw] h-[2vw] md:w-2 md:h-2 rounded-full transition-all ${
                  currentSlide === "image" ? "bg-white" : "bg-gray-600"
                }`}
              />
            )}
          </div>
        </div>
      )}

      <footer className="bg-gray-100 border-t py-[2vh] md:py-4 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
