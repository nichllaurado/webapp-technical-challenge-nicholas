import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecordDetailDialog from "@/app/interview/components/RecordDetailDialog";
import { useRecords } from "@/app/interview/hooks/useRecords";
import type { RecordItem } from "@/app/interview/types";

// ── module mocks ────────────────────────────────────────────────────────────

vi.mock("@/app/interview/hooks/useRecords", () => ({
  useRecords: vi.fn(),
}));

// Replace Radix Dialog with plain wrappers so portal/animation issues don't
// interfere with jsdom queries.
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Replace Radix Select with a native <select> so fireEvent.change works
// reliably in jsdom. SelectTrigger/SelectValue are not needed in tests.
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

// ── fixtures ─────────────────────────────────────────────────────────────────

const pendingRecord: RecordItem = {
  id: "rec-1",
  name: "Specimen Alpha",
  description: "Collected from the north ridge.",
  status: "pending",
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("RecordDetailDialog", () => {
  let updateRecord: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    updateRecord = vi.fn().mockResolvedValue(undefined);
    onClose = vi.fn();
    vi.mocked(useRecords).mockReturnValue(
      ({ updateRecord } as unknown) as ReturnType<typeof useRecords>
    );
  });

  // ── (b) Validation failure prevents persistence ───────────────────────────

  describe("validation failure preventing persistence", () => {
    it("shows 'note required' hint when status is flagged with no note", () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "flagged" },
      });

      expect(
        screen.getByText("A note is required for this status.")
      ).toBeInTheDocument();
    });

    it("disables the Save button when needs_revision has no note", () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "needs_revision" },
      });

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("does not call updateRecord while note is empty for flagged", () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "flagged" },
      });

      // Button is disabled — both the disabled attribute and the doUpdate guard
      // prevent persistence.
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(updateRecord).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not call updateRecord while note is empty for needs_revision", () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "needs_revision" },
      });

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(updateRecord).not.toHaveBeenCalled();
    });

    it("clears the validation hint and enables Save once a note is entered", () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "flagged" },
      });
      expect(
        screen.getByText("A note is required for this status.")
      ).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Add a note..."), {
        target: { value: "Confirmed issue." },
      });

      expect(
        screen.queryByText("A note is required for this status.")
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
    });
  });

  // ── (a) Successful update state transition ────────────────────────────────

  describe("successful update state transition", () => {
    it("calls updateRecord with new status+note and invokes onClose", async () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "approved" },
      });
      fireEvent.change(screen.getByPlaceholderText("Add a note..."), {
        target: { value: "All checks passed." },
      });

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(updateRecord).toHaveBeenCalledWith("rec-1", {
          status: "approved",
          note: "All checks passed.",
        });
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("enables Save and completes when flagged status includes a note", async () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "flagged" },
      });
      fireEvent.change(screen.getByPlaceholderText("Add a note..."), {
        target: { value: "Suspicious markings." },
      });

      const saveBtn = screen.getByRole("button", { name: "Save" });
      expect(saveBtn).not.toBeDisabled();

      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(updateRecord).toHaveBeenCalledWith("rec-1", {
          status: "flagged",
          note: "Suspicious markings.",
        });
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("trims whitespace from note before passing to updateRecord", async () => {
      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.change(screen.getByPlaceholderText("Add a note..."), {
        target: { value: "  padded note  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(updateRecord).toHaveBeenCalledWith("rec-1", {
          status: "pending",
          note: "padded note",
        });
      });
    });

    it("shows API error message and does not close when updateRecord rejects", async () => {
      updateRecord.mockRejectedValue(new Error("Network timeout"));

      render(<RecordDetailDialog record={pendingRecord} onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByText("Network timeout")).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("pre-populates status and note from the record prop", () => {
      const existingRecord: RecordItem = {
        id: "rec-2",
        name: "Specimen Beta",
        description: "Found near the river.",
        status: "flagged",
        note: "Unusual texture.",
      };

      render(
        <RecordDetailDialog record={existingRecord} onClose={onClose} />
      );

      expect(
        (screen.getByRole("combobox") as HTMLSelectElement).value
      ).toBe("flagged");
      expect(
        (screen.getByPlaceholderText("Add a note...") as HTMLTextAreaElement)
          .value
      ).toBe("Unusual texture.");
      // Note is pre-filled so the validation hint should not appear
      expect(
        screen.queryByText("A note is required for this status.")
      ).not.toBeInTheDocument();
    });
  });
});
