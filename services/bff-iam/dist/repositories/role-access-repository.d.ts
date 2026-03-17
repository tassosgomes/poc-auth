import type { FixedRole, RoleAccessConfig } from '@zcorp/shared-contracts';
import type { Pool } from 'pg';
import type { RoleAccessUpdateCommand } from '../types.js';
export declare class RoleAccessRepository {
    private readonly pool;
    constructor(pool: Pool);
    listVersions(roles: readonly FixedRole[]): Promise<Array<{
        role: FixedRole;
        version: number;
    }>>;
    getByRoles(roles: readonly FixedRole[]): Promise<RoleAccessConfig[]>;
    listAll(): Promise<RoleAccessConfig[]>;
    update(role: FixedRole, command: RoleAccessUpdateCommand): Promise<RoleAccessConfig>;
    private getByRoleForUpdate;
    private mapRow;
}
