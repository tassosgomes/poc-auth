using ReportsService.Api.Domain.Reports;

namespace ReportsService.Api.Contracts;

public sealed record ReportResponse(
    string Id,
    string Title,
    string Owner,
    string Summary,
    DateTimeOffset GeneratedAt)
{
    public static ReportResponse From(ReportRecord report)
    {
        ArgumentNullException.ThrowIfNull(report);
        return new ReportResponse(report.Id, report.Title, report.Owner, report.Summary, report.GeneratedAt);
    }
}