import { Target, Zap, AlertCircle } from 'lucide-react';

const Strategy = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>AI Strategy & Opportunities</h1>
        <p style={{ color: 'var(--text-muted)' }}>Forward-looking plan based on macro market trends and your channel's unique footprint.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Detected Content Gaps */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <AlertCircle size={20} color="#ff3366" />
            <h3 style={{ fontSize: '1.25rem' }}>Detected Content Gaps</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>Topics with high search volume but low competition in your niche right now.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { topic: 'Budget mechanical keyboards under $50', vol: 'High', comp: 'Low' },
              { topic: 'Notion vs Obsidian for Students', vol: 'Very High', comp: 'Medium' },
              { topic: 'Wireless earbuds durability test', vol: 'Medium', comp: 'Low' },
            ].map((gap, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,51,102,0.05)', borderRadius: '8px', border: '1px solid rgba(255,51,102,0.1)' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>{gap.topic}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Search Vol: <span style={{ color: '#fff' }}>{gap.vol}</span></span>
                  <span>Competition: <span style={{ color: '#00cc88' }}>{gap.comp}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Roadmap */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Target size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.25rem' }}>AI Weekly Strategy Roadmap</h3>
          </div>
          
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '7px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
            
            {[
              { week: 'Week 1', focus: 'Capture Budget Keyboard Gap', action: 'Upload 1 long-form review + 3 supporting Shorts.' },
              { week: 'Week 2', focus: 'Double Down on Retention', action: 'Implement fast-paced editing (0-15s) based on intelligence report.' },
              { week: 'Week 3', focus: 'Expand Niche Authority', action: 'Produce Notion vs Obsidian video with highly optimized SEO tags.' },
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px rgba(0, 212, 255, 0.4)' }} />
                <div style={{ color: '#00d4ff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{step.week}</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{step.focus}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{step.action}</div>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Regenerate Strategy <Zap size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Strategy;
