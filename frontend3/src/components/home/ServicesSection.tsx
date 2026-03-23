import { motion, type Variants } from 'framer-motion';
import { TrendingUp, BarChart2, Zap, Layers, Timer, Sparkles } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1, ease: [0.25, 1, 0.3, 1] } 
  }
};

const ServicesSection = () => {
  const cards = [
    {
      icon: BarChart2,
      id: '01',
      title: 'Channel Intelligence Engine',
      body: 'Break down retention, CTR, posting consistency, and audience behavior across content clusters.',
    },
    {
      icon: Layers,
      id: '02',
      title: 'Opportunity Detector',
      body: 'Find high-momentum content spaces with low overlap in your existing channel catalog.',
    },
    {
      icon: TrendingUp,
      id: '03',
      title: 'Predictive Forecasting',
      body: 'Estimate next 60-day growth curves with confidence ranges and trend-aware modeling.',
    },
    {
      icon: Zap,
      id: '04',
      title: 'Agentic Strategy Board',
      body: 'Get weekly content and promotion recommendations generated from your performance signals.',
    },
    {
      icon: Timer,
      id: '05',
      title: 'Timing Optimization',
      body: 'Identify best upload windows by audience activity and historical high-engagement sessions.',
    },
    {
      icon: Sparkles,
      id: '06',
      title: 'Explainability Layer',
      body: 'Each recommendation includes mathematical reasoning so creators can trust every action.',
    },
  ];

  return (
    <section id="services" className="home-section">
      <div className="home-shell">
        <div className="section-head">
          <div>
            <h2>
              Designed for creators<br />who scale deliberately.
            </h2>
          </div>
          <p>
            One intelligent platform to analyze channel performance, detect gaps, and convert raw
            insight into a focused execution plan.
          </p>
        </div>

        <div className="service-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                variants={fadeUp}
                className="service-card"
              >
                <div className="service-card-head">
                  <div className="service-icon">
                    <Icon size={22} />
                  </div>
                  <span>{card.id}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
