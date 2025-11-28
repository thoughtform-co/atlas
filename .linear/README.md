# Linear Integration

This repository is linked to Linear for project management and issue tracking.

## Setup Instructions

To link this GitHub repository to Linear:

### 1. Install Linear GitHub App

1. Go to [Linear Settings > Integrations](https://linear.app/settings/integrations)
2. Find "GitHub" in the integrations list
3. Click "Configure" or "Install"
4. Follow the prompts to install the Linear GitHub App on your GitHub account/organization

### 2. Link This Repository

1. In Linear, go to **Settings > Integrations > GitHub**
2. Click **"Add Repository"** or **"Connect Repository"**
3. Select the `thoughtform-co/atlas` repository
4. Choose the Linear team/project to link it to
5. Configure sync preferences:
   - **Issue Sync**: Enable to sync Linear issues with GitHub issues
   - **Pull Request Sync**: Enable to link PRs to Linear issues
   - **Status Updates**: Enable to update Linear when PRs are merged/closed

### 3. Verify Connection

Once linked, you can:
- Reference Linear issues in commit messages: `Fixes LINEAR-123`
- Create Linear issues from GitHub PRs
- See Linear issue context in PRs
- Automatically sync issue status between Linear and GitHub

## Using Linear with GitHub

### In Commit Messages

Reference Linear issues in commits:
```
feat: Add entity card spacing controls

Fixes LINEAR-123
```

Or link multiple issues:
```
refactor: Convert spacing to pixel-exact values

Addresses LINEAR-124, LINEAR-125
```

### Creating Issues from PRs

When opening a PR, you can automatically create a Linear issue by including the issue number in the PR title or description.

### Branch Naming

Linear supports branch naming patterns. Consider using:
- `linear/TEAM-123-short-description`
- `feature/linear-123-add-spacing-controls`

## Repository Info

- **GitHub**: `https://github.com/thoughtform-co/atlas`
- **Linear Team**: [Set this in Linear settings]
- **Sync Status**: [Will show after linking]

## Troubleshooting

If issues aren't syncing:
1. Check that the Linear GitHub App has access to this repository
2. Verify the repository is linked in Linear Settings > Integrations > GitHub
3. Ensure you have the correct permissions in both Linear and GitHub
4. Check Linear's sync logs in Settings > Integrations > GitHub > Sync Logs

