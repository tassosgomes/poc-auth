import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';

import { CyberArkOidcClient } from '../oidc/client.js';

async function createSigningMaterial() {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);

  return {
    privateKey,
    jwks: {
      keys: [{
        ...jwk,
        alg: 'RS256',
        kid: 'test-key-1',
        use: 'sig'
      }]
    }
  };
}

describe('CyberArkOidcClient', () => {
  it('builds an authorization url with PKCE and nonce parameters', async () => {
    const client = new CyberArkOidcClient(
      {
        oidcAuthorizationEndpoint: 'https://cyberark.example/authorize',
        oidcTokenEndpoint: 'https://cyberark.example/token',
        oidcIssuerUrl: 'https://cyberark.example',
        oidcJwksUrl: 'https://cyberark.example/.well-known/jwks.json',
        oidcClientId: 'client-id',
        oidcClientSecret: 'secret'
      },
      vi.fn()
    );

    const url = await client.createAuthorizationUrl({
      state: 'state-123',
      nonce: 'nonce-123',
      codeVerifier: 'verifier-123',
      codeChallenge: 'challenge-123',
      redirectUri: 'https://api-authpoc.tasso.dev.br/api/auth/callback',
      scopes: ['openid', 'profile', 'email', 'ROLES']
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://cyberark.example');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('client_id')).toBe('client-id');
    expect(parsed.searchParams.get('state')).toBe('state-123');
    expect(parsed.searchParams.get('nonce')).toBe('nonce-123');
    expect(parsed.searchParams.get('code_challenge')).toBe('challenge-123');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('validates id_token signature, issuer and audience against the JWKS', async () => {
    const signing = await createSigningMaterial();
    const idToken = await new SignJWT({
      nonce: 'nonce-123',
      ROLES: ['admin']
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
      .setIssuer('https://cyberark.example')
      .setAudience('client-id')
      .setSubject('user-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(signing.privateKey);

    const client = new CyberArkOidcClient(
      {
        oidcAuthorizationEndpoint: 'https://cyberark.example/authorize',
        oidcTokenEndpoint: 'https://cyberark.example/token',
        oidcIssuerUrl: 'https://cyberark.example',
        oidcJwksUrl: 'https://cyberark.example/.well-known/jwks.json',
        oidcClientId: 'client-id',
        oidcClientSecret: 'secret'
      },
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(signing.jwks), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    );

    await expect(client.validateIdToken(idToken)).resolves.toMatchObject({
      sub: 'user-123',
      nonce: 'nonce-123'
    });
  });

  it('rejects id_token with an invalid audience', async () => {
    const signing = await createSigningMaterial();
    const idToken = await new SignJWT({
      nonce: 'nonce-123',
      ROLES: ['admin']
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
      .setIssuer('https://cyberark.example')
      .setAudience('another-client')
      .setSubject('user-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(signing.privateKey);

    const client = new CyberArkOidcClient(
      {
        oidcAuthorizationEndpoint: 'https://cyberark.example/authorize',
        oidcTokenEndpoint: 'https://cyberark.example/token',
        oidcIssuerUrl: 'https://cyberark.example',
        oidcJwksUrl: 'https://cyberark.example/.well-known/jwks.json',
        oidcClientId: 'client-id',
        oidcClientSecret: 'secret'
      },
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(signing.jwks), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    );

    await expect(client.validateIdToken(idToken)).rejects.toMatchObject({
      code: 'OIDC_CALLBACK_INVALID',
      status: 400
    });
  });
});