'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/LoginModal';

export function Navigation() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 py-6">
        {/* Hamburger Menu */}
        <button 
          className="flex flex-col gap-1 cursor-pointer p-2 bg-transparent border-none"
          onClick={() => setShowMenu(!showMenu)}
        >
          <div className="w-5 h-px bg-[var(--dawn-50)]" />
          <div className="w-5 h-px bg-[var(--dawn-50)]" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="font-[var(--font-mono)] text-sm tracking-[0.3em] text-[var(--dawn)] no-underline"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          A T L A S
        </Link>

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

      {/* Slide-out Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[150] bg-black/50"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 bottom-0 z-[200] w-72 bg-[var(--surface-0)] border-r border-[rgba(236,227,214,0.08)]">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-[rgba(236,227,214,0.08)]">
              <span 
                className="text-xs tracking-[0.1em] text-[rgba(236,227,214,0.5)] uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Navigation
              </span>
              <button 
                className="text-[rgba(236,227,214,0.4)] hover:text-[var(--dawn)] bg-transparent border-none cursor-pointer text-sm"
                onClick={() => setShowMenu(false)}
              >
                ✕
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4">
              {/* Main Links */}
              <div className="mb-6">
                <div 
                  className="text-[9px] tracking-[0.1em] text-[rgba(236,227,214,0.3)] uppercase mb-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  ▸ Main
                </div>
                <Link 
                  href="/" 
                  className="block py-2 px-3 text-[rgba(236,227,214,0.6)] hover:text-[var(--gold)] hover:bg-[rgba(202,165,84,0.05)] no-underline text-sm transition-all"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  onClick={() => setShowMenu(false)}
                >
                  Constellation
                </Link>
                <Link 
                  href="/archive" 
                  className="block py-2 px-3 text-[rgba(236,227,214,0.6)] hover:text-[var(--gold)] hover:bg-[rgba(202,165,84,0.05)] no-underline text-sm transition-all"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  onClick={() => setShowMenu(false)}
                >
                  Archive
                </Link>
              </div>

              {/* Admin Links (only for admins) */}
              {isAdmin && (
                <div className="mb-6">
                  <div 
                    className="text-[9px] tracking-[0.1em] text-[var(--gold)] uppercase mb-3"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ▸ Admin
                  </div>
                  <Link 
                    href="/admin/new-entity" 
                    className="block py-2 px-3 text-[var(--gold)] hover:bg-[rgba(202,165,84,0.1)] no-underline text-sm transition-all"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    + New Entity
                  </Link>
                  <Link 
                    href="/admin/prompts" 
                    className="block py-2 px-3 text-[rgba(236,227,214,0.6)] hover:text-[var(--gold)] hover:bg-[rgba(202,165,84,0.05)] no-underline text-sm transition-all"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    System Prompts
                  </Link>
                </div>
              )}

              {/* Auth Section */}
              <div className="border-t border-[rgba(236,227,214,0.08)] pt-4">
                {isAuthenticated ? (
                  <button 
                    className="w-full py-2 px-3 text-left text-[rgba(236,227,214,0.5)] hover:text-[var(--dawn)] hover:bg-[rgba(236,227,214,0.04)] no-underline text-sm transition-all bg-transparent border-none cursor-pointer"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                  >
                    Sign Out
                  </button>
                ) : (
                  <button 
                    className="w-full py-2 px-3 text-left text-[var(--gold)] hover:bg-[rgba(202,165,84,0.05)] no-underline text-sm transition-all bg-transparent border-none cursor-pointer"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    onClick={() => {
                      setShowMenu(false);
                      setShowLoginModal(true);
                    }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
