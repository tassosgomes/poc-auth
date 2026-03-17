import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../app.js';
import type { BffConfig } from '../config.js';
import { BffAppError } from '../errors.js';
import { InMemoryOidcTransactionStore, InMemorySessionStore, StaticPermissionService } from './test-doubles.js';

function buildConfig(): BffConfig {
  return {
    nodeEnv: 'test',
    port: 4000,
    publicBaseUrl: 'https://api-authpoc.tasso.dev.br',
    shellPublicBaseUrl: 'https://app-authpoc.tasso.dev.br',
    javaUpstreamUrl: 'http://java-authpoc:8080',
    dotnetUpstreamUrl: 'http://dotnet-authpoc:8080',
    sessionCookieName: 'session_id',
    sessionCookieSecure: true,
    sessionCookieHttpOnly: true,
    sessionCookieSameSite: 'Strict',
    sessionTtlSeconds: 28800,
    absoluteSessionTtlSeconds: 43200,
    oidcTransactionTtlSeconds: 600,
    refreshLockTtlMs: 5000,
    accessTokenRefreshSkewSeconds: 30,
    permissionSnapshotCacheTtlSeconds: 300,
    roleAccessCacheTtlSeconds: 3600,
    oidcAuthorizationEndpoint: 'https://cyberark.example/authorize',
    oidcTokenEndpoint: 'https://cyberark.example/token',
    oidcIssuerUrl: 'https://cyberark.example',
    oidcJwksUrl: 'https://cyberark.example/.well-known/jwks.json',
    oidcClientId: 'client-id',
    oidcClientSecret: 'secret',
    oidcRedirectUri: 'https://api-authpoc.tasso.dev.br/api/auth/callback',
    oidcScopes: ['openid', 'profile', 'email', 'ROLES'],
    redisHost: 'localhost',
    redisPort: 6379,
    redisUsername: undefined,
    redisPassword: undefined,
    redisTlsEnabled: false,
    authzDbHost: 'localhost',
    authzDbPort: 5432,
    authzDbName: 'iam_authz',
    authzDbUser: 'postgres',
    authzDbPassword: 'postgres',
    authzDbSslMode: 'disable'
  };
}

function createValidatedClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'user-123',
    nonce: 'nonce-123',
    ROLES: ['admin'],
    ...overrides
  };
}

function createOidcClientStub(overrides: Partial<BuildAppOidcClientStub> = {}): BuildAppOidcClientStub {
  return {
    createAuthorizationUrl: vi.fn().mockResolvedValue('https://cyberark.example/authorize?state=abc'),
    exchangeCode: vi.fn().mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      tokenType: 'Bearer',
      accessTokenExpiresIn: 300,
      refreshTokenExpiresIn: 3600
    }),
    refresh: vi.fn().mockResolvedValue({
      accessToken: 'access-456',
      refreshToken: 'refresh-456',
      idToken: 'signed-id-token-2',
      tokenType: 'Bearer',
      accessTokenExpiresIn: 300,
      refreshTokenExpiresIn: 3600
    }),
    validateIdToken: vi.fn().mockResolvedValue(createValidatedClaims()),
    ...overrides
  };
}

type BuildAppOidcClientStub = {
  createAuthorizationUrl: ReturnType<typeof vi.fn>;
  exchangeCode: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  validateIdToken: ReturnType<typeof vi.fn>;
};

function createPermissionService(snapshotOverrides: Partial<Record<string, unknown>> = {}) {
  return new StaticPermissionService((input) => ({
    userId: input.userId,
    roles: input.roles,
    permissions: ['dashboard:view'],
    screens: ['dashboard'],
    routes: ['/dashboard'],
    microfrontends: [],
    generatedAt: new Date().toISOString(),
    version: input.sessionVersion,
    ...snapshotOverrides
  }));
}

describe('BFF app integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects login to the provider and stores the OIDC transaction', async () => {
    const sessionStore = new InMemorySessionStore();
    const transactionStore = new InMemoryOidcTransactionStore();
    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: transactionStore,
      permissionService: new StaticPermissionService((input) => ({
        userId: input.userId,
        roles: input.roles,
        permissions: [],
        screens: [],
        routes: [],
        microfrontends: [],
        generatedAt: new Date().toISOString(),
        version: input.sessionVersion
      })),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({ method: 'GET', url: '/api/auth/login' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://cyberark.example/authorize?state=abc');
    await app.close();
  });

  it('returns a standardized callback error when state is invalid', async () => {
    const app = await buildApp({
      config: buildConfig(),
      sessionStore: new InMemorySessionStore(),
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/callback?code=abc&state=missing'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'OIDC_CALLBACK_INVALID',
      status: 400
    });
    await app.close();
  });

  it('creates a session, emits an opaque cookie and redirects on a valid callback', async () => {
    const sessionStore = new InMemorySessionStore();
    const transactionStore = new InMemoryOidcTransactionStore();
    await transactionStore.save({
      state: 'state-123',
      nonce: 'nonce-123',
      codeVerifier: 'verifier-123',
      redirectTo: 'https://app-authpoc.tasso.dev.br',
      createdAt: 1710000000
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: transactionStore,
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/callback?code=abc&state=state-123'
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://app-authpoc.tasso.dev.br');
    expect(response.cookies).toHaveLength(1);
    expect(response.cookies[0]).toMatchObject({
      name: 'session_id',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/'
    });

    const storedSessionId = response.cookies[0].value;
    await expect(sessionStore.get(storedSessionId)).resolves.toMatchObject({
      userId: 'user-123',
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      version: 1
    });
    await app.close();
  });

  it('proxies authenticated requests and injects the bearer token', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'session-123',
      userId: 'user-123',
      roles: ['admin'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub(),
      fetchImpl
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/java/orders/v1/orders?status=open',
      headers: {
        'x-correlation-id': 'corr-proxy-123'
      },
      cookies: {
        session_id: 'session-123'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [target, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(target.toString()).toBe('http://java-authpoc:8080/orders/v1/orders?status=open');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer access-123');
    expect(new Headers(init.headers).get('x-correlation-id')).toBe('corr-proxy-123');
    expect(response.headers['x-correlation-id']).toBe('corr-proxy-123');
    await app.close();
  });

  it('rejects the callback when id_token validation fails', async () => {
    const transactionStore = new InMemoryOidcTransactionStore();
    await transactionStore.save({
      state: 'state-123',
      nonce: 'nonce-123',
      codeVerifier: 'verifier-123',
      redirectTo: 'https://app-authpoc.tasso.dev.br',
      createdAt: 1710000000
    });

    const oidcClient = createOidcClientStub({
      validateIdToken: vi
        .fn()
        .mockRejectedValue(new BffAppError('OIDC_CALLBACK_INVALID', 400, 'Invalid id_token returned by OIDC provider'))
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore: new InMemorySessionStore(),
      oidcTransactionStore: transactionStore,
      permissionService: createPermissionService(),
      oidcClient
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/callback?code=abc&state=state-123'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'OIDC_CALLBACK_INVALID',
      status: 400
    });
    await app.close();
  });

  it('returns 401 when the session cookie is missing', async () => {
    const app = await buildApp({
      config: buildConfig(),
      sessionStore: new InMemorySessionStore(),
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      headers: {
        'x-correlation-id': 'corr-missing-session'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'SESSION_NOT_FOUND',
      status: 401,
      correlationId: 'corr-missing-session',
      traceId: 'corr-missing-session'
    });
    expect(response.headers['x-correlation-id']).toBe('corr-missing-session');
    await app.close();
  });

  it('returns 401 and clears the cookie when the session expired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'expired-session',
      userId: 'user-123',
      roles: ['admin'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: nowSeconds - 120,
      refreshTokenExpiresAt: nowSeconds - 60,
      absoluteExpiresAt: nowSeconds - 60,
      createdAt: nowSeconds - 3600,
      lastAccessAt: nowSeconds - 120,
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      cookies: {
        session_id: 'expired-session'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'SESSION_EXPIRED',
      status: 401
    });
    expect(response.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'session_id',
          value: ''
        })
      ])
    );
    await app.close();
  });

  it('returns 503 when the session store is unavailable', async () => {
    const unavailableStore = {
      get: vi.fn().mockRejectedValue(new BffAppError('SESSION_STORE_UNAVAILABLE', 503, 'Session store unavailable')),
      save: vi.fn(),
      compareAndSwap: vi.fn(),
      delete: vi.fn(),
      deleteAllForUser: vi.fn(),
      countActiveSessions: vi.fn().mockResolvedValue(0),
      withRefreshLock: vi.fn()
    };

    const app = await buildApp({
      config: buildConfig(),
      sessionStore: unavailableStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      cookies: {
        session_id: 'session-123'
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      code: 'SESSION_STORE_UNAVAILABLE',
      status: 503
    });
    await app.close();
  });

  it('proxies authenticated requests to the .NET upstream', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'session-456',
      userId: 'user-123',
      roles: ['admin'],
      accessToken: 'access-456',
      refreshToken: 'refresh-456',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub(),
      fetchImpl
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/dotnet/reports/v1/reports?month=2026-03',
      cookies: {
        session_id: 'session-456'
      }
    });

    expect(response.statusCode).toBe(200);
    const [target, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(target.toString()).toBe('http://dotnet-authpoc:8080/reports/v1/reports?month=2026-03');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer access-456');
    await app.close();
  });

  it('returns 502 when the upstream proxy request fails', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'session-789',
      userId: 'user-123',
      roles: ['admin'],
      accessToken: 'access-789',
      refreshToken: 'refresh-789',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub(),
      fetchImpl: vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'))
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/java/orders/v1/orders',
      cookies: {
        session_id: 'session-789'
      }
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      code: 'UPSTREAM_ERROR',
      status: 502
    });
    await app.close();
  });

  it('returns the role access matrix for users with the administrative permission', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'admin-session',
      userId: 'admin-user',
      roles: ['admin'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService({ permissions: ['dashboard:view', 'role-access:manage'] }),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/role-access',
      cookies: {
        session_id: 'admin-session'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'admin' }),
        expect.objectContaining({ role: 'coordenador' }),
        expect.objectContaining({ role: 'tecnico' })
      ])
    );
    await app.close();
  });

  it('rejects the admin role access endpoint without the administrative permission', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'coord-session',
      userId: 'coord-user',
      roles: ['coordenador'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/role-access',
      cookies: {
        session_id: 'coord-session'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: 'FORBIDDEN',
      status: 403
    });
    await app.close();
  });

  it('updates the role access matrix through the admin endpoint', async () => {
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'admin-update-session',
      userId: 'admin-user',
      roles: ['admin'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'signed-id-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 300,
      refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      absoluteExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      lastAccessAt: Math.floor(Date.now() / 1000),
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService({ permissions: ['dashboard:view', 'role-access:manage'] }),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/role-access/tecnico',
      cookies: {
        session_id: 'admin-update-session'
      },
      payload: {
        permissions: ['dashboard:view', 'ordens:view', 'ordens:create'],
        screens: ['dashboard', 'ordens'],
        routes: ['/dashboard', '/ordens'],
        microfrontends: ['mfe-dashboard', 'mfe-ordens']
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      role: 'tecnico',
      permissions: ['dashboard:view', 'ordens:view', 'ordens:create'],
      updatedBy: 'admin-user'
    });
    await app.close();
  });

  it('invalidates only the current session on local logout', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'session-local-1',
      userId: 'user-logout',
      roles: ['admin'],
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      idToken: 'id-1',
      accessTokenExpiresAt: nowSeconds + 300,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });
    await sessionStore.save({
      sessionId: 'session-local-2',
      userId: 'user-logout',
      roles: ['admin'],
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      idToken: 'id-2',
      accessTokenExpiresAt: nowSeconds + 300,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/logout',
      cookies: {
        session_id: 'session-local-1'
      }
    });

    expect(response.statusCode).toBe(204);
    await expect(sessionStore.get('session-local-1')).resolves.toBeNull();
    await expect(sessionStore.get('session-local-2')).resolves.not.toBeNull();
    expect(response.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'session_id',
          value: ''
        })
      ])
    );
    await app.close();
  });

  it('invalidates all user sessions on global logout', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'session-global-1',
      userId: 'user-global',
      roles: ['admin'],
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      idToken: 'id-1',
      accessTokenExpiresAt: nowSeconds + 300,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });
    await sessionStore.save({
      sessionId: 'session-global-2',
      userId: 'user-global',
      roles: ['admin'],
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      idToken: 'id-2',
      accessTokenExpiresAt: nowSeconds + 300,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/logout/global',
      cookies: {
        session_id: 'session-global-1'
      }
    });

    expect(response.statusCode).toBe(204);
    await expect(sessionStore.get('session-global-1')).resolves.toBeNull();
    await expect(sessionStore.get('session-global-2')).resolves.toBeNull();

    const followUp = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      cookies: {
        session_id: 'session-global-2'
      }
    });

    expect(followUp.statusCode).toBe(401);
    expect(followUp.json()).toMatchObject({
      code: 'SESSION_NOT_FOUND',
      status: 401
    });
    await app.close();
  });

  it('serializes concurrent refresh requests without corrupting the session', async () => {
    class LockedSessionStore extends InMemorySessionStore {
      private refreshLock: Promise<void> | null = null;

      override async withRefreshLock<T>(_sessionId: string, action: () => Promise<T>, onConflict?: () => void): Promise<T> {
        while (this.refreshLock) {
          onConflict?.();
          await this.refreshLock;
        }

        let releaseLock!: () => void;
        this.refreshLock = new Promise<void>((resolve) => {
          releaseLock = resolve;
        });

        try {
          return await action();
        } finally {
          releaseLock();
          this.refreshLock = null;
        }
      }
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new LockedSessionStore();
    await sessionStore.save({
      sessionId: 'refresh-session',
      userId: 'user-refresh',
      roles: ['admin'],
      accessToken: 'access-stale',
      refreshToken: 'refresh-stale',
      idToken: 'id-stale',
      accessTokenExpiresAt: nowSeconds + 5,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });

    const oidcClient = createOidcClientStub({
      refresh: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));

        return {
          accessToken: 'access-refreshed',
          refreshToken: 'refresh-rotated',
          idToken: 'id-refreshed',
          tokenType: 'Bearer',
          accessTokenExpiresIn: 300,
          refreshTokenExpiresIn: 3600
        };
      })
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient
    });

    const [first, second] = await Promise.all([
      app.inject({
        method: 'GET',
        url: '/api/permissions',
        cookies: {
          session_id: 'refresh-session'
        }
      }),
      app.inject({
        method: 'GET',
        url: '/api/permissions',
        cookies: {
          session_id: 'refresh-session'
        }
      })
    ]);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(oidcClient.refresh).toHaveBeenCalledTimes(1);
    await expect(sessionStore.get('refresh-session')).resolves.toMatchObject({
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
      version: 2
    });
    await app.close();
  });

  it('invalidates the session when refresh fails definitively', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'refresh-failure-session',
      userId: 'user-refresh-failure',
      roles: ['admin'],
      accessToken: 'access-stale',
      refreshToken: 'refresh-stale',
      idToken: 'id-stale',
      accessTokenExpiresAt: nowSeconds + 5,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub({
        refresh: vi
          .fn()
          .mockRejectedValue(new BffAppError('TOKEN_REFRESH_FAILED', 401, 'OIDC token refresh failed', { providerError: 'invalid_grant' }))
      })
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/permissions',
      cookies: {
        session_id: 'refresh-failure-session'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'TOKEN_REFRESH_FAILED',
      status: 401
    });
    expect(response.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'session_id',
          value: ''
        })
      ])
    );
    await expect(sessionStore.get('refresh-failure-session')).resolves.toBeNull();
    await app.close();
  });

  it('exposes operational metrics with active sessions and permission timings', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sessionStore = new InMemorySessionStore();
    await sessionStore.save({
      sessionId: 'metrics-session',
      userId: 'user-metrics',
      roles: ['admin'],
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      idToken: 'id-123',
      accessTokenExpiresAt: nowSeconds + 300,
      refreshTokenExpiresAt: nowSeconds + 3600,
      absoluteExpiresAt: nowSeconds + 3600,
      createdAt: nowSeconds,
      lastAccessAt: nowSeconds,
      version: 1
    });

    const app = await buildApp({
      config: buildConfig(),
      sessionStore,
      oidcTransactionStore: new InMemoryOidcTransactionStore(),
      permissionService: createPermissionService(),
      oidcClient: createOidcClientStub()
    });

    await app.inject({
      method: 'GET',
      url: '/api/permissions',
      cookies: {
        session_id: 'metrics-session'
      }
    });

    const response = await app.inject({ method: 'GET', url: '/metrics' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.body).toContain('iam_token_refresh_total');
    expect(response.body).toContain('iam_token_refresh_conflicts_total');
    expect(response.body).toContain('iam_session_active_total 1');
    expect(response.body).toContain('iam_permission_resolution_duration_ms_count 1');
    await app.close();
  });
});