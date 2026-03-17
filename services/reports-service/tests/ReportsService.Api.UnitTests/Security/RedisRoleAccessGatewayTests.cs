using Microsoft.Extensions.Caching.Memory;

using ReportsService.Api.Configuration;
using ReportsService.Api.Infrastructure.Redis;
using ReportsService.Api.Security;

namespace ReportsService.Api.UnitTests.Security;

public sealed class RedisRoleAccessGatewayTests
{
    [Fact]
    public async Task GetRoleAccessAsync_WhenPayloadExists_ShouldParseAndCacheValue()
    {
        var redisValueReader = new FakeRedisValueReader(new Dictionary<string, string?>
        {
            ["role_access:tecnico"] = """
            {
              "role": "tecnico",
              "permissions": ["relatorios:view"],
              "version": 1
            }
            """
        });
        var sut = CreateSut(redisValueReader);

        var first = await sut.GetRoleAccessAsync("tecnico", CancellationToken.None);
        var second = await sut.GetRoleAccessAsync("tecnico", CancellationToken.None);

        Assert.NotNull(first);
        Assert.Equal("tecnico", first.Role);
        Assert.Equal(["relatorios:view"], first.Permissions);
        Assert.NotNull(second);
        Assert.Equal(1, redisValueReader.ReadCount);
    }

    [Fact]
    public async Task GetRoleAccessAsync_WhenPayloadIsMissing_ShouldReturnNull()
    {
        var sut = CreateSut(new FakeRedisValueReader(new Dictionary<string, string?>()));

        var record = await sut.GetRoleAccessAsync("admin", CancellationToken.None);

        Assert.Null(record);
    }

    [Fact]
    public async Task GetRoleAccessAsync_WhenPayloadIsInvalid_ShouldThrowPermissionStoreUnavailableException()
    {
        var sut = CreateSut(new FakeRedisValueReader(new Dictionary<string, string?>
        {
            ["role_access:admin"] = "{ \"role\": \"admin\", \"permissions\": \"relatorios:view\", \"version\": 1 }"
        }));

        await Assert.ThrowsAsync<PermissionStoreUnavailableException>(() => sut.GetRoleAccessAsync("admin", CancellationToken.None));
    }

    private static RedisRoleAccessGateway CreateSut(FakeRedisValueReader redisValueReader)
    {
        return new RedisRoleAccessGateway(
            redisValueReader,
            new MemoryCache(new MemoryCacheOptions()),
            new ReportsServiceOptions
            {
                Authz = new ReportsServiceOptions.AuthzOptions
                {
                    RoleAccessKeyPrefix = "role_access:",
                    LocalCacheTtl = TimeSpan.FromMinutes(1)
                }
            });
    }

    private sealed class FakeRedisValueReader : IRedisValueReader
    {
        private readonly IReadOnlyDictionary<string, string?> _values;

        public FakeRedisValueReader(IReadOnlyDictionary<string, string?> values)
        {
            _values = values;
        }

        public int ReadCount { get; private set; }

        public Task<string?> GetStringAsync(string key, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            ReadCount++;
            _values.TryGetValue(key, out var value);
            return Task.FromResult(value);
        }

        public Task<bool> PingAsync(CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult(true);
        }
    }
}