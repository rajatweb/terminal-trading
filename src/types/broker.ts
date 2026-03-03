
export type BrokerName = 'dhan' | 'groww';

export interface DhanConfig {
    clientId: string;
    accessToken: string;
}

export interface GrowwConfig {
    // Placeholder for now as Groww API is unofficial
    apiKey?: string;
}

export interface BrokerConnection {
    name: BrokerName;
    config: DhanConfig | GrowwConfig;
    connectedAt: number;
}
