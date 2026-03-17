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

  async compareAndSwap(session: UserSession, expectedVersion: number): Promise<boolean> {
    const ttlSeconds = this.calculateSessionTtlSeconds(session);
    if (ttlSeconds <= 0) {
      throw new BffAppError('SESSION_EXPIRED', 401, 'Session already expired');
    }

    try {
      const result = await this.redis.eval(
        `
          local current = redis.call('get', KEYS[1])
          if not current then
            return 0
          end

          local decoded = cjson.decode(current)
          if tonumber(decoded.version) ~= tonumber(ARGV[1]) then
            return 0
          end

          redis.call('set', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
          redis.call('sadd', KEYS[2], ARGV[4])
          redis.call('expire', KEYS[2], tonumber(ARGV[3]), 'NX')
          redis.call('expire', KEYS[2], tonumber(ARGV[3]), 'GT')
          return 1
        `,
        {
          keys: [sessionKey(session.sessionId), userSessionsKey(session.userId)],
          arguments: [
            String(expectedVersion),
            serializeSession(session),
            String(ttlSeconds),
            session.sessionId
          ]
        }
      );

      return result === 1;
    } catch (error) {
      throw sessionStoreUnavailable(error, 'compare-and-swap-session');
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

  async countActiveSessions(): Promise<number> {
    try {
      let count = 0;
      let cursor = 0;

      do {
        const page = await this.redis.scan(cursor, {
          MATCH: `${SESSION_PREFIX}*`,
          COUNT: 100
        });

        cursor = Number(page.cursor);
        count += page.keys.length;
      } while (cursor !== 0);

      return count;
    } catch (error) {
      throw sessionStoreUnavailable(error, 'count-active-sessions');
    }
  }

  async withRefreshLock<T>(sessionId: string, action: () => Promise<T>, onConflict?: () => void): Promise<T> {
    const lockKey = refreshLockKey(sessionId);
    const lockValue = crypto.randomUUID();
    const startedAt = this.now();

    while (this.now() - startedAt < this.config.refreshLockTtlMs * 2) {
      let acquired: string | null;

      try {
        acquired = await this.redis.set(lockKey, lockValue, {
          PX: this.config.refreshLockTtlMs,
          NX: true
        });
      } catch (error) {
        throw sessionStoreUnavailable(error, 'acquire-refresh-lock');
      }

      if (!acquired) {
        onConflict?.();
        await delay(50);
        continue;
      }

      let result: T | undefined;
      let actionError: unknown;

      try {
        result = await action();
      } catch (error) {
        actionError = error;
      }

      try {
        await this.redis.eval(
          "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0",
          {
            keys: [lockKey],
            arguments: [lockValue]
          }
        );
      } catch (error) {
        if (actionError === undefined) {
          throw sessionStoreUnavailable(error, 'release-refresh-lock');
        }
      }

      if (actionError !== undefined) {
        throw actionError;
      }

      return result as T;
    }

    throw new BffAppError('TOKEN_REFRESH_FAILED', 401, 'Unable to acquire refresh lock for session');
  }

  private calculateSessionTtlSeconds(session: UserSession): number {
    const nowSeconds = Math.floor(this.now() / 1000);
    return Math.max(1, Math.min(session.refreshTokenExpiresAt, session.absoluteExpiresAt) - nowSeconds);
  }
}