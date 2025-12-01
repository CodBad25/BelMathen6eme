import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getSchoolYear } from "@shared/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, ExternalLink, Lock, Unlock, Eye, EyeOff, LogOut, FileText, X, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Interface pour la ressource sélectionnée pour l'aperçu
interface SelectedResource {
  title: string;
  url: string;
  icon: string | null;
}

interface ChapterData {
  id: string;
  title: string;
  sections: {
    id: string;
    title: string;
    resources: Array<{
      id: string;
      title: string;
      description: string | null;
      type: string;
      url: string;
      icon: string | null;
      visible: string;
    }>;
  }[];
}

export default function CoursEleves() {
  const { chapterId } = useParams<{ chapterId?: string }>();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<SelectedResource | null>(null);

  const { data: resources, isLoading, error, refetch } = trpc.resources.list.useQuery();
  const { data: user, refetch: refetchUser } = trpc.auth.me.useQuery();

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => {
      toast.success("Connexion réussie !");
      setShowLoginDialog(false);
      setPassword("");
      refetchUser();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Déconnexion réussie");
      refetchUser();
    },
  });

  const toggleMutation = trpc.resources.toggleVisibility.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Visibilité mise à jour");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isAdmin = user?.role === "admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync({ password });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleToggleVisibility = (resourceId: string, currentVisible: string) => {
    const newVisible = currentVisible === "true" ? "false" : "true";
    toggleMutation.mutate({ id: resourceId, visible: newVisible });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erreur de chargement: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Organiser les ressources par chapitre et section
  const chapters: ChapterData[] = [];
  const chapterMap = new Map<string, ChapterData>();

  // Mapping des noms de chapitres (sans numéros, ils seront ajoutés dynamiquement)
  const chapterNames: Record<string, string> = {
    "chapitre-1-angles": "Les Angles",
    "chapitre-2-prix": "Les Prix",
    "chapitre-3-aires": "Les Aires",
    "chapitre-4-durees": "Les Durées",
    "chapitre-5-volumes": "Les Volumes",
  };

  resources?.forEach((resource) => {
    if (!chapterMap.has(resource.chapterId)) {
      const chapterData: ChapterData = {
        id: resource.chapterId,
        title: chapterNames[resource.chapterId] || resource.chapterId,
        sections: [],
      };
      chapterMap.set(resource.chapterId, chapterData);
      chapters.push(chapterData);
    }

    const chapter = chapterMap.get(resource.chapterId)!;
    let section = chapter.sections.find((s) => s.id === resource.sectionId);

    if (!section) {
      // Sections spécifiques par chapitre
      const sectionTitlesByChapter: Record<string, Record<string, string>> = {
        "chapitre-1-angles": {
          "introduction": "Introduction",
          "etude-1": "Étude n°1 - Comparer des angles",
          "etude-2": "Étude n°2 - Multiplier et diviser des angles",
          "etude-3": "Étude n°3 - Mesurer des angles",
          "activite-rapide": "Activités Rapides",
        },
        "chapitre-2-prix": {
          "introduction": "Introduction",
          "etude-1": "Étude n°1 - Comparer des prix",
          "etude-2": "Étude n°2 - Calculer des prix",
          "etude-3": "Étude n°3 - Partager des prix",
          "activite-rapide": "Activités Rapides",
        },
        "chapitre-3-aires": {
          "introduction": "Introduction",
          "etude-1": "Étude n°1 - Comparer des aires",
          "etude-2": "Étude n°2 - Mesurer une aire",
          "etude-3": "Étude n°3 - Calculer une aire",
          "activite-rapide": "Activités Rapides",
        },
        "chapitre-4-durees": {
          "introduction": "Introduction",
          "etude-1": "Étude n°1 - Comparer, additionner, soustraire des durées",
          "etude-2": "Étude n°2 - Multiplier et diviser des durées",
          "etude-3": "Étude n°3 - Calculer des horaires, des dates ou des durées",
          "activite-rapide": "Activités Rapides",
        },
        "chapitre-5-volumes": {
          "introduction": "Introduction",
          "etude-1": "Étude n°1 - Comparer des volumes",
          "etude-2": "Étude n°2 - Rapport entre les volumes",
          "etude-3": "Étude n°3 - Mesurer un volume",
          "etude-4": "Étude n°4 - Calculer un volume",
          "activite-rapide": "Activités Rapides",
        },
      };
      const sectionTitles = sectionTitlesByChapter[resource.chapterId] || {};

      section = {
        id: resource.sectionId,
        title: sectionTitles[resource.sectionId] || resource.sectionId,
        resources: [],
      };
      chapter.sections.push(section);
    }

    section.resources.push(resource);
  });

  // Trier les chapitres par displayOrder
  chapters.sort((a, b) => {
    const orderA = resources?.find(r => r.chapterId === a.id)?.displayOrder || 0;
    const orderB = resources?.find(r => r.chapterId === b.id)?.displayOrder || 0;
    return orderA - orderB;
  });

  // Si admin: montrer tout, sinon filtrer les ressources visibles
  let displayChapters = isAdmin
    ? chapters.map((chapter, index) => ({
        ...chapter,
        title: `Chapitre ${index + 1} - ${chapter.title}`,
      }))
    : chapters
        .map((chapter) => ({
          ...chapter,
          sections: chapter.sections
            .map((section) => ({
              ...section,
              resources: section.resources.filter((r) => r.visible === "true"),
            }))
            .filter((section) => section.resources.length > 0),
        }))
        .filter((chapter) => chapter.sections.length > 0)
        .map((chapter, index) => ({
          ...chapter,
          title: `Chapitre ${index + 1} - ${chapter.title}`,
        }));

  // Filtrer par chapitre si un chapterId est fourni dans l'URL
  if (chapterId) {
    displayChapters = displayChapters.filter((chapter) => chapter.id === chapterId);
  }

  // Trouver le nom du chapitre actuel
  const currentChapterName = chapterId ? chapterNames[chapterId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 md:py-12 px-4 md:px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs md:text-sm opacity-75 mb-2 text-center">Réalisé avec ❤️ par M.BELHAJ</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="secondary" size="sm" className="flex-shrink-0">
                  <Home className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Accueil</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                  {currentChapterName || "Mathématiques 6e"}
                </h1>
                <p className="text-base md:text-xl opacity-90">Collège Gaston Chaissac - {getSchoolYear()}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 md:gap-3 bg-white/20 rounded-lg px-3 md:px-4 py-2 self-start md:self-auto">
                <span className="text-xs md:text-sm font-medium hidden sm:inline">Mode professeur</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Déconnexion</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {isAdmin && (
          <Alert className="bg-amber-50 border-amber-200">
            <Eye className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Mode professeur actif.</strong> Cliquez sur l'icône <Eye className="inline w-4 h-4" /> pour rendre une ressource visible aux élèves,
              ou <EyeOff className="inline w-4 h-4" /> pour la masquer. Les ressources grisées sont invisibles pour les élèves.
            </AlertDescription>
          </Alert>
        )}

        {displayChapters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">Aucune ressource disponible pour le moment.</p>
              <p className="text-sm mt-2">Votre enseignant publiera bientôt du contenu.</p>
            </CardContent>
          </Card>
        ) : (
          displayChapters.map((chapter) => (
            <Card key={chapter.id} className="overflow-hidden border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <CardTitle className="text-2xl">{chapter.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {chapter.sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-xl font-semibold text-purple-700 mb-4 pb-2 border-b-2 border-purple-200">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.resources.map((resource) => {
                        const isHidden = resource.visible !== "true";
                        return (
                          <Card
                            key={resource.id}
                            className={`hover:shadow-md transition-all ${isHidden && isAdmin ? "opacity-50 border-dashed border-2 border-gray-300" : ""}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <div className="text-3xl flex-shrink-0">{resource.icon || "📄"}</div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base leading-tight flex items-center gap-2">
                                    {resource.title}
                                    {isAdmin && isHidden && (
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">masqué</span>
                                    )}
                                  </CardTitle>
                                  {resource.description && (
                                    <CardDescription className="text-sm mt-1">
                                      {resource.description}
                                    </CardDescription>
                                  )}
                                </div>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`flex-shrink-0 ${resource.visible === "true" ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"}`}
                                    onClick={() => handleToggleVisibility(resource.id, resource.visible)}
                                    disabled={toggleMutation.isPending}
                                    title={resource.visible === "true" ? "Masquer cette ressource" : "Rendre visible"}
                                  >
                                    {resource.visible === "true" ? (
                                      <Eye className="w-5 h-5" />
                                    ) : (
                                      <EyeOff className="w-5 h-5" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {resource.type === "video" ? (
                                <Button
                                  asChild
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                  size="sm"
                                >
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Voir la vidéo
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                  size="sm"
                                  onClick={() => setSelectedPdf({
                                    title: resource.title,
                                    url: resource.url,
                                    icon: resource.icon,
                                  })}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Consulter
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <footer className="bg-gray-100 border-t mt-12 py-6 text-center text-gray-600">
        <p>Mathématiques 6e - Collège Gaston Chaissac - Année {getSchoolYear()}</p>
      </footer>

      {/* Bouton admin discret en bas à droite */}
      {!isAdmin && (
        <button
          onClick={() => setShowLoginDialog(true)}
          className="fixed bottom-4 right-4 p-3 bg-gray-200 hover:bg-gray-300 rounded-full shadow-lg transition-all opacity-30 hover:opacity-100"
          title="Accès professeur"
        >
          <Lock className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Dialog de connexion */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Accès professeur
            </DialogTitle>
            <DialogDescription>
              Entrez le mot de passe pour gérer les ressources visibles.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowLoginDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoggingIn || !password}>
                {isLoggingIn ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'aperçu PDF */}
      <Dialog open={!!selectedPdf} onOpenChange={(open) => !open && setSelectedPdf(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
            <DialogDescription className="sr-only">Aperçu du document PDF</DialogDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedPdf?.icon || "📄"}</span>
                <DialogTitle className="text-lg">{selectedPdf?.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedPdf?.url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPdf(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-2">
            {selectedPdf && (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf.url)}&embedded=true`}
                className="w-full h-full rounded border"
                title={selectedPdf.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
