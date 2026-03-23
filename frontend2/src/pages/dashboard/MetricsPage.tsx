import { dashboardMock } from "../../data/mockApi";

export function MetricsPage() {
  return (
    <section className="glass-panel p-4">
      <h2 className="text-xl font-semibold text-white">Model & Pipeline Metrics</h2>
      <p className="mb-4 text-sm text-slate-400">
        Reference panel for quick checks before swapping mock data to live FastAPI endpoints.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {dashboardMock.kpis.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">{metric.label}</p>
            <p className="text-2xl font-semibold text-white">{metric.value}</p>
            <p className="text-xs text-cyan-300">{metric.delta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
