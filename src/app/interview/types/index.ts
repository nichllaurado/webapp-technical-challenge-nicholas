/**
 * Definition of a record in the interview exercise. The records represent
 * specimens or observations collected from the field. The `status` field
 * reflects the current review state; `note` holds any reviewer notes.
 */
export type RecordStatus = 'pending' | 'approved' | 'flagged' | 'needs_revision';

export interface RecordItem {
  id: string;
  name: string;
  status: RecordStatus;
  description: string;
  note?: string;
}

/**
 * History entries are recorded whenever a record’s status changes. Each
 * entry captures the record id, the previous and new status values, an
 * optional note supplied by the reviewer, and the ISO timestamp of the
 * change. The `RecordsContext` exposes a history array of these
 * entries.
 */
export interface RecordHistoryEntry {
  /** Unique identifier for this history entry (not the record id) */
  entryId: string;
  /** Identifier of the record whose status changed */
  id: string;
  /** The status before the update */
  previousStatus: RecordStatus;
  /** The status after the update */
  newStatus: RecordStatus;
  /** Optional note attached to the update */
  note?: string;
  /** ISO timestamp when the update occurred */
  timestamp: string;
}