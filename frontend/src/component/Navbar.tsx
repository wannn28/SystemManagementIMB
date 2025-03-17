import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiFolder, FiBox, FiUsers, FiFlag, FiSettings, FiHelpCircle, FiLogOut, FiChevronLeft, FiCreditCard } from 'react-icons/fi';
import Logo from '../assets/images/logo.png';

interface NavbarProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isCollapsed }) => {
  const [activeMenu, setActiveMenu] = useState('Home');
  const menuItems = [
    { name: 'Home', icon: <FiHome />, path: '/' },
    { name: 'Projects', icon: <FiFolder />, path: '/projects' },
    { name: 'Inventory', icon: <FiBox />, path: '/inventory' },
    { name: 'Team', icon: <FiUsers />, path: '/team' },
    { name: 'Reports', icon: <FiFlag />, path: '/reports' },
    { name: 'Finance', icon: <FiCreditCard />, path: '/finance' },
    { name: 'Settings', icon: <FiSettings />, path: '/settings' },
  ];
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
    <nav
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center p-5 mb-6">
        <img
          src={Logo}
          alt="Logo"
          className={`transition-all ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12 mr-2'}`}
        />
        {!isCollapsed && (
          <h1 className="text-xl font-semibold text-gray-800 truncate">
            Indira Maju
          </h1>
        )}
      </div>

      {/* Menu Items */}
      <ul className="flex flex-col space-y-1 px-3">
        {menuItems.map((item) => (
          <li
            key={item.name}
            onClick={() => setActiveMenu(item.name)}
            className={`group flex items-center rounded-lg p-3 cursor-pointer transition-all ${activeMenu === item.name
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
              } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Link to={item.path} className="flex items-center w-full">
              <span className={`text-lg ${!isCollapsed && 'mr-3'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </Link>
            {/* Hover Tooltip */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.name}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Footer Section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
        {/* Profile Section */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
          <div className="flex items-center">
            <div className="relative">
              <img
                src="https://source.unsplash.com/100x100/?portrait"
                className="w-8 h-8 rounded-full"
                alt="Profile"
              />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">John Doe</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Help & Logout */}
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} space-x-2`}>
          <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
            <FiHelpCircle className="text-lg" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
            <FiLogOut className="text-lg" />
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="w-full mt-4 p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
        >
          <FiChevronLeft className={`mx-auto transform transition-transform ${isCollapsed ? 'rotate-180' : ''
            }`} />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <FiLogOut className="text-lg" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;