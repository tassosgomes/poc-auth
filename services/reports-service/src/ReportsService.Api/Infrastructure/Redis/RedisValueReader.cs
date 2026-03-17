using StackExchange.Redis;

namespace ReportsService.Api.Infrastructure.Redis;

public sealed class RedisValueReader : IRedisValueReader
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;

    public RedisValueReader(IConnectionMultiplexer connectionMultiplexer)
    {
        _connectionMultiplexer = connectionMultiplexer;
    }

    public async Task<string?> GetStringAsync(string key, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var database = _connectionMultiplexer.GetDatabase();
        var value = await database.StringGetAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var database = _connectionMultiplexer.GetDatabase();
        var latency = await database.PingAsync();
        return latency >= TimeSpan.Zero;
    }
}