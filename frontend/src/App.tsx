import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'; 
import Navbar from './component/Navbar.tsx';
import Home from './pages/Home.tsx';
import Projects from './pages/Projects.tsx';
import Inventory from './pages/Inventory.tsx';
import Team from './pages/Team.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';
import Finance from './pages/Finance.tsx';
import Login from './pages/Login';
import ProtectedRoute from './component/ProtectedRoute';

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <div className="flex">
              <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
              <div className="flex-1">
                {/* Hapus Routes disini dan gunakan Outlet */}
                <Outlet />
              </div>
            </div>
          }>
            {/* Definisikan semua route protected disini */}
            <Route index element={<Home isCollapsed={isCollapsed} />} />
            <Route path="/projects" element={<Projects isCollapsed={isCollapsed} />} />
            <Route path="/finance" element={<Finance isCollapsed={isCollapsed} />} />
            <Route path="/inventory" element={<Inventory isCollapsed={isCollapsed} />} />
            <Route path="/team" element={<Team isCollapsed={isCollapsed} />} />
            <Route path="/reports" element={<Reports isCollapsed={isCollapsed} />} />
            <Route path="/settings" element={<Settings isCollapsed={isCollapsed} />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;