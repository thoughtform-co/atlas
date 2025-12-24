#!/bin/bash
# Context7 Documentation Fetcher
# Usage: ./fetch-docs.sh <library_name_or_id> [tokens]
#
# Examples:
#   ./fetch-docs.sh next.js
#   ./fetch-docs.sh vercel/next.js 10000
#   ./fetch-docs.sh supabase 5000

set -e

LIBRARY="${1:-}"
TOKENS="${2:-5000}"

if [ -z "$LIBRARY" ]; then
    echo "Usage: ./fetch-docs.sh <library_name_or_id> [tokens]"
    echo ""
    echo "Examples:"
    echo "  ./fetch-docs.sh next.js"
    echo "  ./fetch-docs.sh vercel/next.js 10000"
    echo "  ./fetch-docs.sh supabase 5000"
    exit 1
fi

# Check if it looks like a full ID (contains /)
if [[ "$LIBRARY" == *"/"* ]]; then
    LIBRARY_ID="$LIBRARY"
else
    # Search for the library first
    echo "Searching for library: $LIBRARY" >&2
    SEARCH_RESULT=$(curl -s "https://context7.com/api/v1/search?query=$LIBRARY")
    
    # Try to extract the first result's ID
    LIBRARY_ID=$(echo "$SEARCH_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$LIBRARY_ID" ]; then
        echo "Could not find library: $LIBRARY" >&2
        echo "Search result: $SEARCH_RESULT" >&2
        exit 1
    fi
    
    echo "Found library ID: $LIBRARY_ID" >&2
fi

# Fetch the documentation
echo "Fetching docs for: $LIBRARY_ID (tokens: $TOKENS)" >&2
curl -s "https://context7.com/api/v1/$LIBRARY_ID/llms.txt?tokens=$TOKENS"

