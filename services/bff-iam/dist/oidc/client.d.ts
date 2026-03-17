import type { BffConfig } from '../config.js';
import type { AuthorizationRequest, CallbackPayload, OidcClient, RefreshRequest, TokenSet } from '../types.js';
type FetchLike = typeof fetch;
export declare class CyberArkOidcClient implements OidcClient {
    private readonly config;
    private readonly fetchImpl;
    private jwksCache;
    constructor(config: Pick<BffConfig, 'oidcAuthorizationEndpoint' | 'oidcTokenEndpoint' | 'oidcIssuerUrl' | 'oidcJwksUrl' | 'oidcClientId' | 'oidcClientSecret'>, fetchImpl?: FetchLike);
    createAuthorizationUrl(input: AuthorizationRequest): Promise<string>;
    exchangeCode(input: CallbackPayload): Promise<TokenSet>;
    refresh(input: RefreshRequest): Promise<TokenSet>;
    validateIdToken(idToken: string): Promise<Record<string, unknown>>;
    private requestToken;
    private getJwks;
    private toClaims;
}
export {};
