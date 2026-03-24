import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Loader2, Search, MessageSquare, ListCheck, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const API_URL = 'http://127.0.0.1:5050/analyze';

interface CompData {
  id: string;
  title: string;
  subscribers: string;
  avg_engagement: number;
  thumbnail: string;
}

interface AnalysisResult {
  my_channel: { title: string; subscribers: string; avg_engagement: number; thumbnail: string };
  competitors: CompData[];
  suggestions: string[];
  competitor_search?: { query: string; source: string };
}

const fmtPct = (n: number) => Number(n).toFixed(2);

export default function Competitor() {
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [contentFocus, setContentFocus] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAnalyze = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError('Enter a YouTube channel URL'); return; }
    setLoading(true); setError('');
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_url: trimmed,
          genre: genre.trim() || null,
          content_focus: contentFocus.trim() || null,
        }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.detail || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      setAnalysis({
        ...data,
        competitors: Array.isArray(data.competitors) ? data.competitors : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      });
    } catch (e: any) {
      setError(e.message || 'Failed to connect to backend on port 5050');
    } finally {
      setLoading(false);
    }
  }, [url, genre, contentFocus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 10, background: 'rgba(99,102,241,0.12)', borderRadius: 12 }}>
          <Users size={24} color="#818cf8" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Competitor Analysis</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Find competitors, benchmark engagement, and get AI growth suggestions
          </p>
        </div>
      </header>

      {/* Input Form */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/@YourChannel"
              style={{
                flex: '2 1 280px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem',
              }}
            />
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder="Genre (e.g. Tech, Gaming)"
              style={{
                flex: '1 1 140px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem',
              }}
            />
          </div>
          <textarea
            rows={2}
            value={contentFocus}
            onChange={e => setContentFocus(e.target.value)}
            placeholder="Content focus — what are your videos about? (optional, improves competitor matching)"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.85rem',
              resize: 'vertical', minHeight: 56, fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn-primary"
              disabled={loading}
              onClick={() => void runAnalyze()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              {loading ? 'Analyzing…' : 'Analyze Competitors'}
            </button>
            {analysis && (
              <button
                onClick={() => { setAnalysis(null); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                New Analysis
              </button>
            )}
          </div>
          {error && <div style={{ color: '#ff6b8a', fontSize: '0.85rem' }}>{error}</div>}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* My Channel Header */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <img src={analysis.my_channel.thumbnail} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
              <div>
                <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>{analysis.my_channel.title}</h3>
                <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {analysis.my_channel.subscribers} Subs</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14} /> {fmtPct(analysis.my_channel.avg_engagement)}% Engagement</span>
                </div>
              </div>
            </div>

            {/* Grid: Competitors + Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }} className="comp-grid">
              {/* Competitors List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#818cf8" /> Found Competitors
                </h4>
                {analysis.competitor_search?.query && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Matched: <span style={{ color: 'var(--text-main)' }}>{analysis.competitor_search.query}</span>
                  </p>
                )}
                {analysis.competitors.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No competitors found. Try a broader genre.</p>
                ) : (
                  analysis.competitors.map(comp => (
                    <div key={comp.id} className="glass-panel" style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={comp.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 10 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comp.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{comp.subscribers} subs</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#6dffc4', fontWeight: 600 }}>{fmtPct(comp.avg_engagement)}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engagement</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Charts + Suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Engagement Bar Chart */}
                <div className="glass-panel" style={{ padding: 20 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} color="#6dffc4" /> Engagement Benchmark
                  </h4>
                  <div style={{ height: 280, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Me', value: Number(fmtPct(analysis.my_channel.avg_engagement)) },
                        ...analysis.competitors.map(c => ({ name: c.title.substring(0, 12), value: Number(fmtPct(c.avg_engagement)) })),
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(20,18,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                          itemStyle={{ color: '#818cf8' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {[analysis.my_channel, ...analysis.competitors].map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#6366f1' : '#a855f7'} opacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="glass-panel" style={{ padding: 20 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ListCheck size={18} color="#f6ad55" /> Growth Suggestions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(analysis.suggestions ?? []).map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14,
                        borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ padding: 8, background: 'rgba(99,102,241,0.15)', borderRadius: 10, flexShrink: 0 }}>
                          {i === 0 ? <MessageSquare size={14} color="#818cf8" /> : <TrendingUp size={14} color="#818cf8" />}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--text-main)' }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .comp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
