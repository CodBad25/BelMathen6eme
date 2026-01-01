import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit, Home, ArrowLeft, Image, Video, FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type JampType = "Méthode" | "Définition" | "Formule" | "Propriété" | "Astuce";
type ContentType = "image" | "video" | "pdf";

const typeColors: Record<JampType, string> = {
  "Méthode": "bg-violet-100 text-violet-700 border-violet-300",
  "Définition": "bg-red-100 text-red-700 border-red-300",
  "Formule": "bg-blue-100 text-blue-700 border-blue-300",
  "Propriété": "bg-orange-100 text-orange-700 border-orange-300",
  "Astuce": "bg-pink-100 text-pink-700 border-pink-300",
};

const chapterNames: Record<string, string> = {
  "chapitre-1-angles": "Les Angles",
  "chapitre-2-prix": "Les Prix",
  "chapitre-3-aires": "Les Aires",
  "chapitre-4-durees": "Les Durées",
  "chapitre-5-volumes": "Les Volumes",
};

export default function AdminJamp() {
  const { user, loading: authLoading } = useAuth();
  const { data: jamps, isLoading, refetch } = trpc.jamps.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingJamp, setEditingJamp] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    chapterId: "chapitre-1-angles",
    title: "",
    type: "Méthode" as JampType,
    icon: "",
    description: "",
    contentType: "image" as ContentType,
    contentUrl: "",
  });

  const createMutation = trpc.jamps.create.useMutation({
    onSuccess: () => {
      toast.success("JAMP créé avec succès");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.jamps.update.useMutation({
    onSuccess: () => {
      toast.success("JAMP modifié avec succès");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.jamps.delete.useMutation({
    onSuccess: () => {
      toast.success("JAMP supprimé");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({
      chapterId: "chapitre-1-angles",
      title: "",
      type: "Méthode",
      icon: "",
      description: "",
      contentType: "image",
      contentUrl: "",
    });
    setShowForm(false);
    setEditingJamp(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    if (editingJamp) {
      updateMutation.mutate({
        id: editingJamp,
        title: formData.title,
        type: formData.type,
        icon: formData.icon || undefined,
        description: formData.description || undefined,
        contentType: formData.contentUrl ? formData.contentType : undefined,
        contentUrl: formData.contentUrl || undefined,
      });
    } else {
      createMutation.mutate({
        chapterId: formData.chapterId,
        title: formData.title,
        type: formData.type,
        icon: formData.icon || undefined,
        description: formData.description || undefined,
        contentType: formData.contentUrl ? formData.contentType : undefined,
        contentUrl: formData.contentUrl || undefined,
      });
    }
  };

  const handleEdit = (jamp: typeof jamps extends (infer T)[] | undefined ? T : never) => {
    if (!jamp) return;
    setFormData({
      chapterId: jamp.chapterId,
      title: jamp.title,
      type: jamp.type as JampType,
      icon: jamp.icon || "",
      description: jamp.description || "",
      contentType: (jamp.contentType as ContentType) || "image",
      contentUrl: jamp.contentUrl || "",
    });
    setEditingJamp(jamp.id);
    setShowForm(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Accès non autorisé</p>
      </div>
    );
  }

  // Group JAMPs by chapter
  const jampsByChapter = (jamps || []).reduce((acc, jamp) => {
    if (!acc[jamp.chapterId]) acc[jamp.chapterId] = [];
    acc[jamp.chapterId].push(jamp);
    return acc;
  }, {} as Record<string, typeof jamps>);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gestion des JAMP</h1>
              <p className="text-gray-500 text-sm">J'Apprends à Mi-Parcours - {jamps?.length || 0} JAMP au total</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau JAMP
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="mb-6 border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{editingJamp ? "Modifier le JAMP" : "Créer un nouveau JAMP"}</CardTitle>
              <CardDescription>Un JAMP = une fiche de révision (image, PDF ou vidéo)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chapitre</Label>
                  <Select
                    value={formData.chapterId}
                    onValueChange={(v) => setFormData({ ...formData, chapterId: v })}
                    disabled={!!editingJamp}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chapterNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type pédagogique</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as JampType })}
                  >
                    <SelectTrigger className={typeColors[formData.type]}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Méthode">Méthode</SelectItem>
                      <SelectItem value="Définition">Définition</SelectItem>
                      <SelectItem value="Formule">Formule</SelectItem>
                      <SelectItem value="Propriété">Propriété</SelectItem>
                      <SelectItem value="Astuce">Astuce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Titre</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Comparer deux angles"
                  />
                </div>
                <div>
                  <Label>Icône (emoji)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Ex: 📐"
                  />
                </div>
              </div>

              <div>
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Courte description pour les élèves"
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Contenu</Label>
                <p className="text-sm text-gray-500 mb-3">Lien vers l'image, le PDF ou la vidéo (Nextcloud, YouTube, etc.)</p>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Type de contenu</Label>
                    <Select
                      value={formData.contentType}
                      onValueChange={(v) => setFormData({ ...formData, contentType: v as ContentType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <span className="flex items-center gap-2"><Image className="h-4 w-4" /> Image</span>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF</span>
                        </SelectItem>
                        <SelectItem value="video">
                          <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Vidéo</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label>URL du contenu</Label>
                    <Input
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingJamp ? "Enregistrer" : "Créer"}
                </Button>
                <Button variant="outline" onClick={resetForm}>Annuler</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* JAMP List by Chapter */}
        {Object.entries(chapterNames).map(([chapterId, chapterName]) => {
          const chapterJamps = jampsByChapter[chapterId] || [];

          return (
            <Card key={chapterId} className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{chapterName}</span>
                  <span className="text-sm font-normal text-gray-500">{chapterJamps.length} JAMP</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {chapterJamps.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Aucun JAMP dans ce chapitre</p>
                ) : (
                  <div className="space-y-2">
                    {chapterJamps.map((jamp) => (
                      <div
                        key={jamp.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{jamp.icon || "📚"}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[jamp.type as JampType] || "bg-gray-100"}`}>
                                {jamp.type}
                              </span>
                              <span className="font-medium">{jamp.title}</span>
                              {!jamp.visible && (
                                <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">Masqué</span>
                              )}
                            </div>
                            {jamp.contentUrl && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                {jamp.contentType === "image" && <Image className="h-3 w-3" />}
                                {jamp.contentType === "pdf" && <FileText className="h-3 w-3" />}
                                {jamp.contentType === "video" && <Video className="h-3 w-3" />}
                                <span className="truncate max-w-[200px]">{jamp.contentUrl}</span>
                              </div>
                            )}
                            {!jamp.contentUrl && (
                              <span className="text-xs text-orange-500">Pas de contenu</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={jamp.visible}
                            onCheckedChange={(checked) => {
                              updateMutation.mutate({ id: jamp.id, visible: checked });
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(jamp)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Supprimer ce JAMP ?")) {
                                deleteMutation.mutate({ id: jamp.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty state */}
        {(!jamps || jamps.length === 0) && !showForm && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">Aucun JAMP créé pour le moment</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Créer votre premier JAMP
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
