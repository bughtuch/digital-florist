'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { routing, type Locale } from '@/i18n/routing';

export default function LanguageSelector({ locale }: { locale: string }) {
  const t = useTranslations('languages');
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);
    // Replace current locale segment in pathname
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/') || '/');
  }

  const labelMap: Record<string, string> = {
    en: 'EN',
    ar: 'AR',
    it: 'IT',
    ko: 'KO',
    ja: 'JA',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Select language"
        aria-expanded={open}
        className="text-[11px] tracking-[0.12em] text-df-muted hover:text-df-text transition-colors duration-300 cursor-pointer"
      >
        {labelMap[locale] ?? locale.toUpperCase()}
      </button>

      {open && (
        <div
          className="absolute end-0 top-full mt-3 min-w-[140px] bg-df-surface border border-df-border py-2 z-50"
          role="listbox"
          aria-label="Language options"
        >
          {routing.locales.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              onClick={() => switchLocale(loc)}
              className={`
                w-full text-start px-4 py-2 text-[11px] tracking-[0.1em] transition-colors duration-200
                ${loc === locale
                  ? 'text-df-text'
                  : 'text-df-muted hover:text-df-text'
                }
              `}
            >
              {t(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
