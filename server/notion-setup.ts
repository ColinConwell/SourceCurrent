import { Client } from "@notionhq/client";

let notionClient: Client | null = null;
let notionPageId: string | null = null;

export function getNotion() {
  if (!notionClient) {
    notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET || "dummy_secret",
    });
  }
  return notionClient;
}

export function getNotionPageId() {
  if (!notionPageId && process.env.NOTION_PAGE_URL) {
    try {
      notionPageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
    } catch (e) {
      console.warn("Invalid Notion Page URL, fallback to dummy ID");
      notionPageId = "dummy_id";
    }
  }
  return notionPageId || "dummy_id";
}

// Proxy for backward compatibility
export const notion = new Proxy({}, {
  get: (_target, prop) => {
    const client = getNotion();
    return client[prop as keyof Client];
  }
}) as Client;

// Backward compatible export for page ID, though using function is better
export const NOTION_PAGE_ID = new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'toString' || prop === 'valueOf') {
      return () => getNotionPageId();
    }
    // Return result of getNotionPageId() for other access
    const val = getNotionPageId();
    // @ts-ignore
    return val[prop];
  }
}) as unknown as string;


export function checkNotionEnv(): boolean {
  return !!(process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL);
}

export async function initNotion() {
  if (!checkNotionEnv()) {
    console.warn("Notion environment variables missing. Skipping Notion initialization.");
    return;
  }
  getNotion();
  getNotionPageId();
  console.log("Notion integration configured.");
}

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
  // Array to store the child databases
  const childDatabases = [];

  try {
    // Query all child blocks in the specified page
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: NOTION_PAGE_ID,
        start_cursor: startCursor,
      });

      // Process the results
      for (const block of response.results) {
        // Check if the block is a child database
        if ('type' in block && block.type === "child_database") {
          const databaseId = block.id;

          // Retrieve the database title
          try {
            const databaseInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });

            // Add the database to our list
            childDatabases.push(databaseInfo);
          } catch (error) {
            console.error(`Error retrieving database ${databaseId}:`, error);
          }
        }
      }

      // Check if there are more results to fetch
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return childDatabases;
  } catch (error) {
    console.error("Error listing child databases:", error);
    throw error;
  }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
  const databases = await getNotionDatabases();

  for (const db of databases) {
    // Access title safely with type narrowing
    // @ts-ignore - We know this is a DatabaseObjectResponse from retrieve
    if (db.title && Array.isArray(db.title) && db.title.length > 0) {
      // @ts-ignore - We know this is a DatabaseObjectResponse
      const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
      if (dbTitle === title.toLowerCase()) {
        return db;
      }
    }
  }

  return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
  const existingDb = await findDatabaseByTitle(title);
  if (existingDb) {
    return existingDb;
  }
  return await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: NOTION_PAGE_ID
    },
    title: [
      {
        type: "text",
        text: {
          content: title
        }
      }
    ],
    properties
  });
}

/**
 * Find any tasks database in the Notion workspace
 * @returns Promise resolving to a database ID if found, or undefined if not
 */
export async function findTasksDatabase() {
  try {
    // Get all databases
    const databases = await getNotionDatabases();

    // Look for a database with "task", "todo", or "to-do" in the title
    for (const db of databases) {
      // Access title safely with type narrowing
      // @ts-ignore - We know this is a DatabaseObjectResponse
      if (db.title && Array.isArray(db.title) && db.title.length > 0) {
        // @ts-ignore - We know this is a DatabaseObjectResponse
        const title = db.title[0]?.plain_text || '';
        const titleLower = title.toLowerCase();

        if (titleLower.includes('task') ||
          titleLower.includes('todo') ||
          titleLower.includes('to-do') ||
          titleLower.includes('to do')) {
          return db.id;
        }
      }
    }

    // If no task database found, return the first database (if any)
    if (databases.length > 0) {
      return databases[0].id;
    }

    return undefined;
  } catch (error) {
    console.error("Error finding tasks database:", error);
    return undefined;
  }
}

// Get all tasks from the Notion database
export async function getTasks(tasksDatabaseId?: string) {
  try {
    // If no database ID provided, try to find a tasks database
    if (!tasksDatabaseId) {
      const foundDatabaseId = await findTasksDatabase();

      // If still no database ID, throw error
      if (!foundDatabaseId) {
        throw new Error("No tasks database found in Notion workspace");
      }

      tasksDatabaseId = foundDatabaseId;
    }

    console.log(`Querying Notion database: ${tasksDatabaseId}`);

    const response = await notion.databases.query({
      database_id: tasksDatabaseId,
    });

    // Log the property structure of the first result to help with debugging
    if (response.results.length > 0) {
      const firstPage = response.results[0] as any;
      console.log("Sample property names:", Object.keys(firstPage.properties));
    }

    return response.results.map((page: any) => {
      const properties = page.properties;

      // Try to find properties by name or fallback to finding by type
      const title = findPropertyValue(properties, 'Title', 'title') || 'Untitled Task';
      const description = findPropertyValue(properties, 'Description', 'rich_text') || '';
      const isCompleted = findPropertyValueByType(properties, 'checkbox') || false;
      const section = findPropertyValue(properties, 'Section', 'select') || 'Uncategorized';
      const priority = findPropertyValue(properties, 'Priority', 'select') || null;
      const status = findPropertyValue(properties, 'Status', 'select') || null;

      // Find date properties
      const dueDateProp = findPropertyByType(properties, 'date', 0);
      const completedAtProp = findPropertyByType(properties, 'date', 1);

      const dueDate = dueDateProp?.date?.start ? new Date(dueDateProp.date.start) : null;
      const completedAt = completedAtProp?.date?.start ? new Date(completedAtProp.date.start) : null;

      return {
        notionId: page.id,
        title,
        description,
        section,
        isCompleted,
        dueDate,
        completedAt,
        priority,
        status,
      };
    });
  } catch (error) {
    console.error("Error fetching tasks from Notion:", error);
    throw new Error("Failed to fetch tasks from Notion");
  }
}

/**
 * Helper function to find a property by type
 */
function findPropertyByType(properties: Record<string, any>, type: string, index: number = 0) {
  const keys = Object.keys(properties).filter(k => properties[k]?.type === type);
  return keys.length > index ? properties[keys[index]] : null;
}

/**
 * Helper function to find a property value by name and type
 */
function findPropertyValue(properties: Record<string, any>, name: string, type: string) {
  // Try to find by exact name
  if (properties[name] && properties[name].type === type) {
    if (type === 'title' && properties[name].title.length > 0) {
      return properties[name].title[0].plain_text;
    } else if (type === 'rich_text' && properties[name].rich_text.length > 0) {
      return properties[name].rich_text[0].plain_text;
    } else if (type === 'select') {
      return properties[name].select?.name;
    } else if (type === 'checkbox') {
      return properties[name].checkbox;
    }
  }

  // Try case-insensitive
  const key = Object.keys(properties).find(k =>
    k.toLowerCase() === name.toLowerCase() && properties[k].type === type);

  if (key) {
    if (type === 'title' && properties[key].title.length > 0) {
      return properties[key].title[0].plain_text;
    } else if (type === 'rich_text' && properties[key].rich_text.length > 0) {
      return properties[key].rich_text[0].plain_text;
    } else if (type === 'select') {
      return properties[key].select?.name;
    } else if (type === 'checkbox') {
      return properties[key].checkbox;
    }
  }

  return null;
}

/**
 * Helper function to find a property value by type only
 */
function findPropertyValueByType(properties: Record<string, any>, type: string) {
  const property = findPropertyByType(properties, type);

  if (!property) return null;

  if (type === 'title' && property.title.length > 0) {
    return property.title[0].plain_text;
  } else if (type === 'rich_text' && property.rich_text.length > 0) {
    return property.rich_text[0].plain_text;
  } else if (type === 'select') {
    return property.select?.name;
  } else if (type === 'checkbox') {
    return property.checkbox;
  }

  return null;
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