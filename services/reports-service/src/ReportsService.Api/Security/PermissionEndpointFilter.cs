using ReportsService.Api.Infrastructure.Http;

namespace ReportsService.Api.Security;

public sealed class PermissionEndpointFilter : IEndpointFilter
{
    private readonly string _permission;
    private readonly string _resource;

    public PermissionEndpointFilter(string permission, string resource)
    {
        _permission = permission;
        _resource = resource;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var enforcementService = context.HttpContext.RequestServices.GetRequiredService<PermissionEnforcementService>();

        try
        {
            await enforcementService.RequirePermissionAsync(
                context.HttpContext.User,
                _permission,
                _resource,
                context.HttpContext.RequestAborted);
            return await next(context);
        }
        catch (PermissionDeniedException exception)
        {
            var problemDetails = ProblemDetailsWriter.Create(
                context.HttpContext,
                StatusCodes.Status403Forbidden,
                "FORBIDDEN",
                exception.Message,
                "https://errors.zcorp.internal/iam/forbidden",
                details =>
                {
                    details.Extensions["permission"] = exception.Permission;
                    details.Extensions["resource"] = exception.Resource;
                    details.Extensions["matchedRoles"] = exception.Decision.MatchedRoles;
                    details.Extensions["matchedPermissions"] = exception.Decision.MatchedPermissions;
                });
            return TypedResults.Problem(problemDetails);
        }
        catch (PermissionStoreUnavailableException exception)
        {
            var problemDetails = ProblemDetailsWriter.Create(
                context.HttpContext,
                StatusCodes.Status503ServiceUnavailable,
                "PERMISSION_STORE_UNAVAILABLE",
                exception.Message,
                "https://errors.zcorp.internal/iam/permission-store-unavailable");
            return TypedResults.Problem(problemDetails);
        }
    }
}