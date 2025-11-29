# Scripts

Utility scripts for project automation.

## Create Linear Issue

Creates a Linear issue from a formatted markdown file. Automatically:
- Uses "ATL-XXX: [Title]" format in the issue title
- Includes full description with all sections
- Links issue to the Atlas project

### Setup

1. Get your Linear API key from [Linear Settings > API](https://linear.app/settings/api)
2. Add it to `.env.local`:
   ```
   LINEAR_API_KEY=your-api-key-here
   LINEAR_TEAM_ID=your-team-id-here  # Optional - will use default team if not set
   ```
3. Install dependencies:
   ```bash
   npm install dotenv
   ```

### Usage

```bash
# Using API key from .env.local
node scripts/create-linear-issue.cjs .linear-issues/ATL-001-spacing-fix.md

# Or pass API key as environment variable
LINEAR_API_KEY=your-key node scripts/create-linear-issue.cjs .linear-issues/ATL-001-spacing-fix.md
```

The script will:
- Parse the markdown file
- Extract all sections
- Create the issue in Linear
- Output the issue URL

## Update Linear Issue

Updates an existing Linear issue with description from a markdown file.

### Usage

```bash
node scripts/update-linear-issue.cjs <issue-id> <file-path>

# Example:
node scripts/update-linear-issue.cjs THO-68 .linear-issues/ATL-001-spacing-fix.md
```

The script will:
- Parse the markdown file
- Update the issue title (with "ATL-XXX: " prefix)
- Update the full description with all sections
- Link to the Atlas project if not already linked

### Manual Alternative

If you prefer to create/update issues manually:
1. Open Linear
2. Copy the content from `.linear-issues/ATL-001-spacing-fix.md`
3. Paste into the issue description
4. Fill in title (with "ATL-XXX: " prefix), team, and labels as needed

