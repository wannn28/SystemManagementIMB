import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { projectsAPI, projectExpensesAPI, projectIncomesAPI, ProjectExpense, ProjectIncome, ProjectFinancialSummary, financeAPI } from '../api';
import { Project } from '../types/BasicTypes';
import EditReportForm from './EditReportForm';

interface ProjectDetailProps {
    isCollapsed: boolean;
}

// Helper functions for chart data
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
            // Use the latest (cumulative) values
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
            // Use the latest (cumulative) values
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

const getProgress = (project: Project): number => {
    if (!project.totalVolume || project.totalVolume === 0) return 0;
    const currentVolume = project.reports?.daily?.length > 0
        ? project.reports.daily[project.reports.daily.length - 1].volume || 0
        : 0;
    return (currentVolume / project.totalVolume) * 100;
};

const RevenueChart = ({ data, timeRange, showTotals }: { data: any[], timeRange: string, showTotals: boolean }) => {
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

const ProjectDetail: React.FC<ProjectDetailProps> = ({ isCollapsed }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditReports, setShowEditReports] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [showTotals, setShowTotals] = useState(true);
    
    // Financial data
    const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
    const [projectIncomes, setProjectIncomes] = useState<ProjectIncome[]>([]);
    const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary | null>(null);

    useEffect(() => {
        if (id) {
            fetchProject();
            fetchFinancialData();
        }
    }, [id]);

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
                projectExpensesAPI.getExpensesByProject(Number(id)),
                projectIncomesAPI.getIncomesByProject(Number(id)),
                financeAPI.getProjectFinancialSummary(Number(id))
            ]);
            setProjectExpenses(expenses);
            setProjectIncomes(incomes);
            setFinancialSummary(summary);
        } catch (error) {
            console.error('Failed to fetch financial data:', error);
        }
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

    if (loading) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl">Project not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300 p-8`}>
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
                            
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Total Revenue</p>
                                    <p className="text-white text-lg font-bold">Rp {(project.totalRevenue / 1000000).toFixed(1)}M</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Progress</p>
                                    <p className="text-white text-lg font-bold">{getProgress(project).toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                    <p className="text-blue-100 text-xs mb-1">Total Volume</p>
                                    <p className="text-white text-lg font-bold">{(project.totalVolume / 1000).toFixed(1)}K</p>
                                </div>
                            </div>
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
                                </div>
                                <div className="h-64 bg-gradient-to-br from-blue-50/30 to-transparent rounded-xl p-2">
                                    <RevenueChart
                                        data={getAggregatedRevenueData(project, timeRange)}
                                        timeRange={timeRange}
                                        showTotals={showTotals}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Volume Progress Chart */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10">
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
                                </div>
                                <div className="h-64 bg-gradient-to-br from-green-50/30 to-transparent rounded-xl p-2">
                                    <ProgressChart data={getProgressData(project, timeRange)} timeRange={timeRange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    {financialSummary && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Financial Summary</h3>
                                    <p className="text-sm text-gray-500">Income, Expenses & Profit</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                    <div className="text-sm text-red-600 font-semibold mb-1">Total Expenses</div>
                                    <div className="text-xl font-bold text-red-700">Rp {financialSummary.totalExpenses?.toLocaleString()}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div className="text-sm text-green-600 font-semibold mb-1">Total Income</div>
                                    <div className="text-xl font-bold text-green-700">Rp {financialSummary.totalIncome?.toLocaleString()}</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div className="text-sm text-purple-600 font-semibold mb-1">Net Profit</div>
                                    <div className="text-xl font-bold text-purple-700">
                                        Rp {((financialSummary.totalIncome || 0) - (financialSummary.totalExpenses || 0)).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Target</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume</th>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {project.reports?.daily && project.reports.daily.length > 10 && (
                                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-b-xl">
                                        Showing last 10 of {project.reports.daily.length} records
                                    </div>
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
                    </div>
                </div>
            </div>

            {/* Edit Reports Modal */}
            {showEditReports && (
                <EditReportForm
                    project={project}
                    onSave={handleSaveReports}
                />
            )}

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    project={project}
                    onClose={() => setShowShareModal(false)}
                />
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
    });
    const [shareLink, setShareLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateShareLink = () => {
        setIsGenerating(true);
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const link = `${window.location.origin}/shared/${project.id}/${token}`;
        setShareLink(link);
        
        setTimeout(() => setIsGenerating(false), 500);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
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
                                { key: 'showRevenue', label: '💰 Revenue & Financial Data', desc: 'Total revenue, amount paid' },
                                { key: 'showFinancial', label: '📊 Financial Analysis', desc: 'Detailed financial reports and analysis' },
                                { key: 'showDaily', label: '📅 Daily Reports', desc: 'Daily progress and activities' },
                                { key: 'showWeekly', label: '📈 Weekly Summary', desc: 'Weekly aggregated data' },
                                { key: 'showMonthly', label: '📆 Monthly Summary', desc: 'Monthly performance metrics' },
                                { key: 'showWorkers', label: '👷 Workers Data', desc: 'Worker counts and details' },
                                { key: 'showEquipment', label: '🚜 Equipment Data', desc: 'Equipment usage and details' },
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
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-4 py-2 border rounded-lg bg-white text-sm"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <strong>⚠️ Note:</strong> Anyone with this link can view the selected project data. 
                                The link is view-only and does not allow editing.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
