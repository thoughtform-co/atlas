# Common Library IDs for Context7

This file contains commonly used library IDs for quick reference.

## Atlas Project Stack

| Library | Context7 ID | Description |
|---------|-------------|-------------|
| Next.js | `vercel/next.js` | React framework (App Router, Server Actions) |
| React | `facebook/react` | UI library (React 19 hooks) |
| Supabase JS | `supabase/supabase-js` | Supabase client for JS |
| Tailwind CSS | `tailwindlabs/tailwindcss` | Utility-first CSS framework |
| Anthropic SDK | `anthropics/anthropic-sdk-typescript` | Claude API client |
| Google GenAI | `google/generative-ai` | Gemini API |
| Replicate | `replicate/replicate-js` | Model hosting API |

## Frontend Frameworks

| Library | Context7 ID |
|---------|-------------|
| Next.js | `vercel/next.js` |
| React | `facebook/react` |
| Vue.js | `vuejs/vue` |
| Svelte | `sveltejs/svelte` |
| Angular | `angular/angular` |
| Astro | `withastro/astro` |
| Remix | `remix-run/remix` |

## Styling

| Library | Context7 ID |
|---------|-------------|
| Tailwind CSS | `tailwindlabs/tailwindcss` |
| Styled Components | `styled-components/styled-components` |
| Emotion | `emotion-js/emotion` |
| Sass | `sass/sass` |

## State Management

| Library | Context7 ID |
|---------|-------------|
| Zustand | `pmndrs/zustand` |
| Redux | `reduxjs/redux` |
| Jotai | `pmndrs/jotai` |
| TanStack Query | `tanstack/query` |

## Backend / Database

| Library | Context7 ID |
|---------|-------------|
| Supabase JS | `supabase/supabase-js` |
| Prisma | `prisma/prisma` |
| Drizzle | `drizzle-team/drizzle-orm` |

## AI / ML

| Library | Context7 ID |
|---------|-------------|
| Vercel AI SDK | `vercel/ai` |
| Anthropic SDK | `anthropics/anthropic-sdk-typescript` |
| OpenAI | `openai/openai-node` |
| Google GenAI | `google/generative-ai` |
| LangChain | `langchain-ai/langchainjs` |

## Animation

| Library | Context7 ID |
|---------|-------------|
| Framer Motion | `framer/motion` |
| GSAP | `greensock/gsap` |
| React Spring | `pmndrs/react-spring` |

## Testing

| Library | Context7 ID |
|---------|-------------|
| Jest | `jestjs/jest` |
| Vitest | `vitest-dev/vitest` |
| Playwright | `microsoft/playwright` |
| Cypress | `cypress-io/cypress` |

## Utilities

| Library | Context7 ID |
|---------|-------------|
| Lodash | `lodash/lodash` |
| Date-fns | `date-fns/date-fns` |
| Zod | `colinhacks/zod` |

---

## Quick Fetch Examples

```powershell
# Atlas stack essentials
.\.claude\skills\context7\fetch-docs.ps1 "vercel/next.js" 5000
.\.claude\skills\context7\fetch-docs.ps1 "facebook/react" 5000
.\.claude\skills\context7\fetch-docs.ps1 "supabase/supabase-js" 5000

# AI SDKs
.\.claude\skills\context7\fetch-docs.ps1 "anthropics/anthropic-sdk-typescript" 5000
.\.claude\skills\context7\fetch-docs.ps1 "google/generative-ai" 5000
```

