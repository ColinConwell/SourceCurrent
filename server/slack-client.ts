import { WebClient } from "@slack/web-api";
import { storage } from "./storage";

// Base Slack client class for API calls
export class SlackClient {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async getChannelList() {
    try {
      const result = await this.client.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      });

      return result.channels || [];
    } catch (error: any) {
      console.error('Error fetching Slack channels:', error);
      throw new Error(`Failed to fetch Slack channels: ${error.message}`);
    }
  }

  async getChannelHistory(channelId: string, limit: number = 100) {
    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit
      });

      return result.messages || [];
    } catch (error: any) {
      console.error(`Error fetching history for channel ${channelId}:`, error);
      throw new Error(`Failed to fetch Slack channel history: ${error.message}`);
    }
  }

  async getUsersList() {
    try {
      const result = await this.client.users.list({});
      return result.members || [];
    } catch (error: any) {
      console.error('Error fetching Slack users:', error);
      throw new Error(`Failed to fetch Slack users: ${error.message}`);
    }
  }

  // Convert to dataframe-friendly format
  async getChannelDataAsDictionary(channelId: string) {
    try {
      // Get message history - if this fails, we can't provide much value
      let messages;
      try {
        messages = await this.getChannelHistory(channelId);
      } catch (error: any) {
        console.error(`Error fetching Slack channel history:`, error);
        throw new Error(`Failed to fetch channel messages: ${error.message}`);
      }

      // Get channel info - provide defaults if this fails
      let channel: any = {
        id: channelId,
        name: 'Unknown Channel',
        created: Math.floor(Date.now() / 1000),
        is_archived: false
      };
      try {
        const channelInfo = await this.client.conversations.info({ channel: channelId });
        if (channelInfo.channel) {
          channel = channelInfo.channel;
        }
      } catch (error) {
        console.warn(`Error fetching channel info, using fallback data:`, error);
      }

      // Get users - create basic user data if this fails (like missing scopes)
      let userMap: Record<string, any> = {};
      try {
        const users = await this.getUsersList();

        // Create a user lookup map
        users.forEach(user => {
          if (user.id) {
            userMap[user.id] = {
              name: user.name,
              real_name: user.real_name,
              is_admin: user.is_admin,
              profile: {
                email: user.profile?.email,
                status_text: user.profile?.status_text
              }
            };
          }
        });
      } catch (error) {
        console.warn('Error fetching users list, creating minimal user data:', error);

        // Extract unique user IDs from messages
        const userIds = new Set<string>();
        messages.forEach((message: any) => {
          if (message.user) userIds.add(message.user);
        });

        // Create basic user entries
        userIds.forEach(userId => {
          userMap[userId] = {
            name: `User-${userId.substring(0, 6)}`,
            real_name: null,
            is_admin: false,
            profile: {}
          };
        });
      }

      return {
        channel_info: {
          id: channel.id,
          name: channel.name,
          created: channel.created,
          creator: channel.creator,
          is_archived: channel.is_archived,
          is_general: channel.is_general,
          members_count: channel.num_members
        },
        messages: messages.map((message: any) => ({
          user: message.user,
          text: message.text,
          ts: message.ts,
          reactions: message.reactions || [],
          user_info: message.user ? userMap[message.user] : null
        })),
        users: userMap
      };
    } catch (error: any) {
      console.error('Error creating Slack dictionary:', error);
      throw new Error(`Failed to create Slack data dictionary: ${error.message}`);
    }
  }
}

// Factory function to get a client for a specific connection
export async function getSlackClientForConnection(connectionId: number): Promise<SlackClient> {
  const connection = await storage.getConnection(connectionId);

  if (!connection) {
    throw new Error(`Connection with ID ${connectionId} not found`);
  }

  if (connection.service !== 'slack') {
    throw new Error(`Connection ${connectionId} is not a Slack connection`);
  }

  if (!connection.active) {
    throw new Error(`Slack connection ${connectionId} is not active`);
  }

  const credentials = connection.credentials as { token: string };

  if (!credentials.token) {
    throw new Error(`Slack connection ${connectionId} has invalid credentials`);
  }

  return new SlackClient(credentials.token);
}
