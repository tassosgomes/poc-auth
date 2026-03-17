const PERMISSION_DURATION_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
function formatMetricLine(name, value, labels) {
    if (!labels || Object.keys(labels).length === 0) {
        return `${name} ${value}`;
    }
    const renderedLabels = Object.entries(labels)
        .map(([key, labelValue]) => `${key}="${labelValue.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`)
        .join(',');
    return `${name}{${renderedLabels}} ${value}`;
}
export class BffMetrics {
    tokenRefreshTotals = {
        success: 0,
        failure: 0
    };
    tokenRefreshConflictsTotal = 0;
    sessionActiveTotal = 0;
    permissionResolutionCount = 0;
    permissionResolutionSum = 0;
    permissionResolutionBuckets = new Map(PERMISSION_DURATION_BUCKETS_MS.map((bucket) => [bucket, 0]));
    recordTokenRefresh(result) {
        this.tokenRefreshTotals[result] += 1;
    }
    recordTokenRefreshConflict() {
        this.tokenRefreshConflictsTotal += 1;
    }
    recordPermissionResolution(durationMs) {
        this.permissionResolutionCount += 1;
        this.permissionResolutionSum += durationMs;
        for (const bucket of PERMISSION_DURATION_BUCKETS_MS) {
            if (durationMs <= bucket) {
                this.permissionResolutionBuckets.set(bucket, (this.permissionResolutionBuckets.get(bucket) ?? 0) + 1);
            }
        }
    }
    async syncActiveSessions(sessionStore) {
        this.sessionActiveTotal = await sessionStore.countActiveSessions();
    }
    renderPrometheus() {
        const lines = [
            '# HELP iam_token_refresh_total Total de refresh de token executados pelo BFF.',
            '# TYPE iam_token_refresh_total counter',
            formatMetricLine('iam_token_refresh_total', this.tokenRefreshTotals.success, { result: 'success' }),
            formatMetricLine('iam_token_refresh_total', this.tokenRefreshTotals.failure, { result: 'failure' }),
            '# HELP iam_token_refresh_conflicts_total Total de conflitos de lock observados durante refresh.',
            '# TYPE iam_token_refresh_conflicts_total counter',
            formatMetricLine('iam_token_refresh_conflicts_total', this.tokenRefreshConflictsTotal),
            '# HELP iam_session_active_total Total de sessoes ativas observadas no session store.',
            '# TYPE iam_session_active_total gauge',
            formatMetricLine('iam_session_active_total', this.sessionActiveTotal),
            '# HELP iam_permission_resolution_duration_ms Duracao da resolucao de permissoes em milissegundos.',
            '# TYPE iam_permission_resolution_duration_ms histogram'
        ];
        for (const bucket of PERMISSION_DURATION_BUCKETS_MS) {
            lines.push(formatMetricLine('iam_permission_resolution_duration_ms_bucket', this.permissionResolutionBuckets.get(bucket) ?? 0, {
                le: String(bucket)
            }));
        }
        lines.push(formatMetricLine('iam_permission_resolution_duration_ms_bucket', this.permissionResolutionCount, { le: '+Inf' }));
        lines.push(formatMetricLine('iam_permission_resolution_duration_ms_sum', this.permissionResolutionSum));
        lines.push(formatMetricLine('iam_permission_resolution_duration_ms_count', this.permissionResolutionCount));
        return `${lines.join('\n')}\n`;
    }
}
