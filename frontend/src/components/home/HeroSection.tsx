import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import WaveLayer from './WaveLayer';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const up: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

const HeroSection = () => {
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const orbCRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lerped = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      const lx = lerped.current.x;
      const ly = lerped.current.y;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      lerped.current.x = lx + (mx - lx) * 0.06;
      lerped.current.y = ly + (my - ly) * 0.06;

      const t = Date.now() * 0.001;
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Normalized mouse offset: -0.5 to 0.5
      const nx = lerped.current.x / W - 0.5;
      const ny = lerped.current.y / H - 0.5;

      // Orb A: large left/top glow — big parallax + strong autonomous float
      if (orbARef.current) {
        const fx = Math.sin(t * 0.35) * 80 + nx * 150;
        const fy = Math.cos(t * 0.28) * 60 + ny * 150;
        orbARef.current.style.transform = `translate(${fx}px, ${fy}px)`;
      }

      // Orb B: right glow — moves opposite direction for depth illusion
      if (orbBRef.current) {
        const fx = Math.sin(t * 0.4 + 2) * 70 + nx * -200;
        const fy = Math.cos(t * 0.32 + 1) * 60 + ny * -200;
        orbBRef.current.style.transform = `translate(${fx}px, ${fy}px)`;
      }

      // Orb C: cursor-follow glow — tracks mouse closely
      if (orbCRef.current) {
        const cx = lerped.current.x - W / 2;
        const cy = lerped.current.y - H / 2;
        orbCRef.current.style.transform = `translate(calc(-50% + ${cx * 0.5}px), calc(-50% + ${cy * 0.5}px))`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="lc-hero">
      {/* 3D Orb Lights */}
      <div
        ref={orbARef}
        className="lc-orb lc-orb-a"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={orbBRef}
        className="lc-orb lc-orb-b"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={orbCRef}
        className="lc-orb lc-orb-c"
        style={{ willChange: 'transform' }}
      />

      {/* Grid overlay – subtle dot pattern */}
      <div className="lc-grid-overlay" />

      {/* Flowing wave animation */}
      <WaveLayer />

      <div className="lc-shell">
        <motion.div
          className="lc-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Zap size={13} fill="currentColor" />
          AI-Powered Creator Intelligence
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.h1 variants={up} className="lc-headline">
            Grow Your Channel<br />
            <span className="lc-headline-accent">10× Faster</span><br />
            With AI Precision.
          </motion.h1>

          <motion.p variants={up} className="lc-sub">
            Lumin decodes your YouTube analytics, detects content gaps, and generates
            a week-by-week growth roadmap — so you never run out of winning ideas.
          </motion.p>

          <motion.div variants={up} className="lc-cta-row">
            <Link to="/register" className="lc-btn-primary">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="lc-btn-ghost">
              Sign In
            </Link>
          </motion.div>

          <motion.div variants={up} className="lc-social-proof">
            <div className="lc-avatars">
              {['A', 'B', 'C', 'D'].map(l => (
                <div key={l} className="lc-avatar">{l}</div>
              ))}
            </div>
            <span>Trusted by <strong>2,400+</strong> creators</span>
          </motion.div>
        </motion.div>

        {/* Floating UI Card */}
        <motion.div
          className="lc-ui-card"
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.55, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lc-ui-card-top">
            <span className="lc-ui-dot lc-dot-red" />
            <span className="lc-ui-dot lc-dot-yellow" />
            <span className="lc-ui-dot lc-dot-green" />
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Lumin Dashboard</span>
          </div>

          <div className="lc-ui-metrics">
            <div className="lc-ui-metric">
              <span className="lc-ui-metric-val">+38.4%</span>
              <span className="lc-ui-metric-label">View Growth</span>
            </div>
            <div className="lc-ui-metric-divider" />
            <div className="lc-ui-metric">
              <span className="lc-ui-metric-val">+12.1K</span>
              <span className="lc-ui-metric-label">New Subs</span>
            </div>
            <div className="lc-ui-metric-divider" />
            <div className="lc-ui-metric">
              <span className="lc-ui-metric-val">94%</span>
              <span className="lc-ui-metric-label">AI Confidence</span>
            </div>
          </div>

          <div className="lc-chart-bars">
            {[40, 60, 45, 80, 55, 90, 70, 95, 68, 100, 82, 88].map((h, i) => (
              <motion.div
                key={i}
                className="lc-bar"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.7 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
                style={{ background: i >= 9 ? 'linear-gradient(180deg,#a78bfa,#6366f1)' : undefined }}
              />
            ))}
          </div>

          <div className="lc-ui-tag">
            <Zap size={11} fill="#a78bfa" color="#a78bfa" />
            AI Strategy Generated — 3 action items ready
          </div>
        </motion.div>
      </div>

      {/* Scroll down hint */}
      <motion.div
        className="lc-scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <div className="lc-scroll-line">
          <motion.span
            animate={{ y: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear', repeatType: 'loop' }}
          />
        </div>
        <span>Scroll</span>
      </motion.div>
    </section>
  );
};

export default HeroSection;
