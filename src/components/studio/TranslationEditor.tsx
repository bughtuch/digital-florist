// src/components/studio/TranslationEditor.tsx

'use client';

import { useState } from 'react';

type TranslationRow = {
  locale: string;
  translated_title: string | null;
  translated_house_line: string | null;
  translated_material_note: string | null;
};

interface TranslationEditorProps {
  bloomId: string;
  translations: TranslationRow[];
}

const LOCALES: { code: string; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ar', label: 'AR', name: 'Arabic' },
  { code: 'it', label: 'IT', name: 'Italian' },
  { code: 'ko', label: 'KO', name: 'Korean' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
];

function getTranslation(
  translations: TranslationRow[],
  locale: string,
): TranslationRow {
  return (
    translations.find((t) => t.locale === locale) ?? {
      locale,
      translated_title: null,
      translated_house_line: null,
      translated_material_note: null,
    }
  );
}

function isComplete(t: TranslationRow): boolean {
  return !!t.translated_title && t.translated_title.trim().length > 0;
}

export default function TranslationEditor({
  bloomId,
  translations: initialTranslations,
}: TranslationEditorProps) {
  const [translations, setTranslations] =
    useState<TranslationRow[]>(initialTranslations);
  const [openLocale, setOpenLocale] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successes, setSuccesses] = useState<Record<string, boolean>>({});

  // Local draft state per locale
  const [drafts, setDrafts] = useState<Record<string, TranslationRow>>({});

  function getDraft(locale: string): TranslationRow {
    return drafts[locale] ?? getTranslation(translations, locale);
  }

  function setDraft(locale: string, update: Partial<TranslationRow>) {
    setDrafts((prev) => ({
      ...prev,
      [locale]: { ...getDraft(locale), ...update },
    }));
  }

  async function saveLocale(locale: string) {
    setSaving(locale);
    setErrors((prev) => ({ ...prev, [locale]: '' }));
    setSuccesses((prev) => ({ ...prev, [locale]: false }));

    const draft = getDraft(locale);

    try {
      const res = await fetch(
        `/api/studio/blooms/${bloomId}/translations`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            translated_title: draft.translated_title,
            translated_house_line: draft.translated_house_line,
            translated_material_note: draft.translated_material_note,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }

      // Update local translations state
      setTranslations((prev) => {
        const existing = prev.findIndex((t) => t.locale === locale);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], ...draft };
          return next;
        }
        return [...prev, draft];
      });

      setSuccesses((prev) => ({ ...prev, [locale]: true }));
      setTimeout(
        () => setSuccesses((prev) => ({ ...prev, [locale]: false })),
        2000,
      );
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        [locale]: err instanceof Error ? err.message : 'Save failed.',
      }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-0">
      {LOCALES.map(({ code, label, name }) => {
        const translation = getTranslation(translations, code);
        const complete = isComplete(translation);
        const isOpen = openLocale === code;
        const isEnglish = code === 'en';
        const draft = getDraft(code);

        return (
          <div key={code} className="border-b border-df-border">
            {/* Row header */}
            <button
              onClick={() =>
                setOpenLocale(isOpen ? null : code)
              }
              className="w-full flex items-center gap-4 py-3 text-left hover:bg-df-surface transition-colors duration-150 px-0"
            >
              <span className="text-[9px] tracking-[0.22em] text-df-faint uppercase w-8">
                {label}
              </span>
              <span className="text-[11px] text-df-muted flex-1">{name}</span>
              <span
                className={`text-[11px] mr-2 ${
                  isEnglish
                    ? 'text-df-faint'
                    : complete
                      ? 'text-df-muted'
                      : 'text-df-faint'
                }`}
              >
                {isEnglish ? '—' : complete ? '✓' : '—'}
              </span>
              <span className="text-[9px] tracking-[0.1em] text-df-faint uppercase">
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded form */}
            {isOpen && (
              <div className="pb-6 pt-2">
                {isEnglish ? (
                  <p className="text-[11px] tracking-[0.06em] text-df-faint leading-relaxed">
                    English content is managed in the main form above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] tracking-[0.22em] text-df-faint uppercase mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        value={draft.translated_title ?? ''}
                        onChange={(e) =>
                          setDraft(code, {
                            translated_title: e.target.value || null,
                          })
                        }
                        className="w-full bg-df-surface border border-df-border px-3 py-2 text-[13px] text-df-text placeholder:text-df-faint focus:outline-none focus:border-df-muted rounded-none"
                        placeholder={`Title in ${name}…`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.22em] text-df-faint uppercase mb-1.5">
                        House Line
                      </label>
                      <input
                        type="text"
                        value={draft.translated_house_line ?? ''}
                        onChange={(e) =>
                          setDraft(code, {
                            translated_house_line: e.target.value || null,
                          })
                        }
                        className="w-full bg-df-surface border border-df-border px-3 py-2 text-[13px] text-df-text placeholder:text-df-faint focus:outline-none focus:border-df-muted rounded-none"
                        placeholder={`House line in ${name}…`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.22em] text-df-faint uppercase mb-1.5">
                        Material Note
                      </label>
                      <textarea
                        value={draft.translated_material_note ?? ''}
                        onChange={(e) =>
                          setDraft(code, {
                            translated_material_note: e.target.value || null,
                          })
                        }
                        rows={3}
                        className="w-full bg-df-surface border border-df-border px-3 py-2 text-[13px] text-df-text placeholder:text-df-faint focus:outline-none focus:border-df-muted rounded-none resize-none"
                        placeholder={`Material note in ${name}…`}
                      />
                    </div>

                    {errors[code] && (
                      <p className="text-[11px] tracking-[0.06em] text-df-muted">
                        {errors[code]}
                      </p>
                    )}

                    {successes[code] && (
                      <p className="text-[11px] tracking-[0.06em] text-df-muted">
                        Saved.
                      </p>
                    )}

                    <button
                      onClick={() => saveLocale(code)}
                      disabled={saving === code}
                      className="border border-df-text px-5 py-2 text-[9px] tracking-[0.18em] text-df-text uppercase hover:bg-df-text hover:text-df-black transition-all duration-300 disabled:opacity-40"
                    >
                      {saving === code ? 'Saving…' : `Save ${label}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
