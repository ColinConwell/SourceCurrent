import type { Express, Request, Response } from "express";
import { getChannelDataAsDictionary } from "./slack-setup";
import { getTasks, getNotionDatabases, findTasksDatabase, notion, NOTION_PAGE_ID } from "./notion-setup";
import { storage } from "./storage";
import { getGitHubClientForConnection, GitHubClient } from "./github-client";
import { getLinearClientForConnection, LinearClient } from "./linear-client";
import axios from "axios";

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
      
      // Collect GitHub metadata if available
      try {
        if (process.env.GITHUB_APP_ID && process.env.GITHUB_INSTALLATION_ID && process.env.GITHUB_PRIVATE_KEY) {
          // Try to find an existing GitHub connection
          const connections = await storage.getConnections(1); // Using default user ID
          const githubConnection = connections.find(conn => conn.service === 'github');
          
          if (githubConnection) {
            const githubData = await getGitHubMetadata(githubConnection.id);
            if (githubData) {
              metadata.github = githubData;
            }
          } else {
            console.warn("GitHub App credentials available but no connection found");
            metadata.github = { 
              status: "no_connection",
              message: "GitHub App credentials available but no connection found" 
            };
          }
        } else if (process.env.GITHUB_TOKEN) {
          // Fallback to personal access token if available (legacy method)
          const githubData = await getGitHubMetadataWithToken();
          if (githubData) {
            metadata.github = githubData;
          }
        }
      } catch (githubError: any) {
        console.error("Error collecting GitHub metadata:", githubError);
        metadata.github = { 
          error: githubError.message,
          status: "error" 
        };
      }
      
      // Collect Linear metadata if available
      try {
        if (process.env.LINEAR_API_KEY) {
          const linearData = await getLinearMetadata();
          if (linearData) {
            metadata.linear = linearData;
          }
        }
      } catch (linearError: any) {
        console.error("Error collecting Linear metadata:", linearError);
        metadata.linear = { 
          error: linearError.message,
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
    
    // Handle case where users might not be available due to missing permissions
    if (!channelData.users || Object.keys(channelData.users).length === 0) {
      console.warn("Users data not available - may need 'users:read' scope in Slack token");
    }
    
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
    
    // Find a tasks database
    try {
      const tasksDatabaseId = await findTasksDatabase();
      
      if (tasksDatabaseId) {
        // Get the database info
        for (const db of databases) {
          if (db.id === tasksDatabaseId) {
            tasksDb = db;
            break;
          }
        }
        
        // Get task count and data
        try {
          const tasks = await getTasks(tasksDatabaseId);
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
            schema: await getNotionDatabaseSchema(tasksDatabaseId)
          };
        } catch (error) {
          console.error(`Error getting tasks from database ${tasksDatabaseId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error finding tasks database:", error);
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
 * Collects metadata about GitHub repositories and user using GitHub App authentication
 */
async function getGitHubMetadata(connectionId: number) {
  try {
    // Get a GitHub client for this connection (will use GitHub App authentication)
    const githubClient = await getGitHubClientForConnection(connectionId);
    
    // Get App information
    let appInfo = null;
    try {
      appInfo = await githubClient.getAppInfo();
    } catch (appError) {
      console.error("Failed to fetch GitHub App info:", appError);
    }
    
    // Try to get repositories from the installation
    let repos = [];
    try {
      repos = await githubClient.getInstallationRepositories();
    } catch (repoError) {
      console.error("Failed to fetch installation repositories, falling back to user repositories:", repoError);
      try {
        repos = await githubClient.getRepositories();
      } catch (userRepoError) {
        console.error("Failed to fetch user repositories:", userRepoError);
        throw userRepoError;
      }
    }
    
    // Get user information if available
    let user = null;
    try {
      user = await githubClient.getUserInfo();
    } catch (userError) {
      console.warn("Failed to fetch GitHub user info:", userError);
      // Create a minimal user object with info from repositories if possible
      if (repos.length > 0 && repos[0].owner) {
        user = {
          login: repos[0].owner.login,
          avatar_url: repos[0].owner.avatar_url,
          html_url: repos[0].owner.html_url
        };
      }
    }
    
    // Process repository data
    const repoStats = {
      totalCount: repos.length,
      languageCounts: {} as Record<string, number>,
      stargazerSum: 0,
      forkSum: 0,
      issueSum: 0,
      topStarred: [] as any[],
      recentlyUpdated: [] as any[]
    };
    
    // Extract language statistics
    repos.forEach((repo: any) => {
      if (repo.language) {
        repoStats.languageCounts[repo.language] = (repoStats.languageCounts[repo.language] || 0) + 1;
      }
      
      repoStats.stargazerSum += repo.stargazers_count;
      repoStats.forkSum += repo.forks_count;
      repoStats.issueSum += repo.open_issues_count;
    });
    
    // Sort repos by stars and get top 5
    repoStats.topStarred = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner?.login,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        description: repo.description,
        url: repo.html_url
      }));
    
    // Get 5 most recently updated repos
    repoStats.recentlyUpdated = [...repos]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        updatedAt: repo.updated_at,
        language: repo.language,
        description: repo.description,
        url: repo.html_url
      }));
    
    // Get user activity if we have a username
    let activityData = [];
    if (user && user.login) {
      try {
        activityData = await githubClient.getUserActivity(user.login);
        activityData = activityData.slice(0, 10);
      } catch (err) {
        console.error("Failed to fetch GitHub activity data:", err);
      }
    }
    
    const result: any = {
      repositories: repoStats,
      status: "active",
      sourceType: "github_app"
    };
    
    // Add app info if available
    if (appInfo) {
      result.app = {
        id: appInfo.id,
        name: appInfo.name,
        description: appInfo.description,
        html_url: appInfo.html_url,
        external_url: appInfo.external_url
      };
    }
    
    // Add user info if available
    if (user) {
      result.user = {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        company: user.company,
        blog: user.blog,
        location: user.location,
        createdAt: user.created_at
      };
    }
    
    if (activityData.length > 0) {
      result.recentActivity = activityData;
    }
    
    return result;
  } catch (error: any) {
    console.error("Error generating GitHub metadata:", error);
    
    const errorStatus = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    
    // Check for specific error types
    if (errorStatus === 401) {
      return {
        error: "Authentication failed. Please check your GitHub credentials.",
        status: "error",
        errorCode: "UNAUTHORIZED"
      };
    } else if (errorStatus === 403 && errorMessage?.includes("rate limit")) {
      return {
        error: "GitHub API rate limit exceeded. Please try again later.",
        status: "error",
        errorCode: "RATE_LIMITED"
      };
    }
    
    throw error;
  }
}

/**
 * Collects metadata about Linear teams and issues
 */
async function getLinearMetadata() {
  try {
    // Try to find an existing Linear connection
    const connections = await storage.getConnections(1); // Using default user ID
    const linearConnection = connections.find(conn => conn.service === 'linear');
    
    if (!linearConnection) {
      return {
        status: "no_connection",
        message: "Linear API key available but no connection found"
      };
    }
    
    // Get Linear client for this connection
    const linearClient = await getLinearClientForConnection(linearConnection.id);
    
    // Get teams information
    const teams = await linearClient.getTeams();
    
    // Get workflow states
    const workflowStates = await linearClient.getWorkflowStates();
    
    // Get issues for each team (limited to first 3 teams to avoid excessive API calls)
    const teamIssues = [];
    const teamsToProcess = teams.slice(0, 3); // Process up to 3 teams
    
    for (const team of teamsToProcess) {
      try {
        const issues = await linearClient.getTeamIssues(team.id);
        teamIssues.push({
          teamId: team.id,
          teamName: team.name,
          teamKey: team.key,
          issueCount: issues.length,
          issues: issues.slice(0, 5) // Only include first 5 issues per team
        });
      } catch (error) {
        console.error(`Error fetching issues for team ${team.name}:`, error);
        teamIssues.push({
          teamId: team.id,
          teamName: team.name,
          teamKey: team.key,
          error: "Failed to fetch issues"
        });
      }
    }
    
    // Get current user/viewer information
    let viewer = null;
    try {
      viewer = await linearClient.getViewer();
    } catch (error) {
      console.error("Error fetching Linear viewer info:", error);
    }
    
    // Compile stats
    const stats = {
      teamCount: teams.length,
      stateCount: workflowStates.length,
      statesByType: {} as Record<string, number>,
      teamsWithData: teamIssues.length
    };
    
    // Categorize workflow states
    workflowStates.forEach(state => {
      if (state.type) {
        stats.statesByType[state.type] = (stats.statesByType[state.type] || 0) + 1;
      }
    });
    
    return {
      status: "active",
      sourceType: "linear_api",
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        key: team.key,
        description: team.description,
        color: team.color
      })),
      workflowStates: workflowStates.slice(0, 10).map(state => ({
        id: state.id,
        name: state.name,
        type: state.type,
        color: state.color,
        teamId: state.team?.id,
        teamName: state.team?.name
      })),
      teamIssues,
      stats,
      viewer: viewer ? {
        id: viewer.id,
        name: viewer.name,
        email: viewer.email,
        avatarUrl: viewer.avatarUrl
      } : null
    };
  } catch (error: any) {
    console.error("Error generating Linear metadata:", error);
    return {
      error: error.message,
      status: "error"
    };
  }
}

async function getGitHubMetadataWithToken() {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Get user information
    const userResponse = await axios.get('https://api.github.com/user', { headers });
    const user = userResponse.data;
    
    // Get repositories
    const reposResponse = await axios.get(`https://api.github.com/user/repos?per_page=100&sort=updated`, { headers });
    const repos = reposResponse.data;
    
    // Process repository data
    const repoStats = {
      totalCount: repos.length,
      languageCounts: {} as Record<string, number>,
      stargazerSum: 0,
      forkSum: 0,
      issueSum: 0,
      topStarred: [] as any[],
      recentlyUpdated: [] as any[]
    };
    
    // Extract language statistics
    repos.forEach((repo: any) => {
      if (repo.language) {
        repoStats.languageCounts[repo.language] = (repoStats.languageCounts[repo.language] || 0) + 1;
      }
      
      repoStats.stargazerSum += repo.stargazers_count;
      repoStats.forkSum += repo.forks_count;
      repoStats.issueSum += repo.open_issues_count;
    });
    
    // Sort repos by stars and get top 5
    repoStats.topStarred = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        description: repo.description,
        url: repo.html_url
      }));
    
    // Get 5 most recently updated repos
    repoStats.recentlyUpdated = [...repos]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        updatedAt: repo.updated_at,
        language: repo.language,
        description: repo.description,
        url: repo.html_url
      }));
    
    // Get basic activity information
    let activityData = [];
    try {
      const eventsResponse = await axios.get(`https://api.github.com/users/${user.login}/events?per_page=50`, { headers });
      activityData = eventsResponse.data.slice(0, 10);
    } catch (err) {
      console.error("Failed to fetch GitHub activity data:", err);
    }
    
    return {
      user: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        company: user.company,
        blog: user.blog,
        location: user.location,
        createdAt: user.created_at
      },
      repositories: repoStats,
      recentActivity: activityData,
      status: "active",
      sourceType: "personal_token"
    };
  } catch (error: any) {
    console.error("Error generating GitHub metadata with token:", error);
    
    const errorStatus = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;
    
    // Check for specific error types
    if (errorStatus === 401) {
      return {
        error: "Authentication failed. Please check your GitHub token.",
        status: "error",
        errorCode: "UNAUTHORIZED"
      };
    } else if (errorStatus === 403 && errorMessage.includes("rate limit")) {
      return {
        error: "GitHub API rate limit exceeded. Please try again later.",
        status: "error",
        errorCode: "RATE_LIMITED"
      };
    }
    
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