import { Button } from "@/components/ui/button";
import type { RecordHistoryEntry } from "../types";

interface HistoryLogViewProps {
  history: RecordHistoryEntry[];
  onClear: () => void;
}

export function HistoryLogView({ history, onClear }: HistoryLogViewProps) {
  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">History</h3>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm">No status changes yet.</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {[...history].reverse().map((entry) => (
            <li key={entry.entryId} className="text-sm border rounded-md p-2 bg-card">
              <div className="flex justify-between items-center">
                <span className="font-medium">Record {entry.id}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xs">
                  {entry.previousStatus} → {entry.newStatus}
                </span>
              </div>
              {entry.note && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: {entry.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
