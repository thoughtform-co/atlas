'use client';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-6">
      {/* Hamburger Menu */}
      <div className="flex flex-col gap-1 cursor-pointer p-2">
        <div className="w-5 h-px bg-[var(--dawn-50)]" />
        <div className="w-5 h-px bg-[var(--dawn-50)]" />
      </div>

      {/* Logo */}
      <div
        className="font-[var(--font-mono)] text-sm tracking-[0.3em] text-[var(--dawn)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        A T L A S
      </div>

      {/* Astrolabe Icon */}
      <svg
        className="w-6 h-6 text-[var(--dawn-50)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    </nav>
  );
}
