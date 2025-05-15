import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertConnectionSchema, insertDataSourceSchema, insertPipelineSchema, insertActivitySchema } from "@shared/schema";
import { getSlackClientForConnection } from "./slack-client";
import { getNotionClientForConnection } from "./notion-client";
import { getLinearClientForConnection } from "./linear-client";
import { getGDriveClientForConnection } from "./gdrive-client";
import { z } from "zod";
import axios from "axios";
import { setupIntegrationRoutes } from "./integration-routes";
import { getAvailableServicesFromEnv } from "./env-setup";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up our integration routes for Slack, Notion, etc.
  await setupIntegrationRoutes(app);

  // USER ROUTES
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // In a real app, you would set up a session or JWT here
      // For demo, just return the user without the password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // CONNECTION ROUTES
  app.get('/api/connections', async (req: Request, res: Response) => {
    try {
      // For demo, use a fixed user ID
      const userId = 1;
      const connections = await storage.getConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to get connections" });
    }
  });

  app.post('/api/connections', async (req: Request, res: Response) => {
    try {
      // For demo, use a fixed user ID
      const userId = 1;
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        userId
      });
      
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid connection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.patch('/api/connections/:id', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const updates = req.body;
      const updatedConnection = await storage.updateConnection(connectionId, updates);
      
      res.json(updatedConnection);
    } catch (error) {
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  app.delete('/api/connections/:id', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      await storage.deleteConnection(connectionId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // DATA SOURCE ROUTES
  app.get('/api/connections/:connectionId/data-sources', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const dataSources = await storage.getDataSources(connectionId);
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ message: "Failed to get data sources" });
    }
  });

  app.post('/api/connections/:connectionId/data-sources', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const dataSourceData = insertDataSourceSchema.parse({
        ...req.body,
        connectionId
      });
      
      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data source data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  // PIPELINE ROUTES
  app.get('/api/pipelines', async (req: Request, res: Response) => {
    try {
      // For demo, use a fixed user ID
      const userId = 1;
      const pipelines = await storage.getPipelines(userId);
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ message: "Failed to get pipelines" });
    }
  });

  app.post('/api/pipelines', async (req: Request, res: Response) => {
    try {
      // For demo, use a fixed user ID
      const userId = 1;
      const pipelineData = insertPipelineSchema.parse({
        ...req.body,
        userId
      });
      
      const pipeline = await storage.createPipeline(pipelineData);
      res.status(201).json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pipeline data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pipeline" });
    }
  });

  app.patch('/api/pipelines/:id', async (req: Request, res: Response) => {
    try {
      const pipelineId = parseInt(req.params.id);
      
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: "Invalid pipeline ID" });
      }
      
      const pipeline = await storage.getPipeline(pipelineId);
      
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      const updates = req.body;
      const updatedPipeline = await storage.updatePipeline(pipelineId, updates);
      
      res.json(updatedPipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pipeline" });
    }
  });

  app.delete('/api/pipelines/:id', async (req: Request, res: Response) => {
    try {
      const pipelineId = parseInt(req.params.id);
      
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: "Invalid pipeline ID" });
      }
      
      const pipeline = await storage.getPipeline(pipelineId);
      
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      await storage.deletePipeline(pipelineId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pipeline" });
    }
  });

  // DATA ROUTES
  app.get('/api/connections/:connectionId/data', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      const sourceId = req.query.sourceId as string;
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (!connection.active) {
        return res.status(400).json({ message: "Connection is not active" });
      }
      
      let data;
      
      switch (connection.service) {
        case 'slack':
          const slackClient = await getSlackClientForConnection(connectionId);
          data = await slackClient.getChannelDataAsDictionary(sourceId);
          break;
          
        case 'notion':
          const notionClient = await getNotionClientForConnection(connectionId);
          data = await notionClient.getDatabaseAsDictionary(sourceId);
          break;
          
        case 'linear':
          const linearClient = await getLinearClientForConnection(connectionId);
          data = await linearClient.getTeamDataAsDictionary(sourceId);
          break;
          
        case 'gdrive':
          const gdriveClient = await getGDriveClientForConnection(connectionId);
          data = await gdriveClient.getFolderContentsAsDictionary(sourceId);
          break;
          
        default:
          return res.status(400).json({ message: `Unsupported service: ${connection.service}` });
      }
      
      // Update last synced time
      await storage.updateConnection(connectionId, { lastSyncedAt: new Date() });
      
      // Add activity
      await storage.createActivity({
        userId: connection.userId,
        type: "data_sync",
        description: `Refreshed data from ${connection.service}`,
        metadata: { connectionId, sourceId }
      });
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: `Failed to fetch data: ${error.message}` });
    }
  });

  // ACTIVITY ROUTES
  app.get('/api/activities', async (req: Request, res: Response) => {
    try {
      // For demo, use a fixed user ID
      const userId = 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // SOURCES DISCOVERY ROUTES
  app.get('/api/connections/:connectionId/discover', async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.getConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      if (!connection.active) {
        return res.status(400).json({ message: "Connection is not active" });
      }
      
      let sources;
      
      switch (connection.service) {
        case 'slack':
          const slackClient = await getSlackClientForConnection(connectionId);
          sources = await slackClient.getChannelList();
          break;
          
        case 'notion':
          const notionClient = await getNotionClientForConnection(connectionId);
          sources = await notionClient.getDatabases();
          break;
          
        case 'linear':
          const linearClient = await getLinearClientForConnection(connectionId);
          sources = await linearClient.getTeams();
          break;
          
        case 'gdrive':
          const gdriveClient = await getGDriveClientForConnection(connectionId);
          sources = await gdriveClient.listFolders();
          break;
          
        default:
          return res.status(400).json({ message: `Unsupported service: ${connection.service}` });
      }
      
      res.json(sources);
    } catch (error: any) {
      console.error('Error discovering sources:', error);
      res.status(500).json({ message: `Failed to discover sources: ${error.message}` });
    }
  });

  // ENVIRONMENT SERVICES ENDPOINT
  // Returns information about available services based on environment variables
  app.get('/api/environment/services', (_req: Request, res: Response) => {
    try {
      const availableServices = getAvailableServicesFromEnv();
      
      res.json({
        success: true,
        data: {
          availableServices,
          configured: Object.entries(availableServices)
            .filter(([_, available]) => available)
            .map(([service]) => service)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // OAUTH ROUTES
  // These would typically handle the OAuth flow for each service
  // For a demo, we can use simplified endpoints that would normally redirect to OAuth providers

  app.get('/api/auth/:service', (req: Request, res: Response) => {
    const service = req.params.service;
    
    // Create a state parameter to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);
    
    // In a real app, this would redirect to the OAuth provider
    switch (service) {
      case 'github':
        // For GitHub, we'll actually implement the real OAuth flow
        if (process.env.GITHUB_CLIENT_ID) {
          const scopes = 'repo read:user user:email';
          const redirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
          const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
          
          res.redirect(authUrl);
        } else {
          res.status(500).json({ message: "GitHub client ID not configured" });
        }
        break;
        
      case 'slack':
        res.json({
          auth_url: "https://slack.com/oauth/v2/authorize",
          required_params: ["client_id", "scope", "redirect_uri"]
        });
        break;
        
      case 'notion':
        res.json({
          auth_url: "https://api.notion.com/v1/oauth/authorize",
          required_params: ["client_id", "response_type", "redirect_uri"]
        });
        break;
        
      case 'linear':
        res.json({
          auth_url: "https://linear.app/oauth/authorize",
          required_params: ["client_id", "redirect_uri", "scope", "response_type"]
        });
        break;
        
      case 'gdrive':
        res.json({
          auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
          required_params: ["client_id", "redirect_uri", "response_type", "scope"]
        });
        break;
        
      default:
        res.status(400).json({ message: `Unsupported service: ${service}` });
    }
  });

  app.get('/api/auth/:service/callback', async (req: Request, res: Response) => {
    // Handle OAuth callbacks for different services
    const service = req.params.service;
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code) {
      return res.status(400).json({ message: "Missing authorization code" });
    }

    // For GitHub, implement the full OAuth flow
    if (service === 'github') {
      try {
        // Exchange the code for an access token
        const tokenResponse = await axios.post(
          'https://github.com/login/oauth/access_token',
          {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`,
          },
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const accessToken = tokenResponse.data.access_token;
        
        if (!accessToken) {
          throw new Error('Failed to obtain access token');
        }

        // Get user info to create a meaningful connection name
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        const user = userResponse.data;
        
        // Create a connection for this GitHub account
        const connection: InsertConnection = {
          userId: 1, // Demo user
          name: `${user.name || user.login}'s GitHub`,
          service: 'github',
          credentials: {
            token: accessToken,
          },
          active: true,
        };

        const newConnection = await storage.createConnection(connection);
        
        // Create a data source for repositories
        await storage.createDataSource({
          connectionId: newConnection.id,
          name: 'GitHub Repositories',
          sourceId: 'repos',
          sourceType: 'repository',
          config: {
            username: user.login,
          },
        });

        // Create an activity record
        await storage.createActivity({
          userId: 1,
          type: 'connection_created',
          description: `Connected to GitHub as ${user.login}`,
          metadata: {
            service: 'github',
            username: user.login,
          },
        });

        // Redirect to the dashboard with success message
        res.redirect('/?github=success');
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.redirect('/?github=error');
      }
    } else {
      // For other services, we'd implement similar OAuth exchange flows
      res.json({
        message: `Received authorization code for ${service}`,
        note: "This is a demo implementation. In a real app, this would exchange the code for access tokens."
      });
    }
  });

  return httpServer;
}
