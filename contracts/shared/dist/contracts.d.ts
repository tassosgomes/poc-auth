import { z } from 'zod';
export declare const FIXED_ROLES: readonly ["admin", "coordenador", "tecnico"];
export declare const BFF_ERROR_CODES: readonly ["OIDC_CALLBACK_INVALID", "INVALID_REQUEST", "SESSION_NOT_FOUND", "SESSION_EXPIRED", "TOKEN_REFRESH_FAILED", "FORBIDDEN", "SESSION_STORE_UNAVAILABLE", "UPSTREAM_ERROR"];
export declare const RoleSchema: z.ZodEnum<["admin", "coordenador", "tecnico"]>;
export type FixedRole = z.infer<typeof RoleSchema>;
export declare const MicrofrontendCatalogItemSchema: z.ZodObject<{
    id: z.ZodString;
    route: z.ZodString;
    entry: z.ZodString;
    scope: z.ZodString;
    module: z.ZodString;
    requiredPermissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    route: string;
    entry: string;
    scope: string;
    module: string;
    requiredPermissions: string[];
}, {
    id: string;
    route: string;
    entry: string;
    scope: string;
    module: string;
    requiredPermissions?: string[] | undefined;
}>;
export type MicrofrontendCatalogItem = z.infer<typeof MicrofrontendCatalogItemSchema>;
export declare const RoleAccessConfigSchema: z.ZodObject<{
    role: z.ZodEnum<["admin", "coordenador", "tecnico"]>;
    permissions: z.ZodArray<z.ZodString, "many">;
    screens: z.ZodArray<z.ZodString, "many">;
    routes: z.ZodArray<z.ZodString, "many">;
    microfrontends: z.ZodArray<z.ZodString, "many">;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    role: "admin" | "coordenador" | "tecnico";
    permissions: string[];
    screens: string[];
    routes: string[];
    microfrontends: string[];
    updatedAt: string;
    updatedBy: string;
    version: number;
}, {
    role: "admin" | "coordenador" | "tecnico";
    permissions: string[];
    screens: string[];
    routes: string[];
    microfrontends: string[];
    updatedAt: string;
    updatedBy: string;
    version: number;
}>;
export type RoleAccessConfig = z.infer<typeof RoleAccessConfigSchema>;
export declare const UserSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "coordenador", "tecnico"]>, "many">;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    idToken: z.ZodString;
    accessTokenExpiresAt: z.ZodNumber;
    refreshTokenExpiresAt: z.ZodNumber;
    absoluteExpiresAt: z.ZodNumber;
    createdAt: z.ZodNumber;
    lastAccessAt: z.ZodNumber;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    version: number;
    sessionId: string;
    userId: string;
    roles: ("admin" | "coordenador" | "tecnico")[];
    accessToken: string;
    refreshToken: string;
    idToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
    absoluteExpiresAt: number;
    createdAt: number;
    lastAccessAt: number;
}, {
    version: number;
    sessionId: string;
    userId: string;
    roles: ("admin" | "coordenador" | "tecnico")[];
    accessToken: string;
    refreshToken: string;
    idToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
    absoluteExpiresAt: number;
    createdAt: number;
    lastAccessAt: number;
}>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export declare const PermissionSnapshotSchema: z.ZodObject<{
    userId: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "coordenador", "tecnico"]>, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    screens: z.ZodArray<z.ZodString, "many">;
    routes: z.ZodArray<z.ZodString, "many">;
    microfrontends: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        route: z.ZodString;
        entry: z.ZodString;
        scope: z.ZodString;
        module: z.ZodString;
        requiredPermissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        route: string;
        entry: string;
        scope: string;
        module: string;
        requiredPermissions: string[];
    }, {
        id: string;
        route: string;
        entry: string;
        scope: string;
        module: string;
        requiredPermissions?: string[] | undefined;
    }>, "many">;
    generatedAt: z.ZodString;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    permissions: string[];
    screens: string[];
    routes: string[];
    microfrontends: {
        id: string;
        route: string;
        entry: string;
        scope: string;
        module: string;
        requiredPermissions: string[];
    }[];
    version: number;
    userId: string;
    roles: ("admin" | "coordenador" | "tecnico")[];
    generatedAt: string;
}, {
    permissions: string[];
    screens: string[];
    routes: string[];
    microfrontends: {
        id: string;
        route: string;
        entry: string;
        scope: string;
        module: string;
        requiredPermissions?: string[] | undefined;
    }[];
    version: number;
    userId: string;
    roles: ("admin" | "coordenador" | "tecnico")[];
    generatedAt: string;
}>;
export type PermissionSnapshot = z.infer<typeof PermissionSnapshotSchema>;
export declare const PermissionDecisionSchema: z.ZodObject<{
    allowed: z.ZodBoolean;
    matchedRoles: z.ZodArray<z.ZodEnum<["admin", "coordenador", "tecnico"]>, "many">;
    matchedPermissions: z.ZodArray<z.ZodString, "many">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    allowed: boolean;
    matchedRoles: ("admin" | "coordenador" | "tecnico")[];
    matchedPermissions: string[];
    reason: string;
}, {
    allowed: boolean;
    matchedRoles: ("admin" | "coordenador" | "tecnico")[];
    matchedPermissions: string[];
    reason: string;
}>;
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;
export declare const BffErrorCodeSchema: z.ZodEnum<["OIDC_CALLBACK_INVALID", "INVALID_REQUEST", "SESSION_NOT_FOUND", "SESSION_EXPIRED", "TOKEN_REFRESH_FAILED", "FORBIDDEN", "SESSION_STORE_UNAVAILABLE", "UPSTREAM_ERROR"]>;
export type BffErrorCode = z.infer<typeof BffErrorCodeSchema>;
export declare const BffErrorEnvelopeSchema: z.ZodObject<{
    code: z.ZodEnum<["OIDC_CALLBACK_INVALID", "INVALID_REQUEST", "SESSION_NOT_FOUND", "SESSION_EXPIRED", "TOKEN_REFRESH_FAILED", "FORBIDDEN", "SESSION_STORE_UNAVAILABLE", "UPSTREAM_ERROR"]>;
    message: z.ZodString;
    status: z.ZodNumber;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    traceId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: "OIDC_CALLBACK_INVALID" | "INVALID_REQUEST" | "SESSION_NOT_FOUND" | "SESSION_EXPIRED" | "TOKEN_REFRESH_FAILED" | "FORBIDDEN" | "SESSION_STORE_UNAVAILABLE" | "UPSTREAM_ERROR";
    message: string;
    status: number;
    timestamp: string;
    details?: Record<string, unknown> | undefined;
    traceId?: string | undefined;
}, {
    code: "OIDC_CALLBACK_INVALID" | "INVALID_REQUEST" | "SESSION_NOT_FOUND" | "SESSION_EXPIRED" | "TOKEN_REFRESH_FAILED" | "FORBIDDEN" | "SESSION_STORE_UNAVAILABLE" | "UPSTREAM_ERROR";
    message: string;
    status: number;
    timestamp: string;
    details?: Record<string, unknown> | undefined;
    traceId?: string | undefined;
}>;
export type BffErrorEnvelope = z.infer<typeof BffErrorEnvelopeSchema>;
export type ClaimsLike = Record<string, unknown>;
export declare function extractNormalizedRoles(claims: ClaimsLike): FixedRole[];
export declare function serializeSession(session: UserSession): string;
export declare function parseSession(raw: string): UserSession;
export declare function serializePermissionSnapshot(snapshot: PermissionSnapshot): string;
export declare function parsePermissionSnapshot(raw: string): PermissionSnapshot;
