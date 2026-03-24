import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaySquare, Search, TrendingUp, Users, MessageSquare, ListCheck, ExternalLink, ChevronRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

/** In dev, use Vite proxy (`/api` → backend). Set VITE_API_BASE in `.env` to override. */
const ANALYZE_URL = import.meta.env.VITE_API_BASE
  ? `${String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')}/analyze`
  : import.meta.env.DEV
    ? '/api/analyze'
    : 'http://127.0.0.1:5050/analyze';

/** Strip BOM / zero-width chars that sometimes make the field look filled but trim() stays "empty" to the eye */
function cleanInput(s: string): string {
  return s
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/** Add https:// when user pastes youtube.com/... without a scheme (still valid in browser, we need a string backend can parse) */
function normalizeYoutubeUrl(s: string): string {
  let t = cleanInput(s);
  if (!t) return '';
  if (!/^https?:\/\//i.test(t)) {
    if (/^(www\.)?youtube\.com\//i.test(t) || /^youtu\.be\//i.test(t)) {
      t = 'https://' + t.replace(/^\/\//, '');
    }
  }
  return t;
}

/**
 * Channel link must end up in the request. Users often paste the URL into "content" or "genre" by mistake.
 */
function resolveChannelUrl(urlField: string, contentFocus: string, genre: string): string | null {
  const primary = normalizeYoutubeUrl(urlField);
  if (primary) return primary;

  const pool = [contentFocus, genre].map(cleanInput).filter(Boolean);
  const urlLike =
    /https?:\/\/(?:www\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+)/i;
  const looseYoutube = /(?:www\.)?youtube\.com\/[^\s]+|youtu\.be\/[^\s]+/i;

  for (const block of pool) {
    for (const line of block.split(/\n/).map(cleanInput).filter(Boolean)) {
      const full = line.match(urlLike);
      if (full) return normalizeYoutubeUrl(full[0]);

      const loose = line.match(looseYoutube);
      if (loose) return normalizeYoutubeUrl(loose[0]);

      // Single token like @ChannelName
      if (/^@[\w.-]{2,}$/.test(line)) {
        return `https://www.youtube.com/${line}`;
      }
    }
  }
  return null;
}

function App() {
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [contentFocus, setContentFocus] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formErrorRef = useRef<HTMLDivElement>(null);

  const fmtPct = (n: number) => Number(n).toFixed(2);

  function formatApiError(err: unknown): string {
    const ax = err as { response?: { data?: { detail?: unknown } }; message?: string };
    const detail = ax.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: { msg?: string; loc?: unknown }) => d.msg || JSON.stringify(d))
        .join(' ');
    }
    if (typeof detail === 'string') return detail;
    if (detail != null && typeof detail === 'object') return JSON.stringify(detail);
    return ax.message || 'Request failed. Is the backend running on port 5050?';
  }

  useEffect(() => {
    if (error && formErrorRef.current) {
      formErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  const runAnalyze = async () => {
    const resolved = resolveChannelUrl(url, contentFocus, genre);
    if (!resolved) {
      setError(
        'Put your channel link in the first field (next to the play icon). ' +
          'Examples: https://www.youtube.com/@YourChannel or youtube.com/channel/UC… ' +
          'If you pasted the URL into Genre or Content by mistake, we will still detect it there.'
      );
      return;
    }
    setUrl(resolved);

    setLoading(true);
    setError('');
    try {
      const resp = await axios.post(
        ANALYZE_URL,
        {
          channel_url: resolved,
          genre: genre.trim() || null,
          content_focus: contentFocus.trim() || null,
        },
        { timeout: 120_000, headers: { 'Content-Type': 'application/json' } }
      );
      const data = resp.data;
      if (!data?.my_channel) {
        setError('Unexpected response from server. Check the API and try again.');
        return;
      }
      setAnalysis({
        ...data,
        competitors: Array.isArray(data.competitors) ? data.competitors : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      });
    } catch (err: unknown) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    void runAnalyze();
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[#0f172a]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <nav className="p-6 border-b border-white/5 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-indigo-600 rounded-lg group-hover:rotate-12 transition-transform">
              <PlaySquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">TubeCompX</h1>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">How it works</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Enterprise</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-3xl mx-auto pt-20"
          >
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                Dominate the <span className="gradient-text">YouTube Algorithm</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Analyze your competitors, find content gaps, and supercharge your engagement with AI-powered insights.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="relative group max-w-2xl mx-auto space-y-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 -z-10"></div>
              <div className="relative flex flex-col gap-3 bg-[#1e293b] rounded-2xl p-4 border border-white/10 shadow-2xl">
                <div className="px-1 space-y-1 text-left">
                  <label htmlFor="channel-url" className="block text-xs font-medium text-gray-400">
                    Channel URL <span className="text-indigo-400">(required)</span>
                  </label>
                  <div className="flex items-center">
                    <PlaySquare className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                    <input
                      id="channel-url"
                      type="text"
                      name="channel_url"
                      autoComplete="url"
                      placeholder="https://www.youtube.com/@YourChannel or youtube.com/channel/UC…"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 py-2"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 px-1">
                  <input
                    type="text"
                    placeholder="Genre (e.g. Education, Tech)"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#0f172a]/60 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Content focus — what are your videos about? (topics, niche, audience)"
                    value={contentFocus}
                    onChange={(e) => setContentFocus(e.target.value)}
                    className="w-full sm:col-span-2 bg-[#0f172a]/60 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y min-h-[72px]"
                  />
                </div>
                <p className="text-xs text-gray-500 px-1">
                  Add <span className="text-gray-400">genre + content focus</span> for better competitor matches (optional — server can fall back if empty).
                </p>
                <div className="flex justify-end pt-1">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Activity className="w-5 h-5" />
                      </motion.div>
                    ) : <Search className="w-5 h-5" />}
                    {loading ? 'Analyzing...' : 'Analyze Now'}
                  </button>
                </div>
                {error && !analysis && (
                  <div
                    ref={formErrorRef}
                    role="alert"
                    className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}
              </div>
            </form>

            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-indigo-900 flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Join 2,000+ creators</p>
                <p className="text-xs text-gray-500">growing 3x faster than average</p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass p-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img src={analysis.my_channel.thumbnail} alt="" className="w-20 h-20 rounded-2xl shadow-xl" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">{analysis.my_channel.title}</h3>
                    <div className="flex items-center gap-4 text-gray-400 mt-1">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {analysis.my_channel.subscribers} Subs</span>
                      <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {fmtPct(analysis.my_channel.avg_engagement)}% Engagement</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnalysis(null);
                    setError('');
                  }}
                  className="text-sm text-gray-500 hover:text-white underline decoration-dashed"
                >
                  New Analysis
                </button>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Competitors List */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h4 className="text-xl font-bold flex items-center gap-2">
                       <Users className="w-5 h-5 text-indigo-400" />
                       Found Competitors
                    </h4>
                    {analysis.competitor_search?.query && (
                      <p className="text-[11px] text-gray-500 max-w-xs text-right">
                        Matched: <span className="text-gray-400">{analysis.competitor_search.query}</span>
                        {analysis.competitor_search.source === 'metadata_fallback' && (
                          <span className="block text-amber-500/90 mt-0.5">(from channel metadata — add genre/content for best results)</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {analysis.competitors.length === 0 ? (
                      <p className="text-sm text-gray-500 px-1">
                        No competitor channels returned for this search. Try a broader genre or content description.
                      </p>
                    ) : (
                      analysis.competitors.map((comp: any) => (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          key={comp.id}
                          className="glass p-4 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <img src={comp.thumbnail} alt="" className="w-12 h-12 rounded-xl" />
                            <div>
                              <p className="font-bold group-hover:text-indigo-400 transition-colors">{comp.title}</p>
                              <p className="text-xs text-gray-500">{comp.subscribers} subscribers</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-emerald-400">{fmtPct(comp.avg_engagement)}%</p>
                            <p className="text-[10px] uppercase text-gray-600 tracking-tighter">Reach</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Analysis & Chart */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass p-8">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Benchmarking Engagement
                    </h4>
                    <div className="h-[300px] w-full min-w-0 min-h-[260px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={260}>
                        <BarChart data={[
                          { name: 'Me', value: Number(fmtPct(analysis.my_channel.avg_engagement)) },
                          ...analysis.competitors.map((c: any) => ({ name: c.title.substring(0, 10), value: Number(fmtPct(c.avg_engagement)) }))
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e3a51" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {
                              [analysis.my_channel.avg_engagement, ...analysis.competitors.map((c:any) => c.avg_engagement)].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#a855f7'} opacity={0.8} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="glass p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <TrendingUp className="w-24 h-24" />
                    </div>
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <ListCheck className="w-5 h-5 text-amber-400" />
                      Growth Suggestions
                    </h4>
                    <div className="space-y-4">
                      {(analysis.suggestions ?? []).map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400 shrink-0">
                            {i === 0 ? <MessageSquare className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <footer className="mt-20 py-12 border-t border-white/5 text-center text-gray-500 text-sm">
        <p>© 2026 TubeCompX. Built with Velocity.</p>
      </footer>
    </div>
  );
}

export default App;
