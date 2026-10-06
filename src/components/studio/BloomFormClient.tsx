// src/components/studio/BloomFormClient.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { BloomWithRelations, DbCity, DbCollection, BloomStatus } from '@/types';
import { SUPPORTED_CURRENCIES, parseInputToMinor, formatPriceStudio, CITY_DEFAULT_CURRENCY } from '@/lib/currency';
import TranslationEditor from '@/components/studio/TranslationEditor';
import MediaUploadSection from '@/components/studio/MediaUploadSection';
import PublishDialog from '@/components/studio/PublishDialog';
import ArchiveDialog from '@/components/studio/ArchiveDialog';

type Translation = {
  locale: string;
  translated_title: string | null;
  translated_house_line: string | null;
  translated_material_note: string | null;
};

type BloomFormClientProps = {
  mode: 'new' | 'edit';
  bloom?: BloomWithRelations & {
    status: BloomStatus;
    published_at: string | null;
    edition_sold: number;
  };
  cities: DbCity[];
  collections: DbCollection[];
  translations?: Translation[];
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const currentYear = new Date().getFullYear();

const SECTION_HEADING =
  'text-[10px] tracking-[0.22em] text-df-faint uppercase border-b border-df-border pb-2 mb-5';
const LABEL =
  'block text-[9px] tracking-[0.22em] text-df-faint uppercase mb-1.5';
const INPUT =
  'w-full bg-df-surface border border-df-border px-3 py-2 text-[13px] text-df-text placeholder:text-df-faint focus:outline-none focus:border-df-muted rounded-none transition-colors duration-200';
const LOCKED_FIELD =
  'w-full bg-df-black border border-df-border px-3 py-2 text-[13px] text-df-faint select-none';
const BTN_PRIMARY =
  'border border-df-text px-5 py-2 text-[10px] tracking-[0.18em] text-df-text uppercase hover:bg-df-text hover:text-df-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-df-text';
const BTN_SECONDARY =
  'border border-df-border px-5 py-2 text-[10px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text hover:border-df-text transition-all duration-300 disabled:opacity-40';

export default function BloomFormClient({
  mode,
  bloom,
  cities,
  collections,
  translations = [],
}: BloomFormClientProps) {
  const router = useRouter();

  const isLocked =
    mode === 'edit' && bloom?.published_at !== null && bloom?.published_at !== undefined;

  // Form state
  const [title, setTitle] = useState(bloom?.title ?? '');
  const [houseLine, setHouseLine] = useState(bloom?.house_line ?? '');
  const [slug, setSlug] = useState(bloom?.slug ?? '');
  const [slugManual, setSlugManual] = useState(mode === 'edit');
  const [cityId, setCityId] = useState(bloom?.city_id ?? '');
  const [collectionId, setCollectionId] = useState(bloom?.collection_id ?? '');
  const [archiveCode, setArchiveCode] = useState(bloom?.archive_code ?? '');
  const [editionTotal, setEditionTotal] = useState(bloom?.edition_total ?? 250);
  const [materialNote, setMaterialNote] = useState(bloom?.material_note ?? '');
  const [year, setYear] = useState(bloom?.year ?? currentYear);
  const [displayOrder, setDisplayOrder] = useState(bloom?.display_order ?? 0);
  const [featured, setFeatured] = useState(bloom?.featured ?? false);
  const [currency, setCurrency] = useState(bloom?.currency ?? '');
  // Display value for price input — decimal string (e.g. "50" for £50, "19800" for ¥19,800)
  const [priceInput, setPriceInput] = useState(() => {
    if (!bloom?.price_minor || !bloom?.currency) return '';
    const decimals = bloom.currency === 'JPY' || bloom.currency === 'KRW' ? 0 : 2;
    return decimals === 0
      ? String(bloom.price_minor)
      : (bloom.price_minor / Math.pow(10, decimals)).toFixed(decimals);
  });

  // Media state
  const [stillUrl, setStillUrl] = useState(bloom?.still_asset_url ?? null);
  const [motionUrl, setMotionUrl] = useState(bloom?.motion_asset_url ?? null);
  const [sourceUrl, setSourceUrl] = useState(bloom?.source_asset_url ?? null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [slugEditMode, setSlugEditMode] = useState(false);
  const [archiveSuggestion, setArchiveSuggestion] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Auto-slug from title in new mode
  useEffect(() => {
    if (mode === 'new' && !slugManual) {
      setSlug(slugify(title));
    }
  }, [title, mode, slugManual]);

  // Auto-suggest archive code when city changes in new mode
  const fetchArchiveSuggestion = useCallback(async (cityCode: string) => {
    if (!cityCode || mode !== 'new') return;
    try {
      const res = await fetch(
        `/api/studio/archive-code?city_code=${encodeURIComponent(cityCode)}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.suggested) {
          setArchiveSuggestion(data.suggested);
          if (!archiveCode) setArchiveCode(data.suggested);
        }
      }
    } catch {
      // silent
    }
  }, [mode, archiveCode]);

  useEffect(() => {
    if (mode === 'new' && cityId) {
      const city = cities.find((c) => c.id === cityId);
      if (city) {
        fetchArchiveSuggestion(city.code);
        // Suggest city default currency if not yet set
        const defaultCurrency = CITY_DEFAULT_CURRENCY[city.code];
        if (defaultCurrency && !currency) setCurrency(defaultCurrency);
      }
    }
  }, [cityId, cities, mode, fetchArchiveSuggestion, currency]);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const priceMinor = parseInputToMinor(priceInput, currency);

    const payload = {
      title: title.trim(),
      house_line: houseLine.trim() || null,
      slug: slug.trim(),
      city_id: cityId,
      collection_id: collectionId,
      archive_code: archiveCode.trim(),
      edition_total: Number(editionTotal),
      material_note: materialNote.trim() || null,
      year: Number(year),
      display_order: Number(displayOrder),
      featured,
      price_minor: priceMinor,
      currency: currency.toUpperCase(),
      still_asset_url: stillUrl,
      motion_asset_url: motionUrl,
      source_asset_url: sourceUrl,
    };

    try {
      if (mode === 'new') {
        const res = await fetch('/api/studio/blooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Create failed');
        }
        const data = await res.json();
        router.push(`/studio/blooms/${data.id}`);
      } else {
        const res = await fetch(`/api/studio/blooms/${bloom!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Update failed');
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/studio/blooms/${bloom!.id}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Publish failed');
      }
      setShowPublishDialog(false);
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Publish failed.');
      setPublishLoading(false);
    }
  }

  async function handleArchive() {
    setArchiveLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/studio/blooms/${bloom!.id}/archive`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Archive failed');
      }
      setShowArchiveDialog(false);
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Archive failed.');
      setArchiveLoading(false);
    }
  }

  const cityForPublish = bloom?.city as DbCity | undefined;

  return (
    <div className="max-w-3xl">
      {/* Status banner (edit mode) */}
      {mode === 'edit' && bloom && (
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-df-border">
          <span className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
            Status
          </span>
          <span
            className={`text-[9px] tracking-[0.18em] uppercase ${
              bloom.status === 'available'
                ? 'text-df-muted'
                : bloom.status === 'archived'
                  ? 'text-df-faint line-through'
                  : 'text-df-faint'
            }`}
          >
            {bloom.status}
          </span>
          {bloom.published_at && (
            <>
              <span className="text-df-faint text-[9px]">·</span>
              <span className="text-[9px] tracking-[0.1em] text-df-faint">
                Published{' '}
                {new Date(bloom.published_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </>
          )}
        </div>
      )}

      {/* ── SECTION 1: IDENTITY ── */}
      <section className="mb-10">
        <div className={SECTION_HEADING}>
          Identity
          {isLocked && (
            <span className="ml-3 text-[9px] tracking-[0.18em] text-df-faint">
              · Locked after publish
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {/* Slug */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-1.5">
              <label className={LABEL.replace('mb-1.5', '')} htmlFor="slug">
                Slug
              </label>
              {isLocked && (
                <span className="text-[9px] tracking-[0.16em] text-df-faint uppercase">
                  Locked ·
                </span>
              )}
              {!isLocked && mode === 'new' && (
                <button
                  type="button"
                  onClick={() => setSlugEditMode(!slugEditMode)}
                  className="text-[9px] tracking-[0.12em] text-df-faint uppercase hover:text-df-muted transition-colors"
                >
                  {slugEditMode ? 'Auto' : 'Edit'}
                </button>
              )}
            </div>
            {isLocked ? (
              <div className={LOCKED_FIELD}>{slug}</div>
            ) : (
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  if (mode === 'new') setSlugManual(true);
                }}
                readOnly={mode === 'new' && !slugEditMode}
                className={`${INPUT} ${mode === 'new' && !slugEditMode ? 'text-df-faint cursor-default' : ''}`}
                placeholder="bloom-slug"
              />
            )}
          </div>

          {/* City */}
          <div>
            <label className={LABEL} htmlFor="city">
              City
              {isLocked && (
                <span className="ml-2 text-df-faint">· Locked</span>
              )}
            </label>
            {isLocked ? (
              <div className={LOCKED_FIELD}>
                {cityForPublish?.name ?? cityId}
              </div>
            ) : (
              <select
                id="city"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className={INPUT}
              >
                <option value="">— Select city —</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Archive code */}
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <label className={LABEL.replace('mb-1.5', '')} htmlFor="archive_code">
                Archive Code
              </label>
              {isLocked && (
                <span className="text-[9px] tracking-[0.16em] text-df-faint uppercase">
                  Locked ·
                </span>
              )}
            </div>
            {archiveSuggestion && mode === 'new' && !isLocked && (
              <p className="text-[9px] tracking-[0.08em] text-df-faint mb-1">
                Suggested:{' '}
                <button
                  type="button"
                  onClick={() => setArchiveCode(archiveSuggestion)}
                  className="underline hover:text-df-muted transition-colors"
                >
                  {archiveSuggestion}
                </button>
              </p>
            )}
            {isLocked ? (
              <div className={LOCKED_FIELD}>{archiveCode}</div>
            ) : (
              <input
                id="archive_code"
                type="text"
                value={archiveCode}
                onChange={(e) => setArchiveCode(e.target.value)}
                className={INPUT}
                placeholder="LON / 001"
              />
            )}
          </div>

          {/* Edition total */}
          <div>
            <label className={LABEL} htmlFor="edition_total">
              Edition Total
              {isLocked && (
                <span className="ml-2 text-df-faint">· Locked</span>
              )}
            </label>
            {isLocked ? (
              <div className={LOCKED_FIELD}>{editionTotal}</div>
            ) : (
              <input
                id="edition_total"
                type="number"
                min={1}
                value={editionTotal}
                onChange={(e) => setEditionTotal(Number(e.target.value))}
                className={INPUT}
              />
            )}
          </div>

          {/* Year */}
          <div>
            <label className={LABEL} htmlFor="year">
              Year
              {isLocked && (
                <span className="ml-2 text-df-faint">· Locked</span>
              )}
            </label>
            {isLocked ? (
              <div className={LOCKED_FIELD}>{year}</div>
            ) : (
              <input
                id="year"
                type="number"
                min={2020}
                max={2099}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={INPUT}
              />
            )}
          </div>

          {/* Currency */}
          <div>
            <label className={LABEL} htmlFor="currency">
              Currency
              {isLocked && (
                <span className="ml-2 text-df-faint">· Locked</span>
              )}
            </label>
            {isLocked ? (
              <div className={LOCKED_FIELD}>{currency}</div>
            ) : (
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={INPUT}
              >
                <option value="">— Select currency —</option>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* Price */}
          <div>
            <label className={LABEL} htmlFor="price">
              Price
              {isLocked && (
                <span className="ml-2 text-df-faint">· Locked</span>
              )}
            </label>
            {isLocked ? (
              <div className={LOCKED_FIELD}>
                {bloom?.price_minor && bloom?.currency
                  ? formatPriceStudio(bloom.price_minor, bloom.currency)
                  : '—'}
              </div>
            ) : (
              <div className="relative">
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className={INPUT}
                  placeholder={currency === 'JPY' || currency === 'KRW' ? '19800' : '50.00'}
                />
                {currency && priceInput && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-df-faint">
                    {currency}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: EDITORIAL ── */}
      <section className="mb-10">
        <div className={SECTION_HEADING}>Editorial</div>
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className={LABEL} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT}
              placeholder="Bloom title"
            />
          </div>

          {/* House line */}
          <div>
            <label className={LABEL} htmlFor="house_line">
              House Line
            </label>
            <input
              id="house_line"
              type="text"
              value={houseLine}
              onChange={(e) => setHouseLine(e.target.value)}
              className={INPUT}
              placeholder="Short descriptive line"
            />
          </div>

          {/* Material note */}
          <div>
            <label className={LABEL} htmlFor="material_note">
              Material Note
            </label>
            <textarea
              id="material_note"
              rows={4}
              value={materialNote}
              onChange={(e) => setMaterialNote(e.target.value)}
              className={`${INPUT} resize-none`}
              placeholder="Notes on source materials, studio process…"
            />
          </div>

          {/* Collection */}
          <div>
            <label className={LABEL} htmlFor="collection">
              Collection
            </label>
            <select
              id="collection"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className={INPUT}
            >
              <option value="">— Select collection —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Display order */}
            <div>
              <label className={LABEL} htmlFor="display_order">
                Display Order
              </label>
              <input
                id="display_order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className={INPUT}
              />
            </div>

            {/* Featured */}
            <div>
              <label className={LABEL}>Featured</label>
              <button
                type="button"
                onClick={() => setFeatured(!featured)}
                className={`w-full border px-3 py-2 text-[13px] text-left transition-all duration-200 rounded-none ${
                  featured
                    ? 'border-df-border bg-df-surface text-df-text'
                    : 'border-df-border bg-df-black text-df-faint'
                }`}
              >
                {featured ? 'Yes — Featured' : 'No'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TRANSLATIONS (edit mode only) ── */}
      {mode === 'edit' && bloom && (
        <section className="mb-10">
          <div className={SECTION_HEADING}>Translations</div>
          <TranslationEditor
            bloomId={bloom.id}
            translations={translations}
          />
        </section>
      )}

      {/* ── SECTION 4: MEDIA (edit mode only) ── */}
      {mode === 'edit' && bloom && (
        <section className="mb-10">
          <div className={SECTION_HEADING}>Media</div>
          <div className="space-y-4">
            <MediaUploadSection
              bloomId={bloom.id}
              type="still"
              currentUrl={stillUrl}
              onUpdate={setStillUrl}
            />
            <MediaUploadSection
              bloomId={bloom.id}
              type="motion"
              currentUrl={motionUrl}
              onUpdate={setMotionUrl}
            />
            <MediaUploadSection
              bloomId={bloom.id}
              type="source"
              currentUrl={sourceUrl}
              onUpdate={setSourceUrl}
            />
          </div>
        </section>
      )}

      {/* ── SECTION 5: STATUS & ACTIONS ── */}
      {mode === 'edit' && bloom && (
        <section className="mb-10">
          <div className={SECTION_HEADING}>Status &amp; Actions</div>

          {/* Edition inventory */}
          {bloom.status === 'available' && (
            <div className="mb-6 py-4 border-b border-df-border">
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2">
                Edition Inventory
              </p>
              <p className="text-[13px] text-df-muted">
                <span className="text-df-text">{bloom.edition_sold}</span>{' '}
                Issued ·{' '}
                <span className="text-df-text">
                  {bloom.edition_total - bloom.edition_sold}
                </span>{' '}
                Remaining ·{' '}
                <span className="text-df-text">{bloom.edition_total}</span>{' '}
                Total
              </p>
            </div>
          )}

          {actionError && (
            <p className="text-[11px] tracking-[0.06em] text-df-muted mb-4">
              {actionError}
            </p>
          )}

          <div className="flex items-center gap-4">
            {bloom.status === 'draft' && (
              <button
                type="button"
                onClick={() => setShowPublishDialog(true)}
                className={BTN_PRIMARY}
              >
                Publish Bloom
              </button>
            )}
            {bloom.status === 'available' && (
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                className={BTN_SECONDARY}
              >
                Archive Bloom
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── SAVE CONTROLS ── */}
      <div className="border-t border-df-border pt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={BTN_PRIMARY}
        >
          {saving
            ? 'Saving…'
            : mode === 'new'
              ? 'Create Bloom'
              : 'Save Changes'}
        </button>

        {saveSuccess && (
          <span className="text-[11px] tracking-[0.08em] text-df-muted">
            Saved.
          </span>
        )}
        {saveError && (
          <span className="text-[11px] tracking-[0.08em] text-df-muted">
            {saveError}
          </span>
        )}
      </div>

      {/* Publish dialog */}
      {showPublishDialog && bloom && (
        <PublishDialog
          bloom={{
            title: bloom.title,
            city_name: cityForPublish?.name ?? cityId,
            archive_code: bloom.archive_code,
            edition_total: bloom.edition_total,
            year: bloom.year,
            price_minor: bloom.price_minor,
            currency: bloom.currency,
          }}
          onConfirm={handlePublish}
          onCancel={() => {
            if (!publishLoading) setShowPublishDialog(false);
          }}
          isLoading={publishLoading}
        />
      )}

      {/* Archive dialog */}
      {showArchiveDialog && bloom && (
        <ArchiveDialog
          bloom={{
            title: bloom.title,
            archive_code: bloom.archive_code,
          }}
          onConfirm={handleArchive}
          onCancel={() => {
            if (!archiveLoading) setShowArchiveDialog(false);
          }}
          isLoading={archiveLoading}
        />
      )}
    </div>
  );
}
