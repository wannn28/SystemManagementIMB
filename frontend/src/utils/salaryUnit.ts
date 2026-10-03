export type SalaryQuantityUnit = 'Jam' | 'Trip' | 'Hari';

export const SALARY_QUANTITY_UNITS: SalaryQuantityUnit[] = ['Jam', 'Trip', 'Hari'];

/** Existing hour rows without a unit keep working as Jam. */
export function normalizeSalaryUnit(unit?: string | null): SalaryQuantityUnit {
  if (!unit) return 'Jam';
  const trimmed = unit.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'trip') return 'Trip';
  if (lower === 'hari' || lower === 'day') return 'Hari';
  if (lower === 'jam' || lower === 'hour' || lower === 'hours') return 'Jam';
  if (trimmed === 'Trip' || trimmed === 'Hari' || trimmed === 'Jam') return trimmed;
  return 'Jam';
}

export function salaryUnitLabel(unit?: string | null): string {
  return normalizeSalaryUnit(unit);
}

export function salaryRateLabel(unit?: string | null): string {
  switch (normalizeSalaryUnit(unit)) {
    case 'Trip':
      return 'Harga per Trip';
    case 'Hari':
      return 'Harga per Hari';
    case 'Jam':
    default:
      return 'Harga per Jam';
  }
}

/** Display quantity with unit, e.g. "17 Jam", "3 Trip", "1 Hari". */
export function formatSalaryQuantity(quantity: number, unit?: string | null): string {
  const q = Number(quantity);
  const formatted = Number.isInteger(q) ? String(q) : String(q);
  return `${formatted} ${salaryUnitLabel(unit)}`;
}
