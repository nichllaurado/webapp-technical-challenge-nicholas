"use client";

import { useState } from "react";

import { useRecords } from "../hooks/useRecords";
import type { RecordItem } from "../types";
import RecordCard from "./RecordCard";
import RecordDetailDialog from "./RecordDetailDialog";
import RecordSummary from "./RecordSummary";
import RecordFilter from "./RecordFilter";
import HistoryLog from "./HistoryLog";
import { Button } from "@/components/ui/button";

/**
 * RecordList orchestrates the interview page by fetching records via
 * RecordsContext, presenting summary counts, exposing a simple filter UI, and
 * handling selection to open the detail dialog.
 */
export default function RecordList() {
  const { records, loading, error, page, limit, totalCount, setPage } = useRecords();
  const [sel, setSel] = useState<RecordItem | null>(null);
  const [fltr, setFltr] = useState<"all" | RecordItem["status"]>("all");
  const display = fltr === "all" ? records : records.filter((r) => r.status === fltr);

  const totalPages = Math.ceil(totalCount / limit);
  const isPrevDisabled = page === 1;
  const isNextDisabled = page * limit >= totalCount;

  function handleFilterChange(value: "all" | RecordItem["status"]) {
    setFltr(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} total • {display.length} showing
          </p>
        </div>
        <div className="w-56">
          <RecordFilter value={fltr} onChange={handleFilterChange} />
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
      {display.length === 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">
          {fltr !== "all"
            ? `No ${fltr.replace("_", " ")} records on this page.`
            : "No records on this page."}
        </p>
      )}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={isPrevDisabled || loading}
        >
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={isNextDisabled || loading}
        >
          Next
        </Button>
      </div>
      {sel && <RecordDetailDialog record={sel} onClose={() => setSel(null)} />}
      <HistoryLog />
    </div>
  );
}
