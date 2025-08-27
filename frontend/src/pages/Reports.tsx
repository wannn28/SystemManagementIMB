import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

import { Project } from '../types/BasicTypes';
import EditReports from './EditReportForm';
import { projectsAPI } from '../api';
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
      } catch (err) {
        console.error('Gagal memuat data projek:', err);
      }
    };

    fetchProjects();
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
  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null;
    const project = projects.find(p => p.id === fullscreenChart.projectId);
    if (!project) return null;

    // const chartData = getTimeRangeData(project);
    const volumeData = getVolumeData(project);

    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex items-center justify-center z-50">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Project Reports</h1>
                <p className="text-gray-600">Comprehensive project analytics and performance metrics</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg shadow-sm px-4 py-2">
                  <span className="text-sm text-gray-600">Total Projects: {projects.length}</span>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Time Range:</span>
                  {['daily', 'weekly', 'monthly'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        timeRange === range 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">Display:</span>
                  <button
                    onClick={() => setShowTotals(!showTotals)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      showTotals 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showTotals ? '✅ Show Totals' : '📊 Show Totals'}
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

          {/* Fullscreen Chart */}
          {renderFullscreenChart()}

          {/* Projects List */}
          <div className="space-y-8">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Project Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 text-white drop-shadow-sm">{project.name}</h2>
                      <p className="text-blue-50 font-medium">Project ID: {project.id}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                        className="bg-white bg-opacity-25 hover:bg-opacity-35 text-blue-700 px-4 py-2 rounded-lg transition-all duration-200 font-semibold shadow-sm"
                      >
                        {selectedProject === project.id ? '👁️ Hide Details' : '📊 Show Details'}
                      </button>
                      <button
                        onClick={() => setEditingProject(project)}
                        className="bg-white bg-opacity-25 hover:bg-opacity-35 text-blue-700 px-4 py-2 rounded-lg transition-all duration-200 font-semibold shadow-sm"
                      >
                        ✏️ Edit Reports
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
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white font-bold">💰</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">Revenue Analysis</h3>
                              <p className="text-sm text-gray-600">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} view</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'revenue' })}
                            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-lg transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                        <div className="h-64">
                          <RevenueChart
                            data={getAggregatedRevenueData(project, timeRange)}
                            timeRange={timeRange}
                            showTotals={showTotals}
                          />
                        </div>
                      </div>

                      {/* Volume Progress Chart */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white font-bold">📈</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">Volume Progress</h3>
                              <p className="text-sm text-gray-600">Progress tracking</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-progress' })}
                            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-lg transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                        <div className="h-64">
                          <VolumeProgressChart
                            data={getVolumeData(project)}
                            timeRange={timeRange}
                            showTotals={showTotals}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Volume Data Chart - Full Width */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">📊</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">Volume Data Analysis</h3>
                            <p className="text-sm text-gray-600">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} detailed view</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFullscreenChart({ projectId: project.id, chartType: 'volume-data' })}
                          className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-lg transition-all duration-200 shadow-sm"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-96">
                        <VolumeDataChart
                          data={getVolumeData(project)}
                          timeRange={timeRange}
                        />
                      </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">📋</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">Accumulated Plan</h4>
                        </div>
                        <p className="text-3xl font-bold text-yellow-700">
                          {getTimeRangeData(project).reduce((acc, item) => acc + item.plan, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">✅</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">Accumulated Actual</h4>
                        </div>
                        <p className="text-3xl font-bold text-red-700">
                          {getTimeRangeData(project).reduce((acc, item) => acc + item.aktual, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">📊</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">Deviation</h4>
                        </div>
                        <p className="text-3xl font-bold text-blue-700">
                          {getTimeRangeData(project).reduce((acc, item) => acc + (item.aktual - item.plan), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Volume Details */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold">📦</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Volume Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Target Volume</p>
                          <p className="text-xl font-bold text-gray-800">
                            {getTimeRangeData(project).reduce((acc, item) => acc + (item.targetVolume ?? 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Total Volume</p>
                          <p className="text-xl font-bold text-gray-800">
                            {getTimeRangeData(project).reduce((acc, item) => acc + (item.volume ?? 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Remaining Volume</p>
                          <p className="text-xl font-bold text-gray-800">
                            {(getTimeRangeData(project).reduce((acc, item) => acc + (item.targetVolume ?? 0), 0) -
                              getTimeRangeData(project).reduce((acc, item) => acc + (item.volume ?? 0), 0)).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Progress</p>
                          <p className="text-xl font-bold text-green-600">
                            {getProgress(project).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Daily Summary */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">📅</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Daily Summary</h3>
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
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold">📊</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">Weekly Summary</h3>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
