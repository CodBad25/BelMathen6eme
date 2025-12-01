import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface SortableChapterProps {
  id: string;
  name: string;
  resourceCount: number;
}

function SortableChapter({ id, name, resourceCount }: SortableChapterProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-gray-500">{resourceCount} ressources</p>
      </div>
    </div>
  );
}

export default function AdminDragDrop() {
  const { user, loading: authLoading } = useAuth();
  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery();
  const reorderMutation = trpc.resources.reorderChapters.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Ordre des chapitres mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const chapterTitles: Record<string, string> = {
    "chapitre-1-angles": "Les Angles",
    "chapitre-2-prix": "Les Prix",
    "chapitre-3-aires": "Les Aires",
    "chapitre-4-durees": "Les Durées",
    "chapitre-5-volumes": "Les Volumes",
  };

  const [chapters, setChapters] = useState<{ id: string; name: string; resourceCount: number }[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (resources) {
      const groupedResources = resources.reduce((acc, r) => {
        if (!acc[r.chapterId]) acc[r.chapterId] = [];
        acc[r.chapterId].push(r);
        return acc;
      }, {} as Record<string, typeof resources>);

      const chapterList = Object.entries(groupedResources)
        .map(([id, res]) => ({
          id,
          name: chapterTitles[id] || id,
          resourceCount: res.length,
          displayOrder: res[0]?.displayOrder || 0,
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((chapter, index) => ({
          ...chapter,
          name: `Chapitre ${index + 1} - ${chapter.name}`,
        }));

      setChapters(chapterList);
    }
  }, [resources]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setChapters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Sauvegarder l'ordre dans la base de données
        reorderMutation.mutate({ chapterOrder: newOrder.map((c) => c.id) });
        
        return newOrder;
      });
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Réorganiser les chapitres</h1>
            <p className="text-gray-600 mt-1">Glissez-déposez pour changer l'ordre d'affichage</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">← Retour</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ordre des chapitres</CardTitle>
            <CardDescription>
              L'ordre que vous définissez ici sera appliqué sur la page publique pour les élèves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <SortableChapter
                      key={chapter.id}
                      id={chapter.id}
                      name={chapter.name}
                      resourceCount={chapter.resourceCount}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

