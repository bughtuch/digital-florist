// src/components/studio/MediaUploadSection.tsx

'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type MediaType = 'still' | 'motion' | 'source';

interface MediaUploadSectionProps {
  bloomId: string;
  type: MediaType;
  currentUrl: string | null;
  onUpdate: (newValue: string | null) => void;
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

const DB_FIELD: Record<MediaType, string> = {
  still: 'still_asset_url',
  motion: 'motion_asset_url',
  source: 'source_asset_url',
};

function getStoragePath(bloomId: string, type: MediaType, filename: string): string {
  if (type === 'still') return `blooms/${bloomId}/still/${filename}`;
  if (type === 'motion') return `blooms/${bloomId}/motion/${filename}`;
  return `${bloomId}/${filename}`; // source bucket
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? '';
}

export default function MediaUploadSection({
  bloomId,
  type,
  currentUrl,
  onUpdate,
}: MediaUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadedMeta, setUploadedMeta] = useState<{ name: string; size: number } | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(null);
    setSignedUrl(null);

    const maxBytes = MAX_MB[type] * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File exceeds ${MAX_MB[type]} MB limit.`);
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

      const res = await fetch(`/api/studio/blooms/${bloomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [DB_FIELD[type]]: resultValue }),
      });

      if (!res.ok) throw new Error('Failed to save to database.');

      setUploadedMeta({ name: file.name, size: file.size });
      onUpdate(resultValue);
      setProgress(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!currentUrl) return;
    setRemoving(true);
    setError(null);
    setSignedUrl(null);

    try {
      // Remove the storage object only if it belongs to this Bloom.
      // We check that the path contains the bloomId to avoid touching another Bloom's media.
      const supabase = createClient();

      if (type !== 'source') {
        // currentUrl is a public URL — extract the storage path from it
        const url = new URL(currentUrl);
        const pathParts = url.pathname.split('/object/public/');
        if (pathParts.length === 2) {
          const [bucketAndPath] = pathParts[1].split('?');
          const slashIdx = bucketAndPath.indexOf('/');
          const storagePath = bucketAndPath.slice(slashIdx + 1);
          // Safety: only delete if path belongs to this bloom
          if (storagePath.includes(bloomId)) {
            const bucket = BUCKET[type];
            await supabase.storage.from(bucket).remove([storagePath]);
          }
        }
      }
      // For source: currentUrl is the storage path directly
      else if (type === 'source' && currentUrl.includes(bloomId)) {
        await supabase.storage.from('bloom-source').remove([currentUrl]);
      }

      // Clear DB field
      const res = await fetch(`/api/studio/blooms/${bloomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [DB_FIELD[type]]: null }),
      });

      if (!res.ok) throw new Error('Failed to clear database field.');

      setUploadedMeta(null);
      onUpdate(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Remove failed.');
    } finally {
      setRemoving(false);
    }
  }

  async function handleViewSource() {
    setLoadingSignedUrl(true);
    setError(null);
    setSignedUrl(null);
    try {
      const res = await fetch(`/api/studio/blooms/${bloomId}/source-url`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not load source URL.');
      }
      const { signedUrl: url } = await res.json();
      setSignedUrl(url);
      // Auto-clear after 4.5 min so it expires before the 5 min server expiry
      setTimeout(() => setSignedUrl(null), 270_000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch source URL.');
    } finally {
      setLoadingSignedUrl(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const hasAsset = !!currentUrl;

  return (
    <div className="border border-df-border p-4">

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
          {LABEL[type]}
        </p>
        <p className="text-[9px] tracking-[0.1em] text-df-faint">
          Max {MAX_MB[type]} MB
        </p>
      </div>

      {/* Current asset — still preview */}
      {hasAsset && type === 'still' && (
        <div className="border border-df-border mb-4 overflow-hidden">
          <img
            src={currentUrl!}
            alt="Current still"
            className="w-full max-h-48 object-contain bg-df-surface"
          />
        </div>
      )}

      {/* Current asset — motion preview */}
      {hasAsset && type === 'motion' && (
        <div className="border border-df-border mb-4 overflow-hidden bg-df-surface">
          <video
            src={currentUrl!}
            muted
            loop
            playsInline
            controls
            className="w-full max-h-48 object-contain"
          />
        </div>
      )}

      {/* Uploaded file metadata */}
      {hasAsset && uploadedMeta && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[9px] tracking-[0.12em] text-df-faint uppercase font-mono">
            {fileExtension(uploadedMeta.name)}
          </span>
          <span className="text-df-faint text-[9px]">·</span>
          <span className="text-[9px] tracking-[0.08em] text-df-faint">
            {formatBytes(uploadedMeta.size)}
          </span>
          <span className="text-df-faint text-[9px]">·</span>
          <span className="text-[9px] tracking-[0.1em] text-df-muted truncate max-w-[180px]">
            {uploadedMeta.name}
          </span>
        </div>
      )}

      {/* Source asset — path display + VIEW button */}
      {hasAsset && type === 'source' && (
        <div className="mb-4">
          <div className="bg-df-surface border border-df-border px-3 py-2 mb-3">
            <p className="text-[10px] text-df-faint font-mono truncate">
              {currentUrl}
            </p>
          </div>
          {signedUrl ? (
            <div className="flex items-center gap-3">
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text transition-colors duration-200"
              >
                Open Source ↗
              </a>
              <span className="text-[9px] tracking-[0.08em] text-df-faint">
                (expires in ~5 min)
              </span>
              <button
                onClick={() => setSignedUrl(null)}
                className="text-[9px] tracking-[0.12em] text-df-faint uppercase hover:text-df-muted transition-colors duration-200 ml-2"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <button
              onClick={handleViewSource}
              disabled={loadingSignedUrl}
              className="text-[9px] tracking-[0.18em] text-df-faint uppercase hover:text-df-muted transition-colors duration-200 disabled:opacity-40"
            >
              {loadingSignedUrl ? 'Loading…' : 'View Source'}
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
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
              {hasAsset ? 'Replace' : 'Choose File'}
            </button>
          </>
        )}
      </div>

      {/* Remove button */}
      {hasAsset && !uploading && (
        <div className="mb-3">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-[9px] tracking-[0.18em] text-df-faint uppercase hover:text-df-muted transition-colors duration-200 disabled:opacity-40"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      )}

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
