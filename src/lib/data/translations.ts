// src/lib/data/translations.ts
//
// Helpers for applying locale-specific translations to Bloom data.
// Field-level fallback: missing translation fields fall back to canonical English.
// Never affects archive codes, edition values, or city codes.

import type { BloomWithRelations, DbBloomTranslation } from '@/types';

export type LocalizedBloom = {
  title: string;
  house_line: string | null;
  material_note: string | null;
};

// Apply a translation record to a bloom, falling back field-by-field to English.
export function localizeBloom(
  bloom: BloomWithRelations,
  translation: DbBloomTranslation | null | undefined,
): LocalizedBloom {
  return {
    title: translation?.translated_title?.trim() || bloom.title,
    house_line: translation?.translated_house_line?.trim() || bloom.house_line,
    material_note: translation?.translated_material_note?.trim() || bloom.material_note,
  };
}
