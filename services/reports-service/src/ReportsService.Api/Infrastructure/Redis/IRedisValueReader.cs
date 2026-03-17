namespace ReportsService.Api.Infrastructure.Redis;

public interface IRedisValueReader
{
    Task<string?> GetStringAsync(string key, CancellationToken cancellationToken);

    Task<bool> PingAsync(CancellationToken cancellationToken);
}