// src/app/studio/sign-in/page.tsx

import type { Metadata } from 'next';
import StudioSignInClient from '@/components/studio/StudioSignInClient';

export const metadata: Metadata = {
  title: 'STUDIO — DIGITAL FLORIST',
  robots: 'noindex, nofollow, noarchive',
};

export default function StudioSignInPage() {
  return <StudioSignInClient />;
}
