using System.Security.Claims;

using ReportsService.Api.Configuration;
using ReportsService.Api.Security;

namespace ReportsService.Api.UnitTests.Security;

public sealed class JwtClaimsAdapterTests
{
    private readonly JwtClaimsAdapter _sut = new(new ReportsServiceOptions
    {
        Security = new ReportsServiceOptions.SecurityOptions
        {
            RolesClaim = "ROLES"
        }
    });

    [Fact]
    public void ExtractRoles_WithMixedRoleValues_ShouldNormalizeAndFilterUnknownRoles()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("ROLES", "ADMIN"),
            new Claim("ROLES", "coordenador"),
            new Claim("ROLES", "unknown"),
            new Claim("ROLES", " tecnico ")
        ], "Bearer"));

        var roles = _sut.ExtractRoles(principal);

        Assert.Equal(["admin", "coordenador", "tecnico"], roles);
    }

    [Fact]
    public void ExtractRoles_WhenRolesClaimIsMissing_ShouldReturnEmptyCollection()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "user-123")], "Bearer"));

        var roles = _sut.ExtractRoles(principal);

        Assert.Empty(roles);
    }
}