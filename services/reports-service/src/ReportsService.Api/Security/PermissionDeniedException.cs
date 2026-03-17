namespace ReportsService.Api.Security;

public sealed class PermissionDeniedException : Exception
{
    public PermissionDeniedException(string permission, string resource, PermissionDecision decision)
        : base($"Permission {permission} was denied for resource {resource}")
    {
        Permission = permission;
        Resource = resource;
        Decision = decision;
    }

    public string Permission { get; }

    public string Resource { get; }

    public PermissionDecision Decision { get; }
}