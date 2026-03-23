import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard'); // simulate login
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
            Continue with your growth engine and monitor strategy, forecasting, and channel intelligence in one place.
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Email</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required placeholder="creator@youtube.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Password</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary">Sign In</button>
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
