'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/LoginModal';

const GRID = 2;
const GOLD = '202, 165, 84';
const DAWN = '236, 227, 214';

// Canvas icon drawing utilities
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number, size: number = GRID) {
  const px = Math.floor(x / GRID) * GRID;
  const py = Math.floor(y / GRID) * GRID;
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.fillRect(px, py, size - 1, size - 1);
}

function setupIcon(canvasRef: React.RefObject<HTMLCanvasElement | null>, size: number) {
  if (!canvasRef.current) return null;
  const canvas = canvasRef.current;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return { ctx, size };
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, signOut, user, roleLoading, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Canvas refs
  const addIconRef = useRef<HTMLCanvasElement>(null);
  const atlasIconRef = useRef<HTMLCanvasElement>(null);
  const archiveIconRef = useRef<HTMLCanvasElement>(null);
  const forgeIconRef = useRef<HTMLCanvasElement>(null);
  const adminIconRef = useRef<HTMLCanvasElement>(null);
  const logoutIconRef = useRef<HTMLCanvasElement>(null);

  // Dropdown hover handlers with delay to prevent flicker
  const handleDropdownEnter = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setShowUserDropdown(true);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false);
    }, 150);
  }, []);

  // Mark mounted (client only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Draw icons
  useEffect(() => {
    if (!mounted || loading || roleLoading) return;
    
    // Add icon (+)
    const addSetup = setupIcon(addIconRef, 22);
    if (addSetup) {
      const { ctx, size } = addSetup;
      const cx = size / 2;
      const cy = size / 2;
      for (let x = 4; x <= size - 4; x += GRID) {
        const dist = Math.abs(x - cx);
        const alpha = 0.7 - dist * 0.03;
        drawPixel(ctx, x, cy, DAWN, alpha);
      }
      for (let y = 4; y <= size - 4; y += GRID) {
        const dist = Math.abs(y - cy);
        const alpha = 0.7 - dist * 0.03;
        drawPixel(ctx, cx, y, DAWN, alpha);
      }
      drawPixel(ctx, cx, cy, GOLD, 0.9);
    }

    // Atlas icon (◇)
    const atlasSetup = setupIcon(atlasIconRef, 17);
    if (atlasSetup) {
      const { ctx, size } = atlasSetup;
      const cx = size / 2;
      const cy = size / 2;
      const r = 5;
      const points = [
        { x: cx, y: cy - r },
        { x: cx + r, y: cy },
        { x: cx, y: cy + r },
        { x: cx - r, y: cy }
      ];
      for (let i = 0; i < 4; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        const steps = 6;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const x = p1.x + (p2.x - p1.x) * t;
          const y = p1.y + (p2.y - p1.y) * t;
          drawPixel(ctx, x, y, GOLD, 0.5 + t * 0.2);
        }
      }
      drawPixel(ctx, cx, cy, GOLD, 0.8);
    }

    // Archive/Lore icon (grid)
    const archiveSetup = setupIcon(archiveIconRef, 17);
    if (archiveSetup) {
      const { ctx } = archiveSetup;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = 3 + col * 4;
          const y = 3 + row * 4;
          const alpha = 0.3 + (row * 0.15) + (col * 0.1);
          drawPixel(ctx, x, y, DAWN, alpha);
        }
      }
    }

    // Forge icon (flame/anvil shape)
    const forgeSetup = setupIcon(forgeIconRef, 17);
    if (forgeSetup) {
      const { ctx, size } = forgeSetup;
      const cx = size / 2;
      // Draw flame-like shape
      drawPixel(ctx, cx, 2, GOLD, 0.7);
      drawPixel(ctx, cx - 2, 4, GOLD, 0.5);
      drawPixel(ctx, cx + 2, 4, GOLD, 0.5);
      drawPixel(ctx, cx, 4, GOLD, 0.6);
      drawPixel(ctx, cx - 2, 6, GOLD, 0.4);
      drawPixel(ctx, cx, 6, GOLD, 0.5);
      drawPixel(ctx, cx + 2, 6, GOLD, 0.4);
      // Base
      for (let x = 2; x <= size - 4; x += GRID) {
        drawPixel(ctx, x, 10, DAWN, 0.4);
      }
      drawPixel(ctx, cx, 8, DAWN, 0.3);
    }

    // Admin icon (gear)
    const adminSetup = setupIcon(adminIconRef, 14);
    if (adminSetup) {
      const { ctx, size } = adminSetup;
      const cx = size / 2;
      const cy = size / 2;
      drawPixel(ctx, cx, cy - 4, DAWN, 0.5);
      drawPixel(ctx, cx, cy + 4, DAWN, 0.5);
      drawPixel(ctx, cx - 4, cy, DAWN, 0.5);
      drawPixel(ctx, cx + 4, cy, DAWN, 0.5);
      drawPixel(ctx, cx - 3, cy - 3, DAWN, 0.35);
      drawPixel(ctx, cx + 3, cy - 3, DAWN, 0.35);
      drawPixel(ctx, cx - 3, cy + 3, DAWN, 0.35);
      drawPixel(ctx, cx + 3, cy + 3, DAWN, 0.35);
      drawPixel(ctx, cx, cy, DAWN, 0.7);
    }

    // Logout icon (arrow out)
    const logoutSetup = setupIcon(logoutIconRef, 14);
    if (logoutSetup) {
      const { ctx } = logoutSetup;
      for (let y = 2; y <= 10; y += GRID) {
        drawPixel(ctx, 2, y, DAWN, 0.3);
      }
      drawPixel(ctx, 4, 2, DAWN, 0.3);
      drawPixel(ctx, 4, 10, DAWN, 0.3);
      const arrowY = 6;
      for (let x = 5; x <= 10; x += GRID) {
        drawPixel(ctx, x, arrowY, DAWN, 0.5);
      }
      drawPixel(ctx, 8, arrowY - 2, DAWN, 0.4);
      drawPixel(ctx, 8, arrowY + 2, DAWN, 0.4);
    }
  }, [mounted, isAdmin, isAuthenticated, loading, roleLoading, showUserDropdown]);

  const isLoreActive = pathname === '/lore';
  const isAtlasActive = pathname === '/';
  const isForgeActive = pathname.startsWith('/forge');

  return (
    <>
      {/* Main Navigation Bar (Center) */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          {/* Add Button - Only show after role is resolved */}
          {mounted && !loading && !roleLoading && isAdmin && (
            <Link
              href="/admin/new-entity"
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid rgba(236, 227, 214, 0.15)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textDecoration: 'none',
                position: 'relative',
                zIndex: 1001,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(202, 165, 84, 0.5)';
                e.currentTarget.style.background = 'rgba(202, 165, 84, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(236, 227, 214, 0.15)';
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="New Entity"
            >
              <canvas ref={addIconRef} width={22} height={22} />
            </Link>
          )}

          {/* Main Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-0, #0A0908)',
              border: '1px solid rgba(236, 227, 214, 0.1)',
              height: '44px',
            }}
          >
            {/* Atlas */}
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0 18px',
                height: '100%',
                fontSize: '12px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isAtlasActive ? 'var(--dawn, #ECE3D6)' : 'rgba(202, 165, 84, 0.5)',
                textDecoration: 'none',
                background: isAtlasActive ? 'rgba(236, 227, 214, 0.1)' : 'transparent',
                borderRight: '1px solid rgba(236, 227, 214, 0.08)',
                transition: 'all 150ms ease',
              }}
            >
              <canvas ref={atlasIconRef} width={17} height={17} style={{ width: '17px', height: '17px' }} />
              <span>Atlas</span>
            </Link>

            {/* Lore */}
            <Link
              href="/lore"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0 18px',
                height: '100%',
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isLoreActive ? 'var(--dawn, #ECE3D6)' : 'rgba(236, 227, 214, 0.3)',
                textDecoration: 'none',
                background: isLoreActive ? 'rgba(236, 227, 214, 0.1)' : 'transparent',
                borderRight: '1px solid rgba(236, 227, 214, 0.08)',
                transition: 'all 150ms ease',
              }}
            >
              <canvas ref={archiveIconRef} width={17} height={17} style={{ width: '17px', height: '17px' }} />
              <span>Lore</span>
            </Link>

            {/* Forge */}
            <Link
              href="/forge"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0 18px',
                height: '100%',
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isForgeActive ? 'var(--dawn, #ECE3D6)' : 'rgba(202, 165, 84, 0.4)',
                textDecoration: 'none',
                background: isForgeActive ? 'rgba(202, 165, 84, 0.15)' : 'transparent',
                transition: 'all 150ms ease',
              }}
            >
              <canvas ref={forgeIconRef} width={17} height={17} style={{ width: '17px', height: '17px' }} />
              <span>Forge</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* User Menu (Top Right - where Signal used to be) */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: 'clamp(48px, 8vw, 120px)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      >
        {isAuthenticated ? (
          <div
            style={{ position: 'relative' }}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            {/* User Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: showUserDropdown ? 'var(--gold, #CAA554)' : 'var(--dawn, #ECE3D6)',
                  transition: 'color 150ms ease',
                }}
              >
                {user?.email?.split('@')[0] || 'Navigator'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  color: 'rgba(91, 138, 122, 0.8)',
                  letterSpacing: '0.1em',
                }}
              >
                ACTIVE
              </span>
              <span
                style={{
                  fontSize: '8px',
                  color: 'rgba(236, 227, 214, 0.3)',
                  transition: 'transform 150ms ease',
                  transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▼
              </span>
            </div>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  paddingTop: '4px',
                  zIndex: 1001,
                }}
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
              >
                <div
                  style={{
                    background: 'var(--surface-0, #0A0908)',
                    border: '1px solid rgba(236, 227, 214, 0.1)',
                    minWidth: '120px',
                  }}
                >
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          router.push('/admin/prompts');
                          setShowUserDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 14px',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'rgba(236, 227, 214, 0.3)',
                          cursor: 'pointer',
                          border: 'none',
                          background: 'transparent',
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'left',
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--dawn, #ECE3D6)';
                          e.currentTarget.style.background = 'rgba(236, 227, 214, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(236, 227, 214, 0.3)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <canvas ref={adminIconRef} width={14} height={14} style={{ width: '14px', height: '14px' }} />
                        <span>Admin</span>
                      </button>
                      <div style={{ height: '1px', background: 'rgba(236, 227, 214, 0.08)' }} />
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dropdownTimeoutRef.current) {
                        clearTimeout(dropdownTimeoutRef.current);
                        dropdownTimeoutRef.current = null;
                      }
                      setShowUserDropdown(false);
                      signOut();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(236, 227, 214, 0.3)',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--dawn, #ECE3D6)';
                      e.currentTarget.style.background = 'rgba(236, 227, 214, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(236, 227, 214, 0.3)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <canvas ref={logoutIconRef} width={14} height={14} style={{ width: '14px', height: '14px' }} />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(236, 227, 214, 0.5)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--dawn, #ECE3D6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(236, 227, 214, 0.5)';
            }}
          >
            Sign In
          </button>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
