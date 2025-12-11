# Sentinel & Linear Issues: A Guide to Knowledge-Driven Development

> **Purpose**: This guide explains how to use `.sentinel.md` (evergreen best practices) and `.linear-issues/` (problem documentation) to build institutional knowledge and prevent recurring bugs.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Sentinel: Evergreen Best Practices](#sentinel-evergreen-best-practices)
3. [Linear Issues: Problem Documentation](#linear-issues-problem-documentation)
4. [How They Work Together](#how-they-work-together)
5. [Getting Started](#getting-started)
6. [Examples](#examples)

---

## Philosophy

### The Problem

Every codebase accumulates knowledge through debugging:
- "Why did this break?"
- "What pattern caused this bug?"
- "How did we solve this before?"

This knowledge is usually:
- **Lost** when developers leave
- **Forgotten** when months pass
- **Repeated** when similar bugs occur
- **Scattered** across PRs, comments, and memories

### The Solution

Two complementary systems:

1. **Sentinel** (`.sentinel.md`): **Preventive** - Evergreen principles that prevent classes of bugs
2. **Linear Issues** (`.linear-issues/`): **Documentative** - Detailed records of specific problems and their solutions

### Core Principles

- **Learn from bugs**: Every bug teaches a principle
- **Document the why**: Not just what was fixed, but why it broke and how to prevent it
- **Make it discoverable**: Knowledge should be in the repo, not in someone's head
- **Keep it evergreen**: Update as you learn, remove what's outdated

---

## Sentinel: Evergreen Best Practices

### What is Sentinel?

Sentinel is a living document of **principles learned from real bugs**. It's not a style guide or code review checklist—it's a collection of patterns that prevent entire classes of issues.

### Key Characteristics

✅ **Prevents classes of bugs** (not just one instance)  
✅ **Framework-agnostic principles** (adaptable to any stack)  
✅ **Explains WHY** (not just what to do)  
✅ **Evergreen** (updated as you learn)  
❌ **NOT** a style guide  
❌ **NOT** a code review checklist  
❌ **NOT** prescriptive about design choices

### Structure

```markdown
# Sentinel: Development Best Practices

> Evergreen principles learned from real bugs. These prevent classes of issues, not prescribe specific solutions.

---

## 🔄 Category Name

### The Problem Name

[Brief description of the problem class]

**Pattern: [Solution pattern name]**

```typescript
// ❌ BAD: What not to do
code example

// ✅ GOOD: What to do instead
code example
```

**Why it matters:** [Explanation of the impact]

---
```

### What Goes in Sentinel?

**Include:**
- Patterns that prevent multiple bugs
- Principles that apply across features
- Common pitfalls with clear solutions
- Framework-specific gotchas (e.g., React hydration, TypeScript narrowing)

**Exclude:**
- One-off bug fixes
- Project-specific conventions
- Design decisions
- Library preferences

### Example Entry

```markdown
## 🔐 Async Operations

### The Null Check Narrowing Issue

TypeScript doesn't maintain null narrowing across await boundaries:

```typescript
// ❌ BAD: TypeScript can't guarantee client is still non-null after await
const client = getClient();
if (!client) return;
const data = await client.getData(); // TS error possible

// ✅ GOOD: Capture in const immediately after check
const client = getClient();
if (!client) return;
const safeClient = client; // Now safely narrowed
const data = await safeClient.getData();
```

**Why it matters:** In async functions, control flow analysis resets after `await`. Capture narrowed values in local constants.
```

### When to Add to Sentinel

Add an entry when:
1. You've fixed the same type of bug **twice** (or it's a common pitfall)
2. The pattern applies to **multiple features** or components
3. The fix teaches a **generalizable principle**

### When to Update Sentinel

- **Add**: New pattern discovered from a bug
- **Refine**: Better examples or clearer explanations
- **Remove**: Pattern is outdated or no longer relevant
- **Reorganize**: Better categorization as it grows

### Quick Reference Checklist

Sentinel includes a checklist section for common scenarios:

```markdown
## Quick Reference Checklist

Before submitting code that involves:

### Auth/Session State
- [ ] Gating on ALL loading states before checking permissions?
- [ ] Using `mounted` guard for client-only rendering?
- [ ] Only ONE code path calling each auth-related API?

### useEffect
- [ ] All read state variables in dependency array?
- [ ] No duplicate API calls from multiple effects?
- [ ] Canvas/animation effects include visual state deps?
```

---

## Linear Issues: Problem Documentation

### What are Linear Issues?

Linear Issues are detailed records of **specific problems and their solutions**. They document:
- What broke
- Why it broke (root causes)
- How it was fixed
- What was learned

### Key Characteristics

✅ **Detailed problem documentation**  
✅ **Root cause analysis**  
✅ **Solution explanation**  
✅ **Product learning** (generalizable insights)  
✅ **Version controlled** (in the repo, not just in Linear)

### Structure

Each issue follows this template:

```markdown
# [ISSUE-ID]: [Short Descriptive Title]

## Problem

[Clear description of what's wrong or missing]

### Symptoms

- Specific error messages
- User-facing issues
- Performance problems

## Root Causes

1. **Primary Cause**: [Technical explanation]
2. **Contributing Factors**: [Additional context]

## Solution

[Detailed explanation of the solution]

### Architecture/Approach

[If applicable, explain the chosen approach]

### Key Implementation Details

[Specific technical details]

## Files Changed

- `path/to/file.ts`
  - What changed (line numbers if helpful)
  - Why it changed

## Testing

- ✅ What was tested
- ✅ How it was verified
- ✅ Edge cases covered

## Branch

`branch-name`

## Commits

- `commit-hash` - "Commit message"

## Product Learning

[Generalizable insights that could apply to future work]

[Key principles or patterns discovered]
```

### What Goes in a Linear Issue?

**Include:**
- The problem (what broke)
- Root causes (why it broke)
- The solution (how it was fixed)
- Files changed (what was modified)
- Testing approach (how it was verified)
- Product learning (generalizable insights)

**Exclude:**
- Implementation details that are obvious from code
- Step-by-step debugging logs (unless critical)
- Personal notes or opinions

### Example Issue

```markdown
# ATL-007: Fix React Error #310 Infinite Loop in DenizenModalV3

## Problem

When clicking on an entity card to open the Denizen Modal popup, the application crashed with React error #310 (max update depth exceeded), indicating an infinite loop in component rendering.

### Symptoms

- `Uncaught Error: Minified React error #310` - React detected an infinite render loop
- Modal could not open reliably for entities with multiple media
- Application became unusable when trying to inspect certain entities

## Root Causes

1. **Circular Dependency Chain**: 
   - `FloatingCard` component called `onCardRef` callback in a `useEffect`
   - `DenizenModalV3` received this callback and updated refs/state
   - Parent re-rendered and passed new array references to children
   - This created a feedback loop: Child effect → parent update → new props → child effect → ...

2. **Unstable Dependencies**:
   - `useEffect` in `FloatingCard` depended on callback functions that changed on each render
   - `DenizenModalV3` had effects depending on `denizen` object instead of stable primitives (`denizen.id`)

## Solution

Implemented **inverted control with one-way ref flow**:

1. **Parent-Owned Stable Refs**: 
   - Replaced `floatingCardRefs` from `useRef` to `useState` to create a stable array identity
   - Parent creates and owns the ref array, children only attach to it

2. **Removed Circular Callbacks**:
   - Eliminated `handleFloatingCardRef` callback function entirely
   - Removed all `useEffect` hooks in `FloatingCard` that called back to parent

[... more details ...]

## Product Learning

**Inverted Control for Ref Management**: When managing refs across multiple component layers, parent components should own and provide refs to children rather than children calling back to parents. This creates a one-way data flow that prevents circular dependencies and infinite render loops.
```

### When to Create a Linear Issue

Create an issue when:
1. **Bug fix**: You've fixed a non-trivial bug
2. **Feature implementation**: You've solved a complex problem
3. **Refactoring**: You've made significant architectural changes
4. **Learning moment**: You've discovered something worth remembering

**Don't create** for:
- Simple typo fixes
- Obvious one-line changes
- Routine maintenance

### Naming Convention

Format: `[PROJECT-PREFIX]-[NUMBER]-[kebab-case-title].md`

Examples:
- `ATL-007-fix-react-error-310-infinite-loop.md`
- `ATL-006-canvas-based-card-export.md`
- `ATL-005-video-thumbnail-fallback.md`

### Product Learning Section

This is the **most important** section. It extracts generalizable insights:

**Good Product Learning:**
- "When managing refs across component layers, parent components should own refs to prevent circular dependencies."
- "React effects should depend on primitive values rather than objects to prevent unnecessary re-runs."

**Bad Product Learning:**
- "Fixed the bug by changing line 42."
- "Used useState instead of useRef."

The Product Learning section often becomes the source for new Sentinel entries!

---

## How They Work Together

### The Flow

```
1. Bug occurs
   ↓
2. Debug and fix the bug
   ↓
3. Create Linear Issue documenting the problem and solution
   ↓
4. Extract Product Learning from the issue
   ↓
5. If pattern is generalizable → Add to Sentinel
   ↓
6. Future developers reference both:
   - Sentinel for prevention
   - Linear Issues for context
```

### Example: React Error #310

1. **Bug**: Infinite loop in DenizenModalV3
2. **Fix**: Inverted control for ref management
3. **Linear Issue**: `ATL-007-fix-react-error-310-infinite-loop.md`
   - Documents the specific problem
   - Explains the solution
   - Includes Product Learning: "Inverted Control for Ref Management"
4. **Sentinel Entry**: Added to "Component Patterns" section
   - Generalizes the pattern
   - Provides reusable examples
   - Prevents similar bugs in the future

### When to Use Which

**Use Sentinel when:**
- You're writing new code
- You're reviewing code
- You want to prevent a class of bugs
- You need a quick reference

**Use Linear Issues when:**
- You're debugging a similar problem
- You want to understand why something was done
- You need context about a specific fix
- You're learning from past solutions

---

## Getting Started

### Setting Up Sentinel

1. **Create `.sentinel.md`** in your repo root
2. **Start with one entry** from a recent bug
3. **Add categories** as you discover patterns
4. **Keep it focused** - only add patterns that prevent multiple bugs

### Setting Up Linear Issues

1. **Create `.linear-issues/` directory** in your repo root
2. **Create `ISSUE_TEMPLATE.md`** with the template structure
3. **Create your first issue** from a recent fix
4. **Reference issues in commits** when relevant

### Template Files

#### `.sentinel.md` Template

```markdown
# Sentinel: Development Best Practices

> Evergreen principles learned from real bugs. These prevent classes of issues, not prescribe specific solutions.

---

## [Category Name]

### The Problem Name

[Description]

**Pattern: [Pattern Name]**

```typescript
// ❌ BAD
// ✅ GOOD
```

**Why it matters:** [Explanation]

---
```

#### `.linear-issues/ISSUE_TEMPLATE.md`

```markdown
## Problem

[Clear description of what's wrong or missing]

## Root Causes

[Technical root causes or why this is needed]

## Solution

[Detailed explanation of the solution]

## Files Changed

[Key files modified]

## Testing

[What was tested and how]

## Branch

[Git branch name]

## Commits

[Commit messages or PR reference]

## Product Learning

[Generalizable insights]
```

### Integration with Workflow

**In your development workflow:**

1. **Before coding**: Check Sentinel for relevant patterns
2. **While coding**: Follow Sentinel principles
3. **After fixing bugs**: Create Linear Issue
4. **After Linear Issue**: Consider if pattern should be in Sentinel
5. **During code review**: Reference both Sentinel and relevant Linear Issues

**In your commit messages:**

```
fix: resolve infinite loop in modal (see ATL-007)

Applied Sentinel pattern: Parent-owned refs for component layers
```

---

## Examples

### Example 1: Hydration Mismatch

**The Bug**: Server-rendered content didn't match client-rendered content.

**Linear Issue**: Documents the specific fix for the modal component.

**Sentinel Entry**:
```markdown
## 🔄 State Management in SSR/Client Environments

### The Hydration Problem

Next.js (and similar frameworks) render on server first, then hydrate on client. State that exists server-side may not be immediately available client-side.

**Pattern: Use a `mounted` guard for client-only state**

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return <LoadingState />;
```

**Why it matters:** Without this, you get hydration mismatches where the server renders one thing and the client expects another.
```

### Example 2: API Call Storm

**The Bug**: Multiple components calling the same API simultaneously, causing race conditions.

**Linear Issue**: Documents the specific fix for the user role fetching.

**Sentinel Entry**:
```markdown
## ⚡ useEffect Dependencies

### API Call Storms

Multiple effects calling the same API create race conditions and unnecessary load.

**Pattern: Single-source-of-truth**

```typescript
// ❌ BAD: Three places calling the same API
useEffect(() => { fetchUserRole(); }, []);
useEffect(() => { if (user) fetchUserRole(); }, [user]);
onAuthStateChange(() => { fetchUserRole(); });

// ✅ GOOD: One effect owns the API call
useEffect(() => {
  if (user) fetchUserRole();
}, [user]);
```

**Principles:**
- Identify ONE effect responsible for each API call
- Other effects should read from state, not trigger new fetches
```

---

## Best Practices

### For Sentinel

1. **Be specific but generalizable**: The pattern should apply to multiple scenarios
2. **Show both bad and good**: Contrast makes the pattern clear
3. **Explain why**: Understanding the impact helps developers remember
4. **Keep it updated**: Remove outdated patterns, refine existing ones
5. **Use categories**: Organize by problem domain (Auth, State, Media, etc.)

### For Linear Issues

1. **Be thorough**: Future you will thank present you
2. **Focus on root causes**: Not just symptoms
3. **Document the solution**: Not just that it was fixed
4. **Extract learning**: The Product Learning section is crucial
5. **Link to code**: Reference specific files and line numbers when helpful

### For Both

1. **Make it discoverable**: Use clear titles and categories
2. **Keep it in the repo**: Version controlled, always accessible
3. **Reference in code**: Link to relevant entries in comments
4. **Review regularly**: Update as patterns evolve
5. **Share knowledge**: Use in onboarding and code reviews

---

## FAQ

### Q: Should every bug get a Linear Issue?

**A:** No. Only create issues for:
- Non-trivial bugs that required investigation
- Bugs that teach something valuable
- Complex fixes that might be referenced later

Simple typo fixes or obvious one-line changes don't need issues.

### Q: When should a pattern go in Sentinel vs. just a Linear Issue?

**A:** Add to Sentinel when:
- The pattern prevents multiple bugs (not just one)
- It applies across different features/components
- It's a generalizable principle

If it's specific to one component or one-time fix, keep it in the Linear Issue only.

### Q: How do I find relevant entries?

**A:** 
- **Sentinel**: Use the Quick Reference Checklist or search by category
- **Linear Issues**: Search by keywords in titles or Product Learning sections

### Q: What if Sentinel and Linear Issues conflict?

**A:** They shouldn't. Sentinel contains general principles, Linear Issues contain specific solutions. If there's a conflict, it might mean:
- The Sentinel entry needs updating
- The Linear Issue solution was specific to that case
- There's a new pattern to document

### Q: How do I maintain these as the codebase grows?

**A:**
- **Sentinel**: Review quarterly, remove outdated patterns, add new ones
- **Linear Issues**: Keep all of them (they're historical records), but tag/categorize for easy searching

---

## Conclusion

Sentinel and Linear Issues work together to build institutional knowledge:

- **Sentinel** prevents bugs before they happen
- **Linear Issues** document how bugs were solved
- **Together** they create a knowledge base that grows with your codebase

Start small: add one entry to each, then build from there. The goal isn't perfection—it's making knowledge discoverable and reusable.

---

## Resources

- [Example Sentinel File](.sentinel.md)
- [Linear Issue Template](.linear-issues/ISSUE_TEMPLATE.md)
- [Example Linear Issues](.linear-issues/)

---

*This guide is a living document. Update it as your practices evolve.*

