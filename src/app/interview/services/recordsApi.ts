import type { RecordItem, RecordStatus } from '../types';

const BASE = '/api/mock/records';

export async function getRecords(
  page: number,
  limit: number
): Promise<{ records: RecordItem[]; totalCount: number }> {
  const res = await fetch(`${BASE}?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load records: ${res.statusText}`);
  return res.json() as Promise<{ records: RecordItem[]; totalCount: number }>;
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
