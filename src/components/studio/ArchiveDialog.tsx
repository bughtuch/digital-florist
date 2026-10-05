// src/components/studio/ArchiveDialog.tsx

'use client';

interface ArchiveDialogProps {
  bloom: {
    title: string;
    archive_code: string;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ArchiveDialog({
  bloom,
  onConfirm,
  onCancel,
  isLoading,
}: ArchiveDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-df-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="w-full max-w-sm mx-6 bg-df-surface border border-df-border p-8">
        <p className="text-[9px] tracking-[0.28em] text-df-faint uppercase mb-6">
          Archive This Bloom?
        </p>

        <div className="mb-6 space-y-1">
          <p className="text-[18px] font-display tracking-[0.06em] text-df-text uppercase">
            {bloom.title}
          </p>
          <p className="text-[11px] tracking-[0.1em] text-df-muted font-mono">
            {bloom.archive_code}
          </p>
        </div>

        <p className="text-[11px] tracking-[0.06em] text-df-faint leading-relaxed mb-2 border-t border-df-border pt-6">
          Archived Blooms remain permanently in the House Archive and can no
          longer be sent.
        </p>
        <p className="text-[11px] tracking-[0.06em] text-df-faint leading-relaxed mb-8">
          This action is permanent.
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
            {isLoading ? 'Archiving…' : 'Archive Bloom'}
          </button>
        </div>
      </div>
    </div>
  );
}
