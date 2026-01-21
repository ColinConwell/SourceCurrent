import { WebClient } from "@slack/web-api";

let slackClient: WebClient | null = null;

export function getSlackOn() {
  if (!slackClient) {
    slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return slackClient;
}

// Proxy for backward compatibility if needed, or better, update consumers to use getSlack()
export const slack = new Proxy({}, {
  get: (_target, prop) => {
    const client = getSlackOn();
    return client[prop as keyof WebClient];
  }
}) as WebClient;


export function checkSlackEnv(): boolean {
  return !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID);
}

export async function initSlack() {
  if (!checkSlackEnv()) {
    console.warn("Slack environment variables missing. Skipping Slack initialization.");
    return;
  }
  // No strict initialization logic needed for WebClient other than instantiation
  console.log("Slack integration configured.");
}

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * @param message - Message content and channel information
 * @returns Promise resolving to the sent message's timestamp
 */
export async function sendSlackMessage(message: any): Promise<string | undefined> {
  try {
    // Default to the configured channel if none specified
    const channel = message.channel || process.env.SLACK_CHANNEL_ID;

    // Send the message
    const response = await slack.chat.postMessage({
      ...message,
      channel
    });

    // Return the timestamp of the sent message
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

/**
 * Reads the history of a channel
 * @param channel_id - Channel ID to read message history from
 * @returns Promise resolving to the messages
 */
export async function readSlackHistory(
  channel_id: string = process.env.SLACK_CHANNEL_ID!,
  messageLimit: number = 100,
) {
  try {
    // Get messages
    return await slack.conversations.history({
      channel: channel_id,
      limit: messageLimit,
    });
  } catch (error) {
    console.error('Error reading Slack channel history:', error);
    throw error;
  }
}

/**
 * Gets channel information
 * @param channel_id - Channel ID
 * @returns Promise resolving to channel information
 */
export async function getChannelInfo(channel_id: string = process.env.SLACK_CHANNEL_ID!) {
  try {
    return await slack.conversations.info({
      channel: channel_id
    });
  } catch (error) {
    console.error('Error getting Slack channel info:', error);
    throw error;
  }
}

/**
 * Gets user information
 * @param user_id - User ID
 * @returns Promise resolving to user information
 */
export async function getUserInfo(user_id: string) {
  try {
    return await slack.users.info({
      user: user_id
    });
  } catch (error) {
    console.error('Error getting Slack user info:', error);
    throw error;
  }
}

/**
 * Gets all users in the workspace
 * @returns Promise resolving to list of users
 */
export async function getAllUsers() {
  try {
    return await slack.users.list({});
  } catch (error) {
    console.error('Error listing Slack users:', error);
    throw error;
  }
}

/**
 * Gets data in a dictionary format suitable for AI processing
 * @param channel_id - Channel ID
 * @returns Channel data in structured dictionary format
 */
export async function getChannelDataAsDictionary(channel_id: string = process.env.SLACK_CHANNEL_ID!) {
  try {
    // Get channel information
    let channelInfo: any = { channel: { id: channel_id, name: 'Unknown' } };
    try {
      const channelInfoResult = await getChannelInfo(channel_id);
      channelInfo = channelInfoResult;
    } catch (error) {
      console.error('Error getting channel info, using default values:', error);
    }

    // Get message history
    let history: any = { messages: [] };
    try {
      history = await readSlackHistory(channel_id);
    } catch (error) {
      console.error('Error getting message history:', error);
    }

    // Get all users
    let userMap: Record<string, any> = {};
    try {
      const usersResult = await getAllUsers();
      const users = usersResult.members || [];

      // Create user map for easy lookup
      users.forEach(user => {
        if (user.id) {
          userMap[user.id] = {
            id: user.id,
            name: user.name,
            real_name: user.real_name,
            is_bot: user.is_bot,
            profile: {
              display_name: user.profile?.display_name,
              email: user.profile?.email,
              status_text: user.profile?.status_text,
              image_24: user.profile?.image_24
            }
          };
        }
      });
    } catch (error) {
      // If we can't get users (missing scope), create basic user info from the messages
      console.warn('Could not retrieve users list, possibly missing users:read scope');

      // Extract unique user IDs from messages
      const userIds = new Set<string>();
      history.messages?.forEach((msg: any) => {
        if (msg.user) userIds.add(msg.user);
      });

      // Create basic user entries
      userIds.forEach(userId => {
        userMap[userId] = {
          id: userId,
          name: `User-${userId.substring(0, 4)}`,
          is_bot: false
        };
      });
    }

    // Extract messages in a clean format
    const messages = history.messages?.map((msg: any) => ({
      user: msg.user,
      user_info: msg.user ? userMap[msg.user] : null,
      text: msg.text,
      timestamp: msg.ts,
      thread_ts: msg.thread_ts,
      reactions: msg.reactions?.map((reaction: any) => ({
        name: reaction.name,
        count: reaction.count,
        users: reaction.users
      })),
      attachments: msg.attachments,
      is_bot: msg.bot_id ? true : false
    })) || [];

    // Create the structured data dictionary
    return {
      channel_info: {
        id: channelInfo.channel?.id,
        name: channelInfo.channel?.name,
        topic: channelInfo.channel?.topic?.value || 'No topic set',
        purpose: channelInfo.channel?.purpose?.value || '',
        member_count: channelInfo.channel?.num_members || '?',
        is_archived: channelInfo.channel?.is_archived || false,
        created: channelInfo.channel?.created || Date.now() / 1000
      },
      messages: messages,
      users: userMap
    };
  } catch (error) {
    console.error('Error creating Slack data dictionary:', error);
    throw error;
  }
}