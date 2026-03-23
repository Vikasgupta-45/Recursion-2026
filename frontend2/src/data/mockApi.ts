import type { DashboardData } from "../types";

// Mock response structure that mirrors a typical FastAPI JSON payload.
// Replace `dashboardMock` with fetched data once your backend endpoint is ready.
export const dashboardMock: DashboardData = {
  kpis: [
    { label: "Total Subscribers", value: "1.24M", delta: "+5.2%" },
    { label: "Avg Weekly Views", value: "3.8M", delta: "+11.8%" },
    { label: "Retention Score", value: "67.4%", delta: "+2.1%" },
    { label: "Predicted 60d Growth", value: "+17.9%", delta: "Prophet Model" },
  ],
  predictiveSeries: [
    { day: "D-12", historical: 92, predicted: null },
    { day: "D-10", historical: 95, predicted: null },
    { day: "D-8", historical: 98, predicted: null },
    { day: "D-6", historical: 100, predicted: null },
    { day: "D-4", historical: 104, predicted: null },
    { day: "D-2", historical: 108, predicted: null },
    { day: "Now", historical: 110, predicted: 110 },
    { day: "D+10", historical: null, predicted: 118 },
    { day: "D+20", historical: null, predicted: 124 },
    { day: "D+30", historical: null, predicted: 131 },
    { day: "D+40", historical: null, predicted: 137 },
    { day: "D+50", historical: null, predicted: 143 },
    { day: "D+60", historical: null, predicted: 150 },
  ],
  featureImportance: [
    { feature: "Video Duration", score: 0.34 },
    { feature: "Title Length", score: 0.22 },
    { feature: "Thumbnail CTR", score: 0.41 },
    { feature: "Posting Day", score: 0.28 },
    { feature: "Topic Fit", score: 0.37 },
  ],
  contentGaps: [
    { topic: "AI Shorts Automation", marketMomentum: 96, overlap: 11, severity: "Critical" },
    { topic: "Creator Analytics Setup", marketMomentum: 88, overlap: 14, severity: "High" },
    { topic: "Retention Hook Scripts", marketMomentum: 79, overlap: 10, severity: "High" },
    { topic: "Community Monetization", marketMomentum: 74, overlap: 12, severity: "Medium" },
  ],
  strategies: [
    {
      id: "S-1",
      title: "Sunday Deep-Dive Upload",
      channel: "YouTube",
      rationale: "Weekend engagement clusters are 30% higher in your audience cohort.",
      impact: "Estimated +8.7% watch-time lift",
    },
    {
      id: "S-2",
      title: "3-Part Topic Cluster: AI Workflow Series",
      channel: "YouTube + Shorts",
      rationale: "NLP similarity indicates high adjacency to top-trending competitor content.",
      impact: "Estimated +12.1% audience growth",
    },
    {
      id: "S-3",
      title: "48-Hour Cross-Platform Promotion Sprint",
      channel: "YouTube + Instagram",
      rationale: "Best-performing posts show response spikes within first 2 days.",
      impact: "Estimated +19% discovery impressions",
    },
  ],
  explainability: [
    {
      recommendation: "Upload on Sunday",
      reasoning:
        "Historical data and Random Forest feature weights show weekend timing contributes strongly to retention and CTR.",
    },
    {
      recommendation: "Use medium-length titles (50-62 chars)",
      reasoning:
        "TfidfVectorizer topic clusters + historical CTR suggest this range maximizes discoverability and readability.",
    },
  ],
};
