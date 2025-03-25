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
import axios from 'axios';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financial summary
        const summaryRes = await axios.get('http://localhost:8080/finance/summary');
        console.log(summaryRes.data.data)
        setFinancialSummary(summaryRes.data.data);
        
        // // Fetch member count
        const membersRes = await axios.get('http://localhost:8080/members/count');
        setMemberCount(membersRes.data.data.count);
        
        // // Fetch project count
        const projectsRes = await axios.get('http://localhost:8080/projects/count');
        setProjectCount(projectsRes.data.data.count);
        
        // // Fetch monthly comparison
        const monthlyRes = await axios.get('http://localhost:8080/finance/monthly');
        setMonthlyData(monthlyRes.data.data);
        
        // Fetch recent activities (contoh implementasi)
        const activitiesRes = await axios.get('http://localhost:8080/activities');
        setActivities(activitiesRes.data.data);
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
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <div className="flex items-center text-gray-500">
            <FiClock className="mr-2" />
            <span>Last updated: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <FiDollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">
                Sisa Saldo
              </span>
            </div>
            <h3 className="text-gray-500 text-sm mt-4">Total Sisa Uang</h3>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(financialSummary.income - financialSummary.expense)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <FiUsers className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mt-4">Total Members</h3>
            <p className="text-2xl font-bold text-gray-800">{memberCount}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <FiActivity className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mt-4">Total Projects</h3>
            <p className="text-2xl font-bold text-gray-800">{projectCount}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Perbandingan Bulanan</h2>
            {/* <span className="text-indigo-600 text-sm">Tahun 2024</span> */}
          </div>
          <div className="h-80">
            <Bar 
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                },
                scales: {
                  x: {
                    grid: { display: false }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `Rp ${value} jt`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Aktivitas Terkini</h2>
            <button className="text-indigo-600 text-sm hover:underline">Lihat Semua</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'income' && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiPlus className="text-green-600" />
                    </div>
                  )}
                  {activity.type === 'expense' && (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <FiMinus className="text-red-600" />
                    </div>
                  )}
                  {activity.type === 'member' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUsers className="text-blue-600" />
                    </div>
                  )}
                  {activity.type === 'update' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiRefreshCw className="text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-800">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;