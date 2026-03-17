namespace ReportsService.Api.Domain.Reports;

public interface IReportRepository
{
    Task<IReadOnlyCollection<ReportRecord>> ListAsync(CancellationToken cancellationToken);

    Task<ReportRecord?> GetByIdAsync(string id, CancellationToken cancellationToken);
}