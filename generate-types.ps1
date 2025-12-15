# Generate Supabase TypeScript types (PowerShell)
# This script generates types from your Supabase database and updates database.types.ts

Write-Host "Generating Supabase TypeScript types..." -ForegroundColor Cyan

# Option 1: Using Supabase CLI with linked project (recommended)
# First, make sure you're linked: supabase link --project-ref YOUR_PROJECT_REF
supabase gen types typescript --linked | Out-File -FilePath "src/lib/database.types.ts" -Encoding utf8

# Option 2: Using Supabase CLI with project ID (if not linked)
# Uncomment and replace YOUR_PROJECT_ID:
# supabase gen types typescript --project-id YOUR_PROJECT_ID | Out-File -FilePath "src/lib/database.types.ts" -Encoding utf8

# Option 3: Using Supabase Management API
# Uncomment and replace YOUR_PROJECT_REF and YOUR_ACCESS_TOKEN:
# $headers = @{ "Authorization" = "Bearer YOUR_ACCESS_TOKEN" }
# Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/types/typescript" -Headers $headers | Out-File -FilePath "src/lib/database.types.ts" -Encoding utf8

Write-Host "Types generated successfully!" -ForegroundColor Green
Write-Host "File updated: src/lib/database.types.ts" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify that forge_sessions, forge_generations, and forge_costs tables are in the generated types"
Write-Host "2. Run: npm run build"
Write-Host "3. If build succeeds, commit the changes"
