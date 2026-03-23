import { motion } from "framer-motion";
import { dashboardMock } from "../../data/mockApi";

export function StrategyBoardPage() {
  return (
    <section className="glass-panel p-4">
      <h2 className="text-xl font-semibold text-white">Agentic Strategy Board</h2>
      <p className="mb-4 text-sm text-slate-400">
        LLM-generated action plans prioritized by impact and confidence.
      </p>
      <div className="grid gap-3">
        {dashboardMock.strategies.map((plan, idx) => (
          <motion.article
            key={plan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-slate-100">{plan.title}</h3>
              <span className="rounded-full border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200">
                {plan.channel}
              </span>
            </div>
            <p className="text-sm text-slate-300">{plan.rationale}</p>
            <p className="mt-2 text-xs text-emerald-300">{plan.impact}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
