import { z } from 'zod';
export const FIXED_ROLES = ['admin', 'coordenador', 'tecnico'];
export const BFF_ERROR_CODES = [
    'OIDC_CALLBACK_INVALID',
    'INVALID_REQUEST',
    'SESSION_NOT_FOUND',
    'SESSION_EXPIRED',
    'TOKEN_REFRESH_FAILED',
    'FORBIDDEN',
    'SESSION_STORE_UNAVAILABLE',
    'UPSTREAM_ERROR'
];
export const RoleSchema = z.enum(FIXED_ROLES);
export const MicrofrontendCatalogItemSchema = z.object({
    id: z.string().min(1),
    route: z.string().min(1),
    entry: z.string().url(),
    scope: z.string().min(1),
    module: z.string().min(1),
    requiredPermissions: z.array(z.string().min(1)).default([])
});
export const RoleAccessConfigSchema = z.object({
    role: RoleSchema,
    permissions: z.array(z.string().min(1)),
    screens: z.array(z.string().min(1)),
    routes: z.array(z.string().min(1)),
    microfrontends: z.array(z.string().min(1)),
    updatedAt: z.string().datetime(),
    updatedBy: z.string().min(1),
    version: z.number().int().positive()
});
export const RoleAccessConfigListSchema = z.array(RoleAccessConfigSchema);
export const RoleAccessMutationSchema = z.object({
    permissions: z.array(z.string().min(1)),
    screens: z.array(z.string().min(1)),
    routes: z.array(z.string().min(1)),
    microfrontends: z.array(z.string().min(1))
});
export const UserSessionSchema = z.object({
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    roles: z.array(RoleSchema),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    idToken: z.string().min(1),
    accessTokenExpiresAt: z.number().int().positive(),
    refreshTokenExpiresAt: z.number().int().positive(),
    absoluteExpiresAt: z.number().int().positive(),
    createdAt: z.number().int().positive(),
    lastAccessAt: z.number().int().positive(),
    version: z.number().int().positive()
});
export const PermissionSnapshotSchema = z.object({
    userId: z.string().min(1),
    roles: z.array(RoleSchema),
    permissions: z.array(z.string().min(1)),
    screens: z.array(z.string().min(1)),
    routes: z.array(z.string().min(1)),
    microfrontends: z.array(MicrofrontendCatalogItemSchema),
    generatedAt: z.string().datetime(),
    version: z.number().int().positive()
});
export const PermissionDecisionSchema = z.object({
    allowed: z.boolean(),
    matchedRoles: z.array(RoleSchema),
    matchedPermissions: z.array(z.string().min(1)),
    reason: z.string().min(1)
});
export const BffErrorCodeSchema = z.enum(BFF_ERROR_CODES);
export const BffErrorEnvelopeSchema = z.object({
    code: BffErrorCodeSchema,
    message: z.string().min(1),
    status: z.number().int().min(400).max(599),
    details: z.record(z.unknown()).optional(),
    correlationId: z.string().min(1).optional(),
    traceId: z.string().optional(),
    timestamp: z.string().datetime()
});
export function extractNormalizedRoles(claims) {
    const source = claims.ROLES ?? claims.roles;
    if (!Array.isArray(source)) {
        return [];
    }
    const normalized = source
        .filter((role) => typeof role === 'string')
        .map((role) => role.trim().toLowerCase())
        .filter((role) => FIXED_ROLES.includes(role));
    return Array.from(new Set(normalized));
}
export function serializeSession(session) {
    return JSON.stringify(UserSessionSchema.parse(session));
}
export function parseSession(raw) {
    return UserSessionSchema.parse(JSON.parse(raw));
}
export function serializePermissionSnapshot(snapshot) {
    return JSON.stringify(PermissionSnapshotSchema.parse(snapshot));
}
export function parsePermissionSnapshot(raw) {
    return PermissionSnapshotSchema.parse(JSON.parse(raw));
}
