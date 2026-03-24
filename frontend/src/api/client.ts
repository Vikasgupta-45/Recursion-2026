import { authHeaders } from '../lib/authStorage';
import type {
  AnalysisResponse,
  AnalysisRunListItem,
  ChannelVideosResponse,
  CompetitorAnalyseResponse,
  CompetitorSuggestResponse,
  LatestAnalysisPayload,
  VideoInsightsResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function postAnalyze(body: {
  youtube_url?: string | null;
  instagram_handle?: string | null;
  twitter_handle?: string | null;
  persist?: boolean;
  user_email?: string | null;
  supabase_user_id?: string | null;
  /** Default true on API: skips Trends + LLM, smaller yt-dlp pulls, shorter forecasts */
  fast_mode?: boolean;
}): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const j = JSON.parse(text) as { detail?: string };
      if (typeof j.detail === 'string') detail = j.detail;
    } catch {
      /* ignore */
    }
    if (res.status === 502 || res.status === 503) {
      throw new Error(
        `${detail || 'Bad gateway'} — Start the API on port 8000: cd backend && uvicorn main:app --reload --host 127.0.0.1 --port 8000`
      );
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<AnalysisResponse>;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { detail?: string | string[] };
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) return j.detail.map((d) => String(d)).join('; ');
  } catch {
    /* ignore */
  }
  return text || `HTTP ${res.status}`;
}

export async function getMyLatestAnalysis(): Promise<LatestAnalysisPayload> {
  const res = await fetch(`${API_BASE}/api/analyses/me/latest`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<LatestAnalysisPayload>;
}

export async function getMyAnalysisHistory(limit = 50): Promise<AnalysisRunListItem[]> {
  const res = await fetch(`${API_BASE}/api/analyses/me?limit=${limit}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<AnalysisRunListItem[]>;
}

export async function getAnalysisById(runId: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analyses/${runId}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<AnalysisResponse>;
}

export async function postChannelVideos(body: {
  youtube_url: string;
  max_videos?: number;
}): Promise<ChannelVideosResponse> {
  const res = await fetch(`${API_BASE}/api/channel/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ChannelVideosResponse>;
}

export async function postVideoInsights(body: {
  youtube_url: string;
  video_id: string;
  use_llm?: boolean;
  max_videos_for_bench?: number;
}): Promise<VideoInsightsResponse> {
  const res = await fetch(`${API_BASE}/api/video/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<VideoInsightsResponse>;
}

export async function postThumbnailCtr(body: { image_url: string }): Promise<{
  ctr_score: number | null;
  summary?: string;
  source?: string;
  model?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/api/predict/thumbnail-ctr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    ctr_score: number | null;
    summary?: string;
    source?: string;
    model?: string;
    error?: string;
  }>;
}

export async function postCompetitorAnalyse(body: {
  competitor_url: string;
  my_channel_id: string;
}): Promise<CompetitorAnalyseResponse> {
  const res = await fetch(`${API_BASE}/api/competitor/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<CompetitorAnalyseResponse>;
}

export async function getCompetitorSuggest(params: {
  my_channel_id: string;
  /** Optional — merged with tags from your last uploads (auto-detected) */
  tags?: string;
}): Promise<CompetitorSuggestResponse> {
  const q = new URLSearchParams();
  q.set('my_channel_id', params.my_channel_id);
  if (params.tags?.trim()) q.set('tags', params.tags.trim());
  const res = await fetch(`${API_BASE}/api/competitor/suggest?${q.toString()}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<CompetitorSuggestResponse>;
}

export async function getCompetitorQuota(my_channel_id: string): Promise<{
  remaining_today: number;
  max_per_day: number;
}> {
  const q = new URLSearchParams({ my_channel_id });
  const res = await fetch(`${API_BASE}/api/competitor/quota?${q.toString()}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ remaining_today: number; max_per_day: number }>;
}
