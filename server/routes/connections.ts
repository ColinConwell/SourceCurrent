
import { Router } from "express";
import { storage } from "../storage";
import { insertConnectionSchema } from "../../shared/schema";
import { z } from "zod";
import { connectionCache } from "../services/connection-cache";

export const connectionsRouter = Router();

connectionsRouter.get('/api/connections', async (req, res) => {
    try {
        const userId = req.user!.id;
        const connections = await connectionCache.getConnections(userId);
        res.json(connections);
    } catch (error) {
        res.status(500).json({ message: "Failed to get connections" });
    }
});

connectionsRouter.post('/api/connections', async (req, res) => {
    try {
        const userId = req.user!.id;
        const connectionData = insertConnectionSchema.parse({
            ...req.body,
            userId
        });

        const connection = await storage.createConnection(connectionData);
        connectionCache.invalidate(userId);
        res.status(201).json(connection);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid connection data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create connection" });
    }
});

connectionsRouter.patch('/api/connections/:id', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.id);

        if (isNaN(connectionId)) {
            return res.status(400).json({ message: "Invalid connection ID" });
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        const updates = req.body;
        const updatedConnection = await storage.updateConnection(connectionId, updates);

        if (req.user) try { connectionCache.invalidate(req.user.id); } catch (e) { }

        res.json(updatedConnection);
    } catch (error) {
        res.status(500).json({ message: "Failed to update connection" });
    }
});

connectionsRouter.delete('/api/connections/:id', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.id);

        if (isNaN(connectionId)) {
            return res.status(400).json({ message: "Invalid connection ID" });
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        await storage.deleteConnection(connectionId);

        if (req.user) try { connectionCache.invalidate(req.user.id); } catch (e) { }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete connection" });
    }
});
