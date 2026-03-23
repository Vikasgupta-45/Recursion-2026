import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="home-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="footer-cta"
        >
          <h2>Ready to build predictable growth?</h2>
          <p>Join the creator intelligence platform built for high-signal decisions.</p>
          <Link to="/register" className="btn-nixtio">
            Create Account
          </Link>
        </motion.div>

        <div className="footer-grid">
          <div>
            <Link to="/" className="footer-brand">
              <Activity size={20} />
              <span>Lumin</span>
            </Link>
            <p>Unified intelligence for content, audience, and promotion optimization.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="#services">Intelligence</a>
            <a href="#services">Opportunities</a>
            <a href="#services">Forecasting</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Status</a>
            <a href="#">Support</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Lumin Intelligence</span>
          <div>
            <a href="#">X</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
