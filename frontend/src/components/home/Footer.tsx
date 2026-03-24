import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Twitter, Linkedin, Instagram, ArrowUpRight } from 'lucide-react';
import Logo from '../common/Logo';

const Footer = () => (
  <footer className="lc-footer">
    <div className="lc-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="lc-footer-cta"
      >
        <h2>Ready to build predictable growth?</h2>
        <p>Join the creator intelligence platform built for high-signal decisions.</p>
        <Link to="/register" className="lc-btn-primary" style={{ display: 'inline-flex' }}>
          Create Account
        </Link>
      </motion.div>

      <div className="lc-footer-grid">
        <div className="lc-footer-brand-col">
          <Link to="/" className="lc-footer-brand">
            <Logo size={28} />
            <span>Lumin</span>
          </Link>
          <p className="lc-footer-tagline">Unified intelligence for content, audience, and promotion optimisation.</p>
        </div>
        
        <div className="lc-footer-links">
          <div>
            <h4>Platform</h4>
            <a href="#services">Intelligence</a>
            <a href="#services">Opportunities</a>
            <a href="#services">Forecasting</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#">Documentation <ArrowUpRight size={12} /></a>
            <a href="#">API Status</a>
            <a href="#">Support</a>
          </div>
        </div>
      </div>

      <div className="lc-footer-bottom">
        <div className="lc-footer-copyright">
          <span>© {new Date().getFullYear()} Lumin Intelligence. All rights reserved.</span>
        </div>
        <div className="lc-footer-socials">
          <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
          <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
          <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
