import { parseSession, serializeSession, type UserSession } from '@zcorp/shared-contracts';
import type { RedisClientType } from 'redis';

import { BffAppError, sessionStoreUnavailable } from '../errors.js';
import type { BffConfig } from '../config.js';
import type { SessionStore } from '../types.js';

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const REFRESH_LOCK_PREFIX = 'lock:refresh:';
type AnyRedisClient = RedisClientType<any, any, any>;

function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

function userSessionsKey(userId: string): string {
  return `${USER_SESSIONS_PREFIX}${userId}`;
}

function refreshLockKey(sessionId: string): string {
  return `${REFRESH_LOCK_PREFIX}${sessionId}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RedisSessionStore implements SessionStore {
  constructor(
    private readonly redis: AnyRedisClient,
    private readonly config: Pick<BffConfig, 'refreshLockTtlMs'>,
    private readonly now: () => number = () => Date.now()
  ) {}

  async get(sessionId: string): Promise<UserSession | null> {
    try {
      const raw = await this.redis.get(sessionKey(sessionId));
      return raw ? parseSession(raw) : null;
    } catch (error) {
      throw sessionStoreUnavailable(error, 'get-session');
    }
  }

  async save(session: UserSession): Promise<void> {
    const ttlSeconds = this.calculateSessionTtlSeconds(session);
    if (ttlSeconds <= 0) {
      throw new BffAppError('SESSION_EXPIRED', 401, 'Session already expired');
    }

    try {
      await this.redis
        .multi()
        .set(sessionKey(session.sessionId), serializeSession(session), { EX: ttlSeconds })
        .sAdd(userSessionsKey(session.userId), session.sessionId)
        .expire(userSessionsKey(session.userId), ttlSeconds, 'NX')
        .expire(userSessionsKey(session.userId), ttlSeconds, 'GT')
        .exec();
    } catch (error) {
      throw sessionStoreUnavailable(error, 'save-session');
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const current = await this.get(sessionId);
      if (!current) {
        return;
      }

      await this.redis
        .multi()
        .del(sessionKey(sessionId))
        .sRem(userSessionsKey(current.userId), sessionId)
        .exec();
    } catch (error) {
      throw sessionStoreUnavailable(error, 'delete-session');
    }
  }

  async deleteAllForUser(userId: string): Promise<number> {
    try {
      const sessionIds = await this.redis.sMembers(userSessionsKey(userId));
      if (sessionIds.length === 0) {
        return 0;
      }

      const transaction = this.redis.multi();
      for (const sessionId of sessionIds) {
        transaction.del(sessionKey(sessionId));
      }
      transaction.del(userSessionsKey(userId));
      await transaction.exec();
      return sessionIds.length;
    } catch (error) {
      throw sessionStoreUnavailable(error, 'delete-all-sessions-for-user');
    }
  }

  async withRefreshLock<T>(sessionId: string, action: () => Promise<T>): Promise<T> {
    const lockKey = refreshLockKey(sessionId);
    const lockValue = crypto.randomUUID();
    const startedAt = this.now();

    while (this.now() - startedAt < this.config.refreshLockTtlMs * 2) {
      try {
        const acquired = await this.redis.set(lockKey, lockValue, {
          PX: this.config.refreshLockTtlMs,
          NX: true
        });

        if (!acquired) {
          await delay(50);
          continue;
        }

        try {
          return await action();
        } finally {
          await this.redis.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0",
            {
              keys: [lockKey],
              arguments: [lockValue]
            }
          );
        }
      } catch (error) {
        throw sessionStoreUnavailable(error, 'with-refresh-lock');
      }
    }

    throw new BffAppError('TOKEN_REFRESH_FAILED', 401, 'Unable to acquire refresh lock for session');
  }

  private calculateSessionTtlSeconds(session: UserSession): number {
    const nowSeconds = Math.floor(this.now() / 1000);
    return Math.max(1, Math.min(session.refreshTokenExpiresAt, session.absoluteExpiresAt) - nowSeconds);
  }
}