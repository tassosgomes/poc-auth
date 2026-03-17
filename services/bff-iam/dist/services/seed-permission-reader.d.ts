import { FIXED_ROLES, type RoleAccessConfig, type PermissionSnapshot } from '@zcorp/shared-contracts';
import type { PermissionLookupInput, PermissionService, RoleAccessUpdateCommand } from '../types.js';
export declare class SeedPermissionReader implements PermissionService {
    getEffectivePermissions(input: PermissionLookupInput): Promise<PermissionSnapshot>;
    listRoleAccess(): Promise<RoleAccessConfig[]>;
    updateRoleAccess(_role: (typeof FIXED_ROLES)[number], _command: RoleAccessUpdateCommand): Promise<RoleAccessConfig>;
}
