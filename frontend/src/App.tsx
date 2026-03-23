import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AuthProvider } from "./context/AuthContext";
import { PublicNavbar } from "./components/PublicNavbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./pages/dashboard/DashboardLayout";
import { AccountPage } from "./pages/dashboard/AccountPage";
import { AnalyticsPage } from "./pages/dashboard/AnalyticsPage";
import { StrategiesPage } from "./pages/dashboard/StrategiesPage";
import { DiscoverPage } from "./pages/dashboard/DiscoverPage";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => { lenis.raf(time * 1000); });
    };
  }, []);

  return (
    <AuthProvider>
      <div className="app-shell">
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <PublicNavbar />
        <div className="page-body">
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
                <Route index element={<Navigate to="account" replace />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="strategies" element={<StrategiesPage />} />
                <Route path="discover" element={<DiscoverPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
