import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy, ArrowRight, Gamepad2 } from "lucide-react";

// Questions basées sur l'exercice existant
interface Question {
  id: string;
  questionLabel: string;
  type: "qcm" | "numeric" | "cheque";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: number;
  tolerance?: number;
  unit?: string;
  hint?: string;
  group?: string; // Pour regrouper les questions liées
  chequeData?: {
    montant: number;
    station: string;
    montantEnLettres: string;
  };
}

// Fonction pour normaliser le texte (pour comparaison souple)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever accents
    .replace(/[-–—]/g, " ") // Remplacer tirets par espaces
    .replace(/\s+/g, " ") // Normaliser espaces
    .replace(/euros?/gi, "euros")
    .replace(/centimes?/gi, "centimes")
    .trim();
}

// Vérifier si deux textes sont similaires (tolérance orthographe)
function areTextsSimilar(userText: string, correctText: string): boolean {
  const normalizedUser = normalizeText(userText);
  const normalizedCorrect = normalizeText(correctText);

  // Exact match après normalisation
  if (normalizedUser === normalizedCorrect) return true;

  // Tolérance : 90% des caractères corrects
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  let matches = 0;
  for (let i = 0; i < Math.min(normalizedUser.length, normalizedCorrect.length); i++) {
    if (normalizedUser[i] === normalizedCorrect[i]) matches++;
  }
  return matches / maxLength >= 0.85;
}

const questions: Question[] = [
  // Question a) - Comparer les prix
  {
    id: "a1",
    questionLabel: "a)",
    type: "qcm",
    question: "Quelle station est la moins chère ?",
    options: ["Station 1 (1,503 €/L)", "Station 2 (1,71 €/L)"],
    correctIndex: 0,
  },
  {
    id: "a2",
    questionLabel: "a)",
    type: "numeric",
    question: "Quelle est la différence de prix au litre ?",
    correctAnswer: 0.207,
    tolerance: 0.001,
    unit: "€",
    hint: "Calcule : 1,71 - 1,503",
  },
  // Question b) - Pour 10 litres (multiplication par 10)
  {
    id: "b1",
    questionLabel: "b)",
    type: "numeric",
    question: "Pour 10 L, quel est le prix à payer à la Station 1 ?",
    correctAnswer: 15.03,
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,503 par 10",
    group: "10L",
  },
  {
    id: "b2",
    questionLabel: "b)",
    type: "numeric",
    question: "Pour 10 L, quel est le prix à payer à la Station 2 ?",
    correctAnswer: 17.1,
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 10",
    group: "10L",
  },
  {
    id: "b3",
    questionLabel: "b)",
    type: "numeric",
    question: "Pour 10 L, quelle est la différence de prix entre les deux stations ?",
    correctAnswer: 2.07,
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule la différence entre les deux prix pour 10 L",
    group: "10L",
  },
  {
    id: "b4",
    questionLabel: "b)",
    type: "numeric",
    question: "Si je donne 20 € à la Station 1 pour 10 L, combien me rend-on ?",
    correctAnswer: 4.97,
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule : 20 - 15,03",
  },
  {
    id: "b5",
    questionLabel: "b)",
    type: "numeric",
    question: "Si je donne 20 € à la Station 2 pour 10 L, combien me rend-on ?",
    correctAnswer: 2.9,
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule : 20 - 17,1",
  },
  // Question c) - Pour 100 litres (multiplication par 100)
  {
    id: "c1",
    questionLabel: "c)",
    type: "numeric",
    question: "Pour 100 L, quel est le prix à payer à la Station 1 ?",
    correctAnswer: 150.3,
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,503 par 100",
    group: "100L",
  },
  {
    id: "c2",
    questionLabel: "c)",
    type: "numeric",
    question: "Pour 100 L, quel est le prix à payer à la Station 2 ?",
    correctAnswer: 171,
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 100",
    group: "100L",
  },
  {
    id: "c3",
    questionLabel: "c)",
    type: "numeric",
    question: "Pour 100 L, quelle est la différence de prix entre les deux stations ?",
    correctAnswer: 20.7,
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule la différence entre les deux prix pour 100 L",
    group: "100L",
  },
  // Chèques pour 100L
  {
    id: "c4",
    questionLabel: "c)",
    type: "cheque",
    question: "Remplis le chèque pour la Station 1 (100 L)",
    chequeData: {
      montant: 150.30,
      station: "Station 1",
      montantEnLettres: "cent cinquante euros et trente centimes",
    },
  },
  {
    id: "c5",
    questionLabel: "c)",
    type: "cheque",
    question: "Remplis le chèque pour la Station 2 (100 L)",
    chequeData: {
      montant: 171,
      station: "Station 2",
      montantEnLettres: "cent soixante et onze euros",
    },
  },
  // Question d) - Pour 5 litres (proportionnalité)
  {
    id: "d1",
    questionLabel: "d)",
    type: "numeric",
    question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 1 ?",
    correctAnswer: 7.515,
    tolerance: 0.001,
    unit: "€",
    hint: "Multiplie 1,503 par 5 (ou divise le prix pour 10 L par 2)",
    group: "5L",
  },
  {
    id: "d2",
    questionLabel: "d)",
    type: "numeric",
    question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 2 ?",
    correctAnswer: 8.55,
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 5 (ou divise le prix pour 10 L par 2)",
    group: "5L",
  },
];

interface InteractiveExerciseProps {
  onClose: () => void;
}

export default function InteractiveExercise({ onClose }: InteractiveExerciseProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [numericInput, setNumericInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);

  // Pour les chèques
  const [chequeInputs, setChequeInputs] = useState<{
    montantChiffres: string;
    montantLettres: string;
  }>({ montantChiffres: "", montantLettres: "" });
  const [chequeResults, setChequeResults] = useState<{
    montantChiffres: boolean | null;
    montantLettres: boolean | null;
  }>({ montantChiffres: null, montantLettres: null });

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = results[currentQuestion.id] !== undefined;

  // Récupérer les réponses du même groupe pour les afficher
  const getGroupAnswers = () => {
    if (!currentQuestion.group) return [];

    const groupQuestions = questions.filter(q => q.group === currentQuestion.group && q.id !== currentQuestion.id);
    return groupQuestions
      .filter(q => answers[q.id] !== undefined)
      .map(q => ({
        question: q.question.replace("Pour 10 L, ", "").replace("Pour 100 L, ", "").replace("Le volume minimal est 5 L. ", ""),
        answer: answers[q.id],
        isCorrect: results[q.id],
        unit: q.unit,
      }));
  };

  const handleQCMAnswer = (optionIndex: number) => {
    if (hasAnswered) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    setResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    if (isCorrect) setScore(prev => prev + 1);
    setShowHint(false);
  };

  const handleNumericSubmit = () => {
    if (hasAnswered || !numericInput) return;

    const userAnswer = parseFloat(numericInput.replace(",", "."));
    const tolerance = currentQuestion.tolerance || 0;
    const isCorrect = Math.abs(userAnswer - (currentQuestion.correctAnswer || 0)) <= tolerance;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: userAnswer }));
    setResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    if (isCorrect) setScore(prev => prev + 1);
    setShowHint(false);
  };

  const handleChequeSubmit = () => {
    if (hasAnswered || !currentQuestion.chequeData) return;

    const { montant, montantEnLettres } = currentQuestion.chequeData;

    // Vérifier le montant en chiffres
    const userMontant = parseFloat(chequeInputs.montantChiffres.replace(",", "."));
    const montantCorrect = Math.abs(userMontant - montant) <= 0.01;

    // Vérifier le montant en lettres (avec tolérance)
    const lettresCorrect = areTextsSimilar(chequeInputs.montantLettres, montantEnLettres);

    setChequeResults({
      montantChiffres: montantCorrect,
      montantLettres: lettresCorrect,
    });

    const isCorrect = montantCorrect && lettresCorrect;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: `${chequeInputs.montantChiffres} | ${chequeInputs.montantLettres}` }));
    setResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    if (isCorrect) setScore(prev => prev + 1);
    setShowHint(false);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setNumericInput("");
      setShowHint(false);
      setChequeInputs({ montantChiffres: "", montantLettres: "" });
      setChequeResults({ montantChiffres: null, montantLettres: null });
    }
  };

  const restartExercise = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setNumericInput("");
    setShowResult(false);
    setShowHint(false);
    setScore(0);
    setChequeInputs({ montantChiffres: "", montantLettres: "" });
    setChequeResults({ montantChiffres: null, montantLettres: null });
  };

  const getResultIcon = (questionId: string) => {
    const result = results[questionId];
    if (result === null || result === undefined) return null;
    return result ? (
      <CheckCircle className="w-[5vw] h-[5vw] md:w-6 md:h-6 text-green-500 flex-shrink-0" />
    ) : (
      <XCircle className="w-[5vw] h-[5vw] md:w-6 md:h-6 text-red-500 flex-shrink-0" />
    );
  };

  // Écran de résultat final
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : percentage >= 40 ? "💪" : "📚";
    const message = percentage >= 80 ? "Excellent ! Tu maîtrises bien les multiplications par 10 et 100 !"
      : percentage >= 60 ? "Bien joué ! Continue à t'entraîner !"
      : percentage >= 40 ? "Tu progresses ! Revois les règles de multiplication par 10, 100."
      : "Révise les multiplications par 10 et 100, puis réessaie !";

    return (
      <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-[2vw] md:p-4">
        <Card className="max-w-lg mx-auto my-[2vh] md:my-4">
          <CardContent className="p-[6vw] md:p-8 text-center">
            <div className="text-[15vw] md:text-8xl mb-[4vh] md:mb-6">{emoji}</div>
            <h2 className="text-[6vw] md:text-2xl font-bold mb-[2vh] md:mb-4">
              {percentage >= 80 ? "Excellent !" : percentage >= 60 ? "Bien joué !" : percentage >= 40 ? "Continue !" : "Révise encore !"}
            </h2>
            <p className="text-[4vw] md:text-lg text-gray-600 mb-[2vh] md:mb-4">
              Tu as obtenu <span className="font-bold text-purple-600">{score}/{questions.length}</span> bonnes réponses ({percentage}%)
            </p>
            <p className="text-[3vw] md:text-sm text-gray-500 mb-[4vh] md:mb-6">
              {message}
            </p>

            <div className="flex flex-col gap-[2vw] md:gap-3">
              <Button onClick={restartExercise} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Gamepad2 className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Recommencer
              </Button>
              <Button variant="outline" onClick={onClose}>
                Retour à l'exercice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupAnswers = getGroupAnswers();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-[2vw] md:p-4">
      <Card className="max-w-2xl mx-auto my-[2vh] md:my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-[4vw] md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[2vw] md:gap-3">
              <Gamepad2 className="w-[6vw] h-[6vw] md:w-6 md:h-6" />
              <div>
                <h2 className="text-[4vw] md:text-lg font-bold">À toi de jouer !</h2>
                <p className="text-[2.5vw] md:text-xs opacity-80">
                  Question {currentQuestionIndex + 1}/{questions.length} • {currentQuestion.questionLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[1vw] md:gap-1">
              <Trophy className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
              <span className="font-bold">{score}</span>
            </div>
          </div>
        </div>

        {/* Contexte de l'exercice */}
        <div className="bg-blue-50 border-b border-blue-200 p-[3vw] md:p-3">
          <p className="text-[2.5vw] md:text-sm text-blue-800">
            <strong>⛽</strong>{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">Station 1 : 1,503 €/L</span>
            {" • "}
            <span className="font-mono bg-blue-100 px-1 rounded">Station 2 : 1,71 €/L</span>
          </p>
        </div>

        {/* Réponses intermédiaires du groupe */}
        {groupAnswers.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 p-[3vw] md:p-3">
            <p className="text-[2.5vw] md:text-xs text-gray-600 mb-[1vw] md:mb-1 font-medium">📝 Tes réponses précédentes :</p>
            <div className="space-y-[1vw] md:space-y-1">
              {groupAnswers.map((ga, idx) => (
                <div key={idx} className="flex items-center gap-[1vw] md:gap-2 text-[2.5vw] md:text-xs">
                  {ga.isCorrect ? (
                    <CheckCircle className="w-[3vw] h-[3vw] md:w-3 md:h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-[3vw] h-[3vw] md:w-3 md:h-3 text-red-500" />
                  )}
                  <span className="text-gray-600">{ga.question}</span>
                  <span className={`font-mono font-medium ${ga.isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {ga.answer} {ga.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <CardContent className="p-[4vw] md:p-6">
          {/* Question */}
          <div className="mb-[4vh] md:mb-6">
            <h3 className="text-[3.5vw] md:text-lg font-semibold text-gray-800 mb-[3vh] md:mb-4 flex items-start gap-[2vw] md:gap-2">
              {getResultIcon(currentQuestion.id)}
              <span>
                <span className="text-purple-600 font-bold">{currentQuestion.questionLabel}</span>{" "}
                {currentQuestion.question}
              </span>
            </h3>

            {/* QCM */}
            {currentQuestion.type === "qcm" && currentQuestion.options && (
              <div className="grid gap-[2vw] md:gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  const isCorrect = currentQuestion.correctIndex === index;
                  const showFeedback = hasAnswered;

                  let buttonClass = "w-full p-[3vw] md:p-4 text-left border-2 rounded-xl transition-all ";
                  if (showFeedback) {
                    if (isCorrect) {
                      buttonClass += "border-green-500 bg-green-50 text-green-700";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      buttonClass += "border-gray-200 opacity-50";
                    }
                  } else {
                    buttonClass += isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleQCMAnswer(index)}
                      disabled={hasAnswered}
                      className={buttonClass}
                    >
                      <span className="text-[3.5vw] md:text-base font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input numérique */}
            {currentQuestion.type === "numeric" && (
              <div className="space-y-[3vw] md:space-y-4">
                <div className="flex gap-[2vw] md:gap-3 items-center">
                  <Input
                    type="text"
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    placeholder="Ta réponse..."
                    disabled={hasAnswered}
                    className="text-[4vw] md:text-lg p-[3vw] md:p-4 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleNumericSubmit()}
                  />
                  <span className="text-[3.5vw] md:text-base text-gray-500 font-medium">
                    {currentQuestion.unit}
                  </span>
                </div>

                {!hasAnswered && (
                  <div className="flex gap-[2vw] md:gap-3">
                    <Button
                      onClick={handleNumericSubmit}
                      disabled={!numericInput}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Valider
                    </Button>
                    {currentQuestion.hint && !showHint && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                        className="text-[3vw] md:text-sm"
                      >
                        💡
                      </Button>
                    )}
                  </div>
                )}

                {showHint && !hasAnswered && currentQuestion.hint && (
                  <div className="p-[3vw] md:p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-[3vw] md:text-sm text-yellow-800">
                      💡 {currentQuestion.hint}
                    </p>
                  </div>
                )}

                {hasAnswered && (
                  <div className={`p-[3vw] md:p-4 rounded-xl ${results[currentQuestion.id] ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <p className={`text-[3vw] md:text-sm ${results[currentQuestion.id] ? "text-green-700" : "text-red-700"}`}>
                      {results[currentQuestion.id]
                        ? "✅ Bonne réponse !"
                        : `❌ La bonne réponse était : ${currentQuestion.correctAnswer} ${currentQuestion.unit}`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chèque */}
            {currentQuestion.type === "cheque" && currentQuestion.chequeData && (
              <div className="space-y-[3vw] md:space-y-4">
                {/* Image du chèque */}
                <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
                  <img
                    src="/exercices/prix/cheque_francais.png"
                    alt="Chèque"
                    className="w-full opacity-30"
                  />
                  <div className="absolute inset-0 p-[3vw] md:p-4 flex flex-col justify-center">
                    <p className="text-[3vw] md:text-sm font-medium text-gray-700 mb-[2vw] md:mb-2">
                      📝 {currentQuestion.chequeData.station} - {currentQuestion.chequeData.montant.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {/* Champs à remplir */}
                <div className="space-y-[3vw] md:space-y-3">
                  <div>
                    <label className="block text-[3vw] md:text-sm font-medium text-gray-700 mb-[1vw] md:mb-1">
                      Montant en chiffres :
                    </label>
                    <div className="flex gap-[2vw] md:gap-2 items-center">
                      <Input
                        type="text"
                        value={chequeInputs.montantChiffres}
                        onChange={(e) => setChequeInputs(prev => ({ ...prev, montantChiffres: e.target.value }))}
                        placeholder="Ex: 150,30"
                        disabled={hasAnswered}
                        className={`text-[3.5vw] md:text-base flex-1 ${
                          chequeResults.montantChiffres === true ? "border-green-500 bg-green-50" :
                          chequeResults.montantChiffres === false ? "border-red-500 bg-red-50" : ""
                        }`}
                      />
                      <span className="text-[3vw] md:text-sm text-gray-500">€</span>
                    </div>
                    {chequeResults.montantChiffres === false && (
                      <p className="text-[2.5vw] md:text-xs text-red-600 mt-1">
                        ❌ Attendu : {currentQuestion.chequeData.montant.toFixed(2)} €
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[3vw] md:text-sm font-medium text-gray-700 mb-[1vw] md:mb-1">
                      Montant en lettres :
                    </label>
                    <Input
                      type="text"
                      value={chequeInputs.montantLettres}
                      onChange={(e) => setChequeInputs(prev => ({ ...prev, montantLettres: e.target.value }))}
                      placeholder="Ex: cent cinquante euros..."
                      disabled={hasAnswered}
                      className={`text-[3.5vw] md:text-base ${
                        chequeResults.montantLettres === true ? "border-green-500 bg-green-50" :
                        chequeResults.montantLettres === false ? "border-red-500 bg-red-50" : ""
                      }`}
                    />
                    {chequeResults.montantLettres !== null && (
                      <div className="mt-[1vw] md:mt-1">
                        <p className={`text-[2.5vw] md:text-xs ${chequeResults.montantLettres ? "text-green-600" : "text-red-600"}`}>
                          {chequeResults.montantLettres ? "✅ Correct !" : "❌ Ta réponse :"}
                          {!chequeResults.montantLettres && (
                            <span className="italic"> "{chequeInputs.montantLettres}"</span>
                          )}
                        </p>
                        {!chequeResults.montantLettres && (
                          <p className="text-[2.5vw] md:text-xs text-gray-600">
                            ✓ Réponse attendue : <span className="font-medium">{currentQuestion.chequeData.montantEnLettres}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!hasAnswered && (
                  <Button
                    onClick={handleChequeSubmit}
                    disabled={!chequeInputs.montantChiffres || !chequeInputs.montantLettres}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Valider le chèque
                  </Button>
                )}

                {hasAnswered && (
                  <div className={`p-[3vw] md:p-4 rounded-xl ${results[currentQuestion.id] ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                    <p className={`text-[3vw] md:text-sm ${results[currentQuestion.id] ? "text-green-700" : "text-amber-700"}`}>
                      {results[currentQuestion.id]
                        ? "✅ Chèque correctement rempli !"
                        : "📝 Vérifie tes réponses ci-dessus"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton suivant */}
          {hasAnswered && (
            <Button onClick={handleNext} className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              {isLastQuestion ? (
                <>
                  <Trophy className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                  Voir mon score
                </>
              ) : (
                <>
                  Question suivante
                  <ArrowRight className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                </>
              )}
            </Button>
          )}

          {/* Bouton fermer */}
          <Button variant="ghost" onClick={onClose} className="w-full mt-[2vh] md:mt-3 text-gray-500">
            Fermer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
