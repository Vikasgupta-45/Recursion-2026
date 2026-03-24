import React, { useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Brain, Film, Calendar, Loader2, Play, Trash2, Sparkles, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useAnalysis } from '../context/AnalysisContext';

/* ── Sidebar link with animated indicator ── */
const SidebarLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <NavLink
      ref={ref}
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
      onMouseEnter={() => {
        if (ref.current) gsap.to(ref.current, { x: 4, duration: 0.25, ease: 'power2.out' });
      }}
      onMouseLeave={() => {
        if (ref.current) gsap.to(ref.current, { x: 0, duration: 0.3, ease: 'power2.out' });
      }}
    >
      <span className="sidebar-link__icon">{icon}</span>
      <span className="sidebar-link__label">{label}</span>
    </NavLink>
  );
};

/* ── Page transition wrapper ── */
const pageTransition = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any },
};

const DashboardLayout = () => {
  const { youtubeUrl, setYoutubeUrl, loading, error, analysisStep, runAnalysis, clearAnalysis, analysis } =
    useAnalysis();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  /* GSAP entrance for sidebar */
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current.querySelectorAll('.sidebar-link'),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
      );
    }
  }, []);

  return (
    <div className="dashboard-root">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="dashboard-sidebar" ref={sidebarRef}>
        <div className="dashboard-sidebar-inner">
          <div className="sidebar-brand">
            <Sparkles size={16} className="sidebar-brand__icon" />
            <span>Dashboard</span>
          </div>

          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
            <SidebarLink to="/dashboard/intelligence" icon={<Brain size={18} />} label="Analysis Panel" />
            <SidebarLink to="/dashboard/videos" icon={<Film size={18} />} label="Videos & Tips" />
            <SidebarLink to="/dashboard/planner" icon={<Calendar size={18} />} label="Content Planner" />
            <SidebarLink to="/dashboard/competitor" icon={<Users size={18} />} label="Competitor Analysis" />
            <div className="sidebar-section-label">AI Tools</div>
            <SidebarLink to="/dashboard/clip-gen" icon={<Film size={18} />} label="Video Clipper" />
            <SidebarLink to="/dashboard/lumin-ai" icon={<Sparkles size={18} />} label="AI Bot Builder" />
          </nav>

          <div style={{ marginTop: 'auto' }}>
            <div className="sidebar-pro-badge">
              <div className="sidebar-pro-badge__glow" />
              <div className="sidebar-pro-badge__title">Pro Analytics</div>
              <div className="sidebar-pro-badge__sub">YouTube API v3 · ML Engine</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="dashboard-main">
        {/* API Bar – only on Overview */}
        {location.pathname === '/dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="api-bar"
          >
            <div className="api-bar__header">
              <div className="api-bar__dot" />
              <span>Growth Engine · Live API</span>
            </div>
            <div className="api-bar__controls">
              <div className="api-bar__input-wrap">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@channel"
                  className="api-bar__input"
                />
              </div>
              <button
                type="button"
                className="api-bar__btn api-bar__btn--primary"
                disabled={loading}
                onClick={() => void runAnalysis()}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                <span>{loading ? 'Analyzing…' : 'Run Analysis'}</span>
              </button>
              <button
                type="button"
                className="api-bar__btn api-bar__btn--ghost"
                onClick={clearAnalysis}
                title="Clear cached results"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loading && analysisStep && (
                <motion.div
                  key="step"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="api-bar__step"
                >
                  <span className="api-bar__step-dot" />
                  {analysisStep}
                </motion.div>
              )}
            </AnimatePresence>

            {error && <div className="api-bar__error">{error}</div>}
            {analysis?.analysis_run_id && (
              <div className="api-bar__run-id">
                Run <code>{String(analysis.analysis_run_id).slice(0, 8)}…</code>
              </div>
            )}
          </motion.div>
        )}

        {/* Page content with transitions */}
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageTransition}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardLayout;
