import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import { projectShareLinksAPI } from '../api/projectShareLinks';
import { Project, DailyReport } from '../types/BasicTypes';

interface Props {
  isCollapsed?: boolean;
  /** Mode link share: data dari parent, simpan via edit_token */
  embeddedProject?: Project;
  onEmbeddedProjectChange?: (p: Project) => void;
  shareToken?: string;
  editToken?: string;
  allowPublicEdit?: boolean;
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
  // Sum volume for all months before the selected month
  return dailyAll.reduce((acc, r) => {
    const ym = isoToYYYYMM(r.date);
    const [y, m] = ym.split('-').map(Number);
    if (y < year || (y === year && m < month)) acc += r.volume || 0;
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
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const isEmbedded = embeddedProject != null;

  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!isEmbedded);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based

  const [headerKontraktor, setHeaderKontraktor] = useState('PT. INDIRA MAJU BERSAMA ( RUSLI )');
  const [headerProyek, setHeaderProyek] = useState('');
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [savingShared, setSavingShared] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);

  const project = isEmbedded ? embeddedProject! : localProject;
  const canEditReports = isEmbedded && !!shareToken && !!onEmbeddedProjectChange && (allowPublicEdit || !!editToken);
  const canEditMatrix = isEmbedded ? canEditReports : true;

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

  const handleSaveSharedReports = async () => {
    if (!canEditReports || !shareToken || !project) return;
    setSavingShared(true);
    try {
      const updated = await projectShareLinksAPI.updateSharedReports(shareToken, editToken || undefined, project.reports);
      onEmbeddedProjectChange!(updated);
      alert('Laporan tersimpan ke proyek (link share).');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan laporan.');
    } finally {
      setSavingShared(false);
    }
  };

  const handleSaveLocalReports = async () => {
    if (isEmbedded || !project) return;
    setSavingLocal(true);
    try {
      await projectsAPI.updateProject(project.id, project);
      alert('Laporan tersimpan.');
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
  const monthlyVolume = dailyMonth.reduce((a, r) => a + (r.volume || 0), 0);

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
          {canEditMatrix && (
            <>
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
              <button
                type="button"
                disabled={isEmbedded ? savingShared : savingLocal}
                onClick={isEmbedded ? handleSaveSharedReports : handleSaveLocalReports}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isEmbedded ? (savingShared ? 'Menyimpan…' : '💾 Simpan laporan') : (savingLocal ? 'Menyimpan…' : '💾 Simpan')}
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
                    const v = r?.volume;
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
                    return (
                      <td
                        key={day}
                        className="border border-gray-400 p-0.5 text-center leading-tight"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', verticalAlign: 'top', fontSize: '8px' }}
                      >
                        {r?.cuaca || ''}
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
