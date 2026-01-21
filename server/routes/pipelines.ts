
import { Router } from "express";
import { storage } from "../storage";
import { insertPipelineSchema } from "../../shared/schema";
import { z } from "zod";

export const pipelinesRouter = Router();

pipelinesRouter.get('/api/pipelines', async (req, res) => {
    try {
        // For demo, use a fixed user ID
        const userId = 1;
        const pipelines = await storage.getPipelines(userId);
        res.json(pipelines);
    } catch (error) {
        res.status(500).json({ message: "Failed to get pipelines" });
    }
});

pipelinesRouter.post('/api/pipelines', async (req, res) => {
    try {
        // For demo, use a fixed user ID
        const userId = 1;
        const pipelineData = insertPipelineSchema.parse({
            ...req.body,
            userId
        });

        const pipeline = await storage.createPipeline(pipelineData);
        res.status(201).json(pipeline);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid pipeline data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create pipeline" });
    }
});

pipelinesRouter.patch('/api/pipelines/:id', async (req, res) => {
    try {
        const pipelineId = parseInt(req.params.id);

        if (isNaN(pipelineId)) {
            return res.status(400).json({ message: "Invalid pipeline ID" });
        }

        const pipeline = await storage.getPipeline(pipelineId);

        if (!pipeline) {
            return res.status(404).json({ message: "Pipeline not found" });
        }

        const updates = req.body;
        const updatedPipeline = await storage.updatePipeline(pipelineId, updates);

        res.json(updatedPipeline);
    } catch (error) {
        res.status(500).json({ message: "Failed to update pipeline" });
    }
});

pipelinesRouter.delete('/api/pipelines/:id', async (req, res) => {
    try {
        const pipelineId = parseInt(req.params.id);

        if (isNaN(pipelineId)) {
            return res.status(400).json({ message: "Invalid pipeline ID" });
        }

        const pipeline = await storage.getPipeline(pipelineId);

        if (!pipeline) {
            return res.status(404).json({ message: "Pipeline not found" });
        }

        await storage.deletePipeline(pipelineId);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete pipeline" });
    }
});
