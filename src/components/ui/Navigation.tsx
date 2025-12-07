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
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isArchiveActive = pathname === '/archive';
  const isAtlasActive = pathname === '/';

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
          {/* ATLAS Button */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                border: '1px solid transparent',
                transition: 'all 150ms ease',
                cursor: 'pointer',
                color: isAtlasActive ? 'var(--gold, #CAA554)' : 'rgba(236, 227, 214, 0.5)',
                background: isAtlasActive ? 'rgba(202, 165, 84, 0.15)' : 'transparent',
                borderColor: isAtlasActive ? 'rgba(202, 165, 84, 0.4)' : 'rgba(236, 227, 214, 0.15)',
              }}
            >
              <span style={{ fontSize: '14px', opacity: 0.8 }}>◇</span>
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

          {/* ARCHIVE Button */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px' }}>
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
                borderColor: isArchiveActive ? 'rgba(202, 165, 84, 0.4)' : 'rgba(236, 227, 214, 0.15)',
              }}
            >
              Archive
            </Link>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(236, 227, 214, 0.15)' }} />

          {/* User Section */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px', position: 'relative' }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: 'rgba(236, 227, 214, 0.3)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                >
                  <span>User:</span>
                  <span style={{ color: 'var(--gold, #CAA554)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {user?.email?.split('@')[0] || 'Navigator'}
                  </span>
                  <span style={{ fontSize: '8px', color: 'var(--gold, #CAA554)', opacity: 0.6 }}>▼</span>
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <>
                    <div
                      onClick={() => setShowUserDropdown(false)}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 90,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        minWidth: '180px',
                        background: 'var(--surface-0, #0A0908)',
                        border: '1px solid rgba(236, 227, 214, 0.15)',
                        zIndex: 100,
                      }}
                    >
                      {isAdmin && (
                        <>
                          <div
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '9px',
                              letterSpacing: '0.1em',
                              color: 'rgba(236, 227, 214, 0.3)',
                              borderBottom: '1px solid rgba(236, 227, 214, 0.08)',
                            }}
                          >
                            ADMIN
                          </div>
                          <Link
                            href="/admin/prompts"
                            onClick={() => setShowUserDropdown(false)}
                            style={{
                              display: 'block',
                              padding: '10px 12px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              color: 'rgba(236, 227, 214, 0.6)',
                              textDecoration: 'none',
                              borderBottom: '1px solid rgba(236, 227, 214, 0.08)',
                              transition: 'background 150ms',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 227, 214, 0.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            System Prompts
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserDropdown(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'rgba(236, 227, 214, 0.4)',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 227, 214, 0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </>
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
