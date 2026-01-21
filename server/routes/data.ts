
import { Router } from "express";
import { storage } from "../storage";
import { getSlackClientForConnection } from "../slack-client";
import { getNotionClientForConnection } from "../notion-client";
import { getLinearClientForConnection } from "../linear-client";
import { getGDriveClientForConnection } from "../gdrive-client";

export const dataRouter = Router();

dataRouter.get('/api/connections/:connectionId/data', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.connectionId);
        const sourceId = req.query.sourceId as string;

        if (isNaN(connectionId)) {
            return res.status(400).json({ message: "Invalid connection ID" });
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        if (!connection.active) {
            return res.status(400).json({ message: "Connection is not active" });
        }

        let data;

        switch (connection.service) {
            case 'slack':
                const slackClient = await getSlackClientForConnection(connectionId);
                data = await slackClient.getChannelDataAsDictionary(sourceId);
                break;

            case 'notion':
                const notionClient = await getNotionClientForConnection(connectionId);
                data = await notionClient.getDatabaseAsDictionary(sourceId);
                break;

            case 'linear':
                const linearClient = await getLinearClientForConnection(connectionId);
                data = await linearClient.getTeamDataAsDictionary(sourceId);
                break;

            case 'gdrive':
                const gdriveClient = await getGDriveClientForConnection(connectionId);
                data = await gdriveClient.getFolderContentsAsDictionary(sourceId);
                break;

            default:
                return res.status(400).json({ message: `Unsupported service: ${connection.service}` });
        }

        // Update last synced time
        await storage.updateConnection(connectionId, { lastSyncedAt: new Date() });

        // Add activity
        await storage.createActivity({
            userId: connection.userId,
            type: "data_sync",
            description: `Refreshed data from ${connection.service}`,
            metadata: { connectionId, sourceId }
        });

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: `Failed to fetch data: ${error.message}` });
    }
});
