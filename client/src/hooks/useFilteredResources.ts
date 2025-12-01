import { useClasse } from "@/contexts/ClasseContext";
import { trpc } from "@/lib/trpc";

export function useFilteredResources() {
  const { classe, isClasseView } = useClasse();
  const { data: resources, isLoading } = trpc.resources.list.useQuery();

  // Filtrer les ressources selon la classe
  const filteredResources = resources?.filter((r) => {
    // Si pas en mode classe, montrer toutes les ressources visibles
    if (!isClasseView || !classe) {
      return r.visible === "true";
    }

    // En mode classe, vérifier la visibilité de la classe ET la visibilité générale
    if (r.visible !== "true") return false;

    switch (classe) {
      case "6A":
        return r.visible6A === "true";
      case "6B":
        return r.visible6B === "true";
      case "6C":
        return r.visible6C === "true";
      case "6D":
        return r.visible6D === "true";
      default:
        return true;
    }
  });

  return {
    resources: filteredResources,
    allResources: resources, // Pour l'admin qui veut voir tout
    isLoading,
    classe,
    isClasseView,
  };
}
