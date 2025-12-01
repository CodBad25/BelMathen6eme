import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

// Données des méthodes par chapitre - version courte pour la liste
const methodesByChapter: Record<string, { id: string; title: string; shortTitle: string; icon: string; description: string }[]> = {
  "chapitre-2-prix": [
    {
      id: "M2.1",
      title: "M2.1 - Comparer deux nombres décimaux",
      shortTitle: "Comparer des décimaux",
      icon: "🔢",
      description: "Savoir quel nombre est le plus grand"
    },
    {
      id: "M2.2",
      title: "M2.2 - Calculer une différence",
      shortTitle: "Calculer une différence",
      icon: "➖",
      description: "Trouver l'écart entre deux prix"
    }
  ]
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-1-angles": { name: "Les Angles", icon: "📐", color: "from-indigo-500 to-blue-600" },
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
  "chapitre-3-aires": { name: "Les Aires", icon: "🔲", color: "from-teal-500 to-cyan-600" },
  "chapitre-4-durees": { name: "Les Durées", icon: "⏱️", color: "from-orange-500 to-amber-600" },
  "chapitre-5-volumes": { name: "Les Volumes", icon: "📦", color: "from-purple-500 to-violet-600" },
};

export default function MethodesPage() {
  const { chapterId } = useParams<{ chapterId: string }>();

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const methodes = chapterId ? methodesByChapter[chapterId] || [] : [];

  if (!grandeur) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Chapitre non trouvé</p>
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
        <div className="max-w-4xl mx-auto">
          <p className="text-[2vw] md:text-sm opacity-75 text-center">Réalisé avec ❤️ par M.BELHAJ</p>
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href={`/grandeur/${chapterId}`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">📚</span>
              <div>
                <h1 className="text-[5vw] md:text-2xl font-bold">Méthodes</h1>
                <p className="text-[3vw] md:text-base opacity-90">{grandeur.icon} {grandeur.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-[3vw] md:p-6 w-full flex flex-col">
        <div className="text-center mb-[2vh] md:mb-6">
          <h2 className="text-[4vw] md:text-xl font-bold text-gray-800">Choisis une méthode</h2>
        </div>

        {methodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucune méthode disponible.</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-[3vw] md:gap-6 content-center">
            {methodes.map((methode) => (
              <Link key={methode.id} href={`/grandeur/${chapterId}/methodes/${methode.id}`}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full bg-white">
                  <CardContent className="p-[3vw] md:p-6 flex flex-col items-center text-center h-full justify-center">
                    <span className="text-[12vw] md:text-6xl mb-[1vh] md:mb-3">{methode.icon}</span>
                    <h3 className="font-bold text-[4vw] md:text-lg text-gray-800 group-hover:text-green-600 transition-colors mb-1">
                      {methode.shortTitle}
                    </h3>
                    <p className="text-[3vw] md:text-sm text-gray-600">
                      {methode.description}
                    </p>
                    <div className="mt-[1vh] md:mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[2.5vw] md:text-xs font-medium">
                      {methode.id}
                    </div>
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
