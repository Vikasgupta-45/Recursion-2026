import { ContentGapAlerts } from "../../components/ContentGapAlerts";
import { dashboardMock } from "../../data/mockApi";

export function OpportunitiesPage() {
  return (
    <section className="space-y-4">
      <ContentGapAlerts gaps={dashboardMock.contentGaps} />
    </section>
  );
}
