import { NavLink } from "react-router-dom";

export function DashboardNavbar() {
  return (
    <nav className="dashboard-nav">
      <NavLink to="/dashboard/account">Account</NavLink>
      <NavLink to="/dashboard/analytics">Analytics</NavLink>
      <NavLink to="/dashboard/strategies">Strategies</NavLink>
      <NavLink to="/dashboard/discover">Discover</NavLink>
    </nav>
  );
}
