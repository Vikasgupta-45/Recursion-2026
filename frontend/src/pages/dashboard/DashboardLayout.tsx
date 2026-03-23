import { Outlet } from "react-router-dom";
import { DashboardNavbar } from "../../components/DashboardNavbar";

export function DashboardLayout() {
  return (
    <section className="dashboard-wrap">
      <DashboardNavbar />
      <div className="dashboard-content">
        <Outlet />
      </div>
    </section>
  );
}
