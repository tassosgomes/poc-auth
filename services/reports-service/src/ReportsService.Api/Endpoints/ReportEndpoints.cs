using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

using ReportsService.Api.Contracts;
using ReportsService.Api.Domain.Reports;
using ReportsService.Api.Infrastructure.Http;
using ReportsService.Api.Security;

namespace ReportsService.Api.Endpoints;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/reports/v1/reports")
            .RequireAuthorization();

        group.MapGet(string.Empty, ListReportsAsync)
            .AddEndpointFilter(new PermissionEndpointFilter(ReportPermissions.View, "reports"));

        group.MapGet("/{id}", GetReportByIdAsync)
            .AddEndpointFilter(new PermissionEndpointFilter(ReportPermissions.View, "reports"));

        return app;
    }

    private static async Task<Ok<ReportResponse[]>> ListReportsAsync(
        IReportRepository repository,
        CancellationToken cancellationToken)
    {
        var reports = await repository.ListAsync(cancellationToken);
        return TypedResults.Ok(reports.Select(ReportResponse.From).ToArray());
    }

    private static async Task<Results<Ok<ReportResponse>, NotFound<ProblemDetails>>> GetReportByIdAsync(
        string id,
        IReportRepository repository,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var report = await repository.GetByIdAsync(id, cancellationToken);
        if (report is null)
        {
            var problemDetails = ProblemDetailsWriter.Create(
                httpContext,
                StatusCodes.Status404NotFound,
                "REPORT_NOT_FOUND",
                $"Report {id} was not found",
                "https://errors.zcorp.internal/iam/report-not-found");
            return TypedResults.NotFound(problemDetails);
        }

        return TypedResults.Ok(ReportResponse.From(report));
    }
}