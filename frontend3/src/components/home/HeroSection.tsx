import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const HeroSection = () => (
  <section className="home-hero">
    <div className="hero-gradient hero-gradient-a" />
    <div className="hero-gradient hero-gradient-b" />

    <div className="home-shell">
      <motion.div variants={container} initial="hidden" animate="show" className="hero-grid">
        <div>
          <motion.p variants={item} className="hero-kicker">
            Unified Autonomous Growth System
          </motion.p>
          <motion.h1 variants={item} className="hero-title">
            Turn creator data into predictable growth.
          </motion.h1>
          <motion.p variants={item} className="hero-sub">
            Lumin fuses analytics, content intelligence, forecasting, and explainability to
            generate strategic action plans, not random suggestions.
          </motion.p>
          <motion.div variants={item} className="hero-actions">
            <Link to="/register" className="btn-nixtio">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#services" className="btn-nixtio-outline">
              <PlayCircle size={18} /> Explore Features
            </a>
          </motion.div>
        </div>

        <motion.div variants={item} className="hero-spotlight-card">
          <p className="spotlight-label">Live Prediction Signal</p>
          <h3>+18.4% channel growth</h3>
          <p>60-day confidence model indicates a high upside if weekend scheduling is optimized.</p>
          <div className="spotlight-meter">
            <span />
          </div>
          <div className="spotlight-tags">
            <span>Forecasting</span>
            <span>Strategy</span>
            <span>Explainable AI</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
