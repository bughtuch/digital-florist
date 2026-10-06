// src/components/studio/PublishDialog.tsx

'use client';

import { formatPriceStudio } from '@/lib/currency';

interface PublishDialogBloom {
  title: string;
  city_name: string;
  archive_code: string;
  edition_total: number;
  year: number;
  price_minor?: number;
  currency?: string;
}

interface PublishDialogProps {
  bloom: PublishDialogBloom;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function PublishDialog({
  bloom,
  onConfirm,
  onCancel,
  isLoading,
}: PublishDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-df-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="w-full max-w-sm mx-6 bg-df-surface border border-df-border p-8">
        <p className="text-[9px] tracking-[0.28em] text-df-faint uppercase mb-6">
          Publish This Bloom?
        </p>

        <div className="mb-6 space-y-1">
          <p className="text-[18px] font-display tracking-[0.06em] text-df-text uppercase">
            {bloom.title}
          </p>
          <p className="text-[11px] tracking-[0.1em] text-df-muted">
            {bloom.city_name}
          </p>
          <p className="text-[11px] tracking-[0.1em] text-df-muted font-mono">
            {bloom.archive_code}
          </p>
          <p className="text-[11px] tracking-[0.1em] text-df-muted">
            Edition of {bloom.edition_total}
          </p>
          <p className="text-[11px] tracking-[0.1em] text-df-muted">
            {bloom.price_minor && bloom.currency
              ? `${formatPriceStudio(bloom.price_minor, bloom.currency)} · ${bloom.year}`
              : bloom.year}
          </p>
        </div>

        <p className="text-[11px] tracking-[0.06em] text-df-faint leading-relaxed mb-8 border-t border-df-border pt-6">
          Once published, the identity of this Bloom becomes permanent.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border border-df-border px-5 py-2.5 text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text hover:border-df-text transition-all duration-300 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 border border-df-text px-5 py-2.5 text-[9px] tracking-[0.18em] text-df-text uppercase hover:bg-df-text hover:text-df-black transition-all duration-300 disabled:opacity-40"
          >
            {isLoading ? 'Publishing…' : 'Publish Bloom'}
          </button>
        </div>
      </div>
    </div>
  );
}
