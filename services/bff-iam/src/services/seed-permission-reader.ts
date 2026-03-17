import {
  FIXED_ROLES,
  MICROFRONTEND_CATALOG_SEED,
  ROLE_ACCESS_SEED,
  type RoleAccessConfig,
  type PermissionSnapshot
} from '@zcorp/shared-contracts';

import { BffAppError } from '../errors.js';
import type { PermissionLookupInput, PermissionService, RoleAccessUpdateCommand } from '../types.js';

function collectUnique(values: Iterable<string>): string[] {
  return Array.from(new Set(values));
}

export class SeedPermissionReader implements PermissionService {
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
      roles: roleAccess.map((entry) => entry.role),
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

  async listRoleAccess(): Promise<RoleAccessConfig[]> {
    return FIXED_ROLES.map((role) => ROLE_ACCESS_SEED.find((entry) => entry.role === role)).filter(
      (entry): entry is RoleAccessConfig => Boolean(entry)
    );
  }

  async updateRoleAccess(
    _role: (typeof FIXED_ROLES)[number],
    _command: RoleAccessUpdateCommand
  ): Promise<RoleAccessConfig> {
    throw new BffAppError('UPSTREAM_ERROR', 500, 'SeedPermissionReader is read-only and should not be used for administrative updates');
  }
}