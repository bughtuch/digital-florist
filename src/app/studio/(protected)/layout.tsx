// src/app/studio/(protected)/layout.tsx
//
// Guards all Studio admin routes. sign-in and auth/callback are
// intentionally outside this group so they never trigger this redirect.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StudioHeader from '@/components/studio/StudioHeader';
import StudioSignOutButton from '@/components/studio/StudioSignOutButton';

export const dynamic = 'force-dynamic';

export default async function StudioProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated — redirect to sign-in
  if (!user) {
    redirect('/studio/sign-in');
  }

  // Check admin status
  const { data: isAdmin } = await supabase.rpc('is_studio_admin');

  // Authenticated but not admin — show access denied inline
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-df-black flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[9px] tracking-[0.3em] text-df-faint uppercase mb-4">
            Digital Florist
          </p>
          <h1 className="font-display text-[22px] tracking-[0.12em] text-df-text uppercase mb-8">
            House Access Only.
          </h1>
          <p className="text-[11px] tracking-[0.06em] text-df-muted mb-10">
            {user.email} does not have Studio access.
          </p>
          <StudioSignOutButton
            label="Sign Out"
            className="border border-df-border px-5 py-2 text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text hover:border-df-text transition-all duration-300"
          />
        </div>
      </div>
    );
  }

  // Admin — render Studio shell
  return (
    <>
      <StudioHeader email={user.email ?? ''} />
      <main className="pt-12 min-h-screen bg-df-black">{children}</main>
    </>
  );
}
