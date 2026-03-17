import { USER_SESSION_FIXTURE } from '@zcorp/shared-contracts';
import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from 'redis';
import { BffAppError } from '../errors.js';
import { RedisSessionStore } from '../session/redis-session-store.js';
describe('RedisSessionStore integration', () => {
    let container;
    let redis;
    let store;
    beforeAll(async () => {
        container = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
            .start();
        redis = createClient({
            url: `redis://${container.getHost()}:${container.getMappedPort(6379)}`
        });
        await redis.connect();
        store = new RedisSessionStore(redis, { refreshLockTtlMs: 5000 }, () => 1710000000000);
    });
    beforeEach(async () => {
        await redis.flushAll();
    });
    afterAll(async () => {
        await redis.quit();
        await container.stop();
    });
    it('persists and recovers a serialized session with reverse user index', async () => {
        const session = {
            ...USER_SESSION_FIXTURE,
            accessTokenExpiresAt: 1710001800,
            refreshTokenExpiresAt: 1710007200,
            absoluteExpiresAt: 1710007200,
            createdAt: 1710000000,
            lastAccessAt: 1710000000
        };
        await store.save(session);
        await expect(store.get(session.sessionId)).resolves.toEqual(session);
        await expect(redis.sMembers(`user_sessions:${session.userId}`)).resolves.toContain(session.sessionId);
    });
    it('keeps the reverse user index TTL aligned to the longest active session', async () => {
        const userId = USER_SESSION_FIXTURE.userId;
        const longLivedSession = {
            ...USER_SESSION_FIXTURE,
            sessionId: 'session-long',
            accessTokenExpiresAt: 1710001800,
            refreshTokenExpiresAt: 1710007200,
            absoluteExpiresAt: 1710007200,
            createdAt: 1710000000,
            lastAccessAt: 1710000000
        };
        const shortLivedSession = {
            ...USER_SESSION_FIXTURE,
            sessionId: 'session-short',
            accessTokenExpiresAt: 1710000900,
            refreshTokenExpiresAt: 1710001800,
            absoluteExpiresAt: 1710001800,
            createdAt: 1710000000,
            lastAccessAt: 1710000000
        };
        await store.save(longLivedSession);
        const ttlAfterLongSession = await redis.ttl(`user_sessions:${userId}`);
        await store.save(shortLivedSession);
        const ttlAfterShortSession = await redis.ttl(`user_sessions:${userId}`);
        expect(ttlAfterLongSession).toBeGreaterThan(7000);
        expect(ttlAfterShortSession).toBeGreaterThan(7000);
        await expect(store.deleteAllForUser(userId)).resolves.toBe(2);
        await expect(store.get(longLivedSession.sessionId)).resolves.toBeNull();
        await expect(store.get(shortLivedSession.sessionId)).resolves.toBeNull();
    });
    it('replaces the session only when the expected version still matches', async () => {
        const original = {
            ...USER_SESSION_FIXTURE,
            accessTokenExpiresAt: 1710001800,
            refreshTokenExpiresAt: 1710007200,
            absoluteExpiresAt: 1710007200,
            createdAt: 1710000000,
            lastAccessAt: 1710000000,
            version: 3
        };
        await store.save(original);
        const rotated = {
            ...original,
            accessToken: 'access-token-rotated',
            refreshToken: 'refresh-token-rotated',
            idToken: 'id-token-rotated',
            lastAccessAt: 1710000100,
            version: 4
        };
        await expect(store.compareAndSwap(rotated, 3)).resolves.toBe(true);
        await expect(store.get(original.sessionId)).resolves.toMatchObject({
            accessToken: 'access-token-rotated',
            refreshToken: 'refresh-token-rotated',
            version: 4
        });
        await expect(store.compareAndSwap({ ...rotated, version: 5 }, 3)).resolves.toBe(false);
    });
    it('counts the active sessions currently stored in Redis', async () => {
        await store.save({
            ...USER_SESSION_FIXTURE,
            sessionId: 'session-count-1',
            accessTokenExpiresAt: 1710001800,
            refreshTokenExpiresAt: 1710007200,
            absoluteExpiresAt: 1710007200,
            createdAt: 1710000000,
            lastAccessAt: 1710000000
        });
        await store.save({
            ...USER_SESSION_FIXTURE,
            sessionId: 'session-count-2',
            accessTokenExpiresAt: 1710001800,
            refreshTokenExpiresAt: 1710007200,
            absoluteExpiresAt: 1710007200,
            createdAt: 1710000000,
            lastAccessAt: 1710000000
        });
        await expect(store.countActiveSessions()).resolves.toBe(2);
    });
    it('preserves functional refresh errors raised inside the critical section', async () => {
        const refreshError = new BffAppError('TOKEN_REFRESH_FAILED', 401, 'OIDC token refresh failed', {
            providerError: 'invalid_grant'
        });
        await expect(store.withRefreshLock('refresh-failure-session', async () => {
            throw refreshError;
        })).rejects.toBe(refreshError);
    });
});
