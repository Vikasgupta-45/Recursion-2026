import { Target, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

const Strategy = () => {
  const { analysis, loading, runAnalysis } = useAnalysis();

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
        Run analysis to load gaps and AI strategy.
      </div>
    );
  }

  const gaps = Array.isArray(analysis.opportunities) ? analysis.opportunities : [];
  const strategy = analysis.ai_strategy || {};
  const weekly = strategy.weekly_strategy as Record<string, Record<string, string>> | undefined;
  const weekEntries = weekly
    ? Object.entries(weekly).filter(([, v]) => v && typeof v === 'object')
    : [];

  const milestones = (analysis.content_calendar?.milestones as Array<Record<string, unknown>> | undefined) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>AI Strategy & Opportunities</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          <code>opportunities</code> + <code>ai_strategy</code> from your backend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <AlertCircle size={20} color="#ff3366" />
            <h3 style={{ fontSize: '1.25rem' }}>Detected content gaps</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Low similarity to your library vs market trending titles (TF‑IDF / cosine).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {gaps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No gaps returned (need market + creator titles).</p>
            ) : (
              gaps.map((gap, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,51,102,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,51,102,0.1)',
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                    {String(gap.topic_opportunity ?? gap.topic ?? 'Topic')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>
                      Demand: <span style={{ color: '#fff' }}>{String(gap.demand ?? '—')}</span>
                    </span>
                    <span>
                      Competition: <span style={{ color: '#00cc88' }}>{String(gap.competition ?? '—')}</span>
                    </span>
                    <span>
                      Sim: <span style={{ color: '#8c5fff' }}>{String(gap.similarity_score ?? '—')}</span>
                    </span>
                  </div>
                  {gap.recommendation != null && gap.recommendation !== '' ? (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {String(gap.recommendation)}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Target size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.25rem' }}>Weekly strategy map</h3>
          </div>

          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '7px',
                width: '2px',
                background: 'rgba(255,255,255,0.1)',
              }}
            />

            {weekEntries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No weekly_strategy in response.</p>
            ) : (
              weekEntries.map(([day, payload]) => (
                <div key={day} style={{ position: 'relative', marginBottom: '24px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-22px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#00d4ff',
                      boxShadow: '0 0 10px rgba(0, 212, 255, 0.4)',
                    }}
                  />
                  <div style={{ color: '#00d4ff', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{day}</div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{String(payload?.format ?? '—')}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{String(payload?.topic ?? '')}</div>
                </div>
              ))
            )}
          </div>

          {milestones.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Milestones (planner)</div>
              {milestones.slice(0, 4).map((m, i) => (
                <div key={i} style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: '#8c5fff' }}>{`W${String(m.week ?? '')}`}</span> — {String(m.milestone_title ?? '')}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={() => void runAnalysis()}
          >
            Re-run analysis <Zap size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Strategy;
