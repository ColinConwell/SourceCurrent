
import { Router } from "express";
import { storage } from "../storage";

export const activitiesRouter = Router();

activitiesRouter.get('/api/activities', async (req, res) => {
    try {
        // For demo, use a fixed user ID
        const userId = 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

        const activities = await storage.getActivities(userId, limit);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to get activities" });
    }
});
