import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit, Home, ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminGestion() {
  const { user, loading: authLoading } = useAuth();
  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery();
  const toggleVisibility = trpc.resources.toggleVisibility.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Visibilité modifiée");
    },
  });
  const toggleChapter = trpc.resources.toggleChapter.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Chapitre modifié");
    },
  });
  const toggleClassVisibility = trpc.resources.toggleClassVisibility.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const createMutation = trpc.resources.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Ressource créée");
      setShowForm(false);
      resetForm();
    },
  });
  const deleteMutation = trpc.resources.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Ressource supprimée");
    },
  });

  const bulkDeleteMutation = trpc.resources.bulkDelete.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`${data.count} ressource(s) supprimée(s)`);
      setSelectedIds([]);
    },
  });

  const moveMutation = trpc.resources.moveResource.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Ressource déplacée");
      setEditingResource(null);
    },
    onError: () => {
      toast.error("Erreur lors du déplacement");
    },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Ressource modifiée");
      setEditingResource(null);
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const setCorrectionMutation = trpc.resources.setCorrection.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Correction associée");
    },
    onError: () => {
      toast.error("Erreur lors de l'association");
    },
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [moveToChapter, setMoveToChapter] = useState<string>("");
  const [editCorrectionId, setEditCorrectionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    chapterId: "chapitre-1-angles",
    sectionId: "introduction",
    title: "",
    description: "",
    type: "pdf" as "pdf" | "video" | "link",
    url: "",
    icon: "",
    visible: "false" as "true" | "false",
  });

  const resetForm = () => {
    setFormData({
      chapterId: "chapitre-1-angles",
      sectionId: "introduction",
      title: "",
      description: "",
      type: "pdf",
      url: "",
      icon: "",
      visible: "false",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.url) {
      toast.error("Titre et URL requis");
      return;
    }
    createMutation.mutate(formData);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>Seuls les administrateurs peuvent accéder à cette page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const groupedResources = resources?.reduce((acc, r) => {
    if (!acc[r.chapterId]) acc[r.chapterId] = [];
    acc[r.chapterId].push(r);
    return acc;
  }, {} as Record<string, typeof resources>);

  const visibleCount = resources?.filter((r) => r.visible === "true").length || 0;

  const chapterNames: Record<string, string> = {
    "chapitre-1-angles": "Les Angles",
    "chapitre-2-prix": "Les Prix",
    "chapitre-3-aires": "Les Aires",
    "chapitre-4-durees": "Les Durées",
    "chapitre-5-volumes": "Les Volumes",
  };

  // Sections spécifiques par chapitre (structure Nextcloud)
  const sectionsByChapter: Record<string, Array<{ id: string; label: string }>> = {
    "chapitre-1-angles": [
      { id: "introduction", label: "🎯 Introduction" },
      { id: "etude-1", label: "📖 Étude n°1 - Comparer des angles" },
      { id: "etude-2", label: "📖 Étude n°2 - Multiplier et diviser des angles" },
      { id: "etude-3", label: "📖 Étude n°3 - Mesurer des angles" },
      { id: "activite-rapide", label: "⚡ Activités Rapides" },
    ],
    "chapitre-2-prix": [
      { id: "introduction", label: "🎯 Introduction" },
      { id: "etude-1", label: "📖 Étude n°1 - Comparer des prix" },
      { id: "etude-2", label: "📖 Étude n°2 - Calculer des prix" },
      { id: "etude-3", label: "📖 Étude n°3 - Partager des prix" },
      { id: "activite-rapide", label: "⚡ Activités Rapides" },
    ],
    "chapitre-3-aires": [
      { id: "introduction", label: "🎯 Introduction" },
      { id: "etude-1", label: "📖 Étude n°1 - Comparer des aires" },
      { id: "etude-2", label: "📖 Étude n°2 - Mesurer une aire" },
      { id: "etude-3", label: "📖 Étude n°3 - Calculer une aire" },
      { id: "activite-rapide", label: "⚡ Activités Rapides" },
    ],
    "chapitre-4-durees": [
      { id: "introduction", label: "🎯 Introduction" },
      { id: "etude-1", label: "📖 Étude n°1 - Comparer, additionner, soustraire des durées" },
      { id: "etude-2", label: "📖 Étude n°2 - Multiplier et diviser des durées" },
      { id: "etude-3", label: "📖 Étude n°3 - Calculer des horaires, des dates ou des durées" },
      { id: "activite-rapide", label: "⚡ Activités Rapides" },
    ],
    "chapitre-5-volumes": [
      { id: "introduction", label: "🎯 Introduction" },
      { id: "etude-1", label: "📖 Étude n°1 - Comparer des volumes" },
      { id: "etude-2", label: "📖 Étude n°2 - Rapport entre les volumes" },
      { id: "etude-3", label: "📖 Étude n°3 - Mesurer un volume" },
      { id: "etude-4", label: "📖 Étude n°4 - Calculer un volume" },
      { id: "activite-rapide", label: "⚡ Activités Rapides" },
    ],
  };

  const currentSections = sectionsByChapter[formData.chapterId] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gestion des ressources</h1>
              <p className="text-gray-600 mt-1">
                {visibleCount}/{resources?.length || 0} ressources visibles
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectMode && selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Supprimer ${selectedIds.length} ressource(s) ?`)) {
                    bulkDeleteMutation.mutate({ ids: selectedIds });
                  }
                }}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer ({selectedIds.length})
              </Button>
            )}
            <Button
              variant={selectMode ? "outline" : "secondary"}
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds([]);
              }}
            >
              {selectMode ? "Annuler" : "Mode sélection"}
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle ressource
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Créer une nouvelle ressource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chapitre</Label>
                  <Select value={formData.chapterId} onValueChange={(v) => setFormData({ ...formData, chapterId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chapterNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={formData.sectionId} onValueChange={(v) => setFormData({ ...formData, sectionId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Titre</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nom de la ressource"
                />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description courte de la ressource"
                />
              </div>
              <div>
                <Label>Icône (emoji)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📄 (un emoji)"
                  maxLength={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="link">Lien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.visible === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, visible: checked ? "true" : "false" })}
                />
                <Label>Visible pour les élèves</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {Object.entries(groupedResources || {}).map(([chapterId, chapterResources]) => {
            const visibleInChapter = chapterResources.filter((r) => r.visible === "true").length;
            return (
              <Card key={chapterId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{chapterNames[chapterId] || `Chapitre ${chapterId}`}</CardTitle>
                      <CardDescription>
                        {visibleInChapter}/{chapterResources.length} ressources visibles
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleChapter.mutate({ chapterId, visible: "true" })}
                      >
                        Tout activer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleChapter.mutate({ chapterId, visible: "false" })}
                      >
                        Tout désactiver
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {chapterResources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        {selectMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(resource.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, resource.id]);
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== resource.id));
                              }
                            }}
                            className="mr-3 h-4 w-4"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{resource.title}</p>
                            {resource.correctionId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                C
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {resource.sectionId} • {resource.type}
                          </p>
                        </div>
                        {!selectMode && (
                          <div className="flex items-center gap-3">
                            {/* Visibilité générale */}
                            <div className="flex items-center gap-1" title="Visibilité générale">
                              <span className="text-xs text-gray-500">Vis</span>
                              <Switch
                                checked={resource.visible === "true"}
                                onCheckedChange={(checked) =>
                                  toggleVisibility.mutate({ id: resource.id, visible: checked ? "true" : "false" })
                                }
                              />
                            </div>
                            {/* Visibilité par classe */}
                            <div className="flex items-center gap-1 border-l pl-2">
                              {(["6A", "6B", "6C", "6D"] as const).map((classe) => {
                                const field = `visible${classe}` as keyof typeof resource;
                                const isVisible = resource[field] === "true";
                                return (
                                  <button
                                    key={classe}
                                    onClick={() => toggleClassVisibility.mutate({
                                      id: resource.id,
                                      classe,
                                      visible: isVisible ? "false" : "true"
                                    })}
                                    className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                                      isVisible
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                    title={`${classe}: ${isVisible ? "visible" : "masqué"}`}
                                  >
                                    {classe.replace("6", "")}
                                  </button>
                                );
                              })}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingResource(resource.id);
                                setEditTitle(resource.title);
                                setEditUrl(resource.url);
                                setMoveToChapter(resource.chapterId);
                                setEditCorrectionId(resource.correctionId || null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate({ id: resource.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal d'édition */}
        {editingResource && (() => {
          const currentResource = resources?.find(r => r.id === editingResource);
          // Corrections disponibles pour ce chapitre
          const availableCorrections = resources?.filter(
            r => r.sectionId === "corrections" && r.chapterId === currentResource?.chapterId
          ) || [];

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Modifier la ressource</CardTitle>
                  <CardDescription>Modifiez le titre, l'URL ou associez une correction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Titre de la ressource"
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Chapitre</Label>
                    <Select value={moveToChapter} onValueChange={setMoveToChapter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(chapterNames).map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur de correction - seulement si pas dans la section corrections */}
                  {currentResource?.sectionId !== "corrections" && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Correction associée
                      </Label>
                      <Select
                        value={editCorrectionId || "none"}
                        onValueChange={(v) => setEditCorrectionId(v === "none" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune correction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune correction</SelectItem>
                          {availableCorrections.map((corr) => (
                            <SelectItem key={corr.id} value={corr.id}>
                              {corr.title} {corr.visible === "true" ? "✓" : "(masquée)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableCorrections.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Aucune correction disponible dans ce chapitre.
                          Créez d'abord une ressource dans la section "Corrections".
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const resource = resources?.find(r => r.id === editingResource);
                        if (!resource) return;

                        // Mettre à jour titre et/ou URL si changés
                        const updates: { id: string; title?: string; url?: string } = { id: editingResource };
                        if (editTitle !== resource.title) updates.title = editTitle;
                        if (editUrl !== resource.url) updates.url = editUrl;

                        if (updates.title || updates.url) {
                          updateMutation.mutate(updates);
                        }

                        // Déplacer si chapitre changé
                        if (moveToChapter !== resource.chapterId) {
                          moveMutation.mutate({ id: editingResource, chapterId: moveToChapter });
                        }

                        // Mettre à jour la correction si changée
                        if (editCorrectionId !== (resource.correctionId || null)) {
                          setCorrectionMutation.mutate({ id: editingResource, correctionId: editCorrectionId });
                        }

                        // Fermer si rien n'a changé
                        if (!updates.title && !updates.url &&
                            moveToChapter === resource.chapterId &&
                            editCorrectionId === (resource.correctionId || null)) {
                          setEditingResource(null);
                        }
                      }}
                      disabled={updateMutation.isPending || moveMutation.isPending || setCorrectionMutation.isPending}
                    >
                      {(updateMutation.isPending || moveMutation.isPending || setCorrectionMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => setEditingResource(null)}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

