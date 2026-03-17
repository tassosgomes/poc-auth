import {
  MICROFRONTEND_CATALOG_SEED,
  ROLE_ACCESS_SEED,
  type FixedRole,
  type PermissionSnapshot
} from '@zcorp/shared-contracts';

import type { PermissionLookupInput, PermissionReader } from '../types.js';

function collectUnique(values: Iterable<string>): string[] {
  return Array.from(new Set(values));
}

export class SeedPermissionReader implements PermissionReader {
  async getEffectivePermissions(input: PermissionLookupInput): Promise<PermissionSnapshot> {
    const roleAccess = input.roles
      .map((role) => ROLE_ACCESS_SEED.find((entry) => entry.role === role))
      .filter((entry): entry is (typeof ROLE_ACCESS_SEED)[number] => Boolean(entry));

    const permissions = collectUnique(roleAccess.flatMap((entry) => entry.permissions));
    const screens = collectUnique(roleAccess.flatMap((entry) => entry.screens));
    const routes = collectUnique(roleAccess.flatMap((entry) => entry.routes));
    const microfrontendIds = new Set(roleAccess.flatMap((entry) => entry.microfrontends));

    return {
      userId: input.userId,
      roles: input.roles as FixedRole[],
      permissions,
      screens,
      routes,
      microfrontends: MICROFRONTEND_CATALOG_SEED.filter(
        (item) => microfrontendIds.has(item.id) && item.requiredPermissions.every((permission) => permissions.includes(permission))
      ),
      generatedAt: new Date().toISOString(),
      version: input.sessionVersion
    };
  }
}