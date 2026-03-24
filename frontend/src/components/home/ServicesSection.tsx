import { motion, type Variants } from 'framer-motion';
import { TrendingUp, BarChart2, Zap, Layers, Timer, Sparkles } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const cards = [
  { icon: BarChart2, id: '01', title: 'Channel Intelligence Engine', body: 'Break down retention, CTR, posting consistency, and audience behaviour across content clusters.' },
  { icon: Layers, id: '02', title: 'Opportunity Detector', body: 'Find high-momentum content spaces with low overlap in your existing channel catalog.' },
  { icon: TrendingUp, id: '03', title: 'Predictive Forecasting', body: 'Estimate next 60-day growth curves with confidence ranges and trend-aware modelling.' },
  { icon: Zap, id: '04', title: 'Agentic Strategy Board', body: 'Weekly content and promotion recommendations generated from your performance signals.' },
  { icon: Timer, id: '05', title: 'Timing Optimisation', body: 'Identify best upload windows by audience activity and historical high-engagement sessions.' },
  { icon: Sparkles, id: '06', title: 'Explainability Layer', body: 'Every recommendation includes mathematical reasoning so creators can trust every action.' },
];

const ServicesSection = () => (
  <section className="lc-section" id="services">
    <div className="lc-shell">
      <div className="lc-section-head">
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="lc-section-kicker"
        >
          Features
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="lc-section-title"
        >
          Built for creators who<br />scale deliberately.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
          className="lc-section-sub"
        >
          One intelligence platform to analyse performance, detect gaps, and convert raw insight into a focused execution plan.
        </motion.p>
      </div>

      <div className="lc-features-grid">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.id}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              transition={{ delay: (i % 3) * 0.1 }}
              whileHover={{ 
                y: -10, 
                transition: { type: 'spring', stiffness: 350, damping: 20 }
              }}
              className="lc-feature-card"
            >
              <div className="lc-feature-top" style={{ position: 'relative', zIndex: 2 }}>
                <div className="lc-feature-icon">
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <span className="lc-feature-num">{card.id}</span>
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  </section>
);

export default ServicesSection;
