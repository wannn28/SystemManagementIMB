import React, { useState } from 'react';
import { Project } from '../types/BasicTypes';
import { FaTrash } from 'react-icons/fa';

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
        updatedReports[index] = { ...updatedReports[index], [field]: value };
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
        setDailyReports([...dailyReports, { date: '', revenue: 0, paid: 0, volume: 0, targetVolume: 0, plan: 0, aktual: 0 }]);
    };

    const addWeeklyReport = () => {
        setWeeklyReports([...weeklyReports, { week: '', targetPlan: 0, targetAktual: 0, volume: 0, targetVolume: 0 }]);
    };

    const addMonthlyReport = () => {
        setMonthlyReports([...monthlyReports, { month: '', targetPlan: 0, targetAktual: 0, volume: 0, targetVolume: 0 }]);
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

    const handleSave = () => {
        const updatedProject = {
            ...project,
            reports: {
                daily: dailyReports,
                weekly: weeklyReports,
                monthly: monthlyReports,
            },
        };
        onSave(updatedProject);
    };

    const renderDailyForm = (index: number) => {
        const report = dailyReports[index];
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                    <h3 className="text-lg font-semibold mb-4">Edit Daily Report</h3>
                    <form>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Kolom Kiri */}
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                                    <input
                                        type="date"
                                        value={report.date}
                                        onChange={(e) => handleDailyChange(index, 'date', e.target.value)}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Revenue</label>
                                    <input
                                        type="number"
                                        value={report.revenue}
                                        onChange={(e) => handleDailyChange(index, 'revenue', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Paid</label>
                                    <input
                                        type="number"
                                        value={report.paid}
                                        onChange={(e) => handleDailyChange(index, 'paid', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                            </div>

                            {/* Kolom Kanan */}
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Volume</label>
                                    <input
                                        type="number"
                                        value={report.volume}
                                        onChange={(e) => handleDailyChange(index, 'volume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Target Volume</label>
                                    <input
                                        type="number"
                                        value={report.targetVolume}
                                        onChange={(e) => handleDailyChange(index, 'targetVolume', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                                    <input
                                        type="number"
                                        value={report.plan}
                                        onChange={(e) => handleDailyChange(index, 'plan', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Aktual</label>
                                    <input
                                        type="number"
                                        value={report.aktual}
                                        onChange={(e) => handleDailyChange(index, 'aktual', Number(e.target.value))}
                                        className="border rounded w-full p-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tombol Save dan Cancel */}
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={() => setEditingDailyIndex(null)}
                                className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingDailyIndex(null)}
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
    const renderWeeklyForm = (index: number) => {
        const report = weeklyReports[index];
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
                    <h3 className="text-lg font-semibold mb-4">Edit Weekly Report</h3>
                    <form>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Kolom Kiri */}
                            <div>
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
                                        onChange={(e) => handleWeeklyChange(index, 'targetPlan', Number(e.target.value))
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
                                        onChange={(e) => handleWeeklyChange(index, 'targetAktual', Number(e.target.value))
                                        }
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
                                        onChange={(e) => handleWeeklyChange(index, 'targetVolume', Number(e.target.value))
                                        }
                                        className="border rounded w-full p-2"
                                    />
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
        <div className="p-4 border rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Edit Reports</h3>

            {/* Daily Reports */}
            <h4 className="font-semibold">Daily Reports</h4>
            <table className="min-w-full mb-4 divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-2 font-semibold">Tanggal</th>
                        <th className="px-4 py-2 font-semibold">Revenue</th>
                        <th className="px-4 py-2 font-semibold">Paid</th>
                        <th className="px-4 py-2 font-semibold">Volume</th>
                        <th className="px-4 py-2 font-semibold">Target Volume</th>
                        <th className="px-4 py-2 font-semibold">Plan</th>
                        <th className="px-4 py-2 font-semibold">Aktual</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {dailyReports.map((report, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="px-4 py-2">{report.date || 'N/A'}</td>
                            <td className="px-4 py-2">{report.revenue}</td>
                            <td className="px-4 py-2">{report.paid}</td>
                            <td className="px-4 py-2">{report.volume}</td>
                            <td className="px-4 py-2">{report.targetVolume}</td>
                            <td className="px-4 py-2">{report.plan}</td>
                            <td className="px-4 py-2">{report.aktual}</td>
                            <td className="px-4 py-2 flex space-x-2">
                                <button onClick={() => startEditingDaily(index)} className="text-blue-500">
                                    Edit
                                </button>
                                <button onClick={() => deleteDailyReport(index)} className="text-red-500">
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addDailyReport} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
                Tambah Laporan Harian
            </button>

            {/* Weekly Reports */}
            <h4 className="font-semibold mt-6">Weekly Reports</h4>
            <table className="min-w-full mb-4 divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-2 font-semibold">Week</th>
                        <th className="px-4 py-2 font-semibold">Target Plan</th>
                        <th className="px-4 py-2 font-semibold">Target Aktual</th>
                        <th className="px-4 py-2 font-semibold">Volume</th>
                        <th className="px-4 py-2 font-semibold">Target Volume</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {weeklyReports.map((report, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="px-4 py-2">{report.week || 'N/A'}</td>
                            <td className="px-4 py-2">{report.targetPlan}</td>
                            <td className="px-4 py-2">{report.targetAktual}</td>
                            <td className="px-4 py-2">{report.volume}</td>
                            <td className="px-4 py-2">{report.targetVolume}</td>
                            <td className="px-4 py-2 flex space-x-2">
                                <button onClick={() => startEditingWeekly(index)} className="text-blue-500">
                                    Edit
                                </button>
                                <button onClick={() => deleteWeeklyReport(index)} className="text-red-500">
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addWeeklyReport} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
                Tambah Laporan Mingguan
            </button>

            {/* Monthly Reports */}
            <h4 className="font-semibold mt-6">Monthly Reports</h4>
            <table className="min-w-full mb-4 divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-2 font-semibold">Month</th>
                        <th className="px-4 py-2 font-semibold">Target Plan</th>
                        <th className="px-4 py-2 font-semibold">Target Aktual</th>
                        <th className="px-4 py-2">Volume</th>
                        <th className="px-4 py-2">Target Volume</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {monthlyReports.map((report, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="px-4 py-2">{report.month || 'N/A'}</td>
                            <td className="px-4 py-2">{report.targetPlan}</td>
                            <td className="px-4 py-2">{report.targetAktual}</td>
                            <td className="px-4 py-2">{report.volume}</td>
                            <td className="px-4 py-2">{report.targetVolume}</td>
                            <td className="px-4 py-2 flex space-x-2">
                                <button onClick={() => startEditingMonthly(index)} className="text-blue-500">
                                    Edit
                                </button>
                                <button onClick={() => deleteMonthlyReport(index)} className="text-red-500">
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addMonthlyReport} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
                Tambah Laporan Bulanan
            </button>

            <button onClick={handleSave} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                Save Changes
            </button>

            {editingDailyIndex !== null && renderDailyForm(editingDailyIndex)}
            {editingWeeklyIndex !== null && renderWeeklyForm(editingWeeklyIndex)}
            {editingMonthlyIndex !== null && renderMonthlyForm(editingMonthlyIndex)}
        </div>
    );
};

export default EditReports;