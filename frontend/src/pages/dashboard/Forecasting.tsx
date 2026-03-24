import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Activity, CheckCircle, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { formatCompact, formatPercent } from '../../lib/format';

const Forecasting = () => {
  const { analysis, loading } = useAnalysis();

  const lineData = useMemo(() => {
    const pts = analysis?.predictions?.views_forecast?.forecast;
    if (!pts?.length) return [];
    return pts.map((p, i) => ({
      day: i + 1,
      label: p.ds,
      predicted: p.yhat,
      low: p.yhat_lower,
      high: p.yhat_upper,
    }));
  }, [analysis]);

  const subPts = analysis?.predictions?.subscriber_forecast?.forecast;
  const subData = useMemo(() => {
    if (!subPts?.length) return [];
    return subPts.map((p, i) => ({
      i: i + 1,
      subs: p.yhat,
    }));
  }, [subPts]);

  const eng = analysis?.predictions?.engagement_forecast;
  const src = analysis?.predictions?.timeseries_source;

  if (loading && !analysis) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Run analysis to load forecasts.
      </div>
    );
  }

  const vf = analysis.predictions?.views_forecast;
  const sf = analysis.predictions?.subscriber_forecast;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>60-day projections</h1>
          <p style={{ color: 'var(--text-muted)' }}>From <code>predictions.*_forecast</code> (ensemble backend).</p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(0,255,136,0.2)',
          }}
        >
          <CheckCircle size={14} color="#00ff88" />
          <span style={{ fontSize: '0.75rem', color: '#00ff88', fontWeight: 600 }}>
            {String(src ?? 'unknown').replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={20} color="#8c5fff" />
          <h3 style={{ fontSize: '1.25rem' }}>Views forecast</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Current {formatCompact(vf?.current_value)} → predicted {formatCompact(vf?.predicted_value)} (
          {vf?.growth_pct != null ? `${vf.growth_pct}%` : '—'})
          {vf?.models_used?.length ? ` · models: ${vf.models_used.join(', ')}` : ''}
        </p>
        <div style={{ width: '100%', minWidth: 0, minHeight: lineData.length ? 350 : 48 }}>
          {lineData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No forecast series in response.</p>
          ) : (
            <ResponsiveContainer width="100%" height={350} minWidth={0}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Line type="monotone" dataKey="predicted" stroke="#8c5fff" strokeWidth={2} dot={false} name="yhat" />
                <Line type="monotone" dataKey="low" stroke="#555" strokeWidth={1} dot={false} strokeDasharray="4 4" name="lower" />
                <Line type="monotone" dataKey="high" stroke="#555" strokeWidth={1} dot={false} strokeDasharray="4 4" name="upper" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <TrendingUp size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.25rem' }}>Subscriber trajectory (proxy)</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{sf?.summary ?? '—'}</p>
          <div style={{ width: '100%', minWidth: 0, minHeight: subData.length ? 250 : 48 }}>
            {subData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No subscriber series.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <AreaChart data={subData}>
                  <defs>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="i" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompact(v)}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(7,7,10,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Area type="monotone" dataKey="subs" stroke="#00d4ff" fillOpacity={1} fill="url(#colorSubs)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Engagement forecast</h3>
          <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path
                strokeDasharray="100, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <path
                strokeDasharray={`${Math.min(95, ((eng?.current_value ?? 0.05) / 0.2) * 100)}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#00ff88"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>{formatPercent(eng?.current_value ?? 0, 2)}</span>
              <span style={{ fontSize: '0.75rem', color: '#00ff88' }}>→ {formatPercent(eng?.predicted_value ?? 0, 2)}</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '24px', maxWidth: '90%' }}>
            {eng?.summary ?? eng?.trend ?? 'Run analysis for engagement projection.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
