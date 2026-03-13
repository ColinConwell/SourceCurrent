/**
 * Typed credential interfaces for each service integration.
 * Replaces unsafe `as any` casts throughout the codebase.
 */

export interface SlackCredentials {
  token: string;
}

export interface NotionCredentials {
  token: string;
}

export interface GitHubCredentials {
  token: string;
}

export interface LinearCredentials {
  apiKey: string;
}

export interface GmailCredentials {
  accessToken: string;
  refreshToken?: string;
  email?: string;
}

export interface GCalCredentials {
  accessToken: string;
  refreshToken?: string;
}

export interface DiscordCredentials {
  token: string;
}

export interface GDriveCredentials {
  accessToken: string;
  refreshToken?: string;
}

export type ServiceCredentials =
  | SlackCredentials
  | NotionCredentials
  | GitHubCredentials
  | LinearCredentials
  | GmailCredentials
  | GCalCredentials
  | DiscordCredentials
  | GDriveCredentials;

/**
 * Type-safe credential accessor. Returns undefined if credentials
 * don't match the expected shape.
 */
export function getCredential<T extends ServiceCredentials>(
  credentials: unknown,
  key: keyof T
): string | undefined {
  if (
    credentials &&
    typeof credentials === "object" &&
    key in (credentials as Record<string, unknown>)
  ) {
    const value = (credentials as Record<string, unknown>)[key as string];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}
