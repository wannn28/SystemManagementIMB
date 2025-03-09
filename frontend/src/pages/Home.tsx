// Home.tsx
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
import { FiUsers, FiActivity, FiDollarSign, FiArrowUpRight, FiClock } from 'react-icons/fi';

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

const Home: React.FC<HomeProps> = ({ isCollapsed }) => {
  // Chart data configurations
  const growthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Monthly Growth',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }],
  };

  const profitData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Profit (Millions)',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: '#6366f1',
      borderRadius: 8,
      barPercentage: 0.6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { color: '#6b7280' }
      },
    },
  };

  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <div className="flex items-center text-gray-500">
            <FiClock className="mr-2" />
            <span>Last updated: 2 hours ago</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { 
              title: 'Total Revenue', 
              value: 'Rp 542M', 
              icon: <FiDollarSign className="w-6 h-6" />,
              trend: 12.3,
              color: 'bg-indigo-100 text-indigo-600'
            },
            { 
              title: 'Active Users', 
              value: '2,345', 
              icon: <FiUsers className="w-6 h-6" />,
              trend: 8.1,
              color: 'bg-green-100 text-green-600'
            },
            { 
              title: 'Projects', 
              value: '42', 
              icon: <FiActivity className="w-6 h-6" />,
              trend: -3.2,
              color: 'bg-amber-100 text-amber-600'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
                <span className={`text-sm ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <FiArrowUpRight className="inline mr-1" />
                  {stat.trend}%
                </span>
              </div>
              <h3 className="text-gray-500 text-sm mt-4">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Growth Analytics</h2>
              <span className="text-indigo-600 text-sm">2024 Report</span>
            </div>
            <div className="h-80">
              <Line data={growthData} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Profit Overview</h2>
              <span className="text-indigo-600 text-sm">Monthly</span>
            </div>
            <div className="h-80">
              <Bar data={profitData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
            <button className="text-indigo-600 text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { 
                title: 'New Project Created', 
                time: '2 hours ago', 
                type: 'project',
                user: 'Sarah Johnson'
              },
              { 
                title: 'Inventory Updated', 
                time: '5 hours ago',
                type: 'inventory',
                user: 'Mike Chen'
              },
              { 
                title: 'Report Generated', 
                time: '8 hours ago',
                type: 'report',
                user: 'Alex Turner'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  {activity.type === 'project' && <FiActivity className="text-indigo-600" />}
                  {activity.type === 'inventory' && <FiUsers className="text-indigo-600" />}
                  {activity.type === 'report' && <FiDollarSign className="text-indigo-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.user} • {activity.time}</p>
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