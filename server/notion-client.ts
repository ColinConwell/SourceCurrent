import { Client } from "@notionhq/client";
import { storage } from "./storage";

// Base Notion client class for API calls
export class NotionClient {
  private client: Client;
  
  constructor(integrationToken: string) {
    this.client = new Client({
      auth: integrationToken
    });
  }
  
  // Extract page ID from URL
  private extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      return match[1];
    }
    throw Error("Failed to extract page ID");
  }
  
  // Get list of databases in a workspace/page
  async getDatabases() {
    try {
      const response = await this.client.search({
        filter: {
          value: 'database',
          property: 'object'
        }
      });
      
      return response.results;
    } catch (error) {
      console.error('Error fetching Notion databases:', error);
      throw new Error(`Failed to fetch Notion databases: ${error.message}`);
    }
  }
  
  // Get detailed database info
  async getDatabaseInfo(databaseId: string) {
    try {
      return await this.client.databases.retrieve({
        database_id: databaseId
      });
    } catch (error) {
      console.error(`Error fetching database ${databaseId}:`, error);
      throw new Error(`Failed to fetch Notion database info: ${error.message}`);
    }
  }
  
  // Query database content
  async queryDatabase(databaseId: string, filter: any = undefined) {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter
      });
      
      return response.results;
    } catch (error) {
      console.error(`Error querying database ${databaseId}:`, error);
      throw new Error(`Failed to query Notion database: ${error.message}`);
    }
  }
  
  // Get page content
  async getPage(pageId: string) {
    try {
      return await this.client.pages.retrieve({
        page_id: pageId
      });
    } catch (error) {
      console.error(`Error fetching page ${pageId}:`, error);
      throw new Error(`Failed to fetch Notion page: ${error.message}`);
    }
  }
  
  // Get page blocks
  async getPageBlocks(pageId: string) {
    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId
      });
      
      return response.results;
    } catch (error) {
      console.error(`Error fetching blocks for page ${pageId}:`, error);
      throw new Error(`Failed to fetch Notion page blocks: ${error.message}`);
    }
  }
  
  // Convert to dictionary format
  async getDatabaseAsDictionary(databaseId: string) {
    try {
      const databaseInfo = await this.getDatabaseInfo(databaseId);
      const pages = await this.queryDatabase(databaseId);
      
      // Extract and transform the data
      const transformedPages = await Promise.all(pages.map(async (page) => {
        const properties = {};
        
        // Process each property
        for (const [key, value] of Object.entries(page.properties)) {
          // Handle different property types
          switch (value.type) {
            case 'title':
              properties[key] = value.title.map(t => t.plain_text).join('');
              break;
            case 'rich_text':
              properties[key] = value.rich_text.map(t => t.plain_text).join('');
              break;
            case 'select':
              properties[key] = value.select?.name || null;
              break;
            case 'multi_select':
              properties[key] = value.multi_select.map(item => item.name);
              break;
            case 'date':
              properties[key] = value.date?.start || null;
              break;
            case 'checkbox':
              properties[key] = value.checkbox;
              break;
            case 'number':
              properties[key] = value.number;
              break;
            case 'url':
              properties[key] = value.url;
              break;
            case 'email':
              properties[key] = value.email;
              break;
            case 'phone_number':
              properties[key] = value.phone_number;
              break;
            default:
              properties[key] = null;
          }
        }
        
        return {
          id: page.id,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          properties
        };
      }));
      
      // Create the dictionary structure
      return {
        database_info: {
          id: databaseInfo.id,
          title: databaseInfo.title?.[0]?.plain_text || '',
          created_time: databaseInfo.created_time,
          last_edited_time: databaseInfo.last_edited_time,
          properties: Object.keys(databaseInfo.properties).reduce((acc, key) => {
            acc[key] = databaseInfo.properties[key].type;
            return acc;
          }, {})
        },
        pages: transformedPages
      };
    } catch (error) {
      console.error('Error creating Notion dictionary:', error);
      throw new Error(`Failed to create Notion data dictionary: ${error.message}`);
    }
  }
}

// Factory function to get a client for a specific connection
export async function getNotionClientForConnection(connectionId: number): Promise<NotionClient> {
  const connection = await storage.getConnection(connectionId);
  
  if (!connection) {
    throw new Error(`Connection with ID ${connectionId} not found`);
  }
  
  if (connection.service !== 'notion') {
    throw new Error(`Connection ${connectionId} is not a Notion connection`);
  }
  
  if (!connection.active) {
    throw new Error(`Notion connection ${connectionId} is not active`);
  }
  
  const credentials = connection.credentials as { integration_token: string };
  
  if (!credentials.integration_token) {
    throw new Error(`Notion connection ${connectionId} has invalid credentials`);
  }
  
  return new NotionClient(credentials.integration_token);
}
