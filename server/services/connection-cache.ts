
import { Connection } from "../../shared/schema";
import { storage } from "../storage";

class ConnectionCacheService {
    private cache: Map<number, { data: Connection[], timestamp: number }> = new Map();
    private TTL = 60 * 1000; // 1 minute TTL

    async getConnections(userId: number): Promise<Connection[]> {
        const cached = this.cache.get(userId);
        const now = Date.now();

        if (cached && (now - cached.timestamp < this.TTL)) {
            return cached.data;
        }

        const connections = await storage.getConnections(userId);
        this.cache.set(userId, { data: connections, timestamp: now });
        return connections;
    }

    invalidate(userId: number) {
        this.cache.delete(userId);
    }
}

export const connectionCache = new ConnectionCacheService();
