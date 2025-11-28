# Scripts

Utility scripts for project automation.

## Create Linear Issue

Creates a Linear issue from a formatted markdown file.

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
node scripts/create-linear-issue.js .linear-issues/ATL-001-spacing-fix.md
```

The script will:
- Parse the markdown file
- Extract all sections
- Create the issue in Linear
- Output the issue URL

### Manual Alternative

If you prefer to create issues manually:
1. Open Linear
2. Copy the content from `.linear-issues/ATL-001-spacing-fix.md`
3. Paste into the issue description
4. Fill in title, team, and labels as needed

