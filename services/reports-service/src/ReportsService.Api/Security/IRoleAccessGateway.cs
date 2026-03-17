namespace ReportsService.Api.Security;

public interface IRoleAccessGateway
{
    Task<RoleAccessRecord?> GetRoleAccessAsync(string role, CancellationToken cancellationToken);
}