
import fs from 'fs';
import path from 'path';

export class LocalConfigService {
    private config: Record<string, string> = {};
    private configPath: string;

    constructor() {
        this.configPath = path.resolve(process.cwd(), 'server', 'local-credentials.json');
        this.loadConfig();
    }

    private loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const fileContent = fs.readFileSync(this.configPath, 'utf-8');
                this.config = JSON.parse(fileContent);

                // Inject into process.env for compatibility with existing service setup files
                for (const [key, value] of Object.entries(this.config)) {
                    if (value && typeof value === 'string') {
                        process.env[key] = value;
                    }
                }

                console.log('✅ Loaded local credentials from server/local-credentials.json');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load local credentials:', error);
        }
    }

    get(key: string): string | undefined {
        // Prioritize local config, fallback to process.env is handled by the caller or we can do it here
        // Let's return local config value if present
        return this.config[key];
    }

    has(key: string): boolean {
        return key in this.config;
    }

    reload() {
        this.loadConfig();
    }
}

export const localConfig = new LocalConfigService();
