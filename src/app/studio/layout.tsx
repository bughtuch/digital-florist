// src/app/studio/layout.tsx
//
// Thin HTML shell for all /studio routes.
// No auth guard here — sign-in and auth/callback must render freely.
// The (protected)/layout.tsx handles authentication for admin pages.

export default function StudioShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-df-black">{children}</body>
    </html>
  );
}
