import { z } from 'zod';

export const FIXED_ROLES = ['admin', 'coordenador', 'tecnico'] as const;

export const BFF_ERROR_CODES = [
  'OIDC_CALLBACK_INVALID',
  'INVALID_REQUEST',
  'SESSION_NOT_FOUND',
  'SESSION_EXPIRED',
  'TOKEN_REFRESH_FAILED',
  'FORBIDDEN',
  'SESSION_STORE_UNAVAILABLE',
  'UPSTREAM_ERROR'
] as const;

export const RoleSchema = z.enum(FIXED_ROLES);
export type FixedRole = z.infer<typeof RoleSchema>;

export const MicrofrontendCatalogItemSchema = z.object({
  id: z.string().min(1),
  route: z.string().min(1),
  entry: z.string().url(),
  scope: z.string().min(1),
  module: z.string().min(1),
  requiredPermissions: z.array(z.string().min(1)).default([])
});
export type MicrofrontendCatalogItem = z.infer<typeof MicrofrontendCatalogItemSchema>;

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
export type RoleAccessConfig = z.infer<typeof RoleAccessConfigSchema>;

export const RoleAccessConfigListSchema = z.array(RoleAccessConfigSchema);

export const RoleAccessMutationSchema = z.object({
  permissions: z.array(z.string().min(1)),
  screens: z.array(z.string().min(1)),
  routes: z.array(z.string().min(1)),
  microfrontends: z.array(z.string().min(1))
});
export type RoleAccessMutation = z.infer<typeof RoleAccessMutationSchema>;

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
export type UserSession = z.infer<typeof UserSessionSchema>;

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
export type PermissionSnapshot = z.infer<typeof PermissionSnapshotSchema>;

export interface RemoteBootstrapProps {
  snapshot: PermissionSnapshot;
  route: string;
  bffBaseUrl: string;
}

export type RemoteBootstrapDispose = () => void;

export interface RemoteBootstrapModule {
  manifest: MicrofrontendCatalogItem;
  mount: (
    container: HTMLElement,
    props: RemoteBootstrapProps
  ) => void | RemoteBootstrapDispose | Promise<void | RemoteBootstrapDispose>;
}

export const PermissionDecisionSchema = z.object({
  allowed: z.boolean(),
  matchedRoles: z.array(RoleSchema),
  matchedPermissions: z.array(z.string().min(1)),
  reason: z.string().min(1)
});
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;

export const BffErrorCodeSchema = z.enum(BFF_ERROR_CODES);
export type BffErrorCode = z.infer<typeof BffErrorCodeSchema>;

export const BffErrorEnvelopeSchema = z.object({
  code: BffErrorCodeSchema,
  message: z.string().min(1),
  status: z.number().int().min(400).max(599),
  details: z.record(z.unknown()).optional(),
  traceId: z.string().optional(),
  timestamp: z.string().datetime()
});
export type BffErrorEnvelope = z.infer<typeof BffErrorEnvelopeSchema>;

export type ClaimsLike = Record<string, unknown>;

export function extractNormalizedRoles(claims: ClaimsLike): FixedRole[] {
  const source = claims.ROLES ?? claims.roles;
  if (!Array.isArray(source)) {
    return [];
  }

  const normalized = source
    .filter((role): role is string => typeof role === 'string')
    .map((role) => role.trim().toLowerCase())
    .filter((role): role is FixedRole => FIXED_ROLES.includes(role as FixedRole));

  return Array.from(new Set(normalized));
}

export function serializeSession(session: UserSession): string {
  return JSON.stringify(UserSessionSchema.parse(session));
}

export function parseSession(raw: string): UserSession {
  return UserSessionSchema.parse(JSON.parse(raw));
}

export function serializePermissionSnapshot(snapshot: PermissionSnapshot): string {
  return JSON.stringify(PermissionSnapshotSchema.parse(snapshot));
}

export function parsePermissionSnapshot(raw: string): PermissionSnapshot {
  return PermissionSnapshotSchema.parse(JSON.parse(raw));
}
