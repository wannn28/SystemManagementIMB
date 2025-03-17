import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

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
                <p className="text-[#82ca9d]">Volume Plan : {data.plan?.toLocaleString()}</p>
                <p className="text-[#ff7300]">Volume Aktual: {data.aktual?.toLocaleString()}</p>

              </div>
            );
          }
          return null;
        }} />
        <Line
          type="monotone"
          dataKey="plan"
          stroke="#ff7300" 
          name="Plan"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="aktual"
          stroke="#82ca9d"
          name="Aktual"
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
interface ApiResponse {
  data: Project[];
  status: number;
}

const Reports: React.FC<ReportsProps> = ({ isCollapsed }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // State for editing project
  const [projects, setProjects] = useState<Project[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<{ projectId: number; chartType: string } | null>(null);
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
        const response = await axios.get<ApiResponse>('http://localhost:8080/projects');
        if (response.data.status === 200) {
          setProjects(response.data.data);
        }
      } catch (err) {
        // setError('Gagal memuat data projek');
      } finally {
        // setLoading(false);
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
  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null;
    const project = projects.find(p => p.id === fullscreenChart.projectId);
    if (!project) return null;

    // const chartData = getTimeRangeData(project);
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
