/**
 * Calcule l'année scolaire en cours
 * L'année scolaire commence en septembre et se termine en août
 * Ex: En janvier 2025 → "2024-2025"
 *     En septembre 2025 → "2025-2026"
 */
export function getSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = janvier, 8 = septembre

  // Si on est entre septembre (8) et décembre (11), l'année scolaire a commencé cette année
  // Sinon, elle a commencé l'année précédente
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  return `${startYear}-${endYear}`;
}

