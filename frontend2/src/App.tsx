import { Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./pages/dashboard/DashboardLayout";
import { IntelligencePage } from "./pages/dashboard/IntelligencePage";
import { OpportunitiesPage } from "./pages/dashboard/OpportunitiesPage";
import { StrategyBoardPage } from "./pages/dashboard/StrategyBoardPage";
import { ExplainabilityPage } from "./pages/dashboard/ExplainabilityPage";
import { MetricsPage } from "./pages/dashboard/MetricsPage";

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.15),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.11),transparent_26%)]" />
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="intelligence" replace />} />
                <Route path="intelligence" element={<IntelligencePage />} />
                <Route path="opportunities" element={<OpportunitiesPage />} />
                <Route path="strategy" element={<StrategyBoardPage />} />
                <Route path="explainability" element={<ExplainabilityPage />} />
                <Route path="metrics" element={<MetricsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthProvider>
  );
}

export default App;
