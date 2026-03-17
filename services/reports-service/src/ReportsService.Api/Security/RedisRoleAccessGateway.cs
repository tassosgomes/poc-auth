using System.Text.Json;

using Microsoft.Extensions.Caching.Memory;

using ReportsService.Api.Configuration;
using ReportsService.Api.Infrastructure.Redis;

namespace ReportsService.Api.Security;

public sealed class RedisRoleAccessGateway : IRoleAccessGateway
{
    private readonly IRedisValueReader _redisValueReader;
    private readonly IMemoryCache _memoryCache;
    private readonly ReportsServiceOptions _options;

    public RedisRoleAccessGateway(
        IRedisValueReader redisValueReader,
        IMemoryCache memoryCache,
        ReportsServiceOptions options)
    {
        _redisValueReader = redisValueReader;
        _memoryCache = memoryCache;
        _options = options;
    }

    public async Task<RoleAccessRecord?> GetRoleAccessAsync(string role, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        if (_memoryCache.TryGetValue(GetCacheKey(role), out RoleAccessCacheEntry? cached) && cached is not null)
        {
            return cached.Found ? cached.Record : null;
        }

        try
        {
            var rawValue = await _redisValueReader.GetStringAsync(_options.Authz.RoleAccessKeyPrefix + role, cancellationToken);
            RoleAccessCacheEntry cacheEntry;
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                cacheEntry = new RoleAccessCacheEntry(false, null);
            }
            else
            {
                cacheEntry = new RoleAccessCacheEntry(true, ParseRoleAccess(rawValue));
            }

            _memoryCache.Set(GetCacheKey(role), cacheEntry, _options.Authz.LocalCacheTtl);
            return cacheEntry.Record;
        }
        catch (PermissionStoreUnavailableException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new PermissionStoreUnavailableException("Role access lookup failed", exception);
        }
    }

    private static string GetCacheKey(string role)
    {
        return $"role-access::{role}";
    }

    private static RoleAccessRecord ParseRoleAccess(string rawValue)
    {
        try
        {
            using var document = JsonDocument.Parse(rawValue);
            var root = document.RootElement;
            var role = root.GetProperty("role").GetString();
            var version = root.GetProperty("version").GetInt32();
            var permissionsElement = root.GetProperty("permissions");

            if (string.IsNullOrWhiteSpace(role) || permissionsElement.ValueKind != JsonValueKind.Array)
            {
                throw new PermissionStoreUnavailableException("Role access payload is invalid");
            }

            var permissions = permissionsElement
                .EnumerateArray()
                .Select(element => element.ValueKind == JsonValueKind.String ? element.GetString() : null)
                .ToArray();

            if (permissions.Any(permission => string.IsNullOrWhiteSpace(permission)))
            {
                throw new PermissionStoreUnavailableException("Role access payload is invalid");
            }

            return new RoleAccessRecord(role, permissions!, version);
        }
        catch (PermissionStoreUnavailableException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new PermissionStoreUnavailableException("Role access payload is invalid", exception);
        }
    }

    private sealed record RoleAccessCacheEntry(bool Found, RoleAccessRecord? Record);
}