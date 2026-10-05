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

/** Display rate with unit, e.g. "Rp18,000 / Trip" — not "(Harga per Trip)". */
export function formatSalaryRate(rate: number, unit?: string | null): string {
  return `Rp${Number(rate).toLocaleString()} / ${salaryUnitLabel(unit)}`;
}

/** Same Rupiah formatting as existing salary line amounts. */
export function formatSalaryRupiah(amount: number): string {
  return `Rp${Number(amount).toLocaleString()}`;
}

export type SalaryDetailLike = {
  jam_trip: number;
  harga_per_jam: number;
  unit?: string | null;
};

export type SalaryDetailsTotals = {
  /** Quantity summed per unit that appears (Jam / Trip / Hari). */
  quantityByUnit: Partial<Record<SalaryQuantityUnit, number>>;
  /** Sum of line amounts (quantity × rate). */
  totalAmount: number;
};

/** Sum quantity per unit and total money across salary work rows. */
export function summarizeSalaryDetails(
  details: Array<SalaryDetailLike>
): SalaryDetailsTotals {
  const quantityByUnit: Partial<Record<SalaryQuantityUnit, number>> = {};
  let totalAmount = 0;

  for (const d of details) {
    const qty = Number(d.jam_trip) || 0;
    const rate = Number(d.harga_per_jam) || 0;
    const unit = normalizeSalaryUnit(d.unit);
    quantityByUnit[unit] = (quantityByUnit[unit] || 0) + qty;
    totalAmount += qty * rate;
  }

  return { quantityByUnit, totalAmount };
}

/**
 * Format quantity totals for units that appear, e.g. "150 Trip" or
 * "8 Jam, 120 Trip, 2 Hari". Units with zero quantity are omitted.
 */
export function formatSalaryQuantityTotals(
  quantityByUnit: Partial<Record<SalaryQuantityUnit, number>>
): string {
  return SALARY_QUANTITY_UNITS.filter((u) => (quantityByUnit[u] || 0) !== 0)
    .map((u) => formatSalaryQuantity(quantityByUnit[u]!, u))
    .join(', ');
}
