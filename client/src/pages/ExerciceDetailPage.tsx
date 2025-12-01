import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle, BookOpen, X, Lock, Play, Image, FileDown, Bot, Gamepad2 } from "lucide-react";
import { useState } from "react";
import InteractiveExercise from "@/components/InteractiveExercise";

// Structure détaillée des exercices avec les vrais énoncés
const exercicesDetail: Record<string, {
  title: string;
  subtitle: string;
  icon: string;
  context?: React.ReactNode;
  questions: {
    id: string;
    label: string;
    enonce: React.ReactNode;
    correctionImages?: string[];
    correctionText?: string;
    methodeId?: string;
    iaResources?: {
      video?: string;
      image?: string;
    };
  }[];
}> = {
  "ex1": {
    title: "Exercice 1",
    subtitle: "Prix du gazole dans deux stations service",
    icon: "⛽",
    context: (
      <p>Voici des prix affichés du gazole dans deux stations service : <strong>1,503 €/ℓ</strong> dans la première et <strong>1,71 €/ℓ</strong> dans la seconde.</p>
    ),
    questions: [
      {
        id: "a",
        label: "a)",
        enonce: (
          <p>Quelle est la station la moins chère ? Quelle est la différence de prix entre les deux stations ?</p>
        ),
        correctionImages: ["/exercices/prix/ex1/ex1_a_1.png", "/exercices/prix/ex1/ex1_a_2.png"],
        methodeId: "M2.1",
        iaResources: {
          video: "/ia-ressources/ex1/video_comparer_decimaux.mp4",
          image: "/ia-ressources/ex1/comparer_nombres_q1a.png",
        }
      },
      {
        id: "b",
        label: "b)",
        enonce: (
          <p>Je dois mettre <strong>10 ℓ</strong> de gazole dans ma voiture, quelle sera la différence entre les prix à payer ? Si je donne <strong>20 €</strong> au pompiste, calcule la monnaie rendue dans chaque station.</p>
        ),
        correctionImages: ["/exercices/prix/ex1/6A_Correction 1_1.png", "/exercices/prix/ex1/6A_Correction 1_2.png"],
        methodeId: "M2.2",
        iaResources: {
          video: "/ia-ressources/ex1/video_difference_prix.mp4",
          image: "/ia-ressources/ex1/ecart_prix_q1b.png",
        }
      },
      {
        id: "c",
        label: "c)",
        enonce: (
          <div className="space-y-4">
            <p>Je dois mettre <strong>100 ℓ</strong> de gazole dans mon utilitaire, quelle sera la différence entre les prix à payer ? Si je paye par chèque, remplis-les pour chaque station.</p>

            {/* Chèque Station 1 */}
            <div className="relative">
              <p className="text-[2.5vw] md:text-xs text-gray-600 mb-1 font-semibold">Chèque Station 1 (1,503 €/ℓ) :</p>
              <img src="/exercices/prix/cheque_francais.png" alt="Chèque vierge" className="w-full rounded shadow-sm border" />
            </div>

            {/* Chèque Station 2 */}
            <div className="relative">
              <p className="text-[2.5vw] md:text-xs text-gray-600 mb-1 font-semibold">Chèque Station 2 (1,71 €/ℓ) :</p>
              <img src="/exercices/prix/cheque_francais.png" alt="Chèque vierge" className="w-full rounded shadow-sm border" />
            </div>
          </div>
        ),
        correctionImages: ["/exercices/prix/ex1/ex1_c_1.png"],
      },
      {
        id: "d",
        label: "d)",
        enonce: (
          <p>Le volume minimal vendu dans toutes les stations est <strong>5 ℓ</strong>, combien vais-je payer au minimum dans chaque station ?</p>
        ),
        correctionImages: ["/exercices/prix/ex1/ex1_1.png"],
      }
    ]
  },
  "ex2": {
    title: "Exercice 2",
    subtitle: "Remplir un chèque",
    icon: "📝",
    questions: [
      {
        id: "a",
        label: "a)",
        enonce: (
          <p>Jean m'a avancé de l'argent, il me fait un chèque sur lequel est écrit <strong>« quatre-vingt-dix euros et cinq centimes »</strong>. Écris en chiffre la somme que je lui dois.</p>
        ),
      },
      {
        id: "b",
        label: "b)",
        enonce: (
          <p>Sur un acte notarié, il est écrit <strong>« la maison a été vendue pour la somme de trois cent soixante-dix mille sept cent soixante-trois euros et dix-sept centimes »</strong>. Quelle somme doit figurer en chiffre sur le chèque ?</p>
        ),
      },
      {
        id: "c",
        label: "c)",
        enonce: (
          <p>Écris en toutes lettres les prix suivants : <strong>1300 € ; 2583 € ; 780 €</strong></p>
        ),
      }
    ]
  },
  "ex3": {
    title: "Exercice 3",
    subtitle: "Savoir si j'ai assez d'argent",
    icon: "💰",
    questions: [
      {
        id: "a",
        label: "a)",
        enonce: (
          <p>J'ai <strong>2€ 5c</strong>. Puis-je acheter un paquet de gâteaux à <strong>2,10 €</strong> ?</p>
        ),
      },
      {
        id: "b",
        label: "b)",
        enonce: (
          <p>Si j'avais <strong>10 fois plus d'argent</strong>, de quelle somme disposerais-je ? Vérifie à la calculatrice.</p>
        ),
      },
      {
        id: "c",
        label: "c)",
        enonce: (
          <p>Combien me manquerait-il si je voulais acheter <strong>dix paquets de gâteaux</strong> ?</p>
        ),
      }
    ]
  },
  "ex4": {
    title: "Exercice 4",
    subtitle: "Pouvoir d'achat chez les romains",
    icon: "🏛️",
    context: (
      <div className="space-y-2 text-[3.5vw] md:text-base">
        <p>À Pompéi en 79 après J-C, on sait que :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>6,5 kg de blé valent 3 sesterces</li>
          <li>1 litre de vin ordinaire vaut 1 sesterce</li>
          <li>1 tunique vaut 15 sesterces</li>
        </ul>
        <p>On sait aussi que :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>1 drachme vaut 3 sesterces</li>
          <li>1 denier (argent) vaut 4 sesterces (bronze)</li>
          <li>1 aureus (or) vaut 25 deniers (argent)</li>
        </ul>
      </div>
    ),
    questions: [
      {
        id: "a",
        label: "Question",
        enonce: (
          <p>Un habitant qui disposait de <strong>4 aureus 5 deniers 6 drachmes</strong> avait-il assez de monnaie pour acheter <strong>3 tuniques</strong> pour sa famille, <strong>15 litres de vin</strong> pour sa semaine et <strong>65 kg de blé</strong> pour faire le pain du mois ?</p>
        ),
      }
    ]
  },
  "ex5": {
    title: "Exercice 5",
    subtitle: "Comparer des prix à l'aide d'un prix de référence",
    icon: "⚖️",
    context: <p className="font-semibold">Qu'est-ce qui est plus cher ?</p>,
    questions: [
      {
        id: "a",
        label: "a)",
        enonce: (
          <div className="flex items-center gap-4 justify-center">
            <div className="border-2 border-gray-300 rounded-lg p-3 text-center">
              <p className="font-bold">10 yaourts</p>
              <p className="text-xl font-bold text-blue-600">14,50 €</p>
            </div>
            <span className="text-2xl">ou</span>
            <div className="border-2 border-gray-300 rounded-lg p-3 text-center">
              <p className="font-bold">1 yaourt</p>
              <p className="text-xl font-bold text-blue-600">1€50</p>
            </div>
          </div>
        ),
      },
      {
        id: "b",
        label: "b)",
        enonce: (
          <p>Un terrain de <strong>1000 m²</strong> à <strong>7320 €</strong> ou un terrain de <strong>100 m²</strong> valant <strong>945 €</strong> ?</p>
        ),
      },
      {
        id: "c",
        label: "c)",
        enonce: (
          <p>Un dixième de mètre de tissu jaune à <strong>4€46</strong> ou un mètre de tissu rouge à <strong>40€46</strong> ?</p>
        ),
      }
    ]
  },
  "ex6": {
    title: "Exercice 6",
    subtitle: "Encadrer des salaires",
    icon: "💼",
    context: (
      <div className="bg-gray-100 p-3 rounded-lg italic text-[3.5vw] md:text-base">
        <p>"Ma question va sûrement paraître un peu bête mais bon... je suis à la recherche d'un emploi et on me demande mes prétentions de salaire, mais en <strong>k€</strong>. Vous pouvez m'expliquer ce que ça signifie ? Parce qu'on me propose plusieurs fourchettes style de 20 à 25 k€, de 25 à 30 k€ etc... mais j'ignore ce que ça représente. Merci d'avance pour vos réponses."</p>
      </div>
    ),
    questions: [
      {
        id: "a",
        label: "Question",
        enonce: (
          <p><strong>Réponds à l'internaute.</strong></p>
        ),
      }
    ]
  },
  "ex7": {
    title: "Exercice 7",
    subtitle: "Comparer des salaires",
    icon: "📊",
    context: (
      <div className="space-y-2 text-[3.5vw] md:text-base">
        <p>Voici des salaires annuels de différentes personnes en 2007 :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>37,5 k€</strong> pour un personnel de direction</li>
          <li><strong>123 000 €</strong> pour un Président Directeur Général</li>
          <li><strong>16 876 €</strong> pour un ouvrier spécialisé</li>
          <li><strong>22,56 k€</strong> pour un cadre commercial</li>
        </ul>
      </div>
    ),
    questions: [
      {
        id: "a",
        label: "Question",
        enonce: (
          <p><strong>Range les professions dans l'ordre décroissant des salaires.</strong></p>
        ),
      }
    ]
  }
};

// État de visibilité (simulé - en vrai ce serait en base de données)
// Pour l'instant on simule : seules les corrections de ex1 sont visibles
const visibilityState: Record<string, Record<string, { correction: boolean; methode: boolean }>> = {
  "ex1": {
    "a": { correction: true, methode: true },
    "b": { correction: true, methode: true },
    "c": { correction: true, methode: false },
    "d": { correction: true, methode: false },
  }
};

const grandeurs: Record<string, { name: string; icon: string; color: string }> = {
  "chapitre-2-prix": { name: "Les Prix", icon: "💶", color: "from-green-500 to-emerald-600" },
};

type ModalContent = {
  type: "enonce" | "correction";
  question: typeof exercicesDetail["ex1"]["questions"][0];
} | null;

type IAModalContent = {
  questionLabel: string;
  video?: string;
  image?: string;
} | null;

// Composant Modal IA avec onglets
function IAModal({ iaModal, exerciceTitle, onClose }: {
  iaModal: NonNullable<IAModalContent>;
  exerciceTitle: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"video" | "image">(iaModal.video ? "video" : "image");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-[4vw] md:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-[4vw] md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Bot className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
            <div>
              <h3 className="font-bold text-[4vw] md:text-lg">Mon AMIE IA MAIS...</h3>
              <p className="text-[2.5vw] md:text-xs opacity-80">{exerciceTitle} - Question {iaModal.questionLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
          </button>
        </div>

        {/* Avertissement */}
        <div className="bg-amber-50 border-b border-amber-200 px-[4vw] py-[2vw] md:px-4 md:py-2">
          <p className="text-[2.5vw] md:text-xs text-amber-800 italic">
            ⚠️ Attention : cette ressource a été générée par une IA. N'hésite pas à en parler avec ton prof si tu as un doute !
          </p>
        </div>

        {/* Onglets si vidéo ET image disponibles */}
        {iaModal.video && iaModal.image && (
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 flex items-center justify-center gap-[1.5vw] md:gap-2 py-[2vw] md:py-3 text-[3vw] md:text-sm font-medium transition-colors ${
                activeTab === "video"
                  ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Play className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
              Vidéo
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={`flex-1 flex items-center justify-center gap-[1.5vw] md:gap-2 py-[2vw] md:py-3 text-[3vw] md:text-sm font-medium transition-colors ${
                activeTab === "image"
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Image className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
              Illustration
            </button>
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-[4vw] md:p-6 bg-gray-900 flex items-center justify-center">
          {activeTab === "video" && iaModal.video && (
            <video
              key={`video-${iaModal.questionLabel}`}
              src={iaModal.video}
              controls
              autoPlay
              className="max-w-full max-h-[60vh] rounded-lg"
            />
          )}
          {activeTab === "image" && iaModal.image && (
            <img
              key={`image-${iaModal.questionLabel}`}
              src={iaModal.image}
              alt="Illustration IA"
              className="max-w-full max-h-[60vh] rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExerciceDetailPage() {
  const { chapterId, sectionId, exerciceId } = useParams<{
    chapterId: string;
    sectionId: string;
    exerciceId: string
  }>();
  const [modal, setModal] = useState<ModalContent>(null);
  const [iaModal, setIaModal] = useState<IAModalContent>(null);
  const [showInteractive, setShowInteractive] = useState(false);

  const grandeur = chapterId ? grandeurs[chapterId] : null;
  const exercice = exerciceId ? exercicesDetail[exerciceId] : null;
  const visibility = exerciceId ? visibilityState[exerciceId] || {} : {};

  if (!grandeur || !exercice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Exercice non trouvé</p>
          <Link href="/">
            <Button className="mt-4">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const closeModal = () => setModal(null);

  const isVisible = (questionId: string, type: "correction" | "methode") => {
    return visibility[questionId]?.[type] ?? false;
  };

  const hasCorrection = (question: typeof exercice.questions[0]) => {
    return question.correctionImages || question.correctionText;
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
      <header className={`bg-gradient-to-r ${grandeur.color} text-white py-[2vh] md:py-4 px-4 shadow-lg`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-[2vw] md:gap-3">
            <Link href={`/grandeur/${chapterId}/${sectionId}/exercices`}>
              <Button variant="secondary" size="sm" className="flex-shrink-0 h-[8vw] w-[8vw] md:h-auto md:w-auto p-0 md:px-3">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="hidden md:inline md:ml-1">Retour</span>
              </Button>
            </Link>
            <div className="flex items-center gap-[2vw]">
              <span className="text-[8vw] md:text-4xl">{exercice.icon}</span>
              <div>
                <h1 className="text-[4vw] md:text-xl font-bold">{exercice.title}</h1>
                <p className="text-[3vw] md:text-sm opacity-90">{exercice.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto p-[3vw] md:p-6 w-full overflow-auto">
        {/* Contexte de l'exercice */}
        {exercice.context && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-[3vw] md:p-4 rounded-r-lg mb-[3vh] md:mb-6">
            <div className="text-[3.5vw] md:text-base text-yellow-800">
              {exercice.context}
            </div>
          </div>
        )}

        {/* Liste des questions */}
        <div className="space-y-[3vw] md:space-y-4">
          {exercice.questions.map((question) => (
            <Card key={question.id} className="bg-white overflow-hidden">
              <CardContent className="p-[3vw] md:p-4">
                {/* Énoncé de la question */}
                <div className="flex items-start gap-[2vw] md:gap-3 mb-[2vw] md:mb-3">
                  <span className="font-bold text-[4vw] md:text-lg text-blue-600 flex-shrink-0">
                    {question.label}
                  </span>
                  <div className="text-[3.5vw] md:text-base text-gray-800 flex-1">
                    {question.enonce}
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex flex-wrap gap-[2vw] md:gap-2 mt-[2vw] md:mt-3 pt-[2vw] md:pt-3 border-t">
                  {/* Bouton Correction */}
                  {hasCorrection(question) && (
                    isVisible(question.id, "correction") ? (
                      <button
                        onClick={() => setModal({ type: "correction", question })}
                        className="flex items-center gap-[1.5vw] md:gap-2 px-[2.5vw] py-[1.5vw] md:px-3 md:py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors text-[3vw] md:text-sm font-medium"
                      >
                        <CheckCircle className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
                        Correction
                      </button>
                    ) : (
                      <div className="flex items-center gap-[1.5vw] md:gap-2 px-[2.5vw] py-[1.5vw] md:px-3 md:py-1.5 bg-gray-100 text-gray-400 rounded-full text-[3vw] md:text-sm font-medium cursor-not-allowed">
                        <Lock className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
                        Correction
                      </div>
                    )
                  )}

                  {/* Bouton Méthode */}
                  {question.methodeId && (
                    isVisible(question.id, "methode") ? (
                      <Link href={`/grandeur/${chapterId}/methodes/${question.methodeId}`}>
                        <button className="flex items-center gap-[1.5vw] md:gap-2 px-[2.5vw] py-[1.5vw] md:px-3 md:py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors text-[3vw] md:text-sm font-medium">
                          <BookOpen className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
                          {question.methodeId}
                        </button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-[1.5vw] md:gap-2 px-[2.5vw] py-[1.5vw] md:px-3 md:py-1.5 bg-gray-100 text-gray-400 rounded-full text-[3vw] md:text-sm font-medium cursor-not-allowed">
                        <Lock className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
                        {question.methodeId}
                      </div>
                    )
                  )}

                  {/* Bouton IA "Mon AMIE IA MAIS..." */}
                  {question.iaResources && (
                    <button
                      onClick={() => setIaModal({
                        questionLabel: question.label,
                        video: question.iaResources?.video,
                        image: question.iaResources?.image,
                      })}
                      className="flex items-center gap-[1.5vw] md:gap-2 px-[2.5vw] py-[1.5vw] md:px-3 md:py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors text-[3vw] md:text-sm font-medium"
                    >
                      <Bot className="w-[3.5vw] h-[3.5vw] md:w-4 md:h-4" />
                      Mon AMIE IA MAIS...
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Modal Correction */}
      {modal && modal.type === "correction" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-[4vw] md:p-6" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="bg-green-500 text-white p-[4vw] md:p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[4vw] md:text-lg">✅ Correction</h3>
                <p className="text-[3vw] md:text-sm opacity-90">{exercice.title} - Question {modal.question.label}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-[5vw] h-[5vw] md:w-6 md:h-6" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="flex-1 overflow-auto p-[4vw] md:p-6">
              {modal.question.correctionText && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-[3.5vw] md:text-base whitespace-pre-line">
                    {modal.question.correctionText}
                  </p>
                </div>
              )}
              {modal.question.correctionImages && (
                <div className="space-y-4">
                  {modal.question.correctionImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Correction ${idx + 1}`}
                      className="w-full rounded-lg border shadow-sm"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal IA "Mon AMIE IA MAIS..." */}
      {iaModal && (
        <IAModal
          iaModal={iaModal}
          exerciceTitle={exercice.title}
          onClose={() => setIaModal(null)}
        />
      )}

      {/* Mode interactif "À toi de jouer" */}
      {showInteractive && exerciceId === "ex1" && (
        <InteractiveExercise onClose={() => setShowInteractive(false)} />
      )}

      <footer className="bg-gray-100 border-t py-[1vh] md:py-3 text-center text-gray-600 text-[2.5vw] md:text-sm flex items-center justify-center gap-[3vw] md:gap-4">
        <p>Mathématiques 6e - Collège Gaston Chaissac</p>
        {exerciceId === "ex1" && (
          <Button
            onClick={() => setShowInteractive(true)}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-1 text-[2.5vw] md:text-xs h-[6vw] md:h-8 px-[2vw] md:px-3"
          >
            <Gamepad2 className="w-[3vw] h-[3vw] md:w-3 md:h-3" />
            À toi de jouer !
          </Button>
        )}
      </footer>
    </div>
  );
}
