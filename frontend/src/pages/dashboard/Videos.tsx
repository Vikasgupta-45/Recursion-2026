import { useCallback, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Film } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { postChannelVideos, postVideoInsights } from '../../api/client';
import type { ChannelVideoRow, ChannelVideosResponse, VideoInsightsResponse } from '../../api/types';
import { formatCompact, formatPercent } from '../../lib/format';

type SortKey = 'published_at' | 'views' | 'engagement';

function engagementRate(v: ChannelVideoRow): number {
  const views = v.views || 0;
  if (views <= 0) return 0;
  return (v.likes + v.comments) / views;
}

function fmtDur(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export default function Videos() {
  const { youtubeUrl } = useAnalysis();
  const [catalog, setCatalog] = useState<ChannelVideosResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('published_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [insights, setInsights] = useState<VideoInsightsResponse | null>(null);
  const [insErr, setInsErr] = useState<string | null>(null);
  const [loadingIns, setLoadingIns] = useState(false);

  const loadList = useCallback(async () => {
    const u = youtubeUrl?.trim();
    if (!u) {
      setLoadErr('Set channel URL in the bar above.');
      return;
    }
    setLoadErr(null);
    setLoadingList(true);
    setCatalog(null);
    setSelId(null);
    setInsights(null);
    try {
      const data = await postChannelVideos({ youtube_url: u, max_videos: 200 });
      setCatalog(data);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load videos');
    } finally {
      setLoadingList(false);
    }
  }, [youtubeUrl]);

  const rows = useMemo(() => {
    const v = catalog?.videos ?? [];
    const copy = [...v];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'views') cmp = (a.views || 0) - (b.views || 0);
      else if (sortKey === 'engagement') cmp = engagementRate(a) - engagementRate(b);
      else cmp = String(a.published_at || '').localeCompare(String(b.published_at || ''));
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [catalog, sortKey, sortDesc]);

  const openInsights = useCallback(
    async (videoId: string) => {
      const u = youtubeUrl?.trim();
      if (!u) return;
      setSelId(videoId);
      setInsErr(null);
      setInsights(null);
      setLoadingIns(true);
      try {
        const data = await postVideoInsights({ youtube_url: u, video_id: videoId, use_llm: true });
        setInsights(data);
      } catch (e) {
        setInsErr(e instanceof Error ? e.message : 'Insights failed');
      } finally {
        setLoadingIns(false);
      }
    },
    [youtubeUrl]
  );

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(k !== 'published_at');
    }
  };

  const b = catalog?.benchmarks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 10, background: 'rgba(0,212,255,0.12)', borderRadius: 12 }}><Film size={24} color="#00d4ff" /></div>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Videos & Tips</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>All uploads with per-video benchmarks and improvement tips</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <button type="button" className="btn-primary" disabled={loadingList} onClick={() => void loadList()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          {loadingList ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          {loadingList ? 'Loading…' : 'Load all videos'}
        </button>
        {catalog && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {catalog.channel_title ?? catalog.channel_id} · {catalog.video_count_returned} videos
            {b?.median_views != null && (
              <> · median views {formatCompact(b.median_views)}</>
            )}
          </span>
        )}
      </div>
      {loadErr && <div style={{ color: '#ff6b8a', fontSize: '0.9rem' }}>{loadErr}</div>}
      {catalog?.youtube_api_notice && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API note: {catalog.youtube_api_notice}</div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 380px)',
          gap: '16px',
          alignItems: 'start',
        }}
        className="videos-grid"
      >
        <div className="glass-panel" style={{ padding: 0, overflow: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}> </th>
                <th style={{ padding: '10px 8px' }}>Title</th>
                <th
                  style={{ padding: '10px 8px', cursor: 'pointer', color: sortKey === 'published_at' ? '#00d4ff' : undefined }}
                  onClick={() => toggleSort('published_at')}
                >
                  Date {sortKey === 'published_at' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th
                  style={{ padding: '10px 8px', cursor: 'pointer', color: sortKey === 'views' ? '#00d4ff' : undefined }}
                  onClick={() => toggleSort('views')}
                >
                  Views {sortKey === 'views' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th
                  style={{ padding: '10px 8px', cursor: 'pointer', color: sortKey === 'engagement' ? '#00d4ff' : undefined }}
                  onClick={() => toggleSort('engagement')}
                >
                  Eng. {sortKey === 'engagement' ? (sortDesc ? '↓' : '↑') : ''}
                </th>
                <th style={{ padding: '10px 8px' }}>Len</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = selId === r.video_id;
                const er = engagementRate(r);
                return (
                  <tr
                    key={r.video_id}
                    onClick={() => void openInsights(r.video_id)}
                    style={{
                      cursor: 'pointer',
                      background: active ? 'rgba(0,212,255,0.08)' : undefined,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={{ padding: '6px 8px', width: 56 }}>
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt="" width={48} height={27} style={{ borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 48, height: 27, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.title}>
                      {r.title}
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{(r.published_at || '').slice(0, 10)}</td>
                    <td style={{ padding: '6px 8px' }}>{formatCompact(r.views)}</td>
                    <td style={{ padding: '6px 8px' }}>{formatPercent(er, 2)}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{fmtDur(r.duration_seconds)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loadingList && catalog && rows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No videos returned.</div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '16px', position: 'sticky', top: 8, maxHeight: '70vh', overflow: 'auto' }}>
          {!selId && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click a row for full overview and tips.</p>}
          {loadingIns && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <Loader2 className="spin" size={20} /> Loading insights…
            </div>
          )}
          {insErr && <div style={{ color: '#ff6b8a', fontSize: '0.85rem' }}>{insErr}</div>}
          {insights?.overview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, lineHeight: 1.3 }}>{insights.overview.title}</h3>
              {insights.overview.watch_url && (
                <a href={insights.overview.watch_url} target="_blank" rel="noreferrer" style={{ color: '#00d4ff', fontSize: '0.8rem' }}>
                  Open on YouTube
                </a>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Views</div>
                  <strong>{formatCompact(insights.overview.views)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Views/day</div>
                  <strong>{insights.overview.views_per_day ?? '—'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Engagement</div>
                  <strong>{formatPercent(insights.overview.engagement_rate ?? 0, 2)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>vs median</div>
                  <strong>{insights.overview.approx_performance_vs_median ?? '—'}</strong>
                </div>
              </div>
              {insights.overview.description_preview && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>{insights.overview.description_preview}</p>
              )}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 6 }}>Checklist</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {insights.improvement_checklist.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
              {insights.ai_coach && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 6, color: '#8c5fff' }}>AI coach</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.78rem', margin: 0, lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {insights.ai_coach}
                  </pre>
                </div>
              )}
              {!insights.ai_coach && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Set GROQ_API_KEY on the backend for AI coaching text.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .videos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
