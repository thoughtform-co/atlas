#!/usr/bin/env node

/**
 * Update an existing Linear issue with description from a markdown file
 * 
 * Usage:
 *   node scripts/update-linear-issue.cjs <issue-identifier> .linear-issues/ATL-001-spacing-fix.md
 * 
 * Example:
 *   node scripts/update-linear-issue.cjs THO-68 .linear-issues/ATL-001-spacing-fix.md
 */

const { readFileSync } = require('fs');
const { join } = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

let LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY not found');
  console.error('   Set it in .env.local or as environment variable');
  process.exit(1);
}

/**
 * Parse markdown issue file and extract sections (same as create script)
 */
function parseIssueFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  // Normalize line endings and split
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  // Extract full title including ID prefix (e.g., "ATL-001: Fix spacing")
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const fullTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Issue';
  
  // Extract issue ID (from first line)
  const idMatch = content.match(/^#\s+([A-Z]+-\d+):\s*(.+)$/m);
  const issueId = idMatch ? idMatch[1] : null;
  
  // Use full title with ID prefix (e.g., "ATL-001: Fix spacing")
  const title = fullTitle;
  
  // Extract sections - parse everything after the title
  const sections = {};
  let currentSection = null;
  let currentContent = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a section header
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      // Start new section
      currentSection = sectionMatch[1].trim();
      currentContent = [];
    } else if (currentSection) {
      // Add line to current section
      currentContent.push(line);
    }
  }
  
  // Save the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  // Remove empty sections
  for (const key in sections) {
    if (!sections[key] || sections[key].length === 0) {
      delete sections[key];
    }
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
 * Get issue by identifier using Linear's API
 */
async function getIssue(identifier) {
  // Extract team key and number from identifier (e.g., "THO-68")
  const [teamKey, issueNumber] = identifier.split('-');
  
  // Linear API: search all teams and filter by identifier
  const query = `
    query GetIssue {
      issues(first: 100) {
        nodes {
          id
          identifier
          title
          description
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
  
  // Find the issue by identifier
  const issues = result.data?.issues?.nodes || [];
  const issue = issues.find(iss => iss.identifier === identifier);
  
  if (!issue) {
    throw new Error(`Issue ${identifier} not found`);
  }
  
  return issue;
}

/**
 * Get Atlas project
 */
async function getAtlasProject() {
  const query = `
    query {
      projects(first: 50) {
        nodes {
          id
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
  
  const projects = result.data.projects.nodes;
  const atlasProject = projects.find(p => p.name.toLowerCase().includes('atlas'));
  
  return atlasProject;
}

/**
 * Update issue in Linear
 */
async function updateLinearIssue(issueId, title, description, projectId) {
  const query = `
    mutation UpdateIssue($issueId: String!, $title: String, $description: String, $projectId: String) {
      issueUpdate(
        id: $issueId
        input: {
          title: $title
          description: $description
          projectId: $projectId
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
    issueId,
    title: title || undefined,
    description: description || undefined,
    projectId: projectId || undefined
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
  
  return result.data.issueUpdate;
}

async function main() {
  const issueIdentifier = process.argv[2];
  const filePath = process.argv[3];
  
  if (!issueIdentifier || !filePath) {
    console.error('❌ Please provide issue identifier and markdown file path');
    console.error('   Usage: node scripts/update-linear-issue.cjs <issue-id> <file-path>');
    console.error('   Example: node scripts/update-linear-issue.cjs THO-68 .linear-issues/ATL-001-spacing-fix.md');
    process.exit(1);
  }
  
  try {
    console.log(`📖 Reading issue from: ${filePath}`);
    const { title, issueId, sections } = parseIssueFile(filePath);
    
    console.log(`📝 Title: ${title}`);
    console.log(`📋 Found sections: ${Object.keys(sections).join(', ')}`);
    
    const description = formatLinearDescription(sections);
    console.log(`📄 Description length: ${description.length} characters`);
    
    console.log(`\n🔍 Fetching issue ${issueIdentifier}...`);
    const existingIssue = await getIssue(issueIdentifier);
    
    if (!existingIssue) {
      console.error(`❌ Issue ${issueIdentifier} not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found issue: ${existingIssue.title}`);
    
    // Get Atlas project
    console.log('🔍 Finding Atlas project...');
    const atlasProject = await getAtlasProject();
    
    if (!atlasProject) {
      console.warn('⚠️  Atlas project not found. Updating issue without project link.');
    } else {
      console.log(`✅ Found project: ${atlasProject.name}`);
    }
    
    console.log('\n🚀 Updating issue in Linear...');
    const result = await updateLinearIssue(
      existingIssue.id,
      title,
      description,
      atlasProject?.id
    );
    
    if (result.success) {
      console.log('\n✅ Issue updated successfully!');
      console.log(`   ID: ${result.issue.identifier}`);
      console.log(`   Title: ${result.issue.title}`);
      console.log(`   URL: ${result.issue.url}`);
    } else {
      console.error('❌ Failed to update issue');
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

