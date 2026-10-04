import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Future: images from Supabase storage
  // images: { remotePatterns: [...] }
};

export default withNextIntl(nextConfig);
