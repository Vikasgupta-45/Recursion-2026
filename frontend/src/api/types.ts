/** Mirrors backend AnalysisResponse — nested objects stay flexible. */

export interface ForecastPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ViewsForecast {
  current_value?: number;
  predicted_value?: number;
  growth_pct?: number;
  periods?: number;
  models_used?: string[];
  forecast?: ForecastPoint[];
  error?: string;
}

export interface SubscriberForecast {
  current_value?: number;
  predicted_value?: number;
  growth_pct?: number;
  summary?: string;
  metric?: string;
  forecast?: ForecastPoint[];
  error?: string;
}

export interface EngagementForecast {
  current_value?: number;
  predicted_value?: number;
  trend?: string;
  summary?: string;
  forecast?: ForecastPoint[];
  error?: string;
}

export interface PredictionsBlock {
  views_forecast: ViewsForecast;
  subscriber_forecast: SubscriberForecast;
  engagement_forecast: EngagementForecast;
  timeseries_source?: string;
}

export interface VideoMeta {
  title?: string;
  views?: number;
  duration_seconds?: number;
  published_at?: string;
}

export interface AnalysisResponse {
  status: string;
  channel_metrics: Record<string, unknown>;
  content_metrics: Record<string, unknown>;
  audience_metrics: Record<string, unknown>;
  intelligence_insights: Record<string, unknown>;
  opportunities: Array<Record<string, unknown>>;
  ai_strategy: Record<string, unknown>;
  predictions: PredictionsBlock;
  content_optimization: Record<string, unknown>;
  content_calendar: Record<string, unknown>;
  analysis_run_id?: string | null;
  creator_snapshot?: Record<string, unknown>;
}

export interface AnalysisRunListItem {
  id: string;
  created_at: string;
  youtube_url: string | null;
  channel_id_uc: string | null;
  timeseries_source: string | null;
  user_id: number | null;
}

export interface LatestAnalysisPayload {
  run: AnalysisRunListItem;
  result: AnalysisResponse;
  youtube_url: string | null;
}

export interface ChannelVideoRow {
  video_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category_id?: string;
  published_at?: string;
  date?: string;
  views: number;
  likes: number;
  comments: number;
  duration_seconds: number;
  thumbnail_url?: string | null;
}

export interface ChannelBenchmarks {
  video_count?: number;
  median_views?: number;
  p25_views?: number;
  p75_views?: number;
  max_views?: number;
  median_duration_sec?: number;
  median_engagement_rate?: number;
}

export interface ChannelVideosResponse {
  status: string;
  channel_id: string;
  channel_title?: string | null;
  benchmarks: ChannelBenchmarks;
  videos: ChannelVideoRow[];
  youtube_api_notice?: string | null;
  video_count_returned: number;
}

/** Competitor Analyser — Gemini JSON + computed metrics */
export interface CompetitorOpportunity {
  opportunity?: string;
  why_competitor_is_weak_here?: string;
  what_you_should_do?: string;
  suggested_video_title?: string;
  difficulty?: string;
  potential_impact?: string;
}

export interface CompetitorStealIdea {
  their_video_title?: string;
  their_views?: number;
  your_improved_angle?: string;
  your_title?: string;
  why_yours_will_do_better?: string;
}

export interface CompetitorTractionWhy {
  area?: string;
  what_they_do_better?: string;
  what_you_do_wrong_or_weaker?: string;
  proof_from_our_numbers?: string;
  exactly_what_to_change?: string;
}

export interface CompetitorCriticalMistake {
  mistake?: string;
  how_it_costs_traction?: string;
  what_they_do_instead?: string;
  fix_priority?: string;
  first_step_this_week?: string;
}

export interface CompetitorTractionAnalysis {
  headline?: string;
  same_game_explanation?: string;
  why_they_get_more_traction?: CompetitorTractionWhy[];
  critical_mistakes_youre_making?: CompetitorCriticalMistake[];
  where_you_already_win?: string[];
  brutal_bottom_line?: string;
}

export interface CompetitorMetricDeepDive {
  metric_key?: string;
  metric_label?: string;
  winner?: string;
  what_this_means_practically?: string;
  one_specific_fix?: string;
}

export interface CompetitorComparisonRow {
  key: string;
  label: string;
  you: number;
  competitor: number;
  winner: string;
  higher_is_better: boolean;
  delta_pct: number;
}

export interface CompetitorComparisonBlock {
  creator_label?: string;
  competitor_label?: string;
  metric_rows?: CompetitorComparisonRow[];
  win_counts?: { you?: number; competitor?: number; tie?: number };
}

export interface CompetitorGeminiReport {
  competitor_name?: string;
  health_score?: number;
  health_label?: string;
  traction_analysis?: CompetitorTractionAnalysis;
  metric_deep_dives?: CompetitorMetricDeepDive[];
  snapshot?: Record<string, string | undefined>;
  content_strategy?: Record<string, unknown>;
  performance_breakdown?: Record<string, string | undefined>;
  audience_intelligence?: Record<string, unknown>;
  gap_analysis?: Record<string, unknown>;
  opportunities_for_creator?: CompetitorOpportunity[];
  steal_these_ideas?: CompetitorStealIdea[];
  head_to_head?: Record<string, string | undefined>;
  action_plan?: Record<string, unknown>;
  watch_out_for?: string;
  final_verdict?: string;
}

export interface CompetitorAnalyseResponse {
  status: string;
  report: CompetitorGeminiReport;
  metrics: {
    competitor: Record<string, unknown>;
    creator: Record<string, unknown>;
    comparison?: CompetitorComparisonBlock;
    competitor_channel?: { channel_id?: string; title?: string };
    creator_channel?: { channel_id?: string; title?: string };
  };
}

export interface CompetitorSuggestion {
  channel_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string | null;
  /** Search query this channel matched first */
  match_hint?: string;
}

export interface CompetitorDiscoverSignals {
  channel_title?: string;
  top_tags?: string[];
  from_titles?: string[];
  categories?: string[];
  merged_keywords?: string[];
}

export interface CompetitorSuggestResponse {
  suggestions: CompetitorSuggestion[];
  query_used: string;
  queries_tried?: string[];
  signals_used?: CompetitorDiscoverSignals;
  discover_error?: string;
}

export interface VideoOverview {
  video_id?: string;
  title?: string;
  published_at?: string;
  duration_seconds?: number;
  duration_label?: string;
  views?: number;
  likes?: number;
  comments?: number;
  engagement_rate?: number;
  views_per_day?: number;
  approx_performance_vs_median?: string;
  estimated_percentile_vs_channel?: number;
  description_preview?: string;
  tags?: string[];
  category_id?: string;
  thumbnail_url?: string | null;
  watch_url?: string | null;
}

export interface VideoInsightsResponse {
  overview: VideoOverview;
  channel_benchmarks: ChannelBenchmarks;
  improvement_checklist: string[];
  ai_coach: string | null;
}
