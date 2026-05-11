"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import type { RecordItem, RecordStatus } from "../types";
import { useRecords } from "../hooks/useRecords";

interface RecordDetailDialogProps {
  record: RecordItem;
  onClose: () => void;
}

/**
 * RecordDetailDialog allows reviewers to inspect a specimen’s details and
 * update its status and accompanying note in a focused modal flow. Review
 * actions are performed via the Status dropdown, while the note captures
 * rationale or extra context for the change.
 */
export default function RecordDetailDialog({
  record,
  onClose,
}: RecordDetailDialogProps) {
  const { updateRecord } = useRecords();

  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [note, setNote] = useState<string>(record.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const noteRequired =
    status === "flagged" || status === "needs_revision";

  const noteMissing =
    noteRequired && note.trim().length === 0;

  async function doUpdate() {
    const trimmedNote = note.trim();
    // Enforce that flagged or needs_revision statuses must have a non-empty note.
    if (
      (status === "flagged" || status === "needs_revision") &&
      trimmedNote.length === 0
    ) {
      setSaveError("A reviewer note is required for Flagged or Needs Revision.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await updateRecord(record.id, { status, note: trimmedNote });
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const statusOptions: RecordStatus[] = [
    "pending",
    "approved",
    "flagged",
    "needs_revision",
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg tracking-tight">
            {record.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {record.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as RecordStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reviewer note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="min-h-24"
            />
            {noteMissing && (
              <p className="mt-1 text-xs text-destructive">
                A note is required for this status.
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Notes help other reviewers understand decisions.
            </p>
          </div>
        </div>
        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}
        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={() => onClose()}>
            Close
          </Button>
          <Button variant="default" onClick={doUpdate} disabled={saving || noteMissing}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
