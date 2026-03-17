import { type UserSession } from '@zcorp/shared-contracts';
import type { RedisClientType } from 'redis';
import type { BffConfig } from '../config.js';
import type { SessionStore } from '../types.js';
type AnyRedisClient = RedisClientType<any, any, any>;
export declare class RedisSessionStore implements SessionStore {
    private readonly redis;
    private readonly config;
    private readonly now;
    constructor(redis: AnyRedisClient, config: Pick<BffConfig, 'refreshLockTtlMs'>, now?: () => number);
    get(sessionId: string): Promise<UserSession | null>;
    save(session: UserSession): Promise<void>;
    delete(sessionId: string): Promise<void>;
    deleteAllForUser(userId: string): Promise<number>;
    withRefreshLock<T>(sessionId: string, action: () => Promise<T>): Promise<T>;
    private calculateSessionTtlSeconds;
}
export {};
