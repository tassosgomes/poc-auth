namespace ReportsService.Api.Security;

public sealed class RedisPermissionResolver : IPermissionResolver
{
    private readonly IRoleAccessGateway _roleAccessGateway;

    public RedisPermissionResolver(IRoleAccessGateway roleAccessGateway)
    {
        _roleAccessGateway = roleAccessGateway;
    }

    public async Task<PermissionDecision> ResolveAsync(
        IReadOnlyCollection<string> roles,
        string permission,
        string resource,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(roles);
        ArgumentException.ThrowIfNullOrWhiteSpace(permission);
        ArgumentException.ThrowIfNullOrWhiteSpace(resource);

        if (roles.Count == 0)
        {
            return new PermissionDecision(false, Array.Empty<string>(), Array.Empty<string>(), "Authenticated token does not contain a valid role");
        }

        var matchedRoles = new List<string>();
        var matchedPermissions = new List<string>();

        foreach (var role in roles)
        {
            var record = await _roleAccessGateway.GetRoleAccessAsync(role, cancellationToken);
            if (record is null)
            {
                continue;
            }

            if (record.Permissions.Contains(permission, StringComparer.Ordinal))
            {
                matchedRoles.Add(record.Role);
                matchedPermissions.Add(permission);
            }
        }

        if (matchedPermissions.Count > 0)
        {
            return new PermissionDecision(true, matchedRoles.Distinct(StringComparer.Ordinal).ToArray(), matchedPermissions.Distinct(StringComparer.Ordinal).ToArray(), "Permission granted by effective role access");
        }

        return new PermissionDecision(false, matchedRoles.Distinct(StringComparer.Ordinal).ToArray(), Array.Empty<string>(), $"Effective permission not granted for resource {resource}");
    }
}