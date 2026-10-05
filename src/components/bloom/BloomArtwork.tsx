// src/components/bloom/BloomArtwork.tsx
//
// Bloom detail artwork panel. Uses BloomMedia in 'detail' mode.
// Shows motion when available; still otherwise.

import type { BloomWithRelations } from '@/types';
import BloomMedia from '@/components/bloom/BloomMedia';

type Props = {
  bloom: BloomWithRelations;
};

export default function BloomArtwork({ bloom }: Props) {
  const alt = `${bloom.title} — Digital Florist, ${bloom.city.name}`;

  return (
    <div className="relative w-full aspect-portrait bg-df-black overflow-hidden">
      <BloomMedia
        stillUrl={bloom.still_asset_url}
        motionUrl={bloom.motion_asset_url}
        alt={alt}
        priority
        mode="detail"
        sizes="(max-width: 768px) 100vw, 65vw"
        className="absolute inset-0"
      />
    </div>
  );
}
