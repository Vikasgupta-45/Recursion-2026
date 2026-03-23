import { Calendar as CalendarIcon, Search, Tag, Video } from 'lucide-react';

const ContentPlanner = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Content Planner & Optimization</h1>
        <p style={{ color: 'var(--text-muted)' }}>Actionable execution hub mapping AI strategy into your daily schedule.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* SEO & Content Optimizer */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={20} color="#00ff88" />
            <h3 style={{ fontSize: '1.25rem' }}>SEO Optimizer</h3>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>High-Ranking Tags for Next Video</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['budget keyboard', 'mechanical keyboard under 50', 'tech review 2024', 'typing sound test'].map((tag, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Tag size={12} color="var(--accent-color)" /> {tag}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Optimized Title Suggestions (A/B Test)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(140, 95, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(140, 95, 255, 0.2)', fontSize: '0.875rem' }}>
                <span style={{ color: '#8c5fff', fontWeight: 600, marginRight: '8px' }}>A.</span>
                I Found the Best Mechanical Keyboard Under $50
              </div>
              <div style={{ padding: '12px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.2)', fontSize: '0.875rem' }}>
                <span style={{ color: '#00d4ff', fontWeight: 600, marginRight: '8px' }}>B.</span>
                Stop Buying Expensive Keyboards (Buy This Instead)
              </div>
            </div>
          </div>
        </div>

        {/* 30-Day Content Calendar */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} color="#8c5fff" />
              <h3 style={{ fontSize: '1.25rem' }}>30-Day Content Calendar</h3>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>October 2024</div>
          </div>
          
          {/* Simple Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', paddingBottom: '8px' }}>{day}</div>
            ))}
            
            {/* Generate 35 cells for standard calendar view */}
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - 2 > 0 && i - 2 <= 31 ? i - 2 : null;
              const isUploadDay = dayNum === 10 || dayNum === 14 || dayNum === 24;
              const isScriptDay = dayNum === 5 || dayNum === 8 || dayNum === 19;
              
              return (
                <div key={i} style={{ 
                  height: '80px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '8px', 
                  border: isUploadDay ? '1px solid rgba(255,51,102,0.3)' : isScriptDay ? '1px solid rgba(140, 95, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ color: dayNum ? '#fff' : 'transparent', fontSize: '0.75rem' }}>{dayNum || '-'}</div>
                  {isUploadDay && (
                    <div style={{ marginTop: 'auto', background: '#ff3366', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Video size={10} /> Publish
                    </div>
                  )}
                  {isScriptDay && (
                    <div style={{ marginTop: 'auto', background: '#8c5fff', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Drafting
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContentPlanner;
