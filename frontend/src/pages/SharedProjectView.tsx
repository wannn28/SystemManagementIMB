import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { projectShareLinksAPI } from '../api';
import { Project } from '../types/BasicTypes';
import RekapitulasiCutFill from './RekapitulasiCutFill';

// Helper functions (same as ProjectDetail)
const getAggregatedRevenueData = (project: Project, timeRange: string) => {
    const dailyData = project.reports.daily;

    const groupIntoWeeks = () => {
        const weeksMap = new Map<string, any>();
        const projectStart = new Date(project.startDate);

        dailyData.forEach(day => {
            const dayDate = new Date(day.date);
            const diffTime = dayDate.getTime() - projectStart.getTime();
            const weekNumber = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

            const weekKey = `Week ${weekNumber}`;
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, {
                    weekLabel: `Week ${weekNumber}`,
                    weekNumber: weekNumber,
                    weekStart: new Date(projectStart.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000),
                    revenue: 0,
                    paid: 0,
                });
            }

            const week = weeksMap.get(weekKey);
            week.revenue += day.revenue || 0;
            week.paid += day.paid || 0;
            week.totalRevenue = project.totalRevenue;
        });

        return Array.from(weeksMap.values());
    };

    const groupIntoMonths = () => {
        const monthsMap = new Map<string, any>();

        dailyData.forEach(day => {
            const dayDate = new Date(day.date);
            const monthKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}`;

            if (!monthsMap.has(monthKey)) {
                const monthDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
                monthsMap.set(monthKey, {
                    monthLabel: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
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

        return Array.from(monthsMap.values());
    };

    switch (timeRange) {
        case 'weekly':
            return groupIntoWeeks();
        case 'monthly':
            return groupIntoMonths();
        default:
            return dailyData.map(day => ({
                date: new Date(day.date),
                revenue: day.revenue || 0,
                paid: day.paid || 0,
                totalRevenue: project.totalRevenue,
            }));
    }
};

const getProgressData = (project: Project, timeRange: string) => {
    const dailyData = project.reports.daily;

    const groupIntoWeeks = () => {
        const weeksMap = new Map<string, any>();
        const projectStart = new Date(project.startDate);

        dailyData.forEach(day => {
            const dayDate = new Date(day.date);
            const diffTime = dayDate.getTime() - projectStart.getTime();
            const weekNumber = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

            const weekKey = `Week ${weekNumber}`;
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, {
                    weekLabel: `Week ${weekNumber}`,
                    weekNumber: weekNumber,
                    weekStart: new Date(projectStart.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000),
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
            const monthKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}`;

            if (!monthsMap.has(monthKey)) {
                const monthDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
                monthsMap.set(monthKey, {
                    monthLabel: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
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
            return dailyData.map(day => ({
                dateLabel: new Date(day.date).toLocaleDateString(),
                date: new Date(day.date),
                volume: day.volume || 0,
                target: day.targetVolume || 0,
                totalVolume: project.totalVolume,
            }));
    }
};

const SharedProjectView: React.FC = () => {
    const { token } = useParams<{ projectId: string; token: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [showTotals] = useState(true);
    const [expandedChart, setExpandedChart] = useState<'revenue' | 'volume' | null>(null);
    const [analisisView, setAnalisisView] = useState<'semua' | 'progress' | 'keduanya'>('progress');
    const fullscreenChartRef = useRef<HTMLDivElement>(null);
    const editToken = new URLSearchParams(window.location.search).get('edit_token') || '';
    const [shareSettings, setShareSettings] = useState(() => ({
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
        syncToSmartNota: true,
        smartNotaApiKey: '',
    }));
    const canUseEditToken = !!editToken && shareSettings.allowEdit;

    useEffect(() => {
        if (token) fetchProject();
    }, [token]);

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
            const data = await projectShareLinksAPI.getSharedProject(String(token));
            setProject(data.project as Project);
            // Merge defaults with saved settings (so older links still work)
            setShareSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
        } catch (error) {
            console.error('Failed to fetch project:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h1>
                    <p className="text-gray-600">The project you're looking for doesn't exist or the link is invalid.</p>
                </div>
            </div>
        );
    }

    const RevenueChart = ({ data, timeRange }: { data: any[]; timeRange: string; showTotals: boolean }) => {
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
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} name="Paid" />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const ProgressChart = ({ data, timeRange }: { data: any[], timeRange: string }) => {
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
                    {shareSettings.showVolumeActual && (
                        <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} name="Aktual" />
                    )}
                    {shareSettings.showVolumeTarget && (
                        <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} name="Target" />
                    )}
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
                        <p className="text-sm text-gray-600">Tampilan Project yang Dishare (Read-Only)</p>
                    </div>
                </div>
            </div>

            {/* Edit panel (only if edit_token present and allowed by share setting) */}
            {canUseEditToken && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Pengaturan tampilan (Edit)</h2>
                            <p className="text-sm text-gray-500">Perubahan ini akan tersimpan di link ini.</p>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    await projectShareLinksAPI.updateSettings(String(token), editToken, shareSettings);
                                    alert('Pengaturan berhasil disimpan.');
                                } catch (e) {
                                    console.error(e);
                                    alert('Gagal menyimpan pengaturan.');
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                        >
                            Simpan Pengaturan
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {[
                            { key: 'showRevenue', label: 'Revenue & Ringkasan' },
                            { key: 'showFinancial', label: 'Analisis Finansial' },
                            { key: 'showDaily', label: 'Daily Reports' },
                            { key: 'showWeekly', label: 'Weekly Summary' },
                            { key: 'showMonthly', label: 'Monthly Summary' },
                            { key: 'showWorkers', label: 'Workers Data' },
                            { key: 'showEquipment', label: 'Equipment Data' },
                            { key: 'showRekapitulasi', label: 'Rekapitulasi Cut & Fill' },
                            { key: 'allowEdit', label: 'Izinkan Akses Edit' },
                            { key: 'showVolumeTarget', label: 'Progress: tampilkan Target Volume' },
                            { key: 'showVolumeActual', label: 'Progress: tampilkan Aktual Volume' },
                        ].map((item) => (
                            <label key={item.key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(shareSettings as any)[item.key]}
                                    onChange={(e) => setShareSettings((prev: any) => ({ ...prev, [item.key]: e.target.checked }))}
                                    className="mt-1 w-5 h-5"
                                />
                                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Project Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 mb-6">
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white drop-shadow-md">{project.name}</h2>
                                <span className="text-blue-100 text-sm font-medium">{project.description}</span>
                            </div>
                        </div>
                        
                        {shareSettings.showRevenue && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Total Revenue</p>
                                    <p className="text-white text-lg font-bold">Rp {(project.totalRevenue / 1000000).toFixed(1)}M</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Progress</p>
                                    <p className="text-white text-lg font-bold">
                                        {project.totalVolume && project.reports?.daily?.length > 0 
                                            ? ((project.reports.daily[project.reports.daily.length - 1].volume / project.totalVolume) * 100).toFixed(1)
                                            : 0}%
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Total Volume</p>
                                    <p className="text-white text-lg font-bold">{(project.totalVolume / 1000).toFixed(1)}K {project.unit}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Time Range */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
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
                                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Analisis Section */}
                    {shareSettings.showFinancial && (
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-2xl">📊</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">Analisis</h3>
                                    <p className="text-sm text-gray-500">Pilih tampilan: Semua, Progress Saat Ini, atau Keduanya</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mb-6">
                                {(['semua', 'progress', 'keduanya'] as const).map((view) => (
                                    <button
                                        key={view}
                                        type="button"
                                        onClick={() => setAnalisisView(view)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            analisisView === view
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {view === 'semua' ? 'Semua' : view === 'progress' ? 'Progress Saat Ini' : 'Keduanya'}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(analisisView === 'semua' || analisisView === 'keduanya') && (
                                        <>
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <p className="text-xs text-gray-600 mb-1">Volume Saat Ini</p>
                                                <p className="text-xl font-bold text-blue-600">
                                                    {project.reports?.daily?.length > 0 
                                                        ? project.reports.daily[project.reports.daily.length - 1].volume.toFixed(1)
                                                        : '0'} M³
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <p className="text-xs text-gray-600 mb-1">Target Volume Saat Ini</p>
                                                <p className="text-xl font-bold text-amber-600">
                                                    {project.totalVolume?.toFixed(1) || '0'} M³
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    {(analisisView === 'progress' || analisisView === 'keduanya') && (
                                        <>
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <p className="text-xs text-gray-600 mb-1">Deviasi Saat Ini (Actual - Target)</p>
                                                <p className={`text-xl font-bold ${
                                                    project.reports?.daily?.length > 0 && project.totalVolume
                                                        ? (project.reports.daily[project.reports.daily.length - 1].volume - project.totalVolume) >= 0 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                        : 'text-gray-600'
                                                }`}>
                                                    {project.reports?.daily?.length > 0 && project.totalVolume
                                                        ? (project.reports.daily[project.reports.daily.length - 1].volume - project.totalVolume).toFixed(1)
                                                        : '0'} M³
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <p className="text-xs text-gray-600 mb-1">Progress Saat Ini</p>
                                                <p className="text-xl font-bold text-purple-600">
                                                    {project.reports?.daily?.length > 0 && project.totalVolume
                                                        ? ((project.reports.daily[project.reports.daily.length - 1].volume / project.totalVolume) * 100).toFixed(1)
                                                        : '0'}%
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {shareSettings.showRevenue && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
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
                                <div className="h-64">
                                    <RevenueChart data={getAggregatedRevenueData(project, timeRange)} timeRange={timeRange} showTotals={showTotals} />
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
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
                            <div className="h-64">
                                <ProgressChart data={getProgressData(project, timeRange)} timeRange={timeRange} />
                            </div>
                        </div>
                    </div>

                    {/* Reports Tables */}
                    <div className="space-y-6">
                        {shareSettings.showDaily && (
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
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan</th>
                                                {shareSettings.showVolumeActual && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Aktual</th>}
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase" title="Jumlah nota / trip">Ritase</th>
                                                {shareSettings.showVolumeTarget && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target</th>}
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume</th>
                                                {shareSettings.showWorkers && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Workers</th>}
                                                {shareSettings.showEquipment && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Equipment</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {project.reports?.daily?.slice(-10).reverse().map((report, index) => (
                                                <tr key={index} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.date}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.plan?.toLocaleString()}</td>
                                                    {shareSettings.showVolumeActual && <td className="px-4 py-3 text-sm text-gray-700">{report.aktual?.toLocaleString()}</td>}
                                                    <td className="px-4 py-3 text-sm text-amber-700 font-semibold tabular-nums">{Number(report.ritase ?? 0).toLocaleString()}</td>
                                                    {shareSettings.showVolumeTarget && <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{report.targetVolume?.toLocaleString()}</td>}
                                                    <td className="px-4 py-3 text-sm text-purple-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                    {shareSettings.showWorkers && <td className="px-4 py-3 text-sm text-gray-700">{report.totalWorkers || 0}</td>}
                                                    {shareSettings.showEquipment && <td className="px-4 py-3 text-sm text-gray-700">{report.totalEquipment || 0}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {shareSettings.showWeekly && (
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
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {project.reports?.weekly?.map((report, index) => (
                                                <tr key={index} className="hover:bg-green-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.week}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.targetPlan?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.targetAktual?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-green-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {shareSettings.showMonthly && (
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
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {project.reports?.monthly?.map((report, index) => (
                                                <tr key={index} className="hover:bg-purple-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.month}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.targetPlan?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.targetAktual?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-purple-600 font-bold">{report.volume?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {shareSettings.showRekapitulasi && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                            <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Rekapitulasi Cut &amp; Fill</h3>
                                    <p className="text-xs text-gray-500">
                                        {editToken
                                            ? (shareSettings.allowEdit
                                                ? 'Dengan link edit: ubah jumlah pekerja/alat per hari, tambah jenis alat, lalu simpan.'
                                                : 'Akses edit dimatikan oleh pemilik link.')
                                            : 'Tampilan baca saja.'}
                                    </p>
                                </div>
                            </div>
                            <RekapitulasiCutFill
                                embeddedProject={project}
                                onEmbeddedProjectChange={setProject}
                                shareToken={String(token)}
                                editToken={canUseEditToken ? editToken : ''}
                                allowPublicEdit={shareSettings.allowEdit}
                                linkSettings={{
                                    syncToSmartNota: shareSettings.syncToSmartNota,
                                    smartNotaApiKey: shareSettings.smartNotaApiKey,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Chart Portal */}
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
                                data={getAggregatedRevenueData(project, timeRange)}
                                timeRange={timeRange}
                                showTotals={showTotals}
                            />
                        )}
                        {expandedChart === 'volume' && (
                            <ProgressChart
                                data={getProgressData(project, timeRange)}
                                timeRange={timeRange}
                            />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SharedProjectView;
