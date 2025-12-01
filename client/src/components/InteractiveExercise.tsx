import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, RefreshCw, Gamepad2, Trophy, ArrowRight } from "lucide-react";

// Types pour les questions interactives
interface QCMQuestion {
  type: "qcm";
  question: string;
  options: string[];
  correctIndex: number;
}

interface NumericQuestion {
  type: "numeric";
  question: string;
  correctAnswer: number;
  tolerance?: number; // Pour accepter des réponses proches
  unit?: string;
}

interface InteractiveQuestion {
  id: string;
  data: QCMQuestion | NumericQuestion;
}

// Générateur d'exercice sur les prix de carburant
interface CarburantExerciseData {
  prix1: number; // 3 décimales (ex: 1.503)
  prix2: number; // 2 décimales (ex: 1.71)
  volume: number;
  billetDonne: number;
}

function generateCarburantExercise(): CarburantExerciseData {
  // Prix avec 3 décimales pour Station 1 (entre 1.400 et 1.800)
  const prix1 = Math.round((1.4 + Math.random() * 0.4) * 1000) / 1000;

  // Prix avec 2 décimales pour Station 2 (entre 1.40 et 1.80)
  const prix2 = Math.round((1.4 + Math.random() * 0.4) * 100) / 100;

  // Volumes possibles
  const volumes = [5, 10, 15, 20, 25, 30, 40, 50];
  const volume = volumes[Math.floor(Math.random() * volumes.length)];

  // Billets possibles
  const billets = [10, 20, 50, 100];
  const billetDonne = billets[Math.floor(Math.random() * billets.length)];

  return { prix1, prix2, volume, billetDonne };
}

function createQuestionsFromData(data: CarburantExerciseData): InteractiveQuestion[] {
  const { prix1, prix2, volume, billetDonne } = data;

  const stationMoinsChere = prix1 < prix2 ? 0 : 1;
  const difference = Math.abs(prix1 - prix2);
  const prixTotal1 = prix1 * volume;
  const prixTotal2 = prix2 * volume;
  const differenceTotale = Math.abs(prixTotal1 - prixTotal2);
  const monnaie1 = billetDonne - prixTotal1;
  const monnaie2 = billetDonne - prixTotal2;

  return [
    {
      id: "q1",
      data: {
        type: "qcm",
        question: "Quelle station est la moins chère ?",
        options: ["Station 1", "Station 2"],
        correctIndex: stationMoinsChere,
      }
    },
    {
      id: "q2",
      data: {
        type: "numeric",
        question: "Quelle est la différence de prix au litre (en €) ?",
        correctAnswer: Math.round(difference * 1000) / 1000,
        tolerance: 0.001,
        unit: "€/L"
      }
    },
    {
      id: "q3",
      data: {
        type: "numeric",
        question: `Pour ${volume} L, quelle sera la différence totale (en €) ?`,
        correctAnswer: Math.round(differenceTotale * 100) / 100,
        tolerance: 0.01,
        unit: "€"
      }
    },
    {
      id: "q4",
      data: {
        type: "numeric",
        question: `Si je donne ${billetDonne} € à la Station 1, combien me rend-on ?`,
        correctAnswer: Math.round(monnaie1 * 100) / 100,
        tolerance: 0.01,
        unit: "€"
      }
    },
    {
      id: "q5",
      data: {
        type: "numeric",
        question: `Si je donne ${billetDonne} € à la Station 2, combien me rend-on ?`,
        correctAnswer: Math.round(monnaie2 * 100) / 100,
        tolerance: 0.01,
        unit: "€"
      }
    }
  ];
}

interface InteractiveExerciseProps {
  onClose: () => void;
}

export default function InteractiveExercise({ onClose }: InteractiveExerciseProps) {
  const [exerciseData, setExerciseData] = useState<CarburantExerciseData | null>(null);
  const [questions, setQuestions] = useState<InteractiveQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [numericInput, setNumericInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Générer un nouvel exercice
  const generateNewExercise = () => {
    const data = generateCarburantExercise();
    setExerciseData(data);
    setQuestions(createQuestionsFromData(data));
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setNumericInput("");
    setShowResult(false);
    setScore(0);
  };

  useEffect(() => {
    generateNewExercise();
  }, []);

  if (!exerciseData || questions.length === 0) {
    return <div>Chargement...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = results[currentQuestion.id] !== undefined;

  const handleQCMAnswer = (optionIndex: number) => {
    if (hasAnswered) return;

    const qcmData = currentQuestion.data as QCMQuestion;
    const isCorrect = optionIndex === qcmData.correctIndex;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    setResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNumericSubmit = () => {
    if (hasAnswered || !numericInput) return;

    const numericData = currentQuestion.data as NumericQuestion;
    const userAnswer = parseFloat(numericInput.replace(",", "."));
    const tolerance = numericData.tolerance || 0;
    const isCorrect = Math.abs(userAnswer - numericData.correctAnswer) <= tolerance;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: userAnswer }));
    setResults(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setNumericInput("");
    }
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

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-[4vw] md:p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="p-[6vw] md:p-8 text-center">
            <div className="text-[15vw] md:text-8xl mb-[4vh] md:mb-6">{emoji}</div>
            <h2 className="text-[6vw] md:text-2xl font-bold mb-[2vh] md:mb-4">
              {percentage >= 80 ? "Excellent !" : percentage >= 60 ? "Bien joué !" : percentage >= 40 ? "Continue !" : "Révise encore !"}
            </h2>
            <p className="text-[4vw] md:text-lg text-gray-600 mb-[4vh] md:mb-6">
              Tu as obtenu <span className="font-bold text-purple-600">{score}/{questions.length}</span> bonnes réponses ({percentage}%)
            </p>

            <div className="flex flex-col gap-[2vw] md:gap-3">
              <Button onClick={generateNewExercise} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Nouvel exercice
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
                <p className="text-[2.5vw] md:text-xs opacity-80">Question {currentQuestionIndex + 1}/{questions.length}</p>
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
            <strong>⛽ Contexte :</strong> Voici les prix du gazole dans deux stations :<br/>
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">Station 1 : {exerciseData.prix1.toFixed(3)} €/L</span>
            {" "}et{" "}
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">Station 2 : {exerciseData.prix2.toFixed(2)} €/L</span>
          </p>
        </div>

        <CardContent className="p-[4vw] md:p-6">
          {/* Question */}
          <div className="mb-[4vh] md:mb-6">
            <h3 className="text-[4vw] md:text-lg font-semibold text-gray-800 mb-[3vh] md:mb-4 flex items-center gap-[2vw] md:gap-2">
              {getResultIcon(currentQuestion.id)}
              {currentQuestion.data.question}
            </h3>

            {/* QCM */}
            {currentQuestion.data.type === "qcm" && (
              <div className="grid gap-[2vw] md:gap-3">
                {(currentQuestion.data as QCMQuestion).options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  const isCorrect = (currentQuestion.data as QCMQuestion).correctIndex === index;
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
            {currentQuestion.data.type === "numeric" && (
              <div className="space-y-[3vw] md:space-y-4">
                <div className="flex gap-[2vw] md:gap-3">
                  <Input
                    type="text"
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    placeholder="Ta réponse..."
                    disabled={hasAnswered}
                    className="text-[4vw] md:text-lg p-[3vw] md:p-4"
                    onKeyDown={(e) => e.key === "Enter" && handleNumericSubmit()}
                  />
                  <span className="flex items-center text-[3vw] md:text-sm text-gray-500">
                    {(currentQuestion.data as NumericQuestion).unit}
                  </span>
                </div>

                {!hasAnswered && (
                  <Button
                    onClick={handleNumericSubmit}
                    disabled={!numericInput}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Valider ma réponse
                  </Button>
                )}

                {hasAnswered && (
                  <div className={`p-[3vw] md:p-4 rounded-xl ${results[currentQuestion.id] ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <p className={`text-[3vw] md:text-sm ${results[currentQuestion.id] ? "text-green-700" : "text-red-700"}`}>
                      {results[currentQuestion.id]
                        ? "✅ Bonne réponse !"
                        : `❌ La bonne réponse était : ${(currentQuestion.data as NumericQuestion).correctAnswer} ${(currentQuestion.data as NumericQuestion).unit}`
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
