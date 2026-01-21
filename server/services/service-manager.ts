import { localConfig } from "./local-config";
export interface ServiceConfig {
    name: string;
    isEnabled: boolean;
    initialize: () => Promise<void>;
}

export class ServiceManager {
    private services: Map<string, ServiceConfig> = new Map();

    register(name: string, checkEnv: () => boolean, initFn: () => Promise<void>) {
        // Local config overrides environment check if credentials exist
        const isEnabled = localConfig.has(name) || checkEnv();
        this.services.set(name, {
            name,
            isEnabled,
            initialize: initFn
        });
        return isEnabled;
    }

    async initializeAll() {
        const results: Record<string, string> = {};

        for (const [name, config] of Array.from(this.services.entries())) {
            if (config.isEnabled) {
                try {
                    console.log(`Initializing service: ${name}...`);
                    await config.initialize();
                    results[name] = "connected";
                    console.log(`✓ Service ${name} initialized successfully.`);
                } catch (error) {
                    console.error(`✗ Failed to initialize service ${name}:`, error);
                    results[name] = "error";
                }
            } else {
                console.log(`- Service ${name} skipped (missing credentials).`);
                results[name] = "skipped";
            }
        }

        return results;
    }

    getServiceStatus(name: string) {
        return this.services.get(name)?.isEnabled || false;
    }
}

export const serviceManager = new ServiceManager();
