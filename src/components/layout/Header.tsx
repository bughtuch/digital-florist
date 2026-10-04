'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LanguageSelector from '@/components/ui/LanguageSelector';

type Props = { locale: string };

export default function Header({ locale }: Props) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { href: `/${locale}/gallery`, label: t('gallery') },
    { href: `/${locale}/cities`, label: t('cities') },
    { href: `/${locale}/vault`, label: t('vault') },
    { href: `/${locale}/about`, label: t('about') },
  ];

  return (
    <>
      <header
        className={`
          fixed inset-x-0 top-0 z-40 transition-all duration-500
          ${scrolled ? 'border-b border-df-border bg-df-black/95 backdrop-blur-sm' : 'bg-transparent'}
        `}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10 lg:px-16">

          {/* Wordmark */}
          <Link
            href={`/${locale}`}
            className="text-[13px] font-sans tracking-[0.18em] text-df-text uppercase"
          >
            DIGITAL FLORIST
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[11px] tracking-[0.12em] text-df-muted hover:text-df-text transition-colors duration-300"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <LanguageSelector locale={locale} />
            <Link
              href={`/${locale}/vault`}
              className="hidden md:inline text-[11px] tracking-[0.12em] text-df-muted hover:text-df-text transition-colors duration-300"
            >
              {t('login')}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-[11px] tracking-[0.12em] text-df-muted hover:text-df-text transition-colors duration-300"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              {t('menu')}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed inset-0 z-50 bg-df-black flex flex-col
          transition-opacity duration-500
          ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Menu header */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href={`/${locale}`}
            onClick={() => setMenuOpen(false)}
            className="text-[13px] tracking-[0.18em] text-df-text uppercase"
          >
            DIGITAL FLORIST
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-[11px] tracking-[0.12em] text-df-muted hover:text-df-text transition-colors duration-300"
            aria-label="Close menu"
          >
            {t('close')}
          </button>
        </div>

        {/* Menu links — centered, large */}
        <nav
          className="flex flex-1 flex-col items-center justify-center gap-10"
          aria-label="Mobile navigation"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-[clamp(2rem,8vw,3.5rem)] font-light tracking-[0.06em] text-df-text"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Menu footer */}
        <div className="flex items-center justify-between px-6 pb-10">
          <LanguageSelector locale={locale} />
          <Link
            href={`/${locale}/vault`}
            onClick={() => setMenuOpen(false)}
            className="text-[11px] tracking-[0.12em] text-df-muted"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </>
  );
}
