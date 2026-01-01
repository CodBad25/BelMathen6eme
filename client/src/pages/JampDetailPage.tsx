import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, ExternalLink } from "lucide-react";
import { useClasse } from "@/contexts/ClasseContext";
import { trpc } from "@/lib/trpc";

// Types de JAMP possibles
type JampType = "Méthode" | "Définition" | "Formule" | "Propriété" | "Astuce";

// Couleurs par type (badge)
const typeColors: Record<JampType, string> = {
  "Méthode": "bg-violet-100 text-violet-700",
  "Définition": "bg-red-100 text-red-700",
  "Formule": "bg-blue-100 text-blue-700",
  "Propriété": "bg-orange-100 text-orange-700",
  "Astuce": "bg-pink-100 text-pink-700",
};

// Couleurs du header par type
const headerColors: Record<JampType, string> = {
  "Méthode": "from-violet-500 to-purple-600",
  "Définition": "from-red-500 to-rose-600",
  "Formule": "from-blue-500 to-indigo-600",
  "Propriété": "from-orange-500 to-amber-600",
  "Astuce": "from-pink-500 to-rose-600",
};

export default function JampDetailPage() {
  const { chapterId, jampId } = useParams<{ chapterId: string; jampId: string }>();
  const { classe, isClasseView } = useClasse();
  const linkPrefix = isClasseView ? `/${classe}` : "";

  // Fetch JAMP from database (simplifié: plus de slides)
  const { data: jamp, isLoading, error } = trpc.jamps.getById.useQuery(
    { id: jampId || "" },
    { enabled: !!jampId }
  );

  if (isLoading) {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-violet-500 to-purple-600 text-white py-[2vh] md:py-4 px-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-64 bg-purple-400" />
          </div>
        </header>
        <main className="flex-1 flex flex-col p-[3vw] md:p-6">
          <Skeleton className="flex-1 max-w-2xl mx-auto w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!jamp || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">JAMP non trouvé</p>
          <Link href={`${linkPrefix}/grandeur/${chapterId}/jamp`}>
            <Button className="mt-4">Retour aux JAMP</Button>
          </Link>
        </div>
      </div>
    );
  }

  const jampType = jamp.type as JampType;

  // Render content based on type
  const renderContent = () => {
    if (!jamp.contentUrl) {
      return (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">Ce JAMP n'a pas encore de contenu.</p>
          <p className="text-sm text-gray-400 mt-2">Le contenu sera ajouté prochainement.</p>
        </div>
      );
    }

    switch (jamp.contentType) {
      case "image":
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={jamp.contentUrl}
              alt={jamp.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        );
      case "video":
        // Check if it's a YouTube/Peertube embed
        if (jamp.contentUrl.includes("youtube.com") || jamp.contentUrl.includes("youtu.be")) {
          const videoId = jamp.contentUrl.includes("youtu.be")
            ? jamp.contentUrl.split("/").pop()
            : new URLSearchParams(new URL(jamp.contentUrl).search).get("v");
          return (
            <div className="flex items-center justify-center h-full w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full aspect-video max-h-[70vh] rounded-lg shadow-lg border-0"
                title={jamp.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        // Direct video file
        return (
          <div className="flex items-center justify-center h-full">
            <video
              src={jamp.contentUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            >
              Votre navigateur ne supporte pas les vidéos.
            </video>
          </div>
        );
      case "pdf":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full gap-4">
            <iframe
              src={jamp.contentUrl}
              className="w-full h-[65vh] md:h-[70vh] rounded-lg shadow-lg border-0"
              title={jamp.title}
            />
            <a
              href={jamp.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 underline"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir le PDF en plein écran
            </a>
          </div>
        );
      default:
        return <p className="text-gray-500 text-center">Type de contenu non reconnu</p>;
    }
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className={`bg-gradient-to-r ${headerColors[jampType] || "from-violet-500 to-purple-600"} text-white py-[2vh] md:py-4 px-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="flex-shrink-0 h-[8vw] md:h-auto p-0 px-2 md:px-3"
              onClick={() => window.history.back()}
            >
              <RotateCcw className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
              <span className="ml-1 text-[3vw] md:text-sm">Retour</span>
            </Button>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">{jamp.icon || "📚"}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[2vw] md:text-xs font-medium ${typeColors[jampType] || "bg-gray-100 text-gray-700"}`}>
                    {jamp.type}
                  </span>
                </div>
                <p className="text-[4vw] md:text-lg font-semibold">{jamp.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-[3vw] md:p-6 overflow-hidden">
        {/* Description si présente */}
        {jamp.description && (
          <p className="text-center text-gray-600 mb-4 text-[3vw] md:text-base max-w-2xl mx-auto">
            {jamp.description}
          </p>
        )}

        {/* Contenu principal */}
        <Card className="flex-1 max-w-3xl mx-auto w-full overflow-hidden">
          <CardContent className="h-full flex flex-col p-[4vw] md:p-6">
            <div className="flex-1 flex items-center justify-center overflow-auto">
              {renderContent()}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
