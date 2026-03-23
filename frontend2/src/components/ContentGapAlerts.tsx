import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { ContentGapItem } from "../types";

const severityColor: Record<ContentGapItem["severity"], string> = {
  Critical: "border-pink-500/60 bg-pink-500/10",
  High: "border-violet-500/60 bg-violet-500/10",
  Medium: "border-cyan-500/60 bg-cyan-500/10",
};

export function ContentGapAlerts({ gaps }: { gaps: ContentGapItem[] }) {
  return (
    <section className="glass-panel p-4">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">High-Value Content Gaps</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {gaps.map((gap, idx) => (
          <motion.article
            key={gap.topic}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className={`rounded-xl border p-4 ${severityColor[gap.severity]}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium text-white">{gap.topic}</h4>
              <AlertTriangle className="h-4 w-4 text-amber-300" />
            </div>
            <p className="text-xs text-slate-200">Severity: {gap.severity}</p>
            <p className="text-xs text-slate-300">Market Momentum: {gap.marketMomentum}%</p>
            <p className="text-xs text-slate-300">Catalog Overlap: {gap.overlap}%</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
