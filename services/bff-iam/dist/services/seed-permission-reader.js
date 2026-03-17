import { MICROFRONTEND_CATALOG_SEED, ROLE_ACCESS_SEED } from '@zcorp/shared-contracts';
function collectUnique(values) {
    return Array.from(new Set(values));
}
export class SeedPermissionReader {
    async getEffectivePermissions(input) {
        const roleAccess = input.roles
            .map((role) => ROLE_ACCESS_SEED.find((entry) => entry.role === role))
            .filter((entry) => Boolean(entry));
        const permissions = collectUnique(roleAccess.flatMap((entry) => entry.permissions));
        const screens = collectUnique(roleAccess.flatMap((entry) => entry.screens));
        const routes = collectUnique(roleAccess.flatMap((entry) => entry.routes));
        const microfrontendIds = new Set(roleAccess.flatMap((entry) => entry.microfrontends));
        return {
            userId: input.userId,
            roles: input.roles,
            permissions,
            screens,
            routes,
            microfrontends: MICROFRONTEND_CATALOG_SEED.filter((item) => microfrontendIds.has(item.id) && item.requiredPermissions.every((permission) => permissions.includes(permission))),
            generatedAt: new Date().toISOString(),
            version: input.sessionVersion
        };
    }
}
