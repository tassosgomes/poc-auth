using ReportsService.Api.Security;

namespace ReportsService.Api.UnitTests.Security;

public sealed class RedisPermissionResolverTests
{
    [Fact]
    public async Task ResolveAsync_WhenPermissionExists_ShouldAllowAccess()
    {
        var gateway = new FakeRoleAccessGateway(new Dictionary<string, RoleAccessRecord>
        {
            ["coordenador"] = new("coordenador", ["relatorios:view"], 1),
            ["tecnico"] = new("tecnico", ["dashboard:view"], 1)
        });
        var sut = new RedisPermissionResolver(gateway);

        var decision = await sut.ResolveAsync(["coordenador", "tecnico"], "relatorios:view", "reports", CancellationToken.None);

        Assert.True(decision.Allowed);
        Assert.Equal(["coordenador"], decision.MatchedRoles);
        Assert.Equal(["relatorios:view"], decision.MatchedPermissions);
    }

    [Fact]
    public async Task ResolveAsync_WhenRolesAreMissing_ShouldDenyAccess()
    {
        var sut = new RedisPermissionResolver(new FakeRoleAccessGateway(new Dictionary<string, RoleAccessRecord>()));

        var decision = await sut.ResolveAsync(Array.Empty<string>(), "relatorios:view", "reports", CancellationToken.None);

        Assert.False(decision.Allowed);
        Assert.Empty(decision.MatchedRoles);
        Assert.Equal("Authenticated token does not contain a valid role", decision.Reason);
    }

    [Fact]
    public async Task ResolveAsync_WhenPermissionIsMissing_ShouldReturnForbiddenDecision()
    {
        var gateway = new FakeRoleAccessGateway(new Dictionary<string, RoleAccessRecord>
        {
            ["tecnico"] = new("tecnico", ["dashboard:view"], 1)
        });
        var sut = new RedisPermissionResolver(gateway);

        var decision = await sut.ResolveAsync(["tecnico"], "relatorios:view", "reports", CancellationToken.None);

        Assert.False(decision.Allowed);
        Assert.Empty(decision.MatchedRoles);
        Assert.Equal("Effective permission not granted for resource reports", decision.Reason);
    }

    private sealed class FakeRoleAccessGateway : IRoleAccessGateway
    {
        private readonly IReadOnlyDictionary<string, RoleAccessRecord> _records;

        public FakeRoleAccessGateway(IReadOnlyDictionary<string, RoleAccessRecord> records)
        {
            _records = records;
        }

        public Task<RoleAccessRecord?> GetRoleAccessAsync(string role, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            _records.TryGetValue(role, out var record);
            return Task.FromResult(record);
        }
    }
}