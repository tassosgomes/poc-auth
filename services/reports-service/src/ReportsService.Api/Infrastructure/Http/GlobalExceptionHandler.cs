using Microsoft.AspNetCore.Diagnostics;

using ReportsService.Api.Security;

namespace ReportsService.Api.Infrastructure.Http;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        switch (exception)
        {
            case PermissionDeniedException permissionDeniedException:
                await ProblemDetailsWriter.WriteAsync(
                    httpContext,
                    StatusCodes.Status403Forbidden,
                    "FORBIDDEN",
                    permissionDeniedException.Message,
                    "https://errors.zcorp.internal/iam/forbidden",
                    problemDetails =>
                    {
                        problemDetails.Extensions["permission"] = permissionDeniedException.Permission;
                        problemDetails.Extensions["resource"] = permissionDeniedException.Resource;
                        problemDetails.Extensions["matchedRoles"] = permissionDeniedException.Decision.MatchedRoles;
                        problemDetails.Extensions["matchedPermissions"] = permissionDeniedException.Decision.MatchedPermissions;
                    },
                    cancellationToken);
                return true;

            case PermissionStoreUnavailableException:
                await ProblemDetailsWriter.WriteAsync(
                    httpContext,
                    StatusCodes.Status503ServiceUnavailable,
                    "PERMISSION_STORE_UNAVAILABLE",
                    exception.Message,
                    "https://errors.zcorp.internal/iam/permission-store-unavailable",
                    cancellationToken: cancellationToken);
                return true;

            case BadHttpRequestException:
                await ProblemDetailsWriter.WriteAsync(
                    httpContext,
                    StatusCodes.Status400BadRequest,
                    "INVALID_REQUEST",
                    "Request payload is invalid",
                    "https://errors.zcorp.internal/iam/invalid-request",
                    cancellationToken: cancellationToken);
                return true;

            default:
                await ProblemDetailsWriter.WriteAsync(
                    httpContext,
                    StatusCodes.Status500InternalServerError,
                    "INTERNAL_ERROR",
                    "Unexpected reports-service failure",
                    "https://errors.zcorp.internal/iam/internal-error",
                    cancellationToken: cancellationToken);
                return true;
        }
    }
}