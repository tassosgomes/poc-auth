namespace ReportsService.Api.Security;

public sealed record RoleAccessRecord(string Role, IReadOnlyCollection<string> Permissions, int Version);