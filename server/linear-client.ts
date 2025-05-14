import axios from "axios";
import { storage } from "./storage";

// Base Linear client class for API calls
export class LinearClient {
  private apiKey: string;
  private baseUrl = 'https://api.linear.app/graphql';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  private async executeQuery(query: string, variables: Record<string, any> = {}) {
    try {
      const response = await axios.post(
        this.baseUrl,
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error executing Linear GraphQL query:', error);
      throw new Error(`Failed to execute Linear query: ${error.message}`);
    }
  }
  
  // Get current user/viewer info
  async getViewer() {
    const query = `
      query {
        viewer {
          id
          name
          email
          avatarUrl
        }
      }
    `;
    
    const data = await this.executeQuery(query);
    return data.viewer;
  }
  
  // Get teams
  async getTeams() {
    const query = `
      query {
        teams {
          nodes {
            id
            name
            key
            description
            color
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    const data = await this.executeQuery(query);
    return data.teams.nodes;
  }
  
  // Get issues for a team
  async getTeamIssues(teamId: string) {
    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          issues {
            nodes {
              id
              title
              description
              state {
                id
                name
                color
                type
              }
              priority
              estimate
              assignee {
                id
                name
                email
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;
    
    const data = await this.executeQuery(query, { teamId });
    return data.team.issues.nodes;
  }
  
  // Get all issue states
  async getWorkflowStates() {
    const query = `
      query {
        workflowStates {
          nodes {
            id
            name
            color
            type
            team {
              id
              name
              key
            }
          }
        }
      }
    `;
    
    const data = await this.executeQuery(query);
    return data.workflowStates.nodes;
  }
  
  // Convert to dictionary format
  async getTeamDataAsDictionary(teamId: string) {
    try {
      const team = (await this.getTeams()).find(t => t.id === teamId);
      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }
      
      const issues = await this.getTeamIssues(teamId);
      const workflowStates = await this.getWorkflowStates();
      
      // Create the dictionary structure
      return {
        team_info: {
          id: team.id,
          name: team.name,
          key: team.key,
          description: team.description,
          color: team.color,
          created_at: team.createdAt,
          updated_at: team.updatedAt
        },
        issues: issues.map(issue => ({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          state_id: issue.state.id,
          state_name: issue.state.name,
          state_type: issue.state.type,
          priority: issue.priority,
          estimate: issue.estimate,
          assignee: issue.assignee ? {
            id: issue.assignee.id,
            name: issue.assignee.name,
            email: issue.assignee.email
          } : null,
          created_at: issue.createdAt,
          updated_at: issue.updatedAt
        })),
        workflow_states: workflowStates
          .filter(state => state.team && state.team.id === teamId)
          .map(state => ({
            id: state.id,
            name: state.name,
            color: state.color,
            type: state.type
          }))
      };
    } catch (error) {
      console.error('Error creating Linear dictionary:', error);
      throw new Error(`Failed to create Linear data dictionary: ${error.message}`);
    }
  }
}

// Factory function to get a client for a specific connection
export async function getLinearClientForConnection(connectionId: number): Promise<LinearClient> {
  const connection = await storage.getConnection(connectionId);
  
  if (!connection) {
    throw new Error(`Connection with ID ${connectionId} not found`);
  }
  
  if (connection.service !== 'linear') {
    throw new Error(`Connection ${connectionId} is not a Linear connection`);
  }
  
  if (!connection.active) {
    throw new Error(`Linear connection ${connectionId} is not active`);
  }
  
  const credentials = connection.credentials as { api_key: string };
  
  if (!credentials.api_key) {
    throw new Error(`Linear connection ${connectionId} has invalid credentials`);
  }
  
  return new LinearClient(credentials.api_key);
}
