namespace ReportsService.Api.Domain.Reports;

public sealed record ReportRecord(
    string Id,
    string Title,
    string Owner,
    string Summary,
    DateTimeOffset GeneratedAt);