export type PlannerItem = {
  id: string;
  title: string;
  /** YYYY-MM-DD or null = backlog */
  date: string | null;
};

export const BACKLOG_DROP_ID = 'planner-backlog';

export function dayDropId(dateKey: string): string {
  return `day-${dateKey}`;
}
