import { createDatabaseIfNotExists, getTasks } from "./notion-setup";

// Setup the Tasks database
async function setupTasksDatabase() {
  try {
    console.log("Setting up Tasks database in Notion...");
    
    // Create the Tasks database with our desired properties
    const tasksDb = await createDatabaseIfNotExists("Tasks", {
      // Every database needs a Name/Title property
      Title: {
        title: {}
      },
      Description: {
        rich_text: {}
      },
      Section: {
        select: {
          options: [
            { name: "Getting Started", color: "blue" },
            { name: "Account Setup", color: "green" },
            { name: "Documentation", color: "orange" },
            { name: "Training", color: "purple" },
            { name: "Uncategorized", color: "gray" }
          ]
        }
      },
      Completed: {
        checkbox: {}
      },
      DueDate: {
        date: {}
      },
      CompletedAt: {
        date: {}
      },
      Priority: {
        select: {
          options: [
            { name: "High", color: "red" },
            { name: "Medium", color: "yellow" },
            { name: "Low", color: "green" }
          ]
        }
      },
      Status: {
        select: {
          options: [
            { name: "To Do", color: "gray" },
            { name: "In Progress", color: "blue" },
            { name: "Done", color: "green" },
            { name: "Blocked", color: "red" }
          ]
        }
      }
    });
    
    console.log(`Tasks database created with ID: ${tasksDb.id}`);
    
    // Add sample tasks
    await createSampleTasks(tasksDb.id);
    
    return tasksDb;
  } catch (error) {
    console.error("Error setting up Tasks database:", error);
    throw error;
  }
}

// Create sample tasks in the database
async function createSampleTasks(databaseId: string) {
  try {
    // First check if tasks already exist to avoid duplication
    const existingTasks = await getTasks(databaseId);
    
    if (existingTasks.length > 0) {
      console.log(`${existingTasks.length} tasks already exist in the database. Skipping sample creation.`);
      return;
    }
    
    console.log("Creating sample tasks...");
    
    // Sample task data
    const sampleTasks = [
      {
        Title: "Integrate Slack data",
        Description: "Connect to Slack API and retrieve channel messages",
        Section: "Getting Started",
        Priority: "High",
        Status: "To Do"
      },
      {
        Title: "Set up Notion database",
        Description: "Create database structure for storing project information",
        Section: "Getting Started",
        Priority: "High",
        Status: "In Progress" 
      },
      {
        Title: "Create Linear integration",
        Description: "Connect to Linear API for project management data",
        Section: "Account Setup",
        Priority: "Medium",
        Status: "To Do"
      },
      {
        Title: "Add Google Drive connection",
        Description: "Implement file retrieval from Google Drive",
        Section: "Documentation",
        Priority: "Medium", 
        Status: "To Do"
      },
      {
        Title: "Build AI processing pipeline",
        Description: "Create data processing flow for generative AI",
        Section: "Training",
        Priority: "High",
        Status: "To Do"
      }
    ];
    
    // Add tasks to the database
    for (const task of sampleTasks) {
      try {
        await createTask(databaseId, task);
      } catch (err) {
        console.error(`Error creating task "${task.Title}":`, err);
      }
    }
    
    console.log("Sample tasks created successfully");
  } catch (error) {
    console.error("Error creating sample tasks:", error);
    throw error;
  }
}

// Helper function to create a single task
async function createTask(databaseId: string, task: any) {
  try {
    // Import the notion client to avoid circular dependency
    const { notion } = await import("./notion-setup");
    
    await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: task.Title
              }
            }
          ]
        },
        Description: {
          rich_text: [
            {
              text: {
                content: task.Description
              }
            }
          ]
        },
        Section: {
          select: {
            name: task.Section
          }
        },
        Completed: {
          checkbox: false
        },
        Priority: {
          select: {
            name: task.Priority
          }
        },
        Status: {
          select: {
            name: task.Status
          }
        }
      }
    });
    
    console.log(`Task "${task.Title}" created`);
  } catch (error) {
    console.error(`Error creating task:`, error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTasksDatabase()
    .then(() => {
      console.log("Notion database setup complete!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

export { setupTasksDatabase };