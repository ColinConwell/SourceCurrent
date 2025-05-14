import type { Express, Request, Response } from "express";
import { getChannelDataAsDictionary } from "./slack-setup";
import { getTasks } from "./notion-setup";
import { setupTasksDatabase } from "./setup-notion-database";

// This will be initialized when setupIntegrationRoutes is called
let tasksDbId: string | null = null;

/**
 * Sets up routes for our integrations with Slack, Notion, etc.
 * @param app Express application
 */
export async function setupIntegrationRoutes(app: Express) {
  console.log("Setting up integration routes...");
  
  // Initialize our Notion database
  try {
    const tasksDb = await setupTasksDatabase();
    tasksDbId = tasksDb.id;
    console.log(`Tasks database initialized with ID: ${tasksDbId}`);
  } catch (error) {
    console.error("Error initializing Notion database:", error);
    // Continue even if there's an error, as the routes can still work
  }
  
  // Slack integration routes
  app.get("/api/slack/messages", async (req: Request, res: Response) => {
    try {
      const channelId = req.query.channelId as string || process.env.SLACK_CHANNEL_ID;
      const data = await getChannelDataAsDictionary(channelId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Error fetching Slack messages:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error fetching Slack messages"
      });
    }
  });
  
  // Notion integration routes
  app.get("/api/notion/tasks", async (req: Request, res: Response) => {
    try {
      if (!tasksDbId) {
        return res.status(500).json({
          success: false,
          error: "Tasks database not initialized"
        });
      }
      
      const tasks = await getTasks(tasksDbId);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error("Error fetching Notion tasks:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error fetching Notion tasks"
      });
    }
  });
  
  // Data integration route - combines data from multiple sources
  app.get("/api/integration/dashboard", async (req: Request, res: Response) => {
    try {
      // Get Slack messages
      let slackData = null;
      try {
        slackData = await getChannelDataAsDictionary();
      } catch (slackError) {
        console.error("Error fetching Slack data:", slackError);
        // Continue even if Slack data fails
      }
      
      // Get Notion tasks
      let notionTasks = null;
      try {
        if (tasksDbId) {
          notionTasks = await getTasks(tasksDbId);
        }
      } catch (notionError) {
        console.error("Error fetching Notion tasks:", notionError);
        // Continue even if Notion data fails
      }
      
      // Combine the data
      const dashboardData = {
        slack: slackData,
        notion: {
          tasks: notionTasks
        },
        // We can add other integrations here as we implement them
        integrationStatus: {
          slack: slackData ? "connected" : "error",
          notion: notionTasks ? "connected" : "error",
          linear: "not_configured",
          gdrive: "not_configured"
        }
      };
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error("Error generating integration dashboard:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error generating integration dashboard"
      });
    }
  });
  
  console.log("Integration routes set up successfully");
}