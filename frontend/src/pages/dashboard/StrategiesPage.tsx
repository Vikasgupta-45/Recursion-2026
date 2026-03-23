import { Bot, Terminal, Activity, FileSpreadsheet, LayoutGrid, CheckCircle } from "lucide-react";

export function StrategiesPage() {
  const agentTasks = [
    { id: "A1", status: "Running", task: "Analyzing competitor thumbnails across top 50 tech channels..." },
    { id: "A2", status: "Running", task: "Cross-referencing retention drops at 02:40 mark..." },
    { id: "A3", status: "Completed", task: "Title permutation generation via LLM." }
  ];

  const recommendations = [
    {
      title: "Mastering React Animations with Lenis & GSAP",
      format: "Hero Tutorial (15-20 min)",
      confidence: 88,
      explainability: {
        metric: "Upload on Sunday at 14:00 EST",
        math: "Historical user overlap shows 34% increased CTR on weekends. Feature importance model weights 'Sunday' at 0.82 highly correlated with session length."
      }
    },
    {
      title: "Why Your Tailwind Components Look Boring",
      format: "Hot Take / Rant (8-10 min)",
      confidence: 94,
      explainability: {
        metric: "Use clickbait-negative phrasing",
        math: "Scikit-learn random forest indicates negative sentiment hooks in tech verticals drive +42% initial click-through compared to neutral educational titles."
      }
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
      
      {/* Left Column: Strategy Board */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <LayoutGrid color="var(--accent)" /> Agentic Strategy Board
            </h2>
            <div className="badge" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-h)'}}>
              Auto-Pilot: ON
            </div>
          </div>
          <p className="muted">Command center for autonomous content recommendations driven by Live ML Agents.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            {recommendations.map((rec, i) => (
              <div key={i} className="inner-card" style={{ borderLeft: '4px solid var(--accent)'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0'}}>{rec.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)'}}>Format: <strong>{rec.format}</strong></p>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)'}}>
                    <strong style={{ color: 'var(--text-h)'}}>{rec.confidence}%</strong> AI Confidence
                  </div>
                </div>
                
                {/* Embedded Explainability inside the strategy card */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  background: 'rgba(255,255,255, 0.4)', 
                  border: '1px solid var(--accent-3)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <FileSpreadsheet color="var(--accent)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-h)', display: 'block', marginBottom: '0.25rem' }}>
                      Recommendation: {rec.explainability.metric}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)'}}>
                      <strong>Mathematical Reasoning:</strong> {rec.explainability.math}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button style={{ margin: 0, padding: '8px 16px' }}>Approve to Pipeline</button>
                  <button className="ghost-btn" style={{ margin: 0, padding: '8px 16px' }}>Reject (Train AI)</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Explainability & Agents Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Active Agents Module */}
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', margin: '0 0 1rem 0' }}>
            <Terminal color="var(--accent)" size={20} /> Active LLM Agents
          </h3>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {agentTasks.map(agent => (
              <div key={agent.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                {agent.status === "Running" ? 
                  <Activity size={16} color="var(--accent-2)" className="spin" /> : 
                  <CheckCircle size={16} color="var(--accent)" />
                }
                <div>
                  <strong style={{ color: 'var(--text-h)'}}>[{agent.id}]</strong> {agent.task}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Explainability Side Panel */}
        <section className="card" style={{ padding: '1.5rem', background: 'var(--bg)', border: '1px solid var(--accent-3)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', margin: '0 0 1rem 0', color: 'var(--accent)' }}>
            <Bot size={20} /> Explainability Engine
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            The 'Black Box' solver. All strategies listed on the left board are formulated by predicting CTR, Retention, and AVD metrics via Prophet and Random Forest trees.
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
            Audit Mode: <strong>Active</strong><br/>
            Engine V2.4 Connected via FastAPI
          </div>
        </section>
      </div>

    </div>
  );
}
