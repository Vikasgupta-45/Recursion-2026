import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import Footer from '../components/home/Footer';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      <HeroSection />
      <section className="home-metrics">
        <div className="home-shell metrics-grid">
          {[
            ['1.2M+', 'Subscribers analyzed'],
            ['98%', 'Insight confidence'],
            ['60 days', 'Forecast horizon'],
            ['24/7', 'AI strategy generation'],
          ].map(([value, label], idx) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="metric-card"
            >
              <h3>{value}</h3>
              <p>{label}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <ServicesSection />
      <Footer />
    </div>
  );
};

export default Home;
