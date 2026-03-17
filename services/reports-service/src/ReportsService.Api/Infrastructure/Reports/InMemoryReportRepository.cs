using ReportsService.Api.Domain.Reports;

namespace ReportsService.Api.Infrastructure.Reports;

public sealed class InMemoryReportRepository : IReportRepository
{
    private static readonly IReadOnlyCollection<ReportRecord> Reports =
    [
        new ReportRecord(
            "RP-1001",
            "Monthly Access Summary",
            "IAM Operations",
            "Summarizes access grants, revocations and anomalies for the current month.",
            new DateTimeOffset(2026, 03, 17, 9, 0, 0, TimeSpan.Zero)),
        new ReportRecord(
            "RP-1002",
            "Role Drift Review",
            "Governance Team",
            "Highlights users whose effective access drifted from the baseline matrix.",
            new DateTimeOffset(2026, 03, 16, 14, 30, 0, TimeSpan.Zero))
    ];

    public Task<ReportRecord?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var report = Reports.FirstOrDefault(item => string.Equals(item.Id, id, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(report);
    }

    public Task<IReadOnlyCollection<ReportRecord>> ListAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(Reports);
    }
}