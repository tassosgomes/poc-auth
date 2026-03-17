import type { RedisClientType } from 'redis';
import type { BffConfig } from '../config.js';
import type { OidcFlowTransaction, OidcTransactionStore } from '../types.js';
type AnyRedisClient = RedisClientType<any, any, any>;
export declare class RedisOidcTransactionStore implements OidcTransactionStore {
    private readonly redis;
    private readonly config;
    constructor(redis: AnyRedisClient, config: Pick<BffConfig, 'oidcTransactionTtlSeconds'>);
    save(transaction: OidcFlowTransaction): Promise<void>;
    consume(state: string): Promise<OidcFlowTransaction | null>;
}
export {};
