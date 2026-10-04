// CSS-only art placeholder.
// Produces 6 visual variants seeded from the bloom slug.
// Swap in <Image src={still_asset_url} .../> when artwork arrives —
// the container sizing is layout-neutral.

function slugToVariant(slug: string): number {
  return slug.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 6;
}

type Props = {
  slug: string;
  title: string;
  className?: string;
};

export default function BloomArtPlaceholder({ slug, title, className }: Props) {
  const variant = slugToVariant(slug);

  return (
    <div className={`relative overflow-hidden bg-df-black ${className ?? ''}`}>
      <div
        className={`art-placeholder art-placeholder-${variant}`}
        aria-hidden="true"
      />
      {/* Screen-reader description — replace with real alt text when artwork lands */}
      <span className="sr-only">
        {title} — artwork coming soon
      </span>
    </div>
  );
}
