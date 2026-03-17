import { MICROFRONTEND_CATALOG_SEED } from './seed.js';
export const USER_SESSION_FIXTURE = {
    sessionId: 'session-123',
    userId: 'user-123',
    roles: ['admin'],
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    idToken: 'id-token',
    accessTokenExpiresAt: 1710000000,
    refreshTokenExpiresAt: 1710028800,
    absoluteExpiresAt: 1710032400,
    createdAt: 1709990000,
    lastAccessAt: 1709991000,
    version: 1
};
export const PERMISSION_SNAPSHOT_FIXTURE = {
    userId: 'user-123',
    roles: ['admin'],
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'],
    screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
    microfrontends: MICROFRONTEND_CATALOG_SEED,
    generatedAt: '2026-03-17T00:00:00.000Z',
    version: 1
};
export const BFF_ERROR_FIXTURE = {
    code: 'FORBIDDEN',
    message: 'Permission denied for requested resource',
    status: 403,
    details: {
        requiredPermission: 'role-access:manage'
    },
    traceId: 'trace-123',
    timestamp: '2026-03-17T00:00:00.000Z'
};
