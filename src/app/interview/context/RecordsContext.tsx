'use client';

/*
 * RecordsContext is the single source of truth for all record data in this
 * interview exercise. It delegates HTTP calls to the recordsApi service layer,
 * exposes mutation functions for updating records, and maintains a simple
 * history log of status changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RecordItem, RecordStatus, RecordHistoryEntry } from '../types';
import { getRecords, patchRecord } from '../services/recordsApi';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  /** Set only for load failures; mutation errors are thrown to the call-site. */
  error: string | null;
  /**
   * Update a record's status and/or note via the mock API, then sync local
   * state. Throws on failure so call-sites can show inline feedback.
   */
  updateRecord: (id: string, updates: { status?: RecordStatus; note?: string }) => Promise<void>;
  /** Refresh the list of records from the API. */
  refresh: () => Promise<void>;
  /** A log of status changes performed during this session. */
  history: RecordHistoryEntry[];
  /** Clears the in-memory history log. */
  clearHistory: () => void;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecordHistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await getRecords());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateRecord = useCallback(
    async (id: string, updates: { status?: RecordStatus; note?: string }) => {
      const prev = records.find((r) => r.id === id);
      const updated = await patchRecord(id, updates); // throws on failure — caller handles display
      setRecords((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      if (prev && updates.status && prev.status !== updated.status) {
        setHistory((h) => [
          ...h,
          {
            entryId: crypto.randomUUID(),
            id,
            previousStatus: prev.status,
            newStatus: updates.status as RecordStatus,
            note: updates.note,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [records]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <RecordsContext.Provider
      value={{ records, loading, error, updateRecord, refresh, history, clearHistory }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within a RecordsProvider');
  return ctx;
}
