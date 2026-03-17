import cookie from '@fastify/cookie';
import { RoleSchema, extractNormalizedRoles } from '@zcorp/shared-contracts';
import Fastify from 'fastify';
import { z } from 'zod';
import { BffAppError, isBffAppError, toErrorEnvelope } from './errors.js';
import { CyberArkOidcClient } from './oidc/client.js';
import { createCodeChallenge, generateRandomToken } from './oidc/pkce.js';
import { clearSessionCookie, setSessionCookie } from './utils/cookies.js';
import { buildUpstreamBody, buildUpstreamHeaders, copyResponseHeaders } from './utils/http.js';
const UpdateRoleAccessBodySchema = z.object({
    permissions: z.array(z.string().min(1)),
    screens: z.array(z.string().min(1)),
    routes: z.array(z.string().min(1)),
    microfrontends: z.array(z.string().min(1))
});
export async function buildApp(options) {
    const app = Fastify({ logger: options.logger ?? false });
    const oidcClient = options.oidcClient ?? new CyberArkOidcClient(options.config, options.fetchImpl ?? fetch);
    const fetchImpl = options.fetchImpl ?? fetch;
    const now = options.clock ?? (() => Date.now());
    await app.register(cookie);
    app.setErrorHandler((error, request, reply) => {
        const envelope = toErrorEnvelope(error, request.id);
        if (isBffAppError(error) && (error.code === 'SESSION_NOT_FOUND' || error.code === 'SESSION_EXPIRED')) {
            clearSessionCookie(reply, options.config);
        }
        reply.status(envelope.status).send(envelope);
    });
    app.get('/health', async () => ({ status: 'ok' }));
    app.get('/api/auth/login', async (_request, reply) => {
        const state = generateRandomToken();
        const nonce = generateRandomToken();
        const codeVerifier = generateRandomToken(64);
        const codeChallenge = createCodeChallenge(codeVerifier);
        await options.oidcTransactionStore.save({
            state,
            nonce,
            codeVerifier,
            redirectTo: options.config.shellPublicBaseUrl,
            createdAt: Math.floor(now() / 1000)
        });
        const authorizationUrl = await oidcClient.createAuthorizationUrl({
            state,
            nonce,
            codeVerifier,
            codeChallenge,
            redirectUri: options.config.oidcRedirectUri,
            scopes: options.config.oidcScopes
        });
        reply.redirect(authorizationUrl);
    });
    app.get('/api/auth/callback', async (request, reply) => {
        const query = request.query;
        const code = query.code;
        const state = query.state;
        if (!code || !state) {
            throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'OIDC callback requires code and state');
        }
        const transaction = await options.oidcTransactionStore.consume(state);
        if (!transaction) {
            throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'OIDC callback state is invalid or expired');
        }
        const tokenSet = await oidcClient.exchangeCode({
            code,
            codeVerifier: transaction.codeVerifier,
            redirectUri: options.config.oidcRedirectUri
        });
        const claims = await oidcClient.validateIdToken(tokenSet.idToken);
        if (claims.nonce !== transaction.nonce) {
            throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'OIDC callback nonce validation failed');
        }
        const roles = extractNormalizedRoles(claims);
        if (roles.length === 0) {
            throw new BffAppError('FORBIDDEN', 403, 'Authenticated user does not have a valid role');
        }
        const userId = typeof claims.sub === 'string' ? claims.sub : undefined;
        if (!userId) {
            throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'OIDC id_token does not contain a valid subject');
        }
        const nowSeconds = Math.floor(now() / 1000);
        const refreshTokenExpiresAt = nowSeconds + (tokenSet.refreshTokenExpiresIn ?? options.config.sessionTtlSeconds);
        const session = {
            sessionId: generateRandomToken(),
            userId,
            roles,
            accessToken: tokenSet.accessToken,
            refreshToken: tokenSet.refreshToken,
            idToken: tokenSet.idToken,
            accessTokenExpiresAt: nowSeconds + tokenSet.accessTokenExpiresIn,
            refreshTokenExpiresAt,
            absoluteExpiresAt: Math.min(nowSeconds + options.config.absoluteSessionTtlSeconds, refreshTokenExpiresAt),
            createdAt: nowSeconds,
            lastAccessAt: nowSeconds,
            version: 1
        };
        await options.sessionStore.save(session);
        setSessionCookie(reply, options.config, session.sessionId);
        reply.redirect(transaction.redirectTo);
    });
    app.get('/api/permissions', async (request) => {
        const session = await requireAuthenticatedSession(request, options.config, options.sessionStore, oidcClient, now);
        return options.permissionService.getEffectivePermissions({
            userId: session.userId,
            roles: session.roles,
            sessionVersion: session.version
        });
    });
    app.get('/api/admin/role-access', async (request) => {
        const session = await requireAuthenticatedSession(request, options.config, options.sessionStore, oidcClient, now);
        await requirePermission(session, options.permissionService, 'role-access:manage');
        return options.permissionService.listRoleAccess();
    });
    app.put('/api/admin/role-access/:role', async (request) => {
        const session = await requireAuthenticatedSession(request, options.config, options.sessionStore, oidcClient, now);
        await requirePermission(session, options.permissionService, 'role-access:manage');
        const role = RoleSchema.parse(request.params.role);
        const payload = UpdateRoleAccessBodySchema.parse(request.body ?? {});
        return options.permissionService.updateRoleAccess(role, {
            ...payload,
            updatedBy: session.userId,
            correlationId: request.id
        });
    });
    app.route({
        method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'],
        url: '/api/java/*',
        handler: async (request, reply) => proxyRequest(request, reply, options.config.javaUpstreamUrl, options.config, options.sessionStore, oidcClient, fetchImpl, now)
    });
    app.route({
        method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'],
        url: '/api/dotnet/*',
        handler: async (request, reply) => proxyRequest(request, reply, options.config.dotnetUpstreamUrl, options.config, options.sessionStore, oidcClient, fetchImpl, now)
    });
    return app;
}
async function requireAuthenticatedSession(request, config, sessionStore, oidcClient, now) {
    const sessionId = request.cookies[config.sessionCookieName];
    if (!sessionId) {
        throw new BffAppError('SESSION_NOT_FOUND', 401, 'Session cookie is missing');
    }
    const session = await sessionStore.get(sessionId);
    if (!session) {
        throw new BffAppError('SESSION_NOT_FOUND', 401, 'Session not found');
    }
    return ensureFreshSession(session, sessionStore, oidcClient, config, now);
}
async function ensureFreshSession(session, sessionStore, oidcClient, config, now) {
    const nowSeconds = Math.floor(now() / 1000);
    if (session.absoluteExpiresAt <= nowSeconds || session.refreshTokenExpiresAt <= nowSeconds) {
        await sessionStore.delete(session.sessionId);
        throw new BffAppError('SESSION_EXPIRED', 401, 'Session expired');
    }
    if (session.accessTokenExpiresAt > nowSeconds + config.accessTokenRefreshSkewSeconds) {
        const updatedSession = {
            ...session,
            lastAccessAt: nowSeconds
        };
        await sessionStore.save(updatedSession);
        return updatedSession;
    }
    return sessionStore.withRefreshLock(session.sessionId, async () => {
        const latestSession = await sessionStore.get(session.sessionId);
        if (!latestSession) {
            throw new BffAppError('SESSION_NOT_FOUND', 401, 'Session not found while refreshing token');
        }
        if (latestSession.accessTokenExpiresAt > nowSeconds + config.accessTokenRefreshSkewSeconds) {
            const touchedSession = {
                ...latestSession,
                lastAccessAt: nowSeconds
            };
            await sessionStore.save(touchedSession);
            return touchedSession;
        }
        const refreshed = await oidcClient.refresh({ refreshToken: latestSession.refreshToken });
        const refreshedSession = {
            ...latestSession,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            idToken: refreshed.idToken,
            accessTokenExpiresAt: nowSeconds + refreshed.accessTokenExpiresIn,
            refreshTokenExpiresAt: nowSeconds + (refreshed.refreshTokenExpiresIn ?? config.sessionTtlSeconds),
            absoluteExpiresAt: Math.min(latestSession.absoluteExpiresAt, nowSeconds + (refreshed.refreshTokenExpiresIn ?? config.sessionTtlSeconds)),
            lastAccessAt: nowSeconds,
            version: latestSession.version + 1
        };
        await sessionStore.save(refreshedSession);
        return refreshedSession;
    });
}
async function requirePermission(session, permissionService, permission) {
    const snapshot = await permissionService.getEffectivePermissions({
        userId: session.userId,
        roles: session.roles,
        sessionVersion: session.version
    });
    if (!snapshot.permissions.includes(permission)) {
        throw new BffAppError('FORBIDDEN', 403, 'Authenticated user does not have the required permission', {
            permission,
            userId: session.userId
        });
    }
}
async function proxyRequest(request, reply, upstreamBaseUrl, config, sessionStore, oidcClient, fetchImpl, now) {
    const session = await requireAuthenticatedSession(request, config, sessionStore, oidcClient, now);
    const wildcard = (request.params['*'] ?? '').replace(/^\//, '');
    const targetUrl = new URL(wildcard, upstreamBaseUrl.endsWith('/') ? upstreamBaseUrl : `${upstreamBaseUrl}/`);
    const queryIndex = request.raw.url?.indexOf('?') ?? -1;
    if (queryIndex >= 0 && request.raw.url) {
        targetUrl.search = request.raw.url.slice(queryIndex);
    }
    let response;
    try {
        response = await fetchImpl(targetUrl, {
            method: request.method,
            headers: buildUpstreamHeaders(request, session.accessToken),
            body: buildUpstreamBody(request)
        });
    }
    catch (error) {
        throw new BffAppError('UPSTREAM_ERROR', 502, 'Upstream service unavailable', {
            upstream: targetUrl.origin,
            cause: error instanceof Error ? error.message : 'unknown'
        });
    }
    copyResponseHeaders(response.headers, reply);
    const body = Buffer.from(await response.arrayBuffer());
    reply.status(response.status).send(body);
}
