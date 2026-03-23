import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '16px 24px',
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(7, 7, 10, 0.7)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff' }}>
          <Activity size={24} color="#8c5fff" />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.5px' }}>Lumin</span>
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {location.pathname !== '/dashboard' && (
             <>
               <Link to="/login" className="btn-nixtio-outline" style={{ textDecoration: 'none', padding: '10px 24px' }}>Login</Link>
               <Link to="/register" className="btn-nixtio" style={{ textDecoration: 'none', padding: '10px 24px' }}>Get Started</Link>
             </>
          )}
          {location.pathname === '/dashboard' && (
               <Link to="/" className="btn-nixtio-outline" style={{ textDecoration: 'none', padding: '10px 24px' }}>Logout</Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
