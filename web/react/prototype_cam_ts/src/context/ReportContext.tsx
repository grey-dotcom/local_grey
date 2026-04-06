'use client';

// ============================================================
// ReportContext — Flutter ReportProvider 대응
// ============================================================

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ReportEntry } from '@/lib/types';

interface ReportCtx {
  entries: ReportEntry[];
  hasEntries: boolean;
  add: (entry: ReportEntry) => void;
  update: (entry: ReportEntry) => void;
  remove: (id: string) => void;
}

const Ctx = createContext<ReportCtx | null>(null);

export function useReportContext(): ReportCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReportContext must be used within ReportProvider');
  return ctx;
}

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ReportEntry[]>([]);

  const add = useCallback((entry: ReportEntry) => {
    setEntries(prev => [...prev, entry]);
  }, []);

  const update = useCallback((updated: ReportEntry) => {
    setEntries(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ entries, hasEntries: entries.length > 0, add, update, remove }}>
      {children}
    </Ctx.Provider>
  );
}
