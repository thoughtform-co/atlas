# Fix: Add Entity Button + Logout Not Working

**Title:** Fix Add Entity button not appearing and Logout not working after login

---

## Problem

Two related bugs after successful login:
1. The "Add Entity" button (admin-only) doesn't appear in the navigation bar
2. Clicking "Logout" in the user dropdown doesn't trigger sign-out

Both issues only occurred on client-side navigation after login—page refresh would sometimes fix it, indicating a hydration/timing issue.

## Root Causes

Two layers of bugs stacked on top of each other:

**Layer 1: Role Resolution Race Condition**
- The auth context had `loading` (session) and `roleLoading` (role fetch) as separate state
- Components were only waiting for `loading` to be false before checking `isAdmin`
- Role might not be resolved yet when admin checks happen
- Complex `fetchingRoleRef` guards created edge cases where role wouldn't resolve

**Layer 2: Canvas Drawing Never Re-runs**
- Navigation component uses canvas to draw icons (add button, user icon)
- The `useEffect` for drawing had empty dependencies `[]`
- Canvas draws once on mount, but admin button might not be in DOM yet
- When role resolves and button mounts, canvas never redraws to show it

## Solution

**Layer 1 Fix - Simplified Role Resolution:**
- Removed complex `fetchingRoleRef` guards from AuthContext
- Added dedicated `useEffect` that watches `user` changes and resolves role
- Clean separation: auth effect sets user → user effect resolves role
- Role resolution tries metadata first (fast), then falls back to database

**Layer 2 Fix - Reactive Canvas Drawing:**
- Added `loading`, `roleLoading`, `isAdmin`, `isAuthenticated` to canvas useEffect dependencies
- Canvas now redraws when auth state changes
- Admin button renders when role is resolved, canvas draws its icon

**Gate Fix:**
- Updated admin button condition: `mounted && !loading && !roleLoading && isAdmin`
- This ensures we wait for both session AND role before showing admin UI

## Files Changed

- `src/context/AuthContext.tsx` - Simplified role resolution with dedicated user-watching effect
- `src/components/ui/Navigation.tsx` - Added reactive canvas drawing + updated button gate
- `src/app/admin/new-entity/page.tsx` - Added `roleLoading` check before redirect

## Testing

- Logged in as admin user
- Verified console logs show proper flow: `[Auth] Auth state changed → [Auth] Using metadata role`
- Add Entity button appears immediately after login without page refresh
- Logout button works - clears session and redirects to home
- Page refresh maintains auth state correctly
- Non-admin users don't see admin button

## Branch

`claude/fix-entity-button-logout-019NWdFAGAfRGM9a44fLq8wV`

## Commits

- `0a5ed50` - Fix two-layer auth bug: role resolution + canvas redraw
- `1bf3ba6` - Fix border crossing: wait for roleLoading before checking isAdmin
- `80793e5` - Fix auth hydration with mounted state guard
- `37ec247` - Fix role persistence on page refresh by using lazy supabase client

## Product Learning

SSR/Client hydration creates "two nations with different laws"—auth state that works on the server may not be immediately available on the client. The pattern of using a `mounted` guard ensures we don't trust anything until we have proof we're on the client. Additionally, canvas-based UI requires careful dependency management—drawing effects must re-run when the data they visualize changes, not just on initial mount. For auth-dependent UI, always gate on ALL loading states (`loading && roleLoading`) before checking permissions.

Stakeholders: Frontend developers working with Supabase Auth + Next.js App Router.
