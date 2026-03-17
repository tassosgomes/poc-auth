import type { SessionStore } from '../types.js';
type RefreshResult = 'success' | 'failure';
export declare class BffMetrics {
    private readonly tokenRefreshTotals;
    private tokenRefreshConflictsTotal;
    private sessionActiveTotal;
    private permissionResolutionCount;
    private permissionResolutionSum;
    private readonly permissionResolutionBuckets;
    recordTokenRefresh(result: RefreshResult): void;
    recordTokenRefreshConflict(): void;
    recordPermissionResolution(durationMs: number): void;
    syncActiveSessions(sessionStore: Pick<SessionStore, 'countActiveSessions'>): Promise<void>;
    renderPrometheus(): string;
}
export {};
