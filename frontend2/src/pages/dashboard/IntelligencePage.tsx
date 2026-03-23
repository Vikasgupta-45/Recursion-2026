import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardMock } from "../../data/mockApi";
import { PredictiveChart } from "../../components/PredictiveChart";

export function IntelligencePage() {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {dashboardMock.kpis.map((kpi, idx) => (
          <motion.article
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="glass-panel p-4"
          >
            <p className="text-xs text-slate-400">{kpi.label}</p>
            <h3 className="text-2xl font-semibold text-white">{kpi.value}</h3>
            <p className="text-xs text-emerald-300">{kpi.delta}</p>
          </motion.article>
        ))}
      </div>

      <PredictiveChart data={dashboardMock.predictiveSeries} />

      <div className="glass-panel p-4">
        <h3 className="mb-2 text-lg font-semibold text-slate-100">Feature Importance</h3>
        <p className="mb-3 text-xs text-slate-400">
          Variables driving view performance in your Random Forest model.
        </p>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={dashboardMock.featureImportance}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" />
              <XAxis dataKey="feature" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(168,85,247,0.35)",
                  borderRadius: "10px",
                }}
              />
              <Bar dataKey="score" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
