import { dashboardMock } from "../../data/mockApi";

export function ExplainabilityPage() {
  return (
    <section className="glass-panel p-4">
      <h2 className="text-xl font-semibold text-white">Explainability Engine</h2>
      <p className="mb-4 text-sm text-slate-400">
        This panel explains the logic behind each AI recommendation to avoid black-box output.
      </p>
      <div className="space-y-3">
        {dashboardMock.explainability.map((item) => (
          <article key={item.recommendation} className="rounded-xl border border-cyan-400/30 bg-slate-900/70 p-4">
            <h3 className="font-medium text-cyan-200">{item.recommendation}</h3>
            <p className="mt-1 text-sm text-slate-300">{item.reasoning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
