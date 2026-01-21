
import { Request, Response, NextFunction } from "express";

export function safetyModeMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if safety mode is enabled (default to true if not specified)
    const isSafetyMode = process.env.SAFETY_MODE !== 'false';

    // Define potentially destructive methods
    const destructiveMethods = ['DELETE'];

    // Define methods that might be destructive depending on the route
    // We'll be more permissive with POST/PUT generally, but could block specific paths if needed
    // For now, let's strictly block DELETE

    if (isSafetyMode && destructiveMethods.includes(req.method)) {
        return res.status(403).json({
            error: "Safety Mode Enabled",
            message: "This action is blocked because Safety Mode is currently active. Disable Safety Mode in the Debug Panel or environment variables to proceed.",
            code: "SAFETY_MODE_BLOCK"
        });
    }

    next();
}
