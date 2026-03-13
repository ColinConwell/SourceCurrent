
import { Router } from "express";
import { storage } from "../storage";
import { insertConnectionSchema } from "../../shared/schema";
import { z } from "zod";
import { connectionCache } from "../services/connection-cache";
import { sendError, sendSuccess } from "../utils/errors";

export const connectionsRouter = Router();

connectionsRouter.get('/api/connections', async (req, res) => {
    try {
        const userId = req.user!.id;
        const connections = await connectionCache.getConnections(userId);
        res.json(connections);
    } catch (error) {
        sendError(res, 500, "Failed to get connections", error);
    }
});

connectionsRouter.post('/api/connections', async (req, res) => {
    try {
        const userId = req.user!.id;
        const connectionData = insertConnectionSchema.parse({
            ...req.body,
            userId
        });

        // Check for duplicate connections to the same service
        const existing = await connectionCache.getConnections(userId);
        const duplicate = existing.find(c => c.service === connectionData.service && c.name === connectionData.name);
        if (duplicate) {
            return sendError(res, 409, `A connection named "${connectionData.name}" for ${connectionData.service} already exists`);
        }

        const connection = await storage.createConnection(connectionData);
        connectionCache.invalidate(userId);
        res.status(201).json(connection);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: "Invalid connection data", details: error.errors });
        }
        sendError(res, 500, "Failed to create connection", error);
    }
});

connectionsRouter.patch('/api/connections/:id', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.id);

        if (isNaN(connectionId)) {
            return sendError(res, 400, "Invalid connection ID");
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return sendError(res, 404, "Connection not found");
        }

        // Only allow updating specific safe fields
        const allowedFields = ['name', 'active', 'credentials'];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, "No valid fields to update");
        }

        const updatedConnection = await storage.updateConnection(connectionId, updates);

        if (req.user) {
            try { connectionCache.invalidate(req.user.id); } catch (e) {
                console.error("Failed to invalidate connection cache:", e);
            }
        }

        res.json(updatedConnection);
    } catch (error) {
        sendError(res, 500, "Failed to update connection", error);
    }
});

connectionsRouter.delete('/api/connections/:id', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.id);

        if (isNaN(connectionId)) {
            return sendError(res, 400, "Invalid connection ID");
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return sendError(res, 404, "Connection not found");
        }

        await storage.deleteConnection(connectionId);

        if (req.user) {
            try { connectionCache.invalidate(req.user.id); } catch (e) {
                console.error("Failed to invalidate connection cache:", e);
            }
        }

        res.json({ success: true });
    } catch (error) {
        sendError(res, 500, "Failed to delete connection", error);
    }
});
