import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, CalendarClock, Loader2, WandSparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, channelUrl.trim() || undefined);
      navigate('/dashboard', { replace: true });
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Registration failed');
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
            Get started in 60 seconds
          </p>
          <h1 style={{ marginTop: 12, fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 600 }}>
            Launch your growth<br />engine now.
          </h1>
          <p style={{ marginTop: 16, maxWidth: 480, color: 'rgba(255,255,255,0.8)' }}>
            We save your channel URL and every analysis to your account so nothing is lost when you close the browser.
          </p>
          <div className="auth-meta-list">
            <div className="auth-meta-item"><BrainCircuit size={16} /> AI content intelligence</div>
            <div className="auth-meta-item"><CalendarClock size={16} /> Automated weekly planning</div>
            <div className="auth-meta-item"><WandSparkles size={16} /> Actionable optimization ideas</div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="auth-form-card"
        >
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>Get Started</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
            Create your account and connect your YouTube channel.
          </p>

          <form onSubmit={(e) => void handleRegister(e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>YouTube Channel URL</label>
              <input type="url" className="input-field" value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} required placeholder="https://youtube.com/@creator" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Email</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="creator@youtube.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" minLength={8} />
            </div>
            {err ? <div style={{ color: '#ff6b8a', fontSize: '0.88rem' }}>{err}</div> : null}
            <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <Loader2 size={18} className="spin" /> : null}
              Create Account
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: '#9fd8ff', textDecoration: 'none' }}>Login</Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Register;
