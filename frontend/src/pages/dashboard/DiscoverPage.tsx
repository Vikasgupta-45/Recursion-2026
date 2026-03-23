import { AlertCircle, Flame, Target, Map } from "lucide-react";

export function DiscoverPage() {
  const contentGaps = [
    {
      topic: "Advanced Data Visualization UI",
      globalDemand: 94,
      creatorOverlap: 5,
      urgency: "High",
    },
    {
      topic: "Framer Motion Best Practices",
      globalDemand: 88,
      creatorOverlap: 12,
      urgency: "High",
    },
    {
      topic: "FastAPI + React Integration",
      globalDemand: 76,
      creatorOverlap: 35,
      urgency: "Moderate",
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Map color="var(--accent)" /> Global Content Gap Map
        </h2>
        <p className="muted">Your historical content footprint mapped against macro-market momentum signals.</p>

        {/* CSS Heatmap Simulation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginTop: '2rem'
        }}>
          {[...Array(16)].map((_, i) => {
            const isHighGap = [2, 7, 11].includes(i);
            const isSaturated = [0, 4, 5, 8, 12, 13].includes(i);
            
            return (
              <div key={i} style={{
                height: '80px',
                borderRadius: '8px',
                background: isHighGap ? 'var(--accent-2)' : (isSaturated ? 'var(--muted)' : 'var(--bg)'),
                border: isHighGap ? '2px solid var(--accent)' : '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSaturated ? 0.3 : 1
              }}>
                {isHighGap && <Flame color="white" />}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: 'var(--muted)', opacity: 0.3, borderRadius: 2 }} /> Saturated</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 2 }} /> Unexplored</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: 'var(--accent-2)', border: '2px solid var(--accent)', borderRadius: 2 }} /> High-Value Gap</span>
        </div>
      </section>

      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle color="var(--accent)" /> High-Value Gap Alerts
        </h2>
        <p className="muted">Immediate opportunities detected based on &lt;15% catalog overlap against rising trends.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {contentGaps.map((gap, i) => (
            <div key={i} className="inner-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0 }}>{gap.topic}</h3>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.95rem' }}>
                  <span>Global Demand: <strong style={{ color: 'var(--accent-2)'}}>{gap.globalDemand}/100</strong></span>
                  <span>Catalog Overlap: <strong style={{ color: 'var(--text-h)'}}>{gap.creatorOverlap}%</strong></span>
                </div>
              </div>
              
              {gap.urgency === "High" && (
                <div style={{ 
                  background: 'var(--accent-soft)', 
                  border: '1px solid var(--accent)', 
                  color: 'var(--text-h)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Target size={18} /> Focus Now
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
