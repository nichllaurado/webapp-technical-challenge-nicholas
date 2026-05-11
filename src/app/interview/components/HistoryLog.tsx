"use client";

import { useRecords } from "../hooks/useRecords";
import { HistoryLogView } from "./HistoryLogView";

export default function HistoryLog() {
  const { history, clearHistory } = useRecords();
  return <HistoryLogView history={history} onClear={clearHistory} />;
}
