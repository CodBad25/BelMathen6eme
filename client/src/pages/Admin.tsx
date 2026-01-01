import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, LogOut, Lock, Users, Check } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle>Espace Professeur</CardTitle>
          <CardDescription>Entrez le mot de passe pour accéder à l'administration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
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

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: resources, isLoading, error, refetch } = trpc.resources.list.useQuery();

  // Charger les classes actives depuis la base de données
  const { data: activeClassesData, isLoading: classesLoading } = trpc.settings.getActiveClasses.useQuery();
  const activeClasses = activeClassesData?.classes || ["6A", "6B", "6C", "6D"];

  // Mutation pour sauvegarder les classes actives
  const setActiveClassesMutation = trpc.settings.setActiveClasses.useMutation({
    onSuccess: () => {
      // Pas besoin de refetch car on met à jour l'état local
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleActiveClass = (classe: string) => {
    let newClasses: ("6A" | "6B" | "6C" | "6D")[];

    if (activeClasses.includes(classe)) {
      // Ne pas désactiver si c'est la dernière classe active
      if (activeClasses.length === 1) {
        toast.error("Vous devez garder au moins une classe active");
        return;
      }
      newClasses = activeClasses.filter(c => c !== classe) as ("6A" | "6B" | "6C" | "6D")[];
      toast.success(`Classe ${classe} désactivée`);
    } else {
      newClasses = [...activeClasses, classe] as ("6A" | "6B" | "6C" | "6D")[];
      toast.success(`Classe ${classe} activée`);
    }

    // Sauvegarder dans la base de données
    setActiveClassesMutation.mutate({ classes: newClasses });
  };

  const toggleMutation = trpc.resources.toggleVisibility.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Visibilité mise à jour");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleChapterMutation = trpc.resources.toggleChapter.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Chapitre mis à jour");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  if (authLoading || isLoading || classesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Accès refusé. Seuls les administrateurs peuvent accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
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

  resources?.forEach((resource) => {
    if (!chapterMap.has(resource.chapterId)) {
      const chapterTitles: Record<string, string> = {
        "chapitre-1-angles": "Chapitre 1 - Les Angles",
        "chapitre-2-prix": "Chapitre 2 - Les Prix",
        "chapitre-3-aires": "Chapitre 3 - Les Aires",
        "chapitre-4-durees": "Chapitre 4 - Les Durées",
        "chapitre-5-volumes": "Chapitre 5 - Les Volumes",
      };
      const chapterData: ChapterData = {
        id: resource.chapterId,
        title: chapterTitles[resource.chapterId] || resource.chapterId,
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
          "introduction": "🎯 Introduction",
          "etude-1": "📖 Étude n°1 - Comparer des angles",
          "etude-2": "📖 Étude n°2 - Multiplier et diviser des angles",
          "etude-3": "📖 Étude n°3 - Mesurer des angles",
          "activite-rapide": "⚡ Activités Rapides",
        },
        "chapitre-2-prix": {
          "introduction": "🎯 Introduction",
          "etude-1": "📖 Étude n°1 - Comparer des prix",
          "etude-2": "📖 Étude n°2 - Calculer des prix",
          "etude-3": "📖 Étude n°3 - Partager des prix",
          "activite-rapide": "⚡ Activités Rapides",
        },
        "chapitre-3-aires": {
          "introduction": "🎯 Introduction",
          "etude-1": "📖 Étude n°1 - Comparer des aires",
          "etude-2": "📖 Étude n°2 - Mesurer une aire",
          "etude-3": "📖 Étude n°3 - Calculer une aire",
          "activite-rapide": "⚡ Activités Rapides",
        },
        "chapitre-4-durees": {
          "introduction": "🎯 Introduction",
          "etude-1": "📖 Étude n°1 - Comparer, additionner, soustraire des durées",
          "etude-2": "📖 Étude n°2 - Multiplier et diviser des durées",
          "etude-3": "📖 Étude n°3 - Calculer des horaires, des dates ou des durées",
          "activite-rapide": "⚡ Activités Rapides",
        },
        "chapitre-5-volumes": {
          "introduction": "🎯 Introduction",
          "etude-1": "📖 Étude n°1 - Comparer des volumes",
          "etude-2": "📖 Étude n°2 - Rapport entre les volumes",
          "etude-3": "📖 Étude n°3 - Mesurer un volume",
          "etude-4": "📖 Étude n°4 - Calculer un volume",
          "activite-rapide": "⚡ Activités Rapides",
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

  const handleToggle = (resourceId: string, currentVisible: string) => {
    const newVisible = currentVisible === "true" ? "false" : "true";
    toggleMutation.mutate({ id: resourceId, visible: newVisible });
  };

  const handleToggleChapter = (chapterId: string, visible: "true" | "false") => {
    toggleChapterMutation.mutate({ chapterId, visible });
  };

  const visibleCount = resources?.filter((r) => r.visible === "true").length || 0;
  const totalCount = resources?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Administration</h1>
                <p className="text-xs md:text-sm text-gray-600">
                  {visibleCount} / {totalCount} ressources visibles
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="md:hidden">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/gestion">
                <Button variant="outline" size="sm">Gérer</Button>
              </Link>
              <Link href="/admin/jamp">
                <Button variant="outline" size="sm">JAMP</Button>
              </Link>
              <Link href="/admin/ordre">
                <Button variant="outline" size="sm">Réorganiser</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm">Voir le site</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout} className="hidden md:flex">
                <LogOut className="w-4 h-4 mr-1" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Panneau des classes */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-800">Mes classes cette année</CardTitle>
            </div>
            <CardDescription>
              Cliquez sur une classe pour l'activer/désactiver. Seules les classes actives s'affichent ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["6A", "6B", "6C", "6D"] as const).map((classe) => {
                const isActive = activeClasses.includes(classe);
                return (
                  <div
                    key={classe}
                    onClick={() => toggleActiveClass(classe)}
                    className={`rounded-lg p-3 border shadow-sm cursor-pointer transition-all ${
                      isActive
                        ? "bg-white border-blue-300 hover:border-blue-400"
                        : "bg-gray-100 border-gray-200 opacity-50 hover:opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`font-bold text-lg ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                        {classe}
                      </div>
                      {isActive && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    {isActive ? (
                      <>
                        <div className="text-xs text-gray-500 text-center mt-1 break-all">
                          belmathen6eme.vercel.app/{classe}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`https://belmathen6eme.vercel.app/${classe}`);
                            toast.success(`URL ${classe} copiée !`);
                          }}
                          className="w-full mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded transition-colors"
                        >
                          Copier le lien
                        </button>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 text-center mt-1">
                        Cliquez pour activer
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Comment ça marche ?</strong>
              </p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>Cliquez sur une carte pour activer/désactiver une classe</li>
                <li>Chaque élève accède avec l'URL de sa classe (ex: /6A)</li>
                <li>Dans <Link href="/admin/gestion" className="text-blue-600 underline">Gérer</Link>, cliquez sur les boutons <span className="bg-blue-500 text-white px-1 rounded text-xs">A</span> <span className="bg-gray-200 text-gray-500 px-1 rounded text-xs">B</span> etc. pour activer/désactiver une ressource pour chaque classe</li>
                <li>Une ressource doit d'abord être "Visible" (switch général) pour apparaître</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            Utilisez les interrupteurs ci-dessous pour activer ou désactiver la visibilité des
            ressources pour vos élèves. Les changements sont instantanés.
          </AlertDescription>
        </Alert>

        {chapters.map((chapter) => (
          <Card key={chapter.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{chapter.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleChapter(chapter.id, "true")}
                    disabled={toggleChapterMutation.isPending}
                  >
                    Tout activer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleChapter(chapter.id, "false")}
                    disabled={toggleChapterMutation.isPending}
                  >
                    Tout désactiver
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {chapter.sections.map((section) => {
                const allVisible = section.resources.every(r => r.visible === "true");
                const noneVisible = section.resources.every(r => r.visible === "false");
                const visibleCount = section.resources.filter(r => r.visible === "true").length;

                const handleToggleSection = () => {
                  // Si tout est visible, on masque tout. Sinon, on rend tout visible.
                  const newVisible = allVisible ? "false" : "true";
                  section.resources.forEach(resource => {
                    if (resource.visible !== newVisible) {
                      toggleMutation.mutate({ id: resource.id, visible: newVisible });
                    }
                  });
                };

                return (
                  <div key={section.id}>
                    <div
                      onClick={handleToggleSection}
                      className={`flex items-center justify-between mb-3 pb-2 border-b-2 cursor-pointer transition-all hover:bg-gray-50 rounded px-2 py-1 -mx-2 ${
                        allVisible
                          ? "border-green-400"
                          : noneVisible
                            ? "border-gray-300"
                            : "border-yellow-400"
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-purple-700">
                        {section.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          allVisible
                            ? "bg-green-100 text-green-700"
                            : noneVisible
                              ? "bg-gray-100 text-gray-500"
                              : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {visibleCount}/{section.resources.length}
                        </span>
                        {allVisible ? (
                          <Eye className="w-5 h-5 text-green-600" />
                        ) : noneVisible ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {section.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-2xl">{resource.icon || "📄"}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{resource.title}</p>
                              {resource.description && (
                                <p className="text-sm text-gray-600">{resource.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              {resource.visible === "true" ? (
                                <>
                                  <Eye className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600 font-medium">Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400 font-medium">Masqué</span>
                                </>
                              )}
                            </div>
                            <Switch
                              checked={resource.visible === "true"}
                              onCheckedChange={() => handleToggle(resource.id, resource.visible)}
                              disabled={toggleMutation.isPending}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}

