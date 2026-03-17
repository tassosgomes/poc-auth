using System.Text.Json;

using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

using StackExchange.Redis;

namespace ReportsService.Api.IntegrationTests.Support;

public sealed class ReportsServiceApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private IContainer? _redisContainer;
    private IConnectionMultiplexer? _connectionMultiplexer;

    public JwksTokenIssuer TokenIssuer { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("IntegrationTesting");
        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ReportsService:Security:IssuerUri"] = TokenIssuer.IssuerUri,
                ["ReportsService:Security:JwkSetUri"] = TokenIssuer.JwkSetUri,
                ["ReportsService:Security:Audience"] = "reports-service",
                ["ReportsService:Security:RolesClaim"] = "ROLES",
                ["ReportsService:Security:JwksCacheTtl"] = "00:00:30",
                ["ReportsService:Authz:RoleAccessKeyPrefix"] = "role_access:",
                ["ReportsService:Authz:LocalCacheTtl"] = "00:00:00.001",
                ["ReportsService:RedisUrl"] = BuildRedisUri()
            });
        });
    }

    public async Task InitializeAsync()
    {
        _redisContainer = new ContainerBuilder()
            .WithImage("redis:7-alpine")
            .WithPortBinding(6379, true)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(6379))
            .Build();

        await _redisContainer.StartAsync();
        await TokenIssuer.StartAsync();

        _connectionMultiplexer = await ConnectionMultiplexer.ConnectAsync(GetRedisConnectionString());
    }

    public new async Task DisposeAsync()
    {
        if (_connectionMultiplexer is not null)
        {
            await _connectionMultiplexer.CloseAsync();
            await _connectionMultiplexer.DisposeAsync();
        }

        await TokenIssuer.DisposeAsync();

        if (_redisContainer is not null)
        {
            await _redisContainer.DisposeAsync();
        }
    }

    public async Task ResetStateAsync()
    {
        var database = GetDatabase();
        var endpoint = _connectionMultiplexer!.GetEndPoints().Single();
        var server = _connectionMultiplexer.GetServer(endpoint);

        var keys = server.Keys(database.Database, pattern: "role_access:*").ToArray();
        if (keys.Length > 0)
        {
            await database.KeyDeleteAsync(keys);
        }

        await Task.Delay(20);
    }

    public async Task SeedRoleAccessAsync(string role, string[] permissions, int version)
    {
        var payload = JsonSerializer.Serialize(new
        {
            role,
            permissions,
            screens = Array.Empty<string>(),
            routes = Array.Empty<string>(),
            microfrontends = Array.Empty<string>(),
            updatedAt = "2026-03-17T00:00:00.000Z",
            updatedBy = "integration-test",
            version
        });

        await GetDatabase().StringSetAsync($"role_access:{role}", payload);
    }

    private IDatabase GetDatabase()
    {
        return _connectionMultiplexer!.GetDatabase();
    }

    private string BuildRedisUri()
    {
        return $"redis://{GetRedisHost()}:{GetRedisPort()}";
    }

    private string GetRedisConnectionString()
    {
        return $"{GetRedisHost()}:{GetRedisPort()}";
    }

    private string GetRedisHost()
    {
        return _redisContainer!.Hostname;
    }

    private ushort GetRedisPort()
    {
        return _redisContainer!.GetMappedPublicPort(6379);
    }
}