# ATL-009: Fix Next.js Image Optimization Blocking Supabase Storage URLs

## Problem

Thumbnails uploaded to Supabase Storage were not displaying in the ConstellationView after upload/replacement, even though:
- The thumbnail was successfully uploaded to Supabase
- The database was correctly updated with the Supabase storage URL
- Cache revalidation was working correctly

The issue manifested as blank media areas on entity cards, with no visual indication of the uploaded thumbnail.

### Symptoms

- Thumbnails not appearing in `ConstellationView` after video upload/replacement
- Console errors: `Failed to load resource: the server responded with a status of 400 ()`
- Next.js Image Optimization API returning `400 Bad Request` for Supabase storage URLs
- Error pattern: `GET https://[vercel-domain]/next/image?url=https%3A%2F%2F[supabase-project].supabase.co/storage/v1/object/public/... - 400 (Bad Request)`
- Database logs confirmed correct thumbnail URLs were saved
- Cache revalidation logs confirmed successful invalidation

## Root Causes

1. **Next.js Image Optimization Domain Restriction**:
   - Next.js Image Optimization requires explicit whitelisting of external domains via `images.remotePatterns` in `next.config.ts`
   - Supabase storage URLs (`*.supabase.co`) were not whitelisted
   - Next.js Image Optimization API rejected all requests to Supabase domains with 400 Bad Request
   - This occurred even though the raw Supabase URLs were valid and accessible

2. **Silent Failure Pattern**:
   - The `Image` component from `next/image` failed silently when the optimization API returned 400
   - No visible error in the UI, just blank media areas
   - Error only visible in browser DevTools console

3. **Build-Time Configuration Missing**:
   - The `next.config.ts` file lacked `images.remotePatterns` configuration
   - This is a build-time configuration that must be set before deployment
   - Runtime fixes (like cache revalidation) cannot resolve this issue

## Solution

Added Supabase domain whitelist to Next.js configuration:

1. **Updated `next.config.ts`**:
   - Added `images.remotePatterns` configuration
   - Whitelisted `*.supabase.co` domains with `/storage/v1/object/public/**` path pattern
   - This allows Next.js Image Optimization to process Supabase storage URLs

2. **Fixed Variable Name Conflicts** (build error):
   - Resolved Turbopack build errors from debug instrumentation
   - Renamed `path` module import to `pathModule` to avoid conflict with request body `path`
   - Renamed request body `path` to `reqPath` for clarity
   - Used unique variable names in catch block to avoid redeclaration errors

## Files Changed

- `next.config.ts`
  - Added `images.remotePatterns` configuration (lines 13-19)
  - Whitelisted `*.supabase.co` domains with `/storage/v1/object/public/**` path pattern

- `src/app/api/revalidate/route.ts`
  - Fixed variable name conflicts in debug instrumentation
  - Renamed `path` module to `pathModule`
  - Renamed request body `path` to `reqPath`

## Testing

- ✅ Thumbnails display correctly in ConstellationView after upload
- ✅ No 400 errors in browser console for Supabase image URLs
- ✅ Next.js Image Optimization successfully processes Supabase storage URLs
- ✅ Build completes successfully on Vercel
- ✅ Cache revalidation still works correctly

## Branch

`main`

## Commits

- `a1b400b` - "Fix thumbnail display: Add Supabase domain to Next.js image config"
- `7f4d5fb` - "Fix build error: Resolve variable name conflicts in revalidate route"

## Product Learning

**External Domain Whitelisting for Next.js Image Optimization**: When using Next.js `Image` component with external image sources (like Supabase Storage, S3, CDNs), you must explicitly whitelist those domains in `next.config.ts` using `images.remotePatterns`. This is a security feature that prevents arbitrary external image processing. The configuration must be set at build time and cannot be changed at runtime.

**Pattern for Supabase Storage URLs**: Supabase storage URLs follow the pattern `https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]`. Use a wildcard pattern `*.supabase.co` with path pattern `/storage/v1/object/public/**` to whitelist all Supabase storage buckets.

**Silent Failure Detection**: When images fail to load in Next.js, check the browser console for 400/403 errors from the `/next/image` endpoint. These errors indicate domain whitelisting issues and are not visible in the UI. Always verify external image domains are configured before deployment.

**Build-Time vs Runtime Configuration**: Some Next.js features (like image domain whitelisting) are build-time only. These must be configured before deployment and cannot be fixed with runtime code changes. Always verify build configuration when debugging image loading issues.
