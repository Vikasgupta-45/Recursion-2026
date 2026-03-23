import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Intelligence from './pages/dashboard/Intelligence';

import Strategy from './pages/dashboard/Strategy';
import Forecasting from './pages/dashboard/Forecasting';
import ContentPlanner from './pages/dashboard/ContentPlanner';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="intelligence" element={<Intelligence />} />
              <Route path="strategy" element={<Strategy />} />
              <Route path="forecasting" element={<Forecasting />} />
              <Route path="planner" element={<ContentPlanner />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
