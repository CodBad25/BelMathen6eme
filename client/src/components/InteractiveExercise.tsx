import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Trophy, Gamepad2, RefreshCw, Shuffle, ArrowLeft, Target } from "lucide-react";

// Types
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
  group?: string;
  chequeData?: {
    montant: number;
    station: string;
    montantEnLettres: string;
  };
}

interface ExerciseData {
  station1Price: number;
  station2Price: number;
  station1Display: string;
  station2Display: string;
}

interface ExerciseSection {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  questionIds: string[];
  color: string;
}

// Fonction pour normaliser le texte (pour comparaison souple)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/euros?/gi, "euros")
    .replace(/centimes?/gi, "centimes")
    .trim();
}

// Vérifier si deux textes sont similaires
function areTextsSimilar(userText: string, correctText: string): boolean {
  const normalizedUser = normalizeText(userText);
  const normalizedCorrect = normalizeText(correctText);
  if (normalizedUser === normalizedCorrect) return true;
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  let matches = 0;
  for (let i = 0; i < Math.min(normalizedUser.length, normalizedCorrect.length); i++) {
    if (normalizedUser[i] === normalizedCorrect[i]) matches++;
  }
  return matches / maxLength >= 0.85;
}

// Convertir un nombre en lettres
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
      if (u === 1 && t !== 8) return `${tens[t]} et un`;
      return `${tens[t]}-${units[u]}`;
    }
    if (num < 80) {
      const u = num - 60;
      if (u === 1) return "soixante et onze";
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
    let result = h === 1 ? "cent" : `${units[h]} cent`;
    if (rest === 0 && h > 1) result += "s";
    else if (rest > 0) result += ` ${convertUnder100(rest)}`;
    return result;
  };

  let result = "";
  if (euros > 0) {
    result = `${convertUnder1000(euros)} euro${euros > 1 ? "s" : ""}`;
  }
  if (centimes > 0) {
    if (euros > 0) result += " et ";
    result += `${convertUnder100(centimes)} centime${centimes > 1 ? "s" : ""}`;
  }
  return result || "zéro euro";
}

// Générer les questions basées sur les données
function generateQuestions(data: ExerciseData): Question[] {
  const { station1Price, station2Price, station1Display, station2Display } = data;
  const diff = Math.abs(station2Price - station1Price);
  const cheaperStation = station1Price < station2Price ? 0 : 1;

  const price10L_st1 = station1Price * 10;
  const price10L_st2 = station2Price * 10;
  const diff10L = Math.abs(price10L_st2 - price10L_st1);

  const price100L_st1 = station1Price * 100;
  const price100L_st2 = station2Price * 100;
  const diff100L = Math.abs(price100L_st2 - price100L_st1);

  const price5L_st1 = station1Price * 5;
  const price5L_st2 = station2Price * 5;

  return [
    // Question a)
    {
      id: "a1",
      questionLabel: "a)",
      type: "qcm",
      question: "Quelle station est la moins chère ?",
      options: [`Station 1 (${station1Display} €/L)`, `Station 2 (${station2Display} €/L)`],
      correctIndex: cheaperStation,
    },
    {
      id: "a2",
      questionLabel: "a)",
      type: "numeric",
      question: "Quelle est la différence de prix au litre ?",
      correctAnswer: parseFloat(diff.toFixed(3)),
      tolerance: 0.001,
      unit: "€",
      hint: `Calcule : ${station2Display} - ${station1Display}`,
    },
    // Question b) - 10 litres
    {
      id: "b1",
      questionLabel: "b)",
      type: "numeric",
      question: "Pour 10 L, quel est le prix à payer à la Station 1 ?",
      correctAnswer: parseFloat(price10L_st1.toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Multiplie ${station1Display} par 10`,
      group: "10L",
    },
    {
      id: "b2",
      questionLabel: "b)",
      type: "numeric",
      question: "Pour 10 L, quel est le prix à payer à la Station 2 ?",
      correctAnswer: parseFloat(price10L_st2.toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Multiplie ${station2Display} par 10`,
      group: "10L",
    },
    {
      id: "b3",
      questionLabel: "b)",
      type: "numeric",
      question: "Pour 10 L, quelle est la différence de prix entre les deux stations ?",
      correctAnswer: parseFloat(diff10L.toFixed(2)),
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
      correctAnswer: parseFloat((20 - price10L_st1).toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Calcule : 20 - ${price10L_st1.toFixed(2)}`,
    },
    {
      id: "b5",
      questionLabel: "b)",
      type: "numeric",
      question: "Si je donne 20 € à la Station 2 pour 10 L, combien me rend-on ?",
      correctAnswer: parseFloat((20 - price10L_st2).toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Calcule : 20 - ${price10L_st2.toFixed(2)}`,
    },
    // Question c) - 100 litres
    {
      id: "c1",
      questionLabel: "c)",
      type: "numeric",
      question: "Pour 100 L, quel est le prix à payer à la Station 1 ?",
      correctAnswer: parseFloat(price100L_st1.toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Multiplie ${station1Display} par 100`,
      group: "100L",
    },
    {
      id: "c2",
      questionLabel: "c)",
      type: "numeric",
      question: "Pour 100 L, quel est le prix à payer à la Station 2 ?",
      correctAnswer: parseFloat(price100L_st2.toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Multiplie ${station2Display} par 100`,
      group: "100L",
    },
    {
      id: "c3",
      questionLabel: "c)",
      type: "numeric",
      question: "Pour 100 L, quelle est la différence de prix entre les deux stations ?",
      correctAnswer: parseFloat(diff100L.toFixed(2)),
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
        montant: parseFloat(price100L_st1.toFixed(2)),
        station: "Station 1",
        montantEnLettres: numberToWords(parseFloat(price100L_st1.toFixed(2))),
      },
    },
    {
      id: "c5",
      questionLabel: "c)",
      type: "cheque",
      question: "Remplis le chèque pour la Station 2 (100 L)",
      chequeData: {
        montant: parseFloat(price100L_st2.toFixed(2)),
        station: "Station 2",
        montantEnLettres: numberToWords(parseFloat(price100L_st2.toFixed(2))),
      },
    },
    // Question d) - 5 litres
    {
      id: "d1",
      questionLabel: "d)",
      type: "numeric",
      question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 1 ?",
      correctAnswer: parseFloat(price5L_st1.toFixed(3)),
      tolerance: 0.001,
      unit: "€",
      hint: `Multiplie ${station1Display} par 5 (ou divise le prix pour 10 L par 2)`,
      group: "5L",
    },
    {
      id: "d2",
      questionLabel: "d)",
      type: "numeric",
      question: "Le volume minimal est 5 L. Quel est le prix à payer à la Station 2 ?",
      correctAnswer: parseFloat(price5L_st2.toFixed(2)),
      tolerance: 0.01,
      unit: "€",
      hint: `Multiplie ${station2Display} par 5 (ou divise le prix pour 10 L par 2)`,
      group: "5L",
    },
  ];
}

// Données de l'exercice original
const originalData: ExerciseData = {
  station1Price: 1.503,
  station2Price: 1.71,
  station1Display: "1,503",
  station2Display: "1,71",
};

// Générer des données aléatoires (prix réalistes 2024-2025)
// Fourchette gazole : 1,45 € - 1,85 € / SP95 : 1,55 € - 1,95 €
function generateRandomData(): ExerciseData {
  // Décider aléatoirement quelle station a 3 décimales
  const station1HasThreeDecimals = Math.random() > 0.5;

  // Générer un prix à 3 décimales (sans 0 inutile au millième)
  const generateThreeDecimalPrice = (): { price: number; display: string } => {
    // Partie entière et centièmes : entre 1.45 et 1.85
    const base = 1.45 + Math.random() * 0.40;
    const baseRounded = Math.floor(base * 100) / 100;
    // Millième : 1-9 (jamais 0 pour éviter les zéros inutiles)
    const lastDigit = Math.floor(Math.random() * 9) + 1;
    const price = parseFloat((baseRounded + lastDigit / 1000).toFixed(3));
    // S'assurer que le centième n'est pas 0 (éviter 1,X0Y qui ressemble à 1,XY)
    const centieme = Math.floor((price * 100) % 10);
    if (centieme === 0) {
      // Régénérer avec un centième non nul
      const newBase = 1.45 + Math.random() * 0.40;
      const newBaseRounded = Math.floor(newBase * 10) / 10 + (Math.floor(Math.random() * 9) + 1) / 100;
      const newPrice = parseFloat((newBaseRounded + lastDigit / 1000).toFixed(3));
      return { price: newPrice, display: newPrice.toFixed(3).replace(".", ",") };
    }
    return { price, display: price.toFixed(3).replace(".", ",") };
  };

  // Générer un prix à 2 décimales (sans 0 inutile au centième)
  const generateTwoDecimalPrice = (): { price: number; display: string } => {
    // Entre 1.45 et 1.89
    const base = 1.45 + Math.random() * 0.44;
    let price = parseFloat(base.toFixed(2));
    // S'assurer que le centième n'est pas 0 (éviter 1,X0)
    const centieme = Math.round((price * 100) % 10);
    if (centieme === 0) {
      // Ajouter 1-9 centimes
      price = parseFloat((Math.floor(price * 10) / 10 + (Math.floor(Math.random() * 9) + 1) / 100).toFixed(2));
    }
    return { price, display: price.toFixed(2).replace(".", ",") };
  };

  let station1Data: { price: number; display: string };
  let station2Data: { price: number; display: string };

  if (station1HasThreeDecimals) {
    station1Data = generateThreeDecimalPrice();
    station2Data = generateTwoDecimalPrice();
  } else {
    station1Data = generateTwoDecimalPrice();
    station2Data = generateThreeDecimalPrice();
  }

  // S'assurer qu'il y a une différence significative (au moins 5 centimes)
  while (Math.abs(station2Data.price - station1Data.price) < 0.05) {
    if (station1HasThreeDecimals) {
      station2Data = generateTwoDecimalPrice();
    } else {
      station2Data = generateThreeDecimalPrice();
    }
  }

  return {
    station1Price: station1Data.price,
    station2Price: station2Data.price,
    station1Display: station1Data.display,
    station2Display: station2Data.display,
  };
}

// Sections de l'exercice (sans "Tout" - on le gère différemment)
const sections: ExerciseSection[] = [
  {
    id: "a",
    label: "a)",
    title: "Comparer les prix",
    description: "2 questions - Trouver la station la moins chère",
    icon: "⚖️",
    questionIds: ["a1", "a2"],
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "b",
    label: "b)",
    title: "Calculer pour 10 L",
    description: "5 questions - Multiplier par 10",
    icon: "🔟",
    questionIds: ["b1", "b2", "b3", "b4", "b5"],
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "c",
    label: "c)",
    title: "Calculer pour 100 L",
    description: "5 questions - Multiplier par 100 + chèques",
    icon: "💯",
    questionIds: ["c1", "c2", "c3", "c4", "c5"],
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "d",
    label: "d)",
    title: "Calculer pour 5 L",
    description: "2 questions - Diviser par 2",
    icon: "5️⃣",
    questionIds: ["d1", "d2"],
    color: "from-red-500 to-rose-500",
  },
];

interface InteractiveExerciseProps {
  onClose: () => void;
}

export default function InteractiveExercise({ onClose }: InteractiveExerciseProps) {
  const [exerciseData, setExerciseData] = useState<ExerciseData>(originalData);
  const [allQuestions, setAllQuestions] = useState<Question[]>(() => generateQuestions(originalData));
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>({});
  const [chequeInputs, setChequeInputs] = useState<Record<string, { montantChiffres: string; montantLettres: string }>>({});
  const [chequeResults, setChequeResults] = useState<Record<string, { montantChiffres: boolean | null; montantLettres: boolean | null }>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sections sélectionnées
  const selectedSections = sections.filter((s) => selectedSectionIds.includes(s.id));

  // Questions filtrées selon les sections choisies
  const selectedQuestionIds = selectedSections.flatMap((s) => s.questionIds);
  const questions = allQuestions.filter((q) => selectedQuestionIds.includes(q.id));

  // Toggle sélection d'une section
  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  // Sélectionner tout
  const selectAll = () => {
    setSelectedSectionIds(sections.map((s) => s.id));
  };

  // Désélectionner tout
  const deselectAll = () => {
    setSelectedSectionIds([]);
  };

  // Calculer le score
  const score = questions.filter((q) => results[q.id] === true).length;
  const answeredCount = questions.filter((q) => results[q.id] !== undefined).length;
  const totalQuestions = questions.length;

  // Vérifier si toutes les questions sélectionnées sont répondues
  useEffect(() => {
    if (hasStarted && answeredCount === totalQuestions && totalQuestions > 0) {
      setShowEndScreen(true);
    }
  }, [answeredCount, totalQuestions, hasStarted]);

  const handleQCMAnswer = (questionId: string, optionIndex: number) => {
    if (results[questionId] !== undefined) return;
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = optionIndex === question.correctIndex;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setResults((prev) => ({ ...prev, [questionId]: isCorrect }));
  };

  const handleNumericSubmit = (questionId: string) => {
    if (results[questionId] !== undefined) return;
    const question = allQuestions.find((q) => q.id === questionId);
    const input = numericInputs[questionId];
    if (!question || !input) return;

    const userAnswer = parseFloat(input.replace(",", "."));
    const tolerance = question.tolerance || 0;
    const isCorrect = Math.abs(userAnswer - (question.correctAnswer || 0)) <= tolerance;

    setAnswers((prev) => ({ ...prev, [questionId]: userAnswer }));
    setResults((prev) => ({ ...prev, [questionId]: isCorrect }));
  };

  const handleChequeSubmit = (questionId: string) => {
    if (results[questionId] !== undefined) return;
    const question = allQuestions.find((q) => q.id === questionId);
    const inputs = chequeInputs[questionId];
    if (!question?.chequeData || !inputs) return;

    const { montant, montantEnLettres } = question.chequeData;
    const userMontant = parseFloat(inputs.montantChiffres.replace(",", "."));
    const montantCorrect = Math.abs(userMontant - montant) <= 0.01;
    const lettresCorrect = areTextsSimilar(inputs.montantLettres, montantEnLettres);

    setChequeResults((prev) => ({
      ...prev,
      [questionId]: { montantChiffres: montantCorrect, montantLettres: lettresCorrect },
    }));

    const isCorrect = montantCorrect && lettresCorrect;
    setAnswers((prev) => ({ ...prev, [questionId]: `${inputs.montantChiffres} | ${inputs.montantLettres}` }));
    setResults((prev) => ({ ...prev, [questionId]: isCorrect }));
  };

  const restartExercise = (random: boolean, keepSelection: boolean = true) => {
    const newData = random ? generateRandomData() : originalData;
    setExerciseData(newData);
    setAllQuestions(generateQuestions(newData));
    setAnswers({});
    setResults({});
    setNumericInputs({});
    setChequeInputs({});
    setChequeResults({});
    setShowHints({});
    setShowEndScreen(false);
    setIsRandomMode(random);
    if (keepSelection) {
      setHasStarted(true);
    }
  };

  const goToSectionChoice = () => {
    setHasStarted(false);
    setSelectedSectionIds([]);
    setAnswers({});
    setResults({});
    setNumericInputs({});
    setChequeInputs({});
    setChequeResults({});
    setShowHints({});
    setShowEndScreen(false);
  };

  const startExercise = () => {
    if (selectedSectionIds.length > 0) {
      setHasStarted(true);
    }
  };

  const getResultIcon = (questionId: string) => {
    const result = results[questionId];
    if (result === null || result === undefined) return null;
    return result ? (
      <CheckCircle className="w-[4vw] h-[4vw] md:w-5 md:h-5 text-green-500 flex-shrink-0" />
    ) : (
      <XCircle className="w-[4vw] h-[4vw] md:w-5 md:h-5 text-red-500 flex-shrink-0" />
    );
  };

  // Récupérer les réponses du même groupe pour affichage contextuel
  const getGroupAnswers = (questionId: string) => {
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question?.group) return [];

    const groupQuestions = allQuestions.filter(
      (q) => q.group === question.group && q.id !== questionId && results[q.id] !== undefined
    );

    return groupQuestions.map((q) => ({
      id: q.id,
      question: q.question
        .replace("Pour 10 L, ", "")
        .replace("Pour 100 L, ", "")
        .replace("Le volume minimal est 5 L. ", ""),
      answer: answers[q.id],
      isCorrect: results[q.id],
      unit: q.unit,
    }));
  };

  // Écran de choix de section
  if (!hasStarted) {
    const totalSelectedQuestions = selectedSections.reduce((acc, s) => acc + s.questionIds.length, 0);
    const allSelected = selectedSectionIds.length === sections.length;

    return (
      <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-[3vw] md:p-4">
        <Card className="max-w-2xl mx-auto my-[2vh] md:my-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-[4vw] md:p-6 text-center">
            <Gamepad2 className="w-[12vw] h-[12vw] md:w-12 md:h-12 mx-auto mb-[2vw] md:mb-3" />
            <h2 className="text-[5vw] md:text-2xl font-bold mb-[1vw] md:mb-2">À toi de jouer !</h2>
            <p className="text-[3vw] md:text-sm opacity-90">
              {isRandomMode ? "🎲 Exercice aléatoire" : "📖 Exercice original"} • St1: {exerciseData.station1Display} €/L • St2: {exerciseData.station2Display} €/L
            </p>
          </div>

          <CardContent className="p-[4vw] md:p-6">
            <div className="flex items-center justify-between mb-[3vw] md:mb-4">
              <div className="flex items-center gap-[2vw] md:gap-2">
                <Target className="w-[5vw] h-[5vw] md:w-5 md:h-5 text-purple-600" />
                <h3 className="text-[4vw] md:text-lg font-bold text-gray-800">Choisis tes objectifs</h3>
              </div>
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="text-[2.5vw] md:text-xs text-purple-600 hover:text-purple-800 underline"
              >
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-[3vw] md:gap-3">
              {sections.map((section) => {
                const isSelected = selectedSectionIds.includes(section.id);

                return (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
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
                      <span className="text-[10vw] md:text-5xl block mb-[2vw] md:mb-2">{section.icon}</span>
                      <span className={`text-[3vw] md:text-sm font-bold px-[2vw] py-[0.5vw] md:px-2 md:py-0.5 rounded ${
                        isSelected ? "bg-white/30" : "bg-purple-100 text-purple-600"
                      }`}>
                        {section.label}
                      </span>
                      <p className={`text-[3vw] md:text-sm font-semibold mt-[1vw] md:mt-1 ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}>
                        {section.title}
                      </p>
                      <p className={`text-[2.5vw] md:text-xs mt-[0.5vw] ${
                        isSelected ? "text-white/80" : "text-gray-500"
                      }`}>
                        {section.questionIds.length} questions
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Résumé et bouton commencer */}
            <div className="mt-[4vw] md:mt-6 pt-[3vw] md:pt-4 border-t border-gray-200">
              {selectedSectionIds.length > 0 ? (
                <div className="bg-purple-50 rounded-xl p-[3vw] md:p-4 mb-[3vw] md:mb-4">
                  <p className="text-[3vw] md:text-sm text-purple-800 text-center">
                    <strong>{totalSelectedQuestions} questions</strong> sélectionnées
                    {selectedSectionIds.length < sections.length && (
                      <span className="text-purple-600"> ({selectedSections.map(s => s.label).join(" + ")})</span>
                    )}
                    {selectedSectionIds.length === sections.length && (
                      <span className="text-purple-600"> (Tout l'exercice)</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-[3vw] md:p-4 mb-[3vw] md:mb-4">
                  <p className="text-[3vw] md:text-sm text-gray-500 text-center">
                    Clique sur les parties que tu veux travailler
                  </p>
                </div>
              )}

              <Button
                onClick={startExercise}
                disabled={selectedSectionIds.length === 0}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-[4vw] md:text-base py-[3vw] md:py-3"
              >
                <Gamepad2 className="w-[5vw] h-[5vw] md:w-5 md:h-5" />
                Commencer !
              </Button>

              <div className="flex flex-col gap-[2vw] md:gap-2 mt-[3vw] md:mt-4">
                {!isRandomMode && (
                  <Button
                    variant="outline"
                    onClick={() => restartExercise(true, false)}
                    className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <Shuffle className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                    Générer d'autres données
                  </Button>
                )}
                {isRandomMode && (
                  <Button
                    variant="outline"
                    onClick={() => restartExercise(false, false)}
                    className="gap-2"
                  >
                    <RefreshCw className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                    Revenir à l'exercice original
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} className="text-gray-500">
                  Fermer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de fin (bilan)
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
        : "Révise et réessaie !";

    const selectionLabel = selectedSectionIds.length === sections.length
      ? "Tout l'exercice"
      : selectedSections.map(s => s.label).join(" + ");

    return (
      <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-[2vw] md:p-4">
        <Card className="max-w-lg mx-auto my-[5vh] md:my-10">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-[4vw] md:p-4 text-center">
            <div className="flex justify-center gap-[1vw] md:gap-1 mb-[1vw] md:mb-2">
              {selectedSections.map(s => (
                <span key={s.id} className="text-[5vw] md:text-2xl">{s.icon}</span>
              ))}
            </div>
            <h3 className="text-[3.5vw] md:text-base font-bold">{selectionLabel}</h3>
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
              <Button onClick={() => restartExercise(true)} variant="outline" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                <Shuffle className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Exercice similaire (autres données)
              </Button>
              <Button onClick={goToSectionChoice} variant="outline" className="gap-2">
                <ArrowLeft className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                Changer ma sélection
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
  const selectionLabel = selectedSectionIds.length === sections.length
    ? "Tout l'exercice"
    : selectedSections.map(s => s.label).join(" + ");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
        <div className="max-w-2xl mx-auto p-[3vw] md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[2vw] md:gap-3">
              <button onClick={goToSectionChoice} className="p-[1vw] md:p-1 hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-[5vw] h-[5vw] md:w-5 md:h-5" />
              </button>
              <div className="flex items-center gap-[2vw] md:gap-2">
                <div className="flex gap-[0.5vw] md:gap-0.5">
                  {selectedSections.map(s => (
                    <span key={s.id} className="text-[5vw] md:text-xl">{s.icon}</span>
                  ))}
                </div>
                <div>
                  <h2 className="text-[3.5vw] md:text-base font-bold">{selectionLabel}</h2>
                  <p className="text-[2.5vw] md:text-xs opacity-80">
                    {isRandomMode ? "🎲 Aléatoire" : "📖 Original"} • {answeredCount}/{totalQuestions} répondu
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-[2vw] md:gap-3">
              <div className="flex items-center gap-[1vw] md:gap-1 bg-white/20 px-[2vw] py-[1vw] md:px-3 md:py-1 rounded-full">
                <Trophy className="w-[4vw] h-[4vw] md:w-4 md:h-4" />
                <span className="font-bold text-[3.5vw] md:text-sm">{score}/{answeredCount}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={onClose} className="text-[3vw] md:text-sm">
                ✕
              </Button>
            </div>
          </div>
        </div>

        {/* Contexte */}
        <div className="bg-black/20 text-white py-[2vw] md:py-2 text-center">
          <p className="text-[3vw] md:text-sm">
            <strong>⛽</strong>{" "}
            <span className="font-mono bg-white/20 px-[1vw] md:px-2 rounded">St1: {exerciseData.station1Display} €/L</span>
            {" • "}
            <span className="font-mono bg-white/20 px-[1vw] md:px-2 rounded">St2: {exerciseData.station2Display} €/L</span>
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto p-[3vw] md:p-4 space-y-[4vw] md:space-y-4 pb-[10vh]">
        {questions.map((question) => {
          const hasAnswered = results[question.id] !== undefined;
          const isCorrect = results[question.id] === true;

          return (
            <Card
              key={question.id}
              ref={(el) => { questionRefs.current[question.id] = el; }}
              className={`transition-all ${
                hasAnswered
                  ? isCorrect
                    ? "border-green-300 bg-green-50/50"
                    : "border-red-300 bg-red-50/50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <CardContent className="p-[4vw] md:p-4">
                {/* Affichage des réponses du groupe (contexte) */}
                {(() => {
                  const groupAnswers = getGroupAnswers(question.id);
                  if (groupAnswers.length === 0) return null;

                  const groupLabel = question.group === "10L" ? "10 L" : question.group === "100L" ? "100 L" : "5 L";

                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-[2vw] md:p-3 mb-[3vw] md:mb-4">
                      <p className="text-[2.5vw] md:text-xs text-gray-500 font-medium mb-[1vw] md:mb-2">
                        📝 Tes calculs pour {groupLabel} :
                      </p>
                      <div className="space-y-[1vw] md:space-y-1">
                        {groupAnswers.map((ga) => (
                          <div key={ga.id} className="flex items-center gap-[1vw] md:gap-2 text-[2.5vw] md:text-xs">
                            {ga.isCorrect ? (
                              <CheckCircle className="w-[3vw] h-[3vw] md:w-3 md:h-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-[3vw] h-[3vw] md:w-3 md:h-3 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-gray-600">{ga.question}</span>
                            <span className={`font-mono font-medium ${ga.isCorrect ? "text-green-700" : "text-red-700"}`}>
                              {ga.answer} {ga.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* En-tête question */}
                <div className="flex items-start gap-[2vw] md:gap-3 mb-[3vw] md:mb-4">
                  <span className="text-[4vw] md:text-lg font-bold text-purple-600 bg-purple-100 px-[2vw] py-[1vw] md:px-3 md:py-1 rounded-lg">
                    {question.questionLabel}
                  </span>
                  <div className="flex-1">
                    <p className="text-[3.5vw] md:text-base font-medium text-gray-800">{question.question}</p>
                  </div>
                  {getResultIcon(question.id)}
                </div>

                {/* QCM */}
                {question.type === "qcm" && question.options && (
                  <div className="grid gap-[2vw] md:gap-2">
                    {question.options.map((option, index) => {
                      const isSelected = answers[question.id] === index;
                      const isCorrectOption = question.correctIndex === index;
                      const showFeedback = hasAnswered;

                      let buttonClass = "w-full p-[3vw] md:p-3 text-left border-2 rounded-xl transition-all text-[3vw] md:text-sm ";
                      if (showFeedback) {
                        if (isCorrectOption) {
                          buttonClass += "border-green-500 bg-green-50 text-green-700";
                        } else if (isSelected && !isCorrectOption) {
                          buttonClass += "border-red-500 bg-red-50 text-red-700";
                        } else {
                          buttonClass += "border-gray-200 opacity-50";
                        }
                      } else {
                        buttonClass += "border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer";
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleQCMAnswer(question.id, index)}
                          disabled={hasAnswered}
                          className={buttonClass}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input numérique */}
                {question.type === "numeric" && (
                  <div className="space-y-[2vw] md:space-y-3">
                    <div className="flex gap-[2vw] md:gap-2 items-center">
                      <Input
                        type="text"
                        value={numericInputs[question.id] || ""}
                        onChange={(e) => setNumericInputs((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Ta réponse..."
                        disabled={hasAnswered}
                        className="text-[3.5vw] md:text-base flex-1"
                        onKeyDown={(e) => e.key === "Enter" && handleNumericSubmit(question.id)}
                      />
                      <span className="text-[3vw] md:text-sm text-gray-500">{question.unit}</span>
                      {!hasAnswered && (
                        <Button onClick={() => handleNumericSubmit(question.id)} disabled={!numericInputs[question.id]} size="sm">
                          OK
                        </Button>
                      )}
                    </div>

                    {!hasAnswered && question.hint && (
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

                    {hasAnswered && !isCorrect && (
                      <p className="text-[2.5vw] md:text-xs text-red-600">
                        ❌ Réponse attendue : {question.correctAnswer} {question.unit}
                      </p>
                    )}
                  </div>
                )}

                {/* Chèque */}
                {question.type === "cheque" && question.chequeData && (
                  <div className="space-y-[3vw] md:space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-[2vw] md:p-2">
                      <p className="text-[2.5vw] md:text-xs text-amber-800">
                        📝 <strong>{question.chequeData.station}</strong> - Remplis le chèque pour <strong>100 L</strong>
                      </p>
                    </div>

                    <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
                      <img src="/exercices/prix/cheque_francais.png" alt="Chèque" className="w-full" />
                    </div>

                    <div className="grid gap-[2vw] md:gap-2">
                      <div className="flex gap-[2vw] md:gap-2 items-center">
                        <span className="text-[2.5vw] md:text-xs text-gray-600 w-[20vw] md:w-24">En chiffres :</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={chequeInputs[question.id]?.montantChiffres || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.\s]/g, "");
                            setChequeInputs((prev) => ({
                              ...prev,
                              [question.id]: { ...prev[question.id], montantChiffres: value, montantLettres: prev[question.id]?.montantLettres || "" },
                            }));
                          }}
                          placeholder="..."
                          disabled={hasAnswered}
                          className={`text-[3vw] md:text-sm flex-1 ${
                            chequeResults[question.id]?.montantChiffres === true ? "border-green-500" :
                            chequeResults[question.id]?.montantChiffres === false ? "border-red-500" : ""
                          }`}
                        />
                        <span className="text-[2.5vw] md:text-xs">€</span>
                      </div>

                      <div className="flex gap-[2vw] md:gap-2 items-center">
                        <span className="text-[2.5vw] md:text-xs text-gray-600 w-[20vw] md:w-24">En lettres :</span>
                        <Input
                          type="text"
                          value={chequeInputs[question.id]?.montantLettres || ""}
                          onChange={(e) => {
                            setChequeInputs((prev) => ({
                              ...prev,
                              [question.id]: { ...prev[question.id], montantLettres: e.target.value, montantChiffres: prev[question.id]?.montantChiffres || "" },
                            }));
                          }}
                          placeholder="..."
                          disabled={hasAnswered}
                          className={`text-[3vw] md:text-sm flex-1 ${
                            chequeResults[question.id]?.montantLettres === true ? "border-green-500" :
                            chequeResults[question.id]?.montantLettres === false ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {!hasAnswered && (
                      <Button
                        onClick={() => handleChequeSubmit(question.id)}
                        disabled={!chequeInputs[question.id]?.montantChiffres || !chequeInputs[question.id]?.montantLettres}
                        className="w-full"
                        size="sm"
                      >
                        Valider le chèque
                      </Button>
                    )}

                    {hasAnswered && chequeResults[question.id] && (
                      <div className="text-[2.5vw] md:text-xs space-y-1">
                        {chequeResults[question.id].montantChiffres === false && (
                          <p className="text-red-600">❌ Montant attendu : {question.chequeData.montant.toFixed(2)} €</p>
                        )}
                        {chequeResults[question.id].montantLettres === false && (
                          <p className="text-red-600">❌ En lettres : {question.chequeData.montantEnLettres}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
