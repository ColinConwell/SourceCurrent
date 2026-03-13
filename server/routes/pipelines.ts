
import { Router } from "express";
import { storage } from "../storage";
import { insertPipelineSchema } from "../../shared/schema";
import { z } from "zod";
import { sendError } from "../utils/errors";

export const pipelinesRouter = Router();

pipelinesRouter.get('/api/pipelines', async (req, res) => {
    try {
        const userId = req.user!.id;
        const pipelines = await storage.getPipelines(userId);
        res.json(pipelines);
    } catch (error) {
        sendError(res, 500, "Failed to get pipelines", error);
    }
});

pipelinesRouter.post('/api/pipelines', async (req, res) => {
    try {
        const userId = req.user!.id;
        const pipelineData = insertPipelineSchema.parse({
            ...req.body,
            userId
        });

        const pipeline = await storage.createPipeline(pipelineData);
        res.status(201).json(pipeline);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: "Invalid pipeline data", details: error.errors });
        }
        sendError(res, 500, "Failed to create pipeline", error);
    }
});

pipelinesRouter.patch('/api/pipelines/:id', async (req, res) => {
    try {
        const pipelineId = parseInt(req.params.id);

        if (isNaN(pipelineId)) {
            return sendError(res, 400, "Invalid pipeline ID");
        }

        const pipeline = await storage.getPipeline(pipelineId);

        if (!pipeline) {
            return sendError(res, 404, "Pipeline not found");
        }

        // Only allow updating specific safe fields
        const allowedFields = ['name', 'description', 'active', 'config'];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, "No valid fields to update");
        }

        const updatedPipeline = await storage.updatePipeline(pipelineId, updates);

        res.json(updatedPipeline);
    } catch (error) {
        sendError(res, 500, "Failed to update pipeline", error);
    }
});

pipelinesRouter.delete('/api/pipelines/:id', async (req, res) => {
    try {
        const pipelineId = parseInt(req.params.id);

        if (isNaN(pipelineId)) {
            return sendError(res, 400, "Invalid pipeline ID");
        }

        const pipeline = await storage.getPipeline(pipelineId);

        if (!pipeline) {
            return sendError(res, 404, "Pipeline not found");
        }

        await storage.deletePipeline(pipelineId);

        res.json({ success: true });
    } catch (error) {
        sendError(res, 500, "Failed to delete pipeline", error);
    }
});
