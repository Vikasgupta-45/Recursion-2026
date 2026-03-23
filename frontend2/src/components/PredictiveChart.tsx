import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PredictivePoint } from "../types";

// Main model visualization:
// - "historical" is a solid line
// - "predicted" is a dotted trajectory line
export function PredictiveChart({ data }: { data: PredictivePoint[] }) {
  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold text-slate-100">60-Day Predictive Trajectory</h3>
      <p className="mb-3 text-xs text-slate-400">
        Historical trend transitions into model projection from current day.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(56,189,248,0.35)",
                borderRadius: "10px",
                color: "#e2e8f0",
              }}
            />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#a855f7"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
