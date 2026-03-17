namespace ReportsService.Api.Security;

public interface IPermissionResolver
{
    Task<PermissionDecision> ResolveAsync(
        IReadOnlyCollection<string> roles,
        string permission,
        string resource,
        CancellationToken cancellationToken);
}