# Architecture Decision Records

This folder contains Architecture Decision Records (ADRs) - documentation of significant technical decisions made in this project.

## What Goes Here

- **Architectural patterns** that solve real problems we encountered
- **Technical decisions** that future developers need to understand
- **Lessons learned** from bugs that required non-obvious fixes

## What Doesn't Go Here

- Specific design choices (visual styles, layouts, etc.)
- Library/tool selections (unless there's important context)
- Routine implementation decisions

## Format

Each ADR follows this structure:

```markdown
# ADR-XXX: Title

## Status
Accepted / Superseded / Deprecated

## Context
What problem did we face?

## Decision
What did we decide to do?

## Consequences
What are the positive and negative results?

## Related Issues
Links to Linear issues or PRs
```

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-auth-state-single-source.md) | Single-Source-of-Truth for Auth State | Accepted |

