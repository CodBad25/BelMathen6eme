import { createContext, useContext, ReactNode } from "react";

type Classe = "6A" | "6B" | "6C" | "6D" | null;

interface ClasseContextType {
  classe: Classe;
  isClasseView: boolean;
}

const ClasseContext = createContext<ClasseContextType>({
  classe: null,
  isClasseView: false,
});

export function ClasseProvider({
  classe,
  children,
}: {
  classe: Classe;
  children: ReactNode;
}) {
  return (
    <ClasseContext.Provider value={{ classe, isClasseView: classe !== null }}>
      {children}
    </ClasseContext.Provider>
  );
}

export function useClasse() {
  return useContext(ClasseContext);
}
