import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar.tsx';
import Home from './pages/Home.tsx';
import Projects from './pages/Projects.tsx';
import Inventory from './pages/Inventory.tsx';
import Team from './pages/Team.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <BrowserRouter>
      <div className="flex">
        <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home isCollapsed={isCollapsed} />} />
            <Route path="/projects" element={<Projects isCollapsed={isCollapsed} />} />
            <Route path="/inventory" element={<Inventory isCollapsed={isCollapsed} />} />
            <Route path="/team" element={<Team isCollapsed={isCollapsed} />} />
            <Route path="/reports" element={<Reports isCollapsed={isCollapsed} />} />
            <Route path="/settings" element={<Settings isCollapsed={isCollapsed} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;