
import { Router } from "express";
import { getAvailableServicesFromEnv } from "../env-setup";
import { sendError, sendSuccess } from "../utils/errors";

export const environmentRouter = Router();

environmentRouter.get('/api/environment/services', (_req, res) => {
    try {
        const availableServices = getAvailableServicesFromEnv();

        sendSuccess(res, {
            availableServices,
            configured: Object.entries(availableServices)
                .filter(([_, available]) => available)
                .map(([service]) => service)
        });
    } catch (error) {
        sendError(res, 500, "Failed to get environment services", error);
    }
});

environmentRouter.get('/api/environment/safety', (_req, res) => {
    res.json({
        enabled: process.env.SAFETY_MODE !== 'false'
    });
});

environmentRouter.post('/api/environment/safety', (req, res) => {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        return sendError(res, 400, "The 'enabled' field must be a boolean");
    }

    process.env.SAFETY_MODE = String(enabled);
    console.log(`Safety mode set to: ${enabled}`);
    sendSuccess(res, {
        enabled: process.env.SAFETY_MODE !== 'false'
    });
});
