import { useDroppable } from '@dnd-kit/core';
import { PlannerDraggableCard } from './PlannerDraggableCard';
import type { PlannerItem } from './types';
import { dayDropId } from './types';
import { isSameDay, startOfToday, toDateKey } from './dateUtils';

const MAX_VISIBLE = 3;

type Props = {
  date: Date;
  inCurrentMonth: boolean;
  items: PlannerItem[];
  onRemove: (id: string) => void;
};

export function PlannerDayCell({ date, inCurrentMonth, items, onRemove }: Props) {
  const key = toDateKey(date);
  const { isOver, setNodeRef } = useDroppable({
    id: dayDropId(key),
    data: { type: 'day', dateKey: key },
  });

  const today = startOfToday();
  const isToday = isSameDay(date, today);

  const visible = items.slice(0, MAX_VISIBLE);
  const extra = items.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 108,
        padding: 6,
        borderRadius: 12,
        background: isOver
          ? 'rgba(204, 151, 255, 0.12)'
          : inCurrentMonth
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(255,255,255,0.01)',
        border: isToday
          ? '1px solid rgba(204, 151, 255, 0.45)'
          : `1px solid ${isOver ? 'rgba(204, 151, 255, 0.25)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: isToday ? 700 : 500,
          color: inCurrentMonth ? (isToday ? 'var(--accent-color)' : 'var(--text-dim)') : 'var(--text-muted)',
          opacity: inCurrentMonth ? 1 : 0.55,
          textAlign: 'right',
        }}
      >
        {date.getDate()}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
        {visible.map((it) => (
          <PlannerDraggableCard key={it.id} item={it} compact onRemove={onRemove} />
        ))}
        {extra > 0 ? (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: 2 }}>+{extra} more</div>
        ) : null}
      </div>
    </div>
  );
}
