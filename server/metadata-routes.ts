import type { Express, Request, Response } from "express";
import { getChannelDataAsDictionary } from "./slack-setup";
import { getTasks, getNotionDatabases, notion, NOTION_PAGE_ID } from "./notion-setup";

/**
 * Collects and returns metadata about connected services
 * including available data sources, schema information,
 * and other structural metadata
 */
export async function setupMetadataRoutes(app: Express) {
  console.log("Setting up metadata routes...");
  
  // Endpoint to get metadata for all connected services
  app.get("/api/metadata/services", async (_req: Request, res: Response) => {
    try {
      const metadata: Record<string, any> = {};
      
      // Collect Slack metadata if available
      try {
        if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
          const channelInfo = await getSlackMetadata();
          if (channelInfo) {
            metadata.slack = channelInfo;
          }
        }
      } catch (slackError: any) {
        console.error("Error collecting Slack metadata:", slackError);
        metadata.slack = { 
          error: slackError.message,
          status: "error" 
        };
      }
      
      // Collect Notion metadata if available
      try {
        if (process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL) {
          const notionData = await getNotionMetadata();
          if (notionData) {
            metadata.notion = notionData;
          }
        }
      } catch (notionError: any) {
        console.error("Error collecting Notion metadata:", notionError);
        metadata.notion = { 
          error: notionError.message,
          status: "error" 
        };
      }
      
      res.json({
        success: true,
        data: metadata
      });
    } catch (error: any) {
      console.error("Error generating metadata:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error generating metadata"
      });
    }
  });
  
  // Endpoint to get schema information for a specific Notion database
  app.get("/api/metadata/notion/schema/:databaseId", async (req: Request, res: Response) => {
    const { databaseId } = req.params;
    
    try {
      const schema = await getNotionDatabaseSchema(databaseId);
      
      res.json({
        success: true,
        data: schema
      });
    } catch (error: any) {
      console.error(`Error getting schema for database ${databaseId}:`, error);
      res.status(500).json({
        success: false,
        error: error.message || "Error getting database schema"
      });
    }
  });
  
  console.log("Metadata routes set up successfully");
}

/**
 * Collects metadata about the Slack workspace and channel
 */
async function getSlackMetadata() {
  const channelId = process.env.SLACK_CHANNEL_ID!;
  
  try {
    // Get basic channel information
    const channelData = await getChannelDataAsDictionary(channelId);
    const channelInfo = channelData.channel_info;
    
    // Extract message metadata (message types, frequency, etc.)
    const messageTypes = new Set<string>();
    const userIds = new Set<string>();
    const timestamps: number[] = [];
    let hasFiles = false;
    let hasReactions = false;
    let hasMentions = false;
    let hasLinks = false;
    
    channelData.messages.forEach((message: any) => {
      // Collect user IDs
      if (message.user) {
        userIds.add(message.user);
      }
      
      // Track types of messages
      if (message.attachments?.length) messageTypes.add('attachment');
      if (message.files?.length) {
        messageTypes.add('file');
        hasFiles = true;
      }
      if (message.reactions?.length) {
        messageTypes.add('reaction');
        hasReactions = true;
      }
      if (message.text?.includes('<@')) {
        messageTypes.add('mention');
        hasMentions = true;
      }
      if (message.text?.includes('<http')) {
        messageTypes.add('link');
        hasLinks = true;
      }
      
      // Collect timestamps for time analysis
      if (message.timestamp) {
        timestamps.push(parseFloat(message.timestamp));
      }
    });
    
    // Get message frequency statistics
    let oldestMessage = 0;
    let newestMessage = 0;
    
    if (timestamps.length > 0) {
      timestamps.sort();
      oldestMessage = timestamps[0];
      newestMessage = timestamps[timestamps.length - 1];
    }
    
    return {
      channel: {
        id: channelInfo.id,
        name: channelInfo.name,
        topic: channelInfo.topic,
        memberCount: channelInfo.member_count,
        isArchived: channelInfo.is_archived,
        created: channelInfo.created
      },
      messages: {
        count: channelData.messages?.length || 0,
        uniqueUsers: userIds.size,
        oldestTimestamp: oldestMessage,
        newestTimestamp: newestMessage,
        types: Array.from(messageTypes),
        hasFiles,
        hasReactions,
        hasMentions,
        hasLinks
      },
      users: {
        count: Object.keys(channelData.users || {}).length
      },
      status: "active"
    };
  } catch (error) {
    console.error('Error generating Slack metadata:', error);
    throw error;
  }
}

/**
 * Collects metadata about the Notion workspace
 */
async function getNotionMetadata() {
  try {
    // Get information about the main page
    const pageInfo = await notion.pages.retrieve({ page_id: NOTION_PAGE_ID });
    
    // Get all databases in the page
    const databases = await getNotionDatabases();
    
    // Get tasks database
    let tasksDb = null;
    let tasksCount = 0;
    let tasksData = null;
    
    // Look for a database that might be a tasks database
    for (const db of databases) {
      // Check if the database title contains "task" or "todo"
      // Access title safely as any to handle TypeScript issues with Notion API types
      const dbAny = db as any;
      const title = dbAny.title?.[0]?.plain_text || '';
      if (title.toLowerCase().includes('task') || title.toLowerCase().includes('todo')) {
        tasksDb = db;
        
        // Get task count
        try {
          const tasks = await getTasks(db.id);
          tasksCount = tasks.length;
          tasksData = {
            count: tasksCount,
            completed: tasks.filter((t: any) => t.isCompleted).length,
            notStarted: tasks.filter((t: any) => !t.isCompleted).length,
            priorities: {
              high: tasks.filter((t: any) => t.priority === 'High').length,
              medium: tasks.filter((t: any) => t.priority === 'Medium').length,
              low: tasks.filter((t: any) => t.priority === 'Low').length,
            },
            schema: await getNotionDatabaseSchema(db.id)
          };
        } catch (error) {
          console.error(`Error getting tasks from database ${db.id}:`, error);
        }
        
        break;
      }
    }
    
    // Cast pageInfo to any to handle TypeScript issues with Notion API types
    const pageInfoAny = pageInfo as any;
    
    return {
      page: {
        id: pageInfo.id,
        title: pageInfoAny.properties?.title?.title?.[0]?.plain_text || 'Untitled',
        createdTime: pageInfoAny.created_time || new Date().toISOString(),
        lastEditedTime: pageInfoAny.last_edited_time || new Date().toISOString(),
        icon: pageInfoAny.icon?.type === 'emoji' ? pageInfoAny.icon.emoji : undefined
      },
      databases: {
        count: databases.length,
        list: databases.map(db => {
          const dbAny = db as any;
          return {
            id: db.id,
            title: dbAny.title?.[0]?.plain_text || 'Untitled Database',
            isTasks: db.id === tasksDb?.id
          };
        })
      },
      tasks: tasksData,
      status: "active"
    };
  } catch (error) {
    console.error('Error generating Notion metadata:', error);
    throw error;
  }
}

/**
 * Gets the schema for a Notion database
 */
async function getNotionDatabaseSchema(databaseId: string) {
  try {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    
    // Extract property schemas
    const properties: Record<string, any> = {};
    
    for (const [key, property] of Object.entries(database.properties || {})) {
      properties[key] = {
        type: property.type,
        name: property.name
      };
      
      // Add type-specific schema information
      switch (property.type) {
        case 'select':
          properties[key].options = property.select.options.map((opt: any) => ({
            name: opt.name,
            color: opt.color
          }));
          break;
        case 'multi_select':
          properties[key].options = property.multi_select.options.map((opt: any) => ({
            name: opt.name,
            color: opt.color
          }));
          break;
        case 'status':
          properties[key].options = property.status.options.map((opt: any) => ({
            name: opt.name,
            color: opt.color
          }));
          break;
        // Add other property types as needed
      }
    }
    
    // Cast database to any to handle TypeScript issues with Notion API types
    const databaseAny = database as any;
    
    return {
      id: database.id,
      title: databaseAny.title?.[0]?.plain_text || 'Untitled Database',
      properties,
      propertyCount: Object.keys(properties).length
    };
  } catch (error) {
    console.error(`Error getting schema for database ${databaseId}:`, error);
    throw error;
  }
}