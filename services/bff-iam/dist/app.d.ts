import { type FastifyInstance } from 'fastify';
import type { BffConfig } from './config.js';
import type { OidcClient, OidcTransactionStore, PermissionService, SessionStore } from './types.js';
type FetchLike = typeof fetch;
export interface BuildAppOptions {
    config: BffConfig;
    sessionStore: SessionStore;
    oidcTransactionStore: OidcTransactionStore;
    permissionService: PermissionService;
    oidcClient?: OidcClient;
    fetchImpl?: FetchLike;
    clock?: () => number;
    logger?: boolean;
}
export declare function buildApp(options: BuildAppOptions): Promise<FastifyInstance>;
export {};
