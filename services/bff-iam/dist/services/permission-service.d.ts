import { type FixedRole, type PermissionSnapshot, type RoleAccessConfig } from '@zcorp/shared-contracts';
import type { RedisClientType } from 'redis';
import type { BffConfig } from '../config.js';
import { RoleAccessRepository } from '../repositories/role-access-repository.js';
import type { PermissionLookupInput, PermissionService, RoleAccessUpdateCommand } from '../types.js';
type AnyRedisClient = RedisClientType<any, any, any>;
interface LoggerLike {
    warn?: (details: Record<string, unknown>, message?: string) => void;
}
export declare class RoleAccessPermissionService implements PermissionService {
    private readonly repository;
    private readonly redis;
    private readonly config;
    private readonly logger?;
    constructor(repository: RoleAccessRepository, redis: AnyRedisClient, config: Pick<BffConfig, 'permissionSnapshotCacheTtlSeconds' | 'roleAccessCacheTtlSeconds'>, logger?: LoggerLike | undefined);
    getEffectivePermissions(input: PermissionLookupInput): Promise<PermissionSnapshot>;
    listRoleAccess(): Promise<RoleAccessConfig[]>;
    warmRoleAccessCache(): Promise<void>;
    updateRoleAccess(role: FixedRole, command: RoleAccessUpdateCommand): Promise<RoleAccessConfig>;
    private loadRoleAccessConfigs;
    private validateUpdateCommand;
    private assertAllowedValues;
    private safeMultiGet;
    private readPermissionSnapshotCache;
    private writePermissionSnapshotCache;
    private writeRoleAccessCache;
}
export {};
