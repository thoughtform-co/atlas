# Context7 Documentation Fetcher for Windows PowerShell
# Usage: .\fetch-docs.ps1 <library_name_or_id> [tokens]
#
# Examples:
#   .\fetch-docs.ps1 "next.js"
#   .\fetch-docs.ps1 "vercel/next.js" 10000
#   .\fetch-docs.ps1 "supabase" 5000

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Library,
    
    [Parameter(Mandatory=$false, Position=1)]
    [int]$Tokens = 5000
)

$ErrorActionPreference = "Stop"

# Check if it looks like a full ID (org/repo format)
if ($Library -match "^[\w\.-]+/[\w\.-]+$") {
    # Direct library ID provided - use it as-is
    $LibraryId = "/$Library"
    Write-Host "Using library ID: $LibraryId" -ForegroundColor Green
} else {
    # Search for the library first
    Write-Host "Searching for library: $Library" -ForegroundColor Yellow
    
    try {
        $searchResult = Invoke-RestMethod -Uri "https://context7.com/api/v1/search?query=$Library" -Method Get
        
        if ($searchResult -and $searchResult.results -and $searchResult.results.Count -gt 0) {
            # Prefer results that look like GitHub repos (org/repo format)
            # and prioritize by benchmark score
            $preferredResult = $searchResult.results | Where-Object { 
                $_.id -match "^/[\w\.-]+/[\w\.-]+$" -and $_.id -notmatch "^/websites/" -and $_.id -notmatch "^/llmstxt/"
            } | Sort-Object -Property benchmarkScore -Descending | Select-Object -First 1
            
            if ($preferredResult) {
                $LibraryId = $preferredResult.id
                Write-Host "Found: $LibraryId (benchmark: $($preferredResult.benchmarkScore)%)" -ForegroundColor Green
            } else {
                # Fall back to highest benchmark score
                $best = $searchResult.results | Sort-Object -Property benchmarkScore -Descending | Select-Object -First 1
                $LibraryId = $best.id
                Write-Host "Found: $LibraryId (benchmark: $($best.benchmarkScore)%)" -ForegroundColor Green
            }
        } else {
            Write-Error "No library found matching '$Library'"
            exit 1
        }
    } catch {
        Write-Error "Failed to search: $_"
        exit 1
    }
}

$url = "https://context7.com$LibraryId/llms.txt?tokens=$Tokens"
Write-Host "Fetching documentation from: $url" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing
    Write-Output $response.Content
} catch {
    Write-Error "Failed to fetch docs: $_"
    exit 1
}

