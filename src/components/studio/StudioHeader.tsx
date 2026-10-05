// src/components/studio/StudioHeader.tsx

import Link from 'next/link';
import StudioSignOutButton from '@/components/studio/StudioSignOutButton';

interface StudioHeaderProps {
  email: string;
}

export default function StudioHeader({ email }: StudioHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-df-black border-b border-df-border flex items-center px-6">
      {/* Left: wordmark */}
      <Link
        href="/studio"
        className="text-[9px] tracking-[0.28em] text-df-text uppercase hover:text-df-muted transition-colors duration-200 shrink-0"
      >
        Digital Florist Studio
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: nav + meta */}
      <nav className="flex items-center gap-6">
        <Link
          href="/studio/blooms"
          className="text-[9px] tracking-[0.2em] text-df-muted uppercase hover:text-df-text transition-colors duration-200"
        >
          Blooms
        </Link>

        <span className="text-df-faint text-[9px]">·</span>

        {email && (
          <>
            <span className="text-[9px] tracking-[0.06em] text-df-faint">
              {email}
            </span>
            <span className="text-df-faint text-[9px]">·</span>
          </>
        )}

        <StudioSignOutButton />
      </nav>
    </header>
  );
}
