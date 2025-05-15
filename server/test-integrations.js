#!/usr/bin/env node

/**
 * Integration Test Script
 * This script tests the connectivity to all configured integrations
 * and provides diagnostic information to help troubleshoot issues.
 */

import { WebClient } from '@slack/web-api';
import { Client as NotionClient } from '@notionhq/client';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}
╭──────────────────────────────────────────────────╮
│                                                  │
│     Integration Connectivity Test Script         │
│                                                  │
╰──────────────────────────────────────────────────╯
${colors.reset}`);

// Function to test Slack integration
async function testSlackIntegration() {
  console.log(`\n${colors.yellow}Testing Slack Integration${colors.reset}`);
  
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;
  
  if (!token) {
    console.log(`${colors.red}✗ SLACK_BOT_TOKEN is not set${colors.reset}`);
    return false;
  }
  
  if (!channelId) {
    console.log(`${colors.red}✗ SLACK_CHANNEL_ID is not set${colors.reset}`);
    return false;
  }
  
  try {
    const slack = new WebClient(token);
    
    // Test API connection
    console.log(`${colors.blue}Testing API connection...${colors.reset}`);
    const authTest = await slack.auth.test();
    console.log(`${colors.green}✓ Connected to Slack as: ${authTest.user} (${authTest.user_id})${colors.reset}`);
    
    // Test channel access
    console.log(`${colors.blue}Testing channel access...${colors.reset}`);
    try {
      const channelInfo = await slack.conversations.info({ channel: channelId });
      console.log(`${colors.green}✓ Channel access confirmed: #${channelInfo.channel.name}${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Cannot access channel: ${error.message}${colors.reset}`);
      return false;
    }
    
    // Check permissions
    console.log(`${colors.blue}Checking permissions...${colors.reset}`);
    try {
      const history = await slack.conversations.history({ channel: channelId, limit: 1 });
      console.log(`${colors.green}✓ Has channel history access${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Missing channel history permission: ${error.message}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Slack connection failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to test Notion integration
async function testNotionIntegration() {
  console.log(`\n${colors.yellow}Testing Notion Integration${colors.reset}`);
  
  const token = process.env.NOTION_INTEGRATION_SECRET;
  const pageUrl = process.env.NOTION_PAGE_URL;
  
  if (!token) {
    console.log(`${colors.red}✗ NOTION_INTEGRATION_SECRET is not set${colors.reset}`);
    return false;
  }
  
  if (!pageUrl) {
    console.log(`${colors.red}✗ NOTION_PAGE_URL is not set${colors.reset}`);
    return false;
  }
  
  try {
    // Extract page ID from URL
    const pageIdMatch = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (!pageIdMatch) {
      console.log(`${colors.red}✗ Invalid Notion page URL format${colors.reset}`);
      return false;
    }
    const pageId = pageIdMatch[1];
    
    const notion = new NotionClient({ auth: token });
    
    // Test API connection
    console.log(`${colors.blue}Testing API connection...${colors.reset}`);
    const user = await notion.users.me();
    console.log(`${colors.green}✓ Connected to Notion as: ${user.name || user.id}${colors.reset}`);
    
    // Test page access
    console.log(`${colors.blue}Testing page access...${colors.reset}`);
    try {
      const page = await notion.pages.retrieve({ page_id: pageId });
      console.log(`${colors.green}✓ Page access confirmed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Cannot access page: ${error.message}${colors.reset}`);
      return false;
    }
    
    // Check for databases
    console.log(`${colors.blue}Checking for databases...${colors.reset}`);
    try {
      const blocks = await notion.blocks.children.list({ block_id: pageId });
      const databases = blocks.results.filter(block => block.type === 'child_database');
      
      if (databases.length > 0) {
        console.log(`${colors.green}✓ Found ${databases.length} database(s) on the page${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ No databases found on the page${colors.reset}`);
        console.log(`${colors.blue}ℹ You can run the setup script to create a sample database:${colors.reset}`);
        console.log(`${colors.blue}  npx tsx server/setup-notion-database.ts${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error checking for databases: ${error.message}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Notion connection failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to test GitHub integration
async function testGitHubIntegration() {
  console.log(`\n${colors.yellow}Testing GitHub Integration${colors.reset}`);
  
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  
  if (!appId) {
    console.log(`${colors.red}✗ GITHUB_APP_ID is not set${colors.reset}`);
    return false;
  }
  
  if (!installationId) {
    console.log(`${colors.red}✗ GITHUB_INSTALLATION_ID is not set${colors.reset}`);
    return false;
  }
  
  if (!privateKey) {
    console.log(`${colors.red}✗ GITHUB_PRIVATE_KEY is not set${colors.reset}`);
    return false;
  }
  
  try {
    // Check private key format
    console.log(`${colors.blue}Checking private key format...${colors.reset}`);
    const keyInfo = {
      length: privateKey.length,
      hasBeginMarker: privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END RSA PRIVATE KEY-----'),
      hasNewlines: privateKey.includes('\\n') || privateKey.includes('\n')
    };
    
    if (!keyInfo.hasBeginMarker || !keyInfo.hasEndMarker) {
      console.log(`${colors.red}✗ Private key is missing BEGIN/END markers${colors.reset}`);
      console.log(`${colors.blue}ℹ The key should start with "-----BEGIN RSA PRIVATE KEY-----"${colors.reset}`);
      return false;
    }
    
    if (!keyInfo.hasNewlines) {
      console.log(`${colors.yellow}⚠ Private key might be missing newlines${colors.reset}`);
      console.log(`${colors.blue}ℹ Make sure the key has proper line breaks (\\n)${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Private key format looks good${colors.reset}`);
    }
    
    // Format the private key
    const formattedKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/^"(.*)"$/, '$1');
    
    // Create JWT token
    console.log(`${colors.blue}Creating JWT token...${colors.reset}`);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + (10 * 60),
      iss: appId
    };
    
    try {
      const token = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });
      console.log(`${colors.green}✓ JWT token created successfully${colors.reset}`);
      
      // Get installation token
      console.log(`${colors.blue}Getting installation token...${colors.reset}`);
      const response = await axios({
        method: 'POST',
        url: `https://api.github.com/app/installations/${installationId}/access_tokens`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      const installationToken = response.data.token;
      console.log(`${colors.green}✓ Installation token acquired successfully${colors.reset}`);
      
      // Test API access
      console.log(`${colors.blue}Testing API access...${colors.reset}`);
      const reposResponse = await axios({
        method: 'GET',
        url: 'https://api.github.com/installation/repositories',
        headers: {
          Authorization: `token ${installationToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      const repos = reposResponse.data.repositories;
      console.log(`${colors.green}✓ API access confirmed, found ${repos.length} repositories${colors.reset}`);
      
      if (repos.length > 0) {
        const repoNames = repos.map(repo => repo.full_name).join(', ');
        console.log(`${colors.blue}ℹ Repositories: ${repoNames}${colors.reset}`);
      }
      
      return true;
    } catch (error) {
      console.log(`${colors.red}✗ JWT signing failed: ${error.message}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ GitHub connection failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.blue}Starting integration tests...${colors.reset}`);
  
  const slackResult = await testSlackIntegration();
  const notionResult = await testNotionIntegration();
  const githubResult = await testGitHubIntegration();
  
  console.log(`\n${colors.cyan}=== Test Results Summary ===${colors.reset}`);
  console.log(`Slack:  ${slackResult ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Notion: ${notionResult ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`GitHub: ${githubResult ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  
  const allPassed = slackResult && notionResult && githubResult;
  
  if (allPassed) {
    console.log(`\n${colors.green}All integration tests passed! You're ready to go.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Some integration tests failed. Please check the errors above.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
});