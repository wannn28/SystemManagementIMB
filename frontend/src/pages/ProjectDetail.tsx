import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { projectsAPI, projectExpensesAPI, projectIncomesAPI, ProjectExpense, ProjectIncome, ProjectFinancialSummary } from '../api';
import { Project } from '../types/BasicTypes';
import EditReportForm from './EditReportForm';

interface ProjectDetailProps {
    isCollapsed: boolean;
}

// Helper functions for chart data
const isValidDate = (d: Date) => !isNaN(d.getTime());

const getAggregatedRevenueData = (project: Project, timeRange: string, incomes: ProjectIncome[] = []) => {
    const dailyData = project.reports.daily || [];
    const incomeData = (incomes || [])
        .filter((item) => !!item?.tanggal && Number.isFinite(Number(item?.jumlah)))
        .map((item) => ({
            ...item,
            parsedDate: new Date(item.tanggal),
            amount: Number(item.jumlah || 0),
            isReceived: item.status === 'Received',
        }))
        .filter((item) => isValidDate(item.parsedDate))
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const hasIncomeData = incomeData.length > 0;

    const groupIntoWeeks = () => {
        const weeksMap = new Map<string, any>();
        const projectStart = new Date(project.startDate);
        if (!isValidDate(projectStart)) return [];

        if (hasIncomeData) {
            incomeData.forEach((entry, index) => {
                const dayDate = entry.parsedDate;
                const diffTime = dayDate.getTime() - projectStart.getTime();
                const weekNumber = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
                const safeWeekNum = Number.isFinite(weekNumber) && weekNumber >= 1 ? weekNumber : index + 1;

                const weekKey = `Week ${safeWeekNum}`;
                if (!weeksMap.has(weekKey)) {
                    weeksMap.set(weekKey, {
                        weekLabel: `Week ${safeWeekNum}`,
                        weekNumber: safeWeekNum,
                        weekStart: new Date(projectStart.getTime() + (safeWeekNum - 1) * 7 * 24 * 60 * 60 * 1000),
                        revenue: 0,
                        paid: 0,
                        totalRevenue: project.totalRevenue,
                    });
                }

                const week = weeksMap.get(weekKey);
                week.revenue += entry.amount;
                week.paid += entry.isReceived ? entry.amount : 0;
            });
        } else {
            dailyData.forEach((day, index) => {
                const dayDate = new Date(day.date);
                if (!isValidDate(dayDate)) return;
                const diffTime = dayDate.getTime() - projectStart.getTime();
                const weekNumber = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
                const safeWeekNum = Number.isFinite(weekNumber) && weekNumber >= 1 ? weekNumber : index + 1;

                const weekKey = `Week ${safeWeekNum}`;
                if (!weeksMap.has(weekKey)) {
                    weeksMap.set(weekKey, {
                        weekLabel: `Week ${safeWeekNum}`,
                        weekNumber: safeWeekNum,
                        weekStart: new Date(projectStart.getTime() + (safeWeekNum - 1) * 7 * 24 * 60 * 60 * 1000),
                        revenue: 0,
                        paid: 0,
                    });
                }

                const week = weeksMap.get(weekKey);
                week.revenue += day.revenue || 0;
                week.paid += day.paid || 0;
                week.totalRevenue = project.totalRevenue;
            });
        }

        return Array.from(weeksMap.values()).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    };

    const groupIntoMonths = () => {
        const monthsMap = new Map<string, any>();

        if (hasIncomeData) {
            incomeData.forEach((entry) => {
                const dayDate = entry.parsedDate;
                const year = dayDate.getFullYear();
                const monthIdx = dayDate.getMonth();
                const monthKey = `${year}-${monthIdx}`;

                if (!monthsMap.has(monthKey)) {
                    const monthDate = new Date(year, monthIdx, 1);
                    const monthLabel = isValidDate(monthDate)
                        ? monthDate.toLocaleString('default', { month: 'short', year: 'numeric' })
                        : `${monthIdx + 1}/${year}`;
                    monthsMap.set(monthKey, {
                        monthLabel,
                        monthStart: monthDate,
                        revenue: 0,
                        paid: 0,
                        totalRevenue: project.totalRevenue,
                    });
                }

                const month = monthsMap.get(monthKey);
                month.revenue += entry.amount;
                month.paid += entry.isReceived ? entry.amount : 0;
            });
        } else {
            dailyData.forEach(day => {
                const dayDate = new Date(day.date);
                if (!isValidDate(dayDate)) return;
                const year = dayDate.getFullYear();
                const monthIdx = dayDate.getMonth();
                const monthKey = `${year}-${monthIdx}`;

                if (!monthsMap.has(monthKey)) {
                    const monthDate = new Date(year, monthIdx, 1);
                    const monthLabel = isValidDate(monthDate)
                        ? monthDate.toLocaleString('default', { month: 'short', year: 'numeric' })
                        : `${monthIdx + 1}/${year}`;
                    monthsMap.set(monthKey, {
                        monthLabel,
                        monthStart: monthDate,
                        revenue: 0,
                        paid: 0,
                        totalRevenue: 0,
                    });
                }

                const month = monthsMap.get(monthKey);
                month.revenue += day.revenue || 0;
                month.paid += day.paid || 0;
                month.totalRevenue = project.totalRevenue;
            });
        }

        return Array.from(monthsMap.values()).sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime());
    };

    const groupIntoDays = () => {
        if (!hasIncomeData) {
            return dailyData
                .filter(day => isValidDate(new Date(day.date)))
                .map(day => ({
                    date: new Date(day.date),
                    revenue: day.revenue || 0,
                    paid: day.paid || 0,
                    totalRevenue: project.totalRevenue,
                }));
        }

        const daysMap = new Map<string, { date: Date; revenue: number; paid: number; totalRevenue: number }>();
        incomeData.forEach((entry) => {
            const d = entry.parsedDate;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!daysMap.has(key)) {
                daysMap.set(key, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), revenue: 0, paid: 0, totalRevenue: project.totalRevenue });
            }
            const one = daysMap.get(key)!;
            one.revenue += entry.amount;
            one.paid += entry.isReceived ? entry.amount : 0;
        });

        return Array.from(daysMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    };

    switch (timeRange) {
        case 'weekly':
            return groupIntoWeeks();
        case 'monthly':
            return groupIntoMonths();
        default:
            return groupIntoDays();
    }
};

const getProgressData = (project: Project, timeRange: string) => {
    const dailyData = project.reports.daily || [];

    const groupIntoWeeks = () => {
        const weeksMap = new Map<string, any>();
        const projectStart = new Date(project.startDate);
        if (!isValidDate(projectStart)) return [];

        dailyData.forEach((day, index) => {
            const dayDate = new Date(day.date);
            if (!isValidDate(dayDate)) return;
            const diffTime = dayDate.getTime() - projectStart.getTime();
            const weekNumber = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
            const safeWeekNum = Number.isFinite(weekNumber) && weekNumber >= 1 ? weekNumber : index + 1;

            const weekKey = `Week ${safeWeekNum}`;
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, {
                    weekLabel: `Week ${safeWeekNum}`,
                    weekNumber: safeWeekNum,
                    weekStart: new Date(projectStart.getTime() + (safeWeekNum - 1) * 7 * 24 * 60 * 60 * 1000),
                    volume: 0,
                    target: 0,
                });
            }

            const week = weeksMap.get(weekKey);
            week.volume = day.volume || 0;
            week.target = day.targetVolume || 0;
            week.totalVolume = project.totalVolume;
        });

        return Array.from(weeksMap.values());
    };

    const groupIntoMonths = () => {
        const monthsMap = new Map<string, any>();

        dailyData.forEach(day => {
            const dayDate = new Date(day.date);
            if (!isValidDate(dayDate)) return;
            const year = dayDate.getFullYear();
            const monthIdx = dayDate.getMonth();
            const monthKey = `${year}-${monthIdx}`;

            if (!monthsMap.has(monthKey)) {
                const monthDate = new Date(year, monthIdx, 1);
                const monthLabel = isValidDate(monthDate)
                    ? monthDate.toLocaleString('default', { month: 'short', year: 'numeric' })
                    : `${monthIdx + 1}/${year}`;
                monthsMap.set(monthKey, {
                    monthLabel,
                    monthStart: monthDate,
                    volume: 0,
                    target: 0,
                    totalVolume: 0,
                });
            }

            const month = monthsMap.get(monthKey);
            month.volume = day.volume || 0;
            month.target = day.targetVolume || 0;
            month.totalVolume = project.totalVolume;
        });

        return Array.from(monthsMap.values());
    };

    switch (timeRange) {
        case 'weekly':
            return groupIntoWeeks();
        case 'monthly':
            return groupIntoMonths();
        default:
            return dailyData
                .filter(day => isValidDate(new Date(day.date)))
                .map(day => ({
                    dateLabel: new Date(day.date).toLocaleDateString(),
                    date: new Date(day.date),
                    volume: day.volume || 0,
                    target: day.targetVolume || 0,
                    totalVolume: project.totalVolume,
                }));
    }
};

/** Total volume for display: use project.totalVolume, or fallback to max target from daily reports */
const getEffectiveTotalVolume = (project: Project): number => {
    if (project.totalVolume != null && project.totalVolume > 0) return project.totalVolume;
    const daily = project.reports?.daily;
    if (!daily?.length) return 0;
    const maxTarget = Math.max(...daily.map(d => d.targetVolume || 0), 0);
    if (maxTarget > 0) return maxTarget;
    const last = daily[daily.length - 1];
    return last?.targetVolume || 0;
};

/** Current volume from latest daily report */
const getCurrentVolume = (project: Project): number => {
    const daily = project.reports?.daily;
    if (!daily?.length) return 0;
    return daily[daily.length - 1].volume || 0;
};

/** Target volume dari periode terakhir (laporan harian terakhir) */
const getCurrentTargetVolume = (project: Project): number => {
    const daily = project.reports?.daily;
    if (!daily?.length) return 0;
    return daily[daily.length - 1].targetVolume || 0;
};

const getProgress = (project: Project): number => {
    const totalVolume = getEffectiveTotalVolume(project);
    if (!totalVolume) return 0;
    const currentVolume = getCurrentVolume(project);
    return (currentVolume / totalVolume) * 100;
};

const RevenueChart = ({ data, timeRange, showTargetLine, showRevenueLine, showPaidLine }: {
    data: any[]; timeRange: string; showTotals: boolean;
    showTargetLine?: boolean; targetValue?: number;
    showRevenueLine: boolean;
    showPaidLine: boolean;
}) => {
    const getXAxisConfig = () => {
        if (timeRange === 'daily') {
            return {
                dataKey: 'date',
                tickFormatter: (tick: any) => new Date(tick).toLocaleDateString()
            };
        } else if (timeRange === 'weekly') {
            return {
                dataKey: 'weekLabel',
                tickFormatter: (tick: any) => tick
            };
        } else {
            return {
                dataKey: 'monthLabel',
                tickFormatter: (tick: any) => tick
            };
        }
    };

    const xAxisConfig = getXAxisConfig();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey={xAxisConfig.dataKey}
                    tickFormatter={xAxisConfig.tickFormatter}
                    tick={{ fontSize: 12, fill: '#666' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} />
                <Tooltip formatter={(v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v} />
                <Legend />
                {showTargetLine && data.length > 0 && (
                    <Line type="monotone" dataKey="totalRevenue" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} name="Total Revenue" dot={false} />
                )}
                {showRevenueLine && <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />}
                {showPaidLine && <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} name="Paid" />}
            </LineChart>
        </ResponsiveContainer>
    );
};

const ProgressChart = ({ data, timeRange, showTargetLine, showActualLine, showTargetVolumeLine }: {
    data: any[]; timeRange: string;
    showTargetLine?: boolean; targetValue?: number;
    showActualLine: boolean;
    showTargetVolumeLine: boolean;
}) => {
    const getXAxisConfig = () => {
        if (timeRange === 'daily') {
            return {
                dataKey: 'date',
                tickFormatter: (tick: any) => new Date(tick).toLocaleDateString()
            };
        } else if (timeRange === 'weekly') {
            return {
                dataKey: 'weekLabel',
                tickFormatter: (tick: any) => tick
            };
        } else {
            return {
                dataKey: 'monthLabel',
                tickFormatter: (tick: any) => tick
            };
        }
    };

    const xAxisConfig = getXAxisConfig();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey={xAxisConfig.dataKey}
                    tickFormatter={xAxisConfig.tickFormatter}
                    tick={{ fontSize: 12, fill: '#666' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip />
                <Legend />
                {showTargetLine && data.length > 0 && (
                    <Line type="monotone" dataKey="totalVolume" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} name="Total Volume" dot={false} />
                )}
                {showActualLine && <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} name="Actual Volume" />}
                {showTargetVolumeLine && <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} name="Target" />}
            </LineChart>
        </ResponsiveContainer>
    );
};

const WorkersEquipmentChart = ({ project, timeRange, showWorkersLine, showEquipmentLine }: { project: Project; timeRange: string; showWorkersLine: boolean; showEquipmentLine: boolean }) => {
    const daily = project.reports?.daily || [];
    const weekly = project.reports?.weekly || [];
    const monthly = project.reports?.monthly || [];

    const data =
        timeRange === 'weekly'
            ? weekly.map((w: any) => ({
                  label: w.week,
                  workers: Number(w.avgWorkers ?? w.totalWorkers ?? 0),
                  equipment: Number(w.avgEquipment ?? w.totalEquipment ?? 0),
              }))
            : timeRange === 'monthly'
              ? monthly.map((m: any) => ({
                    label: m.month,
                    workers: Number(m.avgWorkers ?? m.totalWorkers ?? 0),
                    equipment: Number(m.avgEquipment ?? m.totalEquipment ?? 0),
                }))
              : daily
                    .filter((d: any) => !!d?.date)
                    .map((d: any) => ({
                        label: d.date,
                        workers: Number(d.totalWorkers ?? Object.values(d.workers || {}).reduce((s: number, n: any) => s + (Number(n) || 0), 0)),
                        equipment: Number(d.totalEquipment ?? Object.values(d.equipment || {}).reduce((s: number, n: any) => s + (Number(n) || 0), 0)),
                    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(tick: any) => (timeRange === 'daily' ? new Date(tick).toLocaleDateString() : tick)}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip />
                <Legend />
                {showWorkersLine && <Line type="monotone" dataKey="workers" stroke="#10b981" strokeWidth={2} name={timeRange === 'daily' ? 'Total Pekerja' : 'Rata-rata Pekerja'} />}
                {showEquipmentLine && <Line type="monotone" dataKey="equipment" stroke="#f97316" strokeWidth={2} name={timeRange === 'daily' ? 'Total Alat' : 'Rata-rata Alat'} />}
            </LineChart>
        </ResponsiveContainer>
    );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ isCollapsed }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditReports, setShowEditReports] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [showTotals, setShowTotals] = useState(true);
    const [showRevenueTotal, setShowRevenueTotal] = useState(false);
    const [showVolumeTotal, setShowVolumeTotal] = useState(false);
    const [showAllDailyRows, setShowAllDailyRows] = useState(false);
    const [showRevenueSeries, setShowRevenueSeries] = useState({ revenue: true, paid: true });
    const [showVolumeSeries, setShowVolumeSeries] = useState({ actual: true, target: true });
    const [showWorkersEquipmentSeries, setShowWorkersEquipmentSeries] = useState({ workers: true, equipment: true });
    const [dailyImagesModal, setDailyImagesModal] = useState<{
        open: boolean;
        dateLabel: string;
        images: Array<{ imagePath: string; description?: string }>;
    }>({ open: false, dateLabel: '', images: [] });
    const [expandedChart, setExpandedChart] = useState<'revenue' | 'volume' | null>(null);
    const [analisisView, setAnalisisView] = useState<'semua' | 'progress' | 'keduanya'>('progress');
    const fullscreenChartRef = useRef<HTMLDivElement>(null);
    
    // Financial data
    const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
    const [projectIncomes, setProjectIncomes] = useState<ProjectIncome[]>([]);
    const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary | null>(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [savingExpense, setSavingExpense] = useState(false);
    const [savingIncome, setSavingIncome] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Unpaid' as 'Paid' | 'Unpaid' | 'Pending'
    });
    const [incomeForm, setIncomeForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Pending' as 'Received' | 'Pending' | 'Planned'
    });

    const [editIncomeModal, setEditIncomeModal] = useState<{
        open: boolean;
        id: number | null;
        form: { tanggal: string; kategori: string; deskripsi: string; jumlah: number; status: 'Received' | 'Pending' | 'Planned' };
        saving: boolean;
    }>({ open: false, id: null, form: { tanggal: '', kategori: '', deskripsi: '', jumlah: 0, status: 'Pending' }, saving: false });

    const [editExpenseModal, setEditExpenseModal] = useState<{
        open: boolean;
        id: number | null;
        form: { tanggal: string; kategori: string; deskripsi: string; jumlah: number; status: 'Paid' | 'Unpaid' | 'Pending' };
        saving: boolean;
    }>({ open: false, id: null, form: { tanggal: '', kategori: '', deskripsi: '', jumlah: 0, status: 'Unpaid' }, saving: false });

    useEffect(() => {
        if (id) {
            fetchProject();
            fetchFinancialData();
        }
    }, [id]);

    // Fullscreen API: grafik tampil fullscreen asli (bukan modal)
    useEffect(() => {
        if (!expandedChart) {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            return;
        }
        const onFullscreenChange = () => { if (!document.fullscreenElement) setExpandedChart(null); };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        const id = setTimeout(() => {
            const el = fullscreenChartRef.current;
            if (el) el.requestFullscreen().catch(() => {});
        }, 50);
        return () => {
            clearTimeout(id);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, [expandedChart]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const project = await projectsAPI.getProjectById(Number(id));
            setProject(project);
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFinancialData = async () => {
        try {
            const [expenses, incomes, summary] = await Promise.all([
                projectExpensesAPI.getExpensesByProjectId(Number(id)),
                projectIncomesAPI.getIncomesByProjectId(Number(id)),
                projectExpensesAPI.getFinancialSummary(Number(id))
            ]);
            setProjectExpenses(expenses);
            setProjectIncomes(incomes);
            setFinancialSummary(summary);
        } catch (error) {
            console.error('Failed to fetch financial data:', error);
        }
    };

    const formatDateOnly = (v: string) => {
        if (!v) return '';
        const x = v.split('T')[0];
        return x || v;
    };

    const handleSaveReports = async (updatedProject: Project) => {
        try {
            await projectsAPI.updateProject(updatedProject.id, updatedProject);
            setProject(updatedProject);
            setShowEditReports(false);
            alert('Reports saved successfully!');
            fetchProject();
        } catch (error) {
            console.error('Failed to save reports:', error);
            alert('Failed to save reports');
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!expenseForm.kategori.trim()) {
            alert('Kategori pengeluaran wajib diisi.');
            return;
        }
        if (!(Number(expenseForm.jumlah) > 0)) {
            alert('Jumlah pengeluaran harus lebih dari 0.');
            return;
        }
        try {
            setSavingExpense(true);
            await projectExpensesAPI.createExpense({
                projectId: Number(id),
                tanggal: expenseForm.tanggal,
                kategori: expenseForm.kategori.trim(),
                deskripsi: expenseForm.deskripsi.trim(),
                jumlah: Number(expenseForm.jumlah),
                status: expenseForm.status,
            });
            setShowExpenseModal(false);
            setExpenseForm({
                tanggal: new Date().toISOString().split('T')[0],
                kategori: '',
                deskripsi: '',
                jumlah: 0,
                status: 'Unpaid',
            });
            await fetchFinancialData();
        } catch (error) {
            console.error('Failed to create expense:', error);
            alert('Gagal menambahkan pengeluaran.');
        } finally {
            setSavingExpense(false);
        }
    };

    const handleCreateIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!incomeForm.kategori.trim()) {
            alert('Kategori pemasukan wajib diisi.');
            return;
        }
        if (!(Number(incomeForm.jumlah) > 0)) {
            alert('Jumlah pemasukan harus lebih dari 0.');
            return;
        }
        try {
            setSavingIncome(true);
            await projectIncomesAPI.createIncome({
                projectId: Number(id),
                tanggal: incomeForm.tanggal,
                kategori: incomeForm.kategori.trim(),
                deskripsi: incomeForm.deskripsi.trim(),
                jumlah: Number(incomeForm.jumlah),
                status: incomeForm.status,
            });
            setShowIncomeModal(false);
            setIncomeForm({
                tanggal: new Date().toISOString().split('T')[0],
                kategori: '',
                deskripsi: '',
                jumlah: 0,
                status: 'Pending',
            });
            await fetchFinancialData();
        } catch (error) {
            console.error('Failed to create income:', error);
            alert('Gagal menambahkan pemasukan.');
        } finally {
            setSavingIncome(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300 pl-10 pr-8 py-8`}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    const resolveUploadUrl = (p: string): string => {
        if (!p) return '';
        if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('blob:')) return p;
        const base = import.meta.env.VITE_API_URL;
        if (p.startsWith('/uploads/')) return `${base}${p}`;
        if (p.startsWith('uploads/')) return `${base}/${p}`;
        // assume filename
        return `${base}/uploads/${p.replace(/^\/+/, '')}`;
    };

    if (!project) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300 pl-10 pr-8 py-8`}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl">Project not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300 pl-10 pr-8 py-8`}>
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            {/* Project Card */}
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 mb-6">
                {/* Modern Project Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white drop-shadow-md">{project.name}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-blue-100 text-sm font-medium">ID: {project.id}</span>
                                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            project.status === 'active' 
                                                ? 'bg-green-400 text-green-900' 
                                                : 'bg-yellow-400 text-yellow-900'
                                        }`}>
                                            {project.status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Quick Stats - only when Show Totals is on */}
                            {showTotals && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                        <p className="text-blue-100 text-xs mb-1">Total Revenue</p>
                                        <p className="text-white text-lg font-bold">Rp {((project.totalRevenue || 0) / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                        <p className="text-blue-100 text-xs mb-1">Progress</p>
                                        <p className="text-white text-lg font-bold">{getProgress(project).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                        <p className="text-blue-100 text-xs mb-1">Total Volume</p>
                                        <p className="text-white text-lg font-bold">{(getEffectiveTotalVolume(project) / 1000).toFixed(1)}K</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2 border border-white/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share Project
                            </button>
                            <button
                                onClick={() => setShowEditReports(true)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2 border border-white/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Reports
                            </button>
                            <button
                                onClick={() => navigate(`/projects/${id}/rekapitulasi`)}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2 border border-white/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                </svg>
                                Rekapitulasi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Project Content */}
                <div className="p-6 space-y-8">
                    {/* Time Range & Display Options */}
                    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-600">⏱️ Time Range:</span>
                            <div className="flex gap-2">
                                {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                            timeRange === range
                                                ? 'bg-blue-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showTotals}
                                    onChange={(e) => setShowTotals(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">📊 Show Totals</span>
                            </label>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Revenue Analysis</h3>
                                            <p className="text-sm text-gray-500">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} overview</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowRevenueTotal(v => !v)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                showRevenueTotal ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            📊 Show Total
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedChart('revenue')}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                                            title="Tampilkan grafik fullscreen"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            Fullscreen
                                        </button>
                                    </div>
                                </div>
                                {showRevenueTotal && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                                        <div className="flex flex-wrap gap-4">
                                            <span><strong>Total Revenue:</strong> Rp {((project.totalRevenue || 0) / 1e6).toFixed(1)}M</span>
                                            <span><strong>Progress:</strong> {(project.totalRevenue ? (getAggregatedRevenueData(project, timeRange, projectIncomes).reduce((s, d) => s + (d.paid || 0), 0) / project.totalRevenue * 100) : 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )}
                                <div className="h-64 bg-gradient-to-br from-blue-50/30 to-transparent rounded-xl p-2">
                                    <RevenueChart
                                        data={getAggregatedRevenueData(project, timeRange, projectIncomes)}
                                        timeRange={timeRange}
                                        showTotals={showTotals}
                                        showTargetLine={showRevenueTotal}
                                        targetValue={project.totalRevenue}
                                        showRevenueLine={showRevenueSeries.revenue}
                                        showPaidLine={showRevenueSeries.paid}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showRevenueSeries.revenue} onChange={(e) => setShowRevenueSeries((p) => ({ ...p, revenue: e.target.checked }))} />
                                        <span className="text-gray-700">Revenue</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showRevenueSeries.paid} onChange={(e) => setShowRevenueSeries((p) => ({ ...p, paid: e.target.checked }))} />
                                        <span className="text-gray-700">Paid</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Volume Progress Chart */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Volume Progress</h3>
                                            <p className="text-sm text-gray-500">Target vs Actual</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowVolumeTotal(v => !v)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                showVolumeTotal ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            📊 Show Total
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedChart('volume')}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                                            title="Tampilkan grafik fullscreen"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            Fullscreen
                                        </button>
                                    </div>
                                </div>
                                {showVolumeTotal && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                                        <div className="flex flex-wrap gap-4">
                                            <span><strong>Total Volume:</strong> {(getEffectiveTotalVolume(project) / 1000).toFixed(1)}K</span>
                                            <span><strong>Progress:</strong> {getProgress(project).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                )}
                                <div className="h-64 bg-gradient-to-br from-green-50/30 to-transparent rounded-xl p-2">
                                    <ProgressChart
                                        data={getProgressData(project, timeRange).map(d => ({ ...d, totalVolume: getEffectiveTotalVolume(project) }))}
                                        timeRange={timeRange}
                                        showTargetLine={showVolumeTotal}
                                        targetValue={getEffectiveTotalVolume(project)}
                                        showActualLine={showVolumeSeries.actual}
                                        showTargetVolumeLine={showVolumeSeries.target}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showVolumeSeries.actual} onChange={(e) => setShowVolumeSeries((p) => ({ ...p, actual: e.target.checked }))} />
                                        <span className="text-gray-700">Actual Volume</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showVolumeSeries.target} onChange={(e) => setShowVolumeSeries((p) => ({ ...p, target: e.target.checked }))} />
                                        <span className="text-gray-700">Target</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Workers & Equipment Chart */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Pekerja & Alat</h3>
                                            <p className="text-sm text-gray-500">Total/Avg mengikuti time range</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 bg-gradient-to-br from-emerald-50/20 to-transparent rounded-xl p-2">
                                    <WorkersEquipmentChart
                                        project={project}
                                        timeRange={timeRange}
                                        showWorkersLine={showWorkersEquipmentSeries.workers}
                                        showEquipmentLine={showWorkersEquipmentSeries.equipment}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showWorkersEquipmentSeries.workers} onChange={(e) => setShowWorkersEquipmentSeries((p) => ({ ...p, workers: e.target.checked }))} />
                                        <span className="text-gray-700">Total Pekerja</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showWorkersEquipmentSeries.equipment} onChange={(e) => setShowWorkersEquipmentSeries((p) => ({ ...p, equipment: e.target.checked }))} />
                                        <span className="text-gray-700">Total Alat</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analisis: pilih Semua / Progress Saat Ini / Keduanya */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Analisis</h3>
                                <p className="text-sm text-gray-500">Pilih tampilan: Semua, Progress Saat Ini, atau Keduanya</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row min-h-0">
                            {/* Sidebar pilihan */}
                            <div className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50/50 p-3 flex sm:flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => setAnalisisView('semua')}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        analisisView === 'semua' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAnalisisView('progress')}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        analisisView === 'progress' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Progress Saat Ini
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAnalisisView('keduanya')}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        analisisView === 'keduanya' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Keduanya
                                </button>
                            </div>
                            {/* Konten sesuai pilihan */}
                            <div className="flex-1 p-6 overflow-auto">
                                {(analisisView === 'semua' || analisisView === 'keduanya') && (
                                    <div className={analisisView === 'keduanya' ? 'mb-8' : ''}>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Analisis Semua (kumulatif)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
                                                <p className="text-sm font-medium text-blue-700 mb-1">Target Volume Total</p>
                                                <p className="text-2xl font-bold text-blue-900">{(getEffectiveTotalVolume(project) / 1000).toFixed(1)}K</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200">
                                                <p className="text-sm font-medium text-green-700 mb-1">Actual Volume Total</p>
                                                <p className="text-2xl font-bold text-green-900">{(getCurrentVolume(project) / 1000).toFixed(1)}K</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200">
                                                <p className="text-sm font-medium text-orange-700 mb-1">Deviasi (Actual − Target)</p>
                                                <p className={`text-2xl font-bold ${getCurrentVolume(project) - getEffectiveTotalVolume(project) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {((getCurrentVolume(project) - getEffectiveTotalVolume(project)) / 1000).toFixed(1)}K
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
                                                <p className="text-sm font-medium text-purple-700 mb-1">Progress</p>
                                                <p className="text-2xl font-bold text-purple-900">{getProgress(project).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(analisisView === 'progress' || analisisView === 'keduanya') && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Analisis Progress Saat Ini</h4>
                                        <p className="text-xs text-gray-500 mb-3">Volume & target dari periode terakhir (laporan harian terakhir)</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200">
                                                <p className="text-sm font-medium text-slate-700 mb-1">Volume Saat Ini</p>
                                                <p className="text-2xl font-bold text-slate-900">{(getCurrentVolume(project) / 1000).toFixed(1)}K</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 border border-amber-200">
                                                <p className="text-sm font-medium text-amber-700 mb-1">Target Volume Saat Ini</p>
                                                <p className="text-2xl font-bold text-amber-900">{(getCurrentTargetVolume(project) / 1000).toFixed(1)}K</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200">
                                                <p className="text-sm font-medium text-orange-700 mb-1">Deviasi Saat Ini (Actual − Target)</p>
                                                <p className={`text-2xl font-bold ${(getCurrentVolume(project) - getCurrentTargetVolume(project)) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {((getCurrentVolume(project) - getCurrentTargetVolume(project)) / 1000).toFixed(1)}K
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200">
                                                <p className="text-sm font-medium text-indigo-700 mb-1">Progress Saat Ini</p>
                                                <p className="text-2xl font-bold text-indigo-900">
                                                    {getCurrentTargetVolume(project) ? ((getCurrentVolume(project) / getCurrentTargetVolume(project)) * 100).toFixed(1) : '—'}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary: Total yang akan didapat, Pemasukan, Pengeluaran, Profit saat ini */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Financial Summary</h3>
                                    <p className="text-sm text-gray-500">Total target, Pemasukan, Pengeluaran & Profit saat ini</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowIncomeModal(true)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md"
                                >
                                    + Tambah Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(true)}
                                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md"
                                >
                                    + Tambah Pengeluaran
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                <div className="text-sm text-blue-600 font-semibold mb-1">Total yang Akan Didapat</div>
                                <div className="text-xl font-bold text-blue-700">Rp {(project.totalRevenue || financialSummary?.totalRevenue || 0).toLocaleString()}</div>
                                <div className="text-xs text-blue-600/80 mt-1">Target pemasukan proyek</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                <div className="text-sm text-green-600 font-semibold mb-1">Pemasukan</div>
                                <div className="text-xl font-bold text-green-700">
                                    Rp {(projectIncomes.filter(i => i.status === 'Received').reduce((s, i) => s + (i.jumlah || 0), 0) || project.amountPaid || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-green-600/80 mt-1">Dana yang sudah diterima</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                <div className="text-sm text-red-600 font-semibold mb-1">Pengeluaran</div>
                                <div className="text-xl font-bold text-red-700">Rp {(financialSummary?.totalExpenses ?? 0).toLocaleString()}</div>
                                <div className="text-xs text-red-600/80 mt-1">Total biaya yang sudah dikeluarkan</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                <div className="text-sm text-purple-600 font-semibold mb-1">Profit saat ini</div>
                                <div className="text-xl font-bold text-purple-700">
                                    Rp {(
                                        (projectIncomes.filter(i => i.status === 'Received').reduce((s, i) => s + (i.jumlah || 0), 0) || project.amountPaid || 0) -
                                        (financialSummary?.totalExpenses ?? 0)
                                    ).toLocaleString()}
                                </div>
                                <div className="text-xs text-purple-600/80 mt-1">Pemasukan − Pengeluaran</div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            Transaksi: {projectIncomes.length} pemasukan, {projectExpenses.length} pengeluaran.
                        </div>

                        {/* Quick lists (max 10) + link to Finance */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-semibold text-gray-800">Pemasukan Terakhir (max 10)</div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/finance?type=income&project_id=${project.id}`)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Lihat detail
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {[...projectIncomes]
                                        .filter((i) => i.status === 'Received')
                                        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
                                        .slice(0, 10)
                                        .map((i) => (
                                            <div key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500">{formatDateOnly(i.tanggal)}</div>
                                                    <div className="text-sm font-medium text-gray-800 truncate">{i.deskripsi || i.kategori || '-'}</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-sm font-bold text-green-700">Rp {(i.jumlah || 0).toLocaleString()}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEditIncomeModal({
                                                                open: true,
                                                                id: i.id,
                                                                saving: false,
                                                                form: {
                                                                    tanggal: formatDateOnly(i.tanggal) || new Date().toISOString().split('T')[0],
                                                                    kategori: i.kategori || '',
                                                                    deskripsi: i.deskripsi || '',
                                                                    jumlah: i.jumlah || 0,
                                                                    status: i.status || 'Pending',
                                                                },
                                                            })
                                                        }
                                                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {projectIncomes.filter((i) => i.status === 'Received').length === 0 && (
                                        <div className="text-sm text-gray-500">Belum ada pemasukan (status Received).</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-semibold text-gray-800">Pengeluaran Terakhir (max 10)</div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/finance?type=expense&project_id=${project.id}`)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Lihat detail
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {[...projectExpenses]
                                        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
                                        .slice(0, 10)
                                        .map((e) => (
                                            <div key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500">{formatDateOnly(e.tanggal)}</div>
                                                    <div className="text-sm font-medium text-gray-800 truncate">{e.deskripsi || e.kategori || '-'}</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-sm font-bold text-red-700">Rp {(e.jumlah || 0).toLocaleString()}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEditExpenseModal({
                                                                open: true,
                                                                id: e.id,
                                                                saving: false,
                                                                form: {
                                                                    tanggal: formatDateOnly(e.tanggal) || new Date().toISOString().split('T')[0],
                                                                    kategori: e.kategori || '',
                                                                    deskripsi: e.deskripsi || '',
                                                                    jumlah: e.jumlah || 0,
                                                                    status: e.status || 'Unpaid',
                                                                },
                                                            })
                                                        }
                                                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {projectExpenses.length === 0 && <div className="text-sm text-gray-500">Belum ada pengeluaran.</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reports Tables */}
                    <div className="space-y-6">
                        {/* Daily Reports */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">📅</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Daily Reports</h3>
                                    <p className="text-sm text-gray-500">{project.reports?.daily?.length || 0} total records</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actual</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase" title="Jumlah nota / trip (SmartNota)">Ritase</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Pekerja</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Alat</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Foto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {(showAllDailyRows ? [...(project.reports?.daily || [])].slice().reverse() : (project.reports?.daily || []).slice(-10).reverse()).map((report, index) => (
                                            <tr key={index} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.date}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.plan?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.aktual?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-amber-700 font-semibold tabular-nums">
                                                    {Number(report.ritase ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{report.targetVolume?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-purple-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalWorkers ?? Object.values(report.workers || {}).reduce((s: number, n: any) => s + (Number(n) || 0), 0)).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalEquipment ?? Object.values(report.equipment || {}).reduce((s: number, n: any) => s + (Number(n) || 0), 0)).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {report.images && report.images.length > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDailyImagesModal({
                                                                    open: true,
                                                                    dateLabel: report.date,
                                                                    images: (report.images || []).map((img: any) => ({
                                                                        imagePath: resolveUploadUrl(img.imagePath),
                                                                        description: img.description || '',
                                                                    })),
                                                                })
                                                            }
                                                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold"
                                                        >
                                                            Lihat Foto ({report.images.length})
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {project.reports?.daily && project.reports.daily.length > 10 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllDailyRows((v) => !v)}
                                        className="w-full text-center py-4 text-sm text-blue-600 hover:text-blue-700 bg-gray-50 rounded-b-xl"
                                    >
                                        {showAllDailyRows
                                            ? `Tampilkan 10 terakhir`
                                            : `Showing last 10 of ${project.reports.daily.length} records (klik untuk lihat semua)`}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Weekly Reports */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">📊</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Weekly Reports</h3>
                                    <p className="text-sm text-gray-500">{project.reports?.weekly?.length || 0} total records</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Week</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target Plan</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target Actual</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Pekerja</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rata-rata Pekerja</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Alat</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rata-rata Alat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {project.reports?.weekly?.map((report, index) => (
                                            <tr key={index} className="hover:bg-green-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.week}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.targetPlan?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.targetAktual?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalWorkers ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.avgWorkers ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalEquipment ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.avgEquipment ?? 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Monthly Reports */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">📈</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Monthly Reports</h3>
                                    <p className="text-sm text-gray-500">{project.reports?.monthly?.length || 0} total records</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Month</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target Plan</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target Actual</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Pekerja</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rata-rata Pekerja</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Alat</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rata-rata Alat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {project.reports?.monthly?.map((report, index) => (
                                            <tr key={index} className="hover:bg-purple-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.month}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.targetPlan?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{report.targetAktual?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-purple-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalWorkers ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.avgWorkers ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.totalEquipment ?? 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{(report.avgEquipment ?? 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Images Modal */}
            {dailyImagesModal.open && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Foto Daily Report</h3>
                                <p className="text-sm text-gray-500">{dailyImagesModal.dateLabel}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDailyImagesModal({ open: false, dateLabel: '', images: [] })}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {dailyImagesModal.images.length === 0 ? (
                                <div className="text-sm text-gray-500">Belum ada foto.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {dailyImagesModal.images.map((img, idx) => (
                                        <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                            <div className="aspect-[4/3] bg-black/5">
                                                <img src={img.imagePath} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                                            </div>
                                            <div className="p-3">
                                                <div className="text-xs font-semibold text-gray-700 mb-1">Keterangan</div>
                                                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                    {(img.description || '').trim() ? img.description : <span className="text-gray-400">—</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Reports Modal */}
            {showEditReports && (
                <EditReportForm
                    project={project}
                    onSave={handleSaveReports}
                />
            )}

            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateExpense} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Tambah Pengeluaran</h3>
                            <button type="button" onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" value={expenseForm.tanggal} onChange={(e) => setExpenseForm({ ...expenseForm, tanggal: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={expenseForm.status} onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as 'Paid' | 'Unpaid' | 'Pending' })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" value={expenseForm.kategori} onChange={(e) => setExpenseForm({ ...expenseForm, kategori: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Contoh: BBM, Gaji, Sewa" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea value={expenseForm.deskripsi} onChange={(e) => setExpenseForm({ ...expenseForm, deskripsi: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                <input type="number" min={0} step="any" value={expenseForm.jumlah} onChange={(e) => setExpenseForm({ ...expenseForm, jumlah: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Batal</button>
                            <button type="submit" disabled={savingExpense} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                                {savingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Income Modal */}
            {editIncomeModal.open && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!editIncomeModal.id) return;
                            setEditIncomeModal((p) => ({ ...p, saving: true }));
                            try {
                                await projectIncomesAPI.updateIncome(editIncomeModal.id, editIncomeModal.form);
                                await fetchFinancialData();
                                setEditIncomeModal((p) => ({ ...p, open: false, id: null, saving: false }));
                            } catch (err) {
                                console.error(err);
                                alert('Gagal update pemasukan.');
                                setEditIncomeModal((p) => ({ ...p, saving: false }));
                            }
                        }}
                        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Edit Pemasukan</h3>
                            <button type="button" onClick={() => setEditIncomeModal((p) => ({ ...p, open: false }))} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" value={editIncomeModal.form.tanggal} onChange={(e) => setEditIncomeModal((p) => ({ ...p, form: { ...p.form, tanggal: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={editIncomeModal.form.status} onChange={(e) => setEditIncomeModal((p) => ({ ...p, form: { ...p.form, status: e.target.value as any } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="Received">Received</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Planned">Planned</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" value={editIncomeModal.form.kategori} onChange={(e) => setEditIncomeModal((p) => ({ ...p, form: { ...p.form, kategori: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <input type="text" value={editIncomeModal.form.deskripsi} onChange={(e) => setEditIncomeModal((p) => ({ ...p, form: { ...p.form, deskripsi: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                                <input type="number" value={editIncomeModal.form.jumlah} onChange={(e) => setEditIncomeModal((p) => ({ ...p, form: { ...p.form, jumlah: Number(e.target.value) || 0 } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditIncomeModal((p) => ({ ...p, open: false }))} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                            <button type="submit" disabled={editIncomeModal.saving} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
                                {editIncomeModal.saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Expense Modal */}
            {editExpenseModal.open && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!editExpenseModal.id) return;
                            setEditExpenseModal((p) => ({ ...p, saving: true }));
                            try {
                                await projectExpensesAPI.updateExpense(editExpenseModal.id, editExpenseModal.form);
                                await fetchFinancialData();
                                setEditExpenseModal((p) => ({ ...p, open: false, id: null, saving: false }));
                            } catch (err) {
                                console.error(err);
                                alert('Gagal update pengeluaran.');
                                setEditExpenseModal((p) => ({ ...p, saving: false }));
                            }
                        }}
                        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Edit Pengeluaran</h3>
                            <button type="button" onClick={() => setEditExpenseModal((p) => ({ ...p, open: false }))} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" value={editExpenseModal.form.tanggal} onChange={(e) => setEditExpenseModal((p) => ({ ...p, form: { ...p.form, tanggal: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={editExpenseModal.form.status} onChange={(e) => setEditExpenseModal((p) => ({ ...p, form: { ...p.form, status: e.target.value as any } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" value={editExpenseModal.form.kategori} onChange={(e) => setEditExpenseModal((p) => ({ ...p, form: { ...p.form, kategori: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <input type="text" value={editExpenseModal.form.deskripsi} onChange={(e) => setEditExpenseModal((p) => ({ ...p, form: { ...p.form, deskripsi: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                                <input type="number" value={editExpenseModal.form.jumlah} onChange={(e) => setEditExpenseModal((p) => ({ ...p, form: { ...p.form, jumlah: Number(e.target.value) || 0 } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditExpenseModal((p) => ({ ...p, open: false }))} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                            <button type="submit" disabled={editExpenseModal.saving} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50">
                                {editExpenseModal.saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showIncomeModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateIncome} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Tambah Pemasukan</h3>
                            <button type="button" onClick={() => setShowIncomeModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" value={incomeForm.tanggal} onChange={(e) => setIncomeForm({ ...incomeForm, tanggal: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={incomeForm.status} onChange={(e) => setIncomeForm({ ...incomeForm, status: e.target.value as 'Received' | 'Pending' | 'Planned' })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="Received">Received</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Planned">Planned</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" value={incomeForm.kategori} onChange={(e) => setIncomeForm({ ...incomeForm, kategori: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Contoh: DP, Termin, Pelunasan" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea value={incomeForm.deskripsi} onChange={(e) => setIncomeForm({ ...incomeForm, deskripsi: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                <input type="number" min={0} step="any" value={incomeForm.jumlah} onChange={(e) => setIncomeForm({ ...incomeForm, jumlah: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowIncomeModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Batal</button>
                            <button type="submit" disabled={savingIncome} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                                {savingIncome ? 'Menyimpan...' : 'Simpan Pemasukan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    project={project}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {/* Grafik fullscreen asli (Fullscreen API) — bukan modal */}
            {expandedChart && createPortal(
                <div
                    key={expandedChart}
                    ref={fullscreenChartRef}
                    className="bg-white flex flex-col overflow-hidden"
                    style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0, zIndex: 2147483647 }}
                    role="application"
                    aria-label="Grafik fullscreen"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-white">
                        <h2 className="text-lg font-bold text-gray-800">
                            {expandedChart === 'revenue' ? 'Revenue Analysis' : 'Volume Progress'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => { document.exitFullscreen().catch(() => {}); setExpandedChart(null); }}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                            aria-label="Keluar fullscreen"
                        >
                            Keluar Fullscreen
                        </button>
                    </div>
                    <div className="flex-1 w-full min-h-0 p-4" style={{ height: 'calc(100vh - 56px)' }}>
                        {expandedChart === 'revenue' && (
                            <RevenueChart
                                data={getAggregatedRevenueData(project, timeRange, projectIncomes)}
                                timeRange={timeRange}
                                showTotals={showTotals}
                                showTargetLine={showRevenueTotal}
                                targetValue={project.totalRevenue}
                                showRevenueLine={showRevenueSeries.revenue}
                                showPaidLine={showRevenueSeries.paid}
                            />
                        )}
                        {expandedChart === 'volume' && (
                            <ProgressChart
                                data={getProgressData(project, timeRange).map(d => ({ ...d, totalVolume: getEffectiveTotalVolume(project) }))}
                                timeRange={timeRange}
                                showTargetLine={showVolumeTotal}
                                targetValue={getEffectiveTotalVolume(project)}
                                showActualLine={showVolumeSeries.actual}
                                showTargetVolumeLine={showVolumeSeries.target}
                            />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

  // ShareModal Component
const ShareModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
    const [shareSettings, setShareSettings] = useState({
        showRevenue: true,
        showFinancial: true,
        showDaily: true,
        showWeekly: true,
        showMonthly: true,
        showWorkers: true,
        showEquipment: true,
        showRekapitulasi: true,
        allowEdit: true,
        showVolumeTarget: true,
        showVolumeActual: true,
    });
    const [shareLink, setShareLink] = useState('');
    const [shareEditLink, setShareEditLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateShareLink = async () => {
        setIsGenerating(true);
        try {
            const { projectShareLinksAPI } = await import('../api');
            const res = await projectShareLinksAPI.create(project.id, shareSettings);
            const viewLink = `${window.location.origin}/shared/${project.id}/${res.token}`;
            const editLink = `${window.location.origin}/shared/${project.id}/${res.token}?edit_token=${encodeURIComponent(res.edit_token)}`;
            setShareLink(viewLink);
            setShareEditLink(shareSettings.allowEdit ? editLink : '');
        } catch (e) {
            console.error(e);
            alert('Gagal membuat link share.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (v: string) => {
        navigator.clipboard.writeText(v);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold">🔗 Share Project</h3>
                            <p className="text-green-100 mt-1">{project.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">📋 Customize What to Share</h4>
                        <div className="space-y-3">
                            {[
                                { key: 'showRevenue', label: '💰 Revenue & Ringkasan', desc: 'Total revenue, progress ringkas' },
                                { key: 'showFinancial', label: '📊 Analisis Finansial', desc: 'Laporan & analisis finansial' },
                                { key: 'showDaily', label: '📅 Daily Reports', desc: 'Progress harian' },
                                { key: 'showWeekly', label: '📈 Weekly Summary', desc: 'Rekap mingguan' },
                                { key: 'showMonthly', label: '📆 Monthly Summary', desc: 'Rekap bulanan' },
                                { key: 'showWorkers', label: '👷 Data Pekerja', desc: 'Jumlah pekerja' },
                                { key: 'showEquipment', label: '🚜 Data Alat', desc: 'Pemakaian alat' },
                                { key: 'showRekapitulasi', label: '📋 Rekapitulasi Cut & Fill', desc: 'Tabel rekap harian/bulanan (bisa diedit lewat link edit)' },
                                { key: 'allowEdit', label: '✏️ Izinkan Akses Edit', desc: 'Jika nonaktif, link edit tidak dipakai' },
                                { key: 'showVolumeTarget', label: '🎯 Target Volume', desc: 'Tampilkan target di progress/volume' },
                                { key: 'showVolumeActual', label: '✅ Aktual Volume', desc: 'Tampilkan aktual di progress/volume' },
                            ].map((item) => (
                                <label key={item.key} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={shareSettings[item.key as keyof typeof shareSettings]}
                                        onChange={(e) => setShareSettings({ ...shareSettings, [item.key]: e.target.checked })}
                                        className="mt-1 mr-3 w-5 h-5 text-green-500 rounded focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-800">{item.label}</div>
                                        <div className="text-sm text-gray-600">{item.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {!shareLink ? (
                        <button
                            onClick={generateShareLink}
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 shadow-lg"
                        >
                            {isGenerating ? '⏳ Generating...' : '🔗 Generate Share Link'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="text-sm font-semibold text-green-800 mb-2">✅ Share Link Generated!</div>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-4 py-2 border rounded-lg bg-white text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(shareLink)}
                                        className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                                {shareEditLink && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shareEditLink}
                                            readOnly
                                            className="flex-1 px-4 py-2 border rounded-lg bg-white text-sm"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(shareEditLink)}
                                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-all"
                                        >
                                            ✏️ Copy Edit Link
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <strong>⚠️ Catatan:</strong> Link pertama hanya untuk lihat. Link edit hanya aktif jika opsi "Izinkan Akses Edit" dicentang.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
