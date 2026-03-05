
import { Router } from "express";
import { storage } from "../storage";
import { insertDataSourceSchema } from "../../shared/schema";
import { z } from "zod";
import { sendError } from "../utils/errors";

export const dataSourcesRouter = Router();

dataSourcesRouter.get('/api/connections/:connectionId/data-sources', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.connectionId);

        if (isNaN(connectionId)) {
            return sendError(res, 400, "Invalid connection ID");
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return sendError(res, 404, "Connection not found");
        }

        const dataSources = await storage.getDataSources(connectionId);
        res.json(dataSources);
    } catch (error) {
        sendError(res, 500, "Failed to get data sources", error);
    }
});

dataSourcesRouter.post('/api/connections/:connectionId/data-sources', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.connectionId);

        if (isNaN(connectionId)) {
            return sendError(res, 400, "Invalid connection ID");
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return sendError(res, 404, "Connection not found");
        }

        const dataSourceData = insertDataSourceSchema.parse({
            ...req.body,
            connectionId
        });

        const dataSource = await storage.createDataSource(dataSourceData);
        res.status(201).json(dataSource);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: "Invalid data source data", details: error.errors });
        }
        sendError(res, 500, "Failed to create data source", error);
    }
});

dataSourcesRouter.get('/api/connections/:connectionId/discover', async (req, res) => {
    try {
        const connectionId = parseInt(req.params.connectionId);

        if (isNaN(connectionId)) {
            return sendError(res, 400, "Invalid connection ID");
        }

        const connection = await storage.getConnection(connectionId);

        if (!connection) {
            return sendError(res, 404, "Connection not found");
        }

        if (!connection.active) {
            return sendError(res, 400, "Connection is not active");
        }

        // Return existing data sources as discoverable items
        const existingDataSources = await storage.getDataSources(connectionId);
        res.json({
            success: true,
            data: {
                connectionId,
                service: connection.service,
                existingSources: existingDataSources,
                message: "Use the integration-specific API endpoints for full discovery"
            }
        });
    } catch (error) {
        sendError(res, 500, "Failed to discover sources", error);
    }
});
