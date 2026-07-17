React Doctor v0.7.7

  
Failed to parse oxlint output: {"message":"Failed to open file C:\\Users\\buyss\\Manifold Delta\\Artifacts\\03_atlas.thoughtform\\src\\lib\\database.types.ts with error \"stream did not contain valid UTF-8\"","severity":"error","causes":[],"labels":[],"related":[]}

  ⚠ Security: BaaS authority map shipped in browser artifact ×4
    A browser artifact exposes Firebase/Supabase config
    together with sensitive collections or authorization fields.
    → Client BaaS config is often public, but shipped
    collection names plus owner, role, tenant, or admin fields
    give attackers a precise authorization map. Verify
    rules/RLS enforce every boundary server-side.
    Curl with no cache & follow the canonical fix and false positive check recipe before fixing: https://react.doctor/docs/rules/react-doctor/artifact-baas-authority-surface

    .next/static/chunks/04be63db79825ac0.js:37

    .next/static/chunks/26034b63551488a6.js:1

    .next/static/chunks/5e5b4f0a0785d144.js:1

    .next/static/chunks/a2c382bcea3a2e70.js:1

  ⚠ Security: react-doctor/no-vulnerable-react-server-components
    next@16.0.7 bundles a React Server Components runtime
    affected by a high-severity denial-of-service vulnerability
    (CVE-2026-23870) patched in Next.js 16.2.6
    → Upgrade Next.js to 16.2.6 (or newer). Next.js bundles its
    own React Server Components runtime, so bumping Next.js
    ships the fix. Run `npm install next@16.2.6`. See
    https://vercel.com/changelog/next-js-may-2026-security-release

    package.json

  ✖ Security: Permissive Supabase RLS policy ×4
    Supabase policy SQL disables RLS, permits writes broadly,
    or references a service-role bypass.
    → Keep public-read policies explicit, but gate inserts,
    updates, deletes, and service-role bypasses behind
    `auth.uid()` plus trusted tenant membership.
    Curl with no cache & follow the canonical fix and false positive check recipe before fixing: https://react.doctor/docs/rules/react-doctor/supabase-rls-policy-risk

    supabase/migrations/001_create_tables.sql:83
    ┌──────────────────────────────────────────────────────────────┐
    │   82 | -- Create policies for authenticated write access (f… │
    │ > 83 | CREATE POLICY "Allow authenticated insert to denizen… │
    │      | ^                                                     │
    │   84 |   ON denizens FOR INSERT                              │
    └──────────────────────────────────────────────────────────────┘

    supabase/migrations/002_add_media_storage.sql:54
    ┌──────────────────────────────────────────────────────────────┐
    │   53 | -- Create policies for authenticated write access     │
    │ > 54 | CREATE POLICY "Allow authenticated insert to denizen… │
    │      | ^                                                     │
    │   55 |   ON denizen_media FOR INSERT                         │
    └──────────────────────────────────────────────────────────────┘

    supabase/migrations/20241207_create_archive_log.sql:63
    ┌──────────────────────────────────────────────────────────────┐
    │   62 | -- Allow authenticated write access                   │
    │ > 63 | CREATE POLICY "Allow authenticated insert to archive… │
    │      | ^                                                     │
    │   64 |   ON archive_log FOR INSERT                           │
    └──────────────────────────────────────────────────────────────┘

    supabase/migrations/20241213_create_domains_table.sql:38
    ┌──────────────────────────────────────────────────────────────┐
    │   37 | -- Allow authenticated write access (admin only in p… │
    │ > 38 | CREATE POLICY "Allow authenticated insert to domains" │
    │      | ^                                                     │
    │   39 |   ON domains FOR INSERT                               │
    └──────────────────────────────────────────────────────────────┘


  ────────────────────────────────────────────────────────────

  All 9 issues

  Security › 4 errors, 5 warnings

Agent guidance
  - Treat React Doctor diagnostics as starting hypotheses. Read the relevant code before confirming or suppressing each finding.
  - For each group, decide true positive, false positive, or needs-human-review, then assign high/medium/low confidence.
  - Do not suppress a finding without evidence from the file in question. Confidence requires code context.
  - Understand the root cause before editing. Fix the underlying code instead of changing react-doctor config or suppressing rules unless explicitly asked.
  - Investigate deeply where relevant: race conditions, security-sensitive flows, state propagation, multi-file refactors, and downstream dependency chains.
  - Ignore pure style preferences, theoretical issues without real impact, missing features, and unrelated pre-existing code.
  - Start with high-confidence fixes that preserve behavior. Leave low-confidence or product-dependent changes as notes.
  - Run `npx react-doctor@latest --verbose --scope changed` before and after changes, plus relevant tests after each focused batch.
  - When available, spawn subagents or isolated worktrees for independent rule families, then review and merge only the best safe fixes.
  - Split unrelated, broad, or behavior-changing work into separate PRs/branches instead of one large cleanup.
  - When one rule spans dozens of files (a migration-scale change), fix a representative sample first, confirm the recipe holds, and get the code owner's sign-off before changing the rest. Don't mass-fix a broad pattern in one unreviewed pass.
  - For confirmed issues that cannot be fixed now, create GitHub issues with the rule, file/line, confidence, impact, and proposed fix.
  - If a fix needs an API, UX, or architecture decision, stop and ask before editing.

  React Doctor (https://react.doctor)
  Score unavailable (could not reach the score API). Want something custom to your company? Contact us at https://react.doctor/enterprise.

  Full diagnostics written to C:\Users\buyss\AppData\Local\Temp\react-doctor-6b66f731-b9a0-48df-9081-70fe075b5ca4

  Note: lint checks failed — score may be incomplete.

  ────────────────────────────────────────────────────────────

  Share: https://react.doctor/share?p=atlas&e=4&w=5&f=9
  Tell others how you did on socials

  Docs: https://react.doctor/docs
  Learn more about fixing issues, setting up CI/CD, and
  configuring rules with a config file

  GitHub: https://github.com/millionco/react-doctor
  Report issues and star the repository!


---

## Comparison vs baseline (before → after)

**Tool:** react-doctor@0.7.7 · same command, same coverage caveat (oxlint still
can't parse the UTF-16 `database.types.ts`, so the React-lint phase is skipped
in both runs — the delta below is valid for the non-lint analyzers).

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Total issues | 9 | 9 | 0 |
| Security errors | 4 | 4 | 0 |
| Security warnings | 5 | 5 | 0 |

**No regressions, nothing newly introduced.** The chrome harmonization + safe
refactor batch (dead-code deletion, error/loading boundaries, API hardening,
service-client centralization, housekeeping) touched none of the 9 flagged
files:
- Permissive Supabase RLS policy ×4 — `supabase/migrations/*.sql` (fenced; auth/RLS is its own reviewed workstream).
- `no-vulnerable-react-server-components` — `package.json` next@16.0.7 (the staged bump to 16.2.6 is the fix; not applied here — dependency-install path).
- BaaS authority map ×4 — `.next/static/chunks/*.js` (expected `NEXT_PUBLIC_` config in the client bundle; benign if RLS holds).

The batch's own security improvements (authenticated `/api/revalidate`,
fail-closed Forge webhook, removal of ~18 `error.message` client leaks) are not
rules react-doctor scores, but they materially tightened the API surface — see
the diff.
