export interface User {
  fullName: string;
  email: string;
}

export interface KpiStat {
  label: string;
  value: string;
  delta: string;
}

export interface PredictivePoint {
  day: string;
  historical: number | null;
  predicted: number | null;
}

export interface FeatureImportanceItem {
  feature: string;
  score: number;
}

export interface ContentGapItem {
  topic: string;
  marketMomentum: number;
  overlap: number;
  severity: "Critical" | "High" | "Medium";
}

export interface StrategyCard {
  id: string;
  title: string;
  channel: string;
  rationale: string;
  impact: string;
}

export interface ExplainabilityItem {
  recommendation: string;
  reasoning: string;
}

export interface DashboardData {
  kpis: KpiStat[];
  predictiveSeries: PredictivePoint[];
  featureImportance: FeatureImportanceItem[];
  contentGaps: ContentGapItem[];
  strategies: StrategyCard[];
  explainability: ExplainabilityItem[];
}
