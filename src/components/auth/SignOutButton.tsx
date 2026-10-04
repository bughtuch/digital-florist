'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  locale: string;
  label: string;
  className?: string;
};

export default function SignOutButton({ locale, label, className }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      {label}
    </button>
  );
}
