"use client";

import { useState } from "react";

import { useRecords } from "../hooks/useRecords";
import type { RecordItem } from "../types";
import RecordCard from "./RecordCard";
import RecordDetailDialog from "./RecordDetailDialog";
import RecordSummary from "./RecordSummary";
import { Button } from "@/components/ui/button";

/**
 * RecordList orchestrates the interview page by fetching records via
 * RecordsContext, presenting summary counts, exposing a simple filter UI, and
 * handling selection to open the detail dialog.
 */
export default function RecordList() {
  const { records, loading, error, refresh, history } = useRecords();
  const [sel, setSel] = useState<RecordItem | null>(null);
  const [fltr, setFltr] = useState<"all" | RecordItem["status"]>("all");
  const display = records;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {records.length} total • {display.length} showing
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-56">
            <label className="block text-sm font-medium mb-1">
              Filter by status
            </label>
            <select
              value={fltr}
              onChange={(e) =>
                setFltr(e.target.value as "all" | RecordItem["status"])
              }
              className="w-full border rounded-md p-2 text-sm bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">all</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="flagged">flagged</option>
              <option value="needs_revision">needs_revision</option>
            </select>
          </div>
          <Button variant="ghost" onClick={() => refresh()} disabled={loading}>
            Reload
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">Error: {error}</p>}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      )}
      <RecordSummary />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {display.map((record) => (
          <RecordCard key={record.id} record={record} onSelect={setSel} />
        ))}
      </div>
      {sel && <RecordDetailDialog record={sel} onClose={() => setSel(null)} />}
      {records.length === 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">No records found.</p>
      )}
      <div className="space-y-2 mt-4">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          History
        </h3>
        {history && history.length > 0 ? (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {history.map((entry) => (
              <li
                key={entry.entryId}
                className="text-xs border rounded-md p-2 bg-card/50"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Record {entry.id}</span>
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1">
                  {entry.previousStatus} → {entry.newStatus}
                </div>
                {entry.note && (
                  <p className="mt-1 text-muted-foreground">
                    Note: {entry.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No status changes yet.
          </p>
        )}
      </div>
    </div>
  );
}
