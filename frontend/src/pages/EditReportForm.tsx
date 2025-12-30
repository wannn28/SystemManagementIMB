import React, { useState } from 'react';
import { Project } from '../types/BasicTypes';

interface EditReportsProps {
    project: Project;
    onSave: (updatedProject: Project) => void;
}

const EditReports: React.FC<EditReportsProps> = ({ project, onSave }) => {
    const [dailyReports, setDailyReports] = useState(project.reports.daily);
    const [weeklyReports, setWeeklyReports] = useState(project.reports.weekly);
    const [monthlyReports, setMonthlyReports] = useState(project.reports.monthly);
    const [editingDailyIndex, setEditingDailyIndex] = useState<number | null>(null);
    const [editingWeeklyIndex, setEditingWeeklyIndex] = useState<number | null>(null);
    const [editingMonthlyIndex, setEditingMonthlyIndex] = useState<number | null>(null);

    const startEditingDaily = (index: number) => {
        setEditingDailyIndex(index);
    };

    const startEditingWeekly = (index: number) => {
        setEditingWeeklyIndex(index);
    };

    const startEditingMonthly = (index: number) => {
        setEditingMonthlyIndex(index);
    };

    const handleDailyChange = (index: number, field: string, value: any) => {
        const updatedReports = [...dailyReports];
        const report = updatedReports[index];
        
        // Handle nested JSON objects (workers and equipment)
        if (field.includes('.')) {
            const [objectKey, propertyKey] = field.split('.');
            if (objectKey === 'workers' || objectKey === 'equipment') {
                const updatedObject = { ...(report as any)[objectKey] };
                updatedObject[propertyKey] = value;
                updatedReports[index] = { ...report, [objectKey]: updatedObject };
            }
        } else {
            updatedReports[index] = { ...report, [field]: value };
        }
        
        setDailyReports(updatedReports);
    };

    const handleWeeklyChange = (index: number, field: string, value: any) => {
        const updatedReports = [...weeklyReports];
        updatedReports[index] = { ...updatedReports[index], [field]: value };
        setWeeklyReports(updatedReports);
    };

    const handleMonthlyChange = (index: number, field: string, value: any) => {
        const updatedReports = [...monthlyReports];
        updatedReports[index] = { ...updatedReports[index], [field]: value };
        setMonthlyReports(updatedReports);
    };

    const addDailyReport = () => {
        setDailyReports([...dailyReports, { 
            id: 0,
            projectId: project.id,
            date: '', 
            revenue: 0, 
            paid: 0, 
            volume: 0, 
            targetVolume: 0, 
            plan: 0, 
            aktual: 0,
            // New fields for workers and equipment as JSON
            workers: {
                "Pengawas": 0,
                "Mandor": 0,
                "Supir": 0,
                "Operator": 0,
                "Pekerja": 0
            },
            equipment: {
                "Excavator": 0,
                "Dozer": 0,
                "Dumptruck": 0,
                "Loader": 0,
                "Bulldozer": 0
            },
            totalWorkers: 0,
            totalEquipment: 0,
            // New fields for images
            images: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }]);
    };

    const addWeeklyReport = () => {
        setWeeklyReports([...weeklyReports, { 
            week: '', 
            targetPlan: 0, 
            targetAktual: 0, 
            volume: 0, 
            targetVolume: 0,
            // New fields for workers and equipment
            totalWorkers: 0,
            avgWorkers: 0,
            totalEquipment: 0,
            avgEquipment: 0,
            workers: {
                "Pengawas": 0,
                "Mandor": 0,
                "Supir": 0,
                "Operator": 0,
                "Pekerja": 0
            },
            avgWorkersByType: {
                "Pengawas": 0,
                "Mandor": 0,
                "Supir": 0,
                "Operator": 0,
                "Pekerja": 0
            },
            equipment: {
                "Excavator": 0,
                "Dozer": 0,
                "Dumptruck": 0,
                "Loader": 0,
                "Bulldozer": 0
            },
            avgEquipmentByType: {
                "Excavator": 0,
                "Dozer": 0,
                "Dumptruck": 0,
                "Loader": 0,
                "Bulldozer": 0
            }
        }]);
    };

    const addMonthlyReport = () => {
        setMonthlyReports([...monthlyReports, { 
            month: '', 
            targetPlan: 0, 
            targetAktual: 0, 
            volume: 0, 
            targetVolume: 0,
            // New fields for workers and equipment
            totalWorkers: 0,
            avgWorkers: 0,
            totalEquipment: 0,
            avgEquipment: 0,
            workers: {
                "Pengawas": 0,
                "Mandor": 0,
                "Supir": 0,
                "Operator": 0,
                "Pekerja": 0
            },
            avgWorkersByType: {
                "Pengawas": 0,
                "Mandor": 0,
                "Supir": 0,
                "Operator": 0,
                "Pekerja": 0
            },
            equipment: {
                "Excavator": 0,
                "Dozer": 0,
                "Dumptruck": 0,
                "Loader": 0,
                "Bulldozer": 0
            },
            avgEquipmentByType: {
                "Excavator": 0,
                "Dozer": 0,
                "Dumptruck": 0,
                "Loader": 0,
                "Bulldozer": 0
            }
        }]);
    };

    const deleteDailyReport = (index: number) => {
        const updatedReports = dailyReports.filter((_, i) => i !== index);
        setDailyReports(updatedReports);
    };

    const deleteWeeklyReport = (index: number) => {
        const updatedReports = weeklyReports.filter((_, i) => i !== index);
        setWeeklyReports(updatedReports);
    };

    const deleteMonthlyReport = (index: number) => {
        const updatedReports = monthlyReports.filter((_, i) => i !== index);
        setMonthlyReports(updatedReports);
    };

    // Function to calculate weekly and monthly summaries from daily reports
    const calculateWeeklyAndMonthlySummaries = () => {
        // Calculate weekly summaries
        const weeklySummaries = weeklyReports.map(weeklyReport => {
            // Find daily reports for this week
            const weekDailyReports = dailyReports.filter(daily => {
                // Simple week matching - you might want to improve this logic
                return daily.date.startsWith(weeklyReport.week.substring(0, 4)); // Match year
            });

            if (weekDailyReports.length === 0) return weeklyReport;

            // Calculate totals and averages
            const totalWorkers = weekDailyReports.reduce((sum, daily) => sum + (daily.totalWorkers || 0), 0);
            const avgWorkers = weekDailyReports.length > 0 ? totalWorkers / weekDailyReports.length : 0;
            
            const totalEquipment = weekDailyReports.reduce((sum, daily) => sum + (daily.totalEquipment || 0), 0);
            const avgEquipment = weekDailyReports.length > 0 ? totalEquipment / weekDailyReports.length : 0;

            // Calculate worker totals by type
            const workers = {
                "Pengawas": weekDailyReports.reduce((sum, daily) => sum + (daily.workers?.Pengawas || 0), 0),
                "Mandor": weekDailyReports.reduce((sum, daily) => sum + (daily.workers?.Mandor || 0), 0),
                "Supir": weekDailyReports.reduce((sum, daily) => sum + (daily.workers?.Supir || 0), 0),
                "Operator": weekDailyReports.reduce((sum, daily) => sum + (daily.workers?.Operator || 0), 0),
                "Pekerja": weekDailyReports.reduce((sum, daily) => sum + (daily.workers?.Pekerja || 0), 0)
            };

            // Calculate equipment totals by type
            const equipment = {
                "Excavator": weekDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Excavator || 0), 0),
                "Dozer": weekDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Dozer || 0), 0),
                "Dumptruck": weekDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Dumptruck || 0), 0),
                "Loader": weekDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Loader || 0), 0),
                "Bulldozer": weekDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Bulldozer || 0), 0)
            };

            return {
                ...weeklyReport,
                totalWorkers,
                avgWorkers: Math.round(avgWorkers * 100) / 100,
                totalEquipment,
                avgEquipment: Math.round(avgEquipment * 100) / 100,
                workers,
                equipment
            };
        });

        // Calculate monthly summaries
        const monthlySummaries = monthlyReports.map(monthlyReport => {
            // Find daily reports for this month
            const monthDailyReports = dailyReports.filter(daily => {
                // Simple month matching - you might want to improve this logic
                return daily.date.startsWith(monthlyReport.month.substring(0, 7)); // Match year-month
            });

            if (monthDailyReports.length === 0) return monthlyReport;

            // Calculate totals and averages
            const totalWorkers = monthDailyReports.reduce((sum, daily) => sum + (daily.totalWorkers || 0), 0);
            const avgWorkers = monthDailyReports.length > 0 ? totalWorkers / monthDailyReports.length : 0;
            
            const totalEquipment = monthDailyReports.reduce((sum, daily) => sum + (daily.totalEquipment || 0), 0);
            const avgEquipment = monthDailyReports.length > 0 ? totalEquipment / monthDailyReports.length : 0;

            // Calculate worker totals by type
            const workers = {
                "Pengawas": monthDailyReports.reduce((sum, daily) => sum + (daily.workers?.Pengawas || 0), 0),
                "Mandor": monthDailyReports.reduce((sum, daily) => sum + (daily.workers?.Mandor || 0), 0),
                "Supir": monthDailyReports.reduce((sum, daily) => sum + (daily.workers?.Supir || 0), 0),
                "Operator": monthDailyReports.reduce((sum, daily) => sum + (daily.workers?.Operator || 0), 0),
                "Pekerja": monthDailyReports.reduce((sum, daily) => sum + (daily.workers?.Pekerja || 0), 0)
            };

            // Calculate equipment totals by type
            const equipment = {
                "Excavator": monthDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Excavator || 0), 0),
                "Dozer": monthDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Dozer || 0), 0),
                "Dumptruck": monthDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Dumptruck || 0), 0),
                "Loader": monthDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Loader || 0), 0),
                "Bulldozer": monthDailyReports.reduce((sum, daily) => sum + (daily.equipment?.Bulldozer || 0), 0)
            };

            return {
                ...monthlyReport,
                totalWorkers,
                avgWorkers: Math.round(avgWorkers * 100) / 100,
                totalEquipment,
                avgEquipment: Math.round(avgEquipment * 100) / 100,
                workers,
                equipment
            };
        });

        return { weeklySummaries, monthlySummaries };
    };

    const handleSave = () => {
        // Calculate summaries before saving
        const { weeklySummaries, monthlySummaries } = calculateWeeklyAndMonthlySummaries();
        
        const updatedProject = {
            ...project,
            reports: {
                daily: dailyReports,
                weekly: weeklySummaries,
                monthly: monthlySummaries,
            },
        };
        onSave(updatedProject);
    };

    const renderDailyForm = (index: number) => {
        const report = dailyReports[index];
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold">📅 Edit Daily Report</h3>
                                <p className="text-blue-100 mt-1">Update project daily report data</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingDailyIndex(null)}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200"
                            >
                                ❌ Close
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <form className="space-y-8">
                            {/* Data Input Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Basic Data Column */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <div className="flex items-center mb-6">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-white font-bold">📊</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800">Data Dasar</h4>
                                            <p className="text-sm text-gray-600">Basic project information</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Tanggal</label>
                                            <input
                                                type="date"
                                                value={report.date}
                                                onChange={(e) => handleDailyChange(index, 'date', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Revenue</label>
                                            <input
                                                type="number"
                                                value={report.revenue}
                                                onChange={(e) => handleDailyChange(index, 'revenue', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">💳 Paid</label>
                                            <input
                                                type="number"
                                                value={report.paid}
                                                onChange={(e) => handleDailyChange(index, 'paid', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📦 Volume</label>
                                            <input
                                                type="number"
                                                value={report.volume}
                                                onChange={(e) => handleDailyChange(index, 'volume', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Target Volume</label>
                                            <input
                                                type="number"
                                                value={report.targetVolume}
                                                onChange={(e) => handleDailyChange(index, 'targetVolume', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Plan</label>
                                            <input
                                                type="number"
                                                value={report.plan}
                                                onChange={(e) => handleDailyChange(index, 'plan', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">✅ Aktual</label>
                                            <input
                                                type="number"
                                                value={report.aktual}
                                                onChange={(e) => handleDailyChange(index, 'aktual', Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Workers Column */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center mb-6">
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-white font-bold">👷</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800">Jumlah Pekerja</h4>
                                            <p className="text-sm text-gray-600">Worker management</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {/* Existing Worker Types */}
                                        {Object.entries(report.workers || {}).map(([workerType, count]) => (
                                            <div key={workerType} className="bg-white rounded-lg p-4 border border-green-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-semibold text-gray-700">
                                                        {workerType}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedWorkers = { ...report.workers };
                                                            delete updatedWorkers[workerType];
                                                            handleDailyChange(index, 'workers', updatedWorkers);
                                                        }}
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-full text-xs transition-all duration-200"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={count}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        const updatedWorkers = { ...report.workers };
                                                        updatedWorkers[workerType] = value;
                                                        handleDailyChange(index, 'workers', updatedWorkers);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                        
                                        {/* Add New Worker Type */}
                                        <div className="bg-white rounded-lg p-4 border border-green-200">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Jenis pekerja baru"
                                                    id={`newWorkerType-${index}`}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById(`newWorkerType-${index}`) as HTMLInputElement;
                                                        const newType = input.value.trim();
                                                        if (newType && !report.workers?.[newType]) {
                                                            const updatedWorkers = { ...report.workers, [newType]: 0 };
                                                            handleDailyChange(index, 'workers', updatedWorkers);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold"
                                                >
                                                    ➕ Add
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Total Workers Display */}
                                        <div className="bg-green-100 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-green-800">Total Pekerja:</span>
                                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                    {Object.values(report.workers || {}).reduce((sum, count) => sum + count, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Equipment Column */}
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                                    <div className="flex items-center mb-6">
                                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-white font-bold">🚜</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800">Jumlah Alat Berat</h4>
                                            <p className="text-sm text-gray-600">Heavy equipment management</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {/* Existing Equipment Types */}
                                        {Object.entries(report.equipment || {}).map(([equipmentType, count]) => (
                                            <div key={equipmentType} className="bg-white rounded-lg p-4 border border-orange-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-semibold text-gray-700">
                                                        {equipmentType}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedEquipment = { ...report.equipment };
                                                            delete updatedEquipment[equipmentType];
                                                            handleDailyChange(index, 'equipment', updatedEquipment);
                                                        }}
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-full text-xs transition-all duration-200"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={count}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        const updatedEquipment = { ...report.equipment };
                                                        updatedEquipment[equipmentType] = value;
                                                        handleDailyChange(index, 'equipment', updatedEquipment);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                        
                                        {/* Add New Equipment Type */}
                                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Jenis alat berat baru"
                                                    id={`newEquipmentType-${index}`}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById(`newEquipmentType-${index}`) as HTMLInputElement;
                                                        const newType = input.value.trim();
                                                        if (newType && !report.equipment?.[newType]) {
                                                            const updatedEquipment = { ...report.equipment, [newType]: 0 };
                                                            handleDailyChange(index, 'equipment', updatedEquipment);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold"
                                                >
                                                    ➕ Add
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Total Equipment Display */}
                                        <div className="bg-orange-100 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-orange-800">Total Alat Berat:</span>
                                                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                    {Object.values(report.equipment || {}).reduce((sum, count) => sum + count, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-white font-bold">📷</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-800">Gambar dan Keterangan</h4>
                                        <p className="text-sm text-gray-600">Upload and manage project images</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Upload Section */}
                                    <div className="bg-white rounded-lg p-6 border border-purple-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">📤 Upload Gambar</label>
                                        <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-all duration-200">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    const newImages = files.map((file) => ({
                                                        id: 0,
                                                        reportDailyId: report.id,
                                                        imagePath: URL.createObjectURL(file),
                                                        description: '',
                                                        createdAt: Date.now(),
                                                        updatedAt: Date.now()
                                                    }));
                                                    handleDailyChange(index, 'images', [...(report.images || []), ...newImages]);
                                                }}
                                                className="hidden"
                                                id={`file-upload-${index}`}
                                            />
                                            <label htmlFor={`file-upload-${index}`} className="cursor-pointer">
                                                <div className="text-purple-500 text-4xl mb-2">📁</div>
                                                <p className="text-gray-600 font-medium">Click to upload images</p>
                                                <p className="text-gray-500 text-sm mt-1">Support multiple images</p>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* Display uploaded images */}
                                    {report.images?.length > 0 && (
                                        <div className="bg-white rounded-lg p-6 border border-purple-200">
                                            <h5 className="font-semibold text-gray-700 mb-4 flex items-center">
                                                📸 Gambar yang Diupload ({report.images.length})
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {report.images?.map((image, imgIndex) => (
                                                    <div key={imgIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <div className="relative mb-4">
                                                            <img 
                                                                src={image.imagePath} 
                                                                alt={`Image ${imgIndex + 1}`}
                                                                className="w-full h-48 object-cover rounded-lg border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = report.images?.filter((_, i) => i !== imgIndex) || [];
                                                                    handleDailyChange(index, 'images', newImages);
                                                                }}
                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-200"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                📝 Keterangan Gambar {imgIndex + 1}:
                                                            </label>
                                                            <textarea
                                                                value={image.description}
                                                                onChange={(e) => {
                                                                    const updatedImages = [...(report.images || [])];
                                                                    updatedImages[imgIndex] = {
                                                                        ...updatedImages[imgIndex],
                                                                        description: e.target.value
                                                                    };
                                                                    handleDailyChange(index, 'images', updatedImages);
                                                                }}
                                                                placeholder="Masukkan keterangan untuk gambar ini..."
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-20 resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 rounded-b-2xl">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Last updated: {new Date().toLocaleDateString()}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingDailyIndex(null)}
                                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
                                >
                                    ❌ Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingDailyIndex(null)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                                >
                                    💾 Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderWeeklyForm = (index: number) => {
        const report = weeklyReports[index];
        return (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                    <h3 className="text-lg font-semibold mb-4">Edit Weekly Report</h3>
                    <form>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Kolom 1 - Basic Data */}
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-700">Data Dasar</h4>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Week</label>
                                    <input
                                        type="text"
                                        value={report.week}
                                        onChange={(e) => handleWeeklyChange(index, 'week', e.target.value)}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Plan</label>
                                    <input
                                        type="number"
                                        value={report.targetPlan}
                                        onChange={(e) => handleWeeklyChange(index, 'targetPlan', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Aktual</label>
                                    <input
                                        type="number"
                                        value={report.targetAktual}
                                        onChange={(e) => handleWeeklyChange(index, 'targetAktual', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Volume</label>
                                    <input
                                        type="number"
                                        value={report.volume}
                                        onChange={(e) => handleWeeklyChange(index, 'volume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Volume</label>
                                    <input
                                        type="number"
                                        value={report.targetVolume}
                                        onChange={(e) => handleWeeklyChange(index, 'targetVolume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                            </div>

                            {/* Kolom 2 - Workers Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-700">Ringkasan Pekerja</h4>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Total Pekerja</label>
                                    <input
                                        type="number"
                                        value={report.totalWorkers || 0}
                                        onChange={(e) => handleWeeklyChange(index, 'totalWorkers', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Rata-rata Pekerja</label>
                                    <input
                                        type="number"
                                        value={report.avgWorkers || 0}
                                        onChange={(e) => handleWeeklyChange(index, 'avgWorkers', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                
                                {/* Worker Type Details */}
                                <h5 className="font-medium text-gray-700 mb-2 mt-4">Detail Pekerja:</h5>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Pengawas (Total)</label>
                                        <input
                                            type="number"
                                            value={report.workers?.Pengawas || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'workers.Pengawas', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Mandor (Total)</label>
                                        <input
                                            type="number"
                                            value={report.workers?.Mandor || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'workers.Mandor', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Supir (Total)</label>
                                        <input
                                            type="number"
                                            value={report.workers?.Supir || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'workers.Supir', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Operator (Total)</label>
                                        <input
                                            type="number"
                                            value={report.workers?.Operator || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'workers.Operator', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Pekerja (Total)</label>
                                        <input
                                            type="number"
                                            value={report.workers?.Pekerja || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'workers.Pekerja', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Kolom 3 - Equipment Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-700">Ringkasan Alat Berat</h4>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Total Alat Berat</label>
                                    <input
                                        type="number"
                                        value={report.totalEquipment || 0}
                                        onChange={(e) => handleWeeklyChange(index, 'totalEquipment', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Rata-rata Alat Berat</label>
                                    <input
                                        type="number"
                                        value={report.avgEquipment || 0}
                                        onChange={(e) => handleWeeklyChange(index, 'avgEquipment', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                
                                {/* Equipment Type Details */}
                                <h5 className="font-medium text-gray-700 mb-2 mt-4">Detail Alat Berat:</h5>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Excavator (Total)</label>
                                        <input
                                            type="number"
                                            value={report.equipment?.Excavator || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'equipment.Excavator', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Dozer (Total)</label>
                                        <input
                                            type="number"
                                            value={report.equipment?.Dozer || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'equipment.Dozer', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Dumptruck (Total)</label>
                                        <input
                                            type="number"
                                            value={report.equipment?.Dumptruck || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'equipment.Dumptruck', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Loader (Total)</label>
                                        <input
                                            type="number"
                                            value={report.equipment?.Loader || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'equipment.Loader', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Bulldozer (Total)</label>
                                        <input
                                            type="number"
                                            value={report.equipment?.Bulldozer || 0}
                                            onChange={(e) => handleWeeklyChange(index, 'equipment.Bulldozer', Number(e.target.value))}
                                            className="border rounded w-full p-1 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Save dan Cancel */}
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => setEditingWeeklyIndex(null)}
                                className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingWeeklyIndex(null)}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    const renderMonthlyForm = (index: number) => {
        const report = monthlyReports[index];
        return (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                    <h3 className="text-lg font-semibold mb-4">Edit Monthly Report</h3>
                    <form>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Kolom Kiri */}
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Month</label>
                                    <input
                                        type="text"
                                        value={report.month}
                                        onChange={(e) => handleMonthlyChange(index, 'month', e.target.value)}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Plan</label>
                                    <input
                                        type="number"
                                        value={report.targetPlan}
                                        onChange={(e) => handleMonthlyChange(index, 'targetPlan', Number(e.target.value))
                                        }
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                            </div>

                            {/* Kolom Kanan */}
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Aktual</label>
                                    <input
                                        type="number"
                                        value={report.targetAktual}
                                        onChange={(e) => handleMonthlyChange(index, 'targetAktual', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Volume</label>
                                    <input
                                        type="number"
                                        value={report.volume}
                                        onChange={(e) => handleMonthlyChange(index, 'volume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Volume</label>
                                    <input
                                        type="number"
                                        value={report.targetVolume}
                                        onChange={(e) => handleMonthlyChange(index, 'targetVolume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tombol Save dan Cancel */}
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => setEditingMonthlyIndex(null)}
                                className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingMonthlyIndex(null)}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Edit Reports</h3>
                            <p className="text-gray-600 mt-1">Project: {project.name}</p>
                        </div>
                        <button 
                            onClick={handleSave} 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                        >
                            💾 Save Changes
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Daily Reports Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800 flex items-center">
                                    📅 Daily Reports
                                    <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {dailyReports.length} reports
                                    </span>
                                </h4>
                                <p className="text-gray-600 mt-1">Manage daily project reports and data</p>
                            </div>
                            <button 
                                onClick={addDailyReport} 
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md flex items-center"
                            >
                                ➕ Add Daily Report
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Volume</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Workers</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipment</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Images</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dailyReports.map((report, index) => (
                                        <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.date || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">${report.revenue?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">${report.paid?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.volume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetVolume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.plan?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.aktual?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalWorkers || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalEquipment || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {report.images?.length > 0 ? (
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                                        📷 {report.images.length}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No images</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => startEditingDaily(index)} 
                                                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-150"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteDailyReport(index)} 
                                                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-150"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Weekly Reports Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800 flex items-center">
                                    📊 Weekly Reports
                                    <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {weeklyReports.length} reports
                                    </span>
                                </h4>
                                <p className="text-gray-600 mt-1">Weekly summaries and aggregated data</p>
                            </div>
                            <button 
                                onClick={addWeeklyReport} 
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md flex items-center"
                            >
                                ➕ Add Weekly Report
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Week</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Actual</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Volume</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Volume</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Workers</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Workers</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Equipment</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Equipment</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {weeklyReports.map((report, index) => (
                                        <tr key={index} className="hover:bg-green-50 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.week || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetPlan?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetAktual?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.volume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetVolume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalWorkers || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.avgWorkers || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalEquipment || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.avgEquipment || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => startEditingWeekly(index)} 
                                                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-150"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteWeeklyReport(index)} 
                                                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-150"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Monthly Reports Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800 flex items-center">
                                    📈 Monthly Reports
                                    <span className="ml-3 bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {monthlyReports.length} reports
                                    </span>
                                </h4>
                                <p className="text-gray-600 mt-1">Monthly summaries and performance metrics</p>
                            </div>
                            <button 
                                onClick={addMonthlyReport} 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md flex items-center"
                            >
                                ➕ Add Monthly Report
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Actual</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Volume</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Volume</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Workers</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Workers</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Equipment</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Equipment</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {monthlyReports.map((report, index) => (
                                        <tr key={index} className="hover:bg-purple-50 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.month || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetPlan?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetAktual?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.volume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{report.targetVolume?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalWorkers || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.avgWorkers || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.totalEquipment || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {report.avgEquipment || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => startEditingMonthly(index)} 
                                                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-150"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteMonthlyReport(index)} 
                                                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-150"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Total Reports: {dailyReports.length + weeklyReports.length + monthlyReports.length}
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                // onClick={() => window.history.back()} // buat bukan kembali tapi reload page
                                onClick={() => window.location.reload()}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
                            >
                                ❌ Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                            >
                                💾 Save All Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Forms */}
                {editingDailyIndex !== null && renderDailyForm(editingDailyIndex)}
                {editingWeeklyIndex !== null && renderWeeklyForm(editingWeeklyIndex)}
                {editingMonthlyIndex !== null && renderMonthlyForm(editingMonthlyIndex)}
            </div>
        </div>
    );
};

export default EditReports;