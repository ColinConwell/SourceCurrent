import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertConnectionSchema, insertDataSourceSchema, insertPipelineSchema, insertActivitySchema } from "@shared/schema";
import { getSlackClientForConnection } from "./slack-client";
import { getNotionClientForConnection } from "./notion-client";
import { getLinearClientForConnection } from "./linear-client";
import { getGDriveClientForConnection } from "./gdrive-client";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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
    } catch (error) {
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
    } catch (error) {
      console.error('Error discovering sources:', error);
      res.status(500).json({ message: `Failed to discover sources: ${error.message}` });
    }
  });

  // OAUTH ROUTES
  // These would typically handle the OAuth flow for each service
  // For a demo, we can use simplified endpoints that would normally redirect to OAuth providers

  app.get('/api/auth/:service', (req: Request, res: Response) => {
    const service = req.params.service;
    
    // In a real app, this would redirect to the OAuth provider
    // For demo purposes, we'll just return the auth URL info
    switch (service) {
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

  app.get('/api/auth/:service/callback', (req: Request, res: Response) => {
    // In a real app, this would handle the OAuth callback and exchange the code for tokens
    // For demo purposes, we'll just acknowledge the callback
    const service = req.params.service;
    const code = req.query.code;
    
    if (!code) {
      return res.status(400).json({ message: "Missing authorization code" });
    }
    
    res.json({
      message: `Received authorization code for ${service}`,
      note: "In a real app, this would exchange the code for access tokens"
    });
  });

  return httpServer;
}
