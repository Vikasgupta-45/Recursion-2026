import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, CalendarDays, Trash2 } from 'lucide-react';
import { PlannerDayCell } from './PlannerDayCell';
import { PlannerBacklog } from './PlannerBacklog';
import { PlannerDraggableCard } from './PlannerDraggableCard';
import type { PlannerItem } from './types';
import { BACKLOG_DROP_ID } from './types';
import {
  addMonths,
  buildMonthGrid,
  monthLabel,
  toDateKey,
} from './dateUtils';

type Props = {
  items: PlannerItem[];
  moveToDate: (id: string, date: string | null) => void;
  addItem: (title: string, date: string | null) => void;
  removeItem: (id: string) => void;
  clearBoard: () => void;
};

export function PlannerCalendarBoard({
  items,
  moveToDate,
  addItem,
  removeItem,
  clearBoard,
}: Props) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [active, setActive] = useState<PlannerItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const byDate = useMemo(() => {
    const m = new Map<string, PlannerItem[]>();
    for (const it of items) {
      if (!it.date) continue;
      const list = m.get(it.date) ?? [];
      list.push(it);
      m.set(it.date, list);
    }
    return m;
  }, [items]);

  const backlog = useMemo(() => items.filter((it) => it.date === null), [items]);

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (data?.type === 'planner-item' && data.item) {
      setActive(data.item as PlannerItem);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const id = String(a.id);
    const overId = String(over.id);

    if (overId === BACKLOG_DROP_ID) {
      moveToDate(id, null);
      return;
    }
    if (overId.startsWith('day-')) {
      const dateKey = overId.slice(4);
      moveToDate(id, dateKey);
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 260px', maxWidth: 360, width: '100%' }}>
          <PlannerBacklog
            items={backlog}
            onRemove={removeItem}
            onAdd={(title) => addItem(title, null)}
          />
        </div>

        <div
          className="glass-panel"
          style={{
            flex: '3 1 420px',
            minWidth: 280,
            width: '100%',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarDays size={20} color="var(--accent-color)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{monthLabel(cursor)}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCursor((d) => addMonths(d, -1))}
                style={navBtnStyle}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                style={{
                  ...navBtnStyle,
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCursor((d) => addMonths(d, 1))}
                style={navBtnStyle}
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                aria-label="Clear planner"
                title="Clear all items"
                onClick={() => {
                  if (items.length === 0) return;
                  if (window.confirm('Remove all planner cards?')) clearBoard();
                }}
                style={{ ...navBtnStyle, color: 'var(--text-muted)' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: 2,
            }}
          >
            {weekdays.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
            }}
          >
            {grid.map((cell, i) => {
              const key = toDateKey(cell.date);
              const dayItems = byDate.get(key) ?? [];
              return (
                <PlannerDayCell
                  key={`${key}-${i}`}
                  date={cell.date}
                  inCurrentMonth={cell.inCurrentMonth}
                  items={dayItems}
                  onRemove={removeItem}
                />
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {active ? (
          <div style={{ width: 220, opacity: 0.95 }}>
            <PlannerDraggableCard item={active} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const navBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-main)',
  cursor: 'pointer',
};
