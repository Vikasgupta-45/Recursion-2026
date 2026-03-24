export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

/** 6×7 grid: leading/trailing days from adjacent months, `inCurrentMonth` flags the active month. */
export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const pad = first.getDay();
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  const prevDim = new Date(year, monthIndex, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = pad - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, monthIndex - 1, prevDim - i),
      inCurrentMonth: false,
    });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({
      date: new Date(year, monthIndex, d),
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, monthIndex + 1, nextDay++),
      inCurrentMonth: false,
    });
  }
  while (cells.length < 42) {
    cells.push({
      date: new Date(year, monthIndex + 1, nextDay++),
      inCurrentMonth: false,
    });
  }
  return cells;
}

export function startOfToday(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
