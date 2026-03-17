import { z } from 'zod';

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  BFF_PORT: z.coerce.number().int().positive().default(4000),
  BFF_PUBLIC_BASE_URL: z.string().url(),
  SHELL_PUBLIC_BASE_URL: z.string().url(),
  BFF_JAVA_UPSTREAM_URL: z.string().url(),
  BFF_DOTNET_UPSTREAM_URL: z.string().url(),
  BFF_SESSION_COOKIE_NAME: z.string().min(1).default('session_id'),
  BFF_SESSION_COOKIE_SECURE: z.preprocess((value) => parseBoolean(value, true), z.boolean()),
  BFF_SESSION_COOKIE_HTTP_ONLY: z.preprocess((value) => parseBoolean(value, true), z.boolean()),
  BFF_SESSION_COOKIE_SAME_SITE: z.enum(['Strict', 'Lax', 'None']).default('Strict'),
  BFF_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28800),
  BFF_ABSOLUTE_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(43200),
  BFF_OIDC_TRANSACTION_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  BFF_REFRESH_LOCK_TTL_MS: z.coerce.number().int().positive().default(5000),
  BFF_ACCESS_TOKEN_REFRESH_SKEW_SECONDS: z.coerce.number().int().min(0).default(30),
  BFF_PERMISSION_SNAPSHOT_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  BFF_ROLE_ACCESS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  OIDC_AUTHORIZATION_ENDPOINT: z.string().url(),
  OIDC_TOKEN_ENDPOINT: z.string().url(),
  OIDC_ISSUER_URL: z.string().url(),
  OIDC_JWKS_URL: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.string().url(),
  OIDC_SCOPES: z.string().min(1),
  REDIS_HOST: z.string().min(1).default('redis'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS_ENABLED: z.preprocess((value) => parseBoolean(value, false), z.boolean()),
  AUTHZ_DB_HOST: z.string().min(1).default('authz-db'),
  AUTHZ_DB_PORT: z.coerce.number().int().positive().default(5432),
  AUTHZ_DB_NAME: z.string().min(1).default('iam_authz'),
  AUTHZ_DB_USER: z.string().min(1),
  AUTHZ_DB_PASSWORD: z.string().min(1),
  AUTHZ_DB_SSL_MODE: z.enum(['disable', 'require']).default('disable')
});

export type BffConfig = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = EnvSchema.parse(env);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.BFF_PORT,
    publicBaseUrl: parsed.BFF_PUBLIC_BASE_URL,
    shellPublicBaseUrl: parsed.SHELL_PUBLIC_BASE_URL,
    javaUpstreamUrl: parsed.BFF_JAVA_UPSTREAM_URL,
    dotnetUpstreamUrl: parsed.BFF_DOTNET_UPSTREAM_URL,
    sessionCookieName: parsed.BFF_SESSION_COOKIE_NAME,
    sessionCookieSecure: parsed.BFF_SESSION_COOKIE_SECURE,
    sessionCookieHttpOnly: parsed.BFF_SESSION_COOKIE_HTTP_ONLY,
    sessionCookieSameSite: parsed.BFF_SESSION_COOKIE_SAME_SITE,
    sessionTtlSeconds: parsed.BFF_SESSION_TTL_SECONDS,
    absoluteSessionTtlSeconds: parsed.BFF_ABSOLUTE_SESSION_TTL_SECONDS,
    oidcTransactionTtlSeconds: parsed.BFF_OIDC_TRANSACTION_TTL_SECONDS,
    refreshLockTtlMs: parsed.BFF_REFRESH_LOCK_TTL_MS,
    accessTokenRefreshSkewSeconds: parsed.BFF_ACCESS_TOKEN_REFRESH_SKEW_SECONDS,
    permissionSnapshotCacheTtlSeconds: parsed.BFF_PERMISSION_SNAPSHOT_CACHE_TTL_SECONDS,
    roleAccessCacheTtlSeconds: parsed.BFF_ROLE_ACCESS_CACHE_TTL_SECONDS,
    oidcAuthorizationEndpoint: parsed.OIDC_AUTHORIZATION_ENDPOINT,
    oidcTokenEndpoint: parsed.OIDC_TOKEN_ENDPOINT,
    oidcIssuerUrl: parsed.OIDC_ISSUER_URL,
    oidcJwksUrl: parsed.OIDC_JWKS_URL,
    oidcClientId: parsed.OIDC_CLIENT_ID,
    oidcClientSecret: parsed.OIDC_CLIENT_SECRET,
    oidcRedirectUri: parsed.OIDC_REDIRECT_URI,
    oidcScopes: parsed.OIDC_SCOPES.split(/\s+/).filter(Boolean),
    redisHost: parsed.REDIS_HOST,
    redisPort: parsed.REDIS_PORT,
    redisUsername: parsed.REDIS_USERNAME,
    redisPassword: parsed.REDIS_PASSWORD,
    redisTlsEnabled: parsed.REDIS_TLS_ENABLED,
    authzDbHost: parsed.AUTHZ_DB_HOST,
    authzDbPort: parsed.AUTHZ_DB_PORT,
    authzDbName: parsed.AUTHZ_DB_NAME,
    authzDbUser: parsed.AUTHZ_DB_USER,
    authzDbPassword: parsed.AUTHZ_DB_PASSWORD,
    authzDbSslMode: parsed.AUTHZ_DB_SSL_MODE
  };
}

export function buildRedisUrl(config: Pick<BffConfig, 'redisHost' | 'redisPort' | 'redisUsername' | 'redisPassword' | 'redisTlsEnabled'>): string {
  const protocol = config.redisTlsEnabled ? 'rediss' : 'redis';
  const url = new URL(`${protocol}://${config.redisHost}:${config.redisPort}`);

  if (config.redisUsername) {
    url.username = config.redisUsername;
  }

  if (config.redisPassword) {
    url.password = config.redisPassword;
  }

  return url.toString();
}

export function buildDatabaseConfig(
  config: Pick<
    BffConfig,
    'authzDbHost' | 'authzDbPort' | 'authzDbName' | 'authzDbUser' | 'authzDbPassword' | 'authzDbSslMode'
  >
) {
  return {
    host: config.authzDbHost,
    port: config.authzDbPort,
    database: config.authzDbName,
    user: config.authzDbUser,
    password: config.authzDbPassword,
    ssl: config.authzDbSslMode === 'require' ? { rejectUnauthorized: false } : false
  };
}