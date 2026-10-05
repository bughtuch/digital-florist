// src/components/bloom/BloomMedia.tsx
//
// Central media component for all Bloom artwork surfaces.
// Handles still images, motion video, placeholders, reduced-motion, and error fallback.
// Motion is never shown in: gallery, archive.
// Motion may play in: hero, detail, reveal, vault, studio.

'use client';

import Image from 'next/image';
import { useState } from 'react';

export type BloomMediaMode =
  | 'hero'
  | 'gallery'
  | 'detail'
  | 'reveal'
  | 'vault'
  | 'archive'
  | 'studio';

interface BloomMediaProps {
  stillUrl: string | null;
  motionUrl?: string | null;
  alt: string;
  priority?: boolean;
  mode: BloomMediaMode;
  sizes?: string;
  className?: string;
}

// Only these modes allow motion video playback
const MOTION_MODES = new Set<BloomMediaMode>([
  'hero',
  'detail',
  'reveal',
  'vault',
  'studio',
]);

const DEFAULT_SIZES: Record<BloomMediaMode, string> = {
  hero:    '(max-width: 768px) 100vw, 60vw',
  gallery: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  detail:  '(max-width: 768px) 100vw, 65vw',
  reveal:  '(max-width: 768px) 100vw, 400px',
  vault:   '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  archive: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw',
  studio:  '(max-width: 768px) 100vw, 50vw',
};

// object-contain for artwork-first surfaces; object-cover for editorial grids
const OBJECT_FIT: Record<BloomMediaMode, 'object-contain' | 'object-cover'> = {
  hero:    'object-cover',
  gallery: 'object-cover',
  detail:  'object-contain',
  reveal:  'object-contain',
  vault:   'object-cover',
  archive: 'object-cover',
  studio:  'object-contain',
};

export default function BloomMedia({
  stillUrl,
  motionUrl,
  alt,
  priority = false,
  mode,
  sizes,
  className = '',
}: BloomMediaProps) {
  const [videoError, setVideoError] = useState(false);

  const wantsMotion = MOTION_MODES.has(mode) && !!motionUrl && !videoError;
  const fit = OBJECT_FIT[mode];
  const resolvedSizes = sizes ?? DEFAULT_SIZES[mode];

  // No assets at all — quiet empty state
  if (!stillUrl && !motionUrl) {
    return (
      <div className={`relative flex items-center justify-center bg-df-black ${className}`}>
        <span className="text-[8px] tracking-[0.2em] text-df-faint uppercase select-none">
          HOUSE ARTWORK
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-df-black ${className}`}>
      {/* Still image — primary when no motion; also acts as poster fallback under reduced-motion */}
      {stillUrl && (
        <Image
          src={stillUrl}
          alt={alt}
          fill
          className={`${fit} ${wantsMotion ? 'bloom-still-under-video' : ''}`}
          priority={priority}
          sizes={resolvedSizes}
        />
      )}

      {/* Motion — CSS-hidden under prefers-reduced-motion; sits above still */}
      {wantsMotion && (
        <video
          className={`bloom-video absolute inset-0 h-full w-full ${fit}`}
          src={motionUrl!}
          poster={stillUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoError(true)}
          aria-hidden="true"
        />
      )}

      {/* When only motion — ensure screen reader has text */}
      {!stillUrl && wantsMotion && (
        <span className="sr-only">{alt}</span>
      )}

      {/* No-still, no-motion fallback state */}
      {!stillUrl && !wantsMotion && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] tracking-[0.2em] text-df-faint uppercase select-none">
            HOUSE ARTWORK
          </span>
        </div>
      )}
    </div>
  );
}
