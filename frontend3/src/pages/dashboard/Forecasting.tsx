import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, CheckCircle } from 'lucide-react';

const forecastData = Array.from({ length: 60 }, (_, i) => ({
  day: `Day ${i + 1}`,
  actualViews: i < 20 ? 4000 + Math.random() * 2000 + (i * 100) : null,
  predictedViews: i >= 19 ? 4000 + Math.random() * 500 + (i * 150) : null,
  confidenceMin: i >= 19 ? 3500 + (i * 100) : null,
  confidenceMax: i >= 19 ? 4500 + (i * 200) : null,
}));

const SubscriberForecast = Array.from({ length: 12 }, (_, i) => ({
  month: `Month ${i+1}`,
  subs: Math.floor(142000 * Math.pow(1.05, i))
}));

const Forecasting = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>60-Day Projections</h1>
          <p style={{ color: 'var(--text-muted)' }}>Machine learning forecasts based on your historical momentum.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '20px', border: '1px solid rgba(0,255,136,0.2)' }}>
          <CheckCircle size={14} color="#00ff88" />
          <span style={{ fontSize: '0.75rem', color: '#00ff88', fontWeight: 600 }}>Using youtube_data_api_v3 & Agentic Engine</span>
        </div>
      </div>

      {/* Views Prediction Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Activity size={20} color="#8c5fff" />
          <h3 style={{ fontSize: '1.25rem' }}>Views Forecast (Next 60 Days)</h3>
        </div>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer>
            <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
              
              {/* Actual Data */}
              <Line type="monotone" dataKey="actualViews" stroke="#fff" strokeWidth={2} dot={false} />
              {/* Predicted Data */}
              <Line type="monotone" dataKey="predictedViews" stroke="#8c5fff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Subscriber Milestone Forecast */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <TrendingUp size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.25rem' }}>Subscriber Trajectory</h3>
          </div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={SubscriberForecast}>
                <defs>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} 
                       tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="subs" stroke="#00d4ff" fillOpacity={1} fill="url(#colorSubs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Rate Projection */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Projected Engagement Rate</h3>
          <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Simple CSS donut chart representation */}
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00ff88" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>9.2%</span>
              <span style={{ fontSize: '0.875rem', color: '#00ff88' }}>+0.8% Target</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '24px', maxWidth: '80%' }}>
            If you follow the recommended content planner, your engagement rate is forecasted to increase by 0.8% over the next quarter.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
