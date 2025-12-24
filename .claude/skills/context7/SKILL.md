---
name: context7-docs
description: Fetch up-to-date, version-specific documentation and code examples for any library or framework. Use this skill when you need current documentation for a library, framework, or API that may have changed since your training data. Triggers on requests like "use context7", "get docs for [library]", "how do I use [library] with context7", or when you encounter potentially outdated API usage.
---

# Context7 Documentation Retrieval Skill

This skill provides access to Context7, a service that delivers up-to-date, version-specific documentation and code examples directly into your context. Use this instead of relying on potentially outdated training data.

## When to Use This Skill

- When working with libraries/frameworks that update frequently (React, Next.js, Supabase, etc.)
- When the user explicitly requests "use context7" or "get docs"
- When you encounter code that might use deprecated APIs
- When implementing features with libraries you haven't used recently
- When the user asks about specific library versions

## How to Use Context7

### Method 1: PowerShell Script (Windows)

```powershell
# From project root
.\.claude\skills\context7\fetch-docs.ps1 "next.js" 5000
.\.claude\skills\context7\fetch-docs.ps1 "vercel/next.js" 10000
```

### Method 2: Direct API Query

```bash
# Resolve library ID first
curl -s "https://context7.com/api/v1/search?query=LIBRARY_NAME" | head -20

# Then fetch documentation with the resolved ID
curl -s "https://context7.com/api/v1/LIBRARY_ID/llms.txt?tokens=5000"
```

### Method 3: Web Fetch

If terminal is not available:

```
Fetch: https://context7.com/api/v1/search?query=LIBRARY_NAME
Then: https://context7.com/api/v1/LIBRARY_ID/llms.txt?tokens=5000
```

## API Reference

### Search for Libraries

```
GET https://context7.com/api/v1/search?query={library_name}
```

Returns a list of matching libraries with their IDs.

### Get Documentation

```
GET https://context7.com/api/v1/{library_id}/llms.txt?tokens={max_tokens}
```

Parameters:

- `library_id`: The resolved library identifier (e.g., "vercel/next.js", "supabase/supabase-js")
- `tokens`: Maximum tokens to return (default: 5000, max: 15000)

## Atlas Stack Library IDs

| Library | Context7 ID | Description |
|---------|-------------|-------------|
| Next.js | `vercel/next.js` | App Router, Server Components |
| React | `facebook/react` | React 19 hooks, Server Components |
| Supabase JS | `supabase/supabase-js` | Auth, Database, Realtime |
| Tailwind CSS | `tailwindlabs/tailwindcss` | Utility-first CSS |
| Anthropic SDK | `anthropics/anthropic-sdk-typescript` | Claude API |
| Google GenAI | `google/generative-ai` | Gemini API |

See `LIBRARIES.md` for complete reference.

## Workflow

1. **Identify the library** the user needs help with
2. **Search for the library** if you don't know its exact Context7 ID
3. **Fetch documentation** with an appropriate token limit
4. **Use the retrieved docs** to provide accurate, up-to-date answers

## Token Limit Guidelines

- Quick reference: 2000-3000 tokens
- Standard usage: 5000 tokens (default)
- Comprehensive docs: 10000-15000 tokens
- Balance: Use smaller limits for simple questions, larger for complex implementations

## Example Usage

When user asks: "How do I set up Supabase authentication in Next.js?"

1. Fetch Supabase docs:

```powershell
.\.claude\skills\context7\fetch-docs.ps1 "supabase/supabase-js" 5000
```

2. Fetch Next.js docs:

```powershell
.\.claude\skills\context7\fetch-docs.ps1 "vercel/next.js" 5000
```

3. Combine the retrieved documentation with your knowledge to provide an accurate answer.

## Notes

- Context7 provides documentation scraped from official sources
- Documentation is kept up-to-date automatically
- Free tier: 50 queries/day for personal use
- Focus on code snippets and practical examples over theory

