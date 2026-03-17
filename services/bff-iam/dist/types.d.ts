import type { FixedRole, RoleAccessConfig, PermissionSnapshot, UserSession } from '@zcorp/shared-contracts';
export interface AuthorizationRequest {
    state: string;
    nonce: string;
    codeVerifier: string;
    codeChallenge: string;
    redirectUri: string;
    scopes: string[];
}
export interface CallbackPayload {
    code: string;
    codeVerifier: string;
    redirectUri: string;
}
export interface RefreshRequest {
    refreshToken: string;
}
export interface TokenSet {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    tokenType: string;
    scope?: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn?: number;
}
export interface OidcFlowTransaction {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectTo: string;
    createdAt: number;
}
export interface SessionStore {
    get(sessionId: string): Promise<UserSession | null>;
    save(session: UserSession): Promise<void>;
    compareAndSwap(session: UserSession, expectedVersion: number): Promise<boolean>;
    delete(sessionId: string): Promise<void>;
    deleteAllForUser(userId: string): Promise<number>;
    countActiveSessions(): Promise<number>;
    withRefreshLock<T>(sessionId: string, action: () => Promise<T>, onConflict?: () => void): Promise<T>;
}
export interface OidcTransactionStore {
    save(transaction: OidcFlowTransaction): Promise<void>;
    consume(state: string): Promise<OidcFlowTransaction | null>;
}
export interface PermissionLookupInput {
    userId: string;
    roles: string[];
    sessionVersion: number;
}
export interface RoleAccessUpdateCommand {
    permissions: string[];
    screens: string[];
    routes: string[];
    microfrontends: string[];
    updatedBy: string;
    correlationId: string;
}
export interface PermissionService {
    getEffectivePermissions(input: PermissionLookupInput): Promise<PermissionSnapshot>;
    listRoleAccess(): Promise<RoleAccessConfig[]>;
    updateRoleAccess(role: FixedRole, command: RoleAccessUpdateCommand): Promise<RoleAccessConfig>;
}
export interface OidcClient {
    createAuthorizationUrl(input: AuthorizationRequest): Promise<string>;
    exchangeCode(input: CallbackPayload): Promise<TokenSet>;
    refresh(input: RefreshRequest): Promise<TokenSet>;
    validateIdToken(idToken: string): Promise<Record<string, unknown>>;
}
