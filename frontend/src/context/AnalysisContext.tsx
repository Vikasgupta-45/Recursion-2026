import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMyLatestAnalysis, postAnalyze } from '../api/client';
import type { AnalysisResponse } from '../api/types';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = 'growth_engine_analysis_v1';

function cacheKey(userId: number) {
  return `${STORAGE_PREFIX}_u${userId}`;
}

function youtubeStorageKey(userId: number) {
  return `${STORAGE_PREFIX}_youtube_u${userId}`;
}

type Ctx = {
  youtubeUrl: string;
  setYoutubeUrl: (u: string) => void;
  analysis: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  analysisStep: string;
  runAnalysis: () => Promise<void>;
  clearAnalysis: () => void;
  historyLoading: boolean;
  reloadFromServer: () => Promise<void>;
};

const AnalysisContext = createContext<Ctx | null>(null);

const STEPS = [
  'Collecting channel data…',
  'Processing time series…',
  'Running intelligence & gap detection…',
  'Forecasting growth (Prophet / ARIMA / LSTM)…',
  'Optimizing content & building 30-day plan…',
];

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const uid = user?.id;

  const [youtubeUrl, setYoutubeUrlState] = useState('https://www.youtube.com/@krishnaikhindi');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState('');

  const persistYoutube = useCallback(
    (url: string) => {
      if (uid != null) {
        try {
          localStorage.setItem(youtubeStorageKey(uid), url);
        } catch {
          /* ignore */
        }
      }
    },
    [uid]
  );

  const handleSetYoutubeUrl = useCallback(
    (u: string) => {
      setYoutubeUrlState(u);
      persistYoutube(u);
    },
    [persistYoutube]
  );

  const reloadFromServer = useCallback(async () => {
    if (!token || uid == null) return;
    setHistoryLoading(true);
    try {
      const latest = await getMyLatestAnalysis();
      if (latest.result?.status === 'success') {
        setAnalysis(latest.result);
        try {
          localStorage.setItem(cacheKey(uid), JSON.stringify(latest.result));
        } catch {
          /* quota */
        }
        const yu = latest.youtube_url?.trim() || user?.default_youtube_url?.trim();
        if (yu) {
          setYoutubeUrlState(yu);
          persistYoutube(yu);
        }
      }
    } catch {
      /* 404 or network — keep local cache */
    } finally {
      setHistoryLoading(false);
    }
  }, [token, uid, user?.default_youtube_url, persistYoutube]);

  useEffect(() => {
    if (uid == null) return;

    const fromProfile = user?.default_youtube_url?.trim();
    let y = '';
    try {
      y = localStorage.getItem(youtubeStorageKey(uid)) || '';
    } catch {
      /* ignore */
    }
    if (fromProfile) setYoutubeUrlState(fromProfile);
    else if (y) setYoutubeUrlState(y);

    (async () => {
      setHistoryLoading(true);
      try {
        const latest = await getMyLatestAnalysis();
        if (latest.result?.status === 'success') {
          setAnalysis(latest.result);
          try {
            localStorage.setItem(cacheKey(uid), JSON.stringify(latest.result));
          } catch {
            /* ignore */
          }
          const yu = latest.youtube_url?.trim() || fromProfile;
          if (yu) {
            setYoutubeUrlState(yu);
            persistYoutube(yu);
          }
          return;
        }
      } catch {
        /* no server history */
      }

      try {
        const raw = localStorage.getItem(cacheKey(uid));
        if (raw) {
          const parsed = JSON.parse(raw) as AnalysisResponse;
          if (parsed?.status === 'success') setAnalysis(parsed);
        }
      } catch {
        localStorage.removeItem(cacheKey(uid));
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [uid, token, user?.default_youtube_url, persistYoutube]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    if (uid != null) {
      try {
        localStorage.removeItem(cacheKey(uid));
      } catch {
        /* ignore */
      }
    }
  }, [uid]);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setLoading(true);
    let stepIdx = 0;
    const interval = window.setInterval(() => {
      setAnalysisStep(STEPS[stepIdx % STEPS.length]);
      stepIdx += 1;
    }, 2800);

    try {
      const hasYt = !!youtubeUrl?.trim();
      if (!hasYt) {
        throw new Error('Enter a YouTube channel URL (or use the default).');
      }

      const data = await postAnalyze({
        persist: true,
        youtube_url: youtubeUrl.trim(),
      });

      setAnalysis(data);
      if (uid != null) {
        try {
          localStorage.setItem(cacheKey(uid), JSON.stringify(data));
        } catch {
          /* quota */
        }
      }
      persistYoutube(youtubeUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setAnalysisStep('');
    }
  }, [youtubeUrl, uid, persistYoutube]);

  const value = useMemo(
    () => ({
      youtubeUrl,
      setYoutubeUrl: handleSetYoutubeUrl,
      analysis,
      loading,
      error,
      analysisStep,
      runAnalysis,
      clearAnalysis,
      historyLoading,
      reloadFromServer,
    }),
    [
      youtubeUrl,
      handleSetYoutubeUrl,
      analysis,
      loading,
      error,
      analysisStep,
      runAnalysis,
      clearAnalysis,
      historyLoading,
      reloadFromServer,
    ]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis(): Ctx {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider');
  return ctx;
}
