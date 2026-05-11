import type { RecordItem, RecordStatus } from '../types';

const BASE = '/api/mock/records';

export async function getRecords(): Promise<RecordItem[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Failed to load records: ${res.statusText}`);
  return res.json() as Promise<RecordItem[]>;
}

export async function patchRecord(
  id: string,
  updates: { status?: RecordStatus; note?: string }
): Promise<RecordItem> {
  const res = await fetch(BASE, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) throw new Error(`Failed to update record: ${res.statusText}`);
  return res.json() as Promise<RecordItem>;
}
