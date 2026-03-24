import type { PlannerItem } from './types';
import { parseDateKey, toDateKey } from './dateUtils';

type RawDay = Record<string, unknown>;

function normalizeApiDate(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const iso = raw.slice(0, 10);
  return parseDateKey(iso) ? iso : null;
}

/** One card per API calendar day; date from API or inferred from start + day_index. */
export function itemsFromContentCalendar(cal: Record<string, unknown> | undefined): PlannerItem[] {
  if (!cal) return [];
  const days = cal.days as RawDay[] | undefined;
  if (!Array.isArray(days) || days.length === 0) return [];

  const startRaw = cal.start_date;
  let start: Date | null = null;
  if (typeof startRaw === 'string' && startRaw.trim()) {
    start = parseDateKey(startRaw.slice(0, 10));
  }

  return days.map((d, i) => {
    const fromApi = normalizeApiDate(d.date);
    let dateKey: string | null = fromApi;
    if (!dateKey && start) {
      const idx = Number(d.day_index);
      const n = Number.isFinite(idx) ? idx - 1 : i;
      const t = new Date(start.getTime() + n * 86400000);
      dateKey = toDateKey(t);
    }
    const title = String(d.title_hint ?? '').trim() || `Idea ${i + 1}`;
    return {
      id: `import-${dateKey ?? 'x'}-${i}-${title.slice(0, 12)}`,
      title,
      date: dateKey,
    };
  });
}
