import { useMemo } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { PlannerCalendarBoard } from './planner/PlannerCalendarBoard';
import { usePlannerItems } from './planner/usePlannerItems';
import { itemsFromContentCalendar } from './planner/seedFromAnalysis';

const ContentPlanner = () => {
  const { analysis, loading } = useAnalysis();

  const seed = useMemo(() => {
    const cal = analysis?.content_calendar as Record<string, unknown> | undefined;
    return itemsFromContentCalendar(cal);
  }, [analysis?.content_calendar]);

  const { items, moveToDate, addItem, removeItem, clearBoard } = usePlannerItems(seed);

  if (loading && !analysis) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 10, background: 'rgba(246,173,85,0.12)', borderRadius: 12 }}><Calendar size={24} color="#f6ad55" /></div>
        <div>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Content Planner</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Drag cards between the backlog and calendar days. Your board saves in this browser.
            {analysis?.content_calendar && seed.length > 0 ? ' Suggestions from your last analysis load when the board is empty.' : null}
          </p>
        </div>
      </header>

      {!analysis ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Run channel analysis to import a starter calendar; you can still add ideas manually.
        </p>
      ) : null}

      <PlannerCalendarBoard
        items={items}
        moveToDate={moveToDate}
        addItem={addItem}
        removeItem={removeItem}
        clearBoard={clearBoard}
      />
    </div>
  );
};

export default ContentPlanner;
