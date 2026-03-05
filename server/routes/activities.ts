
import { Router } from "express";
import { storage } from "../storage";
import { sendError } from "../utils/errors";

export const activitiesRouter = Router();

activitiesRouter.get('/api/activities', async (req, res) => {
    try {
        const userId = req.user!.id;
        const limitParam = req.query.limit;
        const limit = limitParam ? parseInt(limitParam as string) : undefined;

        if (limitParam && (isNaN(limit!) || limit! < 1)) {
            return sendError(res, 400, "Invalid limit parameter - must be a positive integer");
        }

        const activities = await storage.getActivities(userId, limit);
        res.json(activities);
    } catch (error) {
        sendError(res, 500, "Failed to get activities", error);
    }
});
