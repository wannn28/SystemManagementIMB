/**
 * Evaluator aman untuk rumus kolom invoice.
 * Variabel: quantity, days, price, bbm_quantity, bbm_unit_price, col_0, col_1, ... (referensi kolom lain).
 * Operator: + - * /
 */

export type FormulaRow = {
  quantity?: number;
  days?: number;
  price?: number;
  bbm_quantity?: number;
  bbm_unit_price?: number;
};

export const VAR_NAMES = ['quantity', 'days', 'price', 'bbm_quantity', 'bbm_unit_price'] as const;
export const VAR_LABELS: Record<string, string> = {
  quantity: 'Qty',
  days: 'Hari',
  price: 'Harga',
  bbm_quantity: 'BBM',
  bbm_unit_price: 'Harga/BBM',
};

/** Mengekstrak nama variabel yang dipakai di rumus (untuk menu relasi dinamis) */
export function extractVariablesFromFormula(formula: string | undefined): string[] {
  if (!formula || !formula.trim()) return [];
  const set = new Set<string>();
  const reVar = /\b(quantity|days|price|bbm_quantity|bbm_unit_price)\b/g;
  let m: RegExpExecArray | null;
  while ((m = reVar.exec(formula)) !== null) set.add(m[1]);
  const reCol = /\bcol_(\d+)\b/g;
  while ((m = reCol.exec(formula)) !== null) set.add(`col_${m[1]}`);
  return Array.from(set);
}

function getVarValue(row: FormulaRow, name: string, computed?: Record<number, number>): number {
  const colMatch = /^col_(\d+)$/.exec(name);
  if (colMatch && computed) {
    const idx = parseInt(colMatch[1], 10);
    const v = computed[idx];
    return v !== undefined && Number.isFinite(v) ? v : 0;
  }
  const v = (row as Record<string, unknown>)[name];
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Mengganti nama variabel di formula: row vars, col_0/col_1/..., lalu label kolom (computedByLabel). */
function substitute(
  formula: string,
  row: FormulaRow,
  computed?: Record<number, number>,
  computedByLabel?: Record<string, number>
): string {
  let s = formula.trim().replace(/\s+/g, '');
  for (const name of VAR_NAMES) {
    const val = getVarValue(row, name, computed);
    const re = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g');
    s = s.replace(re, String(val));
  }
  if (computed) {
    const reCol = /\bcol_(\d+)\b/g;
    s = s.replace(reCol, (_, idx) => {
      const i = parseInt(idx, 10);
      const v = computed[i];
      return v !== undefined && Number.isFinite(v) ? String(v) : '0';
    });
  }
  if (computedByLabel && Object.keys(computedByLabel).length > 0) {
    const labels = Object.keys(computedByLabel).filter((l) => l != null && String(l).trim() !== '');
    labels.sort((a, b) => b.length - a.length);
    for (const label of labels) {
      const val = computedByLabel[label];
      if (val === undefined || !Number.isFinite(val)) continue;
      const re = new RegExp(`\\b${escapeRegex(label)}\\b`, 'g');
      s = s.replace(re, String(val));
    }
  }
  return s;
}

/** Memastikan string hanya berisi angka, titik desimal, dan operator + - * / ( ) */
function isSafeExpression(s: string): boolean {
  return /^[\d.\s+\-*/()]+$/.test(s);
}

/**
 * Menghitung nilai rumus untuk satu baris.
 * computedColumns: nilai kolom rumus lain (indeks = indeks kolom di item_columns).
 * computedByLabel: nilai per label kolom (untuk rumus yang memakai nama kolom, mis. "Deskripsi2*Item").
 */
export function evaluateFormula(
  formula: string | undefined,
  row: FormulaRow,
  computedColumns?: Record<number, number>,
  computedByLabel?: Record<string, number>
): number {
  if (!formula || !formula.trim()) return 0;
  const s = substitute(formula, row, computedColumns, computedByLabel);
  if (!isSafeExpression(s)) return NaN;
  try {
    const fn = new Function(`"use strict"; return (${s})`);
    const result = fn();
    return Number.isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

/** Kolom minimal untuk perhitungan (key, formula, label untuk resolusi nama). */
export type FormulaColumn = { key?: string; formula?: string; label?: string };

/**
 * Menghitung nilai semua kolom rumus untuk satu baris, berurutan.
 * Mendukung rumus dengan col_0, col_1, ... atau nama kolom (label).
 */
/** Nilai untuk kolom "input" (Hari, Jam, Harga/Hari, Harga/Jam, BBM, dll.) yang belum punya rumus, dari row. */
function getInputColumnValue(row: FormulaRow, label: string): number {
  const lbl = label.trim().toLowerCase().replace(/\s+/g, '');
  if (lbl === 'bbm') return Number(row.bbm_quantity) || 0;
  if (/harga\s*\/\s*bbm/.test(label.trim().toLowerCase()) || lbl === 'harga/bbm') return Number(row.bbm_unit_price) || 0;
  if (lbl === 'hari' || lbl === 'days' || lbl === 'jam' || lbl === 'unit' || lbl === 'jerigen' || lbl === 'volume' || lbl === 'qty' || lbl === 'quantity') {
    return Number(row.days ?? row.quantity ?? 0) || 0;
  }
  if (lbl.includes('harga') || lbl.includes('price')) return Number(row.price ?? 0) || 0;
  return 0;
}

/** Normalisasi label untuk pencocokan (hapus spasi berlebih) agar "Harga / Bbm" cocok dengan "Harga/Bbm" di rumus. */
function normalizeLabelForFormula(lbl: string): string {
  return lbl.trim().replace(/\s+/g, '');
}

export function getComputedFormulaValues(
  row: FormulaRow,
  columns: FormulaColumn[]
): Record<number, number> {
  const computed: Record<number, number> = {};
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].key === 'number') {
      const fieldKey = `custom_num_${i}`;
      const v = (row as Record<string, unknown>)[fieldKey];
      computed[i] = v != null && Number.isFinite(Number(v)) ? Number(v) : 0;
    }
  }
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (col.key !== 'formula') continue;
    const byLabel: Record<string, number> = {};
    for (let j = 0; j < i; j++) {
      const lbl = (columns[j].label ?? '').trim();
      if (!lbl) continue;
      let val = 0;
      if (columns[j].key === 'number') {
        val = computed[j] !== undefined && Number.isFinite(computed[j]) ? computed[j] : 0;
      } else if (columns[j].key === 'formula') {
        val = computed[j] !== undefined ? computed[j] : getInputColumnValue(row, lbl);
      }
      const numVal = Number.isFinite(val) ? val : 0;
      byLabel[lbl] = numVal;
      const norm = normalizeLabelForFormula(lbl);
      if (norm !== lbl) byLabel[norm] = numVal;
    }
    byLabel['Bbm'] = Number(row.bbm_quantity) || 0;
    byLabel['Harga/Bbm'] = Number(row.bbm_unit_price) || 0;
    byLabel['Harga/BBM'] = Number(row.bbm_unit_price) || 0;
    if (!col.formula || !col.formula.trim()) {
      const lbl = (col.label ?? '').trim();
      computed[i] = getInputColumnValue(row, lbl);
      continue;
    }
    let val = evaluateFormula(col.formula, row, computed, byLabel);
    if (!Number.isFinite(val)) {
      const colLabel = (col.label ?? '').trim().toLowerCase();
      if (colLabel.includes('harga') && colLabel.includes('bbm') && !/harga\s*\/\s*bbm/.test(colLabel)) {
        val = evaluateFormula('Bbm*Harga/Bbm', row, computed, byLabel);
      }
    }
    computed[i] = Number.isFinite(val) ? val : 0;
  }
  return computed;
}

/**
 * Mengonversi rumus yang memakai col_0, col_1, ... menjadi tampilan dengan label kolom
 * (mis. col_3*col_4 → Deskripsi2*Item) agar user melihat nama kolom.
 */
export function formulaToDisplayFormula(
  formula: string | undefined,
  columns: FormulaColumn[]
): string {
  if (!formula || !formula.trim()) return '';
  return formula.replace(/\bcol_(\d+)\b/g, (_, idx) => {
    const i = parseInt(idx, 10);
    const lbl = columns[i]?.label ?? '';
    return (lbl && String(lbl).trim()) ? String(lbl).trim() : `col_${i}`;
  });
}

/** Daftar rumus bawaan (key -> formula) untuk dropdown template */
export const BUILTIN_FORMULAS: Record<string, string> = {
  'quantity*price': 'quantity*price',
  'days*price': 'days*price',
  'bbm_quantity*bbm_unit_price': 'bbm_quantity*bbm_unit_price',
  'quantity*price+bbm_quantity*bbm_unit_price': 'quantity*price+bbm_quantity*bbm_unit_price',
  'days*price+bbm_quantity*bbm_unit_price': 'days*price+bbm_quantity*bbm_unit_price',
};
