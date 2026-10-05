// src/components/studio/StudioSignOutButton.tsx

'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface StudioSignOutButtonProps {
  className?: string;
  label?: string;
}

export default function StudioSignOutButton({
  className,
  label = 'Sign Out',
}: StudioSignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/studio/sign-in');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={
        className ??
        'text-[9px] tracking-[0.2em] text-df-muted uppercase hover:text-df-text transition-colors duration-200'
      }
    >
      {label}
    </button>
  );
}
