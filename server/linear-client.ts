import axios from 'axios';

export class LinearClient {
  private apiKey: string;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async executeQuery(query: string, variables: Record<string, any> = {}) {
    try {
      console.log('Linear API Query:', { query, variables });
      
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
        console.error('Linear GraphQL Error:', JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Linear API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: JSON.stringify(error.response.data)
        });
        
        // Log detailed error information if available
        if (error.response.data && error.response.data.errors) {
          console.error('Linear GraphQL Errors:', JSON.stringify(error.response.data.errors));
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Linear API Error Request:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Linear API Error Setup:', error.message);
      }
      throw error;
    }
  }

  async getViewer() {
    // Simplified query to test API connectivity
    const query = `
      query {
        viewer {
          id
          name
        }
      }
    `;

    try {
      const data = await this.executeQuery(query);
      return data.viewer;
    } catch (error) {
      console.error('Failed to get viewer info:', error);
      return null;
    }
  }
  
  // Test method to check basic API connection
  async testConnection() {
    try {
      const result = await this.getViewer();
      return {
        success: !!result,
        viewer: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

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
            states {
              nodes {
                id
                name
                type
                color
              }
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery(query);
    return data.teams.nodes;
  }

  async getTeamIssues(teamId: string) {
    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          issues {
            nodes {
              id
              identifier
              title
              description
              priority
              estimate
              createdAt
              updatedAt
              archivedAt
              completedAt
              dueDate
              number
              url
              creator {
                id
                name
                email
              }
              assignee {
                id
                name
                email
              }
              state {
                id
                name
                type
                color
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              comments {
                nodes {
                  id
                  body
                  createdAt
                  user {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery(query, { teamId });
    
    if (!data.team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    return data.team.issues.nodes;
  }

  async getWorkflowStates() {
    const query = `
      query {
        workflowStates {
          nodes {
            id
            name
            description
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

  async getTeamDataAsDictionary(teamId: string) {
    try {
      // Get team details
      const team = (await this.getTeams()).find(t => t.id === teamId);
      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Get team issues
      const issues = await this.getTeamIssues(teamId);

      // Get all workflow states
      const states = await this.getWorkflowStates();
      const teamStates = states.filter(state => state.team?.id === teamId);

      // Prepare the team data in a structured dictionary format
      const teamData = {
        id: team.id,
        name: team.name,
        key: team.key,
        description: team.description,
        color: team.color,
        states: teamStates.map(state => ({
          id: state.id,
          name: state.name,
          type: state.type,
          color: state.color
        })),
        issues: issues.map(issue => ({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          estimate: issue.estimate,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          completedAt: issue.completedAt,
          dueDate: issue.dueDate,
          state: issue.state ? {
            id: issue.state.id,
            name: issue.state.name,
            type: issue.state.type
          } : null,
          assignee: issue.assignee ? {
            id: issue.assignee.id,
            name: issue.assignee.name
          } : null,
          creator: issue.creator ? {
            id: issue.creator.id,
            name: issue.creator.name
          } : null,
          labels: issue.labels ? issue.labels.nodes.map((label: any) => ({
            id: label.id,
            name: label.name,
            color: label.color
          })) : [],
          commentCount: issue.comments ? issue.comments.nodes.length : 0
        }))
      };

      return teamData;
    } catch (error) {
      console.error(`Error getting Linear team data for ${teamId}:`, error);
      throw error;
    }
  }
}

export async function getLinearClientForConnection(connectionId: number): Promise<LinearClient> {
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Get the connection details
    const connection = await storage.getConnection(connectionId);
    
    if (!connection) {
      throw new Error(`Connection with ID ${connectionId} not found`);
    }
    
    if (connection.service !== 'linear') {
      throw new Error(`Connection with ID ${connectionId} is not a Linear connection`);
    }
    
    // Create Linear client
    const apiKey = connection.credentials.api_key;
    if (!apiKey) {
      throw new Error('Linear API key not found in connection credentials');
    }
    
    return new LinearClient(apiKey);
  } catch (error: any) {
    console.error('Error creating Linear client:', error.message);
    throw error;
  }
}