import Image from 'next/image';
import type { BloomWithRelations } from '@/types';
import BloomArtPlaceholder from '@/components/gallery/BloomArtPlaceholder';

type Props = { bloom: BloomWithRelations };

export default function BloomArtwork({ bloom }: Props) {
  // When still_asset_url is present, swap the placeholder for a real image.
  // Layout is unchanged — container is always 100% of its column.
  if (bloom.still_asset_url) {
    return (
      <div className="relative w-full aspect-portrait bg-df-black overflow-hidden">
        <Image
          src={bloom.still_asset_url}
          alt={bloom.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 65vw"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-portrait overflow-hidden">
      <BloomArtPlaceholder
        slug={bloom.slug}
        title={bloom.title}
        className="absolute inset-0"
      />
    </div>
  );
}
