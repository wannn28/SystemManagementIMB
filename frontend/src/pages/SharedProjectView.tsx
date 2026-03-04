import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { projectsAPI } from '../api';
import { Project } from '../types/BasicTypes';

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
    const { projectId } = useParams<{ projectId: string; token: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [showTotals] = useState(true);
    const [shareSettings] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return {
            showRevenue: params.has('r'),
            showFinancial: params.has('f'),
            showDaily: params.has('d'),
            showWeekly: params.has('w'),
            showMonthly: params.has('m'),
            showWorkers: params.has('wk'),
            showEquipment: params.has('e'),
        };
    });

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            // TODO: Add token validation in backend
            const project = await projectsAPI.getProjectById(Number(projectId));
            setProject(project);
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
                    <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} name="Actual Volume" />
                    <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} name="Target" />
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
                        <p className="text-sm text-gray-600">Shared Project View (Read-Only)</p>
                    </div>
                </div>
            </div>

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

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {shareSettings.showRevenue && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
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
                                <div className="h-64">
                                    <RevenueChart data={getAggregatedRevenueData(project, timeRange)} timeRange={timeRange} showTotals={showTotals} />
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
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
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Plan</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actual</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target</th>
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
                                                    <td className="px-4 py-3 text-sm text-gray-700">{report.aktual?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{report.targetVolume?.toLocaleString()}</td>
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
                </div>
            </div>
        </div>
    );
};

export default SharedProjectView;
