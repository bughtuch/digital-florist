// src/components/studio/StudioSignInClient.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SignInState = 'idle' | 'sending' | 'sent' | 'error';

export default function StudioSignInClient() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SignInState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('sending');
    setErrorMessage('');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/studio/auth/callback`,
      },
    });

    if (error) {
      setState('error');
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    } else {
      setState('sent');
    }
  }

  return (
    <div className="min-h-screen bg-df-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-12">
          <p
            className="font-display text-[11px] tracking-[0.3em] text-df-faint uppercase mb-3"
          >
            Digital Florist
          </p>
          <h1
            className="font-display text-[28px] tracking-[0.15em] text-df-text uppercase"
          >
            Studio Access
          </h1>
        </div>

        {/* Divider */}
        <div className="border-t border-df-border mb-10" />

        {state === 'sent' ? (
          /* Sent state */
          <div className="text-center">
            <p className="text-[13px] tracking-[0.15em] text-df-text uppercase mb-4">
              Check Your Email.
            </p>
            <p className="text-[11px] tracking-[0.08em] text-df-muted leading-relaxed">
              A private sign-in link has been sent to{' '}
              <span className="text-df-text">{email}</span>.
              <br />
              The link expires shortly — open it promptly.
            </p>
            <button
              onClick={() => {
                setState('idle');
                setEmail('');
              }}
              className="mt-8 text-[9px] tracking-[0.2em] text-df-faint uppercase hover:text-df-muted transition-colors duration-200"
            >
              Use a different address
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="house@digitalflorist.com"
                required
                disabled={state === 'sending'}
                className="
                  w-full bg-df-surface border border-df-border
                  px-3 py-2.5 text-[13px] text-df-text
                  placeholder:text-df-faint
                  focus:outline-none focus:border-df-muted
                  transition-colors duration-200
                  rounded-none
                  disabled:opacity-50
                "
              />
            </div>

            {state === 'error' && (
              <p className="mb-5 text-[11px] tracking-[0.08em] text-df-muted">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={state === 'sending' || !email.trim()}
              className="
                w-full border border-df-text px-5 py-3
                text-[10px] tracking-[0.18em] text-df-text uppercase
                hover:bg-df-text hover:text-df-black
                transition-all duration-300
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-transparent disabled:hover:text-df-text
              "
            >
              {state === 'sending' ? 'Sending…' : 'Send Sign-In Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
