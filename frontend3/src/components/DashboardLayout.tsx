import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Brain, Target, LineChart, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  return (
    <NavLink 
      to={to} 
      end={to === '/dashboard'}
      className={({ isActive }) => (isActive ? 'dashboard-link active' : 'dashboard-link')}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const DashboardLayout = () => {
  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-inner">
          <div className="dashboard-sidebar-label">Menu</div>
          <nav>
            <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
            <SidebarLink to="/dashboard/intelligence" icon={<Brain size={20} />} label="Intelligence" />
            <SidebarLink to="/dashboard/strategy" icon={<Target size={20} />} label="AI Strategy" />
            <SidebarLink to="/dashboard/forecasting" icon={<LineChart size={20} />} label="Forecasting" />
            <SidebarLink to="/dashboard/planner" icon={<Calendar size={20} />} label="Content Planner" />
          </nav>
          
          <div style={{ marginTop: 'auto' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(204, 151, 255, 0.08)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Pro Analytics Active</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Using YouTube API v3 & Strategy Engine</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
         >
           <Outlet />
         </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
