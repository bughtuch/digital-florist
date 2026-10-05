'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import BloomMedia from '@/components/bloom/BloomMedia';

export interface RevealData {
  senderName: string;
  privateMessage: string;
  bloomTitle: string;
  cityName: string;
  cityCode: string;
  archiveCode: string;
  editionNumber: number;
  editionTotal: number;
  materialNote: string | null;
  year: number;
  stillAssetUrl: string | null;
  motionAssetUrl: string | null;
  bloomSlug: string;
  locale: string;
  claimToken: string;
  isFirstOpen: boolean;
  isPreview?: boolean;
}

export default function RevealClient({ data }: { data: RevealData }) {
  const t = useTranslations('reveal');

  const a = data.isFirstOpen;

  const editionLabel = `${String(data.editionNumber).padStart(3, '0')} / ${data.editionTotal}`;
  const artAlt = `${data.bloomTitle} — Digital Florist, ${data.cityName}`;

  return (
    <main id="main-content" className="min-h-svh bg-df-black">

      {/* House mark */}
      <div className={`px-6 pt-8 pb-0 text-center ${a ? 'reveal-house-mark' : ''}`}>
        <span className="text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
          DIGITAL FLORIST
        </span>
        {data.isPreview && (
          <span className="ms-3 text-[8px] tracking-[0.16em] text-df-faint uppercase">
            · PREVIEW
          </span>
        )}
      </div>

      {/* FROM — sender presentation */}
      <div className={`mt-16 px-6 text-center ${a ? 'reveal-from-line' : ''}`}>
        <p className="text-[9px] tracking-[0.24em] text-df-muted uppercase mb-5">
          {t('fromLine')}
        </p>
        <p className="font-display text-[clamp(2.75rem,7vw,5rem)] font-light leading-[1.08] text-df-text">
          {data.senderName}
        </p>
      </div>

      {/* ARTWORK — emerges from darkness; motion where available */}
      <div className={`mt-14 md:mt-20 ${a ? 'reveal-artwork' : ''}`}>
        <div className="relative mx-auto w-full aspect-[3/4] overflow-hidden md:max-w-[400px]">
          <BloomMedia
            stillUrl={data.stillAssetUrl}
            motionUrl={data.motionAssetUrl}
            alt={artAlt}
            priority
            mode="reveal"
            sizes="(max-width: 768px) 100vw, 400px"
            className="absolute inset-0"
          />
        </div>
      </div>

      {/* MESSAGE */}
      <div className={`mx-auto mt-14 max-w-[520px] px-6 md:mt-20 ${a ? 'reveal-message' : ''}`}>
        <p className="mb-7 text-[8px] tracking-[0.22em] text-df-faint uppercase">
          {t('messageLabel')}
        </p>
        <p className="whitespace-pre-wrap text-[15px] leading-[1.9] tracking-[0.015em] text-df-text">
          {data.privateMessage}
        </p>
      </div>

      {/* PROVENANCE */}
      <div className={`mx-auto mt-14 max-w-[520px] px-6 md:mt-16 ${a ? 'reveal-provenance' : ''}`}>
        <div className="border-t border-df-border-subtle pt-10 space-y-3">

          <p className="text-[13px] tracking-[0.1em] font-light text-df-text">
            {data.bloomTitle}
          </p>

          <p className="text-[10px] tracking-[0.14em] text-df-muted uppercase">
            {data.cityName}&ensp;/&ensp;{data.archiveCode}
          </p>

          <p className="text-[10px] tracking-[0.12em] text-df-muted uppercase">
            {t('editionLabel')}&ensp;{editionLabel}
          </p>

          {data.materialNote && (
            <p className="text-[10px] tracking-[0.1em] text-df-muted">
              {data.materialNote}
            </p>
          )}

          <p className="text-[9px] tracking-[0.12em] text-df-faint uppercase">
            {t('houseLabel')}&ensp;·&ensp;{data.year}
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className={`mx-auto mt-14 max-w-[520px] px-6 pb-24 space-y-4 md:mt-16 ${a ? 'reveal-cta' : ''}`}>
        <Link
          href={`/${data.locale}/claim/${data.claimToken}`}
          className="
            block w-full border border-df-text py-4
            text-center text-[11px] tracking-[0.2em] text-df-text uppercase
            transition-all duration-500
            hover:bg-df-text hover:text-df-black
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text
          "
        >
          {t('keepCta')}
        </Link>

        <Link
          href={`/${data.locale}/gallery`}
          className="
            block w-full border border-df-border py-4
            text-center text-[11px] tracking-[0.2em] text-df-muted uppercase
            transition-colors duration-300
            hover:border-df-muted hover:text-df-text
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-border
          "
        >
          {t('sendBackCta')}
        </Link>
      </div>

    </main>
  );
}
