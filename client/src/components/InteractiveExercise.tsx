import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy, ArrowRight, Gamepad2 } from "lucide-react";

// Exercice existant avec les valeurs fixes
const EXERCICE_DATA = {
  prix1: 1.503, // Station 1 : 3 décimales
  prix2: 1.71,  // Station 2 : 2 décimales
  billetDonne: 20,
};

// Questions basées sur l'exercice existant
interface Question {
  id: string;
  questionLabel: string; // a), b), c), d)
  type: "qcm" | "numeric";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: number;
  tolerance?: number;
  unit?: string;
  hint?: string;
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
    question: "Quelle est la différence de prix au litre (en €) ?",
    correctAnswer: 0.207, // 1,71 - 1,503 = 0,207
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
    correctAnswer: 15.03, // 1,503 × 10
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,503 par 10",
  },
  {
    id: "b2",
    questionLabel: "b)",
    type: "numeric",
    question: "Pour 10 L, quel est le prix à payer à la Station 2 ?",
    correctAnswer: 17.1, // 1,71 × 10
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 10",
  },
  {
    id: "b3",
    questionLabel: "b)",
    type: "numeric",
    question: "Pour 10 L, quelle est la différence de prix entre les deux stations ?",
    correctAnswer: 2.07, // 17,1 - 15,03
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule la différence entre les deux prix pour 10 L",
  },
  {
    id: "b4",
    questionLabel: "b)",
    type: "numeric",
    question: "Si je donne 20 € à la Station 1 pour 10 L, combien me rend-on ?",
    correctAnswer: 4.97, // 20 - 15,03
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule : 20 - 15,03",
  },
  {
    id: "b5",
    questionLabel: "b)",
    type: "numeric",
    question: "Si je donne 20 € à la Station 2 pour 10 L, combien me rend-on ?",
    correctAnswer: 2.9, // 20 - 17,1
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
    correctAnswer: 150.3, // 1,503 × 100
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,503 par 100",
  },
  {
    id: "c2",
    questionLabel: "c)",
    type: "numeric",
    question: "Pour 100 L, quel est le prix à payer à la Station 2 ?",
    correctAnswer: 171, // 1,71 × 100
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 100",
  },
  {
    id: "c3",
    questionLabel: "c)",
    type: "numeric",
    question: "Pour 100 L, quelle est la différence de prix entre les deux stations ?",
    correctAnswer: 20.7, // 171 - 150,3
    tolerance: 0.01,
    unit: "€",
    hint: "Calcule la différence entre les deux prix pour 100 L",
  },
  // Question d) - Pour 5 litres (division par 2, proportionnalité)
  {
    id: "d1",
    questionLabel: "d)",
    type: "numeric",
    question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 1 ?",
    correctAnswer: 7.515, // 1,503 × 5
    tolerance: 0.001,
    unit: "€",
    hint: "Multiplie 1,503 par 5 (ou divise le prix pour 10 L par 2)",
  },
  {
    id: "d2",
    questionLabel: "d)",
    type: "numeric",
    question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 2 ?",
    correctAnswer: 8.55, // 1,71 × 5
    tolerance: 0.01,
    unit: "€",
    hint: "Multiplie 1,71 par 5 (ou divise le prix pour 10 L par 2)",
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

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = results[currentQuestion.id] !== undefined;

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

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setNumericInput("");
      setShowHint(false);
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
  };

  const getResultIcon = (questionId: string) => {
    const result = results[questionId];
    if (result === null || result === undefined) return null;
    return result ? (
      <CheckCircle className="w-[5vw] h-[5vw] md:w-6 md:h-6 text-green-500" />
    ) : (
      <XCircle className="w-[5vw] h-[5vw] md:w-6 md:h-6 text-red-500" />
    );
  };

  // Écran de résultat final
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : percentage >= 40 ? "💪" : "📚";
    const message = percentage >= 80 ? "Excellent ! Tu maîtrises bien les multiplications par 10 et 100 !"
      : percentage >= 60 ? "Bien joué ! Continue à t'entraîner !"
      : percentage >= 40 ? "Tu progresses ! Revois les règles de multiplication par 10, 100 et 1000."
      : "Révise les multiplications par 10 et 100, puis réessaie !";

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-[4vw] md:p-6">
        <Card className="max-w-lg w-full">
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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-[4vw] md:p-6">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
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
        <div className="bg-blue-50 border-b border-blue-200 p-[4vw] md:p-4">
          <p className="text-[3vw] md:text-sm text-blue-800">
            <strong>⛽ Contexte :</strong> Prix du gazole dans deux stations :<br/>
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">Station 1 : 1,503 €/L</span>
            {" "}et{" "}
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">Station 2 : 1,71 €/L</span>
          </p>
        </div>

        <CardContent className="p-[4vw] md:p-6">
          {/* Question */}
          <div className="mb-[4vh] md:mb-6">
            <h3 className="text-[4vw] md:text-lg font-semibold text-gray-800 mb-[3vh] md:mb-4 flex items-center gap-[2vw] md:gap-2">
              {getResultIcon(currentQuestion.id)}
              <span className="text-purple-600 font-bold">{currentQuestion.questionLabel}</span>
              {currentQuestion.question}
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
                      Valider ma réponse
                    </Button>
                    {currentQuestion.hint && !showHint && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                        className="text-[3vw] md:text-sm"
                      >
                        💡 Indice
                      </Button>
                    )}
                  </div>
                )}

                {showHint && !hasAnswered && currentQuestion.hint && (
                  <div className="p-[3vw] md:p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-[3vw] md:text-sm text-yellow-800">
                      💡 <strong>Indice :</strong> {currentQuestion.hint}
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
