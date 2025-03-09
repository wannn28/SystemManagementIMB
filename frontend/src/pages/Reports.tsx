import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

import { Project } from '../types/BasicTypes';
import EditReports from './EditReportForm';
import axios from 'axios';
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
          totalRevenue : 0,
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
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'}
          tickFormatter={(tick) => {
            const date = new Date(tick);
            if (timeRange === 'daily') return date.toLocaleDateString();
            if (timeRange === 'weekly') return `Week ${Math.ceil(date.getDate() / 7)}`;
            return date.toLocaleString('default', { month: 'short' });
          }}
        />
        <YAxis />
        <Tooltip content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.revenue / data.totalRevenue) * 100).toFixed(2);
            const remaining = data.totalRevenue - data.revenue;

            return (
              <div className="bg-white p-3 border rounded-lg shadow-sm">
                <p className="font-semibold">
                  {data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'] instanceof Date
                    ? data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'].toLocaleDateString()
                    : data[timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart']}
                </p>
                <p className="text-[#8884d8]">Realisasi: Rp{data.revenue?.toLocaleString()}</p>
                <p className="text-[#82ca9d]">Total Revenue: Rp{data.totalRevenue?.toLocaleString()}</p>
                <p className="mt-2">Terbayar: {percentage}%</p>
                <p>Sisa: Rp{remaining?.toLocaleString()}</p>
              </div>
            );
          }
          return null;
        }} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#8884d8"
          name="Revenue"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="paid"
          stroke="#8884d8"
          name="Terbayar"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        {showTotals && (
          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#82ca9d"
            name="Total Revenue"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
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
      <LineChart data={data}>

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekStart' : 'monthStart'} />
        <YAxis />
        <Legend />
        <Tooltip content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            const targetPercentage = ((data.volume / data.targetVolume) * 100).toFixed(2);
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
                      : String(dateVal); // atau dateVal?.toString() jika dateVal bisa null
                  })()}
                </p>
                <p className="text-[#82ca9d]">Volume: {data.volume?.toLocaleString()}</p>
                <p className="text-[#ff7300]">Target Volume: {data.targetVolume?.toLocaleString()}</p>
                <p className="text-[#8884d8]">Total Volume: {data.totalVolume?.toLocaleString()}</p>
                <div className="mt-2">
                  <p>Capai Target: {targetPercentage}%</p>
                  <p>Progress Total: {totalPercentage}%</p>
                  <p>Sisa ke Total: {remainingToTotal?.toLocaleString()}</p>
                </div>
              </div>
            );
          }
          return null;
        }} />
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
          connectNulls={false}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        {showTotals && (
          <Line
            type="monotone"
            dataKey="totalVolume"
            stroke="#8884d8"
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
            const aktualPercentage = ((data.aktual / data.plan) * 100).toFixed(2);
            const volumePercentage = ((data.volume / data.targetVolume) * 100).toFixed(2);
            const remainingAktual = data.plan - data.aktual;
            const remainingVolume = data.targetVolume - data.volume;

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
                    <p>Aktual: {data.aktual?.toLocaleString()}</p>
                    <p>Plan: {data.plan?.toLocaleString()}</p>
                    <p>Capai: {aktualPercentage}%</p>
                    <p>Sisa: {remainingAktual?.toLocaleString()}</p>
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
        <Line
          type="monotone"
          dataKey="plan"
          stroke="#8884d8"
          name="Plan"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="aktual"
          stroke="#ffc658"
          name="Aktual"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
interface ApiResponse {
  data: Project[];
  status: number;
}
// const groupByWeek = (dailyData: any[], weeklyTargets: any[]) => {
//   // Pastikan data terurut berdasarkan tanggal
//   const sortedData = [...dailyData].sort((a, b) =>
//     new Date(a.date).getTime() - new Date(b.date).getTime()
//   );

//   // Cari tanggal mulai pertama
//   const firstDate = new Date(sortedData[0].date);

//   const weeklyData: any[] = [];
//   let currentWeek: any = null;
//   let daysInWeek = 0;

//   sortedData.forEach((item) => {
//     const date = new Date(item.date);

//     // Hitung hari sejak tanggal pertama
//     const diffTime = date.getTime() - firstDate.getTime();
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//     // Jika hari ke-7 atau belum ada minggu saat ini
//     if (diffDays % 7 === 0 || !currentWeek) {
//       // Akhiri minggu sebelumnya jika ada
//       if (currentWeek && daysInWeek > 0) {
//         currentWeek.weekEnd = new Date(date);
//       }

//       // Mulai minggu baru
//       currentWeek = {
//         weekStart: new Date(date),
//         weekEnd: new Date(date),
//         revenue: 0,
//         paid: 0,
//         volume: 0,
//         targetVolume: null,
//         plan: 0,
//         aktual: 0,
//         days: 0
//       };
//       weeklyData.push(currentWeek);
//       daysInWeek = 0;
//     }

//     // Tambahkan data ke minggu saat ini
//     currentWeek.revenue += item.revenue;
//     currentWeek.paid += item.paid;
//     currentWeek.volume += item.volume;
//     currentWeek.targetVolume += item.targetVolume;
//     currentWeek.plan += item.plan;
//     currentWeek.aktual += item.aktual;
//     currentWeek.days++;
//     daysInWeek++;

//     // Update akhir minggu
//     currentWeek.weekEnd = new Date(date);
//   });

//   // Hapus minggu terakhir jika tidak penuh 7 hari
//   if (currentWeek && currentWeek.days < 7) {
//     weeklyData.pop();
//   }


//   weeklyData.forEach((week, index) => {
//     const weekData = weeklyTargets[index] || {};
//     week.targetPlan = weekData.targetPlan;
//     week.targetAktual = weekData.targetAktual;
//     week.targetVolume = weekData.targetVolume;
//   });


//   return weeklyData;
// };

// const groupByMonth = (dailyData: any[], monthlyTargets: any[]) => {
//   const monthlyData: any[] = [];
//   let currentMonth: any = null;

//   dailyData.forEach((item) => {
//     const date = new Date(item.date);
//     const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

//     if (!currentMonth || currentMonth.monthStart.getTime() !== monthStart.getTime()) {
//       currentMonth = {
//         monthStart: monthStart,
//         monthEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0),
//         revenue: 0,
//         paid: 0,
//         target: 0,
//         volume: 0,
//         targetVolume: null,
//         plan: 0,
//         akumulasiPlan: 0,
//         aktual: 0,
//         akumulasiAktual: 0,
//       };
//       monthlyData.push(currentMonth);
//     }

//     currentMonth.revenue += item.revenue;
//     currentMonth.paid += item.paid;
//     currentMonth.target += item.target;
//     currentMonth.volume += item.volume;
//     currentMonth.targetVolume += item.targetVolume;
//     currentMonth.plan += item.plan;
//     currentMonth.akumulasiPlan += item.akumulasiPlan;
//     currentMonth.aktual += item.aktual;
//     currentMonth.akumulasiAktual += item.akumulasiAktual;
//   });


//   monthlyData.forEach((month, index) => {
//     const monthData = monthlyTargets[index] || {};
//     month.targetPlan = monthData.targetPlan;
//     month.targetAktual = monthData.targetAktual;
//     month.targetVolume = monthData.targetVolume;
//   });


//   return monthlyData;
// };
const Reports: React.FC<ReportsProps> = ({ isCollapsed }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // State for editing project
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullscreenChart, setFullscreenChart] = useState<{ projectId: number; chartType: string } | null>(null);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get<ApiResponse>('http://localhost:8080/projects');
        if (response.data.status === 200) {
          setProjects(response.data.data);
        }
      } catch (err) {
        setError('Gagal memuat data projek');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);
  const handleSaveProject = async (updatedProject: Project) => {
    console.log(updatedProject)
    try {
      await axios.put(`http://localhost:8080/projects/${updatedProject.id}`, updatedProject);
      setProjects(prev =>
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      setEditingProject(null);
    } catch (err) {
      console.error('Gagal menyimpan projek:', err);
    }
  };

  const getTimeRangeData = (project: Project) => {
    // Ambil data langsung dari reports sesuai timeRange
    const timeRangeData = timeRange === 'daily'
      ? project.reports.daily
      : timeRange === 'weekly'
        ? project.reports.weekly
        : project.reports.monthly;

    // Transformasi data untuk format yang diharapkan komponen
    return timeRangeData.map((item: any) => ({
      // Untuk daily: pakai date langsung
      date: item.date ? new Date(item.date) : null,
      plan: timeRange === 'daily' ? item.plan : item.targetPlan,
      aktual: timeRange === 'daily' ? item.aktual : item.targetAktual,

      // Atur tanggal sesuai timeRange
      ...(timeRange === 'weekly' && {
        weekStart: getStartOfWeek(item.week, project.startDate),
        weekEnd: getEndOfWeek(item.week, project.startDate)
      }),
      ...(timeRange === 'monthly' && {
        monthStart: new Date(`${item.month} 1, ${new Date(project.startDate).getFullYear()}`),
        monthEnd: new Date(new Date(`${item.month} 1, ${new Date(project.startDate).getFullYear()}`).getFullYear(), new Date(`${item.month} 1`).getMonth() + 1, 0)
      }),

      // Data umum
      revenue: item.revenue || 0,
      paid: item.paid || 0,
      volume: item.volume || 0,
      targetVolume: item.targetVolume || 0, // Ambil dari data server

      targetPlan: item.targetPlan || 0,      // Ambil dari data server
      targetAktual: item.targetAktual || 0,  // Ambil dari data server
      totalRevenue: project.totalRevenue,
      totalVolume: project.totalVolume
    }));
  };

  // Helper untuk konversi week number ke tanggal
  const getStartOfWeek = (weekNumber: string, startDate: string) => {
    const [_, week] = weekNumber.split(' ');
    const projectStart = new Date(startDate);
    const start = new Date(projectStart.getTime() + (parseInt(week) - 1) * 7 * 24 * 3600 * 1000);
    return start;
  };

  const getEndOfWeek = (weekNumber: string, startDate: string) => {
    const start = getStartOfWeek(weekNumber, startDate);
    const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000);
    return end;
  };
  const [showTotals, setShowTotals] = useState(false);
  const getVolumeData = (project: Project) => {
    const data = getTimeRangeData(project).map((item, index, array) => {
      const volume = item.volume || 0;
      const targetVolume = item.targetVolume || null;
      const plan = item.plan || 0;
      const aktual = item.aktual || 0;
      const totalVolume = project.totalVolume || 0;
      const totalRevenue = project.totalRevenue || 0;
      const akumulasiPlan = array.slice(0, index + 1).reduce((acc, curr) => acc + curr.plan, 0);
      const akumulasiAktual = array.slice(0, index + 1).reduce((acc, curr) => acc + curr.aktual, 0);

      return {
        ...item,
        volume,
        targetVolume,
        plan,
        akumulasiPlan,
        aktual,
        akumulasiAktual,
        deviasi: aktual - plan,
        volumeDifference: volume - targetVolume,
        totalVolume,
        totalRevenue
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
  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null;
    const project = projects.find(p => p.id === fullscreenChart.projectId);
    if (!project) return null;

    const chartData = getTimeRangeData(project);
    const volumeData = getVolumeData(project);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full h-full max-w-9xl max-h-[90vh] flex flex-col">
          <button
            onClick={() => setFullscreenChart(null)}
            className="self-end mb-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Close
          </button>
          <div className="flex-1">
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
    );
  };
  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports</h1>

        <div className="flex gap-4 mb-6">
          {['daily', 'weekly', 'monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg ${timeRange === range ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>

          ))}
          <button
            onClick={() => setShowTotals(!showTotals)}
            className={`px-4 py-2 rounded-lg ${showTotals ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            Tampilkan Total
          </button>

        </div>
        {editingProject && (
          <EditReports
            project={editingProject}
            onSave={handleSaveProject}
          />
        )}
        {renderFullscreenChart()}
        <div className="space-y-8">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <button
                  onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                  className="text-indigo-600 hover:underline"
                >
                  {selectedProject === project.id ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                </button>
                <button
                  onClick={() => setEditingProject(project)} // Open edit form
                  className="text-indigo-600 hover:underline"
                >
                  Edit Reports
                </button>
              </div>

              {selectedProject === project.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="p-4 border rounded-lg relative h-64">
                    <button
                      onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'revenue' })}
                      className="absolute top-2 right-2 p-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold mb-4">Revenue vs Total Revenue ({timeRange})</h3>
                    <RevenueChart
                     data={getAggregatedRevenueData(project, timeRange)}
                      timeRange={timeRange}
                      showTotals={showTotals}
                    />
                  </div>

                  {/* Volume Progress Chart */}
                  <div className="p-4 border rounded-lg relative h-64">
                    <button
                      onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-progress' })}
                      className="absolute top-2 right-2 p-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      {/* Icon sama */}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold mb-4">Progress Volume</h3>
                    <VolumeProgressChart
                      data={getVolumeData(project)}
                      timeRange={timeRange}
                      showTotals={showTotals}
                    />
                  </div>

                  {/* Volume Data Chart */}
                  <div className="col-span-full p-4 border rounded-lg relative h-96">
                    <button
                      onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-data' })}
                      className="absolute top-2 right-2 p-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold mb-4">Volume Data ({timeRange})</h3>
                    <VolumeDataChart
                      data={getVolumeData(project)}
                      timeRange={timeRange}
                    />
                  </div>
                  <div className="col-span-full grid grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Akumulasi Plan</p>
                      <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + item.plan, 0)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Akumulasi Aktual</p>
                      <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + item.aktual, 0)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Deviasi</p>
                      <p className="text-2xl font-bold">{getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0)}</p>
                    </div>
                  </div>

                  <div className="col-span-full p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Detail Volume</h3>
                    <p className="text-sm text-gray-600">
                      Target Volume:{" "}
                      {getTimeRangeData(project).reduce(
                        (acc, item) => acc + (item.targetVolume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
                        0
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Jumlah Volume:{" "}
                      {getTimeRangeData(project).reduce(
                        (acc, item) => acc + (item.volume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
                        0
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sisa Volume:{" "}
                      {getTimeRangeData(project).reduce(
                        (acc, item) => acc + (item.targetVolume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
                        0
                      ) -
                        getTimeRangeData(project).reduce(
                          (acc, item) => acc + (item.volume ?? 0), // Gunakan ?? untuk mengganti null dengan 0
                          0
                        )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Progress: {getProgress(project).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
