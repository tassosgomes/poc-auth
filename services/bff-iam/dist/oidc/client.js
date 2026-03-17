import { createLocalJWKSet, jwtVerify } from 'jose';
import { BffAppError } from '../errors.js';
export class CyberArkOidcClient {
    config;
    fetchImpl;
    jwksCache = null;
    constructor(config, fetchImpl = fetch) {
        this.config = config;
        this.fetchImpl = fetchImpl;
    }
    async createAuthorizationUrl(input) {
        const url = new URL(this.config.oidcAuthorizationEndpoint);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', this.config.oidcClientId);
        url.searchParams.set('redirect_uri', input.redirectUri);
        url.searchParams.set('scope', input.scopes.join(' '));
        url.searchParams.set('state', input.state);
        url.searchParams.set('nonce', input.nonce);
        url.searchParams.set('code_challenge', input.codeChallenge);
        url.searchParams.set('code_challenge_method', 'S256');
        return url.toString();
    }
    async exchangeCode(input) {
        return this.requestToken({
            grant_type: 'authorization_code',
            code: input.code,
            code_verifier: input.codeVerifier,
            redirect_uri: input.redirectUri
        }, 'OIDC_CALLBACK_INVALID', 400, 'OIDC callback token exchange failed');
    }
    async refresh(input) {
        return this.requestToken({
            grant_type: 'refresh_token',
            refresh_token: input.refreshToken
        }, 'TOKEN_REFRESH_FAILED', 401, 'OIDC token refresh failed');
    }
    async validateIdToken(idToken) {
        try {
            const jwks = await this.getJwks();
            const verified = await jwtVerify(idToken, jwks, {
                issuer: this.config.oidcIssuerUrl,
                audience: this.config.oidcClientId
            });
            return this.toClaims(verified);
        }
        catch (error) {
            throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'Invalid id_token returned by OIDC provider', {
                cause: error instanceof Error ? error.message : 'unknown'
            });
        }
    }
    async requestToken(params, errorCode, status, failureMessage) {
        const body = new URLSearchParams({
            client_id: this.config.oidcClientId,
            client_secret: this.config.oidcClientSecret,
            ...params
        });
        const response = await this.fetchImpl(this.config.oidcTokenEndpoint, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/x-www-form-urlencoded'
            },
            body
        });
        const payload = (await response.json());
        if (!response.ok) {
            throw new BffAppError(errorCode, status, failureMessage, {
                providerError: payload.error,
                providerDescription: payload.error_description,
                providerStatus: response.status
            });
        }
        if (!payload.access_token ||
            !payload.refresh_token ||
            !payload.id_token ||
            typeof payload.expires_in !== 'number') {
            throw new BffAppError(errorCode, status, failureMessage, {
                reason: 'OIDC provider returned an incomplete token set'
            });
        }
        return {
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token,
            idToken: payload.id_token,
            tokenType: payload.token_type ?? 'Bearer',
            scope: payload.scope,
            accessTokenExpiresIn: payload.expires_in,
            refreshTokenExpiresIn: payload.refresh_expires_in ?? payload.refresh_token_expires_in
        };
    }
    async getJwks() {
        const now = Date.now();
        if (this.jwksCache && now - this.jwksCache.loadedAt < 5 * 60 * 1000) {
            return this.jwksCache.jwks;
        }
        const response = await this.fetchImpl(this.config.oidcJwksUrl, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Unable to load JWKS: ${response.status}`);
        }
        const payload = (await response.json());
        const jwks = createLocalJWKSet(payload);
        this.jwksCache = {
            jwks,
            loadedAt: now
        };
        return jwks;
    }
    toClaims(verified) {
        return verified.payload;
    }
}
