#!/usr/bin/env node

/**
 * Create a Linear issue from a formatted markdown file
 * 
 * Usage:
 *   node scripts/create-linear-issue.js .linear-issues/ATL-001-spacing-fix.md
 * 
 * Requires:
 *   - LINEAR_API_KEY in .env.local
 *   - LINEAR_TEAM_ID in .env.local (optional, will use default team if not set)
 */

const { readFileSync } = require('fs');
const { join, dirname } = require('path');
const { config } = require('dotenv');

const __dirname = dirname(__filename || require.main.filename || process.cwd());

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

// Allow API key to be passed as environment variable or read from .env.local
let LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY not found');
  console.error('   Set it in .env.local or as environment variable');
  console.error('   Get your API key from: https://linear.app/settings/api');
  process.exit(1);
}

/**
 * Parse markdown issue file and extract sections
 */
function parseIssueFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract title (first line after #)
  const titleMatch = content.match(/^#\s+(.+?):\s+(.+)$/m);
  const title = titleMatch ? titleMatch[2].trim() : 'Untitled Issue';
  
  // Extract issue ID (from first line)
  const idMatch = content.match(/^#\s+([A-Z]+-\d+):/);
  const issueId = idMatch ? idMatch[1] : null;
  
  // Extract sections
  const sections = {};
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.match(/^##\s+(.+)$/)) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.replace(/^##\s+/, '').trim();
      currentContent = [];
    } else if (currentSection && line.trim()) {
      currentContent.push(line);
    }
  }
  
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return { title, issueId, sections };
}

/**
 * Format sections into Linear issue description
 */
function formatLinearDescription(sections) {
  const parts = [];
  
  const order = ['Problem', 'Root Causes', 'Solution', 'Files Changed', 'Testing', 'Branch', 'Commits', 'Product Learning'];
  
  for (const section of order) {
    if (sections[section]) {
      parts.push(`## ${section}\n\n${sections[section]}`);
    }
  }
  
  // Add any remaining sections
  for (const [key, value] of Object.entries(sections)) {
    if (!order.includes(key)) {
      parts.push(`## ${key}\n\n${value}`);
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Create issue in Linear
 */
async function createLinearIssue(title, description, teamId) {
  const query = `
    mutation CreateIssue($title: String!, $description: String, $teamId: String!) {
      issueCreate(
        input: {
          title: $title
          description: $description
          teamId: $teamId
        }
      ) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;
  
  const variables = {
    title,
    description,
    teamId: teamId || undefined
  };
  
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '));
  }
  
  return result.data.issueCreate;
}

/**
 * Get teams (to find team ID if not provided)
 */
async function getTeams() {
  const query = `
    query {
      teams {
        nodes {
          id
          key
          name
        }
      }
    }
  `;
  
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join(', '));
  }
  
  return result.data.teams.nodes;
}

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Please provide a markdown file path');
    console.error('   Usage: node scripts/create-linear-issue.js .linear-issues/ATL-001-spacing-fix.md');
    process.exit(1);
  }
  
  try {
    console.log(`📖 Reading issue from: ${filePath}`);
    const { title, issueId, sections } = parseIssueFile(filePath);
    
    console.log(`📝 Title: ${title}`);
    if (issueId) {
      console.log(`   ID: ${issueId}`);
    }
    
    const description = formatLinearDescription(sections);
    
    // Get team ID
    let teamId = LINEAR_TEAM_ID;
    
    if (!teamId) {
      console.log('🔍 Fetching teams...');
      const teams = await getTeams();
      
      if (teams.length === 0) {
        console.error('❌ No teams found. Please set LINEAR_TEAM_ID in .env.local');
        process.exit(1);
      }
      
      if (teams.length === 1) {
        teamId = teams[0].id;
        console.log(`✅ Using team: ${teams[0].name} (${teams[0].key})`);
      } else {
        console.log('\nAvailable teams:');
        teams.forEach((team, i) => {
          console.log(`  ${i + 1}. ${team.name} (${team.key})`);
        });
        console.error('\n❌ Multiple teams found. Please set LINEAR_TEAM_ID in .env.local');
        console.error('   Example: LINEAR_TEAM_ID=team-id-here');
        process.exit(1);
      }
    }
    
    console.log('\n🚀 Creating issue in Linear...');
    const result = await createLinearIssue(title, description, teamId);
    
    if (result.success) {
      console.log('\n✅ Issue created successfully!');
      console.log(`   ID: ${result.issue.identifier}`);
      console.log(`   Title: ${result.issue.title}`);
      console.log(`   URL: ${result.issue.url}`);
    } else {
      console.error('❌ Failed to create issue');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

