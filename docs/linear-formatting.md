# Linear Issue Format Guide

This guide explains the standardized issue description format used for all Linear and GitHub issues in the Astrolabe project.

## Overview

All issues follow a consistent structure that combines best practices with two custom sections designed to support product development learning and roadmap alignment:

1. **Standard sections** (Problem, Solution, Testing, etc.) - following industry best practices

2. **Product Learning** - practical takeaways tied to specific skills/roles

## Format Structure

```
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

[Required section - see details below]
```

## Required Sections

### Product Learning

**Purpose:** Extract practical learnings from each issue tailored to someone learning product management and product design.

**Auto-Generated:** This section is automatically generated when creating or updating issues using the scripts. The generator creates:

- **One tight paragraph** (max 100 words) of practical product management/design learning

- **Stakeholders section** - one sentence naming specific role(s) that would handle this

**Voice:** Direct, opinionated, insider knowledge. Lead with insight, not explanation.

**Format:**

```
[One paragraph - max 100 words, lead with insight]

Stakeholders: [One sentence - specific role with specialization]
```

**Example:**

> Framework upgrades cascade unpredictably. Next.js 15's async params looked minor but broke three user features simultaneously—bulk analyze, author display, re-analyze. The lesson: test end-to-end user journeys during migrations, not just isolated components. Infrastructure changes that seem purely technical often break user experience in confusing ways.

> Stakeholders: Senior Full-Stack Developer with Next.js migration expertise.

## Using the Template

### For New Issues

1. Copy the template from `.linear-issues/ISSUE_TEMPLATE.md`

2. Fill in the standard sections (Problem, Solution, Testing, etc.)

3. Create the issue using `npm run create-issue` - the Product Learning and Astrolabe Roadmap sections will be **automatically generated**

4. Review and refine the generated sections if needed

### For Existing Issues

Run the formatting script to automatically generate missing sections:

```bash
# Dry run to see what would be updated
npm run format-issues -- --dry-run

# Update all issues (generates sections using AI)
npm run format-issues

# Update only issues from specific team
npm run format-issues -- --team THO
```

**Note:** Requires `ANTHROPIC_API_KEY` to be set in `.env.local`

The script will:

- Preserve all existing content

- **Automatically generate** Product Learning and Astrolabe Roadmap sections using AI analysis

- Leave issues that already have both sections unchanged

## Best Practices

### Writing Product Learning

- **Be specific:** Name the exact skill area (e.g., "API Design", "State Management", "Data Visualization")

- **Identify the expert:** Specify who would know this (e.g., "Senior Backend Engineer Specialized in Database Optimization")

- **Extract the lesson:** What would you do differently next time?

### General Tips

- Keep descriptions concise but complete

- Use code snippets sparingly (link to files instead)

- Reference relevant documentation or design files

- Update sections as you learn more during implementation

## Examples

See `.linear-issues/example-formatted-issue.md` for a complete example based on THO-49.

## Automation

The format is designed to work with:

- Linear API integration (automatic updates)

- GitHub issue sync (via `scripts/sync-linear-to-github.js`)

- Future automation for generating reports and learnings

## Questions?

If you're unsure how to fill in a section:

1. Check existing issues for similar patterns

2. Ask: "What would a PM/designer/developer learn from this?"

