# Generate Supabase TypeScript Types

## Quick Start

Run one of these commands to generate types from your Supabase database:

### Option 1: Using Supabase CLI (Recommended)

**If you have Supabase CLI installed and linked:**

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

**If not linked, use your project ID:**

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

### Option 2: Using Scripts

**On macOS/Linux:**
```bash
chmod +x generate-types.sh
./generate-types.sh
```

**On Windows (PowerShell):**
```powershell
.\generate-types.ps1
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Scroll to **TypeScript types**
4. Copy the generated types
5. Replace the contents of `src/lib/database.types.ts`

## Verify Types Were Generated

After running the command, check that `src/lib/database.types.ts` includes:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      forge_sessions: { ... }
      forge_generations: { ... }
      forge_costs: { ... }
    }
  }
}
```

## Next Steps

1. **Verify the build:**
   ```bash
   npm run build
   ```

2. **If build succeeds**, all TypeScript errors should be resolved!

3. **Commit the changes:**
   ```bash
   git add src/lib/database.types.ts src/app/api/forge/
   git commit -m "Migrate Forge API routes to use generated Supabase types"
   ```

## Troubleshooting

### "Command not found: supabase"
Install Supabase CLI:
```bash
npm install -g supabase
```

### "Project not linked"
Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Types not updating
- Make sure tables exist in your Supabase database
- Check that you're using the correct project ID/ref
- Verify the output file path is correct

### Build still failing
- Check that all `@ts-ignore` comments were removed (they should be)
- Verify the generated types match your actual schema
- Run `npm run build` to see specific errors
