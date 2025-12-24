# Atlas Codebase Analysis Report

> Generated: December 24, 2025
> Stack: Next.js 16.0.7 | React 19.2.2 | Supabase 2.86.0 | Tailwind 4.x
> **Documentation Source:** Context7 API (live docs fetched at analysis time)

---

## Executive Summary

Your codebase is well-architected with solid patterns documented in `.sentinel.md`. The Supabase SSR integration is exemplary. However, there are significant opportunities to leverage **React 19's new features** and **Next.js 16's new APIs** that could dramatically improve performance, reduce boilerplate, and enhance UX.

### Key Findings (Updated with Live Docs)

| Area | Status | Priority | New API Available |
|------|--------|----------|-------------------|
| Supabase Auth/SSR | ✅ Excellent | - | `accessToken` option for third-party auth |
| Next.js App Router | ✅ Good | Low | `Form` component, `cacheLife()`, `cacheTag()` |
| React 19 Features | ⚠️ Underutilized | **High** | `useActionState`, `useOptimistic`, `use` |
| Server Actions | ❌ Not Used | **High** | `"use server"` directive now stable |
| AI SDK Streaming | ⚠️ Partial | Low | - |
| Caching Strategy | ⚠️ Aggressive | **High** | `cacheLife()` with predefined profiles |

---

## 1. Supabase Patterns

### What's Working Well

Your Supabase setup follows current best practices:

**✅ Proper SSR Cookie Handling** (`src/lib/supabase-server.ts`)
```typescript
// Correct pattern: async cookies() with getAll/setAll
const cookieStore = await cookies();
return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() { return cookieStore.getAll(); },
    setAll(cookiesToSet) { /* ... */ },
  },
});
```

**✅ Middleware Session Refresh** (`src/middleware.ts`)
- Correctly refreshes session on every request
- Proper cookie forwarding pattern

**✅ Single-Source Auth Architecture** (`src/context/AuthContext.tsx`)
- Well-documented pattern preventing API storms
- Role resolution in dedicated useEffect
- Proper `mounted` guard for hydration

**✅ Admin Client Pattern** (`src/lib/data.ts`)
- Service role key for write operations
- Proper separation of read/write clients

### Recommendations

#### 1.1 Consider Supabase Realtime for Live Updates

**Current:** Manual revalidation via `/api/revalidate`
**Opportunity:** Supabase Realtime for instant entity updates

```typescript
// Example: Real-time entity updates
useEffect(() => {
  const channel = supabase
    .channel('entity-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'denizens'
    }, (payload) => {
      // Update local state instantly
      handleEntityChange(payload);
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}, []);
```

**Impact:** Real-time constellation updates without polling
**Effort:** Medium
**Priority:** Low (nice-to-have)

---

## 2. Next.js 16 Patterns

### What's Working Well

**✅ Async Server Components** (`src/app/page.tsx`)
```typescript
// Good: Proper async server component with error handling
export default async function Home() {
  const [fetchedDenizens, fetchedConnections] = await Promise.all([
    fetchDenizens(),
    fetchConnections(),
  ]);
  // ...
}
```

**✅ Route Handlers** (`src/app/api/`)
- Clean separation of concerns
- Proper error handling
- Auth checks before mutations

### Recommendations

#### 2.1 Use Server Actions with Next.js 16 Form Component

**Current:** All mutations go through API routes
**Opportunity:** Server Actions + `Form` component from Next.js 16 = progressive enhancement

**From Context7 Next.js 16 Docs:**
```typescript
// app/admin/new-entity/page.tsx
import Form from "next/form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

export default function NewEntityPage() {
  async function createEntity(formData: FormData) {
    "use server";
    
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    // ... other fields
    
    await supabase.from('denizens').insert({ name, type, /* ... */ });
    
    revalidatePath("/");
    redirect("/");
  }

  return (
    <Form action={createEntity}>
      <input type="text" name="name" required />
      <select name="type">
        <option value="Guardian">Guardian</option>
        <option value="Wanderer">Wanderer</option>
      </select>
      <button type="submit">Create Entity</button>
    </Form>
  );
}
```

**Benefits (from live docs):**
- `Form` component from `next/form` provides progressive enhancement
- Works without JavaScript (submits as normal form)
- With JS: client-side navigation, maintains scroll position
- Automatic pending state with `useFormStatus`
- Type-safe from client to server

**Where to apply:**
- Entity creation/update forms (`src/app/admin/new-entity/`)
- Prompt management (`src/app/admin/prompts/`)
- Forge session creation

**Impact:** Cleaner code, better UX, accessibility
**Effort:** Medium
**Priority:** High

#### 2.2 Use Next.js 16 `cacheLife()` and `cacheTag()` APIs

**Current:** Aggressive cache bypass
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Issue:** Every page load fetches fresh data from Supabase, even for content that rarely changes.

**From Context7 Next.js 16 Docs - New Cache APIs:**
```typescript
// src/lib/data.ts
"use cache";

import { cacheLife, cacheTag } from "next/cache";

export async function fetchDenizens() {
  "use cache";
  cacheLife("hours"); // Cache 1 hour, 5 min stale time
  cacheTag("denizens");
  
  const client = getDataClient();
  const { data } = await client.from('denizens').select('*');
  return data;
}

export async function fetchDenizenById(id: string) {
  "use cache";
  cacheLife("minutes"); // More frequent updates for single entities
  cacheTag("denizens", `denizen-${id}`);
  
  // ... fetch logic
}
```

**Predefined Cache Profiles (from docs):**
| Profile | Stale | Revalidate | Expire |
|---------|-------|------------|--------|
| `"seconds"` | 30s | 1s | 1m |
| `"minutes"` | 5m | 1m | 1h |
| `"hours"` | 5m | 1h | 1d |
| `"days"` | 5m | 1d | 1w |
| `"weeks"` | 5m | 1w | 30d |
| `"max"` | 5m | 30d | never |

**Invalidation with new APIs:**
```typescript
// src/app/actions/entities.ts
"use server";

import { revalidateTag, updateTag } from "next/cache";

export async function updateEntity(id: string, data: any) {
  await db.denizens.update(id, data);
  
  // Invalidate both the list and specific entity
  revalidateTag("denizens");
  revalidateTag(`denizen-${id}`);
  
  return { success: true };
}
```

**Impact:** Dramatically faster page loads, reduced Supabase calls
**Effort:** Low
**Priority:** High

---

## 3. React 19 Patterns (From Context7 Live Docs)

### Current State

Your components use traditional React patterns:
- 88 `useState` calls across 24 components
- 174 `useCallback/useMemo/useEffect` calls across 30 components
- **0 uses of React 19 new hooks**

### React 19 New APIs Available (from Context7)

React 19 (December 2024) introduces:
- `useActionState` - Form state management with async actions
- `useOptimistic` - Optimistic UI updates
- `use` - Async data consumption in render
- Actions - Server-side mutations via `action` prop

### Recommendations

#### 3.1 Use `useActionState` for Form Submissions

**From Context7 React 19 Docs:**
```typescript
// src/components/admin/EntityForm.tsx
import { useActionState } from 'react';

async function createEntity(previousState, formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  
  // API call
  const response = await fetch('/api/admin/denizens', {
    method: 'POST',
    body: JSON.stringify({ name, type }),
  });
  
  if (!response.ok) {
    return { error: 'Failed to create entity', success: false };
  }
  
  return { error: null, success: true, message: `Created ${name}!` };
}

function EntityForm() {
  const [state, formAction, isPending] = useActionState(createEntity, {
    error: null,
    success: false
  });

  return (
    <form action={formAction}>
      <input name="name" placeholder="Entity name" required />
      <select name="type">
        <option value="Guardian">Guardian</option>
        <option value="Wanderer">Wanderer</option>
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Entity'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">{state.message}</p>}
    </form>
  );
}
```

**Benefits:**
- `isPending` gives you loading state automatically
- `previousState` enables error handling and recovery
- Works with Server Actions for full-stack type safety

**Where to apply:** Entity forms, prompt editor, login modal

#### 3.2 Use `useOptimistic` for Forge Approvals

**From Context7 React 19 Docs:**
```typescript
// src/components/forge/ForgeVideoCard.tsx
import { useOptimistic, useState } from 'react';

function ForgeVideoCard({ generation, onApprove }) {
  const [status, setStatus] = useState(generation.status);
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    status,
    (currentStatus, newStatus: string) => newStatus
  );

  async function handleApprove() {
    // Immediately show approved state
    addOptimisticStatus('approved');
    
    try {
      await onApprove(generation.id);
      setStatus('approved'); // Confirm the optimistic update
    } catch (error) {
      // Optimistic state automatically rolls back on error
      console.error('Approval failed:', error);
    }
  }

  return (
    <div className={optimisticStatus === 'approved' ? styles.approved : ''}>
      <span style={{ opacity: optimisticStatus !== status ? 0.7 : 1 }}>
        {optimisticStatus === 'approved' ? '✓ Approved' : 'Pending'}
      </span>
      <button onClick={handleApprove} disabled={optimisticStatus === 'approved'}>
        Approve
      </button>
    </div>
  );
}
```

**Key insight from docs:** The optimistic state automatically resets if the async operation throws an error.

**Where to apply:**
- `ForgeVideoCard` approval button
- Entity favorite/archive actions
- Any "instant feedback" interactions

**Impact:** Snappier UI, perceived performance improvement
**Effort:** Low per component
**Priority:** High

#### 3.3 Use `use` Hook for Suspense-Based Loading

**From Context7 React 19 Docs:**
```typescript
// For components wrapped in Suspense
import { use, Suspense } from 'react';

function DenizenDetails({ denizenPromise }) {
  const denizen = use(denizenPromise); // Suspends until resolved
  
  return (
    <div>
      <h1>{denizen.name}</h1>
      <p>{denizen.description}</p>
    </div>
  );
}

// Parent component
function DenizenPage({ id }) {
  const denizenPromise = fetchDenizenById(id);
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DenizenDetails denizenPromise={denizenPromise} />
    </Suspense>
  );
}
```

**Best for:** Replacing manual loading state management with Suspense boundaries.

**Impact:** Cleaner code, better loading UX
**Effort:** Medium (requires Suspense boundaries)
**Priority:** Medium

---

## 4. AI SDK Integration

### Current State

**Gemini (`src/lib/ai/gemini.ts`):**
- ✅ Direct SDK usage
- ✅ Proper error handling
- ✅ World context building
- ⚠️ No streaming

**Anthropic (`src/lib/ai/claude.ts`):**
- ✅ Vision analysis
- ✅ Chat completion
- ⚠️ No streaming
- ⚠️ Video analysis sends URL (not content)

### Recommendations

#### 4.1 Consider Vercel AI SDK for Streaming

**Current:** Full response waits for completion
**Opportunity:** Stream responses for better perceived performance

```typescript
// Using Vercel AI SDK
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    system: ARCHIVIST_SYSTEM_PROMPT,
  });
  
  return result.toDataStreamResponse();
}
```

**Where to apply:**
- Archivist chat (would stream responses)
- Entity analysis descriptions

**Impact:** Better UX for long-running AI calls
**Effort:** Medium (SDK change)
**Priority:** Low

#### 4.2 Fix Video Analysis in Claude

**Current Issue:**
```typescript
// claude.ts line 92-96 - Just sends URL as text
{
  type: 'text',
  text: `Video URL: ${videoUrl}`,
}
```

Claude cannot actually fetch and analyze video from a URL this way. For video analysis, you should either:
1. Use Gemini (which handles video better)
2. Extract frames from video and send as images

**Current workaround:** Your Gemini implementation correctly fetches and base64 encodes videos.

---

## 5. Code Quality Observations

### Strengths

1. **Excellent documentation** - `.sentinel.md` captures real lessons learned
2. **Type safety** - Proper TypeScript throughout
3. **Error handling** - Consistent try/catch with logging
4. **Graceful degradation** - Static data fallbacks

### Minor Improvements

#### 5.1 Remove ESLint Disables Where Possible

Found several `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in `src/lib/data.ts`. Consider creating proper type for the Supabase client that includes the `denizen_media` table.

#### 5.2 Console Logs in Production

Several console.log statements without environment guards:
```typescript
// Should be:
if (process.env.NODE_ENV === 'development') {
  console.log('[Auth] Role resolved:', role);
}
```

---

## Priority Action Items (Updated with Live Docs)

### High Priority (Do This Week)

1. **Use Next.js 16 `cacheLife()` and `cacheTag()`** for data fetching
   - Replace `force-dynamic` with declarative cache profiles
   - Add tags for granular invalidation
   - Huge performance win with minimal effort

2. **Implement Server Actions with `Form` component** for entity creation
   - Use `import Form from "next/form"` for progressive enhancement
   - Replace API route boilerplate with `"use server"` functions
   - Forms work without JavaScript enabled

3. **Add `useOptimistic`** to Forge approval flow
   - Instant UI feedback on approve/reject
   - Automatic rollback on error
   - Users perceive app as much faster

### Medium Priority (Next Sprint)

4. **Replace form state management with `useActionState`**
   - Built-in `isPending` state
   - Error handling via `previousState`
   - Works great with Server Actions

5. **Consider Supabase Realtime** for constellation updates
   - Docs show simple channel subscription pattern
   - Would enable live updates without polling

### Low Priority (Backlog)

6. **Add Suspense boundaries with `use` hook**
   - Replace manual loading states where appropriate
   - Better loading UX with streaming

7. **Migrate to Vercel AI SDK** for streaming chat
   - Would improve Archivist chat UX

---

## Files Referenced

| File | Analysis |
|------|----------|
| `src/context/AuthContext.tsx` | Excellent SSR auth pattern |
| `src/lib/supabase-server.ts` | Correct cookie handling |
| `src/middleware.ts` | Proper session refresh |
| `src/lib/data.ts` | Good admin/read client separation |
| `src/app/page.tsx` | Async server component, aggressive caching |
| `src/lib/ai/gemini.ts` | Good video handling |
| `src/lib/ai/claude.ts` | Video URL limitation |

---

## Conclusion

Atlas is a well-built application with thoughtful architecture. The main opportunities are:

1. **Embrace React 19** - New hooks reduce boilerplate and improve UX
2. **Use Server Actions** - Simplify mutations without losing type safety
3. **Optimize caching** - Balance freshness with performance

None of these are urgent - your current patterns work. These recommendations are about incrementally improving developer experience and user experience.

---

## Appendix: Context7 Integration

This analysis was performed using the Context7 skill, which fetches live documentation from library maintainers.

### Documentation Sources Used

| Library | Context7 ID | Tokens Fetched |
|---------|-------------|----------------|
| Next.js 16 | `vercel/next.js` | 8000 |
| React 19 | `facebook/react` | 8000 |
| Supabase JS | `supabase/supabase-js` | 8000 |

### How to Fetch Updated Docs

```powershell
# From Atlas project root
.\.claude\skills\context7\fetch-docs.ps1 "vercel/next.js" 5000
.\.claude\skills\context7\fetch-docs.ps1 "facebook/react" 5000
.\.claude\skills\context7\fetch-docs.ps1 "supabase/supabase-js" 5000
```

### Key APIs Discovered via Context7

**Next.js 16 (not in training data):**
- `import Form from "next/form"` - Progressive enhancement
- `cacheLife("hours")` - Declarative cache profiles
- `cacheTag("entities")` - Granular invalidation
- `updateTag()`, `refresh()` - New cache APIs

**React 19 (released December 2024):**
- `useActionState` - Form state + async actions
- `useOptimistic` - Optimistic UI updates
- `use` - Suspense-based data consumption
- Actions via `action` prop on forms

---

*Report generated by codebase analysis with Context7 live documentation.*
*Documentation fetched: December 24, 2025*

