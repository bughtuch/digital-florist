// src/lib/data/edition.ts
//
// Pure utility — no server imports, safe for client and server components.

export function getEditionDisplay(
  sold: number,
  total: number,
): { isArchived: boolean; label: string } {
  if (sold >= total) {
    return { isArchived: true, label: 'ARCHIVED' };
  }
  const next = sold + 1;
  return {
    isArchived: false,
    label: `${String(next).padStart(3, '0')} / ${total}`,
  };
}
