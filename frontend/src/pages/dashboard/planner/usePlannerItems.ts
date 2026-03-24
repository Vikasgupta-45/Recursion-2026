import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlannerItem } from './types';

const LS_KEY = 'content-planner-items-v1';

function load(): PlannerItem[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (x): x is PlannerItem =>
        x &&
        typeof x === 'object' &&
        typeof (x as PlannerItem).id === 'string' &&
        typeof (x as PlannerItem).title === 'string' &&
        ((x as PlannerItem).date === null || typeof (x as PlannerItem).date === 'string')
    );
  } catch {
    return null;
  }
}

function save(items: PlannerItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function usePlannerItems(seed: PlannerItem[]) {
  const [items, setItems] = useState<PlannerItem[]>(() => load() ?? []);
  const appliedSeedRef = useRef(false);

  useEffect(() => {
    save(items);
  }, [items]);

  useEffect(() => {
    if (appliedSeedRef.current) return;
    if (items.length > 0) return;
    if (seed.length === 0) return;
    setItems(seed);
    appliedSeedRef.current = true;
  }, [seed, items.length]);

  const moveToDate = useCallback((id: string, date: string | null) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, date } : it)));
  }, []);

  const addItem = useCallback((title: string, date: string | null) => {
    const t = title.trim();
    if (!t) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), title: t, date }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearBoard = useCallback(() => {
    setItems([]);
    appliedSeedRef.current = true;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { items, moveToDate, addItem, removeItem, clearBoard };
}
