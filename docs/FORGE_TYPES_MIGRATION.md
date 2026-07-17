# Long-Term Solution: Migrating Forge API Routes to Generated Types

## Overview

Currently, the Forge API routes use `@ts-ignore` comments and manual type interfaces because the Supabase database types don't include the new Forge tables. This guide shows how to properly generate types and migrate the code.

## Step 1: Generate Database Types

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your project** (if using Supabase CLI locally):
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Generate types**:
   ```bash
   supabase gen types typescript --linked > src/lib/database.types.ts
   ```

   Or if using a remote project:
   ```bash
   supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
   ```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Scroll to **TypeScript types**
4. Copy the generated types
5. Replace the contents of `src/lib/database.types.ts`

### Option C: Using Supabase Management API

```bash
curl -X GET \
  'https://api.supabase.com/v1/projects/{project-ref}/types/typescript' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  > src/lib/database.types.ts
```

## Step 2: Verify Generated Types

After generating, check that `database.types.ts` includes:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      forge_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      forge_generations: {
        Row: {
          id: string
          session_id: string
          denizen_id: string | null
          source_image_url: string
          video_url: string | null
          thumbnail_url: string | null
          prompt: string
          negative_prompt: string | null
          resolution: string
          duration: number
          seed: number | null
          status: string
          replicate_prediction_id: string | null
          cost_cents: number | null
          approved: boolean
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      forge_costs: {
        Row: {
          id: string
          user_id: string
          generation_id: string
          amount_cents: number
          model: string
          created_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
    }
  }
}
```

## Step 3: Update Code - Remove Workarounds

### Before (Current Code with Workarounds)

```typescript
// src/app/api/forge/generate/route.ts

// Types for forge tables (not yet in generated types)
interface ForgeGeneration {
  id: string;
  session_id: string;
  [key: string]: unknown;
}

interface ForgeSession {
  id: string;
  user_id: string;
}

export async function POST(request: NextRequest) {
  // ...
  
  // @ts-ignore - forge_sessions table not in generated types yet
  const { data: session, error: sessionError } = await supabase
    .from('forge_sessions')
    .select('id')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();
    
  // @ts-ignore - forge_generations table not in generated types yet
  const { data: generation, error: insertError } = await supabase
    .from('forge_generations')
    // @ts-ignore - forge_generations table not in generated types yet
    .insert({ /* ... */ })
    .select()
    .single() as { data: ForgeGeneration | null; error: unknown };
}
```

### After (Using Generated Types)

```typescript
// src/app/api/forge/generate/route.ts

// No manual interfaces needed - types come from Database interface
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  // ...
  
  // TypeScript now knows about forge_sessions!
  const { data: session, error: sessionError } = await supabase
    .from('forge_sessions')
    .select('id')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single();
    
  // TypeScript now knows about forge_generations!
  const { data: generation, error: insertError } = await supabase
    .from('forge_generations')
    .insert({
      session_id,
      denizen_id: denizen_id || null,
      source_image_url: image,
      prompt,
      negative_prompt: negative_prompt || null,
      resolution,
      duration,
      seed: seed || null,
      status: 'pending',
    })
    .select()
    .single();
    
  // Type checking works automatically!
  if (generation) {
    console.log(generation.id); // ✅ TypeScript knows this exists
    console.log(generation.session_id); // ✅ TypeScript knows this exists
  }
}
```

## Step 4: Migration Checklist

For each file in `src/app/api/forge/`, do the following:

### Files to Update:
- [ ] `approve/route.ts`
- [ ] `cost/route.ts`
- [ ] `generate/route.ts`
- [ ] `sessions/route.ts`
- [ ] `sessions/[id]/route.ts`
- [ ] `webhook/route.ts`

### For Each File:

1. **Remove manual type interfaces** at the top:
   ```typescript
   // DELETE these:
   interface ForgeGeneration { ... }
   interface ForgeSession { ... }
   interface ForgeCost { ... }
   interface SessionWithGenerations { ... }
   ```

2. **Remove all `@ts-ignore` comments**:
   ```typescript
   // DELETE lines like:
   // @ts-ignore - forge_sessions table not in generated types yet
   ```

3. **Remove type assertions**:
   ```typescript
   // CHANGE FROM:
   .single() as { data: ForgeGeneration | null; error: unknown };
   
   // TO:
   .single();
   ```

4. **Use generated types directly**:
   ```typescript
   // You can now use:
   type ForgeGeneration = Database['public']['Tables']['forge_generations']['Row'];
   type ForgeGenerationInsert = Database['public']['Tables']['forge_generations']['Insert'];
   type ForgeGenerationUpdate = Database['public']['Tables']['forge_generations']['Update'];
   ```

## Step 5: Example - Complete Migration

### `approve/route.ts` - Before:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Type for forge_generations table (not yet in generated types)
interface ForgeGeneration {
  id: string;
  session_id: string;
  approved: boolean;
}

interface ForgeSession {
  id: string;
  user_id: string;
}

export async function POST(request: NextRequest) {
  // ...
  
  // @ts-ignore - forge_generations table not in generated types yet
  const { data: generation, error: findError } = await supabase
    .from('forge_generations')
    .select('id, session_id')
    .eq('id', generation_id)
    .single() as { data: ForgeGeneration | null; error: unknown };

  // @ts-ignore - forge_sessions table not in generated types yet
  const { data: session, error: sessionError } = await supabase
    .from('forge_sessions')
    .select('user_id')
    .eq('id', generation.session_id)
    .single() as { data: ForgeSession | null; error: unknown };

  // @ts-ignore - forge_generations table not in generated types yet
  const { data: updated, error: updateError } = await supabase
    .from('forge_generations')
    // @ts-ignore - forge_generations table not in generated types yet
    .update({ approved })
    .eq('id', generation_id)
    .select('id, approved')
    .single();
}
```

### `approve/route.ts` - After:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { generation_id, approved } = body;

    if (!generation_id) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status must be a boolean' }, { status: 400 });
    }

    // TypeScript now knows the types automatically!
    const { data: generation, error: findError } = await supabase
      .from('forge_generations')
      .select('id, session_id')
      .eq('id', generation_id)
      .single();

    if (findError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // TypeScript knows generation.session_id exists!
    const { data: session, error: sessionError } = await supabase
      .from('forge_sessions')
      .select('user_id')
      .eq('id', generation.session_id)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TypeScript validates the update object!
    const { data: updated, error: updateError } = await supabase
      .from('forge_generations')
      .update({ approved })
      .eq('id', generation_id)
      .select('id, approved')
      .single();

    if (updateError) {
      console.error('Error updating approval:', updateError);
      return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 });
    }

    return NextResponse.json({ generation: updated });
  } catch (error) {
    console.error('Approve POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Step 6: Benefits After Migration

1. **Full Type Safety**: TypeScript will catch errors at compile time
2. **Autocomplete**: IDE will suggest available fields
3. **Refactoring Safety**: Renaming columns will show errors everywhere
4. **No Workarounds**: Clean, maintainable code
5. **Automatic Updates**: When you regenerate types, all code stays in sync

## Step 7: Automate Type Generation (Optional)

Add a script to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "types:generate": "supabase gen types typescript --linked > src/lib/database.types.ts",
    "types:check": "tsc --noEmit"
  }
}
```

Then run:
```bash
npm run types:generate
```

## Troubleshooting

### Types not updating?
- Make sure you're generating from the correct project
- Check that tables exist in Supabase dashboard
- Verify the output file path is correct

### Type errors after migration?
- Ensure `Database` type is imported where needed
- Check that generated types match your actual schema
- Verify Supabase client is typed: `createServerClient<Database>()`

### Build still failing?
- Run `npm run build` to see specific errors
- Check that all `@ts-ignore` comments are removed
- Verify type assertions are removed

## Summary

The long-term solution is:
1. **Generate types** from your Supabase database
2. **Remove all workarounds** (`@ts-ignore`, manual interfaces, type assertions)
3. **Let TypeScript use the generated types** automatically
4. **Regenerate types** whenever your schema changes

This gives you full type safety, better developer experience, and maintainable code.
