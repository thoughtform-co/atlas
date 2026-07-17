'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginModal } from '@/components/LoginModal';

/**
 * Top-right HUD navigation — always-hamburger variant of the thoughtform.co
 * v7 nav (01_thoughtform/components/landing/v7/HudNav.tsx). Atlas's main
 * constellation view never scrolls, so the upstream inline-links → hamburger
 * scroll morph is dropped: the three-line trigger is permanent on every
 * route, and the slide-in menu also carries the auth section (identity +
 * admin shortcuts + sign in/out), which thoughtform.co has no equivalent of.
 *
 * Reuses the `.hud__nav*` styling from chrome.css. A11y: Escape + outside
 * pointerdown close the menu; Escape returns focus to the trigger; the
 * button carries aria-expanded / aria-controls; the list is role="menu"
 * with role="menuitem" children.
 */
const NAV_ITEMS = [
  { num: '01', label: 'Atlas', href: '/' },
  { num: '02', label: 'Lore', href: '/lore' },
  { num: '03', label: 'Forge', href: '/forge' },
] as const;

export function HudNav() {
  const pathname = usePathname();
  const { user, loading, roleLoading, isAuthenticated, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape (return focus to the trigger) and on outside pointerdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => setOpen(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const authResolved = !loading && !roleLoading;

  return (
    <div className="hud-nav-overlay">
      <nav
        ref={navRef}
        className={`hud__nav${open ? ' is-open' : ''}`}
        aria-label="Primary"
      >
        {/* Hamburger trigger */}
        <button
          ref={btnRef}
          type="button"
          className="hud__nav__btn"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="hud-nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Slide-in menu */}
        <div
          className="hud__nav__list"
          id="hud-nav-menu"
          role="menu"
          aria-hidden={!open}
        >
          <div className="hud__nav__list__head">
            <span className="k">Nav</span>
            <span>0{NAV_ITEMS.length}</span>
          </div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={isActive(item.href) ? 'is-active' : undefined}
              tabIndex={open ? undefined : -1}
              onClick={close}
            >
              <span className="num">{item.num}</span>
              {item.label}
            </Link>
          ))}

          {/* Auth section — identity + admin shortcuts + sign in/out */}
          {authResolved && isAuthenticated && (
            <div className="hud__nav__status">
              <span>
                <span className="k">ID</span>
                {user?.email?.split('@')[0] ?? 'Navigator'}
              </span>
            </div>
          )}

          {authResolved && isAdmin && (
            <>
              <Link
                href="/admin/prompts"
                role="menuitem"
                tabIndex={open ? undefined : -1}
                onClick={close}
              >
                <span className="num">·</span>
                Admin
              </Link>
              <Link
                href="/admin/new-entity"
                role="menuitem"
                tabIndex={open ? undefined : -1}
                onClick={close}
              >
                <span className="num">+</span>
                New Entity
              </Link>
            </>
          )}

          {authResolved && isAuthenticated && (
            <button
              type="button"
              className="hud__nav__action"
              role="menuitem"
              tabIndex={open ? undefined : -1}
              onClick={() => {
                close();
                signOut();
              }}
            >
              <span className="num">·</span>
              Log out
            </button>
          )}

          {authResolved && !isAuthenticated && (
            <button
              type="button"
              className="hud__nav__action"
              role="menuitem"
              tabIndex={open ? undefined : -1}
              onClick={() => {
                close();
                setShowLoginModal(true);
              }}
            >
              <span className="num">·</span>
              Sign in
            </button>
          )}

          {!authResolved && (
            <div className="hud__nav__status">
              <span>…</span>
            </div>
          )}
        </div>
      </nav>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
