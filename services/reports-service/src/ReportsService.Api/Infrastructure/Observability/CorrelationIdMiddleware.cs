using System.Diagnostics;

namespace ReportsService.Api.Infrastructure.Observability;

public sealed class CorrelationIdMiddleware
{
    public const string HeaderName = "x-correlation-id";
    public const string ItemKey = "correlationId";

    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        var correlationId = ResolveCorrelationId(httpContext);

        httpContext.Items[ItemKey] = correlationId;
        httpContext.Response.Headers[HeaderName] = correlationId;
        Activity.Current?.SetTag(ItemKey, correlationId);

        using var scope = _logger.BeginScope(new Dictionary<string, object?>
        {
            [ItemKey] = correlationId
        });

        await _next(httpContext);
    }

    private static string ResolveCorrelationId(HttpContext httpContext)
    {
        if (httpContext.Request.Headers.TryGetValue(HeaderName, out var values))
        {
            var candidate = values.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return candidate;
            }
        }

        return Guid.NewGuid().ToString("N");
    }
}