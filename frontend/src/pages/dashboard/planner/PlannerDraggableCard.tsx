import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { PlannerItem } from './types';

type Props = {
  item: PlannerItem;
  compact?: boolean;
  onRemove?: (id: string) => void;
};

export function PlannerDraggableCard({ item, compact, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type: 'planner-item', item },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        padding: compact ? '6px 8px' : '8px 10px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: compact ? '0.7rem' : '0.78rem',
        lineHeight: 1.35,
        cursor: 'grab',
      }}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label="Drag"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          padding: 0,
          display: 'flex',
          flexShrink: 0,
          cursor: 'grab',
        }}
      >
        <GripVertical size={compact ? 12 : 14} />
      </button>
      <span style={{ flex: 1, minWidth: 0, color: 'var(--text-main)', wordBreak: 'break-word' }}>
        {item.title}
      </span>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
            lineHeight: 0,
          }}
        >
          <X size={compact ? 12 : 14} />
        </button>
      ) : null}
    </div>
  );
}
