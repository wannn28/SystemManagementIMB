import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFolder, FiBox, FiUsers, FiFlag, FiSettings, FiLogOut, FiChevronLeft, FiCreditCard, FiFileText } from 'react-icons/fi';
import Logo from '../assets/images/logo.png';

interface NavbarProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isCollapsed }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Home', icon: <FiHome />, path: '/' },
    { name: 'Projects', icon: <FiFolder />, path: '/projects' },
    { name: 'Inventory', icon: <FiBox />, path: '/inventory' },
    { name: 'Team', icon: <FiUsers />, path: '/team' },
    { name: 'Reports', icon: <FiFlag />, path: '/reports' },
    { name: 'Finance', icon: <FiCreditCard />, path: '/finance' },
    { name: 'Smart Nota', icon: <FiFileText />, path: '/smart-nota' },
    { name: 'Settings', icon: <FiSettings />, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav
      className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition-all duration-300 z-50 ${
        isCollapsed ? 'w-28' : 'w-72'
      }`}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 pointer-events-none"></div>

      {/* Logo Section */}
      <div className="relative p-6 mb-2">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl blur-md opacity-50"></div>
            <img
              src={Logo}
              alt="Logo"
              className={`relative transition-all duration-300 ${
                isCollapsed ? 'w-16 h-12' : 'w-16 h-12'
              } rounded-xl object-cover`}
            />
          </div>
          {!isCollapsed && (
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Indira Maju
              </h1>
              <p className="text-xs text-orange-300 font-medium">Construction Office</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-3 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 250px)' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.name} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center rounded-xl p-3.5 cursor-pointer transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <span className={`text-xl ${!isCollapsed && 'mr-4'} ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
                )}
              </Link>
              
              {/* Hover Tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-slate-700">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        {/* Profile Section */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-3`}>
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full blur-sm"></div>
              <img
                src="https://ui-avatars.com/api/?name=Admin+IMB&background=f97316&color=fff&bold=true"
                className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} rounded-full ring-2 ring-orange-500/30`}
                alt="Profile"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-semibold text-white">Admin IMB</p>
                <p className="text-xs text-orange-300">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <button
            onClick={toggleSidebar}
            className="flex-1 p-2.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all duration-200 group"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <FiChevronLeft
              className={`mx-auto transform transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              } group-hover:scale-110`}
            />
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 p-2.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-all duration-200 group"
            title="Logout"
          >
            <FiLogOut className="mx-auto group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;