import { BarChart3, BrainCircuit, Compass, Lightbulb, PanelRight } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard/intelligence", icon: BrainCircuit, label: "Intelligence" },
  { to: "/dashboard/opportunities", icon: Compass, label: "Opportunities" },
  { to: "/dashboard/strategy", icon: Lightbulb, label: "Strategy Board" },
  { to: "/dashboard/explainability", icon: PanelRight, label: "Explainability" },
  { to: "/dashboard/metrics", icon: BarChart3, label: "Metrics" },
];

export function DashboardLayout() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass-panel h-fit p-3">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-300">Dashboard</p>
        <nav className="space-y-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="dash-link">
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="space-y-4">
        <Outlet />
      </main>
    </div>
  );
}
