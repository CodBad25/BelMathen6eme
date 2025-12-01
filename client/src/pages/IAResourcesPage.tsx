import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Play, Image, FileDown, Headphones } from "lucide-react";
import { useState } from "react";

// Ressources IA générales par chapitre
const iaChapterResources: Record<string, {
  title: string;
  description: string;
  resources: {
    id: string;
    title: string;
    description: string;
    type: "video" | "image" | "pdf" | "audio";
    url: string;
    relatedTo?: string; // ex: "Question a)", "Méthode M2.1"
  }[];
}> = {
  "chapitre-2-prix": {
    title: "Les Prix",
    description: "Ressources IA pour le chapitre sur les prix et la comparaison de nombres décimaux",
    resources: [
      {
        id: "diaporama-comparaison",
        title: "Stratégies de Comparaison Décimale",
        description: "Un diaporama résumant les méthodes pour comparer des nombres décimaux",
        type: "pdf",
        url: "/ia-ressources/ex1/diaporama_comparaison.pdf",
        relatedTo: "Exercice 1 - Questions a) et b)"
      },
      {
        id: "video-comparer",
        title: "Comparer des nombres décimaux",
        description: "Vidéo explicative sur la comparaison de 1,503 et 1,71",
        type: "video",
        url: "/ia-ressources/ex1/video_comparer_decimaux.mp4",
        relatedTo: "Exercice 1 - Question a)"
      },
      {
        id: "video-difference",
        title: "Calculer une différence de prix",
        description: "Vidéo explicative sur le calcul d'un écart de prix",
        type: "video",
        url: "/ia-ressources/ex1/video_difference_prix.mp4",
        relatedTo: "Exercice 1 - Question b)"
      },
      {
        id: "image-comparer",
        title: "Illustration : Comparer les nombres",
        description: "Schéma visuel pour comprendre la comparaison",
        type: "image",
        url: "/ia-ressources/ex1/comparer_nombres_q1a.png",
        relatedTo: "Exercice 1 - Question a)"
      },
      {
        id: "image-ecart",
        title: "Illustration : Écart de prix",
        description: "Schéma visuel pour comprendre le calcul d'écart",
        type: "image",
        url: "/ia-ressources/ex1/ecart_prix_q1b.png",
        relatedTo: "Exercice 1 - Question b)"
      },
    ]
  }
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
};

export default function IAResourcesPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [selectedResource, setSelectedResource] = useState<typeof iaChapterResources["chapitre-2-prix"]["resources"][0] | null>(null);

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

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="w-[4vw] h-[4vw] md:w-5 md:h-5" />;
      case "image": return <Image className="w-[4vw] h-[4vw] md:w-5 md:h-5" />;
      case "pdf": return <FileDown className="w-[4vw] h-[4vw] md:w-5 md:h-5" />;
      case "audio": return <Headphones className="w-[4vw] h-[4vw] md:w-5 md:h-5" />;
      default: return <Bot className="w-[4vw] h-[4vw] md:w-5 md:h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-100 text-red-700 border-red-200";
      case "image": return "bg-blue-100 text-blue-700 border-blue-200";
      case "pdf": return "bg-orange-100 text-orange-700 border-orange-200";
      case "audio": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video": return "Vidéo";
      case "image": return "Illustration";
      case "pdf": return "Diaporama PDF";
      case "audio": return "Podcast";
      default: return "Ressource";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-[3vh] md:py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3 mb-[2vh] md:mb-4">
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

        {/* Description */}
        <p className="text-[3.5vw] md:text-base text-gray-600 mb-[4vh] md:mb-6">
          {iaData.description}
        </p>

        {/* Liste des ressources */}
        <div className="grid gap-[3vw] md:gap-4">
          {iaData.resources.map((resource) => (
            <Card
              key={resource.id}
              className="bg-white hover:shadow-md transition-shadow cursor-pointer border-l-4"
              style={{ borderLeftColor: resource.type === "video" ? "#dc2626" : resource.type === "pdf" ? "#ea580c" : resource.type === "image" ? "#2563eb" : "#7c3aed" }}
              onClick={() => {
                if (resource.type === "pdf") {
                  window.open(resource.url, '_blank');
                } else {
                  setSelectedResource(resource);
                }
              }}
            >
              <CardContent className="p-[4vw] md:p-4">
                <div className="flex items-start gap-[3vw] md:gap-4">
                  <div className={`p-[2vw] md:p-3 rounded-xl ${getTypeColor(resource.type)}`}>
                    {getIcon(resource.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-[2vw] md:gap-2 mb-1">
                      <h3 className="text-[4vw] md:text-lg font-semibold text-gray-800">{resource.title}</h3>
                      <span className={`text-[2.5vw] md:text-xs px-[2vw] py-[0.5vw] md:px-2 md:py-0.5 rounded-full font-medium ${getTypeColor(resource.type)}`}>
                        {getTypeLabel(resource.type)}
                      </span>
                    </div>
                    <p className="text-[3vw] md:text-sm text-gray-600 mb-2">{resource.description}</p>
                    {resource.relatedTo && (
                      <p className="text-[2.5vw] md:text-xs text-indigo-600 font-medium">
                        📌 {resource.relatedTo}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Modal pour afficher vidéo/image */}
      {selectedResource && selectedResource.type !== "pdf" && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-[4vw] md:p-6"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-[4vw] md:p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[4vw] md:text-lg">{selectedResource.title}</h3>
                <p className="text-[2.5vw] md:text-xs opacity-80">{getTypeLabel(selectedResource.type)}</p>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-2 hover:bg-white/20 rounded-full text-[4vw] md:text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-[4vw] md:p-6 bg-gray-900 flex items-center justify-center">
              {selectedResource.type === "video" ? (
                <video
                  src={selectedResource.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              ) : selectedResource.type === "image" ? (
                <img
                  src={selectedResource.url}
                  alt={selectedResource.title}
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              ) : selectedResource.type === "audio" ? (
                <audio src={selectedResource.url} controls autoPlay className="w-full" />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-100 border-t py-[2vh] md:py-4 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
