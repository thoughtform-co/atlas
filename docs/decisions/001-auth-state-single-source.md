# ADR-001: Single-Source-of-Truth for Auth State Resolution

## Status

**Accepted** - December 2024

## Context

We experienced a "role resolution storm" where the AuthContext was calling the `user_roles` API from multiple places simultaneously:

1. The `getSession` handler on initial load
2. The `onAuthStateChange` handler on auth events  
3. A `useEffect` that watched `user` changes

This created:
- Dozens of simultaneous requests to `/rest/v1/user_roles`
- `INSUFFICIENT_RESOURCES` errors from Supabase
- Race conditions where role would resolve inconsistently
- Admin UI flickering or not appearing

## Decision

**Role resolution happens in exactly ONE place.**

The pattern:
- `getSession` and `onAuthStateChange` only update `user` and `session` state
- A single dedicated `useEffect` watches `user` changes and calls `resolveRoleForUser`
- `resolveRoleForUser` is the ONLY function that hits the `user_roles` table
- Role resolution tries JWT metadata first (fast), then falls back to database

```typescript
// AuthContext.tsx - simplified pattern

// This is the ONLY function that calls user_roles
const resolveRoleForUser = useCallback(async (user) => {
  // 1. Check JWT metadata first (no API call)
  const metaRole = user?.app_metadata?.role || user?.user_metadata?.role;
  if (metaRole) {
    setRole(metaRole);
    return;
  }
  
  // 2. Fallback to database
  const { data } = await supabase.from('user_roles').select('role')...
  setRole(data?.role || 'user');
}, []);

// Auth handlers only set user state
onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setSession(session);
});

// Single effect resolves role when user changes
useEffect(() => {
  resolveRoleForUser(user);
}, [user, resolveRoleForUser]);
```

## Consequences

### Positive
- At most 1 API call to `user_roles` per page load
- No race conditions in role resolution
- Clear debugging path (`[Auth] User changed → [Auth] Role resolved`)
- Predictable state flow

### Negative
- Slightly more verbose code structure
- Must be careful not to add new role-fetching code paths

## Related Issues

- ATL-003: Fix Role Resolution Storm
- Linear: THO-71

## Applicability

This pattern applies whenever you have:
- Multiple async operations that could trigger the same API call
- State that depends on other state (role depends on user)
- useEffect chains that might create loops

The principle: **One source of truth, one code path.**

