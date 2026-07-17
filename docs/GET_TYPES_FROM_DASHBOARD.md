# Get Types from Supabase Dashboard

## Quick Steps:

1. **Go to your Supabase project dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Settings → API:**
   - Click on "Settings" in the left sidebar
   - Click on "API" in the settings menu

3. **Copy TypeScript types:**
   - Scroll down to the "TypeScript types" section
   - Click "Copy" button

4. **Paste into database.types.ts:**
   - Open `src/lib/database.types.ts` in your editor
   - Replace the entire contents with the copied types
   - Save the file

5. **Verify the types include Forge tables:**
   - Search for `forge_sessions` in the file
   - Search for `forge_generations` in the file
   - Search for `forge_costs` in the file
   - If all three are found, you're good!

6. **Test the build:**
   ```bash
   npm run build
   ```

That's it! This is the easiest method and doesn't require the CLI.
