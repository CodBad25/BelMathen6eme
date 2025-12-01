import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClasseProvider } from "./contexts/ClasseContext";
import Home from "./pages/Home";
import ChapterPage from "./pages/ChapterPage";
import SectionPage from "./pages/SectionPage";
import CoursEleves from "./pages/CoursEleves";
import Admin from "./pages/Admin";
import AdminGestion from "./pages/AdminGestion";
import AdminDragDrop from "./pages/AdminDragDrop";
import PdfViewer from "./pages/PdfViewer";
import MethodesPage from "./pages/MethodesPage";
import MethodeDetailPage from "./pages/MethodeDetailPage";
import ExercicesPage from "./pages/ExercicesPage";
import ExerciceDetailPage from "./pages/ExerciceDetailPage";
import IAResourcesPage from "./pages/IAResourcesPage";

// Wrapper pour les routes avec classe
function ClasseRoutes() {
  const { classeId } = useParams<{ classeId: string }>();
  const validClasses = ["6A", "6B", "6C", "6D"];
  const classe = validClasses.includes(classeId) ? classeId as "6A" | "6B" | "6C" | "6D" : null;

  if (!classe) {
    return <NotFound />;
  }

  return (
    <ClasseProvider classe={classe}>
      <Switch>
        <Route path={`/${classeId}`} component={Home} />
        <Route path={`/${classeId}/grandeur/:chapterId`} component={ChapterPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/methodes`} component={MethodesPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/methodes/:methodeId`} component={MethodeDetailPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/ia-ressources`} component={IAResourcesPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/:sectionId/exercices`} component={ExercicesPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/:sectionId/exercices/:exerciceId`} component={ExerciceDetailPage} />
        <Route path={`/${classeId}/grandeur/:chapterId/:sectionId`} component={SectionPage} />
        <Route path={`/${classeId}/cours`} component={CoursEleves} />
        <Route path={`/${classeId}/cours/:chapterId`} component={CoursEleves} />
        <Route component={NotFound} />
      </Switch>
    </ClasseProvider>
  );
}

function Router() {
  return (
    <ClasseProvider classe={null}>
      <Switch>
        {/* Routes avec préfixe de classe */}
        <Route path="/6A/:rest*" component={ClasseRoutes} />
        <Route path="/6B/:rest*" component={ClasseRoutes} />
        <Route path="/6C/:rest*" component={ClasseRoutes} />
        <Route path="/6D/:rest*" component={ClasseRoutes} />

        {/* Routes sans classe (mode prof/admin - voit tout) */}
        <Route path={"/"} component={Home} />
        <Route path={"/grandeur/:chapterId"} component={ChapterPage} />
        <Route path={"/grandeur/:chapterId/methodes"} component={MethodesPage} />
        <Route path={"/grandeur/:chapterId/methodes/:methodeId"} component={MethodeDetailPage} />
        <Route path={"/grandeur/:chapterId/ia-ressources"} component={IAResourcesPage} />
        <Route path={"/grandeur/:chapterId/:sectionId/exercices"} component={ExercicesPage} />
        <Route path={"/grandeur/:chapterId/:sectionId/exercices/:exerciceId"} component={ExerciceDetailPage} />
        <Route path={"/grandeur/:chapterId/:sectionId"} component={SectionPage} />
        <Route path={"/viewer"} component={PdfViewer} />
        <Route path={"/cours"} component={CoursEleves} />
        <Route path={"/cours/:chapterId"} component={CoursEleves} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/admin/gestion"} component={AdminGestion} />
        <Route path={"/admin/ordre"} component={AdminDragDrop} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </ClasseProvider>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
