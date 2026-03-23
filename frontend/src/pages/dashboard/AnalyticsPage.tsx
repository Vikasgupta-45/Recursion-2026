import { useMemo, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { BrainCircuit, TrendingUp, Users, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Platform } from "../../types";

// --- MOCK API DATA from FastAPI Backend ---
const predictiveData = [
  { day: "-30 Days", historical: 12000, predicted: null },
  { day: "-20 Days", historical: 15000, predicted: null },
  { day: "-10 Days", historical: 14500, predicted: null },
  { day: "Today",    historical: 18000, predicted: 18000 }, // Join point
  { day: "+10 Days", historical: null,  predicted: 22000 },
  { day: "+20 Days", historical: null,  predicted: 27500 },
  { day: "+30 Days", historical: null,  predicted: 34000 },
  { day: "+60 Days", historical: null,  predicted: 52000 },
];

const featureImportance = [
  { feature: "Thumbnail Saturation", impact: 92 },
  { feature: "Title Length (<50c)",  impact: 85 },
  { feature: "Video Duration",       impact: 74 },
  { feature: "Upload Time (Wknd)",   impact: 68 },
  { feature: "Hashtag Relevance",    impact: 42 },
];
// ------------------------------------------

export function AnalyticsPage() {
  const { profile } = useAuth();
  
  return (
    <div className="analytics-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Module 4: Primary KPI Header */}
      <section className="grid-2 metrics">
        <article className="inner-card metric" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: '12px' }}>
            <TrendingUp size={32} color="var(--accent)" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--muted)'}}>Projected 60-Day Views</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--text-h)'}}>52.4K</p>
          </div>
        </article>

        <article className="inner-card metric" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: '12px' }}>
            <Users size={32} color="var(--accent)" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--muted)'}}>Audience Retention</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--text-h)'}}>68.2%</p>
          </div>
        </article>

        <article className="inner-card metric" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: '12px' }}>
            <Clock size={32} color="var(--accent)" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--muted)'}}>Avg Watch Time</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--text-h)'}}>08:42</p>
          </div>
        </article>

        <article className="inner-card metric" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-soft)', padding: '1rem', borderRadius: '12px' }}>
            <BrainCircuit size={32} color="var(--accent)" />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--muted)'}}>AI Confidence Score</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--text-h)'}}>94%</p>
          </div>
        </article>
      </section>

      {/* Module 4: Predictive Model Chart */}
      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp color="var(--accent)" /> Prophet Predictive Model
        </h2>
        <p className="muted">Historical Channel Data natively bleeding into a 60-Day ML Trajectory.</p>
        
        <div style={{ width: '100%', height: 400, marginTop: '2rem' }}>
          <ResponsiveContainer>
            <LineChart data={predictiveData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted)" tick={{ fill: 'var(--text)' }} />
              <YAxis stroke="var(--muted)" tick={{ fill: 'var(--text)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', boxShadow: 'var(--shadow)' }}
                itemStyle={{ color: 'var(--text-h)', fontWeight: 'bold' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="historical" 
                stroke="var(--accent)" 
                strokeWidth={4} 
                dot={{ r: 4, fill: 'var(--accent)' }} 
                activeDot={{ r: 8 }} 
                name="Historical Views"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="var(--accent-2)" 
                strokeWidth={4} 
                strokeDasharray="8 8" 
                dot={false}
                name="60-Day Prediction"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Module 4: Feature Importance Chart */}
      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BrainCircuit color="var(--accent)" /> Feature Importance Weights
        </h2>
        <p className="muted">Random Forest mathematical analysis of identical content verticals determining what exactly drives views.</p>
        
        <div style={{ width: '100%', height: 350, marginTop: '2rem' }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={featureImportance} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="var(--muted)" />
              <YAxis dataKey="feature" type="category" stroke="var(--text-h)" width={150} tick={{ fill: 'var(--text)', fontWeight: 600, fontSize: 13 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', boxShadow: 'var(--shadow)' }}
                cursor={{ fill: 'var(--accent-soft)', opacity: 0.5 }}
              />
              <Bar dataKey="impact" fill="var(--accent)" radius={[0, 8, 8, 0]} name="Impact Weight (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}
