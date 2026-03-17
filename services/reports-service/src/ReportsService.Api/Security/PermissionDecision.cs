namespace ReportsService.Api.Security;

public sealed record PermissionDecision(
    bool Allowed,
    IReadOnlyCollection<string> MatchedRoles,
    IReadOnlyCollection<string> MatchedPermissions,
    string Reason);