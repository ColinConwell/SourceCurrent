
import { Router } from "express";
import { getAvailableServicesFromEnv } from "../env-setup";

export const environmentRouter = Router();

environmentRouter.get('/api/environment/services', (_req, res) => {
    try {
        const availableServices = getAvailableServicesFromEnv();

        res.json({
            success: true,
            data: {
                availableServices,
                configured: Object.entries(availableServices)
                    .filter(([_, available]) => available)
                    .map(([service]) => service)
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

environmentRouter.get('/api/environment/safety', (_req, res) => {
    res.json({
        enabled: process.env.SAFETY_MODE !== 'false'
    });
});

environmentRouter.post('/api/environment/safety', (req, res) => {
    const { enabled } = req.body;
    process.env.SAFETY_MODE = String(enabled);
    console.log(`Safety mode set to: ${enabled}`);
    res.json({
        success: true,
        enabled: process.env.SAFETY_MODE !== 'false'
    });
});
