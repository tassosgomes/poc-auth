using Microsoft.Extensions.Diagnostics.HealthChecks;

using ReportsService.Api.Infrastructure.Redis;

namespace ReportsService.Api.Health;

public sealed class RedisHealthCheck : IHealthCheck
{
    private readonly IRedisValueReader _redisValueReader;

    public RedisHealthCheck(IRedisValueReader redisValueReader)
    {
        _redisValueReader = redisValueReader;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var isHealthy = await _redisValueReader.PingAsync(cancellationToken);
            return isHealthy ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy("Redis ping failed");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Redis ping failed", exception);
        }
    }
}