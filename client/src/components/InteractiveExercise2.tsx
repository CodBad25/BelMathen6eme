import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy, Gamepad2, RefreshCw, Shuffle, ArrowLeft, Target } from "lucide-react";

// Types
interface Question {
  id: string;
  type: "lettres_to_chiffres" | "chiffres_to_lettres";
  question: string;
  correctAnswer: string;
  hint?: string;
  difficulty: "facile" | "moyen" | "difficile";
}

type AnswerResult = "correct" | "almost" | "wrong"; // almost = 1 faute acceptée

// Fonction pour normaliser le texte (pour comparaison souple)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[-–—]/g, " ")          // Remplace les tirets par des espaces
    .replace(/\s+/g, " ")            // Normalise les espaces
    .replace(/euros?/gi, "euro")
    .replace(/centimes?/gi, "centime")
    .trim();
}

// Distance de Levenshtein pour compter les erreurs
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Trouver les différences entre deux textes pour affichage
function findDifferences(userText: string, correctText: string): { userHighlight: string; correctHighlight: string } {
  const userWords = userText.split(/[\s-]+/);
  const correctWords = correctText.split(/[\s-]+/);

  const highlightedUser = userWords.map((word, i) => {
    const correctWord = correctWords[i] || "";
    if (normalizeText(word) !== normalizeText(correctWord)) {
      return `<span class="text-red-600 font-bold underline">${word}</span>`;
    }
    return word;
  }).join(" ");

  const highlightedCorrect = correctWords.map((word, i) => {
    const userWord = userWords[i] || "";
    if (normalizeText(word) !== normalizeText(userWord)) {
      return `<span class="text-green-600 font-bold">${word}</span>`;
    }
    return word;
  }).join("-");

  return { userHighlight: highlightedUser, correctHighlight: highlightedCorrect };
}

// Vérifier la réponse avec plus de nuances
function checkTextAnswer(userText: string, correctText: string): { result: AnswerResult; errors: number } {
  const normalizedUser = normalizeText(userText);
  const normalizedCorrect = normalizeText(correctText);

  if (normalizedUser === normalizedCorrect) {
    return { result: "correct", errors: 0 };
  }

  // Calculer le nombre d'erreurs
  const errors = levenshteinDistance(normalizedUser, normalizedCorrect);

  // Tolérance : 1-2 erreurs = "almost" (accepté mais montrer la correction)
  // Plus de 2 erreurs = "wrong"
  if (errors <= 2) {
    return { result: "almost", errors };
  }

  return { result: "wrong", errors };
}

// Convertir un nombre en lettres (version complète pour grands nombres)
function numberToWords(n: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  const euros = Math.floor(n);
  const centimes = Math.round((n - euros) * 100);

  const convertUnder100 = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 70) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (u === 0) return tens[t];
      if (u === 1 && t !== 8) return `${tens[t]}-et-un`;
      return `${tens[t]}-${units[u]}`;
    }
    if (num < 80) {
      const u = num - 60;
      if (u === 1) return "soixante-et-onze";
      return `soixante-${units[u]}`;
    }
    const u = num - 80;
    if (u === 0) return "quatre-vingts";
    return `quatre-vingt-${units[u]}`;
  };

  const convertUnder1000 = (num: number): string => {
    if (num < 100) return convertUnder100(num);
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let result = h === 1 ? "cent" : `${units[h]}-cent`;
    if (rest === 0 && h > 1) result += "s";
    else if (rest > 0) result += `-${convertUnder100(rest)}`;
    return result;
  };

  const convertNumber = (num: number): string => {
    if (num === 0) return "zéro";
    if (num < 1000) return convertUnder1000(num);

    // Milliers
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const rest = num % 1000;
      let result = thousands === 1 ? "mille" : `${convertUnder1000(thousands)}-mille`;
      if (rest > 0) result += `-${convertUnder1000(rest)}`;
      return result;
    }

    // Millions (pour les très grands nombres)
    const millions = Math.floor(num / 1000000);
    const rest = num % 1000000;
    let result = millions === 1 ? "un-million" : `${convertUnder1000(millions)}-millions`;
    if (rest > 0) {
      if (rest < 1000) {
        result += `-${convertUnder1000(rest)}`;
      } else {
        const thousands = Math.floor(rest / 1000);
        const remainder = rest % 1000;
        result += thousands === 1 ? "-mille" : `-${convertUnder1000(thousands)}-mille`;
        if (remainder > 0) result += `-${convertUnder1000(remainder)}`;
      }
    }
    return result;
  };

  let result = "";
  if (euros > 0) {
    result = `${convertNumber(euros)} euro${euros > 1 ? "s" : ""}`;
  }
  if (centimes > 0) {
    if (euros > 0) result += " et ";
    result += `${convertUnder100(centimes)} centime${centimes > 1 ? "s" : ""}`;
  }
  return result || "zéro euro";
}

// Formater un nombre en chaîne avec espaces pour milliers
function formatNumber(n: number): string {
  const euros = Math.floor(n);
  const centimes = Math.round((n - euros) * 100);

  const formatted = euros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  if (centimes > 0) {
    return `${formatted},${centimes.toString().padStart(2, "0")} €`;
  }
  return `${formatted} €`;
}

// Nombres à éviter (ceux de l'exercice original)
const numbersToAvoid = new Set([90.05, 370763.17, 1300, 2583, 780, 90, 370763]);

// Générer des questions aléatoires
function generateQuestions(difficulty: "facile" | "moyen" | "difficile" | "mix"): Question[] {
  const questions: Question[] = [];
  const usedNumbers = new Set<number>(); // Pour éviter les doublons dans la même série

  // Définir les plages selon la difficulté
  const ranges = {
    facile: { min: 10, max: 99, centimes: false },
    moyen: { min: 100, max: 9999, centimes: true },
    difficile: { min: 10000, max: 999999, centimes: true },
  };

  const generateAmount = (level: "facile" | "moyen" | "difficile"): number => {
    const range = ranges[level];
    let amount: number;
    let attempts = 0;

    do {
      amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

      // Ajouter des centimes parfois pour moyen et difficile
      if (range.centimes && Math.random() > 0.5) {
        amount += Math.floor(Math.random() * 99 + 1) / 100;
      }

      amount = Math.round(amount * 100) / 100;
      attempts++;
    } while ((numbersToAvoid.has(amount) || usedNumbers.has(amount)) && attempts < 50);

    usedNumbers.add(amount);
    return amount;
  };

  // Nombres intéressants à pratiquer (avec des pièges) - SANS ceux de l'exercice original
  const interestingNumbers = [
    { n: 80, hint: "Attention : quatre-vingts prend un 's' car il est seul" },
    { n: 81, hint: "quatre-vingt sans 's' car suivi de 'un'" },
    { n: 91, hint: "quatre-vingt-onze (pas de 'et')" },
    { n: 200, hint: "deux-cents avec un 's' car multiplié et en fin" },
    { n: 201, hint: "deux-cent sans 's' car suivi de 'un'" },
    { n: 1000, hint: "mille ne prend jamais de 's'" },
    { n: 2000, hint: "deux-mille (mille reste invariable)" },
    { n: 1200, hint: "mille-deux-cents (deux-cents avec 's')" },
    { n: 880, hint: "huit-cent-quatre-vingts (vingts avec 's' en fin)" },
    { n: 883, hint: "huit-cent-quatre-vingt-trois (vingt sans 's')" },
    { n: 300, hint: "trois-cents avec un 's' car multiplié et en fin" },
    { n: 400, hint: "quatre-cents avec un 's' car multiplié et en fin" },
    { n: 71, hint: "soixante-et-onze (avec 'et')" },
    { n: 21, hint: "vingt-et-un (avec 'et')" },
  ].filter(item => !numbersToAvoid.has(item.n));

  const levels = difficulty === "mix" ? ["facile", "moyen", "difficile"] : [difficulty];

  // Générer 5 questions
  for (let i = 0; i < 5; i++) {
    const level = levels[i % levels.length] as "facile" | "moyen" | "difficile";
    const type = Math.random() > 0.5 ? "lettres_to_chiffres" : "chiffres_to_lettres";

    // Utiliser un nombre intéressant parfois (filtré selon le niveau)
    let amount: number;
    let hint: string | undefined;

    const levelInteresting = interestingNumbers.filter(item => {
      if (level === "facile") return item.n < 100;
      if (level === "moyen") return item.n >= 100 && item.n < 10000;
      return item.n >= 10000;
    });

    if (levelInteresting.length > 0 && Math.random() > 0.5 && !usedNumbers.has(levelInteresting[0]?.n)) {
      const interesting = levelInteresting[Math.floor(Math.random() * levelInteresting.length)];
      if (!usedNumbers.has(interesting.n)) {
        amount = interesting.n;
        hint = interesting.hint;
        usedNumbers.add(amount);
      } else {
        amount = generateAmount(level);
      }
    } else {
      amount = generateAmount(level);
    }

    const inWords = numberToWords(amount);
    const inNumbers = formatNumber(amount);

    if (type === "lettres_to_chiffres") {
      questions.push({
        id: `q${i + 1}`,
        type: "lettres_to_chiffres",
        question: `Écris en chiffres : "${inWords}"`,
        correctAnswer: amount.toString().replace(".", ","),
        hint,
        difficulty: level,
      });
    } else {
      questions.push({
        id: `q${i + 1}`,
        type: "chiffres_to_lettres",
        question: `Écris en lettres : ${inNumbers}`,
        correctAnswer: inWords,
        hint,
        difficulty: level,
      });
    }
  }

  return questions;
}

// Questions de l'exercice original
const originalQuestions: Question[] = [
  {
    id: "orig1",
    type: "lettres_to_chiffres",
    question: 'Écris en chiffres : "quatre-vingt-dix euros et cinq centimes"',
    correctAnswer: "90,05",
    hint: "quatre-vingt = 4×20 = 80, quatre-vingt-dix = 80+10 = 90",
    difficulty: "moyen",
  },
  {
    id: "orig2",
    type: "lettres_to_chiffres",
    question: 'Écris en chiffres : "trois-cent-soixante-dix-mille-sept-cent-soixante-trois euros et dix-sept centimes"',
    correctAnswer: "370763,17",
    hint: "trois-cent-soixante-dix-mille = 370 000",
    difficulty: "difficile",
  },
  {
    id: "orig3a",
    type: "chiffres_to_lettres",
    question: "Écris en lettres : 1 300 €",
    correctAnswer: "mille-trois-cents euros",
    hint: "trois-cents prend un 's' car multiplié et en fin de nombre",
    difficulty: "moyen",
  },
  {
    id: "orig3b",
    type: "chiffres_to_lettres",
    question: "Écris en lettres : 2 583 €",
    correctAnswer: "deux-mille-cinq-cent-quatre-vingt-trois euros",
    hint: "cinq-cent et quatre-vingt sans 's' car suivis d'autres mots",
    difficulty: "moyen",
  },
  {
    id: "orig3c",
    type: "chiffres_to_lettres",
    question: "Écris en lettres : 780 €",
    correctAnswer: "sept-cent-quatre-vingts euros",
    hint: "quatre-vingts prend un 's' car multiplié et en fin de nombre",
    difficulty: "moyen",
  },
];

// Sections
interface Section {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const sections: Section[] = [
  {
    id: "original",
    label: "📖",
    title: "Exercice original",
    description: "Les 5 questions du cours",
    icon: "📖",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "facile",
    label: "⭐",
    title: "Facile",
    description: "Nombres de 10 à 99",
    icon: "⭐",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "moyen",
    label: "⭐⭐",
    title: "Moyen",
    description: "Nombres de 100 à 9 999",
    icon: "⭐⭐",
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "difficile",
    label: "⭐⭐⭐",
    title: "Difficile",
    description: "Nombres jusqu'à 999 999",
    icon: "⭐⭐⭐",
    color: "from-red-500 to-rose-500",
  },
];

interface InteractiveExercise2Props {
  onClose: () => void;
}

export default function InteractiveExercise2({ onClose }: InteractiveExercise2Props) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AnswerResult | null>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Refs pour les inputs
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Calculer le score (correct ET almost comptent comme bons)
  const answeredQuestions = questions.filter((q) => results[q.id] !== undefined && results[q.id] !== null);
  const score = answeredQuestions.filter((q) => results[q.id] === "correct" || results[q.id] === "almost").length;
  const totalQuestions = questions.length;

  // Vérifier si toutes les questions sont répondues
  useEffect(() => {
    if (hasStarted && answeredQuestions.length === totalQuestions && totalQuestions > 0) {
      // Délai de 2.5 secondes pour voir le feedback de la dernière question
      setTimeout(() => setShowEndScreen(true), 2500);
    }
  }, [answeredQuestions.length, totalQuestions, hasStarted]);

  // Focus automatique sur l'input de la question courante
  useEffect(() => {
    if (hasStarted && questions.length > 0 && !showEndScreen) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        // Petit délai pour laisser le DOM se mettre à jour
        setTimeout(() => {
          const input = inputRefs.current[currentQuestion.id];
          if (input) {
            input.focus();
            // Scroll vers la question courante
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  }, [currentQuestionIndex, hasStarted, questions, showEndScreen]);

  const startExercise = () => {
    if (!selectedSection) return;

    if (selectedSection === "original") {
      setQuestions(originalQuestions);
    } else {
      setQuestions(generateQuestions(selectedSection as "facile" | "moyen" | "difficile"));
    }

    setHasStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setShowHints({});
    setShowEndScreen(false);
  };

  const handleSubmit = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    const userAnswer = answers[questionId];
    if (!question || !userAnswer) return;

    let result: AnswerResult;

    if (question.type === "lettres_to_chiffres") {
      // Normaliser la réponse numérique
      const normalizedUser = userAnswer.replace(/\s/g, "").replace(",", ".");
      const normalizedCorrect = question.correctAnswer.replace(/\s/g, "").replace(",", ".");
      result = parseFloat(normalizedUser) === parseFloat(normalizedCorrect) ? "correct" : "wrong";
    } else {
      // Comparaison textuelle avec tolérance
      const check = checkTextAnswer(userAnswer, question.correctAnswer);
      result = check.result;
    }

    setResults((prev) => ({ ...prev, [questionId]: result }));

    // Passer à la question suivante après un délai
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((prev) => prev + 1), 1000);
    }
  };

  const restartExercise = (regenerate: boolean) => {
    if (regenerate && selectedSection && selectedSection !== "original") {
      setQuestions(generateQuestions(selectedSection as "facile" | "moyen" | "difficile"));
    }
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setShowHints({});
    setShowEndScreen(false);
  };

  const goToSectionChoice = () => {
    setHasStarted(false);
    setSelectedSection(null);
    setQuestions([]);
    setAnswers({});
    setResults({});
    setShowHints({});
    setShowEndScreen(false);
  };

  // Écran de choix de section
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 z-50 overflow-y-auto p-[3vw] md:p-4">
        <Card className="max-w-2xl mx-auto my-[2vh] md:my-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-[4vw] md:p-6 text-center">
            <Gamepad2 className="w-[12vw] h-[12vw] md:w-12 md:h-12 mx-auto mb-[2vw] md:mb-3" />
            <h2 className="text-[5vw] md:text-2xl font-bold mb-[1vw] md:mb-2">À toi de jouer !</h2>
            <p className="text-[3vw] md:text-sm opacity-90">
              Écrire les nombres en lettres
            </p>
          </div>

          <CardContent className="p-[4vw] md:p-6">
            <div className="flex items-center gap-[2vw] md:gap-2 mb-[3vw] md:mb-4">
              <Target className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-purple-600" />
              <h3 className="text-[4vw] md:text-lg font-bold text-gray-800">Choisis ton niveau</h3>
            </div>

            <div className="grid grid-cols-2 gap-[3vw] md:gap-3">
              {sections.map((section) => {
                const isSelected = selectedSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`p-[3vw] md:p-4 rounded-xl border-2 transition-all text-left relative ${
                      isSelected
                        ? `border-purple-500 bg-gradient-to-br ${section.color} text-white shadow-lg scale-[1.02]`
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-[2vw] right-[2vw] md:top-2 md:right-2">
                        <CheckCircle className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-white" />
                      </div>
                    )}
                    <div className="text-center">
                      <span className="text-[8vw] md:text-4xl block mb-[2vw] md:mb-2">{section.icon}</span>
                      <p className={`text-[3.5vw] md:text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}>
                        {section.title}
                      </p>
                      <p className={`text-[2.5vw] md:text-xs mt-[0.5vw] ${
                        isSelected ? "text-white/80" : "text-gray-500"
                      }`}>
                        {section.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bouton commencer */}
            <div className="mt-[4vw] md:mt-6 pt-[3vw] md:pt-4 border-t border-gray-200">
              <Button
                onClick={startExercise}
                disabled={!selectedSection}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-[4vw] md:text-base py-[3vw] md:py-3"
              >
                <Gamepad2 className="w-[5vw] h-[5vw] md:w-5 md:h-5" />
                Commencer !
              </Button>

              <Button variant="ghost" onClick={onClose} className="w-full mt-[2vw] md:mt-2 text-gray-500">
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de fin
  if (showEndScreen) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : percentage >= 40 ? "💪" : "📚";
    const message =
      percentage >= 80
        ? "Excellent ! Tu maîtrises bien !"
        : percentage >= 60
        ? "Bien joué ! Continue comme ça !"
        : percentage >= 40
        ? "Tu progresses ! Encore un petit effort !"
        : "Révise les règles et réessaie !";

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-800 to-emerald-900 z-50 overflow-y-auto p-[2vw] md:p-4">
        <Card className="max-w-lg mx-auto my-[5vh] md:my-10">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-[4vw] md:p-4 text-center">
            <h3 className="text-[3.5vw] md:text-base font-bold">
              {sections.find((s) => s.id === selectedSection)?.title}
            </h3>
          </div>

          <CardContent className="p-[6vw] md:p-8 text-center">
            <div className="text-[15vw] md:text-8xl mb-[3vh] md:mb-4">{emoji}</div>
            <h2 className="text-[6vw] md:text-2xl font-bold mb-[2vh] md:mb-3">
              {percentage >= 80 ? "Excellent !" : percentage >= 60 ? "Bien joué !" : percentage >= 40 ? "Continue !" : "Révise !"}
            </h2>
            <p className="text-[4vw] md:text-lg text-gray-600 mb-[1vh] md:mb-2">
              Tu as obtenu <span className="font-bold text-purple-600">{score}/{totalQuestions}</span> bonnes réponses
            </p>
            <p className="text-[5vw] md:text-xl font-bold text-purple-600 mb-[2vh] md:mb-4">
              {percentage}%
            </p>
            <p className="text-[3vw] md:text-sm text-gray-500 mb-[4vh] md:mb-6">{message}</p>

            <div className="flex flex-col gap-[2vw] md:gap-3">
              <Button onClick={() => restartExercise(false)} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500">
                <RefreshCw className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Refaire
              </Button>
              {selectedSection !== "original" && (
                <Button onClick={() => restartExercise(true)} variant="outline" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                  <Shuffle className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                  Nouveaux nombres
                </Button>
              )}
              <Button onClick={goToSectionChoice} variant="outline" className="gap-2">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Changer de niveau
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-gray-500">
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran des questions
  const currentQuestion = questions[currentQuestionIndex];
  const sectionLabel = sections.find((s) => s.id === selectedSection)?.title || "";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-50 overflow-y-auto">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
        <div className="max-w-2xl mx-auto p-[3vw] md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[2vw] md:gap-3">
              <button onClick={goToSectionChoice} className="p-[1vw] md:p-1 hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-[5vw] h-[5vw] md:w-5 md:h-5" />
              </button>
              <div>
                <h2 className="text-[3.5vw] md:text-base font-bold">{sectionLabel}</h2>
                <p className="text-[2.5vw] md:text-xs opacity-80">
                  Question {currentQuestionIndex + 1}/{totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[2vw] md:gap-3">
              <div className="flex items-center gap-[1vw] md:gap-1 bg-white/20 px-[2vw] py-[1vw] md:px-3 md:py-1 rounded-full">
                <Trophy className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="font-bold text-[3.5vw] md:text-sm">{score}/{answeredQuestions.length}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={onClose} className="text-[3vw] md:text-sm">
                ✕
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-white/10 h-1">
        <div
          className="bg-green-400 h-full transition-all duration-300"
          style={{ width: `${(answeredQuestions.length / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto p-[3vw] md:p-4 space-y-[4vw] md:space-y-4 pb-[10vh]">
        {questions.map((question, index) => {
          const hasAnswered = results[question.id] !== undefined && results[question.id] !== null;
          const answerResult = results[question.id];
          const isCurrent = index === currentQuestionIndex;

          return (
            <Card
              key={question.id}
              className={`transition-all duration-300 ${
                hasAnswered
                  ? answerResult === "correct"
                    ? "border-green-300 bg-green-50/50"
                    : answerResult === "almost"
                    ? "border-amber-300 bg-amber-50/50"
                    : "border-red-300 bg-red-50/50"
                  : isCurrent
                  ? "border-purple-300 shadow-lg"
                  : "border-gray-200 opacity-50"
              }`}
            >
              <CardContent className="p-[4vw] md:p-4">
                {/* Badge difficulté */}
                <div className="flex items-center justify-between mb-[2vw] md:mb-3">
                  <span className={`text-[2.5vw] md:text-xs px-[2vw] py-[0.5vw] md:px-2 md:py-0.5 rounded-full ${
                    question.difficulty === "facile" ? "bg-green-100 text-green-700" :
                    question.difficulty === "moyen" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {question.difficulty === "facile" ? "⭐ Facile" :
                     question.difficulty === "moyen" ? "⭐⭐ Moyen" :
                     "⭐⭐⭐ Difficile"}
                  </span>
                  {hasAnswered && (
                    answerResult === "correct" ? (
                      <CheckCircle className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-green-500" />
                    ) : answerResult === "almost" ? (
                      <CheckCircle className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-amber-500" />
                    ) : (
                      <XCircle className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-red-500" />
                    )
                  )}
                </div>

                {/* Question */}
                <p className="text-[3.5vw] md:text-base font-medium text-gray-800 mb-[3vw] md:mb-4">
                  {question.question}
                </p>

                {/* Input */}
                <div className="space-y-[2vw] md:space-y-3">
                  <div className="flex gap-[2vw] md:gap-2 items-center">
                    <Input
                      ref={(el) => { inputRefs.current[question.id] = el; }}
                      type="text"
                      value={answers[question.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      placeholder={question.type === "lettres_to_chiffres" ? "Ta réponse en chiffres..." : "Ta réponse en lettres..."}
                      disabled={hasAnswered || !isCurrent}
                      className="text-[3.5vw] md:text-base flex-1"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit(question.id)}
                    />
                    {question.type === "lettres_to_chiffres" && (
                      <span className="text-[3vw] md:text-sm text-gray-500">€</span>
                    )}
                    {!hasAnswered && isCurrent && (
                      <Button onClick={() => handleSubmit(question.id)} disabled={!answers[question.id]} size="sm">
                        OK
                      </Button>
                    )}
                  </div>

                  {/* Indice */}
                  {!hasAnswered && isCurrent && question.hint && (
                    <button
                      onClick={() => setShowHints((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}
                      className="text-[2.5vw] md:text-xs text-amber-600 hover:text-amber-800"
                    >
                      {showHints[question.id] ? "Masquer l'indice" : "💡 Voir un indice"}
                    </button>
                  )}

                  {showHints[question.id] && !hasAnswered && (
                    <div className="p-[2vw] md:p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[2.5vw] md:text-xs text-amber-800">💡 {question.hint}</p>
                    </div>
                  )}

                  {/* Correction */}
                  {hasAnswered && results[question.id] === "wrong" && (
                    <div className="p-[2vw] md:p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-[2.5vw] md:text-xs text-red-600 mb-1">❌ Réponse attendue :</p>
                      <p className="text-[3vw] md:text-sm font-medium text-red-800">
                        {question.type === "lettres_to_chiffres"
                          ? `${question.correctAnswer.replace(".", ",")} €`
                          : question.correctAnswer}
                      </p>
                    </div>
                  )}

                  {hasAnswered && results[question.id] === "almost" && (
                    <div className="p-[2vw] md:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[2.5vw] md:text-xs text-amber-700 mb-1">✅ Accepté ! Mais attention à l'orthographe :</p>
                      <p className="text-[2.5vw] md:text-xs text-gray-500 mb-1">Ta réponse : <span className="text-red-600">{answers[question.id]}</span></p>
                      <p className="text-[3vw] md:text-sm font-medium text-green-700">
                        Bonne orthographe : {question.correctAnswer}
                      </p>
                    </div>
                  )}

                  {hasAnswered && results[question.id] === "correct" && (
                    <div className="p-[2vw] md:p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-[2.5vw] md:text-xs text-green-700">✅ Bravo, c'est parfait !</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
