import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Clock, Calendar as CalendarIcon, PlayCircle } from 'lucide-react';

const dayData = [
  { name: 'Mon', engagement: 65 }, { name: 'Tue', engagement: 85 },
  { name: 'Wed', engagement: 55 }, { name: 'Thu', engagement: 95 },
  { name: 'Fri', engagement: 120 }, { name: 'Sat', engagement: 150 },
  { name: 'Sun', engagement: 140 },
];

const durationData = [
  { x: 3, y: 15, z: 200, name: 'Shorts' },
  { x: 8, y: 40, z: 200, name: 'Standard' },
  { x: 12, y: 85, z: 400, name: 'Mid' },
  { x: 20, y: 120, z: 300, name: 'Long' },
  { x: 35, y: 90, z: 150, name: 'Mini-Doc' },
];

const Intelligence = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Channel Intelligence</h1>
        <p style={{ color: 'var(--text-muted)' }}>AI-driven analysis of what drives your channel's performance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Posting Days Analysis */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CalendarIcon size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.25rem' }}>Best Posting Days</h3>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="engagement" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Video Duration Sweet-spot */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Clock size={20} color="#ff3366" />
            <h3 style={{ fontSize: '1.25rem' }}>Ideal Duration Analysis</h3>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Duration (m)" stroke="var(--text-muted)" />
                <YAxis type="number" dataKey="y" name="Views (k)" stroke="var(--text-muted)" />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Weight" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Scatter name="Videos" data={durationData} fill="#ff3366" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Content Insights Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <PlayCircle size={20} color="#8c5fff" />
          <h3 style={{ fontSize: '1.25rem' }}>Content format correlation</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(140, 95, 255, 0.1)', border: '1px solid rgba(140, 95, 255, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Top Title Structure</div>
            <div style={{ fontWeight: 600, marginTop: '8px' }}>"I Tried X for 30 Days..."</div>
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#00ff88' }}>+42% CTR</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hook Retention</div>
            <div style={{ fontWeight: 600, marginTop: '8px' }}>Fast Pacing (0-15s)</div>
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#00ff88' }}>68% Retention</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Thumbnail Color</div>
            <div style={{ fontWeight: 600, marginTop: '8px' }}>High Contrast Blue</div>
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#00ff88' }}>+1.2% CTR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intelligence;
