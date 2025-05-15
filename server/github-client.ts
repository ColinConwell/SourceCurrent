import axios from 'axios';
import { Request, Response } from 'express';
import { storage } from './storage';
import { InsertConnection } from '../shared/schema';
import jwt from 'jsonwebtoken';

// GitHub API constants
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

// GitHub App configuration
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
const GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * GitHub API client for OAuth flow and API interactions
 */
export class GitHubClient {
  private accessToken: string;
  private installationToken: string;
  private useAppAuth: boolean;

  constructor(accessToken?: string, useAppAuth: boolean = false) {
    this.accessToken = accessToken || '';
    this.installationToken = '';
    this.useAppAuth = useAppAuth;
  }
  
  /**
   * Create a GitHub App JWT for authentication
   */
  static createAppJwt(): string {
    if (!GITHUB_APP_ID || !GITHUB_PRIVATE_KEY) {
      throw new Error('GitHub App credentials are not configured');
    }
    
    // Create a JWT that expires in 10 minutes
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      exp: now + 10 * 60,
      iss: GITHUB_APP_ID
    };
    
    return jwt.sign(payload, GITHUB_PRIVATE_KEY, { algorithm: 'RS256' });
  }
  
  /**
   * Get an installation access token for a GitHub App
   */
  static async getInstallationToken(): Promise<string> {
    if (!GITHUB_INSTALLATION_ID) {
      throw new Error('GitHub installation ID is not configured');
    }
    
    try {
      const appJwt = GitHubClient.createAppJwt();
      
      const response = await axios.post(
        `${GITHUB_API_URL}/app/installations/${GITHUB_INSTALLATION_ID}/access_tokens`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${appJwt}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (response.data.token) {
        return response.data.token;
      } else {
        throw new Error('Failed to get installation token');
      }
    } catch (error) {
      console.error('Error getting installation token:', error);
      throw error;
    }
  }
  
  /**
   * Create a GitHub client using GitHub App authentication
   */
  static async createAppClient(): Promise<GitHubClient> {
    const token = await GitHubClient.getInstallationToken();
    const client = new GitHubClient(token, true);
    client.installationToken = token;
    return client;
  }

  /**
   * Generate the GitHub OAuth authorization URL
   */
  static getAuthUrl(state: string): string {
    return `${GITHUB_AUTH_URL}?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo%20read:user%20user:email&state=${state}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        GITHUB_TOKEN_URL, 
        {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI
        },
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.access_token) {
        return response.data.access_token;
      } else {
        throw new Error('Failed to obtain access token: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Handles the GitHub OAuth callback
   */
  static async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    const { code, state } = req.query;
    
    try {
      // Verify state parameter to prevent CSRF attacks (in a real app, you'd compare against a stored value)
      if (!state) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for token
      const accessToken = await GitHubClient.exchangeCodeForToken(code as string);
      
      // Create a GitHub client with the token
      const githubClient = new GitHubClient(accessToken);
      
      // Get user information to create the connection
      const userInfo = await githubClient.getUserInfo();
      
      // Create a connection for this user
      const connection: InsertConnection = {
        userId: 1, // Using demo user, in a real app you'd use the authenticated user's ID
        name: `${userInfo.name || userInfo.login}'s GitHub`,
        service: 'github',
        credentials: {
          token: accessToken
        },
        active: true
      };
      
      const newConnection = await storage.createConnection(connection);
      
      // Create a default data source for repositories
      await storage.createDataSource({
        connectionId: newConnection.id,
        name: 'GitHub Repositories',
        sourceId: 'repos',
        sourceType: 'repository',
        config: { 
          username: userInfo.login
        }
      });
      
      // Create activity record
      await storage.createActivity({
        userId: 1,
        type: 'connection_created',
        description: `Connected to GitHub as ${userInfo.login}`,
        metadata: {
          service: 'github',
          username: userInfo.login
        }
      });
      
      // Redirect back to the app's main page or auth callback handler
      res.redirect('/auth-callback?service=github&status=success');
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect('/auth-callback?service=github&status=error&message=' + encodeURIComponent((error as Error).message));
    }
  }

  /**
   * Set the access token for the client
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get the authorization header based on authentication type
   */
  private getAuthHeader(): string {
    if (this.useAppAuth && this.installationToken) {
      return `token ${this.installationToken}`;
    }
    return `token ${this.accessToken}`;
  }
  
  /**
   * Get the authenticated user's information
   */
  async getUserInfo() {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting GitHub user info:', error);
      throw error;
    }
  }
  
  /**
   * Get GitHub App information
   */
  async getAppInfo() {
    try {
      const appJwt = GitHubClient.createAppJwt();
      
      const response = await axios.get(`${GITHUB_API_URL}/app`, {
        headers: {
          'Authorization': `Bearer ${appJwt}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting GitHub app info:', error);
      throw error;
    }
  }

  /**
   * Get the user's repositories
   */
  async getRepositories(perPage: number = 100, page: number = 1) {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/user/repos`, {
        params: {
          per_page: perPage,
          page,
          sort: 'updated',
          type: 'all'
        },
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting GitHub repositories:', error);
      throw error;
    }
  }
  
  /**
   * Get all repositories accessible to the GitHub App installation
   */
  async getInstallationRepositories(perPage: number = 100, page: number = 1) {
    try {
      if (!this.useAppAuth) {
        throw new Error('This method requires GitHub App authentication');
      }
      
      const response = await axios.get(`${GITHUB_API_URL}/installation/repositories`, {
        params: {
          per_page: perPage,
          page
        },
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data.repositories || [];
    } catch (error) {
      console.error('Error getting installation repositories:', error);
      throw error;
    }
  }

  /**
   * Get user activity (events)
   */
  async getUserActivity(username: string, perPage: number = 30) {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/users/${username}/events`, {
        params: {
          per_page: perPage
        },
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting GitHub user activity:', error);
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(owner: string, repo: string) {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error getting GitHub repository details for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get repository metadata in dictionary format (suitable for AI processing)
   */
  async getRepositoryDataAsDictionary(owner: string, repo: string) {
    try {
      // Get basic repo info
      const repoData = await this.getRepositoryDetails(owner, repo);
      
      // Get recent commits
      const commitsResponse = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits`, {
        params: {
          per_page: 10
        },
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      // Get contributors
      const contributorsResponse = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/contributors`, {
        params: {
          per_page: 10
        },
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      return {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchersCount: repoData.watchers_count,
        issuesCount: repoData.open_issues_count,
        language: repoData.language,
        topics: repoData.topics,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        branch: repoData.default_branch,
        isPrivate: repoData.private,
        hasWiki: repoData.has_wiki,
        hasIssues: repoData.has_issues,
        commits: commitsResponse.data.map((commit: any) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date
        })),
        contributors: contributorsResponse.data.map((contributor: any) => ({
          login: contributor.login,
          id: contributor.id,
          contributions: contributor.contributions,
          url: contributor.html_url
        }))
      };
    } catch (error) {
      console.error(`Error getting GitHub repository dictionary for ${owner}/${repo}:`, error);
      throw error;
    }
  }
}

/**
 * Create a GitHub client for a specific connection
 * This function smartly selects between OAuth token and GitHub App authentication
 */
export async function getGitHubClientForConnection(connectionId: number): Promise<GitHubClient> {
  try {
    const connection = await storage.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    
    if (connection.service !== 'github') {
      throw new Error(`Connection ${connectionId} is not a GitHub connection`);
    }
    
    // Try to use GitHub App authentication if app credentials are available
    if (GITHUB_APP_ID && GITHUB_INSTALLATION_ID && GITHUB_PRIVATE_KEY) {
      try {
        console.log('Using GitHub App authentication');
        return await GitHubClient.createAppClient();
      } catch (appError) {
        console.error('Error creating GitHub App client, falling back to token authentication:', appError);
      }
    }
    
    // Fallback to OAuth token if available
    const credentials = connection.credentials as { token?: string, clientId?: string, clientSecret?: string };
    
    if (credentials.token) {
      console.log('Using GitHub OAuth token authentication');
      return new GitHubClient(credentials.token);
    }
    
    throw new Error(`Connection ${connectionId} does not have a valid GitHub authentication method`);
  } catch (error) {
    console.error(`Error creating GitHub client for connection ${connectionId}:`, error);
    throw error;
  }
}