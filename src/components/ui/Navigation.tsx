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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const isCanonActive = pathname === '/';
  const isArcsActive = pathname === '/archive';

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(5, 4, 3, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(236, 227, 214, 0.08)',
        }}
      >
        {/* Left: Logo + Add button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <Link
              href="/admin/new-entity"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                color: 'var(--gold, #CAA554)',
                fontSize: '20px',
                fontWeight: 300,
                textDecoration: 'none',
                transition: 'opacity 150ms',
              }}
              title="Add New Entity"
            >
              +
            </Link>
          )}
          
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              color: 'var(--gold, #CAA554)',
              textDecoration: 'none',
            }}
          >
            ATLAS
          </Link>
        </div>

        {/* Center: Nav tabs */}
        <nav
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            border: '1px solid rgba(236, 227, 214, 0.12)',
          }}
        >
          <Link
            href="/"
            style={{
              padding: '6px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              color: isCanonActive ? 'var(--gold, #CAA554)' : 'rgba(236, 227, 214, 0.4)',
              background: isCanonActive ? 'rgba(202, 165, 84, 0.08)' : 'transparent',
              borderRight: '1px solid rgba(236, 227, 214, 0.12)',
              transition: 'all 150ms',
            }}
          >
            CANON
          </Link>
          <Link
            href="/archive"
            style={{
              padding: '6px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              color: isArcsActive ? 'var(--gold, #CAA554)' : 'rgba(236, 227, 214, 0.4)',
              background: isArcsActive ? 'rgba(202, 165, 84, 0.08)' : 'transparent',
              transition: 'all 150ms',
            }}
          >
            ARCS
          </Link>
        </nav>

        {/* Right: Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: 'rgba(236, 227, 214, 0.5)',
                  transition: 'color 150ms',
                }}
              >
                <span>{user?.email?.split('@')[0] || 'PROFILE'}</span>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>▼</span>
              </button>

              {showProfileDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    onClick={() => setShowProfileDropdown(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 90,
                    }}
                  />
                  
                  {/* Dropdown */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      minWidth: '180px',
                      background: 'var(--surface-0, #0A0908)',
                      border: '1px solid rgba(236, 227, 214, 0.12)',
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
                          href="/admin/new-entity"
                          onClick={() => setShowProfileDropdown(false)}
                          style={{
                            display: 'block',
                            padding: '10px 12px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--gold, #CAA554)',
                            textDecoration: 'none',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(202, 165, 84, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          + New Entity
                        </Link>
                        <Link
                          href="/admin/prompts"
                          onClick={() => setShowProfileDropdown(false)}
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
                        setShowProfileDropdown(false);
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
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid rgba(236, 227, 214, 0.15)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                color: 'rgba(236, 227, 214, 0.5)',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.4)';
                e.currentTarget.style.color = 'var(--gold, #CAA554)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
                e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)';
              }}
            >
              SIGN IN
            </button>
          )}
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
