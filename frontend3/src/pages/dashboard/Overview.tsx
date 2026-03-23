import React from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Video, Percent, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Week 1', views: 4000 },
  { name: 'Week 2', views: 5000 },
  { name: 'Week 3', views: 4800 },
  { name: 'Week 4', views: 6500 },
  { name: 'Week 5', views: 9200 },
];

const StatCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="glass-panel" 
    style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
      <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        {icon}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
      <span style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: '0.875rem', color: '#00d4ff', marginBottom: '6px', fontWeight: 500 }}>{trend}</span>
    </div>
  </motion.div>
);

const Overview = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening with your channel today.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <StatCard title="Total Subscribers" value="142.5K" icon={<Users size={20} color="#8c5fff" />} trend="+2.4% this mo" />
        <StatCard title="Total Views" value="2.4M" icon={<Eye size={20} color="#00d4ff" />} trend="+12.1% this mo" />
        <StatCard title="Total Videos" value="342" icon={<Video size={20} color="#ff3366" />} trend="+4 this mo" />
        <StatCard title="Avg Engagement" value="8.4%" icon={<Percent size={20} color="#00ff88" />} trend="+0.8% this mo" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Channel Growth Snapshot Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>View Momentum</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Last 30 Days</span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8c5fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8c5fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#8c5fff" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Niche Trend Widget */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Niche Trends</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Tech Reviews', 'Mechanical Keyboards', 'Desk Setups', 'Productivity Apps'].map((trend, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{trend}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00cc88', fontSize: '0.875rem' }}>
                  <TrendingUp size={16} /> {(Math.random() * 40 + 60).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: 'auto', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            Explore Keywords
          </button>
        </div>
      </div>

      {/* Recent Uploads Snippet */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Recent Uploads</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {[
             { title: 'I Built the Ultimate Productivity Desk Setup (2024)', views: '142K', duration: '14:20', date: '2 days ago' },
             { title: 'Why I Stopped Using Notion', views: '89K', duration: '08:45', date: '1 week ago' },
             { title: 'Review: Logitech MX Master 4 - Is it worth it?', views: '210K', duration: '11:15', date: '2 weeks ago' },
           ].map((vid, i) => (
             <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
               <div style={{ fontWeight: 500 }}>{vid.title}</div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{vid.views} Views</div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{vid.duration}</div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'right' }}>{vid.date}</div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
