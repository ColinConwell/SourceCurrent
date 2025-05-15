# Workspace Integration Tool

A powerful web application that integrates multiple data sources (Slack, Notion, GitHub, Google Drive) into structured formats for AI-powered data pipelines.

![Dashboard Screenshot](./assets/Manifold-Icon.png)

## Main Features

- **Multi-Service Integration**: Connect seamlessly with Slack, Notion, GitHub, and Google Drive
- **Auto-Connection Detection**: Automatically detects and configures connections based on available API credentials
- **Metadata Collection**: Gathers detailed information from connected services for AI processing
- **Structured Data Format**: Transforms disparate data sources into consistent, structured formats
- **Modern UI**: Beautiful and intuitive user interface built with React and TailwindCSS
- **TypeScript**: Full-stack TypeScript application for better type safety and developer experience
- **GitHub App Integration**: Enhanced security with GitHub App authentication (JWT) instead of personal access tokens

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL (optional, can use in-memory storage for development)
- API credentials for services you want to integrate with:
  - Slack: Bot Token and Channel ID
  - Notion: Integration Secret and Page URL
  - GitHub: GitHub App credentials
  - Google Drive: OAuth credentials (optional)

## 🚀 Quick Start

1. Clone the repository
2. Run the setup script: `npx tsx server/setup-env.js`
3. Configure your environment variables in the `.env` file
4. Start the development server: `npm run dev`
5. Open your browser at: `http://localhost:5000`

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration (Optional)
DATABASE_URL=postgres://username:password@localhost:5432/workspace_integration

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C0123456789

# Notion Integration
NOTION_INTEGRATION_SECRET=secret_your_secret_key
NOTION_PAGE_URL=https://www.notion.so/yourworkspace/Your-Page-abcdef123456

# GitHub App Integration
GITHUB_APP_ID=12345
GITHUB_INSTALLATION_ID=67890
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----

# Linear Integration
LINEAR_API_KEY=lin_api_your_linear_api_key

# JSON Web Token Secret (Optional)
JWT_SECRET=your-very-secret-jwt-key
```

## 🔧 API Integration Setup

### Slack Setup
1. Go to https://api.slack.com/apps and create a new app
2. Add the following OAuth scopes to your app:
   - `channels:history`
   - `channels:read` 
   - `chat:write`
   - `users:read` (recommended)
3. Install the app to your workspace
4. Copy the Bot User OAuth Token to `SLACK_BOT_TOKEN` in `.env`
5. Get your channel ID from Slack and add it to `SLACK_CHANNEL_ID` in `.env`

### Notion Setup
1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the integration secret to `NOTION_INTEGRATION_SECRET` in `.env`
4. Share a Notion page with your integration:
   - Open the page in Notion
   - Click "..." at the top right
   - Go to "Add connections"
   - Select your integration
5. Copy the page URL to `NOTION_PAGE_URL` in `.env`
6. Run the Notion setup script: `npx tsx server/setup-notion-database.ts`

### GitHub Setup (GitHub App Method)
1. Go to https://github.com/settings/apps/new
2. Create a new GitHub App with:
   - Homepage URL: Your app's URL or localhost during development
   - Webhook URL: Can be skipped during development
   - Repository permissions: Contents (Read), Metadata (Read)
   - User permissions: Email (Read), Profile (Read)
3. After creating, note your App ID
4. Generate a private key and download it
5. Install the app on your account or organization
6. Note the Installation ID from the URL after installation
7. Add all these credentials to your `.env` file

### Linear Setup
1. Go to https://linear.app/settings/api
2. Under "Personal API Keys", create a new API key
3. Give the key a descriptive name like "Workspace Integration"
4. Copy the API key (starting with `lin_api_`) to your `.env` file
5. Set LINEAR_API_KEY=lin_api_your_key in your `.env` file
6. The application will automatically detect your teams and create data sources for each

## 🏗️ Project Structure

```
.
├── assets               # Static assets
├── client               # Frontend React application
│   ├── src              # Source code
│   │   ├── components   # React components
│   │   ├── hooks        # Custom React hooks
│   │   ├── lib          # Utility functions
│   │   ├── pages        # Page components
│   │   ├── App.tsx      # Main App component
│   │   └── main.tsx     # Entry point
├── server               # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage interface
│   ├── integration-routes.ts # Integration-specific routes
│   ├── metadata-routes.ts    # Metadata collection routes
│   ├── *-client.ts      # Service clients (Slack, Notion, GitHub, etc.)
│   └── *-setup.ts       # Setup scripts for integrations
├── shared               # Shared code between client and server
│   └── schema.ts        # Data models and validation schemas
└── README.md            # This file
```

## 📝 Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Run the production build
- `npx tsx server/setup-env.js`: Setup local development environment
- `npx tsx server/setup-notion-database.ts`: Setup Notion database
- `npm run check`: Run TypeScript type checking
- `npm run db:push`: Apply database schema changes

## 🔄 Development Workflow

1. Configure your integrations using the environment variables
2. Start the development server with `npm run dev`
3. The application will automatically detect available integrations
4. Create data pipelines to transform and process data
5. Use the JSON tree viewer to explore data structures

## 📦 Deployment

### Deploying to Production
1. Build the application: `npm run build`
2. Set environment variables in your production environment
3. Start the server: `npm run start`

### Deploying to Replit
1. Fork this repository to Replit
2. Add your environment secrets in the Replit Secrets panel
3. The application will automatically build and run