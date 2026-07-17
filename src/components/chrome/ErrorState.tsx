'use client';

import { useEffect } from 'react';

/**
 * Shared route-level error boundary UI. Rendered by the App Router `error.tsx`
 * boundaries, so it sits INSIDE the global HudChrome frame (corners/rails/
 * wordmark stay visible around it). Styled to the HUD grammar — PT Mono,
 * dawn/gold/void, zero-radius. The wrapper is pointer-events:none so the
 * surrounding chrome (nav, wordmark) stays usable; only the card captures
 * clicks. `reset()` re-renders the errored segment.
 */
export function ErrorState({
  error,
  reset,
  label = 'System',
}: {
  error: Error & { digest?: string };
  reset: () => void;
  label?: string;
}) {
  useEffect(() => {
    console.error(`[${label}]`, error);
  }, [error, label]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '420px',
          textAlign: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}
        >
          {label} · Anomaly
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            letterSpacing: '0.05em',
            color: 'var(--dawn)',
          }}
        >
          Something stirred out of alignment.
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.05em',
            color: 'var(--dawn-30)',
          }}
        >
          {error.digest ? `REF ${error.digest}` : 'The view failed to resolve.'}
        </div>
        <button
          onClick={reset}
          style={{
            marginTop: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--dawn-70)',
            background: 'transparent',
            border: '1px solid var(--dawn-15)',
            padding: '10px 20px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gold)';
            e.currentTarget.style.borderColor = 'var(--gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--dawn-70)';
            e.currentTarget.style.borderColor = 'var(--dawn-15)';
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
