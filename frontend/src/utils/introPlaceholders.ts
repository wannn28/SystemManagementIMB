/**
 * Mengganti placeholder di paragraf pembuka invoice.
 * @alatberat → hanya alat berat dari daftar (bukan dump truck).
 * @dumptruck → hanya dump truck dari daftar.
 * @alatberatmanual → alat yang ditambah manual.
 * @lokasi → lokasi
 * Jika equipmentNameAlatBerat / equipmentNameDumptruck tidak dikirim, fallback ke equipmentName (full).
 */
export function replaceIntroPlaceholders(
  text: string,
  equipmentName: string,
  location: string,
  equipmentNameManual?: string,
  equipmentNameAlatBerat?: string,
  equipmentNameDumptruck?: string
): string {
  const eq = (equipmentName || '').trim();
  const manual = (equipmentNameManual || '').trim();
  let alatBerat = (equipmentNameAlatBerat ?? eq).trim();
  let dumptruck = (equipmentNameDumptruck ?? eq).trim();
  /** Jika keduanya fallback ke eq, pecah "X dan Dumptruck Y" agar tidak duplikasi di blockValue */
  if (alatBerat === dumptruck && eq && !equipmentNameAlatBerat && !equipmentNameDumptruck) {
    const idx = eq.search(/\s+dan\s+Dumptruck\s+/i);
    if (idx !== -1) {
      const rest = eq.slice(idx);
      const m = rest.match(/^\s+dan\s+Dumptruck\s+/i);
      if (m) {
        alatBerat = eq.slice(0, idx).trim();
        dumptruck = rest.slice(m[0].length).trim();
      } else {
        dumptruck = '';
      }
    } else {
      dumptruck = '';
    }
  }
  const loc = (location || '').trim();

  /** Jangan tambah manual jika sudah ada di alatBerat (mis. Tes2121 di list + manual → jangan "Tes2121 Tes2121") */
  const manualTrim = manual.trim();
  const manualAlreadyInAlatBerat = manualTrim && (alatBerat === manualTrim || alatBerat.endsWith(', ' + manualTrim) || alatBerat.endsWith(' dan ' + manualTrim));
  /** Satu blok: @alatberat [@alatberatmanual] dan Dumptruck @dumptruck → diganti sekali agar tidak duplikasi */
  const blockValue =
    alatBerat + (manualTrim && !manualAlreadyInAlatBerat ? ' ' + manual : '') + (dumptruck ? ' dan Dumptruck ' + dumptruck : '');
  let out = text.replace(
    /\@alatberat\s*(\@alatberatmanual\s*)?(dan\s+Dumptruck\s*)\@dumptruck/gi,
    () => blockValue
  );

  out = out
    .replace(/\@alatberat\s+dan\s+\@dumptruck/gi, eq)
    .replace(/\@dumptruck\s+dan\s+\@alatberat/gi, eq)
    .replace(/\@alatberat/g, alatBerat)
    .replace(/\@alatberatmanual/g, manual)
    .replace(/\@dumptruck/g, dumptruck)
    .replace(/\@lokasi/g, loc);
  return out;
}
