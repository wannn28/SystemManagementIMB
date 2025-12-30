import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

import { Project } from '../types/BasicTypes';
import EditReports from './EditReportForm';
import { projectsAPI, projectExpensesAPI, projectIncomesAPI, ProjectExpense, ProjectIncome, ProjectFinancialSummary, financeAPI } from '../api';
interface ReportsProps {
  isCollapsed: boolean;
}

const getAggregatedRevenueData = (project: Project, timeRange: string) => {
  const dailyData = project.reports.daily;

  // Fungsi untuk mengelompokkan data harian ke mingguan
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

  // Fungsi untuk mengelompokkan data harian ke bulanan
  const groupIntoMonths = () => {
    const monthsMap = new Map<string, any>();

    dailyData.forEach(day => {
      const dayDate = new Date(day.date);
      const monthKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}`;

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          monthStart: new Date(dayDate.getFullYear(), dayDate.getMonth(), 1),
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
    default: // daily
      return dailyData.map(day => ({
        date: new Date(day.date),
        revenue: day.revenue || 0,
        paid: day.paid || 0,
        totalRevenue: project.totalRevenue,
      }));
  }
};

const RevenueChart = ({ data, timeRange, showTotals }: { data: any[], timeRange: string, showTotals: boolean }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'}
          tickFormatter={(tick) => {
            const date = new Date(tick);
            if (timeRange === 'daily') return date.toLocaleDateString();
            if (timeRange === 'weekly') return `Week ${Math.ceil(date.getDate() / 7)}`;
            return date.toLocaleString('default', { month: 'short' });
          }}
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#ddd' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              const percentage = ((data.revenue / data.totalRevenue) * 100).toFixed(2);
              const remaining = data.totalRevenue - data.revenue;

              return (
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
                  <div className="mb-3 pb-2 border-b border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">
                      {data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'] instanceof Date
                        ? data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'].toLocaleDateString()
                        : data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart']}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-blue-600">Rp{data.revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Paid:</span>
                      <span className="font-semibold text-green-600">Rp{data.paid?.toLocaleString()}</span>
                    </div>
                    {showTotals && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Revenue:</span>
                          <span className="font-semibold text-purple-600">Rp{data.totalRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Progress:</span>
                            <span className="font-bold text-green-600">{percentage}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Remaining:</span>
                            <span className="font-semibold text-red-600">Rp{remaining?.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <span style={{ color: '#666', fontSize: '12px' }}>{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          name="Revenue"
          strokeWidth={3}
          dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="paid"
          stroke="#10b981"
          name="Paid"
          strokeWidth={3}
          dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
        />
        {showTotals && (
          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#8b5cf6"
            name="Total Revenue"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Komponen Chart baru untuk Volume Progress
const VolumeProgressChart = ({ data, timeRange, showTotals }: { data: any[], timeRange: string, showTotals: boolean }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'}
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#ddd' }}
          tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => (
            <span style={{ color: '#666', fontSize: '12px' }}>{value}</span>
          )}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
                  <div className="mb-3 pb-2 border-b border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">
                      {(() => {
                        const dateVal = data[
                          timeRange === 'daily'
                            ? 'date'
                            : timeRange === 'weekly'
                              ? 'weekStart'
                              : 'monthStart'
                        ];
                        return dateVal instanceof Date
                          ? dateVal.toLocaleDateString()
                          : String(dateVal);
                      })()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <span className="font-semibold text-orange-600">{data.plan?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Actual:</span>
                      <span className="font-semibold text-green-600">{data.aktual?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Target:</span>
                      <span className="font-semibold text-blue-600">{data.targetVolume?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Volume:</span>
                      <span className="font-semibold text-yellow-600">{data.volume?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="plan"
          stroke="#f97316"
          name="Plan"
          strokeWidth={3}
          dot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="aktual"
          stroke="#10b981"
          name="Actual"
          connectNulls={false}
          strokeWidth={3}
          dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
        />
        {showTotals && (
          <Line
            type="monotone"
            dataKey="totalVolume"
            stroke="#8b5cf6"
            name="Total Volume"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
          />
        )}

      </LineChart>
    </ResponsiveContainer>
  );
};

// Komponen Chart baru untuk Volume Data
const VolumeDataChart = ({ data, timeRange }: { data: any[], timeRange: string }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'} />
        <YAxis />
        <Tooltip content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const volumePercentage = ((data.volume / data.targetVolume) * 100).toFixed(2);
            const remainingVolume = data.targetVolume - data.volume;
            const totalPercentage = ((data.volume / data.totalVolume) * 100).toFixed(2);
            const remainingToTotal = data.totalVolume - data.volume;
            return (
              <div className="bg-white p-3 border rounded-lg shadow-sm">
                <p className="font-semibold">
                  {(() => {
                    const dateVal = data[
                      timeRange === 'daily'
                        ? 'date'
                        : timeRange === 'weekly'
                          ? 'weekStart'
                          : 'monthStart'
                    ];
                    return dateVal instanceof Date
                      ? dateVal.toLocaleDateString()
                      : String(dateVal);
                  })()}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[#82ca9d]">
                    <p>Volume: {data.volume?.toLocaleString()}</p>
                    <p>Target: {data.targetVolume?.toLocaleString()}</p>
                    <p>Capai: {volumePercentage}%</p>
                    <p>Sisa: {remainingVolume?.toLocaleString()}</p>
                  </div>
                  <div className="text-[#ffc658]">
                    <div className="mt-2">
                      <p className="text-[#8884d8]">Total Volume: {data.totalVolume?.toLocaleString()}</p>
                      <p>Progress Total: {totalPercentage}%</p>
                      <p>Sisa ke Total: {remainingToTotal?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        }} />
        <Legend />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#82ca9d"
          name="Volume"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="targetVolume"
          stroke="#ff7300"
          name="Target Volume"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const Reports: React.FC<ReportsProps> = ({ isCollapsed }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // State for editing project
  const [projects, setProjects] = useState<Project[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<{ projectId: number; chartType: string } | null>(null);
  
  // Expense management states
  const [projectExpenses, setProjectExpenses] = useState<Record<number, ProjectExpense[]>>({});
  const [projectIncomes, setProjectIncomes] = useState<Record<number, ProjectIncome[]>>({});
  const [financialSummaries, setFinancialSummaries] = useState<Record<number, ProjectFinancialSummary>>({});
  const [showExpenseModal, setShowExpenseModal] = useState<number | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState<number | null>(null);
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
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<ProjectIncome | null>(null);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);
  
  const groupDataByTimeRange = (project: Project, timeRange: 'daily' | 'weekly' | 'monthly') => {
    const dailyData = project.reports.daily;

    // Kelompokkan ke mingguan
    const groupIntoWeeks = () => {
      const weeksMap = new Map<string, any>();
      const projectStart = new Date(project.startDate);

      dailyData.forEach(day => {
        const dayDate = new Date(day.date);
        const diffDays = Math.floor((dayDate.getTime() - projectStart.getTime()) / (1000 * 3600 * 24));
        const weekNumber = Math.floor(diffDays / 7) + 1;
        const weekKey = `Week ${weekNumber}`;

        if (!weeksMap.has(weekKey)) {
          weeksMap.set(weekKey, {
            week: weekKey,
            weekStart: new Date(projectStart.getTime() + (weekNumber - 1) * 7 * 24 * 3600 * 1000),
            weekEnd: new Date(projectStart.getTime() + weekNumber * 7 * 24 * 3600 * 1000 - 1),
            plan: 0,
            aktual: 0,
            volume: 0,
            targetVolume: 0,
            targetPlan: 0,
            targetAktual: 0,
          });
        }

        const week = weeksMap.get(weekKey);
        week.plan += day.plan || 0;
        week.aktual += day.aktual || 0;
        week.volume += day.volume || 0;
        week.targetVolume += day.targetVolume || 0;
      });

      // Gabungkan dengan target dari server
      return Array.from(weeksMap.values()).map((week, index) => ({
        ...week,
        targetPlan: project.reports.weekly[index]?.targetPlan || 0,
        targetAktual: project.reports.weekly[index]?.targetAktual || 0,
      }));
    };

    // Kelompokkan ke bulanan
    const groupIntoMonths = () => {
      const monthsMap = new Map<string, any>();

      dailyData.forEach(day => {
        const dayDate = new Date(day.date);
        const monthKey = `${dayDate.getFullYear()}-${dayDate.getMonth()}`;

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            month: dayDate.toLocaleString('default', { month: 'long' }),
            monthStart: new Date(dayDate.getFullYear(), dayDate.getMonth(), 1),
            monthEnd: new Date(dayDate.getFullYear(), dayDate.getMonth() + 1, 0),
            plan: 0,
            aktual: 0,
            volume: 0,
            targetVolume: 0,
            targetPlan: 0,
            targetAktual: 0,
          });
        }

        const month = monthsMap.get(monthKey);
        month.plan += day.plan || 0;
        month.aktual += day.aktual || 0;
        month.volume += day.volume || 0;
        month.targetVolume += day.targetVolume || 0;
      });

      // Gabungkan dengan target dari server
      return Array.from(monthsMap.values()).map((month, index) => ({
        ...month,
        targetPlan: project.reports.monthly[index]?.targetPlan || 0,
        targetAktual: project.reports.monthly[index]?.targetAktual || 0,
      }));
    };

    switch (timeRange) {
      case 'weekly':
        return groupIntoWeeks();
      case 'monthly':
        return groupIntoMonths();
      default:
        return dailyData.map(day => ({
          ...day,
          date: new Date(day.date),
        }));
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getAllProjects();
        setProjects(data);
        
        // Load expenses, incomes and financial summaries for each project
        data.forEach(async (project) => {
          try {
            const expenses = await projectExpensesAPI.getExpensesByProjectId(project.id);
            setProjectExpenses(prev => ({ ...prev, [project.id]: expenses || [] }));
            
            const incomes = await projectIncomesAPI.getIncomesByProjectId(project.id);
            setProjectIncomes(prev => ({ ...prev, [project.id]: incomes || [] }));
            
            const summary = await projectExpensesAPI.getFinancialSummary(project.id);
            setFinancialSummaries(prev => ({ ...prev, [project.id]: summary }));
          } catch (err) {
            console.error(`Gagal memuat data expense/income untuk project ${project.id}:`, err);
            // Set default empty values on error
            setProjectExpenses(prev => ({ ...prev, [project.id]: [] }));
            setProjectIncomes(prev => ({ ...prev, [project.id]: [] }));
          }
        });
      } catch (err) {
        console.error('Gagal memuat data projek:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const list = await financeAPI.categories.list();
        setCategories(list);
      } catch (err) {
        console.error('Gagal memuat kategori:', err);
      }
    };

    fetchProjects();
    fetchCategories();
  }, []);
  const handleSaveProject = async (updatedProject: Project) => {
    console.log(updatedProject)
    try {
      await projectsAPI.updateProject(updatedProject.id, updatedProject);
      setProjects(prev =>
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      setEditingProject(null);
    } catch (err) {
      console.error('Gagal menyimpan projek:', err);
    }
  };

  const getTimeRangeData = (project: Project) => {
    const data = groupDataByTimeRange(project, timeRange);

    return data.map((item: any) => ({
      ...item,
      date: item.date || item.weekStart || item.monthStart,
      plan: item.plan,
      aktual: item.aktual,
      targetPlan: item.targetPlan,
      targetAktual: item.targetAktual,
      deviasi: item.aktual - item.targetAktual,
    }));
  };
  // Helper untuk konversi week number ke tanggal
  // const getStartOfWeek = (weekNumber: string, startDate: string) => {
  //   const [_, week] = weekNumber.split(' ');
  //   const projectStart = new Date(startDate);
  //   const start = new Date(projectStart.getTime() + (parseInt(week) - 1) * 7 * 24 * 3600 * 1000);
  //   return start;
  // };

  // const getEndOfWeek = (weekNumber: string, startDate: string) => {
  //   const start = getStartOfWeek(weekNumber, startDate);
  //   const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000);
  //   return end;
  // };
  const [showTotals, setShowTotals] = useState(false);
  const getVolumeData = (project: Project) => {
    const data = getTimeRangeData(project).map((item, index, array) => {
      // Hitung akumulasi aktual dan plan
      const akumulasiAktual = array
        .slice(0, index + 1)
        .reduce((acc, curr) => acc + (curr.aktual || 0), 0);

      const akumulasiPlan = array
        .slice(0, index + 1)
        .reduce((acc, curr) => acc + (curr.plan || 0), 0);

      return {
        ...item,
        volume: akumulasiAktual,         // Gunakan akumulasi aktual sebagai volume
        targetVolume: akumulasiPlan,     // Gunakan akumulasi plan sebagai target volume
        plan: item.plan,
        aktual: item.aktual,
        totalVolume: project.totalVolume,
        totalRevenue: project.totalRevenue
      };
    });
    return data;
  };

  const getProgress = (project: Project) => {
    const akumulasiAktual = getTimeRangeData(project).reduce((acc, item) => acc + item.aktual, 0);
    const akumulasiPlan = getTimeRangeData(project).reduce((acc, item) => acc + item.plan, 0);
    const progress = (akumulasiAktual / akumulasiPlan) * 100;

    return progress;
  };

  // Expense management functions
  const handleAddExpense = async (projectId: number) => {
    try {
      const newExpense = await projectExpensesAPI.createExpense({
        projectId,
        ...expenseForm
      });
      setProjectExpenses(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newExpense]
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
      
      // Reset form
      setExpenseForm({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Unpaid'
      });
      setShowExpenseModal(null);
    } catch (err) {
      console.error('Gagal menambah pengeluaran:', err);
      alert('Gagal menambah pengeluaran');
    }
  };

  const handleUpdateExpense = async (expenseId: number, projectId: number) => {
    try {
      const updated = await projectExpensesAPI.updateExpense(expenseId, expenseForm);
      setProjectExpenses(prev => ({
        ...prev,
        [projectId]: prev[projectId].map(e => e.id === expenseId ? updated : e)
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
      
      setEditingExpense(null);
      setShowExpenseModal(null);
    } catch (err) {
      console.error('Gagal update pengeluaran:', err);
      alert('Gagal update pengeluaran');
    }
  };

  const handleDeleteExpense = async (expenseId: number, projectId: number) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;
    
    try {
      await projectExpensesAPI.deleteExpense(expenseId);
      setProjectExpenses(prev => ({
        ...prev,
        [projectId]: prev[projectId].filter(e => e.id !== expenseId)
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
    } catch (err) {
      console.error('Gagal hapus pengeluaran:', err);
      alert('Gagal hapus pengeluaran');
    }
  };

  const openExpenseModal = (projectId: number, expense?: ProjectExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        tanggal: expense.tanggal,
        kategori: expense.kategori,
        deskripsi: expense.deskripsi,
        jumlah: expense.jumlah,
        status: expense.status
      });
    } else {
      setEditingExpense(null);
      setExpenseForm({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Unpaid'
      });
    }
    setShowExpenseModal(projectId);
  };

  // Income management functions
  const handleAddIncome = async (projectId: number) => {
    try {
      const newIncome = await projectIncomesAPI.createIncome({
        projectId,
        ...incomeForm
      });
      setProjectIncomes(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newIncome]
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
      
      // Reset form
      setIncomeForm({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Pending'
      });
      setShowIncomeModal(null);
    } catch (err) {
      console.error('Gagal menambah pemasukan:', err);
      alert('Gagal menambah pemasukan');
    }
  };

  const handleUpdateIncome = async (incomeId: number, projectId: number) => {
    try {
      const updated = await projectIncomesAPI.updateIncome(incomeId, incomeForm);
      setProjectIncomes(prev => ({
        ...prev,
        [projectId]: prev[projectId].map(i => i.id === incomeId ? updated : i)
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
      
      setEditingIncome(null);
      setShowIncomeModal(null);
    } catch (err) {
      console.error('Gagal update pemasukan:', err);
      alert('Gagal update pemasukan');
    }
  };

  const handleDeleteIncome = async (incomeId: number, projectId: number) => {
    if (!confirm('Yakin ingin menghapus pemasukan ini?')) return;
    
    try {
      await projectIncomesAPI.deleteIncome(incomeId);
      setProjectIncomes(prev => ({
        ...prev,
        [projectId]: prev[projectId].filter(i => i.id !== incomeId)
      }));
      
      // Refresh financial summary
      const summary = await projectExpensesAPI.getFinancialSummary(projectId);
      setFinancialSummaries(prev => ({ ...prev, [projectId]: summary }));
    } catch (err) {
      console.error('Gagal hapus pemasukan:', err);
      alert('Gagal hapus pemasukan');
    }
  };

  const openIncomeModal = (projectId: number, income?: ProjectIncome) => {
    if (income) {
      setEditingIncome(income);
      setIncomeForm({
        tanggal: income.tanggal,
        kategori: income.kategori,
        deskripsi: income.deskripsi,
        jumlah: income.jumlah,
        status: income.status
      });
    } else {
      setEditingIncome(null);
      setIncomeForm({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: 0,
        status: 'Pending'
      });
    }
    setShowIncomeModal(projectId);
  };
  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null;
    const project = projects.find(p => p.id === fullscreenChart.projectId);
    if (!project) return null;

    // const chartData = getTimeRangeData(project);
    const volumeData = getVolumeData(project);

    const chartTitles = {
      'revenue': 'Revenue Analysis',
      'volume-progress': 'Volume Progress',
      'volume-data': 'Volume Data Analysis'
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-scaleIn">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{chartTitles[fullscreenChart.chartType as keyof typeof chartTitles]}</h2>
                <p className="text-sm text-blue-100">{project.name}</p>
              </div>
            </div>
            <button
              onClick={() => setFullscreenChart(null)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-200 font-semibold text-white flex items-center gap-2 border border-white/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
          
          {/* Chart Content */}
          <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="h-full bg-white rounded-xl p-4 shadow-inner">
              {fullscreenChart.chartType === 'revenue' && (
                <RevenueChart
                  data={getAggregatedRevenueData(project, timeRange)}
                  timeRange={timeRange}
                  showTotals={showTotals}
                />
              )}
              {fullscreenChart.chartType === 'volume-progress' && (
                <VolumeProgressChart
                  data={volumeData}
                  timeRange={timeRange}
                  showTotals={showTotals}
                />
              )}
              {fullscreenChart.chartType === 'volume-data' && (
                <VolumeDataChart
                  data={volumeData}
                  timeRange={timeRange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Modern Header with Stats */}
          <div className="mb-8 animate-fadeInUp">
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Project Reports
                  </h1>
                  <p className="text-gray-600 mt-1">Comprehensive analytics and performance metrics</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-gray-800">{projects.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Reports</p>
                    <p className="text-3xl font-bold text-green-600">{projects.filter(p => p.status === 'active').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(projects.reduce((sum, p) => sum + (p.totalRevenue || 0), 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Avg Progress</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {projects.length > 0 ? (projects.reduce((sum, p) => sum + getProgress(p), 0) / projects.length).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-wrap items-center gap-6">
                {/* Time Range Filter */}
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">Time Range:</span>
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range as any)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          timeRange === range 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                        }`}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-300"></div>

                {/* Display Toggle */}
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">Display:</span>
                  <button
                    onClick={() => setShowTotals(!showTotals)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      showTotals 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200 scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {showTotals ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Show Totals
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Show Totals
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Reports Modal */}
          {editingProject && (
            <EditReports
              project={editingProject}
              onSave={handleSaveProject}
            />
          )}

          {/* Expense Modal */}
          {showExpenseModal !== null && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowExpenseModal(null);
                        setEditingExpense(null);
                      }}
                      className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                    <input
                      type="date"
                      value={expenseForm.tanggal}
                      onChange={(e) => setExpenseForm({ ...expenseForm, tanggal: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                    <select
                      value={expenseForm.kategori}
                      onChange={(e) => setExpenseForm({ ...expenseForm, kategori: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                    <textarea
                      value={expenseForm.deskripsi}
                      onChange={(e) => setExpenseForm({ ...expenseForm, deskripsi: e.target.value })}
                      placeholder="Detail pengeluaran (optional)"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah (Rp)</label>
                    <input
                      type="number"
                      value={expenseForm.jumlah}
                      onChange={(e) => setExpenseForm({ ...expenseForm, jumlah: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status Pembayaran</label>
                    <select
                      value={expenseForm.status}
                      onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as 'Paid' | 'Unpaid' | 'Pending' })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Unpaid">Unpaid (Belum Dibayar)</option>
                      <option value="Pending">Pending (Sedang Diproses)</option>
                      <option value="Paid">Paid (Sudah Dibayar)</option>
                    </select>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowExpenseModal(null);
                      setEditingExpense(null);
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (editingExpense) {
                        handleUpdateExpense(editingExpense.id, showExpenseModal);
                      } else {
                        handleAddExpense(showExpenseModal);
                      }
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  >
                    {editingExpense ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Income Modal */}
          {showIncomeModal !== null && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      {editingIncome ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowIncomeModal(null);
                        setEditingIncome(null);
                      }}
                      className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
                    <input
                      type="date"
                      value={incomeForm.tanggal}
                      onChange={(e) => setIncomeForm({ ...incomeForm, tanggal: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                    <select
                      value={incomeForm.kategori}
                      onChange={(e) => setIncomeForm({ ...incomeForm, kategori: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                    <textarea
                      value={incomeForm.deskripsi}
                      onChange={(e) => setIncomeForm({ ...incomeForm, deskripsi: e.target.value })}
                      placeholder="Detail pemasukan (optional)"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah (Rp)</label>
                    <input
                      type="number"
                      value={incomeForm.jumlah}
                      onChange={(e) => setIncomeForm({ ...incomeForm, jumlah: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status Pemasukan</label>
                    <select
                      value={incomeForm.status}
                      onChange={(e) => setIncomeForm({ ...incomeForm, status: e.target.value as 'Received' | 'Pending' | 'Planned' })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Pending">Pending (Sedang Diproses)</option>
                      <option value="Planned">Planned (Rencana)</option>
                      <option value="Received">Received (Sudah Diterima)</option>
                    </select>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 justify-end border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowIncomeModal(null);
                      setEditingIncome(null);
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (editingIncome) {
                        handleUpdateIncome(editingIncome.id, showIncomeModal);
                      } else {
                        handleAddIncome(showIncomeModal);
                      }
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  >
                    {editingIncome ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen Chart */}
          {renderFullscreenChart()}

          {/* Projects List */}
          <div className="space-y-6">
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Projects Found</h3>
                <p className="text-gray-600">Start by creating your first project report.</p>
              </div>
            ) : (
              projects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
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
                          onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2 border border-white/30"
                        >
                          {selectedProject === project.id ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              Hide Details
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Show Details
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingProject(project)}
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
                {selectedProject === project.id && (
                  <div className="p-6 space-y-8">
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Chart */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                        {/* Background gradient overlay */}
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
                            <button
                              onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'revenue' })}
                              className="bg-gray-100 hover:bg-blue-500 hover:text-white p-2.5 rounded-xl transition-all duration-200 group/btn"
                              title="Fullscreen"
                            >
                              <svg className="w-5 h-5 text-gray-600 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </button>
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
                        {/* Background gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-800">Volume Progress</h3>
                                <p className="text-sm text-gray-500">Performance tracking</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-progress' })}
                              className="bg-gray-100 hover:bg-green-500 hover:text-white p-2.5 rounded-xl transition-all duration-200 group/btn"
                              title="Fullscreen"
                            >
                              <svg className="w-5 h-5 text-gray-600 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </button>
                          </div>
                          <div className="h-64 bg-gradient-to-br from-green-50/30 to-transparent rounded-xl p-2">
                            <VolumeProgressChart
                              data={getVolumeData(project)}
                              timeRange={timeRange}
                              showTotals={showTotals}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Section */}
                    {financialSummaries[project.id] && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">Financial Analysis</h3>
                              <p className="text-sm text-gray-600">Analisa keuangan dan profitabilitas project</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => openIncomeModal(project.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Tambah Pemasukan
                            </button>
                            <button
                              onClick={() => openExpenseModal(project.id)}
                              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                              Tambah Pengeluaran
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-blue-600">
                              Rp {financialSummaries[project.id].totalRevenue.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Pengeluaran</p>
                            <p className="text-2xl font-bold text-red-600">
                              Rp {financialSummaries[project.id].totalExpenses.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Paid: Rp {financialSummaries[project.id].expensesPaid.toLocaleString('id-ID')} | 
                              Unpaid: Rp {financialSummaries[project.id].expensesUnpaid.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-1">Estimasi Profit</p>
                            <p className={`text-2xl font-bold ${financialSummaries[project.id].estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Rp {financialSummaries[project.id].estimatedProfit.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-1">Profit Margin</p>
                            <p className={`text-2xl font-bold ${financialSummaries[project.id].profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {financialSummaries[project.id].profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Expense Categories */}
                        {financialSummaries[project.id]?.expenseCategories && financialSummaries[project.id].expenseCategories.length > 0 && (
                          <div className="bg-white rounded-xl p-5 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-800 mb-4">Breakdown Pengeluaran per Kategori</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {financialSummaries[project.id].expenseCategories.map((cat, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">{cat.kategori}</p>
                                  <p className="text-xl font-bold text-gray-900">
                                    Rp {cat.total.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-xs text-gray-500">{cat.count} transaksi</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expense List */}
                    {projectExpenses[project.id]?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Pengeluaran</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Tanggal</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Kategori</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Deskripsi</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700">Jumlah</th>
                                <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-center p-3 text-sm font-semibold text-gray-700">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectExpenses[project.id].map((expense) => (
                                <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="p-3 text-sm text-gray-700">{new Date(expense.tanggal).toLocaleDateString('id-ID')}</td>
                                  <td className="p-3 text-sm font-medium text-gray-800">{expense.kategori}</td>
                                  <td className="p-3 text-sm text-gray-600">{expense.deskripsi || '-'}</td>
                                  <td className="p-3 text-sm font-bold text-right text-gray-900">
                                    Rp {expense.jumlah.toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      expense.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                      expense.status === 'Unpaid' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {expense.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => openExpenseModal(project.id, expense)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Edit"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteExpense(expense.id, project.id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Hapus"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Income List */}
                    {projectIncomes[project.id]?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Pemasukan</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Tanggal</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Kategori</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Deskripsi</th>
                                <th className="text-right p-3 text-sm font-semibold text-gray-700">Jumlah</th>
                                <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-center p-3 text-sm font-semibold text-gray-700">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectIncomes[project.id].map((income) => (
                                <tr key={income.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="p-3 text-sm text-gray-700">{new Date(income.tanggal).toLocaleDateString('id-ID')}</td>
                                  <td className="p-3 text-sm font-medium text-gray-800">{income.kategori}</td>
                                  <td className="p-3 text-sm text-gray-600">{income.deskripsi || '-'}</td>
                                  <td className="p-3 text-sm font-bold text-right text-gray-900">
                                    Rp {income.jumlah.toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      income.status === 'Received' ? 'bg-green-100 text-green-700' :
                                      income.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {income.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => openIncomeModal(project.id, income)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Edit"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteIncome(income.id, project.id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Hapus"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Volume Data Chart - Full Width */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                      {/* Background gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">Volume Data Analysis</h3>
                              <p className="text-sm text-gray-500">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} detailed breakdown</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-data' })}
                            className="bg-gray-100 hover:bg-purple-500 hover:text-white p-2.5 rounded-xl transition-all duration-200 group/btn"
                            title="Fullscreen"
                          >
                            <svg className="w-5 h-5 text-gray-600 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                        <div className="h-96 bg-gradient-to-br from-purple-50/30 to-transparent rounded-xl p-2">
                          <VolumeDataChart
                            data={getVolumeData(project)}
                            timeRange={timeRange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-600">Accumulated Plan</h4>
                          </div>
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          {getTimeRangeData(project).reduce((acc, item) => acc + item.plan, 0).toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Total planned volume
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-600">Accumulated Actual</h4>
                          </div>
                        </div>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {getTimeRangeData(project).reduce((acc, item) => acc + item.aktual, 0).toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Total completed volume
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-600">Deviation</h4>
                          </div>
                        </div>
                        <p className={`text-3xl font-bold ${
                          getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0) >= 0 ? '+' : ''}
                          {getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0).toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                          Actual vs planned
                        </div>
                      </div>
                    </div>

                    {/* Volume Details */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">Volume Details</h3>
                          <p className="text-sm text-gray-500">Comprehensive volume metrics</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-medium text-blue-700">Target Volume</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">
                            {getTimeRangeData(project).reduce((acc, item) => acc + (item.targetVolume ?? 0), 0).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-green-700">Total Volume</p>
                          </div>
                          <p className="text-2xl font-bold text-green-900">
                            {getTimeRangeData(project).reduce((acc, item) => acc + (item.volume ?? 0), 0).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-orange-700">Remaining Volume</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-900">
                            {(getTimeRangeData(project).reduce((acc, item) => acc + (item.targetVolume ?? 0), 0) -
                              getTimeRangeData(project).reduce((acc, item) => acc + (item.volume ?? 0), 0)).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <p className="text-sm font-medium text-purple-700">Progress</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">
                            {getProgress(project).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Daily Summary */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">Daily Summary</h3>
                            <p className="text-sm text-gray-500">Workforce & equipment totals</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Man Power Summary */}
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                              👷 Man Power
                            </h4>
                            <div className="space-y-3">
                              {(() => {
                                const dailyReports = project.reports.daily;
                                if (!dailyReports || dailyReports.length === 0) return (
                                  <div className="text-gray-500 text-sm">No data available</div>
                                );

                                const allWorkerTypes = new Set<string>();
                                dailyReports.forEach(report => {
                                  if (report.workers) {
                                    Object.keys(report.workers).forEach(type => allWorkerTypes.add(type));
                                  }
                                });

                                const workerStats = Array.from(allWorkerTypes).map(workerType => {
                                  const totals = dailyReports.reduce((sum, report) => sum + (report.workers?.[workerType] || 0), 0);
                                  return { type: workerType, total: totals };
                                });

                                const totalWorkers = workerStats.reduce((sum, stat) => sum + stat.total, 0);

                                return (
                                  <>
                                    <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
                                      <span className="font-semibold text-green-800">Total</span>
                                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {totalWorkers}
                                      </span>
                                    </div>
                                    {workerStats.map((stat) => (
                                      <div key={stat.type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{stat.type}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {stat.total}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Equipment Summary */}
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                              🚜 Equipment
                            </h4>
                            <div className="space-y-3">
                              {(() => {
                                const dailyReports = project.reports.daily;
                                if (!dailyReports || dailyReports.length === 0) return (
                                  <div className="text-gray-500 text-sm">No data available</div>
                                );

                                const allEquipmentTypes = new Set<string>();
                                dailyReports.forEach(report => {
                                  if (report.equipment) {
                                    Object.keys(report.equipment).forEach(type => allEquipmentTypes.add(type));
                                  }
                                });

                                const equipmentStats = Array.from(allEquipmentTypes).map(equipmentType => {
                                  const totals = dailyReports.reduce((sum, report) => sum + (report.equipment?.[equipmentType] || 0), 0);
                                  return { type: equipmentType, total: totals };
                                });

                                const totalEquipment = equipmentStats.reduce((sum, stat) => sum + stat.total, 0);

                                return (
                                  <>
                                    <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
                                      <span className="font-semibold text-green-800">Total</span>
                                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {totalEquipment}
                                      </span>
                                    </div>
                                    {equipmentStats.map((stat) => (
                                      <div key={stat.type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{stat.type}</span>
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {stat.total}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Weekly Summary */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">Weekly Summary</h3>
                            <p className="text-sm text-gray-500">Average workforce & equipment</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Weekly Man Power Summary */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                              👷 Man Power
                            </h4>
                            <div className="space-y-3">
                              {(() => {
                                const dailyReports = project.reports.daily;
                                if (!dailyReports || dailyReports.length === 0) return (
                                  <div className="text-gray-500 text-sm">No data available</div>
                                );

                                const allWorkerTypes = new Set<string>();
                                dailyReports.forEach(report => {
                                  if (report.workers) {
                                    Object.keys(report.workers).forEach(type => allWorkerTypes.add(type));
                                  }
                                });

                                const workerStats = Array.from(allWorkerTypes).map(workerType => {
                                  const totals = dailyReports.reduce((sum, report) => sum + (report.workers?.[workerType] || 0), 0);
                                  const average = dailyReports.length > 0 ? totals / dailyReports.length : 0;
                                  return { type: workerType, total: totals, average: average };
                                });

                                const totalWorkers = workerStats.reduce((sum, stat) => sum + stat.total, 0);
                                const avgTotalWorkers = dailyReports.length > 0 ? totalWorkers / dailyReports.length : 0;

                                return (
                                  <>
                                    <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg">
                                      <span className="font-semibold text-purple-800">Total</span>
                                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {totalWorkers}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg">
                                      <span className="font-semibold text-purple-800">Average</span>
                                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {avgTotalWorkers.toFixed(1)}
                                      </span>
                                    </div>
                                    {workerStats.map((stat) => (
                                      <div key={stat.type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{stat.type}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {stat.average.toFixed(1)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Weekly Equipment Summary */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                              🚜 Equipment
                            </h4>
                            <div className="space-y-3">
                              {(() => {
                                const dailyReports = project.reports.daily;
                                if (!dailyReports || dailyReports.length === 0) return (
                                  <div className="text-gray-500 text-sm">No data available</div>
                                );

                                const allEquipmentTypes = new Set<string>();
                                dailyReports.forEach(report => {
                                  if (report.equipment) {
                                    Object.keys(report.equipment).forEach(type => allEquipmentTypes.add(type));
                                  }
                                });

                                const equipmentStats = Array.from(allEquipmentTypes).map(equipmentType => {
                                  const totals = dailyReports.reduce((sum, report) => sum + (report.equipment?.[equipmentType] || 0), 0);
                                  const average = dailyReports.length > 0 ? totals / dailyReports.length : 0;
                                  return { type: equipmentType, total: totals, average: average };
                                });

                                const totalEquipment = equipmentStats.reduce((sum, stat) => sum + stat.total, 0);
                                const avgTotalEquipment = dailyReports.length > 0 ? totalEquipment / dailyReports.length : 0;

                                return (
                                  <>
                                    <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg">
                                      <span className="font-semibold text-purple-800">Total</span>
                                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {totalEquipment}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg">
                                      <span className="font-semibold text-purple-800">Average</span>
                                      <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                        {avgTotalEquipment.toFixed(1)}
                                      </span>
                                    </div>
                                    {equipmentStats.map((stat) => (
                                      <div key={stat.type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{stat.type}</span>
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {stat.average.toFixed(1)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
