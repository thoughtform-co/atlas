# ATL-003: Fix Role Resolution Storm Causing Button Flicker + Logout Failure

**Issue ID:** ATL-003  
**Title:** Fix: Role Resolution Storm Causing Button Flicker + Logout Failure

---

## Problem

Two related bugs after successful login:

1. The "Add Entity" button (admin-only, "+" in nav) flickered or disappeared entirely
2. Clicking "Logout" in the user dropdown didn't trigger sign-out
3. Console showed a wall of `INSUFFICIENT_RESOURCES` errors from Supabase, with dozens of requests to `/rest/v1/user_roles`

## Root Causes

1. **AuthContext was calling `fetchUserRole` from THREE places simultaneously:**
   - The `getSession` handler on initial load
   - The `onAuthStateChange` handler on auth events
   - The "whenever `user` changes" effect

2. This created a **storm of `/rest/v1/user_roles` requests** that overwhelmed Supabase

3. Race conditions caused role to inconsistently resolve as `'user'` instead of `'admin'`

4. The admin button gating (`isAdmin`) would evaluate before role was resolved

5. Navigation canvas drawing effect had empty dependencies, never redrawing when auth state changed

## Solution

**Single-source-of-truth pattern for role resolution:**

- Created a single `resolveRoleForUser` function as the ONLY place that can hit `user_roles`
- `getSession` and `onAuthStateChange` now ONLY set `user` and `session` state
- A dedicated `useEffect` watches `user` changes and resolves role exactly once
- Removed complex `fetchingRoleRef` guards that created edge cases
- Added clear console logging for debugging auth flow

**Navigation component fixes:**

- Canvas drawing effect waits for `!mounted || loading || roleLoading` before drawing
- Admin button gated on `mounted && !loading && !roleLoading && isAdmin`
- Added `showUserDropdown` to canvas effect dependencies for reactive redrawing

## Files Changed

- `src/context/AuthContext.tsx` - Complete rewrite with single role resolver pattern
- `src/components/ui/Navigation.tsx` - Added reactive canvas drawing + updated button gate

## Testing

- Logged in as admin user
- Opened DevTools → Network → filtered `user_roles`
- Verified at most **1 request** per page load (not a wall of requests)
- Console shows clean flow: `[Auth] Initial session → [Auth] User changed, resolving role...`
- "+" button appears immediately after login without flicker
- Logout button works correctly, clears session and redirects

## Branch

`main`

## Commits

- `e24ed15` - Fix role resolution storm: single-source-of-truth AuthContext
- `5b2a8cf` - Fix TypeScript null narrowing in AuthContext async init
- `b7f6896` - Fix canvas flicker: wait for auth to resolve before drawing icons

## Product Learning

Auth state management in SSR/Client environments creates "two nations with different laws"—state that works on the server may not be immediately available on the client. Multiple effect hooks watching the same state and triggering the same API calls create invisible loops that only manifest under load. The fix: establish a single-source-of-truth pattern where exactly ONE code path is responsible for each side effect. For auth-dependent UI, always gate on ALL loading states (`loading && roleLoading`) before checking permissions, and ensure reactive effects include all relevant dependencies to redraw when state changes.

Stakeholders: Frontend developers working with Supabase Auth + Next.js App Router.

