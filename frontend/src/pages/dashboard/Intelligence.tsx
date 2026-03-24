import { useMemo, useState, type ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Clock,
  Calendar as CalendarIcon,
  PlayCircle,
  Loader2,
  Heart,
  Activity,
  Users,
  TrendingUp,
  Flame,
  DollarSign,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { formatCompact, formatPercent } from '../../lib/format';
import { mergeAnalysisPanelData, viewsForecastChartData } from './intelligenceDerived';
import { motion } from 'framer-motion';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SENTIMENT_COLORS = ['#00d4ff', '#6b7280', '#ff6b8a'];

const SectionLabel = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2
      style={{
        fontSize: '1.05rem',
        fontWeight: 750,
        letterSpacing: '-0.02em',
        color: 'rgba(255,255,255,0.96)',
        margin: 0,
      }}
    >
      {title}
    </h2>
    {subtitle ? (
      <p style={{ margin: '10px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: '720px' }}>
        {subtitle}
      </p>
    ) : null}
  </div>
);

const Chapter = ({ id, label, subtitle, children }: { id: string; label: string; subtitle?: string; children: ReactNode }) => (
  <section
    id={id}
    style={{
      scrollMarginTop: '96px',
      marginBottom: '24px',
      borderRadius: '20px',
      padding: '26px 28px 30px',
      background: 'linear-gradient(168deg, rgba(20, 18, 34, 0.94), rgba(10, 9, 20, 0.9))',
      border: '1px solid rgba(255,255,255,0.055)',
      boxShadow: '0 20px 56px rgba(0,0,0,0.38)',
    }}
  >
    <SectionLabel title={label} subtitle={subtitle} />
    {children}
  </section>
);

const CardHead = ({
  icon,
  title,
  badge,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '14px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      {icon}
      <h3 style={{ fontSize: '1.02rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{title}</h3>
    </div>
    {badge ? (
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'rgba(190, 240, 255, 0.95)',
          padding: '4px 10px',
          borderRadius: '999px',
          border: '1px solid rgba(0,212,255,0.22)',
          background: 'rgba(0,212,255,0.07)',
          flexShrink: 0,
        }}
      >
        {badge}
      </span>
    ) : null}
  </div>
);

const Card = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div
    style={{
      padding: '18px 20px 20px',
      minWidth: 0,
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      background: 'rgba(0,0,0,0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      ...style,
    }}
  >
    {children}
  </div>
);

function ProseInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <strong key={i} style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function DurationScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload as {
    name?: string;
    views?: number;
    x?: number;
    likes?: number;
    comments?: number;
    engagement_rate?: number;
    bucket?: string;
  };
  return (
    <div
      style={{
        background: 'rgba(7,7,10,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px 12px',
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.78rem', lineHeight: 1.35 }}>{p.name || 'Video'}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
        <div>Duration: {p.x} min</div>
        <div>Views: {formatCompact(Number(p.views ?? 0))}</div>
        <div>
          Likes / comments: {p.likes ?? 0} / {p.comments ?? 0}
        </div>
        <div>Engagement (likes + 2×comments) / views: {formatPercent(Number(p.engagement_rate ?? 0), 2)}</div>
        {p.bucket ? <div>Format bucket: {p.bucket}</div> : null}
      </div>
    </div>
  );
}

function DigestHero({
  headline,
  bullets,
  priority,
}: {
  headline: string;
  bullets: string[];
  priority: string;
}) {
  const has = headline || bullets.length || priority;
  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '24px 26px',
        marginBottom: '4px',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(120, 80, 200, 0.08))',
        border: '1px solid rgba(0, 212, 255, 0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <Sparkles size={22} color="#5ee7ff" />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', color: '#7ee8ff' }}>
          AI SUMMARY FOR YOUR CHANNEL
        </span>
      </div>
      {has ? (
        <>
          {headline ? (
            <p style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.45, margin: '0 0 16px' }}>
              {headline}
            </p>
          ) : null}
          {bullets.length > 0 ? (
            <ul
              style={{
                margin: '0 0 16px',
                paddingLeft: '20px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
              }}
            >
              {bullets.map((b, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
          {priority ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.87rem',
                color: 'rgba(200, 255, 220, 0.95)',
                lineHeight: 1.55,
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <strong style={{ color: '#a8f5c8' }}>Start here:</strong> {priority}
            </p>
          ) : null}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
          Set <strong style={{ color: 'var(--text-main)' }}>GROQ_API_KEY</strong> or{' '}
          <strong style={{ color: 'var(--text-main)' }}>OPENAI_API_KEY</strong> in backend{' '}
          <code style={{ fontSize: '0.78rem', opacity: 0.9 }}>.env</code>, then run analysis again for a tailored summary
          and simpler explanations across this page.
        </p>
      )}
    </div>
  );
}

const PANEL_NAV = [
  { id: 'panel-engagement', label: 'Audience' },
  { id: 'panel-core', label: 'Content' },
  { id: 'panel-growth', label: 'Growth' },
  { id: 'panel-earn', label: 'Earn' },
  { id: 'panel-creative', label: 'Ideas' },
] as const;

function PanelNavChips() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 6,
        padding: '12px 0 16px',
        background: 'linear-gradient(180deg, rgba(8,6,16,0.98) 70%, transparent)',
      }}
    >
      {PANEL_NAV.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            padding: '8px 15px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.72)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}

const Intelligence = () => {
  const { analysis, loading } = useAnalysis();
  const [sentimentTab, setSentimentTab] = useState<'positive' | 'negative' | 'neutral'>('positive');

  const performance = analysis?.intelligence_insights?.performance_drivers as Record<string, unknown> | undefined;
  const content = analysis?.intelligence_insights?.content_insights as Record<string, unknown> | undefined;
  const panel = useMemo(() => mergeAnalysisPanelData(analysis ?? null), [analysis]);
  const plainLang = useMemo(
    () => (panel.plain_language as Record<string, string> | undefined) ?? {},
    [panel],
  );
  const aiDigest = useMemo(() => {
    const d = panel.ai_digest as { headline?: string; bullets?: string[]; priority?: string } | undefined;
    return {
      headline: String(d?.headline ?? ''),
      bullets: Array.isArray(d?.bullets) ? d.bullets.map(String).filter(Boolean) : [],
      priority: String(d?.priority ?? ''),
    };
  }, [panel]);

  const bestDay = String(performance?.best_posting_day ?? 'Saturday');
  const durationVsViews = performance?.duration_vs_views as
    | {
      points?: Array<Record<string, unknown>>;
      bucket_stats?: Array<Record<string, unknown>>;
      top_performers?: Array<Record<string, unknown>>;
      correlation_pearson?: number | null;
      narrative?: string;
      chart_methodology?: string;
    }
    | undefined;
  const driversDeep = performance?.drivers_deep as Record<string, unknown> | undefined;
  const postingRationale = String(performance?.best_posting_day_rationale ?? '');
  const dayData = useMemo(() => {
    const rows = performance?.views_by_day_of_week as
      | Array<{ day?: string; engagement_index?: number; mean_views?: number; video_count?: number }>
      | undefined;
    if (Array.isArray(rows) && rows.length) {
      return rows.map((r) => ({
        name: String(r.day ?? ''),
        engagement: Number(r.engagement_index ?? 0),
        mean_views: Number(r.mean_views ?? 0),
        video_count: Number(r.video_count ?? 0),
      }));
    }
    return DAYS.map((name) => ({
      name: name.slice(0, 3),
      engagement: name === bestDay ? 100 : 45 + (name.length % 5) * 8,
      mean_views: 0,
      video_count: 0,
    }));
  }, [performance, bestDay]);

  const scatterData = useMemo(() => {
    const apiPts = durationVsViews?.points;
    if (Array.isArray(apiPts) && apiPts.length) {
      return apiPts.map((p) => {
        const views = Number(p.views ?? 0);
        const durMin = Number(p.duration_minutes ?? 0) || 0.5;
        return {
          x: Math.round(durMin * 100) / 100,
          y: Math.round((views / 1000) * 100) / 100,
          z: Math.min(500, views / 50 + 80),
          name: String(p.title ?? '').slice(0, 28),
          views,
          likes: Number(p.likes ?? 0),
          comments: Number(p.comments ?? 0),
          engagement_rate: Number(p.engagement_rate ?? 0),
          bucket: String(p.bucket ?? ''),
        };
      });
    }
    const raw = analysis?.content_metrics?.ytdlp_scraped_data as Record<string, unknown> | undefined;
    const list = raw?.latest_videos_metadata as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(list) || !list.length) {
      return [
        { x: 5, y: 10, z: 200, name: 'demo', views: 10000, likes: 0, comments: 0, engagement_rate: 0, bucket: '' },
        { x: 12, y: 40, z: 300, name: 'demo', views: 40000, likes: 0, comments: 0, engagement_rate: 0, bucket: '' },
      ];
    }
    return list.slice(0, 50).map((v) => {
      const durMin = Math.max(0.5, Number(v.duration_seconds ?? 600) / 60);
      const views = Number(v.views ?? 0);
      const likes = Number(v.likes ?? 0);
      const comments = Number(v.comments ?? 0);
      const eng = views > 0 ? (likes + 2 * comments) / views : 0;
      return {
        x: Math.round(durMin * 10) / 10,
        y: Math.round((views / 1000) * 10) / 10,
        z: Math.min(500, views / 50 + 80),
        name: String(v.title ?? '').slice(0, 28),
        views,
        likes,
        comments,
        engagement_rate: Math.min(0.5, eng),
        bucket: durMin < 1 ? 'Shorts (<1m)' : durMin < 10 ? '1–10 min' : durMin < 30 ? '10–30 min' : '30+ min',
      };
    });
  }, [analysis, durationVsViews]);

  const durationBucketStats = useMemo(() => {
    const rows = durationVsViews?.bucket_stats;
    if (Array.isArray(rows) && rows.length) {
      return rows.map((r) => ({
        bucket: String(r.bucket ?? ''),
        count: Number(r.count ?? 0),
        mean_views: Number(r.mean_views ?? 0),
        median_views: Number(r.median_views ?? 0),
        max_views: Number(r.max_views ?? 0),
      }));
    }
    return [];
  }, [durationVsViews]);

  const durationTopPerformers = useMemo(() => {
    const rows = durationVsViews?.top_performers;
    if (Array.isArray(rows) && rows.length) return rows.slice(0, 8);
    return [...scatterData]
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 8)
      .map((r) => ({
        title: r.name,
        views: r.views,
        duration_minutes: r.x,
        bucket: r.bucket,
        engagement_rate: r.engagement_rate,
      }));
  }, [durationVsViews, scatterData]);

  const sentimentPie = useMemo(() => {
    const s = panel?.comment_sentiment as Record<string, unknown> | undefined;
    if (!s) return [];
    return [
      { name: 'Positive', value: Number(s.positive ?? 0) * 100 },
      { name: 'Neutral', value: Number(s.neutral ?? 0) * 100 },
      { name: 'Negative', value: Number(s.negative ?? 0) * 100 },
    ].filter((x) => x.value > 0);
  }, [panel]);

  const retentionData = useMemo(() => {
    const rows = panel?.audience_retention_curve as Array<Record<string, number>> | undefined;
    return Array.isArray(rows) ? rows.map((r) => ({ t: `${Math.round(r.video_pct)}%`, r: r.retention_pct })) : [];
  }, [panel]);

  const newVsData = useMemo(() => {
    const n = panel?.new_vs_returning_viewers as Record<string, unknown> | undefined;
    if (!n) return [];
    return [
      { name: 'New viewers', v: Number(n.new_viewers_pct ?? 0) },
      { name: 'Returning', v: Number(n.returning_viewers_pct ?? 0) },
    ];
  }, [panel]);

  const subForecastData = useMemo(() => {
    const h = panel?.subscriber_growth_horizons as Record<string, unknown> | undefined;
    const fc = h?.forecast_90d as Array<{ ds: string; yhat: number }> | undefined;
    if (fc?.length) {
      return fc.filter((_, i) => i % 3 === 0 || i === fc.length - 1).map((p) => ({ name: p.ds.slice(5), subs: p.yhat }));
    }
    const fallback = analysis?.predictions?.subscriber_forecast?.forecast as Array<{ ds: string; yhat: number }> | undefined;
    if (fallback?.length) {
      return fallback.filter((_, i) => i % 2 === 0).map((p) => ({ name: p.ds.slice(5), subs: p.yhat }));
    }
    return [];
  }, [panel, analysis]);

  const uploadCal = useMemo(() => {
    const rows = panel?.upload_consistency_calendar as Array<{ date: string; uploads: number }> | undefined;
    return Array.isArray(rows) ? rows.slice(-56) : [];
  }, [panel]);

  const rpmData = useMemo(() => {
    const rows = panel?.rpm_by_content_type as Array<Record<string, unknown>> | undefined;
    return Array.isArray(rows)
      ? rows.map((r) => ({
        format: String(r.format ?? ''),
        rpm: Number(r.estimated_rpm_usd ?? 0),
      }))
      : [];
  }, [panel]);

  const kwData = useMemo(() => {
    const rows = panel?.keyword_frequency_top_videos as Array<{ term: string; count: number }> | undefined;
    return Array.isArray(rows) ? rows.slice(0, 10) : [];
  }, [panel]);

  const topicGaps = useMemo(() => {
    const rows = panel?.topic_gap_finder as Array<{ topic: string; source?: string }> | undefined;
    return Array.isArray(rows) ? rows : [];
  }, [panel]);

  const viewsTrajectory = useMemo(() => viewsForecastChartData(analysis ?? null), [analysis]);

  const bench = panel?.competitor_benchmark as Record<string, unknown> | undefined;
  const youB = bench?.you as Record<string, unknown> | undefined;
  const nicheB = bench?.niche_average_est as Record<string, unknown> | undefined;

  const benchCompare = useMemo(() => {
    if (!youB || !nicheB) return [];
    return [
      { metric: 'Avg length (min)', you: Number(youB.avg_video_length_min), niche: Number(nicheB.avg_video_length_min) },
      { metric: 'Uploads / wk (est)', you: Number(youB.uploads_per_week_est), niche: Number(nicheB.uploads_per_week_est) },
      {
        metric: 'Engagement rate',
        you: Number(youB.engagement_rate) * 100,
        niche: Number(nicheB.engagement_rate) * 100,
      },
    ];
  }, [youB, nicheB]);

  const momentum = panel?.momentum as Record<string, unknown> | undefined;
  const sponsor = panel?.sponsorship_readiness as Record<string, unknown> | undefined;
  const hook = panel?.hook_strength as Record<string, unknown> | undefined;

  if (loading && !analysis) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Run analysis to load the analysis panel.
      </div>
    );
  }

  const topDriverRaw = String(performance?.top_feature_driver ?? '—');
  const topDriver =
    topDriverRaw === 'insufficient_sample'
      ? 'Need more videos (≥3) for forest drivers'
      : topDriverRaw === 'duration_seconds'
        ? 'Video duration'
        : topDriverRaw === 'title_length'
          ? 'Title length'
          : topDriverRaw;
  const importance = (performance?.feature_importance as Record<string, number> | undefined) || {};
  const contentBuckets = (content?.bucket_breakdown as Array<Record<string, unknown>> | undefined) || [];
  const cm = analysis.channel_metrics as Record<string, unknown>;
  const dq = cm.data_quality as Record<string, unknown> | undefined;
  const snap = analysis.creator_snapshot as Record<string, unknown> | undefined;
  const engDisplay = Number(analysis.audience_metrics?.avg_engagement);
  const engLabel = Number.isFinite(engDisplay) ? formatPercent(engDisplay, 2) : '—';

  const MomentumIcon =
    momentum?.arrow === 'up' ? ArrowUp : momentum?.arrow === 'down' ? ArrowDown : Minus;

  const sentimentBlock = panel?.comment_sentiment as Record<string, unknown> | undefined;
  const sentimentNote = String(sentimentBlock?.note ?? '');
  const sentimentPosLogic = String(sentimentBlock?.positive_logic ?? '');
  const sentimentNegLogic = String(sentimentBlock?.negative_logic ?? '');
  const sentimentNeuLogic = String(sentimentBlock?.neutral_logic ?? '');
  const exPos = (sentimentBlock?.example_positive as string[] | undefined) || [];
  const exNeg = (sentimentBlock?.example_negative as string[] | undefined) || [];
  const sentimentSrc = String(sentimentBlock?.source ?? '');
  const sentimentBadge =
    sentimentSrc === 'youtube_api_groq' || sentimentSrc === 'youtube_api_keywords' ? 'From comments' : 'Estimate';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '1180px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', letterSpacing: '-0.03em', fontWeight: 800 }}>
          Analysis panel
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', lineHeight: 1.55, fontSize: '0.88rem' }}>
          Same metrics as before, grouped into five chapters. The highlighted box is an AI summary; each chapter opens with
          a short plain-English read when your backend has an LLM key.
        </p>
      </div>

      <DigestHero headline={aiDigest.headline} bullets={aiDigest.bullets} priority={aiDigest.priority} />

      {/* Hero KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '8px',
        }}
      >
        {[
          { k: 'Channel', v: String(cm.channel_title ?? '—'), sub: String(dq?.timeseries ?? '').replace(/_/g, ' ') || 'Series' },
          { k: 'Subscribers', v: formatCompact(cm.subscribers as number), sub: dq?.channel_totals === 'verified' ? 'Verified' : 'Estimate' },
          { k: 'Channel views', v: formatCompact(cm.total_views as number), sub: 'Lifetime' },
          { k: 'Engagement', v: engLabel, sub: 'Modeled' },
          { k: 'Sample uploads', v: String(dq?.upload_sample_size ?? '—'), sub: 'In feed' },
          { k: 'Momentum', v: momentum?.score != null ? String(momentum.score) : '—', sub: String(momentum?.trend ?? '') },
        ].map((x) => (
          <div
            key={x.k}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {x.k}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '6px', letterSpacing: '-0.02em' }}>{x.v}</div>
            <div style={{ fontSize: '0.72rem', color: '#5ee7ff', marginTop: '4px', textTransform: 'capitalize' }}>{x.sub}</div>
          </div>
        ))}
      </div>

      {snap?.trends_query ? (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <strong style={{ color: 'var(--text-main)' }}>Trends query:</strong> {String(snap.trends_query)} ·{' '}
          <strong style={{ color: 'var(--text-main)' }}>Posting tip:</strong> {String(snap.best_posting_day ?? '—')}
        </div>
      ) : null}

      <PanelNavChips />

      {/* Engagement Health */}
      <Chapter
        id="panel-engagement"
        label="Audience & feedback"
        subtitle="Comment mood when we can load real comments; retention and new vs returning are estimates — check YouTube Studio for exact numbers."
      >
        {plainLang.comment_sentiment || plainLang.retention || plainLang.new_vs_returning ? (
          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(0,212,255,0.06)',
              border: '1px solid rgba(0,212,255,0.1)',
            }}
          >
            {[plainLang.comment_sentiment, plainLang.retention, plainLang.new_vs_returning].filter(Boolean).join(' ')}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          <Card>
            <CardHead icon={<Heart size={20} color="#00d4ff" />} title="Comment sentiment" badge={sentimentBadge} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.45 }}>
              {sentimentNote}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {(
                [
                  { id: 'positive' as const, label: 'Why positive?' },
                  { id: 'negative' as const, label: 'Why negative?' },
                  { id: 'neutral' as const, label: 'Why neutral?' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSentimentTab(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border:
                      sentimentTab === t.id ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: sentimentTab === t.id ? 'rgba(0,212,255,0.12)' : 'rgba(0,0,0,0.2)',
                    color: sentimentTab === t.id ? '#5ee7ff' : 'var(--text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.55, marginBottom: '12px' }}>
              {sentimentTab === 'positive' ? sentimentPosLogic : sentimentTab === 'negative' ? sentimentNegLogic : sentimentNeuLogic}
            </p>
            {exPos.length > 0 && sentimentTab === 'positive' ? (
              <div style={{ marginBottom: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#5ee7ff', marginBottom: '6px' }}>Real comments that sound happy</div>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {exPos.map((s, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      &ldquo;{s}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {exNeg.length > 0 && sentimentTab === 'negative' ? (
              <div style={{ marginBottom: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#ff8fab', marginBottom: '6px' }}>Real comments that sound unhappy</div>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {exNeg.map((s, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      &ldquo;{s}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sentimentPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sentimentPie.map((_, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[i % SENTIMENT_COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead icon={<Activity size={20} color="#5ee7ff" />} title="Audience retention" badge="Template" />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              A rough picture of how long people might stick around (not your exact Studio graph).
            </p>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={retentionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="t" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} width={36} />
                  <Tooltip />
                  <Line type="monotone" dataKey="r" stroke="#00d4ff" strokeWidth={2} dot name="Retention %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead icon={<Users size={20} color="#8c5fff" />} title="New vs returning" badge="Estimated" />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              A guess at new faces vs people who already know you (Studio has the exact split).
            </p>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={newVsData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} width={88} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="v" fill="#00d4ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </Chapter>

      <Chapter
        id="panel-core"
        label="Content performance"
        subtitle="Posting day, length vs views, your top videos in the sample, and signals we treat as drivers of views."
      >
        {plainLang.best_posting_day || plainLang.duration_views || plainLang.drivers ? (
          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(140,95,255,0.08)',
              border: '1px solid rgba(140,95,255,0.15)',
            }}
          >
            {[plainLang.best_posting_day, plainLang.duration_views, plainLang.drivers].filter(Boolean).join(' ')}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          <Card>
            <CardHead icon={<CalendarIcon size={20} color="#00d4ff" />} title="Best posting day" badge="Data + index" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px', lineHeight: 1.5 }}>
              Peak day (from your sample): <strong style={{ color: '#00d4ff' }}>{bestDay}</strong>. Bars show relative
              strength (100 = best mean views among weekdays with uploads).
            </p>
            <div style={{ width: '100%', minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload as {
                        name?: string;
                        engagement?: number;
                        mean_views?: number;
                        video_count?: number;
                      };
                      return (
                        <div
                          style={{
                            background: 'rgba(7,7,10,0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{d.name}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Index: {Number(d.engagement ?? 0).toFixed(0)}</div>
                          <div style={{ color: 'var(--text-muted)' }}>
                            Mean views: {formatCompact(Number(d.mean_views ?? 0))}
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>Videos: {d.video_count ?? 0}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="engagement" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!plainLang.best_posting_day && postingRationale ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.5 }}>
                <ProseInline text={postingRationale} />
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHead icon={<Clock size={20} color="#ff3366" />} title="Duration vs views" badge={`${scatterData.length} videos`} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
              Each dot is a video: longer left-to-right = longer video; higher = more views. Link strength:{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                {durationVsViews?.correlation_pearson != null ? String(durationVsViews.correlation_pearson) : 'n/a'}
              </strong>
            </p>
            <div style={{ width: '100%', minHeight: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 12, right: 12, bottom: 8, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="x" name="Minutes" unit="m" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis type="number" dataKey="y" name="Views (k)" stroke="var(--text-muted)" fontSize={11} />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} />
                  <Tooltip content={<DurationScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Videos" data={scatterData} fill="#ff3366" opacity={0.88} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: '18px' }}>
          <CardHead icon={<Clock size={20} color="#ffb84d" />} title="Duration performance breakdown" badge="Buckets + outliers" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div style={{ minHeight: 220 }}>
              {durationBucketStats.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={durationBucketStats} layout="vertical" margin={{ left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => formatCompact(v)} />
                    <YAxis type="category" dataKey="bucket" stroke="var(--text-muted)" fontSize={10} width={100} />
                    <Tooltip formatter={(v) => formatCompact(Number(v))} />
                    <Bar dataKey="mean_views" fill="#ffb84d" name="Mean views" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Bucket stats appear when the backend returns duration_vs_views.</p>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#5ee7ff', marginBottom: '8px' }}>
                TOP VIDEOS IN SAMPLE
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 220, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.35)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Title</th>
                      <th style={{ padding: '8px' }}>Views</th>
                      <th style={{ padding: '8px' }}>Min</th>
                      <th style={{ padding: '8px' }}>Eng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {durationTopPerformers.map((row, i) => {
                      const r = row as Record<string, unknown>;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '8px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {String(r.title ?? r.name ?? '—')}
                          </td>
                          <td style={{ padding: '8px' }}>{formatCompact(Number(r.views ?? 0))}</td>
                          <td style={{ padding: '8px' }}>{Number(r.duration_minutes ?? r.x ?? 0).toFixed(1)}</td>
                          <td style={{ padding: '8px' }}>{formatPercent(Number(r.engagement_rate ?? 0), 2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {durationVsViews?.narrative ? (
            <details style={{ marginTop: '14px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                }}
              >
                Technical note on duration vs views
              </summary>
              <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>
                <ProseInline text={String(durationVsViews.narrative)} />
              </p>
            </details>
          ) : null}
        </Card>

        <Card style={{ marginTop: '18px' }}>
          <CardHead icon={<PlayCircle size={20} color="#8c5fff" />} title="Drivers & content insights" badge="Signals" />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '14px' }}>
            {String(driversDeep?.executive_summary ?? '') ||
              'Add more videos (3+) so we can spot patterns — for example whether length or titles line up with views.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                padding: '16px',
                background: 'rgba(140, 95, 255, 0.1)',
                border: '1px solid rgba(140, 95, 255, 0.2)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top driver (forest)</div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1rem' }}>{topDriver}</div>
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {String(driversDeep?.why_top_driver ?? '')}
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Best duration band (content rules)</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>{String(content?.best_duration ?? '—')}</div>
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {String(content?.selection_rationale ?? '')}
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                background: 'rgba(255, 51, 102, 0.1)',
                border: '1px solid rgba(255, 51, 102, 0.2)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Format recommendation</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>{String(content?.format_recommendation ?? '—')}</div>
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {String(content?.format_recommendation_why ?? '')}
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                background: 'rgba(93, 255, 176, 0.08)',
                border: '1px solid rgba(93, 255, 176, 0.2)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Common weak surface</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>{String(content?.weak_area ?? '—')}</div>
              <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {String(content?.weak_area_why ?? '')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#5ee7ff', marginBottom: '8px' }}>
                What the model weighted
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.65 }}>
                {Object.entries(importance).length ? (
                  Object.entries(importance).map(([k, v]) => (
                    <li key={k}>
                      <strong style={{ color: 'var(--text-main)' }}>{k}</strong>: {v.toFixed(3)} —{' '}
                      {String((driversDeep?.per_feature_explanation as Record<string, string> | undefined)?.[k] ?? '')}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#5ee7ff', marginBottom: '8px' }}>
                DURATION BUCKETS (MEAN / MEDIAN / SHARE)
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.35)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Bucket</th>
                      <th style={{ padding: '8px' }}>n</th>
                      <th style={{ padding: '8px' }}>Mean</th>
                      <th style={{ padding: '8px' }}>Med</th>
                      <th style={{ padding: '8px' }}>%Σ views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentBuckets.length ? (
                      contentBuckets.map((b, i) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '8px' }}>{String(b.bucket ?? '—')}</td>
                          <td style={{ padding: '8px' }}>{String(b.count ?? '—')}</td>
                          <td style={{ padding: '8px' }}>{formatCompact(Number(b.mean_views ?? 0))}</td>
                          <td style={{ padding: '8px' }}>{formatCompact(Number(b.median_views ?? 0))}</td>
                          <td style={{ padding: '8px' }}>{String(b.share_of_views_pct ?? '—')}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '10px', color: 'var(--text-muted)' }}>
                          Bucket table fills when content_insights.bucket_breakdown is present (re-run analysis).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {content?.data_selection_note ? (
                <p style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {String(content.data_selection_note)}
                </p>
              ) : null}
            </div>
          </div>

          <p style={{ marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            More videos in one run make these charts more trustworthy. Use slow / full pulls when you can.
          </p>
        </Card>
      </Chapter>

      <Chapter
        id="panel-growth"
        label="Growth & rhythm"
        subtitle="Subscriber and views outlook, momentum, and a dated upload grid so you see gaps at a glance."
      >
        {plainLang.subscriber_forecast ||
          plainLang.views_forecast ||
          plainLang.momentum ||
          plainLang.upload_calendar ? (
          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(255,180,80,0.07)',
              border: '1px solid rgba(255,180,80,0.12)',
            }}
          >
            {[plainLang.subscriber_forecast, plainLang.views_forecast, plainLang.momentum, plainLang.upload_calendar]
              .filter(Boolean)
              .join(' ')}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          <Card>
            <CardHead
              icon={<TrendingUp size={20} color="#00d4ff" />}
              title="Subscriber projection"
              badge={subForecastData.length ? `${subForecastData.length} pts` : 'Synth'}
            />
            <div style={{ width: '100%', height: 240 }}>
              {subForecastData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={subForecastData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => formatCompact(v)} width={44} />
                    <Tooltip formatter={(v) => formatCompact(Number(v))} />
                    <Line type="monotone" dataKey="subs" stroke="#00d4ff" strokeWidth={2} dot={false} name="Subs" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  No subscriber series in payload — re-run analysis or check time series quality.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              icon={<TrendingUp size={20} color="#a78bfa" />}
              title="Views forecast"
              badge={viewsTrajectory.length ? `${viewsTrajectory.length} pts` : '—'}
            />
            <div style={{ width: '100%', height: 240 }}>
              {viewsTrajectory.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={viewsTrajectory} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => formatCompact(v)} width={44} />
                    <Tooltip formatter={(v) => formatCompact(Number(v))} />
                    <Line type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} dot={false} name="Views" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No views forecast in this run.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHead icon={<Flame size={22} color="#ffb84d" />} title="Momentum score" badge="0–100" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#00d4ff',
                  lineHeight: 1,
                }}
              >
                {momentum?.score != null ? String(momentum.score) : '—'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.25)',
                }}
              >
                <MomentumIcon size={22} color="#00d4ff" />
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{String(momentum?.trend ?? '—')}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '16px', lineHeight: 1.45 }}>
              Blends weekly view growth, views forecast delta, and engagement. Directional only.
            </p>
          </Card>

          <Card style={{ gridColumn: '1 / -1' }}>
            <CardHead
              icon={<CalendarIcon size={20} color="#5ee7ff" />}
              title="Upload consistency"
              badge={`${uploadCal.length} days`}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
                gap: '5px',
                maxWidth: '100%',
              }}
            >
              {uploadCal.map((cell) => {
                const u = cell.uploads;
                const bg =
                  u === 0
                    ? 'rgba(255,255,255,0.04)'
                    : u === 1
                      ? 'rgba(0, 212, 255, 0.35)'
                      : 'rgba(0, 212, 255, 0.75)';
                const mon = parseInt(cell.date.slice(5, 7), 10);
                const dayNum = parseInt(cell.date.slice(8, 10), 10);
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${u} upload(s)`}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '3px',
                      background: bg,
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1px',
                      padding: '2px',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.52rem',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 1.1,
                        textAlign: 'center',
                      }}
                    >
                      {mon}/{dayNum}
                    </span>
                    <span
                      style={{
                        fontSize: '0.48rem',
                        fontWeight: 600,
                        color: u > 0 ? 'rgba(190,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                        lineHeight: 1,
                      }}
                    >
                      {u > 0 ? `${u}` : '·'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.45 }}>
              Each square shows the date (month/day). The number below is how many videos went live that day. Brighter teal
              = more uploads the same day.
            </p>
          </Card>
        </div>
      </Chapter>

      <Chapter
        id="panel-earn"
        label="Earning potential"
        subtitle="Rough RPM by format (not your real AdSense) and a simple sponsor-readiness index."
      >
        {plainLang.rpm || plainLang.sponsorship ? (
          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(93,255,176,0.06)',
              border: '1px solid rgba(93,255,176,0.12)',
            }}
          >
            {[plainLang.rpm, plainLang.sponsorship].filter(Boolean).join(' ')}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          <Card>
            <CardHead icon={<DollarSign size={20} color="#5dffb0" />} title="RPM by format" badge="Est." />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Heuristic ranges by duration bucket — not AdSense data.
            </p>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rpmData} layout="vertical" margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis type="category" dataKey="format" stroke="var(--text-muted)" fontSize={10} width={120} />
                  <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="rpm" fill="#5dffb0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead icon={<Sparkles size={20} color="#ffc46b" />} title="Sponsorship readiness" badge="Index" />
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#ffc46b', lineHeight: 1 }}>
              {sponsor?.score != null ? String(sponsor.score) : '—'}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 100</span>
            </div>
            <p style={{ fontWeight: 600, marginTop: '8px', color: 'var(--text-main)' }}>{String(sponsor?.tier ?? '')}</p>
            <ul style={{ margin: '12px 0 0', paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {((sponsor?.factors as string[]) || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Chapter>

      <Chapter
        id="panel-creative"
        label="Packaging & ideas"
        subtitle="Benchmark vs a simple baseline, words in titles, hook signal, and topic ideas to test."
      >
        {plainLang.benchmark || plainLang.keywords || plainLang.hook || plainLang.topic_gaps ? (
          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 20px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(180,120,255,0.07)',
              border: '1px solid rgba(180,120,255,0.14)',
            }}
          >
            {[plainLang.benchmark, plainLang.keywords, plainLang.hook, plainLang.topic_gaps].filter(Boolean).join(' ')}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          <Card>
            <CardHead title="You vs niche (est.)" badge="Context" icon={<Activity size={20} color="#00d4ff" />} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{String(bench?.note ?? '')}</p>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={benchCompare} margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="metric" stroke="var(--text-muted)" fontSize={9} interval={0} angle={-12} textAnchor="end" height={56} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="you" fill="#00d4ff" name="You" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="niche" fill="#6b7280" name="Niche est." radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead title="Title keywords" badge={`Top ${kwData.length}`} icon={<Sparkles size={20} color="#8c5fff" />} />
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={kwData} layout="vertical" margin={{ left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis type="category" dataKey="term" stroke="var(--text-muted)" fontSize={10} width={72} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8c5fff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHead title="Hook strength" badge="Proxy" icon={<Flame size={20} color="#8c5fff" />} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{String(hook?.note ?? '')}</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#8c5fff' }}>{String(hook?.hook_strength_score ?? '—')}</div>
          </Card>

          <Card style={{ gridColumn: '1 / -1' }}>
            <CardHead icon={<PlayCircle size={20} color="#5dffb0" />} title="Topic gap finder" badge={`${topicGaps.length} ideas`} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Mix of gap detection + optional LLM suggestions (when not in fast mode).
            </p>
            <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, color: 'var(--text-main)' }}>
              {topicGaps.map((t, i) => (
                <li key={i}>
                  <strong>{t.topic}</strong>{' '}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({t.source})</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Chapter>
    </div>
  );
};

export default Intelligence;
