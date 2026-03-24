import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Intelligence from './pages/dashboard/Intelligence';
import Strategy from './pages/dashboard/Strategy';
import Forecasting from './pages/dashboard/Forecasting';
import ContentPlanner from './pages/dashboard/ContentPlanner';
import Competitor from './pages/dashboard/Competitor';
import Videos from './pages/dashboard/Videos';
import ClipGen from './pages/dashboard/ClipGen';
import LuminAI from './pages/dashboard/LuminAI';
import { AuthProvider } from './context/AuthContext';
import { AnalysisProvider } from './context/AnalysisContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AnalysisProvider>
                      <DashboardLayout />
                    </AnalysisProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="intelligence" element={<Intelligence />} />
                <Route path="videos" element={<Videos />} />
                <Route path="strategy" element={<Strategy />} />
                <Route path="forecasting" element={<Forecasting />} />
                <Route path="planner" element={<ContentPlanner />} />
                <Route path="competitor" element={<Competitor />} />
                <Route path="clip-gen" element={<ClipGen />} />
                <Route path="lumin-ai" element={<LuminAI />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
