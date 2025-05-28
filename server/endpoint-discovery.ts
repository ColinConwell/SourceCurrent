import { GitHubClient } from './github-client';
import { LinearClient } from './linear-client';
import { SlackClient } from './slack-client';
import { NotionClient } from './notion-client';
import { GDriveClient } from './gdrive-client';

export interface EndpointParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
  example?: any;
}

export interface DiscoveredEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  category: string;
  subcategory?: string;
  params?: EndpointParameter[];
  responseSchema?: any;
  examples?: any[];
  authentication?: string;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

/**
 * Base class for endpoint discovery
 */
export abstract class EndpointDiscovery {
  abstract discoverEndpoints(): Promise<DiscoveredEndpoint[]>;
  abstract getServiceInfo(): { name: string; version: string; baseUrl: string };
}

/**
 * GitHub endpoint discovery using REST API
 */
export class GitHubEndpointDiscovery extends EndpointDiscovery {
  constructor(private client: GitHubClient) {
    super();
  }

  getServiceInfo() {
    return {
      name: 'GitHub',
      version: 'v3',
      baseUrl: 'https://api.github.com'
    };
  }

  async discoverEndpoints(): Promise<DiscoveredEndpoint[]> {
    const endpoints: DiscoveredEndpoint[] = [
      // User endpoints
      {
        id: 'github-user',
        name: 'Get User',
        description: 'Get information about the authenticated user',
        endpoint: '/api/github/user',
        method: 'GET',
        category: 'User',
        authentication: 'OAuth',
        rateLimit: { requests: 5000, window: '1 hour' }
      },
      {
        id: 'github-user-repos',
        name: 'List User Repositories',
        description: 'List repositories for the authenticated user',
        endpoint: '/api/github/user/repos',
        method: 'GET',
        category: 'Repositories',
        params: [
          { name: 'type', type: 'string', description: 'Repository type', required: false, enum: ['all', 'owner', 'public', 'private', 'member'] },
          { name: 'sort', type: 'string', description: 'Sort order', required: false, enum: ['created', 'updated', 'pushed', 'full_name'] },
          { name: 'direction', type: 'string', description: 'Sort direction', required: false, enum: ['asc', 'desc'] },
          { name: 'per_page', type: 'integer', description: 'Results per page (1-100)', required: false, example: 30 }
        ]
      },

      // Repository endpoints
      {
        id: 'github-repos',
        name: 'List Repositories',
        description: 'Get a list of GitHub repositories',
        endpoint: '/api/github/repositories',
        method: 'GET',
        category: 'Repositories',
        params: [
          { name: 'per_page', type: 'integer', description: 'Results per page (1-100)', required: false, example: 30 },
          { name: 'page', type: 'integer', description: 'Page number', required: false, example: 1 }
        ]
      },
      {
        id: 'github-repo-details',
        name: 'Get Repository',
        description: 'Get details about a specific repository',
        endpoint: '/api/github/repositories/:owner/:repo',
        method: 'GET',
        category: 'Repositories',
        params: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true, example: 'octocat' },
          { name: 'repo', type: 'string', description: 'Repository name', required: true, example: 'Hello-World' }
        ]
      },
      {
        id: 'github-repo-commits',
        name: 'List Commits',
        description: 'List commits for a repository',
        endpoint: '/api/github/repositories/:owner/:repo/commits',
        method: 'GET',
        category: 'Repositories',
        subcategory: 'Commits',
        params: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'sha', type: 'string', description: 'SHA or branch to start listing commits from', required: false },
          { name: 'per_page', type: 'integer', description: 'Results per page (1-100)', required: false, example: 30 }
        ]
      },
      {
        id: 'github-repo-issues',
        name: 'List Issues',
        description: 'List issues for a repository',
        endpoint: '/api/github/repositories/:owner/:repo/issues',
        method: 'GET',
        category: 'Issues',
        params: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'state', type: 'string', description: 'Issue state', required: false, enum: ['open', 'closed', 'all'] },
          { name: 'labels', type: 'string', description: 'Comma-separated list of label names', required: false },
          { name: 'sort', type: 'string', description: 'Sort by', required: false, enum: ['created', 'updated', 'comments'] }
        ]
      },
      {
        id: 'github-repo-pulls',
        name: 'List Pull Requests',
        description: 'List pull requests for a repository',
        endpoint: '/api/github/repositories/:owner/:repo/pulls',
        method: 'GET',
        category: 'Pull Requests',
        params: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'state', type: 'string', description: 'PR state', required: false, enum: ['open', 'closed', 'all'] },
          { name: 'base', type: 'string', description: 'Base branch', required: false },
          { name: 'head', type: 'string', description: 'Head branch', required: false }
        ]
      },

      // Organization endpoints
      {
        id: 'github-orgs',
        name: 'List Organizations',
        description: 'List organizations for the authenticated user',
        endpoint: '/api/github/user/orgs',
        method: 'GET',
        category: 'Organizations'
      },

      // Activity endpoints
      {
        id: 'github-user-activity',
        name: 'User Activity',
        description: 'Get user activity events',
        endpoint: '/api/github/users/:username/events',
        method: 'GET',
        category: 'Activity',
        params: [
          { name: 'username', type: 'string', description: 'Username', required: true, example: 'octocat' },
          { name: 'per_page', type: 'integer', description: 'Results per page (1-100)', required: false, example: 30 }
        ]
      }
    ];

    return endpoints;
  }
}

/**
 * Linear endpoint discovery using GraphQL introspection
 */
export class LinearEndpointDiscovery extends EndpointDiscovery {
  constructor(private client: LinearClient) {
    super();
  }

  getServiceInfo() {
    return {
      name: 'Linear',
      version: 'GraphQL',
      baseUrl: 'https://api.linear.app/graphql'
    };
  }

  async discoverEndpoints(): Promise<DiscoveredEndpoint[]> {
    const endpoints: DiscoveredEndpoint[] = [
      // User/Viewer endpoints
      {
        id: 'linear-viewer',
        name: 'Get Viewer',
        description: 'Get information about the authenticated user',
        endpoint: '/api/linear/viewer',
        method: 'GET',
        category: 'User',
        authentication: 'API Key'
      },

      // Team endpoints
      {
        id: 'linear-teams',
        name: 'List Teams',
        description: 'Get all teams in the workspace',
        endpoint: '/api/linear/teams',
        method: 'GET',
        category: 'Teams'
      },
      {
        id: 'linear-team-details',
        name: 'Get Team',
        description: 'Get details about a specific team',
        endpoint: '/api/linear/teams/:teamId',
        method: 'GET',
        category: 'Teams',
        params: [
          { name: 'teamId', type: 'string', description: 'Team ID', required: true, example: 'team_123' }
        ]
      },
      {
        id: 'linear-team-issues',
        name: 'List Team Issues',
        description: 'Get issues for a specific team',
        endpoint: '/api/linear/teams/:teamId/issues',
        method: 'GET',
        category: 'Issues',
        params: [
          { name: 'teamId', type: 'string', description: 'Team ID', required: true },
          { name: 'state', type: 'string', description: 'Issue state', required: false, enum: ['backlog', 'unstarted', 'started', 'completed', 'canceled'] },
          { name: 'assignee', type: 'string', description: 'Assignee ID', required: false },
          { name: 'label', type: 'string', description: 'Label ID', required: false }
        ]
      },
      {
        id: 'linear-team-data',
        name: 'Get Team Data',
        description: 'Get comprehensive team data including issues and metrics',
        endpoint: '/api/linear/teams/:teamId/data',
        method: 'GET',
        category: 'Teams',
        subcategory: 'Analytics',
        params: [
          { name: 'teamId', type: 'string', description: 'Team ID', required: true }
        ]
      },

      // Issue endpoints
      {
        id: 'linear-issues',
        name: 'List Issues',
        description: 'Get all issues in the workspace',
        endpoint: '/api/linear/issues',
        method: 'GET',
        category: 'Issues',
        params: [
          { name: 'state', type: 'string', description: 'Issue state filter', required: false, enum: ['backlog', 'unstarted', 'started', 'completed', 'canceled'] },
          { name: 'priority', type: 'integer', description: 'Priority level (1-4)', required: false, example: 1 },
          { name: 'assignee', type: 'string', description: 'Assignee ID', required: false }
        ]
      },

      // Workflow endpoints
      {
        id: 'linear-workflow-states',
        name: 'List Workflow States',
        description: 'Get all workflow states in the workspace',
        endpoint: '/api/linear/workflow-states',
        method: 'GET',
        category: 'Workflows'
      },

      // Project endpoints
      {
        id: 'linear-projects',
        name: 'List Projects',
        description: 'Get all projects in the workspace',
        endpoint: '/api/linear/projects',
        method: 'GET',
        category: 'Projects'
      },

      // Label endpoints
      {
        id: 'linear-labels',
        name: 'List Labels',
        description: 'Get all labels in the workspace',
        endpoint: '/api/linear/labels',
        method: 'GET',
        category: 'Labels'
      },

      // User endpoints
      {
        id: 'linear-users',
        name: 'List Users',
        description: 'Get all users in the workspace',
        endpoint: '/api/linear/users',
        method: 'GET',
        category: 'Users'
      },

      // Connection test
      {
        id: 'linear-test-connection',
        name: 'Test Connection',
        description: 'Test the Linear API connection',
        endpoint: '/api/linear/test-connection',
        method: 'GET',
        category: 'System'
      }
    ];

    return endpoints;
  }
}

/**
 * Slack endpoint discovery using Web API documentation
 */
export class SlackEndpointDiscovery extends EndpointDiscovery {
  constructor(private client: SlackClient) {
    super();
  }

  getServiceInfo() {
    return {
      name: 'Slack',
      version: 'Web API',
      baseUrl: 'https://slack.com/api'
    };
  }

  async discoverEndpoints(): Promise<DiscoveredEndpoint[]> {
    const endpoints: DiscoveredEndpoint[] = [
      // Channel endpoints
      {
        id: 'slack-channels',
        name: 'List Channels',
        description: 'Get a list of all channels in the workspace',
        endpoint: '/api/slack/channels',
        method: 'GET',
        category: 'Channels',
        authentication: 'Bot Token',
        rateLimit: { requests: 100, window: '1 minute' }
      },
      {
        id: 'slack-channel-info',
        name: 'Get Channel Info',
        description: 'Get information about a specific channel',
        endpoint: '/api/slack/channels/:channelId',
        method: 'GET',
        category: 'Channels',
        params: [
          { name: 'channelId', type: 'string', description: 'Channel ID', required: true, example: 'C1234567890' }
        ]
      },
      {
        id: 'slack-channel-history',
        name: 'Get Channel History',
        description: 'Get message history from a channel',
        endpoint: '/api/slack/channels/:channelId/history',
        method: 'GET',
        category: 'Messages',
        params: [
          { name: 'channelId', type: 'string', description: 'Channel ID', required: true },
          { name: 'limit', type: 'integer', description: 'Number of messages to return (1-1000)', required: false, example: 100 },
          { name: 'oldest', type: 'string', description: 'Start of time range of messages', required: false },
          { name: 'latest', type: 'string', description: 'End of time range of messages', required: false }
        ]
      },
      {
        id: 'slack-messages',
        name: 'Get Recent Messages',
        description: 'Get recent messages from the configured channel',
        endpoint: '/api/slack/messages',
        method: 'GET',
        category: 'Messages',
        params: [
          { name: 'limit', type: 'integer', description: 'Number of messages to return', required: false, example: 100 }
        ]
      },

      // User endpoints
      {
        id: 'slack-users',
        name: 'List Users',
        description: 'Get a list of all users in the workspace',
        endpoint: '/api/slack/users',
        method: 'GET',
        category: 'Users'
      },
      {
        id: 'slack-user-info',
        name: 'Get User Info',
        description: 'Get information about a specific user',
        endpoint: '/api/slack/users/:userId',
        method: 'GET',
        category: 'Users',
        params: [
          { name: 'userId', type: 'string', description: 'User ID', required: true, example: 'U1234567890' }
        ]
      },

      // Workspace endpoints
      {
        id: 'slack-workspace-info',
        name: 'Get Workspace Info',
        description: 'Get information about the workspace',
        endpoint: '/api/slack/workspace',
        method: 'GET',
        category: 'Workspace'
      },

      // Data aggregation endpoints
      {
        id: 'slack-channel-data',
        name: 'Get Channel Data Dictionary',
        description: 'Get structured channel data for AI processing',
        endpoint: '/api/slack/channels/:channelId/data',
        method: 'GET',
        category: 'Data Export',
        params: [
          { name: 'channelId', type: 'string', description: 'Channel ID', required: true }
        ]
      }
    ];

    return endpoints;
  }
}

/**
 * Notion endpoint discovery using API documentation
 */
export class NotionEndpointDiscovery extends EndpointDiscovery {
  constructor(private client: NotionClient) {
    super();
  }

  getServiceInfo() {
    return {
      name: 'Notion',
      version: '2022-06-28',
      baseUrl: 'https://api.notion.com/v1'
    };
  }

  async discoverEndpoints(): Promise<DiscoveredEndpoint[]> {
    const endpoints: DiscoveredEndpoint[] = [
      // Database endpoints
      {
        id: 'notion-databases',
        name: 'List Databases',
        description: 'Get all accessible databases',
        endpoint: '/api/notion/databases',
        method: 'GET',
        category: 'Databases',
        authentication: 'Integration Token'
      },
      {
        id: 'notion-database-info',
        name: 'Get Database',
        description: 'Get information about a specific database',
        endpoint: '/api/notion/databases/:databaseId',
        method: 'GET',
        category: 'Databases',
        params: [
          { name: 'databaseId', type: 'string', description: 'Database ID', required: true, example: '32-character-uuid' }
        ]
      },
      {
        id: 'notion-database-query',
        name: 'Query Database',
        description: 'Query pages from a database',
        endpoint: '/api/notion/databases/:databaseId/query',
        method: 'POST',
        category: 'Databases',
        subcategory: 'Query',
        params: [
          { name: 'databaseId', type: 'string', description: 'Database ID', required: true },
          { name: 'filter', type: 'object', description: 'Filter conditions', required: false },
          { name: 'sorts', type: 'array', description: 'Sort conditions', required: false },
          { name: 'start_cursor', type: 'string', description: 'Pagination cursor', required: false },
          { name: 'page_size', type: 'integer', description: 'Number of results (1-100)', required: false, example: 100 }
        ]
      },
      {
        id: 'notion-database-data',
        name: 'Get Database Data',
        description: 'Get structured database data for AI processing',
        endpoint: '/api/notion/databases/:databaseId/data',
        method: 'GET',
        category: 'Data Export',
        params: [
          { name: 'databaseId', type: 'string', description: 'Database ID', required: true }
        ]
      },

      // Page endpoints
      {
        id: 'notion-page',
        name: 'Get Page',
        description: 'Get information about a specific page',
        endpoint: '/api/notion/pages/:pageId',
        method: 'GET',
        category: 'Pages',
        params: [
          { name: 'pageId', type: 'string', description: 'Page ID', required: true, example: '32-character-uuid' }
        ]
      },
      {
        id: 'notion-page-blocks',
        name: 'Get Page Blocks',
        description: 'Get blocks (content) from a page',
        endpoint: '/api/notion/pages/:pageId/blocks',
        method: 'GET',
        category: 'Pages',
        subcategory: 'Content',
        params: [
          { name: 'pageId', type: 'string', description: 'Page ID', required: true },
          { name: 'start_cursor', type: 'string', description: 'Pagination cursor', required: false },
          { name: 'page_size', type: 'integer', description: 'Number of results (1-100)', required: false, example: 100 }
        ]
      },

      // Legacy/convenience endpoints
      {
        id: 'notion-tasks',
        name: 'Get Tasks',
        description: 'Get tasks from the configured tasks database',
        endpoint: '/api/notion/tasks',
        method: 'GET',
        category: 'Tasks',
        params: [
          { name: 'databaseId', type: 'string', description: 'Optional database ID override', required: false }
        ]
      },

      // Search endpoints
      {
        id: 'notion-search',
        name: 'Search',
        description: 'Search across pages and databases',
        endpoint: '/api/notion/search',
        method: 'POST',
        category: 'Search',
        params: [
          { name: 'query', type: 'string', description: 'Search query', required: false },
          { name: 'filter', type: 'object', description: 'Filter by object type', required: false },
          { name: 'sort', type: 'object', description: 'Sort conditions', required: false }
        ]
      }
    ];

    return endpoints;
  }
}

/**
 * Google Drive endpoint discovery
 */
export class GDriveEndpointDiscovery extends EndpointDiscovery {
  constructor(private client: GDriveClient) {
    super();
  }

  getServiceInfo() {
    return {
      name: 'Google Drive',
      version: 'v3',
      baseUrl: 'https://www.googleapis.com/drive/v3'
    };
  }

  async discoverEndpoints(): Promise<DiscoveredEndpoint[]> {
    const endpoints: DiscoveredEndpoint[] = [
      // File endpoints
      {
        id: 'gdrive-files',
        name: 'List Files',
        description: 'List files in Google Drive',
        endpoint: '/api/gdrive/files',
        method: 'GET',
        category: 'Files',
        authentication: 'OAuth 2.0',
        params: [
          { name: 'q', type: 'string', description: 'Search query', required: false, example: "name contains 'project'" },
          { name: 'pageSize', type: 'integer', description: 'Number of files to return (1-1000)', required: false, example: 100 },
          { name: 'fields', type: 'string', description: 'Fields to include in response', required: false },
          { name: 'orderBy', type: 'string', description: 'Sort order', required: false, enum: ['createdTime', 'folder', 'modifiedByMeTime', 'modifiedTime', 'name', 'quotaBytesUsed', 'recency', 'sharedWithMeTime', 'starred', 'viewedByMeTime'] }
        ]
      },
      {
        id: 'gdrive-file',
        name: 'Get File',
        description: 'Get metadata for a specific file',
        endpoint: '/api/gdrive/files/:fileId',
        method: 'GET',
        category: 'Files',
        params: [
          { name: 'fileId', type: 'string', description: 'File ID', required: true, example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' }
        ]
      },

      // Folder endpoints
      {
        id: 'gdrive-folders',
        name: 'List Folders',
        description: 'List folders in Google Drive',
        endpoint: '/api/gdrive/folders',
        method: 'GET',
        category: 'Folders',
        params: [
          { name: 'parentFolderId', type: 'string', description: 'Parent folder ID (default: root)', required: false, example: 'root' }
        ]
      },
      {
        id: 'gdrive-folder-files',
        name: 'List Files in Folder',
        description: 'List files within a specific folder',
        endpoint: '/api/gdrive/folders/:folderId/files',
        method: 'GET',
        category: 'Folders',
        subcategory: 'Contents',
        params: [
          { name: 'folderId', type: 'string', description: 'Folder ID', required: true, example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' }
        ]
      },
      {
        id: 'gdrive-folder-data',
        name: 'Get Folder Contents',
        description: 'Get structured folder contents for AI processing',
        endpoint: '/api/gdrive/folders/:folderId/data',
        method: 'GET',
        category: 'Data Export',
        params: [
          { name: 'folderId', type: 'string', description: 'Folder ID (default: root)', required: false, example: 'root' }
        ]
      }
    ];

    return endpoints;
  }
}

/**
 * Main endpoint discovery service
 */
export class EndpointDiscoveryService {
  private discoveries = new Map<string, EndpointDiscovery>();

  registerDiscovery(service: string, discovery: EndpointDiscovery) {
    this.discoveries.set(service, discovery);
  }

  async discoverAllEndpoints(): Promise<Record<string, DiscoveredEndpoint[]>> {
    const results: Record<string, DiscoveredEndpoint[]> = {};
    const services = Array.from(this.discoveries.keys());
    
    for (const service of services) {
      const discovery = this.discoveries.get(service)!;
      try {
        results[service] = await discovery.discoverEndpoints();
      } catch (error) {
        console.error(`Error discovering endpoints for ${service}:`, error);
        results[service] = [];
      }
    }
    
    return results;
  }

  async discoverEndpointsForService(service: string): Promise<DiscoveredEndpoint[]> {
    const discovery = this.discoveries.get(service);
    if (!discovery) {
      throw new Error(`No discovery registered for service: ${service}`);
    }
    
    return await discovery.discoverEndpoints();
  }

  getServiceInfo(service: string) {
    const discovery = this.discoveries.get(service);
    if (!discovery) {
      throw new Error(`No discovery registered for service: ${service}`);
    }
    
    return discovery.getServiceInfo();
  }

  getRegisteredServices(): string[] {
    return Array.from(this.discoveries.keys());
  }
}