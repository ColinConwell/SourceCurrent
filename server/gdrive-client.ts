import { google, drive_v3 } from "googleapis";
import { storage } from "./storage";

// Base Google Drive client class for API calls
export class GDriveClient {
  private drive: drive_v3.Drive;

  constructor(credentials: any) {
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  // List files
  async listFiles(query: string = '', pageSize: number = 100) {
    try {
      const response = await this.drive.files.list({
        q: query,
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, iconLink, parents, shared)'
      });

      return response.data.files || [];
    } catch (error: any) {
      console.error('Error listing Google Drive files:', error);
      throw new Error(`Failed to list Google Drive files: ${error.message}`);
    }
  }

  // Get file metadata
  async getFile(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size, webViewLink, iconLink, parents, shared, description, owners, lastModifyingUser'
      });

      return response.data;
    } catch (error: any) {
      console.error(`Error getting file ${fileId}:`, error);
      throw new Error(`Failed to get Google Drive file: ${error.message}`);
    }
  }

  // List folders
  async listFolders(parentFolderId: string = 'root') {
    return this.listFiles(`'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`);
  }

  // List files in a folder
  async listFilesInFolder(folderId: string) {
    return this.listFiles(`'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`);
  }

  // Convert to dictionary format
  async getFolderContentsAsDictionary(folderId: string = 'root') {
    try {
      // Get folder info if not root
      let folderInfo = null;
      if (folderId !== 'root') {
        folderInfo = await this.getFile(folderId);
      } else {
        folderInfo = { id: 'root', name: 'My Drive' };
      }

      // Get subfolders and files
      const subfolders = await this.listFolders(folderId);
      const files = await this.listFilesInFolder(folderId);

      // Create the dictionary structure
      return {
        folder_info: {
          id: folderInfo.id,
          name: folderInfo.name,
          created_time: folderInfo.createdTime,
          modified_time: folderInfo.modifiedTime,
          web_view_link: folderInfo.webViewLink
        },
        subfolders: subfolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          created_time: folder.createdTime,
          modified_time: folder.modifiedTime,
          web_view_link: folder.webViewLink
        })),
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          mime_type: file.mimeType,
          created_time: file.createdTime,
          modified_time: file.modifiedTime,
          size: file.size,
          web_view_link: file.webViewLink,
          icon_link: file.iconLink,
          shared: file.shared
        }))
      };
    } catch (error: any) {
      console.error('Error creating Google Drive dictionary:', error);
      throw new Error(`Failed to create Google Drive data dictionary: ${error.message}`);
    }
  }
}

// Factory function to get a client for a specific connection
export async function getGDriveClientForConnection(connectionId: number): Promise<GDriveClient> {
  const connection = await storage.getConnection(connectionId);

  if (!connection) {
    throw new Error(`Connection with ID ${connectionId} not found`);
  }

  if (connection.service !== 'gdrive') {
    throw new Error(`Connection ${connectionId} is not a Google Drive connection`);
  }

  if (!connection.active) {
    throw new Error(`Google Drive connection ${connectionId} is not active`);
  }

  const credentials = connection.credentials as {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    access_token: string;
    refresh_token: string;
  };

  if (!credentials.access_token || !credentials.refresh_token) {
    throw new Error(`Google Drive connection ${connectionId} has invalid credentials`);
  }

  return new GDriveClient(credentials);
}
