/**
 * Shared route-level loading UI for the App Router `loading.tsx` boundaries.
 * Renders inside the global HudChrome frame while a segment's server data
 * resolves. Reuses the `.animate-pulse-threat` keyframe from globals.css for
 * a gentle pulse; pointer-events:none so it never blocks the chrome.
 */
export function LoadingState({ label = 'Atlas' }: { label?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        className="animate-pulse-threat"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--dawn-30)',
        }}
      >
        {label} · Resolving
      </div>
    </div>
  );
}
