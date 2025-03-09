import React from 'react';

interface SettingsProps {
  isCollapsed: boolean;
}

const Settings: React.FC<SettingsProps> = ({ isCollapsed }) => {
  return (
    <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-500">Customize your application settings.</p>
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-700">Dark Mode</p>
              <button className="bg-gray-200 w-10 h-6 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 transition-transform"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-700">Notifications</p>
              <button className="bg-gray-200 w-10 h-6 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 transition-transform"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;