import { type PermissionSnapshot } from '@zcorp/shared-contracts';
import type { PermissionLookupInput, PermissionReader } from '../types.js';
export declare class SeedPermissionReader implements PermissionReader {
    getEffectivePermissions(input: PermissionLookupInput): Promise<PermissionSnapshot>;
}
