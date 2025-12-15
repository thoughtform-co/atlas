#!/bin/bash
# Generate Supabase TypeScript types
# This script generates types from your Supabase database and updates database.types.ts

echo "Generating Supabase TypeScript types..."

# Option 1: Using Supabase CLI with linked project (recommended)
# First, make sure you're linked: supabase link --project-ref YOUR_PROJECT_REF
supabase gen types typescript --linked > src/lib/database.types.ts

# Option 2: Using Supabase CLI with project ID (if not linked)
# Uncomment and replace YOUR_PROJECT_ID:
# supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# Option 3: Using Supabase Management API
# Uncomment and replace YOUR_PROJECT_REF and YOUR_ACCESS_TOKEN:
# curl -X GET \
#   "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/types/typescript" \
#   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
#   > src/lib/database.types.ts

echo "Types generated successfully!"
echo "File updated: src/lib/database.types.ts"
echo ""
echo "Next steps:"
echo "1. Verify that forge_sessions, forge_generations, and forge_costs tables are in the generated types"
echo "2. Run: npm run build"
echo "3. If build succeeds, commit the changes"
