import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'; 
import Navbar from './component/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import SharedProjectView from './pages/SharedProjectView';
import Inventory from './pages/Inventory';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import SmartNotaInvoices from './pages/SmartNotaInvoices';
import Invoices from './pages/Invoices';
import EquipmentMaster from './pages/EquipmentMaster';
import RekapitulasiCutFill from './pages/RekapitulasiCutFill';
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
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/shared/:projectId/:token" element={<SharedProjectView />} />
        
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
            <Route path="/projects/:id" element={<ProjectDetail isCollapsed={isCollapsed} />} />
            <Route path="/projects/:id/rekapitulasi" element={<RekapitulasiCutFill isCollapsed={isCollapsed} />} />
            <Route path="/finance" element={<Finance isCollapsed={isCollapsed} />} />
            <Route path="/inventory" element={<Inventory isCollapsed={isCollapsed} />} />
            <Route path="/team" element={<Team isCollapsed={isCollapsed} />} />
            <Route path="/team/inactive" element={<Team isCollapsed={isCollapsed} />} />
            <Route path="/reports" element={<Reports isCollapsed={isCollapsed} />} />
            <Route path="/settings" element={<Settings isCollapsed={isCollapsed} />} />
            <Route path="/smart-nota" element={<SmartNotaInvoices isCollapsed={isCollapsed} />} />
            <Route path="/invoices" element={<Invoices isCollapsed={isCollapsed} />} />
            <Route path="/equipment" element={<EquipmentMaster isCollapsed={isCollapsed} />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;