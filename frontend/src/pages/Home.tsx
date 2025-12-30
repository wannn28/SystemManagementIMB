// Home.tsx
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiUsers, FiActivity, FiDollarSign, FiClock, FiPlus, FiMinus, FiRefreshCw} from 'react-icons/fi';
import { financeAPI, membersAPI, projectsAPI, activitiesAPI } from '../api';
import ActivitiesModal from '../component/ActivitiesModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HomeProps {
  isCollapsed: boolean;
}

interface FinancialSummary {
  income: number;
  expense: number;
}

interface MonthlyComparison {
  month: string;
  income: number;
  expense: number;
}

interface Activity {
  type: 'income' | 'expense' | 'member' | 'project' | 'update';
  title: string;
  description: string;
  timestamp: string;
}

const Home: React.FC<HomeProps> = ({ isCollapsed }) => {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [memberCount, setMemberCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financial summary
        const summaryRes = await financeAPI.getFinanceSummary();
        console.log(summaryRes)
        setFinancialSummary(summaryRes);
        
        // Fetch member count
        const membersRes = await membersAPI.getMemberCount();
        setMemberCount(membersRes.count);
        
        // Fetch project count
        const projectsRes = await projectsAPI.getProjectCount();
        setProjectCount(projectsRes.count);
        
        // Fetch monthly comparison
        const monthlyRes = await financeAPI.getMonthlyFinance();
        setMonthlyData(monthlyRes);
        
        // Fetch recent activities
        const activitiesRes = await activitiesAPI.getAllActivities();
        setActivities(activitiesRes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Data untuk chart bulanan
  const monthlyChartData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: 'Pemasukan',
        data: monthlyData.map(m => m.income),
        backgroundColor: '#10B981',
        borderRadius: 8,
        barPercentage: 0.6,
      },
      {
        label: 'Pengeluaran',
        data: monthlyData.map(m => m.expense),
        backgroundColor: '#EF4444',
        borderRadius: 8,
        barPercentage: 0.6,
      }
    ],
  };

  // Data untuk aktivitas terbaru
  // const sampleActivities: Activity[] = [
  //   {
  //     type: 'income',
  //     title: 'Pemasukan Baru',
  //     description: 'Pembayaran proyek PT. ABC Senilai Rp 50.000.000',
  //     timestamp: '2 jam yang lalu'
  //   },
  //   {
  //     type: 'expense',
  //     title: 'Pengeluaran Baru',
  //     description: 'Pembelian material bangunan Rp 15.000.000',
  //     timestamp: '5 jam yang lalu'
  //   },
  //   {
  //     type: 'member',
  //     title: 'Member Baru',
  //     description: 'John Doe bergabung sebagai Site Manager',
  //     timestamp: '1 hari yang lalu'
  //   }
  // ];

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'} bg-gradient-to-br from-gray-50 via-orange-50/20 to-amber-50/30 min-h-screen`}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-900 to-amber-900 bg-clip-text text-transparent mb-3">
                Dashboard Overview
              </h1>
              <div className="flex items-center text-gray-600 space-x-2">
                <FiClock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 hover:scale-105">
              <FiRefreshCw className="inline mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Sisa Uang Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg shadow-green-500/30">
                  <FiDollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-green-600">Aktif</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Sisa Uang</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(financialSummary.income - financialSummary.expense)}
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Saldo Tersedia</span>
              </div>
            </div>
          </div>

          {/* Total Members Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg shadow-blue-500/30">
                  <FiUsers className="w-7 h-7 text-white" />
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-blue-600">Team</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Members</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{memberCount}</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Anggota Aktif</span>
              </div>
            </div>
          </div>

          {/* Total Projects Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl shadow-lg shadow-purple-500/30">
                  <FiActivity className="w-7 h-7 text-white" />
                </div>
                <div className="bg-purple-50 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-purple-600">Active</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Projects</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{projectCount}</p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Proyek Berjalan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Perbandingan Bulanan</h2>
              <p className="text-sm text-gray-500">Analisis pemasukan dan pengeluaran per bulan</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-600">Pemasukan</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-600">Pengeluaran</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <Bar 
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                      size: 14,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 13
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { 
                      display: false 
                    },
                    ticks: {
                      font: {
                        size: 12,
                        weight: 600
                      }
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: (value) => `Rp ${value} jt`,
                      font: {
                        size: 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Aktivitas Terkini</h2>
              <p className="text-sm text-gray-500">Menampilkan 10 aktivitas terbaru</p>
            </div>
            <button 
              onClick={() => setIsActivitiesModalOpen(true)}
              className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold transition-all duration-200 text-sm"
            >
              Lihat Semua →
            </button>
          </div>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-start p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-100 group"
              >
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'income' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                      <FiPlus className="text-white w-5 h-5" />
                    </div>
                  )}
                  {activity.type === 'expense' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                      <FiMinus className="text-white w-5 h-5" />
                    </div>
                  )}
                  {activity.type === 'member' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                      <FiUsers className="text-white w-5 h-5" />
                    </div>
                  )}
                  {activity.type === 'update' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                      <FiRefreshCw className="text-white w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{activity.title}</p>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <FiClock className="w-3 h-3 mr-1" />
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Modal */}
        <ActivitiesModal 
          isOpen={isActivitiesModalOpen}
          onClose={() => setIsActivitiesModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Home;