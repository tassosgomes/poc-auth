import { FIXED_ROLES, MICROFRONTEND_CATALOG_SEED, RoleAccessConfigSchema, RoleSchema, parsePermissionSnapshot, serializePermissionSnapshot } from '@zcorp/shared-contracts';
import { BffAppError } from '../errors.js';
const PERMISSION_SNAPSHOT_PREFIX = 'permission_snapshot:';
const ROLE_ACCESS_CACHE_PREFIX = 'role_access_cache:';
const ALLOWED_PERMISSIONS = new Set([
    ...ROLE_ACCESS_SEED_PERMISSIONS(),
    ...MICROFRONTEND_CATALOG_SEED.flatMap((item) => item.requiredPermissions)
]);
const ALLOWED_SCREENS = new Set(['dashboard', 'ordens', 'relatorios', 'admin-acessos']);
const ALLOWED_ROUTES = new Set(MICROFRONTEND_CATALOG_SEED.map((item) => item.route));
const ALLOWED_MICROFRONTENDS = new Set(MICROFRONTEND_CATALOG_SEED.map((item) => item.id));
function ROLE_ACCESS_SEED_PERMISSIONS() {
    return ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'];
}
function collectUnique(values) {
    return Array.from(new Set(values));
}
function normalizeRoles(roles) {
    const validRoles = [];
    const ignoredRoles = [];
    for (const role of roles) {
        const parsed = RoleSchema.safeParse(typeof role === 'string' ? role.trim().toLowerCase() : role);
        if (!parsed.success) {
            ignoredRoles.push(String(role));
            continue;
        }
        if (!validRoles.includes(parsed.data)) {
            validRoles.push(parsed.data);
        }
    }
    return { validRoles, ignoredRoles };
}
function sortByFixedRoleOrder(entries) {
    return [...entries].sort((left, right) => FIXED_ROLES.indexOf(left.role) - FIXED_ROLES.indexOf(right.role));
}
function buildRoleAccessCacheKey(role, version) {
    return `${ROLE_ACCESS_CACHE_PREFIX}${role}:${version}`;
}
function buildPermissionSnapshotCacheKey(userId, sessionVersion) {
    return `${PERMISSION_SNAPSHOT_PREFIX}${userId}:${sessionVersion}`;
}
function mapRoleVersions(entries) {
    return Object.fromEntries(entries.map((entry) => [entry.role, entry.version]));
}
function sameRoleVersions(currentRoles, currentVersions, cachedVersions) {
    if (currentRoles.length !== Object.keys(cachedVersions).length) {
        return false;
    }
    return currentRoles.every((role) => cachedVersions[role] === currentVersions[role]);
}
function createDeniedSnapshot(input) {
    return {
        userId: input.userId,
        roles: [],
        permissions: [],
        screens: [],
        routes: [],
        microfrontends: [],
        generatedAt: new Date().toISOString(),
        version: 1
    };
}
function createSnapshot(userId, roles, configs) {
    const permissions = collectUnique(configs.flatMap((entry) => entry.permissions));
    const screens = collectUnique(configs.flatMap((entry) => entry.screens));
    const routes = collectUnique(configs.flatMap((entry) => entry.routes));
    const authorizedMicrofrontendIds = new Set(configs.flatMap((entry) => entry.microfrontends));
    const microfrontends = MICROFRONTEND_CATALOG_SEED.filter((item) => authorizedMicrofrontendIds.has(item.id) && item.requiredPermissions.every((permission) => permissions.includes(permission)));
    return {
        userId,
        roles: [...roles],
        permissions,
        screens,
        routes,
        microfrontends,
        generatedAt: new Date().toISOString(),
        version: Math.max(1, ...configs.map((entry) => entry.version))
    };
}
export class RoleAccessPermissionService {
    repository;
    redis;
    config;
    logger;
    constructor(repository, redis, config, logger) {
        this.repository = repository;
        this.redis = redis;
        this.config = config;
        this.logger = logger;
    }
    async getEffectivePermissions(input) {
        const { validRoles, ignoredRoles } = normalizeRoles(input.roles);
        if (ignoredRoles.length > 0) {
            this.logger?.warn?.({
                userId: input.userId,
                ignoredRoles
            }, 'Ignoring unknown roles during permission resolution');
        }
        if (validRoles.length === 0) {
            const denied = createDeniedSnapshot(input);
            await this.writePermissionSnapshotCache(buildPermissionSnapshotCacheKey(input.userId, input.sessionVersion), {
                snapshot: denied,
                roleVersions: {}
            });
            return denied;
        }
        const versions = await this.repository.listVersions(validRoles);
        const currentRoleVersions = mapRoleVersions(versions);
        const snapshotCacheKey = buildPermissionSnapshotCacheKey(input.userId, input.sessionVersion);
        const cached = await this.readPermissionSnapshotCache(snapshotCacheKey);
        if (cached && sameRoleVersions(validRoles, currentRoleVersions, cached.roleVersions)) {
            return cached.snapshot;
        }
        const configs = await this.loadRoleAccessConfigs(validRoles, versions);
        const snapshot = createSnapshot(input.userId, validRoles, configs);
        await this.writePermissionSnapshotCache(snapshotCacheKey, {
            snapshot,
            roleVersions: mapRoleVersions(configs)
        });
        return snapshot;
    }
    async listRoleAccess() {
        const versions = await this.repository.listVersions(FIXED_ROLES);
        const configs = await this.loadRoleAccessConfigs(FIXED_ROLES, versions);
        return sortByFixedRoleOrder(configs);
    }
    async updateRoleAccess(role, command) {
        const nextCommand = this.validateUpdateCommand(command);
        const updated = await this.repository.update(role, nextCommand);
        await this.writeRoleAccessCache(updated);
        return updated;
    }
    async loadRoleAccessConfigs(roles, versions) {
        if (roles.length === 0) {
            return [];
        }
        const cacheKeys = versions.map((entry) => buildRoleAccessCacheKey(entry.role, entry.version));
        const cachedValues = cacheKeys.length > 0 ? await this.safeMultiGet(cacheKeys) : [];
        const cachedByRole = new Map();
        const missingRoles = new Set();
        versions.forEach((entry, index) => {
            const cachedValue = cachedValues[index];
            if (!cachedValue) {
                missingRoles.add(entry.role);
                return;
            }
            const parsed = RoleAccessConfigSchema.safeParse(JSON.parse(cachedValue));
            if (!parsed.success) {
                missingRoles.add(entry.role);
                return;
            }
            cachedByRole.set(entry.role, parsed.data);
        });
        if (missingRoles.size > 0) {
            const fetched = await this.repository.getByRoles([...missingRoles]);
            await Promise.all(fetched.map((entry) => this.writeRoleAccessCache(entry)));
            fetched.forEach((entry) => {
                cachedByRole.set(entry.role, entry);
            });
        }
        return roles
            .map((role) => cachedByRole.get(role))
            .filter((entry) => Boolean(entry));
    }
    validateUpdateCommand(command) {
        const permissions = collectUnique(command.permissions);
        const screens = collectUnique(command.screens);
        const routes = collectUnique(command.routes);
        const microfrontends = collectUnique(command.microfrontends);
        this.assertAllowedValues('permissions', permissions, ALLOWED_PERMISSIONS);
        this.assertAllowedValues('screens', screens, ALLOWED_SCREENS);
        this.assertAllowedValues('routes', routes, ALLOWED_ROUTES);
        this.assertAllowedValues('microfrontends', microfrontends, ALLOWED_MICROFRONTENDS);
        const missingRequiredPermissions = MICROFRONTEND_CATALOG_SEED.filter((item) => microfrontends.includes(item.id)).flatMap((item) => item.requiredPermissions.filter((permission) => !permissions.includes(permission)));
        if (missingRequiredPermissions.length > 0) {
            throw new BffAppError('INVALID_REQUEST', 400, 'Role access payload is missing required permissions for selected microfrontends', {
                missingRequiredPermissions: collectUnique(missingRequiredPermissions)
            });
        }
        return {
            ...command,
            permissions,
            screens,
            routes,
            microfrontends
        };
    }
    assertAllowedValues(field, values, allowList) {
        const unknownValues = values.filter((value) => !allowList.has(value));
        if (unknownValues.length === 0) {
            return;
        }
        throw new BffAppError('INVALID_REQUEST', 400, 'Role access payload contains values outside the allow-list', {
            field,
            unknownValues
        });
    }
    async safeMultiGet(keys) {
        try {
            return await this.redis.mGet([...keys]);
        }
        catch {
            return keys.map(() => null);
        }
    }
    async readPermissionSnapshotCache(key) {
        try {
            const raw = await this.redis.get(key);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (typeof parsed.snapshot !== 'string' || typeof parsed.roleVersions !== 'object' || parsed.roleVersions === null) {
                return null;
            }
            return {
                snapshot: parsePermissionSnapshot(parsed.snapshot),
                roleVersions: parsed.roleVersions
            };
        }
        catch {
            return null;
        }
    }
    async writePermissionSnapshotCache(key, value) {
        try {
            await this.redis.set(key, JSON.stringify({
                snapshot: serializePermissionSnapshot(value.snapshot),
                roleVersions: value.roleVersions
            }), {
                EX: this.config.permissionSnapshotCacheTtlSeconds
            });
        }
        catch {
            return;
        }
    }
    async writeRoleAccessCache(entry) {
        try {
            await this.redis.set(buildRoleAccessCacheKey(entry.role, entry.version), JSON.stringify(entry), {
                EX: this.config.roleAccessCacheTtlSeconds
            });
        }
        catch {
            return;
        }
    }
}
