import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, Eye, EyeOff, Play, FileText, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClasse } from "@/contexts/ClasseContext";

// Type pour les exercices classiques
type ExerciceClassique = {
  type: "exercice";
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  questionsCount?: number;
  hasCorrection: boolean;
};

// Type pour les animations géométriques
type ExerciceAnimation = {
  type: "animation";
  id: string;
  title: string;
  image: string;
  animationUrl: string;
  enonceUrl: string;
  travauxUrl?: string;
};

type Exercice = ExerciceClassique | ExerciceAnimation;

// Structure des exercices par étude
const exercicesByEtude: Record<string, Record<string, Exercice[]>> = {
  "chapitre-1-angles": {
    "etude-2": [
      {
        type: "animation",
        id: "eventail",
        title: "L'éventail",
        image: "/animations/eventail.png",
        animationUrl: "/animations/eventail.html",
        enonceUrl: "/animations/eventail-enonce.pdf",
        travauxUrl: "https://digipad.app/p/1454993/bd1a1cfd9f64d",
      },
      {
        type: "animation",
        id: "spirale",
        title: "La spirale",
        image: "/animations/spirale.png",
        animationUrl: "/animations/spirale.html",
        enonceUrl: "/animations/spirale-enonce.pdf",
        travauxUrl: "",
      },
      {
        type: "animation",
        id: "epidaure",
        title: "Le théâtre d'Epidaure",
        image: "/animations/epidaure.png",
        animationUrl: "/animations/epidaure.html",
        enonceUrl: "/animations/epidaure-enonce.pdf",
        travauxUrl: "https://digipad.app/p/1505390/d01fffc6f40fc8",
      },
    ]
  },
  "chapitre-2-prix": {
    "etude-1": [
      { type: "exercice", id: "ex1", title: "Exercice 1", subtitle: "Prix du gazole", icon: "⛽", questionsCount: 4, hasCorrection: true },
      { type: "exercice", id: "ex2", title: "Exercice 2", subtitle: "Remplir un chèque", icon: "📝", questionsCount: 3, hasCorrection: false },
      { type: "exercice", id: "ex3", title: "Exercice 3", subtitle: "Ai-je assez d'argent ?", icon: "💰", questionsCount: 3, hasCorrection: false },
      { type: "exercice", id: "ex4", title: "Exercice 4", subtitle: "Les romains", icon: "🏛️", questionsCount: 1, hasCorrection: false },
      { type: "exercice", id: "ex5", title: "Exercice 5", subtitle: "Prix de référence", icon: "⚖️", questionsCount: 3, hasCorrection: false },
      { type: "exercice", id: "ex6", title: "Exercice 6", subtitle: "Les salaires en k€", icon: "💼", questionsCount: 1, hasCorrection: false },
      { type: "exercice", id: "ex7", title: "Exercice 7", subtitle: "Comparer des salaires", icon: "📊", questionsCount: 1, hasCorrection: false },
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
  "chapitre-1-angles": {
    "etude-1": "Comparer des angles",
    "etude-2": "Multiplier et diviser des angles",
    "etude-3": "Additionner et soustraire des angles",
  },
  "chapitre-2-prix": {
    "etude-1": "Comparer des prix",
    "etude-2": "Calculer des prix",
    "etude-3": "Partager des prix",
  }
};

export default function ExercicesPage() {
  const { chapterId, sectionId } = useParams<{ chapterId: string; sectionId: string }>();
  const { classe, isClasseView } = useClasse();
  const linkPrefix = isClasseView ? `/${classe}` : "";

  // Récupère l'utilisateur (pour savoir si admin)
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const isAdmin = user?.role === "admin" ?? false;

  // Récupère les exercices masqués
  const { data: hiddenData, refetch: refetchHidden, isLoading: hiddenLoading } = trpc.exercices.getHidden.useQuery();
  const hiddenExercices = hiddenData?.hidden || [];

  // Attendre que les données soient chargées avant d'afficher
  const isLoading = userLoading || hiddenLoading;

  // Mutation pour toggle la visibilité
  const toggleMutation = trpc.exercices.toggleVisibility.useMutation({
    onSuccess: () => refetchHidden(),
  });

  // Mutation pour déconnexion
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const allExercices = (chapterId && sectionId) ? exercicesByEtude[chapterId]?.[sectionId] || [] : [];
  const etudeName = (chapterId && sectionId) ? etudeNames[chapterId]?.[sectionId] || sectionId : "";

  // Fonction pour créer l'ID complet de l'exercice
  const getExerciceFullId = (exerciceId: string) => `${chapterId}/${sectionId}/${exerciceId}`;

  // Fonction pour vérifier si un exercice est masqué
  const isHidden = (exerciceId: string) => hiddenExercices.includes(getExerciceFullId(exerciceId));

  // Filtrer les exercices : admin voit tout, élèves voient seulement les visibles
  const exercices = isAdmin ? allExercices : allExercices.filter(ex => !isHidden(ex.id));

  // Handler pour toggle
  const handleToggle = (exerciceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMutation.mutate({ exerciceId: getExerciceFullId(exerciceId) });
  };

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

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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
        {/* Bandeau Admin */}
        {isAdmin && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg mb-4 flex items-center justify-between">
            <span><span className="font-bold">Mode Admin</span> - Cliquez sur l'œil pour masquer/afficher</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Déconnexion
            </button>
          </div>
        )}

        <div className="text-center mb-[2vh] md:mb-4">
          <h2 className="text-[4vw] md:text-xl font-bold text-gray-800">Choisis un exercice</h2>
          <p className="text-[3vw] md:text-sm text-gray-600">
            {exercices.length} exercices disponibles
            {isAdmin && hiddenExercices.length > 0 && (
              <span className="text-red-500 ml-2">({hiddenExercices.length} masqué{hiddenExercices.length > 1 ? "s" : ""})</span>
            )}
          </p>
        </div>

        {exercices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-gray-500">Aucun exercice disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[3vw] md:gap-4">
            {exercices.map((exercice) => {
              const hidden = isHidden(exercice.id);

              // Carte pour les animations géométriques
              if (exercice.type === "animation") {
                return (
                  <div key={exercice.id} className="relative">
                    {/* Bouton admin pour masquer/afficher */}
                    {isAdmin && (
                      <button
                        onClick={(e) => handleToggle(exercice.id, e)}
                        className={`absolute top-1 left-1 md:top-2 md:left-2 z-20 w-[6vw] h-[6vw] md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${
                          hidden
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                        title={hidden ? "Afficher aux élèves" : "Masquer aux élèves"}
                      >
                        {hidden ? (
                          <EyeOff className="w-[3vw] h-[3vw] md:w-4 md:h-4" />
                        ) : (
                          <Eye className="w-[3vw] h-[3vw] md:w-4 md:h-4" />
                        )}
                      </button>
                    )}

                    <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full bg-white relative overflow-hidden ${
                      hidden && isAdmin ? "opacity-50 border-2 border-dashed border-red-300" : ""
                    }`}>
                      {/* Boutons dans les coins */}
                      <div className="absolute top-2 left-2 z-10">
                        <a
                          href={exercice.enonceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-md transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3 h-3" />
                          <span className="hidden md:inline">Énoncé</span>
                        </a>
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                        {exercice.travauxUrl ? (
                          <a
                            href={exercice.travauxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-md transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Users className="w-3 h-3" />
                            <span className="hidden md:inline">Travaux</span>
                          </a>
                        ) : null}
                      </div>

                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Image de l'animation */}
                        <div className="w-full h-32 md:h-40 overflow-hidden bg-gray-100">
                          <img
                            src={exercice.image}
                            alt={exercice.title}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Titre */}
                        <div className="p-3 text-center flex-1 flex flex-col justify-center">
                          <h3 className="font-bold text-base md:text-lg text-gray-800">
                            {exercice.title}
                          </h3>
                        </div>

                        {/* Bouton Animation en bas */}
                        <div className="p-3 pt-0">
                          <a
                            href={exercice.animationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all"
                          >
                            <Play className="w-4 h-4" />
                            Voir l'animation
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              }

              // Carte pour les exercices classiques
              return (
                <div key={exercice.id} className="relative">
                  {/* Bouton admin pour masquer/afficher */}
                  {isAdmin && (
                    <button
                      onClick={(e) => handleToggle(exercice.id, e)}
                      className={`absolute top-1 left-1 md:top-2 md:left-2 z-10 w-[6vw] h-[6vw] md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${
                        hidden
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                      title={hidden ? "Afficher aux élèves" : "Masquer aux élèves"}
                    >
                      {hidden ? (
                        <EyeOff className="w-[3vw] h-[3vw] md:w-4 md:h-4" />
                      ) : (
                        <Eye className="w-[3vw] h-[3vw] md:w-4 md:h-4" />
                      )}
                    </button>
                  )}

                  <Link href={`${linkPrefix}/grandeur/${chapterId}/${sectionId}/exercices/${exercice.id}`}>
                    <Card className={`group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full bg-white relative overflow-hidden ${
                      hidden && isAdmin ? "opacity-50 border-2 border-dashed border-red-300" : ""
                    }`}>
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
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
      </footer>
    </div>
  );
}
