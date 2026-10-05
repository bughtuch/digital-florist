// src/components/studio/MediaUploadSection.tsx

'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type MediaType = 'still' | 'motion' | 'source';

interface MediaUploadSectionProps {
  bloomId: string;
  type: MediaType;
  currentUrl: string | null;
  onUpdate: (newValue: string) => void;
}

const ACCEPTED: Record<MediaType, string> = {
  still: 'image/jpeg,image/png,image/webp,image/avif',
  motion: 'video/mp4,video/webm',
  source: 'image/jpeg,image/png,image/webp,image/avif,image/tiff',
};

const MAX_MB: Record<MediaType, number> = {
  still: 50,
  motion: 200,
  source: 50,
};

const BUCKET: Record<MediaType, string> = {
  still: 'bloom-public',
  motion: 'bloom-public',
  source: 'bloom-source',
};

const LABEL: Record<MediaType, string> = {
  still: 'Still Image',
  motion: 'Motion Asset',
  source: 'Source File',
};

function getStoragePath(
  bloomId: string,
  type: MediaType,
  filename: string,
): string {
  if (type === 'still') return `blooms/${bloomId}/still/${filename}`;
  if (type === 'motion') return `blooms/${bloomId}/motion/${filename}`;
  return `${bloomId}/${filename}`; // source bucket
}

export default function MediaUploadSection({
  bloomId,
  type,
  currentUrl,
  onUpdate,
}: MediaUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(null);

    const maxBytes = MAX_MB[type] * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File exceeds ${MAX_MB[type]}MB limit.`);
      return;
    }

    setUploading(true);
    setProgress('Uploading…');

    try {
      const supabase = createClient();
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = getStoragePath(bloomId, type, filename);
      const bucket = BUCKET[type];

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      let resultValue: string;

      if (type === 'source') {
        resultValue = storagePath;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);
        resultValue = publicUrlData.publicUrl;
      }

      // Persist to DB
      const fieldMap: Record<MediaType, string> = {
        still: 'still_asset_url',
        motion: 'motion_asset_url',
        source: 'source_asset_url',
      };

      await fetch(`/api/studio/blooms/${bloomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldMap[type]]: resultValue }),
      });

      onUpdate(resultValue);
      setProgress(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-uploaded if needed
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isImage = type === 'still' || type === 'source';
  const hasAsset = !!currentUrl;

  return (
    <div className="border border-df-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
          {LABEL[type]}
        </p>
        <p className="text-[9px] tracking-[0.1em] text-df-faint">
          Max {MAX_MB[type]}MB
        </p>
      </div>

      {/* Current asset preview */}
      {hasAsset && (
        <div className="mb-4">
          {isImage && type === 'still' ? (
            <div className="border border-df-border mb-2 overflow-hidden">
              <img
                src={currentUrl!}
                alt="Current asset"
                className="w-full max-h-48 object-contain bg-df-surface"
              />
            </div>
          ) : (
            <div className="bg-df-surface border border-df-border px-3 py-2 mb-2">
              <p className="text-[11px] text-df-muted font-mono truncate">
                {currentUrl}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Drop zone / upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed border-df-border p-6 text-center mb-3"
      >
        {uploading ? (
          <p className="text-[11px] tracking-[0.1em] text-df-muted uppercase">
            {progress}
          </p>
        ) : (
          <>
            <p className="text-[11px] tracking-[0.06em] text-df-faint mb-3">
              {hasAsset ? 'Drop to replace, or' : 'Drop file here, or'}
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="border border-df-border px-4 py-2 text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text hover:border-df-text transition-all duration-300"
            >
              {hasAsset ? 'Replace File' : 'Choose File'}
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED[type]}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="text-[11px] tracking-[0.06em] text-df-muted mt-2">
          {error}
        </p>
      )}

      <p className="text-[9px] tracking-[0.08em] text-df-faint mt-2">
        {type === 'still' && 'JPEG · PNG · WebP · AVIF'}
        {type === 'motion' && 'MP4 · WebM'}
        {type === 'source' && 'JPEG · PNG · WebP · AVIF · TIFF'}
      </p>
    </div>
  );
}
