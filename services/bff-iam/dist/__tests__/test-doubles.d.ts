import type { UserSession } from '@zcorp/shared-contracts';
import type { OidcClient, OidcFlowTransaction, OidcTransactionStore, PermissionLookupInput, PermissionReader, SessionStore, TokenSet } from '../types.js';
export declare class InMemorySessionStore implements SessionStore {
    private readonly sessions;
    get(sessionId: string): Promise<UserSession | null>;
    save(session: UserSession): Promise<void>;
    delete(sessionId: string): Promise<void>;
    deleteAllForUser(userId: string): Promise<number>;
    withRefreshLock<T>(_sessionId: string, action: () => Promise<T>): Promise<T>;
}
export declare class InMemoryOidcTransactionStore implements OidcTransactionStore {
    private readonly transactions;
    save(transaction: OidcFlowTransaction): Promise<void>;
    consume(state: string): Promise<OidcFlowTransaction | null>;
}
export declare class FakeOidcClient implements OidcClient {
    private readonly tokenSet;
    private readonly authorizationUrl;
    constructor(tokenSet: TokenSet, authorizationUrl?: string);
    createAuthorizationUrl(): Promise<string>;
    exchangeCode(): Promise<TokenSet>;
    refresh(): Promise<TokenSet>;
    validateIdToken(idToken: string): Promise<Record<string, unknown>>;
}
export declare class StaticPermissionReader implements PermissionReader {
    private readonly snapshotFactory;
    constructor(snapshotFactory: (input: PermissionLookupInput) => Record<string, unknown>);
    getEffectivePermissions(input: PermissionLookupInput): Promise<{
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
    }>;
}
