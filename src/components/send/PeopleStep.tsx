'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type PeopleData = {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
};

type FieldErrors = Partial<Record<keyof PeopleData, string>>;

type Props = {
  initial: PeopleData;
  onSubmit: (data: PeopleData) => void;
  onBack: () => void;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function PeopleStep({ initial, onSubmit, onBack }: Props) {
  const t = useTranslations('send');
  const [fields, setFields] = useState<PeopleData>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(key: keyof PeopleData, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    const nameErr = t('errors.nameRequired');
    const emailErr = t('errors.emailInvalid');

    if (!fields.recipientName.trim()) e.recipientName = nameErr;
    if (!isValidEmail(fields.recipientEmail)) e.recipientEmail = emailErr;
    if (!fields.senderName.trim()) e.senderName = nameErr;
    if (!isValidEmail(fields.senderEmail)) e.senderEmail = emailErr;
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      recipientName: fields.recipientName.trim(),
      recipientEmail: fields.recipientEmail.trim().toLowerCase(),
      senderName: fields.senderName.trim(),
      senderEmail: fields.senderEmail.trim().toLowerCase(),
    });
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-12 md:py-20">

      <button
        onClick={onBack}
        className="mb-10 text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-200"
      >
        {t('step2.back')}
      </button>

      <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-light leading-[1.05] text-df-text mb-10">
        {t('step2.heading')}
      </h1>

      <form onSubmit={handleSubmit} noValidate>

        {/* Recipient */}
        <fieldset className="mb-8">
          <div className="mb-5">
            <Field
              id="recipientName"
              label={t('step2.recipientName')}
              value={fields.recipientName}
              onChange={(v) => update('recipientName', v)}
              error={errors.recipientName}
              autoComplete="off"
              inputMode="text"
            />
          </div>
          <Field
            id="recipientEmail"
            label={t('step2.recipientEmail')}
            value={fields.recipientEmail}
            onChange={(v) => update('recipientEmail', v)}
            error={errors.recipientEmail}
            type="email"
            autoComplete="off"
            inputMode="email"
          />
        </fieldset>

        {/* Divider */}
        <div className="my-8 border-t border-df-border-subtle" />

        {/* Sender */}
        <fieldset className="mb-8">
          <div className="mb-5">
            <Field
              id="senderName"
              label={t('step2.senderName')}
              value={fields.senderName}
              onChange={(v) => update('senderName', v)}
              error={errors.senderName}
              autoComplete="name"
              inputMode="text"
            />
          </div>
          <Field
            id="senderEmail"
            label={t('step2.senderEmail')}
            value={fields.senderEmail}
            onChange={(v) => update('senderEmail', v)}
            error={errors.senderEmail}
            type="email"
            autoComplete="email"
            inputMode="email"
          />
        </fieldset>

        {/* Privacy note */}
        <p className="mb-8 text-[10px] text-df-muted tracking-[0.06em] leading-[1.8]">
          {t('step2.privacy')}
        </p>

        <button
          type="submit"
          className="w-full border border-df-border py-4 text-[11px] tracking-[0.2em] text-df-text uppercase hover:border-df-muted transition-colors duration-300"
        >
          {t('step2.cta')}
        </button>
      </form>
    </div>
  );
}

// ── Field sub-component ─────────────────────────────────────────────────────

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

function Field({ id, label, value, onChange, error, type = 'text', autoComplete, inputMode }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[9px] tracking-[0.18em] text-df-muted uppercase mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={[
          'w-full bg-df-surface border text-df-text text-[14px]',
          'px-4 py-3 outline-none placeholder:text-df-faint',
          'transition-colors duration-200 focus:border-df-muted',
          error ? 'border-red-800' : 'border-df-border',
        ].join(' ')}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[10px] text-red-600 tracking-[0.04em]">
          {error}
        </p>
      )}
    </div>
  );
}
