import { createClient } from 'redis';

import { buildApp } from './app.js';
import { buildRedisUrl, loadConfig } from './config.js';
import { RedisOidcTransactionStore } from './session/redis-oidc-transaction-store.js';
import { RedisSessionStore } from './session/redis-session-store.js';
import { SeedPermissionReader } from './services/seed-permission-reader.js';

const config = loadConfig();

const redis = createClient({
  url: buildRedisUrl(config)
});

redis.on('error', (error) => {
  console.error('Redis client error', error);
});

await redis.connect();

const app = await buildApp({
  config,
  sessionStore: new RedisSessionStore(redis, config),
  oidcTransactionStore: new RedisOidcTransactionStore(redis, config),
  permissionReader: new SeedPermissionReader(),
  logger: true
});

try {
  await app.listen({
    host: '0.0.0.0',
    port: config.port
  });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}