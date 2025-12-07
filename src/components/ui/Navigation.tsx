'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/LoginModal';

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, signOut, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isArchiveActive = pathname === '/archive';
  const isCanonActive = pathname === '/';

  return (
    <>
      {/* Fixed container to center the nav */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Navigation bar - inline, not full width */}
        <nav
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-0, #0A0908)',
            border: '1px solid rgba(236, 227, 214, 0.15)',
            pointerEvents: 'auto',
          }}
        >
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--gold, #CAA554)',
                fontSize: '13px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ fontSize: '16px', opacity: 0.8 }}>◇</span>
              <span>Atlas</span>
            </Link>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(236, 227, 214, 0.15)' }} />

          {/* New Entity CTA (admin only) */}
          {isAdmin && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px' }}>
                <Link
                  href="/admin/new-entity"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'var(--gold, #CAA554)',
                    border: '1px solid var(--gold, #CAA554)',
                    color: 'var(--void, #050403)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span>
                  <span>New Entity</span>
                </Link>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'rgba(236, 227, 214, 0.15)' }} />
            </>
          )}

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px', gap: '4px' }}>
            <Link
              href="/"
              style={{
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                border: '1px solid transparent',
                transition: 'all 150ms ease',
                cursor: 'pointer',
                color: isCanonActive ? 'var(--gold, #CAA554)' : 'rgba(236, 227, 214, 0.5)',
                background: isCanonActive ? 'rgba(202, 165, 84, 0.15)' : 'transparent',
                borderColor: isCanonActive ? 'rgba(202, 165, 84, 0.4)' : 'transparent',
              }}
            >
              Canon
            </Link>
            <Link
              href="/archive"
              style={{
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                border: '1px solid transparent',
                transition: 'all 150ms ease',
                cursor: 'pointer',
                color: isArchiveActive ? 'var(--gold, #CAA554)' : 'rgba(236, 227, 214, 0.5)',
                background: isArchiveActive ? 'rgba(202, 165, 84, 0.15)' : 'transparent',
                borderColor: isArchiveActive ? 'rgba(202, 165, 84, 0.4)' : 'transparent',
              }}
            >
              Archive
            </Link>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(236, 227, 214, 0.15)' }} />

          {/* User Section */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px' }}>
            {isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: 'rgba(236, 227, 214, 0.3)',
                }}
              >
                <span>User:</span>
                <span style={{ color: 'var(--dawn, #ECE3D6)', textTransform: 'uppercase' }}>
                  {user?.email?.split('@')[0] || 'Navigator'}
                </span>
                <button
                  onClick={() => signOut()}
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '1px solid rgba(236, 227, 214, 0.3)',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'rgba(236, 227, 214, 0.5)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 150ms ease',
                  }}
                  title="Sign Out"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: 'rgba(236, 227, 214, 0.5)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 150ms ease',
                }}
              >
                <span>Sign In</span>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '1px solid rgba(236, 227, 214, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'rgba(236, 227, 214, 0.5)',
                  }}
                >
                  ◆
                </div>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
