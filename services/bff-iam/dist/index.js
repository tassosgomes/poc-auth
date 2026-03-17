import { Pool } from 'pg';
import { createClient } from 'redis';
import { buildApp } from './app.js';
import { migrateAuthzDatabase } from './db/migrations.js';
import { buildDatabaseConfig, buildRedisUrl, loadConfig } from './config.js';
import { RoleAccessRepository } from './repositories/role-access-repository.js';
import { RedisOidcTransactionStore } from './session/redis-oidc-transaction-store.js';
import { RedisSessionStore } from './session/redis-session-store.js';
import { RoleAccessPermissionService } from './services/permission-service.js';
const config = loadConfig();
const database = new Pool(buildDatabaseConfig(config));
database.on('error', (error) => {
    console.error('Authz database pool error', error);
});
await migrateAuthzDatabase(database);
const redis = createClient({
    url: buildRedisUrl(config)
});
redis.on('error', (error) => {
    console.error('Redis client error', error);
});
await redis.connect();
const permissionService = new RoleAccessPermissionService(new RoleAccessRepository(database), redis, config, console);
const app = await buildApp({
    config,
    sessionStore: new RedisSessionStore(redis, config),
    oidcTransactionStore: new RedisOidcTransactionStore(redis, config),
    permissionService,
    logger: true
});
try {
    await app.listen({
        host: '0.0.0.0',
        port: config.port
    });
}
catch (error) {
    app.log.error(error);
    process.exitCode = 1;
}
