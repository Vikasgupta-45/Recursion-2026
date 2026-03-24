import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Inbox, Plus } from 'lucide-react';
import { PlannerDraggableCard } from './PlannerDraggableCard';
import type { PlannerItem } from './types';
import { BACKLOG_DROP_ID } from './types';

type Props = {
  items: PlannerItem[];
  onRemove: (id: string) => void;
  onAdd: (title: string) => void;
};

export function PlannerBacklog({ items, onRemove, onAdd }: Props) {
  const [draft, setDraft] = useState('');
  const { isOver, setNodeRef } = useDroppable({
    id: BACKLOG_DROP_ID,
    data: { type: 'backlog' },
  });

  const submit = () => {
    onAdd(draft);
    setDraft('');
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        minHeight: 280,
        maxHeight: 'min(70vh, 640px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Inbox size={18} color="var(--accent-secondary)" />
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Unscheduled</h2>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
        Drag onto a day to schedule. Drop here to clear the date.
      </p>

      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 10,
          borderRadius: 14,
          minHeight: 120,
          background: isOver ? 'rgba(105, 156, 255, 0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px dashed ${isOver ? 'rgba(105, 156, 255, 0.4)' : 'rgba(255,255,255,0.1)'}`,
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
      >
        {items.length === 0 ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', margin: 'auto' }}>
            Nothing in backlog
          </span>
        ) : (
          items.map((it) => <PlannerDraggableCard key={it.id} item={it} onRemove={onRemove} />)
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="New idea…"
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.25)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
          }}
        />
        <button
          type="button"
          onClick={submit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, rgba(140,95,255,0.35), rgba(0,212,255,0.25))',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </div>
  );
}
