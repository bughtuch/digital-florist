import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const destination = new URL('/en/gallery', req.url);

  // Validate slug — alphanumeric + hyphens only
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.redirect(destination);
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.rpc('resolve_creator_ref', { p_slug: slug });
    const creator = Array.isArray(data) ? data[0] : data;

    if (!creator || creator.active !== true) {
      return NextResponse.redirect(destination);
    }

    const res = NextResponse.redirect(destination);
    res.cookies.set('df_ref', creator.slug, {
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.redirect(destination);
  }
}
