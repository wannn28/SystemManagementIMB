import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import { projectShareLinksAPI } from '../api/projectShareLinks';
import { Project, DailyReport } from '../types/BasicTypes';
import { SMART_NOTA_BASE_URL, getSmartNotaApiKey } from '../utils/apiKey';

/** Parse cuaca stored as "Hujan Ringan|08:00|10:00" or plain "Cerah". */
function parseCuaca(raw: string): { weather: string; rainStart: string; rainEnd: string } {
  const parts = (raw || '').split('|');
  return { weather: parts[0] || '', rainStart: parts[1] || '', rainEnd: parts[2] || '' };
}

function buildCuaca(weather: string, rainStart: string, rainEnd: string): string {
  if (weather.toLowerCase().includes('hujan') && (rainStart || rainEnd)) {
    return `${weather}|${rainStart}|${rainEnd}`;
  }
  return weather;
}

function resolveImageUrl(path: string): string {
  if (!path) return '';
  // Already an absolute URL — return as-is (new uploads from Smart Nota backend return full URLs).
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Legacy relative path (e.g. /uploads/cut-fill/xxx.png) — prepend Smart Nota base URL.
  const base = (SMART_NOTA_BASE_URL || '').replace(/\/(api\/?)?$/, '');
  return `${base}${path}`;
}

/** Smart Nota sync settings embedded in a share link.
 *  destination_address and baseUrl are read from project.reports._smartNota automatically.
 */
export interface LinkSyncSettings {
  syncToSmartNota?: boolean;
  smartNotaApiKey?: string;
}

interface Props {
  isCollapsed?: boolean;
  /** Mode link share: data dari parent, simpan via edit_token */
  embeddedProject?: Project;
  onEmbeddedProjectChange?: (p: Project) => void;
  shareToken?: string;
  editToken?: string;
  allowPublicEdit?: boolean;
  /** Smart Nota reverse-sync settings from the share link */
  linkSettings?: LinkSyncSettings;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function isoToDay(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getDate();
}

function isoToYYYYMM(dateStr: string): string {
  return dateStr ? dateStr.substring(0, 7) : '';
}

/** Volume produksi per bulan = Σ aktual harian (bukan Σ volume kumulatif laporan). */
function monthlyProductionVolume(mReports: DailyReport[]): number {
  return mReports.reduce((a, r) => a + (r.aktual || 0), 0);
}

function sumVolumeBefore(dailyAll: DailyReport[], year: number, month: number): number {
  // Sum daily aktual for all months before the selected month
  return dailyAll.reduce((acc, r) => {
    const ym = isoToYYYYMM(r.date);
    const [y, m] = ym.split('-').map(Number);
    if (y < year || (y === year && m < month)) acc += r.aktual || 0;
    return acc;
  }, 0);
}

function sumRitaseBefore(dailyAll: DailyReport[], year: number, month: number): number {
  return dailyAll.reduce((acc, r) => {
    const ym = isoToYYYYMM(r.date);
    const [y, m] = ym.split('-').map(Number);
    if (y < year || (y === year && m < month)) acc += r.ritase || 0;
    return acc;
  }, 0);
}

function sumEquipKeyBefore(dailyAll: DailyReport[], key: string, year: number, month: number): number {
  return dailyAll.reduce((acc, r) => {
    const ym = isoToYYYYMM(r.date);
    const [y, m] = ym.split('-').map(Number);
    if (y < year || (y === year && m < month)) acc += (r.equipment?.[key] || 0);
    return acc;
  }, 0);
}

const fmt = (v: number | undefined | null, dec = 3) =>
  v ? v.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec }) : '-';

const RekapitulasiCutFill: React.FC<Props> = ({
  isCollapsed = false,
  embeddedProject,
  onEmbeddedProjectChange,
  shareToken,
  editToken,
  allowPublicEdit = false,
  linkSettings,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const isEmbedded = embeddedProject != null;

  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!isEmbedded);
  const [isEditMode, setIsEditMode] = useState(false);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based

  const [headerKontraktor, setHeaderKontraktor] = useState('PT. INDIRA MAJU BERSAMA ( RUSLI )');
  const [headerProyek, setHeaderProyek] = useState('');
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [savingShared, setSavingShared] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ path: string; desc: string }[] | null>(null);
  const [, setOpenTimePicker] = useState<number | null>(null);

  // Cuaca edit modal
  const [cuacaModal, setCuacaModal] = useState<{ date: string; day: number } | null>(null);
  const [cuacaModalWeather, setCuacaModalWeather] = useState('');
  const [cuacaModalStart, setCuacaModalStart] = useState('');
  const [cuacaModalEnd, setCuacaModalEnd] = useState('');

  const openCuacaModal = (date: string, day: number, raw: string) => {
    const p = parseCuaca(raw);
    setCuacaModalWeather(p.weather);
    setCuacaModalStart(p.rainStart);
    setCuacaModalEnd(p.rainEnd);
    setCuacaModal({ date, day });
  };

  const saveCuacaModal = () => {
    if (!cuacaModal) return;
    updateCuacaCell(cuacaModal.date, buildCuaca(cuacaModalWeather, cuacaModalStart, cuacaModalEnd));
    setCuacaModal(null);
  };

  const project = isEmbedded ? embeddedProject! : localProject;
  const canEditReports = isEmbedded && !!shareToken && !!onEmbeddedProjectChange && (allowPublicEdit || !!editToken);
  const canEditData = isEmbedded ? canEditReports : true;
  const canEditMatrix = canEditData && isEditMode;

  const patchProject = useCallback(
    (updater: (p: Project) => Project) => {
      if (!project) return;
      const next = updater(project);
      if (isEmbedded && onEmbeddedProjectChange) onEmbeddedProjectChange(next);
      else setLocalProject(next);
    },
    [project, isEmbedded, onEmbeddedProjectChange]
  );

  const updateEquipmentCell = useCallback(
    (dateStr: string, equipKey: string, value: number) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        const row = daily[idx];
        const equipment = { ...(row.equipment || {}), [equipKey]: value };
        const totalEquipment = Object.values(equipment).reduce((s, n) => s + (Number(n) || 0), 0);
        daily[idx] = { ...row, equipment, totalEquipment };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const updateWorkerCell = useCallback(
    (dateStr: string, workerKey: string, value: number) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        const row = daily[idx];
        const workers = { ...(row.workers || {}), [workerKey]: value };
        const totalWorkers = Object.values(workers).reduce((s, n) => s + (Number(n) || 0), 0);
        daily[idx] = { ...row, workers, totalWorkers };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const updateRitaseCell = useCallback(
    (dateStr: string, value: number) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        daily[idx] = { ...daily[idx], ritase: value };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const updateAktualCell = useCallback(
    (dateStr: string, value: number) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        daily[idx] = { ...daily[idx], aktual: value };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const updateCuacaCell = useCallback(
    (dateStr: string, value: string) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        daily[idx] = { ...daily[idx], cuaca: value };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const updateCatatanCell = useCallback(
    (dateStr: string, value: string) => {
      patchProject((p) => {
        const daily = [...(p.reports?.daily || [])];
        const idx = daily.findIndex((r) => r.date === dateStr);
        if (idx < 0) return p;
        daily[idx] = { ...daily[idx], catatan: value };
        return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
      });
    },
    [patchProject]
  );

  const addEquipmentTypeToMonth = useCallback(() => {
    const key = newEquipName.trim();
    if (!key || !project) return;
    const ymPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    patchProject((p) => {
      const daily = (p.reports?.daily || []).map((r) => {
        if (!r.date || !r.date.startsWith(ymPrefix)) return r;
        const equipment = { ...(r.equipment || {}) };
        if (equipment[key] === undefined) equipment[key] = 0;
        const totalEquipment = Object.values(equipment).reduce((s, n) => s + (Number(n) || 0), 0);
        return { ...r, equipment, totalEquipment };
      });
      return { ...p, reports: { ...p.reports, daily, weekly: p.reports?.weekly || [], monthly: p.reports?.monthly || [] } };
    });
    setNewEquipName('');
  }, [newEquipName, project, selectedYear, selectedMonth, patchProject]);

  /** Push all non-empty daily reports back to Smart Nota via API key.
   *  apiKey can be passed explicitly; falls back to linkSettings then localStorage.
   *  destination prefers project.reports._smartNota.destination, then project name.
   */
  const syncDailyToSmartNota = async (p: Project, apiKey?: string) => {
    const key = apiKey || linkSettings?.smartNotaApiKey || getSmartNotaApiKey() || '';
    if (!key) return;

    // Destination and base URL come from the project metadata set when the
    // admin first synced from Smart Nota — no manual input required.
    const destination = p.reports?._smartNota?.destination || p.name || '';
    if (!destination) return;
    const base = (p.reports?._smartNota?.baseUrl || SMART_NOTA_BASE_URL || '').replace(/\/$/, '');
    if (!base) return;

    const smartNotaApiKey = key;

    const entries = (p.reports?.daily || [])
      .filter((r) => r.date && (r.ritase > 0 || r.aktual > 0 || r.catatan || r.cuaca))
      .map((r) => {
        const { weather, rainStart, rainEnd } = parseCuaca(r.cuaca || '');
        const workers = Object.entries(r.workers || {}).map(([type, count], i) => ({
          id: String(i + 1), type, count: Number(count),
        }));
        const equipment = Object.entries(r.equipment || {}).map(([name, qty], i) => ({
          id: String(i + 1), kind: '', name, quantity: Number(qty), cost: 0,
        }));
        return {
          destination_address: destination,
          project_name: p.name,
          date: r.date,
          ritase: r.ritase || 0,
          volume_fill: r.aktual || 0,
          weather: weather || 'Cerah',
          disruption_hours: 0,
          notes: r.catatan || '',
          rain_start_time: rainStart || '',
          rain_end_time: rainEnd || '',
          workers,
          equipment,
          photo_urls: [] as string[],
        };
      });

    if (entries.length === 0) return;

    const response = await fetch(`${base}/api/api-key/reports/cut-fill-field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': smartNotaApiKey },
      body: JSON.stringify({ entries }),
    });
    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Smart Nota sync failed (${response.status})${txt ? `: ${txt}` : ''}`);
    }
  };

  const handleSaveSharedReports = async (withSync = false) => {
    if (!canEditReports || !shareToken || !project) return;
    setSavingShared(true);
    try {
      const updated = await projectShareLinksAPI.updateSharedReports(shareToken, editToken || undefined, project.reports);
      onEmbeddedProjectChange!(updated);

      if (withSync) {
        const apiKey = linkSettings?.smartNotaApiKey || getSmartNotaApiKey() || '';
        if (apiKey) {
          try {
            await syncDailyToSmartNota(updated, apiKey);
            alert('Laporan tersimpan dan tersinkron ke Smart Nota.');
          } catch (syncErr) {
            console.error('Sync to Smart Nota failed:', syncErr);
            alert('Laporan tersimpan ke IMB, tetapi gagal sinkron ke Smart Nota. Cek koneksi/API key.');
          }
        } else {
          alert('Laporan tersimpan. (Smart Nota tidak tersinkron — API key belum ditemukan.)');
        }
      } else {
        alert('Laporan tersimpan ke proyek (link share).');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan laporan.');
    } finally {
      setSavingShared(false);
    }
  };

  const handleSaveLocalReports = async (withSync = false) => {
    if (isEmbedded || !project) return;
    setSavingLocal(true);
    try {
      await projectsAPI.updateProject(project.id, project);

      if (withSync) {
        const apiKey = getSmartNotaApiKey() || '';
        if (apiKey) {
          try {
            await syncDailyToSmartNota(project, apiKey);
            alert('Laporan tersimpan dan tersinkron ke Smart Nota.');
          } catch (syncErr) {
            console.error('Sync to Smart Nota failed:', syncErr);
            alert('Laporan tersimpan ke IMB, tetapi gagal sinkron ke Smart Nota. Cek koneksi/API key.');
          }
        } else {
          alert('Laporan tersimpan. (Smart Nota tidak tersinkron — API key belum ditemukan.)');
        }
      } else {
        alert('Laporan tersimpan.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan laporan.');
    } finally {
      setSavingLocal(false);
    }
  };

  useEffect(() => {
    if (!isEmbedded || !embeddedProject) return;
    setHeaderProyek(embeddedProject.name || '');
    setLoading(false);
  }, [isEmbedded, embeddedProject]);

  useEffect(() => {
    if (isEmbedded || !id) return;
    setLoading(true);
    projectsAPI
      .getProjectById(Number(id))
      .then((p: Project) => {
        setLocalProject(p);
        setHeaderProyek(p.name || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEmbedded]);

  if (!isEmbedded && loading) return <div className="flex items-center justify-center h-64 text-gray-500">Memuat data...</div>;
  if (!project) return <div className="flex items-center justify-center h-64 text-red-500">Proyek tidak ditemukan.</div>;

  const dailyAll: DailyReport[] = project.reports?.daily || [];
  /** Target volume kontrak / total proyek — penyebut kolom %. */
  const targetVolumeTotal = project.totalVolume || 0;

  // Filter to selected month
  const yearStr = String(selectedYear);
  const monthStr = String(selectedMonth).padStart(2, '0');
  const ymPrefix = `${yearStr}-${monthStr}`;

  const dailyMonth = dailyAll
    .filter((r) => isoToYYYYMM(r.date) === ymPrefix)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalDays = daysInMonth(selectedYear, selectedMonth);

  // Map day → report
  const dayMap = new Map<number, DailyReport>();
  dailyMonth.forEach((r) => {
    const d = isoToDay(r.date);
    if (d >= 1 && d <= totalDays) dayMap.set(d, r);
  });

  // Collect unique equipment keys across all month reports
  const equipKeys: string[] = [];
  dailyMonth.forEach((r) => {
    Object.keys(r.equipment || {}).forEach((k) => {
      if (!equipKeys.includes(k)) equipKeys.push(k);
    });
  });

  // Monthly sums
  const monthlyRitase = dailyMonth.reduce((a, r) => a + (r.ritase || 0), 0);
  const monthlyVolume = dailyMonth.reduce((a, r) => a + (r.aktual || 0), 0);

  const prevRitase = sumRitaseBefore(dailyAll, selectedYear, selectedMonth);
  const prevVolume = sumVolumeBefore(dailyAll, selectedYear, selectedMonth);

  // Build year list
  const years: number[] = [];
  const startYear = project.startDate ? new Date(project.startDate).getFullYear() : now.getFullYear() - 1;
  for (let y = startYear; y <= now.getFullYear() + 1; y++) years.push(y);

  // Unique worker keys
  const workerKeys: string[] = [];
  dailyMonth.forEach((r) => {
    Object.keys(r.workers || {}).forEach((k) => {
      if (!workerKeys.includes(k)) workerKeys.push(k);
    });
  });

  // Monthly summaries per equip key
  const monthlyEquip: Record<string, number> = {};
  equipKeys.forEach((k) => {
    monthlyEquip[k] = dailyMonth.reduce((a, r) => a + (r.equipment?.[k] || 0), 0);
  });

  const handlePrint = () => window.print();

  // Build monthly summary table rows (all months up to selected)
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  const shellMargin = isEmbedded ? '' : isCollapsed ? 'ml-16' : 'ml-64';

  return (
    <div
      className={`${isEmbedded ? 'min-h-0' : 'min-h-screen'} bg-gray-100 transition-all duration-300 ${shellMargin}`}
      onClick={() => setOpenTimePicker(null)}
    >
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/projects/${id}`)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                ← Kembali ke Proyek
              </button>
              <span className="text-gray-300">|</span>
            </>
          )}
          <h1 className="text-lg font-bold text-gray-800">Rekapitulasi Pekerjaan</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEditData && (
            <>
              {isEditMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newEquipName}
                    onChange={(e) => setNewEquipName(e.target.value)}
                    placeholder="Jenis alat baru (bulan ini)"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-44"
                  />
                  <button
                    type="button"
                    onClick={addEquipmentTypeToMonth}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
                  >
                    + Alat
                  </button>
                </div>
              )}
              {isEditMode && (
                <div className="flex gap-2">
                  {/* Save IMB only */}
                  <button
                    type="button"
                    disabled={isEmbedded ? savingShared : savingLocal}
                    onClick={() => isEmbedded ? handleSaveSharedReports(false) : handleSaveLocalReports(false)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {(isEmbedded ? savingShared : savingLocal) ? 'Menyimpan…' : '💾 Simpan'}
                  </button>
                  {/* Save IMB + sync to Smart Nota */}
                  <button
                    type="button"
                    disabled={isEmbedded ? savingShared : savingLocal}
                    onClick={() => isEmbedded ? handleSaveSharedReports(true) : handleSaveLocalReports(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
                    title="Simpan ke IMB dan sinkron ke Smart Nota"
                  >
                    {(isEmbedded ? savingShared : savingLocal) ? 'Menyimpan…' : '💾 Simpan & Sinkron'}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-lg text-white font-semibold text-sm transition-colors ${
                  isEditMode
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {isEditMode ? '✓ Selesai Edit' : '✏️ Edit'}
              </button>
            </>
          )}
          {/* Period selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowHeaderEdit(!showHeaderEdit)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 border border-gray-300"
          >
            ✏️ Edit Header
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
          >
            🖨️ Cetak / Print
          </button>
        </div>
      </div>

      {/* Header edit panel */}
      {showHeaderEdit && (
        <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4 flex gap-6 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Proyek</label>
            <input
              value={headerProyek}
              onChange={(e) => setHeaderProyek(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Kontraktor</label>
            <input
              value={headerKontraktor}
              onChange={(e) => setHeaderKontraktor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => setShowHeaderEdit(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      )}

      {/* Printable content */}
      <div ref={printRef} className="p-4 print:p-0 print:m-0">
        <div className="bg-white shadow-sm print:shadow-none">
          {/* Document header */}
          <div className="px-6 pt-6 pb-2 print:px-4 print:pt-4">
            <h2 className="text-center text-base font-bold uppercase tracking-wide mb-3">
              REKAPITULASI PEKERJAAN CUT &amp; FILL
            </h2>
            <table className="text-xs mb-4" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td className="pr-4 font-semibold w-28">PROYEK</td>
                  <td className="pr-2">:</td>
                  <td className="font-semibold uppercase">{headerProyek}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-semibold">KONTRAKTOR</td>
                  <td className="pr-2">:</td>
                  <td>{headerKontraktor}</td>
                </tr>
                <tr>
                  <td className="pr-4 font-semibold">PERIODE</td>
                  <td className="pr-2">:</td>
                  <td className="uppercase font-semibold">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Main recap table */}
          <div className="overflow-x-auto px-2 print:px-0">
            <table
              className="w-full text-[10px] border-collapse"
              style={{ fontSize: '9px', tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: '22px' }} />   {/* No */}
                <col style={{ width: '110px' }} />  {/* Keterangan */}
                {Array.from({ length: totalDays }, (_, i) => (
                  <col key={i} style={{ width: '22px' }} />
                ))}
                <col style={{ width: '38px' }} />  {/* Bulan ini */}
                <col style={{ width: '38px' }} />  {/* s/d Bln lalu */}
                <col style={{ width: '38px' }} />  {/* s/d Bln ini */}
              </colgroup>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-0.5 text-center" rowSpan={2}>No.</th>
                  <th className="border border-gray-400 p-0.5 text-center" rowSpan={2}>KETERANGAN</th>
                  <th className="border border-gray-400 p-0.5 text-center" colSpan={totalDays}>TANGGAL</th>
                  <th className="border border-gray-400 p-0.5 text-center" colSpan={3}>JUMLAH</th>
                </tr>
                <tr className="bg-gray-100">
                  {Array.from({ length: totalDays }, (_, i) => (
                    <th key={i} className="border border-gray-400 p-0.5 text-center leading-tight">{i + 1}</th>
                  ))}
                  <th className="border border-gray-400 p-0.5 text-center leading-tight">Bulan ini</th>
                  <th className="border border-gray-400 p-0.5 text-center leading-tight">s/d Bln lalu</th>
                  <th className="border border-gray-400 p-0.5 text-center leading-tight">s/d Bln ini</th>
                </tr>
              </thead>
              <tbody>
                {/* Section A - VOLUME */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-400 p-0.5 text-center">A</td>
                  <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>VOLUME</td>
                </tr>
                {/* A1: Ritase */}
                <tr>
                  <td className="border border-gray-400 p-0.5 text-center">1.</td>
                  <td className="border border-gray-400 p-0.5 pl-2">RITASE</td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const r = dayMap.get(day);
                    const v = r?.ritase;
                    if (canEditMatrix && r) {
                      return (
                        <td key={day} className="border border-gray-400 p-0">
                          <input
                            type="number"
                            className="w-full min-w-0 text-center text-[9px] py-0.5 px-0 border-0 bg-green-50"
                            value={v ?? ''}
                            onChange={(e) =>
                              updateRitaseCell(r.date, parseInt(String(e.target.value), 10) || 0)
                            }
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="border border-gray-400 p-0.5 text-center">
                        {v ? fmt(v, 0) : '-'}
                      </td>
                    );
                  })}
                  <td className="border border-gray-400 p-0.5 text-center font-semibold">
                    {monthlyRitase ? fmt(monthlyRitase, 0) : '-'}
                  </td>
                  <td className="border border-gray-400 p-0.5 text-center">
                    {prevRitase ? fmt(prevRitase, 0) : '-'}
                  </td>
                  <td className="border border-gray-400 p-0.5 text-center font-semibold">
                    {(monthlyRitase + prevRitase) ? fmt(monthlyRitase + prevRitase, 0) : '-'}
                  </td>
                </tr>
                {/* A2: Volume Fill */}
                <tr>
                  <td className="border border-gray-400 p-0.5 text-center">2.</td>
                  <td className="border border-gray-400 p-0.5 pl-2">VOLUME FILL (M3)</td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const r = dayMap.get(day);
                    const v = r?.aktual;
                    if (canEditMatrix && r) {
                      return (
                        <td key={day} className="border border-gray-400 p-0">
                          <input
                            type="number"
                            step="0.001"
                            className="w-full min-w-0 text-center text-[9px] py-0.5 px-0 border-0 bg-teal-50"
                            value={v ?? ''}
                            onChange={(e) =>
                              updateAktualCell(r.date, parseFloat(String(e.target.value).replace(',', '.')) || 0)
                            }
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="border border-gray-400 p-0.5 text-center">
                        {v ? fmt(v) : '-'}
                      </td>
                    );
                  })}
                  <td className="border border-gray-400 p-0.5 text-center font-semibold">
                    {fmt(monthlyVolume)}
                  </td>
                  <td className="border border-gray-400 p-0.5 text-center">
                    {prevVolume ? fmt(prevVolume) : '-'}
                  </td>
                  <td className="border border-gray-400 p-0.5 text-center font-semibold">
                    {fmt(monthlyVolume + prevVolume)}
                  </td>
                </tr>

                {/* Section B - SEWA ALAT BERAT (worker-based: show worker types that have "jam" or show all workers as hours) */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-400 p-0.5 text-center">B</td>
                  <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>JUMLAH PEKERJA</td>
                </tr>
                {workerKeys.length === 0 ? (
                  <tr>
                    <td className="border border-gray-400 p-0.5 text-center text-gray-400" colSpan={totalDays + 4}>-</td>
                  </tr>
                ) : (
                  workerKeys.map((wk, wi) => {
                    const monthlyW = dailyMonth.reduce((a, r) => a + (r.workers?.[wk] || 0), 0);
                    const prevW = dailyAll.reduce((acc, r) => {
                      const ym = isoToYYYYMM(r.date);
                      const [y, m] = ym.split('-').map(Number);
                      if (y < selectedYear || (y === selectedYear && m < selectedMonth)) acc += (r.workers?.[wk] || 0);
                      return acc;
                    }, 0);
                    return (
                      <tr key={wk}>
                        <td className="border border-gray-400 p-0.5 text-center">{wi + 1}.</td>
                        <td className="border border-gray-400 p-0.5 pl-2">{wk.toUpperCase()}</td>
                        {Array.from({ length: totalDays }, (_, i) => {
                          const day = i + 1;
                          const r = dayMap.get(day);
                          const v = r?.workers?.[wk];
                          if (canEditMatrix && r) {
                            return (
                              <td key={day} className="border border-gray-400 p-0">
                                <input
                                  type="number"
                                  className="w-full min-w-0 text-center text-[9px] py-0.5 px-0 border-0 bg-blue-50"
                                  value={v ?? ''}
                                  onChange={(e) =>
                                    updateWorkerCell(r.date, wk, parseFloat(String(e.target.value).replace(',', '.')) || 0)
                                  }
                                />
                              </td>
                            );
                          }
                          return (
                            <td key={day} className="border border-gray-400 p-0.5 text-center">
                              {v ? fmt(v, 0) : '-'}
                            </td>
                          );
                        })}
                        <td className="border border-gray-400 p-0.5 text-center font-semibold">{monthlyW || '-'}</td>
                        <td className="border border-gray-400 p-0.5 text-center">{prevW || '-'}</td>
                        <td className="border border-gray-400 p-0.5 text-center font-semibold">{(monthlyW + prevW) || '-'}</td>
                      </tr>
                    );
                  })
                )}

                {/* Section C - JUMLAH ALAT */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-400 p-0.5 text-center">C</td>
                  <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>JUMLAH ALAT</td>
                </tr>
                {equipKeys.length === 0 ? (
                  <tr>
                    <td className="border border-gray-400 p-0.5 text-center text-gray-400" colSpan={totalDays + 4}>-</td>
                  </tr>
                ) : (
                  equipKeys.map((ek, ei) => {
                    const monthlyE = monthlyEquip[ek] || 0;
                    const prevE = sumEquipKeyBefore(dailyAll, ek, selectedYear, selectedMonth);
                    return (
                      <tr key={ek}>
                        <td className="border border-gray-400 p-0.5 text-center">{ei + 1}.</td>
                        <td className="border border-gray-400 p-0.5 pl-2">{ek.toUpperCase()}</td>
                        {Array.from({ length: totalDays }, (_, i) => {
                          const day = i + 1;
                          const r = dayMap.get(day);
                          const v = r?.equipment?.[ek];
                          if (canEditMatrix && r) {
                            return (
                              <td key={day} className="border border-gray-400 p-0">
                                <input
                                  type="number"
                                  className="w-full min-w-0 text-center text-[9px] py-0.5 px-0 border-0 bg-amber-50"
                                  value={v ?? ''}
                                  onChange={(e) =>
                                    updateEquipmentCell(r.date, ek, parseFloat(String(e.target.value).replace(',', '.')) || 0)
                                  }
                                />
                              </td>
                            );
                          }
                          return (
                            <td key={day} className="border border-gray-400 p-0.5 text-center">
                              {v ? fmt(v, 0) : '-'}
                            </td>
                          );
                        })}
                        <td className="border border-gray-400 p-0.5 text-center font-semibold">{monthlyE || '-'}</td>
                        <td className="border border-gray-400 p-0.5 text-center">{prevE || '-'}</td>
                        <td className="border border-gray-400 p-0.5 text-center font-semibold">{(monthlyE + prevE) || '-'}</td>
                      </tr>
                    );
                  })
                )}

                {/* Section D - CUACA */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-400 p-0.5 text-center">D</td>
                  <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>CUACA</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-0.5"></td>
                  <td className="border border-gray-400 p-0.5"></td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const r = dayMap.get(day);
                    const parsed = parseCuaca(r?.cuaca || '');
                    const isRain = parsed.weather.toLowerCase().includes('hujan');
                    if (canEditMatrix && r) {
                      return (
                        <td
                          key={day}
                          title="Klik untuk edit cuaca"
                          className="border border-gray-400 p-0.5 text-center leading-tight cursor-pointer hover:bg-sky-100 transition-colors"
                          style={{ verticalAlign: 'middle', fontSize: '8px', background: isRain ? '#eff6ff' : undefined }}
                          onClick={() => openCuacaModal(r.date, day, r.cuaca || '')}
                        >
                          <div>{parsed.weather || '-'}</div>
                          {isRain && (parsed.rainStart || parsed.rainEnd) && (
                            <div style={{ fontSize: '7px', color: '#1e40af', lineHeight: 1.2 }}>
                              {[parsed.rainStart, parsed.rainEnd].filter(Boolean).join('-')}
                            </div>
                          )}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={day}
                        className="border border-gray-400 p-0.5 text-center leading-tight"
                        style={{ verticalAlign: 'top', fontSize: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        <div>{parsed.weather || ''}</div>
                        {isRain && (parsed.rainStart || parsed.rainEnd) && (
                          <div style={{ fontSize: '7px', color: '#1e40af', lineHeight: 1.2 }}>
                            {[parsed.rainStart, parsed.rainEnd].filter(Boolean).join('-')}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-400 p-0.5" colSpan={3}></td>
                </tr>

                {/* Section E - CATATAN */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border border-gray-400 p-0.5 text-center">E</td>
                  <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>CATATAN</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-0.5"></td>
                  <td className="border border-gray-400 p-0.5"></td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const r = dayMap.get(day);
                    if (canEditMatrix && r) {
                      return (
                        <td key={day} className="border border-gray-400 p-0" style={{ verticalAlign: 'top' }}>
                          <input
                            type="text"
                            className="w-full min-w-0 text-center text-[8px] py-0.5 px-0 border-0 bg-orange-50 leading-tight"
                            value={r.catatan || ''}
                            onChange={(e) => updateCatatanCell(r.date, e.target.value)}
                          />
                        </td>
                      );
                    }
                    return (
                      <td
                        key={day}
                        className="border border-gray-400 p-0.5 text-center leading-tight"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', verticalAlign: 'top', fontSize: '8px' }}
                      >
                        {r?.catatan || ''}
                      </td>
                    );
                  })}
                  <td className="border border-gray-400 p-0.5" colSpan={3}></td>
                </tr>
                {/* Section F - LAMPIRAN (photos) */}
                {(() => {
                  const hasAnyImages = dailyMonth.some(r => (r.images?.length ?? 0) > 0);
                  if (!hasAnyImages) return null;
                  return (
                    <>
                      <tr className="bg-yellow-50 font-bold print:hidden">
                        <td className="border border-gray-400 p-0.5 text-center">F</td>
                        <td className="border border-gray-400 p-0.5 font-bold" colSpan={totalDays + 4}>LAMPIRAN</td>
                      </tr>
                      <tr className="print:hidden">
                        <td className="border border-gray-400 p-0.5"></td>
                        <td className="border border-gray-400 p-0.5"></td>
                        {Array.from({ length: totalDays }, (_, i) => {
                          const day = i + 1;
                          const r = dayMap.get(day);
                          const imgs = r?.images ?? [];
                          if (imgs.length === 0) {
                            return <td key={day} className="border border-gray-400 p-0.5 text-center text-gray-300" style={{ fontSize: '8px' }}>-</td>;
                          }
                          return (
                            <td key={day} className="border border-gray-400 p-0 text-center" style={{ verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                className="w-full h-full flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                style={{ fontSize: '8px', padding: '2px 0', minHeight: '18px' }}
                                title={`${imgs.length} foto — klik untuk lihat`}
                                onClick={() => setLightboxImages(imgs.map(img => ({ path: img.imagePath, desc: img.description || '' })))}
                              >
                                <span className="text-indigo-600 font-bold">📷{imgs.length}</span>
                              </button>
                            </td>
                          );
                        })}
                        <td className="border border-gray-400 p-0.5" colSpan={3}></td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Monthly summary table */}
          <div className="px-4 pt-6 pb-4 print:px-2">
            <table className="text-xs border-collapse" style={{ fontSize: '9px', minWidth: '360px' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1 text-center">No.</th>
                  <th className="border border-gray-400 px-2 py-1 text-center">BULAN</th>
                  <th className="border border-gray-400 px-2 py-1 text-center" colSpan={4}>JUMLAH</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1"></th>
                  <th className="border border-gray-400 px-2 py-1"></th>
                  <th className="border border-gray-400 px-2 py-1 text-center">HARI</th>
                  <th className="border border-gray-400 px-2 py-1 text-center">RITASE</th>
                  <th className="border border-gray-400 px-2 py-1 text-center">VOLUME</th>
                  <th
                    className="border border-gray-400 px-2 py-1 text-center"
                    title="% capaian terhadap target volume total proyek (Total Volume / Target)"
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {allMonths.map((mo) => {
                  const ymP = `${selectedYear}-${String(mo).padStart(2, '0')}`;
                  const mReports = dailyAll.filter((r) => isoToYYYYMM(r.date) === ymP);
                  const mDays = [...new Set(mReports.map((r) => r.date))].length;
                  const mRitase = mReports.reduce((a, r) => a + (r.ritase || 0), 0);
                  const mVol = monthlyProductionVolume(mReports);
                  const pct = targetVolumeTotal > 0 ? (mVol / targetVolumeTotal) * 100 : 0;
                  const isEmpty = mReports.length === 0;
                  const isSelected = mo === selectedMonth;
                  return (
                    <tr key={mo} className={isSelected ? 'bg-blue-50 font-semibold' : ''}>
                      <td className="border border-gray-400 px-2 py-0.5 text-center">{mo}</td>
                      <td className="border border-gray-400 px-2 py-0.5">{MONTH_NAMES[mo - 1].toUpperCase()} {selectedYear}</td>
                      <td className="border border-gray-400 px-2 py-0.5 text-center">{isEmpty ? '' : mDays}</td>
                      <td className="border border-gray-400 px-2 py-0.5 text-center">{isEmpty ? '' : mRitase || '-'}</td>
                      <td className="border border-gray-400 px-2 py-0.5 text-center">{isEmpty ? '' : fmt(mVol)}</td>
                      <td className="border border-gray-400 px-2 py-0.5 text-center">
                        {isEmpty
                          ? ''
                          : targetVolumeTotal > 0
                            ? `${pct.toFixed(2)}%`
                            : '—'}
                      </td>
                    </tr>
                  );
                })}
                {/* Total */}
                {(() => {
                  const yearReports = dailyAll.filter((r) => r.date?.startsWith(String(selectedYear)));
                  const totalDaysCount = [...new Set(yearReports.map((r) => r.date))].length;
                  const totalRitase = yearReports.reduce((a, r) => a + (r.ritase || 0), 0);
                  const totalProdVol = yearReports.reduce((a, r) => a + (r.aktual || 0), 0);
                  const pctTotal =
                    targetVolumeTotal > 0 ? (totalProdVol / targetVolumeTotal) * 100 : 0;
                  return (
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-400 px-2 py-1 text-center" colSpan={2}>T O T A L</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{totalDaysCount}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{totalRitase || '-'}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{fmt(totalProdVol)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">
                        {targetVolumeTotal > 0 ? `${pctTotal.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })()}
                {/* Rata-rata */}
                {(() => {
                  const yearReports = dailyAll.filter((r) => r.date?.startsWith(String(selectedYear)));
                  const monthsWithData = new Set(yearReports.map((r) => isoToYYYYMM(r.date))).size || 1;
                  const totalDaysCount = [...new Set(yearReports.map((r) => r.date))].length;
                  const totalRitase = yearReports.reduce((a, r) => a + (r.ritase || 0), 0);
                  const totalProdVol = yearReports.reduce((a, r) => a + (r.aktual || 0), 0);
                  let sumMonthlyPct = 0;
                  for (let mo = 1; mo <= 12; mo++) {
                    const ymP = `${selectedYear}-${String(mo).padStart(2, '0')}`;
                    const mReports = dailyAll.filter((r) => isoToYYYYMM(r.date) === ymP);
                    if (mReports.length === 0) continue;
                    const mVol = monthlyProductionVolume(mReports);
                    if (targetVolumeTotal > 0) sumMonthlyPct += (mVol / targetVolumeTotal) * 100;
                  }
                  const avgPct = monthsWithData > 0 ? sumMonthlyPct / monthsWithData : 0;
                  return (
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-400 px-2 py-1 text-center" colSpan={2}>RATA-2</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{Math.round(totalDaysCount / monthsWithData)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{totalRitase ? Math.round(totalRitase / monthsWithData) : '-'}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">{fmt(totalProdVol / monthsWithData)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-center">
                        {targetVolumeTotal > 0 ? `${avgPct.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cuaca edit modal */}
      {cuacaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden"
          onClick={() => setCuacaModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">🌤 Edit Cuaca</h3>
              <span className="text-xs text-gray-400 font-medium">
                {cuacaModal.date}
              </span>
            </div>

            {/* Weather select */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Kondisi Cuaca</label>
              <div className="grid grid-cols-2 gap-2">
                {['Cerah', 'Mendung', 'Hujan Ringan', 'Hujan Lebat'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setCuacaModalWeather(w)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      cuacaModalWeather === w
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {w === 'Cerah' && '☀️ '}
                    {w === 'Mendung' && '☁️ '}
                    {w === 'Hujan Ringan' && '🌦 '}
                    {w === 'Hujan Lebat' && '⛈ '}
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Rain times — only when hujan */}
            {cuacaModalWeather.toLowerCase().includes('hujan') && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-xs font-semibold text-blue-700 mb-2">⏱ Jam Hujan</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Mulai</label>
                    <input
                      type="time"
                      className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400"
                      value={cuacaModalStart}
                      onChange={(e) => setCuacaModalStart(e.target.value)}
                    />
                  </div>
                  <span className="text-gray-400 mt-4">–</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Selesai</label>
                    <input
                      type="time"
                      className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400"
                      value={cuacaModalEnd}
                      onChange={(e) => setCuacaModalEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCuacaModal(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveCuacaModal}
                className="px-4 py-2 rounded-lg text-sm text-white bg-sky-600 hover:bg-sky-700 font-semibold"
              >
                ✓ Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox modal for photos */}
      {lightboxImages && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4 print:hidden"
          onClick={() => setLightboxImages(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">📷 Lampiran Foto ({lightboxImages.length})</h3>
              <button
                type="button"
                onClick={() => setLightboxImages(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {lightboxImages.map((img, idx) => {
                const fullUrl = resolveImageUrl(img.path);
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={fullUrl}
                        alt={img.desc || `Foto ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                        onError={(ev) => {
                          const el = ev.target as HTMLImageElement;
                          el.style.display = 'none';
                          const parent = el.parentElement?.parentElement;
                          if (parent && !parent.querySelector('.img-error-msg')) {
                            const msg = document.createElement('div');
                            msg.className = 'img-error-msg flex flex-col items-center justify-center gap-1 h-48 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2';
                            msg.innerHTML = `<span class="text-gray-400 text-xs text-center">Gambar tidak tersedia</span><a href="${fullUrl}" target="_blank" class="text-blue-500 text-xs underline break-all text-center">${fullUrl}</a>`;
                            parent.prepend(msg);
                          }
                        }}
                      />
                    </a>
                    {img.desc && <p className="text-xs text-gray-500 text-center truncate">{img.desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          @page { size: A3 landscape; margin: 8mm; }
        }
      `}</style>
    </div>
  );
};

export default RekapitulasiCutFill;
