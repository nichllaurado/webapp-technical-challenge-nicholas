import { useRecords } from "./useRecords";
import type { RecordStatus } from "../types";

const STATUSES: RecordStatus[] = ["pending", "approved", "flagged", "needs_revision"];

export function useRecordStatusCounts(): Record<RecordStatus, number> {
  const { records } = useRecords();
  const base = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<RecordStatus, number>;
  return records.reduce((acc, r) => { acc[r.status]++; return acc; }, base);
}
