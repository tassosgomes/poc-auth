using System.Security.Claims;

namespace ReportsService.Api.Security;

public sealed class PermissionEnforcementService
{
    private readonly JwtClaimsAdapter _jwtClaimsAdapter;
    private readonly IPermissionResolver _permissionResolver;

    public PermissionEnforcementService(JwtClaimsAdapter jwtClaimsAdapter, IPermissionResolver permissionResolver)
    {
        _jwtClaimsAdapter = jwtClaimsAdapter;
        _permissionResolver = permissionResolver;
    }

    public async Task RequirePermissionAsync(
        ClaimsPrincipal principal,
        string permission,
        string resource,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var roles = _jwtClaimsAdapter.ExtractRoles(principal);
        var decision = await _permissionResolver.ResolveAsync(roles, permission, resource, cancellationToken);
        if (!decision.Allowed)
        {
            throw new PermissionDeniedException(permission, resource, decision);
        }
    }
}