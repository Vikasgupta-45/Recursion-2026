import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Video,
  Percent,
  TrendingUp,
  Loader2,
  Lightbulb,
  Calendar,
  BarChart3,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAnalysis } from '../../context/AnalysisContext';
import { formatCompact, formatPercent } from '../../lib/format';

function formatTimeseriesLabel(raw: string | undefined): string {
  if (!raw) return 'Estimated';
  const map: Record<string, string> = {
    youtube_data_api_v3: 'YouTube API',
    ytdlp_metadata: 'Full scrape',
    ytdlp_flat: 'Quick sample',
    synthetic_fallback: 'Estimated curve',
  };
  return map[raw] || raw.replace(/_/g, ' ');
}

const Badge = ({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'muted' }) => {
  const colors = {
    ok: { bg: 'rgba(0, 255, 136, 0.12)', border: 'rgba(0, 255, 136, 0.35)', text: '#6dffc4' },
    warn: { bg: 'rgba(255, 180, 100, 0.12)', border: 'rgba(255, 180, 100, 0.35)', text: '#ffc48a' },
    muted: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'var(--text-muted)' },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: '999px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  badge,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: { text: string; tone: 'ok' | 'warn' | 'muted' };
  hint?: string;
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="glass-panel"
    style={{
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      border: '1px solid rgba(140, 95, 255, 0.12)',
      background: 'linear-gradient(145deg, rgba(20, 18, 32, 0.95), rgba(12, 10, 22, 0.88))',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>
        {title}
      </span>
      <div style={{ padding: '10px', background: 'rgba(140, 95, 255, 0.12)', borderRadius: '12px' }}>{icon}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</span>
      {badge ? <Badge tone={badge.tone}>{badge.text}</Badge> : null}
      {hint ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{hint}</span> : null}
    </div>
  </motion.div>
);

const Overview = () => {
  const { analysis, loading } = useAnalysis();

  const chartData = useMemo(() => {
    const pts = analysis?.predictions?.views_forecast?.forecast;
    if (pts?.length) {
      return pts.slice(0, 60).map((p) => {
        const ds = typeof p.ds === 'string' ? p.ds : String(p.ds ?? '');
        return {
          name: ds.length >= 10 ? ds.slice(5, 10) : ds,
          views: Number(p.yhat),
          low: Number(p.yhat_lower),
          high: Number(p.yhat_upper),
        };
      });
    }
    return [{ name: '—', views: 0, low: 0, high: 0 }];
  }, [analysis]);

  const chartViewsDomain = useMemo((): [number, number] | undefined => {
    const vals = chartData.map((d) => Number(d.views)).filter((x) => !Number.isNaN(x));
    if (vals.length < 2) return undefined;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    if (hi <= lo) return [Math.max(0, lo * 0.92), Math.max(lo * 1.08, lo + 1)];
    const pad = (hi - lo) * 0.06;
    return [Math.max(0, lo - pad), hi + pad];
  }, [chartData]);

  const trendSpark = useMemo(() => {
    const trend = analysis?.content_metrics?.niche_trend as Record<string, unknown> | undefined;
    const td = trend?.trend_data;
    if (!td || typeof td !== 'object') return [];
    const rows = Object.entries(td as Record<string, number>)
      .map(([k, v]) => ({
        k,
        name: k.length >= 10 ? k.slice(5, 10) : k,
        score: Number(v),
        t: Date.parse(k.replace(' ', 'T')) || 0,
      }))
      .filter((r) => !Number.isNaN(r.score))
      .sort((a, b) => a.t - b.t);
    return rows.slice(-21).map(({ name, score }) => ({ name, score }));
  }, [analysis]);

  const trendYDomain = useMemo((): [number, number] => {
    if (trendSpark.length < 2) return [0, 100];
    const s = trendSpark.map((r) => r.score);
    const lo = Math.min(...s);
    const hi = Math.max(...s);
    if (hi <= 0 && lo <= 0) return [0, 10];
    if (hi <= lo) return [Math.max(0, lo - 2), Math.min(100, hi + 2)];
    const p = (hi - lo) * 0.15;
    return [Math.max(0, lo - p), Math.min(100, hi + p)];
  }, [trendSpark]);

  const modelsUsed = analysis?.predictions?.views_forecast?.models_used;
  const ensembleLabel = modelsUsed?.length ? modelsUsed.join(' · ') : 'Ensemble model';

  const uploads = useMemo(() => {
    const raw = analysis?.content_metrics?.ytdlp_scraped_data as Record<string, unknown> | undefined;
    const list = raw?.latest_videos_metadata as Array<Record<string, unknown>> | undefined;
    return Array.isArray(list) ? list : [];
  }, [analysis]);

  if (loading && !analysis) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="spin" size={32} style={{ marginBottom: '16px' }} />
        <p>Running analysis…</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, background: 'rgba(140,95,255,0.12)', borderRadius: 12 }}><LayoutDashboard size={24} color="#8c5fff" /></div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Overview</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Channel growth metrics & forecasting</p>
          </div>
        </header>
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Welcome</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Paste a channel URL above and run analysis to see growth metrics, a views forecast, niche interest from Google
            Trends, and recent uploads.
          </p>
        </div>
      </div>
    );
  }

  const cm = analysis.channel_metrics as Record<string, unknown>;
  const dq = cm.data_quality as Record<string, unknown> | undefined;
  const gf = (cm.growth_features as Record<string, number> | undefined) || {};
  const am = analysis.audience_metrics as Record<string, unknown>;
  const trend = analysis.content_metrics?.niche_trend as Record<string, unknown> | undefined;
  const snap = analysis.creator_snapshot as Record<string, unknown> | undefined;
  const perf = analysis.intelligence_insights?.performance_drivers as Record<string, unknown> | undefined;

  const subs = cm.subscribers as number | undefined;
  const views = cm.total_views as number | undefined;
  const vcount = (cm.video_count as number | undefined) ?? (analysis.content_metrics?.video_count as number | undefined);
  const eng = am.avg_engagement as number | undefined;
  const tsSrc = analysis.predictions?.timeseries_source;

  const totalsVerified = dq?.channel_totals === 'verified';
  const uploadSample = typeof dq?.upload_sample_size === 'number' ? dq.upload_sample_size : uploads.length;

  const trendScore = trend?.current_score;
  const trendScoreLabel =
    trendScore != null && trendScore !== '' && !Number.isNaN(Number(trendScore)) ? String(trendScore) : null;
  const trendError = trend?.error != null && String(trend.error) !== '' ? String(trend.error) : null;

  const driverLabel =
    perf?.top_feature_driver === 'duration_seconds'
      ? 'Video length'
      : perf?.top_feature_driver === 'title_length'
        ? 'Title length'
        : perf?.top_feature_driver
          ? String(perf.top_feature_driver).replace(/_/g, ' ')
          : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(140, 95, 255, 0.2)',
          background: 'linear-gradient(120deg, rgba(140, 95, 255, 0.14), rgba(0, 212, 255, 0.06))',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          Snapshot of your channel, forecast, and what’s working in your recent uploads.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <StatCard
          title="Subscribers"
          value={formatCompact(subs)}
          icon={<Users size={22} color="#b8a0ff" />}
          badge={{ text: totalsVerified ? 'API' : 'Estimate', tone: totalsVerified ? 'ok' : 'warn' }}
          hint={
            gf.weekly_growth_rate_pct != null
              ? `${Number(gf.weekly_growth_rate_pct).toFixed(1)}% vs recent window on your time series`
              : 'Growth rate from your processed upload history'
          }
        />
        <StatCard
          title="Channel views"
          value={formatCompact(views)}
          icon={<Eye size={22} color="#5ee7ff" />}
          badge={{ text: totalsVerified ? 'Verified' : 'Estimated', tone: totalsVerified ? 'ok' : 'warn' }}
          hint={totalsVerified ? 'Totals from YouTube Data API' : 'Approximate — enable YouTube Data API v3 for exact totals'}
        />
        <StatCard
          title="Videos (sample)"
          value={formatCompact(vcount)}
          icon={<Video size={22} color="#ff7b9c" />}
          badge={{ text: `${uploadSample} in feed`, tone: 'muted' }}
          hint="Count from your latest uploads pull — not always full channel size without API access"
        />
        <StatCard
          title="Engagement"
          value={eng != null ? formatPercent(eng, 2) : '—'}
          icon={<Percent size={22} color="#5dffb0" />}
          badge={{
            text: gf.engagement_is_imputed ? 'Estimated' : eng != null && eng < 0.02 ? 'Room to grow' : 'Tracked',
            tone: gf.engagement_is_imputed ? 'muted' : eng != null && eng < 0.02 ? 'warn' : 'ok',
          }}
          hint={
            gf.engagement_is_imputed
              ? 'Typical range when likes/comments aren’t in the upload sample — use Intelligence for video-level stats when available'
              : 'Likes + comments vs views on your modeled series — use Intelligence for deeper drivers'
          }
        />
      </div>

      {snap && (
        <div
          className="glass-panel"
          style={{
            padding: '22px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            border: '1px solid rgba(0, 212, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Lightbulb size={22} color="#ffc46b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Creator tips
              </div>
              <div style={{ fontWeight: 700, marginTop: '6px', fontSize: '1rem' }}>
                Post more on <span style={{ color: '#00d4ff' }}>{String(snap.best_posting_day ?? '—')}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.45 }}>
                Strongest signal in your sample: <strong style={{ color: 'var(--text-main)' }}>{driverLabel ?? '—'}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Clock size={22} color="#8c5fff" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Duration sweet spot
              </div>
              <div style={{ fontWeight: 700, marginTop: '6px' }}>{String(snap.best_duration_range ?? '—')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{String(snap.format_tip ?? '')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <BarChart3 size={22} color="#00ff88" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Trends query
              </div>
              <div style={{ fontWeight: 700, marginTop: '6px' }}>{String(snap.trends_query ?? trend?.keyword ?? '—')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Inferred from your video titles for Google Trends
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '20px' }} className="overview-grid-split">
        <div className="glass-panel" style={{ padding: '24px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} color="#8c5fff" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Views forecast</h3>
            </div>
            <Badge tone="muted">{formatTimeseriesLabel(tsSrc)}</Badge>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '-8px 0 16px', lineHeight: 1.4 }}>{ensembleLabel}</p>
          <div style={{ width: '100%', minWidth: 0, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="colorViews2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8c5fff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8c5fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={chartViewsDomain ?? ['auto', 'auto']}
                  tickFormatter={(v) => formatCompact(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 8, 18, 0.95)',
                    border: '1px solid rgba(140, 95, 255, 0.25)',
                    borderRadius: '10px',
                  }}
                  formatter={(value) => [formatCompact(Number(value)), 'Forecast']}
                />
                <Area type="monotone" dataKey="views" stroke="none" fillOpacity={1} fill="url(#colorViews2)" />
                <Line type="monotone" dataKey="views" stroke="#c4b5fd" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            border: '1px solid rgba(0, 212, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="#00d4ff" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Google Trends</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Interest for <strong style={{ color: 'var(--text-main)' }}>{String(trend?.keyword ?? '—')}</strong> (last ~90 days,
            relative 0–100)
            {trend?.trends_broadened_from ? (
              <span style={{ display: 'block', marginTop: '6px', fontSize: '0.78rem' }}>
                (Low volume for “{String(trend.trends_broadened_from)}” — showing a broader related topic)
              </span>
            ) : null}
          </p>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest index</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: trendScoreLabel ? '#5dffb0' : 'var(--text-muted)' }}>
              {trendScoreLabel ?? '—'}
            </div>
          </div>
          {trendError ? (
            <div style={{ fontSize: '0.78rem', color: '#ff9db5', lineHeight: 1.45, marginBottom: '12px' }}>{trendError}</div>
          ) : null}
          {!trendError && trend?.trends_note ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '10px' }}>
              {String(trend.trends_note)}
            </div>
          ) : null}
          {trendSpark.length > 1 ? (
            <div style={{ flex: 1, minHeight: 120, marginTop: '8px' }}>
              <ResponsiveContainer width="100%" height={120} minWidth={0}>
                <LineChart data={trendSpark} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="var(--text-muted)" fontSize={9} width={36} domain={trendYDomain} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 8, 18, 0.95)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#00d4ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : !trendError ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No trend series returned (rate limit or keyword).</p>
          ) : null}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .overview-grid-split { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Recent uploads</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Latest videos we pulled from the channel — use these to spot what’s resonating.
        </p>
        {uploads.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No uploads in this run — check the URL and try again.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploads.slice(0, 8).map((vid, i) => (
              <div
                key={String(vid.video_id ?? vid.video_url ?? i)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.4 }}>{String(vid.title ?? '—')}</div>
                <div style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatCompact(vid.views as number)} views
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {(() => {
                    const s = Number(vid.duration_seconds);
                    if (!s || Number.isNaN(s)) return '—';
                    if (s < 60) return `${Math.round(s)}s`;
                    return `${Math.round(s / 60)} min`;
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
