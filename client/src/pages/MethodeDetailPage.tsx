import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// Contenu simplifié des méthodes - chaque "étape" est une slide
const methodesContent: Record<string, {
  title: string;
  icon: string;
  color: string;
  slides: { title: string; content: React.ReactNode }[];
}> = {
  "M2.1": {
    title: "Comparer deux nombres décimaux",
    icon: "🔢",
    color: "from-blue-500 to-indigo-600",
    slides: [
      {
        title: "🎯 Quand l'utiliser ?",
        content: (
          <div className="space-y-4 text-center">
            <p className="text-[4vw] md:text-xl">Quand tu dois savoir :</p>
            <p className="text-[5vw] md:text-2xl font-bold text-blue-600">
              Quel nombre est le plus GRAND ?
            </p>
            <p className="text-[5vw] md:text-2xl font-bold text-blue-600">
              Quel nombre est le plus PETIT ?
            </p>
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
              <p className="text-[3.5vw] md:text-lg">Exemples : comparer des prix, des notes...</p>
            </div>
          </div>
        )
      },
      {
        title: "📐 La Méthode",
        content: (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-[4vw] md:text-xl font-bold text-green-700 mb-2">
                Égalise les chiffres après la virgule
              </p>
              <p className="text-[3.5vw] md:text-lg">Ajoute des zéros à droite !</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-[3vw] md:text-base text-gray-500">Avant</p>
                <p className="text-[5vw] md:text-2xl font-mono font-bold">1,71</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-[3vw] md:text-base text-gray-500">Après</p>
                <p className="text-[5vw] md:text-2xl font-mono font-bold text-green-600">1,710</p>
              </div>
            </div>
            <p className="text-center text-[3.5vw] md:text-lg text-gray-600">
              💡 Ajouter des zéros ne change PAS le nombre !
            </p>
          </div>
        )
      },
      {
        title: "💡 Exemple",
        content: (
          <div className="space-y-4">
            <p className="text-[4vw] md:text-xl text-center">Compare <strong>1,503</strong> et <strong>1,71</strong></p>
            <div className="bg-blue-50 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[3.5vw] md:text-lg">1. J'égalise :</span>
                <span className="font-mono text-[4vw] md:text-xl">1,71 → 1,710</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[3.5vw] md:text-lg">2. Je compare :</span>
                <span className="font-mono text-[4vw] md:text-xl">503 &lt; 710</span>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-xl text-center">
              <p className="text-[4vw] md:text-xl font-bold text-green-700">
                ✅ Donc : 1,503 &lt; 1,71
              </p>
            </div>
          </div>
        )
      },
      {
        title: "⚠️ Attention !",
        content: (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-[3.5vw] md:text-lg text-red-700 font-bold mb-2">❌ Erreur fréquente</p>
              <p className="text-[3.5vw] md:text-lg">"1,503 a plus de chiffres donc c'est plus grand"</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-[3.5vw] md:text-lg text-green-700 font-bold mb-2">✅ La vérité</p>
              <p className="text-[3.5vw] md:text-lg">Le nombre de chiffres ne compte pas !</p>
              <p className="text-[4vw] md:text-xl font-bold text-center mt-2">1,9 &gt; 1,503</p>
            </div>
          </div>
        )
      },
      {
        title: "🎓 À retenir",
        content: (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">1️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Égalise les chiffres après la virgule</p>
            </div>
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">2️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Compare comme des entiers</p>
            </div>
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">3️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Ajouter des 0 ne change PAS le nombre</p>
            </div>
          </div>
        )
      }
    ]
  },
  "M2.2": {
    title: "Calculer une différence de prix",
    icon: "➖",
    color: "from-green-500 to-emerald-600",
    slides: [
      {
        title: "🎯 Quand l'utiliser ?",
        content: (
          <div className="space-y-4 text-center">
            <p className="text-[4vw] md:text-xl">Quand tu veux savoir :</p>
            <p className="text-[5vw] md:text-2xl font-bold text-green-600">
              Combien coûte EN PLUS ?
            </p>
            <p className="text-[5vw] md:text-2xl font-bold text-green-600">
              Quelle est la différence ?
            </p>
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
              <p className="text-[3.5vw] md:text-lg">Exemples : écart de prix, économie...</p>
            </div>
          </div>
        )
      },
      {
        title: "📐 La Formule Magique",
        content: (
          <div className="space-y-6 text-center">
            <div className="bg-green-100 p-6 rounded-2xl">
              <p className="text-[5vw] md:text-3xl font-bold text-green-700">
                Plus grand − Plus petit
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl">
              <p className="text-[3.5vw] md:text-lg">💡 Toujours dans cet ordre !</p>
              <p className="text-[3.5vw] md:text-lg">Une différence est toujours <strong>positive</strong></p>
            </div>
          </div>
        )
      },
      {
        title: "📝 Les étapes",
        content: (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">1️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Trouve le plus grand</p>
            </div>
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">2️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Égalise les chiffres (ajoute des 0)</p>
            </div>
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">3️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Aligne les virgules</p>
            </div>
            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow">
              <span className="text-[5vw] md:text-2xl">4️⃣</span>
              <p className="text-[3.5vw] md:text-lg">Soustrais normalement</p>
            </div>
          </div>
        )
      },
      {
        title: "💡 Exemple",
        content: (
          <div className="space-y-4">
            <p className="text-[3.5vw] md:text-lg text-center">Différence entre 1,71 € et 1,503 € ?</p>
            <div className="bg-white p-4 rounded-xl shadow text-center font-mono">
              <div className="text-[5vw] md:text-2xl space-y-1">
                <p>&nbsp;&nbsp;1,710</p>
                <p>− 1,503</p>
                <div className="border-t-2 border-gray-400 my-2"></div>
                <p className="text-green-600 font-bold">&nbsp;&nbsp;0,207</p>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-xl text-center">
              <p className="text-[3.5vw] md:text-lg font-bold text-green-700">
                ✅ Différence = 0,207 € (20,7 centimes)
              </p>
            </div>
          </div>
        )
      },
      {
        title: "⚠️ Attention !",
        content: (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-[3.5vw] md:text-lg text-red-700 font-bold mb-2">❌ Ne fais PAS</p>
              <p className="text-[3.5vw] md:text-lg">Plus petit − Plus grand</p>
              <p className="text-[3vw] md:text-base text-red-600">(Tu aurais un résultat négatif !)</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-[3.5vw] md:text-lg text-red-700 font-bold mb-2">❌ N'oublie pas</p>
              <p className="text-[3.5vw] md:text-lg">D'égaliser les chiffres !</p>
            </div>
          </div>
        )
      },
      {
        title: "🎓 À retenir",
        content: (
          <div className="space-y-4 text-center">
            <div className="bg-green-100 p-6 rounded-2xl">
              <p className="text-[5vw] md:text-2xl font-bold text-green-700 mb-2">
                Différence =
              </p>
              <p className="text-[5vw] md:text-2xl font-bold text-green-700">
                Plus grand − Plus petit
              </p>
            </div>
            <p className="text-[3.5vw] md:text-lg text-gray-600">
              👆 C'est la seule chose à retenir !
            </p>
          </div>
        )
      }
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

export default function MethodeDetailPage() {
  const { chapterId, methodeId } = useParams<{ chapterId: string; methodeId: string }>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const methode = methodeId ? methodesContent[methodeId] : null;

  if (!grandeur || !methode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Méthode non trouvée</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalSlides = methode.slides.length;
  const slide = methode.slides[currentSlide];

  const goNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className={`bg-gradient-to-r ${methode.color} text-white py-[2vh] md:py-4 px-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href={`/grandeur/${chapterId}/methodes`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">{methode.icon}</span>
              <div>
                <h1 className="text-[4vw] md:text-xl font-bold">{methodeId}</h1>
                <p className="text-[3vw] md:text-sm opacity-90">{methode.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-[3vw] md:p-6 overflow-hidden">
        {/* Indicateurs de slide */}
        <div className="flex justify-center gap-2 mb-[2vh] md:mb-4">
          {methode.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-[2.5vw] h-[2.5vw] md:w-3 md:h-3 rounded-full transition-all ${
                idx === currentSlide
                  ? "bg-green-500 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* Contenu du slide */}
        <Card className="flex-1 max-w-2xl mx-auto w-full overflow-hidden">
          <CardContent className="h-full flex flex-col p-[4vw] md:p-6">
            <h2 className="text-[5vw] md:text-2xl font-bold text-center text-gray-800 mb-[3vh] md:mb-6">
              {slide.title}
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                {slide.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-[2vh] md:mt-4 px-[2vw]">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="h-[10vw] w-[10vw] md:h-12 md:w-12 p-0 rounded-full"
          >
            <ChevronLeft className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
          </Button>

          <span className="text-[3.5vw] md:text-base text-gray-500">
            {currentSlide + 1} / {totalSlides}
          </span>

          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentSlide === totalSlides - 1}
            className="h-[10vw] w-[10vw] md:h-12 md:w-12 p-0 rounded-full"
          >
            <ChevronRight className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
          </Button>
        </div>
      </main>
    </div>
  );
}
