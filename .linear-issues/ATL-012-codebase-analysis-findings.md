# Issue Template: [ATL-012] Codebase Analysis - Critical and QoL Findings

**Status:** RESOLVED  
**Created:** 2025-12-22  
**Resolved:** 2025-12-22

---

## Problem

A codebase analysis surfaced multiple security and quality-of-life issues. The most critical are authorization gaps on service-role endpoints and missing webhook signature verification. There is also an XSS risk in admin chat rendering. Several QoL improvements would reduce drift and prevent regressions.

### User Impact

- Unauthorized users may create or update domains and mass-update denizens due to missing auth checks on service-role routes.
- Any authenticated user can perform admin-level mutations (create/update/delete denizens, rename classes) because service-role writes are not gated by admin checks.
- Webhook spoofing could mark generations as completed, inject URLs, and manipulate cost accounting.
- Admin chat UI renders unsanitized HTML, creating a potential stored XSS vector.
- Inconsistent authorization and validation patterns increase maintenance risk and regressions.

### Visual Evidence

N/A (code-level findings).

---

## Root Causes

1. Service-role routes lack authentication/authorization checks.
2. Admin endpoints use service-role clients but only require basic auth, not admin roles.
3. Webhook endpoint accepts unsigned payloads despite noting signature verification.
4. Client UI uses `dangerouslySetInnerHTML` on untrusted content without sanitization.
5. Authorization and request validation are not centralized, leading to inconsistent enforcement.

---

## Attempted Solutions

None (analysis only).

---

## Relevant Components

- `src/app/api/domains/route.ts` - Unauthenticated POST with service role key.
- `src/app/api/domains/[id]/route.ts` - Unauthenticated PUT with service role key.
- `src/app/api/admin/denizens/route.ts` - Writes only gated by `requireAuth`.
- `src/app/api/admin/denizens/[id]/route.ts` - Writes only gated by `requireAuth`.
- `src/app/api/admin/entity-classes/route.ts` - Class rename uses service role key with only auth gating.
- `src/app/api/forge/webhook/route.ts` - Signature verification not implemented on service-role endpoint.
- `src/components/admin/ArchivistChat.tsx` - `dangerouslySetInnerHTML` on untrusted content.
- `src/lib/data.ts` - Service-role client used for write paths without admin checks.

---

## Solution

Applied consistent authorization pattern using existing `isUserAdmin()` utility across all affected routes:

### 1. Domain Routes (`/api/domains`)
- **POST**: Added `requireAuth()` + `isUserAdmin()` check before allowing domain creation
- **PUT**: Added `requireAuth()` + `isUserAdmin()` check before allowing domain updates
- GET remains public (read-only, intentional)

### 2. Admin Denizen Routes (`/api/admin/denizens`)
- **POST**: Added `isUserAdmin()` check after existing `requireAuth()`
- **PUT**: Added `isUserAdmin()` check after existing `requireAuth()`
- **DELETE**: Added `isUserAdmin()` check after existing `requireAuth()`

### 3. Entity Classes Route (`/api/admin/entity-classes`)
- **PUT**: Added `isUserAdmin()` check after existing `requireAuth()`

### 4. Forge Webhook (`/api/forge/webhook`)
- Added `verifyWebhookSignature()` function using HMAC-SHA256
- Validates `webhook-signature` header against `REPLICATE_WEBHOOK_SECRET` env var
- Uses timing-safe comparison to prevent timing attacks
- Graceful degradation: logs warning if secret not configured (allows rollout)

### 5. ArchivistChat XSS Fix
- Added `escapeHtml()` function to escape `& < > " '` characters
- Added `renderSafeMarkdown()` that escapes HTML first, then applies markdown transforms
- Replaced inline `dangerouslySetInnerHTML` transform with safe renderer

---

## Files Changed

- `src/app/api/domains/route.ts` - Added auth + admin check to POST
- `src/app/api/domains/[id]/route.ts` - Added auth + admin check to PUT
- `src/app/api/admin/denizens/route.ts` - Added admin check to POST
- `src/app/api/admin/denizens/[id]/route.ts` - Added admin check to PUT, DELETE
- `src/app/api/admin/entity-classes/route.ts` - Added admin check to PUT
- `src/app/api/forge/webhook/route.ts` - Added HMAC-SHA256 signature verification
- `src/components/admin/ArchivistChat.tsx` - Added HTML escaping before markdown render

---

## Testing

Static analysis only. Runtime testing recommended:
1. Verify non-admin users receive 403 on admin routes
2. Verify unauthenticated users receive 401 on protected routes
3. Test webhook with valid/invalid signatures (requires `REPLICATE_WEBHOOK_SECRET`)
4. Test chat with XSS payloads like `<script>alert(1)</script>` to confirm escaping

---

## Environment Variables

New optional variable for webhook security:
- `REPLICATE_WEBHOOK_SECRET` - Signing secret from Replicate dashboard for webhook verification

---

## Product Learning

**Principle: Consistent authorization patterns prevent security gaps.**

The existing `isUserAdmin()` utility in `src/lib/auth/admin-check.ts` was correctly used in some routes (analyze, upload, prompts) but not others (denizens, domains, entity-classes). This inconsistency created authorization gaps despite having the right abstractions available.

**Actionable insight:** When adding new admin routes, always follow the existing pattern:
```typescript
const user = await requireAuth();
if (!user) return 401;

const isAdmin = await isUserAdmin(user.id);
if (!isAdmin) return 403;

// ... proceed with admin operation
```

---

## Notes

- Webhook signature verification uses graceful degradation (warns if secret missing) to allow incremental deployment
- XSS fix uses HTML entity escaping rather than a sanitization library to avoid new dependencies
- All routes now follow the same auth → admin check → operation pattern for consistency
