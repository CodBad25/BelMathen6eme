import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, Play, HelpCircle } from "lucide-react";
import { useClasse } from "@/contexts/ClasseContext";
import { useState } from "react";

// Données du cours - structure pour chaque page
interface CoursPage {
  id: string;
  title: string;
  imageUrl: string;
  essentiel?: string[];
  animations?: { title: string; url: string }[];
  quiz?: { question: string; options: string[]; correctIndex: number }[];
}

// Cours par chapitre
const coursData: Record<string, CoursPage[]> = {
  "chapitre-1-angles": [
    {
      id: "page-1",
      title: "Définition et Comparaison",
      imageUrl: "https://nuage03.apps.education.fr/index.php/s/GdWi7zce4x977Eb/download",
      essentiel: [],
      animations: [],
      quiz: [],
    },
    {
      id: "page-2",
      title: "Outils et Types d'angles",
      imageUrl: "https://nuage03.apps.education.fr/index.php/s/kKfQwFgStFGWCd6/download",
      essentiel: [],
      animations: [],
      quiz: [],
    },
  ],
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-1-angles": { name: "Les Angles", icon: "📐", color: "from-indigo-500 to-blue-600" },
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
  "chapitre-3-aires": { name: "Les Aires", icon: "🔲", color: "from-teal-500 to-cyan-600" },
  "chapitre-4-durees": { name: "Les Durées", icon: "⏱️", color: "from-orange-500 to-amber-600" },
  "chapitre-5-volumes": { name: "Les Volumes", icon: "📦", color: "from-purple-500 to-violet-600" },
};

export default function CoursDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { classe, isClasseView } = useClasse();
  const linkPrefix = isClasseView ? `/${classe}` : "";

  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const pages = chapterId ? coursData[chapterId] || [] : [];

  if (!grandeur) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Cours non trouvé</p>
          <Link href={`${linkPrefix}/`}>
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = pages.find(p => p.id === selectedPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className={`bg-gradient-to-r from-rose-500 to-pink-600 text-white py-4 px-4 shadow-lg`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`${linkPrefix}/grandeur/${chapterId}`}>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-4xl">📚</span>
              <div>
                <h1 className="text-2xl font-bold">Cours</h1>
                <p className="text-sm opacity-90">{grandeur.icon} {grandeur.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto p-6 w-full">
        {!selectedPage ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Choisis une page du cours
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pages.map((page, index) => (
                <Card
                  key={page.id}
                  className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
                  onClick={() => setSelectedPage(page.id)}
                >
                  <div className="aspect-[3/4] relative bg-gray-100">
                    <img
                      src={page.imageUrl}
                      alt={page.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Page {index + 1}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800">{page.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Essentiel</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Animations</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Quiz</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : currentPage && (
          <>
            <Button
              variant="outline"
              onClick={() => setSelectedPage(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour aux pages
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image du cours */}
              <div className="lg:col-span-2">
                <Card className="overflow-hidden">
                  <img
                    src={currentPage.imageUrl}
                    alt={currentPage.title}
                    className="w-full h-auto"
                  />
                </Card>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">{currentPage.title}</h2>

                {/* Bouton Essentiel */}
                <Button
                  className="w-full justify-start gap-3 h-16 text-lg bg-yellow-500 hover:bg-yellow-600"
                  disabled={!currentPage.essentiel?.length}
                >
                  <Star className="w-6 h-6" />
                  <div className="text-left">
                    <div>L'Essentiel</div>
                    <div className="text-xs opacity-75">
                      {currentPage.essentiel?.length ? "Voir les points clés" : "Bientôt disponible"}
                    </div>
                  </div>
                </Button>

                {/* Bouton Animations */}
                <Button
                  className="w-full justify-start gap-3 h-16 text-lg bg-blue-500 hover:bg-blue-600"
                  disabled={!currentPage.animations?.length}
                >
                  <Play className="w-6 h-6" />
                  <div className="text-left">
                    <div>Animations</div>
                    <div className="text-xs opacity-75">
                      {currentPage.animations?.length ? "Voir les illustrations" : "Bientôt disponible"}
                    </div>
                  </div>
                </Button>

                {/* Bouton Quiz */}
                <Button
                  className="w-full justify-start gap-3 h-16 text-lg bg-green-500 hover:bg-green-600"
                  disabled={!currentPage.quiz?.length}
                >
                  <HelpCircle className="w-6 h-6" />
                  <div className="text-left">
                    <div>Quiz</div>
                    <div className="text-xs opacity-75">
                      {currentPage.quiz?.length ? "Teste tes connaissances" : "Bientôt disponible"}
                    </div>
                  </div>
                </Button>

                {/* Navigation entre pages */}
                <div className="flex gap-2 mt-6">
                  {pages.map((page, index) => (
                    <Button
                      key={page.id}
                      variant={page.id === selectedPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPage(page.id)}
                      className={page.id === selectedPage ? "bg-rose-500" : ""}
                    >
                      Page {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-3 text-center text-gray-600 text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
