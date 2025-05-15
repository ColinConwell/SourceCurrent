import { Connection, InsertConnection } from "../shared/schema";
import { storage } from "./storage";

/**
 * Checks for environment variables associated with supported integrations
 * and automatically creates connections for them if they don't exist.
 * 
 * This helps streamline the setup process for users who have the necessary 
 * API keys in their environment.
 */
export async function setupConnectionsFromEnv(): Promise<void> {
  console.log("Checking environment for API credentials...");
  
  const demoUserId = 1; // In a real app, this would be a proper user ID
  const existingConnections = await storage.getConnections(demoUserId);
  
  // Map to track connections by service to avoid duplicates
  const existingConnectionsByService: Record<string, boolean> = {};
  existingConnections.forEach(connection => {
    existingConnectionsByService[connection.service] = true;
  });
  
  // Array to track connections we've added
  const addedConnections: Connection[] = [];
  
  // Available integrations with environment variables
  const availableServices = getAvailableServicesFromEnv();
  console.log(`Available API integrations from environment: ${Object.entries(availableServices)
    .filter(([_, available]) => available)
    .map(([service]) => service)
    .join(', ')}`);
  
  
  // Check for Slack credentials
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID && !existingConnectionsByService['slack']) {
    try {
      const slackConnection: InsertConnection = {
        userId: demoUserId,
        name: "Slack Workspace",
        service: "slack",
        credentials: {
          token: process.env.SLACK_BOT_TOKEN,
          channel: process.env.SLACK_CHANNEL_ID,
          description: "Auto-connected Slack workspace"
        },
        active: true
      };
      
      const newConnection = await storage.createConnection(slackConnection);
      addedConnections.push(newConnection);
      console.log(`✓ Created Slack connection: ${newConnection.name} (ID: ${newConnection.id})`);
      
      // Also create a data source for the default channel
      if (process.env.SLACK_CHANNEL_ID) {
        await storage.createDataSource({
          connectionId: newConnection.id,
          name: "Default Slack Channel",
          sourceId: process.env.SLACK_CHANNEL_ID,
          sourceType: "channel",
          config: { 
            channelName: "default" // This would be retrieved from the API in a real implementation
          }
        });
        console.log(`  ↳ Added data source for default Slack channel`);
      }
    } catch (error) {
      console.error("Failed to create Slack connection:", error);
    }
  }
  
  // Check for Notion credentials
  if (process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL && !existingConnectionsByService['notion']) {
    try {
      const notionConnection: InsertConnection = {
        userId: demoUserId,
        name: "Notion Workspace",
        service: "notion",
        credentials: {
          token: process.env.NOTION_INTEGRATION_SECRET,
          pageUrl: process.env.NOTION_PAGE_URL,
          description: "Auto-connected Notion workspace"
        },
        active: true
      };
      
      const newConnection = await storage.createConnection(notionConnection);
      addedConnections.push(newConnection);
      console.log(`✓ Created Notion connection: ${newConnection.name} (ID: ${newConnection.id})`);
      
      // Extract the page ID to use as a data source
      const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
      await storage.createDataSource({
        connectionId: newConnection.id,
        name: "Main Notion Page",
        sourceId: pageId,
        sourceType: "page",
        config: { 
          pageType: "tasks" 
        }
      });
      console.log(`  ↳ Added data source for main Notion page`);
    } catch (error) {
      console.error("Failed to create Notion connection:", error);
    }
  }
  
  // Check for GitHub credentials
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && !existingConnectionsByService['github']) {
    try {
      const githubConnection: InsertConnection = {
        userId: demoUserId,
        name: "GitHub Account",
        service: "github",
        credentials: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          description: "Auto-connected GitHub account (OAuth)"
        },
        active: true
      };
      
      const newConnection = await storage.createConnection(githubConnection);
      addedConnections.push(newConnection);
      console.log(`✓ Created GitHub connection: ${newConnection.name} (ID: ${newConnection.id})`);
      
      // Add a data source for repos
      await storage.createDataSource({
        connectionId: newConnection.id,
        name: "GitHub Repositories",
        sourceId: "repos", // Generic identifier for all repos
        sourceType: "repository",
        config: { 
          repoType: "all" 
        }
      });
      console.log(`  ↳ Added data source for GitHub repositories`);
    } catch (error) {
      console.error("Failed to create GitHub connection:", error);
    }
  }
  
  // Check for Linear credentials
  if (process.env.LINEAR_API_KEY && !existingConnectionsByService['linear']) {
    try {
      const linearConnection: InsertConnection = {
        userId: demoUserId,
        name: "Linear Workspace",
        service: "linear",
        credentials: {
          api_key: process.env.LINEAR_API_KEY,
          description: "Auto-connected Linear workspace"
        },
        active: true
      };
      
      const newConnection = await storage.createConnection(linearConnection);
      addedConnections.push(newConnection);
      console.log(`✓ Created Linear connection: ${newConnection.name} (ID: ${newConnection.id})`);
      
      // We'll create team-specific data sources after fetching teams
      try {
        const LinearClient = (await import("./linear-client")).LinearClient;
        const client = new LinearClient(process.env.LINEAR_API_KEY);
        
        // Get teams to create data sources for each
        const teams = await client.getTeams();
        if (teams && teams.length > 0) {
          for (const team of teams) {
            await storage.createDataSource({
              connectionId: newConnection.id,
              name: `${team.name} Team`,
              sourceId: team.id,
              sourceType: "team",
              schema: {
                team_key: team.key,
                team_name: team.name
              }
            });
          }
          console.log(`  ↳ Added data sources for ${teams.length} Linear teams`);
        } else {
          // Create a generic data source
          await storage.createDataSource({
            connectionId: newConnection.id,
            name: "Linear workspace",
            sourceId: "workspace",
            sourceType: "workspace",
            schema: null
          });
          console.log(`  ↳ Added data source for Linear workspace`);
        }
      } catch (error) {
        console.error("Failed to fetch Linear teams:", error);
        // Create a generic data source as fallback
        await storage.createDataSource({
          connectionId: newConnection.id,
          name: "Linear workspace",
          sourceId: "workspace",
          sourceType: "workspace",
          schema: null
        });
        console.log(`  ↳ Added data source for Linear workspace`);
      }
    } catch (error) {
      console.error("Failed to create Linear connection:", error);
    }
  }
  
  // Check for other services (Google Drive, etc.)
  // We can add similar checks for other services as needed
  
  if (addedConnections.length > 0) {
    console.log(`Auto-setup complete: ${addedConnections.length} connections created from environment variables.`);
  } else {
    console.log("No new connections created from environment variables.");
  }
}

/**
 * Extract the page ID from a Notion page URL
 */
function extractPageIdFromUrl(url: string): string {
  const match = url.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Invalid Notion page URL format");
}

/**
 * Helper function that ensures we have all the environment variables for a specific service
 */
export function checkEnvForService(service: string): boolean {
  switch (service) {
    case 'slack':
      return !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_ID;
    case 'notion':
      return !!process.env.NOTION_INTEGRATION_SECRET && !!process.env.NOTION_PAGE_URL;
    case 'linear':
      return !!process.env.LINEAR_API_KEY;
    case 'github':
      // Check for OAuth credentials
      return !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
    case 'gdrive':
      // Google Drive typically needs more complex OAuth setup
      return false;
    default:
      return false;
  }
}

/**
 * Get a diagnostic overview of what services can be connected based on
 * available environment variables
 */
export function getAvailableServicesFromEnv(): Record<string, boolean> {
  return {
    slack: checkEnvForService('slack'),
    notion: checkEnvForService('notion'),
    github: checkEnvForService('github'),
    linear: checkEnvForService('linear'),
    gdrive: checkEnvForService('gdrive')
  };
}