// Root layout — minimal pass-through.
// The [locale]/layout.tsx owns <html>, <body>, lang, dir, and fonts.
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
