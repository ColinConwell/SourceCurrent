
import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
            }
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // In a real app, this would verify a session or JWT
    // For this demo, we'll attach a hardcoded demo user
    req.user = {
        id: 1,
        username: 'demo_user'
    };
    next();
}
