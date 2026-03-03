import { GrowwConfig } from '@/types/broker';

export class GrowwClient {
    private config: GrowwConfig;

    constructor(config: GrowwConfig) {
        this.config = config;
    }

    // Placeholder methods matching DhanClient interface for factory compatibility
    public async validateSession(): Promise<boolean> {
        console.warn("Groww integration is experimental.");
        return true;
    }

    public async getProfile(): Promise<any> {
        return { name: "Groww User (Simulated)" };
    }
}
