import type { Express, Request, Response } from "express";
import { readSlackHistory, getChannelInfo, getUserInfo } from "./slack-setup";
import { getTasks } from "./notion-setup";
import { getGitHubClientForConnection } from "./github-client";
import { getLinearClientForConnection } from "./linear-client";
import { storage } from "./storage";

/**
 * Sets up routes for our integrations with Slack, Notion, etc.
 * @param app Express application
 */
export async function setupIntegrationRoutes(app: Express) {
  console.log("Setting up integration routes...");
  
  // Get slack messages
  app.get("/api/slack/messages", async (req: Request, res: Response) => {
    try {
      // Get channel ID from query params or default to env var
      const channelId = req.query.channelId?.toString() || process.env.SLACK_CHANNEL_ID;
      
      if (!channelId) {
        return res.status(400).json({
          success: false,
          error: "No channel ID provided"
        });
      }
      
      // Get channel history
      const messages = await readSlackHistory(channelId);
      
      // For each message, get user info
      for (const message of messages.messages || []) {
        if (message.user) {
          try {
            // TypeScript doesn't know about user_info property, use any type casting
            (message as any).user_info = await getUserInfo(message.user);
          } catch (error) {
            console.error(`Error getting user info for ${message.user}:`, error);
            (message as any).user_info = { 
              id: message.user,
              name: "Unknown User",
              error: "Failed to fetch user details"
            };
          }
        }
      }
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error: any) {
      console.error("Error getting Slack messages:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Slack messages"
      });
    }
  });
  
  // Get notion tasks
  app.get("/api/notion/tasks", async (req: Request, res: Response) => {
    try {
      // Get database ID from query params (if available)
      const databaseId = req.query.databaseId?.toString();
      
      if (!databaseId) {
        return res.status(400).json({
          success: false,
          error: "No database ID provided"
        });
      }
      
      // Get tasks from Notion database
      const tasks = await getTasks(databaseId);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      console.error("Error getting Notion tasks:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Notion tasks"
      });
    }
  });
  
  // Get GitHub repositories
  app.get("/api/github/repositories", async (req: Request, res: Response) => {
    try {
      // Find the first GitHub connection
      const connections = await storage.getConnections(1); // Using default user ID
      const githubConnection = connections.find(conn => conn.service === 'github');
      
      if (!githubConnection) {
        return res.status(404).json({
          success: false,
          error: "No GitHub connection found"
        });
      }
      
      // Get GitHub client for this connection
      const githubClient = await getGitHubClientForConnection(githubConnection.id);
      
      // Try to get repositories from GitHub App installation first
      let repositories;
      try {
        repositories = await githubClient.getInstallationRepositories();
      } catch (appError) {
        console.log('Falling back to user repositories endpoint');
        repositories = await githubClient.getRepositories();
      }
      
      res.json({
        success: true,
        data: repositories
      });
    } catch (error: any) {
      console.error("Error getting GitHub repositories:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get GitHub repositories"
      });
    }
  });
  
  // Get GitHub repository details
  app.get("/api/github/repositories/:owner/:repo", async (req: Request, res: Response) => {
    try {
      const { owner, repo } = req.params;
      
      // Find the first GitHub connection
      const connections = await storage.getConnections(1); // Using default user ID
      const githubConnection = connections.find(conn => conn.service === 'github');
      
      if (!githubConnection) {
        return res.status(404).json({
          success: false,
          error: "No GitHub connection found"
        });
      }
      
      // Get GitHub client for this connection
      const githubClient = await getGitHubClientForConnection(githubConnection.id);
      
      // Get repository detailed info
      const repositoryData = await githubClient.getRepositoryDataAsDictionary(owner, repo);
      
      res.json({
        success: true,
        data: repositoryData
      });
    } catch (error: any) {
      console.error("Error getting GitHub repository details:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get GitHub repository details"
      });
    }
  });
  
  // Integration dashboard endpoint that combines data from multiple services
  app.get("/api/integration/dashboard", async (req: Request, res: Response) => {
    try {
      const result: Record<string, any> = {};
      const integrationStatus: Record<string, string> = {};
      
      // Get Slack data if credentials are available
      if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
        try {
          // Get channel info
          const channelInfo = await getChannelInfo();
          
          // Get channel history
          const slackHistoryResponse = await readSlackHistory(process.env.SLACK_CHANNEL_ID);
          const messages = slackHistoryResponse.messages || [];
          
          // Add user info to messages
          for (const message of messages) {
            if (message.user) {
              try {
                // TypeScript doesn't know about user_info property, use any type casting
                (message as any).user_info = await getUserInfo(message.user);
              } catch (userError) {
                console.error(`Error getting user info for ${message.user}:`, userError);
                (message as any).user_info = { 
                  id: message.user,
                  name: "Unknown User",
                  is_bot: false
                };
              }
              
              // Mark bot messages
              (message as any).is_bot = (message as any).user_info?.is_bot || false;
            }
          }
          
          result.slack = {
            channel_info: channelInfo,
            messages
          };
          
          integrationStatus.slack = 'active';
        } catch (slackError: any) {
          console.error("Error fetching Slack data:", slackError);
          result.slack = { error: slackError.message };
          integrationStatus.slack = 'error';
        }
      } else {
        integrationStatus.slack = 'missing_credentials';
      }
      
      // Get Notion data if credentials are available
      if (process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL) {
        try {
          // Find the tasks database and get tasks
          // We'll find databases under the main page and look for one with a name containing 'tasks'
          const notionData: any = {};
          
          try {
            // Find and query the tasks database without specifying an ID
            notionData.tasks = await getTasks();
          } catch (tasksError: any) {
            console.error("Error fetching Notion tasks:", tasksError);
            notionData.tasks_error = tasksError.message;
          }
          
          result.notion = notionData;
          integrationStatus.notion = Object.keys(notionData).length > 0 ? 'active' : 'error';
        } catch (notionError: any) {
          console.error("Error fetching Notion data:", notionError);
          result.notion = { error: notionError.message };
          integrationStatus.notion = 'error';
        }
      } else {
        integrationStatus.notion = 'missing_credentials';
      }
      
      // Get GitHub data if GitHub App credentials are available
      if (process.env.GITHUB_APP_ID && process.env.GITHUB_INSTALLATION_ID && process.env.GITHUB_PRIVATE_KEY) {
        try {
          // Find the GitHub connection
          const connections = await storage.getConnections(1); // Using default user ID
          const githubConnection = connections.find(conn => conn.service === 'github');
          
          if (githubConnection) {
            const githubClient = await getGitHubClientForConnection(githubConnection.id);
            
            // Get repositories from the installation
            let repositories = [];
            try {
              repositories = await githubClient.getInstallationRepositories();
            } catch (repoError) {
              console.error("Error fetching installation repositories:", repoError);
              try {
                // Fallback to user repositories if available
                repositories = await githubClient.getRepositories();
              } catch (userRepoError) {
                console.error("Error fetching user repositories:", userRepoError);
              }
            }
            
            // Get app information
            let appInfo = null;
            try {
              appInfo = await githubClient.getAppInfo();
            } catch (appError) {
              console.error("Error fetching GitHub App info:", appError);
            }
            
            result.github = {
              app_info: appInfo,
              repositories: repositories
            };
            
            integrationStatus.github = repositories.length > 0 ? 'active' : 'error';
          } else {
            integrationStatus.github = 'no_connection';
          }
        } catch (githubError: any) {
          console.error("Error fetching GitHub data:", githubError);
          result.github = { error: githubError.message };
          integrationStatus.github = 'error';
        }
      } else if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        integrationStatus.github = 'auth_required';
      } else {
        integrationStatus.github = 'missing_credentials';
      }
      
      // Get Linear data if credentials are available
      if (process.env.LINEAR_API_KEY) {
        try {
          // Find the first Linear connection
          const connections = await storage.getConnections(1); // Using default user ID
          const linearConnection = connections.find(conn => conn.service === 'linear');
          
          if (linearConnection) {
            // Get Linear client for this connection
            const linearClient = await getLinearClientForConnection(linearConnection.id);
            
            // Get teams information
            const teams = await linearClient.getTeams();
            
            // Get workflow states
            const workflowStates = await linearClient.getWorkflowStates();
            
            // Get issues for the first team (if available)
            let firstTeamIssues = [];
            if (teams.length > 0) {
              try {
                firstTeamIssues = await linearClient.getTeamIssues(teams[0].id);
              } catch (issuesError) {
                console.error(`Error fetching issues for team ${teams[0].name}:`, issuesError);
              }
            }
            
            result.linear = {
              teams: teams.map(team => ({
                id: team.id,
                name: team.name,
                key: team.key,
                description: team.description,
                color: team.color
              })),
              workflowStates: workflowStates.slice(0, 5),
              sampleIssues: firstTeamIssues.slice(0, 5)
            };
            
            integrationStatus.linear = teams.length > 0 ? 'active' : 'error';
          } else {
            integrationStatus.linear = 'no_connection';
          }
        } catch (linearError: any) {
          console.error("Error fetching Linear data:", linearError);
          result.linear = { error: linearError.message };
          integrationStatus.linear = 'error';
        }
      } else {
        integrationStatus.linear = 'missing_credentials';
      }
      
      result.integrationStatus = integrationStatus;
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error("Error generating integration dashboard:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate integration dashboard"
      });
    }
  });
  
  // Linear integration routes
  
  // Get Linear teams
  app.get("/api/linear/teams", async (req: Request, res: Response) => {
    try {
      // Find the first Linear connection
      const connections = await storage.getConnections(1); // Using default user ID
      const linearConnection = connections.find(conn => conn.service === 'linear');
      
      if (!linearConnection) {
        return res.status(404).json({
          success: false,
          error: "No Linear connection found"
        });
      }
      
      // Get Linear client for this connection
      const linearClient = await getLinearClientForConnection(linearConnection.id);
      
      // Get teams
      const teams = await linearClient.getTeams();
      
      res.json({
        success: true,
        data: teams
      });
    } catch (error: any) {
      console.error("Error getting Linear teams:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Linear teams"
      });
    }
  });
  
  // Get Linear team issues
  app.get("/api/linear/teams/:teamId/issues", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      // Find the first Linear connection
      const connections = await storage.getConnections(1); // Using default user ID
      const linearConnection = connections.find(conn => conn.service === 'linear');
      
      if (!linearConnection) {
        return res.status(404).json({
          success: false,
          error: "No Linear connection found"
        });
      }
      
      // Get Linear client for this connection
      const linearClient = await getLinearClientForConnection(linearConnection.id);
      
      // Get team issues
      const issues = await linearClient.getTeamIssues(teamId);
      
      res.json({
        success: true,
        data: issues
      });
    } catch (error: any) {
      console.error(`Error getting Linear issues for team ${req.params.teamId}:`, error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Linear team issues"
      });
    }
  });
  
  // Get Linear workflow states
  app.get("/api/linear/workflow-states", async (req: Request, res: Response) => {
    try {
      // Find the first Linear connection
      const connections = await storage.getConnections(1); // Using default user ID
      const linearConnection = connections.find(conn => conn.service === 'linear');
      
      if (!linearConnection) {
        return res.status(404).json({
          success: false,
          error: "No Linear connection found"
        });
      }
      
      // Get Linear client for this connection
      const linearClient = await getLinearClientForConnection(linearConnection.id);
      
      // Get workflow states
      const states = await linearClient.getWorkflowStates();
      
      res.json({
        success: true,
        data: states
      });
    } catch (error: any) {
      console.error("Error getting Linear workflow states:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Linear workflow states"
      });
    }
  });
  
  // Get team data dictionary (for AI processing)
  app.get("/api/linear/teams/:teamId/data", async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      // Find the first Linear connection
      const connections = await storage.getConnections(1); // Using default user ID
      const linearConnection = connections.find(conn => conn.service === 'linear');
      
      if (!linearConnection) {
        return res.status(404).json({
          success: false,
          error: "No Linear connection found"
        });
      }
      
      // Get Linear client for this connection
      const linearClient = await getLinearClientForConnection(linearConnection.id);
      
      // Get team data dictionary
      const data = await linearClient.getTeamDataAsDictionary(teamId);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error: any) {
      console.error(`Error getting Linear team data for ${req.params.teamId}:`, error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get Linear team data"
      });
    }
  });
  
  // Test Linear connection
  app.get("/api/linear/test-connection", async (_req: Request, res: Response) => {
    try {
      console.log("Testing Linear API connection...");
      
      // Try direct connection with environment variable
      if (process.env.LINEAR_API_KEY) {
        console.log("Testing Linear API key from environment variables...");
        const { LinearClient } = await import('./linear-client');
        const client = new LinearClient(process.env.LINEAR_API_KEY);
        
        const result = await client.testConnection();
        
        if (result.success) {
          return res.json({
            success: true,
            message: "Linear API connection successful",
            source: "environment",
            viewer: result.viewer
          });
        } else {
          console.log("Direct API key test failed, trying through connections...");
        }
      }
      
      // Try through connections
      const connections = await storage.getConnections(1);
      const linearConnection = connections.find(conn => conn.service === 'linear');
      
      if (!linearConnection) {
        return res.status(404).json({
          success: false,
          error: "No Linear connection found"
        });
      }
      
      const linearClient = await getLinearClientForConnection(linearConnection.id);
      const connectionTest = await linearClient.testConnection();
      
      if (connectionTest.success) {
        return res.json({
          success: true,
          message: "Linear API connection successful",
          source: "connection",
          viewer: connectionTest.viewer
        });
      } else {
        return res.status(400).json({
          success: false,
          error: connectionTest.error || "Failed to connect to Linear API",
          source: "connection"
        });
      }
    } catch (error: any) {
      console.error("Error testing Linear connection:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to test Linear connection"
      });
    }
  });
  
  console.log("Integration routes set up successfully");
}