// src/app/studio/layout.tsx
//
// Thin HTML shell for all /studio routes.
// No auth guard here — sign-in and auth/callback must render freely.
// The (protected)/layout.tsx handles authentication for admin pages.

import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function StudioShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-df-black">{children}</body>
    </html>
  );
}
