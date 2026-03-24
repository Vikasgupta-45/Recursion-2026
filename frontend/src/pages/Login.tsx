import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-panel"
        >
          <p style={{ fontSize: '0.85rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d9d9d9' }}>
            Return to command center
          </p>
          <h1 style={{ marginTop: 12, fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 600 }}>
            Welcome back,<br />Creator.
          </h1>
          <p style={{ marginTop: 16, maxWidth: 460, color: 'rgba(255,255,255,0.8)' }}>
            Your analyses are stored on the server — sign in to reload history on any device.
          </p>
          <div className="auth-meta-list">
            <div className="auth-meta-item"><BarChart3 size={16} /> Live growth dashboards</div>
            <div className="auth-meta-item"><Sparkles size={16} /> AI-backed opportunity scoring</div>
            <div className="auth-meta-item"><ShieldCheck size={16} /> Secure creator workspace</div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="auth-form-card"
        >
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
            Login to access your personalized dashboard.
          </p>

          <form onSubmit={(e) => void handleLogin(e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Email</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="creator@youtube.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={1} />
            </div>
            {err ? <div style={{ color: '#ff6b8a', fontSize: '0.88rem' }}>{err}</div> : null}
            <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <Loader2 size={18} className="spin" /> : null}
              Sign In
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            New here? <Link to="/register" style={{ color: '#9fd8ff', textDecoration: 'none' }}>Get started</Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Login;
