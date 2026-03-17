import { GenericContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { migrateAuthzDatabase } from '../db/migrations.js';
import { RoleAccessRepository } from '../repositories/role-access-repository.js';
import { RoleAccessPermissionService } from '../services/permission-service.js';
describe('RoleAccessPermissionService integration', () => {
    let postgresContainer;
    let redisContainer;
    let pool;
    let redis;
    let service;
    beforeAll(async () => {
        postgresContainer = await new GenericContainer('postgres:16-alpine')
            .withEnvironment({
            POSTGRES_DB: 'iam_authz',
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: 'postgres'
        })
            .withExposedPorts(5432)
            .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
            .start();
        redisContainer = await new GenericContainer('redis:7-alpine')
            .withExposedPorts(6379)
            .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
            .start();
        pool = new Pool({
            host: postgresContainer.getHost(),
            port: postgresContainer.getMappedPort(5432),
            database: 'iam_authz',
            user: 'postgres',
            password: 'postgres',
            ssl: false
        });
        await migrateAuthzDatabase(pool);
        redis = createClient({
            url: `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`
        });
        await redis.connect();
    });
    beforeEach(async () => {
        await redis.flushAll();
        await pool.query('truncate table role_access_audit restart identity');
        await pool.query('truncate table role_access restart identity cascade');
        await pool.query('delete from schema_migrations');
        await migrateAuthzDatabase(pool);
        service = new RoleAccessPermissionService(new RoleAccessRepository(pool), redis, {
            permissionSnapshotCacheTtlSeconds: 300,
            roleAccessCacheTtlSeconds: 3600
        });
    });
    afterAll(async () => {
        await redis.quit();
        await pool.end();
        await redisContainer.stop();
        await postgresContainer.stop();
    });
    it('resolves the union of valid roles and ignores unknown roles', async () => {
        const snapshot = await service.getEffectivePermissions({
            userId: 'user-123',
            roles: ['coordenador', 'tecnico', 'desconhecida'],
            sessionVersion: 7
        });
        expect(snapshot.roles).toEqual(['coordenador', 'tecnico']);
        expect(snapshot.permissions).toEqual(['dashboard:view', 'ordens:view', 'relatorios:view']);
        expect(snapshot.routes).toEqual(['/dashboard', '/ordens', '/relatorios']);
        expect(snapshot.microfrontends.map((item) => item.id)).toEqual(['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios']);
        await expect(redis.exists('permission_snapshot:user-123:7')).resolves.toBe(1);
        await expect(redis.exists('role_access_cache:coordenador:1')).resolves.toBe(1);
        await expect(redis.exists('role_access_cache:tecnico:1')).resolves.toBe(1);
    });
    it('updates role access, persists audit and reflects the new permissions on the next lookup', async () => {
        const initial = await service.getEffectivePermissions({
            userId: 'tecnico-user',
            roles: ['tecnico'],
            sessionVersion: 3
        });
        expect(initial.permissions).not.toContain('role-access:manage');
        expect(initial.microfrontends.map((item) => item.id)).not.toContain('mfe-admin-acessos');
        await expect(redis.exists('permission_snapshot:tecnico-user:3')).resolves.toBe(1);
        await expect(redis.exists('role_access_cache:tecnico:1')).resolves.toBe(1);
        const updated = await service.updateRoleAccess('tecnico', {
            permissions: ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'],
            screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
            routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
            microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios', 'mfe-admin-acessos'],
            updatedBy: 'admin-user',
            correlationId: 'corr-123'
        });
        expect(updated.version).toBe(2);
        await expect(redis.exists('role_access_cache:tecnico:2')).resolves.toBe(1);
        const refreshed = await service.getEffectivePermissions({
            userId: 'tecnico-user',
            roles: ['tecnico'],
            sessionVersion: 3
        });
        expect(refreshed.version).toBe(2);
        expect(refreshed.permissions).toContain('role-access:manage');
        expect(refreshed.routes).toContain('/admin/acessos');
        expect(refreshed.microfrontends.map((item) => item.id)).toContain('mfe-admin-acessos');
        const auditRows = await pool.query(`
        select role, previous_value_json, new_value_json, changed_by, correlation_id
        from role_access_audit
        where role = 'tecnico'
      `);
        expect(auditRows.rowCount).toBe(1);
        expect(auditRows.rows[0]).toMatchObject({
            role: 'tecnico',
            changed_by: 'admin-user',
            correlation_id: 'corr-123'
        });
        expect(auditRows.rows[0].previous_value_json.version).toBe(1);
        expect(auditRows.rows[0].new_value_json.version).toBe(2);
        expect(auditRows.rows[0].new_value_json.permissions).toContain('role-access:manage');
    });
});
