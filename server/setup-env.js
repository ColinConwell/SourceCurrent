#!/usr/bin/env node

/**
 * Local development setup script
 * This script helps set up the local development environment
 * for the workspace integration tool.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
│    Workspace Integration Tool - Setup Script     │
│                                                  │
╰──────────────────────────────────────────────────╯
${colors.reset}`);

console.log(`${colors.yellow}This script will help you set up your local development environment.${colors.reset}\n`);

// Check if .env file exists, create if not
const envFile = path.join(process.cwd(), '.env');
const envExample = `# Workspace Integration Tool - Environment Variables

# Database Configuration
# DATABASE_URL=postgres://username:password@localhost:5432/workspace_integration

# Slack Integration
# SLACK_BOT_TOKEN=xoxb-your-token
# SLACK_CHANNEL_ID=C0123456789

# Notion Integration
# NOTION_INTEGRATION_SECRET=secret_your_secret_key
# NOTION_PAGE_URL=https://www.notion.so/yourworkspace/Your-Page-abcdef123456

# GitHub App Integration
# GITHUB_APP_ID=12345
# GITHUB_INSTALLATION_ID=67890
# GITHUB_CLIENT_ID=your_client_id
# GITHUB_CLIENT_SECRET=your_client_secret
# GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----

# JSON Web Token Secret
# JWT_SECRET=your-very-secret-jwt-key
`;

if (!fs.existsSync(envFile)) {
  console.log(`${colors.blue}Creating .env file...${colors.reset}`);
  fs.writeFileSync(envFile, envExample);
  console.log(`${colors.green}✓ Created .env file${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠ .env file already exists${colors.reset}`);
}

// Check for required dependencies
console.log(`\n${colors.blue}Checking required dependencies...${colors.reset}`);
const checkDependency = (command, name) => {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    console.log(`${colors.green}✓ ${name} is installed${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ ${name} is not installed${colors.reset}`);
    return false;
  }
};

const nodeInstalled = checkDependency('node', 'Node.js');
const npmInstalled = checkDependency('npm', 'npm');

if (!nodeInstalled || !npmInstalled) {
  console.log(`\n${colors.red}Please install missing dependencies and try again.${colors.reset}`);
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log(`\n${colors.yellow}Installing dependencies...${colors.reset}`);
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies installed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to install dependencies${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
} else {
  console.log(`${colors.green}✓ Dependencies are already installed${colors.reset}`);
}

// Provide helpful information
console.log(`\n${colors.cyan}=== Environment Configuration Guide ===${colors.reset}`);

console.log(`\n${colors.yellow}Slack Integration${colors.reset}`);
console.log(`1. Go to https://api.slack.com/apps and create a new app
2. Add the following OAuth scopes to your app:
   - channels:history
   - channels:read
   - chat:write
3. Install the app to your workspace
4. Copy the Bot User OAuth Token to SLACK_BOT_TOKEN in .env
5. Get your channel ID from Slack and add it to SLACK_CHANNEL_ID in .env`);

console.log(`\n${colors.yellow}Notion Integration${colors.reset}`);
console.log(`1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the integration secret to NOTION_INTEGRATION_SECRET in .env
4. Share a Notion page with your integration
5. Copy the page URL to NOTION_PAGE_URL in .env`);

console.log(`\n${colors.yellow}GitHub App Integration${colors.reset}`);
console.log(`1. Go to https://github.com/settings/apps/new
2. Create a new GitHub App with the following:
   - Repository permissions: Contents (Read)
   - User permissions: Email (Read)
3. Generate a private key and download it
4. Convert the private key to a single line with proper escaping
5. Add all GitHub App credentials to .env`);

console.log(`\n${colors.cyan}=== Local Development Commands ===${colors.reset}`);
console.log(`
- Start development server:     npm run dev
- Build for production:         npm run build
- Start production server:      npm run start
- Setup Notion database:        npx tsx server/setup-notion-database.ts
- TypeScript type checking:     npm run check
- Database schema migrations:   npm run db:push
`);

console.log(`\n${colors.green}Setup complete! You can now start the development server with: npm run dev${colors.reset}`);

rl.close();