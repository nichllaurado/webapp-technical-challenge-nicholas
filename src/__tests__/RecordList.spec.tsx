import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import RecordList from "@/app/interview/components/RecordList";
import { useRecords } from "@/app/interview/hooks/useRecords";
import type { RecordItem, RecordHistoryEntry } from "@/app/interview/types";

// ── module mocks ────────────────────────────────────────────────────────────

vi.mock("@/app/interview/hooks/useRecords", () => ({
  useRecords: vi.fn(),
}));

// For testing purposes, replace Radix Select with a native <select> so fireEvent.change works in
// jsdom. This applies to both RecordFilter and any other Select on the page.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

// Keep the detail dialog inert so RecordList tests stay focused on list/filter
// behavior and don't require the full dialog render tree.
vi.mock("@/app/interview/components/RecordDetailDialog", () => ({
  default: () => null,
}));

// ── test data and helpers ───────────────────────────────────────────────────
const sampleRecords: RecordItem[] = [
  { id: "1", name: "Specimen A", description: "Desc A", status: "pending" },
  { id: "2", name: "Specimen B", description: "Desc B", status: "approved" },
  {
    id: "3",
    name: "Specimen C",
    description: "Desc C",
    status: "flagged",
    note: "Needs review",
  },
];

// Helper to set up the useRecords mock with specified records and history for each test
function setupMock(
  records: RecordItem[] = sampleRecords,
  history: RecordHistoryEntry[] = []
) {
  vi.mocked(useRecords).mockReturnValue({
    records,
    loading: false,
    error: null,
    updateRecord: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    history,
    clearHistory: vi.fn(),
    page: 1,
    limit: 6,
    totalCount: records.length,
    setPage: vi.fn(),
  });
}

// ── filter behavior ───────────────────────────────────────────────────────────
describe("RecordList filter behavior", () => {
  beforeEach(() => setupMock());

  it("displays all records when filter is 'all'", () => {
    render(<RecordList />);

    expect(screen.getByText("Specimen A")).toBeInTheDocument();
    expect(screen.getByText("Specimen B")).toBeInTheDocument();
    expect(screen.getByText("Specimen C")).toBeInTheDocument();
  });

  it("shows only pending records after selecting the pending filter", () => {
    render(<RecordList />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "pending" },
    });

    expect(screen.getByText("Specimen A")).toBeInTheDocument();
    expect(screen.queryByText("Specimen B")).not.toBeInTheDocument();
    expect(screen.queryByText("Specimen C")).not.toBeInTheDocument();
  });

  it("shows only approved records after selecting the approved filter", () => {
    render(<RecordList />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "approved" },
    });

    expect(screen.queryByText("Specimen A")).not.toBeInTheDocument();
    expect(screen.getByText("Specimen B")).toBeInTheDocument();
    expect(screen.queryByText("Specimen C")).not.toBeInTheDocument();
  });

  it("shows empty-state message when no records match the active filter", () => {
    render(<RecordList />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "needs_revision" },
    });

    expect(
      screen.getByText("No needs revision records on this page.")
    ).toBeInTheDocument();
  });

  it("resets to showing all records when filter is cleared back to 'all'", () => {
    render(<RecordList />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "pending" },
    });
    expect(screen.queryByText("Specimen B")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "all" },
    });

    expect(screen.getByText("Specimen B")).toBeInTheDocument();
  });

  it("reflects updated record status in filter view after context re-renders with new records", () => {
    const { rerender } = render(<RecordList />);

    // Filter to pending — Specimen A should be visible
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "pending" },
    });
    expect(screen.getByText("Specimen A")).toBeInTheDocument();

    // Simulate updateRecord completing: Specimen A is now approved in context
    const updatedRecords: RecordItem[] = [
      { id: "1", name: "Specimen A", description: "Desc A", status: "approved" },
      { id: "2", name: "Specimen B", description: "Desc B", status: "approved" },
      { id: "3", name: "Specimen C", description: "Desc C", status: "flagged", note: "Needs review" },
    ];
    setupMock(updatedRecords);
    rerender(<RecordList />);

    // The pending filter is still active but Specimen A is no longer pending
    expect(screen.queryByText("Specimen A")).not.toBeInTheDocument();
    expect(
      screen.getByText("No pending records on this page.")
    ).toBeInTheDocument();
  });
});

// ── summary reflects record counts ───────────────────────────────────────────

describe("RecordList summary counts reflect current records", () => {
  it("renders correct status counts from the context", () => {
    setupMock(sampleRecords);
    render(<RecordList />);

    // RecordSummary derives counts via useRecordStatusCounts → useRecords
    expect(screen.getByLabelText("pending count")).toHaveTextContent("1");
    expect(screen.getByLabelText("approved count")).toHaveTextContent("1");
    expect(screen.getByLabelText("flagged count")).toHaveTextContent("1");
    expect(screen.getByLabelText("needs_revision count")).toHaveTextContent("0");
  });

  it("updates summary counts when context re-renders with changed records", () => {
    setupMock(sampleRecords);
    const { rerender } = render(<RecordList />);

    expect(screen.getByLabelText("pending count")).toHaveTextContent("1");
    expect(screen.getByLabelText("approved count")).toHaveTextContent("1");

    // Specimen A transitions pending → approved
    const updatedRecords: RecordItem[] = [
      { id: "1", name: "Specimen A", description: "Desc A", status: "approved" },
      { id: "2", name: "Specimen B", description: "Desc B", status: "approved" },
      { id: "3", name: "Specimen C", description: "Desc C", status: "flagged" },
    ];
    setupMock(updatedRecords);
    rerender(<RecordList />);

    expect(screen.getByLabelText("pending count")).toHaveTextContent("0");
    expect(screen.getByLabelText("approved count")).toHaveTextContent("2");
  });
});

// ── history log reflects status changes ──────────────────────────────────────

describe("RecordList history log reflects status changes", () => {
  it("shows 'No status changes yet' when history is empty", () => {
    setupMock(sampleRecords, []);
    render(<RecordList />);

    expect(screen.getByText("No status changes yet.")).toBeInTheDocument();
  });

  it("renders a history entry after a status change", () => {
    const history: RecordHistoryEntry[] = [
      {
        entryId: "e-1",
        id: "1",
        previousStatus: "pending",
        newStatus: "approved",
        note: "Cleared.",
        timestamp: new Date("2026-01-01T10:00:00Z").toISOString(),
      },
    ];
    setupMock(sampleRecords, history);
    render(<RecordList />);

    expect(screen.getByText("Record 1")).toBeInTheDocument();
    expect(screen.getByText("pending → approved")).toBeInTheDocument();
    expect(screen.getByText("Note: Cleared.")).toBeInTheDocument();
  });

  it("renders entries in reverse chronological order (newest first)", () => {
    const history: RecordHistoryEntry[] = [
      {
        entryId: "e-1",
        id: "1",
        previousStatus: "pending",
        newStatus: "approved",
        timestamp: new Date("2026-01-01T09:00:00Z").toISOString(),
      },
      {
        entryId: "e-2",
        id: "2",
        previousStatus: "pending",
        newStatus: "flagged",
        note: "Flagged for QA.",
        timestamp: new Date("2026-01-01T10:00:00Z").toISOString(),
      },
    ];
    setupMock(sampleRecords, history);
    render(<RecordList />);

    const listItems = screen.getAllByRole("listitem");
    // e-2 is newer so it must appear as the first list item (reversed)
    expect(listItems[0]).toHaveTextContent("pending → flagged");
    expect(listItems[1]).toHaveTextContent("pending → approved");
  });

  it("omits the note line when no note is attached to a history entry", () => {
    const history: RecordHistoryEntry[] = [
      {
        entryId: "e-1",
        id: "1",
        previousStatus: "pending",
        newStatus: "approved",
        timestamp: new Date("2026-01-01T10:00:00Z").toISOString(),
      },
    ];
    setupMock(sampleRecords, history);
    render(<RecordList />);

    expect(screen.getByText("pending → approved")).toBeInTheDocument();
    // Scope to the history <ul> so RecordCard note text doesn't cause a false positive
    const historyList = screen.getByRole("list");
    expect(within(historyList).queryByText(/^Note:/)).not.toBeInTheDocument();
  });
});
