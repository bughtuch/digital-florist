import { redirect } from 'next/navigation';

// Root "/" — redirected to default locale by next-intl middleware,
// but this is a safety net for static builds.
export default function RootPage() {
  redirect('/en');
}
